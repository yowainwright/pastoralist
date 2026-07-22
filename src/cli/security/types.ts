import type {
  Options,
  PastoralistJSON,
  PastoralistResult,
  SecurityOverrideDetail,
} from "../../types";

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
};
