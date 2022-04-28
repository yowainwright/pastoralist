#!/usr/bin/env node

import { program } from "commander";
import { cosmiconfigSync } from "cosmiconfig";
import { resolveConfig } from "./scripts";
import { Options } from "./types";
const version = "VERSION";

const explorer = cosmiconfigSync("pastoralist");

/**
 * initialize
 * @description initialize pastoralist
 * @param {Options} Record}
 */
export async function action(options: Options = {}) {
  try {
    const config = await resolveConfig({ explorer, options });

    // cli testing
    const { isTestingCLI } = config;
    if (isTestingCLI) {
      console.info({ config });
    }

    // script will be here
  } catch (err) {
    console.error(err);
  }
}

program
  .version(version)
  .description("Pastoralist, a utility CLI to manage your dependency overrides")
  .option("-c, --config <config>", "path to a unique config")
  .option("-p, --path <path>", "the path to the package.json file to manage")
  .option("-t, --isTestingCLI", "enables CLI testing, no scripts are run")
  .parse(process.argv)
  .action(action as any);

export default program;
