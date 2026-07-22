import { isAbsolute, resolve } from "path";
import type { update } from "../core/update";
import { findUnusedAppendixEntries } from "../core/appendix/utils";
import type { PastoralistJSON, PastoralistResult, SecurityAlert } from "../types";
import { logger as createLogger } from "../utils";

const BINARY_NAME = "pastoralist";
const SCRIPT_EXTENSIONS = [".cjs", ".js", ".mjs", ".ts", ".tsx"];
const log = createLogger({ file: "cli/utils.ts" });

const isScriptPath = (value: string | undefined): boolean => {
  if (!value) return false;
  const hasPathSegment = value.includes("/") || value.includes("\\");
  return hasPathSegment || SCRIPT_EXTENSIONS.some((extension) => value.endsWith(extension));
};

const normalizeArgv = (argv: readonly string[]): string[] => {
  const executable = argv[0] || BINARY_NAME;
  const secondArg = argv[1];
  if (secondArg === executable) return [executable, BINARY_NAME].concat(argv.slice(2));
  if (!isScriptPath(secondArg)) return [executable, BINARY_NAME].concat(argv.slice(1));
  return Array.from(argv);
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const runBinary = async (
  version: string,
  run: (argv: string[]) => Promise<void>,
): Promise<void> => {
  const argv = normalizeArgv(process.argv);
  const isVersion = argv.slice(2).some((arg) => arg === "-v" || arg === "--version");
  if (isVersion) return log.print(version);
  await run(argv);
};

export const runBinaryEntry = async (
  version: string,
  run: (argv: string[]) => Promise<void>,
): Promise<void> => {
  const keepAlive = setInterval(() => undefined, 1_000);
  try {
    await runBinary(version, run);
  } catch (error) {
    log.fail(getErrorMessage(error));
    clearInterval(keepAlive);
    process.exit(1);
  }
  clearInterval(keepAlive);
  process.exit(process.exitCode ?? 0);
};

export const resolvePathFromRoot = (path: string, root?: string): string => {
  const shouldResolveFromRoot = root && !isAbsolute(path);
  if (shouldResolveFromRoot) return resolve(root, path);
  return path;
};

export const pluralSuffix = (count: number): string => {
  if (count === 1) return "";
  return "s";
};

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
): Pick<
  PastoralistResult,
  | "appliedOverrides"
  | "hasUnusedOverrides"
  | "overrideCount"
  | "unusedOverrideCount"
  | "unusedOverrides"
  | "updated"
> => {
  const finalOverrides = updateResult.finalOverrides || {};
  const finalAppendix = updateResult.finalAppendix || {};
  const overrideKeys = Object.keys(finalOverrides);
  const unusedOverrides = findUnusedAppendixEntries(finalAppendix, updateResult.rootDeps);
  const hasChanges = hasUpdateChanges(updateResult, config);
  const updated = hasChanges && !isDryRun;

  return {
    overrideCount: overrideKeys.length,
    appliedOverrides: getAppliedOverrides(finalOverrides),
    hasUnusedOverrides: unusedOverrides.length > 0,
    unusedOverrideCount: unusedOverrides.length,
    unusedOverrides,
    updated,
  };
};

export const outputResult = (result: PastoralistResult, isJsonOutput: boolean): void => {
  if (isJsonOutput) log.print(JSON.stringify(result));
};
