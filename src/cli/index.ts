#!/usr/bin/env node

import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { parseArgs, showHelp } from "./parser";
import type { Options } from "../types";
import { logger as createLogger } from "../utils";
import { initCommand } from "./cmds/init/index";
import { action } from "./action";
import { handleSetupHook } from "./setup-hook";
import { showOnboarding } from "./onboarding";
import type { InitSecurityProvider, RunDeps } from "./types";

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
} from "./results";
export { displayOverrides, displaySummaryTable } from "./display";
export { checkRemovalSafety } from "./safety";
export { resolvePathFromRoot } from "./path";
export { handleSetupHook } from "./setup-hook";
export { buildOnboardingText, showOnboarding } from "./onboarding";

type PackageVersion = { version?: unknown };
const INIT_COMMAND_TYPES = ["config", "agent-skill"] as const;
type InitCommandType = (typeof INIT_COMMAND_TYPES)[number];
type InitCommandInput = {
  args: string[];
  type: InitCommandType;
};

const parseRunArgs = (argv: string[]): ReturnType<typeof parseArgs> | undefined => {
  try {
    return parseArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    showHelp();
    process.exitCode = 1;
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

const runDoctorCommand = async (options: Options, deps: Pick<RunDeps, "action">) => {
  const doctorOptions = Object.assign({}, options, {
    dryRun: true,
    summary: true,
  });

  if (doctorOptions.outputFormat !== "json") {
    console.log("Pastoralist doctor runs in dry-run mode and will not modify package.json.");
  }

  await deps.action(doctorOptions);
};

const setupAgentSkill = (options: Options, initArgs: readonly string[] = []): void => {
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
  const parsed = parseRunArgs(argv);
  if (!parsed) return;

  const options = parsed.options as Options;
  if (isHelpRequested(argv, options)) {
    showHelp();
    return;
  }

  if (isVersionRequested(argv, options)) {
    console.log(getPackageVersion());
    return;
  }

  if (isOnboardingRequested(parsed.command, options)) {
    deps.showOnboarding();
    return;
  }

  const log = createLogger({ file: "program.ts", isLogging: false });
  const didSetupHook = handleSetupHook(options, log);
  if (didSetupHook) {
    return;
  }

  if (isInitRequested(parsed.command, options.init)) {
    try {
      await handleInitCommand(parsed.command, parsed.commandArgs, options, deps);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      showHelp();
      process.exitCode = 1;
    }
    return;
  }

  const isDoctorCommand = parsed.command === "doctor";
  if (isDoctorCommand) return runDoctorCommand(options, deps);

  await deps.action(options);
};
