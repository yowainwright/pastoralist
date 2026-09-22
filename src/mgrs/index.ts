import { existsSync } from "fs";
import { resolve } from "path";
import type { JsManager, OverrideField, PackageManager } from "./types";
import { COUNT_ORDER, DETECTION_ORDER } from "./constants";
import { bun } from "./bun";
import { npm } from "./npm";
import { pnpm } from "./pnpm";
import { yarn } from "./yarn";

const managers: Record<PackageManager, JsManager> = { bun, npm, pnpm, yarn };

export const getJsManager = (name: PackageManager): JsManager => managers[name];

const hasFile = (root: string, files: readonly string[]): boolean =>
  files.some((file) => existsSync(resolve(root, file)));

export const detectPackageManager = (root: string = process.cwd()): PackageManager => {
  const match = DETECTION_ORDER.find((name) => hasFile(root, getJsManager(name).detectFiles));
  return match ?? "npm";
};

export const getOverrideFieldForPackageManager = (name: PackageManager): OverrideField =>
  getJsManager(name).overrideField;

export const getFullDependencyCount = (root: string = "./"): number => {
  const match = COUNT_ORDER.find((name) => hasFile(root, getJsManager(name).lockfiles));
  if (!match) return 0;
  return getJsManager(match).countPackages(root);
};
