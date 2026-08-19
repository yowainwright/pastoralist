import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import packageJson from "../package.json" with { type: "json" };
import { logger as createLogger } from "../src/observability";

const BIN_OUTPUT_DIR = "artifacts";
const BIN_OUTPUT_FILE = `${BIN_OUTPUT_DIR}/pastoralist`;
const BIN_ENTRY_FILE = `${BIN_OUTPUT_DIR}/pastoralist-entry.ts`;
const BIN_RUNTIME_DIR = `${BIN_OUTPUT_DIR}/node_modules/pastoralist-runtime`;
const BIN_RUNTIME_ENTRY_FILE = `${BIN_OUTPUT_DIR}/pastoralist-runtime-entry.ts`;
const BIN_RUNTIME_PACKAGE_FILE = `${BIN_RUNTIME_DIR}/package.json`;
const BIN_BUNDLE_FILE = `${BIN_RUNTIME_DIR}/index.js`;
const AGENT_SKILL_FILE = "skills/pastoralist/SKILL.md";
const log = createLogger({ file: "scripts/build-bin.ts" });

const runCommand = (command: string, args: readonly string[]): void => {
  const result = spawnSync(command, Array.from(args), { encoding: "utf8" });
  if (result.status === 0) return;

  const stdout = result.stdout?.trim();
  const stderr = result.stderr?.trim();
  if (stdout) log.print(stdout);
  if (stderr) log.fail(stderr);
  if (result.error) throw result.error;
  throw new Error(`${command} exited with status ${result.status ?? 1}`);
};

const renderRuntimeEntry = (): string => {
  const agentSkill = JSON.stringify(readFileSync(AGENT_SKILL_FILE, "utf8"));
  const version = JSON.stringify(packageJson.version);
  return [
    'import { run, setEmbeddedAgentSkill } from "../src/cli/index";',
    'import { runBinaryEntry } from "../src/cli/utils";',
    "",
    `setEmbeddedAgentSkill(${agentSkill});`,
    `void runBinaryEntry(${version}, run);`,
    "",
  ].join("\n");
};

const renderBinaryEntry = (): string => 'import "pastoralist-runtime";\n';

const renderRuntimePackage = (): string => {
  const version = packageJson.version;
  const manifest = { name: "pastoralist-runtime", version, type: "commonjs", main: "index.js" };
  return JSON.stringify(manifest);
};

const bundleBinaryEntry = (): void => {
  const args = [
    "build",
    BIN_RUNTIME_ENTRY_FILE,
    "--outfile",
    BIN_BUNDLE_FILE,
    "--target",
    "node",
    "--format",
    "cjs",
    "--banner",
    "// @ts-nocheck",
  ];
  runCommand("bun", args);
};

const buildBinary = (): void => {
  mkdirSync(BIN_RUNTIME_DIR, { recursive: true });
  writeFileSync(BIN_ENTRY_FILE, renderBinaryEntry());
  writeFileSync(BIN_RUNTIME_ENTRY_FILE, renderRuntimeEntry());
  writeFileSync(BIN_RUNTIME_PACKAGE_FILE, renderRuntimePackage());
  bundleBinaryEntry();
  runCommand("scriptc", [
    "build",
    BIN_ENTRY_FILE,
    "--out",
    BIN_OUTPUT_FILE,
    "--dynamic",
    "--no-keep-c",
  ]);

  const sizeInMb = (statSync(BIN_OUTPUT_FILE).size / 1024 / 1024).toFixed(1);
  log.print(`Built ${BIN_OUTPUT_FILE} (${sizeInMb}MB)`);
};

try {
  buildBinary();
} catch (error) {
  log.fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
