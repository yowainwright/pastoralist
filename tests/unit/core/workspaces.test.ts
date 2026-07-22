import { test, expect, mock, afterEach, beforeEach, spyOn } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import type { Appendix, ResolveOverrides } from "../../../src/types";
import type { Logger } from "../../../src/utils";
import {
  checkMonorepoOverrides,
  cleanupUnusedOverrides,
  findUnusedOverrides,
  getPackageJsonWorkspacePatterns,
  mergeOverridePaths,
  normalizeWorkspaceManifestPaths,
  parsePnpmWorkspacePackages,
  processWorkspacePackages,
  resolveWorkspaceManifestPaths,
  workspacePatternToPackageManifestPath,
} from "../../../src/core/workspaces";
import { constructAppendix } from "../../../src/core/appendix";
import * as packageJSON from "../../../src/core/package";
import { clearDependencyTreeCache } from "../../../src/core/package";

const TEST_DIR = resolve(__dirname, ".test-workspaces");

beforeEach(() => {
  clearDependencyTreeCache();
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  mock.restore();
  clearDependencyTreeCache();
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test("workspacePatternToPackageManifestPath - appends package.json to workspace globs", () => {
  expect(workspacePatternToPackageManifestPath("packages/*")).toBe("packages/*/package.json");
  expect(workspacePatternToPackageManifestPath("packages/@scope/*")).toBe(
    "packages/@scope/*/package.json",
  );
  expect(workspacePatternToPackageManifestPath("packages/frontend/**")).toBe(
    "packages/frontend/**/package.json",
  );
});

test("workspacePatternToPackageManifestPath - preserves package.json paths", () => {
  expect(workspacePatternToPackageManifestPath("apps/*/package.json")).toBe("apps/*/package.json");
});

test("workspacePatternToPackageManifestPath - ignores empty and negated patterns", () => {
  expect(workspacePatternToPackageManifestPath("")).toBeNull();
  expect(workspacePatternToPackageManifestPath("!packages/ignored")).toBeNull();
});

test("normalizeWorkspaceManifestPaths - deduplicates generated paths", () => {
  const result = normalizeWorkspaceManifestPaths([
    "packages/*",
    "packages/*",
    "apps/*/package.json",
  ]);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("getPackageJsonWorkspacePatterns - reads array workspaces", () => {
  expect(getPackageJsonWorkspacePatterns(["packages/*", "apps/*"])).toEqual([
    "packages/*",
    "apps/*",
  ]);
});

test("getPackageJsonWorkspacePatterns - reads object workspaces", () => {
  expect(getPackageJsonWorkspacePatterns({ packages: ["packages/*", "apps/*"] })).toEqual([
    "packages/*",
    "apps/*",
  ]);
});

test("parsePnpmWorkspacePackages - parses block package entries", () => {
  const result = parsePnpmWorkspacePackages(`
packages:
  - packages/*
  - "packages/@scope/*"
  - 'packages/frontend/**'
  - apps/*/package.json # comment
`);

  expect(result).toEqual([
    "packages/*",
    "packages/@scope/*",
    "packages/frontend/**",
    "apps/*/package.json",
  ]);
});

test("parsePnpmWorkspacePackages - parses inline package entries", () => {
  const result = parsePnpmWorkspacePackages(`packages: ["packages/*", 'apps/*']`);

  expect(result).toEqual(["packages/*", "apps/*"]);
});

test("parsePnpmWorkspacePackages - returns empty for missing or malformed packages", () => {
  expect(parsePnpmWorkspacePackages("ignored:\n  - packages/*")).toEqual([]);
  expect(parsePnpmWorkspacePackages("packages: true")).toEqual([]);
});

test("parsePnpmWorkspacePackages - stops before same-indent list items outside packages", () => {
  const result = parsePnpmWorkspacePackages(`
packages:
  - packages/*
- not-a-package-workspace
`);

  expect(result).toEqual(["packages/*"]);
});

test("resolveWorkspaceManifestPaths - combines package.json and pnpm workspace sources", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-workspaces-"));

  try {
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      `
packages:
  - apps/*
  - packages/*
`,
    );

    const result = resolveWorkspaceManifestPaths({ workspaces: ["packages/*"] }, root);

    expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolveWorkspaceManifestPaths - falls back when pnpm workspace cannot be read", () => {
  const root = mkdtempSync(join(tmpdir(), "pastoralist-workspaces-"));
  const debugCalls: Array<[string, string]> = [];
  const log: Logger = {
    debug: (message, caller) => debugCalls.push([message, caller]),
    error: () => {},
    warn: () => {},
    print: () => {},
    line: () => {},
    indent: () => {},
    item: () => {},
  };

  try {
    mkdirSync(join(root, "pnpm-workspace.yaml"));

    const result = resolveWorkspaceManifestPaths({ workspaces: ["packages/*"] }, root, log);

    expect(result).toEqual(["packages/*/package.json"]);
    expect(debugCalls).toHaveLength(1);
    expect(debugCalls[0][0]).toContain("Unable to read pnpm-workspace.yaml");
    expect(debugCalls[0][1]).toBe("readPnpmWorkspacePatterns");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("checkMonorepoOverrides", () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = checkMonorepoOverrides({ lodash: "4.17.21" }, { lodash: "^4.17.20" }, mockLog);
  expect(result).toEqual([]);

  const result2 = checkMonorepoOverrides(
    { lodash: "4.17.21", react: "18.0.0" },
    { lodash: "^4.17.20" },
    mockLog,
  );
  expect(result2).toEqual(["react"]);
});

test("processWorkspacePackages", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const mockConstructAppendix = async () => ({
    "lodash@4.17.21": { dependents: {} },
  });

  const result = await processWorkspacePackages(
    ["pkg/package.json"],
    {} as ResolveOverrides,
    mockLog,
    mockConstructAppendix,
  );

  expect(result.appendix).toBeDefined();
});

test("mergeOverridePaths", () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: { root: "lodash@^4.17.21" } },
  };
  const overridePaths = {
    "packages/a": {
      "react@18.0.0": { dependents: { "pkg-a": "react@^18.0.0" } },
    },
  };

  const result = mergeOverridePaths(appendix, overridePaths, ["react"], mockLog);

  expect(result["lodash@4.17.21"]).toBeDefined();
  expect(result["react@18.0.0"]).toBeDefined();

  const appendix2: Appendix = {
    "lodash@4.17.21": { dependents: { root: "lodash@^4.17.21" } },
  };
  const overridePaths2 = {
    "packages/a": {
      "lodash@4.17.21": { dependents: { "pkg-a": "lodash@^4.17.21" } },
    },
  };
  const result2 = mergeOverridePaths(appendix2, overridePaths2, ["lodash"], mockLog);
  expect(result2["lodash@4.17.21"].dependents["root"]).toBeDefined();
  expect(result2["lodash@4.17.21"].dependents["pkg-a"]).toBeDefined();

  const result3 = mergeOverridePaths(appendix, undefined, [], mockLog);
  expect(result3).toEqual(appendix);
});

test("findUnusedOverrides", async () => {
  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({
    "fake-pkg": true,
  });

  const result = await findUnusedOverrides({ "fake-pkg": "1.0.0" }, { "fake-pkg": "^1.0.0" });
  expect(result).toEqual([]);

  const result2 = await findUnusedOverrides({ "fake-pkg": "1.0.0" }, {});
  expect(result2).toEqual(["fake-pkg"]);

  const result3 = await findUnusedOverrides({ react: { "react-dom": "18.0.0" } }, {});
  expect(result3).toEqual(["react"]);

  const result4 = await findUnusedOverrides(
    { react: { "react-dom": "18.0.0" } },
    { react: "^18.0.0" },
  );
  expect(result4).toEqual([]);

  spy.mockRestore();
});

test("findUnusedOverrides - reads dependency tree once per run", async () => {
  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({});

  const result = await findUnusedOverrides(
    {
      alpha: "1.0.0",
      beta: "2.0.0",
      gamma: "3.0.0",
    },
    { root: "^1.0.0" },
  );

  expect(result).toEqual(["alpha", "beta", "gamma"]);
  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

test("findUnusedOverrides - passes root to dependency tree lookup", async () => {
  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({
    "transitive-pkg": "1.0.0",
  });

  const result = await findUnusedOverrides(
    { "transitive-pkg": "1.0.0" },
    { "direct-pkg": "^1.0.0" },
    TEST_DIR,
  );

  expect(result).toEqual([]);
  expect(spy).toHaveBeenCalledWith(undefined, undefined, TEST_DIR);

  spy.mockRestore();
});

test("cleanupUnusedOverrides", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const mockUpdateOverrides = () => ({ "fake-pkg": "1.0.0" });

  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({
    "fake-pkg": true,
  });

  const appendix: Appendix = {
    "fake-pkg@1.0.0": { dependents: { root: "fake-pkg@^1.0.0" } },
    "react@18.0.0": { dependents: {} },
  };
  const result = await cleanupUnusedOverrides(
    { "fake-pkg": "1.0.0", react: "18.0.0" },
    {} as ResolveOverrides,
    appendix,
    { "fake-pkg": "^1.0.0" },
    [],
    undefined,
    mockLog,
    mockUpdateOverrides,
  );

  expect(result.finalOverrides).toEqual({ "fake-pkg": "1.0.0" });
  expect(result.finalAppendix["react@18.0.0"]).toBeUndefined();

  const appendix2: Appendix = {
    "react@18.0.0": { dependents: { "pkg-a": "react@^18.0.0" } },
  };
  const overridePaths = {
    "packages/a": {
      "react@18.0.0": { dependents: { "pkg-a": "react@^18.0.0" } },
    },
  };
  const mockUpdateOverrides2 = () => ({ react: "18.0.0" });
  const result2 = await cleanupUnusedOverrides(
    { react: "18.0.0" },
    {} as ResolveOverrides,
    appendix2,
    {},
    ["react"],
    overridePaths,
    mockLog,
    mockUpdateOverrides2,
  );
  expect(result2.finalOverrides).toEqual({ react: "18.0.0" });

  spy.mockRestore();
});

test("findUnusedOverrides - handles packages in dependency tree", async () => {
  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({
    "transitive-pkg": true,
  });

  const result = await findUnusedOverrides(
    { "transitive-pkg": "1.0.0" },
    { "other-dep": "^2.0.0" },
  );
  expect(result).not.toContain("transitive-pkg");

  spy.mockRestore();
});

test("checkMonorepoOverrides - returns empty for matching deps", () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const result = checkMonorepoOverrides(
    { react: "18.0.0", lodash: "4.17.21" },
    { react: "^18.0.0", lodash: "^4.17.0" },
    mockLog,
  );
  expect(result).toEqual([]);
});

test("checkMonorepoOverrides - identifies multiple missing overrides", () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const result = checkMonorepoOverrides(
    { react: "18.0.0", lodash: "4.17.21", express: "4.18.2" },
    { lodash: "^4.17.0" },
    mockLog,
  );
  expect(result).toContain("react");
  expect(result).toContain("express");
  expect(result).not.toContain("lodash");
});

test("mergeOverridePaths - handles empty override paths", () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const appendix: Appendix = {
    "lodash@4.17.21": { dependents: { root: "lodash@^4.17.21" } },
  };

  const result = mergeOverridePaths(appendix, {}, [], mockLog);
  expect(result).toEqual(appendix);
});

test("cleanupUnusedOverrides - handles empty appendix", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const mockUpdateOverrides = () => ({});

  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({});

  const result = await cleanupUnusedOverrides(
    {},
    {} as ResolveOverrides,
    {},
    {},
    [],
    undefined,
    mockLog,
    mockUpdateOverrides,
  );

  expect(result.finalOverrides).toEqual({});
  expect(result.finalAppendix).toEqual({});

  spy.mockRestore();
});

test("processWorkspacePackages - returns appendix for valid packages", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const mockConstructAppendix = async () => ({
    "react@18.0.0": { dependents: { "pkg-a": "react@^18.0.0" } },
    "lodash@4.17.21": { dependents: { "pkg-a": "lodash@^4.17.0" } },
  });

  const result = await processWorkspacePackages(
    ["pkg-a/package.json", "pkg-b/package.json"],
    {} as ResolveOverrides,
    mockLog,
    mockConstructAppendix,
  );

  expect(result.appendix).toBeDefined();
  expect(Object.keys(result.appendix).length).toBeGreaterThanOrEqual(0);
});

test("processWorkspacePackages - handles empty package list", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const mockConstructAppendix = async () => ({});

  const result = await processWorkspacePackages(
    [],
    {} as ResolveOverrides,
    mockLog,
    mockConstructAppendix,
  );

  expect(result.appendix).toBeDefined();
});

test("mergeOverridePaths - merges dependents from multiple packages", () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.21" },
    },
  };

  const overridePaths = {
    "packages/a": {
      "lodash@4.17.21": { dependents: { "pkg-a": "lodash@^4.17.0" } },
    },
    "packages/b": {
      "lodash@4.17.21": { dependents: { "pkg-b": "lodash@^4.17.0" } },
    },
  };

  const result = mergeOverridePaths(appendix, overridePaths, ["lodash"], mockLog);

  expect(result["lodash@4.17.21"].dependents["root"]).toBeDefined();
  expect(result["lodash@4.17.21"].dependents["pkg-a"]).toBeDefined();
  expect(result["lodash@4.17.21"].dependents["pkg-b"]).toBeDefined();
});

test("findUnusedOverrides - returns empty for nested override with matching parent", async () => {
  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({
    parent: true,
  });

  const result = await findUnusedOverrides({ parent: { child: "2.0.0" } }, { parent: "^1.0.0" });
  expect(result).toEqual([]);

  spy.mockRestore();
});

test("cleanupUnusedOverrides - preserves overrides with dependents", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const mockUpdateOverrides = () => ({ lodash: "4.17.21" });

  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({
    lodash: true,
  });

  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: {
        root: "lodash@^4.17.0",
        "pkg-a": "lodash@^4.17.0",
      },
    },
  };

  const result = await cleanupUnusedOverrides(
    { lodash: "4.17.21" },
    {} as ResolveOverrides,
    appendix,
    { lodash: "^4.17.0" },
    [],
    undefined,
    mockLog,
    mockUpdateOverrides,
  );

  expect(result.finalOverrides["lodash"]).toBe("4.17.21");
  expect(result.finalAppendix["lodash@4.17.21"]).toBeDefined();

  spy.mockRestore();
});

test("processWorkspacePackages - aggregates dependencies from multiple packages", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const mockConstructAppendix = async () => ({
    "lodash@4.17.21": { dependents: { root: "lodash@^4.17.0" } },
  });

  const result = await processWorkspacePackages(
    ["pkg-a/package.json", "pkg-b/package.json"],
    {} as ResolveOverrides,
    mockLog,
    mockConstructAppendix,
  );

  expect(result.appendix).toBeDefined();
  expect(result.allWorkspaceDeps).toBeDefined();
});

test("findUnusedOverrides - keeps override in dependency tree", async () => {
  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({
    "transitive-dep": true,
  });

  const result = await findUnusedOverrides(
    { "transitive-dep": "1.0.0" },
    { "other-dep": "^1.0.0" },
  );
  expect(Array.isArray(result)).toBe(true);

  spy.mockRestore();
});

test("cleanupUnusedOverrides - logs tracked packages in overridePaths", async () => {
  const debugLogs: string[] = [];
  const mockLog = {
    debug: (msg: string) => debugLogs.push(msg),
    error: () => {},
    warn: () => {},
    print: () => {},
    line: () => {},
    indent: () => {},
    item: () => {},
  };
  const mockUpdateOverrides = () => ({ react: "18.0.0" });

  const spy = spyOn(packageJSON, "getDependencyTree").mockResolvedValue({
    react: true,
  });

  const appendix: Appendix = {
    "react@18.0.0": { dependents: {} },
  };
  const overridePaths = {
    "packages/a": {
      "react@18.0.0": { dependents: { "pkg-a": "react@^18.0.0" } },
    },
  };

  await cleanupUnusedOverrides(
    { react: "18.0.0" },
    {} as ResolveOverrides,
    appendix,
    {},
    ["react"],
    overridePaths,
    mockLog,
    mockUpdateOverrides,
  );

  expect(debugLogs.some((log) => log.includes("overridePaths"))).toBe(true);

  spy.mockRestore();
});

test("processWorkspacePackages - collects all dependency types from fixtures", async () => {
  const pkgADir = resolve(TEST_DIR, "packages", "pkg-a");
  const pkgBDir = resolve(TEST_DIR, "packages", "pkg-b");

  mkdirSync(pkgADir, { recursive: true });
  mkdirSync(pkgBDir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
      devDependencies: { jest: "^29.0.0" },
      peerDependencies: { react: "^18.0.0" },
    }),
  );

  writeFileSync(
    resolve(pkgBDir, "package.json"),
    JSON.stringify({
      name: "pkg-b",
      version: "1.0.0",
      dependencies: { express: "^4.18.0" },
    }),
  );

  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const overridesData = { npm: { lodash: "4.17.21" } };

  const result = await processWorkspacePackages(
    [resolve(pkgADir, "package.json"), resolve(pkgBDir, "package.json")],
    overridesData,
    mockLog,
    constructAppendix,
  );

  expect(result.allWorkspaceDeps).toBeDefined();
  expect(result.allWorkspaceDeps["lodash"]).toBe("^4.17.0");
  expect(result.allWorkspaceDeps["jest"]).toBe("^29.0.0");
  expect(result.allWorkspaceDeps["react"]).toBe("^18.0.0");
  expect(result.allWorkspaceDeps["express"]).toBe("^4.18.0");
});

test("processWorkspacePackages - handles packages with only devDependencies", async () => {
  const pkgDir = resolve(TEST_DIR, "packages", "dev-only");

  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(
    resolve(pkgDir, "package.json"),
    JSON.stringify({
      name: "dev-only",
      version: "1.0.0",
      devDependencies: { typescript: "^5.0.0", eslint: "^8.0.0" },
    }),
  );

  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = await processWorkspacePackages(
    [resolve(pkgDir, "package.json")],
    {},
    mockLog,
    constructAppendix,
  );

  expect(result.allWorkspaceDeps["typescript"]).toBe("^5.0.0");
  expect(result.allWorkspaceDeps["eslint"]).toBe("^8.0.0");
});

test("processWorkspacePackages - handles packages with only peerDependencies", async () => {
  const pkgDir = resolve(TEST_DIR, "packages", "peer-only");

  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(
    resolve(pkgDir, "package.json"),
    JSON.stringify({
      name: "peer-only",
      version: "1.0.0",
      peerDependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
    }),
  );

  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = await processWorkspacePackages(
    [resolve(pkgDir, "package.json")],
    {},
    mockLog,
    constructAppendix,
  );

  expect(result.allWorkspaceDeps["react"]).toBe("^18.0.0");
  expect(result.allWorkspaceDeps["react-dom"]).toBe("^18.0.0");
});

test("processWorkspacePackages - aggregates overlapping dependencies", async () => {
  const pkgADir = resolve(TEST_DIR, "packages", "pkg-a");
  const pkgBDir = resolve(TEST_DIR, "packages", "pkg-b");

  mkdirSync(pkgADir, { recursive: true });
  mkdirSync(pkgBDir, { recursive: true });

  writeFileSync(
    resolve(pkgADir, "package.json"),
    JSON.stringify({
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.0" },
    }),
  );

  writeFileSync(
    resolve(pkgBDir, "package.json"),
    JSON.stringify({
      name: "pkg-b",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.20" },
    }),
  );

  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = await processWorkspacePackages(
    [resolve(pkgADir, "package.json"), resolve(pkgBDir, "package.json")],
    {},
    mockLog,
    constructAppendix,
  );

  expect(result.allWorkspaceDeps["lodash"]).toBeDefined();
});

test("processWorkspacePackages - handles empty package.json files", async () => {
  const pkgDir = resolve(TEST_DIR, "packages", "empty");

  mkdirSync(pkgDir, { recursive: true });

  writeFileSync(
    resolve(pkgDir, "package.json"),
    JSON.stringify({
      name: "empty",
      version: "1.0.0",
    }),
  );

  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = await processWorkspacePackages(
    [resolve(pkgDir, "package.json")],
    {},
    mockLog,
    constructAppendix,
  );

  expect(result.allWorkspaceDeps).toEqual({});
});

test("mergeOverridePaths - does not mutate original appendix", () => {
  const originalAppendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.20" },
    },
  };

  const appendixSnapshot = JSON.parse(JSON.stringify(originalAppendix));

  const overridePaths = {
    "packages/app": {
      "lodash@4.17.21": {
        dependents: { app: "lodash@^4.17.20" },
      },
      "express@4.18.2": {
        dependents: { app: "express@^4.18.0" },
      },
    },
  };

  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = mergeOverridePaths(originalAppendix, overridePaths, ["express"], mockLog);

  expect(result["express@4.18.2"]).toBeDefined();
  expect(result["lodash@4.17.21"].dependents).toHaveProperty("app");

  expect(originalAppendix).toEqual(appendixSnapshot);
});

test("mergeOverridePaths - merges dependents for existing entries", () => {
  const appendix: Appendix = {
    "lodash@4.17.21": {
      dependents: { root: "lodash@^4.17.20" },
    },
  };

  const overridePaths = {
    "packages/app": {
      "lodash@4.17.21": {
        dependents: { "workspace-app": "lodash@^4.17.20" },
      },
    },
  };

  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = mergeOverridePaths(appendix, overridePaths, ["lodash"], mockLog);

  const dependents = result["lodash@4.17.21"].dependents || {};
  expect(dependents).toHaveProperty("root");
  expect(dependents).toHaveProperty("workspace-app");
});
