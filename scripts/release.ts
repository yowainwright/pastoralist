import { spawnSync } from "node:child_process";
import { runReleaseTag, type GitResult } from "./tag-release";

export type PreRelease = "alpha" | "beta" | "rc";
export type ReleaseRunner = (command: string, args: readonly string[]) => GitResult;
export type ReleaseLogger = Pick<Console, "error" | "log" | "warn">;

export interface ReleaseOptions {
  cwd?: string;
  dryRun?: boolean;
  logger?: ReleaseLogger;
  noWait?: boolean;
  preRelease?: PreRelease;
  runner?: ReleaseRunner;
  timeoutMinutes?: number;
}

export interface ReleaseArgs {
  dryRun: boolean;
  noWait: boolean;
  preRelease?: PreRelease;
  timeoutMinutes: number;
}

interface PullRequestState {
  mergedAt?: string | null;
  state: string;
}

export interface ReleasePlan {
  branch: string;
  pullRequestTitle: string;
  steps: string[];
  tagName: string;
  version: string;
}

const DEFAULT_TIMEOUT_MINUTES = 90;
const POLL_INTERVAL_MS = 30_000;
const VERSION_PATTERN = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?/g;
const PRE_RELEASES = new Set<PreRelease>(["alpha", "beta", "rc"]);

export function parseArgs(args: readonly string[]): ReleaseArgs {
  const preRelease = parsePreRelease(args);
  return {
    dryRun: args.includes("--dry-run"),
    noWait: args.includes("--no-wait"),
    preRelease,
    timeoutMinutes: parseTimeout(args),
  };
}

export function buildReleaseItArgs(options: Pick<ReleaseArgs, "preRelease">): string[] {
  const args = ["--git.tag=false", "--git.push=false", "--git.requireUpstream=false", "--ci"];
  return options.preRelease ? [`--preRelease=${options.preRelease}`, ...args] : args;
}

export function parseReleaseVersion(output: string): string {
  const matches = output.match(VERSION_PATTERN);
  const version = matches?.at(-1);
  if (!version) throw new Error("Unable to resolve release version");
  return version;
}

export function buildReleaseBranch(version: string): string {
  return `release/v${version}`;
}

export function buildPullRequestBody(version: string): string {
  return [
    `Release v${version}.`,
    "",
    "This PR was created by `bun run release`.",
    "After checks pass and the PR merges, the release command pushes the version tag.",
  ].join("\n");
}

export function buildReleasePlan(version: string): ReleasePlan {
  const branch = buildReleaseBranch(version);
  const tagName = `v${version}`;
  return {
    branch,
    pullRequestTitle: `chore(release): ${tagName}`,
    steps: [
      "verify clean, up-to-date main",
      `create ${branch}`,
      "run release-it without pushing main or creating a tag",
      "push the release branch",
      "open a release PR",
      "enable squash auto-merge",
      "wait for required checks and merge",
      "pull merged main",
      `push ${tagName}`,
    ],
    tagName,
    version,
  };
}

export function formatReleasePlan(plan: ReleasePlan): string {
  const steps = plan.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  return [
    `Dry run release plan for ${plan.tagName}`,
    `Version: ${plan.version}`,
    `Branch: ${plan.branch}`,
    `PR title: ${plan.pullRequestTitle}`,
    "",
    steps,
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
  assertMainReady(runner);

  const version = resolveReleaseVersion(runner, releaseArgs);
  const branch = buildReleaseBranch(version);

  if (releaseArgs.dryRun) {
    logger.log(formatReleasePlan(buildReleasePlan(version)));
    return 0;
  }

  createReleasePullRequest(runner, logger, version, branch, releaseArgs);
  if (releaseArgs.noWait) {
    logger.log("Release PR is open. Tagging will need to run after merge.");
    return 0;
  }

  const prUrl = readPullRequestUrl(runner, branch);
  await waitForMerge(runner, logger, prUrl, releaseArgs.timeoutMinutes);
  checkoutMergedMain(runner);
  return runReleaseTag({ cwd, git: (args) => runner("git", args), logger, version });
}

function normalizeOptions(options: ReleaseOptions): ReleaseArgs {
  return {
    dryRun: options.dryRun ?? false,
    noWait: options.noWait ?? false,
    preRelease: options.preRelease,
    timeoutMinutes: options.timeoutMinutes ?? DEFAULT_TIMEOUT_MINUTES,
  };
}

function parsePreRelease(args: readonly string[]): PreRelease | undefined {
  const value = args.find((arg) => arg.startsWith("--preRelease="))?.split("=")[1];
  if (!value) return undefined;
  if (PRE_RELEASES.has(value as PreRelease)) return value as PreRelease;
  throw new Error(`Invalid prerelease identifier: ${value}`);
}

function parseTimeout(args: readonly string[]): number {
  const value = args.find((arg) => arg.startsWith("--timeout-minutes="))?.split("=")[1];
  if (!value) return DEFAULT_TIMEOUT_MINUTES;
  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 1) throw new Error(`Invalid timeout: ${value}`);
  return timeout;
}

function commandText(runner: ReleaseRunner, command: string, args: readonly string[]): string {
  const result = runner(command, args);
  if (result.status === 0) return result.stdout.trim();
  throw new Error(result.stderr.trim() || `${command} ${args.join(" ")} failed`);
}

function runCommand(runner: ReleaseRunner, command: string, args: readonly string[]): void {
  commandText(runner, command, args);
}

function assertMainReady(runner: ReleaseRunner): void {
  const branch = commandText(runner, "git", ["branch", "--show-current"]);
  if (branch !== "main") throw new Error("Run releases from main");

  const status = commandText(runner, "git", ["status", "--short"]);
  if (status) throw new Error("Working tree must be clean before starting a release");

  runCommand(runner, "git", ["fetch", "origin", "main", "--tags"]);
  const head = commandText(runner, "git", ["rev-parse", "HEAD"]);
  const upstream = commandText(runner, "git", ["rev-parse", "origin/main"]);
  if (head !== upstream) throw new Error("Local main must match origin/main before release");
}

function resolveReleaseVersion(runner: ReleaseRunner, releaseArgs: ReleaseArgs): string {
  const output = commandText(runner, "./node_modules/.bin/release-it", [
    "--release-version",
    ...buildReleaseItArgs(releaseArgs),
  ]);
  return parseReleaseVersion(output);
}

function createReleasePullRequest(
  runner: ReleaseRunner,
  logger: ReleaseLogger,
  version: string,
  branch: string,
  releaseArgs: ReleaseArgs,
): void {
  runCommand(runner, "git", ["checkout", "-b", branch]);
  runCommand(runner, "./node_modules/.bin/release-it", buildReleaseItArgs(releaseArgs));
  runCommand(runner, "git", ["push", "--set-upstream", "origin", branch]);

  const prUrl = createPullRequest(runner, logger, version, branch);
  logger.log(`Opened ${prUrl}`);
  enableAutoMerge(runner, logger, prUrl);
}

function createPullRequest(
  runner: ReleaseRunner,
  logger: ReleaseLogger,
  version: string,
  branch: string,
): string {
  const result = runner("gh", [
    "pr",
    "create",
    "--base",
    "main",
    "--head",
    branch,
    "--title",
    `chore(release): v${version}`,
    "--body",
    buildPullRequestBody(version),
  ]);
  if (result.status === 0) return result.stdout.trim();
  logger.warn(`gh pr create failed: ${result.stderr.trim() || "no error output"}`);
  return readPullRequestUrl(runner, branch);
}

function readPullRequestUrl(runner: ReleaseRunner, branch: string): string {
  const output = commandText(runner, "gh", ["pr", "view", branch, "--json", "url"]);
  const parsed = JSON.parse(output) as { url?: string };
  if (!parsed.url) throw new Error(`Unable to find release PR for ${branch}`);
  return parsed.url;
}

function enableAutoMerge(runner: ReleaseRunner, logger: ReleaseLogger, prUrl: string): void {
  const result = runner("gh", ["pr", "merge", "--auto", "--squash", "--delete-branch", prUrl]);
  if (result.status === 0) return;
  logger.warn(result.stderr.trim() || "Unable to enable auto-merge for release PR");
}

async function waitForMerge(
  runner: ReleaseRunner,
  logger: ReleaseLogger,
  prUrl: string,
  timeoutMinutes: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMinutes * 60_000;
  while (true) {
    const state = readPullRequestState(runner, prUrl);
    if (state.mergedAt) return;
    if (state.state === "CLOSED") throw new Error(`Release PR closed without merging: ${prUrl}`);
    if (Date.now() > deadline) throw new Error(`Timed out waiting for release PR: ${prUrl}`);

    logger.log(`Waiting for release PR checks to pass: ${prUrl}`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

function readPullRequestState(runner: ReleaseRunner, prUrl: string): PullRequestState {
  const output = commandText(runner, "gh", ["pr", "view", prUrl, "--json", "state,mergedAt"]);
  return JSON.parse(output) as PullRequestState;
}

function checkoutMergedMain(runner: ReleaseRunner): void {
  runCommand(runner, "git", ["checkout", "main"]);
  runCommand(runner, "git", ["pull", "--ff-only", "origin", "main"]);
}

if (import.meta.main) {
  try {
    process.exitCode = await runRelease(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
