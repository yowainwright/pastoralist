import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import packageJson from "../../package.json" with { type: "json" };
import { logger as createLogger } from "../../src/observability";
import {
  AGENT_SKILL_FILE,
  BIN_BUNDLE_BANNER,
  BIN_BUNDLE_FILE,
  BIN_ENTRY_FILE,
  BIN_OUTPUT_DIR,
  BIN_OUTPUT_FILE,
  BUILD_SCRIPT_LABEL,
  BUILD_TARGETS,
  DEFAULT_BUILD_TARGET,
  DIST_OUTPUT_DIR,
  TS_BUILD_INFO_FILE,
  TYPECHECK_ARGS,
} from "./constants";
import { rolldownConfig } from "./rolldown.config";
import type { BuildTarget } from "./types";
import { isMainModule } from "../is-main";
import { buildRolldownBundleArgs, runCommand } from "./utils";

const log = createLogger({ file: BUILD_SCRIPT_LABEL });

export const isBuildTarget = (value: string): value is BuildTarget =>
  BUILD_TARGETS.some((target) => target === value);

export const parseBuildTarget = (args: readonly string[]): BuildTarget => {
  const target = args[0] ?? DEFAULT_BUILD_TARGET;
  if (isBuildTarget(target)) return target;
  throw new Error(`Invalid build target: ${target}`);
};

const runBuildCommand = (command: string, args: readonly string[]): void =>
  runCommand(command, args, log);

const removePath = (path: string): void => {
  if (!existsSync(path)) return;
  rmSync(path, { force: true, recursive: true });
};

export const cleanDist = (): void => {
  const hadDist = existsSync(DIST_OUTPUT_DIR);
  removePath(DIST_OUTPUT_DIR);
  removePath(TS_BUILD_INFO_FILE);
  const message = hadDist ? "Cleaned dist directory" : "dist directory does not exist";
  log.print(message);
};

const buildBundle = (): void => {
  runBuildCommand("rolldown", buildRolldownBundleArgs(rolldownConfig));
};

const buildTypes = (): void => {
  runBuildCommand("tsc", TYPECHECK_ARGS);
};

const buildDist = (): void => {
  cleanDist();
  buildBundle();
  buildTypes();
};

const renderBinaryEntry = (): string => {
  const agentSkill = JSON.stringify(readFileSync(AGENT_SKILL_FILE, "utf8"));
  const version = JSON.stringify(packageJson.version);
  const result = [
    'import { run, setEmbeddedAgentSkill } from "../src/cli/index";',
    'import { runBinaryEntry } from "../src/cli/utils";',
    "",
    `setEmbeddedAgentSkill(${agentSkill});`,
    `void runBinaryEntry(${version}, run);`,
    "",
  ].join("\n");
  return result;
};

const bundleBinaryRuntime = (): void => {
  const args = [
    BIN_ENTRY_FILE,
    "--file",
    BIN_BUNDLE_FILE,
    "--platform",
    "node",
    "--format",
    "esm",
    "--banner",
    BIN_BUNDLE_BANNER,
  ];
  runBuildCommand("rolldown", args);
};

const writeBinarySources = (): void => {
  mkdirSync(BIN_OUTPUT_DIR, { recursive: true });
  writeFileSync(BIN_ENTRY_FILE, renderBinaryEntry());
};

const compileBinary = (): void => {
  runBuildCommand("scriptc", [
    "build",
    BIN_BUNDLE_FILE,
    "--out",
    BIN_OUTPUT_FILE,
    "--no-keep-llvm",
  ]);
};

const printBinarySize = (): void => {
  const sizeInMb = (statSync(BIN_OUTPUT_FILE).size / 1024 / 1024).toFixed(1);
  log.print(`Built ${BIN_OUTPUT_FILE} (${sizeInMb}MB)`);
};

export const buildBinary = (): void => {
  writeBinarySources();
  bundleBinaryRuntime();
  compileBinary();
  printBinarySize();
};

const buildActions = new Map<BuildTarget, () => void>([
  ["dist", buildDist],
  ["bundle", buildBundle],
  ["types", buildTypes],
  ["clean", cleanDist],
]);

export const runBuild = (target: BuildTarget): void => {
  const build = buildActions.get(target) ?? buildBinary;
  build();
};

const formatBuildError = (error: unknown): string => {
  if (error instanceof Error) {
    const { message } = error;
    return message;
  }
  const message = String(error);
  return message;
};

if (isMainModule(import.meta.url)) {
  try {
    runBuild(parseBuildTarget(process.argv.slice(2)));
  } catch (error) {
    log.fail(formatBuildError(error));
    process.exitCode = 1;
  }
}
