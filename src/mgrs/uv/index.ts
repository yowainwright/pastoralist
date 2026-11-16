import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Options, PastoralistJSON } from "../../types";
import type { NativeProject } from "../types";
import { readUvManifests, readUvOverrides, readUvToml, uvSettings } from "./utils";
import { readUvTracking } from "./lockfile";

export const detectUvProject = (root: string): boolean => {
  const path = resolve(root, "pyproject.toml");
  if (!existsSync(path)) return false;
  if (existsSync(resolve(root, "uv.lock"))) return true;
  const document = readUvToml(path);
  const settings = uvSettings(document);
  const detected = Object.keys(settings).length > 0;
  return detected;
};

export const assertUvTrackingOptions = (options: Options): void => {
  const operations = [
    options.checkSecurity,
    options.forceSecurityRefactor,
    options.removeUnused,
    options.bestCase,
  ];
  const unsupported = operations.some(Boolean);
  if (!unsupported) return;
  throw new Error(
    "uv supports override tracking only; security checks, fixes, and removal are not supported yet",
  );
};

export const loadUvProject = (path: string) => {
  const root = dirname(path);
  const manifests = readUvManifests(path);
  const [manifest] = manifests;
  const overrides = readUvOverrides(readUvToml(path));
  const { dependencies, version } = manifest;
  const name = manifest.name ?? "root";
  const config: PastoralistJSON = { name, version, dependencies, overrides };
  const { tracking, packageCount } = readUvTracking(root, manifests);
  const nativeProject: NativeProject = { manager: "uv", tracking, packageCount };
  const project = { config, nativeProject };
  return project;
};
