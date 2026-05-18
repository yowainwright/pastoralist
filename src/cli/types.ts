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
import type { initCommand } from "./cmds/init";
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

export type SecurityPhaseDeps = {
  runSecurityCheck: typeof runSecurityCheck;
  handleSecurityResults: typeof handleSecurityResults;
};

export type CliAction = (options?: Options) => Promise<PastoralistResult>;

export type RunDeps = {
  initCommand: typeof initCommand;
  action: CliAction;
};
