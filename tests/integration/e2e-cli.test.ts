import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { action } from "../../src/cli/index";
import type { Options } from "../../src/types";

const TEST_DIR = resolve(__dirname, ".test-e2e-cli");

const createFixture = (name: string, content: object) => {
  const dir = join(TEST_DIR, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify(content, null, 2));
  return join(dir, "package.json");
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

test("e2e: processes package with single override", async () => {
  const pkgPath = createFixture("single-override", {
    name: "test-single",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
  expect(result.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  expect(
    result.pastoralist.appendix["lodash@4.17.21"].dependents,
  ).toBeDefined();
});

test("e2e: processes package with nested override", async () => {
  const pkgPath = createFixture("nested-override", {
    name: "test-nested",
    version: "1.0.0",
    dependencies: {
      pg: "^8.13.0",
    },
    overrides: {
      pg: {
        "pg-types": "^4.0.1",
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
});

test("e2e: processes package with multiple overrides", async () => {
  const pkgPath = createFixture("multiple-overrides", {
    name: "test-multiple",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
      express: "^4.18.0",
      react: "^18.0.0",
    },
    overrides: {
      lodash: "4.17.21",
      minimist: "1.2.8",
      "node-fetch": "2.7.0",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
  expect(Object.keys(result.pastoralist.appendix).length).toBeGreaterThan(0);
});

test("e2e: handles package with no overrides", async () => {
  const pkgPath = createFixture("no-overrides", {
    name: "test-no-overrides",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.21",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.name).toBe("test-no-overrides");
});

test("e2e: handles yarn resolutions", async () => {
  const pkgPath = createFixture("yarn-resolutions", {
    name: "test-yarn",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    resolutions: {
      lodash: "4.17.21",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
});

test("e2e: handles pnpm overrides", async () => {
  const pkgPath = createFixture("pnpm-overrides", {
    name: "test-pnpm",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    pnpm: {
      overrides: {
        lodash: "4.17.21",
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
  expect(result.pastoralist.appendix).toBeDefined();
});

test("e2e: preserves existing pastoralist config", async () => {
  const pkgPath = createFixture("existing-config", {
    name: "test-existing",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
    pastoralist: {
      security: {
        enabled: false,
        provider: "osv",
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist.security).toBeDefined();
  expect(result.pastoralist.security.enabled).toBe(false);
  expect(result.pastoralist.security.provider).toBe("osv");
});

test("e2e: dry-run does not modify package.json", async () => {
  const originalContent = {
    name: "test-dry-run",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
    },
    overrides: {
      lodash: "4.17.21",
    },
  };

  const pkgPath = createFixture("dry-run", originalContent);
  const originalText = readFileSync(pkgPath, "utf-8");

  await action({ path: pkgPath, checkSecurity: false, dryRun: true });

  const afterText = readFileSync(pkgPath, "utf-8");
  expect(afterText).toBe(originalText);
});

test("e2e: handles devDependencies overrides", async () => {
  const pkgPath = createFixture("dev-deps", {
    name: "test-dev-deps",
    version: "1.0.0",
    devDependencies: {
      typescript: "^5.0.0",
      jest: "^29.0.0",
    },
    overrides: {
      "ansi-regex": "5.0.1",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
});

test("e2e: handles empty dependencies", async () => {
  const pkgPath = createFixture("empty-deps", {
    name: "test-empty",
    version: "1.0.0",
    overrides: {
      lodash: "4.17.21",
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist).toBeDefined();
});

test("e2e: processes package with existing appendix", async () => {
  const pkgPath = createFixture("existing-appendix", {
    name: "test-existing-appendix",
    version: "1.0.0",
    dependencies: {
      lodash: "^4.17.20",
      express: "^4.18.0",
    },
    overrides: {
      lodash: "4.17.21",
      minimist: "1.2.8",
    },
    pastoralist: {
      appendix: {
        "lodash@4.17.21": {
          dependents: {
            "test-existing-appendix": "lodash@^4.17.20",
          },
          ledger: {
            addedDate: "2024-01-01T00:00:00.000Z",
          },
        },
      },
    },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const result = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(result.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  expect(result.pastoralist.appendix["minimist@1.2.8"]).toBeDefined();
});
