#!/usr/bin/env node

import { parseArgs, showHelp } from "./parser";
import { createSpinner, green } from "../utils";
import {
  Options,
  PastoralistJSON,
  SecurityAlert,
  SecurityOverride,
  SecurityOverrideDetail,
} from "../types";
import { update } from "../core/update";
import { logger as createLogger } from "../utils";
import { resolveJSON } from "../core/packageJSON";
import { IS_DEBUGGING } from "../constants";
import { SecurityChecker } from "../core/security";
import { initCommand } from "./cmds/init/index";

const logger = createLogger({ file: "program.ts", isLogging: false });

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

export const buildMergedOptions = (
  options: Options,
  rest: any,
  securityConfig: any,
  configProvider: any,
): Options => {
  return {
    ...rest,
    checkSecurity: options.checkSecurity ?? securityConfig.enabled,
    forceSecurityRefactor:
      options.forceSecurityRefactor ?? securityConfig.autoFix,
    securityProvider: options.securityProvider ?? configProvider ?? "osv",
    securityProviderToken:
      options.securityProviderToken ?? securityConfig.securityProviderToken,
    interactive: options.interactive ?? securityConfig.interactive,
    hasWorkspaceSecurityChecks:
      options.hasWorkspaceSecurityChecks ??
      securityConfig.hasWorkspaceSecurityChecks,
  };
};

export const buildSecurityOverrideDetail = (
  override: SecurityOverride,
): SecurityOverrideDetail => {
  const hasCve = Boolean(override.cve);
  const hasSeverity = Boolean(override.severity);
  const hasDescription = Boolean(override.description);
  const hasUrl = Boolean(override.url);

  return {
    packageName: override.packageName,
    reason: override.reason,
    ...(hasCve && { cve: override.cve }),
    ...(hasSeverity && {
      severity: override.severity as "low" | "medium" | "high" | "critical",
    }),
    ...(hasDescription && { description: override.description }),
    ...(hasUrl && { url: override.url }),
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
  },
) => {
  const spinner = deps
    .createSpinner(
      `🔒 ${deps.green(`pastoralist`)} checking for security vulnerabilities...`,
    )
    .start();

  const securityChecker = new deps.SecurityChecker({
    provider: mergedOptions.securityProvider,
    forceRefactor: mergedOptions.forceSecurityRefactor,
    interactive: mergedOptions.interactive,
    token: mergedOptions.securityProviderToken,
    debug: isLogging,
    isIRLFix: mergedOptions.isIRLFix,
    isIRLCatch: mergedOptions.isIRLCatch,
  });

  const scanPaths = deps.determineSecurityScanPaths(config, mergedOptions, log);
  const {
    alerts,
    overrides: securityOverrides,
    updates,
  } = await securityChecker.checkSecurity(config, {
    ...mergedOptions,
    depPaths: scanPaths,
    root: mergedOptions.root || "./",
  });

  return { spinner, securityChecker, alerts, securityOverrides, updates };
};

export const handleSecurityResults = (
  alerts: SecurityAlert[],
  securityOverrides: SecurityOverride[],
  securityChecker: SecurityChecker,
  spinner: ReturnType<typeof createSpinner>,
  mergedOptions: Options,
  updates: import("../types").OverrideUpdate[] = [],
): void => {
  const hasAlerts = alerts.length > 0;
  const hasUpdates = updates.length > 0;
  const shouldApplySecurityFixes =
    mergedOptions.forceSecurityRefactor || mergedOptions.interactive;
  const shouldGenerateOverrides = hasAlerts && shouldApplySecurityFixes;
  const shouldApplyUpdates = hasUpdates && shouldApplySecurityFixes;

  if (hasAlerts) {
    const report = securityChecker.formatSecurityReport(
      alerts,
      securityOverrides,
    );
    spinner.info(report);
  }

  if (hasUpdates) {
    const updateReport = formatUpdateReport(updates);
    spinner.info(updateReport);
  }

  const allOverrides = [...securityOverrides];

  if (shouldApplyUpdates) {
    const updateOverrides = updates.map((update) => ({
      packageName: update.packageName,
      fromVersion: update.currentOverride,
      toVersion: update.newerVersion,
      reason: update.reason,
      severity: "medium" as const,
    }));
    allOverrides.push(...updateOverrides);
  }

  if (shouldGenerateOverrides || shouldApplyUpdates) {
    const finalOverrides =
      securityChecker.generatePackageOverrides(allOverrides);
    mergedOptions.securityOverrides = finalOverrides;

    const overridesToApply = allOverrides.filter((override) => {
      const finalVersion = finalOverrides[override.packageName];
      const isStringMatch =
        typeof finalVersion === "string" && finalVersion === override.toVersion;
      return isStringMatch;
    });

    mergedOptions.securityOverrideDetails = overridesToApply.map(
      buildSecurityOverrideDetail,
    );

    const shouldAutoFix =
      (shouldGenerateOverrides || shouldApplyUpdates) &&
      overridesToApply.length > 0;
    if (shouldAutoFix) {
      securityChecker.applyAutoFix(overridesToApply, mergedOptions.path);
    }
  }

  const hasNoAlertsOrUpdates = !hasAlerts && !hasUpdates;
  if (hasNoAlertsOrUpdates) {
    spinner.succeed(
      `🔒 ${green(`pastoralist`)} no security vulnerabilities found!`,
    );
  }
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
    processExit: (code: number) => process.exit(code),
  },
): Promise<void> {
  const isLogging = IS_DEBUGGING || options.debug;
  const log = deps.createLogger({ file: "program.ts", isLogging });
  const { isTestingCLI = false, init = false, ...rest } = options;

  if (deps.handleTestMode(isTestingCLI, log, options)) return;
  if (await deps.handleInitMode(init, options, rest)) return;

  try {
    const relativePath = options.path || "package.json";
    const path =
      options.root && !relativePath.startsWith("/")
        ? `${options.root}/${relativePath}`
        : relativePath;
    const config = await deps.resolveJSON(path);
    const securityConfig = config?.pastoralist?.security || {};
    const configProvider = Array.isArray(securityConfig.provider)
      ? securityConfig.provider[0]
      : securityConfig.provider;

    const mergedOptions = deps.buildMergedOptions(
      options,
      rest,
      securityConfig,
      configProvider,
    );
    mergedOptions.config = config;
    mergedOptions.path = path;
    if (options.root) {
      mergedOptions.root = options.root;
    }

    if (mergedOptions.checkSecurity) {
      const { spinner, securityChecker, alerts, securityOverrides, updates } =
        await deps.runSecurityCheck(
          config!,
          mergedOptions,
          Boolean(isLogging),
          log,
        );

      deps.handleSecurityResults(
        alerts,
        securityOverrides,
        securityChecker,
        spinner,
        mergedOptions,
        updates,
      );
    }

    const spinner = deps
      .createSpinner(`👩🏽‍🌾 ${deps.green(`pastoralist`)} checking herd...`)
      .start();
    await deps.update(mergedOptions);
    spinner.succeed(`👩🏽‍🌾 ${deps.green(`pastoralist`)} the herd is safe!`);
  } catch (err) {
    log.error("action:fn", "action", { error: err });
    deps.processExit(1);
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

  const isInitCommand = parsed.command === "init";
  if (isInitCommand) {
    await initCommand(options);
    return;
  }

  await action(options);
};
