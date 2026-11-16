import { assertMatches, stringContaining, notStringContaining } from "../../setup";
import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createTerminalGraph } from "../../../../src/dx/tree";
import type { Output } from "../../../../src/dx/types";
import type {
  OverrideInfo,
  VulnerabilityInfo,
  SecurityFixInfo,
  RemovedOverrideInfo,
} from "../../../../src/dx/tree/types";
const createMockOutput = (): Output & {
  lines: string[];
} => {
  const lines: string[] = [];
  const result3 = {
    lines,
    write: (text: string) => {
      lines[lines.length] = text;
    },
    writeLine: (text: string) => {
      lines[lines.length] = text;
    },
    clearLine: () => {},
    hideCursor: () => {},
    showCursor: () => {},
  };
  return result3;
};
test("terminal-graph / notice / renders boxed message with borders and content", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.notice("Test message");
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("-"));
  assertMatches(joined, stringContaining("Test message"));
});
test("terminal-graph / notice / includes bold white text styling", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.notice("Styled text");
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("\x1b[97m"));
  assertMatches(joined, stringContaining("\x1b[1m"));
});
test("terminal-graph / notice / includes red pipe borders", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.notice("Bordered text");
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("\x1b[31m|"));
});
test("terminal-graph / notice / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.notice("Chained");
  assert.strictEqual(result, graph);
});
test("terminal-graph / securityFix / renders security fix with version upgrade", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.securityFix({
    packageName: "lodash",
    fromVersion: "4.17.20",
    toVersion: "4.17.21",
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("lodash@4.17.21"));
  assertMatches(joined, stringContaining("4.17.20 → 4.17.21"));
});
const securityFixCves = ["CVE-2021-23337"];
test("terminal-graph / securityFix / renders CVE when provided", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.securityFix({
    packageName: "lodash",
    fromVersion: "4.17.20",
    toVersion: "4.17.21",
    cves: securityFixCves,
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Blocks CVE-2021-23337"));
});
test("terminal-graph / securityFix / renders reason when provided", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.securityFix({
    packageName: "lodash",
    fromVersion: "4.17.20",
    toVersion: "4.17.21",
    reason: "Security fix: Command Injection",
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Security fix: Command Injection"));
});
const projectConstraints = ["Node 20"];
const projectReason: OverrideInfo["reason"] = {
  type: "project",
  summary: "Pinned for compatibility",
  pin: "4.17.21",
  patch: "patches/lodash.patch",
  constraints: projectConstraints,
};
test("terminal-graph / override reason / renders a project reason object", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override({
    packageName: "lodash",
    version: "4.17.21",
    reason: projectReason,
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Pinned for compatibility"));
  assertMatches(joined, stringContaining("Pin: 4.17.21"));
  assertMatches(joined, stringContaining("Patch: patches/lodash.patch"));
  assertMatches(joined, stringContaining("Constraints: Node 20"));
});
const bestCaseSearch = {
  evaluatedStates: 12,
  provenOptimal: false,
};
const bestCaseImpact = {
  fixedVulnerabilities: 3,
  introducedVulnerabilities: 1,
  remainingVulnerabilities: 2,
};
const bestCaseReason: OverrideInfo["reason"] = {
  type: "best-case",
  summary: "Selected as part of the lowest-risk dependency portfolio",
  decisionId: "best-case-abc123",
  policyHash: "def456",
  search: bestCaseSearch,
  impact: bestCaseImpact,
};
test("terminal-graph / override reason / renders best-case search and impact metadata", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override({
    packageName: "lodash",
    version: "4.17.21",
    reason: bestCaseReason,
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("best-case-abc123 (bounded, 12 states)"));
  assertMatches(joined, stringContaining("3 fixed, 1 introduced, 2 remaining"));
});
test("terminal-graph / removedOverride / renders removed override with package info", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.removedOverride({
    packageName: "lodash",
    version: "4.17.21",
    reason: "Override no longer needed",
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("lodash@4.17.21"));
  assertMatches(joined, stringContaining("Override no longer needed"));
});
test("terminal-graph / vulnerability / renders vulnerability with fix available", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.vulnerability({
    severity: "high",
    packageName: "lodash",
    currentVersion: "4.17.20",
    title: "Command Injection",
    fixAvailable: true,
    patchedVersion: "4.17.21",
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("[HIGH] lodash@4.17.20"));
  assertMatches(joined, stringContaining("Command Injection"));
  assertMatches(joined, stringContaining("Fix: upgrade to 4.17.21"));
});
test("terminal-graph / vulnerability / renders vulnerability without fix available", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.vulnerability({
    severity: "critical",
    packageName: "vulnerable-pkg",
    currentVersion: "1.0.0",
    title: "No patch available",
    fixAvailable: false,
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("No fix available"));
});
const vulnerabilityCves = ["CVE-2024-1234"];
test("terminal-graph / vulnerability / renders CVE when provided", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.vulnerability({
    severity: "medium",
    packageName: "test-pkg",
    currentVersion: "1.0.0",
    title: "Test vulnerability",
    fixAvailable: false,
    cves: vulnerabilityCves,
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("CVE: CVE-2024-1234"));
});
test("terminal-graph / item / renders item with success icon", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.item("Test item");
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Test item"));
});
test("terminal-graph / item / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.item("Chained item");
  assert.strictEqual(result, graph);
});
test("terminal-graph / summary / renders overrides summary", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.summary({ lodash: "4.17.21", express: "4.18.2" });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Overrides"));
  assertMatches(joined, stringContaining("lodash: 4.17.21"));
  assertMatches(joined, stringContaining("express: 4.18.2"));
});
test("terminal-graph / summary / renders changes when provided", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.summary({}, ["Added lodash override", "Removed minimist"]);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Changes"));
  assertMatches(joined, stringContaining("Added lodash override"));
  assertMatches(joined, stringContaining("Removed minimist"));
});
test("terminal-graph / summary / renders both overrides and changes", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.summary({ lodash: "4.17.21" }, ["Updated lodash"]);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Overrides"));
  assertMatches(joined, stringContaining("lodash: 4.17.21"));
  assertMatches(joined, stringContaining("Changes"));
  assertMatches(joined, stringContaining("Updated lodash"));
});
test("terminal-graph / summary / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.summary({});
  assert.strictEqual(result, graph);
});
test("terminal-graph / stop / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.stop();
  assert.strictEqual(result, graph);
});
test("terminal-graph / progress / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.progress(1, 5, "lodash");
  assert.strictEqual(result, graph);
  graph.stop();
});
test("terminal-graph / executiveSummary / renders vulnerabilities fixed with plural form", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({ vulnerabilitiesFixed: 3 });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("3 vulnerabilities fixed"));
});
test("terminal-graph / executiveSummary / renders vulnerabilities fixed with singular form", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({ vulnerabilitiesFixed: 1 });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("1 vulnerability fixed"));
});
test("terminal-graph / executiveSummary / renders stale overrides removed with plural form", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({ staleOverridesRemoved: 2 });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("2 stale overrides removed"));
});
test("terminal-graph / executiveSummary / renders stale overrides removed with singular form", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({ staleOverridesRemoved: 1 });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("1 stale override removed"));
});
test("terminal-graph / executiveSummary / renders packages protected with plural form", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({ packagesProtected: 5 });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("5 packages protected"));
});
test("terminal-graph / executiveSummary / renders packages protected with singular form", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({ packagesProtected: 1 });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("1 package protected"));
});
test("terminal-graph / executiveSummary / renders all metrics together", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({
    vulnerabilitiesFixed: 2,
    staleOverridesRemoved: 1,
    packagesProtected: 10,
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("2 vulnerabilities fixed"));
  assertMatches(joined, stringContaining("1 stale override removed"));
  assertMatches(joined, stringContaining("10 packages protected"));
});
test("terminal-graph / executiveSummary / renders nothing for zero values", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({
    vulnerabilitiesFixed: 0,
    staleOverridesRemoved: 0,
    packagesProtected: 0,
  });
  const joined = output.lines.join("\n");
  assertMatches(joined, notStringContaining("fixed"));
  assertMatches(joined, notStringContaining("removed"));
  assertMatches(joined, notStringContaining("protected"));
});
test("terminal-graph / executiveSummary / does not emit blank line for zero values", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({
    vulnerabilitiesFixed: 0,
    staleOverridesRemoved: 0,
    packagesProtected: 0,
  });
  assert.deepStrictEqual(output.lines, []);
});
test("terminal-graph / executiveSummary / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.executiveSummary({ vulnerabilitiesFixed: 1 });
  assert.strictEqual(result, graph);
});
test("terminal-graph / quiet mode / suppresses all output when quiet option is true", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ quiet: true, out: output });
  graph.notice("Test message");
  graph.executiveSummary({ vulnerabilitiesFixed: 5 });
  assert.strictEqual(output.lines.length, 0);
});
test("terminal-graph / quiet mode / produces output when quiet option is false", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ quiet: false, out: output });
  graph.notice("Test message");
  assert.ok(output.lines.length > 0);
});
test("terminal-graph / banner / renders banner with farmer emoji and app name", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.banner();
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Pastoralist"));
  assertMatches(joined, stringContaining("\x1b[32m"));
});
test("terminal-graph / banner / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.banner();
  assert.strictEqual(result, graph);
});
test("terminal-graph / startPhase and endPhase / renders phase start and end", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.startPhase("analysis", "Analyzing dependencies");
  graph.endPhase("Analysis complete");
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Analyzing dependencies"));
  assertMatches(joined, stringContaining("Analysis complete"));
});
test("terminal-graph / startPhase and endPhase / endPhase without text", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.startPhase("scan", "Scanning");
  graph.endPhase();
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Scanning"));
  assertMatches(joined, notStringContaining("undefined"));
});
test("terminal-graph / startPhase and endPhase / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result1 = graph.startPhase("test", "Testing");
  const result2 = graph.endPhase();
  assert.strictEqual(result1, graph);
  assert.strictEqual(result2, graph);
});
test("terminal-graph / complete / renders completion message", async () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.complete("All done!");
  await graph.waitForCompletion();
  const joined = output.lines.join("");
  assertMatches(joined, stringContaining("A"));
  assertMatches(joined, stringContaining("l"));
  assertMatches(joined, stringContaining("d"));
  assertMatches(joined, stringContaining("o"));
  assertMatches(joined, stringContaining("n"));
  assertMatches(joined, stringContaining("e"));
  assertMatches(joined, stringContaining("!"));
});
test("terminal-graph / complete / renders with suffix", async () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.complete("Complete", " (1.2s)");
  await graph.waitForCompletion();
  const joined = output.lines.join("");
  assertMatches(joined, stringContaining("C"));
  assertMatches(joined, stringContaining("o"));
  assertMatches(joined, stringContaining("m"));
  assertMatches(joined, stringContaining("p"));
  assertMatches(joined, stringContaining("l"));
  assertMatches(joined, stringContaining("e"));
  assertMatches(joined, stringContaining("t"));
  assertMatches(joined, stringContaining("(1.2s)"));
});
test("terminal-graph / complete / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.complete("Done");
  assert.strictEqual(result, graph);
});
const basicOverride: OverrideInfo = {
  packageName: "lodash",
  version: "4.17.21",
  reason: "Security fix",
};
test("terminal-graph / override / renders override with basic info", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(basicOverride);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("lodash@4.17.21"));
  assertMatches(joined, stringContaining("Security fix"));
});
const overrideCves = ["CVE-2021-44906"];
const cveOverride: OverrideInfo = {
  packageName: "minimist",
  version: "1.2.6",
  reason: "Fix vulnerability",
  cves: overrideCves,
};
test("terminal-graph / override / renders override with CVE", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(cveOverride);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("CVE-2021-44906"));
});
const overridePatches = ["fix-memory-leak.patch", "security.patch"];
const patchedOverride: OverrideInfo = {
  packageName: "test-pkg",
  version: "1.0.0",
  reason: "Apply patches",
  patches: overridePatches,
};
test("terminal-graph / override / renders override with patches", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(patchedOverride);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Patches: fix-memory-leak.patch, security.patch"));
});
const multipleDependents = {
  express: "4.18.2",
  react: "18.2.0",
};
const multipleDependentsOverride: OverrideInfo = {
  packageName: "lodash",
  version: "4.17.21",
  reason: "Update",
  dependents: multipleDependents,
};
test("terminal-graph / override / renders override with dependents", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(multipleDependentsOverride);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Used by: 2 packages"));
});
const singleDependent = {
  express: "4.18.2",
};
const singleDependentOverride: OverrideInfo = {
  packageName: "lodash",
  version: "4.17.21",
  reason: "Update",
  dependents: singleDependent,
};
test("terminal-graph / override / renders override with single dependent", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(singleDependentOverride);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Used by: 1 package"));
});
const securityOverride: OverrideInfo = {
  packageName: "test",
  version: "1.0.0",
  reason: "Security",
  isSecurityFix: true,
};
test("terminal-graph / override / renders override marked as security fix", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(securityOverride);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("test@1.0.0"));
});
const lastOverride: OverrideInfo = {
  packageName: "test",
  version: "1.0.0",
  reason: "Test",
};
test("terminal-graph / override / renders override as last item", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(lastOverride, true);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("└──"));
});
const emptyPatches: string[] = [];
const emptyPatchesOverride: OverrideInfo = {
  packageName: "test",
  version: "1.0.0",
  reason: "Test",
  patches: emptyPatches,
};
test("terminal-graph / override / renders override with empty patches array", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(emptyPatchesOverride);
  const joined = output.lines.join("\n");
  assertMatches(joined, notStringContaining("Patches:"));
});
const emptyDependents = {};
const emptyDependentsOverride: OverrideInfo = {
  packageName: "test",
  version: "1.0.0",
  reason: "Test",
  dependents: emptyDependents,
};
test("terminal-graph / override / renders override with empty dependents", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(emptyDependentsOverride);
  const joined = output.lines.join("\n");
  assertMatches(joined, notStringContaining("Used by:"));
});
const chainableOverride: OverrideInfo = {
  packageName: "test",
  version: "1.0.0",
  reason: "Test",
};
test("terminal-graph / override / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.override(chainableOverride);
  assert.strictEqual(result, graph);
});
const linkedVulnerability: VulnerabilityInfo = {
  severity: "high",
  packageName: "lodash",
  currentVersion: "4.17.20",
  title: "Prototype Pollution",
  fixAvailable: true,
  patchedVersion: "4.17.21",
  url: "https://github.com/advisories/GHSA-xxxxx",
};
test("terminal-graph / vulnerability with URL / renders vulnerability with URL", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.vulnerability(linkedVulnerability);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("https://github.com/advisories/GHSA-xxxxx"));
});
const lastVulnerability: VulnerabilityInfo = {
  severity: "low",
  packageName: "test",
  currentVersion: "1.0.0",
  title: "Test",
  fixAvailable: false,
};
test("terminal-graph / vulnerability with URL / renders as last vulnerability", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.vulnerability(lastVulnerability, true);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("└──"));
});
const minimalSecurityFix: SecurityFixInfo = {
  packageName: "test",
  fromVersion: "1.0.0",
  toVersion: "1.0.1",
};
test("terminal-graph / securityFix edge cases / renders security fix without details", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.securityFix(minimalSecurityFix);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("test@1.0.1"));
  assertMatches(joined, stringContaining("1.0.0 → 1.0.1"));
});
const lastSecurityFix: SecurityFixInfo = {
  packageName: "test",
  fromVersion: "1.0.0",
  toVersion: "1.0.1",
};
test("terminal-graph / securityFix edge cases / renders as last security fix", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.securityFix(lastSecurityFix, true);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("└──"));
});
const chainableSecurityFix: SecurityFixInfo = {
  packageName: "test",
  fromVersion: "1.0.0",
  toVersion: "1.0.1",
};
test("terminal-graph / securityFix edge cases / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.securityFix(chainableSecurityFix);
  assert.strictEqual(result, graph);
});
const lastRemovedOverride: RemovedOverrideInfo = {
  packageName: "test",
  version: "1.0.0",
  reason: "No longer needed",
};
test("terminal-graph / removedOverride edge cases / renders as last removed override", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.removedOverride(lastRemovedOverride, true);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("└──"));
});
const chainableRemovedOverride: RemovedOverrideInfo = {
  packageName: "test",
  version: "1.0.0",
  reason: "Test",
};
test("terminal-graph / removedOverride edge cases / returns graph for chaining", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  const result = graph.removedOverride(chainableRemovedOverride);
  assert.strictEqual(result, graph);
});
const createIntervals = (context: TestContext) => {
  const intervalCallbacks: Array<() => void> = [];
  const intervalIds = new Set<number>();
  context.mock.method(global, "setInterval", (fn: () => void) => {
    intervalCallbacks[intervalCallbacks.length] = fn;
    const id: any = Math.random();
    intervalIds.add(id);
    return id;
  });
  context.mock.method(global, "clearInterval", (id: number) => {
    intervalIds.delete(id);
  });
  const intervals = { intervalCallbacks, intervalIds };
  return intervals;
};
test("terminal-graph / spinner behavior / starts spinner on first progress item", (context) => {
  const { intervalCallbacks, intervalIds } = createIntervals(context);
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.progress(1, 10, "package-1");
  assert.strictEqual(intervalCallbacks.length, 1);
  assert.strictEqual(intervalIds.size, 1);
});
test("terminal-graph / spinner behavior / updates spinner text on subsequent progress", (context) => {
  const { intervalCallbacks } = createIntervals(context);
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.progress(1, 10, "package-1");
  graph.progress(2, 10, "package-2");
  assert.strictEqual(intervalCallbacks.length, 1);
});
test("terminal-graph / spinner behavior / stops spinner when stop is called", (context) => {
  const { intervalIds } = createIntervals(context);
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.progress(1, 5, "test");
  const { size: initialSize } = intervalIds;
  graph.stop();
  assert.ok(intervalIds.size < initialSize);
});
test("terminal-graph / spinner behavior / spinner renders frames when interval triggers", (context) => {
  const { intervalCallbacks } = createIntervals(context);
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.progress(1, 5, "testing");
  assert.strictEqual(intervalCallbacks.length, 1);
  let writeCallCount = 0;
  output.write = (text: string) => {
    writeCallCount++;
    output.lines[output.lines.length] = text;
  };
  intervalCallbacks[0]();
  assert.ok(writeCallCount > 0);
});
test("terminal-graph / tree rendering / handles nested phase with items", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.startPhase("scan", "Scanning packages");
  graph.item("Package 1");
  graph.item("Package 2");
  graph.item("Package 3", true);
  graph.endPhase("Scan complete");
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Scanning packages"));
  assertMatches(joined, stringContaining("Package 1"));
  assertMatches(joined, stringContaining("Package 2"));
  assertMatches(joined, stringContaining("Package 3"));
  assertMatches(joined, stringContaining("Scan complete"));
  assertMatches(joined, stringContaining("│"));
  assertMatches(joined, stringContaining("├"));
  assertMatches(joined, stringContaining("└"));
});
test("terminal-graph / tree rendering / handles multiple phases", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.startPhase("phase1", "Phase 1");
  graph.item("Item 1", true);
  graph.endPhase();
  graph.startPhase("phase2", "Phase 2");
  graph.item("Item 2", true);
  graph.endPhase();
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Phase 1"));
  assertMatches(joined, stringContaining("Item 1"));
  assertMatches(joined, stringContaining("Phase 2"));
  assertMatches(joined, stringContaining("Item 2"));
});
test("terminal-graph / no output option / uses default output when not provided", () => {
  const graph = createTerminalGraph();
  assert.notStrictEqual(graph, undefined);
});
test("terminal-graph / empty summary / handles empty overrides and no changes", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.summary({});
  const joined = output.lines.join("\n");
  assertMatches(joined, notStringContaining("Overrides"));
  assertMatches(joined, notStringContaining("Changes"));
});
test("terminal-graph / empty summary / handles empty changes array", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.summary({ lodash: "4.17.21" }, []);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Overrides"));
  assertMatches(joined, notStringContaining("Changes"));
});
test("terminal-graph / executiveSummary with undefined values / handles undefined metrics gracefully", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.executiveSummary({});
  const joined = output.lines.join("\n");
  assertMatches(joined, notStringContaining("fixed"));
  assertMatches(joined, notStringContaining("removed"));
  assertMatches(joined, notStringContaining("protected"));
});
const multipleCves = ["CVE-2021-23337", "CVE-2020-28500"];
const multipleCveVulnerability: VulnerabilityInfo = {
  severity: "high",
  packageName: "lodash",
  currentVersion: "4.17.20",
  title: "Prototype pollution",
  cves: multipleCves,
  fixAvailable: true,
  patchedVersion: "4.17.21",
};
test("terminal-graph / formatCves - multiple CVEs display / renders multiple CVEs joined by comma", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.vulnerability(multipleCveVulnerability);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("CVE: CVE-2021-23337, CVE-2020-28500"));
});
const vulnerabilityWithoutCves: VulnerabilityInfo = {
  severity: "medium",
  packageName: "axios",
  currentVersion: "1.0.0",
  title: "SSRF",
  fixAvailable: false,
};
test("terminal-graph / formatCves - multiple CVEs display / omits CVE line when cves is empty", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.vulnerability(vulnerabilityWithoutCves);
  const joined = output.lines.join("\n");
  assertMatches(joined, notStringContaining("CVE:"));
});
const keptOverrideCves = ["CVE-2021-23337"];
const keptOverride: OverrideInfo = {
  packageName: "lodash",
  version: "4.17.21",
  reason: "Security fix",
  cves: keptOverrideCves,
  keep: true,
  potentiallyFixedIn: "4.18.0",
};
test("terminal-graph / kept override display / renders keep status and potentiallyFixedIn", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(keptOverride);
  const joined = output.lines.join("\n");
  assertMatches(joined, stringContaining("Kept by user"));
  assertMatches(joined, stringContaining("Potentially fixed in 4.18.0"));
});
const overrideWithoutKeep: OverrideInfo = {
  packageName: "lodash",
  version: "4.17.21",
  reason: "Security fix",
};
test("terminal-graph / kept override display / does not render keep/potentiallyFixedIn when not set", () => {
  const output = createMockOutput();
  const graph = createTerminalGraph({ out: output });
  graph.override(overrideWithoutKeep);
  const joined = output.lines.join("\n");
  assertMatches(joined, notStringContaining("Kept by user"));
  assertMatches(joined, notStringContaining("Potentially fixed in"));
});
