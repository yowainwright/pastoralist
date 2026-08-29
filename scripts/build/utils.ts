import { spawnSync } from "node:child_process";
import type { BuildLogger, RolldownBuildConfig } from "./types";

export const buildBunBundleArgs = (config: RolldownBuildConfig): string[] => {
  const minifyArgs = config.minify ? ["--minify"] : [];
  const splittingArgs = config.splitting ? ["--splitting"] : [];
  const externalArgs = config.external.flatMap((name) => ["--external", name]);
  const outputArgs = ["--outdir", config.outDir, "--target", config.target];
  return ["build", config.input].concat(outputArgs, minifyArgs, splittingArgs, externalArgs);
};

const printOutput = (logger: BuildLogger, stdout?: string, stderr?: string): void => {
  const output = stdout?.trim();
  const errorOutput = stderr?.trim();
  if (output) logger.print(output);
  if (errorOutput) logger.fail(errorOutput);
};

export const runCommand = (command: string, args: readonly string[], logger: BuildLogger): void => {
  const result = spawnSync(command, Array.from(args), { encoding: "utf8" });
  if (result.status === 0) return;

  printOutput(logger, result.stdout, result.stderr);
  if (result.error) throw result.error;
  throw new Error(`${command} exited with status ${result.status ?? 1}`);
};
