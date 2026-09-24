import type { JsManager } from "../types";
import { DETECT_FILES, LOCKFILES, REMOVAL } from "./constants";
import {
  parsePnpmLockGraph,
  parsePnpmLockTree,
  parsePnpmLockedPackages,
  resolvePnpmSource,
  stagePnpmWorkspace,
} from "./utils";

const countPackages = (root: string): number => {
  const packages = parsePnpmLockedPackages(root);
  const count = packages?.length ?? 0;
  return count;
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
