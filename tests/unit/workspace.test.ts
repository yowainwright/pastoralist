import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { Appendix, OverridesType, ResolveOverrides } from "../../src/types";

const mockPackageJSON = {
  resolveJSON: mock(() => undefined),
  getDependencyTree: mock(async () => ({})),
};

const mockUtils = {
  logger: mock(() => ({
    debug: mock(() => {}),
    error: mock(() => {}),
    info: mock(() => {}),
  })),
};

mock.module("../../src/packageJSON", () => mockPackageJSON);
mock.module("../../src/utils", () => mockUtils);

import {
  checkMonorepoOverrides,
  processWorkspacePackages,
  mergeOverridePaths,
  findUnusedOverrides,
  cleanupUnusedOverrides,
} from "../../src/workspace";

describe("workspace", () => {
  const mockLog = {
    debug: mock(() => {}),
    error: mock(() => {}),
    info: mock(() => {}),
  };

  beforeEach(() => {
    mockLog.debug.mockClear();
    mockLog.error.mockClear();
    mockLog.info.mockClear();
    mockPackageJSON.resolveJSON.mockClear();
    mockPackageJSON.getDependencyTree.mockClear();
  });

  describe("checkMonorepoOverrides", () => {
    test("should return empty array when all overrides in root deps", () => {
      const overrides = { lodash: "4.17.21" };
      const rootDeps = { lodash: "^4.17.20" };

      const result = checkMonorepoOverrides(overrides, rootDeps, mockLog);

      expect(result).toEqual([]);
    });

    test("should find packages missing from root deps", () => {
      const overrides = { lodash: "4.17.21", react: "18.0.0" };
      const rootDeps = { lodash: "^4.17.20" };

      const result = checkMonorepoOverrides(overrides, rootDeps, mockLog);

      expect(result).toEqual(["react"]);
    });

    test("should show monorepo info when packages missing and no depPaths", () => {
      const overrides = { react: "18.0.0" };
      const rootDeps = {};

      checkMonorepoOverrides(overrides, rootDeps, mockLog);

      expect(mockLog.info).toHaveBeenCalledWith(
        expect.stringContaining("not in root dependencies"),
        "checkMonorepoOverrides"
      );
    });

    test("should not show info when depPaths option provided", () => {
      const overrides = { react: "18.0.0" };
      const rootDeps = {};
      const options = { depPaths: ["packages/*/package.json"] };

      checkMonorepoOverrides(overrides, rootDeps, mockLog, options);

      expect(mockLog.info).not.toHaveBeenCalled();
    });

    test("should handle empty overrides", () => {
      const overrides = {};
      const rootDeps = { lodash: "^4.17.21" };

      const result = checkMonorepoOverrides(overrides, rootDeps, mockLog);

      expect(result).toEqual([]);
    });

    test("should handle nested overrides", () => {
      const overrides = {
        lodash: "4.17.21",
        react: { "react-dom": "18.0.0" }
      };
      const rootDeps = { lodash: "^4.17.20" };

      const result = checkMonorepoOverrides(overrides, rootDeps, mockLog);

      expect(result).toEqual(["react"]);
    });
  });

  describe("processWorkspacePackages", () => {
    test("should process workspace packages and collect dependencies", async () => {
      const mockConstructAppendix = mock(async () => ({
        "lodash@4.17.21": {
          dependents: { "pkg-a": "lodash@^4.17.21" },
        },
      }));

      mockPackageJSON.resolveJSON.mockReturnValue({
        name: "pkg-a",
        dependencies: { lodash: "^4.17.21" },
        devDependencies: { jest: "^29.0.0" },
      });

      const result = await processWorkspacePackages(
        ["packages/a/package.json"],
        {} as ResolveOverrides,
        mockLog,
        mockConstructAppendix
      );

      expect(result.allWorkspaceDeps).toEqual({
        lodash: "^4.17.21",
        jest: "^29.0.0",
      });
      expect(mockConstructAppendix).toHaveBeenCalled();
    });

    test("should handle multiple workspace packages", async () => {
      const mockConstructAppendix = mock(async () => ({}));

      mockPackageJSON.resolveJSON
        .mockReturnValueOnce({
          name: "pkg-a",
          dependencies: { lodash: "^4.17.21" },
        })
        .mockReturnValueOnce({
          name: "pkg-b",
          dependencies: { react: "^18.0.0" },
        });

      const result = await processWorkspacePackages(
        ["packages/a/package.json", "packages/b/package.json"],
        {} as ResolveOverrides,
        mockLog,
        mockConstructAppendix
      );

      expect(result.allWorkspaceDeps).toEqual({
        lodash: "^4.17.21",
        react: "^18.0.0",
      });
    });

    test("should handle packages without dependencies", async () => {
      const mockConstructAppendix = mock(async () => ({}));

      mockPackageJSON.resolveJSON.mockReturnValue({
        name: "pkg-a",
      });

      const result = await processWorkspacePackages(
        ["packages/a/package.json"],
        {} as ResolveOverrides,
        mockLog,
        mockConstructAppendix
      );

      expect(result.allWorkspaceDeps).toEqual({});
    });

    test("should skip packages that fail to resolve", async () => {
      const mockConstructAppendix = mock(async () => ({}));

      mockPackageJSON.resolveJSON.mockReturnValue(undefined);

      const result = await processWorkspacePackages(
        ["packages/a/package.json"],
        {} as ResolveOverrides,
        mockLog,
        mockConstructAppendix
      );

      expect(result.allWorkspaceDeps).toEqual({});
    });
  });

  describe("mergeOverridePaths", () => {
    test("should merge override paths into appendix", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.21" },
        },
      };
      const overridePaths = {
        "packages/a": {
          "react@18.0.0": {
            dependents: { "pkg-a": "react@^18.0.0" },
          },
        },
      };
      const missingInRoot = ["react"];

      const result = mergeOverridePaths(appendix, overridePaths, missingInRoot, mockLog);

      expect(result["react@18.0.0"]).toEqual({
        dependents: { "pkg-a": "react@^18.0.0" },
      });
    });

    test("should merge dependents when entry already exists", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.21" },
        },
      };
      const overridePaths = {
        "packages/a": {
          "lodash@4.17.21": {
            dependents: { "pkg-a": "lodash@^4.17.21" },
          },
        },
      };
      const missingInRoot = ["lodash"];

      const result = mergeOverridePaths(appendix, overridePaths, missingInRoot, mockLog);

      expect(result["lodash@4.17.21"].dependents).toEqual({
        root: "lodash@^4.17.21",
        "pkg-a": "lodash@^4.17.21",
      });
    });

    test("should return original appendix when no overridePaths", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.21" },
        },
      };

      const result = mergeOverridePaths(appendix, undefined, ["react"], mockLog);

      expect(result).toEqual(appendix);
    });

    test("should return original appendix when no missing packages", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.21" },
        },
      };
      const overridePaths = {
        "packages/a": {
          "react@18.0.0": {
            dependents: { "pkg-a": "react@^18.0.0" },
          },
        },
      };

      const result = mergeOverridePaths(appendix, overridePaths, [], mockLog);

      expect(result).toEqual(appendix);
    });
  });

  describe("findUnusedOverrides", () => {
    test("should return empty array when all overrides are used", async () => {
      const overrides = { lodash: "4.17.21" };
      const allDeps = { lodash: "^4.17.21" };
      mockPackageJSON.getDependencyTree.mockResolvedValue({});

      const result = await findUnusedOverrides(overrides, allDeps);

      expect(result).toEqual([]);
    });

    test("should find unused simple override not in deps or tree", async () => {
      const overrides = { lodash: "4.17.21" };
      const allDeps = {};
      mockPackageJSON.getDependencyTree.mockResolvedValue({});

      const result = await findUnusedOverrides(overrides, allDeps);

      expect(result).toEqual(["lodash"]);
    });

    test("should keep override if in dependency tree", async () => {
      const overrides = { lodash: "4.17.21" };
      const allDeps = {};
      mockPackageJSON.getDependencyTree.mockResolvedValue({ lodash: true });

      const result = await findUnusedOverrides(overrides, allDeps);

      expect(result).toEqual([]);
    });

    test("should find unused nested override when parent not in deps", async () => {
      const overrides = { react: { "react-dom": "18.0.0" } };
      const allDeps = {};
      mockPackageJSON.getDependencyTree.mockResolvedValue({});

      const result = await findUnusedOverrides(overrides, allDeps);

      expect(result).toEqual(["react"]);
    });

    test("should keep nested override when parent in deps", async () => {
      const overrides = { react: { "react-dom": "18.0.0" } };
      const allDeps = { react: "^18.0.0" };
      mockPackageJSON.getDependencyTree.mockResolvedValue({});

      const result = await findUnusedOverrides(overrides, allDeps);

      expect(result).toEqual([]);
    });

    test("should handle mixed simple and nested overrides", async () => {
      const overrides = {
        lodash: "4.17.21",
        react: { "react-dom": "18.0.0" },
        axios: "1.0.0",
      };
      const allDeps = { lodash: "^4.17.21" };
      mockPackageJSON.getDependencyTree.mockResolvedValue({ axios: true });

      const result = await findUnusedOverrides(overrides, allDeps);

      expect(result).toEqual(["react"]);
    });
  });

  describe("cleanupUnusedOverrides", () => {
    const mockUpdateOverrides = mock(() => ({}));

    beforeEach(() => {
      mockUpdateOverrides.mockClear();
      mockPackageJSON.getDependencyTree.mockResolvedValue({});
    });

    test("should return original data when no unused overrides", async () => {
      const overrides = { lodash: "4.17.21" };
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.21" },
        },
      };
      const allDeps = { lodash: "^4.17.21" };

      const result = await cleanupUnusedOverrides(
        overrides,
        {} as ResolveOverrides,
        appendix,
        allDeps,
        [],
        undefined,
        mockLog,
        mockUpdateOverrides
      );

      expect(result.finalOverrides).toEqual(overrides);
      expect(result.finalAppendix).toEqual(appendix);
    });

    test("should remove unused overrides and appendix entries", async () => {
      const overrides = { lodash: "4.17.21", react: "18.0.0" };
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.21" },
        },
        "react@18.0.0": {
          dependents: { root: "react@^18.0.0" },
        },
      };
      const allDeps = { lodash: "^4.17.21" };

      mockUpdateOverrides.mockReturnValue({ lodash: "4.17.21" });

      const result = await cleanupUnusedOverrides(
        overrides,
        {} as ResolveOverrides,
        appendix,
        allDeps,
        [],
        undefined,
        mockLog,
        mockUpdateOverrides
      );

      expect(result.finalOverrides).toEqual({ lodash: "4.17.21" });
      expect(result.finalAppendix["react@18.0.0"]).toBeUndefined();
    });

    test("should keep packages tracked in overridePaths", async () => {
      const overrides = { react: "18.0.0" };
      const appendix: Appendix = {
        "react@18.0.0": {
          dependents: { "pkg-a": "react@^18.0.0" },
        },
      };
      const allDeps = {};
      const missingInRoot = ["react"];
      const overridePaths = {
        "packages/a": {
          "react@18.0.0": {
            dependents: { "pkg-a": "react@^18.0.0" },
          },
        },
      };

      const result = await cleanupUnusedOverrides(
        overrides,
        {} as ResolveOverrides,
        appendix,
        allDeps,
        missingInRoot,
        overridePaths,
        mockLog,
        mockUpdateOverrides
      );

      expect(result.finalOverrides).toEqual(overrides);
      expect(result.finalAppendix).toEqual(appendix);
    });

    test("should handle mixed removable and tracked packages", async () => {
      const overrides = { lodash: "4.17.21", react: "18.0.0" };
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.21" },
        },
        "react@18.0.0": {
          dependents: { "pkg-a": "react@^18.0.0" },
        },
      };
      const allDeps = {};
      const missingInRoot = ["react"];
      const overridePaths = {
        "packages/a": {
          "react@18.0.0": {
            dependents: { "pkg-a": "react@^18.0.0" },
          },
        },
      };

      mockUpdateOverrides.mockReturnValue({ react: "18.0.0" });

      const result = await cleanupUnusedOverrides(
        overrides,
        {} as ResolveOverrides,
        appendix,
        allDeps,
        missingInRoot,
        overridePaths,
        mockLog,
        mockUpdateOverrides
      );

      expect(result.finalOverrides).toEqual({ react: "18.0.0" });
      expect(result.finalAppendix["lodash@4.17.21"]).toBeUndefined();
      expect(result.finalAppendix["react@18.0.0"]).toBeDefined();
    });
  });
});
