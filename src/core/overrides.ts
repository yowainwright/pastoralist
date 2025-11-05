import { IS_DEBUGGING } from "../constants";
import type { OverridesConfig, ResolveOverrides, OverridesType, ResolveResolutionOptions } from "../types";
import { logger } from "../utils";

const log = logger({ file: "overrides.ts", isLogging: IS_DEBUGGING });

const hasNpmOverrides = (overrides: Record<string, any>): boolean => {
  return Object.keys(overrides).length > 0;
};

const hasPnpmOverrides = (pnpm: { overrides?: Record<string, any> } | undefined): boolean => {
  const pnpmOverrides = pnpm?.overrides || {};
  return Object.keys(pnpmOverrides).length > 0;
};

const hasResolutions = (resolutions: Record<string, string>): boolean => {
  return Object.keys(resolutions).length > 0;
};

const hasAnyOverrides = (
  npmOverrides: boolean,
  pnpmOverrides: boolean,
  resolutionsExist: boolean
): boolean => {
  return npmOverrides || pnpmOverrides || resolutionsExist;
};

type OverrideType = { type: string; overrides: Record<string, any> };

const buildOverrideTypes = (
  overrides: Record<string, any>,
  pnpm: { overrides?: Record<string, any> } | undefined,
  resolutions: Record<string, string>
): OverrideType[] => {
  const pnpmOverrides = pnpm?.overrides || {};

  return [
    { type: "overrides", overrides },
    { type: "pnpmOverrides", overrides: pnpmOverrides },
    { type: "resolutions", overrides: resolutions },
  ];
};

const filterNonEmptyOverrides = (
  overrideTypes: OverrideType[]
): OverrideType[] => {
  return overrideTypes.filter(
    ({ overrides }) => Object.keys(overrides).length > 0
  );
};

const hasMultipleOverrideTypes = (
  overrideTypes: OverrideType[]
): boolean => {
  return overrideTypes.length > 1;
};

export const defineOverride = ({
  overrides = {},
  pnpm = {},
  resolutions = {},
}: OverridesConfig = {}) => {
  const npmOverrides = hasNpmOverrides(overrides);
  const pnpmOverridesExist = hasPnpmOverrides(pnpm);
  const resolutionsExist = hasResolutions(resolutions);
  const hasAny = hasAnyOverrides(npmOverrides, pnpmOverridesExist, resolutionsExist);

  if (!hasAny) return undefined;

  const overrideTypes = buildOverrideTypes(overrides, pnpm, resolutions);
  const nonEmptyTypes = filterNonEmptyOverrides(overrideTypes);
  const hasMultiple = hasMultipleOverrideTypes(nonEmptyTypes);

  if (hasMultiple) {
    log.error("Only 1 override object allowed", "defineOverride");
    return undefined;
  }

  return nonEmptyTypes[0];
};

const normalizeOverrides = (
  initialOverrides: Record<string, any>
): OverridesType => {
  const overridesItems = Object.keys(initialOverrides);

  return overridesItems.reduce((acc, name) => {
    const value = initialOverrides[name];
    acc[name] = value;
    return acc;
  }, {} as OverridesType);
};

const buildPnpmResult = (overrides: OverridesType): ResolveOverrides => {
  return { type: "pnpm", pnpm: { overrides } };
};

const buildResolutionsResult = (
  overrides: OverridesType
): ResolveOverrides => {
  return { type: "resolutions", resolutions: overrides as Record<string, string> };
};

const buildNpmResult = (overrides: OverridesType): ResolveOverrides => {
  return { type: "npm", overrides };
};

const buildResultByType = (
  type: string,
  overrides: OverridesType
): ResolveOverrides => {
  if (type === "pnpmOverrides") return buildPnpmResult(overrides);
  if (type === "resolutions") return buildResolutionsResult(overrides);
  return buildNpmResult(overrides);
};

export const resolveOverrides = ({
  config = {},
}: ResolveResolutionOptions): ResolveOverrides => {
  const overrideData = defineOverride(config);
  const hasNoOverrideData = !overrideData;

  if (hasNoOverrideData) {
    log.debug("No overrides configuration found", "resolveOverrides");
    return undefined;
  }

  const { type, overrides: initialOverrides } = overrideData;
  const hasOverridesData = Object.keys(initialOverrides).length > 0;
  const hasType = Boolean(type);
  const isValid = hasOverridesData && hasType;

  if (!isValid) {
    log.debug("No active overrides found", "resolveOverrides");
    return undefined;
  }

  const overrides = normalizeOverrides(initialOverrides);
  return buildResultByType(type, overrides);
};

const getResolutions = (data: ResolveOverrides): OverridesType | undefined => {
  return data?.resolutions;
};

const getPnpmOverrides = (data: ResolveOverrides): OverridesType | undefined => {
  return data?.pnpm?.overrides;
};

const getNpmOverrides = (data: ResolveOverrides): OverridesType | undefined => {
  return data?.overrides;
};

export const getOverridesByType = (data: ResolveOverrides): OverridesType | undefined => {
  const type = data?.type;
  const hasNoType = !type;

  if (hasNoType) {
    log.error("no type found", "getOverridesByType");
    return undefined;
  }

  if (type === "resolutions") return getResolutions(data);
  if (type === "pnpm") return getPnpmOverrides(data);
  return getNpmOverrides(data);
};

const shouldKeepOverride = (
  key: string,
  removableItems: string[]
): boolean => {
  return !removableItems.includes(key);
};

const filterRemovedOverrides = (
  overrides: OverridesType,
  removableItems: string[]
): OverridesType => {
  return Object.entries(overrides).reduce((acc, [key, value]) => {
    const shouldKeep = shouldKeepOverride(key, removableItems);

    if (shouldKeep) {
      acc[key] = value;
    }

    return acc;
  }, {} as OverridesType);
};

export const updateOverrides = (
  overrideData: ResolveOverrides,
  removableItems: string[]
): OverridesType | undefined => {
  const hasNoData = !overrideData;

  if (hasNoData) return undefined;

  const overrides = getOverridesByType(overrideData);
  const hasNoOverrides = !overrides || Object.keys(overrides).length === 0;

  if (hasNoOverrides) {
    log.debug("No overrides found to update", "updateOverrides");
    return undefined;
  }

  return filterRemovedOverrides(overrides, removableItems);
};
