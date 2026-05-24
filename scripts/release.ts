import { spawnSync } from "node:child_process";
import { runReleaseTag, type GitResult } from "./tag-release";

export type PreRelease = "alpha" | "beta" | "rc";
export type ReleaseRunner = (command: string, args: readonly string[]) => GitResult;
export type ReleaseLogger = Pick<Console, "error" | "log" | "warn">;

export interface ReleaseOptions {
  cwd?: string;
  dryRun?: boolean;
  logger?: ReleaseLogger;
  preRelease?: PreRelease;
  runner?: ReleaseRunner;
}

export interface ReleaseArgs {
  dryRun: boolean;
  preRelease?: PreRelease;
}

export interface ReleaseItArgsOptions {
  preRelease?: PreRelease;
  version?: string;
}

export interface ReleasePlan {
  commands: string[];
  steps: string[];
  tagName: string;
  version: string;
}

const VERSION_PATTERN = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?/g;
const PRE_RELEASES = new Set<PreRelease>(["alpha", "beta", "rc"]);
const SAFE_SHELL_ARG_PATTERN = /^[A-Za-z0-9_./:=@-]+$/;

export function parseArgs(args: readonly string[]): ReleaseArgs {
  const preRelease = parsePreRelease(args);
  return {
    dryRun: args.includes("--dry-run"),
    preRelease,
  };
}

export function buildReleaseItArgs(options: ReleaseItArgsOptions): string[] {
  const args = [
    "--git.tag=false",
    "--git.push=false",
    "--git.requireUpstream=false",
    "--git.getLatestTagFromAllRefs=true",
    "--ci",
  ];
  const releaseArgs = options.preRelease ? [`--preRelease=${options.preRelease}`, ...args] : args;
  return options.version ? [options.version, ...releaseArgs] : releaseArgs;
}

export function parseReleaseVersion(output: string): string {
  const matches = output.match(VERSION_PATTERN);
  const version = matches?.at(-1);
  if (!version) throw new Error("Unable to resolve release version");
  return version;
}

export function quoteShellArg(arg: string): string {
  return SAFE_SHELL_ARG_PATTERN.test(arg) ? arg : JSON.stringify(arg);
}

export function formatShellCommand(command: string, args: readonly string[]): string {
  return [command, ...args].map(quoteShellArg).join(" ");
}

export function buildReleaseCommands(version: string, releaseArgs: ReleaseArgs): string[] {
  const tagName = `v${version}`;
  return [
    formatShellCommand(
      "./node_modules/.bin/release-it",
      buildReleaseItArgs({ preRelease: releaseArgs.preRelease, version }),
    ),
    formatShellCommand("git", ["tag", "--annotate", tagName, "--message", `Release ${version}`]),
    formatShellCommand("git", ["push", "origin", `refs/tags/${tagName}`]),
  ];
}

export function buildReleasePlan(version: string, releaseArgs: ReleaseArgs): ReleasePlan {
  const tagName = `v${version}`;
  return {
    commands: buildReleaseCommands(version, releaseArgs),
    steps: [
      "verify clean, up-to-date main",
      "create the release commit without pushing main",
      `push ${tagName} to trigger publishing`,
      "restore local main to its starting commit",
    ],
    tagName,
    version,
  };
}

export function formatReleasePlan(plan: ReleasePlan): string {
  const steps = plan.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  const commands = plan.commands.map((command, index) => `${index + 1}. ${command}`).join("\n");
  return [
    `Dry run release commands for ${plan.tagName}`,
    `Version: ${plan.version}`,
    "",
    "Steps:",
    steps,
    "",
    "Commands:",
    commands,
  ].join("\n");
}

export function createRunner(cwd: string): ReleaseRunner {
  return (command, args) => {
    const result = spawnSync(command, Array.from(args), { cwd, encoding: "utf8" });
    return {
      status: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  };
}

export async function runRelease(options: ReleaseOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const logger = options.logger ?? console;
  const runner = options.runner ?? createRunner(cwd);
  const releaseArgs = normalizeOptions(options);
  const startingHead = assertMainReady(runner);

  const version = resolveReleaseVersion(runner, releaseArgs);

  if (releaseArgs.dryRun) {
    logger.log(formatReleasePlan(buildReleasePlan(version, releaseArgs)));
    return 0;
  }

  try {
    createReleaseCommit(runner, releaseArgs, version);
    runReleaseTag({
      cwd,
      git: (args) => runner("git", args),
      logger,
      requireUpstream: false,
      version,
    });
    logger.log("No PR was created and main was not pushed.");
    return 0;
  } finally {
    restoreStartingHead(runner, startingHead);
  }
}

function normalizeOptions(options: ReleaseOptions): ReleaseArgs {
  return {
    dryRun: options.dryRun ?? false,
    preRelease: options.preRelease,
  };
}

function parsePreRelease(args: readonly string[]): PreRelease | undefined {
  const value = args.find((arg) => arg.startsWith("--preRelease="))?.split("=")[1];
  if (!value) return undefined;
  if (PRE_RELEASES.has(value as PreRelease)) return value as PreRelease;
  throw new Error(`Invalid prerelease identifier: ${value}`);
}

function commandText(runner: ReleaseRunner, command: string, args: readonly string[]): string {
  const result = runner(command, args);
  if (result.status === 0) return result.stdout.trim();
  throw new Error(result.stderr.trim() || `${command} ${args.join(" ")} failed`);
}

function runCommand(runner: ReleaseRunner, command: string, args: readonly string[]): void {
  commandText(runner, command, args);
}

function assertMainReady(runner: ReleaseRunner): string {
  const branch = commandText(runner, "git", ["branch", "--show-current"]);
  if (branch !== "main") throw new Error("Run releases from main");

  const status = commandText(runner, "git", ["status", "--short"]);
  if (status) throw new Error("Working tree must be clean before starting a release");

  runCommand(runner, "git", ["fetch", "origin", "main", "--tags"]);
  const head = commandText(runner, "git", ["rev-parse", "HEAD"]);
  const upstream = commandText(runner, "git", ["rev-parse", "origin/main"]);
  if (head !== upstream) throw new Error("Local main must match origin/main before release");
  return head;
}

function resolveReleaseVersion(runner: ReleaseRunner, releaseArgs: ReleaseArgs): string {
  const output = commandText(runner, "./node_modules/.bin/release-it", [
    "--release-version",
    ...buildReleaseItArgs(releaseArgs),
  ]);
  const version = parseReleaseVersion(output);
  return resolveAvailableReleaseVersion(runner, releaseArgs, version);
}

export function incrementPreReleaseVersion(version: string, preRelease: PreRelease): string {
  const match = version.match(/^(\d+\.\d+\.\d+)-([0-9A-Za-z.-]+)\.(\d+)(\+[0-9A-Za-z.-]+)?$/);
  if (!match || match[2] !== preRelease) {
    throw new Error(`Unable to advance ${preRelease} release version: ${version}`);
  }

  const nextPrerelease = Number(match[3]) + 1;
  return `${match[1]}-${preRelease}.${nextPrerelease}${match[4] ?? ""}`;
}

export function releaseTagExists(runner: ReleaseRunner, tagName: string): boolean {
  const localTag = runner("git", ["rev-parse", "-q", "--verify", `refs/tags/${tagName}`]);
  const localTagError = localTag.stderr.trim();
  if (localTag.status !== 0 && localTagError) {
    throw new Error(localTagError);
  }
  if (localTag.status === 0) return true;

  const remoteTag = runner("git", ["ls-remote", "--tags", "origin", `refs/tags/${tagName}`]);
  if (remoteTag.status !== 0) {
    throw new Error(remoteTag.stderr.trim() || `Unable to check remote tag: ${tagName}`);
  }
  return remoteTag.stdout.trim().length > 0;
}

export function resolveAvailableReleaseVersion(
  runner: ReleaseRunner,
  releaseArgs: ReleaseArgs,
  version: string,
): string {
  if (!releaseArgs.preRelease) return version;

  let candidate = version;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const tagName = `v${candidate}`;
    if (!releaseTagExists(runner, tagName)) return candidate;
    candidate = incrementPreReleaseVersion(candidate, releaseArgs.preRelease);
  }

  throw new Error(`Unable to find an available release tag for ${version}`);
}

function createReleaseCommit(
  runner: ReleaseRunner,
  releaseArgs: ReleaseArgs,
  version: string,
): void {
  runCommand(
    runner,
    "./node_modules/.bin/release-it",
    buildReleaseItArgs({ preRelease: releaseArgs.preRelease, version }),
  );
}

function restoreStartingHead(runner: ReleaseRunner, startingHead: string): void {
  runCommand(runner, "git", ["reset", "--hard", startingHead]);
}

if (import.meta.main) {
  try {
    process.exitCode = await runRelease(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
