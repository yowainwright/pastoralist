import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { logger as createLogger } from "../src/utils";

const BIN_OUTPUT_DIR = "artifacts";
const BIN_OUTPUT_FILE = `${BIN_OUTPUT_DIR}/pastoralist`;
const BIN_BUNDLE_FILE = `${BIN_OUTPUT_DIR}/pastoralist.js`;
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

const defineTextFile = (name: string, path: string): string[] => [
  "--define",
  `process.env.${name}=${JSON.stringify(readFileSync(path, "utf8"))}`,
];

const buildBundle = (): void => {
  const defineArgs = [
    "--define",
    'process.env.PASTORALIST_BINARY="1"',
    ...defineTextFile("PASTORALIST_AGENT_SKILL", AGENT_SKILL_FILE),
  ];
  const buildArgs = [
    "build",
    "src/cli/utils.ts",
    "--outfile",
    BIN_BUNDLE_FILE,
    "--target",
    "node",
    "--format",
    "esm",
    "--minify",
  ].concat(defineArgs);
  runCommand("bun", buildArgs);
};

const buildBinary = (): void => {
  mkdirSync(BIN_OUTPUT_DIR, { recursive: true });
  buildBundle();
  runCommand("perry", ["compile", BIN_BUNDLE_FILE, "-o", BIN_OUTPUT_FILE, "--quiet"]);

  const sizeInMb = (statSync(BIN_OUTPUT_FILE).size / 1024 / 1024).toFixed(1);
  log.print(`Built ${BIN_OUTPUT_FILE} (${sizeInMb}MB)`);
};

try {
  buildBinary();
} catch (error) {
  log.fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
