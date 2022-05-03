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
  .option("-p, --path <path>", "the path to the package.json file to manage")
  .option(
    "-d, --depPaths <depPaths>",
    "a path to dependency package.json files"
  )
  .option("-t, --isTestingCLI", "enables CLI testing, no scripts are run")
  .parse(process.argv)
  .action(action as any);

export default program;
