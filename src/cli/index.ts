#!/usr/bin/env node

import { program } from "commander";
import { createSpinner, green } from "../utils";
import { Options, PastoralistJSON, SecurityAlert, SecurityOverride, SecurityOverrideDetail } from "../types";
import { update } from "../core/update";
import { logger as createLogger } from "../utils";
import { resolveJSON } from "../core/packageJSON";
import { IS_DEBUGGING } from "../constants";
import { SecurityChecker } from "../core/security";
import { initCommand } from "./cmds/init/index";

const logger = createLogger({ file: "program.ts", isLogging: false });

export const handleTestMode = (isTestingCLI: boolean, log: ReturnType<typeof createLogger>, options: Options): boolean => {
  if (isTestingCLI) {
    log.debug("action:options:", "action", { options });
    return true;
  }
  return false;
};

const handleInitMode = async (init: boolean, options: Options, rest: Omit<Options, "isTestingCLI" | "init">): Promise<boolean> => {
  if (init) {
    await initCommand({
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

export const buildMergedOptions = (options: Options, rest: any, securityConfig: any, configProvider: any): Options => {
  return {
    ...rest,
    checkSecurity: options.checkSecurity ?? securityConfig.enabled,
    forceSecurityRefactor: options.forceSecurityRefactor ?? securityConfig.autoFix,
    securityProvider: options.securityProvider ?? configProvider ?? "osv",
    securityProviderToken: options.securityProviderToken ?? securityConfig.securityProviderToken,
    interactive: options.interactive ?? securityConfig.interactive,
    hasWorkspaceSecurityChecks: options.hasWorkspaceSecurityChecks ?? securityConfig.hasWorkspaceSecurityChecks,
  };
};

export const buildSecurityOverrideDetail = (override: SecurityOverride): SecurityOverrideDetail => {
  const hasCve = Boolean(override.cve);
  const hasSeverity = Boolean(override.severity);
  const hasDescription = Boolean(override.description);
  const hasUrl = Boolean(override.url);

  return {
    packageName: override.packageName,
    reason: override.reason,
    ...(hasCve && { cve: override.cve }),
    ...(hasSeverity && { severity: override.severity as "low" | "medium" | "high" | "critical" }),
    ...(hasDescription && { description: override.description }),
    ...(hasUrl && { url: override.url }),
  };
};

const runSecurityCheck = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  isLogging: boolean,
  log: ReturnType<typeof createLogger>
) => {
  const spinner = createSpinner(
    `🔒 ${green(`pastoralist`)} checking for security vulnerabilities...`,
  ).start();

  const securityChecker = new SecurityChecker({
    provider: mergedOptions.securityProvider,
    forceRefactor: mergedOptions.forceSecurityRefactor,
    interactive: mergedOptions.interactive,
    token: mergedOptions.securityProviderToken,
    debug: isLogging,
    isIRLFix: mergedOptions.isIRLFix,
    isIRLCatch: mergedOptions.isIRLCatch,
  });

  const scanPaths = determineSecurityScanPaths(config, mergedOptions, log);
  const { alerts, overrides: securityOverrides } = await securityChecker.checkSecurity(config, {
    ...mergedOptions,
    depPaths: scanPaths,
    root: mergedOptions.root || "./",
  });

  return { spinner, securityChecker, alerts, securityOverrides };
};

export const handleSecurityResults = (
  alerts: SecurityAlert[],
  securityOverrides: SecurityOverride[],
  securityChecker: SecurityChecker,
  spinner: any,
  mergedOptions: Options
): void => {
  const hasAlerts = alerts.length > 0;
  const shouldApplySecurityFixes = mergedOptions.forceSecurityRefactor || mergedOptions.interactive;
  const shouldGenerateOverrides = hasAlerts && shouldApplySecurityFixes;

  if (hasAlerts) {
    const report = securityChecker.formatSecurityReport(alerts, securityOverrides);
    spinner.info(report);
  }

  if (shouldGenerateOverrides) {
    mergedOptions.securityOverrides = securityChecker.generatePackageOverrides(securityOverrides);
    mergedOptions.securityOverrideDetails = securityOverrides.map(buildSecurityOverrideDetail);
  }

  const hasNoAlerts = !hasAlerts;
  if (hasNoAlerts) {
    spinner.succeed(`🔒 ${green(`pastoralist`)} no security vulnerabilities found!`);
  }
};

export function determineSecurityScanPaths(
  config: PastoralistJSON | undefined,
  mergedOptions: Options,
  log: ReturnType<typeof createLogger> = logger
): string[] {
  const configDepPaths = config?.pastoralist?.depPaths;
  const isArray = Array.isArray(configDepPaths);
  const workspaces = config?.workspaces || [];
  const hasWorkspaces = workspaces.length > 0;
  const isWorkspaceString = configDepPaths === "workspace";
  const hasWorkspaceSecurityChecks = mergedOptions.hasWorkspaceSecurityChecks || false;
  const hasSecurityEnabled = mergedOptions.checkSecurity || config?.pastoralist?.checkSecurity || false;
  const isArrayDepPaths = isArray && hasSecurityEnabled;
  const shouldUseWorkspaceConfig = isWorkspaceString && hasWorkspaces && hasSecurityEnabled;
  const shouldUseExplicitWorkspaceChecks = hasWorkspaceSecurityChecks && hasWorkspaces;
  const shouldScanWorkspaces = shouldUseWorkspaceConfig || shouldUseExplicitWorkspaceChecks;

  if (isArrayDepPaths) {
    log.debug(
      `Using depPaths configuration for security checks: ${configDepPaths.join(", ")}`,
      "determineSecurityScanPaths"
    );
    return configDepPaths;
  }

  if (shouldScanWorkspaces) {
    log.debug(
      `Using workspace configuration for security checks: ${workspaces.join(", ")}`,
      "determineSecurityScanPaths"
    );
    return workspaces.map((ws: string) => `${ws}/package.json`);
  }

  return [];
}

export async function action(options: Options = {}): Promise<void> {
  const isLogging = IS_DEBUGGING || options.debug;
  const log = createLogger({ file: "program.ts", isLogging });
  const { isTestingCLI = false, init = false, ...rest } = options;

  if (handleTestMode(isTestingCLI, log, options)) return;
  if (await handleInitMode(init, options, rest)) return;

  try {
    const relativePath = options.path || "package.json";
    const path = options.root && !relativePath.startsWith("/")
      ? `${options.root}/${relativePath}`
      : relativePath;
    const config = await resolveJSON(path);
    const securityConfig = config?.pastoralist?.security || {};
    const configProvider = Array.isArray(securityConfig.provider)
      ? securityConfig.provider[0]
      : securityConfig.provider;

    const mergedOptions = buildMergedOptions(options, rest, securityConfig, configProvider);
    mergedOptions.config = config;
    mergedOptions.path = path;
    if (options.root) {
      mergedOptions.root = options.root;
    }

    if (mergedOptions.checkSecurity) {
      const { spinner, securityChecker, alerts, securityOverrides } = await runSecurityCheck(
        config!,
        mergedOptions,
        Boolean(isLogging),
        log
      );
      handleSecurityResults(alerts, securityOverrides, securityChecker, spinner, mergedOptions);
    }

    const spinner = createSpinner(
      `👩🏽‍🌾 ${green(`pastoralist`)} checking herd...`,
    ).start();
    await update(mergedOptions);
    spinner.succeed(`👩🏽‍🌾 ${green(`pastoralist`)} the herd is safe!`);
  } catch (err) {
    log.error("action:fn", "action", { error: err });
    process.exit(1);
  }
}

program
  .description("Pastoralist, a utility CLI to manage your dependency overrides")
  .option("--debug", "enables debug mode")
  .option("--dry-run", "preview changes without writing to package.json")
  .option("-p, --path <path>", "specifies a path to a package.json")
  .option(
    "-d, --depPaths [depPaths...]",
    "specifies a glob path to a package.jsons",
  )
  .option("--ignore [ignore...]", "specifies a glob path to ignore")
  .option("-r, --root <root>", "specifies a root path")
  .option("-t, --isTestingCLI", "enables CLI testing, no scripts are run")
  .option("--isTesting", "enables testing, no scripts are run")
  .option("--isIRLFix", "test mode: append resolvable security alert fixture to real results")
  .option("--isIRLCatch", "test mode: append capturable security alert fixture to real results")
  .option("--init", "initialize Pastoralist configuration interactively")
  .option("--checkSecurity", "check for security vulnerabilities and generate overrides")
  .option("--forceSecurityRefactor", "automatically apply security overrides without prompting")
  .option("--securityProvider <provider...>", "security provider(s) to use (osv, github, snyk, npm, socket)", ["osv"])
  .option("--securityProviderToken <token>", "Security provider token for API access (if required)")
  .option("--interactive", "run security checks in interactive mode")
  .option("--hasWorkspaceSecurityChecks", "include workspace packages in security scan")
  .option("--promptForReasons", "prompt for reasons when adding manual overrides")
  .action(action);

program
  .command("init")
  .description("Initialize Pastoralist configuration interactively")
  .option("-p, --path <path>", "specifies a path to a package.json")
  .option("-r, --root <root>", "specifies a root path")
  .action(initCommand);

program.parse(process.argv);

export { program };
