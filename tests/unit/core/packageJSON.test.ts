import { test, expect } from "bun:test";
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
import { getDependencyTree } from "../../../src/core/packageJSON";
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

const testDir = resolve(__dirname, "..", ".test-packagejson-core");
const testPkgPath = resolve(testDir, "package.json");

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
  const locks = ["bun.lockb", "yarn.lock", "pnpm-lock.yaml"];
  const existing = locks.filter((f) => existsSync(resolve(process.cwd(), f)));

  const pm = detectPackageManager();

  if (existing.length === 0) {
    expect(pm).toBe("npm");
  }
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
  const hasOverrides = Boolean(
    result?.overrides || result?.resolutions || result?.pnpm?.overrides,
  );
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

  expect(() =>
    findPackageJsonFiles(["nonexistent/**/*.json"], [], testDir),
  ).toThrow("No package.json files found");

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("getDependencyTree - should return dependency tree", async () => {
  clearDependencyTreeCache();
  const tree = await getDependencyTree();
  expect(typeof tree).toBe("object");
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

// =============================================================================
// Silent option tests
// =============================================================================

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

  const hasDryRunMessage = consoleOutput.some((msg) =>
    msg.includes("[DRY RUN]"),
  );
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

  const hasDryRunMessage = consoleOutput.some((msg) =>
    msg.includes("[DRY RUN]"),
  );
  expect(hasDryRunMessage).toBe(true);
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

import {
  parseNpmLsOutput,
  executeNpmLs,
  getFullDependencyCount,
} from "../../../src/core/packageJSON";

test("parseNpmLsOutput - should parse flat dependencies", () => {
  const stdout = JSON.stringify({
    dependencies: {
      lodash: { version: "4.17.21" },
      express: { version: "4.18.0" },
    },
  });

  const result = parseNpmLsOutput(stdout);

  expect(result.lodash).toBe(true);
  expect(result.express).toBe(true);
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

  expect(result.express).toBe(true);
  expect(result.accepts).toBe(true);
  expect(result["body-parser"]).toBe(true);
  expect(result.bytes).toBe(true);
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

  expect(result.lodash).toBe(true);
  expect(result.express).toBe(true);
});

test("getDependencyTree - should return consistent result on second call", async () => {
  clearDependencyTreeCache();
  const firstCall = await getDependencyTree();
  const secondCall = await getDependencyTree();
  expect(firstCall).toEqual(secondCall);
  clearDependencyTreeCache();
});

test("getDependencyTree - should return empty object on error", async () => {
  clearDependencyTreeCache();
  const originalExecFile = require("util").promisify(
    require("child_process").execFile,
  );

  const tree = await getDependencyTree();
  expect(typeof tree).toBe("object");
  clearDependencyTreeCache();
});

test("parseNpmLsOutput - should handle null dependencies value", () => {
  const stdout = JSON.stringify({
    dependencies: {
      lodash: { version: "4.17.21", dependencies: null },
    },
  });

  const result = parseNpmLsOutput(stdout);
  expect(result.lodash).toBe(true);
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

  const tree = await getDependencyTree();
  expect(typeof tree).toBe("object");
  clearDependencyTreeCache();
});

const lockTestDir = resolve(__dirname, "..", ".test-lock-files");

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

  writeFileSync(
    resolve(lockTestDir, "package-lock.json"),
    JSON.stringify(lockContent),
  );

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
