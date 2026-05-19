import type { update } from "../core/update";
import type { PastoralistJSON, PastoralistResult, SecurityAlert } from "../types";

export const createEmptyResult = (): PastoralistResult => ({
  success: true,
  hasSecurityIssues: false,
  hasUnusedOverrides: false,
  updated: false,
  securityAlertCount: 0,
  unusedOverrideCount: 0,
  overrideCount: 0,
  errors: [],
  securityAlerts: [],
  unusedOverrides: [],
  appliedOverrides: {},
});

export const createErrorResult = (error: unknown): PastoralistResult => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return Object.assign({}, createEmptyResult(), {
    success: false,
    errors: [errorMessage],
  });
};

export const buildSecurityResult = (
  alerts: SecurityAlert[],
): Pick<PastoralistResult, "hasSecurityIssues" | "securityAlertCount" | "securityAlerts"> => ({
  hasSecurityIssues: alerts.length > 0,
  securityAlertCount: alerts.length,
  securityAlerts: alerts.map((alert) => ({
    packageName: alert.packageName,
    severity: alert.severity || "unknown",
    cves: alert.cves,
    description: alert.description,
    patchedVersion: alert.patchedVersion,
    fixAvailable: alert.fixAvailable,
  })),
});

const getAppliedOverrides = (finalOverrides: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(
    Object.keys(finalOverrides)
      .filter((key) => typeof finalOverrides[key] === "string")
      .map((key) => [key, finalOverrides[key] as string]),
  );

const hasUpdateChanges = (
  updateResult: ReturnType<typeof update>,
  config: PastoralistJSON | undefined,
): boolean => {
  const previousAppendix = config?.pastoralist?.appendix || {};
  const previousOverrides =
    config?.overrides || config?.resolutions || config?.pnpm?.overrides || {};
  const appendixChanged =
    JSON.stringify(updateResult.finalAppendix || {}) !== JSON.stringify(previousAppendix);
  const overridesChanged =
    JSON.stringify(updateResult.finalOverrides || {}) !== JSON.stringify(previousOverrides);
  return appendixChanged || overridesChanged;
};

export const buildUpdateResult = (
  updateResult: ReturnType<typeof update>,
  config: PastoralistJSON | undefined,
  isDryRun: boolean,
): Pick<PastoralistResult, "overrideCount" | "appliedOverrides" | "updated"> => {
  const finalOverrides = updateResult.finalOverrides || {};
  const overrideKeys = Object.keys(finalOverrides);
  const hasChanges = hasUpdateChanges(updateResult, config);
  const updated = hasChanges && !isDryRun;

  return {
    overrideCount: overrideKeys.length,
    appliedOverrides: getAppliedOverrides(finalOverrides),
    updated,
  };
};

export const outputResult = (result: PastoralistResult, isJsonOutput: boolean): void => {
  if (isJsonOutput) {
    console.log(JSON.stringify(result));
  }
};
