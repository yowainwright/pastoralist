import { test } from "node:test";
import assert from "node:assert/strict";
import { optimizeBestCasePortfolio } from "../../src/core/best-case";
import type { BestCaseEvaluation, BestCasePackageChoice } from "../../src/core/best-case";

const ITERATIONS = 20;

const createChoice = (index: number): BestCasePackageChoice => {
  const packageName = `portfolio-${index}`;
  const currentVersion = "1.0.0";
  const versions = ["1.0.0", "2.0.0"];
  const choice = { packageName, currentVersion, versions };
  return choice;
};

const evaluatePortfolio = (): BestCaseEvaluation => {
  const alerts: BestCaseEvaluation["alerts"] = [];
  const evaluation = { alerts };
  return evaluation;
};

const runOptimizer = async (choices: BestCasePackageChoice[]): Promise<number> => {
  const options = { choices, evaluate: evaluatePortfolio };
  const result = await optimizeBestCasePortfolio(options);
  const { evaluatedStates } = result.search;
  return evaluatedStates;
};

const runIterations = async (
  remaining: number,
  choices: BestCasePackageChoice[],
): Promise<void> => {
  if (remaining === 0) return;
  await runOptimizer(choices);
  const pending = runIterations(remaining - 1, choices);
  return pending;
};

test("Benchmark: best-case exact search", async () => {
  const choices = Array.from({ length: 6 }, (_, index) => createChoice(index));
  await runOptimizer(choices);
  const startedAt = performance.now();
  await runIterations(ITERATIONS, choices);
  const averageMs = (performance.now() - startedAt) / ITERATIONS;
  const message = `optimizeBestCasePortfolio (64 exact states): ${averageMs.toFixed(3)}ms avg\n`;
  process.stdout.write(message);

  assert.strictEqual(await runOptimizer(choices), 64);
  assert.ok(averageMs < 25);
});
