import { test, expect, beforeEach, afterEach, mock } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { action, run } from "../../../src/cli/index";
import type { Options } from "../../../src/types";

const TEST_DIR = resolve(__dirname, ".test-cli");
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
  expect(true).toBe(true);
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
  expect(updated.pastoralist).toBeDefined();
  expect(updated.pastoralist.appendix).toBeDefined();
  expect(updated.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
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
  expect(updated.pastoralist).toBeDefined();
  expect(updated.pastoralist.appendix).toBeDefined();
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
  expect(updated.pastoralist).toBeDefined();
  expect(updated.pastoralist.appendix).toBeDefined();
});

test("run - should handle help flag", async () => {
  const consoleSpy = mock(() => {});
  const originalLog = console.log;
  console.log = consoleSpy;

  await run(["node", "script.js", "--help"]);

  expect(consoleSpy).toHaveBeenCalled();
  console.log = originalLog;
});

test("run - should handle -h flag", async () => {
  const consoleSpy = mock(() => {});
  const originalLog = console.log;
  console.log = consoleSpy;

  await run(["node", "script.js", "-h"]);

  expect(consoleSpy).toHaveBeenCalled();
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
  expect(updated.pastoralist).toBeDefined();
  expect(updated.pastoralist.appendix).toBeDefined();
});
