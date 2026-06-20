import { loadConfig } from "../config";
import { IS_DEBUGGING } from "../constants";
import { resolveJSON } from "../core/packageJSON";
import { update } from "../core/update";
import { createTerminalGraph } from "../dx";
import type { Options, PastoralistResult } from "../types";
import {
  createSpinner,
  green,
  logger as createLogger,
  pruneBackups,
  resolveCacheDir,
} from "../utils";
import { getOverrideGitDate } from "../utils/git";
import { initCommand } from "./cmds/init/index";
import { loadCliConfig } from "./config";
import { displaySummaryTable, renderUpdateOutput } from "./display";
import { buildUpdateResult, createEmptyResult, createErrorResult, outputResult } from "./results";
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

export const handleInitMode = async (
  init: boolean,
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  deps: Pick<RunDeps, "initCommand"> = { initCommand },
): Promise<boolean> => {
  if (!init) return false;
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
};

const createActionRuntime = (options: Options, deps: RuntimeDeps): ActionRuntime => {
  const isLogging = Boolean(IS_DEBUGGING || options.debug);
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

const outputEarlyResult = (runtime: ActionRuntime): PastoralistResult => {
  outputResult(runtime.emptyResult, runtime.isJsonOutput);
  return runtime.emptyResult;
};

const handleEarlyActionResult = async (
  options: Options,
  deps: EarlyActionDeps,
  runtime: ActionRuntime,
): Promise<PastoralistResult | undefined> => {
  if (deps.handleTestMode(runtime.isTestingCLI, runtime.log, options)) {
    return outputEarlyResult(runtime);
  }

  if (await deps.handleInitMode(runtime.init, options, runtime.rest)) {
    return outputEarlyResult(runtime);
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

const addGitDateToOptions = async (
  path: string,
  mergedOptions: Options,
  deps: Pick<UpdateWorkflowDeps, "getOverrideGitDate">,
): Promise<Options> => {
  const addedDate = await deps.getOverrideGitDate(path);
  return Object.assign({}, mergedOptions, { addedDate });
};

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
  runtime: ActionRuntime,
): Promise<UpdateWorkflow> => {
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

  return Object.assign(
    {},
    loadedConfig,
    {
      mergedOptions,
      securityPhase,
    },
    updateResult,
  );
};

const buildActionResult = (runtime: ActionRuntime, workflow: UpdateWorkflow): PastoralistResult =>
  Object.assign(
    {},
    runtime.emptyResult,
    workflow.securityPhase.securityResult,
    workflow.updateResultData,
    {
      removalSafetyComparison: workflow.mergedOptions.removalSafetyComparison,
      metrics: workflow.updateContext.metrics,
    },
  );

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

const renderActionOutput = (
  workflow: UpdateWorkflow,
  runtime: ActionRuntime,
  options: Options,
): void => {
  if (runtime.isJsonOutput) return;
  renderUpdateOutput(
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
  renderActionOutput(workflow, runtime, options);
  return finishActionResult(buildActionResult(runtime, workflow), deps, runtime, options);
};

const handleActionError = (
  error: unknown,
  deps: { processExit: (code: number) => void },
  runtime: ActionRuntime,
): PastoralistResult => {
  runtime.graph.stop();
  const result = createErrorResult(error);
  if (runtime.isJsonOutput) outputResult(result, runtime.isJsonOutput);
  else runtime.log.error("action:fn", "action", { error });
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
  update,
  createTerminalGraph,
  getOverrideGitDate,
  loadConfig,
  processExit: (code: number) => process.exit(code),
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
    return await runActionWorkflow(options, deps, runtime);
  } catch (err) {
    return handleActionError(err, deps, runtime);
  }
}
