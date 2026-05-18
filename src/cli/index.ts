#!/usr/bin/env node

import { parseArgs, showHelp } from "./parser";
import { createSpinner, green, resolveCacheDir, pruneBackups } from "../utils";
import { Options, PastoralistJSON, PastoralistResult } from "../types";
import { update } from "../core/update";
import { logger as createLogger } from "../utils";
import { resolveJSON } from "../core/packageJSON";
import { loadConfig } from "../config";
import { IS_DEBUGGING } from "../constants";
import { initCommand } from "./cmds/init/index";
import { createTerminalGraph } from "../dx";
import { getOverrideGitDate } from "../utils/git";
import { displaySummaryTable } from "./display";
import { renderUpdateOutput } from "./action-display";
import { loadActionConfig } from "./action-config";
import { runSecurityPhase } from "./action-security";
import { buildMergedOptions, handleSecurityResults, runSecurityCheck } from "./security";
import { buildUpdateResult, createEmptyResult, createErrorResult, outputResult } from "./results";
import { resolvePathFromRoot } from "./path";
import type { RunDeps } from "./types";
import * as fs from "fs";
import { resolve } from "path";

export {
  buildSecurityOverrideDetail,
  determineSecurityScanPaths,
  formatUpdateReport,
  handleSecurityResults,
  normalizeCacheTtl,
  runSecurityCheck,
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

export const handleSetupHook = (
  options: Options,
  log: ReturnType<typeof createLogger>,
  deps = {
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
    resolve,
  },
): boolean => {
  const shouldSetup = options.setupHook === true;
  if (!shouldSetup) return false;

  const packagePath = deps.resolve(
    resolvePathFromRoot(options.path || "package.json", options.root),
  );

  try {
    const content = deps.readFileSync(packagePath, "utf8");
    const config = JSON.parse(content) as PastoralistJSON & {
      scripts?: Record<string, string>;
    };

    const scripts = config.scripts || {};
    const existingPostinstall = scripts.postinstall || "";
    const hasPastoralist = existingPostinstall.includes("pastoralist");

    if (hasPastoralist) {
      log.print("postinstall hook already configured");
      return true;
    }

    const newPostinstall = existingPostinstall
      ? `${existingPostinstall} && pastoralist`
      : "pastoralist";

    const updatedConfig = {
      ...config,
      scripts: {
        ...scripts,
        postinstall: newPostinstall,
      },
    };

    const jsonString = JSON.stringify(updatedConfig, null, 2) + "\n";
    deps.writeFileSync(packagePath, jsonString);

    log.print("added postinstall hook to package.json");
    return true;
  } catch (err) {
    log.error("Failed to setup hook", "handleSetupHook", err);
    return false;
  }
};

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

const runUpdateWorkflow = async (
  options: Options,
  deps: {
    resolveJSON: typeof resolveJSON;
    buildMergedOptions: typeof buildMergedOptions;
    loadConfig?: typeof loadConfig;
    getOverrideGitDate: typeof getOverrideGitDate;
    update: typeof update;
    runSecurityCheck: typeof runSecurityCheck;
    handleSecurityResults: typeof handleSecurityResults;
  },
  runtime: ReturnType<typeof createActionRuntime>,
) => {
  const loadedConfig = await loadActionConfig(options, runtime.rest, deps);
  let mergedOptions = loadedConfig.mergedOptions;
  const securityPhase = await runSecurityPhase(
    runtime.graph,
    loadedConfig.config,
    mergedOptions,
    runtime.isJsonOutput,
    Boolean(runtime.isLogging),
    runtime.log,
    deps,
  );
  mergedOptions = { ...securityPhase.mergedOptions };
  const addedDate = await deps.getOverrideGitDate(loadedConfig.path);
  mergedOptions = { ...mergedOptions, addedDate };
  const updateContext = deps.update(mergedOptions);
  const updateResultData = buildUpdateResult(
    updateContext,
    loadedConfig.config,
    options.dryRun || false,
  );

  return {
    ...loadedConfig,
    mergedOptions,
    securityPhase,
    updateContext,
    updateResultData,
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
  deps: {
    resolveJSON: typeof resolveJSON;
    buildMergedOptions: typeof buildMergedOptions;
    loadConfig?: typeof loadConfig;
    getOverrideGitDate: typeof getOverrideGitDate;
    update: typeof update;
    runSecurityCheck: typeof runSecurityCheck;
    handleSecurityResults: typeof handleSecurityResults;
    processExit: (code: number) => void;
  },
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

export async function action(
  options: Options = {},
  deps = {
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
  },
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
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    showHelp();
    process.exitCode = 1;
    return;
  }

  const options = parsed.options as Options;

  const isHelpRequested = options.help || argv.includes("-h") || argv.includes("--help");
  if (isHelpRequested) {
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
    await deps.initCommand({
      ...options,
      securityProvider: Array.isArray(options.securityProvider)
        ? options.securityProvider[0]
        : options.securityProvider,
    });
    return;
  }

  await deps.action(options);
};
