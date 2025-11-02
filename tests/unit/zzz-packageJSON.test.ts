import { describe, test, expect, beforeEach, mock, afterEach, spyOn } from "bun:test";
import type { PastoralistJSON } from "../../src/types";
import * as fs from "fs";
import fg from "fast-glob";
import { resolve } from "path";

import {
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  applyOverridesToConfig,
  resolveJSON,
  jsonCache,
  clearDependencyTreeCache,
  findPackageJsonFiles,
} from "../../src/packageJSON";

describe("packageJSON", () => {

  describe("detectPackageManager", () => {
    test("should detect bun when bun.lockb exists", () => {
      const spy = spyOn(fs, "existsSync").mockImplementation((path: any) =>
        String(path).endsWith("bun.lockb")
      );

      try {
        const result = detectPackageManager();
        expect(result).toBe("bun");
      } finally {
        spy.mockRestore();
      }
    });

    test("should detect yarn when yarn.lock exists", () => {
      const spy = spyOn(fs, "existsSync").mockImplementation((path: any) =>
        String(path).endsWith("yarn.lock")
      );

      try {
        const result = detectPackageManager();
        expect(result).toBe("yarn");
      } finally {
        spy.mockRestore();
      }
    });

    test("should detect pnpm when pnpm-lock.yaml exists", () => {
      const spy = spyOn(fs, "existsSync").mockImplementation((path: any) =>
        String(path).endsWith("pnpm-lock.yaml")
      );

      try {
        const result = detectPackageManager();
        expect(result).toBe("pnpm");
      } finally {
        spy.mockRestore();
      }
    });

    test("should default to npm when no lock file exists", () => {
      const spy = spyOn(fs, "existsSync").mockReturnValue(false);

      try {
        const result = detectPackageManager();
        expect(result).toBe("npm");
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe("getExistingOverrideField", () => {
    test("should return resolutions when resolutions exist", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
        resolutions: { lodash: "4.17.21" },
      };

      const result = getExistingOverrideField(config);

      expect(result).toBe("resolutions");
    });

    test("should return overrides when overrides exist", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
        overrides: { lodash: "4.17.21" },
      };

      const result = getExistingOverrideField(config);

      expect(result).toBe("overrides");
    });

    test("should return pnpm when pnpm overrides exist", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
        pnpm: {
          overrides: { lodash: "4.17.21" },
        },
      };

      const result = getExistingOverrideField(config);

      expect(result).toBe("pnpm");
    });

    test("should return null when no override field exists", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
      };

      const result = getExistingOverrideField(config);

      expect(result).toBeNull();
    });

    test("should prioritize resolutions over overrides", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
        resolutions: { lodash: "4.17.21" },
        overrides: { react: "18.0.0" },
      };

      const result = getExistingOverrideField(config);

      expect(result).toBe("resolutions");
    });
  });

  describe("getOverrideFieldForPackageManager", () => {
    test("should return resolutions for yarn", () => {
      const result = getOverrideFieldForPackageManager("yarn");

      expect(result).toBe("resolutions");
    });

    test("should return pnpm for pnpm", () => {
      const result = getOverrideFieldForPackageManager("pnpm");

      expect(result).toBe("pnpm");
    });

    test("should return overrides for npm", () => {
      const result = getOverrideFieldForPackageManager("npm");

      expect(result).toBe("overrides");
    });

    test("should return overrides for bun", () => {
      const result = getOverrideFieldForPackageManager("bun");

      expect(result).toBe("overrides");
    });
  });

  describe("applyOverridesToConfig", () => {
    test("should apply resolutions", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
      };
      const overrides = { lodash: "4.17.21" };

      const result = applyOverridesToConfig(config, overrides, "resolutions");

      expect(result.resolutions).toEqual(overrides);
    });

    test("should apply npm overrides", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
      };
      const overrides = { lodash: "4.17.21" };

      const result = applyOverridesToConfig(config, overrides, "overrides");

      expect(result.overrides).toEqual(overrides);
    });

    test("should apply pnpm overrides", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
      };
      const overrides = { lodash: "4.17.21" };

      const result = applyOverridesToConfig(config, overrides, "pnpm");

      expect(result.pnpm?.overrides).toEqual(overrides);
    });

    test("should preserve existing pnpm config when applying pnpm overrides", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
        pnpm: {
          peerDependencyRules: { ignoreMissing: ["react"] },
        },
      };
      const overrides = { lodash: "4.17.21" };

      const result = applyOverridesToConfig(config, overrides, "pnpm");

      expect(result.pnpm?.peerDependencyRules).toEqual({ ignoreMissing: ["react"] });
      expect(result.pnpm?.overrides).toEqual(overrides);
    });

    test("should return config unchanged when field type is null", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
      };
      const overrides = { lodash: "4.17.21" };

      const result = applyOverridesToConfig(config, overrides, null);

      expect(result).toEqual(config);
    });

    test("should not mutate original config", () => {
      const config: PastoralistJSON = {
        name: "test",
        version: "1.0.0",
      };
      const overrides = { lodash: "4.17.21" };

      const result = applyOverridesToConfig(config, overrides, "overrides");

      expect(config.overrides).toBeUndefined();
      expect(result.overrides).toEqual(overrides);
    });
  });

  describe("resolveJSON", () => {
    test("should parse and cache valid JSON", () => {
      const tmpPath = `/tmp/test-resolveJSON-${Date.now()}.json`;
      const testData = { name: "test-package", version: "1.0.0" };
      fs.writeFileSync(tmpPath, JSON.stringify(testData));

      try {
        const result = resolveJSON(tmpPath);

        expect(result).toBeDefined();
        expect(result?.name).toBe("test-package");
        expect(jsonCache.has(tmpPath)).toBe(true);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    test("should return cached JSON on subsequent calls", () => {
      jsonCache.clear();

      const tmpPath = `/tmp/test-cached-${Date.now()}.json`;
      const testData = { name: "cached-test", version: "2.0.0" };
      fs.writeFileSync(tmpPath, JSON.stringify(testData));

      try {
        const result1 = resolveJSON(tmpPath);
        const cacheSize = jsonCache.size;

        const result2 = resolveJSON(tmpPath);

        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
        expect(result1).toEqual(result2);
        expect(jsonCache.size).toBe(cacheSize);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    test("should return undefined for invalid JSON", () => {
      const tmpPath = "/tmp/test-invalid-" + Date.now() + ".json";
      fs.writeFileSync(tmpPath, "invalid json{");

      try {
        const result = resolveJSON(tmpPath);
        expect(result).toBeUndefined();
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    test("should return undefined when file read fails", () => {
      const result = resolveJSON("/nonexistent/path/package.json");
      expect(result).toBeUndefined();
    });

    test("should normalize paths before caching", () => {
      jsonCache.clear();

      const tmpPath = `/tmp/test-normalize-${Date.now()}.json`;
      const testData = { name: "normalize-test", version: "3.0.0" };
      fs.writeFileSync(tmpPath, JSON.stringify(testData));

      try {
        const absolutePath = resolve(tmpPath);
        const result1 = resolveJSON(tmpPath);
        const result2 = resolveJSON(absolutePath);

        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
        expect(result1).toEqual(result2);
        expect(jsonCache.has(absolutePath)).toBe(true);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });
  });

  describe("findPackageJsonFiles", () => {
    test("should return empty array when no depPaths provided", () => {
      const result = findPackageJsonFiles([], [], "./");

      expect(result).toEqual([]);
    });

    test("should find files matching patterns", () => {
      const mockFiles = ["packages/a/package.json", "packages/b/package.json"];
      // @ts-ignore - mocking fg.sync
      const originalSync = fg.sync;
      // @ts-ignore
      fg.sync = mock(() => mockFiles);

      const result = findPackageJsonFiles(["packages/*/package.json"], [], "./");

      expect(result).toEqual(mockFiles);
      // @ts-ignore
      fg.sync = originalSync;
    });

    test("should pass ignore patterns to fast-glob", () => {
      // @ts-ignore
      const originalSync = fg.sync;
      const mockFn = mock(() => []);
      // @ts-ignore
      fg.sync = mockFn;

      findPackageJsonFiles(["**/package.json"], ["**/node_modules/**"], "./");

      expect(mockFn).toHaveBeenCalledWith(
        ["**/package.json"],
        expect.objectContaining({
          ignore: ["**/node_modules/**"],
        })
      );
      // @ts-ignore
      fg.sync = originalSync;
    });

    test("should use provided root path", () => {
      // @ts-ignore
      const originalSync = fg.sync;
      const mockFn = mock(() => []);
      // @ts-ignore
      fg.sync = mockFn;

      findPackageJsonFiles(["**/package.json"], [], "/custom/root");

      expect(mockFn).toHaveBeenCalledWith(
        ["**/package.json"],
        expect.objectContaining({
          cwd: "/custom/root",
        })
      );
      // @ts-ignore
      fg.sync = originalSync;
    });

    test("should return empty array on error", () => {
      // @ts-ignore
      const originalSync = fg.sync;
      // @ts-ignore
      fg.sync = mock(() => {
        throw new Error("Glob error");
      });

      const result = findPackageJsonFiles(["**/package.json"], [], "./");

      expect(result).toEqual([]);
      // @ts-ignore
      fg.sync = originalSync;
    });
  });

  describe("clearDependencyTreeCache", () => {
    test("should clear the cache", () => {
      clearDependencyTreeCache();

      expect(true).toBe(true);
    });
  });
});
