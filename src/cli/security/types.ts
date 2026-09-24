import type {
  Options,
  PastoralistJSON,
  PastoralistResult,
  RemovalVerification,
  SecurityAlert,
  SecurityOverride,
  OverrideUpdate,
  SecurityOverrideDetail,
} from "../../types";
import type { SecurityChecker } from "../../core/security";
import type { OverrideSource } from "../../core/overrides";
import type { createSpinner } from "../../dx";
import type { green, yellow } from "../../dx/utils";
import type { logger } from "../../observability";
import type { CliGraph, SecurityPhaseDeps } from "../types";
import type { determineSecurityScanPaths } from "./index";

export type SecurityCheckDeps = {
  createSpinner: typeof createSpinner;
  SecurityChecker: typeof SecurityChecker;
  determineSecurityScanPaths: typeof determineSecurityScanPaths;
  green: typeof green;
  yellow: typeof yellow;
};

export type SecurityScanContext = {
  isLogging: boolean;
  log: ReturnType<typeof logger>;
  spinner: ReturnType<typeof createSpinner>;
  deps: SecurityCheckDeps;
};

export type SecurityCheckArgs = [
  config: PastoralistJSON,
  mergedOptions: Options,
  isLogging: boolean,
  log: ReturnType<typeof logger>,
  deps?: SecurityCheckDeps,
];

export type SecurityResultsArgs = [
  alerts: SecurityAlert[],
  securityOverrides: SecurityOverride[],
  securityChecker: SecurityChecker,
  spinner: ReturnType<typeof createSpinner>,
  mergedOptions: Options,
  updates?: OverrideUpdate[],
  hasBestCaseResult?: boolean,
];

export type SecurityPhaseContext = {
  graph: CliGraph;
  isJsonOutput: boolean;
  isLogging: boolean;
  log: ReturnType<typeof logger>;
};

export type SecurityPhaseArgs = [
  graph: CliGraph,
  config: PastoralistJSON,
  mergedOptions: Options,
  isJsonOutput: boolean,
  isLogging: boolean,
  log: ReturnType<typeof logger>,
  deps: SecurityPhaseDeps,
];

export type RemovalMetrics = Pick<
  RemovalVerification,
  | "beforeAlertCount"
  | "afterAlertCount"
  | "beforeRiskScore"
  | "afterRiskScore"
  | "newVulnerabilityKeys"
>;

export type RemovalState = {
  allowedKeys: string[];
  blockedKeys: string[];
  afterAlerts: SecurityAlert[];
  blockedReasons: Array<{ key: string; reason: string }>;
};

export type RemovalContext = {
  config: PastoralistJSON;
  source: OverrideSource;
  securityChecker: SecurityChecker;
  options: Options;
  beforeAlerts: SecurityAlert[];
};

export type SecurityConfig = NonNullable<NonNullable<PastoralistJSON["pastoralist"]>["security"]>;

export type SecurityProviderOption = Options["securityProvider"];

export type OptionalSecurityOverrideDetail = Omit<SecurityOverrideDetail, "packageName" | "reason">;

export type SecurityResultSummary = Pick<
  PastoralistResult,
  "hasSecurityIssues" | "securityAlertCount" | "securityAlerts"
>;

export type SecurityPhaseResult = {
  mergedOptions: Options;
  securityResult: SecurityResultSummary;
  packagesScanned: number;
  bestCase?: PastoralistResult["bestCase"];
};
