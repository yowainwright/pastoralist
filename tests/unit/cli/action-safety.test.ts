import { test } from "node:test";
import { mock } from "../setup";
import assert from "node:assert/strict";
import type { BestCaseResult } from "../../../src/core/best-case";
import type { Options, PastoralistJSON, SecurityAlert } from "../../../src/types";
import { action } from "../../../src/cli";
import { update as realUpdate } from "../../../src/core/update";
import {
  captureConsoleOutput,
  createActionDeps,
  createMockSecurityResults,
  createMockSpinner,
  createMockTerminalGraph,
} from "./mocks";

const alert = (
  packageName: string,
  severity: SecurityAlert["severity"] = "high",
): SecurityAlert => ({
  packageName,
  currentVersion: "1.0.0",
  vulnerableVersions: "< 2.0.0",
  severity,
  title: `${packageName} vulnerability`,
  fixAvailable: true,
  patchedVersion: "2.0.0",
});

const BEST_CASE_RESULT: BestCaseResult = {
  selectedState: { alpha: "2.0.0" },
  selectedEvaluation: { alerts: [] },
  baselineState: { alpha: "1.0.0" },
  baselineEvaluation: { alerts: [alert("alpha")] },
  decisionId: "best-case-decision",
  policyHash: "policy-hash",
  search: {
    mode: "exact",
    evaluatedStates: 2,
    totalStates: 2,
    provenOptimal: true,
    durationMs: 1,
  },
  impact: {
    fixedVulnerabilities: 1,
    introducedVulnerabilities: 0,
    remainingVulnerabilities: 0,
  },
  failedStates: 0,
};

test("action security - returns the selected best-case summary", async () => {
  const securityResults = createMockSecurityResults([], BEST_CASE_RESULT);
  const deps = createActionDeps({ checkSecurity: true, securityResults });

  const result = await action({ checkSecurity: true, isTesting: true }, deps);

  assert.deepStrictEqual(result.bestCase, {
    selectedState: BEST_CASE_RESULT.selectedState,
    decisionId: BEST_CASE_RESULT.decisionId,
    policyHash: BEST_CASE_RESULT.policyHash,
    search: BEST_CASE_RESULT.search,
    impact: BEST_CASE_RESULT.impact,
    failedStates: BEST_CASE_RESULT.failedStates,
  });
});

const createConfigFromOverrides = (overrides: Record<string, string>): PastoralistJSON => ({
  name: "test-package",
  version: "1.0.0",
  overrides,
  pastoralist: {
    appendix: Object.fromEntries(
      Object.entries(overrides).map(([packageName, version]) => [
        `${packageName}@${version}`,
        {
          dependents: { root: `${packageName} (unused override)` },
        },
      ]),
    ),
  },
});

const createConfig = (packageName = "risky-pkg"): PastoralistJSON =>
  createConfigFromOverrides({ [packageName]: "1.0.0" });

const createSecurityResults = (afterAlerts: SecurityAlert[]) => ({
  spinner: createMockSpinner(),
  securityChecker: {
    checkSecurity: mock(() =>
      Promise.resolve({
        alerts: afterAlerts,
        overrides: [],
        updates: [],
        packagesScanned: 1,
      }),
    ),
  },
  alerts: afterAlerts,
  securityOverrides: [],
  updates: [],
  packagesScanned: 1,
  skipped: false,
});

const createSafetyActionDeps = (
  config: PastoralistJSON,
  afterAlerts: SecurityAlert[],
  options: {
    graph?: ReturnType<typeof createMockTerminalGraph>;
    quickConfirm?: ReturnType<typeof mock>;
  } = {},
) => {
  const deps = createActionDeps({
    config,
    checkSecurity: true,
    securityResults: createSecurityResults(afterAlerts),
  });
  const graph = options.graph || createMockTerminalGraph();
  deps.createTerminalGraph = mock(() => graph);
  if (options.quickConfirm) deps.quickConfirm = options.quickConfirm;
  return { deps, graph };
};

const runSafetyAction = (
  config: PastoralistJSON,
  afterAlerts: SecurityAlert[],
  options: Options = {},
) => {
  const { deps, graph } = createSafetyActionDeps(config, afterAlerts);
  let updateOptions: Options | undefined;
  deps.update = mock((mergedOptions: Options) => {
    updateOptions = mergedOptions;
    return realUpdate(mergedOptions);
  });
  const resultPromise = action(
    Object.assign({ checkSecurity: true, removeUnused: true, isTesting: true }, options),
    deps,
  );
  return { resultPromise, deps, graph, getUpdateOptions: () => updateOptions };
};

test("action safety - renders comparison before update runs", async () => {
  const config = createConfig();
  const { deps, graph } = createSafetyActionDeps(config, []);
  let noticedBeforeUpdate = false;
  deps.update = mock((mergedOptions: Options) => {
    noticedBeforeUpdate = graph.notice.mock.calls
      .map((call) => (Array.isArray(call) ? call : call.arguments))
      .some((call) => typeof call[0] === "string" && call[0].includes("Removal safety:"));
    return realUpdate(mergedOptions);
  });

  await action({ checkSecurity: true, removeUnused: true, isTesting: true }, deps);

  assert.strictEqual(noticedBeforeUpdate, true);
});

test("action safety - safe comparison allows unused override removal", async () => {
  const config = createConfig("safe-pkg");
  const { resultPromise, getUpdateOptions } = runSafetyAction(config, []);

  const result = await resultPromise;

  assert.strictEqual(getUpdateOptions()?.skipRemovalKeys, undefined);
  assert.strictEqual(result.removalSafetyComparison?.status, "safe");
  assert.strictEqual(result.appliedOverrides?.["safe-pkg"], undefined);
  assert.strictEqual(result.overrideCount, 0);
});

test("action safety - current vulnerability blocks cleanup and keeps override", async () => {
  const config = createConfig("risky-pkg");
  const { resultPromise, graph, getUpdateOptions } = runSafetyAction(config, [alert("risky-pkg")]);

  const result = await resultPromise;
  const noticeMessages = graph.notice.mock.calls
    .map((call) => (Array.isArray(call) ? call : call.arguments))
    .map((call) => String(call[0]));

  assert.deepStrictEqual(getUpdateOptions()?.skipRemovalKeys, ["risky-pkg@1.0.0"]);
  assert.strictEqual(result.removalSafetyComparison?.status, "blocked");
  assert.strictEqual(result.removalSafetyComparison?.afterAlertCount, 1);
  assert.strictEqual(result.appliedOverrides?.["risky-pkg"], "1.0.0");
  assert.strictEqual(result.hasUnusedOverrides, true);
  assert.strictEqual(
    noticeMessages.some((message) => message.includes("still resolve to vulnerable")),
    true,
  );
});

test("action safety - keeps a security override when the current scan is clean", async () => {
  const config = createConfig("security-pkg");
  config.pastoralist!.appendix!["security-pkg@1.0.0"].ledger = {
    addedDate: "2026-08-16",
    source: "security",
    securityChecked: true,
    cves: ["CVE-2026-0001"],
  };
  const { resultPromise, getUpdateOptions } = runSafetyAction(config, []);

  const result = await resultPromise;

  assert.deepStrictEqual(getUpdateOptions()?.skipRemovalKeys, ["security-pkg@1.0.0"]);
  assert.strictEqual(result.removalSafetyComparison?.status, "blocked");
  assert.strictEqual(result.appliedOverrides?.["security-pkg"], "1.0.0");
  assert.strictEqual(result.hasUnusedOverrides, true);
});

test("action safety - interactive approval prompt lists removable overrides", async () => {
  const config = createConfig("interactive-pkg");
  const quickConfirm = mock(() => Promise.resolve(true));
  const { deps } = createSafetyActionDeps(config, [], { quickConfirm });
  deps.update = mock((mergedOptions: Options) => realUpdate(mergedOptions));

  const result = await action(
    {
      checkSecurity: true,
      interactive: true,
      removeUnused: true,
      isTesting: true,
    },
    deps,
  );

  assert.strictEqual(quickConfirm.mock.callCount(), 1);
  assert.ok(
    quickConfirm.mock.calls
      .map((call) => (Array.isArray(call) ? call : call.arguments))[0][0]
      .includes("interactive-pkg@1.0.0"),
  );
  assert.strictEqual(
    quickConfirm.mock.calls.map((call) => (Array.isArray(call) ? call : call.arguments))[0][1],
    false,
  );
  assert.strictEqual(result.removalSafetyComparison?.status, "safe");
  assert.strictEqual(result.appliedOverrides?.["interactive-pkg"], undefined);
});

test("action safety - interactive prompt truncates long removable override lists", async () => {
  const config = createConfigFromOverrides({
    "pkg-one": "1.0.0",
    "pkg-two": "1.0.0",
    "pkg-three": "1.0.0",
    "pkg-four": "1.0.0",
    "pkg-five": "1.0.0",
    "pkg-six": "1.0.0",
  });
  const quickConfirm = mock(() => Promise.resolve(true));
  const { deps } = createSafetyActionDeps(config, [], { quickConfirm });
  deps.update = mock((mergedOptions: Options) => realUpdate(mergedOptions));

  await action(
    {
      checkSecurity: true,
      interactive: true,
      removeUnused: true,
      isTesting: true,
    },
    deps,
  );

  const prompt = String(
    quickConfirm.mock.calls.map((call) => (Array.isArray(call) ? call : call.arguments))[0][0],
  );
  assert.ok(prompt.includes("pkg-one@1.0.0"));
  assert.ok(prompt.includes("pkg-five@1.0.0, +1 more"));
  assert.ok(!prompt.includes("pkg-six@1.0.0"));
});

test("action safety - interactive decline keeps overrides with declined notice", async () => {
  const config = createConfig("declined-pkg");
  const graph = createMockTerminalGraph();
  const quickConfirm = mock(() => Promise.resolve(false));
  const { deps } = createSafetyActionDeps(config, [], { graph, quickConfirm });
  deps.update = mock((mergedOptions: Options) => realUpdate(mergedOptions));

  const result = await action(
    {
      checkSecurity: true,
      interactive: true,
      removeUnused: true,
      isTesting: true,
    },
    deps,
  );

  const noticeMessages = graph.notice.mock.calls
    .map((call) => (Array.isArray(call) ? call : call.arguments))
    .map((call) => String(call[0]));
  assert.strictEqual(result.removalSafetyComparison?.status, "declined");
  assert.deepStrictEqual(result.removalSafetyComparison?.allowedKeys, []);
  assert.deepStrictEqual(result.removalSafetyComparison?.blockedKeys, ["declined-pkg@1.0.0"]);
  assert.strictEqual(result.appliedOverrides?.["declined-pkg"], "1.0.0");
  assert.ok(noticeMessages.includes("Cleanup of 1 override declined by user."));
});

test("action safety - JSON output includes removal safety comparison", async () => {
  const config = createConfig("json-pkg");
  const { deps } = createSafetyActionDeps(config, [alert("json-pkg")]);
  deps.update = mock((mergedOptions: Options) => realUpdate(mergedOptions));
  const consoleCapture = captureConsoleOutput();
  consoleCapture.start();

  const result = await action(
    {
      checkSecurity: true,
      removeUnused: true,
      isTesting: true,
      outputFormat: "json",
    },
    deps,
  );

  consoleCapture.stop();
  const [line] = consoleCapture.getOutput();
  const parsed = JSON.parse(line);

  assert.deepStrictEqual(result.removalSafetyComparison?.blockedKeys, ["json-pkg@1.0.0"]);
  assert.strictEqual(parsed.removalSafetyComparison.status, "blocked");
  assert.deepStrictEqual(parsed.removalSafetyComparison.blockedKeys, ["json-pkg@1.0.0"]);
});
