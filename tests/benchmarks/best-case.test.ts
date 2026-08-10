import { expect, test } from "bun:test";
import { optimizeBestCasePortfolio } from "../../src/core/best-case";
import type { BestCaseEvaluation, BestCasePackageChoice } from "../../src/core/best-case";

const ITERATIONS = 20;

const createChoice = (index: number): BestCasePackageChoice => {
  const packageName = `portfolio-${index}`;
  const currentVersion = "1.0.0";
  const versions = ["1.0.0", "2.0.0"];
  return { packageName, currentVersion, versions };
};

const evaluatePortfolio = (): BestCaseEvaluation => {
  const alerts: BestCaseEvaluation["alerts"] = [];
  return { alerts };
};

const runOptimizer = async (choices: BestCasePackageChoice[]): Promise<number> => {
  const options = { choices, evaluate: evaluatePortfolio };
  const result = await optimizeBestCasePortfolio(options);
  return result.search.evaluatedStates;
};

const runIterations = async (
  remaining: number,
  choices: BestCasePackageChoice[],
): Promise<void> => {
  if (remaining === 0) return;
  await runOptimizer(choices);
  return runIterations(remaining - 1, choices);
};

test("Benchmark: best-case exact search", async () => {
  const choices = Array.from({ length: 6 }, (_, index) => createChoice(index));
  await runOptimizer(choices);
  const startedAt = performance.now();
  await runIterations(ITERATIONS, choices);
  const averageMs = (performance.now() - startedAt) / ITERATIONS;
  const message = `optimizeBestCasePortfolio (64 exact states): ${averageMs.toFixed(3)}ms avg\n`;
  process.stdout.write(message);

  expect(await runOptimizer(choices)).toBe(64);
  expect(averageMs).toBeLessThan(25);
});
