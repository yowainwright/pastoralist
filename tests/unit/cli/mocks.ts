import { mock } from "bun:test";
import type { PastoralistJSON, SecurityAlert } from "../../../src/types";
import { logger as createLogger } from "../../../src/utils";

export const log = createLogger({ file: "test.ts", isLogging: false });

export const createMockSpinner = () => {
  const spinner = {
    start: mock(() => spinner),
    succeed: mock(),
    stop: mock(),
    info: mock(),
  };
  return spinner;
};

export const createMockTerminalGraph = () => {
  const graph = {
    banner: mock(() => graph),
    startPhase: mock(() => graph),
    progress: mock(() => graph),
    item: mock(() => graph),
    vulnerability: mock(() => graph),
    override: mock(() => graph),
    securityFix: mock(() => graph),
    removedOverride: mock(() => graph),
    endPhase: mock(() => graph),
    summary: mock(() => graph),
    complete: mock(() => graph),
    notice: mock(() => graph),
    stop: mock(() => graph),
  };
  return graph;
};

export const createMockConfig = (
  overrides: Partial<PastoralistJSON> = {},
): PastoralistJSON => ({
  name: "test-package",
  version: "1.0.0",
  ...overrides,
});

export const createMockSecurityResults = (
  alerts: Partial<SecurityAlert>[] = [],
) => ({
  spinner: createMockSpinner(),
  securityChecker: {},
  alerts: alerts.map((a) => ({
    packageName: a.packageName || "test-pkg",
    severity: a.severity || "medium",
    ...a,
  })),
  securityOverrides: [],
  updates: [],
});

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

export const createActionDeps = (options: ActionDepsOptions = {}) => {
  const {
    config = createMockConfig(),
    checkSecurity = false,
    securityResults = createMockSecurityResults(),
    updateContext = createMockUpdateContext(),
    spinner = createMockSpinner(),
  } = options;

  return {
    createLogger: mock(() => log),
    handleTestMode: mock(() => false),
    handleInitMode: mock(() => Promise.resolve(false)),
    resolveJSON: mock(() => Promise.resolve(config)),
    buildMergedOptions: mock((opts: unknown, rest: unknown) =>
      Object.assign({}, opts, rest, { checkSecurity }),
    ),
    runSecurityCheck: mock(() => Promise.resolve(securityResults)),
    handleSecurityResults: mock(() => {}),
    createSpinner: mock(() => spinner),
    green: mock((text: string) => text),
    update: mock(() => updateContext),
    createTerminalGraph: mock(() => createMockTerminalGraph()),
    processExit: mock(() => {}),
  };
};

export const captureConsoleOutput = () => {
  const output: string[] = [];
  const originalLog = console.log;

  return {
    start: () => {
      console.log = (msg: string) => output.push(msg);
    },
    stop: () => {
      console.log = originalLog;
    },
    getOutput: () => output,
  };
};
