import { errorIncludes, mock } from "../setup";
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
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
  getLockedPackages,
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
  getDependencyGraphStatus,
  clearDependencyGraphCache,
} from "../../../src/core/package";
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

const testDir = resolve(import.meta.dirname, "..", ".test-packagejson-core");
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
  assert.strictEqual(stats.size, 0);
  assert.deepStrictEqual(stats.keys, []);
  jsonCache.clear();
});

test("getCacheStats - should show cached entries", () => {
  jsonCache.clear();
  const mockJson: PastoralistJSON = { name: "test", version: "1.0.0" };
  jsonCache.set("/test/path", mockJson);

  const stats = getCacheStats();
  assert.strictEqual(stats.size, 1);
  assert.deepStrictEqual(stats.keys, ["/test/path"]);
  jsonCache.clear();
});

test("forceClearCache - should clear cache and return count", () => {
  jsonCache.clear();
  jsonCache.set("/test/path1", { name: "test1", version: "1.0.0" });
  jsonCache.set("/test/path2", { name: "test2", version: "1.0.0" });

  const count = forceClearCache();
  assert.strictEqual(count, 2);
  assert.strictEqual(jsonCache.size, 0);
  jsonCache.clear();
});

test("forceClearCache - should return 0 when cache is empty", () => {
  jsonCache.clear();
  const count = forceClearCache();
  assert.strictEqual(count, 0);
  jsonCache.clear();
});

test("detectPackageManager - should detect bun when bun.lockb exists", () => {
  const lockPath = resolve(process.cwd(), "bun.lockb");
  const hadLock = existsSync(lockPath);

  if (!hadLock) {
    writeFileSync(lockPath, "");
  }

  const pm = detectPackageManager();
  assert.strictEqual(pm, "bun");

  const shouldRemoveLock = !hadLock && existsSync(lockPath);
  if (shouldRemoveLock) {
    unlinkSync(lockPath);
  }
});

test("detectPackageManager - should detect npm as fallback", () => {
  const locks = ["bun.lockb", "bun.lock", "yarn.lock", "pnpm-lock.yaml"];
  const existing = locks.filter((f) => existsSync(resolve(process.cwd(), f)));

  const pm = detectPackageManager();

  if (existing.length === 0) {
    assert.strictEqual(pm, "npm");
  }
});

test("detectPackageManager - should detect package manager from provided root", () => {
  const customRoot = resolve(testDir, "pm-detect-root");
  const yarnLockPath = resolve(customRoot, "yarn.lock");

  mkdirSync(customRoot, { recursive: true });
  writeFileSync(yarnLockPath, "");

  const pm = detectPackageManager(customRoot);

  assert.strictEqual(pm, "yarn");

  rmSync(customRoot, { recursive: true, force: true });
});

test("getExistingOverrideField - should return resolutions when present", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { lodash: "4.17.21" },
  };

  const field = getExistingOverrideField(config);
  assert.strictEqual(field, "resolutions");
});

test("getExistingOverrideField - should return overrides when present", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
  };

  const field = getExistingOverrideField(config);
  assert.strictEqual(field, "overrides");
});

test("getExistingOverrideField - should return pnpm when pnpm overrides present", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: { overrides: { lodash: "4.17.21" } },
  };

  const field = getExistingOverrideField(config);
  assert.strictEqual(field, "pnpm");
});

test("getExistingOverrideField - should return null when no overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const field = getExistingOverrideField(config);
  assert.strictEqual(field, null);
});

test("getExistingOverrideField - should prioritize resolutions over overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { lodash: "4.17.21" },
    overrides: { axios: "1.0.0" },
  };

  const field = getExistingOverrideField(config);
  assert.strictEqual(field, "resolutions");
});

test("getOverrideFieldForPackageManager - should return resolutions for yarn", () => {
  const field = getOverrideFieldForPackageManager("yarn");
  assert.strictEqual(field, "resolutions");
});

test("getOverrideFieldForPackageManager - should return pnpm for pnpm", () => {
  const field = getOverrideFieldForPackageManager("pnpm");
  assert.strictEqual(field, "pnpm");
});

test("getOverrideFieldForPackageManager - should return overrides for npm", () => {
  const field = getOverrideFieldForPackageManager("npm");
  assert.strictEqual(field, "overrides");
});

test("getOverrideFieldForPackageManager - should return overrides for bun", () => {
  const field = getOverrideFieldForPackageManager("bun");
  assert.strictEqual(field, "overrides");
});

test("applyOverridesToConfig - should apply resolutions", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, "resolutions");

  assert.deepStrictEqual(result.resolutions, { lodash: "4.17.21" });
});

test("applyOverridesToConfig - should apply npm overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, "overrides");

  assert.deepStrictEqual(result.overrides, { lodash: "4.17.21" });
});

test("applyOverridesToConfig - should apply pnpm overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, "pnpm");

  assert.deepStrictEqual(result.pnpm?.overrides, { lodash: "4.17.21" });
});

test("applyOverridesToConfig - should preserve existing pnpm config when adding overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: { shamefullyHoist: true },
  };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, "pnpm");

  assert.deepStrictEqual(result.pnpm, {
    shamefullyHoist: true,
    overrides: { lodash: "4.17.21" },
  });
});

test("applyOverridesToConfig - should return config unchanged when fieldType is null", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, null);

  assert.deepStrictEqual(result, config);
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

  assert.deepStrictEqual(result, mockPkg);
  assert.strictEqual(jsonCache.size, 1);

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

  assert.strictEqual(first, second);
  assert.strictEqual(jsonCache.size, 1);

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

  assert.strictEqual(result, undefined);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("resolveJSON - should return undefined for non-existent file", () => {
  const result = resolveJSON("/non/existent/package.json");
  assert.strictEqual(result, undefined);
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

  assert.deepStrictEqual(result?.pastoralist?.appendix, appendix);
  assert.deepStrictEqual(result?.overrides, overrides);
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

  assert.strictEqual(result?.overrides, undefined);
  assert.strictEqual(result?.pastoralist, undefined);
});

test("updatePackageJSON - should preserve other pastoralist config when removing appendix", () => {
  const bestCaseSearch = { beamWidth: 8 };
  const bestCase = { enabled: true, search: bestCaseSearch };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      $schema: "./node_modules/pastoralist/src/schema.json",
      depPaths: "workspace",
      compactAppendix: true,
      checkSecurity: true,
      security: { enabled: true },
      bestCase,
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

  assert.strictEqual(result?.pastoralist?.$schema, "./node_modules/pastoralist/src/schema.json");
  assert.strictEqual(result?.pastoralist?.depPaths, "workspace");
  assert.strictEqual(result?.pastoralist?.compactAppendix, true);
  assert.strictEqual(result?.pastoralist?.checkSecurity, true);
  assert.deepStrictEqual(result?.pastoralist?.security, { enabled: true });
  assert.deepStrictEqual(result?.pastoralist?.bestCase, bestCase);
  assert.strictEqual(result?.pastoralist?.appendix, undefined);
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
  assert.strictEqual(content, "SENTINEL");

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
  assert.notStrictEqual(content, "SENTINEL");

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

  assert.strictEqual(existsSync(testPkgPath), true);

  const written = resolveJSON(testPkgPath);
  const hasOverrides = Boolean(
    written?.overrides || written?.resolutions || written?.pnpm?.overrides,
  );
  assert.strictEqual(hasOverrides, true);

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

  assert.strictEqual(existsSync(testPkgPath), false);
  const hasOverrides = Boolean(result?.overrides || result?.resolutions || result?.pnpm?.overrides);
  assert.strictEqual(hasOverrides, true);

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
  assert.strictEqual(jsonCache.size, 1);

  const overrides: OverridesType = { lodash: "4.17.21" };

  updatePackageJSON({
    path: testPkgPath,
    config,
    overrides,
    isTesting: false,
  });

  assert.strictEqual(jsonCache.has(resolve(testPkgPath)), false);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
});

test("findPackageJsonFiles - should throw when no depPaths provided", () => {
  assert.throws(() => findPackageJsonFiles([]), errorIncludes("No depPaths provided"));
});

test("findPackageJsonFiles - should throw when no files found", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  assert.throws(
    () => findPackageJsonFiles(["nonexistent/**/*.json"], [], testDir),
    errorIncludes("No package.json files found"),
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

  const mockExecuteNpmLs = () => Promise.resolve(mockOutput);
  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  assert.strictEqual(typeof tree, "object");
  assert.strictEqual(tree["lodash"], "4.17.21");
  assert.strictEqual(tree["express"], "4.18.0");
  clearDependencyTreeCache();
});

test("getDependencyTree - passes root parameter to executeNpmLs mock", async () => {
  clearDependencyTreeCache();
  let capturedRoot: string | undefined;
  const mockOutput = JSON.stringify({ dependencies: { lodash: {} } });
  const mockExecuteNpmLs = (root?: string) => {
    capturedRoot = root;
    return Promise.resolve(mockOutput);
  };

  const customRoot = resolve(testDir, "custom-root");
  await getDependencyTree(mockExecuteNpmLs, undefined, customRoot);

  assert.strictEqual(capturedRoot, customRoot);
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

  assert.deepStrictEqual(result?.resolutions, { lodash: "4.17.21" });
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

  assert.deepStrictEqual(result.resolutions, { lodash: "4.17.21" });
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

  assert.strictEqual(result?.pnpm?.overrides, undefined);
  assert.strictEqual(result?.pnpm?.shamefullyHoist, true);
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

  assert.strictEqual(result?.pnpm, undefined);
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

  assert.strictEqual(existsSync(testPkgPath), true);

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
    logCalls[logCalls.length] = args.join(" ");
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
  assert.strictEqual(hasRcSuggestion, false);

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
    writeCalls[writeCalls.length] = String(chunk);
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
  assert.strictEqual(hasHintContent, true);

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

  assert.notStrictEqual(result, undefined);
  assert.notStrictEqual(result?.pastoralist, undefined);
});

test("updatePackageJSON - silent option suppresses dry-run output", () => {
  const config: PastoralistJSON = {
    name: "test-silent",
    version: "1.0.0",
  };

  const consoleOutput: string[] = [];
  const originalLog = console.log;
  console.log = (msg: string) => {
    consoleOutput[consoleOutput.length] = msg;
  };

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
  assert.strictEqual(hasDryRunMessage, false);
});

test("updatePackageJSON - dry-run without silent shows output", () => {
  const config: PastoralistJSON = {
    name: "test-not-silent",
    version: "1.0.0",
  };

  const consoleOutput: string[] = [];
  const originalLog = console.log;
  console.log = (msg: string) => {
    consoleOutput[consoleOutput.length] = msg;
  };

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
  assert.strictEqual(hasDryRunMessage, true);
});

test("updatePackageJSON - dry-run with unchanged content logs no-op message", () => {
  const config: PastoralistJSON = {
    name: "test-dryrun-unchanged",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
  };

  const consoleOutput: string[] = [];
  const originalLog = console.log;
  console.log = (msg: string) => {
    consoleOutput[consoleOutput.length] = msg;
  };

  updatePackageJSON({
    path: testPkgPath,
    config,
    overrides: { lodash: "4.17.21" },
    dryRun: true,
    silent: false,
  });

  console.log = originalLog;

  const hasNoChangesMessage = consoleOutput.some((msg) => msg.includes("No changes detected"));
  assert.strictEqual(hasNoChangesMessage, true);
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

  assert.strictEqual(result, undefined);

  const written = JSON.parse(safeReadFileSync(testPkgPath, "utf8"));
  assert.deepStrictEqual(written.overrides, { lodash: "4.17.21" });

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

  assert.strictEqual(result.lodash, "4.17.21");
  assert.strictEqual(result.express, "4.18.0");
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

  assert.strictEqual(result.express, "4.18.0");
  assert.strictEqual(result.accepts, "1.3.8");
  assert.strictEqual(result["body-parser"], "1.20.0");
  assert.strictEqual(result.bytes, "3.1.2");
});

test("parseNpmLsOutput - should handle empty dependencies", () => {
  const stdout = JSON.stringify({
    dependencies: {},
  });

  const result = parseNpmLsOutput(stdout);

  assert.strictEqual(Object.keys(result).length, 0);
});

test("parseNpmLsOutput - should handle missing dependencies field", () => {
  const stdout = JSON.stringify({
    name: "test-package",
    version: "1.0.0",
  });

  const result = parseNpmLsOutput(stdout);

  assert.strictEqual(Object.keys(result).length, 0);
});

test("parseNpmLsOutput - should handle invalid nested deps", () => {
  const stdout = JSON.stringify({
    dependencies: {
      lodash: "not-an-object",
      express: { version: "4.18.0" },
    },
  });

  const result = parseNpmLsOutput(stdout);

  assert.strictEqual(result.lodash, "unknown");
  assert.strictEqual(result.express, "4.18.0");
});

test("getDependencyTree - uses custom cacheDir when provided", async () => {
  clearDependencyTreeCache();
  const customCacheDir = resolve(testDir, "custom-cache");
  mkdirSync(customCacheDir, { recursive: true });
  const mockOutput = JSON.stringify({ dependencies: { lodash: {} } });
  const mockExecuteNpmLs = () => Promise.resolve(mockOutput);

  const tree = await getDependencyTree(mockExecuteNpmLs, customCacheDir, testDir);

  assert.strictEqual(tree["lodash"], "unknown");
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
  const mockExecuteNpmLs = () => {
    callCount++;
    return Promise.resolve(mockOutput);
  };

  const firstCall = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);
  const failMock = () => Promise.reject(new Error("should not be called"));
  const secondCall = await getDependencyTree(failMock, undefined, testDir);

  assert.deepStrictEqual(firstCall, secondCall);
  assert.strictEqual(callCount, 1);
  clearDependencyTreeCache();
});

test("getDependencyTree - caches lockfile-less roots independently", async () => {
  clearDependencyTreeCache();
  const cacheDir = resolve(testDir, "multi-root-cache");
  const rootA = resolve(testDir, "root-a");
  const rootB = resolve(testDir, "root-b");
  mkdirSync(rootA, { recursive: true });
  mkdirSync(rootB, { recursive: true });

  const mockExecuteNpmLs = (root?: string) => {
    const dependencyName = root === rootA ? "left-pad" : "right-pad";
    const output = JSON.stringify({ dependencies: { [dependencyName]: { version: "1.0.0" } } });
    return Promise.resolve(output);
  };

  const treeA = await getDependencyTree(mockExecuteNpmLs, cacheDir, rootA);
  const treeB = await getDependencyTree(mockExecuteNpmLs, cacheDir, rootB);

  assert.strictEqual(treeA["left-pad"], "1.0.0");
  assert.strictEqual(treeA["right-pad"], undefined);
  assert.strictEqual(treeB["right-pad"], "1.0.0");
  assert.strictEqual(treeB["left-pad"], undefined);

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

  assert.deepStrictEqual(first, second);
  assert.deepStrictEqual(second, third);
  assert.strictEqual(callCount, 1);
  clearDependencyTreeCache();
});

test("getDependencyTree - should return empty object on error", async () => {
  clearDependencyTreeCache();

  const mockExecuteNpmLs = () => Promise.reject(new Error("npm command failed"));
  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  assert.strictEqual(typeof tree, "object");
  assert.deepStrictEqual(Object.keys(tree), []);
  clearDependencyTreeCache();
});

test("parseNpmLsOutput - should handle null dependencies value", () => {
  const stdout = JSON.stringify({
    dependencies: {
      lodash: { version: "4.17.21", dependencies: null },
    },
  });

  const result = parseNpmLsOutput(stdout);
  assert.strictEqual(result.lodash, "4.17.21");
});

test("updatePackageJSON - writes an unnamed root package.json", () => {
  rmSync(testDir, { recursive: true, force: true });
  mkdirSync(testDir, { recursive: true });
  const rootPath = resolve(testDir, "package.json");
  const config: PastoralistJSON = {
    version: "1.0.0",
  } as PastoralistJSON;
  const overrides: OverridesType = { lodash: "4.17.21" };
  const originalCwd = process.cwd();
  writeFileSync(rootPath, JSON.stringify(config));

  try {
    process.chdir(testDir);
    updatePackageJSON({
      path: rootPath,
      config,
      overrides,
      isTesting: false,
      dryRun: false,
    });
  } finally {
    process.chdir(originalCwd);
  }

  const written = JSON.parse(safeReadFileSync(rootPath, "utf8"));
  assert.deepStrictEqual(written.overrides, overrides);
  rmSync(testDir, { recursive: true, force: true });
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
  assert.strictEqual(typeof executeNpmLs, "function");
});

test("getDependencyTree - handles executeNpmLs errors gracefully", async () => {
  clearDependencyTreeCache();

  const mockExecuteNpmLs = () => Promise.reject(new Error("Command execution failed"));
  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  assert.strictEqual(typeof tree, "object");
  assert.deepStrictEqual(Object.keys(tree), []);
  clearDependencyTreeCache();
});

const lockTestDir = resolve(import.meta.dirname, "..", ".test-lock-files");

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

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["express"], "4.18.0");
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

  assert.strictEqual(tree?.["lodash"], "unknown");
  assert.strictEqual(tree?.["malformed"], "unknown");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - parses Bun text lockfiles with trailing commas", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), bunLockContentWithTrailingCommas);

  const tree = parseBunLockTree(lockTestDir);

  assert.strictEqual(tree?.["react"], "18.0.0");
  assert.strictEqual(tree?.["typescript"], "5.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - returns undefined when no bun.lock present", () => {
  assert.strictEqual(parseBunLockTree(testDir), undefined);
});

test("parseBunLockTree - returns undefined for malformed bun.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), "not valid json {{{");

  assert.strictEqual(parseBunLockTree(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - returns undefined when bun.lock has no packages field", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), JSON.stringify({ lockfileVersion: 1 }));

  assert.strictEqual(parseBunLockTree(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockTree - returns undefined when bun.lock packages is empty", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), bunLockContent({}));

  assert.strictEqual(parseBunLockTree(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getDependencyTree - uses bun.lock over executeNpmLs when available", async () => {
  clearDependencyTreeCache();
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), bunLockContentWithTrailingCommas);
  const shouldNotBeCalled = mock(() =>
    Promise.reject(new Error("executeNpmLs should not be called")),
  );

  const tree = await getDependencyTree(shouldNotBeCalled, undefined, lockTestDir);

  assert.strictEqual(tree["react"], "18.0.0");
  assert.strictEqual(tree["typescript"], "5.0.0");
  assert.strictEqual(shouldNotBeCalled.mock.callCount(), 0);
  rmSync(lockTestDir, { recursive: true, force: true });
  clearDependencyTreeCache();
});

test("getDependencyTree - falls back to executeNpmLs when no bun.lock", async () => {
  clearDependencyTreeCache();
  const mockOutput = JSON.stringify({ dependencies: { lodash: {} } });
  const mockExecuteNpmLs = () => Promise.resolve(mockOutput);

  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  assert.strictEqual(tree["lodash"], "unknown");
  clearDependencyTreeCache();
});

test("parsePnpmLockTree - parses v5 format (slash-separated)", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  /lodash/4.17.21:\n    resolution: {}\n  /@types/node/18.0.0:\n    resolution: {}\n",
  );

  const tree = parsePnpmLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["@types/node"], "18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockTree - parses v6 format (at-separated)", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  /lodash@4.17.21:\n    resolution: {}\n  /@types/node@18.0.0:\n    resolution: {}\n",
  );

  const tree = parsePnpmLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["@types/node"], "18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockTree - parses v9 format (no leading slash)", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  lodash@4.17.21: {}\n  '@types/node@18.0.0': {}\n",
  );

  const tree = parsePnpmLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["@types/node"], "18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockTree - prefers package versions over peer-suffixed snapshots", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = [
    "lockfileVersion: '9.0'",
    "packages:",
    "  eslint-plugin-example@5.3.2: {}",
    "snapshots:",
    "  eslint-plugin-example@5.3.2(eslint@9.0.0): {}",
  ].join("\n");
  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), content);

  const tree = parsePnpmLockTree(lockTestDir);

  assert.strictEqual(tree?.["eslint-plugin-example"], "5.3.2");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockTree - returns undefined when no pnpm-lock.yaml", () => {
  assert.strictEqual(parsePnpmLockTree(testDir), undefined);
});

test("parsePnpmLockTree - returns undefined for empty packages section", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");

  assert.strictEqual(parsePnpmLockTree(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockTree - returns undefined when lockfile cannot be read", () => {
  mkdirSync(resolve(lockTestDir, "pnpm-lock.yaml"), { recursive: true });

  assert.strictEqual(parsePnpmLockTree(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockTree - parses yarn v1 format", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "yarn.lock"),
    '# yarn lockfile v1\n\nlodash@^4.17.21:\n  version "4.17.21"\n\n"@types/node@^18.0.0":\n  version "18.0.0"\n',
  );

  const tree = parseYarnLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["@types/node"], "18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockTree - parses yarn berry format", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "yarn.lock"),
    '__metadata:\n  version: 8\n\n"lodash@npm:^4.17.21":\n  version: 4.17.21\n\n"@types/node@npm:^18.0.0":\n  version: 18.0.0\n',
  );

  const tree = parseYarnLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["@types/node"], "18.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockTree - handles multiple specifiers on one line", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "yarn.lock"),
    '"lodash@^4.17.21, lodash@^4.17.20":\n  version "4.17.21"\n',
  );

  const tree = parseYarnLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockTree - returns undefined when no yarn.lock", () => {
  assert.strictEqual(parseYarnLockTree(testDir), undefined);
});

test("parseYarnLockTree - returns undefined when lockfile cannot be read", () => {
  mkdirSync(resolve(lockTestDir, "yarn.lock"), { recursive: true });

  assert.strictEqual(parseYarnLockTree(lockTestDir), undefined);
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

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["@types/node"], "18.0.0");
  assert.strictEqual(tree?.["child"], "1.0.0");
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

  assert.strictEqual(tree?.["lodash"], "4.17.21");
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

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["express"], "4.18.0");
  assert.strictEqual(tree?.["qs"], "6.11.0");
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

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["express"], "4.18.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockTree - returns undefined when no package-lock.json", () => {
  assert.strictEqual(parseNpmLockTree(testDir), undefined);
});

test("parseNpmLockTree - returns undefined when package-lock has no dependency data", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "package-lock.json"), JSON.stringify({ lockfileVersion: 3 }));

  assert.strictEqual(parseNpmLockTree(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockTree - returns undefined for malformed JSON", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "package-lock.json"), "not json {{{");

  assert.strictEqual(parseNpmLockTree(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

const getAlphaVersions = (root: string): string[] | undefined => {
  const packages = getLockedPackages(root);
  return packages?.filter(({ name }) => name === "alpha").map(({ version }) => version);
};

test("getLockedPackages - preserves npm package-lock duplicate versions", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const packages = {
    "": {},
    "node_modules/alpha": { version: "1.0.0" },
    "node_modules/wrapper/node_modules/alpha": { version: "2.0.0" },
  };
  writeFileSync(resolve(lockTestDir, "package-lock.json"), JSON.stringify({ packages }));

  assert.deepStrictEqual(getAlphaVersions(lockTestDir), ["1.0.0", "2.0.0"]);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - preserves npm v1 duplicate versions", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const dependencies = {
    alpha: { version: "1.0.0" },
    wrapper: { version: "1.0.0", dependencies: { alpha: { version: "2.0.0" } } },
  };
  writeFileSync(resolve(lockTestDir, "package-lock.json"), JSON.stringify({ dependencies }));

  assert.deepStrictEqual(getAlphaVersions(lockTestDir), ["1.0.0", "2.0.0"]);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - preserves pnpm duplicate versions", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = "packages:\n  alpha@1.0.0: {}\n  alpha@2.0.0: {}\n";
  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), content);

  assert.deepStrictEqual(getAlphaVersions(lockTestDir), ["1.0.0", "2.0.0"]);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - ignores pnpm range selectors outside package sections", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = [
    "lockfileVersion: '9.0'",
    "overrides:",
    "  alpha@^1: 1.5.0",
    "packages:",
    "  alpha@1.5.0: {}",
  ].join("\n");
  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), content);

  assert.deepStrictEqual(getAlphaVersions(lockTestDir), ["1.5.0"]);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - reads pnpm snapshot package entries", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = "lockfileVersion: '9.0'\nsnapshots:\n  alpha@1.5.0: {}\n";
  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), content);

  assert.deepStrictEqual(getAlphaVersions(lockTestDir), ["1.5.0"]);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - preserves Yarn duplicate versions", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = 'alpha@^1.0.0:\n  version "1.0.0"\n\nalpha@^2.0.0:\n  version "2.0.0"\n';
  writeFileSync(resolve(lockTestDir, "yarn.lock"), content);

  assert.deepStrictEqual(getAlphaVersions(lockTestDir), ["1.0.0", "2.0.0"]);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - rejects Yarn entries without versions", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "yarn.lock"), "alpha@^1.0.0:\n");

  assert.strictEqual(getLockedPackages(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - preserves Bun duplicate versions", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = bunLockContent({
    alpha: ["alpha@1.0.0", "", {}, "sha512-a"],
    "wrapper/alpha": ["alpha@2.0.0", "", {}, "sha512-b"],
  });
  writeFileSync(resolve(lockTestDir, "bun.lock"), content);

  assert.deepStrictEqual(getAlphaVersions(lockTestDir), ["1.0.0", "2.0.0"]);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - rejects unsupported legacy Bun lockfiles", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lockb"), "legacy binary lockfile");

  assert.throws(
    () => getLockedPackages(lockTestDir),
    errorIncludes("Legacy bun.lockb is unsupported"),
  );
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - fails securely for incomplete lock data", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = bunLockContent({ alpha: ["invalid", "", {}, "sha512-a"] });
  writeFileSync(resolve(lockTestDir, "bun.lock"), content);

  assert.strictEqual(getLockedPackages(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - fails securely for malformed Bun lock data", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), "not valid lock data");

  assert.strictEqual(getLockedPackages(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getLockedPackages - fails securely for malformed npm lock data", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "package-lock.json"), "not valid JSON");

  assert.strictEqual(getLockedPackages(lockTestDir), undefined);
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
  assert.strictEqual(count, 2);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - handles invalid npm lock JSON", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  writeFileSync(resolve(lockTestDir, "package-lock.json"), "{ invalid json");

  const count = getFullDependencyCount(lockTestDir);
  assert.strictEqual(count, 0);

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
  assert.strictEqual(count, 2);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - handles empty yarn lock", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  writeFileSync(resolve(lockTestDir, "yarn.lock"), "");

  const count = getFullDependencyCount(lockTestDir);
  assert.strictEqual(count, 0);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - returns 0 when pattern lock file cannot be read", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(resolve(lockTestDir, "yarn.lock"), { recursive: true });

  const count = getFullDependencyCount(lockTestDir);
  assert.strictEqual(count, 0);

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
  assert.strictEqual(count, 2);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - handles empty pnpm lock", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), "");

  const count = getFullDependencyCount(lockTestDir);
  assert.strictEqual(count, 0);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - counts packages in a Bun text lockfile", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });
  const lodashEntry = ["lodash@4.17.21", "", {}, "sha512-x"];
  const expressEntry = ["express@4.18.0", "", {}, "sha512-y"];
  const content = bunLockContent({
    lodash: lodashEntry,
    express: expressEntry,
  });
  writeFileSync(resolve(lockTestDir, "bun.lock"), content);

  assert.strictEqual(getFullDependencyCount(lockTestDir), 2);

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - rejects unsupported legacy Bun lockfiles", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lockb"), "legacy binary lockfile");

  assert.throws(
    () => getFullDependencyCount(lockTestDir),
    errorIncludes("Legacy bun.lockb is unsupported"),
  );

  rmSync(lockTestDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("getFullDependencyCount - returns 0 when no lock files exist", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  const count = getFullDependencyCount(lockTestDir);
  assert.strictEqual(count, 0);

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

  assert.strictEqual(existsSync(nonJsonPath), false);

  rmSync(testDir, { recursive: true, force: true });
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
    assert.strictEqual(pm, "bun");
  } finally {
    if (hadLockb) writeFileSync(lockbPath, "");
    const shouldRemoveTemporaryLock = !hadLock && existsSync(lockPath);
    if (shouldRemoveTemporaryLock) unlinkSync(lockPath);
  }
});

test("parseNpmLsOutput - should return empty object for invalid JSON", () => {
  const result = parseNpmLsOutput("not valid json {{{");
  assert.deepStrictEqual(result, {});
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

  assert.ok((graph?.["body-parser"]).includes("express"));
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockGraph - returns undefined when no bun.lock present", () => {
  assert.strictEqual(parseBunLockGraph(testDir), undefined);
});

test("parseBunLockGraph - returns an empty parsed graph when no deps are found", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    JSON.stringify({
      lockfileVersion: 1,
      packages: { lodash: ["lodash@4.17.21", "", {}, "sha512-x"] },
    }),
  );

  assert.deepStrictEqual(parseBunLockGraph(lockTestDir), {});
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

  assert.deepStrictEqual(graph?.["qs"], ["express"]);
  assert.strictEqual(graph?.["malformed"], undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockGraph - returns inverted dep graph from pnpm-lock.yaml", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  /express@4.18.0:\n    resolution: {}\n    dependencies:\n      body-parser: 1.20.0\n  /body-parser@1.20.0:\n    resolution: {}\n",
  );

  const graph = parsePnpmLockGraph(lockTestDir);

  assert.ok((graph?.["body-parser"]).includes("express"));
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockGraph - returns undefined when no pnpm-lock.yaml", () => {
  assert.strictEqual(parsePnpmLockGraph(testDir), undefined);
});

test("parseYarnLockGraph - returns inverted dep graph from yarn.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "yarn.lock"),
    'express@^4.18.0:\n  version "4.18.0"\n  dependencies:\n    body-parser "^1.20.0"\n\nbody-parser@^1.20.0:\n  version "1.20.0"\n',
  );

  const graph = parseYarnLockGraph(lockTestDir);

  assert.ok((graph?.["body-parser"]).includes("express"));
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockGraph - parses Yarn Berry dependency keys", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = [
    '"parent@npm:1.0.0":',
    "  version: 1.0.0",
    "  dependencies:",
    '    lodash: "npm:^4.17.0"',
    '    "@babel/core": "npm:^7.0.0"',
  ].join("\n");
  writeFileSync(resolve(lockTestDir, "yarn.lock"), content);

  const graph = parseYarnLockGraph(lockTestDir);

  assert.deepStrictEqual(graph?.["lodash"], ["parent"]);
  assert.deepStrictEqual(graph?.["@babel/core"], ["parent"]);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockGraph - returns undefined when no yarn.lock", () => {
  assert.strictEqual(parseYarnLockGraph(testDir), undefined);
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

  assert.ok((graph?.["body-parser"]).includes("express"));
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockGraph - returns undefined when no package-lock.json", () => {
  assert.strictEqual(parseNpmLockGraph(testDir), undefined);
});

test("getDependencyGraph - marks a parsed graph with no edges as available", () => {
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

  const status = getDependencyGraphStatus(lockTestDir);
  const graph = getDependencyGraph(lockTestDir);

  assert.deepStrictEqual(status, { graph: {}, available: true });
  assert.strictEqual(graph, status.graph);
  const graphAgain = getDependencyGraph(lockTestDir);
  assert.strictEqual(graphAgain, graph);

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
  assert.deepStrictEqual(originalGraph?.["body-parser"], ["express"]);

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
  assert.notStrictEqual(updatedGraph, originalGraph);
  assert.deepStrictEqual(updatedGraph?.qs, ["lodash"]);
  assert.strictEqual(updatedGraph?.["body-parser"], undefined);

  clearDependencyGraphCache();
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("getDependencyGraph - returns empty object when no lock file", () => {
  clearDependencyGraphCache();
  mkdirSync(lockTestDir, { recursive: true });

  const graph = getDependencyGraph(lockTestDir);

  assert.deepStrictEqual(graph, {});
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

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockGraph - returns undefined for malformed bun.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), "not valid json {{{");

  assert.strictEqual(parseBunLockGraph(lockTestDir), undefined);
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

  assert.ok((graph?.["lodash"]).includes("express"));
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseNpmLockGraph - returns undefined for malformed JSON", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "package-lock.json"), "not valid json {{{");

  assert.strictEqual(parseNpmLockGraph(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockGraph - resets inDeps when non-dep line follows dependencies section", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "pnpm-lock.yaml"),
    "packages:\n  express@4.18.0:\n    dependencies:\n      lodash: 4.17.21\n    engines: {node: '>=0.10.0'}\n",
  );

  const graph = parsePnpmLockGraph(lockTestDir);

  assert.ok((graph?.["lodash"]).includes("express"));
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parsePnpmLockGraph - returns undefined when lockfile cannot be read", () => {
  mkdirSync(resolve(lockTestDir, "pnpm-lock.yaml"), { recursive: true });

  assert.strictEqual(parsePnpmLockGraph(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseYarnLockGraph - returns undefined when lockfile cannot be read", () => {
  mkdirSync(resolve(lockTestDir, "yarn.lock"), { recursive: true });

  assert.strictEqual(parseYarnLockGraph(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});
