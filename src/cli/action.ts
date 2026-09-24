import { loadCliConfig, loadConfig, loadConfigWithSource } from "../config";
import { IS_DEBUGGING } from "../constants";
import { resolveJSON } from "../core/package";
import { update } from "../core/update";
import { createSpinner, createTerminalGraph, green } from "../dx";
import { logger as createLogger } from "../observability";
import type { Options, PastoralistResult } from "../types";
import { getLedgerAddedDate, pruneBackups, resolveCacheDir } from "../utils";
import { quickConfirm } from "./prompts";
import { initCommand } from "./cmds/init/index";
import {
  displaySummaryTable,
  renderUpdateOutput,
  buildUpdateResult,
  createEmptyResult,
  createErrorResult,
  outputResult,
} from "./utils";
import {
  buildMergedOptions,
  handleSecurityResults,
  runSecurityCheck,
  runSecurityPhase,
} from "./security";
import type {
  ActionDeps,
  ActionRuntime,
  ActionWorkflowDeps,
  EarlyActionDeps,
  RuntimeDeps,
  RunDeps,
  UpdateWorkflow,
  UpdateWorkflowDeps,
} from "./types";

export const handleTestMode = (
  isTestingCLI: boolean,
  log: ReturnType<typeof createLogger>,
  options: Options,
): boolean => {
  if (!isTestingCLI) return false;
  log.debug("action:options:", "action", { options });
  return true;
};

const isConfigInitMode = (init: Options["init"]): boolean => {
  if (init === true) return true;
  if (init === "config") return true;
  if (!Array.isArray(init)) return false;

  const [target] = init;
  const result = target === "config";
  return result;
};

export const handleInitMode = async (
  init: Options["init"],
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  deps: Pick<RunDeps, "initCommand"> = { initCommand },
): Promise<boolean> => {
  if (!isConfigInitMode(init)) return false;
  const securityProvider = Array.isArray(rest.securityProvider)
    ? rest.securityProvider[0]
    : rest.securityProvider;
  const { path, root } = options;
  const { checkSecurity, hasWorkspaceSecurityChecks } = rest;

  const initOptions = { path, root, checkSecurity, securityProvider, hasWorkspaceSecurityChecks };
  await deps.initCommand(initOptions);
  return true;
};

const createActionRuntime = (options: Options, deps: RuntimeDeps): ActionRuntime => {
  const isLogging = Boolean(IS_DEBUGGING || options.debug);
  const isJsonOutput = options.outputFormat === "json";
  const isQuietMode = options.quiet === true;
  const log = deps.createLogger({ file: "program.ts", isLogging });
  const quiet = isQuietMode || isJsonOutput;
  const graph = deps.createTerminalGraph({ quiet });
  const emptyResult = createEmptyResult();
  const { isTestingCLI = false, init = false, ...rest } = options;

  const context = { emptyResult, graph, init };
  const modes = { isJsonOutput, isLogging, isQuietMode, isTestingCLI };
  const actionRuntime: ActionRuntime = Object.assign({}, context, modes, { log, rest });
  return actionRuntime;
};

const prepareCache = (options: Options): void => {
  const { cacheDir: requestedCacheDir, root } = options;
  const cacheDir = resolveCacheDir({
    cacheDir: requestedCacheDir,
    root,
  });
  pruneBackups(cacheDir);
};

const outputEarlyResult = (runtime: ActionRuntime): PastoralistResult => {
  outputResult(runtime.emptyResult, runtime.isJsonOutput);
  const result = runtime.emptyResult;
  return result;
};

const handleEarlyActionResult = async (
  options: Options,
  deps: EarlyActionDeps,
  runtime: ActionRuntime,
): Promise<PastoralistResult | undefined> => {
  if (deps.handleTestMode(runtime.isTestingCLI, runtime.log, options)) {
    const result = outputEarlyResult(runtime);
    return result;
  }

  if (await deps.handleInitMode(runtime.init, options, runtime.rest)) {
    const result = outputEarlyResult(runtime);
    return result;
  }

  return undefined;
};

const maybeShowBanner = (runtime: ActionRuntime): void => {
  const shouldShowBanner = !runtime.isJsonOutput && !runtime.isQuietMode;
  if (shouldShowBanner) runtime.graph.banner();
};

const runSecurityWorkflow = (
  loadedConfig: Awaited<ReturnType<typeof loadCliConfig>>,
  mergedOptions: Options,
  deps: UpdateWorkflowDeps,
  runtime: ActionRuntime,
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

const addLedgerDateToOptions = (
  mergedOptions: Options,
  deps: Pick<UpdateWorkflowDeps, "getLedgerAddedDate">,
): Options => {
  const addedDate = deps.getLedgerAddedDate();
  const result = Object.assign({}, mergedOptions, { addedDate });
  return result;
};

const runPackageUpdate = (
  config: Awaited<ReturnType<typeof loadCliConfig>>["config"],
  mergedOptions: Options,
  options: Options,
  deps: Pick<UpdateWorkflowDeps, "update">,
) => {
  const updateContext = deps.update(mergedOptions);
  const updateResultData = buildUpdateResult(updateContext, config, options.dryRun || false);
  const result = { updateContext, updateResultData };
  return result;
};

const runUpdateWorkflow = async (
  options: Options,
  deps: UpdateWorkflowDeps,
  runtime: ActionRuntime,
): Promise<UpdateWorkflow> => {
  const loadedConfig = await loadCliConfig(options, runtime.rest, deps);
  const securityPhase = await runSecurityWorkflow(
    loadedConfig,
    loadedConfig.mergedOptions,
    deps,
    runtime,
  );
  const mergedOptions = addLedgerDateToOptions(securityPhase.mergedOptions, deps);
  const updateResult = runPackageUpdate(loadedConfig.config, mergedOptions, options, deps);

  const result = Object.assign({}, loadedConfig, { mergedOptions, securityPhase }, updateResult);
  return result;
};

const buildActionResult = (runtime: ActionRuntime, workflow: UpdateWorkflow): PastoralistResult => {
  const { removalVerification } = workflow.mergedOptions;
  const { bestCase } = workflow.securityPhase;
  const { metrics } = workflow.updateContext;
  const result = Object.assign(
    {},
    runtime.emptyResult,
    workflow.securityPhase.securityResult,
    workflow.updateResultData,
    {
      removalVerification,
      bestCase,
      metrics,
    },
  );
  return result;
};

const finishActionResult = (
  result: PastoralistResult,
  deps: { processExit: (code: number) => void },
  runtime: ActionRuntime,
  options: Options,
): PastoralistResult => {
  const shouldDisplaySummary = options.summary && !runtime.isJsonOutput;
  if (shouldDisplaySummary) displaySummaryTable(result);
  outputResult(result, runtime.isJsonOutput);
  const shouldExitWithSecurityFailure = runtime.isQuietMode && result.hasSecurityIssues;
  if (shouldExitWithSecurityFailure) deps.processExit(1);
  return result;
};

const renderActionOutput = async (
  workflow: UpdateWorkflow,
  runtime: ActionRuntime,
  options: Options,
): Promise<void> => {
  if (runtime.isJsonOutput) return;
  await renderUpdateOutput(
    runtime.graph,
    workflow.updateContext,
    workflow.updateResultData,
    workflow.securityPhase.securityResult,
    workflow.securityPhase.packagesScanned,
    workflow.mergedOptions,
    options,
  );
};

const runActionWorkflow = async (
  options: Options,
  deps: ActionWorkflowDeps,
  runtime: ActionRuntime,
): Promise<PastoralistResult> => {
  const workflow = await runUpdateWorkflow(options, deps, runtime);
  await renderActionOutput(workflow, runtime, options);
  const result = finishActionResult(buildActionResult(runtime, workflow), deps, runtime, options);
  return result;
};

const handleActionError = (
  error: unknown,
  deps: { processExit: (code: number) => void },
  runtime: ActionRuntime,
): PastoralistResult => {
  runtime.graph.stop();
  const result = createErrorResult(error);
  if (runtime.isJsonOutput) outputResult(result, runtime.isJsonOutput);
  else runtime.log.fail(result.errors[0] || "Action failed");
  deps.processExit(1);
  return result;
};

const defaultActionDeps: ActionDeps = {
  createLogger,
  handleTestMode,
  handleInitMode,
  resolveJSON,
  buildMergedOptions,
  runSecurityCheck,
  handleSecurityResults,
  createSpinner,
  green,
  quickConfirm,
  update,
  createTerminalGraph,
  getLedgerAddedDate,
  loadConfig,
  loadConfigWithSource,
  get processExit() {
    const exit = process.exit.bind(process);
    return exit;
  },
};

export async function action(
  options: Options = {},
  deps: ActionDeps = defaultActionDeps,
): Promise<PastoralistResult> {
  prepareCache(options);
  const runtime = createActionRuntime(options, deps);
  const earlyResult = await handleEarlyActionResult(options, deps, runtime);
  if (earlyResult) return earlyResult;

  maybeShowBanner(runtime);
  try {
    const result = await runActionWorkflow(options, deps, runtime);
    return result;
  } catch (err) {
    const result2 = handleActionError(err, deps, runtime);
    return result2;
  }
}
