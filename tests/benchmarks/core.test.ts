import { test } from "node:test";
import assert from "node:assert/strict";
import { findPackageJsonFiles, resolveJSON } from "../../src/core/package";
import { updateAppendix } from "../../src/core/appendix";
import { SecurityChecker } from "../../src/core/security";
import { OSVProvider } from "../../src/core/security/providers/osv";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const BENCH_DIR = join(import.meta.dirname, ".bench-temp");
const ITERATIONS = 100;
const benchmarkDependencies = { "dep-1": "1.0.0", "dep-2": "2.0.0", "dep-3": "3.0.0" };
const mockPackageJson = {
  name: "bench-test",
  version: "1.0.0",
  dependencies: benchmarkDependencies,
};

function benchmark(name: string, fn: () => unknown, iterations: number = ITERATIONS): number {
  const start = performance.now();
  Array.from({ length: iterations }, fn);
  const avgMs = (performance.now() - start) / iterations;
  console.log(`${name}: ${avgMs.toFixed(3)}ms avg`);
  return avgMs;
}

const createPackageArtifacts = (srcDir: string, nodeModulesDir: string) => {
  Array.from({ length: 12 }, (_, index) => {
    writeFileSync(join(srcDir, `file-${index}.ts`), `export const x${index} = ${index};`);
    const artifact = { name: "left-pad", version: "1.3.0" };
    writeFileSync(join(nodeModulesDir, `artifact-${index}.json`), JSON.stringify(artifact));
  });
};

const createWorkspaceBenchFixture = (root: string) => {
  const packagesDir = join(root, "packages");
  Array.from({ length: 60 }, (_, index) => {
    const name = `pkg-${index}`;
    const packageDir = join(packagesDir, name);
    const srcDir = join(packageDir, "src", "components");
    const nodeModulesDir = join(packageDir, "node_modules", "left-pad");
    mkdirSync(srcDir, { recursive: true });
    mkdirSync(nodeModulesDir, { recursive: true });
    const dependencies = { react: "^18.0.0" };
    const manifest = { name, version: "1.0.0", dependencies };
    writeFileSync(join(packageDir, "package.json"), JSON.stringify(manifest));
    createPackageArtifacts(srcDir, nodeModulesDir);
  });
};

const benchmarkPackageJson = () => {
  console.log("Package JSON:");
  mkdirSync(BENCH_DIR, { recursive: true });
  const testPath = join(BENCH_DIR, "package.json");
  writeFileSync(testPath, JSON.stringify(mockPackageJson, null, 2));
  const resolveTime = benchmark("resolveJSON", () => {
    resolveJSON(testPath);
  });
  rmSync(BENCH_DIR, { recursive: true, force: true });
  return resolveTime;
};

const dependencyEntry = (_: unknown, index: number) => {
  const entry = [`dep-${index}`, `${index}.0.0`];
  return entry;
};

const overrideEntry = (_: unknown, index: number) => {
  const entry = [`dep-${index * 10}`, `${index}.1.0`];
  return entry;
};

const benchmarkAppendix = (
  name: string,
  dependencies: Record<string, string>,
  overrides: Record<string, string>,
) => {
  const time = benchmark(name, () => {
    const appendix = {};
    const devDependencies = {};
    const options = {
      overrides,
      appendix,
      dependencies,
      devDependencies,
      packageName: "bench-test",
    };
    updateAppendix(options);
  });
  return time;
};

const benchmarkSmallAppendix = () => {
  const smallOverrides = { "dep-1": "1.1.0", "dep-2": "2.1.0" };
  const smallTime = benchmarkAppendix(
    "updateAppendix (3 deps, 2 overrides)",
    benchmarkDependencies,
    smallOverrides,
  );
  return smallTime;
};

const benchmarkLargeAppendix = () => {
  const largeDeps = Object.fromEntries(Array.from({ length: 100 }, dependencyEntry));
  const largeOverrides = {
    "dep-1": "1.1.0",
    "dep-25": "25.1.0",
    "dep-50": "50.1.0",
    "dep-75": "75.1.0",
    "dep-99": "99.1.0",
  };
  const largeTime = benchmarkAppendix(
    "updateAppendix (100 deps, 5 overrides)",
    largeDeps,
    largeOverrides,
  );
  return largeTime;
};

const benchmarkExtraLargeAppendix = () => {
  const xlDeps = Object.fromEntries(Array.from({ length: 1000 }, dependencyEntry));
  const xlOverrides = Object.fromEntries(Array.from({ length: 100 }, overrideEntry));
  const xlTime = benchmarkAppendix(
    "updateAppendix (1000 deps, 100 overrides)",
    xlDeps,
    xlOverrides,
  );
  return xlTime;
};

const benchmarkAppendices = () => {
  console.log("\nAppendix:");
  const smallTime = benchmarkSmallAppendix();
  const largeTime = benchmarkLargeAppendix();
  const xlTime = benchmarkExtraLargeAppendix();
  const timings = { smallTime, largeTime, xlTime };
  return timings;
};

const benchmarkDiscovery = () => {
  console.log("\nDiscovery:");
  mkdirSync(BENCH_DIR, { recursive: true });
  createWorkspaceBenchFixture(BENCH_DIR);
  const discoveryTime = benchmark(
    "findPackageJsonFiles (60 packages)",
    () => {
      findPackageJsonFiles(["packages/*/package.json"], ["**/node_modules/**"], BENCH_DIR);
    },
    20,
  );
  rmSync(BENCH_DIR, { recursive: true, force: true });
  return discoveryTime;
};

const createChecker = () => {
  const checker = new SecurityChecker({ provider: "osv", debug: false });
  return checker;
};

const createProvider = () => {
  const provider = new OSVProvider({ debug: false });
  return provider;
};

const createFixtureProvider = () => {
  const provider = new OSVProvider({ debug: false, isIRLFix: true, isIRLCatch: true });
  return provider;
};

const createSecurityOverride = (_: unknown, index: number) => {
  const packageName = `test-${index}`;
  const fromVersion = `${index}.0.0`;
  const toVersion = `${index}.1.0`;
  const severity = "high" as const;
  const override = { packageName, fromVersion, toVersion, reason: "Security fix", severity };
  return override;
};

const benchmarkSecurity = () => {
  console.log("\nSecurity:");
  const checkerTime = benchmark("SecurityChecker initialization", createChecker);
  const providerTime = benchmark("OSVProvider initialization", createProvider);
  const fixtureTime = benchmark("OSVProvider with test fixtures", createFixtureProvider);
  const checker = createChecker();
  const overrides = Array.from({ length: 20 }, createSecurityOverride);
  const generateTime = benchmark("generatePackageOverrides (20 overrides)", () => {
    checker.generatePackageOverrides(overrides);
  });
  const timings = { checkerTime, providerTime, fixtureTime, generateTime };
  return timings;
};

const printTotal = (timings: number[]) => {
  const total = timings.reduce((sum, time) => sum + time, 0);
  console.log(`\nTotal: ${total.toFixed(2)}ms\n`);
};

test("Benchmark: Core Operations", () => {
  console.log("\nPastoralist Performance Benchmarks\n");
  const resolveTime = benchmarkPackageJson();
  const appendixTimes = benchmarkAppendices();
  const discoveryTime = benchmarkDiscovery();
  const securityTimes = benchmarkSecurity();
  const timings = Object.assign({ resolveTime, discoveryTime }, appendixTimes, securityTimes);
  printTotal(Object.values(timings));
  assert.ok(resolveTime < 5);
  assert.ok(appendixTimes.smallTime < 1);
  assert.ok(appendixTimes.largeTime < 10);
  assert.ok(appendixTimes.xlTime < 10);
  assert.ok(discoveryTime < 20);
  assert.ok(securityTimes.checkerTime < 2);
  assert.ok(securityTimes.providerTime < 1);
  assert.ok(securityTimes.fixtureTime < 1);
  assert.ok(securityTimes.generateTime < 1);
});
