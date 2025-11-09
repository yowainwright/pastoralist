import * as fg from "../utils/glob";
import { IS_DEBUGGING } from "../constants";
import type { Appendix } from "../types";
import { logger } from "../utils";

const log = logger({ file: "patches.ts", isLogging: IS_DEBUGGING });

const PATCH_PATTERNS = [
  "patches/*.patch",
  ".patches/*.patch",
  "*.patch",
  "patches/**/*.patch",
];

const extractBasename = (filePath: string): string => {
  return filePath.split("/").pop() || "";
};

const extractNameWithoutExtension = (basename: string): string => {
  return basename.replace(".patch", "");
};

const extractPackageNameFromScoped = (parts: string[]): string => {
  const hasScopedName = parts.length >= 2;
  return hasScopedName ? `${parts[0]}/${parts[1]}` : parts[0];
};

const extractPackageNameFromSimple = (parts: string[]): string => {
  return parts[0];
};

const extractPackageName = (nameWithoutExt: string): string => {
  const hasNoVersion = !nameWithoutExt.includes("+");
  if (hasNoVersion) return nameWithoutExt;

  const parts = nameWithoutExt.split("+");
  const isScoped = nameWithoutExt.startsWith("@");

  return isScoped
    ? extractPackageNameFromScoped(parts)
    : extractPackageNameFromSimple(parts);
};

const addPatchToMap = (
  patchMap: Record<string, string[]>,
  packageName: string,
  patchFile: string
): Record<string, string[]> => {
  const existingPatches = patchMap[packageName] || [];
  return {
    ...patchMap,
    [packageName]: [...existingPatches, patchFile],
  };
};

const processPatchFile = (
  patchFile: string,
  patchMap: Record<string, string[]>
): Record<string, string[]> => {
  const basename = extractBasename(patchFile);
  const isPatchFile = basename.endsWith(".patch");

  if (!isPatchFile) return patchMap;

  const nameWithoutExt = extractNameWithoutExtension(basename);
  const packageName = extractPackageName(nameWithoutExt);

  const hasPackageName = Boolean(packageName);
  if (!hasPackageName) return patchMap;

  log.debug(`Found patch for ${packageName}: ${patchFile}`, "processPatchFile");

  return addPatchToMap(patchMap, packageName, patchFile);
};

const buildPatchMap = (patchFiles: string[]): Record<string, string[]> => {
  return patchFiles.reduce(
    (map, file) => processPatchFile(file, map),
    {} as Record<string, string[]>
  );
};

export const detectPatches = (root: string = "./"): Record<string, string[]> => {
  try {
    const patchFiles = fg.sync(PATCH_PATTERNS, { cwd: root });
    return buildPatchMap(patchFiles);
  } catch (err) {
    log.error("Error detecting patches", "detectPatches", err);
    return {};
  }
};

export const getPackagePatches = (
  packageName: string,
  patchMap: Record<string, string[]>
): string[] => {
  return patchMap[packageName] || [];
};

const isPackageInDependencies = (
  packageName: string,
  allDependencies: Record<string, string>
): boolean => {
  return Boolean(allDependencies[packageName]);
};

const collectUnusedPatches = (
  entries: [string, string[]][],
  allDependencies: Record<string, string>
): string[] => {
  return entries.flatMap(([packageName, patches]) => {
    const isUsed = isPackageInDependencies(packageName, allDependencies);

    if (isUsed) return [];

    log.debug(
      `Found unused patches for ${packageName}: ${patches.join(", ")}`,
      "collectUnusedPatches"
    );

    return patches;
  });
};

export const findUnusedPatches = (
  patchMap: Record<string, string[]>,
  allDependencies: Record<string, string>
): string[] => {
  const entries = Object.entries(patchMap);
  return collectUnusedPatches(entries, allDependencies);
};

const extractPackageNameFromKey = (key: string): string => {
  return key.split("@")[0];
};

const addPatchesToAppendixEntry = (
  appendix: Appendix,
  key: string,
  patchMap: Record<string, string[]>
): Appendix => {
  const packageName = extractPackageNameFromKey(key);
  const patches = getPackagePatches(packageName, patchMap);
  const hasPatches = patches.length > 0;

  if (!hasPatches) return appendix;

  return {
    ...appendix,
    [key]: {
      ...appendix[key],
      patches,
    },
  };
};

export const attachPatchesToAppendix = (
  appendix: Appendix,
  patchMap: Record<string, string[]>
): Appendix => {
  const keys = Object.keys(appendix);

  return keys.reduce(
    (acc, key) => addPatchesToAppendixEntry(acc, key, patchMap),
    appendix
  );
};
