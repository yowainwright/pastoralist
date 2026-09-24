import { IS_DEBUGGING } from "../../constants";
import type {
  OverridesConfig,
  ResolveOverrides,
  OverridesType,
  OverrideValue,
  ResolveResolutionOptions,
} from "../../types";
import { logger } from "../../observability";
import type { OverrideSource, OverrideType } from "./types";

const log = logger({ file: "overrides.ts", isLogging: IS_DEBUGGING });

const buildOverrideTypes = (
  overrides: Record<string, OverrideValue>,
  pnpm: { overrides?: Record<string, OverrideValue> } | undefined,
  resolutions: Record<string, string>,
): OverrideType[] => {
  const pnpmOverrides = pnpm?.overrides || {};

  const overrideTypes: OverrideType[] = [
    { type: "overrides", overrides },
    { type: "pnpmOverrides", overrides: pnpmOverrides },
    { type: "resolutions", overrides: resolutions },
  ];
  return overrideTypes;
};

export const defineOverride = ({
  overrides = {},
  pnpm = {},
  resolutions = {},
}: OverridesConfig = {}) => {
  const overrideTypes = buildOverrideTypes(overrides, pnpm, resolutions);
  const nonEmptyTypes = overrideTypes.filter(
    ({ overrides: values }) => Object.keys(values).length > 0,
  );
  const hasMultiple = nonEmptyTypes.length > 1;

  if (hasMultiple) {
    log.error("Only 1 override object allowed", "defineOverride");
    return undefined;
  }

  const [override] = nonEmptyTypes;
  return override;
};

const buildPnpmResult = (overrides: OverridesType): ResolveOverrides => {
  const pnpm = { overrides };
  const result: ResolveOverrides = { type: "pnpm", pnpm };
  return result;
};

const buildResolutionsResult = (overrides: OverridesType): ResolveOverrides => {
  const resolutions = overrides as Record<string, string>;
  const result: ResolveOverrides = { type: "resolutions", resolutions };
  return result;
};

const buildNpmResult = (overrides: OverridesType): ResolveOverrides => {
  const result: ResolveOverrides = { type: "npm", overrides };
  return result;
};

const buildResultByType = (type: string, overrides: OverridesType): ResolveOverrides => {
  if (type === "pnpmOverrides") {
    const resultByType: ResolveOverrides = buildPnpmResult(overrides);
    return resultByType;
  }
  if (type === "resolutions") {
    const result: ResolveOverrides = buildResolutionsResult(overrides);
    return result;
  }
  const result2: ResolveOverrides = buildNpmResult(overrides);
  return result2;
};

export const resolveOverridesFromSource = (source: OverrideSource): ResolveOverrides => {
  if (Object.keys(source.overrides).length === 0) return undefined;
  if (source.field === "resolutions") {
    const overridesFromSource: ResolveOverrides = buildResolutionsResult(source.overrides);
    return overridesFromSource;
  }
  if (source.packageManager === "pnpm") {
    const result: ResolveOverrides = buildPnpmResult(source.overrides);
    return result;
  }
  const result2: ResolveOverrides = buildNpmResult(source.overrides);
  return result2;
};

export const resolveOverrides = ({ config = {} }: ResolveResolutionOptions): ResolveOverrides => {
  const overrideData = defineOverride(config);
  if (!overrideData) {
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

  const overrides = Object.assign({}, initialOverrides);
  const result: ResolveOverrides = buildResultByType(type, overrides);
  return result;
};

export const getOverridesByType = (data: ResolveOverrides): OverridesType | undefined => {
  const type = data?.type;
  if (!type) {
    log.error("no type found", "getOverridesByType");
    return undefined;
  }

  if (type === "resolutions") {
    const { resolutions } = data!;
    return resolutions;
  }
  if (type === "pnpm") {
    const { overrides: pnpmOverrides } = data?.pnpm ?? {};
    return pnpmOverrides;
  }
  const { overrides } = data!;
  return overrides;
};

const filterRemovedOverrides = (
  overrides: OverridesType,
  removableItems: string[],
): OverridesType => {
  const removed = new Set(removableItems);
  const entries = Object.entries(overrides).filter(([key]) => !removed.has(key));
  const remaining = Object.fromEntries(entries);
  return remaining;
};

export const updateOverrides = (
  overrideData: ResolveOverrides,
  removableItems: string[],
): OverridesType | undefined => {
  if (!overrideData) return undefined;

  const overrides = getOverridesByType(overrideData);
  const hasOverrides = overrides && Object.keys(overrides).length > 0;
  if (!hasOverrides) {
    log.debug("No overrides found to update", "updateOverrides");
    return undefined;
  }

  const result = filterRemovedOverrides(overrides, removableItems);
  return result;
};

export { applyOverridesToSourceConfig, resolveOverrideSource, writeOverrideSource } from "./utils";
export { parsePnpmWorkspaceOverrides, updatePnpmWorkspaceOverrides } from "../../mgrs/pnpm/utils";
export type { OverrideSource, OverrideSourceKind } from "./types";
