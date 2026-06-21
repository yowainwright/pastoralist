import { test, expect, beforeEach, afterEach, mock } from "bun:test";
import { resolve } from "path";
import type { PastoralistJSON, OverridesType } from "../../../src/types";
import {
  jsonCache,
  getCacheStats,
  forceClearCache,
  detectPackageManager,
  getExistingOverrideField,
  getOverrideFieldForPackageManager,
  applyOverridesToConfig,
  resolveJSON,
  updatePackageJSON,
  findPackageJsonFiles,
  clearDependencyTreeCache,
} from "../../../src";
import {
  getDependencyTree,
  parseNpmLsOutput,
  parseBunLockTree,
  parsePnpmLockTree,
  parseYarnLockTree,
  parseNpmLockTree,
  executeNpmLs,
  getFullDependencyCount,
  parseBunLockGraph,
  parsePnpmLockGraph,
  parseYarnLockGraph,
  parseNpmLockGraph,
  getDependencyGraph,
  clearDependencyGraphCache,
} from "../../../src/core/packageJSON";
import { clearHintCache } from "../../../src/dx/hint";
import { HINT_RC_FILE_TEXT } from "../../../src/constants";
import {
  safeWriteFileSync as writeFileSync,
  safeMkdirSync as mkdirSync,
  safeRmSync as rmSync,
  safeUnlinkSync as unlinkSync,
  safeExistsSync as existsSync,
  safeReadFileSync,
  validateRootPackageJsonIntegrity,
} from "../setup";

mock.module("node:child_process", () => ({
  ...require("node:child_process"),
  promisify: (fn: any) => {
    if (fn.name === "execFile") {
      return async (cmd: string, args: string[], options: any) => {
        throw new Error(`Unexpected execFile call in tests: ${cmd} ${args.join(" ")}`);
      };
    }
    return require("util").promisify(fn);
  },
}));

const testDir = resolve(__dirname, "..", ".test-packagejson-core");
const testPkgPath = resolve(testDir, "package.json");

beforeEach(() => {
  clearDependencyTreeCache();
});

afterEach(() => {
  clearDependencyTreeCache();
});

test("getCacheStats - should return cache size and keys", () => {
  jsonCache.clear();
  const stats = getCacheStats();
  expect(stats.size).toBe(0);
  expect(stats.keys).toEqual([]);
  jsonCache.clear();
});

test("getCacheStats - should show cached entries", () => {
  jsonCache.clear();
  const mockJson: PastoralistJSON = { name: "test", version: "1.0.0" };
  jsonCache.set("/test/path", mockJson);

  const stats = getCacheStats();
  expect(stats.size).toBe(1);
  expect(stats.keys).toEqual(["/test/path"]);
  jsonCache.clear();
});

test("forceClearCache - should clear cache and return count", () => {
  jsonCache.clear();
  jsonCache.set("/test/path1", { name: "test1", version: "1.0.0" });
  jsonCache.set("/test/path2", { name: "test2", version: "1.0.0" });

  const count = forceClearCache();
  expect(count).toBe(2);
  expect(jsonCache.size).toBe(0);
  jsonCache.clear();
});

test("forceClearCache - should return 0 when cache is empty", () => {
  jsonCache.clear();
  const count = forceClearCache();
  expect(count).toBe(0);
  jsonCache.clear();
});

test("detectPackageManager - should detect bun when bun.lockb exists", () => {
  const lockPath = resolve(process.cwd(), "bun.lockb");
  const hadLock = existsSync(lockPath);

  if (!hadLock) {
    writeFileSync(lockPath, "");
  }

  const pm = detectPackageManager();
  expect(pm).toBe("bun");

  if (!hadLock && existsSync(lockPath)) {
    unlinkSync(lockPath);
  }
});

test("detectPackageManager - should detect npm as fallback", () => {
  const locks = ["bun.lockb", "bun.lock", "yarn.lock", "pnpm-lock.yaml"];
  const existing = locks.filter((f) => existsSync(resolve(process.cwd(), f)));

  const pm = detectPackageManager();

  if (existing.length === 0) {
    expect(pm).toBe("npm");
  }
});

test("detectPackageManager - should detect package manager from provided root", () => {
  const customRoot = resolve(testDir, "pm-detect-root");
  const yarnLockPath = resolve(customRoot, "yarn.lock");

  mkdirSync(customRoot, { recursive: true });
  writeFileSync(yarnLockPath, "");

  const pm = detectPackageManager(customRoot);

  expect(pm).toBe("yarn");

  rmSync(customRoot, { recursive: true, force: true });
});

test("getExistingOverrideField - should return resolutions when present", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { lodash: "4.17.21" },
  };

  const field = getExistingOverrideField(config);
  expect(field).toBe("resolutions");
});

test("getExistingOverrideField - should return overrides when present", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
  };

  const field = getExistingOverrideField(config);
  expect(field).toBe("overrides");
});

test("getExistingOverrideField - should return pnpm when pnpm overrides present", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: { overrides: { lodash: "4.17.21" } },
  };

  const field = getExistingOverrideField(config);
  expect(field).toBe("pnpm");
});

test("getExistingOverrideField - should return null when no overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const field = getExistingOverrideField(config);
  expect(field).toBeNull();
});

test("getExistingOverrideField - should prioritize resolutions over overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { lodash: "4.17.21" },
    overrides: { axios: "1.0.0" },
  };

  const field = getExistingOverrideField(config);
  expect(field).toBe("resolutions");
});

test("getOverrideFieldForPackageManager - should return resolutions for yarn", () => {
  const field = getOverrideFieldForPackageManager("yarn");
  expect(field).toBe("resolutions");
});

test("getOverrideFieldForPackageManager - should return pnpm for pnpm", () => {
  const field = getOverrideFieldForPackageManager("pnpm");
  expect(field).toBe("pnpm");
});

test("getOverrideFieldForPackageManager - should return overrides for npm", () => {
  const field = getOverrideFieldForPackageManager("npm");
  expect(field).toBe("overrides");
});

test("getOverrideFieldForPackageManager - should return overrides for bun", () => {
  const field = getOverrideFieldForPackageManager("bun");
  expect(field).toBe("overrides");
});

test("applyOverridesToConfig - should apply resolutions", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, "resolutions");

  expect(result.resolutions).toEqual({ lodash: "4.17.21" });
});

test("applyOverridesToConfig - should apply npm overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, "overrides");

  expect(result.overrides).toEqual({ lodash: "4.17.21" });
});

test("applyOverridesToConfig - should apply pnpm overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, "pnpm");

  expect(result.pnpm?.overrides).toEqual({ lodash: "4.17.21" });
});

test("applyOverridesToConfig - should preserve existing pnpm config when adding overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: { shamefullyHoist: true },
  };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, "pnpm");

  expect(result.pnpm).toEqual({
    shamefullyHoist: true,
    overrides: { lodash: "4.17.21" },
  });
});

test("applyOverridesToConfig - should return config unchanged when fieldType is null", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, null);

  expect(result).toEqual(config);
});

test("resolveJSON - should parse and cache valid JSON", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
  jsonCache.clear();

  const mockPkg: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  writeFileSync(testPkgPath, JSON.stringify(mockPkg, null, 2));

  const result = resolveJSON(testPkgPath);

  expect(result).toEqual(mockPkg);
  expect(jsonCache.size).toBe(1);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("resolveJSON - should return cached result on second call", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
  jsonCache.clear();

  const mockPkg: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  writeFileSync(testPkgPath, JSON.stringify(mockPkg, null, 2));

  const first = resolveJSON(testPkgPath);
  const second = resolveJSON(testPkgPath);

  expect(first).toBe(second);
  expect(jsonCache.size).toBe(1);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("resolveJSON - should return undefined for invalid JSON", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
  jsonCache.clear();

  writeFileSync(testPkgPath, "{ invalid json");

  const result = resolveJSON(testPkgPath);

  expect(result).toBeUndefined();

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("resolveJSON - should return undefined for non-existent file", () => {
  const result = resolveJSON("/non/existent/package.json");
  expect(result).toBeUndefined();
});

test("updatePackageJSON - should add appendix and overrides to package.json", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: {},
  };

  const appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.20" },
    },
  };

  const overrides: OverridesType = { lodash: "4.17.21" };

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    appendix,
    overrides,
    isTesting: true,
  });

  expect(result?.pastoralist?.appendix).toEqual(appendix);
  expect(result?.overrides).toEqual(overrides);
});

test("updatePackageJSON - should remove overrides when none provided", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.20" },
        },
      },
    },
  };

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    isTesting: true,
  });

  expect(result?.overrides).toBeUndefined();
  expect(result?.pastoralist).toBeUndefined();
});

test("updatePackageJSON - should preserve other pastoralist config when removing appendix", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      depPaths: "workspace",
      security: { enabled: true },
      appendix: {
        "lodash@4.17.21": {
          dependents: { root: "lodash@^4.17.20" },
        },
      },
    },
  };

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    isTesting: true,
  });

  expect(result?.pastoralist?.depPaths).toBe("workspace");
  expect(result?.pastoralist?.security).toEqual({ enabled: true });
  expect(result?.pastoralist?.appendix).toBeUndefined();
});

test("updatePackageJSON - skips write when content is unchanged", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
  jsonCache.clear();

  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
  };

  writeFileSync(testPkgPath, "SENTINEL");

  updatePackageJSON({
    path: testPkgPath,
    config,
    overrides: { lodash: "4.17.21" },
    isTesting: false,
  });

  const content = safeReadFileSync(testPkgPath, "utf8");
  expect(content).toBe("SENTINEL");

  rmSync(testDir, { recursive: true, force: true });
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - writes file when content changes", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
  jsonCache.clear();

  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
  };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2) + "\n");
  writeFileSync(testPkgPath, "SENTINEL");

  updatePackageJSON({
    path: testPkgPath,
    config,
    overrides: { lodash: "4.17.21" },
    isTesting: false,
  });

  const content = safeReadFileSync(testPkgPath, "utf8");
  expect(content).not.toBe("SENTINEL");

  rmSync(testDir, { recursive: true, force: true });
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - should write file when not in testing mode", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
  jsonCache.clear();

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const overrides: OverridesType = { lodash: "4.17.21" };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  updatePackageJSON({
    path: testPkgPath,
    config,
    overrides,
    isTesting: false,
  });

  expect(existsSync(testPkgPath)).toBe(true);

  const written = resolveJSON(testPkgPath);
  const hasOverrides = Boolean(
    written?.overrides || written?.resolutions || written?.pnpm?.overrides,
  );
  expect(hasOverrides).toBe(true);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - should not write file in dry run mode", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
  jsonCache.clear();

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const overrides: OverridesType = { lodash: "4.17.21" };

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    overrides,
    isTesting: false,
    dryRun: true,
  });

  expect(existsSync(testPkgPath)).toBe(false);
  const hasOverrides = Boolean(result?.overrides || result?.resolutions || result?.pnpm?.overrides);
  expect(hasOverrides).toBe(true);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - should clear cache after writing", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
  jsonCache.clear();

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  resolveJSON(testPkgPath);
  expect(jsonCache.size).toBe(1);

  const overrides: OverridesType = { lodash: "4.17.21" };

  updatePackageJSON({
    path: testPkgPath,
    config,
    overrides,
    isTesting: false,
  });

  expect(jsonCache.has(resolve(testPkgPath))).toBe(false);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("findPackageJsonFiles - should throw when no depPaths provided", () => {
  expect(() => findPackageJsonFiles([])).toThrow("No depPaths provided");
});

test("findPackageJsonFiles - should throw when no files found", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  expect(() => findPackageJsonFiles(["nonexistent/**/*.json"], [], testDir)).toThrow(
    "No package.json files found",
  );

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("getDependencyTree - should return dependency tree", async () => {
  clearDependencyTreeCache();
  const mockOutput = JSON.stringify({
    dependencies: {
      lodash: { version: "4.17.21" },
      express: { version: "4.18.0" },
    },
  });

  const mockExecuteNpmLs = async () => mockOutput;
  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  expect(typeof tree).toBe("object");
  expect(tree["lodash"]).toBe("4.17.21");
  expect(tree["express"]).toBe("4.18.0");
  clearDependencyTreeCache();
});

test("getDependencyTree - passes root parameter to executeNpmLs mock", async () => {
  clearDependencyTreeCache();
  let capturedRoot: string | undefined;
  const mockOutput = JSON.stringify({ dependencies: { lodash: {} } });
  const mockExecuteNpmLs = async (root?: string) => {
    capturedRoot = root;
    return mockOutput;
  };

  const customRoot = resolve(testDir, "custom-root");
  await getDependencyTree(mockExecuteNpmLs, undefined, customRoot);

  expect(capturedRoot).toBe(customRoot);
  clearDependencyTreeCache();
});

test("updatePackageJSON - should handle existing override field", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { axios: "1.0.0" },
  };

  const overrides: OverridesType = { lodash: "4.17.21" };

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    overrides,
    isTesting: true,
  });

  expect(result?.resolutions).toEqual({ lodash: "4.17.21" });
});

test("applyOverridesToConfig - should use existing override field", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { axios: "1.0.0" },
  };

  const overrides = { lodash: "4.17.21" };
  const existingField = getExistingOverrideField(config);

  const result = applyOverridesToConfig(config, overrides, existingField);

  expect(result.resolutions).toEqual({ lodash: "4.17.21" });
});

test("updatePackageJSON - should preserve pnpm config when removing overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: {
      overrides: { lodash: "4.17.21" },
      shamefullyHoist: true,
    },
  };

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    isTesting: true,
  });

  expect(result?.pnpm?.overrides).toBeUndefined();
  expect(result?.pnpm?.shamefullyHoist).toBe(true);
});

test("updatePackageJSON - should remove empty pnpm when only had overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: {
      overrides: { lodash: "4.17.21" },
    },
  };

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    isTesting: true,
  });

  expect(result?.pnpm).toBeUndefined();
});

test("updatePackageJSON - should write to non-root package.json", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const config: PastoralistJSON = {
    name: "workspace-pkg",
    version: "1.0.0",
  };

  const overrides: OverridesType = { lodash: "4.17.21" };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  updatePackageJSON({
    path: testPkgPath,
    config,
    overrides,
    isTesting: false,
  });

  expect(existsSync(testPkgPath)).toBe(true);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});
test("updatePackageJSON - should not show RC file suggestion for small config", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const config: PastoralistJSON = {
    name: "test-pkg",
    version: "1.0.0",
  };

  const smallAppendix = {
    "lodash@4.17.21": {
      dependents: { app: "lodash@^4.17.0" },
    },
  };

  const overrides: OverridesType = { lodash: "4.17.21" };

  const originalConsoleLog = console.log;
  const logCalls: string[] = [];
  console.log = (...args: any[]) => {
    logCalls.push(args.join(" "));
  };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  updatePackageJSON({
    path: testPkgPath,
    config,
    appendix: smallAppendix,
    overrides,
    isTesting: false,
  });

  console.log = originalConsoleLog;

  const hasRcSuggestion = logCalls.some((log) =>
    log.includes("pastoralist init --useRcConfigFile"),
  );
  expect(hasRcSuggestion).toBe(false);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - should show RC file suggestion for large config", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const config: PastoralistJSON = {
    name: "test-pkg",
    version: "1.0.0",
  };

  const largeAppendix: Record<string, any> = {};
  for (let i = 0; i < 15; i++) {
    largeAppendix[`package${i}@1.0.0`] = {
      dependents: { app: `package${i}@^1.0.0` },
    };
  }

  const overrides: OverridesType = { lodash: "4.17.21" };

  clearHintCache();

  const originalWrite = process.stdout.write.bind(process.stdout);
  const writeCalls: string[] = [];
  process.stdout.write = (chunk: any): boolean => {
    writeCalls.push(String(chunk));
    return true;
  };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  updatePackageJSON({
    path: testPkgPath,
    config,
    appendix: largeAppendix,
    overrides,
    isTesting: false,
  });

  process.stdout.write = originalWrite;

  const output = writeCalls.join("");
  const hintWords = HINT_RC_FILE_TEXT.split(" ");
  const hasHintContent = hintWords.every((word) => output.includes(word));
  expect(hasHintContent).toBe(true);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - should not show RC file suggestion in test mode", () => {
  const config: PastoralistJSON = {
    name: "test-pkg",
    version: "1.0.0",
  };

  const largeAppendix: Record<string, any> = {};
  for (let i = 0; i < 15; i++) {
    largeAppendix[`package${i}@1.0.0`] = {
      dependents: { app: `package${i}@^1.0.0` },
    };
  }

  const overrides: OverridesType = { lodash: "4.17.21" };

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    appendix: largeAppendix,
    overrides,
    isTesting: true,
  });

  expect(result).toBeDefined();
  expect(result?.pastoralist).toBeDefined();
});

test("updatePackageJSON - silent option suppresses dry-run output", () => {
  const config: PastoralistJSON = {
    name: "test-silent",
    version: "1.0.0",
  };

  const consoleOutput: string[] = [];
  const originalLog = console.log;
  console.log = (msg: string) => consoleOutput.push(msg);

  updatePackageJSON({
    path: testPkgPath,
    config,
    appendix: { "lodash@4.17.21": { dependents: {} } },
    overrides: { lodash: "4.17.21" },
    dryRun: true,
    silent: true,
  });

  console.log = originalLog;

  const hasDryRunMessage = consoleOutput.some((msg) => msg.includes("[DRY RUN]"));
  expect(hasDryRunMessage).toBe(false);
});

test("updatePackageJSON - dry-run without silent shows output", () => {
  const config: PastoralistJSON = {
    name: "test-not-silent",
    version: "1.0.0",
  };

  const consoleOutput: string[] = [];
  const originalLog = console.log;
  console.log = (msg: string) => consoleOutput.push(msg);

  updatePackageJSON({
    path: testPkgPath,
    config,
    appendix: { "lodash@4.17.21": { dependents: {} } },
    overrides: { lodash: "4.17.21" },
    dryRun: true,
    silent: false,
  });

  console.log = originalLog;

  const hasDryRunMessage = consoleOutput.some((msg) => msg.includes("[DRY RUN]"));
  expect(hasDryRunMessage).toBe(true);
});

test("updatePackageJSON - dry-run with unchanged content logs no-op message", () => {
  const config: PastoralistJSON = {
    name: "test-dryrun-unchanged",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
  };

  const consoleOutput: string[] = [];
  const originalLog = console.log;
  console.log = (msg: string) => consoleOutput.push(msg);

  updatePackageJSON({
    path: testPkgPath,
    config,
    overrides: { lodash: "4.17.21" },
    dryRun: true,
    silent: false,
  });

  console.log = originalLog;

  const hasNoChangesMessage = consoleOutput.some((msg) => msg.includes("No changes detected"));
  expect(hasNoChangesMessage).toBe(true);
});

test("updatePackageJSON - silent has no effect when not in dry-run mode", () => {
  mkdirSync(testDir, { recursive: true });

  const config: PastoralistJSON = {
    name: "test-silent-no-dryrun",
    version: "1.0.0",
  };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    appendix: { "lodash@4.17.21": { dependents: {} } },
    overrides: { lodash: "4.17.21" },
    dryRun: false,
    silent: true,
  });

  expect(result).toBeUndefined();

  const written = JSON.parse(safeReadFileSync(testPkgPath, "utf8"));
  expect(written.overrides).toEqual({ lodash: "4.17.21" });

  rmSync(testDir, { recursive: true, force: true });
});

test("parseNpmLsOutput - should parse flat dependencies", () => {
  const stdout = JSON.stringify({
    dependencies: {
      lodash: { version: "4.17.21" },
      express: { version: "4.18.0" },
    },
  });

  const result = parseNpmLsOutput(stdout);

  expect(result.lodash).toBe("4.17.21");
  expect(result.express).toBe("4.18.0");
});

test("parseNpmLsOutput - should parse nested dependencies", () => {
  const stdout = JSON.stringify({
    dependencies: {
      express: {
        version: "4.18.0",
        dependencies: {
          accepts: { version: "1.3.8" },
          "body-parser": {
            version: "1.20.0",
            dependencies: {
              bytes: { version: "3.1.2" },
            },
          },
        },
      },
    },
  });

  const result = parseNpmLsOutput(stdout);

  expect(result.express).toBe("4.18.0");
  expect(result.accepts).toBe("1.3.8");
  expect(result["body-parser"]).toBe("1.20.0");
  expect(result.bytes).toBe("3.1.2");
});

test("parseNpmLsOutput - should handle empty dependencies", () => {
  const stdout = JSON.stringify({
    dependencies: {},
  });

  const result = parseNpmLsOutput(stdout);

  expect(Object.keys(result).length).toBe(0);
});

test("parseNpmLsOutput - should handle missing dependencies field", () => {
  const stdout = JSON.stringify({
    name: "test-package",
    version: "1.0.0",
  });

  const result = parseNpmLsOutput(stdout);

  expect(Object.keys(result).length).toBe(0);
});

test("parseNpmLsOutput - should handle invalid nested deps", () => {
  const stdout = JSON.stringify({
    dependencies: {
      lodash: "not-an-object",
      express: { version: "4.18.0" },
    },
  });

  const result = parseNpmLsOutput(stdout);

  expect(result.lodash).toBe("unknown");
  expect(result.express).toBe("4.18.0");
});

test("getDependencyTree - uses custom cacheDir when provided", async () => {
  clearDependencyTreeCache();
  const customCacheDir = resolve(testDir, "custom-cache");
  mkdirSync(customCacheDir, { recursive: true });
  const mockOutput = JSON.stringify({ dependencies: { lodash: {} } });
  const mockExecuteNpmLs = async () => mockOutput;

  const tree = await getDependencyTree(mockExecuteNpmLs, customCacheDir, testDir);

  expect(tree["lodash"]).toBe("unknown");
  clearDependencyTreeCache();
  rmSync(customCacheDir, { recursive: true, force: true });
});

test("getDependencyTree - should cache results on second call", async () => {
  clearDependencyTreeCache();
  const mockOutput = JSON.stringify({
    dependencies: {
      lodash: { version: "4.17.21" },
      express: { version: "4.18.0" },
    },
  });

  let callCount = 0;
  const mockExecuteNpmLs = async () => {
    callCount++;
    return mockOutput;
  };

  const firstCall = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);
  const failMock = async () => {
    throw new Error("should not be called");
  };
  const secondCall = await getDependencyTree(failMock, undefined, testDir);

  expect(firstCall).toEqual(secondCall);
  expect(callCount).toBe(1);
  clearDependencyTreeCache();
});

test("getDependencyTree - caches lockfile-less roots independently", async () => {
  clearDependencyTreeCache();
  const cacheDir = resolve(testDir, "multi-root-cache");
  const rootA = resolve(testDir, "root-a");
  const rootB = resolve(testDir, "root-b");
  mkdirSync(rootA, { recursive: true });
  mkdirSync(rootB, { recursive: true });

  const mockExecuteNpmLs = async (root?: string) => {
    const dependencyName = root === rootA ? "left-pad" : "right-pad";
    return JSON.stringify({ dependencies: { [dependencyName]: { version: "1.0.0" } } });
  };

  const treeA = await getDependencyTree(mockExecuteNpmLs, cacheDir, rootA);
  const treeB = await getDependencyTree(mockExecuteNpmLs, cacheDir, rootB);

  expect(treeA["left-pad"]).toBe("1.0.0");
  expect(treeA["right-pad"]).toBeUndefined();
  expect(treeB["right-pad"]).toBe("1.0.0");
  expect(treeB["left-pad"]).toBeUndefined();

  clearDependencyTreeCache();
  rmSync(testDir, { recursive: true, force: true });
});

test("getDependencyTree - coalesces concurrent requests", async () => {
  clearDependencyTreeCache();
  const mockOutput = JSON.stringify({
    dependencies: {
      lodash: { version: "4.17.21" },
    },
  });

  let callCount = 0;
  const mockExecuteNpmLs = async () => {
    callCount++;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
    return mockOutput;
  };

  const [first, second, third] = await Promise.all([
    getDependencyTree(mockExecuteNpmLs, undefined, testDir),
    getDependencyTree(mockExecuteNpmLs, undefined, testDir),
    getDependencyTree(mockExecuteNpmLs, undefined, testDir),
  ]);

  expect(first).toEqual(second);
  expect(second).toEqual(third);
  expect(callCount).toBe(1);
  clearDependencyTreeCache();
});

test("getDependencyTree - should return empty object on error", async () => {
  clearDependencyTreeCache();

  const mockExecuteNpmLs = async () => {
    throw new Error("npm command failed");
  };
  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  expect(typeof tree).toBe("object");
  expect(Object.keys(tree)).toEqual([]);
  clearDependencyTreeCache();
});

test("parseNpmLsOutput - should handle null dependencies value", () => {
  const stdout = JSON.stringify({
    dependencies: {
      lodash: { version: "4.17.21", dependencies: null },
    },
  });

  const result = parseNpmLsOutput(stdout);
  expect(result.lodash).toBe("4.17.21");
});

test("updatePackageJSON - should not write root package.json without name", () => {
  validateRootPackageJsonIntegrity();
  const rootPath = resolve(process.cwd(), "package.json");

  const config: PastoralistJSON = {
    version: "1.0.0",
  } as PastoralistJSON;

  const overrides: OverridesType = { lodash: "4.17.21" };

  const result = updatePackageJSON({
    path: rootPath,
    config,
    overrides,
    isTesting: false,
    dryRun: false,
  });

  expect(result).toBeUndefined();
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - handles malformed JSON content gracefully", () => {
  validateRootPackageJsonIntegrity();
  const rootPath = resolve(process.cwd(), "package.json");

  const config = { name: "test" } as PastoralistJSON;

  updatePackageJSON({
    path: rootPath,
    config,
    overrides: { lodash: "4.17.21" },
    isTesting: false,
    dryRun: true,
  });

  validateRootPackageJsonIntegrity();
});

test("executeNpmLs - is exported and callable", () => {
  expect(typeof executeNpmLs).toBe("function");
});

test("getDependencyTree - handles executeNpmLs errors gracefully", async () => {
  clearDependencyTreeCache();

  const mockExecuteNpmLs = async () => {
    throw new Error("Command execution failed");
  };
  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  expect(typeof tree).toBe("object");
  expect(Object.keys(tree)).toEqual([]);
  clearDependencyTreeCache();
});

const lockTestDir = resolve(__dirname, "..", ".test-lock-files");

const bunLockContent = (packages: Record<string, unknown>) =>
  JSON.stringify({ lockfileVersion: 1, packages });

const bunLockContentWithTrailingCommas = `
{
  "lockfileVersion": 1,
  "packages": {
    "react": ["react@18.0.0", "", {}, "sha512-z"],
    "typescript": ["typescript@5.0.0", "", {}, "sha512-w"],
  },
}
`;

test("parseBunLockTree - returns package map from bun.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    bunLockContent({
      lodash: ["lodash@4.17.21", "", {}, "sha512-x"],
      express: ["express@4.18.0", "", {}, "sha512-y"],
    }),
  );

  const tree = parseBunLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  expect(tree?.["express"]).toBe("4.18.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - uses unknown when a package entry has no version separator", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    bunLockContent({
      lodash: ["lodash", "", {}, "sha512-x"],
      malformed: "not an entry array",
    }),
  );

  const tree = parseBunLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("unknown");
  expect(tree?.["malformed"]).toBe("unknown");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - parses Bun text lockfiles with trailing commas", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), bunLockContentWithTrailingCommas);

  const tree = parseBunLockTree(lockTestDir);

  expect(tree?.["react"]).toBe("18.0.0");
  expect(tree?.["typescript"]).toBe("5.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - returns undefined when no bun.lock present", () => {
  expect(parseBunLockTree(testDir)).toBeUndefined();
});

test("parseBunLockTree - returns undefined for malformed bun.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), "not valid json {{{");

  expect(parseBunLockTree(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - returns undefined when bun.lock has no packages field", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), JSON.stringify({ lockfileVersion: 1 }));

  expect(parseBunLockTree(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - returns undefined when bun.lock packages is empty", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), bunLockContent({}));

  expect(parseBunLockTree(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getDependencyTree - uses bun.lock over executeNpmLs when available", async () => {
  clearDependencyTreeCache();
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), bunLockContentWithTrailingCommas);
  const shouldNotBeCalled = mock(async () => {
    throw new Error("executeNpmLs should not be called");
  });

  const tree = await getDependencyTree(shouldNotBeCalled, undefined, lockTestDir);

  expect(tree["react"]).toBe("18.0.0");
  expect(tree["typescript"]).toBe("5.0.0");
  expect(shouldNotBeCalled).not.toHaveBeenCalled();
  rmSync(lockTestDir, { recursive: true, force: true });
  clearDependencyTreeCache();
});

test("getDependencyTree - falls back to executeNpmLs when no bun.lock", async () => {
  clearDependencyTreeCache();
  const mockOutput = JSON.stringify({ dependencies: { lodash: {} } });
  const mockExecuteNpmLs = async () => mockOutput;

  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  expect(tree["lodash"]).toBe("unknown");
  clearDependencyTreeCache();
});

test("parsePnpmLockTree - parses v5 format (slash-separated)", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  /lodash/4.17.21:\n    resolution: {}\n  /@types/node/18.0.0:\n    resolution: {}\n",
  );

  const tree = parsePnpmLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  expect(tree?.["@types/node"]).toBe("18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockTree - parses v6 format (at-separated)", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  /lodash@4.17.21:\n    resolution: {}\n  /@types/node@18.0.0:\n    resolution: {}\n",
  );

  const tree = parsePnpmLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  expect(tree?.["@types/node"]).toBe("18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockTree - parses v9 format (no leading slash)", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  lodash@4.17.21: {}\n  '@types/node@18.0.0': {}\n",
  );

  const tree = parsePnpmLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  expect(tree?.["@types/node"]).toBe("18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockTree - returns undefined when no pnpm-lock.yaml", () => {
  expect(parsePnpmLockTree(testDir)).toBeUndefined();
});

test("parsePnpmLockTree - returns undefined for empty packages section", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");

  expect(parsePnpmLockTree(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockTree - returns undefined when lockfile cannot be read", () => {
  mkdirSync(resolve(lockTestDir, "pnpm-lock.yaml"), { recursive: true });

  expect(parsePnpmLockTree(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockTree - parses yarn v1 format", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "yarn.lock"),
    '# yarn lockfile v1\n\nlodash@^4.17.21:\n  version "4.17.21"\n\n"@types/node@^18.0.0":\n  version "18.0.0"\n',
  );

  const tree = parseYarnLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  expect(tree?.["@types/node"]).toBe("18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockTree - parses yarn berry format", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "yarn.lock"),
    '__metadata:\n  version: 8\n\n"lodash@npm:^4.17.21":\n  version: 4.17.21\n\n"@types/node@npm:^18.0.0":\n  version: 18.0.0\n',
  );

  const tree = parseYarnLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  expect(tree?.["@types/node"]).toBe("18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockTree - handles multiple specifiers on one line", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "yarn.lock"),
    '"lodash@^4.17.21, lodash@^4.17.20":\n  version "4.17.21"\n',
  );

  const tree = parseYarnLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockTree - returns undefined when no yarn.lock", () => {
  expect(parseYarnLockTree(testDir)).toBeUndefined();
});

test("parseYarnLockTree - returns undefined when lockfile cannot be read", () => {
  mkdirSync(resolve(lockTestDir, "yarn.lock"), { recursive: true });

  expect(parseYarnLockTree(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockTree - parses v2/v3 packages field", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 2,
      packages: {
        "": {},
        "node_modules/lodash": { version: "4.17.21" },
        "node_modules/@types/node": { version: "18.0.0" },
        "node_modules/parent/node_modules/child": { version: "1.0.0" },
      },
    }),
  );

  const tree = parseNpmLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  expect(tree?.["@types/node"]).toBe("18.0.0");
  expect(tree?.["child"]).toBe("1.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockTree - prefers hoisted package versions over nested duplicates", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 2,
      packages: {
        "": {},
        "node_modules/lodash": { version: "4.17.21" },
        "node_modules/parent/node_modules/lodash": { version: "3.10.1" },
      },
    }),
  );

  const tree = parseNpmLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockTree - parses v1 dependencies field", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 1,
      dependencies: {
        lodash: { version: "4.17.21" },
        express: { version: "4.18.0", dependencies: { qs: { version: "6.11.0" } } },
      },
    }),
  );

  const tree = parseNpmLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  expect(tree?.["express"]).toBe("4.18.0");
  expect(tree?.["qs"]).toBe("6.11.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockTree - prefers direct dependency versions over nested duplicates", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 1,
      dependencies: {
        lodash: { version: "4.17.21" },
        express: { version: "4.18.0", dependencies: { lodash: { version: "3.10.1" } } },
      },
    }),
  );

  const tree = parseNpmLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  expect(tree?.["express"]).toBe("4.18.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockTree - returns undefined when no package-lock.json", () => {
  expect(parseNpmLockTree(testDir)).toBeUndefined();
});

test("parseNpmLockTree - returns undefined when package-lock has no dependency data", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "package-lock.json"), JSON.stringify({ lockfileVersion: 3 }));

  expect(parseNpmLockTree(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockTree - returns undefined for malformed JSON", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "package-lock.json"), "not json {{{");

  expect(parseNpmLockTree(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getFullDependencyCount - counts npm lock file packages", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  const lockContent = {
    packages: {
      "": {},
      "node_modules/lodash": { version: "4.17.21" },
      "node_modules/express": { version: "4.18.0" },
    },
  };

  writeFileSync(resolve(lockTestDir, "package-lock.json"), JSON.stringify(lockContent));

  const count = getFullDependencyCount(lockTestDir);
  expect(count).toBe(2);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - handles invalid npm lock JSON", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  writeFileSync(resolve(lockTestDir, "package-lock.json"), "{ invalid json");

  const count = getFullDependencyCount(lockTestDir);
  expect(count).toBe(0);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - counts yarn lock file packages", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  const yarnLock = `lodash@^4.17.0:
  version "4.17.21"
  resolved "https://registry.yarnpkg.com/lodash/-/lodash-4.17.21.tgz"

express@^4.18.0:
  version "4.18.0"
  resolved "https://registry.yarnpkg.com/express/-/express-4.18.0.tgz"
`;

  writeFileSync(resolve(lockTestDir, "yarn.lock"), yarnLock);

  const count = getFullDependencyCount(lockTestDir);
  expect(count).toBe(2);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - handles empty yarn lock", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  writeFileSync(resolve(lockTestDir, "yarn.lock"), "");

  const count = getFullDependencyCount(lockTestDir);
  expect(count).toBe(0);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - returns 0 when pattern lock file cannot be read", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(resolve(lockTestDir, "yarn.lock"), { recursive: true });

  const count = getFullDependencyCount(lockTestDir);
  expect(count).toBe(0);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - counts pnpm lock file packages", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  const pnpmLock = `lockfileVersion: 5.4

specifiers:
  lodash: ^4.17.0

packages:
  /lodash@4.17.21:
    resolution: {integrity: sha512}
  /express@4.18.0:
    resolution: {integrity: sha512}
`;

  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), pnpmLock);

  const count = getFullDependencyCount(lockTestDir);
  expect(count).toBe(2);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - handles empty pnpm lock", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), "");

  const count = getFullDependencyCount(lockTestDir);
  expect(count).toBe(0);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - returns 0 when no lock files exist", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  const count = getFullDependencyCount(lockTestDir);
  expect(count).toBe(0);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - should not write non-json files", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(testDir, { recursive: true });

  const nonJsonPath = resolve(testDir, "config.txt");
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  updatePackageJSON({
    path: nonJsonPath,
    config,
    overrides: { lodash: "4.17.21" },
    isTesting: false,
  });

  expect(existsSync(nonJsonPath)).toBe(false);

  rmSync(testDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - should not write root package.json with invalid JSON content", () => {
  validateRootPackageJsonIntegrity();
  const rootPath = resolve(process.cwd(), "package.json");
  const originalContent = safeReadFileSync(rootPath, "utf8");

  const invalidConfig = {} as PastoralistJSON;

  updatePackageJSON({
    path: rootPath,
    config: invalidConfig,
    overrides: { lodash: "4.17.21" },
    isTesting: false,
  });

  const currentContent = safeReadFileSync(rootPath, "utf8");
  expect(currentContent).toBe(originalContent);
  validateRootPackageJsonIntegrity();
});

test("detectPackageManager - should detect bun via bun.lock when only bun.lock exists", () => {
  const lockbPath = resolve(process.cwd(), "bun.lockb");
  const lockPath = resolve(process.cwd(), "bun.lock");

  const hadLockb = existsSync(lockbPath);
  const hadLock = existsSync(lockPath);

  if (hadLockb) unlinkSync(lockbPath);
  if (!hadLock) writeFileSync(lockPath, "");

  try {
    const pm = detectPackageManager();
    expect(pm).toBe("bun");
  } finally {
    if (hadLockb) writeFileSync(lockbPath, "");
    if (!hadLock && existsSync(lockPath)) unlinkSync(lockPath);
  }
});

test("parseNpmLsOutput - should return empty object for invalid JSON", () => {
  const result = parseNpmLsOutput("not valid json {{{");
  expect(result).toEqual({});
});

test("parseBunLockGraph - returns inverted dep graph from bun.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    JSON.stringify({
      lockfileVersion: 1,
      packages: {
        express: ["express@4.18.0", "", { dependencies: { "body-parser": "^1.20.0" } }, "sha512-x"],
        "body-parser": ["body-parser@1.20.0", "", {}, "sha512-y"],
      },
    }),
  );

  const graph = parseBunLockGraph(lockTestDir);

  expect(graph?.["body-parser"]).toContain("express");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockGraph - returns undefined when no bun.lock present", () => {
  expect(parseBunLockGraph(testDir)).toBeUndefined();
});

test("parseBunLockGraph - returns undefined when no deps found", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    JSON.stringify({
      lockfileVersion: 1,
      packages: { lodash: ["lodash@4.17.21", "", {}, "sha512-x"] },
    }),
  );

  expect(parseBunLockGraph(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockGraph - skips malformed package entries", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    bunLockContent({
      express: ["express@4.18.0", "", { dependencies: { qs: "^6.11.0" } }, "sha512-y"],
      malformed: "not an entry array",
    }),
  );

  const graph = parseBunLockGraph(lockTestDir);

  expect(graph?.["qs"]).toEqual(["express"]);
  expect(graph?.["malformed"]).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockGraph - returns inverted dep graph from pnpm-lock.yaml", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  /express@4.18.0:\n    resolution: {}\n    dependencies:\n      body-parser: 1.20.0\n  /body-parser@1.20.0:\n    resolution: {}\n",
  );

  const graph = parsePnpmLockGraph(lockTestDir);

  expect(graph?.["body-parser"]).toContain("express");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockGraph - returns undefined when no pnpm-lock.yaml", () => {
  expect(parsePnpmLockGraph(testDir)).toBeUndefined();
});

test("parseYarnLockGraph - returns inverted dep graph from yarn.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "yarn.lock"),
    'express@^4.18.0:\n  version "4.18.0"\n  dependencies:\n    body-parser "^1.20.0"\n\nbody-parser@^1.20.0:\n  version "1.20.0"\n',
  );

  const graph = parseYarnLockGraph(lockTestDir);

  expect(graph?.["body-parser"]).toContain("express");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockGraph - returns undefined when no yarn.lock", () => {
  expect(parseYarnLockGraph(testDir)).toBeUndefined();
});

test("parseNpmLockGraph - returns inverted dep graph from package-lock.json v2", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 2,
      packages: {
        "": {},
        "node_modules/express": { version: "4.18.0", dependencies: { "body-parser": "^1.20.0" } },
        "node_modules/body-parser": { version: "1.20.0" },
      },
    }),
  );

  const graph = parseNpmLockGraph(lockTestDir);

  expect(graph?.["body-parser"]).toContain("express");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockGraph - returns undefined when no package-lock.json", () => {
  expect(parseNpmLockGraph(testDir)).toBeUndefined();
});

test("getDependencyGraph - caches and returns a graph object", () => {
  clearDependencyGraphCache();
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 2,
      packages: {
        "": {},
        "node_modules/lodash": { version: "4.17.21", dependencies: {} },
      },
    }),
  );

  const graph = getDependencyGraph(lockTestDir);

  expect(typeof graph).toBe("object");
  const graphAgain = getDependencyGraph(lockTestDir);
  expect(graphAgain).toBe(graph);

  clearDependencyGraphCache();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getDependencyGraph - invalidates cache when package lock changes", () => {
  clearDependencyGraphCache();
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 2,
      packages: {
        "": {},
        "node_modules/express": { version: "4.18.0", dependencies: { "body-parser": "^1.20.0" } },
        "node_modules/body-parser": { version: "1.20.0" },
      },
    }),
  );

  const originalGraph = getDependencyGraph(lockTestDir);
  expect(originalGraph?.["body-parser"]).toEqual(["express"]);

  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 2,
      packages: {
        "": {},
        "node_modules/lodash": { version: "4.17.21", dependencies: { qs: "^6.11.0" } },
        "node_modules/qs": { version: "6.11.0" },
      },
    }),
  );

  const updatedGraph = getDependencyGraph(lockTestDir);
  expect(updatedGraph).not.toBe(originalGraph);
  expect(updatedGraph?.qs).toEqual(["lodash"]);
  expect(updatedGraph?.["body-parser"]).toBeUndefined();

  clearDependencyGraphCache();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getDependencyGraph - returns empty object when no lock file", () => {
  clearDependencyGraphCache();
  mkdirSync(lockTestDir, { recursive: true });

  const graph = getDependencyGraph(lockTestDir);

  expect(graph).toEqual({});
  clearDependencyGraphCache();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - handles escaped characters in strings", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    '{\n  "lockfileVersion": 1,\n  "packages": {\n    "lodash": ["lodash@4.17.21", "https://r.npmjs.org", {}, "sha512-a\\\\b",],\n  },\n}',
  );

  const tree = parseBunLockTree(lockTestDir);

  expect(tree?.["lodash"]).toBe("4.17.21");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockGraph - returns undefined for malformed bun.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), "not valid json {{{");

  expect(parseBunLockGraph(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockGraph - parses v1 dependencies format", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 1,
      dependencies: {
        express: {
          version: "4.18.0",
          dependencies: { lodash: { version: "4.17.21" } },
        },
      },
    }),
  );

  const graph = parseNpmLockGraph(lockTestDir);

  expect(graph?.["lodash"]).toContain("express");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockGraph - returns undefined for malformed JSON", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "package-lock.json"), "not valid json {{{");

  expect(parseNpmLockGraph(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockGraph - resets inDeps when non-dep line follows dependencies section", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  express@4.18.0:\n    dependencies:\n      lodash: 4.17.21\n    engines: {node: '>=0.10.0'}\n",
  );

  const graph = parsePnpmLockGraph(lockTestDir);

  expect(graph?.["lodash"]).toContain("express");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockGraph - returns undefined when lockfile cannot be read", () => {
  mkdirSync(resolve(lockTestDir, "pnpm-lock.yaml"), { recursive: true });

  expect(parsePnpmLockGraph(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockGraph - returns undefined when lockfile cannot be read", () => {
  mkdirSync(resolve(lockTestDir, "yarn.lock"), { recursive: true });

  expect(parseYarnLockGraph(lockTestDir)).toBeUndefined();
  rmSync(lockTestDir, { recursive: true, force: true });
});
