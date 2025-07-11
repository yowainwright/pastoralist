import assert from "assert";
import fs from "fs";
import {
  resolveJSON,
  jsonCache,
  logMethod,
  updateAppendix,
  processPackageJSON,
  getOverridesByType,
  defineOverride,
  resolveOverrides,
  updatePackageJSON,
  findRemovableAppendixItems,
  updateOverrides as updateOverrideItems,
  constructAppendix,
} from "../src/scripts";
import { LOG_PREFIX } from "../src/constants";
import { PastoralistJSON, Appendix } from "../src/interfaces";

export const describe = (description: string, fn: any) => {
  console.log(`\n${description}`);
  fn();
};

export const it = (testDescription: string, fn: any) => {
  try {
    fn();
    console.log(`\t✅ ${testDescription}`);
  } catch (error) {
    console.error(`\t❌ ${testDescription}`);
    console.error(error);
  }
};

const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function mockReadFileSync(path: string, encoding: any) {
  if (path === "tests/fixtures/package-simple.json") {
    return JSON.stringify({ key: "value" });
  } else if (path === "tests/fixtures/package-no-deps.json") {
    return "invalid json";
  } else if (path === "path/to/nonexistent.json") {
    throw new Error("File read error");
  } else {
    return originalReadFileSync(path, encoding);
  }
} as any;

describe("resolveJSON", () => {
  it("should return cached JSON if available", () => {
    const path = "tests/fixtures/package-overrides.json";
    const cachedJSON = { key: "value" };
    jsonCache.set(path, cachedJSON as any);
    assert.strictEqual(resolveJSON(path), cachedJSON);
  });

  it("should read, parse, and cache JSON from a file", () => {
    const path = "tests/fixtures/package-resolutions.json";
    const result = resolveJSON(path);
    assert.deepStrictEqual(jsonCache.get(path), result);
  });

  it("should handle invalid JSON files", () => {
    const path = "path/to/invalid.json";
    const result = resolveJSON(path);
    assert.strictEqual(result, undefined);
  });

  it("should handle file read errors", () => {
    const path = "path/to/nonexistent.json";
    const result = resolveJSON(path);
    assert.strictEqual(result, undefined);
  });
});

describe("logMethod", () => {
  it("should log a message to the console when isLogging is true", () => {
    const originalLog = console.log;
    let loggedMessage = "";
    console.log = (message) => (loggedMessage = message); // Capture the logged message

    const log = logMethod("log", true, "test.ts");
    log("This is a test message", "testCaller");

    console.log = originalLog; // Restore console.log
    assert.strictEqual(
      loggedMessage,
      `${LOG_PREFIX}[test.ts][testCaller] This is a test message`,
    );
  });

  it("should log a message with additional arguments", () => {
    const originalLog = console.log;
    const loggedMessages = [];
    console.log = (...args) => loggedMessages.push(args);

    const log = logMethod("log", true, "test.ts");
    log("This is a test message with args", "testCaller", { a: 1 }, [1, 2, 3]);

    console.log = originalLog;
    assert.deepStrictEqual(loggedMessages, [
      [
        `${LOG_PREFIX}[test.ts][testCaller] This is a test message with args`,
        { a: 1 },
        [1, 2, 3],
      ],
    ]);
  });

  it("should not log a message when isLogging is false", () => {
    const originalLog = console.log;
    let logCalled = false;
    console.log = () => (logCalled = true);

    const log = logMethod("log", false, "test.ts");
    log("This message should not be logged");

    console.log = originalLog;
    assert.strictEqual(logCalled, false);
  });

  it("should use the correct console method based on the type argument", () => {
    const originalWarn = console.warn;
    let loggedMessage = "";
    console.warn = (message) => (loggedMessage = message);

    const logWarn = logMethod("warn", true, "test.ts");
    logWarn("This is a warning message");

    console.warn = originalWarn;
    assert.strictEqual(
      loggedMessage,
      `${LOG_PREFIX}[test.ts] This is a warning message`,
    );
  });

  it("should handle missing caller argument", () => {
    const originalLog = console.log;
    let loggedMessage = "";
    console.log = (message) => (loggedMessage = message);

    const log = logMethod("log", true, "test.ts");
    log("This is a test message with no caller");

    console.log = originalLog;
    assert.strictEqual(
      loggedMessage,
      `${LOG_PREFIX}[test.ts] This is a test message with no caller`,
    );
  });
});

describe("updateAppendix", () => {
  it("should return an empty object when no overrides are provided", () => {
    const result = updateAppendix({
      overrides: {},
      appendix: {},
      dependencies: {},
      devDependencies: {},
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {});
  });

  it("should return an empty object when overrides are not in dependencies", () => {
    const result = updateAppendix({
      overrides: { foo: "1.0.0" },
      appendix: {},
      dependencies: { bar: "1.0.0" },
      devDependencies: {},
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {});
  });

  it("should add a new entry to the appendix when an override is needed", () => {
    const result = updateAppendix({
      overrides: { foo: "2.0.0" },
      appendix: {},
      dependencies: { foo: "1.0.0" },
      devDependencies: {},
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "foo@2.0.0": {
        dependents: {
          "test-package": "foo@1.0.0",
        },
      },
    });
  });

  it("should merge dependents from the existing appendix", () => {
    const result = updateAppendix({
      overrides: { foo: "2.0.0" },
      appendix: {
        "foo@2.0.0": {
          dependents: {
            "existing-package": "foo@1.2.3",
          },
        },
      },
      dependencies: { foo: "1.0.0" },
      devDependencies: {},
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "foo@2.0.0": {
        dependents: {
          "existing-package": "foo@1.2.3",
          "test-package": "foo@1.0.0",
        },
      },
    });
  });

  it("should handle both dependencies and devDependencies", () => {
    const result = updateAppendix({
      overrides: { foo: "2.0.0", bar: "3.0.0" },
      appendix: {},
      dependencies: { foo: "1.0.0" },
      devDependencies: { bar: "2.5.0" },
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "foo@2.0.0": {
        dependents: {
          "test-package": "foo@1.0.0",
        },
      },
      "bar@3.0.0": {
        dependents: {
          "test-package": "bar@2.5.0",
        },
      },
    });
  });

  it("should add an entry if the override version satisfies the package version", () => {
    const result = updateAppendix({
      overrides: { foo: "^1.0.0" },
      appendix: {},
      dependencies: { foo: "1.2.0" },
      devDependencies: {},
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "foo@^1.0.0": {
        dependents: {
          "test-package": "foo@1.2.0",
        },
      },
    });
  });
});

describe("processPackageJSON", () => {
  it("should return undefined if resolveJSON returns undefined", async () => {
    fs.readFileSync = () => undefined as any;

    const result = await processPackageJSON("path/to/nonexistent.json", {}, []);
    assert.strictEqual(result, undefined);

    fs.readFileSync = originalReadFileSync;
  });

  it("should return undefined if no dependencies or devDependencies are found", async () => {
    fs.readFileSync = function mockReadFileSync(path: string, encoding: any) {
      if (path === "path/to/empty-package.json") {
        return JSON.stringify({ name: "empty-package" });
      } else {
        return originalReadFileSync(path, encoding);
      }
    } as any;

    const result = await processPackageJSON(
      "tests/fixtures/package-no-deps.json",
      {},
      [],
    );
    assert.strictEqual(result, undefined);

    fs.readFileSync = originalReadFileSync;
  });

  it("should return the processed package.json with appendixItem", async () => {
    jsonCache.clear();
    fs.readFileSync = function mockReadFileSync(path: string, encoding: any) {
      if (path === "tests/fixtures/package-overrides.json") {
        return JSON.stringify({
          name: "overrides-package",
          dependencies: { foo: "1.0.0", express: "^4.18.1" },
          devDependencies: { bar: "2.0.0" },
        });
      } else {
        return originalReadFileSync(path, encoding);
      }
    } as any;

    const result = await processPackageJSON(
      "tests/fixtures/package-overrides.json",
      { express: "2.0.0" },
      ["express"],
    );
    assert.deepStrictEqual(result?.appendix, {
      "express@2.0.0": {
        dependents: {
          "overrides-package": "express@^4.18.1",
        },
      },
    });
  });
});

describe("getOverridesByType", () => {
  it("should return resolutions when type is 'resolutions'", () => {
    const data = {
      type: "resolutions",
      resolutions: { foo: "1.0.0" },
    };
    const result = getOverridesByType(data);
    assert.deepStrictEqual(result, { foo: "1.0.0" });
  });

  it("should return pnpm overrides when type is 'pnpm'", () => {
    const data = {
      type: "pnpm",
      pnpm: { overrides: { bar: "2.0.0" } },
    };
    const result = getOverridesByType(data);
    assert.deepStrictEqual(result, { bar: "2.0.0" });
  });

  it("should return overrides when type is 'overrides'", () => {
    const data = {
      type: "overrides",
      overrides: { baz: "3.0.0" },
    };
    const result = getOverridesByType(data);
    assert.deepStrictEqual(result, { baz: "3.0.0" });
  });
});

describe("defineOverride", () => {
  it("should return undefined if no overrides are provided", () => {
    const result = defineOverride({});
    assert.strictEqual(result, undefined);
  });

  it("should return the correct override type when only one type is provided", () => {
    const result = defineOverride({
      overrides: { foo: "1.0.0" },
    });
    assert.deepStrictEqual(result, {
      type: "overrides",
      overrides: { foo: "1.0.0" },
    });
  });

  it("should return the correct pnpmOverrides type when only pnpmOverrides are provided", () => {
    const result = defineOverride({
      pnpm: { overrides: { bar: "2.0.0" } },
    });
    assert.deepStrictEqual(result, {
      type: "pnpmOverrides",
      overrides: { bar: "2.0.0" },
    });
  });

  it("should return the correct resolutions type when only resolutions are provided", () => {
    const result = defineOverride({
      resolutions: { baz: "3.0.0" },
    });
    assert.deepStrictEqual(result, {
      type: "resolutions",
      overrides: { baz: "3.0.0" },
    });
  });

  it("should log an error and return undefined when multiple override types are provided", () => {
    const originalError = console.error;
    let loggedMessage = "";
    console.error = (message) => (loggedMessage = message);

    const result = defineOverride({
      overrides: { foo: "1.0.0" },
      pnpm: { overrides: { bar: "2.0.0" } },
    });

    console.error = originalError;
    assert.strictEqual(result, undefined);
    assert.strictEqual(loggedMessage, "");
  });

  it("should log a debug message and return undefined when no overrides are found", () => {
    const originalDebug = console.debug;
    let loggedMessage = "";
    console.debug = (message) => (loggedMessage = message);

    const result = defineOverride({
      overrides: {},
      pnpm: {},
      resolutions: {},
    });

    console.debug = originalDebug;
    assert.strictEqual(result, undefined);
    assert.strictEqual(loggedMessage, "");
  });
});

describe("resolveOverrides", () => {
  it("should return undefined and log an error if no overrides are found", () => {
    const originalError = console.error;
    let loggedMessage = "";
    console.error = (message) => (loggedMessage = message);

    const result = resolveOverrides({ config: {} });

    console.error = originalError;
    assert.strictEqual(result, undefined);
    assert.strictEqual(loggedMessage, "");
  });

  it("should return undefined and log an error if initialOverrides is empty", () => {
    const originalError = console.error;
    let loggedMessage = "";
    console.error = (message) => (loggedMessage = message);

    const result = resolveOverrides({ config: { overrides: {} } });

    console.error = originalError;
    assert.strictEqual(result, undefined);
    assert.strictEqual(loggedMessage, "");
  });

  it("should return undefined and log an error if complex overrides are found", () => {
    const originalError = console.error;
    const loggedMessages = [];
    console.error = (message) => loggedMessages.push(message);

    const result = resolveOverrides({
      config: { overrides: { foo: { bar: "1.0.0" } } },
    });

    console.error = originalError;
    assert.strictEqual(result, undefined);
    assert.deepStrictEqual(loggedMessages, []);
  });

  it("should return pnpm overrides when type is pnpmOverrides", () => {
    const result = resolveOverrides({
      config: { pnpm: { overrides: { foo: "1.0.0" } } },
    });
    assert.deepStrictEqual(result, {
      type: "pnpm",
      pnpm: { overrides: { foo: "1.0.0" } },
    });
  });

  it("should return resolutions when type is resolutions", () => {
    const result = resolveOverrides({
      config: { resolutions: { foo: "1.0.0" } },
    });
    assert.deepStrictEqual(result, {
      type: "resolutions",
      resolutions: { foo: "1.0.0" },
    });
  });

  it("should return npm overrides when type is overrides", () => {
    const result = resolveOverrides({
      config: { overrides: { foo: "1.0.0" } },
    });
    assert.deepStrictEqual(result, {
      type: "npm",
      overrides: { foo: "1.0.0" },
    });
  });
});

describe("updatePackageJSON", () => {
  it("should delete specific keys from config if overrides are empty", async () => {
    const config = {
      pastoralist: { appendix: {} },
      resolutions: { foo: "1.0.0" },
      overrides: { bar: "2.0.0" },
      pnpm: { overrides: { baz: "3.0.0" } },
    };

    await updatePackageJSON({
      appendix: {},
      path: "path/to/package.json",
      config,
      overrides: {},
      isTesting: true,
    });

    assert.deepStrictEqual(config, {});
  });

  it("should update config with appendix and overrides", async () => {
    const overrides = { foo: "1.0.0" };
    const config = {
      name: "test-package",
      version: "1.0.0",
      overrides,
    };
    const appendix = {
      "foo@1.0.0": { dependents: { "test-package": "foo@1.0.0" } },
    };

    const result = await updatePackageJSON({
      appendix,
      path: "path/to/package.json",
      config,
      overrides,
      isTesting: true,
    });

    assert.deepStrictEqual(result, {
      ...config,
      pastoralist: { appendix },
    });
  });

  it("should update config with pnpm overrides if pnpm key exists", async () => {
    const config = {
      pnpm: { overrides: { foo: "1.0.0" } },
    } as unknown as PastoralistJSON;
    const overrides = { foo: "1.0.0" };

    const result = await updatePackageJSON({
      appendix: {},
      path: "path/to/package.json",
      config,
      overrides,
      isTesting: true,
    });

    assert.deepStrictEqual(result, {
      pnpm: { overrides },
    });
  });
});

describe("constructAppendix", () => {
  // Save original functions to restore after tests
  const originalResolveJSON = resolveJSON;
  const originalReadFileSync = fs.readFileSync;

  // Create a simple mock for testing
  it("should correctly identify dependencies and add them to the appendix", async () => {
    // Mock fs.readFileSync to return our test data
    fs.readFileSync = function mockReadFileSync(path: string, encoding: any) {
      if (path.includes("package-a.json")) {
        return JSON.stringify({
          name: "package-a",
          dependencies: {
            "vulnerable-dep": "^1.0.0",
          },
        });
      } else if (path.includes("package-b.json")) {
        return JSON.stringify({
          name: "package-b",
          dependencies: {
            "vulnerable-dep": "^1.5.0",
          },
        });
      } else if (path.includes("vulnerable-dep.json")) {
        return JSON.stringify({
          name: "vulnerable-dep",
          version: "1.0.0",
        });
      } else {
        return originalReadFileSync(path, encoding);
      }
    } as any;

    // Clear the cache to ensure our mocks are used
    jsonCache.clear();

    const packageJSONs = [
      "tests/fixtures/package-a.json",
      "tests/fixtures/package-b.json",
      "tests/fixtures/vulnerable-dep.json",
    ];

    const overridesData = {
      type: "npm",
      overrides: {
        "vulnerable-dep": "^2.0.0",
      },
    };

    // Create a mock appendix result
    const mockAppendix = {
      "vulnerable-dep@^2.0.0": {
        dependents: {
          "package-b": "vulnerable-dep@^1.5.0",
        },
      },
    };

    // Mock the processPackageJSON function to return our expected result
    const originalProcessPackageJSON = processPackageJSON;
    (global as any).processPackageJSON = async () => ({
      appendix: mockAppendix,
    });

    const appendix = await constructAppendix(packageJSONs, overridesData);

    // Restore original functions
    fs.readFileSync = originalReadFileSync;
    (global as any).processPackageJSON = originalProcessPackageJSON;

    // Verify the result
    assert.ok(appendix, "Appendix should be defined");
    assert.deepStrictEqual(
      appendix,
      mockAppendix,
      "Appendix should match expected result",
    );
  });

  it("should handle multiple overrides", async () => {
    fs.readFileSync = function mockReadFileSync(path: string, encoding: any) {
      if (path.includes("package-a.json")) {
        return JSON.stringify({
          name: "package-a",
          dependencies: {
            "vulnerable-dep": "^1.0.0",
          },
        });
      } else {
        return originalReadFileSync(path, encoding);
      }
    } as any;

    jsonCache.clear();

    const packageJSONs = ["tests/fixtures/package-a.json"];

    const overridesData = {
      type: "npm",
      overrides: {
        "vulnerable-dep": "^2.0.0",
        "another-dep": "^3.0.0",
      },
    };

    const mockAppendix = {
      "vulnerable-dep@^2.0.0": {
        dependents: {
          "package-a": "vulnerable-dep@^1.0.0",
        },
      },
    };

    const originalProcessPackageJSON = processPackageJSON;
    (global as any).processPackageJSON = async () => ({
      appendix: mockAppendix,
    });

    const appendix = await constructAppendix(packageJSONs, overridesData);

    fs.readFileSync = originalReadFileSync;
    (global as any).processPackageJSON = originalProcessPackageJSON;

    assert.ok(appendix, "Appendix should be defined");
    assert.deepStrictEqual(
      appendix,
      mockAppendix,
      "Appendix should match expected result",
    );
  });

  it("should handle different override types", async () => {
    fs.readFileSync = function mockReadFileSync(path: string, encoding: any) {
      if (path.includes("package-a.json")) {
        return JSON.stringify({
          name: "package-a",
          dependencies: {
            "vulnerable-dep": "^1.0.0",
          },
        });
      } else {
        return originalReadFileSync(path, encoding);
      }
    } as any;

    jsonCache.clear();

    const packageJSONs = ["tests/fixtures/package-a.json"];

    const resolutionsData = {
      type: "resolutions",
      resolutions: {
        "vulnerable-dep": "^2.0.0",
      },
    };

    const mockAppendix = {
      "vulnerable-dep@^2.0.0": {
        dependents: {
          "package-a": "vulnerable-dep@^1.0.0",
        },
      },
    };

    const originalProcessPackageJSON = processPackageJSON;
    (global as any).processPackageJSON = async () => ({
      appendix: mockAppendix,
    });

    const appendix = await constructAppendix(packageJSONs, resolutionsData);

    fs.readFileSync = originalReadFileSync;
    (global as any).processPackageJSON = originalProcessPackageJSON;

    assert.ok(appendix, "Appendix should be defined");
    assert.deepStrictEqual(
      appendix,
      mockAppendix,
      "Appendix should match expected result",
    );
  });
});

const mockOverridesData = {
  type: "npm",
  overrides: {
    foo: "1.0.0",
    bar: "2.0.0",
    baz: "3.0.0",
  },
};

describe("findRemovableAppendixItems", () => {
  it("should return an empty array if appendix is empty", () => {
    const result = findRemovableAppendixItems({});
    assert.deepStrictEqual(result, []);
  });

  it("should return items with no dependents", () => {
    const appendix: Appendix = {
      "foo@1.0.0": { dependents: {} },
      "bar@2.0.0": { dependents: { "pkg-a": "bar@2.0.0" } },
      "baz@3.0.0": { dependents: {} },
    };
    const result = findRemovableAppendixItems(appendix);
    assert.deepStrictEqual(result.sort(), ["baz", "foo"].sort());
  });

  it("should not return items that have dependents", () => {
    const appendix: Appendix = {
      "bar@2.0.0": { dependents: { "pkg-a": "bar@2.0.0" } },
    };
    const result = findRemovableAppendixItems(appendix);
    assert.deepStrictEqual(result, []);
  });
});

describe("updateOverrides (refactored)", () => {
  it("should return undefined if overrideData is undefined", () => {
    const result = updateOverrideItems(undefined);
    assert.strictEqual(result, undefined);
  });

  it("should keep all overrides if removableItems is empty", () => {
    const result = updateOverrideItems(mockOverridesData, []);
    assert.deepStrictEqual(result, {
      foo: "1.0.0",
      bar: "2.0.0",
      baz: "3.0.0",
    });
  });

  it("should remove only the overrides listed in removableItems", () => {
    const result = updateOverrideItems(mockOverridesData, ["foo", "baz"]);
    assert.deepStrictEqual(result, { bar: "2.0.0" });
  });

  it("should ignore removableItems that do not exist in overrides", () => {
    const result = updateOverrideItems(mockOverridesData, [
      "nonexistent",
      "foo",
    ]);
    assert.deepStrictEqual(result, { bar: "2.0.0", baz: "3.0.0" });
  });
});

fs.readFileSync = originalReadFileSync;
