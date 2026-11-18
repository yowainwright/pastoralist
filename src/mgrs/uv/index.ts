import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { TomlError } from "smol-toml";
import type { Options, PastoralistJSON } from "../../types";
import { isRecord } from "../../utils";
import type { NativeProject } from "../types";
import { readUvManifest, readUvOverrides, readUvToml } from "./utils";
import { readUvTracking } from "./lockfile";

export const detectUvProject = (root: string, hasJavaScriptManifest: boolean): boolean => {
  const path = resolve(root, "pyproject.toml");
  if (!existsSync(path)) return false;
  if (existsSync(resolve(root, "uv.lock"))) return true;
  try {
    const document = readUvToml(path);
    const detected = declaresUv(document);
    return detected;
  } catch (error) {
    const unrelatedMalformedToml = hasJavaScriptManifest && error instanceof TomlError;
    if (unrelatedMalformedToml) return false;
    throw error;
  }
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
  const document = readUvToml(path);
  const supported = declaresUv(document) || existsSync(resolve(root, "uv.lock"));
  if (!supported)
    throw new Error(`Unsupported Python package manager at ${path}; expected [tool.uv] or uv.lock`);
  const manifest = readUvManifest(path, document);
  const overrides = readUvOverrides(document);
  const { dependencies, version } = manifest;
  const name = manifest.name ?? "root";
  const config: PastoralistJSON = { name, version, dependencies, overrides };
  const { tracking, packageCount } = readUvTracking(root, [manifest]);
  const nativeProject: NativeProject = { manager: "uv", tracking, packageCount };
  const project = { config, nativeProject };
  return project;
};

const declaresUv = ({ tool }: Record<string, unknown>): boolean => {
  const declared = isRecord(tool) && Object.hasOwn(tool, "uv");
  return declared;
};
