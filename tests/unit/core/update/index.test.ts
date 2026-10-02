import { assertHasProperty } from "../../setup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
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

const nodeModulesReact = { version: "18.2.0" };
const packagesNodeModulesLodash = { version: "4.17.21" };
const lOCKED_PACKAGES_LOCKFILEPackages = { name: "test-app", version: "1.0.0" };
const lOCKED_PACKAGES_LOCKFILEPackages2 = {
  "": lOCKED_PACKAGES_LOCKFILEPackages,
  "node_modules/lodash": packagesNodeModulesLodash,
  "node_modules/react": nodeModulesReact,
};
const LOCKED_PACKAGES_LOCKFILE = {
  lockfileVersion: 3,
  packages: lOCKED_PACKAGES_LOCKFILEPackages2,
};

const PKG_A_DIR = resolve(TEST_DIR, "packages", "pkg-a");

const resetTestDir = () => {
  forceClearCache();
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
};

const TEST_PACKAGE_PATH = resolve(TEST_DIR, "package.json");

const writeLockfile = (packages: object) => {
  const lockfile = { lockfileVersion: 2, packages };
  writeFileSync(resolve(TEST_DIR, "package-lock.json"), JSON.stringify(lockfile));
};

const writePkgAManifest = (manifest: object) => {
  mkdirSync(PKG_A_DIR, { recursive: true });
  writeFileSync(resolve(PKG_A_DIR, "package.json"), JSON.stringify(manifest));
};

const withLockfileRoot = (fn: (root: string) => void) => {
  const root = mkdtempSync(resolve(tmpdir(), "pastoralist-"));
  writeFileSync(resolve(root, "package-lock.json"), JSON.stringify(LOCKED_PACKAGES_LOCKFILE));
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test("update - returns early context when no config provided", () => {
  const options: Options = { path: "package.json", root: "./", isTesting: true };

  const result = update(options);

  assert.deepStrictEqual(result.options, options);
  assert.strictEqual(result.path, "package.json");
  assert.strictEqual(result.root, "./");
  assert.strictEqual(result.isTesting, true);
  assert.strictEqual(result.config, undefined);
});

const configOverrides49 = { lodash: "4.17.21" };
const configDependencies45 = { lodash: "^4.17.20" };
test("update - processes simple override in root mode", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies45,
    overrides: configOverrides49,
  };

  const options: Options = { config, isTesting: true, debug: false };

  const result = update(options);

  assert.strictEqual(result.config, config);
  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
  assert.notStrictEqual(result.appendix, undefined);
  assert.strictEqual(result.mode?.mode, "root");
});

const pastoralistAppendixLodash = { addedDate: "2024-01-15" };
const pastoralistAppendix9 = { "lodash@4.17.21": pastoralistAppendixLodash };
const configPastoralist18 = { compactAppendix: true, appendix: pastoralistAppendix9 };
const configOverrides48 = { lodash: "4.17.21" };
const configDependencies44 = { lodash: "^4.17.20" };
test("update - preserves compact appendix added dates", () => {
  const config = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies44,
    overrides: configOverrides48,
    pastoralist: configPastoralist18,
  };

  const result = update({ config, isTesting: true, addedDate: "2025-02-20" });

  assert.strictEqual(result.appendix?.["lodash@4.17.21"]?.ledger?.addedDate, "2024-01-15");
});

const optionsSecurityOverrides5 = { express: "4.18.2" };
const configOverrides47 = { lodash: "4.17.21" };
const configDependencies43 = { lodash: "^4.17.20", express: "^4.17.0" };
test("update - merges security overrides with config overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies43,
    overrides: configOverrides47,
  };

  const options: Options = {
    config,
    securityOverrides: optionsSecurityOverrides5,
    isTesting: true,
  };

  const result = update(options);

  assert.strictEqual(result.overrides?.lodash, "4.17.21");
  assert.strictEqual(result.overrides?.express, "4.18.2");
});

const optionsDepPaths8 = [];
const configOverrides46 = { react: "18.0.0" };
const configWorkspaces7 = ["packages/*"];
test("update - determines workspace mode without file I/O", () => {
  const config: PastoralistJSON = {
    name: "monorepo-root",
    version: "1.0.0",
    workspaces: configWorkspaces7,
    overrides: configOverrides46,
  };

  const options: Options = { config, depPaths: optionsDepPaths8, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.mode, undefined);
  assert.strictEqual(result.overrides?.react, "18.0.0");
});

const configOverrides45 = { lodash: "4.17.21" };
test("update - detects patches when present", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: configOverrides45,
  };

  const options: Options = { config, root: "./", isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.patchMap, undefined);
  assert.strictEqual(typeof result.patchMap, "object");
});

const configOverrides44 = { lodash: "4.17.21" };
const configDependencies42 = { lodash: "^4.17.20" };
test("update - determines processing mode correctly", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies42,
    overrides: configOverrides44,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.strictEqual(result.hasRootOverrides, true);
  assert.notStrictEqual(result.rootDeps, undefined);
  assert.strictEqual(result.rootDeps?.lodash, "^4.17.20");
  assert.notStrictEqual(result.missingInRoot, undefined);
});

const configOverrides43 = { lodash: "4.17.21" };
const configDependencies41 = { lodash: "^4.17.20" };
test("update - builds appendix with dependents", () => {
  const config: PastoralistJSON = {
    name: "my-app",
    version: "1.0.0",
    dependencies: configDependencies41,
    overrides: configOverrides43,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  const appendixKey = "lodash@4.17.21";
  assert.notStrictEqual(result.appendix?.[appendixKey], undefined);
  assert.notStrictEqual(result.appendix?.[appendixKey].dependents, undefined);
});

const configDependencies40 = { lodash: "^4.17.20" };
test("update - handles empty overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies40,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.strictEqual(result.mode?.hasRootOverrides, false);
  assert.deepStrictEqual(result.finalOverrides, {});
  assert.deepStrictEqual(result.finalAppendix, {});
});

const configOverrides42 = { react: "18.0.0" };
const configDependencies39 = { react: "^17.0.0" };
test("update - sets finalOverrides and finalAppendix in cleanup step", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies39,
    overrides: configOverrides42,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.finalOverrides, undefined);
  assert.notStrictEqual(result.finalAppendix, undefined);
  assert.strictEqual(result.finalOverrides?.react, "18.0.0");
});

const configOverrides41 = { lodash: "4.17.21" };
const configDependencies38 = { lodash: "^4.17.20" };
test("update - skips write when isTesting is true", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies38,
    overrides: configOverrides41,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.strictEqual(result.isTesting, true);
  assert.notStrictEqual(result.finalOverrides, undefined);
  assert.notStrictEqual(result.finalAppendix, undefined);
});

const configOverrides40 = { jest: "29.0.0" };
const devDependencies = { jest: "^28.0.0" };
test("update - handles devDependencies", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    devDependencies,
    overrides: configOverrides40,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["jest@29.0.0"], undefined);
});

const configOverrides39 = { react: "18.0.0" };
const configPeerDependencies = { react: "^17.0.0" };
test("update - handles peerDependencies", () => {
  const config: PastoralistJSON = {
    name: "test-lib",
    version: "1.0.0",
    peerDependencies: configPeerDependencies,
    overrides: configOverrides39,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  assert.strictEqual(result.rootDeps?.react, "^17.0.0");
});

const overridesReact = { "react-dom": "18.2.0" };
const configOverrides38 = { react: overridesReact };
const configDependencies37 = { react: "^18.0.0" };
test("update - handles nested overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies37,
    overrides: configOverrides38,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
});

const securityOverrideDetailsCves = ["CVE-2021-23337"];
const optionsSecurityOverrideDetails3 = [
  {
    packageName: "lodash",
    reason: "Security vulnerability CVE-2021-23337",
    cves: securityOverrideDetailsCves,
    severity: "high",
  },
];
const optionsSecurityOverrides4 = { lodash: "4.17.21" };
const configDependencies36 = { lodash: "^4.17.20" };
test("update - includes security override details in appendix", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies36,
  };

  const options: Options = {
    config,
    securityOverrides: optionsSecurityOverrides4,
    securityOverrideDetails: optionsSecurityOverrideDetails3,
    securityProvider: "osv",
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  const appendixEntry = result.appendix?.["lodash@4.17.21"];
  assert.notStrictEqual(appendixEntry, undefined);
  assert.notStrictEqual(appendixEntry?.ledger, undefined);
});

const configOverrides37 = {};
test("update - uses default path when not provided", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: configOverrides37,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.strictEqual(result.path, "package.json");
});

const configOverrides36 = {};
test("update - uses default root when not provided", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: configOverrides36,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.strictEqual(result.root, "./");
});

const configResolutions = { lodash: "4.17.21" };
const configDependencies35 = { lodash: "^4.17.20" };
test("update - handles yarn resolutions", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies35,
    resolutions: configResolutions,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.lodash, "4.17.21");
});

const configPnpmOverrides = { react: "18.0.0" };
const configPnpm = { overrides: configPnpmOverrides };
const configDependencies34 = { react: "^17.0.0" };
test("update - handles pnpm overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies34,
    pnpm: configPnpm,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.overrides, undefined);
  assert.strictEqual(result.overrides?.react, "18.0.0");
});

const appendixExpressDependents = { "old-app": "express@^4.17.0" };
const appendixExpress = { dependents: appendixExpressDependents };
const pastoralistAppendix8 = { "express@4.18.2": appendixExpress };
const configPastoralist17 = { appendix: pastoralistAppendix8 };
const configOverrides35 = { lodash: "4.17.21" };
const configDependencies33 = { lodash: "^4.17.20" };
test("update - preserves existing appendix entries", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies33,
    overrides: configOverrides35,
    pastoralist: configPastoralist17,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.existingAppendix, undefined);
  assert.notStrictEqual(result.existingAppendix?.["express@4.18.2"], undefined);
});

const configOverrides34 = { lodash: "4.17.21" };
test("update - clears cache when clearCache option is true", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: configOverrides34,
  };

  const options: Options = { config, isTesting: true, clearCache: true };

  const result = update(options);

  assert.strictEqual(result.config, config);
});

const lockfileRootEntry = {};
const lodashLockDependencies = { qs: "^6.11.0" };
const lodashLockEntry = { dependencies: lodashLockDependencies };
const lodashLockPackages = { "": lockfileRootEntry, "node_modules/lodash": lodashLockEntry };
const expressLockDependencies = { "body-parser": "^1.20.0" };
const expressLockEntry = { dependencies: expressLockDependencies };
const expressLockPackages = { "": lockfileRootEntry, "node_modules/express": expressLockEntry };
test("update - clears dependency graph cache when clearCache option is true", () => {
  clearDependencyGraphCache();
  mkdirSync(TEST_DIR, { recursive: true });

  writeFileSync(
    resolve(TEST_DIR, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 2, packages: expressLockPackages }),
  );

  assert.ok(getDependencyGraph(TEST_DIR)?.["body-parser"]?.includes("express"));

  writeFileSync(
    resolve(TEST_DIR, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 2, packages: lodashLockPackages }),
  );

  const config: PastoralistJSON = { name: "test-app", version: "1.0.0" };

  update({ config, isTesting: true, clearCache: true });

  assert.ok(getDependencyGraph(TEST_DIR)?.qs?.includes("lodash"));
  assert.strictEqual(getDependencyGraph(TEST_DIR)?.["body-parser"], undefined);

  clearDependencyGraphCache();
  rmSync(TEST_DIR, { recursive: true, force: true });
});

const optionsDepPaths7 = [];
const configOverrides33 = { lodash: "4.17.21" };
const configDependencies32 = { lodash: "^4.17.20" };
test("update - handles config with workspaces but no depPaths", () => {
  const config: PastoralistJSON = {
    name: "monorepo",
    version: "1.0.0",
    dependencies: configDependencies32,
    overrides: configOverrides33,
  };

  const options: Options = { config, depPaths: optionsDepPaths7, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  assert.strictEqual(result.mode?.mode, "root");
});

test("update - handles empty final context", () => {
  const options: Options = { isTesting: true };

  const result = update(options);

  assert.strictEqual(result.config, undefined);
  assert.strictEqual(result.finalOverrides, undefined);
  assert.strictEqual(result.finalAppendix, undefined);
});

const overrideReasons = { lodash: "Upgrade for performance improvements" };
const configPastoralist16 = { overrideReasons };
const configOverrides32 = { lodash: "4.17.21" };
const configDependencies31 = { lodash: "^4.17.20" };
test("update - processes manualOverrideReasons", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies31,
    overrides: configOverrides32,
    pastoralist: configPastoralist16,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
});

test("determineProcessingMode - returns root mode when no depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = determineProcessingMode(options, config, true, []);

  assert.strictEqual(result.mode, "root");
  assert.strictEqual(result.hasRootOverrides, true);
  assert.deepStrictEqual(result.missingInRoot, []);
});

const optionsDepPaths6 = ["packages/*/package.json"];
test("determineProcessingMode - returns workspace mode when options depPaths", () => {
  const options: Options = { depPaths: optionsDepPaths6 };
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = determineProcessingMode(options, config, false, ["lodash"]);

  assert.strictEqual(result.mode, "workspace");
  assert.deepStrictEqual(result.depPaths, ["packages/*/package.json"]);
  assert.deepStrictEqual(result.missingInRoot, ["lodash"]);
});

const pastoralistDepPaths2 = ["apps/*/package.json"];
const configPastoralist15 = { depPaths: pastoralistDepPaths2 };
test("determineProcessingMode - returns workspace mode when config depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist15,
  };

  const result = determineProcessingMode(options, config, true, []);

  assert.strictEqual(result.mode, "workspace");
  assert.deepStrictEqual(result.depPaths, ["apps/*/package.json"]);
});

const configPastoralistDepPaths = ["other/path"];
const configPastoralist14 = { depPaths: configPastoralistDepPaths };
const optionsDepPaths5 = ["custom/path"];
test("resolveDepPaths - returns options depPaths when provided", () => {
  const options: Options = { depPaths: optionsDepPaths5 };
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist14,
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["custom/path"]);
});

const configPastoralist13 = { depPaths: "workspace" };
const configWorkspaces6 = ["packages/*", "apps/*"];
test("resolveDepPaths - resolves workspace keyword to workspace paths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces6,
    pastoralist: configPastoralist13,
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
});

const configPastoralist12 = { depPaths: "workspaces" };
const configWorkspaces5 = ["packages"];
test("resolveDepPaths - handles workspaces keyword", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces5,
    pastoralist: configPastoralist12,
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/package.json"]);
});

const pastoralistDepPaths = ["lib/package.json"];
const configPastoralist11 = { depPaths: pastoralistDepPaths };
test("resolveDepPaths - returns config depPaths array", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: configPastoralist11,
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["lib/package.json"]);
});

const configWorkspaces4 = ["packages/*"];
test("resolveDepPaths - returns workspaces when no config depPaths", () => {
  const options: Options = {};
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: configWorkspaces4,
  };

  const result = resolveDepPaths(options, config);

  assert.deepStrictEqual(result, ["packages/*/package.json"]);
});

test("resolveDepPaths - returns null when no depPaths or workspaces", () => {
  const options: Options = {};
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = resolveDepPaths(options, config);

  assert.strictEqual(result, null);
});

const overridesDataNpm = { lodash: "4.17.21" };
const packageJsonConfigDepPaths = ["config/path"];
const lodashDependents4 = {};
const packageJsonConfigAppendixLodash = { dependents: lodashDependents4 };
const packageJsonConfigAppendix = { "lodash@4.17.21": packageJsonConfigAppendixLodash };
const cliOptionsSecurityOverrideDetails = [{ packageName: "lodash", reason: "security" }];
const cliOptionsDepPaths2 = ["cli/path"];
test("mergeAllConfigs - merges CLI options and package.json config", () => {
  const cliOptions: Options = {
    depPaths: cliOptionsDepPaths2,
    securityOverrideDetails: cliOptionsSecurityOverrideDetails,
    securityProvider: "osv",
  };
  const packageJsonConfig = {
    appendix: packageJsonConfigAppendix,
    depPaths: packageJsonConfigDepPaths,
  };
  const overridesData: ResolveOverrides = { npm: overridesDataNpm };
  const overrides: OverridesType = { lodash: "4.17.21" };

  const result = mergeAllConfigs(cliOptions, packageJsonConfig, overridesData, overrides);

  assert.deepStrictEqual(result.overrides, overrides);
  assert.deepStrictEqual(result.overridesData, overridesData);
  assert.deepStrictEqual(result.appendix, packageJsonConfig.appendix);
  assert.deepStrictEqual(result.depPaths, ["cli/path"]);
  assert.notStrictEqual(result.securityOverrideDetails, undefined);
  assert.strictEqual(result.securityProvider, "osv");
});

const npm = { express: "4.18.2" };
const cliOptionsDepPaths = ["cli/path"];
test("mergeAllConfigs - handles undefined packageJsonConfig", () => {
  const cliOptions: Options = { depPaths: cliOptionsDepPaths };
  const overridesData: ResolveOverrides = { npm };
  const overrides: OverridesType = { express: "4.18.2" };

  const result = mergeAllConfigs(cliOptions, undefined, overridesData, overrides);

  assert.deepStrictEqual(result.overrides, overrides);
  assert.deepStrictEqual(result.depPaths, ["cli/path"]);
  assert.strictEqual(result.appendix, undefined);
});

const lodashDependents3 = { app: "lodash@^4.17.0" };
const appendixLodash3 = { dependents: lodashDependents3 };
test("findRemovableOverrides - finds unused overrides", () => {
  const overrides: OverridesType = { lodash: "4.17.21", express: "4.18.2", react: "18.0.0" };
  const appendix: Appendix = { "lodash@4.17.21": appendixLodash3 };
  const allDeps = { express: "^4.18.0" };
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, ["react"]);
});

const lodashDependents2 = { app: "lodash@^4.17.0" };
const appendixLodash2 = { dependents: lodashDependents2 };
test("findRemovableOverrides - keeps overrides used in appendix", () => {
  const overrides: OverridesType = { lodash: "4.17.21" };
  const appendix: Appendix = { "lodash@4.17.21": appendixLodash2 };
  const allDeps = {};
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
});

test("findRemovableOverrides - keeps overrides with root dependencies", () => {
  const overrides: OverridesType = { express: "4.18.2" };
  const appendix: Appendix = {};
  const allDeps = { express: "^4.18.0" };
  const missingInRoot: string[] = [];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
});

test("findRemovableOverrides - keeps overrides missing in root", () => {
  const overrides: OverridesType = { react: "18.0.0" };
  const appendix: Appendix = {};
  const allDeps = {};
  const missingInRoot: string[] = ["react"];

  const result = findRemovableOverrides(overrides, appendix, allDeps, missingInRoot);

  assert.deepStrictEqual(result, []);
});

const optionsSecurityOverrides3 = { lodash: "4.17.21" };
test("hasConfigOverrides - returns true for security overrides", () => {
  const options: Options = { securityOverrides: optionsSecurityOverrides3 };
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, true);
});

const configOverrides31 = { express: "4.18.2" };
test("hasConfigOverrides - returns true for npm overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", overrides: configOverrides31 };

  const result = hasConfigOverrides({}, config);

  assert.strictEqual(result, true);
});

const resolutions = { lodash: "4.17.21" };
test("hasConfigOverrides - returns true for yarn resolutions", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", resolutions };

  const result = hasConfigOverrides({}, config);

  assert.strictEqual(result, true);
});

const pnpmOverrides = { react: "18.0.0" };
const pnpm = { overrides: pnpmOverrides };
test("hasConfigOverrides - returns true for pnpm overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0", pnpm };

  const result = hasConfigOverrides({}, config);

  assert.strictEqual(result, true);
});

test("hasConfigOverrides - returns false when no overrides", () => {
  const config: PastoralistJSON = { name: "test", version: "1.0.0" };

  const result = hasConfigOverrides({}, config);

  assert.strictEqual(result, false);
});

const configOverrides30 = {};
const optionsSecurityOverrides2 = {};
test("hasConfigOverrides - returns false when empty overrides", () => {
  const options: Options = { securityOverrides: optionsSecurityOverrides2 };
  const config: PastoralistJSON = { name: "test", version: "1.0.0", overrides: configOverrides30 };

  const result = hasConfigOverrides(options, config);

  assert.strictEqual(result, false);
});

test("hasConfigOverrides - handles undefined options and config", () => {
  const result = hasConfigOverrides(undefined, {} as PastoralistJSON);

  assert.strictEqual(result, false);
});

const optionsDepPaths4 = [];
const appendixLodashDependents = { "root-app": "lodash@^4.17.20" };
const appendixLodash = { dependents: appendixLodashDependents };
const pastoralistAppendix7 = { "lodash@4.17.21": appendixLodash };
const configPastoralist10 = { appendix: pastoralistAppendix7 };
const configOverrides29 = { lodash: "4.17.21" };
const configDependencies30 = { lodash: "^4.17.20" };
test("update - merges workspace appendix with existing root appendix entries", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: configDependencies30,
    overrides: configOverrides29,
    pastoralist: configPastoralist10,
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
    depPaths: optionsDepPaths4,
  };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
});

const optionsDepPaths3 = [];
const configPastoralist9 = { patchesDir: "patches" };
const configOverrides28 = { lodash: "4.17.21" };
const configDependencies29 = { lodash: "^4.17.20" };
test("update - handles patches directory with unused patches", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies29,
    overrides: configOverrides28,
    pastoralist: configPastoralist9,
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
    depPaths: optionsDepPaths3,
  };

  const result = update(options);

  assert.strictEqual(result.isTesting, true);
});

const optionsDepPaths2 = [];
const configOverrides27 = { lodash: "4.17.21" };
const configDependencies28 = { lodash: "^4.17.20" };
test("update - skips write step when isTesting is true", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies28,
    overrides: configOverrides27,
  };

  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    config,
    depPaths: optionsDepPaths2,
  };

  const result = update(options);

  assert.strictEqual(result.isTesting, true);
  assert.notStrictEqual(result.finalOverrides, undefined);
});

const optionsDepPaths = [];
test("update - handles config with no appendix or overrides data", () => {
  const options: Options = {
    path: "package.json",
    root: "./",
    isTesting: true,
    depPaths: optionsDepPaths,
  };

  const result = update(options);

  assert.strictEqual(result.path, "package.json");
  assert.strictEqual(result.config, undefined);
});

const depPaths = [];
const configOverrides26 = { react: "18.2.0" };
const peerDependencies = { react: "^18.0.0" };
test("update - processes peerDependencies in dependency collection", () => {
  const config: PastoralistJSON = {
    name: "test-lib",
    version: "1.0.0",
    peerDependencies,
    overrides: configOverrides26,
  };

  const options: Options = { path: "package.json", root: "./", isTesting: true, config, depPaths };

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

const configOverrides25 = { lodash: "4.17.21" };
const configDependencies27 = { lodash: "^4.17.20" };
test("update - handles workspaceAppendix merge with existing entry", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: configDependencies27,
    overrides: configOverrides25,
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

const configOverrides24 = { lodash: "4.17.21", express: "4.18.2" };
const configDependencies26 = { lodash: "^4.17.20", express: "^4.17.0" };
test("update - handles workspaceAppendix merge adding new entry", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: configDependencies26,
    overrides: configOverrides24,
  };

  const options: Options = { path: "package.json", root: "./", isTesting: true, config };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result.appendix?.["express@4.18.2"], undefined);
});

const reactDependents = { "pkg-a": "react@^18.0.0" };
const react = { dependents: reactDependents };
const overridePathsPackagesA = { "react@18.0.0": react };
const overridePaths = { "packages/a": overridePathsPackagesA };
const configPastoralist8 = { overridePaths };
const configOverrides23 = { lodash: "4.17.21", react: "18.0.0" };
const configDependencies25 = { lodash: "^4.17.20" };
test("update - handles overridePaths from config", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: configDependencies25,
    overrides: configOverrides23,
    pastoralist: configPastoralist8,
  };

  const options: Options = { path: "package.json", root: "./", isTesting: true, config };

  const result = update(options);

  assert.notStrictEqual(result.overridePaths, undefined);
});

const packagesALodashDependents = { "pkg-a": "lodash@^4.17.0" };
const packagesALodash = { dependents: packagesALodashDependents };
const packagesA = { "lodash@4.17.21": packagesALodash };
const resolutionPaths = { "packages/a": packagesA };
const configPastoralist7 = { resolutionPaths };
const configOverrides22 = { lodash: "4.17.21" };
const configDependencies24 = { lodash: "^4.17.20" };
test("update - handles resolutionPaths fallback", () => {
  const config: PastoralistJSON = {
    name: "root-app",
    version: "1.0.0",
    dependencies: configDependencies24,
    overrides: configOverrides22,
    pastoralist: configPastoralist7,
  };

  const options: Options = { path: "package.json", root: "./", isTesting: true, config };

  const result = update(options);

  assert.notStrictEqual(result.appendix, undefined);
});

const configWorkspaces3 = ["packages/*"];
const configOverrides21 = { lodash: "4.17.21" };
const configDependencies23 = { lodash: "^4.17.20" };
const dependencies5 = { lodash: "^4.17.0" };
const mergeWorkspaceRootConfig: PastoralistJSON = {
  name: "root-app",
  version: "1.0.0",
  dependencies: configDependencies23,
  overrides: configOverrides21,
  workspaces: configWorkspaces3,
};
test("update - fixture: merges workspace appendix with existing root entry", () => {
  resetTestDir();
  writePkgAManifest({ name: "pkg-a", version: "1.0.0", dependencies: dependencies5 });

  const options: Options = {
    path: "package.json",
    root: TEST_DIR,
    isTesting: true,
    config: mergeWorkspaceRootConfig,
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

const configWorkspaces2 = ["packages/*"];
const configOverrides20 = { "body-parser": "1.20.0" };
const nodeModulesBodyParser = { version: "1.20.0" };
const nodeModulesExpressDependencies = { "body-parser": "^1.20.0" };
const nodeModulesExpress = { version: "4.18.0", dependencies: nodeModulesExpressDependencies };
const transitiveLockPackages = {
  "": lockfileRootEntry,
  "node_modules/express": nodeModulesExpress,
  "node_modules/body-parser": nodeModulesBodyParser,
};
const dependencies4 = { express: "^4.18.0" };
const transitiveWorkspaceConfig: PastoralistJSON = {
  name: "root-app",
  version: "1.0.0",
  overrides: configOverrides20,
  workspaces: configWorkspaces2,
};
const transitiveWorkspaceOptions: Options = {
  path: TEST_PACKAGE_PATH,
  root: TEST_DIR,
  config: transitiveWorkspaceConfig,
  dryRun: true,
  outputFormat: "json",
};
test("update - workspace appendix uses dependency graph for transitive overrides", () => {
  clearDependencyGraphCache();
  resetTestDir();
  writePkgAManifest({ name: "pkg-a", version: "1.0.0", dependencies: dependencies4 });
  writeLockfile(transitiveLockPackages);

  const result = update(transitiveWorkspaceOptions);

  rmSync(TEST_DIR, { recursive: true, force: true });
  clearDependencyGraphCache();

  assert.notStrictEqual(result.workspaceAppendix?.["body-parser@1.20.0"], undefined);
  assert.strictEqual(
    result.workspaceAppendix?.["body-parser@1.20.0"]?.dependents?.["pkg-a"],
    "body-parser (required by express)",
  );
  assertHasProperty(result.appendix?.["body-parser@1.20.0"]?.dependents, "pkg-a");
});

const workspaceRootExpressDependencies = { express: "^4.18.0" };
const workspaceRootLockEntry = { dependencies: workspaceRootExpressDependencies };
const workspaceExpress4 = { version: "4.18.0" };
const workspaceExpress5Dependencies = { lodash: "^4.17.21" };
const workspaceExpress5 = { version: "5.0.0", dependencies: workspaceExpress5Dependencies };
const workspacePkgAExpressDependencies = { express: "^5.0.0" };
const workspacePkgALockEntry = {
  name: "pkg-a",
  version: "1.0.0",
  dependencies: workspacePkgAExpressDependencies,
};
const workspacePkgALodashLockEntry = { version: "4.17.21" };
const duplicateExpressLockPackages = {
  "": workspaceRootLockEntry,
  "node_modules/express": workspaceExpress4,
  "packages/pkg-a": workspacePkgALockEntry,
  "packages/pkg-a/node_modules/express": workspaceExpress5,
  "packages/pkg-a/node_modules/lodash": workspacePkgALodashLockEntry,
};
const duplicateExpressOverrides = { lodash: "4.17.21" };
const duplicateExpressConfig: PastoralistJSON = {
  name: "root-app",
  version: "1.0.0",
  dependencies: workspaceRootExpressDependencies,
  overrides: duplicateExpressOverrides,
  workspaces: configWorkspaces2,
};
const duplicateExpressWorkspaceDependencies = { express: "^5.0.0" };
const duplicateExpressWorkspaceManifest = {
  name: "pkg-a",
  version: "1.0.0",
  dependencies: duplicateExpressWorkspaceDependencies,
};
const unrelatedExpressWorkspaceDependencies = { express: "^4.18.0" };
const unrelatedExpressWorkspaceManifest = {
  name: "pkg-b",
  version: "1.0.0",
  dependencies: unrelatedExpressWorkspaceDependencies,
};

const setupDuplicateExpressWorkspace = (): void => {
  clearDependencyGraphCache();
  resetTestDir();
  writePkgAManifest(duplicateExpressWorkspaceManifest);
  const pkgBDir = resolve(TEST_DIR, "packages", "pkg-b");
  const pkgBManifestPath = resolve(pkgBDir, "package.json");
  mkdirSync(pkgBDir, { recursive: true });
  writeFileSync(pkgBManifestPath, JSON.stringify(unrelatedExpressWorkspaceManifest));
  writeLockfile(duplicateExpressLockPackages);
};

test("update - avoids attributing duplicate-name edges across workspaces", (t) => {
  setupDuplicateExpressWorkspace();
  t.after(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    clearDependencyGraphCache();
  });
  const options = Object.assign({}, transitiveWorkspaceOptions, {
    config: duplicateExpressConfig,
  });
  const result = update(options);

  const dependents = result.appendix?.["lodash@4.17.21"]?.dependents ?? {};
  assert.strictEqual(dependents["root-app"], "lodash (transitive dependency)");
  assert.strictEqual(dependents["pkg-a"], undefined);
  assert.strictEqual(dependents["pkg-b"], undefined);
});

const configWorkspaces = ["packages/*"];
const configOverrides19 = { lodash: "4.17.21" };
const configDependencies22 = { lodash: "^4.17.20" };
const overrides3 = { express: "4.18.2" };
const dependencies3 = { express: "^4.17.0" };
const workspaceOnlyOverrideConfig: PastoralistJSON = {
  name: "root-app",
  version: "1.0.0",
  dependencies: configDependencies22,
  overrides: configOverrides19,
  workspaces: configWorkspaces,
};
const expressOverrideManifest = {
  name: "pkg-a",
  version: "1.0.0",
  dependencies: dependencies3,
  overrides: overrides3,
};
test("update - fixture: adds workspace-only override entry (line 157)", () => {
  resetTestDir();
  writePkgAManifest(expressOverrideManifest);

  const options: Options = {
    path: "package.json",
    root: TEST_DIR,
    isTesting: true,
    config: workspaceOnlyOverrideConfig,
  };

  const result = update(options);

  rmSync(TEST_DIR, { recursive: true, force: true });

  assert.notStrictEqual(result.appendix, undefined);
  assert.notStrictEqual(result.workspaceAppendix, undefined);
  assert.notStrictEqual(result.workspaceAppendix?.["express@4.18.2"], undefined);
  assert.notStrictEqual(result.appendix?.["express@4.18.2"], undefined);
  assert.notStrictEqual(result.appendix?.["lodash@4.17.21"], undefined);
});

const workspaces = ["packages/*"];
const overrides2 = { express: "4.18.2" };
const dependencies2 = { express: "^4.17.0" };
test("update - processes overrides declared only by workspace packages", () => {
  forceClearCache();
  rmSync(TEST_DIR, { recursive: true, force: true });
  writePkgAManifest({
    name: "pkg-a",
    version: "1.0.0",
    dependencies: dependencies2,
    overrides: overrides2,
  });

  const config: PastoralistJSON = { name: "root-app", version: "1.0.0", workspaces };
  const result = update({ root: TEST_DIR, isTesting: true, config });

  rmSync(TEST_DIR, { recursive: true, force: true });
  assert.notStrictEqual(result.workspaceAppendix?.["express@4.18.2"], undefined);
  assert.notStrictEqual(result.appendix?.["express@4.18.2"], undefined);
});

const optionsSecurityOverrideDetails2 = [
  { packageName: "lodash", reason: "medium vuln", severity: "medium" },
];
const optionsSecurityOverrides = { lodash: "4.17.21" };
const configDependencies21 = { lodash: "^4.17.20" };
test("update - metrics include medium severity count", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies21,
  };

  const options: Options = {
    config,
    securityOverrides: optionsSecurityOverrides,
    securityOverrideDetails: optionsSecurityOverrideDetails2,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
  assert.strictEqual(result.metrics?.severityMedium, 1);
});

const optionsSecurityOverrideDetails = [
  { packageName: "express", reason: "low vuln", severity: "low" },
];
const securityOverrides = { express: "4.18.2" };
const configDependencies20 = { express: "^4.17.0" };
test("update - metrics include low severity count", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies20,
  };

  const options: Options = {
    config,
    securityOverrides,
    securityOverrideDetails: optionsSecurityOverrideDetails,
    isTesting: true,
  };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
  assert.strictEqual(result.metrics?.severityLow, 1);
});

const expressDependents = {};
const express = { dependents: expressDependents };
const lodashDependents = { "test-app": "lodash@^4.17.20" };
const lodash = { dependents: lodashDependents };
const pastoralistAppendix6 = { "lodash@4.17.21": lodash, "express@4.18.2": express };
const configPastoralist6 = { appendix: pastoralistAppendix6 };
const configOverrides18 = { lodash: "4.17.21" };
const configDependencies19 = { lodash: "^4.17.20" };
test("update - metrics track removed override packages", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies19,
    overrides: configOverrides18,
    pastoralist: configPastoralist6,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
});

const configOverrides17 = { lodash: "4.17.21" };
const configDependencies18 = { lodash: "^4.17.20" };
test("update - skips lock file parsing without summary or json flag", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies18,
    overrides: configOverrides17,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.strictEqual(result.metrics?.packagesScanned, 0);
});

test("update - parses lock file with summary flag", () => {
  withLockfileRoot((root) => {
    const overrides = { lodash: "4.17.21" };
    const configDependencies17 = { lodash: "^4.17.20" };
    const config: PastoralistJSON = {
      name: "test-app",
      version: "1.0.0",
      dependencies: configDependencies17,
      overrides,
    };

    const options: Options = { config, root, summary: true, isTesting: true };

    const result = update(options);

    assert.strictEqual(result.metrics?.packagesScanned, 2);
  });
});

test("update - parses lock file with json outputFormat", () => {
  withLockfileRoot((root) => {
    const overrides = { lodash: "4.17.21" };
    const configDependencies17 = { lodash: "^4.17.20" };
    const config: PastoralistJSON = {
      name: "test-app",
      version: "1.0.0",
      dependencies: configDependencies17,
      overrides,
    };

    const options: Options = { config, root, outputFormat: "json", isTesting: true };

    const result = update(options);

    assert.strictEqual(result.metrics?.packagesScanned, 2);
  });
});

const configOverrides16 = { "old-package": "1.0.0", "another-old": "2.0.0" };
const configDependencies16 = { lodash: "^4.17.21" };
test("update - tracks removed overrides in metrics", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies16,
    overrides: configOverrides16,
  };

  withLockfileRoot((root) => {
    const options: Options = { config, root, isTesting: true, removeUnused: true };

    const result = update(options);

    assert.strictEqual(result.metrics?.overridesRemoved, 2);
    assert.deepStrictEqual(result.metrics?.removedOverridePackages, [
      { packageName: "old-package", version: "1.0.0" },
      { packageName: "another-old", version: "2.0.0" },
    ]);
  });
});

const configDependencies15 = { lodash: "^4.17.21" };
test("update - handles config with no overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies15,
  };

  const options: Options = { config, isTesting: true };

  const result = update(options);

  assert.strictEqual(result.mode?.hasRootOverrides, false);
  assert.deepStrictEqual(result.finalOverrides, {});
  assert.deepStrictEqual(result.finalAppendix, {});
});

const configOverrides15 = { lodash: "4.17.21" };
const configDependencies14 = { lodash: "^4.17.21" };
test("update - tracks override metrics including removed packages array", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies14,
    overrides: configOverrides15,
  };

  const options: Options = { config, isTesting: true, summary: true };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
  assert.strictEqual(Array.isArray(result.metrics?.removedOverridePackages), true);
  assert.strictEqual(typeof result.metrics?.overridesAdded, "number");
  assert.strictEqual(typeof result.metrics?.overridesRemoved, "number");
});

const configOverrides14 = { lodash: "4.17.21" };
const configDependencies13 = { lodash: "^4.17.21" };
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
    dependencies: configDependencies13,
    overrides: configOverrides14,
  };

  const options: Options = { config, root: PATCH_TEST_DIR, isTesting: true };

  const result = update(options);

  rmSync(PATCH_TEST_DIR, { recursive: true, force: true });

  assert.notStrictEqual(result.patchMap, undefined);
  assert.notStrictEqual(result.patchMap?.["unused-pkg"], undefined);
  assert.strictEqual(result.unusedPatchCount, 1);
});

const configOverrides13 = { "old-override": "1.0.0" };
const configDependencies12 = {};
test("update - counts removed overrides when config overrides differ from final", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies12,
    overrides: configOverrides13,
  };

  const options: Options = { config, isTesting: true, summary: true };

  const result = update(options);

  assert.notStrictEqual(result.metrics, undefined);
  assert.notStrictEqual(result.metrics?.overridesAdded, undefined);
  assert.notStrictEqual(result.metrics?.removedOverridePackages, undefined);
});

const configOverrides12 = { lodash: "4.17.21", "unused-pkg": "1.0.0" };
const configDependencies11 = { lodash: "^4.17.20" };
test("update - stepRemoveUnused removes unused overrides when removeUnused is true", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies11,
    overrides: configOverrides12,
  };

  const options: Options = { config, isTesting: true, removeUnused: true };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.lodash, "4.17.21");
  assert.strictEqual(result.finalOverrides?.["unused-pkg"], undefined);
  assert.strictEqual(result.finalAppendix?.["unused-pkg@1.0.0"], undefined);
  assert.notStrictEqual(result.finalAppendix?.["lodash@4.17.21"], undefined);
});

const configOverrides11 = { lodash: "4.17.21", "unused-pkg": "1.0.0" };
const configDependencies10 = { lodash: "^4.17.20" };
test("update - stepRemoveUnused skips when removeUnused is false", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies10,
    overrides: configOverrides11,
  };

  const options: Options = { config, isTesting: true, removeUnused: false };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["unused-pkg"], "1.0.0");
  assert.notStrictEqual(result.finalAppendix?.["unused-pkg@1.0.0"], undefined);
});

const configOverrides10 = { "body-parser": "1.20.3" };
const configDependencies9 = { express: "4.18.2" };
const transitiveOverrideConfig: PastoralistJSON = {
  name: "test-app",
  version: "1.0.0",
  dependencies: configDependencies9,
  overrides: configOverrides10,
};
const transitiveOverrideOptions: Options = {
  config: transitiveOverrideConfig,
  path: TEST_PACKAGE_PATH,
  root: TEST_DIR,
  dryRun: true,
  removeUnused: true,
};
test("update - preserves potentially transitive overrides when no dependency graph is available", () => {
  clearDependencyGraphCache();
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
  writeFileSync(TEST_PACKAGE_PATH, JSON.stringify(transitiveOverrideConfig));

  try {
    const result = update(transitiveOverrideOptions);

    assert.strictEqual(result.finalOverrides?.["body-parser"], "1.20.3");
  } finally {
    clearDependencyGraphCache();
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

const configOverrides9 = { lodash: "4.17.21", "@babel/core": "7.20.0" };
const configDependencies8 = { lodash: "^4.17.20" };
test("update - stepRemoveUnused handles scoped packages", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies8,
    overrides: configOverrides9,
  };

  const options: Options = { config, isTesting: true, removeUnused: true };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["@babel/core"], undefined);
  assert.strictEqual(result.finalOverrides?.lodash, "4.17.21");
});

const keptPkgLedgerCves = ["CVE-2024-1234"];
const keptPkgLedger = { addedDate: "2024-01-01", keep: true, cves: keptPkgLedgerCves };
const keptPkgDependents = { root: "kept-pkg (unused override)" };
const keptPkg = { dependents: keptPkgDependents, ledger: keptPkgLedger };
const pastoralistAppendix5 = { "kept-pkg@2.0.0": keptPkg };
const configPastoralist5 = { appendix: pastoralistAppendix5 };
const configOverrides8 = { lodash: "4.17.21", "kept-pkg": "2.0.0" };
const configDependencies7 = { lodash: "^4.17.20" };
test("update - stepRemoveUnused respects keep: true, does not remove kept overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies7,
    overrides: configOverrides8,
    pastoralist: configPastoralist5,
  };

  const options: Options = { config, isTesting: true, removeUnused: true };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["kept-pkg"], "2.0.0");
  assert.notStrictEqual(result.finalAppendix?.["kept-pkg@2.0.0"], undefined);
});

const securityAlertsCves = ["CVE-2024-9999"];
const optionsSecurityAlerts2 = [
  {
    packageName: "some-pkg",
    currentVersion: "1.0.0",
    vulnerableVersions: "< 2.0.0",
    patchedVersion: "2.0.0",
    severity: "high",
    title: "Test vuln",
    cves: securityAlertsCves,
    fixAvailable: true,
  },
];
const ledgerCves2 = ["CVE-2024-9999"];
const appendixSomePkgLedger = { addedDate: "2024-01-01", keep: true, cves: ledgerCves2 };
const somePkgDependents2 = { root: "some-pkg@^1.0.0" };
const pastoralistAppendixSomePkg = {
  dependents: somePkgDependents2,
  ledger: appendixSomePkgLedger,
};
const pastoralistAppendix4 = { "some-pkg@1.0.0": pastoralistAppendixSomePkg };
const configPastoralist4 = { appendix: pastoralistAppendix4 };
const configOverrides7 = { "some-pkg": "1.0.0" };
const configDependencies6 = { "some-pkg": "^1.0.0" };
test("update - stepUpdateKeptOverrides populates potentiallyFixedIn from matching alert", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies6,
    overrides: configOverrides7,
    pastoralist: configPastoralist4,
  };

  const options: Options = { config, isTesting: true, securityAlerts: optionsSecurityAlerts2 };

  const result = update(options);

  assert.strictEqual(result.appendix?.["some-pkg@1.0.0"]?.ledger?.potentiallyFixedIn, "2.0.0");
});

const optionsSecurityAlerts = [];
const somePkgLedgerCves = ["CVE-2024-9999"];
const somePkgLedger = {
  addedDate: "2024-01-01",
  keep: true,
  cves: somePkgLedgerCves,
  potentiallyFixedIn: "2.0.0",
};
const appendixSomePkgDependents = { root: "some-pkg@^1.0.0" };
const appendixSomePkg = { dependents: appendixSomePkgDependents, ledger: somePkgLedger };
const pastoralistAppendix3 = { "some-pkg@1.0.0": appendixSomePkg };
const configPastoralist3 = { appendix: pastoralistAppendix3 };
const configOverrides6 = { "some-pkg": "1.0.0" };
const configDependencies5 = { "some-pkg": "^1.0.0" };
test("update - stepUpdateKeptOverrides clears potentiallyFixedIn when no matching alert", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies5,
    overrides: configOverrides6,
    pastoralist: configPastoralist3,
  };

  const options: Options = { config, isTesting: true, securityAlerts: optionsSecurityAlerts };

  const result = update(options);

  assert.strictEqual(result.appendix?.["some-pkg@1.0.0"]?.ledger?.potentiallyFixedIn, undefined);
});

const skipRemovalKeys = ["blocked-fake-pkg@2.0.0"];
const configOverrides5 = { "removable-fake-pkg": "1.0.0", "blocked-fake-pkg": "2.0.0" };
const configDependencies4 = {};
test("update - stepRemoveUnused respects skipRemovalKeys, keeps blocked overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies4,
    overrides: configOverrides5,
  };

  const options: Options = { config, isTesting: true, removeUnused: true, skipRemovalKeys };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["removable-fake-pkg"], undefined);
  assert.strictEqual(result.finalOverrides?.["blocked-fake-pkg"], "2.0.0");
  assert.strictEqual(result.finalAppendix?.["removable-fake-pkg@1.0.0"], undefined);
  assert.notStrictEqual(result.finalAppendix?.["blocked-fake-pkg@2.0.0"], undefined);
});

const newVulnerabilityKeys = ["unverified@1.0.0:advisory"];
const blockedKeys = ["unverified@2.0.0"];
const allowedKeys = ["removable@1.0.0"];
const removableKeys = ["removable@1.0.0", "unverified@2.0.0"];
const removalVerification = {
  removableKeys,
  allowedKeys,
  blockedKeys,
  beforeAlertCount: 0,
  afterAlertCount: 1,
  beforeRiskScore: 0,
  afterRiskScore: 3,
  newVulnerabilityKeys,
  status: "blocked",
};
const configOverrides4 = { removable: "1.0.0", unverified: "2.0.0" };
test("update - stepRemoveUnused removes only verified keys", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    overrides: configOverrides4,
  };
  const options: Options = { config, isTesting: true, removeUnused: true, removalVerification };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.removable, undefined);
  assert.strictEqual(result.finalOverrides?.unverified, "2.0.0");
});

const keptConstraintPkgLedgerCves = ["CVE-2024-5678"];
const ledgerKeep = { reason: "awaiting upstream fix", untilVersion: "3.0.0" };
const keptConstraintPkgLedger = {
  addedDate: "2024-01-01",
  keep: ledgerKeep,
  cves: keptConstraintPkgLedgerCves,
};
const keptConstraintPkgDependents = { root: "kept-constraint-pkg (unused override)" };
const keptConstraintPkg = {
  dependents: keptConstraintPkgDependents,
  ledger: keptConstraintPkgLedger,
};
const pastoralistAppendix2 = { "kept-constraint-pkg@2.0.0": keptConstraintPkg };
const configPastoralist2 = { appendix: pastoralistAppendix2 };
const configOverrides3 = { lodash: "4.17.21", "kept-constraint-pkg": "2.0.0" };
const configDependencies3 = { lodash: "^4.17.20" };
test("update - stepRemoveUnused respects keep: KeepConstraint, does not remove kept overrides", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies3,
    overrides: configOverrides3,
    pastoralist: configPastoralist2,
  };

  const options: Options = { config, isTesting: true, removeUnused: true };

  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["kept-constraint-pkg"], "2.0.0");
  assert.notStrictEqual(result.finalAppendix?.["kept-constraint-pkg@2.0.0"], undefined);
});

const vulnPkgLedgerCves = ["CVE-2024-0001"];
const vulnPkgLedger = { addedDate: "2024-01-01", cves: vulnPkgLedgerCves };
const vulnPkgDependents = { root: "vuln-pkg (unused override)" };
const vulnPkg = { dependents: vulnPkgDependents, ledger: vulnPkgLedger };
const configPastoralistAppendix = { "vuln-pkg@1.2.3": vulnPkg };
const configPastoralist = { appendix: configPastoralistAppendix };
const configOverrides2 = { "vuln-pkg": "1.2.3" };
const configDependencies2 = {};
test("update - stepRemoveUnused warns when removing overrides with tracked CVEs", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies2,
    overrides: configOverrides2,
    pastoralist: configPastoralist,
  };

  const options: Options = { config, isTesting: true, removeUnused: true };
  const result = update(options);

  assert.strictEqual(result.finalOverrides?.["vuln-pkg"], undefined);
  assert.strictEqual(result.finalAppendix?.["vuln-pkg@1.2.3"], undefined);
});

const cves = ["CVE-2024-9999"];
const securityAlerts = [
  {
    packageName: "some-pkg",
    currentVersion: "1.0.0",
    vulnerableVersions: "< 2.0.0",
    patchedVersion: "2.0.0",
    severity: "high",
    title: "Test vuln",
    cves,
    fixAvailable: true,
  },
];
const ledgerCves = ["CVE-2024-9999"];
const keep = { reason: "awaiting upstream fix" };
const ledger = { addedDate: "2024-01-01", keep, cves: ledgerCves };
const somePkgDependents = { root: "some-pkg@^1.0.0" };
const somePkg = { dependents: somePkgDependents, ledger };
const pastoralistAppendix = { "some-pkg@1.0.0": somePkg };
const pastoralist = { appendix: pastoralistAppendix };
const configOverrides = { "some-pkg": "1.0.0" };
const configDependencies = { "some-pkg": "^1.0.0" };
test("update - stepUpdateKeptOverrides handles keep: KeepConstraint entries", () => {
  const config: PastoralistJSON = {
    name: "test-app",
    version: "1.0.0",
    dependencies: configDependencies,
    overrides: configOverrides,
    pastoralist,
  };

  const options: Options = { config, isTesting: true, securityAlerts };

  const result = update(options);

  assert.strictEqual(result.appendix?.["some-pkg@1.0.0"]?.ledger?.potentiallyFixedIn, "2.0.0");
});

const dependencies = { lodash: "4.17.19" };
const countSeveritiesConfigOverrides = { lodash: "4.17.21" };
const countSeveritiesConfig = {
  name: "test-pkg",
  version: "1.0.0",
  overrides: countSeveritiesConfigOverrides,
  dependencies,
};

const securityOverrideDetails4 = [];
test("countSeverities - empty securityOverrideDetails produces zero severity counts", () => {
  const result = update({
    config: countSeveritiesConfig,
    isTesting: true,
    summary: true,
    securityOverrideDetails: securityOverrideDetails4,
  });
  assert.strictEqual(result.metrics?.severityCritical, 0);
  assert.strictEqual(result.metrics?.severityHigh, 0);
  assert.strictEqual(result.metrics?.severityMedium, 0);
  assert.strictEqual(result.metrics?.severityLow, 0);
});

const securityOverrideDetails3 = [
  { packageName: "a", reason: "fix", severity: "critical" },
  { packageName: "b", reason: "fix", severity: "high" },
  { packageName: "c", reason: "fix", severity: "high" },
  { packageName: "d", reason: "fix", severity: "medium" },
  { packageName: "e", reason: "fix", severity: "low" },
];
test("countSeverities - mixed severities are counted correctly", () => {
  const result = update({
    config: countSeveritiesConfig,
    isTesting: true,
    summary: true,
    securityOverrideDetails: securityOverrideDetails3,
  });
  assert.strictEqual(result.metrics?.severityCritical, 1);
  assert.strictEqual(result.metrics?.severityHigh, 2);
  assert.strictEqual(result.metrics?.severityMedium, 1);
  assert.strictEqual(result.metrics?.severityLow, 1);
});

const securityOverrideDetails2 = [
  { packageName: "a", reason: "fix" },
  { packageName: "b", reason: "fix", severity: undefined },
];
test("countSeverities - missing severity defaults to medium", () => {
  const result = update({
    config: countSeveritiesConfig,
    isTesting: true,
    summary: true,
    securityOverrideDetails: securityOverrideDetails2,
  });
  assert.strictEqual(result.metrics?.severityMedium, 2);
  assert.strictEqual(result.metrics?.severityCritical, 0);
});

const securityOverrideDetails = [
  { packageName: "a", reason: "fix", severity: "HIGH" },
  { packageName: "b", reason: "fix", severity: "Critical" },
];
test("countSeverities - severity matching is case-insensitive", () => {
  const result = update({
    config: countSeveritiesConfig,
    isTesting: true,
    summary: true,
    securityOverrideDetails,
  });
  assert.strictEqual(result.metrics?.severityHigh, 1);
  assert.strictEqual(result.metrics?.severityCritical, 1);
});
