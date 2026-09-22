import { resolve } from "path";
import type { JsManager } from "../types";
import { countPatternLockPackages } from "../utils";
import {
  DETECT_FILES,
  LOCKFILES,
  PNPM_LOCK_FILENAME,
  PNPM_LOCK_PACKAGE_PATTERN,
  REMOVAL,
} from "./constants";
import {
  parsePnpmLockGraph,
  parsePnpmLockTree,
  parsePnpmLockedPackages,
  resolvePnpmSource,
  stagePnpmWorkspace,
} from "./utils";

const countPackages = (root: string): number => {
  const path = resolve(root, PNPM_LOCK_FILENAME);
  return countPatternLockPackages(path, PNPM_LOCK_PACKAGE_PATTERN);
};

export const pnpm: JsManager = {
  name: "pnpm",
  detectFiles: DETECT_FILES,
  lockfiles: LOCKFILES,
  overrideField: "pnpm",
  readTree: parsePnpmLockTree,
  readGraph: parsePnpmLockGraph,
  readPackages: parsePnpmLockedPackages,
  countPackages,
  resolveOverridePath: resolvePnpmSource,
  stageWorkspace: stagePnpmWorkspace,
  removal: REMOVAL,
};
