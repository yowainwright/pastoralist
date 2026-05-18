#!/usr/bin/env node

import { parseArgs, showHelp } from "./parser";
import type { Options } from "../types";
import { logger as createLogger } from "../utils";
import { initCommand } from "./cmds/init/index";
import { action } from "./action";
import { handleSetupHook } from "./setup-hook";
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
export { checkRemovalSafety } from "./removal-safety";
export { resolvePathFromRoot } from "./path";
export { handleSetupHook } from "./setup-hook";

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

const firstSecurityProvider = (options: Options): InitSecurityProvider => {
  if (Array.isArray(options.securityProvider)) return options.securityProvider[0];
  return options.securityProvider;
};

const runInitCommand = async (options: Options, deps: Pick<RunDeps, "initCommand">) => {
  await deps.initCommand({
    ...options,
    securityProvider: firstSecurityProvider(options),
  });
};

export const run = async (
  argv: string[] = process.argv,
  deps: RunDeps = { initCommand, action },
): Promise<void> => {
  const parsed = parseRunArgs(argv);
  if (!parsed) return;

  const options = parsed.options as Options;
  if (isHelpRequested(argv, options)) {
    showHelp();
    return;
  }

  const log = createLogger({ file: "program.ts", isLogging: false });
  const didSetupHook = handleSetupHook(options, log);
  if (didSetupHook) {
    return;
  }

  const isInitCommand = parsed.command === "init";
  if (isInitCommand) {
    await runInitCommand(options, deps);
    return;
  }

  await deps.action(options);
};
