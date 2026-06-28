import type {
  AppendixItem,
  Options,
  PastoralistJSON,
  PastoralistResult,
  SecurityOverrideDetail,
} from "../types";
import type { update } from "../core/update";
import type { createTerminalGraph } from "../dx";
import type { resolveJSON } from "../core/packageJSON";
import type { loadConfig } from "../config";
import type { getOverrideGitDate } from "../utils/git";
import type { createSpinner, green, logger as createLogger, quickConfirm } from "../utils";
import type { initCommand } from "./cmds/init";
import type { showOnboarding } from "./onboarding";
import type { buildMergedOptions, handleSecurityResults, runSecurityCheck } from "./security";

export type SecurityConfig = NonNullable<NonNullable<PastoralistJSON["pastoralist"]>["security"]>;

export type SecurityProviderOption = Options["securityProvider"];

export type OptionalSecurityOverrideDetail = Omit<SecurityOverrideDetail, "packageName" | "reason">;

export type OverrideDisplayContext = {
  finalOverrides: Record<string, unknown>;
  finalAppendix: Record<string, AppendixItem>;
};

export type MetricsKey = keyof NonNullable<PastoralistResult["metrics"]>;
export type SpecialSummaryKey = "total" | "writeStatus" | "severityHeader";

export type SummaryRowConfig = {
  label: string;
  key: MetricsKey | SpecialSummaryKey;
};

export type TableColor = "green" | "yellow" | "red" | "cyan" | "gray";

export type CliGraph = ReturnType<typeof createTerminalGraph>;

export type SecurityResultSummary = Pick<
  PastoralistResult,
  "hasSecurityIssues" | "securityAlertCount" | "securityAlerts"
>;

export type UpdateResultData = Pick<
  PastoralistResult,
  "overrideCount" | "appliedOverrides" | "updated"
>;

export type UpdateContext = ReturnType<typeof update>;

export type LoadedCliConfig = {
  path: string;
  config: PastoralistJSON;
  mergedOptions: Options;
};

export type SecurityPhaseResult = {
  mergedOptions: Options;
  securityResult: SecurityResultSummary;
  packagesScanned: number;
};

export type CliConfigDeps = {
  resolveJSON: typeof resolveJSON;
  buildMergedOptions: typeof buildMergedOptions;
  loadConfig?: typeof loadConfig;
};

export type RuntimeDeps = {
  createLogger: typeof createLogger;
  createTerminalGraph: typeof createTerminalGraph;
};

export type HandleTestMode = (
  isTestingCLI: boolean,
  log: ReturnType<typeof createLogger>,
  options: Options,
) => boolean;

export type HandleInitMode = (
  init: boolean,
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  deps?: Pick<RunDeps, "initCommand">,
) => Promise<boolean>;

export type EarlyActionDeps = {
  handleTestMode: HandleTestMode;
  handleInitMode: HandleInitMode;
};

export type UpdateWorkflowDeps = CliConfigDeps & {
  getOverrideGitDate: typeof getOverrideGitDate;
  update: typeof update;
  runSecurityCheck: typeof runSecurityCheck;
  handleSecurityResults: typeof handleSecurityResults;
  quickConfirm: typeof quickConfirm;
};

export type ActionWorkflowDeps = UpdateWorkflowDeps & {
  processExit: (code: number) => void;
};

export type ActionDeps = ActionWorkflowDeps &
  EarlyActionDeps &
  RuntimeDeps & {
    createSpinner: typeof createSpinner;
    green: typeof green;
    quickConfirm: typeof quickConfirm;
  };

export type InitSecurityProvider = NonNullable<
  Parameters<typeof initCommand>[0]
>["securityProvider"];

export type ActionRuntime = {
  emptyResult: PastoralistResult;
  graph: CliGraph;
  init: boolean;
  isJsonOutput: boolean;
  isLogging: boolean;
  isQuietMode: boolean;
  isTestingCLI: boolean;
  log: ReturnType<typeof createLogger>;
  rest: Omit<Options, "isTestingCLI" | "init">;
};

export type UpdateWorkflow = LoadedCliConfig & {
  mergedOptions: Options;
  securityPhase: SecurityPhaseResult;
  updateContext: UpdateContext;
  updateResultData: UpdateResultData;
};

export type SecurityPhaseDeps = {
  runSecurityCheck: typeof runSecurityCheck;
  handleSecurityResults: typeof handleSecurityResults;
  quickConfirm: typeof quickConfirm;
};

export type CliAction = (options?: Options, deps?: ActionDeps) => Promise<PastoralistResult>;

export type RunDeps = {
  initCommand: typeof initCommand;
  action: CliAction;
  showOnboarding?: typeof showOnboarding;
};
