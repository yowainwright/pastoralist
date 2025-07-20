#!/usr/bin/env node

import { program } from "commander";
import ora from "ora";
import gradient from "gradient-string";
import { Options } from "./interfaces";
import { update, logger } from "./scripts";
import { IS_DEBUGGING } from "./constants";

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
    const spinner = ora(
      `👩🏽‍🌾 ${pastor(`pastoralist`)} checking herd...\n`,
    ).start();
    await update(rest);
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
  .action(action)
  .parse(process.argv);

export { program };
