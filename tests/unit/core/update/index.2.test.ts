import { test, expect } from "bun:test";
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
