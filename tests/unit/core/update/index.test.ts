import { assertHasProperty } from "../../setup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import { update } from "../../../../src/core/update/index";
import {
  clearDependencyGraphCache,
  forceClearCache,
  getDependencyGraph,
} from "../../../../src/core/package";
import {
  determineProcessingMode,
  resolveDepPaths,
  mergeAllConfigs,
  findRemovableOverrides,
  hasConfigOverrides,
} from "../../../../src/core/update/utils";
import type {
  Options,
  PastoralistJSON,
  OverridesType,
  Appendix,
  ResolveOverrides,
} from "../../../../src/types";

const TEST_DIR = resolve(import.meta.dirname, ".test-update");

test("update - returns early context when no config provided", () => {
  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
  };

  const result = update(options);

  assert.deepStrictEqual(result.options, options);
  assert.strictEqual(result.path, "package.json");
  assert.strictEqual(result.root, "./");
  assert.strictEqual(result.isTesting, true);
  assert.strictEqual(result.config, undefined);
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

  assert.strictEqual(result.config, config);
  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
  assert.notStrictEqual(result.appendix, undefined);
  assert.strictEqual(result.mode?.mode, "root");
});

test("update - preserves compact appendix added dates", () => {
  const config = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      compactAppendix: true,
      appendix: { "lodash@4.17.21": { addedDate: "2024-01-15" } },
    },
  };

  const result = update({ config, isTesting: true, addedDate: "2025-02-20" });

  assert.strictEqual(result.appendix?.["lodash@4.17.21"]?.ledger?.addedDate, "2024-01-15");
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

  assert.strictEqual(result.overrides?.lodash, "4.17.21");
  assert.strictEqual(result.overrides?.express, "4.18.2");
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

  assert.notStrictEqual(result.mode, undefined);
  assert.strictEqual(result.overrides?.react, "18.0.0");
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

  assert.notStrictEqual(result.patchMap, undefined);
  assert.strictEqual(typeof result.patchMap, "object");
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

  assert.strictEqual(result.hasRootOverrides, true);
  assert.notStrictEqual(result.rootDeps, undefined);
  assert.strictEqual(result.rootDeps?.lodash, "^4.17.20");
  assert.notStrictEqual(result.missingInRoot, undefined);
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

  assert.notStrictEqual(result.appendix, undefined);
  const appendixKey = "lodash@4.17.21";
  assert.notStrictEqual(result.appendix?.[appendixKey], undefined);
  assert.notStrictEqual(result.appendix?.[appendixKey].dependents, undefined);
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

  assert.strictEqual(result.mode?.hasRootOverrides, false);
  assert.deepStrictEqual(result.finalOverrides, {});
  assert.deepStrictEqual(result.finalAppendix, {});
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

  assert.notStrictEqual(result.finalOverrides, undefined);
  assert.notStrictEqual(result.finalAppendix, undefined);
  assert.strictEqual(result.finalOverrides?.react, "18.0.0");
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

  assert.strictEqual(result.isTesting, true);
  assert.notStrictEqual(result.finalOverrides, undefined);
  assert.notStrictEqual(result.finalAppendix, undefined);
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

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["jest@29.0.0"], undefined);
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

  assert.notStrictEqual(result.appendix, undefined);
  assert.strictEqual(result.rootDeps?.react, "^17.0.0");
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

  assert.notStrictEqual(result.appendix, undefined);
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
        cves: ["CVE-2021-23337"],
        severity: "high",
      },
    ],
    securityProvider: "osv",
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  const appendixEntry = result.appendix?.["lodash@4.17.21"];
  assert.notStrictEqual(appendixEntry, undefined);
  assert.notStrictEqual(appendixEntry?.ledger, undefined);
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

  assert.strictEqual(result.path, "package.json");
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

  assert.strictEqual(result.root, "./");
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

  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
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

  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.react, "18.0.0");
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

  assert.notStrictEqual(result.existingAppendix, undefined);
  assert.notStrictEqual(result.existingAppendix?.["express@4.18.2"], undefined);
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

  assert.strictEqual(result.config, config);
});

test("update - clears dependency graph cache when clearCache option is true", () => {
  clearDependencyGraphCache();
  mkdirSync(TEST_DIR, { recursive: true });

  writeFileSync(
    resolve(TEST_DIR, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 2,
      packages: {
        "": {},
        "node_modules/express": { dependencies: { "body-parser": "^1.20.0" } },
      },
    }),
  );

  assert.ok((getDependencyGraph(TEST_DIR)?.["body-parser"]).includes("express"));

  writeFileSync(
    resolve(TEST_DIR, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 2,
      packages: {
        "": {},
        "node_modules/lodash": { dependencies: { qs: "^6.11.0" } },
      },
    }),
  );

  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
  };

  update({
    config,
    isTesting: true,
    clearCache: true,
  });

  assert.ok((getDependencyGraph(TEST_DIR)?.qs).includes("lodash"));
  assert.strictEqual(getDependencyGraph(TEST_DIR)?.["body-parser"], undefined);

  clearDependencyGraphCache();
  rmSync(TEST_DIR, { recursive: true, force: true });
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

  assert.notStrictEqual(result.appendix, undefined);
  assert.strictEqual(result.mode?.mode, "root");
});

test("update - handles empty final context", () => {
  const options: Options = {
    isTesting: true,
  };

  const result = update(options);

  assert.strictEqual(result.config, undefined);
  assert.strictEqual(result.finalOverrides, undefined);
  assert.strictEqual(result.finalAppendix, undefined);
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

  assert.notStrictEqual(result.appendix, undefined);
  const entry = result.appendix?.["lodash@4.17.21"];
  assert.notStrictEqual(entry, undefined);
});

test("determineProcessingMode - returns root mode when no depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = determineProcessingMode(options, config, true, []);

  assert.strictEqual(result.mode, "root");
  assert.strictEqual(result.hasRootOverrides, true);
  assert.deepStrictEqual(result.missingInRoot, []);
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

  assert.strictEqual(result.mode, "workspace");
  assert.deepStrictEqual(result.depPaths, ["packages/*/package.json"]);
  assert.deepStrictEqual(result.missingInRoot, ["lodash"]);
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

  assert.strictEqual(result.mode, "workspace");
  assert.deepStrictEqual(result.depPaths, ["apps/*/package.json"]);
});

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

  assert.deepStrictEqual(result, ["custom/path"]);
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

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
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

  assert.deepStrictEqual(result, ["packages/package.json"]);
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

  assert.deepStrictEqual(result, ["lib/package.json"]);
});

test("resolveDepPaths - returns workspaces when no config depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("resolveDepPaths - returns null when no depPaths or workspaces", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = resolveDepPaths(options, config);

  assert.strictEqual(result, null);
});

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

  const result = mergeAllConfigs(cliOptions, packageJsonConfig, overridesData, overrides);

  assert.deepStrictEqual(result.overrides, overrides);
  assert.deepStrictEqual(result.overridesData, overridesData);
  assert.deepStrictEqual(result.appendix, packageJsonConfig.appendix);
  assert.deepStrictEqual(result.depPaths, ["cli/path"]);
  assert.notStrictEqual(result.securityOverrideDetails, undefined);
  assert.strictEqual(result.securityProvider, "osv");
});

test("mergeAllConfigs - handles undefined packageJsonConfig", () => {
  const cliOptions: Options = {
    depPaths: ["cli/path"],
  };
  const overridesData: ResolveOverrides = { npm: { express: "4.18.2" } };
  const overrides: OverridesType = { express: "4.18.2" };

  const result = mergeAllConfigs(cliOptions, undefined, overridesData, overrides);

  assert.deepStrictEqual(result.overrides, overrides);
  assert.deepStrictEqual(result.depPaths, ["cli/path"]);
  assert.strictEqual(result.appendix, undefined);
});

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

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, ["react"]);
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

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
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

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
});

test("findRemovableOverrides - keeps overrides missing in root", () => {
  const overrides: OverridesType = {
    react: "18.0.0",
  };
  const appendix: Appendix = {};
  const allDeps = {};
  const missingInRoot: string[] = ["react"];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
});

test("hasConfigOverrides - returns true for security overrides", () => {
  const options: Options = {
    securityOverrides: { lodash: "4.17.21" },
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - returns true for npm overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: { express: "4.18.2" },
  };

  const result = hasConfigOverrides({}, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - returns true for yarn resolutions", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    resolutions: { lodash: "4.17.21" },
  };

  const result = hasConfigOverrides({}, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - returns true for pnpm overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pnpm: {
      overrides: { react: "18.0.0" },
    },
  };

  const result = hasConfigOverrides({}, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - returns false when no overrides", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
  };

  const result = hasConfigOverrides({}, config);

  assert.strictEqual(result, false);
});

test("hasConfigOverrides - returns false when empty overrides", () => {
  const options: Options = {
    securityOverrides: {},
  };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    overrides: {},
  };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, false);
});

test("hasConfigOverrides - handles undefined options and config", () => {
  const result = hasConfigOverrides(undefined, {} as PastoralistJSON);

  assert.strictEqual(result, false);
});

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

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
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

  assert.strictEqual(result.isTesting, true);
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

  assert.strictEqual(result.isTesting, true);
  assert.notStrictEqual(result.finalOverrides, undefined);
});

test("update - handles config with no appendix or overrides data", () => {
  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    depPaths: [],
  };

  const result = update(options);

  assert.strictEqual(result.path, "package.json");
  assert.strictEqual(result.config, undefined);
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

  assert.notStrictEqual(result.appendix?.["react@18.2.0"], undefined);
});

test("update - stepWriteResult skips when hasNoData is true", () => {
  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: false,
    config: undefined,
  };

  const result = update(options);

  assert.strictEqual(result.config, undefined);
  assert.strictEqual(result.finalAppendix, undefined);
  assert.strictEqual(result.finalOverrides, undefined);
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

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"]?.dependents, undefined);
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

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.appendix?.["express@4.18.2"], undefined);
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

  assert.notStrictEqual(result.overridePaths, undefined);
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

  assert.notStrictEqual(result.appendix, undefined);
});

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

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.workspaceAppendix, undefined);
  assert.notStrictEqual(result.workspaceAppendix?.["lodash@4.17.21"], undefined);
  const dependents = result.appendix?.["lodash@4.17.21"]?.dependents || {};
  assert.ok(Object.keys(dependents).includes("root-app"));
  assert.ok(Object.keys(dependents).includes("pkg-a"));
});

test("update - workspace appendix uses dependency graph for transitive overrides", () => {
  clearDependencyGraphCache();
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
      dependencies: { express: "^4.18.0" },
    }),
  );

  writeFileSync(
    resolve(TEST_DIR, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 2,
      packages: {
        "": {},
        "node_modules/express": {
          version: "4.18.0",
          dependencies: { "body-parser": "^1.20.0" },
        },
        "node_modules/body-parser": { version: "1.20.0" },
      },
    }),
  );

  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    overrides: { "body-parser": "1.20.0" },
    workspaces: ["packages/*"],
  };

  const result = update({
    path: resolve(TEST_DIR, "package.json"),
    root: TEST_DIR,
    config,
    dryRun: true,
    outputFormat: "json",
  });

  rmSync(TEST_DIR, { recursive: true, force: true });
  clearDependencyGraphCache();

  assert.notStrictEqual(result.workspaceAppendix?.["body-parser@1.20.0"], undefined);
  assert.strictEqual(
    result.workspaceAppendix?.["body-parser@1.20.0"]?.dependents?.["pkg-a"],
    "body-parser (required by express)",
  );
  assertHasProperty(result.appendix?.["body-parser@1.20.0"]?.dependents, "pkg-a");
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

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.workspaceAppendix, undefined);
  assert.notStrictEqual(result.workspaceAppendix?.["express@4.18.2"], undefined);
  assert.notStrictEqual(result.appendix?.["express@4.18.2"], undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
});

test("update - processes overrides declared only by workspace packages", () => {
  forceClearCache();
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
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
    workspaces: ["packages/*"],
  };
  const result = update({ root: TEST_DIR, isTesting: true, config });

  rmSync(TEST_DIR, { recursive: true, force: true });
  assert.notStrictEqual(result.workspaceAppendix?.["express@4.18.2"], undefined);
  assert.notStrictEqual(result.appendix?.["express@4.18.2"], undefined);
});

test("update - metrics include medium severity count", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
  };

  const options: Options = {
    config,
    securityOverrides: { lodash: "4.17.21" },
    securityOverrideDetails: [{ packageName: "lodash", reason: "medium vuln", severity: "medium" }],
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
  assert.strictEqual(result.metrics?.severityMedium, 1);
});

test("update - metrics include low severity count", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { express: "^4.17.0" },
  };

  const options: Options = {
    config,
    securityOverrides: { express: "4.18.2" },
    securityOverrideDetails: [{ packageName: "express", reason: "low vuln", severity: "low" }],
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
  assert.strictEqual(result.metrics?.severityLow, 1);
});

test("update - metrics track removed override packages", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": { dependents: { "test-app": "lodash@^4.17.20" } },
        "express@4.18.2": { dependents: {} },
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
});

test("update - skips lock file parsing without summary or json flag", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.strictEqual(result.metrics?.packagesScanned, 0);
});

test("update - parses lock file with summary flag", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  };

  const options: Options = {
    config,
    summary: true,
    isTesting: true,
  };

  const result = update(options);

  assert.ok(result.metrics?.packagesScanned >= 0);
});

test("update - parses lock file with json outputFormat", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  };

  const options: Options = {
    config,
    outputFormat: "json",
    isTesting: true,
  };

  const result = update(options);

  assert.ok(result.metrics?.packagesScanned >= 0);
});

test("update - tracks removed overrides in metrics", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.21" },
    overrides: {
      "old-package": "1.0.0",
      "another-old": "2.0.0",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
  assert.ok(result.metrics?.overridesRemoved >= 0);
  assert.notStrictEqual(result.metrics?.removedOverridePackages, undefined);
});

test("update - handles config with no overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.21" },
  };

  const options: Options = {
    config,
    isTesting: true,
  };

  const result = update(options);

  assert.strictEqual(result.mode?.hasRootOverrides, false);
  assert.deepStrictEqual(result.finalOverrides, {});
  assert.deepStrictEqual(result.finalAppendix, {});
});

test("update - tracks override metrics including removed packages array", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.21" },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    summary: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
  assert.strictEqual(Array.isArray(result.metrics?.removedOverridePackages), true);
  assert.strictEqual(typeof result.metrics?.overridesAdded, "number");
  assert.strictEqual(typeof result.metrics?.overridesRemoved, "number");
});

test("update - logs unused patches when patches exist for missing dependencies", () => {
  const PATCH_TEST_DIR = resolve(import.meta.dirname, ".test-update-patches");

  if (existsSync(PATCH_TEST_DIR)) {
    rmSync(PATCH_TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(resolve(PATCH_TEST_DIR, "patches"), { recursive: true });
  writeFileSync(resolve(PATCH_TEST_DIR, "patches/unused-pkg+1.0.0.patch"), "patch content");

  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.21" },
    overrides: { lodash: "4.17.21" },
  };

  const options: Options = {
    config,
    root: PATCH_TEST_DIR,
    isTesting: true,
  };

  const result = update(options);

  rmSync(PATCH_TEST_DIR, { recursive: true, force: true });

  assert.notStrictEqual(result.patchMap, undefined);
  assert.notStrictEqual(result.patchMap?.["unused-pkg"], undefined);
  assert.strictEqual(result.unusedPatchCount, 1);
});

test("update - counts removed overrides when config overrides differ from final", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {},
    overrides: {
      "old-override": "1.0.0",
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    summary: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
  assert.notStrictEqual(result.metrics?.overridesAdded, undefined);
  assert.notStrictEqual(result.metrics?.removedOverridePackages, undefined);
});

test("update - stepRemoveUnused removes unused overrides when removeUnused is true", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", "unused-pkg": "1.0.0" },
  };

  const options: Options = {
    config,
    isTesting: true,
    removeUnused: true,
  };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.lodash, "4.17.21");
  assert.strictEqual(result.finalOverrides?.["unused-pkg"], undefined);
  assert.strictEqual(result.finalAppendix?.["unused-pkg@1.0.0"], undefined);
  assert.notStrictEqual(result.finalAppendix?.["lodash@4.17.21"], undefined);
});

test("update - stepRemoveUnused skips when removeUnused is false", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", "unused-pkg": "1.0.0" },
  };

  const options: Options = {
    config,
    isTesting: true,
    removeUnused: false,
  };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["unused-pkg"], "1.0.0");
  assert.notStrictEqual(result.finalAppendix?.["unused-pkg@1.0.0"], undefined);
});

test("update - preserves potentially transitive overrides when no dependency graph is available", () => {
  clearDependencyGraphCache();
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { express: "4.18.2" },
    overrides: { "body-parser": "1.20.3" },
  };
  const packagePath = resolve(TEST_DIR, "package.json");
  writeFileSync(packagePath, JSON.stringify(config));

  try {
    const result = update({
      config,
      path: packagePath,
      root: TEST_DIR,
      dryRun: true,
      removeUnused: true,
    });

    assert.strictEqual(result.finalOverrides?.["body-parser"], "1.20.3");
  } finally {
    clearDependencyGraphCache();
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test("update - stepRemoveUnused handles scoped packages", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", "@babel/core": "7.20.0" },
  };

  const options: Options = {
    config,
    isTesting: true,
    removeUnused: true,
  };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["@babel/core"], undefined);
  assert.strictEqual(result.finalOverrides?.lodash, "4.17.21");
});

test("update - stepRemoveUnused respects keep: true, does not remove kept overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", "kept-pkg": "2.0.0" },
    pastoralist: {
      appendix: {
        "kept-pkg@2.0.0": {
          dependents: { root: "kept-pkg (unused override)" },
          ledger: {
            addedDate: "2024-01-01",
            keep: true,
            cves: ["CVE-2024-1234"],
          },
        },
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    removeUnused: true,
  };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["kept-pkg"], "2.0.0");
  assert.notStrictEqual(result.finalAppendix?.["kept-pkg@2.0.0"], undefined);
});

test("update - stepUpdateKeptOverrides populates potentiallyFixedIn from matching alert", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { "some-pkg": "^1.0.0" },
    overrides: { "some-pkg": "1.0.0" },
    pastoralist: {
      appendix: {
        "some-pkg@1.0.0": {
          dependents: { root: "some-pkg@^1.0.0" },
          ledger: {
            addedDate: "2024-01-01",
            keep: true,
            cves: ["CVE-2024-9999"],
          },
        },
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    securityAlerts: [
      {
        packageName: "some-pkg",
        currentVersion: "1.0.0",
        vulnerableVersions: "< 2.0.0",
        patchedVersion: "2.0.0",
        severity: "high",
        title: "Test vuln",
        cves: ["CVE-2024-9999"],
        fixAvailable: true,
      },
    ],
  };

  const result = update(options);

  assert.strictEqual(result.appendix?.["some-pkg@1.0.0"]?.ledger?.potentiallyFixedIn, "2.0.0");
});

test("update - stepUpdateKeptOverrides clears potentiallyFixedIn when no matching alert", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { "some-pkg": "^1.0.0" },
    overrides: { "some-pkg": "1.0.0" },
    pastoralist: {
      appendix: {
        "some-pkg@1.0.0": {
          dependents: { root: "some-pkg@^1.0.0" },
          ledger: {
            addedDate: "2024-01-01",
            keep: true,
            cves: ["CVE-2024-9999"],
            potentiallyFixedIn: "2.0.0",
          },
        },
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    securityAlerts: [],
  };

  const result = update(options);

  assert.strictEqual(result.appendix?.["some-pkg@1.0.0"]?.ledger?.potentiallyFixedIn, undefined);
});

test("update - stepRemoveUnused respects skipRemovalKeys, keeps blocked overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {},
    overrides: { "removable-fake-pkg": "1.0.0", "blocked-fake-pkg": "2.0.0" },
  };

  const options: Options = {
    config,
    isTesting: true,
    removeUnused: true,
    skipRemovalKeys: ["blocked-fake-pkg@2.0.0"],
  };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["removable-fake-pkg"], undefined);
  assert.strictEqual(result.finalOverrides?.["blocked-fake-pkg"], "2.0.0");
  assert.strictEqual(result.finalAppendix?.["removable-fake-pkg@1.0.0"], undefined);
  assert.notStrictEqual(result.finalAppendix?.["blocked-fake-pkg@2.0.0"], undefined);
});

test("update - stepRemoveUnused removes only verified keys", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: { removable: "1.0.0", unverified: "2.0.0" },
  };
  const options: Options = {
    config,
    isTesting: true,
    removeUnused: true,
    removalVerification: {
      removableKeys: ["removable@1.0.0", "unverified@2.0.0"],
      allowedKeys: ["removable@1.0.0"],
      blockedKeys: ["unverified@2.0.0"],
      beforeAlertCount: 0,
      afterAlertCount: 1,
      beforeRiskScore: 0,
      afterRiskScore: 3,
      newVulnerabilityKeys: ["unverified@1.0.0:advisory"],
      status: "blocked",
    },
  };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.removable, undefined);
  assert.strictEqual(result.finalOverrides?.unverified, "2.0.0");
});

test("update - stepRemoveUnused respects keep: KeepConstraint, does not remove kept overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21", "kept-constraint-pkg": "2.0.0" },
    pastoralist: {
      appendix: {
        "kept-constraint-pkg@2.0.0": {
          dependents: { root: "kept-constraint-pkg (unused override)" },
          ledger: {
            addedDate: "2024-01-01",
            keep: { reason: "awaiting upstream fix", untilVersion: "3.0.0" },
            cves: ["CVE-2024-5678"],
          },
        },
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    removeUnused: true,
  };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["kept-constraint-pkg"], "2.0.0");
  assert.notStrictEqual(result.finalAppendix?.["kept-constraint-pkg@2.0.0"], undefined);
});

test("update - stepRemoveUnused warns when removing overrides with tracked CVEs", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: {},
    overrides: { "vuln-pkg": "1.2.3" },
    pastoralist: {
      appendix: {
        "vuln-pkg@1.2.3": {
          dependents: { root: "vuln-pkg (unused override)" },
          ledger: {
            addedDate: "2024-01-01",
            cves: ["CVE-2024-0001"],
          },
        },
      },
    },
  };

  const options: Options = { config, isTesting: true, removeUnused: true };
  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["vuln-pkg"], undefined);
  assert.strictEqual(result.finalAppendix?.["vuln-pkg@1.2.3"], undefined);
});

test("update - stepUpdateKeptOverrides handles keep: KeepConstraint entries", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: { "some-pkg": "^1.0.0" },
    overrides: { "some-pkg": "1.0.0" },
    pastoralist: {
      appendix: {
        "some-pkg@1.0.0": {
          dependents: { root: "some-pkg@^1.0.0" },
          ledger: {
            addedDate: "2024-01-01",
            keep: { reason: "awaiting upstream fix" },
            cves: ["CVE-2024-9999"],
          },
        },
      },
    },
  };

  const options: Options = {
    config,
    isTesting: true,
    securityAlerts: [
      {
        packageName: "some-pkg",
        currentVersion: "1.0.0",
        vulnerableVersions: "< 2.0.0",
        patchedVersion: "2.0.0",
        severity: "high",
        title: "Test vuln",
        cves: ["CVE-2024-9999"],
        fixAvailable: true,
      },
    ],
  };

  const result = update(options);

  assert.strictEqual(result.appendix?.["some-pkg@1.0.0"]?.ledger?.potentiallyFixedIn, "2.0.0");
});

const countSeveritiesConfig = {
  name: "test-pkg",
  version: "1.0.0",
  overrides: { lodash: "4.17.21" },
  dependencies: { lodash: "4.17.19" },
};

test("countSeverities - empty securityOverrideDetails produces zero severity counts", () => {
  const result = update({
    config: countSeveritiesConfig,
    isTesting: true,
    summary: true,
    securityOverrideDetails: [],
  });
  assert.strictEqual(result.metrics?.severityCritical, 0);
  assert.strictEqual(result.metrics?.severityHigh, 0);
  assert.strictEqual(result.metrics?.severityMedium, 0);
  assert.strictEqual(result.metrics?.severityLow, 0);
});

test("countSeverities - mixed severities are counted correctly", () => {
  const result = update({
    config: countSeveritiesConfig,
    isTesting: true,
    summary: true,
    securityOverrideDetails: [
      { packageName: "a", reason: "fix", severity: "critical" },
      { packageName: "b", reason: "fix", severity: "high" },
      { packageName: "c", reason: "fix", severity: "high" },
      { packageName: "d", reason: "fix", severity: "medium" },
      { packageName: "e", reason: "fix", severity: "low" },
    ],
  });
  assert.strictEqual(result.metrics?.severityCritical, 1);
  assert.strictEqual(result.metrics?.severityHigh, 2);
  assert.strictEqual(result.metrics?.severityMedium, 1);
  assert.strictEqual(result.metrics?.severityLow, 1);
});

test("countSeverities - missing severity defaults to medium", () => {
  const result = update({
    config: countSeveritiesConfig,
    isTesting: true,
    summary: true,
    securityOverrideDetails: [
      { packageName: "a", reason: "fix" },
      { packageName: "b", reason: "fix", severity: undefined },
    ],
  });
  assert.strictEqual(result.metrics?.severityMedium, 2);
  assert.strictEqual(result.metrics?.severityCritical, 0);
});

test("countSeverities - severity matching is case-insensitive", () => {
  const result = update({
    config: countSeveritiesConfig,
    isTesting: true,
    summary: true,
    securityOverrideDetails: [
      { packageName: "a", reason: "fix", severity: "HIGH" },
      { packageName: "b", reason: "fix", severity: "Critical" },
    ],
  });
  assert.strictEqual(result.metrics?.severityHigh, 1);
  assert.strictEqual(result.metrics?.severityCritical, 1);
});
