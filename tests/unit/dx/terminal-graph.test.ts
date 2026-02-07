import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { createTerminalGraph } from "../../../src/dx/terminal-graph";
import type { Output } from "../../../src/dx/output";
import type {
  OverrideInfo,
  VulnerabilityInfo,
  SecurityFixInfo,
  RemovedOverrideInfo,
} from "../../../src/dx/terminal-graph/types";

const createMockOutput = (): Output & { lines: string[] } => {
  const lines: string[] = [];
  return {
    lines,
    write: (text: string) => lines.push(text),
    writeLine: (text: string) => lines.push(text),
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
      expect(joined).toContain("-");
      expect(joined).toContain("Test message");
    });

    test("includes bold white text styling", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.notice("Styled text");

      const joined = output.lines.join("\n");
      expect(joined).toContain("\x1b[97m");
      expect(joined).toContain("\x1b[1m");
    });

    test("includes red pipe borders", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.notice("Bordered text");

      const joined = output.lines.join("\n");
      expect(joined).toContain("\x1b[31m|");
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.notice("Chained");
      expect(result).toBe(graph);
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
      expect(joined).toContain("lodash@4.17.21");
      expect(joined).toContain("4.17.20 → 4.17.21");
    });

    test("renders CVE when provided", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.securityFix({
        packageName: "lodash",
        fromVersion: "4.17.20",
        toVersion: "4.17.21",
        cve: "CVE-2021-23337",
      });

      const joined = output.lines.join("\n");
      expect(joined).toContain("Blocks CVE-2021-23337");
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
      expect(joined).toContain("Security fix: Command Injection");
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
      expect(joined).toContain("lodash@4.17.21");
      expect(joined).toContain("Override no longer needed");
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
      expect(joined).toContain("[HIGH] lodash@4.17.20");
      expect(joined).toContain("Command Injection");
      expect(joined).toContain("Fix: upgrade to 4.17.21");
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
      expect(joined).toContain("No fix available");
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
        cve: "CVE-2024-1234",
      });

      const joined = output.lines.join("\n");
      expect(joined).toContain("CVE: CVE-2024-1234");
    });
  });

  describe("item", () => {
    test("renders item with success icon", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.item("Test item");

      const joined = output.lines.join("\n");
      expect(joined).toContain("Test item");
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.item("Chained item");
      expect(result).toBe(graph);
    });
  });

  describe("summary", () => {
    test("renders overrides summary", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({ lodash: "4.17.21", express: "4.18.2" });

      const joined = output.lines.join("\n");
      expect(joined).toContain("Overrides");
      expect(joined).toContain("lodash: 4.17.21");
      expect(joined).toContain("express: 4.18.2");
    });

    test("renders changes when provided", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({}, ["Added lodash override", "Removed minimist"]);

      const joined = output.lines.join("\n");
      expect(joined).toContain("Changes");
      expect(joined).toContain("Added lodash override");
      expect(joined).toContain("Removed minimist");
    });

    test("renders both overrides and changes", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({ lodash: "4.17.21" }, ["Updated lodash"]);

      const joined = output.lines.join("\n");
      expect(joined).toContain("Overrides");
      expect(joined).toContain("lodash: 4.17.21");
      expect(joined).toContain("Changes");
      expect(joined).toContain("Updated lodash");
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.summary({});
      expect(result).toBe(graph);
    });
  });

  describe("stop", () => {
    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.stop();
      expect(result).toBe(graph);
    });
  });

  describe("progress", () => {
    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.progress(1, 5, "lodash");
      expect(result).toBe(graph);
    });
  });

  describe("executiveSummary", () => {
    test("renders vulnerabilities fixed with plural form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ vulnerabilitiesFixed: 3 });

      const joined = output.lines.join("\n");
      expect(joined).toContain("3 vulnerabilities fixed");
    });

    test("renders vulnerabilities fixed with singular form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ vulnerabilitiesFixed: 1 });

      const joined = output.lines.join("\n");
      expect(joined).toContain("1 vulnerability fixed");
    });

    test("renders stale overrides removed with plural form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ staleOverridesRemoved: 2 });

      const joined = output.lines.join("\n");
      expect(joined).toContain("2 stale overrides removed");
    });

    test("renders stale overrides removed with singular form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ staleOverridesRemoved: 1 });

      const joined = output.lines.join("\n");
      expect(joined).toContain("1 stale override removed");
    });

    test("renders packages protected with plural form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ packagesProtected: 5 });

      const joined = output.lines.join("\n");
      expect(joined).toContain("5 packages protected");
    });

    test("renders packages protected with singular form", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({ packagesProtected: 1 });

      const joined = output.lines.join("\n");
      expect(joined).toContain("1 package protected");
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
      expect(joined).toContain("2 vulnerabilities fixed");
      expect(joined).toContain("1 stale override removed");
      expect(joined).toContain("10 packages protected");
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
      expect(joined).not.toContain("fixed");
      expect(joined).not.toContain("removed");
      expect(joined).not.toContain("protected");
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.executiveSummary({ vulnerabilitiesFixed: 1 });
      expect(result).toBe(graph);
    });
  });

  describe("quiet mode", () => {
    test("suppresses all output when quiet option is true", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ quiet: true, out: output });

      graph.notice("Test message");
      graph.executiveSummary({ vulnerabilitiesFixed: 5 });

      expect(output.lines.length).toBe(0);
    });

    test("produces output when quiet option is false", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ quiet: false, out: output });

      graph.notice("Test message");

      expect(output.lines.length).toBeGreaterThan(0);
    });
  });

  describe("banner", () => {
    test("renders banner with farmer emoji and app name", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.banner();

      const joined = output.lines.join("\n");
      expect(joined).toContain("Pastoralist");
      expect(joined).toContain("\x1b[32m"); // green color
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.banner();
      expect(result).toBe(graph);
    });
  });

  describe("startPhase and endPhase", () => {
    test("renders phase start and end", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.startPhase("analysis", "Analyzing dependencies");
      graph.endPhase("Analysis complete");

      const joined = output.lines.join("\n");
      expect(joined).toContain("Analyzing dependencies");
      expect(joined).toContain("Analysis complete");
    });

    test("endPhase without text", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.startPhase("scan", "Scanning");
      graph.endPhase();

      const joined = output.lines.join("\n");
      expect(joined).toContain("Scanning");
      expect(joined).not.toContain("undefined");
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result1 = graph.startPhase("test", "Testing");
      const result2 = graph.endPhase();
      expect(result1).toBe(graph);
      expect(result2).toBe(graph);
    });
  });

  describe("complete", () => {
    test("renders completion message", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.complete("All done!");

      const joined = output.lines.join("");
      // The text has gradient coloring, so we need to check for the individual characters
      expect(joined).toContain("A");
      expect(joined).toContain("l");
      expect(joined).toContain("d");
      expect(joined).toContain("o");
      expect(joined).toContain("n");
      expect(joined).toContain("e");
      expect(joined).toContain("!");
    });

    test("renders with suffix", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.complete("Complete", " (1.2s)");

      const joined = output.lines.join("");
      // Check for the gradient colored text and suffix
      expect(joined).toContain("C");
      expect(joined).toContain("o");
      expect(joined).toContain("m");
      expect(joined).toContain("p");
      expect(joined).toContain("l");
      expect(joined).toContain("e");
      expect(joined).toContain("t");
      expect(joined).toContain("(1.2s)");
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const result = graph.complete("Done");
      expect(result).toBe(graph);
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
      expect(joined).toContain("lodash@4.17.21");
      expect(joined).toContain("Security fix");
    });

    test("renders override with CVE", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      const info: OverrideInfo = {
        packageName: "minimist",
        version: "1.2.6",
        reason: "Fix vulnerability",
        cve: "CVE-2021-44906",
      };

      graph.override(info);

      const joined = output.lines.join("\n");
      expect(joined).toContain("CVE-2021-44906");
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
      expect(joined).toContain(
        "Patches: fix-memory-leak.patch, security.patch",
      );
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
      expect(joined).toContain("Used by: 2 packages");
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
      expect(joined).toContain("Used by: 1 package");
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
      expect(joined).toContain("test@1.0.0");
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
      expect(joined).toContain("└──"); // last branch character
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
      expect(joined).not.toContain("Patches:");
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
      expect(joined).not.toContain("Used by:");
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
      expect(result).toBe(graph);
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
      expect(joined).toContain("https://github.com/advisories/GHSA-xxxxx");
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
      expect(joined).toContain("└──");
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
      expect(joined).toContain("test@1.0.1");
      expect(joined).toContain("1.0.0 → 1.0.1");
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
      expect(joined).toContain("└──");
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
      expect(result).toBe(graph);
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
      expect(joined).toContain("└──");
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
      expect(result).toBe(graph);
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

      global.setInterval = ((fn: () => void, ms: number) => {
        intervalCallbacks.push(fn);
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

      expect(intervalCallbacks.length).toBe(1);
      expect(intervalIds.size).toBe(1);
    });

    test("updates spinner text on subsequent progress", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.progress(1, 10, "package-1");
      graph.progress(2, 10, "package-2");

      // Only one interval should be created
      expect(intervalCallbacks.length).toBe(1);
    });

    test("stops spinner when stop is called", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.progress(1, 5, "test");
      const initialSize = intervalIds.size;
      graph.stop();

      expect(intervalIds.size).toBeLessThan(initialSize);
    });

    test("spinner renders frames when interval triggers", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.progress(1, 5, "testing");

      expect(intervalCallbacks.length).toBe(1);
      const callback = intervalCallbacks[0];

      let writeCallCount = 0;
      output.write = (text: string) => {
        writeCallCount++;
        output.lines.push(text);
      };

      callback();

      expect(writeCallCount).toBeGreaterThan(0);
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
      expect(joined).toContain("Scanning packages");
      expect(joined).toContain("Package 1");
      expect(joined).toContain("Package 2");
      expect(joined).toContain("Package 3");
      expect(joined).toContain("Scan complete");
      expect(joined).toContain("│"); // vertical pipe
      expect(joined).toContain("├"); // branch
      expect(joined).toContain("└"); // last branch
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
      expect(joined).toContain("Phase 1");
      expect(joined).toContain("Item 1");
      expect(joined).toContain("Phase 2");
      expect(joined).toContain("Item 2");
    });
  });

  describe("no output option", () => {
    test("uses default output when not provided", () => {
      const graph = createTerminalGraph();
      expect(graph).toBeDefined();
    });
  });

  describe("empty summary", () => {
    test("handles empty overrides and no changes", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({});

      const joined = output.lines.join("\n");
      expect(joined).not.toContain("Overrides");
      expect(joined).not.toContain("Changes");
    });

    test("handles empty changes array", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.summary({ lodash: "4.17.21" }, []);

      const joined = output.lines.join("\n");
      expect(joined).toContain("Overrides");
      expect(joined).not.toContain("Changes");
    });
  });

  describe("executiveSummary with undefined values", () => {
    test("handles undefined metrics gracefully", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph({ out: output });

      graph.executiveSummary({});

      const joined = output.lines.join("\n");
      expect(joined).not.toContain("fixed");
      expect(joined).not.toContain("removed");
      expect(joined).not.toContain("protected");
    });
  });
});
