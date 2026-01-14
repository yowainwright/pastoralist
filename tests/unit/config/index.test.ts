import { test, expect } from "bun:test";
import { resolve } from "path";
import {
  validateConfig,
  safeValidateConfig,
} from "../../../src/config/constants";
import {
  loadConfig,
  loadExternalConfig,
  mergeConfigs,
  clearConfigCache,
} from "../../../src/config";
import type { PastoralistConfig } from "../../../src/config";
import {
  safeWriteFileSync as writeFileSync,
  safeMkdirSync as mkdirSync,
  safeRmSync as rmSync,
  safeExistsSync as existsSync,
  validateRootPackageJsonIntegrity,
} from "../setup";

const testDir = resolve(__dirname, "..", ".test-config");

test("validateConfig - should validate minimal valid config", () => {
  const config = {};
  const result = validateConfig(config);
  expect(result).toEqual({});
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
  expect(result).toEqual(config);
});

test("validateConfig - should throw on invalid security provider", () => {
  const config = {
    security: {
      provider: "invalid",
    },
  };

  expect(() => validateConfig(config)).toThrow();
});

test("safeValidateConfig - should return undefined for invalid config", () => {
  const config = {
    security: {
      provider: "invalid",
    },
  };

  const result = safeValidateConfig(config);
  expect(result).toBeUndefined();
});

test("safeValidateConfig - should return parsed config for valid input", () => {
  const config = {
    depPaths: ["packages/*/package.json"],
  };

  const result = safeValidateConfig(config);
  expect(result).toEqual(config);
});

test("loadConfig - should return undefined when no config", async () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const result = await loadConfig(testDir);
  expect(result).toBeUndefined();

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
  expect(result?.depPaths).toEqual(["packages/*/package.json"]);

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
  expect(result).toBeUndefined();

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
  expect(result?.depPaths).toEqual(["packages/*/package.json"]);

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
});

test("loadExternalConfig - should handle invalid JSON", async () => {
  validateRootPackageJsonIntegrity();
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const configPath = resolve(testDir, ".pastoralistrc.json");
  writeFileSync(configPath, "{ invalid json");

  const result = await loadExternalConfig(testDir);
  expect(result).toBeUndefined();

  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  validateRootPackageJsonIntegrity();
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
  expect(result.depPaths).toEqual(["packages/*/package.json"]);
  expect(result.security?.enabled).toBe(true);
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
  expect(result.security?.enabled).toBe(true);
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
  expect(
    result.appendix?.["lodash@4.17.21"]?.dependents?.["pkg-a"],
  ).toBeDefined();
  expect(
    result.appendix?.["lodash@4.17.21"]?.dependents?.["pkg-b"],
  ).toBeDefined();
});

test("clearConfigCache - clears the config cache", async () => {
  validateRootPackageJsonIntegrity();

  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const configPath = resolve(testDir, ".pastoralistrc.json");
  writeFileSync(configPath, JSON.stringify({ depPaths: ["test/*"] }));

  const config1 = await loadConfig(testDir);
  expect(config1).toBeDefined();

  clearConfigCache();

  const config2 = await loadConfig(testDir);
  expect(config2).toBeDefined();

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

  expect(config).toBeDefined();
  expect(config?.depPaths).toEqual(["packages/*/package.json"]);

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

  expect(merged?.appendix).toBeDefined();
  expect(merged?.appendix?.["lodash@4.17.21"]).toBeDefined();
  expect(merged?.appendix?.["express@4.18.0"]).toBeDefined();
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

  expect(merged?.appendix?.["lodash@4.17.21"].dependents).toEqual({
    app1: "lodash@^4.17.0",
    app2: "lodash@^4.17.0",
  });
  expect(merged?.appendix?.["lodash@4.17.21"].patches).toEqual([
    "patches/new.patch",
  ]);
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

  expect(merged?.appendix?.["react@18.0.0"]).toBeDefined();
  expect(merged?.appendix?.["react@18.0.0"].dependents).toEqual({
    frontend: "react@^18.0.0",
  });
});
