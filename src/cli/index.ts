#!/usr/bin/env node

import { parseArgs, showHelp } from "./parser";
import {
  createSpinner,
  green,
  yellow,
  resolveCacheDir,
  pruneBackups,
} from "../utils";
import {
  Options,
  PastoralistJSON,
  PastoralistResult,
  SecurityAlert,
  SecurityOverride,
  SecurityOverrideDetail,
  SecurityProviderPermissionError,
} from "../types";
import { update } from "../core/update";
import { logger as createLogger } from "../utils";
import { resolveJSON } from "../core/packageJSON";
import { IS_DEBUGGING, FARMER, MSG_SCANNING, SHEEP } from "../constants";
import { SecurityChecker } from "../core/security";
import { initCommand } from "./cmds/init/index";
import { renderTable, createTerminalGraph } from "../dx";
import { getOverrideGitDate } from "../utils/git";
import {
  findUnusedAppendixEntries,
  extractPackageNames,
} from "../core/appendix/utils";
import * as fs from "fs";
import { resolve } from "path";

const logger = createLogger({ file: "program.ts", isLogging: false });

export const handleSetupHook = (
  options: Options,
  log: ReturnType<typeof createLogger>,
  deps = {
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
    resolve,
  },
): boolean => {
  const shouldSetup = options.setupHook === true;
  if (!shouldSetup) return false;

  const packagePath = deps.resolve(options.path || "package.json");

  try {
    const content = deps.readFileSync(packagePath, "utf8");
    const config = JSON.parse(content) as PastoralistJSON & {
      scripts?: Record<string, string>;
    };

    const scripts = config.scripts || {};
    const existingPostinstall = scripts.postinstall || "";
    const hasPastoralist = existingPostinstall.includes("pastoralist");

    if (hasPastoralist) {
      log.print("postinstall hook already configured");
      return true;
    }

    const newPostinstall = existingPostinstall
      ? `${existingPostinstall} && pastoralist`
      : "pastoralist";

    const updatedConfig = {
      ...config,
      scripts: {
        ...scripts,
        postinstall: newPostinstall,
      },
    };

    const jsonString = JSON.stringify(updatedConfig, null, 2) + "\n";
    deps.writeFileSync(packagePath, jsonString);

    log.print("added postinstall hook to package.json");
    return true;
  } catch (err) {
    log.error("Failed to setup hook", "handleSetupHook", err);
    return false;
  }
};

export const handleTestMode = (
  isTestingCLI: boolean,
  log: ReturnType<typeof createLogger>,
  options: Options,
): boolean => {
  if (isTestingCLI) {
    log.debug("action:options:", "action", { options });
    return true;
  }
  return false;
};

export const handleInitMode = async (
  init: boolean,
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  deps = { initCommand },
): Promise<boolean> => {
  if (init) {
    await deps.initCommand({
      path: options.path,
      root: options.root,
      checkSecurity: rest.checkSecurity,
      securityProvider: rest.securityProvider,
      hasWorkspaceSecurityChecks: rest.hasWorkspaceSecurityChecks,
    });
    return true;
  }
  return false;
};

type SecurityConfig = NonNullable<
  NonNullable<PastoralistJSON["pastoralist"]>["security"]
>;
type SecurityProviderOption = Options["securityProvider"];

export const buildMergedOptions = (
  options: Options,
  rest: Omit<Options, "isTestingCLI" | "init">,
  securityConfig: Partial<SecurityConfig>,
  configProvider: SecurityProviderOption,
): Options => {
  const providerFromOptions = options.securityProvider ?? configProvider;
  const securityProvider = providerFromOptions ?? "osv";

  return {
    ...rest,
    checkSecurity: options.checkSecurity ?? securityConfig.enabled,
    forceSecurityRefactor:
      options.forceSecurityRefactor ?? securityConfig.autoFix,
    securityProvider,
    securityProviderToken:
      options.securityProviderToken ?? securityConfig.securityProviderToken,
    interactive: options.interactive ?? securityConfig.interactive,
    hasWorkspaceSecurityChecks:
      options.hasWorkspaceSecurityChecks ??
      securityConfig.hasWorkspaceSecurityChecks,
  };
};

type OptionalDetail = Omit<SecurityOverrideDetail, "packageName" | "reason">;

export const buildSecurityOverrideDetail = (
  override: SecurityOverride,
): SecurityOverrideDetail => {
  const optionalEntries: [keyof OptionalDetail, unknown][] = [
    ["cves", override.cves?.length ? override.cves : undefined],
    ["severity", override.severity],
    ["description", override.description],
    ["url", override.url],
    ["vulnerableRange", override.vulnerableRange],
    ["patchedVersion", override.patchedVersion],
  ];

  const optionalFields = optionalEntries
    .filter(([, value]) => value !== undefined)
    .reduce<
      Partial<OptionalDetail>
    >((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  return {
    packageName: override.packageName,
    reason: override.reason,
    ...optionalFields,
  };
};

export const runSecurityCheck = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  isLogging: boolean,
  log: ReturnType<typeof createLogger>,
  deps = {
    createSpinner,
    SecurityChecker,
    determineSecurityScanPaths,
    green,
    yellow,
  },
) => {
  const spinner = deps.createSpinner(MSG_SCANNING).start();

  try {
    const securityChecker = new deps.SecurityChecker({
      provider: mergedOptions.securityProvider,
      forceRefactor: mergedOptions.forceSecurityRefactor,
      interactive: mergedOptions.interactive,
      token: mergedOptions.securityProviderToken,
      debug: isLogging,
      cacheDir: mergedOptions.cacheDir,
      noCache: mergedOptions.noCache,
      refreshCache: mergedOptions.refreshCache,
    });

    const scanPaths = deps.determineSecurityScanPaths(
      config,
      mergedOptions,
      log,
    );

    const onProgress = (progress: { message: string }) => {
      spinner.update(progress.message);
    };

    const {
      alerts,
      overrides: securityOverrides,
      updates,
      packagesScanned,
    } = await securityChecker.checkSecurity(config, {
      ...mergedOptions,
      depPaths: scanPaths,
      root: mergedOptions.root || "./",
      onProgress,
      severityThreshold: config?.pastoralist?.security?.severityThreshold,
      excludePackages: config?.pastoralist?.security?.excludePackages,
    });

    return {
      spinner,
      securityChecker,
      alerts,
      securityOverrides,
      updates,
      packagesScanned,
    };
  } catch (error) {
    const isPermissionError = error instanceof SecurityProviderPermissionError;
    if (isPermissionError) {
      spinner.warn(`${deps.yellow(`pastoralist`)} ${error.message}`);
      const securityChecker = new deps.SecurityChecker({
        provider: mergedOptions.securityProvider,
        forceRefactor: mergedOptions.forceSecurityRefactor,
        interactive: mergedOptions.interactive,
        token: mergedOptions.securityProviderToken,
        debug: isLogging,
      });
      return {
        spinner,
        securityChecker,
        alerts: [],
        securityOverrides: [],
        updates: [],
        packagesScanned: 0,
        skipped: true,
      };
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    spinner.fail(
      `${deps.yellow(`pastoralist`)} security check failed: ${errorMessage}`,
    );
    throw error;
  }
};

export const handleSecurityResults = (
  alerts: SecurityAlert[],
  securityOverrides: SecurityOverride[],
  securityChecker: SecurityChecker,
  spinner: ReturnType<typeof createSpinner>,
  mergedOptions: Options,
  updates: import("../types").OverrideUpdate[] = [],
): Pick<Options, "securityOverrides" | "securityOverrideDetails"> => {
  const hasAlerts = alerts.length > 0;
  const hasUpdates = updates.length > 0;
  const shouldApplySecurityFixes =
    mergedOptions.forceSecurityRefactor || mergedOptions.interactive;
  const shouldGenerateOverrides = hasAlerts && shouldApplySecurityFixes;
  const shouldApplyUpdates = hasUpdates && shouldApplySecurityFixes;

  const updateOverrides = shouldApplyUpdates
    ? updates.map((update) => ({
        packageName: update.packageName,
        fromVersion: update.currentOverride,
        toVersion: update.newerVersion,
        reason: update.reason,
        severity: "medium" as const,
      }))
    : [];
  const allOverrides = [...securityOverrides, ...updateOverrides];

  if (shouldGenerateOverrides || shouldApplyUpdates) {
    const finalOverrides =
      securityChecker.generatePackageOverrides(allOverrides);

    const overridesToApply = allOverrides.filter((override) => {
      const finalVersion = finalOverrides[override.packageName];
      const isStringMatch =
        typeof finalVersion === "string" && finalVersion === override.toVersion;
      return isStringMatch;
    });

    const securityOverrideDetails = overridesToApply.map(
      buildSecurityOverrideDetail,
    );

    const shouldAutoFix =
      (shouldGenerateOverrides || shouldApplyUpdates) &&
      overridesToApply.length > 0;
    if (shouldAutoFix) {
      securityChecker.applyAutoFix(overridesToApply, mergedOptions.path);
    }

    spinner.stop();
    return { securityOverrides: finalOverrides, securityOverrideDetails };
  }

  spinner.stop();
  return {};
};

export const formatUpdateReport = (
  updates: import("../types").OverrideUpdate[],
): string => {
  const header = "\nSecurity Override Updates\n" + "=".repeat(50) + "\n\n";
  const summary = `Found ${updates.length} existing override(s) with newer patches available:\n\n`;
  const updateList = updates
    .map(
      (update) =>
        `[UPDATE] ${update.packageName}\n` +
        `   Current override: ${update.currentOverride}\n` +
        `   Newer patch: ${update.newerVersion}\n` +
        `   ${update.reason}\n\n`,
    )
    .join("");
  return header + summary + updateList;
};

export function determineSecurityScanPaths(
  config: PastoralistJSON | undefined,
  mergedOptions: Options,
  log: ReturnType<typeof createLogger> = logger,
): string[] {
  const configDepPaths = config?.pastoralist?.depPaths;
  const isArray = Array.isArray(configDepPaths);
  const workspaces = config?.workspaces || [];
  const hasWorkspaces = workspaces.length > 0;
  const isWorkspaceString = configDepPaths === "workspace";
  const hasWorkspaceSecurityChecks =
    mergedOptions.hasWorkspaceSecurityChecks || false;
  const hasSecurityEnabled =
    mergedOptions.checkSecurity || config?.pastoralist?.checkSecurity || false;
  const isArrayDepPaths = isArray && hasSecurityEnabled;
  const shouldUseWorkspaceConfig =
    isWorkspaceString && hasWorkspaces && hasSecurityEnabled;
  const shouldUseExplicitWorkspaceChecks =
    hasWorkspaceSecurityChecks && hasWorkspaces;
  const shouldScanWorkspaces =
    shouldUseWorkspaceConfig || shouldUseExplicitWorkspaceChecks;

  if (isArrayDepPaths) {
    log.debug(
      `Using depPaths configuration for security checks: ${configDepPaths.join(", ")}`,
      "determineSecurityScanPaths",
    );
    return configDepPaths;
  }

  if (shouldScanWorkspaces) {
    log.debug(
      `Using workspace configuration for security checks: ${workspaces.join(", ")}`,
      "determineSecurityScanPaths",
    );
    return workspaces.map((ws: string) => `${ws}/package.json`);
  }

  return [];
}

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
  return {
    ...createEmptyResult(),
    success: false,
    errors: [errorMessage],
  };
};

export const buildSecurityResult = (
  alerts: SecurityAlert[],
): Pick<
  PastoralistResult,
  "hasSecurityIssues" | "securityAlertCount" | "securityAlerts"
> => ({
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

export const buildUpdateResult = (
  updateResult: ReturnType<typeof update>,
  config: PastoralistJSON | undefined,
  isDryRun: boolean,
): Pick<
  PastoralistResult,
  "overrideCount" | "appliedOverrides" | "updated"
> => {
  const finalOverrides = updateResult.finalOverrides || {};
  const finalAppendix = updateResult.finalAppendix || {};
  const overrideKeys = Object.keys(finalOverrides);

  const appliedOverrides = Object.fromEntries(
    overrideKeys
      .filter((key) => typeof finalOverrides[key] === "string")
      .map((key) => [key, finalOverrides[key] as string]),
  );

  const previousAppendix = config?.pastoralist?.appendix || {};
  const previousOverrides =
    config?.overrides || config?.resolutions || config?.pnpm?.overrides || {};
  const hasChanges =
    JSON.stringify(finalAppendix) !== JSON.stringify(previousAppendix) ||
    JSON.stringify(finalOverrides) !== JSON.stringify(previousOverrides);

  return {
    overrideCount: overrideKeys.length,
    appliedOverrides,
    updated: hasChanges && !isDryRun,
  };
};

export const outputResult = (
  result: PastoralistResult,
  isJsonOutput: boolean,
): void => {
  if (isJsonOutput) {
    console.log(JSON.stringify(result));
  }
};

type OverrideDisplayContext = {
  finalOverrides: Record<string, unknown>;
  finalAppendix: Record<string, import("../types").AppendixItem>;
};

const buildOverrideInfo = (
  pkg: string,
  version: string,
  appendixEntry: import("../types").AppendixItem | undefined,
): import("../dx/types").OverrideInfo => ({
  packageName: pkg,
  version,
  reason: appendixEntry?.ledger?.reason,
  dependents: appendixEntry?.dependents,
  patches: appendixEntry?.patches,
  isSecurityFix: appendixEntry?.ledger?.securityChecked,
  cves: appendixEntry?.ledger?.cves,
  keep: appendixEntry?.ledger?.keep,
  potentiallyFixedIn: appendixEntry?.ledger?.potentiallyFixedIn,
});

const toOverrideEntry = (
  pkg: string,
  ctx: OverrideDisplayContext,
): { pkg: string; version: string } | null => {
  const version = ctx.finalOverrides[pkg];
  const isStringVersion = typeof version === "string";
  if (!isStringVersion) return null;
  return { pkg, version };
};

const toOverrideInfo = (
  entry: { pkg: string; version: string },
  ctx: OverrideDisplayContext,
): import("../dx/types").OverrideInfo => {
  const appendixKey = `${entry.pkg}@${entry.version}`;
  const appendixEntry = ctx.finalAppendix[appendixKey];
  return buildOverrideInfo(entry.pkg, entry.version, appendixEntry);
};

export const displayOverrides = (
  graph: ReturnType<typeof createTerminalGraph>,
  ctx: OverrideDisplayContext,
): void => {
  Object.keys(ctx.finalOverrides)
    .map((pkg) => toOverrideEntry(pkg, ctx))
    .filter(
      (entry): entry is { pkg: string; version: string } => entry !== null,
    )
    .map((entry) => toOverrideInfo(entry, ctx))
    .forEach((info) => graph.override(info, false));
};

type MetricsKey = keyof NonNullable<PastoralistResult["metrics"]>;
type SpecialKey = "total" | "writeStatus" | "severityHeader";
type RowConfig = { label: string; key: MetricsKey | SpecialKey };

const SUMMARY_ROW_CONFIG: RowConfig[] = [
  { label: "Packages scanned", key: "total" },
  { label: "Appendix entries updated", key: "appendixEntriesUpdated" },
  { label: "Vulnerabilities blocked", key: "vulnerabilitiesBlocked" },
  { label: "Overrides added", key: "overridesAdded" },
  { label: "Overrides removed", key: "overridesRemoved" },
  { label: "By severity:", key: "severityHeader" },
  { label: "  Critical", key: "severityCritical" },
  { label: "  High", key: "severityHigh" },
  { label: "  Medium", key: "severityMedium" },
  { label: "  Low", key: "severityLow" },
  { label: "Write status", key: "writeStatus" },
];

const getRowValue = (
  metrics: NonNullable<PastoralistResult["metrics"]>,
  key: RowConfig["key"],
): string | number => {
  if (key === "total") return metrics.packagesScanned;
  if (key === "severityHeader") return "";
  if (key === "writeStatus") {
    return metrics.writeSuccess ? "Success" : "Skipped";
  }
  const value = metrics[key as keyof typeof metrics];
  const isMetricsBoolean = typeof value === "boolean";
  if (isMetricsBoolean) return value ? 1 : 0;
  return value;
};

type TableColor = "green" | "yellow" | "red" | "cyan" | "gray";

const getRowColor = (
  key: RowConfig["key"],
  value: string | number,
  metrics: NonNullable<PastoralistResult["metrics"]>,
): TableColor | undefined => {
  const numValue = typeof value === "number" ? value : 0;
  const hasValue = numValue > 0;

  if (key === "severityCritical" && hasValue) return "red";
  if (key === "severityHigh" && hasValue) return "red";
  if (key === "severityMedium" && hasValue) return "yellow";
  if (key === "severityLow" && hasValue) return "gray";
  if (key === "vulnerabilitiesBlocked" && hasValue) return "green";
  if (key === "overridesAdded" && hasValue) return "cyan";
  if (key === "writeStatus") return metrics.writeSuccess ? "green" : "yellow";
  return undefined;
};

export const displaySummaryTable = (result: PastoralistResult): void => {
  const metrics = result.metrics;
  if (!metrics) return;

  const rows = SUMMARY_ROW_CONFIG.map((config) => {
    const value = getRowValue(metrics, config.key);
    const color = getRowColor(config.key, value, metrics);
    return { label: config.label, value, color };
  });

  const table = renderTable(rows, { title: `${FARMER} Pastoralist Summary` });
  console.log("\n" + table);
};

export const checkRemovalSafety = async (
  config: PastoralistJSON,
  securityChecker: SecurityChecker,
  mergedOptions: Options,
): Promise<string[]> => {
  const appendix = config.pastoralist?.appendix || {};
  const unusedKeys = findUnusedAppendixEntries(appendix);
  if (unusedKeys.length === 0) return [];

  const allDeps = {
    ...config.dependencies,
    ...config.devDependencies,
    ...config.peerDependencies,
  };
  const packageNames = extractPackageNames(unusedKeys);
  const candidateDeps = Object.fromEntries(
    packageNames
      .filter((name) => Boolean(allDeps[name]))
      .map((name) => [name, allDeps[name] as string]),
  );

  if (Object.keys(candidateDeps).length === 0) return [];

  const syntheticConfig: PastoralistJSON = {
    name: config.name,
    version: config.version,
    dependencies: candidateDeps,
  };

  const { alerts } = await securityChecker.checkSecurity(syntheticConfig, {
    root: mergedOptions.root || "./",
  });

  const vulnerablePackageNames = new Set(alerts.map((a) => a.packageName));
  return unusedKeys.filter((key) => {
    const [pkgName] = extractPackageNames([key]);
    return vulnerablePackageNames.has(pkgName);
  });
};

const pluralSuffix = (count: number): string => (count === 1 ? "" : "s");

export async function action(
  options: Options = {},
  deps = {
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
    processExit: (code: number) => process.exit(code),
  },
): Promise<PastoralistResult> {
  const isLogging = IS_DEBUGGING || options.debug;
  const isJsonOutput = options.outputFormat === "json";
  const isQuietMode = options.quiet === true;
  const log = deps.createLogger({ file: "program.ts", isLogging });

  const cacheDir = resolveCacheDir({
    cacheDir: options.cacheDir,
    root: options.root,
  });
  pruneBackups(cacheDir);
  const { isTestingCLI = false, init = false, ...rest } = options;
  const graph = deps.createTerminalGraph({ quiet: isQuietMode });

  const emptyResult = createEmptyResult();

  if (deps.handleTestMode(isTestingCLI, log, options)) {
    outputResult(emptyResult, isJsonOutput);
    return emptyResult;
  }

  if (await deps.handleInitMode(init, options, rest)) {
    outputResult(emptyResult, isJsonOutput);
    return emptyResult;
  }

  const shouldShowBanner = !isJsonOutput && !isQuietMode;
  if (shouldShowBanner) {
    graph.banner();
  }

  try {
    const relativePath = options.path || "package.json";
    const path =
      options.root && !relativePath.startsWith("/")
        ? `${options.root}/${relativePath}`
        : relativePath;
    const config = deps.resolveJSON(path);
    const securityConfig = config?.pastoralist?.security || {};
    const configProvider = Array.isArray(securityConfig.provider)
      ? securityConfig.provider[0]
      : securityConfig.provider;

    const baseOptions = deps.buildMergedOptions(
      options,
      rest,
      securityConfig,
      configProvider,
    );
    let mergedOptions: Options = {
      ...baseOptions,
      config,
      path,
      ...(options.root && { root: options.root }),
    };

    let securityResult: Pick<
      PastoralistResult,
      "hasSecurityIssues" | "securityAlertCount" | "securityAlerts"
    > = {
      hasSecurityIssues: false,
      securityAlertCount: 0,
      securityAlerts: [],
    };

    let packagesScanned = 0;

    const shouldRunSecurity = mergedOptions.checkSecurity;
    const showSecurityPhase = shouldRunSecurity && !isJsonOutput;

    if (showSecurityPhase) {
      graph.startPhase("scanning", "Scanning packages");
    }

    if (shouldRunSecurity) {
      const {
        spinner,
        securityChecker,
        alerts,
        securityOverrides,
        updates,
        packagesScanned: scanned,
        skipped,
      } = await deps.runSecurityCheck(
        config!,
        mergedOptions,
        Boolean(isLogging),
        log,
      );

      packagesScanned = scanned;
      securityResult = buildSecurityResult(alerts);

      mergedOptions = { ...mergedOptions, securityAlerts: alerts };

      const shouldCheckRemovalSafety = mergedOptions.removeUnused && config;
      if (shouldCheckRemovalSafety) {
        const skipKeys = await checkRemovalSafety(
          config!,
          securityChecker,
          mergedOptions,
        );
        if (skipKeys.length > 0) {
          mergedOptions = { ...mergedOptions, skipRemovalKeys: skipKeys };
        }
      }

      const shouldHandleResults = !skipped && !isJsonOutput;
      if (shouldHandleResults) {
        const securityUpdates = deps.handleSecurityResults(
          alerts,
          securityOverrides,
          securityChecker,
          spinner,
          mergedOptions,
          updates,
        );
        mergedOptions = { ...mergedOptions, ...securityUpdates };

        const toVulnerabilityInfo = (
          alert: SecurityAlert,
        ): import("../dx/types").VulnerabilityInfo => ({
          severity: alert.severity || "unknown",
          packageName: alert.packageName,
          currentVersion: alert.currentVersion || "?",
          title: alert.title || alert.description || "Vulnerability",
          cves: alert.cves,
          fixAvailable: alert.fixAvailable,
          patchedVersion: alert.patchedVersion,
          url: alert.url,
        });

        alerts
          .map(toVulnerabilityInfo)
          .forEach((info) => graph.vulnerability(info, false));

        const alertCount = alerts.length;
        const hasAlerts = alertCount > 0;
        const vulnPlural = alertCount === 1 ? "y" : "ies";
        const securityMsg = hasAlerts
          ? `${alertCount} vulnerabilit${vulnPlural} found`
          : `No vulnerabilities in ${packagesScanned} packages`;
        graph.endPhase(securityMsg);

        const shouldShowFixesApplied =
          securityOverrides.length > 0 &&
          (mergedOptions.forceSecurityRefactor || mergedOptions.interactive);

        if (shouldShowFixesApplied) {
          graph.startPhase("resolving", "Fixes applied");

          const toSecurityFixInfo = (
            override: SecurityOverride,
          ): import("../dx/types").SecurityFixInfo => ({
            packageName: override.packageName,
            fromVersion: override.fromVersion || "?",
            toVersion: override.toVersion,
            cves: override.cves,
            severity: override.severity,
            reason: override.reason,
          });

          securityOverrides
            .map(toSecurityFixInfo)
            .forEach((info) => graph.securityFix(info, false));

          const fixCount = securityOverrides.length;
          const fixPlural = fixCount === 1 ? "" : "s";
          graph.endPhase(`${fixCount} override${fixPlural} added`);
        }
      }

      if (isJsonOutput) {
        spinner.stop();
      }
    }

    const addedDate = await deps.getOverrideGitDate(path);
    mergedOptions = { ...mergedOptions, addedDate };

    const updateContext = await deps.update(mergedOptions);
    const updateResultData = buildUpdateResult(
      updateContext,
      config,
      options.dryRun || false,
    );

    if (!isJsonOutput) {
      const removedPackages =
        updateContext.metrics?.removedOverridePackages ?? [];
      const hasRemovedOverrides = removedPackages.length > 0;
      const isLastPhase = !hasRemovedOverrides;

      graph.startPhase("writing", "Updating overrides", isLastPhase);

      displayOverrides(graph, {
        finalOverrides: updateContext.finalOverrides ?? {},
        finalAppendix: updateContext.finalAppendix ?? {},
      });

      const overrideCount = updateResultData.overrideCount;
      const hasOverrides = overrideCount > 0;
      const overrideMsg = hasOverrides
        ? `${overrideCount} override${pluralSuffix(overrideCount)} applied`
        : "No overrides to update";
      graph.endPhase(overrideMsg);

      if (hasRemovedOverrides) {
        graph.startPhase("writing", "Cleaned up stale overrides", true);

        removedPackages.forEach((removed) => {
          graph.removedOverride(
            {
              packageName: removed.packageName,
              version: removed.version,
              reason: "Override no longer needed",
            },
            false,
          );
        });

        const removedCount = removedPackages.length;
        const removedPlural = removedCount === 1 ? "" : "s";
        graph.endPhase(
          `${removedCount} stale override${removedPlural} removed`,
        );
      }

      const securityFixCount = securityResult.securityAlertCount || 0;
      const staleCount = removedPackages.length;
      const protectedCount = packagesScanned;

      graph.executiveSummary({
        vulnerabilitiesFixed: securityFixCount,
        staleOverridesRemoved: staleCount,
        packagesProtected: protectedCount,
      });

      const metrics = updateContext.metrics;
      graph.compactSummary({
        severityCritical: metrics?.severityCritical ?? 0,
        severityHigh: metrics?.severityHigh ?? 0,
        severityMedium: metrics?.severityMedium ?? 0,
        severityLow: metrics?.severityLow ?? 0,
        overridesTracked: metrics?.appendixEntriesUpdated ?? 0,
        overridesRemoved: metrics?.overridesRemoved ?? 0,
        packagesScanned: metrics?.packagesScanned ?? 0,
      });

      graph.complete("The herd is safe!", ` ${SHEEP}`);

      const shouldShowInstallNotice = updateResultData.updated;
      if (shouldShowInstallNotice) {
        graph.notice("Run an install to capture the updates!");
      }

      const blockedKeys = mergedOptions.skipRemovalKeys || [];
      const hasBlockedRemovals = blockedKeys.length > 0;
      if (hasBlockedRemovals) {
        const count = blockedKeys.length;
        graph.notice(
          `${count} override${pluralSuffix(count)} kept: still vulnerable at declared versions - ${blockedKeys.join(", ")}`,
        );
      }

      const finalAppendix = updateContext.finalAppendix ?? {};
      const unusedEntries = findUnusedAppendixEntries(finalAppendix);
      const hasUnusedOverrides = unusedEntries.length > 0;
      const didNotRemoveUnused = !options.removeUnused;
      const shouldSuggestRemoval = hasUnusedOverrides && didNotRemoveUnused;
      if (shouldSuggestRemoval) {
        const count = unusedEntries.length;
        graph.notice(
          `${count} unused override${pluralSuffix(count)} detected. Run with --remove-unused to clean up.`,
        );
      }
    }

    const result: PastoralistResult = Object.assign(
      {},
      emptyResult,
      securityResult,
      updateResultData,
      { metrics: updateContext.metrics },
    );

    const shouldShowSummary = options.summary && !isJsonOutput;
    if (shouldShowSummary) {
      displaySummaryTable(result);
    }

    outputResult(result, isJsonOutput);
    return result;
  } catch (err) {
    graph.stop();
    const result = createErrorResult(err);

    if (isJsonOutput) {
      outputResult(result, isJsonOutput);
    } else {
      log.error("action:fn", "action", { error: err });
    }

    deps.processExit(1);
    return result;
  }
}

export const run = async (argv: string[] = process.argv): Promise<void> => {
  const parsed = parseArgs(argv);
  const options = parsed.options as Options;

  const isHelpRequested =
    options.help || argv.includes("-h") || argv.includes("--help");
  if (isHelpRequested) {
    showHelp();
    return;
  }

  const log = createLogger({ file: "program.ts", isLogging: false });
  const didSetupHook = handleSetupHook(options, log);
  if (didSetupHook) {
    return;
  }

  const isInitCommand = parsed.command === "init";
  if (isInitCommand) {
    await initCommand(options);
    return;
  }

  await action(options);
};
