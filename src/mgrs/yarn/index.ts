import { resolve } from "path";
import type { JsManager } from "../types";
import { countPatternLockPackages } from "../utils";
import { LOCKFILES, YARN_LOCK_FILENAME, YARN_LOCK_PACKAGE_PATTERN, REMOVAL } from "./constants";
import { parseYarnLockGraph, parseYarnLockTree, parseYarnLockedPackages } from "./utils";

const countPackages = (root: string): number => {
  const path = resolve(root, YARN_LOCK_FILENAME);
  return countPatternLockPackages(path, YARN_LOCK_PACKAGE_PATTERN);
};

export const yarn: JsManager = {
  name: "yarn",
  detectFiles: LOCKFILES,
  lockfiles: LOCKFILES,
  overrideField: "resolutions",
  readTree: parseYarnLockTree,
  readGraph: parseYarnLockGraph,
  readPackages: parseYarnLockedPackages,
  countPackages,
  removal: REMOVAL,
};
