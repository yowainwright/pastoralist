import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import typescript from "typescript5";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const OUTPUT = resolve(ROOT, ".node20-test");
const SOURCE_ROOTS = ["src", "scripts", "tests/unit"];
const STATIC_PATHS = [
  "package.json",
  "pnpm-lock.yaml",
  "socket.yml",
  "action.yml",
  "codecov.yml",
  "app/package.json",
  "app/pnpm-lock.yaml",
  "tests/coverage/c8.json",
  ".github/workflows",
];

const isTypeScript = (path) => [".ts", ".tsx"].includes(extname(path));
const NON_MODULE_EXTENSIONS = [".cjs", ".json", ".js", ".mjs"];
const LOCAL_IMPORT_PATTERN =
  /(\bfrom\s+|\bimport\s*(?:\(\s*|\s+)|\bimport\.meta\.resolve\(\s*|\bnew\s+URL\(\s*)(["'])(\.{1,2}\/[^"']+)\2/g;

const outputPath = (sourcePath) => {
  const relativePath = relative(ROOT, sourcePath);
  const extension = extname(relativePath);
  const outputExtension = isTypeScript(relativePath) ? ".js" : extension;
  const basePath = extension ? relativePath.slice(0, -extension.length) : relativePath;
  return resolve(OUTPUT, basePath + outputExtension);
};

const splitSpecifier = (specifier) => {
  const suffixIndex = specifier.search(/[?#]/);
  if (suffixIndex === -1) return { path: specifier, suffix: "" };
  return { path: specifier.slice(0, suffixIndex), suffix: specifier.slice(suffixIndex) };
};

const sourceCandidates = (sourcePath) => {
  if (isTypeScript(sourcePath)) return [sourcePath];
  if (NON_MODULE_EXTENSIONS.includes(extname(sourcePath))) return [];
  return [
    `${sourcePath}.ts`,
    `${sourcePath}.tsx`,
    join(sourcePath, "index.ts"),
    join(sourcePath, "index.tsx"),
  ];
};

const findSource = async (sourcePath) => {
  for (const candidate of sourceCandidates(sourcePath)) {
    try {
      await stat(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return undefined;
};

const compiledSpecifier = (specifier, targetPath) => {
  const { path: pathPart, suffix } = splitSpecifier(specifier);
  const extension = extname(targetPath);
  const sourceExtension = isTypeScript(pathPart) ? extname(pathPart) : "";
  const sourceName = basename(pathPart, sourceExtension);
  const isDirectoryEntry = sourceName !== "index" && basename(targetPath, extension) === "index";
  const compiledPath = isDirectoryEntry
    ? `${pathPart}/index.js`
    : `${sourceExtension ? pathPart.slice(0, -sourceExtension.length) : pathPart}.js`;
  return `${compiledPath}${suffix}`;
};

const rewriteSpecifier = async (specifier, sourcePath) => {
  const { path: pathPart } = splitSpecifier(specifier);
  const targetPath = await findSource(resolve(dirname(sourcePath), pathPart));
  if (!targetPath) return specifier;
  return compiledSpecifier(specifier, targetPath);
};

const rewriteLocalSpecifiers = async (source, sourcePath) => {
  const chunks = [];
  let lastIndex = 0;
  for (const match of source.matchAll(LOCAL_IMPORT_PATTERN)) {
    const matchIndex = match.index ?? 0;
    chunks.push(source.slice(lastIndex, matchIndex), match[1], match[2]);
    chunks.push(await rewriteSpecifier(match[3], sourcePath), match[2]);
    lastIndex = matchIndex + match[0].length;
  }
  chunks.push(source.slice(lastIndex));
  return chunks.join("");
};

const compileTypeScript = async (sourcePath) => {
  const source = await readFile(sourcePath, "utf8");
  const rewrittenSource = await rewriteLocalSpecifiers(source, sourcePath);
  const result = typescript.transpileModule(rewrittenSource, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  });
  const destination = outputPath(sourcePath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, result.outputText);
};

const copyFile = async (sourcePath) => {
  const destination = outputPath(sourcePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(sourcePath, destination);
};

const copyOriginalSource = async (sourcePath) => {
  const destination = resolve(OUTPUT, relative(ROOT, sourcePath));
  await mkdir(dirname(destination), { recursive: true });
  await cp(sourcePath, destination);
};

const copyTree = async (sourcePath) => {
  const entries = await readdir(sourcePath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const entryPath = join(sourcePath, entry.name);
    if (entry.isDirectory()) {
      await copyTree(entryPath);
      continue;
    }
    if (isTypeScript(entryPath)) {
      await compileTypeScript(entryPath);
      await copyOriginalSource(entryPath);
      continue;
    }
    await copyFile(entryPath);
  }
};

const copyStaticPath = async (path) => {
  const sourcePath = resolve(ROOT, path);
  const sourceStats = await stat(sourcePath);
  if (sourceStats.isDirectory()) {
    await copyTree(sourcePath);
    return;
  }
  await copyFile(sourcePath);
};

const collectTests = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const tests = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      tests.push(...(await collectTests(entryPath)));
      continue;
    }
    if (entry.name.endsWith(".test.ts")) tests.push(outputPath(entryPath));
  }
  return tests;
};

const buildTestTree = async () => {
  await rm(OUTPUT, { recursive: true, force: true });
  await mkdir(OUTPUT, { recursive: true });
  for (const sourceRoot of SOURCE_ROOTS) await copyTree(resolve(ROOT, sourceRoot));
  for (const staticPath of STATIC_PATHS) await copyStaticPath(staticPath);
};

const resolveExitCode = (code, signal) => {
  if (code !== null) return code;
  return signal ? 1 : 0;
};

const runTests = async (testFiles) => {
  const setupPath = pathToFileURL(resolve(OUTPUT, "tests/unit/setup.js")).href;
  const args = [
    "--experimental-test-module-mocks",
    `--import=${setupPath}`,
    "--test",
    ...testFiles,
  ];
  const environment = { ...process.env, FORCE_COLOR: "1" };
  delete environment.NO_COLOR;
  const child = spawn(process.execPath, args, { cwd: ROOT, env: environment, stdio: "inherit" });
  return new Promise((resolveProcess) => {
    child.once("close", (code, signal) => resolveProcess(resolveExitCode(code, signal)));
  });
};

try {
  await buildTestTree();
  const selectedTest = process.env.NODE20_TEST_FILE;
  const testFiles = selectedTest
    ? [outputPath(resolve(ROOT, selectedTest))]
    : await collectTests(resolve(ROOT, "tests/unit"));
  process.exitCode = await runTests(testFiles);
} finally {
  await rm(OUTPUT, { recursive: true, force: true });
}
