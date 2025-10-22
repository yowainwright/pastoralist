#!/usr/bin/env node

import { program } from "commander";
import ora from "ora";
import gradient from "gradient-string";
import { Options, PastoralistJSON } from "./interfaces";
import { update, logger as createLogger, resolveJSON } from "./scripts";
import { IS_DEBUGGING } from "./constants";
import { SecurityChecker } from "./security";
import { initCommand } from "./init";

const logger = createLogger({ file: "program.ts", isLogging: false });

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
  const { isTestingCLI = false, ...rest } = options;
  if (isTestingCLI) {
    log.debug("action:options:", "action", { options });
    return;
  }
  
  try {
    const pastor = gradient("green", "tan");
    
    // Read config to get security settings
    const path = options.path || "package.json";
    const config = await resolveJSON(path);
    
    // Merge CLI options with config file settings
    const securityConfig = config?.pastoralist?.security || {};
    const mergedOptions: Options = {
      ...rest,
      checkSecurity: options.checkSecurity ?? securityConfig.enabled,
      forceSecurityRefactor: options.forceSecurityRefactor ?? securityConfig.autoFix,
      securityProvider: options.securityProvider ?? securityConfig.provider ?? "osv",
      securityProviderToken: options.securityProviderToken ?? securityConfig.securityProviderToken,
      interactive: options.interactive ?? securityConfig.interactive,
      hasWorkspaceSecurityChecks: options.hasWorkspaceSecurityChecks ?? securityConfig.hasWorkspaceSecurityChecks,
    };
    
    // Run security check if enabled
    if (mergedOptions.checkSecurity) {
      const spinner = ora(
        `🔒 ${pastor(`pastoralist`)} checking for security vulnerabilities...\n`,
      ).start();
      
      const securityChecker = new SecurityChecker({
        provider: mergedOptions.securityProvider,
        forceRefactor: mergedOptions.forceSecurityRefactor,
        interactive: mergedOptions.interactive,
        token: mergedOptions.securityProviderToken,
        debug: isLogging,
      });

      const scanPaths = determineSecurityScanPaths(config, mergedOptions, log);

      const securityOverrides = await securityChecker.checkSecurity(config!, {
        ...mergedOptions,
        depPaths: scanPaths,
        root: options.root || "./",
      });
      
      if (securityOverrides.length > 0) {
        const report = securityChecker.formatSecurityReport([], securityOverrides);
        spinner.info(report);
        
        if (mergedOptions.forceSecurityRefactor || mergedOptions.interactive) {
          // Apply overrides will be handled by update function
          mergedOptions.securityOverrides = securityChecker.generatePackageOverrides(securityOverrides);
          mergedOptions.securityOverrideDetails = securityOverrides.map(override => ({
            packageName: override.packageName,
            reason: override.reason
          }));
        }
      } else {
        spinner.succeed(`🔒 ${pastor(`pastoralist`)} no security vulnerabilities found!`);
      }
    }
    
    const spinner = ora(
      `👩🏽‍🌾 ${pastor(`pastoralist`)} checking herd...\n`,
    ).start();
    await update(mergedOptions);
    spinner.succeed(`👩🏽‍🌾 ${pastor(`pastoralist`)} the herd is safe!`);
  } catch (err) {
    log.error("action:fn", "action", { error: err });
    process.exit(1);
  }
}

program
  .description("Pastoralist, a utility CLI to manage your dependency overrides")
  .option("--debug", "enables debug mode")
  .option("-p, --path <path>", "specifies a path to a package.json")
  .option(
    "-d, --depPaths [depPaths...]",
    "specifies a glob path to a package.jsons",
  )
  .option("--ignore [ignore...]", "specifies a glob path to ignore")
  .option("-r, --root <root>", "specifies a root path")
  .option("-t, --isTestingCLI", "enables CLI testing, no scripts are run")
  .option("--isTesting", "enables testing, no scripts are run")
  .option("--checkSecurity", "check for security vulnerabilities and generate overrides")
  .option("--forceSecurityRefactor", "automatically apply security overrides without prompting")
  .option("--securityProvider <provider>", "security provider to use (osv, github, snyk, npm, socket)", "osv")
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
