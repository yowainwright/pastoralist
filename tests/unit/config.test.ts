process.env.DEBUG = "true";

import assert from "assert";
import fs from "fs";
import path from "path";
import {
  validateConfig,
  safeValidateConfig,
  PastoralistConfig,
  SecurityProvider,
  SeverityThreshold,
} from "../../src/config/index";
import { loadConfig, loadExternalConfig, mergeConfigs } from "../../src/config/loader";
import { updatePackageJSON, updateAppendix } from "../../src/api";
import { PastoralistJSON, Appendix } from "../../src/interfaces";

function describe(description: string, fn: () => void): void;
function describe(description: string, fn: () => Promise<void>): void;
function describe(description: string, fn: any): void {
  console.log(`\n${description}`);
  fn();
}

function it(testDescription: string, fn: () => void): void;
function it(testDescription: string, fn: () => Promise<void>): void;
function it(testDescription: string, fn: any): void {
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

describe("Config Validation", () => {
  it("should validate minimal valid config", () => {
    const config = {};
    const result = validateConfig(config);
    assert.deepStrictEqual(result, {});
  });

  it("should validate complete config with all optional properties", () => {
    const config: PastoralistConfig = {
      appendix: {
        "lodash@4.17.21": {
          rootDeps: ["app"],
          dependents: { "app": "lodash@^4.17.0" },
          patches: ["patches/lodash+4.17.21.patch"],
          ledger: {
            addedDate: "2023-01-01T00:00:00.000Z",
            reason: "Security fix",
            securityChecked: true,
            securityCheckDate: "2023-01-01T00:00:00.000Z",
            securityProvider: "osv"
          }
        }
      },
      depPaths: ["packages/*/package.json"],
      checkSecurity: true,
      overridePaths: {
        "workspace-a": {
          "axios@1.0.0": {
            dependents: { "workspace-a": "axios@^0.27.0" }
          }
        }
      },
      resolutionPaths: {
        "workspace-b": {
          "react@18.2.0": {
            dependents: { "workspace-b": "react@^18.0.0" }
          }
        }
      },
      security: {
        enabled: true,
        provider: "github",
        autoFix: false,
        interactive: true,
        securityProviderToken: "token",
        severityThreshold: "high",
        excludePackages: ["dev-package"],
        hasWorkspaceSecurityChecks: true
      }
    };

    const result = validateConfig(config);
    assert.deepStrictEqual(result, config);
  });

  it("should validate config with nested security settings", () => {
    const config = {
      security: {
        enabled: true,
        provider: "snyk" as SecurityProvider,
        severityThreshold: "critical" as SeverityThreshold,
        excludePackages: ["test-package"]
      }
    };

    const result = validateConfig(config);
    assert.deepStrictEqual(result.security, config.security);
  });

  it("should validate config with different depPaths formats", () => {
    const workspaceConfig = { depPaths: "workspace" };
    const workspacesConfig = { depPaths: "workspaces" };
    const arrayConfig = { depPaths: ["apps/*/package.json", "packages/*/package.json"] };

    assert.strictEqual(validateConfig(workspaceConfig).depPaths, "workspace");
    assert.strictEqual(validateConfig(workspacesConfig).depPaths, "workspaces");
    assert.deepStrictEqual(validateConfig(arrayConfig).depPaths, arrayConfig.depPaths);
  });

  it("should throw on invalid security provider enum", () => {
    const config = {
      security: {
        provider: "invalid-provider"
      }
    };

    assert.throws(() => validateConfig(config));
  });

  it("should throw on invalid severity threshold", () => {
    const config = {
      security: {
        severityThreshold: "invalid-threshold"
      }
    };

    assert.throws(() => validateConfig(config));
  });

  it("should throw on malformed appendix structure", () => {
    const config = {
      appendix: {
        "invalid-key": {
          ledger: {
            addedDate: "not-a-date",
            securityProvider: "invalid-provider"
          }
        }
      }
    };

    assert.throws(() => validateConfig(config));
  });

  it("should return undefined for invalid config with safeValidateConfig", () => {
    const config = {
      security: {
        provider: "invalid-provider"
      }
    };

    const result = safeValidateConfig(config);
    assert.strictEqual(result, undefined);
  });

  it("should return parsed config for valid input with safeValidateConfig", () => {
    const config = {
      security: {
        enabled: true,
        provider: "npm"
      }
    };

    const result = safeValidateConfig(config);
    assert.deepStrictEqual(result, config);
  });
});

describe("Config Loading", () => {

  it("should load JSON config files", async () => {
    const tempDirJson = "/tmp/pastoralist-test-config-json";
    if (!fs.existsSync(tempDirJson)) {
      fs.mkdirSync(tempDirJson, { recursive: true });
    }
    const configPath = path.join(tempDirJson, ".pastoralistrc.json");
    const config = { security: { enabled: true } };
    fs.writeFileSync(configPath, JSON.stringify(config));

    const result = await loadExternalConfig(tempDirJson);
    assert.deepStrictEqual(result, config);
    
    if (fs.existsSync(tempDirJson)) {
      fs.rmSync(tempDirJson, { recursive: true, force: true });
    }
  });

  it("should load JS config files with default export", async () => {
    const tempDirJs = "/tmp/pastoralist-test-config-js";
    if (!fs.existsSync(tempDirJs)) {
      fs.mkdirSync(tempDirJs, { recursive: true });
    }
    const configPath = path.join(tempDirJs, "pastoralist.config.js");
    const config = { security: { provider: "github" } };
    fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config)};`);

    const result = await loadExternalConfig(tempDirJs);
    assert.deepStrictEqual(result, config);
    
    if (fs.existsSync(tempDirJs)) {
      fs.rmSync(tempDirJs, { recursive: true, force: true });
    }
  });

  it("should handle missing config files gracefully", async () => {
    const result = await loadExternalConfig("/nonexistent/directory");
    assert.strictEqual(result, undefined);
  });

  it("should handle malformed JSON files", async () => {
    const tempDirMalformed = "/tmp/pastoralist-test-config-malformed";
    if (!fs.existsSync(tempDirMalformed)) {
      fs.mkdirSync(tempDirMalformed, { recursive: true });
    }
    const configPath = path.join(tempDirMalformed, ".pastoralistrc.json");
    fs.writeFileSync(configPath, "{ invalid json }");

    const result = await loadExternalConfig(tempDirMalformed);
    assert.strictEqual(result, undefined);
    
    if (fs.existsSync(tempDirMalformed)) {
      fs.rmSync(tempDirMalformed, { recursive: true, force: true });
    }
  });

  it("should respect CONFIG_FILES precedence order", async () => {
    const tempDirPrec = "/tmp/pastoralist-test-config-precedence";
    if (!fs.existsSync(tempDirPrec)) {
      fs.mkdirSync(tempDirPrec, { recursive: true });
    }
    const rcConfig = { security: { provider: "osv" } };
    const jsonConfig = { security: { provider: "github" } };
    
    fs.writeFileSync(path.join(tempDirPrec, ".pastoralistrc"), JSON.stringify(rcConfig));
    fs.writeFileSync(path.join(tempDirPrec, ".pastoralistrc.json"), JSON.stringify(jsonConfig));

    const result = await loadExternalConfig(tempDirPrec);
    assert.deepStrictEqual(result, rcConfig);
    
    if (fs.existsSync(tempDirPrec)) {
      fs.rmSync(tempDirPrec, { recursive: true, force: true });
    }
  });

  it("should merge external and package.json configs", async () => {
    const tempDirMerge = "/tmp/pastoralist-test-config-merge";
    if (!fs.existsSync(tempDirMerge)) {
      fs.mkdirSync(tempDirMerge, { recursive: true });
    }
    const configPath = path.join(tempDirMerge, ".pastoralistrc.json");
    const externalConfig = { security: { enabled: true } };
    const packageJsonConfig = { depPaths: ["packages/*/package.json"] };
    
    fs.writeFileSync(configPath, JSON.stringify(externalConfig));

    const result = await loadConfig(tempDirMerge, packageJsonConfig);
    assert.deepStrictEqual(result, {
      ...externalConfig,
      ...packageJsonConfig,
      appendix: undefined,
      overridePaths: {},
      resolutionPaths: {},
      security: externalConfig.security
    });
    
    if (fs.existsSync(tempDirMerge)) {
      fs.rmSync(tempDirMerge, { recursive: true, force: true });
    }
  });
});

describe("Config Merging", () => {
  it("should merge external and package.json configs", () => {
    const external = { security: { enabled: true } };
    const packageJson = { depPaths: ["apps/*/package.json"] };

    const result = mergeConfigs(external, packageJson);

    assert.deepStrictEqual(result, {
      security: { enabled: true },
      depPaths: ["apps/*/package.json"],
      appendix: undefined,
      overridePaths: {},
      resolutionPaths: {}
    });
  });

  it("should handle undefined external config", () => {
    const packageJson = { depPaths: ["packages/*/package.json"] };
    const result = mergeConfigs(undefined, packageJson);
    assert.deepStrictEqual(result, packageJson);
  });

  it("should handle undefined package.json config", () => {
    const external = { security: { provider: "npm" } };
    const result = mergeConfigs(external, undefined);
    assert.deepStrictEqual(result, external);
  });

  it("should deep merge appendix objects", () => {
    const external = {
      appendix: {
        "lodash@4.17.21": {
          dependents: { "app-a": "lodash@^4.17.0" }
        }
      }
    };
    const packageJson = {
      appendix: {
        "axios@1.0.0": {
          dependents: { "app-b": "axios@^0.27.0" }
        }
      }
    };

    const result = mergeConfigs(external, packageJson);
    
    assert.ok(result?.appendix?.["lodash@4.17.21"]);
    assert.ok(result?.appendix?.["axios@1.0.0"]);
    assert.deepStrictEqual(
      result?.appendix?.["lodash@4.17.21"]?.dependents,
      { "app-a": "lodash@^4.17.0" }
    );
  });

  it("should deep merge security configurations", () => {
    const external = {
      security: {
        enabled: true,
        provider: "github" as SecurityProvider
      }
    };
    const packageJson = {
      security: {
        autoFix: true,
        severityThreshold: "high" as SeverityThreshold
      }
    };

    const result = mergeConfigs(external, packageJson);
    
    assert.deepStrictEqual(result?.security, {
      enabled: true,
      provider: "github",
      autoFix: true,
      severityThreshold: "high"
    });
  });

  it("should deep merge overridePaths", () => {
    const external = {
      overridePaths: {
        "workspace-a": {
          "lodash@4.17.21": {
            dependents: { "workspace-a": "lodash@^4.17.0" }
          }
        }
      }
    };
    const packageJson = {
      overridePaths: {
        "workspace-b": {
          "axios@1.0.0": {
            dependents: { "workspace-b": "axios@^0.27.0" }
          }
        }
      }
    };

    const result = mergeConfigs(external, packageJson);
    
    assert.ok(result?.overridePaths?.["workspace-a"]);
    assert.ok(result?.overridePaths?.["workspace-b"]);
  });

  it("should prioritize package.json over external config for conflicting values", () => {
    const external = { checkSecurity: false };
    const packageJson = { checkSecurity: true };

    const result = mergeConfigs(external, packageJson);
    assert.strictEqual(result?.checkSecurity, true);
  });
});

describe("Package.json Preservation", () => {
  it("should preserve overridePaths when appendix is empty", async () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      pastoralist: {
        overridePaths: {
          "workspace-a": {
            "lodash@4.17.21": {
              dependents: { "workspace-a": "lodash@^4.17.0" }
            }
          }
        }
      }
    };

    const result = await updatePackageJSON({
      appendix: {},
      path: "package.json",
      config,
      overrides: {},
      isTesting: true
    });

    assert.ok(result?.pastoralist?.overridePaths);
    assert.deepStrictEqual(
      result?.pastoralist?.overridePaths,
      config.pastoralist?.overridePaths
    );
  });

  it("should preserve security config when appendix is empty", async () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      pastoralist: {
        security: {
          enabled: true,
          provider: "github",
          severityThreshold: "high"
        }
      }
    };

    const result = await updatePackageJSON({
      appendix: {},
      path: "package.json",
      config,
      overrides: {},
      isTesting: true
    });

    assert.ok(result?.pastoralist?.security);
    assert.deepStrictEqual(
      result?.pastoralist?.security,
      config.pastoralist?.security
    );
  });

  it("should preserve depPaths when appendix is empty", async () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      pastoralist: {
        depPaths: ["packages/*/package.json", "apps/*/package.json"]
      }
    };

    const result = await updatePackageJSON({
      appendix: {},
      path: "package.json",
      config,
      overrides: {},
      isTesting: true
    });

    assert.ok(result?.pastoralist?.depPaths);
    assert.deepStrictEqual(
      result?.pastoralist?.depPaths,
      config.pastoralist?.depPaths
    );
  });

  it("should preserve resolutionPaths when appendix is empty", async () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      pastoralist: {
        resolutionPaths: {
          "workspace-legacy": {
            "old-package@1.0.0": {
              dependents: { "workspace-legacy": "old-package@^0.9.0" }
            }
          }
        }
      }
    };

    const result = await updatePackageJSON({
      appendix: {},
      path: "package.json",
      config,
      overrides: {},
      isTesting: true
    });

    assert.ok(result?.pastoralist?.resolutionPaths);
    assert.deepStrictEqual(
      result?.pastoralist?.resolutionPaths,
      config.pastoralist?.resolutionPaths
    );
  });

  it("should remove pastoralist section when no configs exist", async () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      pastoralist: {
        appendix: {}
      }
    };

    const result = await updatePackageJSON({
      appendix: {},
      path: "package.json",
      config,
      overrides: {},
      isTesting: true
    });

    assert.strictEqual(result?.pastoralist, undefined);
  });

  it("should handle mixed preservation scenarios", async () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      pastoralist: {
        appendix: {},
        security: {
          enabled: true,
          provider: "osv"
        },
        depPaths: ["packages/*/package.json"]
      }
    };

    const appendix = {
      "lodash@4.17.21": {
        dependents: { "test": "lodash@^4.17.0" },
        ledger: {
          addedDate: new Date().toISOString()
        }
      }
    };

    const result = await updatePackageJSON({
      appendix,
      path: "package.json",
      config,
      overrides: { lodash: "4.17.21" },
      isTesting: true
    });

    assert.deepStrictEqual(result?.pastoralist?.appendix, appendix);
    assert.deepStrictEqual(
      result?.pastoralist?.security,
      config.pastoralist?.security
    );
    assert.deepStrictEqual(
      result?.pastoralist?.depPaths,
      config.pastoralist?.depPaths
    );
  });
});

describe("Security Integration", () => {
  it("should create security ledger entries with provider", () => {
    const securityOverrideDetails = [
      { packageName: "lodash", reason: "CVE-2021-23337: Command injection vulnerability" }
    ];

    const result = updateAppendix({
      overrides: { lodash: "4.17.21" },
      appendix: {},
      dependencies: { lodash: "^4.17.0" },
      packageName: "test-app",
      securityOverrideDetails,
      securityProvider: "github"
    });

    const ledger = result["lodash@4.17.21"]?.ledger;
    assert.ok(ledger);
    assert.strictEqual(ledger.securityChecked, true);
    assert.ok(ledger.securityCheckDate);
    assert.strictEqual(ledger.securityProvider, "github");
    assert.strictEqual(ledger.reason, "CVE-2021-23337: Command injection vulnerability");
  });

  it("should add securityChecked and securityCheckDate", () => {
    const securityOverrideDetails = [
      { packageName: "axios", reason: "Security update required" }
    ];

    const result = updateAppendix({
      overrides: { axios: "1.0.0" },
      appendix: {},
      dependencies: { axios: "^0.27.0" },
      packageName: "test-app",
      securityOverrideDetails,
      securityProvider: "snyk"
    });

    const ledger = result["axios@1.0.0"]?.ledger;
    assert.ok(ledger);
    assert.strictEqual(ledger.securityChecked, true);
    assert.ok(ledger.securityCheckDate);
    
    const checkDate = new Date(ledger.securityCheckDate);
    assert.ok(!isNaN(checkDate.getTime()));
  });

  it("should include securityProvider in ledger", () => {
    const securityOverrideDetails = [
      { packageName: "react", reason: "Security patch" }
    ];

    const providers: Array<"osv" | "github" | "snyk" | "npm" | "socket"> = ["osv", "github", "snyk", "npm", "socket"];
    
    providers.forEach(provider => {
      const result = updateAppendix({
        overrides: { react: "18.2.0" },
        appendix: {},
        dependencies: { react: "^18.0.0" },
        packageName: "test-app",
        securityOverrideDetails,
        securityProvider: provider
      });

      const ledger = result["react@18.2.0"]?.ledger;
      assert.strictEqual(ledger?.securityProvider, provider);
    });
  });

  it("should use security reasons from override details", () => {
    const securityOverrideDetails = [
      { packageName: "lodash", reason: "CVE-2021-23337: Command injection" },
      { packageName: "axios", reason: "CVE-2023-XXXX: SSRF vulnerability" }
    ];

    const result = updateAppendix({
      overrides: {
        lodash: "4.17.21",
        axios: "1.0.0"
      },
      appendix: {},
      dependencies: {
        lodash: "^4.17.0",
        axios: "^0.27.0"
      },
      packageName: "test-app",
      securityOverrideDetails
    });

    assert.strictEqual(
      result["lodash@4.17.21"]?.ledger?.reason,
      "CVE-2021-23337: Command injection"
    );
    assert.strictEqual(
      result["axios@1.0.0"]?.ledger?.reason,
      "CVE-2023-XXXX: SSRF vulnerability"
    );
  });

  it("should handle multiple security providers", () => {
    const overrideDetails1 = [
      { packageName: "lodash", reason: "Security fix from OSV" }
    ];
    const overrideDetails2 = [
      { packageName: "axios", reason: "Security fix from GitHub" }
    ];

    const result1 = updateAppendix({
      overrides: { lodash: "4.17.21" },
      appendix: {},
      dependencies: { lodash: "^4.17.0" },
      packageName: "test-app",
      securityOverrideDetails: overrideDetails1,
      securityProvider: "osv"
    });

    const result2 = updateAppendix({
      overrides: { axios: "1.0.0" },
      appendix: {},
      dependencies: { axios: "^0.27.0" },
      packageName: "test-app",
      securityOverrideDetails: overrideDetails2,
      securityProvider: "github"
    });

    assert.strictEqual(result1["lodash@4.17.21"]?.ledger?.securityProvider, "osv");
    assert.strictEqual(result2["axios@1.0.0"]?.ledger?.securityProvider, "github");
  });

  it("should combine security and manual overrides", () => {
    const securityOverrideDetails = [
      { packageName: "lodash", reason: "CVE-2021-23337" }
    ];
    const manualOverrideReasons = {
      "react": "Pinning for stability"
    };

    const result = updateAppendix({
      overrides: {
        lodash: "4.17.21",
        react: "18.2.0"
      },
      appendix: {},
      dependencies: {
        lodash: "^4.17.0",
        react: "^18.0.0"
      },
      packageName: "test-app",
      securityOverrideDetails,
      manualOverrideReasons,
      securityProvider: "github"
    });

    const lodashLedger = result["lodash@4.17.21"]?.ledger;
    const reactLedger = result["react@18.2.0"]?.ledger;

    assert.strictEqual(lodashLedger?.reason, "CVE-2021-23337");
    assert.strictEqual(lodashLedger?.securityChecked, true);
    assert.strictEqual(lodashLedger?.securityProvider, "github");

    assert.strictEqual(reactLedger?.reason, "Pinning for stability");
    assert.strictEqual(reactLedger?.securityChecked, undefined);
  });

  it("should handle nested overrides with security details", () => {
    const securityOverrideDetails = [
      { packageName: "pg-types", reason: "CVE-2023-XXXX: SQL injection fix" }
    ];

    const result = updateAppendix({
      overrides: {
        pg: { "pg-types": "^4.0.1" }
      },
      appendix: {},
      dependencies: { pg: "^8.13.1" },
      packageName: "test-app",
      securityOverrideDetails,
      securityProvider: "snyk"
    });

    const ledger = result["pg-types@^4.0.1"]?.ledger;
    assert.ok(ledger);
    assert.strictEqual(ledger.reason, "CVE-2023-XXXX: SQL injection fix");
    assert.strictEqual(ledger.securityChecked, true);
    assert.strictEqual(ledger.securityProvider, "snyk");
    assert.ok(ledger.securityCheckDate);
  });
});

describe("Bug Fix: Deep merge appendix dependents", () => {
  it("should preserve dependents from both external and package.json configs", () => {
    const externalConfig: PastoralistConfig = {
      appendix: {
        "lodash@4.17.21": {
          dependents: {
            "external-app": "lodash@^4.0.0",
          },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
            reason: "From external config",
          },
        },
      },
    };

    const packageJsonConfig: PastoralistConfig = {
      appendix: {
        "lodash@4.17.21": {
          dependents: {
            "my-app": "lodash@^4.17.0",
          },
          ledger: {
            addedDate: "2024-06-01T00:00:00.000Z",
            reason: "From package.json",
          },
        },
      },
    };

    const merged = mergeConfigs(externalConfig, packageJsonConfig);

    assert.ok(merged?.appendix, "Merged appendix should exist");
    const lodashEntry = merged.appendix["lodash@4.17.21"];
    assert.ok(lodashEntry, "Lodash entry should exist");
    assert.ok(lodashEntry.dependents["external-app"], "Should preserve external-app dependent");
    assert.ok(lodashEntry.dependents["my-app"], "Should preserve my-app dependent");
    assert.strictEqual(
      Object.keys(lodashEntry.dependents).length,
      2,
      "Should have exactly 2 dependents"
    );
  });

  it("should use concat for merging patches arrays", () => {
    const externalConfig: PastoralistConfig = {
      appendix: {
        "lodash@4.17.21": {
          dependents: { app: "lodash@^4.0.0" },
          patches: ["patches/lodash+4.17.21.patch"],
        },
      },
    };

    const packageJsonConfig: PastoralistConfig = {
      appendix: {
        "lodash@4.17.21": {
          dependents: { app: "lodash@^4.0.0" },
          patches: ["patches/lodash+4.17.21-fix.patch"],
        },
      },
    };

    const merged = mergeConfigs(externalConfig, packageJsonConfig);

    assert.ok(merged?.appendix, "Merged appendix should exist");
    const patches = merged.appendix["lodash@4.17.21"]?.patches;
    assert.ok(patches, "Patches should exist");
    assert.strictEqual(patches.length, 2, "Should have both patches");
    assert.ok(patches.includes("patches/lodash+4.17.21.patch"), "Should include external patch");
    assert.ok(patches.includes("patches/lodash+4.17.21-fix.patch"), "Should include package.json patch");
  });

  it("should use Object.assign for merging overridePaths", () => {
    const externalConfig: PastoralistConfig = {
      overridePaths: {
        "packages/app": {
          "lodash@4.17.21": {
            dependents: { app: "lodash@^4.0.0" },
          },
        },
      },
    };

    const packageJsonConfig: PastoralistConfig = {
      overridePaths: {
        "packages/utils": {
          "express@4.18.2": {
            dependents: { utils: "express@^4.0.0" },
          },
        },
      },
    };

    const merged = mergeConfigs(externalConfig, packageJsonConfig);

    assert.ok(merged?.overridePaths, "Merged overridePaths should exist");
    assert.ok(merged.overridePaths["packages/app"], "Should have app overridePath");
    assert.ok(merged.overridePaths["packages/utils"], "Should have utils overridePath");
  });
});

describe("Bug Fix: Config loader error messages", () => {
  it("should log error message for malformed config files", async () => {
    const tempDir = "/tmp/pastoralist-test-error-logging";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const configPath = path.join(tempDir, ".pastoralistrc.json");
    fs.writeFileSync(configPath, "{ invalid json }");

    const result = await loadExternalConfig(tempDir);

    assert.strictEqual(result, undefined, "Should return undefined for malformed config");

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
