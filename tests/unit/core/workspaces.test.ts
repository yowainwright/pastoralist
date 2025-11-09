import { test, expect, mock, afterEach } from "bun:test";
import type { Appendix, ResolveOverrides } from "../../../src/types";
import {
  checkMonorepoOverrides,
  processWorkspacePackages,
  mergeOverridePaths,
  findUnusedOverrides,
  cleanupUnusedOverrides,
} from "../../../src/core/workspaces";
import * as packageJSON from "../../../src/core/packageJSON";

afterEach(() => {
  mock.restore();
});

test("checkMonorepoOverrides", () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const result = checkMonorepoOverrides({ lodash: "4.17.21" }, { lodash: "^4.17.20" }, mockLog);
  expect(result).toEqual([]);

  const result2 = checkMonorepoOverrides({ lodash: "4.17.21", react: "18.0.0" }, { lodash: "^4.17.20" }, mockLog);
  expect(result2).toEqual(["react"]);
});

test("processWorkspacePackages", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const mockConstructAppendix = async () => ({ "lodash@4.17.21": { dependents: {} } });

  const result = await processWorkspacePackages(["pkg/package.json"], {} as ResolveOverrides, mockLog, mockConstructAppendix);

  expect(result.appendix).toBeDefined();
});

test("mergeOverridePaths", () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };

  const appendix: Appendix = { "lodash@4.17.21": { dependents: { root: "lodash@^4.17.21" } } };
  const overridePaths = { "packages/a": { "react@18.0.0": { dependents: { "pkg-a": "react@^18.0.0" } } } };

  const result = mergeOverridePaths(appendix, overridePaths, ["react"], mockLog);

  expect(result["lodash@4.17.21"]).toBeDefined();
  expect(result["react@18.0.0"]).toBeDefined();

  const appendix2: Appendix = { "lodash@4.17.21": { dependents: { root: "lodash@^4.17.21" } } };
  const overridePaths2 = { "packages/a": { "lodash@4.17.21": { dependents: { "pkg-a": "lodash@^4.17.21" } } } };
  const result2 = mergeOverridePaths(appendix2, overridePaths2, ["lodash"], mockLog);
  expect(result2["lodash@4.17.21"].dependents["root"]).toBeDefined();
  expect(result2["lodash@4.17.21"].dependents["pkg-a"]).toBeDefined();

  const result3 = mergeOverridePaths(appendix, undefined, [], mockLog);
  expect(result3).toEqual(appendix);
});

test("findUnusedOverrides", async () => {
  const result = await findUnusedOverrides({ "fake-pkg": "1.0.0" }, { "fake-pkg": "^1.0.0" });
  expect(result).toEqual([]);

  const result2 = await findUnusedOverrides({ "fake-pkg": "1.0.0" }, {});
  expect(result2).toEqual(["fake-pkg"]);

  const result3 = await findUnusedOverrides({ react: { "react-dom": "18.0.0" } }, {});
  expect(result3).toEqual(["react"]);

  const result4 = await findUnusedOverrides({ react: { "react-dom": "18.0.0" } }, { react: "^18.0.0" });
  expect(result4).toEqual([]);
});

test("cleanupUnusedOverrides", async () => {
  const mockLog = { debug: () => {}, error: () => {}, info: () => {} };
  const mockUpdateOverrides = () => ({ "fake-pkg": "1.0.0" });

  mock.module("../../../src/core/packageJSON", () => ({
    ...packageJSON,
    getDependencyTree: async () => ({ "fake-pkg": true }),
  }));

  const appendix: Appendix = { "fake-pkg@1.0.0": { dependents: { root: "fake-pkg@^1.0.0" } }, "react@18.0.0": { dependents: {} } };
  const result = await cleanupUnusedOverrides(
    { "fake-pkg": "1.0.0", "react": "18.0.0" },
    {} as ResolveOverrides,
    appendix,
    { "fake-pkg": "^1.0.0" },
    [],
    undefined,
    mockLog,
    mockUpdateOverrides
  );

  expect(result.finalOverrides).toEqual({ "fake-pkg": "1.0.0" });
  expect(result.finalAppendix["react@18.0.0"]).toBeUndefined();

  const appendix2: Appendix = { "react@18.0.0": { dependents: { "pkg-a": "react@^18.0.0" } } };
  const overridePaths = { "packages/a": { "react@18.0.0": { dependents: { "pkg-a": "react@^18.0.0" } } } };
  const mockUpdateOverrides2 = () => ({ react: "18.0.0" });
  const result2 = await cleanupUnusedOverrides(
    { react: "18.0.0" },
    {} as ResolveOverrides,
    appendix2,
    {},
    ["react"],
    overridePaths,
    mockLog,
    mockUpdateOverrides2
  );
  expect(result2.finalOverrides).toEqual({ react: "18.0.0" });
});
