import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import packageJson from "../package.json" with { type: "json" };
import { logger as createLogger } from "../src/utils";

const BIN_OUTPUT_DIR = "artifacts";
const BIN_OUTPUT_FILE = `${BIN_OUTPUT_DIR}/pastoralist`;
const BIN_ENTRY_FILE = `${BIN_OUTPUT_DIR}/pastoralist-entry.ts`;
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

const renderBinaryEntry = (): string => {
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

const buildBinary = (): void => {
  mkdirSync(BIN_OUTPUT_DIR, { recursive: true });
  writeFileSync(BIN_ENTRY_FILE, renderBinaryEntry());
  runCommand("perry", ["compile", BIN_ENTRY_FILE, "-o", BIN_OUTPUT_FILE, "--quiet"]);

  const sizeInMb = (statSync(BIN_OUTPUT_FILE).size / 1024 / 1024).toFixed(1);
  log.print(`Built ${BIN_OUTPUT_FILE} (${sizeInMb}MB)`);
};

try {
  buildBinary();
} catch (error) {
  log.fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
