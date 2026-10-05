import { errorIncludes, fulfilledValues, mock } from "../setup";
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
  getFullDependencyCount,
  parseBunLockGraph,
  parsePnpmLockGraph,
  parseYarnLockGraph,
  parseNpmLockGraph,
  getDependencyGraph,
  getDependencyGraphStatus,
  clearDependencyGraphCache,
} from "../../../src/core/package";
import { clearHintCache } from "../../../src/dx";
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

const prepareTestDir = () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(testDir, { recursive: true });
  jsonCache.clear();
};

const cleanupTestDir = () => {
  rmSync(testDir, { recursive: true, force: true });
  jsonCache.clear();
  validateRootPackageJsonIntegrity();
};

const captureConsoleLog = (run: () => void) => {
  const { log: originalLog } = console;
  const messages: string[] = [];
  console.log = (...args: unknown[]) => {
    messages[messages.length] = args.join(" ");
  };
  try {
    run();
  } finally {
    console.log = originalLog;
  }
  return messages;
};

const captureStdout = (run: () => void) => {
  const originalWrite = process.stdout.write.bind(process.stdout);
  const chunks: string[] = [];
  process.stdout.write = (chunk: unknown): boolean => {
    chunks[chunks.length] = String(chunk);
    return true;
  };
  try {
    run();
  } finally {
    process.stdout.write = originalWrite;
  }
  const output = chunks.join("");
  return output;
};

const PAD_VERSION = { version: "1.0.0" };

const rejectNpmLs = (message: string) => () => Promise.reject(new Error(message));

const createRootNpmLs = (leftRoot: string) => (root?: string) => {
  const isLeftRoot = root === leftRoot;
  const dependencyName = isLeftRoot ? "left-pad" : "right-pad";
  const dependencies = Object.fromEntries([[dependencyName, PAD_VERSION]]);
  const output = JSON.stringify({ dependencies });
  const response = Promise.resolve(output);
  return response;
};

const createLargeAppendix = () => {
  const entries = Array.from({ length: 15 }, (_, index) => {
    const app = `package${index}@^1.0.0`;
    const dependents = { app };
    const entry = [`package${index}@1.0.0`, { dependents }];
    return entry;
  });
  const appendix = Object.fromEntries(entries);
  return appendix;
};

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

const configResolutions3 = { lodash: "4.17.21" };
test("getExistingOverrideField - should return resolutions when present", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: configResolutions3,
  };

  const field = getExistingOverrideField(config);
  assert.strictEqual(field, "resolutions");
});

const configOverrides7 = { lodash: "4.17.21" };
test("getExistingOverrideField - should return overrides when present", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", overrides: configOverrides7 };

  const field = getExistingOverrideField(config);
  assert.strictEqual(field, "overrides");
});

const pnpmOverrides2 = { lodash: "4.17.21" };
const configPnpm3 = { overrides: pnpmOverrides2 };
test("getExistingOverrideField - should return pnpm when pnpm overrides present", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", pnpm: configPnpm3 };

  const field = getExistingOverrideField(config);
  assert.strictEqual(field, "pnpm");
});

test("getExistingOverrideField - should return null when no overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const field = getExistingOverrideField(config);
  assert.strictEqual(field, null);
});

const configOverrides6 = { axios: "1.0.0" };
const configResolutions2 = { lodash: "4.17.21" };
test("getExistingOverrideField - should prioritize resolutions over overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: configResolutions2,
    overrides: configOverrides6,
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

const overrides10 = { lodash: "4.17.21" };
const configPnpm2 = { shamefullyHoist: true };
test("applyOverridesToConfig - should preserve existing pnpm config when adding overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", pnpm: configPnpm2 };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, "pnpm");

  assert.deepStrictEqual(result.pnpm, { shamefullyHoist: true, overrides: overrides10 });
});

test("applyOverridesToConfig - should return config unchanged when fieldType is null", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };
  const overrides = { lodash: "4.17.21" };

  const result = applyOverridesToConfig(config, overrides, null);

  assert.deepStrictEqual(result, config);
});

test("resolveJSON - should parse and cache valid JSON", () => {
  prepareTestDir();

  const mockPkg: PastoralistJSON = { name: "test", version: "1.0.0" };

  writeFileSync(testPkgPath, JSON.stringify(mockPkg, null, 2));

  const result = resolveJSON(testPkgPath);

  assert.deepStrictEqual(result, mockPkg);
  assert.strictEqual(jsonCache.size, 1);

  cleanupTestDir();
});

test("resolveJSON - should return cached result on second call", () => {
  prepareTestDir();

  const mockPkg: PastoralistJSON = { name: "test", version: "1.0.0" };

  writeFileSync(testPkgPath, JSON.stringify(mockPkg, null, 2));

  const first = resolveJSON(testPkgPath);
  const second = resolveJSON(testPkgPath);

  assert.strictEqual(first, second);
  assert.strictEqual(jsonCache.size, 1);

  cleanupTestDir();
});

test("resolveJSON - should return undefined for invalid JSON", () => {
  prepareTestDir();

  writeFileSync(testPkgPath, "{ invalid json");

  const result = resolveJSON(testPkgPath);

  assert.strictEqual(result, undefined);

  cleanupTestDir();
});

test("resolveJSON - should return undefined for non-existent file", () => {
  const result = resolveJSON("/non/existent/package.json");
  assert.strictEqual(result, undefined);
});

const lodashDependents4 = { root: "lodash@^4.17.20" };
const appendixLodash5 = { dependents: lodashDependents4 };
const configOverrides5 = {};
test("updatePackageJSON - should add appendix and overrides to package.json", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", overrides: configOverrides5 };

  const appendix = { "lodash@4.17.21": appendixLodash5 };

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

const lodashDependents3 = { root: "lodash@^4.17.20" };
const appendixLodash4 = { dependents: lodashDependents3 };
const configPastoralistAppendix = { "lodash@4.17.21": appendixLodash4 };
const configPastoralist = { appendix: configPastoralistAppendix };
const configOverrides4 = { lodash: "4.17.21" };
test("updatePackageJSON - should remove overrides when none provided", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: configOverrides4,
    pastoralist: configPastoralist,
  };

  const result = updatePackageJSON({ path: testPkgPath, config, isTesting: true });

  assert.strictEqual(result?.overrides, undefined);
  assert.strictEqual(result?.pastoralist, undefined);
});

const lodashDependents2 = { root: "lodash@^4.17.20" };
const pastoralistAppendixLodash = { dependents: lodashDependents2 };
const pastoralistAppendix = { "lodash@4.17.21": pastoralistAppendixLodash };
const security = { enabled: true };
const configOverrides3 = { lodash: "4.17.21" };
const bestCaseSearch = { beamWidth: 8 };
const bestCase = { enabled: true, search: bestCaseSearch };
const preservedPastoralist = {
  $schema: "./node_modules/pastoralist/src/schema.json",
  depPaths: "workspace",
  compactAppendix: true,
  checkSecurity: true,
  security,
  bestCase,
  appendix: pastoralistAppendix,
};
const preservedConfig: PastoralistJSON = {
  name: "test",
  version: "1.0.0",
  overrides: configOverrides3,
  pastoralist: preservedPastoralist,
};
test("updatePackageJSON - should preserve other pastoralist config when removing appendix", () => {
  const result = updatePackageJSON({ path: testPkgPath, config: preservedConfig, isTesting: true });
  const preserved = Object.assign({}, result?.pastoralist);

  assert.strictEqual(preserved.$schema, "./node_modules/pastoralist/src/schema.json");
  assert.strictEqual(preserved.depPaths, "workspace");
  assert.strictEqual(preserved.compactAppendix, true);
  assert.strictEqual(preserved.checkSecurity, true);
  assert.deepStrictEqual(preserved.security, { enabled: true });
  assert.deepStrictEqual(preserved.bestCase, bestCase);
  assert.strictEqual(preserved.appendix, undefined);
});

const overrides9 = { lodash: "4.17.21" };
const configOverrides2 = { lodash: "4.17.21" };
test("updatePackageJSON - skips write when content is unchanged", () => {
  prepareTestDir();

  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: configOverrides2,
  };

  writeFileSync(testPkgPath, "SENTINEL");

  updatePackageJSON({ path: testPkgPath, config, overrides: overrides9, isTesting: false });

  const content = safeReadFileSync(testPkgPath, "utf8");
  assert.strictEqual(content, "SENTINEL");

  cleanupTestDir();
});

const overrides8 = { lodash: "4.17.21" };
test("updatePackageJSON - writes file when content changes", () => {
  prepareTestDir();

  const config: PastoralistJSON = { name: "test-app", version: "1.0.0" };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2) + "\n");
  writeFileSync(testPkgPath, "SENTINEL");

  updatePackageJSON({ path: testPkgPath, config, overrides: overrides8, isTesting: false });

  const content = safeReadFileSync(testPkgPath, "utf8");
  assert.notStrictEqual(content, "SENTINEL");

  cleanupTestDir();
});

test("updatePackageJSON - should write file when not in testing mode", () => {
  prepareTestDir();

  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const overrides: OverridesType = { lodash: "4.17.21" };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  updatePackageJSON({ path: testPkgPath, config, overrides, isTesting: false });

  assert.strictEqual(existsSync(testPkgPath), true);

  const written = resolveJSON(testPkgPath);
  const hasOverrides = Boolean(
    written?.overrides || written?.resolutions || written?.pnpm?.overrides,
  );
  assert.strictEqual(hasOverrides, true);

  cleanupTestDir();
});

test("updatePackageJSON - should not write file in dry run mode", () => {
  prepareTestDir();

  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

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

  cleanupTestDir();
});

test("updatePackageJSON - should clear cache after writing", () => {
  prepareTestDir();

  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  resolveJSON(testPkgPath);
  assert.strictEqual(jsonCache.size, 1);

  const overrides: OverridesType = { lodash: "4.17.21" };

  updatePackageJSON({ path: testPkgPath, config, overrides, isTesting: false });

  assert.strictEqual(jsonCache.has(resolve(testPkgPath)), false);

  cleanupTestDir();
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

const dependenciesExpress7 = { version: "4.18.0" };
const dependenciesLodash11 = { version: "4.17.21" };
const dependencies16 = { lodash: dependenciesLodash11, express: dependenciesExpress7 };
test("getDependencyTree - should return dependency tree", async () => {
  clearDependencyTreeCache();
  const mockOutput = JSON.stringify({ dependencies: dependencies16 });

  const mockExecuteNpmLs = () => Promise.resolve(mockOutput);
  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  assert.strictEqual(typeof tree, "object");
  assert.strictEqual(tree["lodash"], "4.17.21");
  assert.strictEqual(tree["express"], "4.18.0");
  clearDependencyTreeCache();
});

const dependenciesLodash10 = {};
const dependencies15 = { lodash: dependenciesLodash10 };
test("getDependencyTree - passes root parameter to executeNpmLs mock", async () => {
  clearDependencyTreeCache();
  let capturedRoot: string | undefined;
  const mockOutput = JSON.stringify({ dependencies: dependencies15 });
  const mockExecuteNpmLs = (root?: string) => {
    capturedRoot = root;
    const executeNpmLs = Promise.resolve(mockOutput);
    return executeNpmLs;
  };

  const customRoot = resolve(testDir, "custom-root");
  await getDependencyTree(mockExecuteNpmLs, undefined, customRoot);

  assert.strictEqual(capturedRoot, customRoot);
  clearDependencyTreeCache();
});

const configResolutions = { axios: "1.0.0" };
test("updatePackageJSON - should handle existing override field", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: configResolutions,
  };

  const overrides: OverridesType = { lodash: "4.17.21" };

  const result = updatePackageJSON({ path: testPkgPath, config, overrides, isTesting: true });

  assert.deepStrictEqual(result?.resolutions, { lodash: "4.17.21" });
});

const resolutions = { axios: "1.0.0" };
test("applyOverridesToConfig - should use existing override field", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", resolutions };

  const overrides = { lodash: "4.17.21" };
  const existingField = getExistingOverrideField(config);

  const result = applyOverridesToConfig(config, overrides, existingField);

  assert.deepStrictEqual(result.resolutions, { lodash: "4.17.21" });
});

const configPnpmOverrides = { lodash: "4.17.21" };
const configPnpm = { overrides: configPnpmOverrides, shamefullyHoist: true };
test("updatePackageJSON - should preserve pnpm config when removing overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", pnpm: configPnpm };

  const result = updatePackageJSON({ path: testPkgPath, config, isTesting: true });

  assert.strictEqual(result?.pnpm?.overrides, undefined);
  assert.strictEqual(result?.pnpm?.shamefullyHoist, true);
});

const pnpmOverrides = { lodash: "4.17.21" };
const pnpm = { overrides: pnpmOverrides };
test("updatePackageJSON - should remove empty pnpm when only had overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", pnpm };

  const result = updatePackageJSON({ path: testPkgPath, config, isTesting: true });

  assert.strictEqual(result?.pnpm, undefined);
});

test("updatePackageJSON - should write to non-root package.json", () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const config: PastoralistJSON = { name: "workspace-pkg", version: "1.0.0" };

  const overrides: OverridesType = { lodash: "4.17.21" };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  updatePackageJSON({ path: testPkgPath, config, overrides, isTesting: false });

  assert.strictEqual(existsSync(testPkgPath), true);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});
const smallAppendixLodashDependents = { app: "lodash@^4.17.0" };
const smallAppendixLodash = { dependents: smallAppendixLodashDependents };
const rcHintConfig: PastoralistJSON = { name: "test-pkg", version: "1.0.0" };
const rcHintOverrides: OverridesType = { lodash: "4.17.21" };
const smallAppendix = { "lodash@4.17.21": smallAppendixLodash };
const smallConfigOptions = {
  path: testPkgPath,
  config: rcHintConfig,
  appendix: smallAppendix,
  overrides: rcHintOverrides,
  isTesting: false,
};
test("updatePackageJSON - should not show RC file suggestion for small config", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(testDir, { recursive: true });

  writeFileSync(testPkgPath, JSON.stringify(rcHintConfig, null, 2));
  const logCalls = captureConsoleLog(() => updatePackageJSON(smallConfigOptions));

  const hasRcSuggestion = logCalls.some((log) =>
    log.includes("pastoralist init --useRcConfigFile"),
  );
  assert.strictEqual(hasRcSuggestion, false);

  rmSync(testDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

const rcHintLargeAppendix = createLargeAppendix();
const largeConfigOptions = {
  path: testPkgPath,
  config: rcHintConfig,
  appendix: rcHintLargeAppendix,
  overrides: rcHintOverrides,
  isTesting: false,
};
test("updatePackageJSON - should show RC file suggestion for large config", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(testDir, { recursive: true });

  clearHintCache();
  writeFileSync(testPkgPath, JSON.stringify(rcHintConfig, null, 2));
  const output = captureStdout(() => updatePackageJSON(largeConfigOptions));

  const hintWords = HINT_RC_FILE_TEXT.split(" ");
  const hasHintContent = hintWords.every((word) => output.includes(word));
  assert.strictEqual(hasHintContent, true);

  rmSync(testDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("updatePackageJSON - should not show RC file suggestion in test mode", () => {
  const config: PastoralistJSON = { name: "test-pkg", version: "1.0.0" };
  const largeAppendix = createLargeAppendix();
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

const overrides7 = { lodash: "4.17.21" };
const appendixLodashDependents = {};
const appendixLodash3 = { dependents: appendixLodashDependents };
const appendix4 = { "lodash@4.17.21": appendixLodash3 };
test("updatePackageJSON - silent option suppresses dry-run output", () => {
  const config: PastoralistJSON = { name: "test-silent", version: "1.0.0" };

  const consoleOutput = captureConsoleLog(() =>
    updatePackageJSON({
      path: testPkgPath,
      config,
      appendix: appendix4,
      overrides: overrides7,
      dryRun: true,
      silent: true,
    }),
  );

  const hasDryRunMessage = consoleOutput.some((msg) => msg.includes("[DRY RUN]"));
  assert.strictEqual(hasDryRunMessage, false);
});

const overrides6 = { lodash: "4.17.21" };
const lodashDependents = {};
const appendixLodash2 = { dependents: lodashDependents };
const appendix3 = { "lodash@4.17.21": appendixLodash2 };
test("updatePackageJSON - dry-run without silent shows output", () => {
  const config: PastoralistJSON = { name: "test-not-silent", version: "1.0.0" };

  const consoleOutput = captureConsoleLog(() =>
    updatePackageJSON({
      path: testPkgPath,
      config,
      appendix: appendix3,
      overrides: overrides6,
      dryRun: true,
      silent: false,
    }),
  );

  const hasDryRunMessage = consoleOutput.some((msg) => msg.includes("[DRY RUN]"));
  assert.strictEqual(hasDryRunMessage, true);
});

const overrides5 = { lodash: "4.17.21" };
const configOverrides = { lodash: "4.17.21" };
test("updatePackageJSON - dry-run with unchanged content logs no-op message", () => {
  const config: PastoralistJSON = {
    name: "test-dryrun-unchanged",
    version: "1.0.0",
    overrides: configOverrides,
  };

  const consoleOutput = captureConsoleLog(() =>
    updatePackageJSON({
      path: testPkgPath,
      config,
      overrides: overrides5,
      dryRun: true,
      silent: false,
    }),
  );

  const hasUnchangedMessage = consoleOutput.some((msg) => msg.includes("No changes detected"));
  assert.strictEqual(hasUnchangedMessage, true);
});

const overrides4 = { lodash: "4.17.21" };
const dependents = {};
const appendixLodash = { dependents };
const appendix2 = { "lodash@4.17.21": appendixLodash };
test("updatePackageJSON - silent has no effect when not in dry-run mode", () => {
  mkdirSync(testDir, { recursive: true });

  const config: PastoralistJSON = { name: "test-silent-no-dryrun", version: "1.0.0" };

  writeFileSync(testPkgPath, JSON.stringify(config, null, 2));

  const result = updatePackageJSON({
    path: testPkgPath,
    config,
    appendix: appendix2,
    overrides: overrides4,
    dryRun: false,
    silent: true,
  });

  assert.strictEqual(result, undefined);

  const written = JSON.parse(safeReadFileSync(testPkgPath, "utf8"));
  assert.deepStrictEqual(written.overrides, { lodash: "4.17.21" });

  rmSync(testDir, { recursive: true, force: true });
});

const dependenciesExpress6 = { version: "4.18.0" };
const dependenciesLodash9 = { version: "4.17.21" };
const dependencies14 = { lodash: dependenciesLodash9, express: dependenciesExpress6 };
test("parseNpmLsOutput - should parse flat dependencies", () => {
  const stdout = JSON.stringify({ dependencies: dependencies14 });

  const result = parseNpmLsOutput(stdout);

  assert.strictEqual(result.lodash, "4.17.21");
  assert.strictEqual(result.express, "4.18.0");
});

const bytes = { version: "3.1.2" };
const bodyParserDependencies = { bytes };
const dependenciesBodyParser = { version: "1.20.0", dependencies: bodyParserDependencies };
const accepts = { version: "1.3.8" };
const expressDependencies4 = { accepts, "body-parser": dependenciesBodyParser };
const dependenciesExpress5 = { version: "4.18.0", dependencies: expressDependencies4 };
const dependencies13 = { express: dependenciesExpress5 };
test("parseNpmLsOutput - should parse nested dependencies", () => {
  const stdout = JSON.stringify({ dependencies: dependencies13 });

  const result = parseNpmLsOutput(stdout);

  assert.strictEqual(result.express, "4.18.0");
  assert.strictEqual(result.accepts, "1.3.8");
  assert.strictEqual(result["body-parser"], "1.20.0");
  assert.strictEqual(result.bytes, "3.1.2");
});

const dependencies12 = {};
test("parseNpmLsOutput - should handle empty dependencies", () => {
  const stdout = JSON.stringify({ dependencies: dependencies12 });

  const result = parseNpmLsOutput(stdout);

  assert.strictEqual(Object.keys(result).length, 0);
});

test("parseNpmLsOutput - should handle missing dependencies field", () => {
  const stdout = JSON.stringify({ name: "test-package", version: "1.0.0" });

  const result = parseNpmLsOutput(stdout);

  assert.strictEqual(Object.keys(result).length, 0);
});

const dependenciesExpress4 = { version: "4.18.0" };
const dependencies11 = { lodash: "not-an-object", express: dependenciesExpress4 };
test("parseNpmLsOutput - should handle invalid nested deps", () => {
  const stdout = JSON.stringify({ dependencies: dependencies11 });

  const result = parseNpmLsOutput(stdout);

  assert.strictEqual(result.lodash, "unknown");
  assert.strictEqual(result.express, "4.18.0");
});

const dependenciesLodash8 = {};
const dependencies10 = { lodash: dependenciesLodash8 };
test("getDependencyTree - uses custom cacheDir when provided", async () => {
  clearDependencyTreeCache();
  const customCacheDir = resolve(testDir, "custom-cache");
  mkdirSync(customCacheDir, { recursive: true });
  const mockOutput = JSON.stringify({ dependencies: dependencies10 });
  const mockExecuteNpmLs = () => Promise.resolve(mockOutput);

  const tree = await getDependencyTree(mockExecuteNpmLs, customCacheDir, testDir);

  assert.strictEqual(tree["lodash"], "unknown");
  clearDependencyTreeCache();
  rmSync(customCacheDir, { recursive: true, force: true });
});

const dependenciesExpress3 = { version: "4.18.0" };
const dependenciesLodash7 = { version: "4.17.21" };
const dependencies9 = { lodash: dependenciesLodash7, express: dependenciesExpress3 };
test("getDependencyTree - should cache results on second call", async () => {
  clearDependencyTreeCache();
  const mockOutput = JSON.stringify({ dependencies: dependencies9 });

  let callCount = 0;
  const mockExecuteNpmLs = () => {
    callCount++;
    const executeNpmLs = Promise.resolve(mockOutput);
    return executeNpmLs;
  };

  const firstCall = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);
  const failMock = rejectNpmLs("should not be called");
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

  const mockExecuteNpmLs = createRootNpmLs(rootA);

  const treeA = await getDependencyTree(mockExecuteNpmLs, cacheDir, rootA);
  const treeB = await getDependencyTree(mockExecuteNpmLs, cacheDir, rootB);

  assert.strictEqual(treeA["left-pad"], "1.0.0");
  assert.strictEqual(treeA["right-pad"], undefined);
  assert.strictEqual(treeB["right-pad"], "1.0.0");
  assert.strictEqual(treeB["left-pad"], undefined);

  clearDependencyTreeCache();
  rmSync(testDir, { recursive: true, force: true });
});

const dependenciesLodash6 = { version: "4.17.21" };
const dependencies7 = { lodash: dependenciesLodash6 };
test("getDependencyTree - coalesces concurrent requests", async () => {
  clearDependencyTreeCache();
  const mockOutput = JSON.stringify({ dependencies: dependencies7 });

  let callCount = 0;
  const mockExecuteNpmLs = async () => {
    callCount++;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
    return mockOutput;
  };

  const [first, second, third] = await fulfilledValues([
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

  const mockExecuteNpmLs = rejectNpmLs("npm command failed");
  const tree = await getDependencyTree(mockExecuteNpmLs, undefined, testDir);

  assert.strictEqual(typeof tree, "object");
  assert.deepStrictEqual(Object.keys(tree), []);
  clearDependencyTreeCache();
});

const dependenciesLodash5 = { version: "4.17.21", dependencies: null };
const dependencies6 = { lodash: dependenciesLodash5 };
test("parseNpmLsOutput - should handle null dependencies value", () => {
  const stdout = JSON.stringify({ dependencies: dependencies6 });

  const result = parseNpmLsOutput(stdout);
  assert.strictEqual(result.lodash, "4.17.21");
});

test("updatePackageJSON - writes an unnamed root package.json", () => {
  rmSync(testDir, { recursive: true, force: true });
  mkdirSync(testDir, { recursive: true });
  const rootPath = resolve(testDir, "package.json");
  const config: PastoralistJSON = { version: "1.0.0" } as PastoralistJSON;
  const overrides: OverridesType = { lodash: "4.17.21" };
  const originalCwd = process.cwd();
  writeFileSync(rootPath, JSON.stringify(config));

  try {
    process.chdir(testDir);
    updatePackageJSON({ path: rootPath, config, overrides, isTesting: false, dryRun: false });
  } finally {
    process.chdir(originalCwd);
  }

  const written = JSON.parse(safeReadFileSync(rootPath, "utf8"));
  assert.deepStrictEqual(written.overrides, overrides);
  rmSync(testDir, { recursive: true, force: true });
});

const overrides3 = { lodash: "4.17.21" };
test("updatePackageJSON - handles malformed JSON content gracefully", () => {
  validateRootPackageJsonIntegrity();
  const rootPath = resolve(process.cwd(), "package.json");

  const config = { name: "test" } as PastoralistJSON;

  updatePackageJSON({
    path: rootPath,
    config,
    overrides: overrides3,
    isTesting: false,
    dryRun: true,
  });

  validateRootPackageJsonIntegrity();
});

test("getDependencyTree - handles executeNpmLs errors gracefully", async () => {
  clearDependencyTreeCache();

  const mockExecuteNpmLs = rejectNpmLs("Command execution failed");
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

const express3 = ["express@4.18.0", "", {}, "sha512-y"];
const lodash3 = ["lodash@4.17.21", "", {}, "sha512-x"];
test("parseBunLockTree - returns package map from bun.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    bunLockContent({ lodash: lodash3, express: express3 }),
  );

  const tree = parseBunLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["express"], "4.18.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

const lodash2 = ["lodash", "", {}, "sha512-x"];
test("parseBunLockTree - uses unknown when a package entry has no version separator", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    bunLockContent({ lodash: lodash2, malformed: "not an entry array" }),
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
  const unexpectedNpmLs = mock(rejectNpmLs("executeNpmLs should not be called"));

  const tree = await getDependencyTree(unexpectedNpmLs, undefined, lockTestDir);

  assert.strictEqual(tree["react"], "18.0.0");
  assert.strictEqual(tree["typescript"], "5.0.0");
  assert.strictEqual(unexpectedNpmLs.mock.callCount(), 0);
  rmSync(lockTestDir, { recursive: true, force: true });
  clearDependencyTreeCache();
});

const dependenciesLodash4 = {};
const dependencies5 = { lodash: dependenciesLodash4 };
test("getDependencyTree - falls back to executeNpmLs when no bun.lock", async () => {
  clearDependencyTreeCache();
  const mockOutput = JSON.stringify({ dependencies: dependencies5 });
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

const nodeModulesParentNodeModulesChild = { version: "1.0.0" };
const nodeModulesTypesNode = { version: "18.0.0" };
const packagesNodeModulesLodash3 = { version: "4.17.21" };
const packages15 = {};
const packages16 = {
  "": packages15,
  "node_modules/lodash": packagesNodeModulesLodash3,
  "node_modules/@types/node": nodeModulesTypesNode,
  "node_modules/parent/node_modules/child": nodeModulesParentNodeModulesChild,
};
test("parseNpmLockTree - parses v2/v3 packages field", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 2, packages: packages16 }),
  );

  const tree = parseNpmLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["@types/node"], "18.0.0");
  assert.strictEqual(tree?.["child"], "1.0.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

const nodeModulesParentNodeModulesLodash = { version: "3.10.1" };
const packagesNodeModulesLodash2 = { version: "4.17.21" };
const packages13 = {};
const packages14 = {
  "": packages13,
  "node_modules/lodash": packagesNodeModulesLodash2,
  "node_modules/parent/node_modules/lodash": nodeModulesParentNodeModulesLodash,
};
test("parseNpmLockTree - prefers hoisted package versions over nested duplicates", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 2, packages: packages14 }),
  );

  const tree = parseNpmLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  rmSync(lockTestDir, { recursive: true, force: true });
});

const qs = { version: "6.11.0" };
const expressDependencies3 = { qs };
const dependenciesExpress2 = { version: "4.18.0", dependencies: expressDependencies3 };
const dependenciesLodash3 = { version: "4.17.21" };
const dependencies4 = { lodash: dependenciesLodash3, express: dependenciesExpress2 };
test("parseNpmLockTree - parses v1 dependencies field", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 1, dependencies: dependencies4 }),
  );

  const tree = parseNpmLockTree(lockTestDir);

  assert.strictEqual(tree?.["lodash"], "4.17.21");
  assert.strictEqual(tree?.["express"], "4.18.0");
  assert.strictEqual(tree?.["qs"], "6.11.0");
  rmSync(lockTestDir, { recursive: true, force: true });
});

const dependenciesLodash = { version: "3.10.1" };
const dependenciesExpressDependencies = { lodash: dependenciesLodash };
const dependenciesExpress = { version: "4.18.0", dependencies: dependenciesExpressDependencies };
const dependenciesLodash2 = { version: "4.17.21" };
const dependencies3 = { lodash: dependenciesLodash2, express: dependenciesExpress };
test("parseNpmLockTree - prefers direct dependency versions over nested duplicates", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 1, dependencies: dependencies3 }),
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
  const alphaVersions = packages
    ?.filter(({ name }) => name === "alpha")
    .map(({ version }) => version);
  return alphaVersions;
};

const nodeModulesWrapperNodeModulesAlpha = { version: "2.0.0" };
const nodeModulesAlpha = { version: "1.0.0" };
const packages12 = {};
test("getLockedPackages - preserves npm package-lock duplicate versions", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const packages = {
    "": packages12,
    "node_modules/alpha": nodeModulesAlpha,
    "node_modules/wrapper/node_modules/alpha": nodeModulesWrapperNodeModulesAlpha,
  };
  writeFileSync(resolve(lockTestDir, "package-lock.json"), JSON.stringify({ packages }));

  assert.deepStrictEqual(getAlphaVersions(lockTestDir), ["1.0.0", "2.0.0"]);
  rmSync(lockTestDir, { recursive: true, force: true });
});

const dependenciesAlpha = { version: "2.0.0" };
const wrapperDependencies = { alpha: dependenciesAlpha };
const wrapper = { version: "1.0.0", dependencies: wrapperDependencies };
const dependenciesAlpha2 = { version: "1.0.0" };
test("getLockedPackages - preserves npm v1 duplicate versions", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const dependencies = { alpha: dependenciesAlpha2, wrapper };
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

const wrapperAlpha = ["alpha@2.0.0", "", {}, "sha512-b"];
const alpha2 = ["alpha@1.0.0", "", {}, "sha512-a"];
test("getLockedPackages - preserves Bun duplicate versions", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = bunLockContent({ alpha: alpha2, "wrapper/alpha": wrapperAlpha });
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

const alpha = ["invalid", "", {}, "sha512-a"];
test("getLockedPackages - fails securely for incomplete lock data", () => {
  mkdirSync(lockTestDir, { recursive: true });
  const content = bunLockContent({ alpha });
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

const lockContentPackagesNodeModulesExpress = { version: "4.18.0" };
const lockContentPackagesNodeModulesLodash = { version: "4.17.21" };
const lockContentPackages = {};
const lockContentPackages2 = {
  "": lockContentPackages,
  "node_modules/lodash": lockContentPackagesNodeModulesLodash,
  "node_modules/express": lockContentPackagesNodeModulesExpress,
};
test("getFullDependencyCount - counts npm lock file packages", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(lockTestDir, { recursive: true });

  const lockContent = { packages: lockContentPackages2 };

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
  const content = bunLockContent({ lodash: lodashEntry, express: expressEntry });
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

const overrides2 = { lodash: "4.17.21" };
test("updatePackageJSON - should not write non-json files", () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(testDir, { recursive: true });

  const nonJsonPath = resolve(testDir, "config.txt");
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  updatePackageJSON({ path: nonJsonPath, config, overrides: overrides2, isTesting: false });

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

const bodyParser = ["body-parser@1.20.0", "", {}, "sha512-y"];
const packagesExpressDependencies = { "body-parser": "^1.20.0" };
const packagesExpress = [
  "express@4.18.0",
  "",
  { dependencies: packagesExpressDependencies },
  "sha512-x",
];
const packages11 = { express: packagesExpress, "body-parser": bodyParser };
test("parseBunLockGraph - returns inverted dep graph from bun.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    JSON.stringify({ lockfileVersion: 1, packages: packages11 }),
  );

  const graph = parseBunLockGraph(lockTestDir);

  assert.ok(graph?.["body-parser"]?.includes("express"));
  rmSync(lockTestDir, { recursive: true, force: true });
});

test("parseBunLockGraph - returns undefined when no bun.lock present", () => {
  assert.strictEqual(parseBunLockGraph(testDir), undefined);
});

const packagesLodash = ["lodash@4.17.21", "", {}, "sha512-x"];
const packages10 = { lodash: packagesLodash };
test("parseBunLockGraph - returns an empty parsed graph when no deps are found", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    JSON.stringify({ lockfileVersion: 1, packages: packages10 }),
  );

  assert.deepStrictEqual(parseBunLockGraph(lockTestDir), {});
  rmSync(lockTestDir, { recursive: true, force: true });
});

const expressDependencies2 = { qs: "^6.11.0" };
const express2 = ["express@4.18.0", "", { dependencies: expressDependencies2 }, "sha512-y"];
test("parseBunLockGraph - skips malformed package entries", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "bun.lock"),
    bunLockContent({ express: express2, malformed: "not an entry array" }),
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

  assert.ok(graph?.["body-parser"]?.includes("express"));
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

  assert.ok(graph?.["body-parser"]?.includes("express"));
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

const packagesNodeModulesBodyParser = { version: "1.20.0" };
const packagesNodeModulesExpressDependencies = { "body-parser": "^1.20.0" };
const packagesNodeModulesExpress = {
  version: "4.18.0",
  dependencies: packagesNodeModulesExpressDependencies,
};
const packages8 = {};
const packages9 = {
  "": packages8,
  "node_modules/express": packagesNodeModulesExpress,
  "node_modules/body-parser": packagesNodeModulesBodyParser,
};
test("parseNpmLockGraph - returns inverted dep graph from package-lock.json v2", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 2, packages: packages9 }),
  );

  const graph = parseNpmLockGraph(lockTestDir);

  assert.ok(graph?.["body-parser"]?.includes("express"));
  rmSync(lockTestDir, { recursive: true, force: true });
});

const duplicateExpress418 = { version: "4.18.0" };
const duplicateExpress5Dependencies = { lodash: "^4.17.21" };
const duplicateExpress5 = { version: "5.0.0", dependencies: duplicateExpress5Dependencies };
const duplicateUniqueParentDependencies = { "unique-child": "^1.0.0" };
const duplicateUniqueParent = { version: "1.0.0", dependencies: duplicateUniqueParentDependencies };
const duplicateUniqueChild = { version: "1.0.0" };
const duplicateLodash = { version: "4.17.21" };
const duplicateNpmPackages = {
  "node_modules/express": duplicateExpress418,
  "node_modules/unique-parent": duplicateUniqueParent,
  "node_modules/unique-child": duplicateUniqueChild,
  "packages/pkg-a/node_modules/express": duplicateExpress5,
  "packages/pkg-a/node_modules/lodash": duplicateLodash,
};
const duplicatePnpmLock = [
  "lockfileVersion: 6.0",
  "packages:",
  "  /express@4.18.0:",
  "    resolution: {}",
  "  /express@5.0.0:",
  "    resolution: {}",
  "    dependencies:",
  "      lodash: 4.17.21",
  "  /lodash@4.17.21:",
  "    resolution: {}",
  "  /unique-parent@1.0.0:",
  "    resolution: {}",
  "    dependencies:",
  "      unique-child: 1.0.0",
  "  /unique-child@1.0.0:",
  "    resolution: {}",
].join("\n");
const duplicateYarnLock = [
  "express@^4.18.0:",
  '  version "4.18.0"',
  "",
  "express@^5.0.0:",
  '  version "5.0.0"',
  "  dependencies:",
  '    lodash "^4.17.21"',
  "",
  "lodash@^4.17.21:",
  '  version "4.17.21"',
  "",
  "unique-parent@^1.0.0:",
  '  version "1.0.0"',
  "  dependencies:",
  '    unique-child "^1.0.0"',
  "",
  "unique-child@^1.0.0:",
  '  version "1.0.0"',
].join("\n");
const duplicateBunEmptyMetadata = {};
const duplicateBunExpress5Metadata = { dependencies: duplicateExpress5Dependencies };
const duplicateBunUniqueParentMetadata = { dependencies: duplicateUniqueParentDependencies };
const duplicateBunExpress418Entry = ["express@4.18.0", "", duplicateBunEmptyMetadata];
const duplicateBunExpress5Entry = ["express@5.0.0", "", duplicateBunExpress5Metadata];
const duplicateBunLodashEntry = ["lodash@4.17.21", "", duplicateBunEmptyMetadata];
const duplicateBunUniqueParentEntry = ["unique-parent@1.0.0", "", duplicateBunUniqueParentMetadata];
const duplicateBunUniqueChildEntry = ["unique-child@1.0.0", "", duplicateBunEmptyMetadata];
const duplicateBunPackages = {
  "express@4.18.0": duplicateBunExpress418Entry,
  "express@5.0.0": duplicateBunExpress5Entry,
  "lodash@4.17.21": duplicateBunLodashEntry,
  "unique-parent@1.0.0": duplicateBunUniqueParentEntry,
  "unique-child@1.0.0": duplicateBunUniqueChildEntry,
};

const assertDuplicateLockGraph = (graph: Record<string, string[]> | undefined): void => {
  assert.strictEqual(graph?.lodash, undefined);
  assert.deepStrictEqual(graph?.["unique-child"], ["unique-parent"]);
};

test("lock graph parsers omit edges through duplicate package names", (t) => {
  mkdirSync(lockTestDir, { recursive: true });
  t.after(() => rmSync(lockTestDir, { recursive: true, force: true }));

  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 3, packages: duplicateNpmPackages }),
  );
  assertDuplicateLockGraph(parseNpmLockGraph(lockTestDir));

  writeFileSync(resolve(lockTestDir, "pnpm-lock.yaml"), duplicatePnpmLock);
  assertDuplicateLockGraph(parsePnpmLockGraph(lockTestDir));

  writeFileSync(resolve(lockTestDir, "yarn.lock"), duplicateYarnLock);
  assertDuplicateLockGraph(parseYarnLockGraph(lockTestDir));

  writeFileSync(resolve(lockTestDir, "bun.lock"), bunLockContent(duplicateBunPackages));
  assertDuplicateLockGraph(parseBunLockGraph(lockTestDir));
});

test("parseNpmLockGraph - returns undefined when no package-lock.json", () => {
  assert.strictEqual(parseNpmLockGraph(testDir), undefined);
});

const graph2 = {};
const packagesNodeModulesLodashDependencies = {};
const packagesNodeModulesLodash = {
  version: "4.17.21",
  dependencies: packagesNodeModulesLodashDependencies,
};
const packages6 = {};
const packages7 = { "": packages6, "node_modules/lodash": packagesNodeModulesLodash };
test("getDependencyGraph - marks a parsed graph with no edges as available", () => {
  clearDependencyGraphCache();
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 2, packages: packages7 }),
  );

  const status = getDependencyGraphStatus(lockTestDir);
  const graph = getDependencyGraph(lockTestDir);

  assert.deepStrictEqual(status, { graph: graph2, available: true });
  assert.strictEqual(graph, status.graph);
  const graphAgain = getDependencyGraph(lockTestDir);
  assert.strictEqual(graphAgain, graph);

  clearDependencyGraphCache();
  rmSync(lockTestDir, { recursive: true, force: true });
});

const nodeModulesQs = { version: "6.11.0" };
const nodeModulesLodashDependencies = { qs: "^6.11.0" };
const nodeModulesLodash = { version: "4.17.21", dependencies: nodeModulesLodashDependencies };
const packages2 = {};
const packages3 = {
  "": packages2,
  "node_modules/lodash": nodeModulesLodash,
  "node_modules/qs": nodeModulesQs,
};
const nodeModulesBodyParser = { version: "1.20.0" };
const nodeModulesExpressDependencies = { "body-parser": "^1.20.0" };
const nodeModulesExpress = { version: "4.18.0", dependencies: nodeModulesExpressDependencies };
const packages4 = {};
const packages5 = {
  "": packages4,
  "node_modules/express": nodeModulesExpress,
  "node_modules/body-parser": nodeModulesBodyParser,
};
test("getDependencyGraph - invalidates cache when package lock changes", () => {
  clearDependencyGraphCache();
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 2, packages: packages5 }),
  );

  const originalGraph = getDependencyGraph(lockTestDir);
  assert.deepStrictEqual(originalGraph?.["body-parser"], ["express"]);

  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 2, packages: packages3 }),
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

const bunStringValues = [",}", ",]", '\\",}', "\\\\", "line\n,}", 'quote",]', "\\u0022,}"];

bunStringValues.forEach((value) => {
  test(`parseBunLockTree - preserves string content ${JSON.stringify(value)}`, (t) => {
    mkdirSync(lockTestDir, { recursive: true });
    t.after(() => rmSync(lockTestDir, { recursive: true, force: true }));
    const reference = JSON.stringify(`example@${value}`);
    const content = `{"packages":{"example":[${reference}, "", {},],\r\n\t}, }`;
    writeFileSync(resolve(lockTestDir, "bun.lock"), content);

    assert.deepStrictEqual(parseBunLockTree(lockTestDir), { example: value });
  });
});

test("parseBunLockTree - rejects an unterminated string with many escaped quotes", (t) => {
  mkdirSync(lockTestDir, { recursive: true });
  t.after(() => rmSync(lockTestDir, { recursive: true, force: true }));
  const escapedQuotes = '\\"'.repeat(100_000);
  const content = `{"packages":{"example":["${escapedQuotes}\\`;
  writeFileSync(resolve(lockTestDir, "bun.lock"), content);

  assert.equal(parseBunLockTree(lockTestDir), undefined);
});

test("parseBunLockTree - rejects an unterminated string with repeated escapes", (t) => {
  mkdirSync(lockTestDir, { recursive: true });
  t.after(() => rmSync(lockTestDir, { recursive: true, force: true }));
  const backslash = String.fromCharCode(92);
  const repeatedEscapes = `!${backslash}`.repeat(100_000);
  const content = `{"packages":{"example":["${backslash}${repeatedEscapes}`;
  writeFileSync(resolve(lockTestDir, "bun.lock"), content);

  assert.equal(parseBunLockTree(lockTestDir), undefined);
});

test("parseBunLockGraph - returns undefined for malformed bun.lock", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(resolve(lockTestDir, "bun.lock"), "not valid json {{{");

  assert.strictEqual(parseBunLockGraph(lockTestDir), undefined);
  rmSync(lockTestDir, { recursive: true, force: true });
});

const lodash = { version: "4.17.21" };
const expressDependencies = { lodash };
const express = { version: "4.18.0", dependencies: expressDependencies };
const dependencies2 = { express };
test("parseNpmLockGraph - parses v1 dependencies format", () => {
  mkdirSync(lockTestDir, { recursive: true });
  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 1, dependencies: dependencies2 }),
  );

  const graph = parseNpmLockGraph(lockTestDir);

  assert.ok(graph?.["lodash"]?.includes("express"));
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

  assert.ok(graph?.["lodash"]?.includes("express"));
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
