import type { JsManager } from "../types";
import { LOCKFILES, REMOVAL } from "./constants";
import {
  countBunLockPackages,
  parseBunLockGraph,
  parseBunLockTree,
  parseBunLockedPackages,
  resolveBunInventoryPath,
} from "./utils";

const countPackages = (root: string): number => {
  const path = resolveBunInventoryPath(root);
  if (!path) return 0;
  const count = countBunLockPackages(path);
  return count;
};

export const bun: JsManager = {
  name: "bun",
  detectFiles: LOCKFILES,
  lockfiles: LOCKFILES,
  overrideField: "overrides",
  readTree: parseBunLockTree,
  readGraph: parseBunLockGraph,
  readPackages: parseBunLockedPackages,
  countPackages,
  removal: REMOVAL,
};
