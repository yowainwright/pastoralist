import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "path";
import {
  loadConfig,
  loadCliConfig,
  loadConfigWithSource,
  loadExternalConfig,
  mergeConfigs,
  clearConfigCache,
  validateConfig,
  safeValidateConfig,
} from "../../../src/config";
import type { PastoralistConfig } from "../../../src/config";
import type { CliConfigDeps } from "../../../src/cli/types";
import {
  safeWriteFileSync as writeFileSync,
  safeMkdirSync as mkdirSync,
  safeRmSync as rmSync,
  validateRootPackageJsonIntegrity,
} from "../setup";

const testDir = resolve(import.meta.dirname, "..", ".test-config");

const PACKAGE_DEP_PATHS = ["packages/*/package.json"];
const APP_DEP_PATHS = ["apps/*/package.json"];
const TEST_DEP_PATHS = ["test/*"];
const DEP_PATHS_CONFIG = { depPaths: PACKAGE_DEP_PATHS };

const prepareTestDir = (): void => {
  validateRootPackageJsonIntegrity();
  clearConfigCache();
  mkdirSync(testDir, { recursive: true });
};

const cleanupTestDir = (): void => {
  rmSync(testDir, { recursive: true, force: true });
  clearConfigCache();
  validateRootPackageJsonIntegrity();
};

const withTestDir = async (run: () => Promise<void>): Promise<void> => {
  prepareTestDir();
  try {
    await run();
  } finally {
    cleanupTestDir();
  }
};

const writeConfigFile = (filename: string, content: string): string => {
  const path = resolve(testDir, filename);
  writeFileSync(path, content);
  return path;
};

const loadWrittenConfig = async (filename: string, content: string) => {
  writeConfigFile(filename, content);
  clearConfigCache();
  const config = await loadExternalConfig(testDir);
  return config;
};

test("validateConfig - should validate minimal valid config", () => {
  const config = {};
  const result = validateConfig(config);
  assert.deepStrictEqual(result, {});
});

const LODASH_APP_DEPENDENTS = { app: "lodash@^4.17.0" };
const LODASH_APP_ENTRY = { dependents: LODASH_APP_DEPENDENTS };
const LODASH_APP_APPENDIX = { "lodash@4.17.21": LODASH_APP_ENTRY };
const GITHUB_SECURITY = { enabled: true, provider: "github" };
const COMPLETE_CONFIG = {
  appendix: LODASH_APP_APPENDIX,
  depPaths: PACKAGE_DEP_PATHS,
  security: GITHUB_SECURITY,
};

test("validateConfig - should validate complete config", () => {
  const result = validateConfig(COMPLETE_CONFIG);
  assert.deepStrictEqual(result, COMPLETE_CONFIG);
});

const INVALID_PROVIDER_SECURITY = { provider: "invalid" };
const INVALID_PROVIDER_CONFIG = { security: INVALID_PROVIDER_SECURITY };

test("validateConfig - should throw on invalid security provider", () => {
  assert.throws(() => validateConfig(INVALID_PROVIDER_CONFIG));
});

test("safeValidateConfig - should return undefined for invalid config", () => {
  const result = safeValidateConfig(INVALID_PROVIDER_CONFIG);
  assert.strictEqual(result, undefined);
});

test("safeValidateConfig - should return parsed config for valid input", () => {
  const result = safeValidateConfig(DEP_PATHS_CONFIG);
  assert.deepStrictEqual(result, DEP_PATHS_CONFIG);
});

const STRICT_SECURITY = { enabled: true, strict: true };
const STRICT_SECURITY_CONFIG = { security: STRICT_SECURITY };

test("safeValidateConfig - should allow security strict config", () => {
  const result = safeValidateConfig(STRICT_SECURITY_CONFIG);
  assert.deepStrictEqual(result, STRICT_SECURITY_CONFIG);
});

test("loadConfig - should return undefined when no config", async () => {
  await withTestDir(async () => {
    const result = await loadConfig(testDir);
    assert.strictEqual(result, undefined);
  });
});

test("loadConfig - should load config from package.json", async () => {
  await withTestDir(async () => {
    const result = await loadConfig(testDir, DEP_PATHS_CONFIG);
    assert.deepStrictEqual(result?.depPaths, PACKAGE_DEP_PATHS);
  });
});

test("loadExternalConfig - should return undefined when file doesn't exist", async () => {
  await withTestDir(async () => {
    const result = await loadExternalConfig(testDir);
    assert.strictEqual(result, undefined);
  });
});

test("loadExternalConfig - should load JSON config file", async () => {
  await withTestDir(async () => {
    writeConfigFile(".pastoralistrc.json", JSON.stringify(DEP_PATHS_CONFIG));
    const result = await loadExternalConfig(testDir);
    assert.deepStrictEqual(result?.depPaths, PACKAGE_DEP_PATHS);
  });
});

test("loadExternalConfig - returns empty config for non-object file when not validating", async () => {
  await withTestDir(async () => {
    writeConfigFile(".pastoralistrc.json", "[]");
    const result = await loadExternalConfig(testDir, false);
    assert.deepStrictEqual(result, {});
  });
});

test("loadConfigWithSource - tracks a writable JSON appendix target", async () => {
  await withTestDir(async () => {
    const configPath = writeConfigFile(".pastoralistrc.json", '{ "checkSecurity": false }');
    const loaded = await loadConfigWithSource(testDir);
    assert.deepStrictEqual(loaded.source, { format: "json", path: configPath });
    assert.deepStrictEqual(loaded.appendixTarget, { path: configPath });
  });
});

const LEDGER_DEPENDENTS = { app: "lodash@^4" };
const LEDGER_ENTRY = { dependents: LEDGER_DEPENDENTS };
const LEDGER_APPENDIX = { "lodash@4.17.21": LEDGER_ENTRY };
const LEDGER_CONFIG = { appendix: LEDGER_APPENDIX };

test("loadConfigWithSource - merges an explicit target appendix", async () => {
  await withTestDir(async () => {
    const configPath = writeConfigFile("ledger.json", JSON.stringify(LEDGER_CONFIG));
    const loaded = await loadConfigWithSource(testDir, { appendixSource: "ledger.json" });
    assert.deepStrictEqual(loaded.appendixTarget, { path: configPath });
    assert.deepStrictEqual(loaded.config?.appendix, LEDGER_APPENDIX);
  });
});

const EMPTY_PASTORALIST = {};
const CLI_PACKAGE_CONFIG = { name: "app", version: "1.0.0", pastoralist: EMPTY_PASTORALIST };
const LEDGER_TARGET = { path: "ledger.json" };
const EMPTY_CONFIG: PastoralistConfig = {};
const CLI_LOADED_CONFIG = {
  appendixTarget: LEDGER_TARGET,
  config: EMPTY_CONFIG,
  source: undefined,
};
const CLI_CONFIG_DEPS: CliConfigDeps = {
  resolveJSON: () => CLI_PACKAGE_CONFIG,
  buildMergedOptions: () => ({}),
  loadConfigWithSource: () => Promise.resolve(CLI_LOADED_CONFIG),
};

test("loadCliConfig - uses source-aware config loading", async () => {
  const loaded = await loadCliConfig({}, {}, CLI_CONFIG_DEPS);
  assert.deepStrictEqual(loaded.appendixTarget, LEDGER_TARGET);
  assert.deepStrictEqual(loaded.manifestConfig, CLI_PACKAGE_CONFIG);
});

test("loadExternalConfig - should handle invalid JSON", async () => {
  await withTestDir(async () => {
    writeConfigFile(".pastoralistrc.json", "{ invalid json");
    const result = await loadExternalConfig(testDir);
    assert.strictEqual(result, undefined);
  });
});

const NUMERIC_PROVIDER_SECURITY = { provider: 42 };
const NUMERIC_PROVIDER_CONFIG = { security: NUMERIC_PROVIDER_SECURITY };
const INVALID_STRUCTURE_ERROR =
  "Failed to load config from .pastoralistrc: Invalid config structure";

const assertStopsAfterInvalidConfig = async (): Promise<void> => {
  writeConfigFile(".pastoralistrc", JSON.stringify(NUMERIC_PROVIDER_CONFIG));
  writeConfigFile(".pastoralistrc.json", JSON.stringify(DEP_PATHS_CONFIG));
  const errorSpy = mock.method(console, "error", () => {});
  try {
    const result = await loadExternalConfig(testDir);
    const lastCall = errorSpy.mock.calls.at(-1);
    const errorOutput = lastCall?.arguments.map(String).join(" ");
    assert.strictEqual(result, undefined);
    assert.strictEqual(errorOutput, INVALID_STRUCTURE_ERROR);
  } finally {
    errorSpy.mock.restore();
  }
};

test("loadExternalConfig - stops after an invalid higher-priority config", async () => {
  await withTestDir(assertStopsAfterInvalidConfig);
});

const ENABLED_SECURITY = { enabled: true };
const DISABLED_SECURITY = { enabled: false };
const ENABLED_SECURITY_CONFIG = { security: ENABLED_SECURITY };
const DISABLED_SECURITY_CONFIG = { security: DISABLED_SECURITY };

test("mergeConfigs - should merge two configs", () => {
  const result = mergeConfigs(DEP_PATHS_CONFIG, ENABLED_SECURITY_CONFIG);
  assert.deepStrictEqual(result.depPaths, PACKAGE_DEP_PATHS);
  assert.strictEqual(result.security?.enabled, true);
});

test("mergeConfigs - should override base with override", () => {
  const result = mergeConfigs(DISABLED_SECURITY_CONFIG, ENABLED_SECURITY_CONFIG);
  assert.strictEqual(result.security?.enabled, true);
});

test("mergeConfigs - deep merges best-case search tuning", () => {
  const baseSearch = { exactStateLimit: 256, beamWidth: 16 };
  const riskAggregation = "both" as const;
  const baseBestCase = { enabled: true, riskAggregation, search: baseSearch };
  const base = { bestCase: baseBestCase };
  const overrideSearch = { beamWidth: 8, maxEvaluations: 500 };
  const overrideBestCase = { search: overrideSearch };
  const override = { bestCase: overrideBestCase };

  const result = mergeConfigs(base, override);

  const expectedSearch = { exactStateLimit: 256, beamWidth: 8, maxEvaluations: 500 };
  const expected = { enabled: true, riskAggregation: "both", search: expectedSearch };
  assert.deepStrictEqual(result?.bestCase, expected);
});

const PKG_A_DEPENDENTS = { "pkg-a": "lodash@^4.17.0" };
const PKG_B_DEPENDENTS = { "pkg-b": "lodash@^4.17.0" };
const PKG_A_ENTRY = { dependents: PKG_A_DEPENDENTS };
const PKG_B_ENTRY = { dependents: PKG_B_DEPENDENTS };
const PKG_A_APPENDIX = { "lodash@4.17.21": PKG_A_ENTRY };
const PKG_B_APPENDIX = { "lodash@4.17.21": PKG_B_ENTRY };
const PKG_A_CONFIG = { appendix: PKG_A_APPENDIX };
const PKG_B_CONFIG = { appendix: PKG_B_APPENDIX };

test("mergeConfigs - should deep merge appendix", () => {
  const result = mergeConfigs(PKG_A_CONFIG, PKG_B_CONFIG);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"]?.dependents?.["pkg-a"], undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"]?.dependents?.["pkg-b"], undefined);
});

const TEST_DEP_PATHS_CONFIG = { depPaths: TEST_DEP_PATHS };

test("clearConfigCache - clears the config cache", async () => {
  await withTestDir(async () => {
    writeConfigFile(".pastoralistrc.json", JSON.stringify(TEST_DEP_PATHS_CONFIG));
    const config1 = await loadConfig(testDir);
    assert.notStrictEqual(config1, undefined);
    clearConfigCache();
    const config2 = await loadConfig(testDir);
    assert.notStrictEqual(config2, undefined);
  });
});

const CJS_CONFIG = `
    module.exports = {
      depPaths: ["packages/*/package.json"]
    };
  `;

test("loadExternalConfig - loads JS config file", async () => {
  await withTestDir(async () => {
    const config = await loadWrittenConfig("pastoralist.config.js", CJS_CONFIG);
    assert.notStrictEqual(config, undefined);
    assert.deepStrictEqual(config?.depPaths, PACKAGE_DEP_PATHS);
  });
});

const CJS_CONFIG_WITH_LEADING_STATEMENT = `
    "use strict";

    module.exports = {
      depPaths: ["packages/*/package.json"]
    };
  `;

test("loadExternalConfig - loads JS CommonJS config after leading statements", async () => {
  await withTestDir(async () => {
    const filename = "pastoralist.config.js";
    const config = await loadWrittenConfig(filename, CJS_CONFIG_WITH_LEADING_STATEMENT);
    assert.notStrictEqual(config, undefined);
    assert.deepStrictEqual(config?.depPaths, PACKAGE_DEP_PATHS);
  });
});

const TS_CONFIG = `
    import type { PastoralistConfig } from "pastoralist";

    const config: PastoralistConfig = {
      depPaths: ["packages/*/package.json"]
    };

    export default config;
  `;

const assertIgnoresTypeScriptConfig = async (): Promise<void> => {
  const warnSpy = mock.method(console, "warn", () => {});
  try {
    const config = await loadWrittenConfig("pastoralist.config.ts", TS_CONFIG);
    const warnings = warnSpy.mock.calls.map((call) => String(call.arguments[0])).join("\n");
    assert.strictEqual(config, undefined);
    assert.ok(warnings.includes("pastoralist.config.ts is not supported"));
  } finally {
    warnSpy.mock.restore();
  }
};

test("loadExternalConfig - ignores TypeScript config files", async () => {
  await withTestDir(assertIgnoresTypeScriptConfig);
});

const ESM_CONFIG = `export default { depPaths: ["apps/*/package.json"] };\n`;

test("loadExternalConfig - loads ESM config file", async () => {
  await withTestDir(async () => {
    const config = await loadWrittenConfig("pastoralist.config.mjs", ESM_CONFIG);
    assert.notStrictEqual(config, undefined);
    assert.deepStrictEqual(config?.depPaths, APP_DEP_PATHS);
  });
});

const LODASH_APP1_DEPENDENTS = { app1: "lodash@^4.17.0" };
const LODASH_PATCHES = ["patches/lodash.patch"];
const LODASH_PATCHED_ENTRY = { dependents: LODASH_APP1_DEPENDENTS, patches: LODASH_PATCHES };
const LODASH_PATCHED_APPENDIX = { "lodash@4.17.21": LODASH_PATCHED_ENTRY };
const EXPRESS_DEPENDENTS = { app2: "express@^4.18.0" };
const EXPRESS_ENTRY = { dependents: EXPRESS_DEPENDENTS };
const EXPRESS_APPENDIX = { "express@4.18.0": EXPRESS_ENTRY };

test("mergeConfigs - merges appendix entries with no overlap", () => {
  const external: PastoralistConfig = { appendix: LODASH_PATCHED_APPENDIX };
  const packageJson: PastoralistConfig = { appendix: EXPRESS_APPENDIX };

  const merged = mergeConfigs(external, packageJson);

  assert.notStrictEqual(merged?.appendix, undefined);
  assert.notStrictEqual(merged?.appendix?.["lodash@4.17.21"], undefined);
  assert.notStrictEqual(merged?.appendix?.["express@4.18.0"], undefined);
});

const LODASH_APP1_ENTRY = { dependents: LODASH_APP1_DEPENDENTS };
const LODASH_APP1_APPENDIX = { "lodash@4.17.21": LODASH_APP1_ENTRY };
const LODASH_APP2_DEPENDENTS = { app2: "lodash@^4.17.0" };
const NEW_PATCHES = ["patches/new.patch"];
const LODASH_APP2_ENTRY = { dependents: LODASH_APP2_DEPENDENTS, patches: NEW_PATCHES };
const LODASH_APP2_APPENDIX = { "lodash@4.17.21": LODASH_APP2_ENTRY };
const MERGED_LODASH_DEPENDENTS = { app1: "lodash@^4.17.0", app2: "lodash@^4.17.0" };

test("mergeConfigs - merges appendix entries when key exists in external but not with that field", () => {
  const external: PastoralistConfig = { appendix: LODASH_APP1_APPENDIX };
  const packageJson: PastoralistConfig = { appendix: LODASH_APP2_APPENDIX };

  const merged = mergeConfigs(external, packageJson);

  const lodashEntry = merged?.appendix?.["lodash@4.17.21"];
  assert.deepStrictEqual(lodashEntry?.dependents, MERGED_LODASH_DEPENDENTS);
  assert.deepStrictEqual(lodashEntry?.patches, NEW_PATCHES);
});

const EMPTY_APPENDIX = {};
const REACT_DEPENDENTS = { frontend: "react@^18.0.0" };
const REACT_ENTRY = { dependents: REACT_DEPENDENTS };
const REACT_APPENDIX = { "react@18.0.0": REACT_ENTRY };

test("mergeConfigs - handles when external has no key and packageJson does", () => {
  const external: PastoralistConfig = { appendix: EMPTY_APPENDIX };
  const packageJson: PastoralistConfig = { appendix: REACT_APPENDIX };

  const merged = mergeConfigs(external, packageJson);

  assert.notStrictEqual(merged?.appendix?.["react@18.0.0"], undefined);
  assert.deepStrictEqual(merged?.appendix?.["react@18.0.0"].dependents, REACT_DEPENDENTS);
});
