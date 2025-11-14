import { test, expect } from "bun:test";
import type { Options, PastoralistJSON } from "../../../src/types";
import { logger as createLogger } from "../../../src/utils";

const log = createLogger({ file: "test.ts", isLogging: false });

test("determineSecurityScanPaths - returns depPaths when array and security enabled", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json", "apps/*/package.json"],
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when depPaths array but security disabled", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json"],
    },
  };

  const mergedOptions: Options = {
    checkSecurity: false,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns workspace paths when depPaths is 'workspace'", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - returns workspace paths with hasWorkspaceSecurityChecks", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
  };

  const mergedOptions: Options = {
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when no workspaces", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns empty array when no config", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config = undefined;
  const mergedOptions: Options = {};

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - prioritizes depPaths array over workspace", () => {
  const { determineSecurityScanPaths } = require("../../../src/cli/index");

  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
    pastoralist: {
      depPaths: ["custom/path/package.json"],
      checkSecurity: true,
    },
  };

  const mergedOptions: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true,
  };

  const result = determineSecurityScanPaths(config, mergedOptions, log);

  expect(result).toEqual(["custom/path/package.json"]);
});
