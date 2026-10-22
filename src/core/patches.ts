import * as fg from "../utils/glob";
import { existsSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { IS_DEBUGGING } from "../constants";
import type { Appendix } from "../types";
import { logger } from "../observability";
import { isRecord } from "../utils";
import { parsePnpmWorkspaceMapping } from "../mgrs/pnpm/utils";
import { PACKAGE_JSON, PATCH_PATTERNS, PNPM_WORKSPACE_FILE } from "./constants";

const log = logger({ file: "patches.ts", isLogging: IS_DEBUGGING });

const extractBasename = (filePath: string): string => {
  const basename = filePath.split("/").pop() || "";
  return basename;
};

const extractNameWithoutExtension = (basename: string): string => {
  const nameWithoutExtension = basename.replace(".patch", "");
  return nameWithoutExtension;
};

const extractPackageNameFromScoped = (parts: string[]): string => {
  const hasScopedName = parts.length >= 2;
  const packageNameFromScoped = hasScopedName ? `${parts[0]}/${parts[1]}` : parts[0];
  return packageNameFromScoped;
};

const extractPackageNameFromSimple = (parts: string[]): string => {
  const packageNameFromSimple = parts[0];
  return packageNameFromSimple;
};

const extractPackageName = (nameWithoutExt: string): string => {
  if (!nameWithoutExt.includes("+")) return nameWithoutExt;

  const parts = nameWithoutExt.split("+");
  const isScoped = nameWithoutExt.startsWith("@");

  const packageName = isScoped
    ? extractPackageNameFromScoped(parts)
    : extractPackageNameFromSimple(parts);
  return packageName;
};

const addPatchToMap = (
  patchMap: Record<string, string[]>,
  packageName: string,
  patchFile: string,
): Record<string, string[]> => {
  const existingPatches = patchMap[packageName] || [];
  if (existingPatches.includes(patchFile)) return patchMap;
  const patches = existingPatches.concat(patchFile);
  const result = Object.assign({}, patchMap, { [packageName]: patches });
  return result;
};

const processPatchFile = (
  patchFile: string,
  patchMap: Record<string, string[]>,
): Record<string, string[]> => {
  const basename = extractBasename(patchFile);
  const isPatchFile = basename.endsWith(".patch");

  if (!isPatchFile) return patchMap;

  const nameWithoutExt = extractNameWithoutExtension(basename);
  const packageName = extractPackageName(nameWithoutExt);

  const hasPackageName = Boolean(packageName);
  if (!hasPackageName) return patchMap;

  log.debug(`Found patch for ${packageName}: ${patchFile}`, "processPatchFile");

  const result = addPatchToMap(patchMap, packageName, patchFile);
  return result;
};

const buildPatchMap = (
  patchFiles: string[],
  initial: Record<string, string[]> = {},
): Record<string, string[]> => {
  const patchMap = patchFiles.reduce((map, file) => processPatchFile(file, map), initial);
  return patchMap;
};

export const detectPatches = (root: string = "./"): Record<string, string[]> => {
  try {
    const configured = readConfiguredPatches(root);
    const configuredFiles = new Set(configured.map(([, file]) => file));
    const patchFiles = fg.sync(PATCH_PATTERNS, { cwd: root });
    const unconfigured = patchFiles.filter((file) => !configuredFiles.has(file));
    const initial = configured.reduce((map, [name, file]) => addPatchToMap(map, name, file), {});
    const result = buildPatchMap(unconfigured, initial);
    return result;
  } catch (err) {
    log.error("Error detecting patches", "detectPatches", err);
    const result2: Record<string, string[]> = {};
    return result2;
  }
};

const readConfiguredPatches = (root: string): [string, string][] => {
  const manifest = readPatchSettings(root, PACKAGE_JSON);
  const workspace = readPatchSettings(root, PNPM_WORKSPACE_FILE);
  const settings = Object.assign({}, manifest, workspace);
  const entries = Object.entries(settings).flatMap((entry) => configuredPatchEntry(root, entry));
  return entries;
};

const readPatchSettings = (root: string, filename: string): Record<string, unknown> => {
  const empty = {};
  const path = resolve(root, filename);
  if (!existsSync(path)) return empty;
  try {
    const content = readFileSync(path, "utf8");
    if (filename === PNPM_WORKSPACE_FILE) {
      const mapping = parsePnpmWorkspaceMapping(content, "patchedDependencies");
      return mapping;
    }
    const mapping = parseManifestPatchSettings(content);
    return mapping;
  } catch (error) {
    log.debug("Could not read pnpm patch settings", "readPatchSettings", error);
    return empty;
  }
};

const parseManifestPatchSettings = (content: string): Record<string, unknown> => {
  const empty = {};
  const manifest: unknown = JSON.parse(content);
  if (!isRecord(manifest)) return empty;
  const pnpm = manifest.pnpm;
  if (!isRecord(pnpm)) return empty;
  const patches = pnpm.patchedDependencies;
  if (!isRecord(patches)) return empty;
  return patches;
};

const configuredPatchEntry = (root: string, [selector, path]: [string, unknown]) => {
  const empty: [string, string][] = [];
  if (typeof path !== "string") return empty;
  try {
    const absolutePath = resolve(root, path);
    if (!statSync(absolutePath).isFile()) return empty;
    const patchFile = relative(resolve(root), absolutePath).split(sep).join("/");
    const packageName = extractPackageNameFromKey(selector);
    if (!packageName) return empty;
    const entry: [string, string] = [packageName, patchFile];
    const entries = [entry];
    return entries;
  } catch {
    return empty;
  }
};

export const getPackagePatches = (
  packageName: string,
  patchMap: Record<string, string[]>,
): string[] => {
  const packagePatches = patchMap[packageName] || [];
  return packagePatches;
};

const isPackageInDependencies = (
  packageName: string,
  allDependencies: Record<string, string>,
): boolean => {
  const result = Boolean(allDependencies[packageName]);
  return result;
};

const collectUnusedPatches = (
  entries: [string, string[]][],
  allDependencies: Record<string, string>,
): string[] => {
  const unused = entries.flatMap(([packageName, patches]) => {
    const isUsed = isPackageInDependencies(packageName, allDependencies);

    if (isUsed) {
      const empty: string[] = [];
      return empty;
    }

    log.debug(
      `Found unused patches for ${packageName}: ${patches.join(", ")}`,
      "collectUnusedPatches",
    );

    return patches;
  });
  return unused;
};

export const findUnusedPatches = (
  patchMap: Record<string, string[]>,
  allDependencies: Record<string, string>,
): string[] => {
  const entries = Object.entries(patchMap);
  const unusedPatches = collectUnusedPatches(entries, allDependencies);
  return unusedPatches;
};

const extractPackageNameFromKey = (key: string): string => {
  const lastAtIndex = key.lastIndexOf("@");
  if (lastAtIndex <= 0) return key;
  const packageNameFromKey = key.slice(0, lastAtIndex);
  return packageNameFromKey;
};

const addPatchesToAppendixEntry = (
  appendix: Appendix,
  key: string,
  patchMap: Record<string, string[]>,
): Appendix => {
  const packageName = extractPackageNameFromKey(key);
  const patches = getPackagePatches(packageName, patchMap);
  const hasPatches = patches.length > 0;

  if (!hasPatches) return appendix;

  const item = Object.assign({}, appendix[key], { patches });
  const result = Object.assign({}, appendix, { [key]: item });
  return result;
};

export const attachPatchesToAppendix = (
  appendix: Appendix,
  patchMap: Record<string, string[]>,
): Appendix => {
  const keys = Object.keys(appendix);

  const result = keys.reduce((acc, key) => addPatchesToAppendixEntry(acc, key, patchMap), appendix);
  return result;
};
