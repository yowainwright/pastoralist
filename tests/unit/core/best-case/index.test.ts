import { errorIncludes } from "../../setup";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  createBestCaseReason,
  optimizeSecurityOverrides,
  optimizeBestCasePortfolio,
  applyBestCaseState,
  buildBestCaseChoices,
  resolveBestCasePolicy,
  type BestCaseEvaluation,
  type BestCaseState,
} from "../../../../src/core/best-case";
import type { EvaluationContext } from "../../../../src/core/best-case/types";
import { evaluateStates } from "../../../../src/core/best-case/utils";
import type { SecurityAlert } from "../../../../src/types";

const alert = (
  packageName: string,
  severity: SecurityAlert["severity"],
  cve: string,
): SecurityAlert => ({
  packageName,
  currentVersion: "1.0.0",
  vulnerableVersions: "<2.0.0",
  severity,
  title: cve,
  cves: [cve],
  fixAvailable: true,
  patchedVersion: "2.0.0",
});

const evaluation = (alerts: SecurityAlert[]): BestCaseEvaluation => ({ alerts });

describe("optimizeBestCasePortfolio", () => {
  test("finds the global portfolio instead of selecting every package fix", async () => {
    const choices = [
      { packageName: "alpha", currentVersion: "1.0.0", versions: ["1.0.0", "2.0.0"] },
      { packageName: "beta", currentVersion: "1.0.0", versions: ["1.0.0", "2.0.0"] },
    ];
    const evaluate = (state: BestCaseState): BestCaseEvaluation => {
      const key = `${state.alpha}:${state.beta}`;
      if (key === "2.0.0:1.0.0") return evaluation([alert("beta", "high", "CVE-BETA")]);
      if (key === "1.0.0:2.0.0") return evaluation([alert("alpha", "critical", "CVE-ALPHA")]);
      if (key === "2.0.0:2.0.0") return evaluation([alert("gamma", "critical", "CVE-MIX")]);
      return evaluation([
        alert("alpha", "critical", "CVE-ALPHA"),
        alert("beta", "high", "CVE-BETA"),
      ]);
    };

    const result = await optimizeBestCasePortfolio({ choices, evaluate });

    assert.deepStrictEqual(result.selectedState, { alpha: "2.0.0", beta: "1.0.0" });
    assert.strictEqual(result.search.evaluatedStates, 4);
    assert.strictEqual(result.search.provenOptimal, true);
    assert.strictEqual(result.search.mode, "exact");
    assert.deepStrictEqual(result.impact, {
      fixedVulnerabilities: 1,
      introducedVulnerabilities: 0,
      remainingVulnerabilities: 1,
    });
  });

  test("uses deterministic bounded beam search above the exact-state cap", async () => {
    const choices = Array.from({ length: 8 }, (_, index) => ({
      packageName: `pkg-${index}`,
      currentVersion: "1.0.0",
      versions: ["1.0.0", "2.0.0"],
    }));
    const evaluate = (state: BestCaseState): BestCaseEvaluation => {
      const remaining = Object.entries(state)
        .filter(([, version]) => version === "1.0.0")
        .map(([name]) => alert(name, "high", `CVE-${name}`));
      return evaluation(remaining);
    };
    const config = {
      search: { mode: "auto" as const, exactStateLimit: 32, beamWidth: 2, maxEvaluations: 20 },
    };

    const first = await optimizeBestCasePortfolio({ choices, evaluate, config });
    const second = await optimizeBestCasePortfolio({ choices, evaluate, config });

    assert.deepStrictEqual(first.selectedState, second.selectedState);
    assert.strictEqual(first.search.mode, "beam");
    assert.strictEqual(first.search.provenOptimal, false);
    assert.ok(first.search.evaluatedStates <= 20);
  });

  test("treats evaluator failures as invalid states and continues", async () => {
    const choices = [
      { packageName: "alpha", currentVersion: "1.0.0", versions: ["1.0.0", "2.0.0"] },
    ];
    const evaluate = (state: BestCaseState): BestCaseEvaluation => {
      if (state.alpha === "2.0.0") throw new Error("resolution failed");
      return evaluation([alert("alpha", "high", "CVE-ALPHA")]);
    };

    const result = await optimizeBestCasePortfolio({ choices, evaluate });

    assert.strictEqual(result.selectedState.alpha, "1.0.0");
    assert.strictEqual(result.failedStates, 1);
    assert.strictEqual(result.search.provenOptimal, false);
  });

  test("rejects when every portfolio evaluation fails", async () => {
    const choices = [
      { packageName: "alpha", currentVersion: "1.0.0", versions: ["1.0.0", "2.0.0"] },
    ];
    const evaluate = () => {
      throw new Error("provider unavailable");
    };

    const result = optimizeBestCasePortfolio({ choices, evaluate });

    await assert.rejects(result, errorIncludes("no portfolio states were evaluated successfully"));
  });

  test("withholds optimality when exact search reaches its evaluation cap", async () => {
    const choices = [
      { packageName: "alpha", currentVersion: "1.0.0", versions: ["1.0.0", "2.0.0"] },
    ];
    const config = { search: { mode: "exact" as const, maxEvaluations: 1 } };

    const result = await optimizeBestCasePortfolio({
      choices,
      evaluate: () => evaluation([]),
      config,
    });

    assert.strictEqual(result.search.evaluatedStates, 1);
    assert.strictEqual(result.search.provenOptimal, false);
  });

  test("creates a per-dependency ledger reason linked to the portfolio decision", async () => {
    const choices = [
      { packageName: "alpha", currentVersion: "1.0.0", versions: ["1.0.0", "2.0.0"] },
    ];
    const evaluate = (state: BestCaseState): BestCaseEvaluation => {
      if (state.alpha === "2.0.0") return evaluation([]);
      return evaluation([alert("alpha", "high", "CVE-ALPHA")]);
    };
    const result = await optimizeBestCasePortfolio({ choices, evaluate });

    const reason = createBestCaseReason(result);

    assert.strictEqual(reason.type, "best-case");
    assert.strictEqual(reason.decisionId, result.decisionId);
    assert.deepStrictEqual(reason.search, { evaluatedStates: 2, provenOptimal: true });
    assert.strictEqual(reason.impact.fixedVulnerabilities, 1);
  });
});

test("buildBestCaseChoices normalizes dependency ranges before selecting the baseline", () => {
  const ranged = alert("alpha", "high", "CVE-RANGE");
  const exact = Object.assign({}, ranged, { currentVersion: "1.0.0" });
  const choices = buildBestCaseChoices(
    [Object.assign({}, ranged, { currentVersion: "^1.0.0" }), exact],
    new Map([["alpha", "2.0.0"]]),
  );

  assert.strictEqual(choices[0].currentVersion, "1.0.0");
});

test("optimizeSecurityOverrides hard-constrains user-owned versions", async () => {
  const vulnerablePackages = [
    alert("alpha", "high", "CVE-OWNED"),
    alert("alpha", "critical", "CVE-OWNED-CRITICAL"),
  ];
  const evaluate = (): BestCaseEvaluation => evaluation([]);
  const result = await optimizeSecurityOverrides({
    vulnerablePackages,
    latestVersions: new Map([["alpha", "3.0.0"]]),
    userOwnedVersions: new Map([["alpha", "2.5.0"]]),
    evaluate,
  });

  assert.deepStrictEqual(result.bestCase.selectedState, { alpha: "2.5.0" });
  assert.strictEqual(result.bestCase.search.totalStates, 1);
  assert.strictEqual(result.overrides[0].toVersion, "2.5.0");
});

test("evaluateStates omits states beyond the evaluation limit", async () => {
  const context: EvaluationContext = {
    cache: new Map(),
    choices: [],
    evaluate: () => evaluation([]),
    maxEvaluations: 0,
    policy: resolveBestCasePolicy(),
  };

  assert.deepStrictEqual(await evaluateStates([{ alpha: "1.0.0" }], context), []);
});

test("applyBestCaseState adds packages missing from the installed portfolio", () => {
  const packages = [{ name: "alpha", version: "1.0.0" }];
  const state = { alpha: "2.0.0", beta: "3.0.0" };

  assert.deepStrictEqual(applyBestCaseState(packages, state), [
    { name: "alpha", version: "2.0.0" },
    { name: "beta", version: "3.0.0" },
  ]);
});

test("applyBestCaseState preserves coexisting installed versions", () => {
  const packages = [
    { name: "alpha", version: "1.0.0" },
    { name: "alpha", version: "1.5.0" },
  ];
  const state = { alpha: "2.0.0" };

  assert.deepStrictEqual(applyBestCaseState(packages, state), packages);
});
