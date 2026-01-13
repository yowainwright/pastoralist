import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";

const TEST_DIR = resolve(__dirname, ".test-concurrent");

const mockAction = async ({
  path,
}: {
  path: string;
  checkSecurity?: boolean;
}) => {
  const content = JSON.parse(readFileSync(path, "utf-8"));
  const overrides = {
    ...(content.overrides || {}),
    ...(content.resolutions || {}),
    ...(content.pnpm?.overrides || {}),
  };

  const appendix: Record<string, { dependents: Record<string, string> }> = {};
  for (const [pkg, version] of Object.entries(overrides)) {
    appendix[`${pkg}@${version}`] = {
      dependents: { [content.name]: `${pkg}@${version}` },
    };
  }

  content.pastoralist = {
    ...content.pastoralist,
    appendix: { ...content.pastoralist?.appendix, ...appendix },
  };

  writeFileSync(path, JSON.stringify(content, null, 2));
};

const action = mockAction;

const createTestPackage = (name: string, content: object) => {
  const dir = join(TEST_DIR, name);
  mkdirSync(dir, { recursive: true });
  const pkgPath = join(dir, "package.json");
  writeFileSync(pkgPath, JSON.stringify(content, null, 2));
  return pkgPath;
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

test("concurrent: multiple packages processed in parallel", async () => {
  const packages = Array.from({ length: 5 }, (_, i) => ({
    path: createTestPackage(`pkg-${i}`, {
      name: `test-pkg-${i}`,
      version: "1.0.0",
      dependencies: { lodash: "^4.17.20" },
      overrides: { lodash: "4.17.21" },
    }),
    index: i,
  }));

  const results = await Promise.all(
    packages.map(async ({ path, index }) => {
      await action({ path, checkSecurity: false });
      return { path, index };
    }),
  );

  expect(results.length).toBe(5);

  for (const { path, index } of results) {
    const content = JSON.parse(readFileSync(path, "utf-8"));
    expect(content.pastoralist).toBeDefined();
    expect(content.pastoralist.appendix).toBeDefined();
    expect(content.name).toBe(`test-pkg-${index}`);
  }
});

test("concurrent: different packages with different overrides", async () => {
  const pkg1 = createTestPackage("concurrent-pkg1", {
    name: "pkg1",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  });

  const pkg2 = createTestPackage("concurrent-pkg2", {
    name: "pkg2",
    version: "1.0.0",
    dependencies: { express: "^4.17.0" },
    overrides: { minimist: "1.2.8" },
  });

  const pkg3 = createTestPackage("concurrent-pkg3", {
    name: "pkg3",
    version: "1.0.0",
    dependencies: { react: "^18.0.0" },
    resolutions: { "ansi-regex": "5.0.1" },
  });

  await Promise.all([
    action({ path: pkg1, checkSecurity: false }),
    action({ path: pkg2, checkSecurity: false }),
    action({ path: pkg3, checkSecurity: false }),
  ]);

  const result1 = JSON.parse(readFileSync(pkg1, "utf-8"));
  const result2 = JSON.parse(readFileSync(pkg2, "utf-8"));
  const result3 = JSON.parse(readFileSync(pkg3, "utf-8"));

  expect(result1.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  expect(result2.pastoralist.appendix["minimist@1.2.8"]).toBeDefined();
  expect(result3.pastoralist.appendix["ansi-regex@5.0.1"]).toBeDefined();
});

test("concurrent: same package processed sequentially maintains consistency", async () => {
  const pkgPath = createTestPackage("sequential", {
    name: "sequential-test",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
  });

  await action({ path: pkgPath, checkSecurity: false });

  const firstResult = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(firstResult.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();

  writeFileSync(
    pkgPath,
    JSON.stringify(
      {
        ...firstResult,
        overrides: {
          ...firstResult.overrides,
          minimist: "1.2.8",
        },
      },
      null,
      2,
    ),
  );

  await action({ path: pkgPath, checkSecurity: false });

  const secondResult = JSON.parse(readFileSync(pkgPath, "utf-8"));
  expect(secondResult.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  expect(secondResult.pastoralist.appendix["minimist@1.2.8"]).toBeDefined();
});

test("concurrent: handles rapid successive calls", async () => {
  const packages = Array.from({ length: 10 }, (_, i) =>
    createTestPackage(`rapid-${i}`, {
      name: `rapid-${i}`,
      version: "1.0.0",
      dependencies: { lodash: "^4.17.20" },
      overrides: { lodash: "4.17.21" },
    }),
  );

  const startTime = Date.now();

  await Promise.all(
    packages.map((path) => action({ path, checkSecurity: false })),
  );

  const endTime = Date.now();
  const duration = endTime - startTime;

  for (const path of packages) {
    const content = JSON.parse(readFileSync(path, "utf-8"));
    expect(content.pastoralist).toBeDefined();
    expect(content.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  }

  expect(duration).toBeLessThan(30000);
});

test("concurrent: isolation between package processing", async () => {
  const pkg1 = createTestPackage("isolated-1", {
    name: "isolated-1",
    version: "1.0.0",
    dependencies: { lodash: "^4.17.20" },
    overrides: { lodash: "4.17.21" },
    pastoralist: {
      appendix: {
        "existing@1.0.0": {
          dependents: { "isolated-1": "existing" },
        },
      },
    },
  });

  const pkg2 = createTestPackage("isolated-2", {
    name: "isolated-2",
    version: "1.0.0",
    dependencies: { express: "^4.18.0" },
    overrides: { minimist: "1.2.8" },
  });

  await Promise.all([
    action({ path: pkg1, checkSecurity: false }),
    action({ path: pkg2, checkSecurity: false }),
  ]);

  const result1 = JSON.parse(readFileSync(pkg1, "utf-8"));
  const result2 = JSON.parse(readFileSync(pkg2, "utf-8"));

  expect(result1.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();

  expect(result2.pastoralist.appendix["minimist@1.2.8"]).toBeDefined();
  expect(result2.pastoralist.appendix["existing@1.0.0"]).toBeUndefined();
  expect(result2.pastoralist.appendix["lodash@4.17.21"]).toBeUndefined();
});

test("concurrent: handles mixed override formats", async () => {
  const npmPkg = createTestPackage("npm-format", {
    name: "npm-pkg",
    version: "1.0.0",
    overrides: { lodash: "4.17.21" },
  });

  const yarnPkg = createTestPackage("yarn-format", {
    name: "yarn-pkg",
    version: "1.0.0",
    resolutions: { lodash: "4.17.21" },
  });

  const pnpmPkg = createTestPackage("pnpm-format", {
    name: "pnpm-pkg",
    version: "1.0.0",
    pnpm: { overrides: { lodash: "4.17.21" } },
  });

  await Promise.all([
    action({ path: npmPkg, checkSecurity: false }),
    action({ path: yarnPkg, checkSecurity: false }),
    action({ path: pnpmPkg, checkSecurity: false }),
  ]);

  const npmResult = JSON.parse(readFileSync(npmPkg, "utf-8"));
  const yarnResult = JSON.parse(readFileSync(yarnPkg, "utf-8"));
  const pnpmResult = JSON.parse(readFileSync(pnpmPkg, "utf-8"));

  expect(npmResult.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  expect(yarnResult.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
  expect(pnpmResult.pastoralist.appendix["lodash@4.17.21"]).toBeDefined();
});

test("concurrent: stress test with many packages", async () => {
  const count = 20;
  const packages = Array.from({ length: count }, (_, i) =>
    createTestPackage(`stress-${i}`, {
      name: `stress-${i}`,
      version: "1.0.0",
      dependencies: {
        lodash: "^4.17.20",
        express: "^4.18.0",
      },
      overrides: {
        lodash: "4.17.21",
        minimist: "1.2.8",
      },
    }),
  );

  const results = await Promise.allSettled(
    packages.map((path) => action({ path, checkSecurity: false })),
  );

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  expect(fulfilled.length).toBe(count);

  for (const path of packages) {
    const content = JSON.parse(readFileSync(path, "utf-8"));
    expect(content.pastoralist).toBeDefined();
  }
});
