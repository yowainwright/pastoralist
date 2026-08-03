import { spawnSync } from "node:child_process";
import { readPackageVersion, runReleaseTag, type GitResult } from "./tag-release";

export type PreRelease = "alpha" | "beta" | "rc";
export type ReleaseIncrement = "patch" | "minor" | "major";
export type ReleaseRunner = (command: string, args: readonly string[]) => GitResult;
export type ReleaseLogger = Pick<Console, "error" | "log" | "warn">;

export interface ReleaseOptions {
  cwd?: string;
  dryRun?: boolean;
  increment?: ReleaseIncrement;
  logger?: ReleaseLogger;
  packageVersion?: string;
  pollIntervalMs?: number;
  preRelease?: PreRelease;
  runner?: ReleaseRunner;
  timeoutMinutes?: number;
}

export interface ReleaseArgs {
  dryRun: boolean;
  increment?: ReleaseIncrement;
  preRelease?: PreRelease;
  timeoutMinutes: number;
}

export interface ReleaseItArgsOptions {
  increment?: ReleaseIncrement;
  preRelease?: PreRelease;
  version?: string;
}

export interface ReleasePlan {
  branch: string;
  pullRequestTitle: string;
  steps: string[];
  tagName: string;
  version: string;
}

export interface TagPlan {
  commands: string[];
  steps: string[];
  tagName: string;
  version: string;
}

interface PullRequestState {
  mergeCommit?: { oid?: string } | null;
  mergeStateStatus?: string;
  mergedAt?: string | null;
  state: string;
}

interface ReleaseContext {
  cwd: string;
  logger: ReleaseLogger;
  pollIntervalMs: number;
  runner: ReleaseRunner;
}

const DEFAULT_TIMEOUT_MINUTES = 90;
const POLL_INTERVAL_MS = 30_000;
const VERSION_PATTERN = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?/g;
const STABLE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const PRE_RELEASES = new Set<PreRelease>(["alpha", "beta", "rc"]);
const RELEASE_INCREMENTS = new Set<ReleaseIncrement>(["patch", "minor", "major"]);
const SAFE_SHELL_ARG_PATTERN = /^[A-Za-z0-9_./:=@-]+$/;

export function parseArgs(args: readonly string[]): ReleaseArgs {
  if (args.includes("--no-wait")) {
    throw new Error("--no-wait cannot safely tag the merged release commit");
  }

  const preRelease = parsePreRelease(args);
  const increment = parseIncrement(args);
  return Object.assign(
    {
      dryRun: args.includes("--dry-run"),
      timeoutMinutes: parseTimeout(args),
    },
    increment ? { increment } : undefined,
    preRelease ? { preRelease } : undefined,
  );
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
  if (options.version) return [options.version, ...releaseArgs];
  if (options.increment) return [`--increment=${options.increment}`, ...releaseArgs];
  return releaseArgs;
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

export function buildReleaseBranch(version: string): string {
  return `release/v${version}`;
}

export function buildPullRequestBody(version: string): string {
  return [
    `Release v${version}.`,
    "",
    "This PR was created by `bun run release`.",
    "After checks pass, the release command merges this PR and pushes the version tag.",
  ].join("\n");
}

function buildReleaseSteps(branch: string, tagName: string): string[] {
  return [
    "verify clean, up-to-date main",
    `create ${branch}`,
    "run release-it without pushing main or creating a tag",
    "push the release branch",
    "open a release PR",
    "wait for required checks",
    "squash-merge the release PR",
    "pull merged main",
    `push ${tagName} to trigger publishing`,
  ];
}

export function buildReleasePlan(version: string): ReleasePlan {
  const branch = buildReleaseBranch(version);
  const tagName = `v${version}`;
  const steps = buildReleaseSteps(branch, tagName);
  return {
    branch,
    pullRequestTitle: `chore(release): ${tagName}`,
    steps,
    tagName,
    version,
  };
}

export function buildCurrentVersionTagPlan(version: string): TagPlan {
  const tagName = `v${version}`;
  return {
    commands: [
      formatShellCommand("git", ["tag", "--annotate", tagName, "--message", `Release ${version}`]),
      formatShellCommand("git", ["push", "origin", `refs/tags/${tagName}`]),
    ],
    steps: ["verify clean, up-to-date main", `push ${tagName} to trigger publishing`],
    tagName,
    version,
  };
}

export function formatReleasePlan(plan: ReleasePlan | TagPlan): string {
  const steps = plan.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  const summary = [`Dry run release commands for ${plan.tagName}`, `Version: ${plan.version}`];
  if ("branch" in plan) {
    const branch = `Branch: ${plan.branch}`;
    const title = `PR title: ${plan.pullRequestTitle}`;
    return summary.concat(branch, title, "", steps).join("\n");
  }

  const commands = plan.commands.map((command, index) => `${index + 1}. ${command}`).join("\n");
  return summary.concat("", "Steps:", steps, "", "Commands:", commands).join("\n");
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

function createReleaseContext(options: ReleaseOptions): ReleaseContext {
  const cwd = options.cwd ?? process.cwd();
  const logger = options.logger ?? console;
  const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;
  const runner = options.runner ?? createRunner(cwd);
  return { cwd, logger, pollIntervalMs, runner };
}

function shouldTagCurrentVersion(releaseArgs: ReleaseArgs, packageVersion: string): boolean {
  const hasVersionChange = releaseArgs.preRelease || releaseArgs.increment;
  return !hasVersionChange && isPreReleaseVersion(packageVersion);
}

function pushVersionTag(context: ReleaseContext, version: string, targetCommit?: string): number {
  const git = (args: readonly string[]) => context.runner("git", args);
  return runReleaseTag({
    cwd: context.cwd,
    git,
    logger: context.logger,
    targetCommit,
    version,
  });
}

function runCurrentVersionRelease(
  context: ReleaseContext,
  releaseArgs: ReleaseArgs,
  packageVersion: string,
): number {
  if (releaseArgs.dryRun) {
    assertReleaseTagAvailable(context.runner, packageVersion);
    context.logger.log(formatReleasePlan(buildCurrentVersionTagPlan(packageVersion)));
    return 0;
  }

  const code = pushVersionTag(context, packageVersion);
  context.logger.log(`Tagged current package version ${packageVersion}.`);
  return code;
}

function assertVersionChangeRequested(releaseArgs: ReleaseArgs): void {
  if (releaseArgs.preRelease || releaseArgs.increment) return;
  throw new Error("Stable releases require an explicit increment: patch, minor, or major");
}

async function publishReleasePullRequest(
  context: ReleaseContext,
  releaseArgs: ReleaseArgs,
  version: string,
): Promise<number> {
  const branch = buildReleaseBranch(version);
  const prUrl = createReleasePullRequest(context, releaseArgs, version, branch);
  const deadline = Date.now() + releaseArgs.timeoutMinutes * 60_000;
  const existingMergeCommit = await waitForMergeReadiness(context, prUrl, deadline);
  const mergeCommit = await resolveMergeCommit(context, prUrl, deadline, existingMergeCommit);
  checkoutMergedMain(context.runner);
  const code = pushVersionTag(context, version, mergeCommit);
  return code;
}

async function runVersionRelease(
  context: ReleaseContext,
  releaseArgs: ReleaseArgs,
): Promise<number> {
  assertVersionChangeRequested(releaseArgs);
  const version = resolveReleaseVersion(context.runner, releaseArgs);
  if (releaseArgs.dryRun) {
    context.logger.log(formatReleasePlan(buildReleasePlan(version)));
    return 0;
  }

  return publishReleasePullRequest(context, releaseArgs, version);
}

export async function runRelease(options: ReleaseOptions = {}): Promise<number> {
  const context = createReleaseContext(options);
  const releaseArgs = normalizeOptions(options);
  assertMainReady(context.runner);
  const packageVersion = options.packageVersion ?? readPackageVersion(context.cwd);

  if (shouldTagCurrentVersion(releaseArgs, packageVersion)) {
    return runCurrentVersionRelease(context, releaseArgs, packageVersion);
  }
  return runVersionRelease(context, releaseArgs);
}

export function isPreReleaseVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+(?:\+[0-9A-Za-z.-]+)?$/.test(version);
}

export function isStableVersion(version: string): boolean {
  return STABLE_VERSION_PATTERN.test(version);
}

function normalizeOptions(options: ReleaseOptions): ReleaseArgs {
  return {
    dryRun: options.dryRun ?? false,
    increment: options.increment,
    preRelease: options.preRelease,
    timeoutMinutes: options.timeoutMinutes ?? DEFAULT_TIMEOUT_MINUTES,
  };
}

function parseIncrement(args: readonly string[]): ReleaseIncrement | undefined {
  const flagValue = args.find((arg) => arg.startsWith("--increment="))?.split("=")[1];
  if (flagValue) return validateIncrement(flagValue);

  const positionalValue = args.find((arg) => RELEASE_INCREMENTS.has(arg as ReleaseIncrement));
  if (positionalValue) return positionalValue as ReleaseIncrement;

  return undefined;
}

function validateIncrement(value: string): ReleaseIncrement {
  if (RELEASE_INCREMENTS.has(value as ReleaseIncrement)) return value as ReleaseIncrement;
  throw new Error(`Invalid release increment: ${value}`);
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

export function incrementStableVersion(version: string, increment: ReleaseIncrement): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Unable to advance stable release version: ${version}`);

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (increment === "major") return `${major + 1}.0.0`;
  if (increment === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
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

function assertReleaseTagAvailable(runner: ReleaseRunner, version: string): void {
  const tagName = `v${version}`;
  if (releaseTagExists(runner, tagName)) throw new Error(`Release tag already exists: ${tagName}`);
}

export function resolveAvailableReleaseVersion(
  runner: ReleaseRunner,
  releaseArgs: ReleaseArgs,
  version: string,
): string {
  if (!releaseArgs.preRelease) {
    if (!releaseArgs.increment) {
      throw new Error("Stable release resolution requires an explicit increment");
    }
    if (!isStableVersion(version)) {
      throw new Error(`release-it resolved a prerelease version for a stable release: ${version}`);
    }

    let candidate = version;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const tagName = `v${candidate}`;
      if (!releaseTagExists(runner, tagName)) return candidate;
      candidate = incrementStableVersion(candidate, releaseArgs.increment);
    }

    throw new Error(`Unable to find an available release tag for ${version}`);
  }

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

function createReleasePullRequest(
  context: ReleaseContext,
  releaseArgs: ReleaseArgs,
  version: string,
  branch: string,
): string {
  runCommand(context.runner, "git", ["switch", "--create", branch]);
  createReleaseCommit(context.runner, releaseArgs, version);
  runCommand(context.runner, "git", ["push", "--set-upstream", "origin", branch]);

  const prUrl = createPullRequest(context, version, branch);
  context.logger.log(`Opened ${prUrl}`);
  return prUrl;
}

function createPullRequest(context: ReleaseContext, version: string, branch: string): string {
  const title = `chore(release): v${version}`;
  const body = buildPullRequestBody(version);
  const args = [
    "pr",
    "create",
    "--base",
    "main",
    "--head",
    branch,
    "--title",
    title,
    "--body",
    body,
  ];
  const result = context.runner("gh", args);
  if (result.status === 0) return result.stdout.trim();

  context.logger.warn(`gh pr create failed: ${result.stderr.trim() || "no error output"}`);
  return readPullRequestUrl(context.runner, branch);
}

function readPullRequestUrl(runner: ReleaseRunner, reference: string): string {
  const output = commandText(runner, "gh", ["pr", "view", reference, "--json", "url"]);
  const parsed = JSON.parse(output) as { url?: string };
  const prUrl = parsed.url;
  if (!prUrl) throw new Error(`Unable to find release PR for ${reference}`);
  return prUrl;
}

function resolveMergeCommit(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
  existingMergeCommit?: string,
): Promise<string> {
  let operation: Promise<string>;
  if (existingMergeCommit) operation = Promise.resolve(existingMergeCommit);
  else operation = mergeReleasePullRequest(context, prUrl, deadline);
  return operation;
}

function mergeReleasePullRequest(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
): Promise<string> {
  const mergeArgs = ["pr", "merge", "--squash", "--delete-branch", prUrl];
  runCommand(context.runner, "gh", mergeArgs);
  const operation = waitForMergeCompletion(context, prUrl, deadline);
  return operation;
}

async function waitForMergeCompletion(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
): Promise<string> {
  const fields = "state,mergedAt,mergeCommit";
  const state = readPullRequestState(context.runner, prUrl, fields);
  if (state.mergedAt) {
    const mergeCommit = readMergeCommit(state, prUrl);
    return mergeCommit;
  }
  assertPullRequestOpen(state, prUrl, deadline);

  context.logger.log(`Waiting for release PR to merge: ${prUrl}`);
  await delay(context.pollIntervalMs);
  const mergeCommit = await waitForMergeCompletion(context, prUrl, deadline);
  return mergeCommit;
}

function assertPullRequestOpen(state: PullRequestState, prUrl: string, deadline: number): void {
  if (state.state === "CLOSED") throw new Error(`Release PR closed without merging: ${prUrl}`);
  if (Date.now() <= deadline) return;
  throw new Error(`Timed out waiting for release PR: ${prUrl}`);
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForMergeReadiness(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
): Promise<string | undefined> {
  const mergeCommit = await pollForMergeReadiness(context, prUrl, deadline);
  return mergeCommit;
}

async function pollForMergeReadiness(
  context: ReleaseContext,
  prUrl: string,
  deadline: number,
): Promise<string | undefined> {
  const fields = "state,mergedAt,mergeCommit,mergeStateStatus";
  const state = readPullRequestState(context.runner, prUrl, fields);
  if (state.mergedAt) {
    const mergeCommit = readMergeCommit(state, prUrl);
    return mergeCommit;
  }
  assertReadinessCanContinue(state, prUrl, deadline);
  const isMergeable = ["CLEAN", "UNSTABLE"].includes(state.mergeStateStatus ?? "");
  if (isMergeable) return undefined;
  if (state.mergeStateStatus === "BEHIND") refreshReleaseBranch(context, prUrl);

  context.logger.log(`Waiting for release PR checks to pass: ${prUrl}`);
  await delay(context.pollIntervalMs);
  const mergeCommit = await pollForMergeReadiness(context, prUrl, deadline);
  return mergeCommit;
}

function assertReadinessCanContinue(
  state: PullRequestState,
  prUrl: string,
  deadline: number,
): void {
  assertPullRequestOpen(state, prUrl, deadline);
  if (state.mergeStateStatus !== "DIRTY") return;
  throw new Error(`Release PR has merge conflicts: ${prUrl}`);
}

function refreshReleaseBranch(context: ReleaseContext, prUrl: string): void {
  context.logger.log(`Updating release PR branch from main: ${prUrl}`);
  const updateArgs = ["pr", "update-branch", prUrl];
  runCommand(context.runner, "gh", updateArgs);
}

function readMergeCommit(state: PullRequestState, prUrl: string): string {
  const mergeCommit = state.mergeCommit?.oid;
  if (mergeCommit) return mergeCommit;
  throw new Error(`Release PR is merged without a merge commit: ${prUrl}`);
}

function readPullRequestState(
  runner: ReleaseRunner,
  prUrl: string,
  fields: string,
): PullRequestState {
  const output = commandText(runner, "gh", ["pr", "view", prUrl, "--json", fields]);
  return JSON.parse(output) as PullRequestState;
}

function checkoutMergedMain(runner: ReleaseRunner): void {
  runCommand(runner, "git", ["switch", "main"]);
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
