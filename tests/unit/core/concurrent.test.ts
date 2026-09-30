import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";

type AppendixEntry = { dependents: Record<string, string> };

const TEST_DIR = resolve(import.meta.dirname, ".test-concurrent");

const LODASH_RANGE = { lodash: "^4.17.20" };
const EXPRESS_RANGE = { express: "^4.17.0" };
const EXPRESS_18_RANGE = { express: "^4.18.0" };
const REACT_RANGE = { react: "^18.0.0" };
const LODASH_EXPRESS_RANGE = { lodash: "^4.17.20", express: "^4.18.0" };
const LODASH_OVERRIDE = { lodash: "4.17.21" };
const MINIMIST_OVERRIDE = { minimist: "1.2.8" };
const ANSI_REGEX_OVERRIDE = { "ansi-regex": "5.0.1" };
const LODASH_MINIMIST_OVERRIDE = { lodash: "4.17.21", minimist: "1.2.8" };
const PNPM_LODASH_OVERRIDE = { overrides: LODASH_OVERRIDE };

const LODASH_FIELDS = { dependencies: LODASH_RANGE, overrides: LODASH_OVERRIDE };
const EXPRESS_MINIMIST_FIELDS = { dependencies: EXPRESS_RANGE, overrides: MINIMIST_OVERRIDE };
const EXPRESS_18_MINIMIST_FIELDS = {
  dependencies: EXPRESS_18_RANGE,
  overrides: MINIMIST_OVERRIDE,
};
const REACT_ANSI_REGEX_FIELDS = { dependencies: REACT_RANGE, resolutions: ANSI_REGEX_OVERRIDE };
const STRESS_FIELDS = { dependencies: LODASH_EXPRESS_RANGE, overrides: LODASH_MINIMIST_OVERRIDE };
const NPM_FORMAT_FIELDS = { overrides: LODASH_OVERRIDE };
const YARN_FORMAT_FIELDS = { resolutions: LODASH_OVERRIDE };
const PNPM_FORMAT_FIELDS = { pnpm: PNPM_LODASH_OVERRIDE };

const EXISTING_DEPENDENTS = { "isolated-1": "existing" };
const EXISTING_APPENDIX_ENTRY = { dependents: EXISTING_DEPENDENTS };
const EXISTING_APPENDIX = { "existing@1.0.0": EXISTING_APPENDIX_ENTRY };
const EXISTING_PASTORALIST = { appendix: EXISTING_APPENDIX };
const ISOLATED_FIELDS = {
  dependencies: LODASH_RANGE,
  overrides: LODASH_OVERRIDE,
  pastoralist: EXISTING_PASTORALIST,
};

const createManifest = (name: string, fields: object) =>
  Object.assign({ name, version: "1.0.0" }, fields);

const readManifest = (path: string) => JSON.parse(readFileSync(path, "utf-8"));

const writeManifest = (path: string, content: object) =>
  writeFileSync(path, JSON.stringify(content, null, 2));

const toAppendixEntry = (packageName: string, override: [string, unknown]) => {
  const [pkg, version] = override;
  const key = `${pkg}@${version}`;
  const dependents = Object.fromEntries([[packageName, key]]);
  const entry: [string, AppendixEntry] = [key, { dependents }];
  return entry;
};

const action = ({ path }: { path: string; checkSecurity?: boolean }): void => {
  const content = readManifest(path);
  const overrides = Object.assign(
    {},
    content.overrides,
    content.resolutions,
    content.pnpm?.overrides,
  );
  const appendixEntries = Object.entries(overrides).map((override) =>
    toAppendixEntry(content.name, override),
  );
  const appendix = Object.fromEntries(appendixEntries);
  const mergedAppendix = Object.assign({}, content.pastoralist?.appendix, appendix);
  const pastoralist = Object.assign({}, content.pastoralist, { appendix: mergedAppendix });

  writeManifest(path, Object.assign(content, { pastoralist }));
};

const createTestPackage = (name: string, content: object) => {
  const dir = join(TEST_DIR, name);
  mkdirSync(dir, { recursive: true });
  const pkgPath = join(dir, "package.json");
  writeManifest(pkgPath, content);
  return pkgPath;
};

const runAction = (path: string) => action({ path, checkSecurity: false });

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

test("concurrent: multiple packages remain isolated", () => {
  const results = Array.from({ length: 5 }, (_, i) =>
    createTestPackage(`pkg-${i}`, createManifest(`test-pkg-${i}`, LODASH_FIELDS)),
  );

  results.forEach(runAction);

  assert.strictEqual(results.length, 5);

  results.forEach((path, index) => {
    const content = readManifest(path);
    assert.notStrictEqual(content.pastoralist, undefined);
    assert.notStrictEqual(content.pastoralist.appendix, undefined);
    assert.strictEqual(content.name, `test-pkg-${index}`);
  });
});

test("concurrent: different packages with different overrides", () => {
  const pkg1 = createTestPackage("concurrent-pkg1", createManifest("pkg1", LODASH_FIELDS));
  const pkg2 = createTestPackage(
    "concurrent-pkg2",
    createManifest("pkg2", EXPRESS_MINIMIST_FIELDS),
  );
  const pkg3 = createTestPackage(
    "concurrent-pkg3",
    createManifest("pkg3", REACT_ANSI_REGEX_FIELDS),
  );

  runAction(pkg1);
  runAction(pkg2);
  runAction(pkg3);

  const result1 = readManifest(pkg1);
  const result2 = readManifest(pkg2);
  const result3 = readManifest(pkg3);

  assert.notStrictEqual(result1.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.notStrictEqual(result2.pastoralist.appendix["minimist@1.2.8"], undefined);
  assert.notStrictEqual(result3.pastoralist.appendix["ansi-regex@5.0.1"], undefined);
});

test("concurrent: same package processed sequentially maintains consistency", () => {
  const pkgPath = createTestPackage("sequential", createManifest("sequential-test", LODASH_FIELDS));

  runAction(pkgPath);

  const firstResult = readManifest(pkgPath);
  assert.notStrictEqual(firstResult.pastoralist.appendix["lodash@4.17.21"], undefined);

  const overrides = Object.assign({}, firstResult.overrides, MINIMIST_OVERRIDE);
  writeManifest(pkgPath, Object.assign({}, firstResult, { overrides }));

  runAction(pkgPath);

  const secondResult = readManifest(pkgPath);
  assert.notStrictEqual(secondResult.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.notStrictEqual(secondResult.pastoralist.appendix["minimist@1.2.8"], undefined);
});

test("concurrent: handles rapid successive calls", () => {
  const packages = Array.from({ length: 10 }, (_, i) =>
    createTestPackage(`rapid-${i}`, createManifest(`rapid-${i}`, LODASH_FIELDS)),
  );

  packages.forEach(runAction);

  packages.forEach((path) => {
    const content = readManifest(path);
    assert.notStrictEqual(content.pastoralist, undefined);
    assert.notStrictEqual(content.pastoralist.appendix["lodash@4.17.21"], undefined);
  });
});

test("concurrent: isolation between package processing", () => {
  const pkg1 = createTestPackage("isolated-1", createManifest("isolated-1", ISOLATED_FIELDS));
  const pkg2 = createTestPackage(
    "isolated-2",
    createManifest("isolated-2", EXPRESS_18_MINIMIST_FIELDS),
  );

  runAction(pkg1);
  runAction(pkg2);

  const result1 = readManifest(pkg1);
  const result2 = readManifest(pkg2);

  assert.notStrictEqual(result1.pastoralist.appendix["lodash@4.17.21"], undefined);

  assert.notStrictEqual(result2.pastoralist.appendix["minimist@1.2.8"], undefined);
  assert.strictEqual(result2.pastoralist.appendix["existing@1.0.0"], undefined);
  assert.strictEqual(result2.pastoralist.appendix["lodash@4.17.21"], undefined);
});

test("concurrent: handles mixed override formats", () => {
  const npmPkg = createTestPackage("npm-format", createManifest("npm-pkg", NPM_FORMAT_FIELDS));
  const yarnPkg = createTestPackage("yarn-format", createManifest("yarn-pkg", YARN_FORMAT_FIELDS));
  const pnpmPkg = createTestPackage("pnpm-format", createManifest("pnpm-pkg", PNPM_FORMAT_FIELDS));

  runAction(npmPkg);
  runAction(yarnPkg);
  runAction(pnpmPkg);

  const npmResult = readManifest(npmPkg);
  const yarnResult = readManifest(yarnPkg);
  const pnpmResult = readManifest(pnpmPkg);

  assert.notStrictEqual(npmResult.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.notStrictEqual(yarnResult.pastoralist.appendix["lodash@4.17.21"], undefined);
  assert.notStrictEqual(pnpmResult.pastoralist.appendix["lodash@4.17.21"], undefined);
});

test("concurrent: stress test with many packages", () => {
  const count = 20;
  const packages = Array.from({ length: count }, (_, i) =>
    createTestPackage(`stress-${i}`, createManifest(`stress-${i}`, STRESS_FIELDS)),
  );

  packages.forEach(runAction);

  packages.forEach((path) => {
    const content = readManifest(path);
    assert.notStrictEqual(content.pastoralist, undefined);
  });
});
