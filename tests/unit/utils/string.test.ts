import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createPackageKey, packageAtVersion, buildKey, atKey, colonKey } from "../../../src/utils";

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
