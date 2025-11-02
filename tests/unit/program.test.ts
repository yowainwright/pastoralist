process.env.DEBUG = "true";

import assert from "assert";
import { determineSecurityScanPaths } from "../../src/program";
import { PastoralistJSON, Options } from "../../src/interfaces";

async function describe(description: string, fn: () => void | Promise<void>): Promise<void> {
  console.log(`\n${description}`);
  await fn();
}

async function it(testDescription: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`\t✅ ${testDescription}`);
  } catch (error) {
    console.error(`\t❌ ${testDescription}`);
    console.error(error);
    throw error;
  }
}

await describe("determineSecurityScanPaths (Bug Fix Tests)", async () => {
  await it("should return workspace paths when depPaths is 'workspace' and checkSecurity is true", () => {
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

    assert.deepEqual(result, ["packages/*/package.json", "apps/*/package.json"]);
  });

  await it("should return workspace paths when depPaths is 'workspace' in config only", () => {
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

    assert.deepEqual(result, ["services/*/package.json"]);
  });

  await it("should return workspace paths when checkSecurity is only in options", () => {
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

    assert.deepEqual(result, ["packages/*/package.json"]);
  });

  await it("should return empty array when depPaths is workspace but checkSecurity is false", () => {
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

    assert.deepEqual(result, []);
  });

  await it("should return array depPaths when provided as array", () => {
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

    assert.deepEqual(result, ["packages/app-a/package.json", "packages/app-b/package.json"]);
  });

  await it("should return workspace paths when hasWorkspaceSecurityChecks is true", () => {
    const config: PastoralistJSON = {
      name: "test",
      version: "1.0.0",
      workspaces: ["packages/*"],
    };

    const options: Options = {
      hasWorkspaceSecurityChecks: true,
    };

    const result = determineSecurityScanPaths(config, options);

    assert.deepEqual(result, ["packages/*/package.json"]);
  });

  await it("should return empty array when no workspaces exist", () => {
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

    assert.deepEqual(result, []);
  });

  await it("should prioritize array depPaths over workspace string", () => {
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

    assert.deepEqual(result, ["packages/specific/package.json"]);
  });

  await it("should return empty array when depPaths is an array but checkSecurity is false", () => {
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

    assert.deepEqual(result, []);
  });
});

console.log("\n✨ All determineSecurityScanPaths tests passed!");
