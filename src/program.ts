#!/usr/bin/env node

import { program } from "commander";
import { Options } from "./interfaces";
import { update, logger } from "./scripts";
import { IS_DEBUGGING } from "./constants";

export async function action(options: Options = {}): Promise<void> {
  const isLogging = IS_DEBUGGING || options.debug;
  const log = logger({ file: "program.ts", isLogging });
  const { isTestingCLI = false, ...rest } = options;
  if (isTestingCLI) {
    log.debug("action:options:", "action", { options });
    return;
  }
  try {
    await update(rest);
  } catch (err) {
    log.error("action:fn", "action", { error: err });
    process.exit(1);
  }
}

program
  .description("Pastoralist, a utility CLI to manage your dependency overrides")
  .option("--debug", "enables debug mode")
  .option("--nodeModulePath", "specifies a node_module path")
  .option("--json", "specifies a json path to read from for `resolutions`")
  .option("-t, --isTestingCLI", "enables CLI testing, no scripts are run")
  .option("--isTesting", "enables testing, no scripts are run")
  .action(action)
  .parse(process.argv);

export { program };
