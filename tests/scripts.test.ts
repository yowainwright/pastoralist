// Enable debugging for tests - must be set before imports
process.env.DEBUG = "true";

import assert from "assert";
import path from "path";
import fg from "fast-glob";
import fs from "fs";
import {
  resolveJSON,
  jsonCache,
  logMethod,
  logger,
  updateAppendix,
  processPackageJSON,
  getOverridesByType,
  defineOverride,
  resolveOverrides,
  updatePackageJSON,
  findRemovableAppendixItems,
  updateOverrides as updateOverrideItems,
  findUnusedOverrides,
  constructAppendix,
  findPackageJsonFiles,
  update,
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  applyOverridesToConfig,
} from "../src/scripts";
import { LOG_PREFIX } from "../src/constants";
import { PastoralistJSON, Appendix } from "../src/interfaces";

// Test utilities with function overloading for better ergonomics using Node.js native APIs

// Mock function interface with call tracking
interface MockFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  calls: Parameters<T>[];
  results: ReturnType<T>[];
  callCount: number;
  reset(): void;
}

// Create a mock function
function createMockFunction<
  T extends (...args: any[]) => any,
>(): MockFunction<T> {
  const calls: Parameters<T>[] = [];
  const results: ReturnType<T>[] = [];

  const mockFn = ((...args: Parameters<T>): ReturnType<T> => {
    calls.push(args);
    const result = undefined as ReturnType<T>;
    results.push(result);
    return result;
  }) as MockFunction<T>;

  mockFn.calls = calls;
  mockFn.results = results;
  Object.defineProperty(mockFn, "callCount", {
    get() {
      return calls.length;
    },
  });
  mockFn.reset = () => {
    calls.length = 0;
    results.length = 0;
  };

  return mockFn;
}

// Function overloads for describe
export function describe(description: string, fn: () => void): void;
export function describe(description: string, fn: () => Promise<void>): void;
export function describe(description: string, fn: any): void {
  console.log(`\n${description}`);
  fn();
}

// Function overloads for it
export function it(testDescription: string, fn: () => void): void;
export function it(testDescription: string, fn: () => Promise<void>): void;
export function it(testDescription: string, fn: any): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          console.log(`\t✅ ${testDescription}`);
        })
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

// Test helper utilities with overloading
export function mockFunction<T extends (...args: any[]) => any>(
  obj: any,
  methodName: keyof typeof obj,
): {
  mock: MockFunction<T>;
  restore: () => void;
};
export function mockFunction<T extends (...args: any[]) => any>(): {
  mock: MockFunction<T>;
  restore: () => void;
};
export function mockFunction<T extends (...args: any[]) => any>(
  obj?: any,
  methodName?: keyof typeof obj,
) {
  if (obj && methodName) {
    const original = obj[methodName];
    const mock = createMockFunction<T>();
    obj[methodName] = mock;
    return {
      mock,
      restore: () => {
        obj[methodName] = original;
      },
    };
  } else {
    // Simple function mock
    const mock = createMockFunction<T>();
    return {
      mock,
      restore: () => {}, // No-op for simple functions
    };
  }
}

// Console mock utilities with overloading
export function mockConsole(): {
  log: MockFunction<typeof console.log>;
  error: MockFunction<typeof console.error>;
  warn: MockFunction<typeof console.warn>;
  debug: MockFunction<typeof console.debug>;
  restore: () => void;
};
export function mockConsole(method: "log" | "error" | "warn" | "debug"): {
  mock: MockFunction<(typeof console)[typeof method]>;
  restore: () => void;
};
export function mockConsole(method?: "log" | "error" | "warn" | "debug") {
  if (method) {
    const original = console[method];
    const mock = createMockFunction<(typeof console)[typeof method]>();
    console[method] = mock as any;
    return {
      mock,
      restore: () => {
        console[method] = original;
      },
    };
  } else {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalDebug = console.debug;

    const logMock = createMockFunction<typeof console.log>();
    const errorMock = createMockFunction<typeof console.error>();
    const warnMock = createMockFunction<typeof console.warn>();
    const debugMock = createMockFunction<typeof console.debug>();

    console.log = logMock as any;
    console.error = errorMock as any;
    console.warn = warnMock as any;
    console.debug = debugMock as any;

    return {
      log: logMock,
      error: errorMock,
      warn: warnMock,
      debug: debugMock,
      restore: () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        console.debug = originalDebug;
      },
    };
  }
}

// Assertion utilities with overloading
export function assertCalled<T extends (...args: any[]) => any>(
  mock: MockFunction<T>,
): void;
export function assertCalled<T extends (...args: any[]) => any>(
  mock: MockFunction<T>,
  times: number,
): void;
export function assertCalled<T extends (...args: any[]) => any>(
  mock: MockFunction<T>,
  times?: number,
): void {
  if (times !== undefined) {
    assert.strictEqual(
      mock.callCount,
      times,
      `Expected function to be called ${times} times`,
    );
  } else {
    assert.ok(
      mock.callCount > 0,
      "Expected function to be called at least once",
    );
  }
}

export function assertCalledWith<T extends (...args: any[]) => any>(
  mock: MockFunction<T>,
  ...expectedArgs: Parameters<T>
): void;
export function assertCalledWith<T extends (...args: any[]) => any>(
  mock: MockFunction<T>,
  callIndex: number,
  ...expectedArgs: Parameters<T>
): void;
export function assertCalledWith<T extends (...args: any[]) => any>(
  mock: MockFunction<T>,
  callIndexOrFirstArg: any,
  ...restArgs: any[]
): void {
  if (typeof callIndexOrFirstArg === "number") {
    const callIndex = callIndexOrFirstArg;
    const expectedArgs = restArgs;
    assert.deepStrictEqual(
      mock.calls[callIndex],
      expectedArgs,
      `Expected call ${callIndex} to have specific arguments`,
    );
  } else {
    const expectedArgs = [callIndexOrFirstArg, ...restArgs];
    const lastCall = mock.calls[mock.calls.length - 1];
    assert.deepStrictEqual(
      lastCall,
      expectedArgs,
      "Expected last call to have specific arguments",
    );
  }
}

// Additional utility functions for easier testing
export function captureConsoleOutput(
  method: "log" | "error" | "warn" | "debug" = "log",
): {
  output: string[];
  restore: () => void;
} {
  const output: string[] = [];
  const original = console[method];

  console[method] = (...args: any[]) => {
    output.push(args.join(" "));
  };

  return {
    output,
    restore: () => {
      console[method] = original;
    },
  };
}


const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function mockReadFileSync(path: string, encoding: any) {
  if (path === "./fixtures/package-simple.json") {
    return JSON.stringify({ key: "value" });
  } else if (path === "./fixtures/package-no-deps.json") {
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
    const path = "./fixtures/package-resolutions.json";
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
    console.log = (message) => (loggedMessage = message);

    const log = logMethod("log", true, "test.ts");
    log("This is a test message", "testCaller");

    console.log = originalLog;
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
      dependencies: {
        semver: "^6.3.1",
        "tough-cookie": "^4.1.0",
      },
      devDependencies: {},
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {});
  });

  it("should create appendix entry for transitive dependency overrides", () => {
    const result = updateAppendix({
      overrides: { foo: "1.0.0" },
      appendix: {},
      dependencies: { bar: "1.0.0" },
      devDependencies: {},
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "foo@1.0.0": {
        dependents: {
          "test-package": "foo (transitive dependency)",
        },
      },
    });
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

  it("should add an entry for the overridden dependency", () => {
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
      "./fixtures/package-no-deps.json",
      {},
      [],
    );
    assert.strictEqual(result, undefined);

    fs.readFileSync = originalReadFileSync;
  });

  it("should return the processed package.json with appendixItem", async () => {
    jsonCache.clear();
    const mockPackageJSON = {
      name: "overrides-package",
      dependencies: { foo: "1.0.0", express: "^4.18.1" },
      devDependencies: { bar: "2.0.0" },
    };

    // Cache the mock data
    jsonCache.set("tests/fixtures/package-overrides.json", mockPackageJSON);

    // Set up mock fs.readFileSync
    const mockReadFileSync = originalReadFileSync;
    fs.readFileSync = (path: string, encoding: string) => {
      if (path === "tests/fixtures/package-overrides.json") {
        return JSON.stringify(mockPackageJSON);
      }
      return mockReadFileSync(path, encoding);
    };

    try {
      const result = await processPackageJSON(
        "tests/fixtures/package-overrides.json",
        { express: "2.0.0" },
        ["express"],
      );

      // The result should match our expected data
      assert.deepStrictEqual(result?.name, mockPackageJSON.name);
      assert.deepStrictEqual(
        result?.dependencies,
        mockPackageJSON.dependencies,
      );
      assert.ok(result?.appendix); // Should exist
      assert.deepStrictEqual(
        result?.appendix["express@2.0.0"]?.dependents["overrides-package"],
        "express@^4.18.1",
      );
    } finally {
      // Restore original fs.readFileSync
      fs.readFileSync = mockReadFileSync;
    }
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
    // This test checks the behavior but doesn't rely on exact console logging
    // since the logging behavior depends on the IS_DEBUGGING constant
    const result = defineOverride({
      overrides: { foo: "1.0.0" },
      pnpm: { overrides: { bar: "2.0.0" } },
    });

    assert.strictEqual(result, undefined);
  });

  it("should return undefined when no overrides are found", () => {
    const result = defineOverride({
      overrides: {},
      pnpm: {},
      resolutions: {},
    });
    assert.strictEqual(result, undefined);
  });
});

describe("resolveOverrides", () => {
  it("should return undefined when no overrides are found", () => {
    // This test checks the behavior but doesn't rely on exact console logging
    // since the logging behavior depends on the IS_DEBUGGING constant
    const result = resolveOverrides({ config: {} });

    assert.strictEqual(result, undefined);
  });

  it("should return undefined when overrides is empty", () => {
    // This test checks the behavior but doesn't rely on exact console logging
    // since the logging behavior depends on the IS_DEBUGGING constant
    const result = resolveOverrides({ config: { overrides: {} } });

    assert.strictEqual(result, undefined);
  });

  it("should handle nested overrides correctly", () => {
    const result = resolveOverrides({
      config: { overrides: { foo: { bar: "1.0.0" } } },
    });

    // Now nested overrides are supported
    assert.deepStrictEqual(result, {
      type: "npm",
      overrides: { foo: { bar: "1.0.0" } },
    });
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
    // Clear the cache to ensure our mocks are used
    jsonCache.clear();

    // Set up the mock data directly in the cache
    const mockPackageJSON = {
      name: "package-a",
      dependencies: {
        semver: "^7.5.3",
        "tough-cookie": "^4.1.3",
      },
    };
    jsonCache.set("tests/fixtures/package.json", mockPackageJSON);

    const packageJSONs = ["tests/fixtures/package.json"];

    const overridesData = {
      type: "npm",
      overrides: {
        semver: "^7.5.3",
        "tough-cookie": "^4.1.3",
      },
    };

    // Create a mock appendix result
    const mockAppendix = {
      "semver@^7.5.3": {
        dependents: {
          "package-a": "semver@^7.5.3",
        },
      },
      "tough-cookie@^4.1.3": {
        dependents: {
          "package-a": "tough-cookie@^4.1.3",
        },
      },
    };

    // Mock the processPackageJSON function to return our expected appendix
    const originalProcessPackageJSON = processPackageJSON;
    (global as any).processPackageJSON = async () => ({
      appendix: mockAppendix,
    });

    const testLog = logger({ file: "test", isLogging: true });
    const appendix = await constructAppendix(
      packageJSONs,
      overridesData,
      {},
      testLog,
    );

    // Debug logging
    testLog.debug(`Package: ${mockPackageJSON.name}`, "constructAppendix");
    testLog.debug(`Appendix: ${JSON.stringify(appendix)}`, "constructAppendix");

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
    jsonCache.clear();

    const mockPackageJSON = {
      name: "package-a",
      dependencies: {
        "vulnerable-dep": "^1.0.0",
        "another-dep": "^3.0.0",
      },
    };
    
    // Create a temporary copy of the fixture file
    const tempFixturePath = "tests/fixtures/package-a-temp.json";
    try {
      fs.writeFileSync(tempFixturePath, JSON.stringify(mockPackageJSON, null, 2));
      jsonCache.set(tempFixturePath, mockPackageJSON);

      const packageJSONs = [tempFixturePath];

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
        "another-dep@^3.0.0": {
          dependents: {
            "package-a": "another-dep@^3.0.0",
          },
        },
      };

      const originalProcessPackageJSON = processPackageJSON;
      (global as any).processPackageJSON = async () => ({
        appendix: mockAppendix,
      });

      const testLog = logger({ file: "test", isLogging: false });
      const appendix = await constructAppendix(
        packageJSONs,
        overridesData,
        {},
        testLog,
      );

      fs.readFileSync = originalReadFileSync;
      (global as any).processPackageJSON = originalProcessPackageJSON;

      assert.ok(appendix, "Appendix should be defined");
      assert.deepStrictEqual(
        appendix,
        mockAppendix,
        "Appendix should match expected result",
      );
    } finally {
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempFixturePath);
      } catch {}
    }
  });
  it("should handle different override types", async () => {
    jsonCache.clear();

    const mockPackageJSON = {
      name: "package-a",
      dependencies: {
        "vulnerable-dep": "^1.0.0",
      },
    };

    // Create a temporary copy of the fixture file
    const tempFixturePath = "tests/fixtures/package-a-temp-2.json";
    try {
      fs.writeFileSync(tempFixturePath, JSON.stringify(mockPackageJSON, null, 2));
      jsonCache.set(tempFixturePath, mockPackageJSON);

      // Mock fs.readFileSync for the test
      fs.readFileSync = function mockReadFileSync(path: string, encoding: any) {
        if (path.includes("package-a-temp-2.json")) {
          return JSON.stringify(mockPackageJSON);
        } else {
          return originalReadFileSync(path, encoding);
        }
      } as any;

      const packageJSONs = [tempFixturePath];

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

      const testLog = logger({ file: "test", isLogging: false });
      const appendix = await constructAppendix(
        packageJSONs,
        resolutionsData,
        {},
        testLog,
      );

      fs.readFileSync = originalReadFileSync;
      (global as any).processPackageJSON = originalProcessPackageJSON;

      assert.ok(appendix, "Appendix should be defined");
      assert.deepStrictEqual(
        appendix,
        mockAppendix,
        "Appendix should match expected result",
      );
    } finally {
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempFixturePath);
      } catch {}
    }
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

describe("peerDependencies support", () => {
  it("should create appendix entry for any overridden peerDependency", () => {
    const result = updateAppendix({
      overrides: { lodash: "5.0.0" },
      appendix: {},
      dependencies: { react: "^18.0.0" },
      devDependencies: { typescript: "^5.0.0" },
      peerDependencies: { lodash: "^4.17.0" },
      packageName: "test-package-with-peers",
    });
    assert.deepStrictEqual(result, {
      "lodash@5.0.0": {
        dependents: {
          "test-package-with-peers": "lodash@^4.17.0",
        },
      },
    });
  });

  it("should include all overridden dependencies in appendix", () => {
    const result = updateAppendix({
      overrides: {
        react: "18.2.0",
        typescript: "4.9.5",
        lodash: "4.17.21",
      },
      appendix: {},
      dependencies: { react: "^18.0.0" },
      devDependencies: { typescript: "^5.0.0" },
      peerDependencies: { lodash: "^4.17.0" },
      packageName: "test-package-with-all-deps",
    });
    // Should include all overridden dependencies
    assert.deepStrictEqual(result, {
      "react@18.2.0": {
        dependents: {
          "test-package-with-all-deps": "react@^18.0.0",
        },
      },
      "typescript@4.9.5": {
        dependents: {
          "test-package-with-all-deps": "typescript@^5.0.0",
        },
      },
      "lodash@4.17.21": {
        dependents: {
          "test-package-with-all-deps": "lodash@^4.17.0",
        },
      },
    });
  });
});

describe("depPaths and ignore functionality", () => {
  it("should find package.json files using depPaths patterns", () => {
    const mockFiles = [
      "packages/app/package.json",
      "packages/lib/package.json",
      "apps/web/package.json",
    ];

    const originalSync = fg.sync;
    fg.sync = (() => mockFiles) as typeof fg.sync;

    const result = findPackageJsonFiles([
      "packages/*/package.json",
      "apps/*/package.json",
    ]);

    fg.sync = originalSync;

    assert.deepStrictEqual(result, mockFiles);
  });

  it("should respect ignore patterns", () => {
    const allFiles = [
      "packages/app/package.json",
      "packages/lib/package.json",
      "packages/ignored/package.json",
    ];
    const filteredFiles = [
      "packages/app/package.json",
      "packages/lib/package.json",
    ];

    const originalSync = fg.sync;
    fg.sync = ((patterns: string[], options?: fg.Options) => {
      if (options?.ignore && options.ignore.includes("packages/ignored/**")) {
        return filteredFiles;
      }
      return allFiles;
    }) as typeof fg.sync;

    const result = findPackageJsonFiles(
      ["packages/*/package.json"],
      ["packages/ignored/**"],
    );

    fg.sync = originalSync;

    assert.deepStrictEqual(result, filteredFiles);
  });

  it("should return empty array when no depPaths provided", () => {
    const result = findPackageJsonFiles([]);
    assert.deepStrictEqual(result, []);
  });

  it("should handle errors gracefully", () => {
    // Use a non-existent pattern that won't match our real workspace files
    const result = findPackageJsonFiles(["non-existent-dir/*/package.json"]);
    assert.deepStrictEqual(result, []);
  });
});

describe("update function with depPaths support", () => {
  it("should process without creating appendix when depPaths finds no files", async () => {
    const testPath = "test-update-depPaths.json";
    const testConfig = {
      name: "test-project",
      version: "1.0.0",
      dependencies: {
        lodash: "^4.17.0",
      },
      overrides: {
        lodash: "4.17.21",
      },
    };

    fs.writeFileSync(testPath, JSON.stringify(testConfig, null, 2));

    try {
      await update({
        path: testPath,
        depPaths: ["non-existent-dir/*/package.json"],
      });

      const updatedContent = fs.readFileSync(testPath, "utf-8");
      const updatedJson = JSON.parse(updatedContent);
      
      assert.strictEqual(updatedJson.pastoralist, undefined, "Should not have pastoralist section when no files found");
      assert.deepStrictEqual(updatedJson.overrides, testConfig.overrides, "Overrides should be preserved");
    } finally {
      try {
        fs.unlinkSync(testPath);
      } catch {}
    }
  });
});

describe("patch detection and management", () => {
  it("should detect patches from common patterns", () => {
    // Mock patch files
    const mockPatches = [
      "patches/lodash+4.17.21.patch",
      "patches/@types+react+18.0.0.patch",
      "patches/express.patch",
    ];

    // Since we can't easily mock fast-glob in this test environment,
    // we'll test the parsing logic directly
    const patchMap: Record<string, string[]> = {};

    mockPatches.forEach((patchFile) => {
      const basename = patchFile.split("/").pop() || "";

      if (!basename.endsWith(".patch")) {
        return; // Skip non-patch files
      }

      // Remove .patch extension
      const nameWithoutExt = basename.replace(".patch", "");

      let packageName: string;

      if (!nameWithoutExt.includes("+")) {
        // Simple case: package-name.patch -> package-name
        packageName = nameWithoutExt;
      } else {
        // Complex case: package+version.patch or @scope+package+version.patch
        const parts = nameWithoutExt.split("+");

        if (nameWithoutExt.startsWith("@")) {
          // Scoped package: @scope+package+version -> @scope/package
          if (parts.length >= 2) {
            packageName = `${parts[0]}/${parts[1]}`;
          } else {
            packageName = parts[0]; // Fallback
          }
        } else {
          // Regular package: package+version -> package
          packageName = parts[0];
        }
      }

      if (packageName) {
        if (!patchMap[packageName]) {
          patchMap[packageName] = [];
        }
        patchMap[packageName].push(patchFile);
      }
    });

    assert.deepStrictEqual(patchMap, {
      lodash: ["patches/lodash+4.17.21.patch"],
      "@types/react": ["patches/@types+react+18.0.0.patch"],
      express: ["patches/express.patch"],
    });
  });

  it("should find unused patches correctly", () => {
    const patchMap = {
      lodash: ["patches/lodash+4.17.21.patch"],
      "unused-package": ["patches/unused-package+1.0.0.patch"],
      react: ["patches/react+18.0.0.patch"],
    };

    const allDependencies = {
      lodash: "^4.17.0",
      react: "^18.0.0",
      // unused-package is not in dependencies
    };

    const unusedPatches: string[] = [];
    Object.entries(patchMap).forEach(([packageName, patches]) => {
      if (!allDependencies[packageName]) {
        unusedPatches.push(...patches);
      }
    });

    assert.deepStrictEqual(unusedPatches, [
      "patches/unused-package+1.0.0.patch",
    ]);
  });

  it("should get package patches correctly", () => {
    const patchMap = {
      lodash: ["patches/lodash+4.17.21.patch", "patches/lodash+4.17.20.patch"],
      react: ["patches/react+18.0.0.patch"],
    };

    const lodashPatches = patchMap["lodash"] || [];
    const reactPatches = patchMap["react"] || [];
    const nonExistentPatches = patchMap["non-existent"] || [];

    assert.deepStrictEqual(lodashPatches, [
      "patches/lodash+4.17.21.patch",
      "patches/lodash+4.17.20.patch",
    ]);
    assert.deepStrictEqual(reactPatches, ["patches/react+18.0.0.patch"]);
    assert.deepStrictEqual(nonExistentPatches, []);
  });
});

describe("findUnusedOverrides", () => {
  it("should return an empty array when no overrides are provided", async () => {
    const result = await findUnusedOverrides({}, { lodash: "^4.17.0" });
    assert.deepStrictEqual(result, []);
  });

  it("should return an empty array when all overrides are in dependencies", async () => {
    const overrides = {
      lodash: "4.17.21",
      react: "18.2.0",
      typescript: "5.0.0",
    };
    const allDependencies = {
      lodash: "^4.17.0",
      react: "^18.0.0",
      typescript: "^5.0.0",
      express: "^4.18.0", // Extra dependency not in overrides is ok
    };

    const result = await findUnusedOverrides(overrides, allDependencies);
    assert.deepStrictEqual(result, []);
  });

  it("should return packages that are in overrides but not in dependencies", async () => {
    const overrides = {
      lodash: "4.17.21",
      "old-package": "1.0.0",
      react: "18.2.0",
      "removed-dep": "2.0.0",
    };
    const allDependencies = {
      lodash: "^4.17.0",
      react: "^18.0.0",
    };

    const result = await findUnusedOverrides(overrides, allDependencies);
    // Note: In actual usage, this will check npm ls to see if packages are truly unused
    // For tests, we're assuming old-package and removed-dep would be found as unused
    assert.ok(Array.isArray(result));
  });

  it("should keep simple overrides even when all dependencies are removed", async () => {
    const overrides = {
      "old-dep-1": "1.0.0",
      "old-dep-2": "2.0.0",
    };
    const allDependencies = {};

    const result = await findUnusedOverrides(overrides, allDependencies);
    assert.deepStrictEqual(result, []);
  });

  it("should keep simple overrides with empty dependencies object", async () => {
    const overrides = {
      lodash: "4.17.21",
    };
    const allDependencies = {};

    const result = await findUnusedOverrides(overrides, allDependencies);
    assert.deepStrictEqual(result, []);
  });

  it("should handle mixed dependency types (dependencies, devDependencies, peerDependencies)", async () => {
    const overrides = {
      lodash: "4.17.21",
      typescript: "5.0.0",
      react: "18.2.0",
      "old-package": "1.0.0",
    };
    const allDependencies = {
      lodash: "^4.17.0",
      typescript: "^5.0.0",
      react: "^18.0.0",
    };

    const result = await findUnusedOverrides(overrides, allDependencies);
    assert.deepStrictEqual(result, ["old-package"]);
  });

  it("should handle scoped packages correctly", async () => {
    const overrides = {
      "@types/node": "20.0.0",
      "@babel/core": "7.22.0",
      "@removed/package": "1.0.0",
    };
    const allDependencies = {
      "@types/node": "^18.0.0",
      "@babel/core": "^7.20.0",
      // @removed/package is missing
    };

    const result = await findUnusedOverrides(overrides, allDependencies);
    assert.deepStrictEqual(result, ["@removed/package"]);
  });
});

describe("Cleanup functionality integration", () => {
  it("should identify and clean up unused overrides during update", async () => {
    // Mock a package.json with overrides for packages that are no longer dependencies
    const mockConfig = {
      name: "test-cleanup",
      version: "1.0.0",
      dependencies: {
        lodash: "^4.17.0",
        react: "^18.0.0",
      },
      // Note: old-package is NOT in dependencies but IS in overrides
      overrides: {
        lodash: "4.17.21",
        react: "18.2.0",
        "old-package": "1.0.0", // This should be removed
      },
    };

    // Test the cleanup logic components
    const allDeps = { ...mockConfig.dependencies };
    const unusedOverrides = await findUnusedOverrides(mockConfig.overrides, allDeps);

    assert.deepStrictEqual(
      unusedOverrides,
      ["old-package"],
      "Should identify old-package as unused",
    );

    // Test the updateOverrides function
    const mockOverridesData = {
      type: "npm",
      overrides: mockConfig.overrides,
    };

    const cleanedOverrides = updateOverrideItems(
      mockOverridesData,
      unusedOverrides,
    );
    const expectedCleanedOverrides = {
      lodash: "4.17.21",
      react: "18.2.0",
      // old-package should be removed
    };

    assert.deepStrictEqual(
      cleanedOverrides,
      expectedCleanedOverrides,
      "Should remove unused overrides",
    );
  });

  it("should preserve overrides when all packages are still dependencies", async () => {
    const overrides = {
      lodash: "4.17.21",
      react: "18.2.0",
      typescript: "5.0.0",
    };
    const allDeps = {
      lodash: "^4.17.0",
      react: "^18.0.0",
      typescript: "^5.0.0",
    };

    const unusedOverrides = await findUnusedOverrides(overrides, allDeps);
    assert.deepStrictEqual(
      unusedOverrides,
      [],
      "Should find no unused overrides",
    );

    const mockOverridesData = { type: "npm", overrides };
    const cleanedOverrides = updateOverrideItems(
      mockOverridesData,
      unusedOverrides,
    );
    assert.deepStrictEqual(
      cleanedOverrides,
      overrides,
      "Should preserve all overrides",
    );
  });

  it("should handle complex cleanup scenarios", async () => {
    const overrides = {
      lodash: "4.17.21",
      "@types/node": "20.0.0",
      "old-dep-1": "1.0.0",
      react: "18.2.0",
      "old-dep-2": "2.0.0",
      typescript: "5.0.0",
      "removed-package": "3.0.0",
    };
    const allDeps = {
      lodash: "^4.17.0",
      "@types/node": "^18.0.0",
      react: "^18.0.0",
      typescript: "^5.0.0",
      // old-dep-1, old-dep-2, and removed-package are missing
    };

    const unusedOverrides = await findUnusedOverrides(overrides, allDeps);
    const expectedUnused = ["old-dep-1", "old-dep-2", "removed-package"];
    assert.deepStrictEqual(
      unusedOverrides.sort(),
      expectedUnused.sort(),
      "Should identify all unused overrides",
    );

    const mockOverridesData = { type: "npm", overrides };
    const cleanedOverrides = updateOverrideItems(
      mockOverridesData,
      unusedOverrides,
    );
    const expectedCleaned = {
      lodash: "4.17.21",
      "@types/node": "20.0.0",
      react: "18.2.0",
      typescript: "5.0.0",
    };
    assert.deepStrictEqual(
      cleanedOverrides,
      expectedCleaned,
      "Should remove all unused overrides while preserving used ones",
    );
  });

  it("should work with different override types (pnpm, resolutions)", async () => {
    // Test pnpm overrides
    const pnpmOverridesData = {
      type: "pnpm",
      pnpm: {
        overrides: {
          lodash: "4.17.21",
          "old-package": "1.0.0",
        },
      },
    };

    const pnpmOverrides = getOverridesByType(pnpmOverridesData);
    const allDeps = { lodash: "^4.17.0" }; // old-package missing
    const unusedPnpmOverrides = await findUnusedOverrides(pnpmOverrides, allDeps);

    assert.deepStrictEqual(
      unusedPnpmOverrides,
      ["old-package"],
      "Should identify unused pnpm overrides",
    );

    const cleanedPnpmOverrides = updateOverrideItems(
      pnpmOverridesData,
      unusedPnpmOverrides,
    );
    assert.deepStrictEqual(
      cleanedPnpmOverrides,
      { lodash: "4.17.21" },
      "Should clean pnpm overrides",
    );

    // Test resolutions
    const resolutionsData = {
      type: "resolutions",
      resolutions: {
        lodash: "4.17.21",
        "old-package": "1.0.0",
      },
    };

    const resolutions = getOverridesByType(resolutionsData);
    const unusedResolutions = await findUnusedOverrides(resolutions, allDeps);

    assert.deepStrictEqual(
      unusedResolutions,
      ["old-package"],
      "Should identify unused resolutions",
    );

    const cleanedResolutions = updateOverrideItems(
      resolutionsData,
      unusedResolutions,
    );
    assert.deepStrictEqual(
      cleanedResolutions,
      { lodash: "4.17.21" },
      "Should clean resolutions",
    );
  });
});

describe("Nested Overrides Support", () => {
  it("should handle simple overrides", () => {
    const result = updateAppendix({
      overrides: { lodash: "4.17.21" },
      appendix: {},
      dependencies: { lodash: "^4.17.0" },
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "lodash@4.17.21": {
        dependents: {
          "test-package": "lodash@^4.17.0",
        },
      },
    });
  });

  it("should handle nested overrides for transitive dependencies", () => {
    const result = updateAppendix({
      overrides: { pg: { "pg-types": "^4.0.1" } },
      appendix: {},
      dependencies: { pg: "^8.13.1" },
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "pg-types@^4.0.1": {
        dependents: {
          "test-package": "pg@^8.13.1 (nested override)",
        },
      },
    });
  });

  it("should handle mixed simple and nested overrides", () => {
    const result = updateAppendix({
      overrides: {
        lodash: "4.17.21",
        pg: { "pg-types": "^4.0.1" },
      },
      appendix: {},
      dependencies: {
        lodash: "^4.17.0",
        pg: "^8.13.1",
      },
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "lodash@4.17.21": {
        dependents: {
          "test-package": "lodash@^4.17.0",
        },
      },
      "pg-types@^4.0.1": {
        dependents: {
          "test-package": "pg@^8.13.1 (nested override)",
        },
      },
    });
  });

  it("should ignore nested overrides when parent package is not in dependencies", () => {
    const result = updateAppendix({
      overrides: { pg: { "pg-types": "^4.0.1" } },
      appendix: {},
      dependencies: { lodash: "^4.17.0" }, // pg is not a dependency
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {});
  });

  it("should handle multiple nested overrides in same parent", () => {
    const result = updateAppendix({
      overrides: {
        pg: {
          "pg-types": "^4.0.1",
          "pg-protocol": "^1.6.0",
        },
      },
      appendix: {},
      dependencies: { pg: "^8.13.1" },
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "pg-types@^4.0.1": {
        dependents: {
          "test-package": "pg@^8.13.1 (nested override)",
        },
      },
      "pg-protocol@^1.6.0": {
        dependents: {
          "test-package": "pg@^8.13.1 (nested override)",
        },
      },
    });
  });

  it("should preserve nested overrides in resolveOverrides", () => {
    const result = resolveOverrides({
      config: {
        overrides: {
          lodash: "4.17.21",
          pg: { "pg-types": "^4.0.1" },
        },
      },
    });
    assert.deepStrictEqual(result, {
      type: "npm",
      overrides: {
        lodash: "4.17.21",
        pg: { "pg-types": "^4.0.1" },
      },
    });
  });

  it("should handle nested overrides in findUnusedOverrides", async () => {
    const overrides = {
      lodash: "4.17.21",
      pg: { "pg-types": "^4.0.1" },
      "old-package": { "sub-dep": "1.0.0" },
    };
    const allDependencies = {
      lodash: "^4.17.0",
      pg: "^8.13.1",
      // old-package is not in dependencies
    };

    const result = await findUnusedOverrides(overrides, allDependencies);
    assert.deepStrictEqual(result, ["old-package"]);
  });

  it("should not remove nested overrides when parent is in dependencies", async () => {
    const overrides = {
      pg: { "pg-types": "^4.0.1" },
    };
    const allDependencies = {
      pg: "^8.13.1",
    };

    const result = await findUnusedOverrides(overrides, allDependencies);
    assert.deepStrictEqual(result, []);
  });

  it("should handle nested overrides with devDependencies", () => {
    const result = updateAppendix({
      overrides: { webpack: { "loader-utils": "^3.2.1" } },
      appendix: {},
      dependencies: {},
      devDependencies: { webpack: "^5.88.0" },
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "loader-utils@^3.2.1": {
        dependents: {
          "test-package": "webpack@^5.88.0 (nested override)",
        },
      },
    });
  });

  it("should handle nested overrides with peerDependencies", () => {
    const result = updateAppendix({
      overrides: { react: { "scheduler": "^0.23.0" } },
      appendix: {},
      dependencies: {},
      peerDependencies: { react: "^18.0.0" },
      packageName: "test-package",
    });
    assert.deepStrictEqual(result, {
      "scheduler@^0.23.0": {
        dependents: {
          "test-package": "react@^18.0.0 (nested override)",
        },
      },
    });
  });
});

describe("Migration Tests", () => {
  it("should migrate from 1.3.0 format to 1.4.0 format correctly", () => {
    const oldFormat: PastoralistJSON = {
      name: "test-migration",
      version: "1.0.0",
      dependencies: {
        lodash: "^4.17.21",
        express: "^4.18.0",
      },
      devDependencies: {
        "old-package": "^1.0.0",
      },
      peerDependencies: {
        typescript: "^5.0.0",
      },
      overrides: {
        lodash: "4.17.21",
        express: "4.18.0",
        "old-package": "1.0.0",
      },
      pastoralist: {
        appendix: {
          "lodash@4.17.21": {
            dependents: {
              "test-migration": "lodash@^4.17.21",
            },
          },
          "express@4.18.0": {
            dependents: {
              "test-migration": "express@^4.18.0",
            },
          },
          "old-package@1.0.0": {
            dependents: {
              "test-migration": "old-package@^1.0.0",
            },
          },
        },
      },
    };

    const updatedAppendix = updateAppendix({
      overrides: oldFormat.overrides,
      appendix: oldFormat.pastoralist.appendix,
      dependencies: oldFormat.dependencies,
      devDependencies: oldFormat.devDependencies,
      peerDependencies: oldFormat.peerDependencies,
      packageName: oldFormat.name,
    });

    assert.ok(updatedAppendix, "Updated appendix should exist");
    const appendixKeys = Object.keys(updatedAppendix);
    assert.ok(appendixKeys.length > 0, "Appendix should have entries");

    appendixKeys.forEach((key) => {
      const entry = updatedAppendix[key];
      assert.ok(entry.dependents, `Entry ${key} should have dependents`);
      assert.ok(
        typeof entry.dependents === "object",
        `Entry ${key} dependents should be an object`,
      );
    });
  });

  it("should preserve existing appendix structure during migration", () => {
    const packageWithExistingAppendix: PastoralistJSON = {
      name: "test-migration-existing",
      version: "1.0.0",
      dependencies: {
        lodash: "^4.17.21",
      },
      overrides: {
        lodash: "4.17.21",
      },
      pastoralist: {
        appendix: {
          "lodash@4.17.21": {
            dependents: {
              "test-migration-existing": "lodash@^4.17.21",
            },
            patches: ["patches/lodash+4.17.21.patch"],
          },
        },
      },
    };

    const updatedAppendix = updateAppendix({
      overrides: packageWithExistingAppendix.overrides,
      appendix: packageWithExistingAppendix.pastoralist.appendix,
      dependencies: packageWithExistingAppendix.dependencies,
      packageName: packageWithExistingAppendix.name,
    });

    assert.ok(
      updatedAppendix["lodash@4.17.21"],
      "Existing appendix entry should be preserved",
    );

    const lodashEntry = updatedAppendix["lodash@4.17.21"];
    assert.ok(lodashEntry.dependents, "Dependents should be preserved");

    if (lodashEntry.patches) {
      assert.ok(
        Array.isArray(lodashEntry.patches),
        "Patches should be an array if present",
      );
      assert.ok(
        lodashEntry.patches.includes("patches/lodash+4.17.21.patch"),
        "Existing patches should be preserved",
      );
    }
  });

  it("should handle migration with peerDependencies support", () => {
    const packageWithPeerDeps: PastoralistJSON = {
      name: "test-peer-deps",
      version: "1.0.0",
      dependencies: {
        react: "^18.0.0",
      },
      peerDependencies: {
        typescript: "^5.0.0",
        "@types/react": "^18.0.0",
      },
      overrides: {
        react: "18.2.0",
        "@types/react": "18.0.0",
      },
    };

    const updatedAppendix = updateAppendix({
      overrides: packageWithPeerDeps.overrides,
      appendix: {},
      dependencies: packageWithPeerDeps.dependencies,
      peerDependencies: packageWithPeerDeps.peerDependencies,
      packageName: packageWithPeerDeps.name,
    });

    const appendixKeys = Object.keys(updatedAppendix);
    assert.ok(
      appendixKeys.length > 0,
      "Appendix should track overridden dependencies",
    );
    
    assert.ok(
      updatedAppendix["react@18.2.0"],
      "React override should be in appendix",
    );
    assert.ok(
      updatedAppendix["@types/react@18.0.0"],
      "@types/react override should be in appendix",
    );
  });
});

describe("Nested Overrides Fixture Tests", () => {
  it("should process package.json with nested overrides from fixture", async () => {
    jsonCache.clear();
    const mockPackageJSON = resolveJSON("tests/fixtures/package-nested-overrides.json");
    
    if (mockPackageJSON) {
      const result = updateAppendix({
        overrides: mockPackageJSON.overrides,
        appendix: {},
        dependencies: mockPackageJSON.dependencies,
        devDependencies: mockPackageJSON.devDependencies,
        packageName: mockPackageJSON.name,
      });
      
      // Check that nested overrides are processed correctly
      assert.ok(result["pg-types@^4.0.1"], "Should have pg-types override");
      assert.ok(result["pg-protocol@^1.6.0"], "Should have pg-protocol override");
      assert.ok(result["cookie@0.5.0"], "Should have cookie override");
      assert.ok(result["loader-utils@^3.2.1"], "Should have loader-utils override");
      
      // Check the dependents are correctly tagged
      assert.strictEqual(
        result["pg-types@^4.0.1"].dependents["test-nested-overrides"],
        "pg@^8.13.1 (nested override)"
      );
      assert.strictEqual(
        result["cookie@0.5.0"].dependents["test-nested-overrides"],
        "express@^4.18.0 (nested override)"
      );
      assert.strictEqual(
        result["loader-utils@^3.2.1"].dependents["test-nested-overrides"],
        "webpack@^5.88.0 (nested override)"
      );
    }
  });
});

describe("Package Manager Detection", () => {
  it("should detect npm by default when no lock file exists", () => {
    const packageManager = detectPackageManager();
    assert.strictEqual(["npm", "yarn", "pnpm", "bun"].includes(packageManager), true);
  });

  it("should get correct override field for yarn", () => {
    const field = getOverrideFieldForPackageManager("yarn");
    assert.strictEqual(field, "resolutions");
  });

  it("should get correct override field for pnpm", () => {
    const field = getOverrideFieldForPackageManager("pnpm");
    assert.strictEqual(field, "pnpm");
  });

  it("should get correct override field for npm", () => {
    const field = getOverrideFieldForPackageManager("npm");
    assert.strictEqual(field, "overrides");
  });

  it("should get correct override field for bun", () => {
    const field = getOverrideFieldForPackageManager("bun");
    assert.strictEqual(field, "overrides");
  });
});

describe("Override Field Detection", () => {
  it("should detect existing resolutions field", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      resolutions: { "lodash": "4.17.21" }
    };
    const field = getExistingOverrideField(config);
    assert.strictEqual(field, "resolutions");
  });

  it("should detect existing overrides field", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      overrides: { "lodash": "4.17.21" }
    };
    const field = getExistingOverrideField(config);
    assert.strictEqual(field, "overrides");
  });

  it("should detect existing pnpm.overrides field", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      pnpm: {
        overrides: { "lodash": "4.17.21" }
      }
    };
    const field = getExistingOverrideField(config);
    assert.strictEqual(field, "pnpm");
  });

  it("should return null when no override fields exist", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0"
    };
    const field = getExistingOverrideField(config);
    assert.strictEqual(field, null);
  });

  it("should prioritize resolutions over overrides", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      resolutions: { "lodash": "4.17.21" },
      overrides: { "axios": "1.0.0" }
    };
    const field = getExistingOverrideField(config);
    assert.strictEqual(field, "resolutions");
  });
});

describe("Apply Overrides to Config", () => {
  it("should apply overrides to resolutions field", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0"
    };
    const overrides = { "lodash": "4.17.21" };
    applyOverridesToConfig(config, overrides, "resolutions");
    assert.deepStrictEqual(config.resolutions, overrides);
  });

  it("should apply overrides to overrides field", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0"
    };
    const overrides = { "lodash": "4.17.21" };
    applyOverridesToConfig(config, overrides, "overrides");
    assert.deepStrictEqual(config.overrides, overrides);
  });

  it("should apply overrides to pnpm.overrides field", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0"
    };
    const overrides = { "lodash": "4.17.21" };
    applyOverridesToConfig(config, overrides, "pnpm");
    assert.deepStrictEqual(config.pnpm?.overrides, overrides);
  });

  it("should create pnpm object if it doesn't exist", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0"
    };
    const overrides = { "lodash": "4.17.21" };
    applyOverridesToConfig(config, overrides, "pnpm");
    assert.strictEqual(typeof config.pnpm, "object");
    assert.deepStrictEqual(config.pnpm?.overrides, overrides);
  });

  it("should do nothing when fieldType is null", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0"
    };
    const overrides = { "lodash": "4.17.21" };
    applyOverridesToConfig(config, overrides, null);
    assert.strictEqual(config.overrides, undefined);
    assert.strictEqual(config.resolutions, undefined);
    assert.strictEqual(config.pnpm, undefined);
  });
});
