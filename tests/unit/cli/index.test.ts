import { test, expect } from "bun:test";
import { determineSecurityScanPaths } from "../../../src/cli";
import { PastoralistJSON, Options } from "../../../src/interfaces";

test("determineSecurityScanPaths - should return workspace paths when depPaths is 'workspace' and checkSecurity is true", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };

  const options: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, options);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - should return workspace paths when depPaths is 'workspace' in config only", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["services/*"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };

  const options: Options = {};

  const result = determineSecurityScanPaths(config, options);

  expect(result).toEqual(["services/*/package.json"]);
});

test("determineSecurityScanPaths - should return workspace paths when checkSecurity is only in options", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
    pastoralist: {
      depPaths: "workspace",
    },
  };

  const options: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, options);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - should return empty array when depPaths is workspace but checkSecurity is false", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: false,
    },
  };

  const options: Options = {
    checkSecurity: false,
  };

  const result = determineSecurityScanPaths(config, options);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - should return array depPaths when provided as array", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/app-a/package.json", "packages/app-b/package.json"],
      checkSecurity: true,
    },
  };

  const options: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, options);

  expect(result).toEqual([
    "packages/app-a/package.json",
    "packages/app-b/package.json",
  ]);
});

test("determineSecurityScanPaths - should return workspace paths when hasWorkspaceSecurityChecks is true", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };

  const options: Options = {
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, options);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - should return empty array when no workspaces exist", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };

  const options: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, options);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - should prioritize array depPaths over workspace string", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: {
      depPaths: ["packages/specific/package.json"],
      checkSecurity: true,
    },
  };

  const options: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, options);

  expect(result).toEqual(["packages/specific/package.json"]);
});

test("determineSecurityScanPaths - should return empty array when depPaths is an array but checkSecurity is false", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/app-a/package.json", "packages/app-b/package.json"],
      checkSecurity: false,
    },
  };

  const options: Options = {
    checkSecurity: false,
  };

  const result = determineSecurityScanPaths(config, options);

  expect(result).toEqual([]);
});
