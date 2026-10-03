export type NpmLsTree = {
  dependencies?: Record<string, unknown>;
};

export type NpmLockFile = {
  packages?: Record<string, NpmPackageEntry>;
  dependencies?: Record<string, unknown>;
};

export type DependencyVersionCandidate = {
  depth: number;
  version: string;
};
import type { DependencyGroups } from "../types";

export type NpmPackageEntry = DependencyGroups & {
  name?: string;
  version?: string;
  link?: boolean;
  resolved?: string;
};

export type LegacyPackage = {
  version?: string;
  requires?: Record<string, string>;
  dependencies?: Record<string, LegacyPackage>;
};
