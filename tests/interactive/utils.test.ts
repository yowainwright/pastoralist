import assert from "assert";
import {
  getWorkspaceStatus,
  getWorkspacePaths,
  isSecurityEnabled,
  getSecurityProvider,
  getBooleanDisplay,
  getOverrideCount,
  getResolutionCount,
  parseCommaSeparated,
  formatOverrideValue,
  getAllOverrideKeys,
  createWorkspaceUpdate,
  createDisabledWorkspaceUpdate,
  createSecurityUpdate,
  createDisabledSecurityUpdate,
  applyWorkspaceUpdate,
  applySecurityUpdate,
  applyConfigUpdates,
  removeOverrideFromPackageJson,
  removeResolutionFromPackageJson,
  applyPackageJsonUpdates,
} from "../../src/interactive/utils";
import type { PastoralistConfig } from "../../src/config";
import type { PastoralistJSON } from "../../src/interfaces";

describe("Interactive Utils", () => {
  describe("getWorkspaceStatus", () => {
    it("should return Disabled when no depPaths", () => {
      const config: PastoralistConfig = {};
      assert.strictEqual(getWorkspaceStatus(config), "Disabled");
    });

    it("should return Enabled (auto-detect) for workspace mode", () => {
      const config: PastoralistConfig = { depPaths: "workspace" };
      assert.strictEqual(getWorkspaceStatus(config), "Enabled (auto-detect)");
    });

    it("should return Enabled (custom paths) for array depPaths", () => {
      const config: PastoralistConfig = { depPaths: ["packages/*"] };
      assert.strictEqual(getWorkspaceStatus(config), "Enabled (custom paths)");
    });
  });

  describe("getWorkspacePaths", () => {
    it("should return none when no depPaths", () => {
      const config: PastoralistConfig = {};
      const packageJson = {} as PastoralistJSON;
      assert.strictEqual(getWorkspacePaths(config, packageJson), "none");
    });

    it("should return workspaces from package.json in workspace mode", () => {
      const config: PastoralistConfig = { depPaths: "workspace" };
      const packageJson = { workspaces: ["packages/*", "apps/*"] } as PastoralistJSON;
      assert.strictEqual(getWorkspacePaths(config, packageJson), "packages/*, apps/*");
    });

    it("should return none when workspace mode but no workspaces", () => {
      const config: PastoralistConfig = { depPaths: "workspace" };
      const packageJson = {} as PastoralistJSON;
      assert.strictEqual(getWorkspacePaths(config, packageJson), "none");
    });

    it("should return custom paths for array depPaths", () => {
      const config: PastoralistConfig = { depPaths: ["packages/*", "libs/*"] };
      const packageJson = {} as PastoralistJSON;
      assert.strictEqual(getWorkspacePaths(config, packageJson), "packages/*, libs/*");
    });
  });

  describe("isSecurityEnabled", () => {
    it("should return false when security not configured", () => {
      const config: PastoralistConfig = {};
      assert.strictEqual(isSecurityEnabled(config), false);
    });

    it("should return true when security.enabled is true", () => {
      const config: PastoralistConfig = { security: { enabled: true } };
      assert.strictEqual(isSecurityEnabled(config), true);
    });

    it("should return true when checkSecurity is true", () => {
      const config: PastoralistConfig = { checkSecurity: true };
      assert.strictEqual(isSecurityEnabled(config), true);
    });

    it("should return true when both are set", () => {
      const config: PastoralistConfig = {
        checkSecurity: true,
        security: { enabled: true },
      };
      assert.strictEqual(isSecurityEnabled(config), true);
    });
  });

  describe("getSecurityProvider", () => {
    it("should return osv as default", () => {
      const config: PastoralistConfig = {};
      assert.strictEqual(getSecurityProvider(config), "osv");
    });

    it("should return configured provider", () => {
      const config: PastoralistConfig = {
        security: { provider: "github" },
      };
      assert.strictEqual(getSecurityProvider(config), "github");
    });
  });

  describe("getBooleanDisplay", () => {
    it("should return Yes for true", () => {
      assert.strictEqual(getBooleanDisplay(true), "Yes");
    });

    it("should return No for false", () => {
      assert.strictEqual(getBooleanDisplay(false), "No");
    });

    it("should return No for undefined", () => {
      assert.strictEqual(getBooleanDisplay(undefined), "No");
    });
  });

  describe("getOverrideCount", () => {
    it("should return 0 for no overrides", () => {
      const packageJson = {} as PastoralistJSON;
      assert.strictEqual(getOverrideCount(packageJson), 0);
    });

    it("should count npm overrides", () => {
      const packageJson = {
        overrides: { lodash: "4.17.21", axios: "1.0.0" },
      } as PastoralistJSON;
      assert.strictEqual(getOverrideCount(packageJson), 2);
    });

    it("should count pnpm overrides", () => {
      const packageJson = {
        pnpm: { overrides: { lodash: "4.17.21" } },
      } as PastoralistJSON;
      assert.strictEqual(getOverrideCount(packageJson), 1);
    });

    it("should count both npm and pnpm overrides", () => {
      const packageJson = {
        overrides: { lodash: "4.17.21" },
        pnpm: { overrides: { axios: "1.0.0" } },
      } as PastoralistJSON;
      assert.strictEqual(getOverrideCount(packageJson), 2);
    });
  });

  describe("getResolutionCount", () => {
    it("should return 0 for no resolutions", () => {
      const packageJson = {} as PastoralistJSON;
      assert.strictEqual(getResolutionCount(packageJson), 0);
    });

    it("should count resolutions", () => {
      const packageJson = {
        resolutions: { lodash: "4.17.21", axios: "1.0.0" },
      } as PastoralistJSON;
      assert.strictEqual(getResolutionCount(packageJson), 2);
    });
  });

  describe("parseCommaSeparated", () => {
    it("should parse comma-separated values", () => {
      const result = parseCommaSeparated("foo, bar, baz");
      assert.deepStrictEqual(result, ["foo", "bar", "baz"]);
    });

    it("should trim whitespace", () => {
      const result = parseCommaSeparated("  foo  ,  bar  ");
      assert.deepStrictEqual(result, ["foo", "bar"]);
    });

    it("should filter empty values", () => {
      const result = parseCommaSeparated("foo, , bar");
      assert.deepStrictEqual(result, ["foo", "bar"]);
    });

    it("should return empty array for empty string", () => {
      const result = parseCommaSeparated("");
      assert.deepStrictEqual(result, []);
    });
  });

  describe("formatOverrideValue", () => {
    it("should return string value as-is", () => {
      assert.strictEqual(formatOverrideValue("1.0.0"), "1.0.0");
    });

    it("should stringify object value", () => {
      const result = formatOverrideValue({ foo: "bar" });
      assert.strictEqual(result, '{"foo":"bar"}');
    });
  });

  describe("getAllOverrideKeys", () => {
    it("should return empty array for no overrides", () => {
      const packageJson = {} as PastoralistJSON;
      const result = getAllOverrideKeys(packageJson);
      assert.deepStrictEqual(result, []);
    });

    it("should return npm override keys", () => {
      const packageJson = {
        overrides: { lodash: "4.17.21", axios: "1.0.0" },
      } as PastoralistJSON;
      const result = getAllOverrideKeys(packageJson);
      assert.deepStrictEqual(result, ["lodash", "axios"]);
    });

    it("should return pnpm override keys with prefix", () => {
      const packageJson = {
        pnpm: { overrides: { lodash: "4.17.21" } },
      } as PastoralistJSON;
      const result = getAllOverrideKeys(packageJson);
      assert.deepStrictEqual(result, ["pnpm:lodash"]);
    });

    it("should return both npm and pnpm keys", () => {
      const packageJson = {
        overrides: { axios: "1.0.0" },
        pnpm: { overrides: { lodash: "4.17.21" } },
      } as PastoralistJSON;
      const result = getAllOverrideKeys(packageJson);
      assert.deepStrictEqual(result, ["axios", "pnpm:lodash"]);
    });
  });

  describe("createWorkspaceUpdate", () => {
    it("should create update with workspace mode", () => {
      const result = createWorkspaceUpdate("workspace");
      assert.deepStrictEqual(result, { enabled: true, depPaths: "workspace" });
    });

    it("should create update with custom paths", () => {
      const result = createWorkspaceUpdate(["packages/*"]);
      assert.deepStrictEqual(result, { enabled: true, depPaths: ["packages/*"] });
    });
  });

  describe("createDisabledWorkspaceUpdate", () => {
    it("should create disabled update", () => {
      const result = createDisabledWorkspaceUpdate();
      assert.deepStrictEqual(result, { enabled: false });
    });
  });

  describe("createSecurityUpdate", () => {
    it("should create update with defaults", () => {
      const result = createSecurityUpdate({});
      assert.deepStrictEqual(result, { enabled: true });
    });

    it("should merge provided updates", () => {
      const result = createSecurityUpdate({ provider: "github", interactive: true });
      assert.deepStrictEqual(result, {
        enabled: true,
        provider: "github",
        interactive: true,
      });
    });
  });

  describe("createDisabledSecurityUpdate", () => {
    it("should create disabled update", () => {
      const result = createDisabledSecurityUpdate();
      assert.deepStrictEqual(result, { enabled: false });
    });
  });

  describe("applyWorkspaceUpdate", () => {
    it("should remove depPaths when disabled", () => {
      const config: PastoralistConfig = { depPaths: "workspace" };
      const update = { enabled: false };
      const result = applyWorkspaceUpdate(config, update);
      assert.deepStrictEqual(result, {});
    });

    it("should add workspace depPaths", () => {
      const config: PastoralistConfig = {};
      const update = { enabled: true, depPaths: "workspace" as const };
      const result = applyWorkspaceUpdate(config, update);
      assert.deepStrictEqual(result, { depPaths: "workspace" });
    });

    it("should add custom depPaths", () => {
      const config: PastoralistConfig = {};
      const update = { enabled: true, depPaths: ["packages/*"] };
      const result = applyWorkspaceUpdate(config, update);
      assert.deepStrictEqual(result, { depPaths: ["packages/*"] });
    });
  });

  describe("applySecurityUpdate", () => {
    it("should disable security", () => {
      const config: PastoralistConfig = {
        checkSecurity: true,
        security: { enabled: true, provider: "osv" },
      };
      const update = { enabled: false };
      const result = applySecurityUpdate(config, update);
      assert.deepStrictEqual(result, {
        checkSecurity: false,
        security: { enabled: false },
      });
    });

    it("should enable security with updates", () => {
      const config: PastoralistConfig = {};
      const update = { enabled: true, provider: "github" as const, interactive: true };
      const result = applySecurityUpdate(config, update);
      assert.deepStrictEqual(result, {
        checkSecurity: true,
        security: {
          enabled: true,
          provider: "github",
          interactive: true,
        },
      });
    });

    it("should merge with existing security config", () => {
      const config: PastoralistConfig = {
        security: { enabled: true, provider: "osv" as const },
      };
      const update = { enabled: true, interactive: true };
      const result = applySecurityUpdate(config, update);
      assert.deepStrictEqual(result, {
        checkSecurity: true,
        security: {
          enabled: true,
          provider: "osv",
          interactive: true,
        },
      });
    });
  });

  describe("applyConfigUpdates", () => {
    it("should apply workspace update", () => {
      const config: PastoralistConfig = {};
      const updates = { workspace: { enabled: true, depPaths: "workspace" as const } };
      const result = applyConfigUpdates(config, updates);
      assert.deepStrictEqual(result, { depPaths: "workspace" });
    });

    it("should apply security update", () => {
      const config: PastoralistConfig = {};
      const updates = { security: { enabled: true, provider: "github" as const } };
      const result = applyConfigUpdates(config, updates);
      assert.deepStrictEqual(result, {
        checkSecurity: true,
        security: { enabled: true, provider: "github" },
      });
    });

    it("should apply both updates", () => {
      const config: PastoralistConfig = {};
      const updates = {
        workspace: { enabled: true, depPaths: ["packages/*"] },
        security: { enabled: true, interactive: true },
      };
      const result = applyConfigUpdates(config, updates);
      assert.deepStrictEqual(result, {
        depPaths: ["packages/*"],
        checkSecurity: true,
        security: { enabled: true, interactive: true },
      });
    });
  });

  describe("removeOverrideFromPackageJson", () => {
    it("should remove npm override", () => {
      const packageJson = {
        overrides: { lodash: "4.17.21", axios: "1.0.0" },
      } as PastoralistJSON;
      const result = removeOverrideFromPackageJson(packageJson, "lodash");
      assert.deepStrictEqual(result.overrides, { axios: "1.0.0" });
    });

    it("should remove pnpm override", () => {
      const packageJson = {
        pnpm: { overrides: { lodash: "4.17.21", axios: "1.0.0" } },
      } as PastoralistJSON;
      const result = removeOverrideFromPackageJson(packageJson, "pnpm:lodash");
      assert.deepStrictEqual(result.pnpm?.overrides, { axios: "1.0.0" });
    });
  });

  describe("removeResolutionFromPackageJson", () => {
    it("should remove resolution", () => {
      const packageJson = {
        resolutions: { lodash: "4.17.21", axios: "1.0.0" },
      } as PastoralistJSON;
      const result = removeResolutionFromPackageJson(packageJson, "lodash");
      assert.deepStrictEqual(result.resolutions, { axios: "1.0.0" });
    });
  });

  describe("applyPackageJsonUpdates", () => {
    it("should remove overrides", () => {
      const packageJson = {
        overrides: { lodash: "4.17.21", axios: "1.0.0" },
      } as PastoralistJSON;
      const updates = { removeOverrides: ["lodash"] };
      const result = applyPackageJsonUpdates(packageJson, updates);
      assert.deepStrictEqual(result.overrides, { axios: "1.0.0" });
    });

    it("should remove resolutions", () => {
      const packageJson = {
        resolutions: { lodash: "4.17.21", axios: "1.0.0" },
      } as PastoralistJSON;
      const updates = { removeResolutions: ["lodash"] };
      const result = applyPackageJsonUpdates(packageJson, updates);
      assert.deepStrictEqual(result.resolutions, { axios: "1.0.0" });
    });

    it("should remove both overrides and resolutions", () => {
      const packageJson = {
        overrides: { lodash: "4.17.21" },
        resolutions: { axios: "1.0.0" },
      } as PastoralistJSON;
      const updates = {
        removeOverrides: ["lodash"],
        removeResolutions: ["axios"],
      };
      const result = applyPackageJsonUpdates(packageJson, updates);
      assert.deepStrictEqual(result.overrides, {});
      assert.deepStrictEqual(result.resolutions, {});
    });
  });
});
