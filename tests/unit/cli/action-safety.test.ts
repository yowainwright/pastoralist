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
  const { resultPromise, graph, getUpdateOptions } = runSafetyAction(config, [
    alert("new-transitive"),
  ]);

  const result = await resultPromise;
  const noticeMessages = graph.notice.mock.calls.map((call) => String(call[0]));

  expect(getUpdateOptions()?.skipRemovalKeys).toEqual(["risky-pkg@1.0.0"]);
  expect(result.removalSafetyComparison?.status).toBe("blocked");
  expect(result.removalSafetyComparison?.afterAlertCount).toBe(1);
  expect(result.appliedOverrides?.["risky-pkg"]).toBe("1.0.0");
  expect(result.hasUnusedOverrides).toBe(true);
  expect(noticeMessages.some((message) => message.includes("New vulnerabilities detected"))).toBe(
    true,
  );
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

  expect(quickConfirm).toHaveBeenCalledTimes(1);
  expect(quickConfirm.mock.calls[0][0]).toContain("interactive-pkg@1.0.0");
  expect(quickConfirm.mock.calls[0][1]).toBe(false);
  expect(result.removalSafetyComparison?.status).toBe("safe");
  expect(result.appliedOverrides?.["interactive-pkg"]).toBeUndefined();
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

  const prompt = String(quickConfirm.mock.calls[0][0]);
  expect(prompt).toContain("pkg-one@1.0.0");
  expect(prompt).toContain("pkg-five@1.0.0, +1 more");
  expect(prompt).not.toContain("pkg-six@1.0.0");
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

  const noticeMessages = graph.notice.mock.calls.map((call) => String(call[0]));
  expect(result.removalSafetyComparison?.status).toBe("declined");
  expect(result.removalSafetyComparison?.allowedKeys).toEqual([]);
  expect(result.removalSafetyComparison?.blockedKeys).toEqual(["declined-pkg@1.0.0"]);
  expect(result.appliedOverrides?.["declined-pkg"]).toBe("1.0.0");
  expect(noticeMessages).toContain("Cleanup of 1 override declined by user.");
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
