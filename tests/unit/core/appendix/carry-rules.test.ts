import { test } from "node:test";
import assert from "node:assert/strict";
import { carryExistingLedgers } from "../../../../src/core/appendix/utils";
import type { Appendix, AppendixItem } from "../../../../src/types";

type Random = (limit: number) => number;

const OLD_DATE = "2026-06-28T00:00:00.000Z";
const NEW_DATE = "2026-10-02T00:00:00.000Z";
const KEYS = ["a@1.0.0", "b@2.0.0", "c@3.0.0", "d@4.0.0", "e@5.0.0"];
const DEPENDENT_NAMES = ["root", "docs", "app"];
const REQUIRED_BY = ["x", "y", "x, y"];
const REASONS = ["reason one", "reason two"];
const SEVERITIES = ["low", "high"] as const;
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

const createRandom = (seed: number): Random => {
  let state = seed >>> 0;
  const random: Random = (limit) => {
    const product = Math.imul(state, LCG_MULTIPLIER);
    state = (product + LCG_INCREMENT) >>> 0;
    const value = state % limit;
    return value;
  };
  return random;
};

const pick = <T>(random: Random, values: readonly T[]): T => values[random(values.length)];

const randomDependents = (random: Random): Record<string, string> => {
  const names = DEPENDENT_NAMES.filter(() => random(2) === 0);
  const entries = names.map((name): [string, string] => [name, pick(random, REQUIRED_BY)]);
  const dependents = Object.fromEntries(entries);
  return dependents;
};

const sometimes = <T>(random: Random, limit: number, value: T): T | undefined => {
  const isChosen = random(limit) === 0;
  if (isChosen) return value;
  return undefined;
};

const randomLedgerFields = (random: Random) => {
  const reason = sometimes(random, 2, pick(random, REASONS));
  const severity = sometimes(random, 2, pick(random, SEVERITIES));
  const keep = sometimes(random, 5, true);
  const fields = { reason, severity, keep };
  return fields;
};

const withoutUndefined = <T extends object>(value: T): T => {
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined);
  const cleaned = Object.fromEntries(entries) as T;
  return cleaned;
};

const randomItem = (random: Random, addedDate: string, keepAllowed: boolean): AppendixItem => {
  const dependents = randomDependents(random);
  const fields = randomLedgerFields(random);
  const keep = keepAllowed ? fields.keep : undefined;
  const ledger = withoutUndefined(Object.assign({ addedDate }, fields, { keep }));
  const item: AppendixItem = { dependents, ledger };
  return item;
};

const randomAppendix = (random: Random, addedDate: string, keepAllowed: boolean): Appendix => {
  const keys = KEYS.filter(() => random(3) !== 0);
  const entries = keys.map((key): [string, AppendixItem] => [
    key,
    randomItem(random, addedDate, keepAllowed),
  ]);
  const appendix: Appendix = Object.fromEntries(entries);
  return appendix;
};

const isKept = (item: AppendixItem): boolean => item.ledger?.keep === true;

const assertKeys = (fresh: Appendix, existing: Appendix, result: Appendix): void => {
  const keptKeys = Object.entries(existing)
    .filter(([key, item]) => !fresh[key] && isKept(item))
    .map(([key]) => key);
  const expected = new Set(Object.keys(fresh).concat(keptKeys));
  assert.deepEqual(Object.keys(result).toSorted(), Array.from(expected).toSorted());
};

const sortedEntries = (dependents: Record<string, string> | undefined): string => {
  const entries = Object.entries(dependents ?? {}).toSorted(([a], [b]) => a.localeCompare(b));
  const text = JSON.stringify(entries);
  return text;
};

const changedField = (
  field: "reason" | "severity",
  fresh: AppendixItem,
  previous: AppendixItem,
) => {
  const next = fresh.ledger?.[field];
  const before = previous.ledger?.[field];
  const isChanged = next !== undefined && next !== before;
  return isChanged;
};

const expectedDate = (key: string, fresh: Appendix, existing: Appendix): string | undefined => {
  const previous = existing[key];
  if (!previous) return NEW_DATE;
  const dependentsChanged =
    sortedEntries(fresh[key].dependents) !== sortedEntries(previous.dependents);
  const reasonChanged = changedField("reason", fresh[key], previous);
  const severityChanged = changedField("severity", fresh[key], previous);
  const isUpdated = dependentsChanged || reasonChanged || severityChanged;
  if (isUpdated) return NEW_DATE;
  const storedDate = previous.ledger?.addedDate;
  return storedDate;
};

const assertDate = (key: string, fresh: Appendix, existing: Appendix, result: Appendix): void => {
  const expected = expectedDate(key, fresh, existing);
  assert.equal(result[key].ledger?.addedDate, expected, `${key} date`);
};

const assertKeepSurvives = (key: string, existing: Appendix, result: Appendix): void => {
  const wasKept = existing[key] ? isKept(existing[key]) : false;
  if (!wasKept) return;
  assert.equal(result[key].ledger?.keep, true, `${key} lost keep`);
};

const assertCase = (random: Random, trial: number): void => {
  const fresh = randomAppendix(random, NEW_DATE, false);
  const existing = randomAppendix(random, OLD_DATE, true);
  const result = carryExistingLedgers(fresh, existing);
  assertKeys(fresh, existing, result);
  const freshKeys = Object.keys(fresh);
  freshKeys.forEach((key) => assertDate(key, fresh, existing, result));
  freshKeys.forEach((key) => assertKeepSurvives(key, existing, result));
  assert.deepEqual(carryExistingLedgers(fresh, result), result, `trial ${trial} not stable`);
};

const trials = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

test("carryExistingLedgers - random appendices keep every key accounted for", () => {
  const random = createRandom(20261002);
  trials(3000).forEach((trial) => assertCase(random, trial));
});

test("carryExistingLedgers - an entry with no previous version is returned untouched", () => {
  const random = createRandom(5);
  const fresh = randomAppendix(random, NEW_DATE, false);
  const result = carryExistingLedgers(fresh, {});
  assert.deepEqual(result, fresh);
});

test("carryExistingLedgers - an identical run changes nothing", () => {
  const random = createRandom(11);
  const appendix = randomAppendix(random, OLD_DATE, true);
  const result = carryExistingLedgers(appendix, appendix);
  assert.deepEqual(result, appendix);
});

test("carryExistingLedgers - does not mutate either input", () => {
  const random = createRandom(13);
  const fresh = randomAppendix(random, NEW_DATE, false);
  const existing = randomAppendix(random, OLD_DATE, true);
  const before = JSON.stringify([fresh, existing]);
  carryExistingLedgers(fresh, existing);
  assert.equal(JSON.stringify([fresh, existing]), before);
});
