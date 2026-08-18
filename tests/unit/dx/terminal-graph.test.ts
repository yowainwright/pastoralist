import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createTerminalGraph } from "../../../src/dx/terminal-graph";
import type { Output } from "../../../src/dx/output";
import type {
  OverrideInfo,
  VulnerabilityInfo,
  SecurityFixInfo,
  RemovedOverrideInfo,
} from "../../../src/dx/tree/types";

const createMockOutput = (): Output & { lines: string[] } => {
  const lines: string[] = [];
  return {
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
};

describe("terminal-graph", () => {
  describe("notice", () => {
    test("renders boxed message with borders and content", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.notice("Test message");

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("-"));
      assert.ok(joined.includes("Test message"));
    });

    test("includes bold white text styling", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.notice("Styled text");

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("\x1b[97m"));
      assert.ok(joined.includes("\x1b[1m"));
    });

    test("includes red pipe borders", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.notice("Bordered text");

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("\x1b[31m|"));
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.notice("Chained");
      assert.strictEqual(result, graph);
    });
  });

  describe("securityFix", () => {
    test("renders security fix with version upgrade", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.securityFix({
        packageName: "lodash",
        fromVersion: "4.17.20",
        toVersion: "4.17.21",
      });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("lodash@4.17.21"));
      assert.ok(joined.includes("4.17.20 → 4.17.21"));
    });

    test("renders CVE when provided", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.securityFix({
        packageName: "lodash",
        fromVersion: "4.17.20",
        toVersion: "4.17.21",
        cves: ["CVE-2021-23337"],
      });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Blocks CVE-2021-23337"));
    });

    test("renders reason when provided", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.securityFix({
        packageName: "lodash",
        fromVersion: "4.17.20",
        toVersion: "4.17.21",
        reason: "Security fix: Command Injection",
      });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Security fix: Command Injection"));
    });
  });

  describe("override reason", () => {
    test("renders a project reason object", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.override({
        packageName: "lodash",
        version: "4.17.21",
        reason: {
          type: "project",
          summary: "Pinned for compatibility",
          pin: "4.17.21",
          patch: "patches/lodash.patch",
          constraints: ["Node 20"],
        },
      });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Pinned for compatibility"));
      assert.ok(joined.includes("Pin: 4.17.21"));
      assert.ok(joined.includes("Patch: patches/lodash.patch"));
      assert.ok(joined.includes("Constraints: Node 20"));
    });

    test("renders best-case search and impact metadata", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.override({
        packageName: "lodash",
        version: "4.17.21",
        reason: {
          type: "best-case",
          summary: "Selected as part of the lowest-risk dependency portfolio",
          decisionId: "best-case-abc123",
          policyHash: "def456",
          search: { evaluatedStates: 12, provenOptimal: false },
          impact: {
            fixedVulnerabilities: 3,
            introducedVulnerabilities: 1,
            remainingVulnerabilities: 2,
          },
        },
      });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("best-case-abc123 (bounded, 12 states)"));
      assert.ok(joined.includes("3 fixed, 1 introduced, 2 remaining"));
    });
  });

  describe("removedOverride", () => {
    test("renders removed override with package info", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.removedOverride({
        packageName: "lodash",
        version: "4.17.21",
        reason: "Override no longer needed",
      });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("lodash@4.17.21"));
      assert.ok(joined.includes("Override no longer needed"));
    });
  });

  describe("vulnerability", () => {
    test("renders vulnerability with fix available", () => {
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
      assert.ok(joined.includes("[HIGH] lodash@4.17.20"));
      assert.ok(joined.includes("Command Injection"));
      assert.ok(joined.includes("Fix: upgrade to 4.17.21"));
    });

    test("renders vulnerability without fix available", () => {
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
      assert.ok(joined.includes("No fix available"));
    });

    test("renders CVE when provided", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.vulnerability({
        severity: "medium",
        packageName: "test-pkg",
        currentVersion: "1.0.0",
        title: "Test vulnerability",
        fixAvailable: false,
        cves: ["CVE-2024-1234"],
      });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("CVE: CVE-2024-1234"));
    });
  });

  describe("item", () => {
    test("renders item with success icon", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.item("Test item");

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Test item"));
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.item("Chained item");
      assert.strictEqual(result, graph);
    });
  });

  describe("summary", () => {
    test("renders overrides summary", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({ lodash: "4.17.21", express: "4.18.2" });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Overrides"));
      assert.ok(joined.includes("lodash: 4.17.21"));
      assert.ok(joined.includes("express: 4.18.2"));
    });

    test("renders changes when provided", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({}, ["Added lodash override", "Removed minimist"]);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Changes"));
      assert.ok(joined.includes("Added lodash override"));
      assert.ok(joined.includes("Removed minimist"));
    });

    test("renders both overrides and changes", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({ lodash: "4.17.21" }, ["Updated lodash"]);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Overrides"));
      assert.ok(joined.includes("lodash: 4.17.21"));
      assert.ok(joined.includes("Changes"));
      assert.ok(joined.includes("Updated lodash"));
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.summary({});
      assert.strictEqual(result, graph);
    });
  });

  describe("stop", () => {
    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.stop();
      assert.strictEqual(result, graph);
    });
  });

  describe("progress", () => {
    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.progress(1, 5, "lodash");
      assert.strictEqual(result, graph);
      graph.stop();
    });
  });

  describe("executiveSummary", () => {
    test("renders vulnerabilities fixed with plural form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ vulnerabilitiesFixed: 3 });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("3 vulnerabilities fixed"));
    });

    test("renders vulnerabilities fixed with singular form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ vulnerabilitiesFixed: 1 });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("1 vulnerability fixed"));
    });

    test("renders stale overrides removed with plural form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ staleOverridesRemoved: 2 });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("2 stale overrides removed"));
    });

    test("renders stale overrides removed with singular form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ staleOverridesRemoved: 1 });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("1 stale override removed"));
    });

    test("renders packages protected with plural form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ packagesProtected: 5 });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("5 packages protected"));
    });

    test("renders packages protected with singular form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ packagesProtected: 1 });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("1 package protected"));
    });

    test("renders all metrics together", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({
        vulnerabilitiesFixed: 2,
        staleOverridesRemoved: 1,
        packagesProtected: 10,
      });

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("2 vulnerabilities fixed"));
      assert.ok(joined.includes("1 stale override removed"));
      assert.ok(joined.includes("10 packages protected"));
    });

    test("renders nothing for zero values", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({
        vulnerabilitiesFixed: 0,
        staleOverridesRemoved: 0,
        packagesProtected: 0,
      });

      const joined = output.lines.join("\n");
      assert.ok(!joined.includes("fixed"));
      assert.ok(!joined.includes("removed"));
      assert.ok(!joined.includes("protected"));
    });

    test("does not emit blank line for zero values", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({
        vulnerabilitiesFixed: 0,
        staleOverridesRemoved: 0,
        packagesProtected: 0,
      });

      assert.deepStrictEqual(output.lines, []);
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.executiveSummary({ vulnerabilitiesFixed: 1 });
      assert.strictEqual(result, graph);
    });
  });

  describe("quiet mode", () => {
    test("suppresses all output when quiet option is true", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ quiet: true, out: output });

      graph.notice("Test message");
      graph.executiveSummary({ vulnerabilitiesFixed: 5 });

      assert.strictEqual(output.lines.length, 0);
    });

    test("produces output when quiet option is false", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ quiet: false, out: output });

      graph.notice("Test message");

      assert.ok(output.lines.length > 0);
    });
  });

  describe("banner", () => {
    test("renders banner with farmer emoji and app name", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.banner();

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Pastoralist"));
      assert.ok(joined.includes("\x1b[32m"));
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.banner();
      assert.strictEqual(result, graph);
    });
  });

  describe("startPhase and endPhase", () => {
    test("renders phase start and end", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.startPhase("analysis", "Analyzing dependencies");
      graph.endPhase("Analysis complete");

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Analyzing dependencies"));
      assert.ok(joined.includes("Analysis complete"));
    });

    test("endPhase without text", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.startPhase("scan", "Scanning");
      graph.endPhase();

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Scanning"));
      assert.ok(!joined.includes("undefined"));
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result1 = graph.startPhase("test", "Testing");
      const result2 = graph.endPhase();
      assert.strictEqual(result1, graph);
      assert.strictEqual(result2, graph);
    });
  });

  describe("complete", () => {
    test("renders completion message", async () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.complete("All done!");
      await graph.waitForCompletion();

      const joined = output.lines.join("");
      assert.ok(joined.includes("A"));
      assert.ok(joined.includes("l"));
      assert.ok(joined.includes("d"));
      assert.ok(joined.includes("o"));
      assert.ok(joined.includes("n"));
      assert.ok(joined.includes("e"));
      assert.ok(joined.includes("!"));
    });

    test("renders with suffix", async () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.complete("Complete", " (1.2s)");
      await graph.waitForCompletion();

      const joined = output.lines.join("");
      assert.ok(joined.includes("C"));
      assert.ok(joined.includes("o"));
      assert.ok(joined.includes("m"));
      assert.ok(joined.includes("p"));
      assert.ok(joined.includes("l"));
      assert.ok(joined.includes("e"));
      assert.ok(joined.includes("t"));
      assert.ok(joined.includes("(1.2s)"));
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.complete("Done");
      assert.strictEqual(result, graph);
    });
  });

  describe("override", () => {
    test("renders override with basic info", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "lodash",
        version: "4.17.21",
        reason: "Security fix",
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("lodash@4.17.21"));
      assert.ok(joined.includes("Security fix"));
    });

    test("renders override with CVE", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "minimist",
        version: "1.2.6",
        reason: "Fix vulnerability",
        cves: ["CVE-2021-44906"],
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("CVE-2021-44906"));
    });

    test("renders override with patches", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "test-pkg",
        version: "1.0.0",
        reason: "Apply patches",
        patches: ["fix-memory-leak.patch", "security.patch"],
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Patches: fix-memory-leak.patch, security.patch"));
    });

    test("renders override with dependents", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "lodash",
        version: "4.17.21",
        reason: "Update",
        dependents: {
          express: "4.18.2",
          react: "18.2.0",
        },
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Used by: 2 packages"));
    });

    test("renders override with single dependent", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "lodash",
        version: "4.17.21",
        reason: "Update",
        dependents: {
          express: "4.18.2",
        },
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Used by: 1 package"));
    });

    test("renders override marked as security fix", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "test",
        version: "1.0.0",
        reason: "Security",
        isSecurityFix: true,
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("test@1.0.0"));
    });

    test("renders override as last item", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "test",
        version: "1.0.0",
        reason: "Test",
      };

      graph.override(info, true);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("└──"));
    });

    test("renders override with empty patches array", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "test",
        version: "1.0.0",
        reason: "Test",
        patches: [],
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(!joined.includes("Patches:"));
    });

    test("renders override with empty dependents", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "test",
        version: "1.0.0",
        reason: "Test",
        dependents: {},
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(!joined.includes("Used by:"));
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "test",
        version: "1.0.0",
        reason: "Test",
      };

      const result = graph.override(info);
      assert.strictEqual(result, graph);
    });
  });

  describe("vulnerability with URL", () => {
    test("renders vulnerability with URL", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: VulnerabilityInfo = {
        severity: "high",
        packageName: "lodash",
        currentVersion: "4.17.20",
        title: "Prototype Pollution",
        fixAvailable: true,
        patchedVersion: "4.17.21",
        url: "https://github.com/advisories/GHSA-xxxxx",
      };

      graph.vulnerability(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("https://github.com/advisories/GHSA-xxxxx"));
    });

    test("renders as last vulnerability", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: VulnerabilityInfo = {
        severity: "low",
        packageName: "test",
        currentVersion: "1.0.0",
        title: "Test",
        fixAvailable: false,
      };

      graph.vulnerability(info, true);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("└──"));
    });
  });

  describe("securityFix edge cases", () => {
    test("renders security fix without details", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: SecurityFixInfo = {
        packageName: "test",
        fromVersion: "1.0.0",
        toVersion: "1.0.1",
      };

      graph.securityFix(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("test@1.0.1"));
      assert.ok(joined.includes("1.0.0 → 1.0.1"));
    });

    test("renders as last security fix", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: SecurityFixInfo = {
        packageName: "test",
        fromVersion: "1.0.0",
        toVersion: "1.0.1",
      };

      graph.securityFix(info, true);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("└──"));
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: SecurityFixInfo = {
        packageName: "test",
        fromVersion: "1.0.0",
        toVersion: "1.0.1",
      };

      const result = graph.securityFix(info);
      assert.strictEqual(result, graph);
    });
  });

  describe("removedOverride edge cases", () => {
    test("renders as last removed override", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: RemovedOverrideInfo = {
        packageName: "test",
        version: "1.0.0",
        reason: "No longer needed",
      };

      graph.removedOverride(info, true);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("└──"));
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: RemovedOverrideInfo = {
        packageName: "test",
        version: "1.0.0",
        reason: "Test",
      };

      const result = graph.removedOverride(info);
      assert.strictEqual(result, graph);
    });
  });

  describe("spinner behavior", () => {
    let originalSetInterval: typeof setInterval;
    let originalClearInterval: typeof clearInterval;
    let intervalCallbacks: Array<() => void> = [];
    let intervalIds: Set<number> = new Set();

    beforeEach(() => {
      intervalCallbacks = [];
      intervalIds = new Set();
      originalSetInterval = global.setInterval;
      originalClearInterval = global.clearInterval;

      global.setInterval = ((fn: () => void, _ms: number) => {
        intervalCallbacks[intervalCallbacks.length] = fn;
        const id = Math.random();
        intervalIds.add(id);
        return id as any;
      }) as any;

      global.clearInterval = ((id: number) => {
        intervalIds.delete(id);
      }) as any;
    });

    afterEach(() => {
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    });

    test("starts spinner on first progress item", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.progress(1, 10, "package-1");

      assert.strictEqual(intervalCallbacks.length, 1);
      assert.strictEqual(intervalIds.size, 1);
    });

    test("updates spinner text on subsequent progress", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.progress(1, 10, "package-1");
      graph.progress(2, 10, "package-2");

      assert.strictEqual(intervalCallbacks.length, 1);
    });

    test("stops spinner when stop is called", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.progress(1, 5, "test");
      const initialSize = intervalIds.size;
      graph.stop();

      assert.ok(intervalIds.size < initialSize);
    });

    test("spinner renders frames when interval triggers", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.progress(1, 5, "testing");

      assert.strictEqual(intervalCallbacks.length, 1);
      const callback = intervalCallbacks[0];

      let writeCallCount = 0;
      output.write = (text: string) => {
        writeCallCount++;
        output.lines[output.lines.length] = text;
      };

      callback();

      assert.ok(writeCallCount > 0);
    });
  });

  describe("tree rendering", () => {
    test("handles nested phase with items", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.startPhase("scan", "Scanning packages");
      graph.item("Package 1");
      graph.item("Package 2");
      graph.item("Package 3", true);
      graph.endPhase("Scan complete");

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Scanning packages"));
      assert.ok(joined.includes("Package 1"));
      assert.ok(joined.includes("Package 2"));
      assert.ok(joined.includes("Package 3"));
      assert.ok(joined.includes("Scan complete"));
      assert.ok(joined.includes("│"));
      assert.ok(joined.includes("├"));
      assert.ok(joined.includes("└"));
    });

    test("handles multiple phases", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.startPhase("phase1", "Phase 1");
      graph.item("Item 1", true);
      graph.endPhase();

      graph.startPhase("phase2", "Phase 2");
      graph.item("Item 2", true);
      graph.endPhase();

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Phase 1"));
      assert.ok(joined.includes("Item 1"));
      assert.ok(joined.includes("Phase 2"));
      assert.ok(joined.includes("Item 2"));
    });
  });

  describe("no output option", () => {
    test("uses default output when not provided", () => {
      const graph = createTerminalGraph();
      assert.notStrictEqual(graph, undefined);
    });
  });

  describe("empty summary", () => {
    test("handles empty overrides and no changes", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({});

      const joined = output.lines.join("\n");
      assert.ok(!joined.includes("Overrides"));
      assert.ok(!joined.includes("Changes"));
    });

    test("handles empty changes array", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({ lodash: "4.17.21" }, []);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Overrides"));
      assert.ok(!joined.includes("Changes"));
    });
  });

  describe("executiveSummary with undefined values", () => {
    test("handles undefined metrics gracefully", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({});

      const joined = output.lines.join("\n");
      assert.ok(!joined.includes("fixed"));
      assert.ok(!joined.includes("removed"));
      assert.ok(!joined.includes("protected"));
    });
  });

  describe("formatCves - multiple CVEs display", () => {
    test("renders multiple CVEs joined by comma", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: VulnerabilityInfo = {
        severity: "high",
        packageName: "lodash",
        currentVersion: "4.17.20",
        title: "Prototype pollution",
        cves: ["CVE-2021-23337", "CVE-2020-28500"],
        fixAvailable: true,
        patchedVersion: "4.17.21",
      };

      graph.vulnerability(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("CVE: CVE-2021-23337, CVE-2020-28500"));
    });

    test("omits CVE line when cves is empty", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: VulnerabilityInfo = {
        severity: "medium",
        packageName: "axios",
        currentVersion: "1.0.0",
        title: "SSRF",
        fixAvailable: false,
      };

      graph.vulnerability(info);

      const joined = output.lines.join("\n");
      assert.ok(!joined.includes("CVE:"));
    });
  });

  describe("kept override display", () => {
    test("renders keep status and potentiallyFixedIn", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "lodash",
        version: "4.17.21",
        reason: "Security fix",
        cves: ["CVE-2021-23337"],
        keep: true,
        potentiallyFixedIn: "4.18.0",
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(joined.includes("Kept by user"));
      assert.ok(joined.includes("Potentially fixed in 4.18.0"));
    });

    test("does not render keep/potentiallyFixedIn when not set", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "lodash",
        version: "4.17.21",
        reason: "Security fix",
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      assert.ok(!joined.includes("Kept by user"));
      assert.ok(!joined.includes("Potentially fixed in"));
    });
  });
});
