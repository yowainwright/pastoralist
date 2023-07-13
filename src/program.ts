#!/usr/bin/env node

import { program } from "commander";
import { Options } from "./interfaces";
import { update } from "./scripts";

export async function action(options: Options = {}): Promise<void> {
  try {
    const { debug, depPaths, isTestingCLI = false, path } = options;
    if (isTestingCLI) {
      console.info({ options });
      return
    }
    update({ debug, depPaths, path });
  } catch (err) {
    console.error({ log: "🐑 👩🏽‍🌾 Pastoralist:cli:action:fn", error: err });
    process.exit(1)
  }
}

program
  .description("Pastoralist, a utility CLI to manage your dependency overrides")
  .option("-d, --debug", "enables debug mode")
  .option('--nodeModulePath', 'specifies a node_module path')
  .option('--json', 'specifies a json path to read from for `resolutions`')
  .option("-t, --isTestingCLI", "enables CLI testing, no scripts are run")
  .action(action)
  .parse(process.argv);

export { program };
