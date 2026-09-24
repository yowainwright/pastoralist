import * as fg from "../utils/glob";
import { IS_DEBUGGING } from "../constants";
import type { Appendix } from "../types";
import { logger } from "../observability";
import { PATCH_PATTERNS } from "./constants";

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

const buildPatchMap = (patchFiles: string[]): Record<string, string[]> => {
  const patchMap = patchFiles.reduce(
    (map, file) => processPatchFile(file, map),
    {} as Record<string, string[]>,
  );
  return patchMap;
};

export const detectPatches = (root: string = "./"): Record<string, string[]> => {
  try {
    const patchFiles = fg.sync(PATCH_PATTERNS, { cwd: root });
    const result = buildPatchMap(patchFiles);
    return result;
  } catch (err) {
    log.error("Error detecting patches", "detectPatches", err);
    const result2: Record<string, string[]> = {};
    return result2;
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
