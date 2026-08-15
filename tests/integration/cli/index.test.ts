import { test, beforeEach, afterEach } from "node:test";
import { mock } from "../../unit/setup.ts";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { action, run } from "../../../src/cli/index";
import type { Options } from "../../../src/types";

const TEST_DIR = resolve(import.meta.dirname, ".test-cli");
const TEST_PACKAGE_JSON = resolve(TEST_DIR, "package.json");

const createTestPackageJson = (content: any = {}) => {
  const defaultContent = {
    name: "test-package",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    pastoralist: {
      appendix: {},
      ...content.pastoralist,
    },
  };
  writeFileSync(TEST_PACKAGE_JSON, JSON.stringify({ ...defaultContent, ...content }, null, 2));
};

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test("action - should handle test mode", async () => {
  const options: Options = {
    isTestingCLI: true,
    path: TEST_PACKAGE_JSON,
  };

  await action(options);
  assert.strictEqual(true, true);
});

test("action - should process package.json without security check", async () => {
  createTestPackageJson({
    overrides: {
      lodash: "4.17.21",
    },
  });

  const options: Options = {
    path: TEST_PACKAGE_JSON,
    checkSecurity: false,
  };

  await action(options);

  const updated = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  assert.notStrictEqual(updated.pastoralist, undefined);
  assert.notStrictEqual(updated.pastoralist.appendix, undefined);
  assert.notStrictEqual(updated.pastoralist.appendix["lodash@4.17.21"], undefined);
});

test("action - should merge options from config", async () => {
  createTestPackageJson({
    overrides: {
      react: "18.0.0",
    },
    pastoralist: {
      security: {
        enabled: false,
        provider: "osv",
      },
    },
  });

  const options: Options = {
    path: TEST_PACKAGE_JSON,
  };

  await action(options);

  const updated = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  assert.notStrictEqual(updated.pastoralist, undefined);
  assert.notStrictEqual(updated.pastoralist.appendix, undefined);
});

test("action - should handle root path option", async () => {
  createTestPackageJson({
    overrides: {
      lodash: "4.17.21",
    },
  });

  const options: Options = {
    path: "package.json",
    root: TEST_DIR,
  };

  await action(options);

  const updated = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  assert.notStrictEqual(updated.pastoralist, undefined);
  assert.notStrictEqual(updated.pastoralist.appendix, undefined);
});

test("run - should handle help flag", async () => {
  const consoleSpy = mock(() => {});
  const originalLog = console.log;
  console.log = consoleSpy;

  await run(["node", "script.js", "--help"]);

  assert.ok(consoleSpy.mock.callCount() > 0);
  console.log = originalLog;
});

test("run - should handle -h flag", async () => {
  const consoleSpy = mock(() => {});
  const originalLog = console.log;
  console.log = consoleSpy;

  await run(["node", "script.js", "-h"]);

  assert.ok(consoleSpy.mock.callCount() > 0);
  console.log = originalLog;
});

test("run - should call action for default command", async () => {
  createTestPackageJson({
    overrides: {
      lodash: "4.17.21",
    },
  });

  await run(["node", "script.js", `--path=${TEST_PACKAGE_JSON}`]);

  const updated = JSON.parse(readFileSync(TEST_PACKAGE_JSON, "utf-8"));
  assert.notStrictEqual(updated.pastoralist, undefined);
  assert.notStrictEqual(updated.pastoralist.appendix, undefined);
});
