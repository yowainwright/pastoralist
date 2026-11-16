import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import typescript from "typescript5";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

const OUTPUT = resolve(ROOT, ".node20-test");

const TEST_ROOTS = ["tests/unit", "tests/integration/repository", "tests/integration/core"];

const SOURCE_ROOTS = ["src", "scripts", "tests/unit", "tests/integration"];

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

const NON_MODULE_EXTENSIONS = new Set([".cjs", ".json", ".js", ".mjs"]);

const LOCAL_IMPORT_PATTERN =
  /(\bfrom\s+|\bimport\s*(?:\(\s*|\s+)|\bimport\.meta\.resolve\(\s*|\bnew\s+URL\(\s*)(["'])(\.{1,2}\/[^"']+)\2/g;

const outputPath = (sourcePath) => {
  const relativePath = relative(ROOT, sourcePath);
  const extension = extname(relativePath);
  const outputExtension = isTypeScript(relativePath) ? ".js" : extension;
  const basePath = extension ? relativePath.slice(0, -extension.length) : relativePath;
  const destination = resolve(OUTPUT, basePath + outputExtension);
  return destination;
};

const splitSpecifier = (specifier) => {
  const suffixIndex = specifier.search(/[?#]/);
  if (suffixIndex === -1) {
    const parts = { path: specifier, suffix: "" };
    return parts;
  }
  const path = specifier.slice(0, suffixIndex);
  const suffix = specifier.slice(suffixIndex);
  const parts = { path: path, suffix: suffix };
  return parts;
};

const sourceCandidates = (sourcePath) => {
  if (isTypeScript(sourcePath)) {
    const candidates = [sourcePath];
    return candidates;
  }
  if (NON_MODULE_EXTENSIONS.has(extname(sourcePath))) {
    const candidates = [];
    return candidates;
  }
  const candidates = [
    `${sourcePath}.ts`,
    `${sourcePath}.tsx`,
    join(sourcePath, "index.ts"),
    join(sourcePath, "index.tsx"),
  ];
  return candidates;
};

const sourceExists = (path) => {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
};

const findSource = (sourcePath) => {
  const candidates = sourceCandidates(sourcePath);
  const source = candidates.find(sourceExists);
  return source;
};

const compiledSpecifier = (specifier, targetPath) => {
  const { path: pathPart, suffix } = splitSpecifier(specifier);
  const extension = extname(targetPath);
  const sourceExtension = isTypeScript(pathPart) ? extname(pathPart) : "";
  const sourceName = basename(pathPart, sourceExtension);
  const isDirectoryEntry = sourceName !== "index" && basename(targetPath, extension) === "index";
  const sourceBase = sourceExtension ? pathPart.slice(0, -sourceExtension.length) : pathPart;
  const compiledPath = isDirectoryEntry ? `${pathPart}/index.js` : `${sourceBase}.js`;
  const compiled = `${compiledPath}${suffix}`;
  return compiled;
};

const rewriteSpecifier = (specifier, sourcePath) => {
  const { path: pathPart } = splitSpecifier(specifier);
  const targetPath = findSource(resolve(dirname(sourcePath), pathPart));
  if (!targetPath) return specifier;
  const compiled = compiledSpecifier(specifier, targetPath);
  return compiled;
};

const rewriteLocalSpecifiers = (source, sourcePath) => {
  const rewritten = source.replace(LOCAL_IMPORT_PATTERN, (_match, prefix, quote, specifier) => {
    const compiled = rewriteSpecifier(specifier, sourcePath);
    const replacement = `${prefix}${quote}${compiled}${quote}`;
    return replacement;
  });
  return rewritten;
};

const compileTypeScript = (sourcePath) => {
  const source = readFileSync(sourcePath, "utf8");
  const rewrittenSource = rewriteLocalSpecifiers(source, sourcePath);
  const { ESNext: module } = typescript.ModuleKind;
  const { ES2022: target } = typescript.ScriptTarget;
  const compilerOptions = {
    module,
    target,
  };
  const result = typescript.transpileModule(rewrittenSource, {
    compilerOptions,
    fileName: sourcePath,
  });
  const destination = outputPath(sourcePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, result.outputText);
};

const copyFile = (sourcePath) => {
  const destination = outputPath(sourcePath);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(sourcePath, destination);
};

const copyOriginalSource = (sourcePath) => {
  const destination = resolve(OUTPUT, relative(ROOT, sourcePath));
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(sourcePath, destination);
};

const readVisibleEntries = (directory) => {
  const entries = readdirSync(directory, { withFileTypes: true });
  const visible = entries.filter((entry) => !entry.name.startsWith("."));
  return visible;
};

const copyEntry = (sourcePath, entry) => {
  const entryPath = join(sourcePath, entry.name);
  if (entry.isDirectory()) {
    copyTree(entryPath);
    return;
  }
  if (isTypeScript(entryPath)) {
    compileTypeScript(entryPath);
    copyOriginalSource(entryPath);
    return;
  }
  copyFile(entryPath);
};

const copyTree = (sourcePath) => {
  const entries = readVisibleEntries(sourcePath);
  entries.forEach((entry) => copyEntry(sourcePath, entry));
};

const copyStaticPath = (path) => {
  const sourcePath = resolve(ROOT, path);
  const sourceStats = statSync(sourcePath);
  if (sourceStats.isDirectory()) {
    copyTree(sourcePath);
    return;
  }
  copyFile(sourcePath);
};

const collectEntryTests = (directory, entry) => {
  const entryPath = join(directory, entry.name);
  if (entry.isDirectory()) {
    const nested = collectTests(entryPath);
    return nested;
  }
  const tests = entry.name.endsWith(".test.ts") ? [outputPath(entryPath)] : [];
  return tests;
};

const collectTests = (directory) => {
  const entries = readVisibleEntries(directory);
  const tests = entries.flatMap((entry) => collectEntryTests(directory, entry));
  return tests;
};

const buildTestTree = () => {
  rmSync(OUTPUT, { recursive: true, force: true });
  mkdirSync(OUTPUT, { recursive: true });
  SOURCE_ROOTS.forEach((sourceRoot) => copyTree(resolve(ROOT, sourceRoot)));
  STATIC_PATHS.forEach(copyStaticPath);
};

const resolveExitCode = (code, signal) => {
  if (code !== null) return code;
  const exitCode = signal ? 1 : 0;
  return exitCode;
};

const runTests = async (testFiles) => {
  const setupPath = pathToFileURL(resolve(OUTPUT, "tests/unit/setup.js")).href;
  const baseArgs = ["--experimental-test-module-mocks", `--import=${setupPath}`, "--test"];
  const args = baseArgs.concat(testFiles);
  const environment = Object.assign({}, process.env, { FORCE_COLOR: "1" });
  delete environment.NO_COLOR;
  const child = spawn(process.execPath, args, { cwd: ROOT, env: environment, stdio: "inherit" });
  const completion = new Promise((resolveProcess) => {
    child.once("close", (code, signal) => resolveProcess(resolveExitCode(code, signal)));
  });
  return completion;
};

const collectCompatibilityTests = () => {
  const extraPaths = [
    "tests/integration/cli/reporting.test.ts",
    "tests/integration/dependency-tracking.test.ts",
  ];
  const extraTests = extraPaths.map((path) => outputPath(resolve(ROOT, path)));
  const groups = TEST_ROOTS.flatMap((root) => collectTests(resolve(ROOT, root)));
  const tests = extraTests.concat(groups);
  return tests;
};

try {
  buildTestTree();
  const selectedTest = process.env.NODE20_TEST_FILE;
  const testFiles = selectedTest
    ? [outputPath(resolve(ROOT, selectedTest))]
    : collectCompatibilityTests();
  process.exitCode = await runTests(testFiles);
} finally {
  rmSync(OUTPUT, { recursive: true, force: true });
}
