import { compareVersions } from "../index";

import { OPERATORS, PARTIAL, PARTIAL_OPERATORS, TOKEN, VERSION } from "./constants";
import type { Comparator, Operator, RangeVersion } from "./types";

export const isExactVersion = (version: string): boolean => {
  const match = version.match(VERSION);
  if (!match) return false;
  const safeNumbers = match.slice(1, 4).map(Number).every(Number.isSafeInteger);
  if (!safeNumbers) return false;
  const identifiers = match[4]?.split(".") ?? [];
  const validIdentifiers = identifiers.every((part) => !/^0\d+$/.test(part));
  return validIdentifiers;
};

const parsePartial = (value: string): RangeVersion | undefined => {
  const match = value.match(PARTIAL);
  if (!match) return undefined;
  const fields = match.slice(1).filter((part) => part !== undefined);
  const wildcard = fields.findIndex((part) => /^[xX*]$/.test(part));
  const hasWildcard = wildcard >= 0;
  const count = hasWildcard ? wildcard : fields.length;
  const trailing = fields.slice(count);
  if (trailing.some((part) => !/^[xX*]$/.test(part))) return undefined;
  const numeric = fields.slice(0, count);
  if (numeric.some((part) => /^0\d+$/.test(part))) return undefined;
  const parts = numeric.map(Number);
  const safeParts = parts.every(Number.isSafeInteger);
  if (!safeParts) return undefined;
  const version = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0].join(".");
  const parsed = { parts, version };
  return parsed;
};

const parseRangeVersion = (value: string): RangeVersion | undefined => {
  if (!isExactVersion(value)) {
    const partial = parsePartial(value);
    return partial;
  }
  const match = value.match(VERSION)!;
  const parts = match.slice(1, 4).map(Number);
  const version = value.replace(/^v/, "");
  const parsed = { parts, version };
  return parsed;
};

const upperBound = (parts: number[], index: number): string => {
  const next = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  next[index] += 1;
  const bound = next
    .map((part, position) => {
      const reset = position > index;
      const value = reset ? 0 : part;
      return value;
    })
    .join(".");
  return bound;
};

const interval = (lower: string, upper: string): Comparator[] => {
  const minimum: Comparator = { operator: ">=", version: lower };
  const version = `${upper}-0`;
  const maximum: Comparator = { operator: "<", version };
  const bounds = [minimum, maximum];
  return bounds;
};

const singleBound = (operator: Operator, version: string): Comparator[] => {
  const bounds: Comparator[] = [{ operator, version }];
  return bounds;
};

const caretIndex = (parts: number[]): number => {
  const nonZero = parts.findIndex((part) => part !== 0);
  if (nonZero >= 0) return nonZero;
  const index = Math.max(0, parts.length - 1);
  return index;
};

const expandPartial = (operator: Operator, parsed: RangeVersion): Comparator[] => {
  const { parts, version } = parsed;
  if (parts.length === 0) {
    const impossible = operator === ">" || operator === "<";
    const bounds = impossible ? singleBound("<", "0.0.0-0") : [];
    return bounds;
  }
  const upper = upperBound(parts, parts.length - 1);
  const bounds = expandPartialBound(operator, version, upper);
  return bounds;
};

const expandPartialBound = (operator: Operator, lower: string, upper: string): Comparator[] => {
  if (operator === "=") {
    const bounds = interval(lower, upper);
    return bounds;
  }
  const usesUpper = operator === ">" || operator === "<=";
  const bound = usesUpper ? upper : lower;
  const exclusive = operator === "<" || operator === "<=";
  const version = exclusive ? `${bound}-0` : bound;
  const bounds = singleBound(PARTIAL_OPERATORS[operator], version);
  return bounds;
};

const expandParsedToken = (prefix: string, parsed: RangeVersion): Comparator[] => {
  const { parts, version } = parsed;
  const rangeOperator = prefix === "^" || prefix === "~";
  if (rangeOperator) {
    const caret = caretIndex(parts);
    const tilde = Math.min(1, parts.length - 1);
    const isCaret = prefix === "^";
    const index = isCaret ? caret : tilde;
    const upper = upperBound(parts, index);
    const bounds = interval(version, upper);
    return bounds;
  }
  const operator = prefix as Operator;
  const partial = parts.length < 3;
  const bounds = partial ? expandPartial(operator, parsed) : singleBound(operator, version);
  return bounds;
};

const expandToken = (token: string): Comparator[] | undefined => {
  const match = token.match(TOKEN);
  if (!match) return undefined;
  const [, prefix = "=", value] = match;
  const parsed = parseRangeVersion(value);
  if (!parsed) return undefined;
  const wildcard = parsed.parts.length === 0;
  const bounds = wildcard
    ? expandPartial(prefix as Operator, parsed)
    : expandParsedToken(prefix, parsed);
  return bounds;
};

const expandHyphen = (lowerText: string, upperText: string): Comparator[] | undefined => {
  const lower = parseRangeVersion(lowerText);
  const upper = parseRangeVersion(upperText);
  const complete = lower !== undefined && upper !== undefined;
  if (!complete) return undefined;
  const hasLower = lower.parts.length > 0;
  const minimum = hasLower ? singleBound(">=", lower.version) : [];
  const maximum = expandHyphenUpper(upper);
  const bounds = minimum.concat(maximum);
  return bounds;
};

const expandHyphenUpper = (upper: RangeVersion): Comparator[] => {
  const { parts, version } = upper;
  if (parts.length === 0) {
    const empty: Comparator[] = [];
    return empty;
  }
  if (parts.length === 3) {
    const bounds = singleBound("<=", version);
    return bounds;
  }
  const maximum = `${upperBound(parts, parts.length - 1)}-0`;
  const bounds = singleBound("<", maximum);
  return bounds;
};

const parseClause = (clause: string): Comparator[] | undefined => {
  const hyphen = clause.trim().match(/^(\S+)\s+-\s+(\S+)$/);
  if (hyphen) {
    const bounds = expandHyphen(hyphen[1], hyphen[2]);
    return bounds;
  }
  const normalized = clause.trim().replace(/([<>]=?|[~^=])\s+/g, "$1");
  if (!normalized) {
    const empty: Comparator[] = [];
    return empty;
  }
  const tokens = normalized.split(/\s+/).map(expandToken);
  if (tokens.some((comparators) => comparators === undefined)) return undefined;
  const comparators = tokens.flatMap((item) => item ?? []);
  return comparators;
};

export const parseVersionRange = (range: string): Comparator[][] | undefined => {
  const clauses = range.split("||").map(parseClause);
  const invalid = clauses.includes(undefined);
  if (invalid) return undefined;
  const parsed = clauses as Comparator[][];
  return parsed;
};

const acceptsPrerelease = (version: string, comparators: Comparator[]): boolean => {
  const core = version.split(/[+-]/)[0];
  const accepted = comparators.some((comparator) => {
    const sameCore = comparator.version.split(/[+-]/)[0] === core;
    const hasPrerelease = comparator.version.split("+")[0].includes("-");
    const matchesCore = sameCore && hasPrerelease;
    return matchesCore;
  });
  return accepted;
};

export const matchesClause = (
  version: string,
  comparators: Comparator[],
  includePrerelease = false,
): boolean => {
  const isPrerelease = version.split("+")[0].includes("-");
  const prereleaseAllowed = acceptsPrerelease(version, comparators) || includePrerelease;
  const rejected = isPrerelease && !prereleaseAllowed;
  if (rejected) return false;
  const matches = comparators.every(({ operator, version: bound }) => {
    const order = compareVersions(version, bound);
    const accepted = OPERATORS[operator](order);
    return accepted;
  });
  return matches;
};
