import { test, expect, mock } from "bun:test";
import type { Options, PastoralistJSON, SecurityAlert } from "../../../src/types";
import { action } from "../../../src/cli";
import { update as realUpdate } from "../../../src/core/update";
import {
  captureConsoleOutput,
  createActionDeps,
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

const createConfig = (packageName = "risky-pkg"): PastoralistJSON => ({
  name: "test-package",
  version: "1.0.0",
  overrides: { [packageName]: "1.0.0" },
  pastoralist: {
    appendix: {
      [`${packageName}@1.0.0`]: {
        dependents: { root: `${packageName} (unused override)` },
      },
    },
  },
});

const createSecurityResults = (afterAlerts: SecurityAlert[]) => ({
  spinner: createMockSpinner(),
  securityChecker: {
    checkSecurity: mock(async () => ({
      alerts: afterAlerts,
      overrides: [],
      updates: [],
      packagesScanned: 1,
    })),
  },
  alerts: [],
  securityOverrides: [],
  updates: [],
  packagesScanned: 1,
  skipped: false,
});

const createSafetyActionDeps = (
  config: PastoralistJSON,
  afterAlerts: SecurityAlert[],
  options: { graph?: ReturnType<typeof createMockTerminalGraph> } = {},
) => {
  const deps = createActionDeps({
    config,
    checkSecurity: true,
    securityResults: createSecurityResults(afterAlerts),
  });
  const graph = options.graph || createMockTerminalGraph();
  deps.createTerminalGraph = mock(() => graph);
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
    noticedBeforeUpdate = graph.notice.mock.calls.some(
      (call) => typeof call[0] === "string" && call[0].includes("Removal safety:"),
    );
    return realUpdate(mergedOptions);
  });

  await action({ checkSecurity: true, removeUnused: true, isTesting: true }, deps);

  expect(noticedBeforeUpdate).toBe(true);
});

test("action safety - safe comparison allows unused override removal", async () => {
  const config = createConfig("safe-pkg");
  const { resultPromise, getUpdateOptions } = runSafetyAction(config, []);

  const result = await resultPromise;

  expect(getUpdateOptions()?.skipRemovalKeys).toBeUndefined();
  expect(result.removalSafetyComparison?.status).toBe("safe");
  expect(result.appliedOverrides?.["safe-pkg"]).toBeUndefined();
  expect(result.overrideCount).toBe(0);
});

test("action safety - regression blocks cleanup and keeps override", async () => {
  const config = createConfig("risky-pkg");
  const { resultPromise, getUpdateOptions } = runSafetyAction(config, [alert("new-transitive")]);

  const result = await resultPromise;

  expect(getUpdateOptions()?.skipRemovalKeys).toEqual(["risky-pkg@1.0.0"]);
  expect(result.removalSafetyComparison?.status).toBe("blocked");
  expect(result.removalSafetyComparison?.afterAlertCount).toBe(1);
  expect(result.appliedOverrides?.["risky-pkg"]).toBe("1.0.0");
  expect(result.hasUnusedOverrides).toBe(true);
});

test("action safety - JSON output includes removal safety comparison", async () => {
  const config = createConfig("json-pkg");
  const { deps } = createSafetyActionDeps(config, [alert("new-transitive")]);
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

  expect(result.removalSafetyComparison?.blockedKeys).toEqual(["json-pkg@1.0.0"]);
  expect(parsed.removalSafetyComparison.status).toBe("blocked");
  expect(parsed.removalSafetyComparison.blockedKeys).toEqual(["json-pkg@1.0.0"]);
});
