import { test } from "node:test";
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
  safeExistsSync as existsSync,
  validateRootPackageJsonIntegrity,
} from "../setup";

const testDir = resolve(import.meta.dirname, "..", ".test-config");

test("validateConfig - should validate minimal valid config", () => {
  const config = {};
  const result = validateConfig(config);
  assert.deepStrictEqual(result, {});
});

test("validateConfig - should validate complete config", () => {
  const config = {
    appendix: {
      "lodash@4.17.21": {
        dependents: { app: "lodash@^4.17.0" },
      },
    },
    depPaths: ["packages/*/package.json"],
    security: {
      enabled: true,
      provider: "github",
    },
  };

  const result = validateConfig(config);
  assert.deepStrictEqual(result, config);
});

test("validateConfig - should throw on invalid security provider", () => {
  const config = {
    security: {
      provider: "invalid",
    },
  };

  assert.throws(() => validateConfig(config));
});

test("safeValidateConfig - should return undefined for invalid config", () => {
  const config = {
    security: {
      provider: "invalid",
    },
  };

  const result = safeValidateConfig(config);
  assert.strictEqual(result, undefined);
});

test("safeValidateConfig - should return parsed config for valid input", () => {
  const config = {
    depPaths: ["packages/*/package.json"],
  };

  const result = safeValidateConfig(config);
  assert.deepStrictEqual(result, config);
});

test("safeValidateConfig - should allow security strict config", () => {
  const config = {
    security: {
      enabled: true,
      strict: true,
    },
  };

  const result = safeValidateConfig(config);
  assert.deepStrictEqual(result, config);
});

test("loadConfig - should return undefined when no config", async () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const result = await loadConfig(testDir);
  assert.strictEqual(result, undefined);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("loadConfig - should load config from package.json", async () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const packageJsonConfig = {
    depPaths: ["packages/*/package.json"],
  };

  const result = await loadConfig(testDir, packageJsonConfig);
  assert.deepStrictEqual(result?.depPaths, ["packages/*/package.json"]);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("loadExternalConfig - should return undefined when file doesn't exist", async () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const result = await loadExternalConfig(testDir);
  assert.strictEqual(result, undefined);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("loadExternalConfig - should load JSON config file", async () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const configPath = resolve(testDir, ".pastoralistrc.json");
  const config = { depPaths: ["packages/*/package.json"] };
  writeFileSync(configPath, JSON.stringify(config));

  const result = await loadExternalConfig(testDir);
  assert.deepStrictEqual(result?.depPaths, ["packages/*/package.json"]);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("loadConfigWithSource - tracks a writable JSON appendix target", async () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(testDir, { recursive: true });
  const configPath = resolve(testDir, ".pastoralistrc.json");
  writeFileSync(configPath, JSON.stringify({ checkSecurity: false }));

  clearConfigCache();
  const loaded = await loadConfigWithSource(testDir);

  assert.deepStrictEqual(loaded.source, { format: "json", path: configPath });
  assert.deepStrictEqual(loaded.appendixTarget, { path: configPath });
  rmSync(testDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("loadConfigWithSource - merges an explicit target appendix", async () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(testDir, { recursive: true });
  const configPath = resolve(testDir, "ledger.json");
  const appendix = { "lodash@4.17.21": { dependents: { app: "lodash@^4" } } };
  writeFileSync(configPath, JSON.stringify({ appendix }));

  clearConfigCache();
  const loaded = await loadConfigWithSource(testDir, { appendixSource: "ledger.json" });

  assert.deepStrictEqual(loaded.appendixTarget, { path: configPath });
  assert.deepStrictEqual(loaded.config?.appendix, appendix);
  rmSync(testDir, { recursive: true, force: true });
  validateRootPackageJsonIntegrity();
});

test("loadCliConfig - uses source-aware config loading", async () => {
  const packageConfig = { name: "app", version: "1.0.0", pastoralist: {} };
  const deps: CliConfigDeps = {
    resolveJSON: () => packageConfig,
    buildMergedOptions: () => ({}),
    loadConfigWithSource: () =>
      Promise.resolve({
        appendixTarget: { path: "ledger.json" },
        config: {},
        source: undefined,
      }),
  };

  const loaded = await loadCliConfig({}, {}, deps);

  assert.deepStrictEqual(loaded.appendixTarget, { path: "ledger.json" });
  assert.deepStrictEqual(loaded.manifestConfig, packageConfig);
});

test("loadExternalConfig - should handle invalid JSON", async () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const configPath = resolve(testDir, ".pastoralistrc.json");
  writeFileSync(configPath, "{ invalid json");

  const result = await loadExternalConfig(testDir);
  assert.strictEqual(result, undefined);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("loadExternalConfig - stops after an invalid higher-priority config", async () => {
  validateRootPackageJsonIntegrity();
  mkdirSync(testDir, { recursive: true });
  const invalidConfigPath = resolve(testDir, ".pastoralistrc");
  writeFileSync(invalidConfigPath, JSON.stringify({ security: { provider: 42 } }));
  writeFileSync(
    resolve(testDir, ".pastoralistrc.json"),
    JSON.stringify({ depPaths: ["packages/*/package.json"] }),
  );
  const originalError = console.error;
  let errorOutput = "";
  console.error = (...args: unknown[]) => {
    errorOutput = args.map(String).join(" ");
  };

  try {
    const result = await loadExternalConfig(testDir);
    assert.strictEqual(result, undefined);
    assert.strictEqual(
      errorOutput,
      "Failed to load config from .pastoralistrc: Invalid config structure",
    );
  } finally {
    console.error = originalError;
    rmSync(testDir, { recursive: true, force: true });
    validateRootPackageJsonIntegrity();
  }
});

test("mergeConfigs - should merge two configs", () => {
  const base = {
    depPaths: ["packages/*/package.json"],
  };

  const override = {
    security: {
      enabled: true,
    },
  };

  const result = mergeConfigs(base, override);
  assert.deepStrictEqual(result.depPaths, ["packages/*/package.json"]);
  assert.strictEqual(result.security?.enabled, true);
});

test("mergeConfigs - should override base with override", () => {
  const base = {
    security: {
      enabled: false,
    },
  };

  const override = {
    security: {
      enabled: true,
    },
  };

  const result = mergeConfigs(base, override);
  assert.strictEqual(result.security?.enabled, true);
});

test("mergeConfigs - deep merges best-case search tuning", () => {
  const baseSearch = { exactStateLimit: 256, beamWidth: 16 };
  const baseBestCase = { enabled: true, riskAggregation: "both" as const, search: baseSearch };
  const base = { bestCase: baseBestCase };
  const overrideSearch = { beamWidth: 8, maxEvaluations: 500 };
  const override = { bestCase: { search: overrideSearch } };

  const result = mergeConfigs(base, override);

  const expectedSearch = { exactStateLimit: 256, beamWidth: 8, maxEvaluations: 500 };
  const expected = { enabled: true, riskAggregation: "both", search: expectedSearch };
  assert.deepStrictEqual(result?.bestCase, expected);
});

test("mergeConfigs - should deep merge appendix", () => {
  const base = {
    appendix: {
      "lodash@4.17.21": {
        dependents: { "pkg-a": "lodash@^4.17.0" },
      },
    },
  };

  const override = {
    appendix: {
      "lodash@4.17.21": {
        dependents: { "pkg-b": "lodash@^4.17.0" },
      },
    },
  };

  const result = mergeConfigs(base, override);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"]?.dependents?.["pkg-a"], undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"]?.dependents?.["pkg-b"], undefined);
});

test("clearConfigCache - clears the config cache", async () => {
  validateRootPackageJsonIntegrity();

  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const configPath = resolve(testDir, ".pastoralistrc.json");
  writeFileSync(configPath, JSON.stringify({ depPaths: ["test/*"] }));

  const config1 = await loadConfig(testDir);
  assert.notStrictEqual(config1, undefined);

  clearConfigCache();

  const config2 = await loadConfig(testDir);
  assert.notStrictEqual(config2, undefined);

  if (existsSync(configPath)) {
    rmSync(configPath);
  }

  validateRootPackageJsonIntegrity();
});

test("loadExternalConfig - loads JS config file", async () => {
  validateRootPackageJsonIntegrity();

  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const configPath = resolve(testDir, "pastoralist.config.js");

  if (existsSync(configPath)) {
    rmSync(configPath);
  }

  const configContent = `
    module.exports = {
      depPaths: ["packages/*/package.json"]
    };
  `;
  writeFileSync(configPath, configContent);

  clearConfigCache();
  const config = await loadExternalConfig(testDir);

  assert.notStrictEqual(config, undefined);
  assert.deepStrictEqual(config?.depPaths, ["packages/*/package.json"]);

  if (existsSync(configPath)) {
    rmSync(configPath);
  }

  validateRootPackageJsonIntegrity();
});

test("loadExternalConfig - loads JS CommonJS config after leading statements", async () => {
  validateRootPackageJsonIntegrity();

  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const configPath = resolve(testDir, "pastoralist.config.js");

  if (existsSync(configPath)) {
    rmSync(configPath);
  }

  const configContent = `
    "use strict";

    module.exports = {
      depPaths: ["packages/*/package.json"]
    };
  `;
  writeFileSync(configPath, configContent);

  clearConfigCache();
  const config = await loadExternalConfig(testDir);

  assert.notStrictEqual(config, undefined);
  assert.deepStrictEqual(config?.depPaths, ["packages/*/package.json"]);

  if (existsSync(configPath)) {
    rmSync(configPath);
  }

  validateRootPackageJsonIntegrity();
});

test("loadExternalConfig - ignores TypeScript config files", async () => {
  validateRootPackageJsonIntegrity();

  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const configPath = resolve(testDir, "pastoralist.config.ts");

  if (existsSync(configPath)) {
    rmSync(configPath);
  }

  const configContent = `
    import type { PastoralistConfig } from "pastoralist";

    const config: PastoralistConfig = {
      depPaths: ["packages/*/package.json"]
    };

    export default config;
  `;
  writeFileSync(configPath, configContent);

  clearConfigCache();
  const originalWarn = console.warn;
  const warnings: string[] = [];
  console.warn = (message: string) => {
    warnings[warnings.length] = message;
  };
  let config: Awaited<ReturnType<typeof loadExternalConfig>>;
  try {
    config = await loadExternalConfig(testDir);
  } finally {
    console.warn = originalWarn;
  }

  assert.strictEqual(config, undefined);
  assert.ok(warnings.join("\n").includes("pastoralist.config.ts is not supported"));

  if (existsSync(configPath)) {
    rmSync(configPath);
  }

  validateRootPackageJsonIntegrity();
});

test("loadExternalConfig - loads ESM config file", async () => {
  validateRootPackageJsonIntegrity();

  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const configPath = resolve(testDir, "pastoralist.config.mjs");

  if (existsSync(configPath)) {
    rmSync(configPath);
  }

  writeFileSync(configPath, `export default { depPaths: ["apps/*/package.json"] };\n`);

  clearConfigCache();
  const config = await loadExternalConfig(testDir);

  assert.notStrictEqual(config, undefined);
  assert.deepStrictEqual(config?.depPaths, ["apps/*/package.json"]);

  if (existsSync(configPath)) {
    rmSync(configPath);
  }

  validateRootPackageJsonIntegrity();
});

test("mergeConfigs - merges appendix entries with no overlap", () => {
  const external: PastoralistConfig = {
    appendix: {
      "lodash@4.17.21": {
        dependents: { app1: "lodash@^4.17.0" },
        patches: ["patches/lodash.patch"],
      },
    },
  };

  const packageJson: PastoralistConfig = {
    appendix: {
      "express@4.18.0": {
        dependents: { app2: "express@^4.18.0" },
      },
    },
  };

  const merged = mergeConfigs(external, packageJson);

  assert.notStrictEqual(merged?.appendix, undefined);
  assert.notStrictEqual(merged?.appendix?.["lodash@4.17.21"], undefined);
  assert.notStrictEqual(merged?.appendix?.["express@4.18.0"], undefined);
});

test("mergeConfigs - merges appendix entries when key exists in external but not with that field", () => {
  const external: PastoralistConfig = {
    appendix: {
      "lodash@4.17.21": {
        dependents: { app1: "lodash@^4.17.0" },
      },
    },
  };

  const packageJson: PastoralistConfig = {
    appendix: {
      "lodash@4.17.21": {
        dependents: { app2: "lodash@^4.17.0" },
        patches: ["patches/new.patch"],
      },
    },
  };

  const merged = mergeConfigs(external, packageJson);

  assert.deepStrictEqual(merged?.appendix?.["lodash@4.17.21"].dependents, {
    app1: "lodash@^4.17.0",
    app2: "lodash@^4.17.0",
  });
  assert.deepStrictEqual(merged?.appendix?.["lodash@4.17.21"].patches, ["patches/new.patch"]);
});

test("mergeConfigs - handles when external has no key and packageJson does", () => {
  const external: PastoralistConfig = {
    appendix: {},
  };

  const packageJson: PastoralistConfig = {
    appendix: {
      "react@18.0.0": {
        dependents: { frontend: "react@^18.0.0" },
      },
    },
  };

  const merged = mergeConfigs(external, packageJson);

  assert.notStrictEqual(merged?.appendix?.["react@18.0.0"], undefined);
  assert.deepStrictEqual(merged?.appendix?.["react@18.0.0"].dependents, {
    frontend: "react@^18.0.0",
  });
});
