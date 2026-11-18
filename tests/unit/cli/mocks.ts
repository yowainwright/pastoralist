import { mock } from "../setup";
import type { BestCaseResult } from "../../../src/core/best-case";
import type { PastoralistJSON, SecurityAlert } from "../../../src/types";
import { logger as createLogger } from "../../../src/observability";

export const log = createLogger({ file: "test.ts", isLogging: false });

export const createMockSpinner = () => {
  const start = mock(() => spinner);
  const succeed = mock();
  const stop = mock();
  const info = mock();
  const spinner = { start, succeed, stop, info };
  return spinner;
};

const createGraphProgressMocks = (getGraph: () => unknown) => {
  const banner = mock(getGraph);
  const startPhase = mock(getGraph);
  const progress = mock(getGraph);
  const item = mock(getGraph);
  const vulnerability = mock(getGraph);
  const override = mock(getGraph);
  const securityFix = mock(getGraph);
  const methods = { banner, startPhase, progress, item, vulnerability, override, securityFix };
  return methods;
};

const createGraphCompletionMocks = (getGraph: () => unknown) => {
  const removedOverride = mock(getGraph);
  const endPhase = mock(getGraph);
  const summary = mock(getGraph);
  const executiveSummary = mock(getGraph);
  const compactSummary = mock(getGraph);
  const complete = mock(getGraph);
  const methods = {
    removedOverride,
    endPhase,
    summary,
    executiveSummary,
    compactSummary,
    complete,
  };
  return methods;
};

const createGraphLifecycleMocks = (getGraph: () => unknown) => {
  const waitForCompletion = mock(() => Promise.resolve());
  const notice = mock(getGraph);
  const stop = mock(getGraph);
  const methods = { waitForCompletion, notice, stop };
  return methods;
};

export const createMockTerminalGraph = () => {
  const getGraph = () => graph;
  const graph = Object.assign(
    {},
    createGraphProgressMocks(getGraph),
    createGraphCompletionMocks(getGraph),
    createGraphLifecycleMocks(getGraph),
  );
  return graph;
};

export const createMockConfig = (overrides: Partial<PastoralistJSON> = {}): PastoralistJSON =>
  Object.assign(
    {},
    {
      name: "test-package",
      version: "1.0.0",
    },
    overrides,
  );

const normalizeSecurityAlert = (alert: Partial<SecurityAlert>) => {
  const packageName = alert.packageName || "test-pkg";
  const severity = alert.severity || "medium";
  const defaults = { packageName, severity };
  const normalized = Object.assign({}, defaults, alert);
  return normalized;
};

export const createMockSecurityResults = (
  alerts: Partial<SecurityAlert>[] = [],
  bestCase?: BestCaseResult,
) => {
  const spinner = createMockSpinner();
  const securityChecker = {};
  const normalizedAlerts = alerts.map(normalizeSecurityAlert);
  const scan = {
    spinner,
    securityChecker,
    alerts: normalizedAlerts,
  };
  const results = Object.assign(scan, createSecurityMetadata(alerts, bestCase));
  return results;
};

const createSecurityMetadata = (alerts: Partial<SecurityAlert>[], bestCase?: BestCaseResult) => {
  const securityOverrides: unknown[] = [];
  const updates: unknown[] = [];
  const { length: packagesScanned } = alerts;
  const metadata = {
    securityOverrides,
    updates,
    packagesScanned,
    bestCase,
    skipped: false,
  };
  return metadata;
};

export const createMockUpdateContext = (
  overrides: Record<string, string> = {},
  appendix: Record<string, unknown> = {},
) => ({
  finalOverrides: overrides,
  finalAppendix: appendix,
});

export interface ActionDepsOptions {
  config?: PastoralistJSON;
  checkSecurity?: boolean;
  securityResults?: ReturnType<typeof createMockSecurityResults>;
  updateContext?: ReturnType<typeof createMockUpdateContext>;
  spinner?: ReturnType<typeof createMockSpinner>;
}

const loadActionConfig = (_root: string, packageJsonConfig: unknown) =>
  Promise.resolve(packageJsonConfig);

const createActionConfigDeps = (config: PastoralistJSON, checkSecurity: boolean) => {
  const loggerFactory = mock(() => log);
  const handleTestMode = mock(() => false);
  const handleInitMode = mock(() => Promise.resolve(false));
  const resolveJSON = mock(() => config);
  const loadConfig = mock(loadActionConfig);
  const buildMergedOptions = mock((opts: unknown, rest: unknown) =>
    Object.assign({}, opts, rest, { checkSecurity }),
  );
  const deps = {
    createLogger: loggerFactory,
    handleTestMode,
    handleInitMode,
    resolveJSON,
    loadConfig,
    buildMergedOptions,
  };
  return deps;
};

const createActionSecurityDeps = (options: ActionDepsOptions) => {
  const securityResults = options.securityResults ?? createMockSecurityResults();
  const spinner = options.spinner ?? createMockSpinner();
  const runSecurityCheck = mock(() => Promise.resolve(securityResults));
  const handleSecurityResults = mock(() => {});
  const createSpinner = mock(() => spinner);
  const deps = { runSecurityCheck, handleSecurityResults, createSpinner };
  return deps;
};

const createActionOutputDeps = (updateContext: ReturnType<typeof createMockUpdateContext>) => {
  const green = mock((text: string) => text);
  const quickConfirm = mock(() => Promise.resolve(true));
  const update = mock(() => updateContext);
  const createTerminalGraph = mock(() => createMockTerminalGraph());
  const getLedgerAddedDate = mock(() => new Date().toISOString());
  const processExit = mock(() => {});
  const deps = {
    green,
    quickConfirm,
    update,
    createTerminalGraph,
    getLedgerAddedDate,
    processExit,
  };
  return deps;
};

export const createActionDeps = (options: ActionDepsOptions = {}) => {
  const config = options.config ?? createMockConfig();
  const checkSecurity = options.checkSecurity ?? false;
  const updateContext = options.updateContext ?? createMockUpdateContext();
  const configDeps = createActionConfigDeps(config, checkSecurity);
  const securityDeps = createActionSecurityDeps(options);
  const outputDeps = createActionOutputDeps(updateContext);
  const deps = Object.assign({}, configDeps, securityDeps, outputDeps);
  return deps;
};

export const captureConsoleOutput = () => {
  const output: string[] = [];
  const { log: originalLog } = console;

  const capture = {
    start: () => {
      console.log = (msg: string) => {
        output[output.length] = msg;
      };
    },
    stop: () => {
      console.log = originalLog;
    },
    getOutput: () => output,
  };
  return capture;
};
