import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface GitResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export type GitRunner = (args: readonly string[]) => GitResult;
export type ReleaseLogger = Pick<Console, "error" | "log">;

export interface ReleaseTagOptions {
  cwd?: string;
  dryRun?: boolean;
  git?: GitRunner;
  logger?: ReleaseLogger;
  requireUpstream?: boolean;
  version?: string;
}

export interface ReleaseReadyOptions {
  dryRun?: boolean;
  requireUpstream?: boolean;
}

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function parseArgs(args: readonly string[]): { dryRun: boolean } {
  return { dryRun: args.includes("--dry-run") };
}

export function formatTagName(version: string): string {
  if (!VERSION_PATTERN.test(version)) throw new Error(`Invalid package version: ${version}`);
  return `v${version}`;
}

export function readPackageVersion(cwd: string): string {
  const manifest = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")) as {
    version?: unknown;
  };
  if (typeof manifest.version !== "string") throw new Error("package.json version is missing");
  return manifest.version;
}

export function createGitRunner(cwd: string): GitRunner {
  return (args) => {
    const result = spawnSync("git", Array.from(args), { cwd, encoding: "utf8" });
    return {
      status: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  };
}

export function gitText(git: GitRunner, args: readonly string[], message: string): string {
  const result = git(args);
  if (result.status === 0) return result.stdout.trim();
  throw new Error(result.stderr.trim() || message);
}

export function assertMissingTag(git: GitRunner, tagName: string): void {
  const localTag = git(["rev-parse", "-q", "--verify", `refs/tags/${tagName}`]);
  if (localTag.status === 0) throw new Error(`Local tag already exists: ${tagName}`);

  const remoteTag = git(["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tagName}`]);
  if (remoteTag.status === 0) throw new Error(`Remote tag already exists: ${tagName}`);
  if (remoteTag.status === 2) return;
  throw new Error(remoteTag.stderr.trim() || `Unable to check remote tag: ${tagName}`);
}

export function assertReleaseReady(
  git: GitRunner,
  tagName: string,
  { dryRun = false, requireUpstream = true }: ReleaseReadyOptions = {},
): void {
  const branch = gitText(git, ["branch", "--show-current"], "Unable to read current branch");
  if (branch !== "main") throw new Error("Release tags must be created from main");

  const status = gitText(git, ["status", "--short"], "Unable to read working tree status");
  if (status) throw new Error("Working tree must be clean before tagging a release");

  if (!dryRun) gitText(git, ["fetch", "origin", "main", "--tags"], "Unable to fetch origin/main");
  if (!requireUpstream) {
    assertMissingTag(git, tagName);
    return;
  }

  const head = gitText(git, ["rev-parse", "HEAD"], "Unable to read HEAD");
  const upstream = gitText(git, ["rev-parse", "origin/main"], "Unable to read origin/main");
  if (head !== upstream) throw new Error("Local main must match origin/main before tagging");

  assertMissingTag(git, tagName);
}

export function runReleaseTag({
  cwd = process.cwd(),
  dryRun = false,
  git = createGitRunner(cwd),
  logger = console,
  requireUpstream = true,
  version = readPackageVersion(cwd),
}: ReleaseTagOptions = {}): number {
  const tagName = formatTagName(version);
  assertReleaseReady(git, tagName, { dryRun, requireUpstream });

  if (dryRun) {
    logger.log(`Dry run: would create and push ${tagName}`);
    return 0;
  }

  gitText(
    git,
    ["tag", "--annotate", tagName, "--message", `Release ${version}`],
    "Unable to create tag",
  );
  const push = git(["push", "origin", `refs/tags/${tagName}`]);
  if (push.status === 0) {
    logger.log(`Pushed ${tagName}`);
    return 0;
  }

  git(["tag", "--delete", tagName]);
  throw new Error(push.stderr.trim() || `Unable to push ${tagName}`);
}

if (import.meta.main) {
  try {
    process.exitCode = runReleaseTag(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
