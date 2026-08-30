import type { PreRelease, ReleaseIncrement } from "./types";

export const DEFAULT_TIMEOUT_MINUTES = 90;
export const MAX_VERSION_ATTEMPTS = 100;
export const POLL_INTERVAL_MS = 30_000;
export const RELEASE_IT_BIN = "./node_modules/.bin/release-it";

export const VERSION_PATTERN = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?/g;
export const TAG_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
export const STABLE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
export const PRE_RELEASE_VERSION_PATTERN = /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+(?:\+[0-9A-Za-z.-]+)?$/;
export const PRE_RELEASE_INCREMENT_PATTERN =
  /^(\d+\.\d+\.\d+)-([0-9A-Za-z.-]+)\.(\d+)(\+[0-9A-Za-z.-]+)?$/;
export const STABLE_INCREMENT_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
export const COMMIT_PATTERN = /^[0-9a-f]{40}$/i;
export const SAFE_SHELL_ARG_PATTERN = /^[A-Za-z0-9_./:=@-]+$/;

export const PRE_RELEASES: ReadonlySet<PreRelease> = new Set(["alpha", "beta", "rc"]);
export const RELEASE_INCREMENTS: ReadonlySet<ReleaseIncrement> = new Set([
  "patch",
  "minor",
  "major",
]);
