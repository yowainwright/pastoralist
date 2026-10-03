import { resolve } from "path";
import type { JsManager } from "../types";
import { readNpmResolvedGraph } from "./utils";
import { LOCKFILES, NPM_LOCK_FILENAME, REMOVAL } from "./constants";
import {
  countNpmLockPackages,
  parseNpmLockGraph,
  parseNpmLockTree,
  parseNpmLockedPackages,
} from "./utils";

const countPackages = (root: string): number =>
  countNpmLockPackages(resolve(root, NPM_LOCK_FILENAME));

export const npm: JsManager = {
  name: "npm",
  detectFiles: LOCKFILES,
  lockfiles: LOCKFILES,
  overrideField: "overrides",
  readTree: parseNpmLockTree,
  readGraph: parseNpmLockGraph,
  readResolvedGraph: readNpmResolvedGraph,
  readPackages: parseNpmLockedPackages,
  countPackages,
  removal: REMOVAL,
};
