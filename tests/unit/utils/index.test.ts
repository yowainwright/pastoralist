import { omit, pick } from "../../../src/utils";

import { describe } from "node:test";
import { createPackageKey, packageAtVersion } from "../../../src/utils";

import { compareVersions } from "../../../src/utils";

import assert from "node:assert/strict";
import { test } from "node:test";
import { countBy, getLedgerAddedDate, groupBy } from "../../../src/utils";

test("groupBy - should keep matching values together in input order", () => {
  const items = [
    { group: "a", value: 1 },
    { group: "b", value: 2 },
    { group: "a", value: 3 },
  ];
  const result = groupBy(items, (item) => item.group);

  assert.deepStrictEqual(
    result,
    new Map([
      ["a", [items[0], items[2]]],
      ["b", [items[1]]],
    ]),
  );
});

test("groupBy - should return no groups for empty input", () => {
  const result = groupBy([], (item: { group: string }) => item.group);

  assert.deepStrictEqual(result, new Map());
});

test("countBy - should count matching keys", () => {
  const items = [{ kind: "a" }, { kind: "b" }, { kind: "a" }];
  const result = countBy(items, (item) => item.kind);

  assert.deepStrictEqual(
    result,
    new Map([
      ["a", 2],
      ["b", 1],
    ]),
  );
});

test("countBy - should return no counts for empty input", () => {
  const result = countBy([], (item: { kind: string }) => item.kind);

  assert.deepStrictEqual(result, new Map());
});

test("getLedgerAddedDate - should return a valid creation timestamp", () => {
  const result = getLedgerAddedDate();

  assert.strictEqual(new Date(result).toISOString(), result);
});

test("getLedgerAddedDate - should use the provided clock", () => {
  const addedDate = "2026-07-27T12:00:00.000Z";
  const result = getLedgerAddedDate(() => addedDate);

  assert.strictEqual(result, addedDate);
});

test("compareVersions - should return 0 for equal versions", () => {
  assert.strictEqual(compareVersions("1.0.0", "1.0.0"), 0);
  assert.strictEqual(compareVersions("2.5.3", "2.5.3"), 0);
  assert.strictEqual(compareVersions("10.20.30", "10.20.30"), 0);
});

test("compareVersions - should return positive when v1 > v2", () => {
  assert.ok(compareVersions("2.0.0", "1.0.0") > 0);
  assert.ok(compareVersions("1.1.0", "1.0.0") > 0);
  assert.ok(compareVersions("1.0.1", "1.0.0") > 0);
  assert.ok(compareVersions("10.0.0", "9.99.99") > 0);
});

test("compareVersions - should return negative when v1 < v2", () => {
  assert.ok(compareVersions("1.0.0", "2.0.0") < 0);
  assert.ok(compareVersions("1.0.0", "1.1.0") < 0);
  assert.ok(compareVersions("1.0.0", "1.0.1") < 0);
  assert.ok(compareVersions("9.99.99", "10.0.0") < 0);
});

test("compareVersions - should handle different length versions", () => {
  assert.strictEqual(compareVersions("1.0", "1.0.0"), 0);
  assert.strictEqual(compareVersions("1", "1.0"), 0);
  assert.strictEqual(compareVersions("1", "1.0.0"), 0);
  assert.ok(compareVersions("1.0", "1.0.1") < 0);
  assert.ok(compareVersions("1.0.1", "1.0") > 0);
});

test("compareVersions - should handle multi-digit version numbers", () => {
  assert.ok(compareVersions("1.10.0", "1.9.0") > 0);
  assert.ok(compareVersions("1.100.0", "1.99.0") > 0);
  assert.ok(compareVersions("10.0.0", "9.0.0") > 0);
});

test("compareVersions - should compare major versions first", () => {
  assert.ok(compareVersions("2.0.0", "1.99.99") > 0);
  assert.ok(compareVersions("1.99.99", "2.0.0") < 0);
});

test("compareVersions - should compare minor versions when major is equal", () => {
  assert.ok(compareVersions("1.2.0", "1.1.99") > 0);
  assert.ok(compareVersions("1.1.99", "1.2.0") < 0);
});

test("compareVersions - should compare patch versions when major and minor are equal", () => {
  assert.ok(compareVersions("1.1.2", "1.1.1") > 0);
  assert.ok(compareVersions("1.1.1", "1.1.2") < 0);
});

test("compareVersions - should handle real-world lodash versions for security checks", () => {
  assert.ok(compareVersions("4.17.21", "4.17.0") > 0);
  assert.ok(compareVersions("4.17.21", "4.17.20") > 0);
  assert.strictEqual(compareVersions("4.17.21", "4.17.21"), 0);
  assert.ok(compareVersions("4.17.21", "4.18.0") < 0);
  assert.ok(compareVersions("4.17.21", "5.0.0") < 0);
});

test("compareVersions - should support security vulnerability range checking", () => {
  const currentVersion = "4.17.0";
  const fixedVersion = "4.17.21";

  assert.ok(compareVersions(currentVersion, fixedVersion) < 0);
  assert.ok(compareVersions(fixedVersion, currentVersion) > 0);
});

test("compareVersions - strips prefixes and build metadata", () => {
  assert.strictEqual(compareVersions("v1.2.3", "1.2.3"), 0);
  assert.strictEqual(compareVersions("=1.2.3", "^1.2.3"), 0);
  assert.strictEqual(compareVersions(" ~1.2.3 ", "1.2.3+build.5"), 0);
});

test("compareVersions - ranks prerelease below release", () => {
  assert.ok(compareVersions("1.0.0-beta", "1.0.0") < 0);
  assert.ok(compareVersions("1.0.0", "1.0.0-rc.1") > 0);
});

test("compareVersions - compares prerelease identifiers per semver", () => {
  assert.ok(compareVersions("1.0.0-alpha", "1.0.0-alpha.1") < 0);
  assert.ok(compareVersions("1.0.0-alpha.1", "1.0.0-alpha.beta") < 0);
  assert.ok(compareVersions("1.0.0-beta.2", "1.0.0-beta.11") < 0);
  assert.ok(compareVersions("1.0.0-beta.11", "1.0.0-rc.1") < 0);
  assert.strictEqual(compareVersions("1.0.0-rc.1", "1.0.0-rc.1+build"), 0);
});

describe("String utilities", () => {
  describe("createPackageKey", () => {
    test("creates key function with default separator", () => {
      const keyFn = createPackageKey();
      const packageFn = keyFn("react");
      const result = packageFn("18.0.0");

      assert.strictEqual(result, "react@18.0.0");
    });

    test("creates key function with custom separator", () => {
      const keyFn = createPackageKey("-");
      const packageFn = keyFn("react");
      const result = packageFn("18.0.0");

      assert.strictEqual(result, "react-18.0.0");
    });
  });

  describe("packageAtVersion", () => {
    test("creates package@version string", () => {
      const packageFn = packageAtVersion("lodash");
      const result = packageFn("4.17.21");

      assert.strictEqual(result, "lodash@4.17.21");
    });
  });
});

test("pick - should return selected own enumerable keys", () => {
  const source = { name: "Ada", role: "admin", active: true };
  const result = pick(source, ["name", "active"]);

  assert.deepStrictEqual(result, { name: "Ada", active: true });
  assert.notStrictEqual(result, source);
});

test("pick - should retain selected keys whose value is undefined", () => {
  const source: { name: string; alias?: string } = { name: "Ada", alias: undefined };
  const result = pick(source, ["alias"]);

  assert.deepStrictEqual(result, { alias: undefined });
});

test("pick - should support symbol keys", () => {
  const internal = Symbol("internal");
  const source = { name: "Ada", [internal]: true };
  const result = pick(source, [internal]);

  assert.deepStrictEqual(result, { [internal]: true });
});

test("omit - should remove selected keys without mutating the source", () => {
  const source = { name: "Ada", localOnly: "value", active: true };
  const result = omit(source, ["localOnly"]);

  assert.deepStrictEqual(result, { name: "Ada", active: true });
  assert.deepStrictEqual(source, { name: "Ada", localOnly: "value", active: true });
});

test("omit - should preserve symbol keys that are not omitted", () => {
  const internal = Symbol("internal");
  const source = { name: "Ada", [internal]: true };
  const result = omit(source, ["name"]);

  assert.deepStrictEqual(result, { [internal]: true });
});
