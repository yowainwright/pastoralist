#!/usr/bin/env node

import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { parseArgs, showHelp } from "./parser";
import type { Options } from "../types";
import { logger as createLogger } from "../utils";
import { initCommand, showOnboarding } from "./cmds/init";
import { action } from "./action";
import { handleSetupHook } from "./setup-hook";
import type { InitSecurityProvider, RunDeps } from "./types";
import type { Logger, PrintFunc } from "../utils";

export { action, handleInitMode, handleTestMode } from "./action";
export {
  buildSecurityOverrideDetail,
  determineSecurityScanPaths,
  formatUpdateReport,
  handleSecurityResults,
  normalizeCacheTtl,
  runSecurityCheck,
  runSecurityPhase,
  buildMergedOptions,
} from "./security";
export {
  buildSecurityResult,
  buildUpdateResult,
  createEmptyResult,
  createErrorResult,
  outputResult,
  resolvePathFromRoot,
} from "./utils";
export { displayOverrides, displaySummaryTable } from "./display";
export { checkRemovalSafety } from "./security";
export { handleSetupHook } from "./setup-hook";
export { buildOnboardingText, showOnboarding } from "./cmds/init";

type PackageVersion = { version?: unknown };
const INIT_COMMAND_TYPES = ["config", "agent-skill"] as const;
const AGENT_SKILL_DIR = ".agents/skills/pastoralist";
const AGENT_SKILL_FILE = `${AGENT_SKILL_DIR}/SKILL.md`;
const AGENT_SKILL_MARKER = `${AGENT_SKILL_DIR}/.pastoralist-agent-config`;
let embeddedAgentSkill: string | undefined;
type InitCommandType = (typeof INIT_COMMAND_TYPES)[number];
type InitCommandInput = {
  args: string[];
  type: InitCommandType;
};

const showRunError = (error: unknown, log: Pick<Logger, "fail" | "print">): void => {
  const message = error instanceof Error ? error.message : String(error);
  log.fail(`Error: ${message}`);
  showHelp(log.print);
  process.exitCode = 1;
};

const parseRunArgs = (
  argv: string[],
  log: Pick<Logger, "fail" | "print">,
): ReturnType<typeof parseArgs> | undefined => {
  try {
    return parseArgs(argv);
  } catch (error) {
    showRunError(error, log);
    return undefined;
  }
};

const isHelpRequested = (argv: string[], options: Options): boolean =>
  Boolean(options.help || argv.includes("-h") || argv.includes("--help"));

const isVersionRequested = (argv: string[], options: Options): boolean =>
  Boolean(options.version || argv.includes("-v") || argv.includes("--version"));

const isOnboardingCommand = (command: string | undefined): boolean => {
  const isOnboardCommand = command === "onboard";
  const isOnboardingAlias = command === "onboarding";

  return isOnboardCommand || isOnboardingAlias;
};

const isOnboardingRequested = (command: string | undefined, options: Options): boolean => {
  const isOnboardFlag = options.onboard === true;

  if (isOnboardFlag) return true;
  return isOnboardingCommand(command);
};

const isInitCommandType = (value: string): value is InitCommandType =>
  INIT_COMMAND_TYPES.includes(value as InitCommandType);

const toStringList = (value: Options["init"]): string[] => {
  if (value === true) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value;
  return [];
};

const parseInitCommandInput = (args: readonly string[]): InitCommandInput => {
  const [target, ...initArgs] = args;
  if (!target) return { type: "config", args: [] };
  if (isInitCommandType(target)) return { type: target, args: initArgs };

  throw new Error(`Unknown init type: ${target}. Expected config or agent-skill.`);
};

const getInitCommandInput = (
  command: string | undefined,
  commandArgs: readonly string[],
  init: Options["init"],
): InitCommandInput => {
  if (command === "init") return parseInitCommandInput(commandArgs);
  return parseInitCommandInput(toStringList(init));
};

const isInitRequested = (command: string | undefined, init: Options["init"]): boolean => {
  if (command === "init") return true;
  const hasInitValue = init !== undefined;
  const isNotDisabled = init !== false;
  return hasInitValue && isNotDisabled;
};

const readVersion = (path: string): string | undefined => {
  if (!existsSync(path)) return undefined;
  const manifest = JSON.parse(readFileSync(path, "utf8")) as PackageVersion;
  if (typeof manifest.version !== "string") return undefined;
  return manifest.version;
};

const getModuleDir = (): string => dirname(fileURLToPath(import.meta.url));

const getPackageVersion = (): string => {
  const moduleDir = getModuleDir();
  const candidates = [
    resolve(moduleDir, "../package.json"),
    resolve(moduleDir, "../../package.json"),
  ];
  const version = candidates.map(readVersion).find((value) => value !== undefined);
  if (!version) throw new Error("Unable to read package version");
  return version;
};

const resolveSetupAgentSkillScript = (): string => {
  const moduleDir = getModuleDir();
  const candidates = [
    resolve(moduleDir, "scripts/setup-pastoralist-skill.sh"),
    resolve(moduleDir, "../scripts/setup-pastoralist-skill.sh"),
    resolve(moduleDir, "../../scripts/setup-pastoralist-skill.sh"),
  ];
  const script = candidates.find(existsSync);
  if (!script) throw new Error("Unable to find setup-pastoralist-skill.sh");
  return script;
};

const buildSetupAgentSkillArgs = (options: Options, args: readonly string[] = []): string[] => {
  const script = resolveSetupAgentSkillScript();
  const dryRunArgs = options.dryRun ? ["--dry-run"] : [];
  return [script].concat(dryRunArgs, args);
};

const firstSecurityProvider = (options: Options): InitSecurityProvider => {
  if (Array.isArray(options.securityProvider)) return options.securityProvider[0];
  return options.securityProvider;
};

const runInitCommand = async (options: Options, deps: Pick<RunDeps, "initCommand">) => {
  const initOptions = Object.assign({}, options, {
    securityProvider: firstSecurityProvider(options),
  });
  await deps.initCommand(initOptions);
};

const runDoctorCommand = async (
  options: Options,
  deps: Pick<RunDeps, "action">,
  print: PrintFunc,
) => {
  const doctorOptions = Object.assign({}, options, {
    dryRun: true,
    summary: true,
  });

  if (doctorOptions.outputFormat !== "json") {
    print("Pastoralist doctor runs in dry-run mode and will not modify package.json.");
  }

  await deps.action(doctorOptions);
};

const resolveAgentSkillPath = (root: string | undefined, path: string): string => {
  if (!root) return path;
  return join(root, path);
};

const writeEmbeddedAgentSkill = (root: string | undefined, skill: string): boolean => {
  const directory = resolveAgentSkillPath(root, AGENT_SKILL_DIR);
  const destination = resolveAgentSkillPath(root, AGENT_SKILL_FILE);
  const marker = resolveAgentSkillPath(root, AGENT_SKILL_MARKER);
  const isUnmanaged = existsSync(destination) && !existsSync(marker);
  if (isUnmanaged) return false;
  mkdirSync(directory, { recursive: true });
  writeFileSync(destination, skill);
  writeFileSync(marker, "pastoralist-agent-config\n");
  return true;
};

const tryEmbeddedAgentSkillSetup = (options: Options, initArgs: readonly string[]): boolean => {
  if (!embeddedAgentSkill) return false;
  if (initArgs[0]) throw new Error(`Unexpected agent-skill argument: ${initArgs[0]}`);
  const log = createLogger({ file: "program.ts", isLogging: false });
  if (options.dryRun) {
    log.print(`Would install ${AGENT_SKILL_FILE}`);
    return true;
  }
  const didInstall = writeEmbeddedAgentSkill(options.root, embeddedAgentSkill);
  if (!didInstall) {
    log.print(`Skipping ${AGENT_SKILL_FILE}; existing file is unmanaged`);
  }
  return true;
};

export const setEmbeddedAgentSkill = (skill: string): void => {
  embeddedAgentSkill = skill;
};

const setupAgentSkill = (options: Options, initArgs: readonly string[] = []): void => {
  if (tryEmbeddedAgentSkillSetup(options, initArgs)) return;
  const args = buildSetupAgentSkillArgs(options, initArgs);
  const cwd = options.root || process.cwd();
  const result = spawnSync("sh", args, { cwd, stdio: "inherit" });

  if (result.error) throw result.error;
  if (result.status === 0) return;
  process.exitCode = result.status ?? 1;
};

const assertConfigHasNoArgs = (args: readonly string[]): void => {
  const firstArg = args[0];
  if (!firstArg) return;
  throw new Error(`Unexpected init config argument: ${firstArg}`);
};

const handleInitCommand = async (
  command: string | undefined,
  commandArgs: readonly string[],
  options: Options,
  deps: Pick<RunDeps, "initCommand" | "setupAgentSkill">,
): Promise<void> => {
  const input = getInitCommandInput(command, commandArgs, options.init);

  if (input.type === "agent-skill") {
    await deps.setupAgentSkill(options, input.args);
    return;
  }

  assertConfigHasNoArgs(input.args);
  await runInitCommand(options, deps);
};

const defaultRunDeps: RunDeps = {
  initCommand,
  action,
  showOnboarding,
  setupAgentSkill,
};

export const run = async (
  argv: string[] = process.argv,
  deps: RunDeps = defaultRunDeps,
): Promise<void> => {
  const log = createLogger({ file: "program.ts", isLogging: false });
  const parsed = parseRunArgs(argv, log);
  if (!parsed) return;

  const options = parsed.options as Options;
  if (isHelpRequested(argv, options)) {
    showHelp(log.print);
    return;
  }

  if (isVersionRequested(argv, options)) {
    log.print(getPackageVersion());
    return;
  }

  if (isOnboardingRequested(parsed.command, options)) {
    deps.showOnboarding();
    return;
  }

  const didSetupHook = handleSetupHook(options, log);
  if (didSetupHook) {
    return;
  }

  if (isInitRequested(parsed.command, options.init)) {
    try {
      await handleInitCommand(parsed.command, parsed.commandArgs, options, deps);
    } catch (error) {
      showRunError(error, log);
    }
    return;
  }

  const isDoctorCommand = parsed.command === "doctor";
  if (isDoctorCommand) return runDoctorCommand(options, deps, log.print);

  await deps.action(options);
};
