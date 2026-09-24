#!/usr/bin/env node

import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { parseArgs, showHelp } from "./parser";
import type { Options } from "../types";
import { logger as createLogger } from "../observability";
import { initCommand, showOnboarding } from "./cmds/init";
import { action } from "./action";
import { addPostinstallHook, readPackageJson, resolvePackagePath, writePackageJson } from "./utils";
import { showStyleguide } from "./styleguide";
import type { InitSecurityProvider, RunDeps, SetupHookDeps } from "./types";
import type { Logger, PrintFunc } from "../observability";

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
  displayOverrides,
  displaySummaryTable,
} from "./utils";
export { buildOnboardingText, showOnboarding } from "./cmds/init";
export { formatStyleguide, showStyleguide } from "./styleguide";

type PackageVersion = { version?: unknown };
const INIT_COMMAND_TYPES = ["config", "agent-skill"] as const;
const KNOWN_COMMANDS = ["doctor", "init", "onboard", "onboarding"] as const;
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
  const isError = error instanceof Error;
  const message = isError ? error.message : String(error);
  log.fail(`Error: ${message}`);
  showHelp(log.print);
  process.exitCode = 1;
};

const parseRunArgs = (
  argv: string[],
  log: Pick<Logger, "fail" | "print">,
): ReturnType<typeof parseArgs> | undefined => {
  try {
    const runArgs = parseArgs(argv);
    return runArgs;
  } catch (error) {
    showRunError(error, log);
    return undefined;
  }
};

const isHelpRequested = (argv: string[], options: Options): boolean =>
  Boolean(options.help || argv.some((arg) => arg === "-h" || arg === "--help"));

const isVersionRequested = (argv: string[], options: Options): boolean =>
  Boolean(options.version || argv.some((arg) => arg === "-v" || arg === "--version"));

const isKnownCommand = (command: string | undefined): boolean => {
  if (!command) return true;
  const result = KNOWN_COMMANDS.some((knownCommand) => knownCommand === command);
  return result;
};

const isOnboardingCommand = (command: string | undefined): boolean => {
  const isOnboardCommand = command === "onboard";
  const isOnboardingAlias = command === "onboarding";

  const result = isOnboardCommand || isOnboardingAlias;
  return result;
};

const isOnboardingRequested = (command: string | undefined, options: Options): boolean => {
  const isOnboardFlag = options.onboard === true;

  if (isOnboardFlag) return true;
  const result = isOnboardingCommand(command);
  return result;
};

const isInitCommandType = (value: string): value is InitCommandType =>
  INIT_COMMAND_TYPES.includes(value as InitCommandType);

const toStringList = (value: Options["init"]): string[] => {
  if (value === true) {
    const result: string[] = [];
    return result;
  }
  if (typeof value === "string") {
    const values = [value];
    return values;
  }
  if (Array.isArray(value)) return value;
  const values: string[] = [];
  return values;
};

const parseInitCommandInput = (args: readonly string[]): InitCommandInput => {
  const [target, ...initArgs] = args;
  if (!target) {
    const emptyArgs: string[] = [];
    const initCommandInput: InitCommandInput = { type: "config", args: emptyArgs };
    return initCommandInput;
  }
  if (isInitCommandType(target)) {
    const input: InitCommandInput = { type: target, args: initArgs };
    return input;
  }

  throw new Error(`Unknown init type: ${target}. Expected config or agent-skill.`);
};

const getInitCommandInput = (
  command: string | undefined,
  commandArgs: readonly string[],
  init: Options["init"],
): InitCommandInput => {
  if (command === "init") {
    const initCommandInput = parseInitCommandInput(commandArgs);
    return initCommandInput;
  }
  const input = parseInitCommandInput(toStringList(init));
  return input;
};

const isInitRequested = (command: string | undefined, init: Options["init"]): boolean => {
  if (command === "init") return true;
  const hasInitValue = init !== undefined;
  const isEnabled = init !== false;
  const result = hasInitValue && isEnabled;
  return result;
};

const readVersion = (path: string): string | undefined => {
  if (!existsSync(path)) return undefined;
  const manifest = JSON.parse(readFileSync(path, "utf8")) as PackageVersion;
  if (typeof manifest.version !== "string") return undefined;
  const result = manifest.version;
  return result;
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
    resolve(moduleDir, "scripts/setup/setup.sh"),
    resolve(moduleDir, "../scripts/setup/setup.sh"),
    resolve(moduleDir, "../../scripts/setup/setup.sh"),
  ];
  const script = candidates.find(existsSync);
  if (!script) throw new Error("Unable to find scripts/setup/setup.sh");
  return script;
};

const buildSetupAgentSkillArgs = (options: Options, args: readonly string[] = []): string[] => {
  const script = resolveSetupAgentSkillScript();
  const dryRunArgs = options.dryRun ? ["--dry-run"] : [];
  const setupAgentSkillArgs = [script, "skill"].concat(dryRunArgs, args);
  return setupAgentSkillArgs;
};

const firstSecurityProvider = (options: Options): InitSecurityProvider => {
  if (Array.isArray(options.securityProvider)) {
    const result = options.securityProvider[0];
    return result;
  }
  const result2 = options.securityProvider;
  return result2;
};

const runInitCommand = async (options: Options, deps: Pick<RunDeps, "initCommand">) => {
  const securityProvider = firstSecurityProvider(options);
  const initOptions = Object.assign({}, options, {
    securityProvider,
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
  const agentSkillPath = join(root, path);
  return agentSkillPath;
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
  styleguide: showStyleguide,
};

export const run = async (
  argv: string[] = process.argv,
  deps: RunDeps = defaultRunDeps,
): Promise<void> => {
  const log = createLogger({ file: "program.ts", isLogging: false });
  const parsed = parseRunArgs(argv, log);
  if (!parsed) return;
  const wasHandled = handleRunDisplay(argv, parsed, log);
  if (wasHandled) return;
  const options = parsed.options as Options;
  await runCommand(parsed, options, deps, log);
};

const handleRunDisplay = (
  argv: string[],
  parsed: ReturnType<typeof parseArgs>,
  log: Pick<Logger, "fail" | "print">,
): boolean => {
  const options = parsed.options as Options;
  if (isHelpRequested(argv, options)) {
    showHelp(log.print);
    return true;
  }

  if (isVersionRequested(argv, options)) {
    log.print(getPackageVersion());
    return true;
  }

  if (!isKnownCommand(parsed.command)) {
    showRunError(new Error(`Unknown command: ${parsed.command}`), log);
    return true;
  }
  return false;
};

const runCommand = async (
  parsed: ReturnType<typeof parseArgs>,
  options: Options,
  deps: RunDeps,
  log: Logger,
): Promise<void> => {
  if (options.styleguide) {
    await (deps.styleguide || showStyleguide)();
    return;
  }

  if (isOnboardingRequested(parsed.command, options)) {
    deps.showOnboarding();
    return;
  }

  const didSetupHook = handleSetupHook(options, log);
  if (didSetupHook) return;
  await runPackageCommand(parsed, options, deps, log);
};

const runPackageCommand = async (
  parsed: ReturnType<typeof parseArgs>,
  options: Options,
  deps: RunDeps,
  log: Logger,
): Promise<void> => {
  if (isInitRequested(parsed.command, options.init)) {
    await tryInitCommand(parsed, options, deps, log);
    return;
  }

  const isDoctorCommand = parsed.command === "doctor";
  if (isDoctorCommand) {
    const result = runDoctorCommand(options, deps, log.print);
    return result;
  }

  await deps.action(options);
};

const tryInitCommand = async (
  parsed: ReturnType<typeof parseArgs>,
  options: Options,
  deps: RunDeps,
  log: Logger,
): Promise<void> => {
  try {
    await handleInitCommand(parsed.command, parsed.commandArgs, options, deps);
  } catch (error) {
    showRunError(error, log);
  }
};

const defaultSetupHookDeps: SetupHookDeps = {
  readFileSync,
  writeFileSync,
  resolve,
};

export const handleSetupHook = (
  options: Options,
  log: ReturnType<typeof createLogger>,
  deps: SetupHookDeps = defaultSetupHookDeps,
): boolean => {
  if (options.setupHook !== true) return false;

  try {
    installPostinstallHook(options, log, deps);
  } catch (err) {
    const isError = err instanceof Error;
    const reason = isError ? err.message : String(err);
    log.fail(`Failed to setup hook: ${reason}`);
    process.exitCode = 1;
  }
  return true;
};

const installPostinstallHook = (options: Options, log: Logger, deps: SetupHookDeps): void => {
  const packagePath = resolvePackagePath(options, deps);
  const config = readPackageJson(packagePath, deps);
  const existingPostinstall = config.scripts?.postinstall || "";
  if (existingPostinstall.includes("pastoralist")) {
    log.print("postinstall hook already configured");
    return;
  }
  if (options.dryRun) {
    log.print("[DRY RUN] would add postinstall hook to package.json");
    return;
  }
  writePackageJson(packagePath, addPostinstallHook(config), deps);
  log.print("added postinstall hook to package.json");
};
