#!/usr/bin/env node

import { program } from "commander";
import ora from "ora";
import gradient from "gradient-string";
import { Options } from "./interfaces";
import { update, logger, resolveJSON } from "./scripts";
import { IS_DEBUGGING } from "./constants";
import { SecurityChecker } from "./security";

/**
 * @name action
 * @description Main entry point for Pastoralist CLI
 * @param options - Options for updating package.json
 * @returns void
 */
export async function action(options: Options = {}): Promise<void> {
  const isLogging = IS_DEBUGGING || options.debug;
  const log = logger({ file: "program.ts", isLogging });
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
      includeWorkspaces: options.includeWorkspaces ?? securityConfig.includeWorkspaces,
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
      
      const includeWorkspaces = mergedOptions.includeWorkspaces || false;
      const workspacePaths = includeWorkspaces && config?.workspaces ? 
        config.workspaces.map((ws: string) => `${ws}/package.json`) : 
        undefined;
      
      const securityOverrides = await securityChecker.checkSecurity(config!, {
        ...mergedOptions,
        depPaths: workspacePaths,
        root: options.root || "./",
      });
      
      if (securityOverrides.length > 0) {
        const report = securityChecker.formatSecurityReport([], securityOverrides);
        spinner.info(report);
        
        if (mergedOptions.forceSecurityRefactor || mergedOptions.interactive) {
          // Apply overrides will be handled by update function
          mergedOptions.securityOverrides = securityChecker.generatePackageOverrides(securityOverrides);
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

/**
 * @name main
 * @description Main entry point for Pastoralist CLI
 * @returns void
 */
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
  .option("--includeWorkspaces", "include workspace packages in security scan")
  .action(action)
  .parse(process.argv);

export { program };
