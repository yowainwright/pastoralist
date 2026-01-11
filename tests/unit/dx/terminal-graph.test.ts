import { test, expect, describe } from "bun:test";
import { createTerminalGraph } from "../../../src/dx/terminal-graph";
import type { Output } from "../../../src/dx/output";

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
      const graph = createTerminalGraph(output);

      graph.notice("Test message");

      const joined = output.lines.join("\n");
      expect(joined).toContain("-");
      expect(joined).toContain("Test message");
    });

    test("includes bold white text styling", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph(output);

      graph.notice("Styled text");

      const joined = output.lines.join("\n");
      expect(joined).toContain("\x1b[97m");
      expect(joined).toContain("\x1b[1m");
    });

    test("includes red pipe borders", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph(output);

      graph.notice("Bordered text");

      const joined = output.lines.join("\n");
      expect(joined).toContain("\x1b[31m|");
    });

    test("returns graph for chaining", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph(output);

      const result = graph.notice("Chained");
      expect(result).toBe(graph);
    });
  });

  describe("securityFix", () => {
    test("renders security fix with version upgrade", () => {
      const output = createMockOutput();
      const graph = createTerminalGraph(output);

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
      const graph = createTerminalGraph(output);

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
      const graph = createTerminalGraph(output);

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
      const graph = createTerminalGraph(output);

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
      const graph = createTerminalGraph(output);

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
      const graph = createTerminalGraph(output);

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
      const graph = createTerminalGraph(output);

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
});
