export type GitResult = {
  status: number | null;
  stderr: string;
  stdout: string;
};

export type GitRunner = (args: readonly string[]) => GitResult;
export type ReleaseRunner = (command: string, args: readonly string[]) => GitResult;
export type ReleaseTagLogger = Pick<Console, "error" | "log">;
export type ReleaseLogger = Pick<Console, "error" | "log" | "warn">;

export type PreRelease = "alpha" | "beta" | "rc";
export type ReleaseIncrement = "patch" | "minor" | "major";

export type ReleaseTagOptions = {
  cwd?: string;
  dryRun?: boolean;
  git?: GitRunner;
  logger?: ReleaseTagLogger;
  requireUpstream?: boolean;
  targetCommit?: string;
  version?: string;
};

export type ReleaseReadyOptions = {
  dryRun?: boolean;
  requireUpstream?: boolean;
  targetCommit?: string;
};

export type ReleaseOptions = {
  cwd?: string;
  dryRun?: boolean;
  increment?: ReleaseIncrement;
  logger?: ReleaseLogger;
  packageVersion?: string;
  pollIntervalMs?: number;
  preRelease?: PreRelease;
  runner?: ReleaseRunner;
  timeoutMinutes?: number;
};

export type ReleaseArgs = {
  dryRun: boolean;
  increment?: ReleaseIncrement;
  preRelease?: PreRelease;
  timeoutMinutes: number;
};

export type ReleaseItArgsOptions = {
  increment?: ReleaseIncrement;
  preRelease?: PreRelease;
  version?: string;
};

export type ReleasePlan = {
  branch: string;
  pullRequestTitle: string;
  steps: string[];
  tagName: string;
  version: string;
};

export type TagPlan = {
  commands: string[];
  steps: string[];
  tagName: string;
  version: string;
};

export type PullRequestState = {
  mergeCommit?: { oid?: string } | null;
  mergeStateStatus?: string;
  mergedAt?: string | null;
  state: string;
};

export type ReleaseContext = {
  cwd: string;
  logger: ReleaseLogger;
  pollIntervalMs: number;
  runner: ReleaseRunner;
};

export type PackageManifest = {
  version?: unknown;
};

export type PullRequestUrlResponse = {
  url?: string;
};
