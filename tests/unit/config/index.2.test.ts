import { test, expect } from "bun:test";
import { resolve } from "path";
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
        dependents: { "app1": "lodash@^4.17.0" },
        patches: ["patches/lodash.patch"],
      }
    }
  };

  const packageJson: PastoralistConfig = {
    appendix: {
      "express@4.18.0": {
        dependents: { "app2": "express@^4.18.0" },
      }
    }
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
        dependents: { "app1": "lodash@^4.17.0" },
      }
    }
  };

  const packageJson: PastoralistConfig = {
    appendix: {
      "lodash@4.17.21": {
        dependents: { "app2": "lodash@^4.17.0" },
        patches: ["patches/new.patch"],
      }
    }
  };

  const merged = mergeConfigs(external, packageJson);

  expect(merged?.appendix?.["lodash@4.17.21"].dependents).toEqual({
    "app1": "lodash@^4.17.0",
    "app2": "lodash@^4.17.0",
  });
  expect(merged?.appendix?.["lodash@4.17.21"].patches).toEqual(["patches/new.patch"]);
});

test("mergeConfigs - handles when external has no key and packageJson does", () => {
  const external: PastoralistConfig = {
    appendix: {}
  };

  const packageJson: PastoralistConfig = {
    appendix: {
      "react@18.0.0": {
        dependents: { "frontend": "react@^18.0.0" },
      }
    }
  };

  const merged = mergeConfigs(external, packageJson);

  expect(merged?.appendix?.["react@18.0.0"]).toBeDefined();
  expect(merged?.appendix?.["react@18.0.0"].dependents).toEqual({
    "frontend": "react@^18.0.0"
  });
});
