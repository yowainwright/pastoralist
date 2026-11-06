import { isExactVersion, matchesClause, parseVersionRange } from "./utils";

export { isExactVersion } from "./utils";

export const isVersionRangeSupported = (range: string): boolean => {
  const supported = parseVersionRange(range) !== undefined;
  return supported;
};

export const satisfiesVersionRange = (
  version: string,
  range: string,
  includePrerelease = false,
): boolean => {
  if (!isExactVersion(version)) return false;
  const clauses = parseVersionRange(range);
  if (!clauses) return false;
  const normalized = version.replace(/^v/, "");
  const matches = clauses.some((clause) => matchesClause(normalized, clause, includePrerelease));
  return matches;
};

const releaseLine = (version: string): string | undefined => {
  if (!isExactVersion(version)) return undefined;
  const normalized = version.replace(/^v/, "");
  const parts = normalized.split(/[.+-]/);
  const major = parts[0];
  if (major !== "0") return major;
  if (parts[1] !== "0") {
    const line = parts.slice(0, 2).join(".");
    return line;
  }
  const line = parts.slice(0, 3).join(".");
  return line;
};

export const isSameReleaseLine = (current: string, target: string): boolean => {
  const first = releaseLine(current);
  if (first === undefined) return false;
  const sameLine = first === releaseLine(target);
  return sameLine;
};
