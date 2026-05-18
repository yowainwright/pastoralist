#!/usr/bin/env node

import { parseArgs, showHelp } from "./parser";
import { createSpinner, green, resolveCacheDir, pruneBackups } from "../utils";
import { Options, PastoralistResult } from "../types";
import { update } from "../core/update";
import { logger as createLogger } from "../utils";
import { resolveJSON } from "../core/packageJSON";
import { loadConfig } from "../config";
import { IS_DEBUGGING } from "../constants";
import { initCommand } from "./cmds/init/index";
import { createTerminalGraph } from "../dx";
import { getOverrideGitDate } from "../utils/git";
import { displaySummaryTable, renderUpdateOutput } from "./display";
import { loadCliConfig } from "./config";
import {
  buildMergedOptions,
  handleSecurityResults,
  runSecurityCheck,
  runSecurityPhase,
} from "./security";
import { buildUpdateResult, createEmptyResult, createErrorResult, outputResult } from "./results";
import { handleSetupHook } from "./setup-hook";
import type { RunDeps } from "./types";

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

export const handleTestMode = (
  isTestingCLI: boolean,
  log: ReturnType<typeof createLogger>,
  options: Options,
): boolean => {
  if (isTestingCLI) {
    log.debug("action:options:", "action", { options });
    return true;
  }
  return false;
};

export const handleInitMode = async (
  init: boolean,
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  deps = { initCommand },
): Promise<boolean> => {
  if (init) {
    const securityProvider = Array.isArray(rest.securityProvider)
      ? rest.securityProvider[0]
      : rest.securityProvider;
    await deps.initCommand({
      path: options.path,
      root: options.root,
      checkSecurity: rest.checkSecurity,
      securityProvider,
      hasWorkspaceSecurityChecks: rest.hasWorkspaceSecurityChecks,
    });
    return true;
  }
  return false;
};

const createActionRuntime = (
  options: Options,
  deps: {
    createLogger: typeof createLogger;
    createTerminalGraph: typeof createTerminalGraph;
  },
) => {
  const isLogging = IS_DEBUGGING || options.debug;
  const isJsonOutput = options.outputFormat === "json";
  const isQuietMode = options.quiet === true;
  const log = deps.createLogger({ file: "program.ts", isLogging });
  const graph = deps.createTerminalGraph({ quiet: isQuietMode });
  const emptyResult = createEmptyResult();
  const { isTestingCLI = false, init = false, ...rest } = options;

  return {
    emptyResult,
    graph,
    init,
    isJsonOutput,
    isLogging,
    isQuietMode,
    isTestingCLI,
    log,
    rest,
  };
};

const prepareCache = (options: Options): void => {
  const cacheDir = resolveCacheDir({
    cacheDir: options.cacheDir,
    root: options.root,
  });
  pruneBackups(cacheDir);
};

const handleEarlyActionResult = async (
  options: Options,
  deps: {
    handleTestMode: typeof handleTestMode;
    handleInitMode: typeof handleInitMode;
  },
  runtime: ReturnType<typeof createActionRuntime>,
): Promise<PastoralistResult | undefined> => {
  if (deps.handleTestMode(runtime.isTestingCLI, runtime.log, options)) {
    outputResult(runtime.emptyResult, runtime.isJsonOutput);
    return runtime.emptyResult;
  }

  if (await deps.handleInitMode(runtime.init, options, runtime.rest)) {
    outputResult(runtime.emptyResult, runtime.isJsonOutput);
    return runtime.emptyResult;
  }

  return undefined;
};

const maybeShowBanner = (runtime: ReturnType<typeof createActionRuntime>): void => {
  const shouldShowBanner = !runtime.isJsonOutput && !runtime.isQuietMode;
  if (shouldShowBanner) runtime.graph.banner();
};

type UpdateWorkflowDeps = {
  resolveJSON: typeof resolveJSON;
  buildMergedOptions: typeof buildMergedOptions;
  loadConfig?: typeof loadConfig;
  getOverrideGitDate: typeof getOverrideGitDate;
  update: typeof update;
  runSecurityCheck: typeof runSecurityCheck;
  handleSecurityResults: typeof handleSecurityResults;
};

type ActionWorkflowDeps = UpdateWorkflowDeps & {
  processExit: (code: number) => void;
};

const runSecurityWorkflow = (
  loadedConfig: Awaited<ReturnType<typeof loadCliConfig>>,
  mergedOptions: Options,
  deps: UpdateWorkflowDeps,
  runtime: ReturnType<typeof createActionRuntime>,
) =>
  runSecurityPhase(
    runtime.graph,
    loadedConfig.config,
    mergedOptions,
    runtime.isJsonOutput,
    Boolean(runtime.isLogging),
    runtime.log,
    deps,
  );

const addGitDateToOptions = async (
  path: string,
  mergedOptions: Options,
  deps: Pick<UpdateWorkflowDeps, "getOverrideGitDate">,
): Promise<Options> => ({
  ...mergedOptions,
  addedDate: await deps.getOverrideGitDate(path),
});

const runPackageUpdate = (
  config: Awaited<ReturnType<typeof loadCliConfig>>["config"],
  mergedOptions: Options,
  options: Options,
  deps: Pick<UpdateWorkflowDeps, "update">,
) => {
  const updateContext = deps.update(mergedOptions);
  const updateResultData = buildUpdateResult(updateContext, config, options.dryRun || false);
  return { updateContext, updateResultData };
};

const runUpdateWorkflow = async (
  options: Options,
  deps: UpdateWorkflowDeps,
  runtime: ReturnType<typeof createActionRuntime>,
) => {
  const loadedConfig = await loadCliConfig(options, runtime.rest, deps);
  const securityPhase = await runSecurityWorkflow(
    loadedConfig,
    loadedConfig.mergedOptions,
    deps,
    runtime,
  );
  const mergedOptions = await addGitDateToOptions(
    loadedConfig.path,
    securityPhase.mergedOptions,
    deps,
  );
  const updateResult = runPackageUpdate(loadedConfig.config, mergedOptions, options, deps);

  return {
    ...loadedConfig,
    mergedOptions,
    securityPhase,
    ...updateResult,
  };
};

const buildActionResult = (
  runtime: ReturnType<typeof createActionRuntime>,
  workflow: Awaited<ReturnType<typeof runUpdateWorkflow>>,
): PastoralistResult =>
  Object.assign(
    {},
    runtime.emptyResult,
    workflow.securityPhase.securityResult,
    workflow.updateResultData,
    { metrics: workflow.updateContext.metrics },
  );

const finishActionResult = (
  result: PastoralistResult,
  deps: { processExit: (code: number) => void },
  runtime: ReturnType<typeof createActionRuntime>,
  options: Options,
): PastoralistResult => {
  if (options.summary && !runtime.isJsonOutput) displaySummaryTable(result);
  outputResult(result, runtime.isJsonOutput);
  if (runtime.isQuietMode && result.hasSecurityIssues) deps.processExit(1);
  return result;
};

const runActionWorkflow = async (
  options: Options,
  deps: ActionWorkflowDeps,
  runtime: ReturnType<typeof createActionRuntime>,
): Promise<PastoralistResult> => {
  const workflow = await runUpdateWorkflow(options, deps, runtime);
  if (!runtime.isJsonOutput) {
    renderUpdateOutput(
      runtime.graph,
      workflow.updateContext,
      workflow.updateResultData,
      workflow.securityPhase.securityResult,
      workflow.securityPhase.packagesScanned,
      workflow.mergedOptions,
      options,
    );
  }
  return finishActionResult(buildActionResult(runtime, workflow), deps, runtime, options);
};

const handleActionError = (
  error: unknown,
  deps: { processExit: (code: number) => void },
  runtime: ReturnType<typeof createActionRuntime>,
): PastoralistResult => {
  runtime.graph.stop();
  const result = createErrorResult(error);
  if (runtime.isJsonOutput) outputResult(result, runtime.isJsonOutput);
  else runtime.log.error("action:fn", "action", { error });
  deps.processExit(1);
  return result;
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

type InitSecurityProvider = NonNullable<Parameters<typeof initCommand>[0]>["securityProvider"];

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

const defaultActionDeps = {
  createLogger,
  handleTestMode,
  handleInitMode,
  resolveJSON,
  buildMergedOptions,
  runSecurityCheck,
  handleSecurityResults,
  createSpinner,
  green,
  update,
  createTerminalGraph,
  getOverrideGitDate,
  loadConfig,
  processExit: (code: number) => process.exit(code),
};

export async function action(
  options: Options = {},
  deps = defaultActionDeps,
): Promise<PastoralistResult> {
  prepareCache(options);
  const runtime = createActionRuntime(options, deps);
  const earlyResult = await handleEarlyActionResult(options, deps, runtime);
  if (earlyResult) return earlyResult;

  maybeShowBanner(runtime);
  try {
    return await runActionWorkflow(options, deps, runtime);
  } catch (err) {
    return handleActionError(err, deps, runtime);
  }
}

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
