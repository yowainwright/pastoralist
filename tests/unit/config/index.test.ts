import { test, expect } from "bun:test";
import { resolve } from "path";
import {
  validateConfig,
  safeValidateConfig,
} from "../../../src/config/constants";
import { loadConfig, loadExternalConfig, mergeConfigs } from "../../../src/config";
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
        dependents: { "app": "lodash@^4.17.0" },
      }
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
  expect(result.appendix?.["lodash@4.17.21"]?.dependents?.["pkg-a"]).toBeDefined();
  expect(result.appendix?.["lodash@4.17.21"]?.dependents?.["pkg-b"]).toBeDefined();
});
