import { describe, test, expect } from "bun:test";
import {
  createPackageKey,
  packageAtVersion,
  buildKey,
  atKey,
  colonKey,
} from "../../../src/utils/string";

describe("String utilities", () => {
  describe("createPackageKey", () => {
    test("creates key function with default separator", () => {
      const keyFn = createPackageKey();
      const packageFn = keyFn("react");
      const result = packageFn("18.0.0");

      expect(result).toBe("react@18.0.0");
    });

    test("creates key function with custom separator", () => {
      const keyFn = createPackageKey("-");
      const packageFn = keyFn("react");
      const result = packageFn("18.0.0");

      expect(result).toBe("react-18.0.0");
    });
  });

  describe("packageAtVersion", () => {
    test("creates package@version string", () => {
      const packageFn = packageAtVersion("lodash");
      const result = packageFn("4.17.21");

      expect(result).toBe("lodash@4.17.21");
    });
  });

  describe("buildKey", () => {
    test("joins parts with custom separator", () => {
      const keyFn = buildKey(":");
      const result = keyFn("namespace", "module", "version");

      expect(result).toBe("namespace:module:version");
    });

    test("handles empty array", () => {
      const keyFn = buildKey("@");
      const result = keyFn();

      expect(result).toBe("");
    });

    test("handles single part", () => {
      const keyFn = buildKey("-");
      const result = keyFn("singlepart");

      expect(result).toBe("singlepart");
    });
  });

  describe("atKey", () => {
    test("joins parts with @ separator", () => {
      const result = atKey("user", "repo");
      expect(result).toBe("user@repo");
    });

    test("handles multiple parts", () => {
      const result = atKey("org", "user", "repo");
      expect(result).toBe("org@user@repo");
    });
  });

  describe("colonKey", () => {
    test("joins parts with : separator", () => {
      const result = colonKey("namespace", "module");
      expect(result).toBe("namespace:module");
    });

    test("handles multiple parts", () => {
      const result = colonKey("org", "namespace", "module");
      expect(result).toBe("org:namespace:module");
    });
  });
});
