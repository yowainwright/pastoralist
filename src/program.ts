#!/usr/bin/env node

import { program } from "commander";
import { Options } from "./types";
import { update } from "./scripts";
const version = "VERSION";

/**
 * action
 * @description the pastoralist runner
 * @param {Options} Record}
 */
export async function action(options: Options = {}) {
  try {
    if (options?.isTestingCLI) console.info({ options });

    update(options);
  } catch (err) {
    console.error(err);
  }
}

program
  .version(version)
  .description("Pastoralist, a utility CLI to manage your dependency overrides")
  .option("-t, --isTestingCLI", "enables CLI testing, no scripts are run")
  .action(action as any)
  .parse(process.argv);

export { program };
