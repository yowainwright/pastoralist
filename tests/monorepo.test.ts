process.env.DEBUG = "true";

import assert from "assert";
import {
  resolveJSON,
  updateAppendix,
  findUnusedOverrides,
  updatePackageJSON,
  update,
  getExistingOverrideField,
  applyOverridesToConfig,
  checkMonorepoOverrides,
  processWorkspacePackages,
  attachPatchesToAppendix,
  mergeOverridePaths,
  cleanupUnusedOverrides,
  updateOverrides,
  getOverridesByType,
} from "../src/scripts";
import { PastoralistJSON, Appendix, Options, ConsoleObject, OverridesType, ResolveOverrides } from "../src/interfaces";
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { resolve, join } from "path";

const TEST_DIR = resolve(__dirname, ".test-monorepo");

function describe(description: string, fn: () => void | Promise<void>): void {
  console.log(`\n${description}`);
  const result = fn();
  if (result instanceof Promise) {
    result.catch(console.error);
  }
}

function it(testDescription: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => console.log(`\t✅ ${testDescription}`))
        .catch((error) => {
          console.error(`\t❌ ${testDescription}`);
          console.error(error);
        });
    } else {
      console.log(`\t✅ ${testDescription}`);
    }
  } catch (error) {
    console.error(`\t❌ ${testDescription}`);
    console.error(error);
  }
}

function setupTestDirectory(): void {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {}
  mkdirSync(TEST_DIR, { recursive: true });
}

function teardownTestDirectory(): void {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {}
}

function createMockLog(): ConsoleObject {
  const calls: { [key: string]: any[][] } = {
    info: [],
    debug: [],
    error: [],
  };

  return {
    info: (msg: string, caller?: string, ...args: unknown[]) => {
      calls.info.push([msg, caller, ...args]);
    },
    debug: (msg: string, caller?: string, ...args: unknown[]) => {
      calls.debug.push([msg, caller, ...args]);
    },
    error: (msg: string, caller?: string, ...args: unknown[]) => {
      calls.error.push([msg, caller, ...args]);
    },
    _calls: calls,
  } as ConsoleObject & { _calls: typeof calls };
}

describe("Monorepo Support Tests", () => {
  describe("checkMonorepoOverrides", () => {
    it("should detect overrides not in root dependencies", () => {
      const mockLog = createMockLog();

      const overrides: OverridesType = {
        "lodash": "4.17.21",
        "react": "18.2.0",
      };

      const rootDeps = {
        "express": "4.18.0",
      };

      const result = checkMonorepoOverrides(overrides, rootDeps, mockLog);

      assert.deepEqual(result, ["lodash", "react"]);
      assert((mockLog as any)._calls.info.length === 2);
      assert((mockLog as any)._calls.info[0][0].includes("lodash, react"));
    });

    it("should not log warnings when depPaths are provided", () => {
      const mockLog = createMockLog();

      const overrides: OverridesType = {
        "lodash": "4.17.21",
      };

      const rootDeps = {};

      const options: Options = { depPaths: ["packages/*/package.json"] };

      const result = checkMonorepoOverrides(overrides, rootDeps, mockLog, options);

      assert.deepEqual(result, ["lodash"]);
      assert((mockLog as any)._calls.info.length === 0);
    });

    it("should handle nested overrides", () => {
      const mockLog = createMockLog();

      const overrides: OverridesType = {
        "pg": {
          "pg-types": "^4.0.1",
        },
      };

      const rootDeps = {};

      const result = checkMonorepoOverrides(overrides, rootDeps, mockLog);

      assert.deepEqual(result, ["pg"]);
    });
  });

  describe("mergeOverridePaths", () => {
    it("should merge overridePaths into main appendix", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: {
            "root": "lodash@^4.17.0",
          },
        },
      };

      const overridePaths = {
        "packages/app-a/package.json": {
          "lodash@4.17.21": {
            dependents: {
              "app-a": "lodash@^4.17.0",
            },
          },
          "react@18.2.0": {
            dependents: {
              "app-a": "react@^18.0.0",
            },
          },
        },
      };

      const mockLog = createMockLog();

      mergeOverridePaths(appendix, overridePaths, ["lodash"], mockLog);

      assert.deepEqual(appendix, {
        "lodash@4.17.21": {
          dependents: {
            "root": "lodash@^4.17.0",
            "app-a": "lodash@^4.17.0",
          },
        },
        "react@18.2.0": {
          dependents: {
            "app-a": "react@^18.0.0",
          },
        },
      });
    });

    it("should handle undefined overridePaths", () => {
      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: {
            "root": "lodash@^4.17.0",
          },
        },
      };

      const originalAppendix = { ...appendix };
      const mockLog = createMockLog();

      mergeOverridePaths(appendix, undefined, ["lodash"], mockLog);

      assert.deepEqual(appendix, originalAppendix);
      assert((mockLog as any)._calls.debug.length === 0);
    });

    it("should not merge when missingInRoot is empty", () => {
      const appendix: Appendix = {};
      const overridePaths = {
        "packages/app-a/package.json": {
          "lodash@4.17.21": {
            dependents: {
              "app-a": "lodash@^4.17.0",
            },
          },
        },
      };

      const mockLog = createMockLog();

      mergeOverridePaths(appendix, overridePaths, [], mockLog);

      assert.deepEqual(appendix, {});
      assert((mockLog as any)._calls.debug.length === 0);
    });
  });

  describe("cleanupUnusedOverrides with monorepo", () => {
    it("should not remove overrides tracked in overridePaths", async () => {
      const overrides: OverridesType = {
        "lodash": "4.17.21",
        "react": "18.2.0",
      };

      const overridesData: ResolveOverrides = {
        type: "npm",
        overrides,
      };

      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: {},
        },
        "react@18.2.0": {
          dependents: {},
        },
      };

      const allDeps = {};

      const missingInRoot = ["lodash", "react"];

      const overridePaths = {
        "packages/app-a/package.json": {
          "lodash@4.17.21": {
            dependents: {
              "app-a": "lodash@^4.17.0",
            },
          },
        },
      };

      const mockLog = createMockLog();

      const originalFindUnusedOverrides = global.findUnusedOverrides;
      (global as any).findUnusedOverrides = async () => ["lodash", "react"];

      const result = await cleanupUnusedOverrides(
        overrides,
        overridesData,
        appendix,
        allDeps,
        missingInRoot,
        overridePaths,
        mockLog
      );

      (global as any).findUnusedOverrides = originalFindUnusedOverrides;

      assert(Object.keys(result.finalOverrides).includes("lodash"));
      assert(result.finalAppendix["lodash@4.17.21"]);
      assert(!result.finalAppendix["react@18.2.0"]);
    });

    it("should remove overrides not tracked anywhere", async () => {
      const overrides: OverridesType = {
        "lodash": "4.17.21",
        "unused": "1.0.0",
      };

      const overridesData: ResolveOverrides = {
        type: "npm",
        overrides,
      };

      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: {
            "root": "lodash@^4.17.0",
          },
        },
        "unused@1.0.0": {
          dependents: {},
        },
      };

      const allDeps = {
        "lodash": "^4.17.0",
      };

      const missingInRoot: string[] = [];
      const overridePaths = undefined;

      const mockLog = createMockLog();

      const originalFindUnusedOverrides = global.findUnusedOverrides;
      (global as any).findUnusedOverrides = async () => ["unused"];

      const result = await cleanupUnusedOverrides(
        overrides,
        overridesData,
        appendix,
        allDeps,
        missingInRoot,
        overridePaths,
        mockLog
      );

      (global as any).findUnusedOverrides = originalFindUnusedOverrides;

      assert.deepEqual(Object.keys(result.finalOverrides), ["lodash"]);
      assert(!result.finalAppendix["unused@1.0.0"]);
    });
  });

  describe("updatePackageJSON with overridePaths", () => {
    it("should preserve overridePaths in config", async () => {
      const testDir = resolve(__dirname, ".test-monorepo-preserve");
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {}
      mkdirSync(testDir, { recursive: true });

      const config: PastoralistJSON = {
        name: "test-monorepo",
        version: "1.0.0",
        dependencies: {},
        overrides: {
          "lodash": "4.17.21"
        },
        pastoralist: {
          overridePaths: {
            "packages/app-a/package.json": {
              "lodash@4.17.21": {
                dependents: {
                  "app-a": "lodash@^4.17.0",
                },
              },
            },
          },
        },
      };

      const appendix: Appendix = {
        "lodash@4.17.21": {
          dependents: {
            "app-a": "lodash@^4.17.0",
          },
        },
      };

      const overrides: OverridesType = {
        "lodash": "4.17.21",
      };

      const testPath = join(testDir, "package.json");
      writeFileSync(testPath, JSON.stringify(config, null, 2));

      console.log("Config before update:", JSON.stringify(config.pastoralist, null, 2));

      await updatePackageJSON({
        appendix,
        path: testPath,
        config,
        overrides,
      });

      const updatedConfig = JSON.parse(readFileSync(testPath, "utf8"));

      console.log("TEST: should preserve overridePaths");
      console.log("Updated config:", JSON.stringify(updatedConfig, null, 2));
      assert(updatedConfig.pastoralist, "pastoralist field should exist");
      assert(updatedConfig.pastoralist.overridePaths, "overridePaths should be preserved");
      assert.deepEqual(
        updatedConfig.pastoralist.overridePaths["packages/app-a/package.json"],
        config.pastoralist!.overridePaths!["packages/app-a/package.json"]
      );

      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {}
    });

    it("should support resolutionPaths alias", async () => {
      setupTestDirectory();

      const config: PastoralistJSON = {
        name: "test-monorepo",
        version: "1.0.0",
        dependencies: {},
        pastoralist: {
          resolutionPaths: {
            "packages/app-b/package.json": {
              "react@18.2.0": {
                dependents: {
                  "app-b": "react@^18.0.0",
                },
              },
            },
          },
        },
      };

      const appendix: Appendix = {
        "react@18.2.0": {
          dependents: {
            "app-b": "react@^18.0.0",
          },
        },
      };

      const overrides: OverridesType = {
        "react": "18.2.0",
      };

      const testPath = join(TEST_DIR, "package.json");
      writeFileSync(testPath, JSON.stringify(config, null, 2));

      await updatePackageJSON({
        appendix,
        path: testPath,
        config,
        overrides,
      });

      const updatedConfig = JSON.parse(readFileSync(testPath, "utf8"));

      assert(updatedConfig.pastoralist);
      assert(updatedConfig.pastoralist.resolutionPaths);
      assert.deepEqual(
        updatedConfig.pastoralist.resolutionPaths["packages/app-b/package.json"],
        config.pastoralist!.resolutionPaths!["packages/app-b/package.json"]
      );

      teardownTestDirectory();
    });
  });

  describe("Integration: Full monorepo workflow", () => {
    it("should handle a complete monorepo scenario", async () => {
      setupTestDirectory();

      const rootPackageJson = {
        name: "monorepo-root",
        version: "1.0.0",
        workspaces: ["packages/*"],
        overrides: {
          "lodash": "4.17.21",
          "react": "18.2.0",
        },
      };

      mkdirSync(join(TEST_DIR, "packages", "app-a"), { recursive: true });
      mkdirSync(join(TEST_DIR, "packages", "app-b"), { recursive: true });

      const appAPackageJson = {
        name: "app-a",
        version: "1.0.0",
        dependencies: {
          "lodash": "^4.17.0",
        },
      };

      const appBPackageJson = {
        name: "app-b",
        version: "1.0.0",
        dependencies: {
          "react": "^18.0.0",
          "lodash": "^4.17.0",
        },
      };

      writeFileSync(
        join(TEST_DIR, "package.json"),
        JSON.stringify(rootPackageJson, null, 2)
      );
      writeFileSync(
        join(TEST_DIR, "packages", "app-a", "package.json"),
        JSON.stringify(appAPackageJson, null, 2)
      );
      writeFileSync(
        join(TEST_DIR, "packages", "app-b", "package.json"),
        JSON.stringify(appBPackageJson, null, 2)
      );

      const options: Options = {
        path: join(TEST_DIR, "package.json"),
        root: TEST_DIR,
        depPaths: ["packages/*/package.json"],
      };

      await update(options);

      const updatedRoot = JSON.parse(
        readFileSync(join(TEST_DIR, "package.json"), "utf8")
      );

      assert(updatedRoot.pastoralist);
      assert(updatedRoot.pastoralist.appendix);
      assert(updatedRoot.pastoralist.appendix["lodash@4.17.21"]);
      assert(updatedRoot.pastoralist.appendix["react@18.2.0"]);

      assert.deepEqual(
        Object.keys(updatedRoot.pastoralist.appendix["lodash@4.17.21"].dependents),
        ["app-a", "app-b"]
      );
      assert.deepEqual(
        Object.keys(updatedRoot.pastoralist.appendix["react@18.2.0"].dependents),
        ["app-b"]
      );

      teardownTestDirectory();
    });

    it("should preserve overrides tracked in overridePaths when no deps found", async () => {
      setupTestDirectory();

      const rootPackageJson = {
        name: "monorepo-root",
        version: "1.0.0",
        overrides: {
          "lodash": "4.17.21",
        },
        pastoralist: {
          overridePaths: {
            "packages/future-app/package.json": {
              "lodash@4.17.21": {
                dependents: {
                  "future-app": "lodash@^4.17.0",
                },
              },
            },
          },
        },
      };

      writeFileSync(
        join(TEST_DIR, "package.json"),
        JSON.stringify(rootPackageJson, null, 2)
      );

      const options: Options = {
        path: join(TEST_DIR, "package.json"),
        root: TEST_DIR,
      };

      await update(options);

      const updatedRoot = JSON.parse(
        readFileSync(join(TEST_DIR, "package.json"), "utf8")
      );

      assert(updatedRoot.overrides);
      assert(updatedRoot.overrides.lodash === "4.17.21");
      assert(updatedRoot.pastoralist);
      assert(updatedRoot.pastoralist.overridePaths);

      teardownTestDirectory();
    });

    it("should handle nested overrides in monorepo", async () => {
      setupTestDirectory();

      const rootPackageJson = {
        name: "monorepo-root",
        version: "1.0.0",
        workspaces: ["packages/*"],
        overrides: {
          "pg": {
            "pg-types": "^4.0.1",
          },
        },
      };

      mkdirSync(join(TEST_DIR, "packages", "api"), { recursive: true });

      const apiPackageJson = {
        name: "api",
        version: "1.0.0",
        dependencies: {
          "pg": "^8.13.1",
        },
      };

      writeFileSync(
        join(TEST_DIR, "package.json"),
        JSON.stringify(rootPackageJson, null, 2)
      );
      writeFileSync(
        join(TEST_DIR, "packages", "api", "package.json"),
        JSON.stringify(apiPackageJson, null, 2)
      );

      const options: Options = {
        path: join(TEST_DIR, "package.json"),
        root: TEST_DIR,
        depPaths: ["packages/*/package.json"],
      };

      await update(options);

      const updatedRoot = JSON.parse(
        readFileSync(join(TEST_DIR, "package.json"), "utf8")
      );

      assert(updatedRoot.pastoralist);
      assert(updatedRoot.pastoralist.appendix);
      assert(updatedRoot.pastoralist.appendix["pg-types@^4.0.1"]);
      assert(
        updatedRoot.pastoralist.appendix["pg-types@^4.0.1"].dependents["api"]
          .includes("nested override")
      );

      teardownTestDirectory();
    });
  });
});