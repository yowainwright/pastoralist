import { test, expect } from "bun:test";
import { findPackageJsonFiles, resolveJSON } from "../../src/core/packageJSON";
import { updateAppendix } from "../../src/core/appendix";
import { SecurityChecker } from "../../src/core/security";
import { OSVProvider } from "../../src/core/security/providers/osv";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const BENCH_DIR = join(import.meta.dir, ".bench-temp");
const ITERATIONS = 100;

function benchmark(
  name: string,
  fn: () => void,
  iterations: number = ITERATIONS,
): number {
  const start = performance.now();
  Array.from({ length: iterations }, fn);
  const avgMs = (performance.now() - start) / iterations;
  console.log(`${name}: ${avgMs.toFixed(3)}ms avg`);
  return avgMs;
}

const createWorkspaceBenchFixture = (root: string) => {
  const packagesDir = join(root, "packages");

  for (let i = 0; i < 60; i++) {
    const packageDir = join(packagesDir, `pkg-${i}`);
    const srcDir = join(packageDir, "src", "components");
    const nodeModulesDir = join(packageDir, "node_modules", "left-pad");

    mkdirSync(srcDir, { recursive: true });
    mkdirSync(nodeModulesDir, { recursive: true });

    writeFileSync(
      join(packageDir, "package.json"),
      JSON.stringify({
        name: `pkg-${i}`,
        version: "1.0.0",
        dependencies: { react: "^18.0.0" },
      }),
    );

    for (let j = 0; j < 12; j++) {
      writeFileSync(join(srcDir, `file-${j}.ts`), `export const x${j} = ${j};`);
      writeFileSync(
        join(nodeModulesDir, `artifact-${j}.json`),
        JSON.stringify({ name: "left-pad", version: "1.3.0" }),
      );
    }
  }
};

test("Benchmark: Core Operations", () => {
  console.log("\nPastoralist Performance Benchmarks\n");

  const mockPackageJson = {
    name: "bench-test",
    version: "1.0.0",
    dependencies: {
      "dep-1": "1.0.0",
      "dep-2": "2.0.0",
      "dep-3": "3.0.0",
    },
  };

  console.log("Package JSON:");

  mkdirSync(BENCH_DIR, { recursive: true });
  const testPath = join(BENCH_DIR, "package.json");
  writeFileSync(testPath, JSON.stringify(mockPackageJson, null, 2));

  const resolveTime = benchmark("resolveJSON", () => {
    resolveJSON(testPath);
  });

  rmSync(BENCH_DIR, { recursive: true, force: true });

  console.log("\nAppendix:");

  const smallTime = benchmark("updateAppendix (3 deps, 2 overrides)", () => {
    updateAppendix({
      overrides: { "dep-1": "1.1.0", "dep-2": "2.1.0" },
      appendix: {},
      dependencies: mockPackageJson.dependencies,
      devDependencies: {},
      packageName: "bench-test",
    });
  });

  const largeDeps = Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => [`dep-${i}`, `${i}.0.0`]),
  );

  const largeTime = benchmark("updateAppendix (100 deps, 5 overrides)", () => {
    updateAppendix({
      overrides: {
        "dep-1": "1.1.0",
        "dep-25": "25.1.0",
        "dep-50": "50.1.0",
        "dep-75": "75.1.0",
        "dep-99": "99.1.0",
      },
      appendix: {},
      dependencies: largeDeps,
      devDependencies: {},
      packageName: "bench-test",
    });
  });

  const xlDeps = Object.fromEntries(
    Array.from({ length: 1000 }, (_, i) => [`dep-${i}`, `${i}.0.0`]),
  );
  const xlOverrides = Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => [`dep-${i * 10}`, `${i}.1.0`]),
  );

  const xlTime = benchmark("updateAppendix (1000 deps, 100 overrides)", () => {
    updateAppendix({
      overrides: xlOverrides,
      appendix: {},
      dependencies: xlDeps,
      devDependencies: {},
      packageName: "bench-test",
    });
  });

  console.log("\nDiscovery:");

  mkdirSync(BENCH_DIR, { recursive: true });
  createWorkspaceBenchFixture(BENCH_DIR);

  const discoveryTime = benchmark(
    "findPackageJsonFiles (60 packages)",
    () => {
      findPackageJsonFiles(
        ["packages/*/package.json"],
        ["**/node_modules/**"],
        BENCH_DIR,
      );
    },
    20,
  );

  rmSync(BENCH_DIR, { recursive: true, force: true });

  console.log("\nSecurity:");

  const checkerTime = benchmark("SecurityChecker initialization", () => {
    new SecurityChecker({ provider: "osv", debug: false });
  });

  const providerTime = benchmark("OSVProvider initialization", () => {
    new OSVProvider({ debug: false });
  });

  const fixtureTime = benchmark("OSVProvider with test fixtures", () => {
    new OSVProvider({ debug: false, isIRLFix: true, isIRLCatch: true });
  });

  const checker = new SecurityChecker({ provider: "osv", debug: false });
  const overrides = Array.from({ length: 20 }, (_, i) => ({
    packageName: `test-${i}`,
    fromVersion: `${i}.0.0`,
    toVersion: `${i}.1.0`,
    reason: "Security fix",
    severity: "high" as const,
  }));

  const generateTime = benchmark(
    "generatePackageOverrides (20 overrides)",
    () => {
      checker.generatePackageOverrides(overrides);
    },
  );

  const total =
    resolveTime +
    smallTime +
    largeTime +
    xlTime +
    discoveryTime +
    checkerTime +
    providerTime +
    fixtureTime +
    generateTime;
  console.log(`\nTotal: ${total.toFixed(2)}ms\n`);

  expect(resolveTime).toBeLessThan(5);
  expect(smallTime).toBeLessThan(1);
  expect(largeTime).toBeLessThan(10);
  expect(xlTime).toBeLessThan(10);
  expect(discoveryTime).toBeLessThan(20);
  expect(checkerTime).toBeLessThan(2);
  expect(providerTime).toBeLessThan(1);
  expect(fixtureTime).toBeLessThan(1);
  expect(generateTime).toBeLessThan(1);
});
