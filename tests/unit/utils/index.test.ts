import { buildObject, mergeInto, omit, pick } from "../../../src/utils";

import { describe } from "node:test";
import { atKey, buildKey, colonKey, createPackageKey, packageAtVersion } from "../../../src/utils";

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

  describe("buildKey", () => {
    test("joins parts with custom separator", () => {
      const keyFn = buildKey(":");
      const result = keyFn("namespace", "module", "version");

      assert.strictEqual(result, "namespace:module:version");
    });

    test("handles empty array", () => {
      const keyFn = buildKey("@");
      const result = keyFn();

      assert.strictEqual(result, "");
    });

    test("handles single part", () => {
      const keyFn = buildKey("-");
      const result = keyFn("singlepart");

      assert.strictEqual(result, "singlepart");
    });
  });

  describe("atKey", () => {
    test("joins parts with @ separator", () => {
      const result = atKey("user", "repo");
      assert.strictEqual(result, "user@repo");
    });

    test("handles multiple parts", () => {
      const result = atKey("org", "user", "repo");
      assert.strictEqual(result, "org@user@repo");
    });
  });

  describe("colonKey", () => {
    test("joins parts with : separator", () => {
      const result = colonKey("namespace", "module");
      assert.strictEqual(result, "namespace:module");
    });

    test("handles multiple parts", () => {
      const result = colonKey("org", "namespace", "module");
      assert.strictEqual(result, "org:namespace:module");
    });
  });
});

const getBuildObjectValue = (key: string): string | undefined => {
  if (key === "b") return undefined;
  const value = key.toUpperCase();
  return value;
};

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

test("buildObject - should build object from keys", () => {
  const keys = ["a", "b", "c"];
  const result = buildObject(keys, (key) => key.toUpperCase());

  assert.deepStrictEqual(result, { a: "A", b: "B", c: "C" });
});

test("buildObject - should skip undefined values", () => {
  const keys = ["a", "b", "c"];
  const result = buildObject(keys, getBuildObjectValue);

  assert.deepStrictEqual(result, { a: "A", c: "C" });
});

test("buildObject - should handle empty keys array", () => {
  const result = buildObject([], () => "value");

  assert.deepStrictEqual(result, {});
});

test("buildObject - should handle all undefined values", () => {
  const keys = ["a", "b", "c"];
  const result = buildObject(keys, () => undefined);

  assert.deepStrictEqual(result, {});
});

test("buildObject - should handle complex values", () => {
  const keys = ["user1", "user2"];
  const user1 = { id: "user1", active: true };
  const user2 = { id: "user2", active: true };
  const result = buildObject(keys, (key) => ({ id: key, active: true }));

  assert.deepStrictEqual(result, { user1, user2 });
});

test("mergeInto - should merge source into target", () => {
  const target = { a: 1, b: 2 };
  const source = { c: 3, d: 4 };
  const result = mergeInto(target, source);

  assert.deepStrictEqual(result, { a: 1, b: 2, c: 3, d: 4 });
  assert.strictEqual(result, target);
});

test("mergeInto - should overwrite existing keys", () => {
  const target = { a: 1, b: 2 };
  const source = { b: 20, c: 3 };
  const result = mergeInto(target, source);

  assert.deepStrictEqual(result, { a: 1, b: 20, c: 3 });
});

test("mergeInto - should handle empty source", () => {
  const target = { a: 1, b: 2 };
  const source = {};
  const result = mergeInto(target, source);

  assert.deepStrictEqual(result, { a: 1, b: 2 });
});

test("mergeInto - should handle empty target", () => {
  const target = {};
  const source = { a: 1, b: 2 };
  const result = mergeInto(target, source);

  assert.deepStrictEqual(result, { a: 1, b: 2 });
});

test("mergeInto - should mutate target directly", () => {
  const target: Record<string, number> = { a: 1 };
  const source = { b: 2 };

  mergeInto(target, source);

  assert.strictEqual(target.b, 2);
});
