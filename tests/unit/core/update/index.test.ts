import { test, expect } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import { update } from "../../../../src/core/update/index";
import { forceClearCache } from "../../../../src/core/packageJSON";
import {
  determineProcessingMode,
  resolveDepPaths,
  mergeAllConfigs,
  findRemovableOverrides,
  hasOverrides,
} from "../../../../src/core/update/utils";
import type {
  Options,
  PastoralistJSON,
  OverridesType,
  Appendix,
  ResolveOverrides,
} from "../../../../src/types";

const TEST_DIR = resolve(__dirname, ".test-update");

// =============================================================================
// update() function tests
// =============================================================================

test("update - returns early context when no config provided", () => {
  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
  };

  const result = update(options);

  expect(result.options).toEqual(options);
  expect(result.path).toBe("package.json");
  expect(result.root).toBe("./");
  expect(result.isTesting).toBe(true);
  expect(result.config).toBeUndefined();
});

test("update - processes simple override in root mode", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    debug: false,
  };

  const result = update(options);

  expect(result.config).toBe(config);
  expect(result.overrides).toBeDefined();
  expect(result.overrides?.lodash).toBe("4.17.21");
  expect(result.appendix).toBeDefined();
  expect(result.mode?.mode).toBe("root");
});

test("update - merges security overrides with config overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
      express: "^4.17.0",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    securityOverrides: {
      express: "4.18.2",
    },
    isTesting: true,
  };

  const result = update(options);

  expect(result.overrides?.lodash).toBe("4.17.21");
  expect(result.overrides?.express).toBe("4.18.2");
});

test("update - determines workspace mode without file I/O", () => {
  const config: PastoralistJSON = {
    name: "monorepo-root",
    version: "1.0.0",
    workspaces: ["packages/*"],
    overrides: {
      react: "18.0.0",
    },
  };

  const options: Options = {
    config,
    depPaths: [],
    isTesting: true,
  };

  const result = update(options);

  expect(result.mode).toBeDefined();
  expect(result.overrides?.react).toBe("18.0.0");
});

test("update - detects patches when present", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    root: "./",
    isTesting: true,
  };

  const result = update(options);

  expect(result.patchMap).toBeDefined();
  expect(typeof result.patchMap).toBe("object");
});

test("update - determines processing mode correctly", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.hasRootOverrides).toBe(true);
  expect(result.rootDeps).toBeDefined();
  expect(result.rootDeps?.lodash).toBe("^4.17.20");
  expect(result.missingInRoot).toBeDefined();
});

test("update - builds appendix with dependents", () => {
  const config: PastoralistJSON = {
    name: "my-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  const appendixKey = "lodash@4.17.21";
  expect(result.appendix?.[appendixKey]).toBeDefined();
  expect(result.appendix?.[appendixKey].dependents).toBeDefined();
});

test("update - handles empty overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.mode?.hasRootOverrides).toBe(false);
  expect(result.finalOverrides).toEqual({});
  expect(result.finalAppendix).toEqual({});
});

test("update - sets finalOverrides and finalAppendix in cleanup step", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      react: "^17.0.0",
    },
    overrides: {
      react: "18.0.0",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.finalOverrides).toBeDefined();
  expect(result.finalAppendix).toBeDefined();
  expect(result.finalOverrides?.react).toBe("18.0.0");
});

test("update - skips write when isTesting is true", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.isTesting).toBe(true);
  expect(result.finalOverrides).toBeDefined();
  expect(result.finalAppendix).toBeDefined();
});

test("update - handles devDependencies", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    devDependencies: {
      jest: "^28.0.0",
    },
    overrides: {
      jest: "29.0.0",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  expect(result.appendix?.["jest@29.0.0"]).toBeDefined();
});

test("update - handles peerDependencies", () => {
  const config: PastoralistJSON = {
    name: "test-lib",
    version: "1.0.0",
    peerDependencies: {
      react: "^17.0.0",
    },
    overrides: {
      react: "18.0.0",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  expect(result.rootDeps?.react).toBe("^17.0.0");
});

test("update - handles nested overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      react: "^18.0.0",
    },
    overrides: {
      react: {
        "react-dom": "18.2.0",
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
});

test("update - includes security override details in appendix", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
  };

  const options: Options = {
    config,
    securityOverrides: {
      lodash: "4.17.21",
    },
    securityOverrideDetails: [
      {
        packageName: "lodash",
        reason: "Security vulnerability CVE-2021-23337",
        cve: "CVE-2021-23337",
        severity: "high",
      },
    ],
    securityProvider: "osv",
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  const appendixEntry = result.appendix?.["lodash@4.17.21"];
  expect(appendixEntry).toBeDefined();
  expect(appendixEntry?.ledger).toBeDefined();
});

test("update - uses default path when not provided", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: {},
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.path).toBe("package.json");
});

test("update - uses default root when not provided", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: {},
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.root).toBe("./");
});

test("update - handles yarn resolutions", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    resolutions: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.overrides).toBeDefined();
  expect(result.overrides?.lodash).toBe("4.17.21");
});

test("update - handles pnpm overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      react: "^17.0.0",
    },
    pnpm: {
      overrides: {
        react: "18.0.0",
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.overrides).toBeDefined();
  expect(result.overrides?.react).toBe("18.0.0");
});

test("update - preserves existing appendix entries", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
    pastoralist: {
      appendix: {
        "express@4.18.2": {
          dependents: {
            "old-app": "express@^4.17.0",
          },
        },
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.existingAppendix).toBeDefined();
  expect(result.existingAppendix?.["express@4.18.2"]).toBeDefined();
});

test("update - clears cache when clearCache option is true", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    clearCache: true,
  };

  const result = update(options);

  expect(result.config).toBe(config);
});

test("update - handles config with workspaces but no depPaths", () => {
  const config: PastoralistJSON = {
    name: "monorepo",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    depPaths: [],
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  expect(result.mode?.mode).toBe("root");
});

test("update - handles empty final context", () => {
  const options: Options = {
    isTesting: true,
  };

  const result = update(options);

  expect(result.config).toBeUndefined();
  expect(result.finalOverrides).toBeUndefined();
  expect(result.finalAppendix).toBeUndefined();
});

test("update - processes manualOverrideReasons", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
    pastoralist: {
      overrideReasons: {
        lodash: "Upgrade for performance improvements",
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  const entry = result.appendix?.["lodash@4.17.21"];
  expect(entry).toBeDefined();
});

// =============================================================================
// determineProcessingMode() tests
// =============================================================================

test("determineProcessingMode - returns root mode when no depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = determineProcessingMode(options, config, true, []);

  expect(result.mode).toBe("root");
  expect(result.hasRootOverrides).toBe(true);
  expect(result.missingInRoot).toEqual([]);
});

test("determineProcessingMode - returns workspace mode when options depPaths", () => {
  const options: Options = {
    depPaths: ["packages/*/package.json"],
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = determineProcessingMode(options, config, false, ["lodash"]);

  expect(result.mode).toBe("workspace");
  expect(result.depPaths).toEqual(["packages/*/package.json"]);
  expect(result.missingInRoot).toEqual(["lodash"]);
});

test("determineProcessingMode - returns workspace mode when config depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["apps/*/package.json"],
    },
  };

  const result = determineProcessingMode(options, config, true, []);

  expect(result.mode).toBe("workspace");
  expect(result.depPaths).toEqual(["apps/*/package.json"]);
});

// =============================================================================
// resolveDepPaths() tests
// =============================================================================

test("resolveDepPaths - returns options depPaths when provided", () => {
  const options: Options = {
    depPaths: ["custom/path"],
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["other/path"],
    },
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["custom/path"]);
});

test("resolveDepPaths - resolves workspace keyword to workspace paths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: {
      depPaths: "workspace",
    },
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("resolveDepPaths - handles workspaces keyword", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages"],
    pastoralist: {
      depPaths: "workspaces",
    },
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["packages/package.json"]);
});

test("resolveDepPaths - returns config depPaths array", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["lib/package.json"],
    },
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["lib/package.json"]);
});

test("resolveDepPaths - returns workspaces when no config depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };

  const result = resolveDepPaths(options, config);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("resolveDepPaths - returns null when no depPaths or workspaces", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = resolveDepPaths(options, config);

  expect(result).toBeNull();
});

// =============================================================================
// mergeAllConfigs() tests
// =============================================================================

test("mergeAllConfigs - merges CLI options and package.json config", () => {
  const cliOptions: Options = {
    depPaths: ["cli/path"],
    securityOverrideDetails: [{ packageName: "lodash", reason: "security" }],
    securityProvider: "osv",
  };
  const packageJsonConfig = {
    appendix: { "lodash@4.17.21": { dependents: {} } },
    depPaths: ["config/path"],
  };
  const overridesData: ResolveOverrides = { npm: { lodash: "4.17.21" } };
  const overrides: OverridesType = { lodash: "4.17.21" };

  const result = mergeAllConfigs(
    cliOptions,
    packageJsonConfig,
    overridesData,
    overrides,
  );

  expect(result.overrides).toEqual(overrides);
  expect(result.overridesData).toEqual(overridesData);
  expect(result.appendix).toEqual(packageJsonConfig.appendix);
  expect(result.depPaths).toEqual(["cli/path"]);
  expect(result.securityOverrideDetails).toBeDefined();
  expect(result.securityProvider).toBe("osv");
});

test("mergeAllConfigs - handles undefined packageJsonConfig", () => {
  const cliOptions: Options = {
    depPaths: ["cli/path"],
  };
  const overridesData: ResolveOverrides = { npm: { express: "4.18.2" } };
  const overrides: OverridesType = { express: "4.18.2" };

  const result = mergeAllConfigs(
    cliOptions,
    undefined,
    overridesData,
    overrides,
  );

  expect(result.overrides).toEqual(overrides);
  expect(result.depPaths).toEqual(["cli/path"]);
  expect(result.appendix).toBeUndefined();
});

// =============================================================================
// findRemovableOverrides() tests
// =============================================================================

test("findRemovableOverrides - finds unused overrides", () => {
  const overrides: OverridesType = {
    lodash: "4.17.21",
    express: "4.18.2",
    react: "18.0.0",
  };
  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: { app: "lodash@^4.17.0" } },
  };
  const allDeps = {
    express: "^4.18.0",
  };
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(
    overrides,
    appendix,
    allDeps,
    missingInRoot,
  );

  expect(result).toEqual(["react"]);
});

test("findRemovableOverrides - keeps overrides used in appendix", () => {
  const overrides: OverridesType = {
    lodash: "4.17.21",
  };
  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: { app: "lodash@^4.17.0" } },
  };
  const allDeps = {};
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(
    overrides,
    appendix,
    allDeps,
    missingInRoot,
  );

  expect(result).toEqual([]);
});

test("findRemovableOverrides - keeps overrides with root dependencies", () => {
  const overrides: OverridesType = {
    express: "4.18.2",
  };
  const appendix: Appendix = {};
  const allDeps = {
    express: "^4.18.0",
  };
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(
    overrides,
    appendix,
    allDeps,
    missingInRoot,
  );

  expect(result).toEqual([]);
});

test("findRemovableOverrides - keeps overrides missing in root", () => {
  const overrides: OverridesType = {
    react: "18.0.0",
  };
  const appendix: Appendix = {};
  const allDeps = {};
  const missingInRoot: string[] = ["react"];

  const result = findRemovableOverrides(
    overrides,
    appendix,
    allDeps,
    missingInRoot,
  );

  expect(result).toEqual([]);
});

// =============================================================================
// hasOverrides() tests
// =============================================================================

test("hasOverrides - returns true for security overrides", () => {
  const options: Options = {
    securityOverrides: { lodash: "4.17.21" },
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = hasOverrides(options, config);

  expect(result).toBe(true);
});

test("hasOverrides - returns true for npm overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: { express: "4.18.2" },
  };

  const result = hasOverrides({}, config);

  expect(result).toBe(true);
});

test("hasOverrides - returns true for yarn resolutions", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { lodash: "4.17.21" },
  };

  const result = hasOverrides({}, config);

  expect(result).toBe(true);
});

test("hasOverrides - returns true for pnpm overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: {
      overrides: { react: "18.0.0" },
    },
  };

  const result = hasOverrides({}, config);

  expect(result).toBe(true);
});

test("hasOverrides - returns false when no overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = hasOverrides({}, config);

  expect(result).toBe(false);
});

test("hasOverrides - returns false when empty overrides", () => {
  const options: Options = {
    securityOverrides: {},
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: {},
  };

  const result = hasOverrides(options, config);

  expect(result).toBe(false);
});

test("hasOverrides - handles undefined options and config", () => {
  const result = hasOverrides(undefined, {} as PastoralistJSON);

  expect(result).toBe(false);
});

// =============================================================================
// Additional edge case tests for coverage
// =============================================================================

test("update - merges workspace appendix with existing root appendix entries", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": {
          dependents: { "root-app": "lodash@^4.17.20" },
        },
      },
    },
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
    depPaths: [],
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  expect(result.appendix?.["lodash@4.17.21"]).toBeDefined();
});

test("update - handles patches directory with unused patches", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      patchesDir: "patches",
    },
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
    depPaths: [],
  };

  const result = update(options);

  expect(result.isTesting).toBe(true);
});

test("update - skips write step when isTesting is true", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
    depPaths: [],
  };

  const result = update(options);

  expect(result.isTesting).toBe(true);
  expect(result.finalOverrides).toBeDefined();
});

test("update - handles config with no appendix or overrides data", () => {
  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    depPaths: [],
  };

  const result = update(options);

  expect(result.path).toBe("package.json");
  expect(result.config).toBeUndefined();
});

test("update - processes peerDependencies in dependency collection", () => {
  const config: PastoralistJSON = {
    name: "test-lib",
    version: "1.0.0",
    peerDependencies: { react: "^18.0.0" },
    overrides: { react: "18.2.0" },
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
    depPaths: [],
  };

  const result = update(options);

  expect(result.appendix?.["react@18.2.0"]).toBeDefined();
});

test("update - stepWriteResult skips when hasNoData is true", () => {
  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: false,
    config: undefined,
  };

  const result = update(options);

  expect(result.config).toBeUndefined();
  expect(result.finalAppendix).toBeUndefined();
  expect(result.finalOverrides).toBeUndefined();
});

test("update - handles workspaceAppendix merge with existing entry", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
    debug: true,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  expect(result.appendix?.["lodash@4.17.21"]).toBeDefined();
  expect(result.appendix?.["lodash@4.17.21"]?.dependents).toBeDefined();
});

test("update - handles workspaceAppendix merge adding new entry", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20", express: "^4.17.0" },
    overrides: { lodash: "4.17.21", express: "4.18.2" },
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
  expect(result.appendix?.["lodash@4.17.21"]).toBeDefined();
  expect(result.appendix?.["express@4.18.2"]).toBeDefined();
});

test("update - handles overridePaths from config", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", react: "18.0.0" },
    pastoralist: {
      overridePaths: {
        "packages/a": {
          "react@18.0.0": { dependents: { "pkg-a": "react@^18.0.0" } },
        },
      },
    },
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
  };

  const result = update(options);

  expect(result.overridePaths).toBeDefined();
});

test("update - handles resolutionPaths fallback", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      resolutionPaths: {
        "packages/a": {
          "lodash@4.17.21": { dependents: { "pkg-a": "lodash@^4.17.0" } },
        },
      },
    },
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
  };

  const result = update(options);

  expect(result.appendix).toBeDefined();
});

// =============================================================================
// Fixture-based tests for workspace appendix merge
// =============================================================================

test("update - fixture: merges workspace appendix with existing root entry", () => {
  forceClearCache();
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });

  const pkgADir = resolve(TEST_DIR, "packages", "pkg-a");
  mkdirSync(pkgADir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
    }),
  );

  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    workspaces: ["packages/*"],
  };

  const options: Options = {
    path: "package.json",
    root: TEST_DIR,
    isTesting: true,
    config,
  };

  const result = update(options);

  rmSync(TEST_DIR, { recursive: true, force: true });

  expect(result.appendix).toBeDefined();
  expect(result.appendix?.["lodash@4.17.21"]).toBeDefined();
  expect(result.workspaceAppendix).toBeDefined();
  expect(result.workspaceAppendix?.["lodash@4.17.21"]).toBeDefined();
  const dependents = result.appendix?.["lodash@4.17.21"]?.dependents || {};
  expect(Object.keys(dependents)).toContain("root-app");
  expect(Object.keys(dependents)).toContain("pkg-a");
});

test("update - fixture: adds workspace-only override entry (line 157)", () => {
  forceClearCache();
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });

  const pkgADir = resolve(TEST_DIR, "packages", "pkg-a");
  mkdirSync(pkgADir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { express: "^4.17.0" },
      overrides: { express: "4.18.2" },
    }),
  );

  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    workspaces: ["packages/*"],
  };

  const options: Options = {
    path: "package.json",
    root: TEST_DIR,
    isTesting: true,
    config,
  };

  const result = update(options);

  rmSync(TEST_DIR, { recursive: true, force: true });

  expect(result.appendix).toBeDefined();
  expect(result.workspaceAppendix).toBeDefined();
  expect(result.workspaceAppendix?.["express@4.18.2"]).toBeDefined();
  expect(result.appendix?.["express@4.18.2"]).toBeDefined();
  expect(result.appendix?.["lodash@4.17.21"]).toBeDefined();
});
