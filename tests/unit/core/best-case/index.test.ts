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
  type BestCasePackageChoice,
  type BestCaseState,
} from "../../../../src/core/best-case";
import type { EvaluationContext } from "../../../../src/core/best-case/types";
import { evaluateStates } from "../../../../src/core/best-case/utils";
import type { SecurityAlert } from "../../../../src/types";

const alert = (
  packageName: string,
  severity: SecurityAlert["severity"],
  cve: string,
): SecurityAlert => {
  const cves = [cve];
  const result = {
    packageName,
    currentVersion: "1.0.0",
    vulnerableVersions: "<2.0.0",
    severity,
    title: cve,
    cves,
    fixAvailable: true,
    patchedVersion: "2.0.0",
  };
  return result;
};

const evaluation = (alerts: SecurityAlert[]): BestCaseEvaluation => ({ alerts });

test("best-case rescans preserve canonical registry identities for aliases", () => {
  const packages = [{ name: "alias", version: "1.0.0", registryName: "actual" }];
  const result = applyBestCaseState(packages, { alias: "1.0.1" });
  assert.deepStrictEqual(result, [{ name: "alias", version: "1.0.1", registryName: "actual" }]);
});

const evaluatePatchedAlpha = (state: BestCaseState): BestCaseEvaluation => {
  const result = evaluation([alert("alpha", "high", "CVE-ALPHA")]);
  if (state.alpha === "1.0.0") return result;
  const result2 = evaluation([]);
  return result2;
};

const evaluateGlobalPortfolio = (state: BestCaseState): BestCaseEvaluation => {
  const key = `${state.alpha}:${state.beta}`;
  const result = evaluation([alert("beta", "high", "CVE-BETA")]);
  if (key === "2.0.0:1.0.0") return result;
  const result2 = evaluation([alert("alpha", "critical", "CVE-ALPHA")]);
  if (key === "1.0.0:2.0.0") return result2;
  const result3 = evaluation([alert("gamma", "critical", "CVE-MIX")]);
  if (key === "2.0.0:2.0.0") return result3;
  const result4 = evaluation([
    alert("alpha", "critical", "CVE-ALPHA"),
    alert("beta", "high", "CVE-BETA"),
  ]);
  return result4;
};

const evaluateRemainingPackages = (state: BestCaseState): BestCaseEvaluation => {
  const remaining = Object.entries(state)
    .filter(([, version]) => version === "1.0.0")
    .map(([name]) => alert(name, "high", `CVE-${name}`));
  const result = evaluation(remaining);
  return result;
};

const evaluateResolutionFailure = (state: BestCaseState): BestCaseEvaluation => {
  if (state.alpha === "2.0.0") throw new Error("resolution failed");
  const result = evaluation([alert("alpha", "high", "CVE-ALPHA")]);
  return result;
};

const rejectProviderEvaluation = () => {
  throw new Error("provider unavailable");
};

const evaluateLedgerPortfolio = (state: BestCaseState): BestCaseEvaluation => {
  const result = evaluation([]);
  if (state.alpha === "2.0.0") return result;
  const result2 = evaluation([alert("alpha", "high", "CVE-ALPHA")]);
  return result2;
};

const evaluateOwnedVersions = (): BestCaseEvaluation => evaluation([]);

const selectLowestPatchedVersion = async () => {
  const versions = ["1.10.0", "1.2.0"];
  const choices = [{ packageName: "alpha", currentVersion: "1.0.0", versions }];

  const result = await optimizeBestCasePortfolio({ choices, evaluate: evaluatePatchedAlpha });
  assert.equal(result.selectedState.alpha, "1.2.0");
};

const findGlobalPortfolio = async () => {
  const versions = ["1.0.0", "2.0.0"];
  const versions2 = ["1.0.0", "2.0.0"];
  const choices = [
    { packageName: "alpha", currentVersion: "1.0.0", versions },
    { packageName: "beta", currentVersion: "1.0.0", versions: versions2 },
  ];

  const result = await optimizeBestCasePortfolio({ choices, evaluate: evaluateGlobalPortfolio });

  assert.deepStrictEqual(result.selectedState, { alpha: "2.0.0", beta: "1.0.0" });
  assert.strictEqual(result.search.evaluatedStates, 4);
  assert.strictEqual(result.search.provenOptimal, true);
  assert.strictEqual(result.search.mode, "exact");
  assert.deepStrictEqual(result.impact, {
    fixedVulnerabilities: 1,
    introducedVulnerabilities: 0,
    remainingVulnerabilities: 1,
  });
};

const createBeamChoice = (_value: unknown, index: number) => {
  const packageName = `pkg-${index}`;
  const versions = ["1.0.0", "2.0.0"];
  const choice = { packageName, currentVersion: "1.0.0", versions };
  return choice;
};

const useBoundedBeamSearch = async () => {
  const choices = Array.from({ length: 8 }, createBeamChoice);

  const mode = "auto" as const;
  const search = { mode, exactStateLimit: 32, beamWidth: 2, maxEvaluations: 20 };
  const config = { search };

  const options = {
    choices,
    evaluate: evaluateRemainingPackages,
    config,
  };
  const first = await optimizeBestCasePortfolio(options);
  const second = await optimizeBestCasePortfolio(options);

  assert.deepStrictEqual(first.selectedState, second.selectedState);
  assert.strictEqual(first.search.mode, "beam");
  assert.strictEqual(first.search.provenOptimal, false);
  assert.ok(first.search.evaluatedStates <= 20);
};

const continueAfterEvaluationFailure = async () => {
  const versions = ["1.0.0", "2.0.0"];
  const choices = [{ packageName: "alpha", currentVersion: "1.0.0", versions }];

  const result = await optimizeBestCasePortfolio({ choices, evaluate: evaluateResolutionFailure });

  assert.strictEqual(result.selectedState.alpha, "1.0.0");
  assert.strictEqual(result.failedStates, 1);
  assert.strictEqual(result.search.provenOptimal, false);
};

const rejectFailedPortfolios = async () => {
  const versions = ["1.0.0", "2.0.0"];
  const choices = [{ packageName: "alpha", currentVersion: "1.0.0", versions }];

  const result = optimizeBestCasePortfolio({ choices, evaluate: rejectProviderEvaluation });

  await assert.rejects(result, errorIncludes("no portfolio states were evaluated successfully"));
};

const limitExactSearch = async () => {
  const versions = ["1.0.0", "2.0.0"];
  const choices = [{ packageName: "alpha", currentVersion: "1.0.0", versions }];
  const mode = "exact" as const;
  const search = { mode, maxEvaluations: 1 };
  const config = { search };

  const result = await optimizeBestCasePortfolio({
    choices,
    evaluate: () => evaluation([]),
    config,
  });

  assert.strictEqual(result.search.evaluatedStates, 1);
  assert.strictEqual(result.search.provenOptimal, false);
};

const linkPortfolioLedger = async () => {
  const versions = ["1.0.0", "2.0.0"];
  const choices = [{ packageName: "alpha", currentVersion: "1.0.0", versions }];

  const result = await optimizeBestCasePortfolio({ choices, evaluate: evaluateLedgerPortfolio });

  const reason = createBestCaseReason(result);

  assert.strictEqual(reason.type, "best-case");
  assert.strictEqual(reason.decisionId, result.decisionId);
  assert.deepStrictEqual(reason.search, { evaluatedStates: 2, provenOptimal: true });
  assert.strictEqual(reason.impact.fixedVulnerabilities, 1);
};

describe("optimizeBestCasePortfolio", () => {
  test(
    "selects the lowest version when patched portfolios are equally safe",
    selectLowestPatchedVersion,
  );

  test("finds the global portfolio instead of selecting every package fix", findGlobalPortfolio);

  test("uses deterministic bounded beam search above the exact-state cap", useBoundedBeamSearch);

  test("treats evaluator failures as invalid states and continues", continueAfterEvaluationFailure);

  test("rejects when every portfolio evaluation fails", rejectFailedPortfolios);

  test("withholds optimality when exact search reaches its evaluation cap", limitExactSearch);

  test(
    "creates a per-dependency ledger reason linked to the portfolio decision",
    linkPortfolioLedger,
  );
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

  const latestVersions = new Map([["alpha", "3.0.0"]]);
  const userOwnedVersions = new Map([["alpha", "2.5.0"]]);
  const result = await optimizeSecurityOverrides({
    vulnerablePackages,
    latestVersions,
    userOwnedVersions,
    evaluate: evaluateOwnedVersions,
  });

  assert.deepStrictEqual(result.bestCase.selectedState, { alpha: "2.5.0" });
  assert.strictEqual(result.bestCase.search.totalStates, 1);
  assert.strictEqual(result.overrides[0].toVersion, "2.5.0");
});

test("evaluateStates omits states beyond the evaluation limit", async () => {
  const cache = new Map();
  const choices: BestCasePackageChoice[] = [];
  const policy = resolveBestCasePolicy();
  const context: EvaluationContext = {
    cache,
    choices,
    evaluate: () => evaluation([]),
    maxEvaluations: 0,
    policy,
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
