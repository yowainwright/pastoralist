import { test, expect } from "bun:test";
import { ICON, PREFIX, STEP, BRAND } from "../../../src/utils/icons";

test("BRAND - should be defined and contain Pastoralist", () => {
  expect(BRAND).toBeDefined();
  expect(BRAND).toContain("Pastoralist");
});

test("ICON - should have all required status icons", () => {
  expect(ICON.success).toBeDefined();
  expect(ICON.error).toBeDefined();
  expect(ICON.warning).toBeDefined();
  expect(ICON.info).toBeDefined();
});

test("ICON - should have all required action icons", () => {
  expect(ICON.arrow).toBeDefined();
  expect(ICON.bullet).toBeDefined();
  expect(ICON.check).toBeDefined();
});

test("ICON - should have all required section icons", () => {
  expect(ICON.step).toBeDefined();
  expect(ICON.section).toBeDefined();
});

test("ICON - should have all required interactive icons", () => {
  expect(ICON.search).toBeDefined();
  expect(ICON.edit).toBeDefined();
  expect(ICON.folder).toBeDefined();
  expect(ICON.skip).toBeDefined();
  expect(ICON.help).toBeDefined();
});

test("ICON.success - should contain green ANSI code", () => {
  expect(ICON.success).toContain("\x1b[32m");
  expect(ICON.success).toContain("\x1b[0m");
});

test("ICON.error - should contain red ANSI code", () => {
  expect(ICON.error).toContain("\x1b[31m");
  expect(ICON.error).toContain("\x1b[0m");
});

test("ICON.warning - should contain yellow ANSI code", () => {
  expect(ICON.warning).toContain("\x1b[33m");
  expect(ICON.warning).toContain("\x1b[0m");
});

test("ICON.info - should contain cyan ANSI code", () => {
  expect(ICON.info).toContain("\x1b[36m");
  expect(ICON.info).toContain("\x1b[0m");
});

test("PREFIX - should map to ICON values", () => {
  expect(PREFIX.success).toBe(ICON.success);
  expect(PREFIX.error).toBe(ICON.error);
  expect(PREFIX.warning).toBe(ICON.warning);
  expect(PREFIX.info).toBe(ICON.info);
  expect(PREFIX.step).toBe(ICON.step);
  expect(PREFIX.save).toBe(ICON.arrow);
  expect(PREFIX.next).toBe(ICON.bullet);
});

test("STEP - should contain step icon and step numbers", () => {
  expect(STEP.config).toContain(ICON.step);
  expect(STEP.config).toContain("Step 1");
  expect(STEP.config).toContain("Configuration Location");

  expect(STEP.workspace).toContain(ICON.step);
  expect(STEP.workspace).toContain("Step 2");
  expect(STEP.workspace).toContain("Workspace Configuration");

  expect(STEP.security).toContain(ICON.step);
  expect(STEP.security).toContain("Step 3");
  expect(STEP.security).toContain("Security Configuration");
});

test("ICON - symbols should be single characters (excluding ANSI codes)", () => {
  const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");

  expect(stripAnsi(ICON.success)).toHaveLength(1);
  expect(stripAnsi(ICON.error)).toHaveLength(1);
  expect(stripAnsi(ICON.warning)).toHaveLength(1);
  expect(stripAnsi(ICON.info)).toHaveLength(1);
  expect(stripAnsi(ICON.arrow)).toHaveLength(1);
  expect(stripAnsi(ICON.bullet)).toHaveLength(1);
  expect(stripAnsi(ICON.check)).toHaveLength(1);
  expect(stripAnsi(ICON.step)).toHaveLength(1);
  expect(stripAnsi(ICON.section)).toHaveLength(1);
  expect(stripAnsi(ICON.search)).toHaveLength(1);
  expect(stripAnsi(ICON.edit)).toHaveLength(1);
  expect(stripAnsi(ICON.folder)).toHaveLength(1);
  expect(stripAnsi(ICON.skip)).toHaveLength(1);
  expect(stripAnsi(ICON.help)).toHaveLength(1);
});

test("ICON - all icons should be distinct Unicode characters", () => {
  const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");
  const symbols = [
    stripAnsi(ICON.success),
    stripAnsi(ICON.error),
    stripAnsi(ICON.warning),
    stripAnsi(ICON.info),
    stripAnsi(ICON.arrow),
    stripAnsi(ICON.bullet),
    stripAnsi(ICON.step),
    stripAnsi(ICON.section),
    stripAnsi(ICON.skip),
  ];

  const uniqueSymbols = new Set(symbols);
  expect(uniqueSymbols.size).toBe(symbols.length);
});
