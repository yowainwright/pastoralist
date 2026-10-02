import type {
  SecurityOverrideDetail,
  PastoralistJSON,
  SecurityProviderType,
  CveDetail,
  LedgerReason,
  PersistedAppendix,
  CompactAppendixItem,
} from "../../types";
import type { Appendix, AppendixItem, OverridesType, OverrideValue } from "../../types";
import type {
  PartialSecurityLedger,
  CompactAppendix,
  AppendixLedgerArgs,
  DependencyInfoArgs,
  Ledger,
  LedgerChangeField,
} from "./types";
import type { LedgerTransform } from "../types";
import { compareVersions, omit, packageAtVersion } from "../../utils";
import { getSeverityScore } from "../security/utils";
import {
  APPENDIX_SEMVER_PATTERN,
  NPM_ALIAS_PREFIX,
  OVERRIDE_PARENT_SEPARATOR_PATTERN,
  PACKAGE_NAME_PATTERN,
  REQUIRED_BY_DEPENDENT_LIMIT,
  LEDGER_CHANGE_FIELDS,
  REQUIRED_BY_LABEL,
  SECURITY_CONFIDENCE_CONFIRMED,
  SECURITY_CONFIDENCE_CONFIRMATION_THRESHOLD,
  SECURITY_CONFIDENCE_POSSIBLE,
  SECURITY_LEDGER_SOURCE,
  TRANSITIVE_DEPENDENCY_LABEL,
  UNRESOLVED_OVERRIDE_KEY_LABEL,
  UNUSED_OVERRIDE_LABEL,
} from "./constants";

const getReasonFromSecurityDetails = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
): LedgerReason | undefined => {
  const reasonFromSecurityDetails = securityOverrideDetails?.find(
    (detail) => detail.packageName === packageName,
  )?.reason;
  return reasonFromSecurityDetails;
};

const getManualReason = (
  packageName: string,
  manualOverrideReasons?: Record<string, LedgerReason>,
): LedgerReason | undefined => {
  const manualReason = manualOverrideReasons?.[packageName];
  return manualReason;
};

export const mergeOverrideReasons = (
  packageName: string,
  reason?: LedgerReason,
  securityOverrideDetails?: SecurityOverrideDetail[],
  manualOverrideReasons?: Record<string, LedgerReason>,
): LedgerReason | undefined => {
  if (reason) return reason;

  const securityReason = getReasonFromSecurityDetails(packageName, securityOverrideDetails);
  if (securityReason) return securityReason;

  const overrideReasons = getManualReason(packageName, manualOverrideReasons);
  return overrideReasons;
};

const findAllSecurityDetails = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
): SecurityOverrideDetail[] => {
  const allSecurityDetails =
    securityOverrideDetails?.filter((d) => d.packageName === packageName) || [];
  return allSecurityDetails;
};

const buildBaseLedger = (): PartialSecurityLedger => {
  const securityCheckDate = new Date().toISOString();
  const ledger: PartialSecurityLedger = {
    source: SECURITY_LEDGER_SOURCE,
    securityChecked: true,
    securityCheckDate,
  };
  return ledger;
};

const addProviderToLedger = (
  ledger: PartialSecurityLedger,
  securityProvider?: SecurityProviderType,
): PartialSecurityLedger => {
  const hasProvider = Boolean(securityProvider);
  if (!hasProvider) return ledger;
  const result = Object.assign({}, ledger, { securityProvider });
  return result;
};

const addCvesToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const allCves = details.flatMap((d) => d.cves || []);
  const uniqueCves = Array.from(new Set(allCves));
  if (uniqueCves.length === 0) return ledger;
  const result = Object.assign({}, ledger, { cves: uniqueCves });
  return result;
};

const addSeverityToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const severities = details.map((d) => d.severity).filter(Boolean) as Array<
    "low" | "medium" | "high" | "critical"
  >;
  if (severities.length === 0) return ledger;
  const highest = severities.reduce((best, s) => {
    const isBetter = getSeverityScore(s) > getSeverityScore(best);
    const result = isBetter ? s : best;
    return result;
  });
  const result = Object.assign({}, ledger, { severity: highest });
  return result;
};

const addUrlToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const url = details.find((d) => d.url)?.url;
  if (!url) return ledger;
  const result = Object.assign({}, ledger, { url });
  return result;
};

const addVulnerableRangeToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const vulnerableRange = details.find((d) => d.vulnerableRange)?.vulnerableRange;
  if (!vulnerableRange) return ledger;
  const result = Object.assign({}, ledger, { vulnerableRange });
  return result;
};

const addPatchedVersionToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const patchedVersion = details.find((d) => d.patchedVersion)?.patchedVersion;
  if (!patchedVersion) return ledger;
  const result = Object.assign({}, ledger, { patchedVersion });
  return result;
};

const addSourcesToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const allSources = details.flatMap((d) => d.sources || []);
  const uniqueSources = Array.from(new Set(allSources)) as SecurityProviderType[];
  if (uniqueSources.length === 0) return ledger;
  const result = Object.assign({}, ledger, { sources: uniqueSources });
  return result;
};

const addConfidenceToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const allSources = details.flatMap((d) => d.sources || []);
  const uniqueSources = Array.from(new Set(allSources));
  if (uniqueSources.length === 0) return ledger;
  const isConfirmed = uniqueSources.length >= SECURITY_CONFIDENCE_CONFIRMATION_THRESHOLD;
  const confidence = isConfirmed ? SECURITY_CONFIDENCE_CONFIRMED : SECURITY_CONFIDENCE_POSSIBLE;
  const result = Object.assign({}, ledger, { confidence });
  return result;
};

const buildCveDetails = (details: SecurityOverrideDetail[]): CveDetail[] => {
  const allEntries = details.flatMap(buildCveDetailEntries);
  const cveMap = allEntries.reduce((map, [cve, detail]) => {
    if (!map.has(cve)) map.set(cve, detail);
    return map;
  }, new Map<string, CveDetail>());
  const cveDetails = Array.from(cveMap.values());
  return cveDetails;
};

const buildCveDetailEntries = (detail: SecurityOverrideDetail): Array<[string, CveDetail]> => {
  const cves = detail.cves || [];
  const cveDetailEntries = cves.map((cve): [string, CveDetail] => [
    cve,
    createCveDetail(cve, detail),
  ]);
  return cveDetailEntries;
};

const createCveDetail = (cve: string, detail: SecurityOverrideDetail): CveDetail => {
  const cveDetail: CveDetail = { cve };
  if (detail.severity) cveDetail.severity = detail.severity;
  if (detail.patchedVersion) cveDetail.patchedVersion = detail.patchedVersion;
  return cveDetail;
};

const addCveDetailsToLedger = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const cveDetails = buildCveDetails(details);
  if (cveDetails.length === 0) return ledger;
  const result = Object.assign({}, ledger, { cveDetails });
  return result;
};

const applySecurityDetails = (
  ledger: PartialSecurityLedger,
  details: SecurityOverrideDetail[],
): PartialSecurityLedger => {
  const transforms: LedgerTransform[] = [
    (l) => addCvesToLedger(l, details),
    (l) => addCveDetailsToLedger(l, details),
    (l) => addSeverityToLedger(l, details),
    (l) => addUrlToLedger(l, details),
    (l) => addVulnerableRangeToLedger(l, details),
    (l) => addPatchedVersionToLedger(l, details),
    (l) => addSourcesToLedger(l, details),
    (l) => addConfidenceToLedger(l, details),
  ];

  const securityLedger = transforms.reduce((acc, fn) => fn(acc), ledger);
  return securityLedger;
};

export const createSecurityLedger = (
  packageName: string,
  securityOverrideDetails?: SecurityOverrideDetail[],
  securityProvider?: SecurityProviderType,
): PartialSecurityLedger => {
  const details = findAllSecurityDetails(packageName, securityOverrideDetails);
  if (details.length === 0) {
    const empty: PartialSecurityLedger = {};
    return empty;
  }
  const ledger = addProviderToLedger(buildBaseLedger(), securityProvider);
  const securityLedger = applySecurityDetails(ledger, details);
  return securityLedger;
};

export const normalizeLedgerCveField = (
  ledger: NonNullable<AppendixItem["ledger"]>,
): NonNullable<AppendixItem["ledger"]> => {
  const legacyLedger = ledger as NonNullable<AppendixItem["ledger"]> & {
    cve?: string;
  };
  if (!legacyLedger.cve) return ledger;
  const { cve, ...rest } = legacyLedger;
  const existingCves = rest.cves || [];
  const merged = Array.from(new Set(existingCves.concat(cve)));
  const result = Object.assign({}, rest, { cves: merged });
  return result;
};

const buildNewLedger = (
  reason: LedgerReason | undefined,
  securityLedger: Omit<NonNullable<AppendixItem["ledger"]>, "addedDate" | "reason">,
  addedDate?: string,
): NonNullable<AppendixItem["ledger"]> => {
  const resolvedDate = addedDate || new Date().toISOString();
  const baseLedger = { addedDate: resolvedDate };
  const reasonField = reason ? { reason } : undefined;
  const ledgerWithReason = Object.assign({}, baseLedger, reasonField);
  const newLedger = Object.assign({}, ledgerWithReason, securityLedger);
  return newLedger;
};

export const buildAppendixItem = (
  dependents: Record<string, string>,
  existingLedger: AppendixItem["ledger"],
  reason: LedgerReason | undefined,
  ...[securityLedger, addedDate]: AppendixLedgerArgs
): AppendixItem => {
  const hasExistingLedger = Boolean(existingLedger);
  const rawLedger = hasExistingLedger
    ? existingLedger
    : buildNewLedger(reason, securityLedger, addedDate);
  const ledger = rawLedger ? normalizeLedgerCveField(rawLedger) : rawLedger;

  const appendixItem: AppendixItem = { dependents, ledger };
  return appendixItem;
};

export const mergeDependents = (
  currentDependents: Record<string, string>,
  packageName: string,
  dependentInfo: string,
): Record<string, string> => {
  const dependents = Object.assign({}, currentDependents, { [packageName]: dependentInfo });
  return dependents;
};

export const isResolvablePackageName = PACKAGE_NAME_PATTERN.test.bind(PACKAGE_NAME_PATTERN);

export const parseOverridePackageName = (overrideKey: string): string => {
  const segments = overrideKey.split(OVERRIDE_PARENT_SEPARATOR_PATTERN);
  const target = (segments[segments.length - 1] ?? overrideKey).trim();
  const lastAtIndex = target.lastIndexOf("@");
  if (lastAtIndex <= 0) return target;
  const overridePackageName = target.slice(0, lastAtIndex);
  return overridePackageName;
};

const NO_DEPENDENTS: string[] = [];

const unseenParents = (
  frontier: string[],
  dependencyGraph: Record<string, string[]>,
  visited: Set<string>,
): string[] => {
  const parents = frontier.flatMap((name) => dependencyGraph[name] ?? []);
  const unique = Array.from(new Set(parents));
  const unseen = unique.filter((parent) => !visited.has(parent));
  return unseen;
};

const markVisited = (parents: string[], visited: Set<string>): void => {
  for (const parent of parents) visited.add(parent);
};

const recordTopLevel = (
  parents: string[],
  directDeps: Set<string>,
  topLevel: Set<string>,
): void => {
  for (const parent of parents) {
    if (directDeps.has(parent)) topLevel.add(parent);
  }
};

const indirectParents = (parents: string[], directDeps: Set<string>): string[] =>
  parents.flatMap((parent) => (directDeps.has(parent) ? [] : [parent]));

export const findTopLevelDependents = (
  name: string,
  dependencyGraph: Record<string, string[]> | undefined,
  directDeps: Set<string>,
): string[] => {
  if (!dependencyGraph) return NO_DEPENDENTS;
  const visited = new Set([name]);
  const topLevel = new Set<string>();
  let frontier = [name];
  while (frontier.length > 0) {
    const parents = unseenParents(frontier, dependencyGraph, visited);
    markVisited(parents, visited);
    recordTopLevel(parents, directDeps, topLevel);
    frontier = indirectParents(parents, directDeps);
  }
  const sorted = Array.from(topLevel).toSorted();
  return sorted;
};

const pickIndirectLabel = (topLevel: string[], isLockedOnly: boolean): string => {
  const isTransitive = topLevel.length > 0 || isLockedOnly;
  const label = isTransitive ? TRANSITIVE_DEPENDENCY_LABEL : UNUSED_OVERRIDE_LABEL;
  return label;
};

const describeNamedDependents = (override: string, topLevel: string[]): string => {
  const dependents = topLevel.slice(0, REQUIRED_BY_DEPENDENT_LIMIT).join(", ");
  const info = `${override} (${REQUIRED_BY_LABEL} ${dependents})`;
  return info;
};

const describeIndirectDependency = (
  override: string,
  name: string,
  ...[dependencyTree, dependencyGraph, directDeps]: DependencyInfoArgs
): string => {
  const immediate = dependencyGraph?.[name] ?? NO_DEPENDENTS;
  const topLevel = directDeps
    ? findTopLevelDependents(name, dependencyGraph, directDeps)
    : immediate;
  const canNameDependents = override.trim() === name && topLevel.length > 0;
  if (canNameDependents) {
    const info = describeNamedDependents(override, topLevel);
    return info;
  }
  const hasGraphParents = Boolean(dependencyGraph?.[name]?.length);
  const isLockedOnly = !hasGraphParents && Boolean(dependencyTree?.[name]);
  const label = pickIndirectLabel(topLevel, isLockedOnly);
  const info = `${override} ${label}`;
  return info;
};

export const buildDependentInfo = (
  hasOverride: boolean,
  override: string,
  packageVersion: string | undefined,
  ...graphArgs: DependencyInfoArgs
): string => {
  if (hasOverride) {
    const info = packageAtVersion(override)(packageVersion ?? "");
    return info;
  }
  const name = parseOverridePackageName(override);
  if (!isResolvablePackageName(name)) {
    const info = `${override} ${UNRESOLVED_OVERRIDE_KEY_LABEL}`;
    return info;
  }
  const info = describeIndirectDependency(override, name, ...graphArgs);
  return info;
};

export const isNestedOverride = (
  overrideValue: OverrideValue | null | undefined,
): overrideValue is Record<string, string> => {
  const isNested = typeof overrideValue === "object" && overrideValue !== null;
  return isNested;
};

const hasNoDependents = (item: AppendixItem): boolean => {
  const hasDependents = Boolean(item?.dependents);
  if (!hasDependents) return true;

  const result = Object.keys(item.dependents!).length === 0;
  return result;
};

export const removeEmptyEntries = (appendix: Appendix): Appendix => {
  const keys = Object.keys(appendix);
  const nonEmptyKeys = keys.filter((key) => {
    const item = appendix[key];
    if (!item) return false;
    const result = !hasNoDependents(item);
    return result;
  });

  const result = nonEmptyKeys.reduce((acc, key) => {
    acc[key] = appendix[key];
    return acc;
  }, {} as Appendix);
  return result;
};

export const mergeDependenciesForPackage = (
  packageConfig: PastoralistJSON | undefined,
): Record<string, string> => {
  const dependencies = packageConfig?.dependencies || {};
  const devDependencies = packageConfig?.devDependencies || {};
  const peerDependencies = packageConfig?.peerDependencies || {};

  const dependenciesForPackage = Object.assign({}, dependencies, devDependencies, peerDependencies);
  return dependenciesForPackage;
};

export const hasDependenciesMatchingOverrides = (
  depList: string[],
  overridesList: string[],
): boolean => {
  const resolvedNames = new Set(overridesList.map(parseOverridePackageName));
  const result = depList.some((dep) => resolvedNames.has(dep));
  return result;
};

export const shouldWriteAppendix = (
  appendix: Appendix | undefined,
  writeAppendixToFile: boolean,
): boolean => {
  const hasAppendix = Boolean(appendix);
  if (!hasAppendix) return false;

  const hasEntries = Object.keys(appendix!).length > 0;
  const result = hasEntries && writeAppendixToFile;
  return result;
};

export const hasOverrides = (overrides: OverridesType | null): overrides is OverridesType => {
  if (!overrides) return false;
  const result = Object.keys(overrides).length > 0;
  return result;
};

export const mergeAppendixDependents = (
  currentAppendix: Appendix,
  key: string,
  value: AppendixItem,
): Appendix => {
  const existing = currentAppendix[key];
  const mergedDependents = Object.assign({}, existing?.dependents, value.dependents);
  const dependentsUpdate = { dependents: mergedDependents };
  const mergedItem: AppendixItem = Object.assign({}, existing, dependentsUpdate);
  const appendixDependents = Object.assign({}, currentAppendix, { [key]: mergedItem });
  return appendixDependents;
};

const sameValue = (a: unknown, b: unknown): boolean => {
  const isSame = JSON.stringify(a) === JSON.stringify(b);
  return isSame;
};

const sortedDependents = (dependents: Record<string, string>): string[][] => {
  const sorted = Object.entries(dependents).toSorted(([a], [b]) => a.localeCompare(b));
  return sorted;
};

const hasChangedDependents = (item: AppendixItem, previous: AppendixItem): boolean => {
  if (!previous.dependents) return false;
  const current = sortedDependents(item.dependents ?? {});
  const before = sortedDependents(previous.dependents);
  const isChanged = !sameValue(current, before);
  return isChanged;
};

const hasChangedLedgerField = (
  field: LedgerChangeField,
  fresh: Ledger,
  previous: Ledger,
): boolean => {
  const isReported = fresh[field] !== undefined;
  const isDifferent = !sameValue(fresh[field], previous[field]);
  const isChanged = isReported && isDifferent;
  return isChanged;
};

const hasChangedLedger = (fresh: Ledger | undefined, previous: Ledger | undefined): boolean => {
  if (!fresh) return false;
  const before = previous ?? ({} as Ledger);
  const isChanged = LEDGER_CHANGE_FIELDS.some((field) =>
    hasChangedLedgerField(field, fresh, before),
  );
  return isChanged;
};

const hasChangedSecurityCheckDate = (fresh: Ledger | undefined, previous: Ledger | undefined) => {
  const isReported = fresh?.securityCheckDate !== undefined;
  const isDifferent = !sameValue(fresh?.securityCheckDate, previous?.securityCheckDate);
  const isChanged = isReported && isDifferent;
  return isChanged;
};

const hasEntryContentChanged = (item: AppendixItem, previous: AppendixItem): boolean => {
  const dependentsChanged = hasChangedDependents(item, previous);
  const ledgerChanged = hasChangedLedger(item.ledger, previous.ledger);
  const isChanged = dependentsChanged || ledgerChanged;
  return isChanged;
};

const isUpdatedEntry = (item: AppendixItem, previous: AppendixItem): boolean => {
  const contentChanged = hasEntryContentChanged(item, previous);
  const checkDateChanged = hasChangedSecurityCheckDate(item.ledger, previous.ledger);
  const isUpdated = contentChanged || checkDateChanged;
  return isUpdated;
};

const carryLedger = (item: AppendixItem, previous: AppendixItem): Ledger | undefined => {
  const isUpdated = isUpdatedEntry(item, previous);
  const unchanged = previous.ledger ?? item.ledger;
  if (!isUpdated) return unchanged;
  const updated = Object.assign({}, previous.ledger, item.ledger);
  const contentChanged = hasEntryContentChanged(item, previous);
  const previousAddedDate = previous.ledger?.addedDate;
  const shouldRefreshAddedDate = contentChanged || previousAddedDate === undefined;
  if (shouldRefreshAddedDate) return updated;
  const carried = Object.assign({}, updated, { addedDate: previousAddedDate });
  return carried;
};

const carryPreviousItem = (
  item: AppendixItem,
  previous: AppendixItem | undefined,
): AppendixItem => {
  if (!previous) return item;
  const ledger = carryLedger(item, previous);
  const { dependents } = item;
  const carried = Object.assign({}, previous, { dependents, ledger });
  return carried;
};

export const carryExistingLedgers = (fresh: Appendix, existing: Appendix): Appendix => {
  const carriedEntries: Array<[string, AppendixItem]> = Object.entries(fresh).map(([key, item]) => [
    key,
    carryPreviousItem(item, existing[key]),
  ]);
  const keptEntries = Object.entries(existing).filter(
    ([key, item]) => !fresh[key] && isKeptEntry(item),
  );
  const carried = Object.fromEntries(carriedEntries.concat(keptEntries));
  return carried;
};

const isUnusedDependent = (info: string): boolean => info.includes(UNUSED_OVERRIDE_LABEL);

const dropSupersededUnused = (item: AppendixItem): AppendixItem => {
  const entries = Object.entries(item.dependents ?? {});
  const used = entries.filter(([, info]) => !isUnusedDependent(info));
  const isMixed = used.length > 0 && used.length < entries.length;
  if (!isMixed) return item;
  const dependents = Object.fromEntries(used);
  const trimmed = Object.assign({}, item, { dependents });
  return trimmed;
};

export const dropSupersededUnusedDependents = (appendix: Appendix): Appendix =>
  Object.fromEntries(
    Object.entries(appendix).map(([key, item]) => [key, dropSupersededUnused(item)]),
  );

export const hasSecurityInfo = (item: AppendixItem): boolean => {
  const ledger = item.ledger;
  if (!ledger) return false;
  if (ledger.source === "security") return true;
  const fields = [
    ledger.securityChecked,
    ledger.securityProvider,
    ledger.securityCheckResult,
    ledger.cves?.length,
    ledger.cveDetails?.length,
    ledger.severity,
    ledger.vulnerableRange,
    ledger.patchedVersion,
  ];
  const result = fields.some(Boolean);
  return result;
};

const hasPatches = (item: AppendixItem): boolean => {
  if (!item.patches) return false;
  const result = item.patches.length > 0;
  return result;
};

export const isKeptEntry = (item: AppendixItem): boolean => {
  const keep = item.ledger?.keep;
  const keepIsObject = typeof keep === "object";
  const isConstraintObject = keepIsObject && keep !== null;
  if (keep === true) return true;
  return isConstraintObject;
};

const isDateExpired = (until: string | undefined): boolean => {
  if (!until) return false;
  const now = new Date();
  const keepUntilDate = new Date(until);
  const expired = now >= keepUntilDate;
  return expired;
};

const toVersionSpec = (rawVersion: string | undefined): string | undefined => {
  const isAlias = rawVersion?.startsWith(NPM_ALIAS_PREFIX);
  if (!isAlias) return rawVersion;
  const aliasVersion = rawVersion?.slice(rawVersion.lastIndexOf("@") + 1);
  return aliasVersion;
};

const isVersionExpired = (
  untilVersion: string | undefined,
  rawVersion: string | undefined,
): boolean => {
  const [depVersion] = toVersionSpec(rawVersion)?.match(APPENDIX_SEMVER_PATTERN) ?? [];
  const [targetVersion] = untilVersion?.match(APPENDIX_SEMVER_PATTERN) ?? [];
  if (!depVersion) return false;
  if (!targetVersion) return false;
  const expired = compareVersions(depVersion, targetVersion) >= 0;
  return expired;
};

export const isKeepExpired = (
  item: AppendixItem,
  pkgName: string,
  rootDeps: Record<string, string>,
): boolean => {
  const keep = item.ledger?.keep;
  const canExpire = keep && keep !== true;
  if (!canExpire) return false;
  if (isDateExpired(keep.until)) return true;
  const expired = isVersionExpired(keep.untilVersion, rootDeps[pkgName]);
  return expired;
};

const canBeCompacted = (item: AppendixItem): boolean => {
  if (isKeptEntry(item)) return false;
  if (hasSecurityInfo(item)) return false;
  if (item.ledger?.reason) return false;
  const result = !hasPatches(item);
  return result;
};

const getAddedDate = (item: AppendixItem, addedDate?: string): string => {
  if (item.ledger?.addedDate) {
    const storedDate = item.ledger.addedDate;
    return storedDate;
  }
  if (addedDate) return addedDate;
  const currentDate = new Date().toISOString().split("T")[0];
  return currentDate;
};

const compactAppendixItem = (item: AppendixItem, addedDate?: string) => {
  if (!canBeCompacted(item)) return item;
  const date = getAddedDate(item, addedDate);
  const compact = { addedDate: date };
  return compact;
};

export const toCompactAppendix = (appendix: Appendix, addedDate?: string): CompactAppendix =>
  Object.entries(appendix).reduce<CompactAppendix>((acc, [key, item]) => {
    acc[key] = compactAppendixItem(item, addedDate);
    return acc;
  }, {});

const isCompactAppendixItem = (
  item: AppendixItem | CompactAppendixItem,
): item is CompactAppendixItem => "addedDate" in item;

const normalizeAppendixItem = (item: AppendixItem | CompactAppendixItem): AppendixItem => {
  if (!isCompactAppendixItem(item)) {
    const existingLedger = item.ledger;
    const ledger = existingLedger ? normalizeLedgerCveField(existingLedger) : existingLedger;
    if (ledger === existingLedger) return item;
    const normalizedItem = Object.assign({}, item, { ledger });
    return normalizedItem;
  }

  const { addedDate, ...appendixItem } = item;
  const existingLedger = appendixItem.ledger;
  const normalizedLedger = existingLedger ? normalizeLedgerCveField(existingLedger) : undefined;
  const ledger = Object.assign({}, normalizedLedger, { addedDate });
  const result = Object.assign({}, appendixItem, { ledger });
  return result;
};

export const normalizeAppendix = (appendix: PersistedAppendix): Appendix =>
  Object.fromEntries(
    Object.entries(appendix).map(([key, item]) => [key, normalizeAppendixItem(item)]),
  );

const isUnusedEntry = (
  item: AppendixItem,
  pkgName: string,
  rootDeps: Record<string, string>,
): boolean => {
  const isKept = isKeptEntry(item);
  const isExpired = isKept && isKeepExpired(item, pkgName, rootDeps);
  const isProtected = isKept && !isExpired;
  if (isProtected) return false;

  const dependents = item?.dependents;
  if (!dependents) return false;

  const values = Object.values(dependents);
  if (!values.length) return false;

  const result = values.every((v) => v.includes(UNUSED_OVERRIDE_LABEL));
  return result;
};

export const findUnusedAppendixEntries = (
  appendix: Appendix,
  rootDeps: Record<string, string> = {},
): string[] => {
  if (!appendix) {
    const unusedAppendixEntries: string[] = [];
    return unusedAppendixEntries;
  }

  const unusedEntries = Object.keys(appendix).filter((key) => {
    const lastAtIndex = key.lastIndexOf("@");
    const hasVersion = lastAtIndex > 0;
    const pkgName = hasVersion ? key.slice(0, lastAtIndex) : key;
    const result = isUnusedEntry(appendix[key], pkgName, rootDeps);
    return result;
  });
  return unusedEntries;
};

export const removeAppendixKeys = (appendix: Appendix, keys: string[]): Appendix => {
  const result = omit(appendix, keys);
  return result;
};

export const extractPackageNames = (appendixKeys: string[]): string[] =>
  appendixKeys.map((key) => {
    const lastAtIndex = key.lastIndexOf("@");
    if (lastAtIndex <= 0) return key;
    const result = key.slice(0, lastAtIndex);
    return result;
  });

export const removeOverrideKeys = (
  overrides: Record<string, string | Record<string, string>>,
  packageNames: string[],
): Record<string, string | Record<string, string>> => {
  const result = omit(overrides, packageNames);
  return result;
};
