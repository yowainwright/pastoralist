import { test, expect } from "bun:test";
import { determineSecurityScanPaths } from "../../../src/cli/index";
import type { PastoralistJSON, Options } from "../../../src/types";
import { logger as createLogger } from "../../../src/utils";

const logger = createLogger({ file: "test.ts", isLogging: false });

test("determineSecurityScanPaths - returns empty array when no config", () => {
  const config = undefined;
  const options: Options = { checkSecurity: false };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns empty array when security not enabled", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json"]
    }
  };
  const options: Options = { checkSecurity: false };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns depPaths from config when array and security enabled", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json", "apps/*/package.json"],
      checkSecurity: true
    }
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - uses workspace paths when depPaths is workspace", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*", "apps/*"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true
    }
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual(["packages/*/package.json", "apps/*/package.json"]);
});

test("determineSecurityScanPaths - uses workspace paths when hasWorkspaceSecurityChecks is true", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"]
  };
  const options: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true
  };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - returns empty array when depPaths is workspace but no workspaces", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: [],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true
    }
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - returns empty array when hasWorkspaceSecurityChecks but no workspaces", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: []
  };
  const options: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: true
  };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - prioritizes depPaths array over workspace", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"],
    pastoralist: {
      depPaths: ["custom/path/package.json"],
      checkSecurity: true
    }
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual(["custom/path/package.json"]);
});

test("determineSecurityScanPaths - uses config.pastoralist.checkSecurity when option not set", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json"],
      checkSecurity: true
    }
  };
  const options: Options = {};

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - handles missing pastoralist config", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0"
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - handles empty depPaths array", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: [],
      checkSecurity: true
    }
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual([]);
});

test("determineSecurityScanPaths - handles single workspace path", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages"],
    pastoralist: {
      depPaths: "workspace",
      checkSecurity: true
    }
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual(["packages/package.json"]);
});

test("determineSecurityScanPaths - option.checkSecurity takes precedence over config", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    pastoralist: {
      depPaths: ["packages/*/package.json"],
      checkSecurity: false
    }
  };
  const options: Options = { checkSecurity: true };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual(["packages/*/package.json"]);
});

test("determineSecurityScanPaths - handles workspace with hasWorkspaceSecurityChecks false", () => {
  const config: PastoralistJSON = {
    name: "test",
    version: "1.0.0",
    workspaces: ["packages/*"]
  };
  const options: Options = {
    checkSecurity: true,
    hasWorkspaceSecurityChecks: false
  };

  const result = determineSecurityScanPaths(config, options, logger);

  expect(result).toEqual([]);
});
