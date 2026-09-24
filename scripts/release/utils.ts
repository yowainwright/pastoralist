import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SAFE_SHELL_ARG_PATTERN } from "./constants";
import type { GitRunner, PackageManifest, ReleaseRunner } from "./types";

type DelayPromise = Promise<void>;

export function readPackageVersion(cwd: string): string {
  const manifest = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")) as PackageManifest;
  if (typeof manifest.version !== "string") throw new Error("package.json version is missing");
  const result = manifest.version;
  return result;
}

export function createGitRunner(cwd: string): GitRunner {
  return (args) => {
    const result = spawnSync("git", Array.from(args), { cwd, encoding: "utf8" });
    const stderr = result.stderr || "";
    const stdout = result.stdout || "";
    const { status } = result;
    const commandResult = {
      status,
      stderr,
      stdout,
    };
    return commandResult;
  };
}

export function createRunner(cwd: string): ReleaseRunner {
  return (command, args) => {
    const result = spawnSync(command, Array.from(args), { cwd, encoding: "utf8" });
    const stderr = result.stderr || "";
    const stdout = result.stdout || "";
    const { status } = result;
    const commandResult = {
      status,
      stderr,
      stdout,
    };
    return commandResult;
  };
}

export function gitText(git: GitRunner, args: readonly string[], message: string): string {
  const result = git(args);
  if (result.status === 0) {
    const output = result.stdout.trim();
    return output;
  }

  const errorMessage = result.stderr.trim() || message;
  throw new Error(errorMessage);
}

export function commandText(
  runner: ReleaseRunner,
  command: string,
  args: readonly string[],
): string {
  const result = runner(command, args);
  if (result.status === 0) {
    const output = result.stdout.trim();
    return output;
  }

  const commandMessage = `${command} ${args.join(" ")} failed`;
  const message = result.stderr.trim() || commandMessage;
  throw new Error(message);
}

export function runCommand(runner: ReleaseRunner, command: string, args: readonly string[]): void {
  commandText(runner, command, args);
}

export function quoteShellArg(arg: string): string {
  if (SAFE_SHELL_ARG_PATTERN.test(arg)) return arg;
  const result = JSON.stringify(arg);
  return result;
}

export function formatShellCommand(command: string, args: readonly string[]): string {
  const argumentsWithCommand = [command].concat(args);
  const shellCommand = argumentsWithCommand.map(quoteShellArg).join(" ");
  return shellCommand;
}

export function delay(milliseconds: number): DelayPromise {
  const result = new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  return result;
}
