import { assertMatches, stringContaining } from "./setup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { ICON, PREFIX, STEP, BRAND } from "../../src/constants";
import { ANSI_PATTERN } from "../../src/dx/constants";
const stripAnsi = (str: string) => str.replace(ANSI_PATTERN, "");
test("BRAND - should be defined and contain Pastoralist", () => {
  assert.notStrictEqual(BRAND, undefined);
  assertMatches(BRAND, stringContaining("Pastoralist"));
});
test("ICON - should have all required status icons", () => {
  assert.notStrictEqual(ICON.success, undefined);
  assert.notStrictEqual(ICON.error, undefined);
  assert.notStrictEqual(ICON.warning, undefined);
  assert.notStrictEqual(ICON.info, undefined);
});
test("ICON - should have all required action icons", () => {
  assert.notStrictEqual(ICON.arrow, undefined);
  assert.notStrictEqual(ICON.bullet, undefined);
  assert.notStrictEqual(ICON.check, undefined);
});
test("ICON - should have all required section icons", () => {
  assert.notStrictEqual(ICON.step, undefined);
  assert.notStrictEqual(ICON.section, undefined);
});
test("ICON - should have all required interactive icons", () => {
  assert.notStrictEqual(ICON.search, undefined);
  assert.notStrictEqual(ICON.edit, undefined);
  assert.notStrictEqual(ICON.folder, undefined);
  assert.notStrictEqual(ICON.skip, undefined);
  assert.notStrictEqual(ICON.help, undefined);
});
test("ICON.success - should contain green ANSI code", () => {
  assertMatches(ICON.success, stringContaining("\x1b[32m"));
  assertMatches(ICON.success, stringContaining("\x1b[0m"));
});
test("ICON.error - should contain red ANSI code", () => {
  assertMatches(ICON.error, stringContaining("\x1b[31m"));
  assertMatches(ICON.error, stringContaining("\x1b[0m"));
});
test("ICON.warning - should contain yellow ANSI code", () => {
  assertMatches(ICON.warning, stringContaining("\x1b[33m"));
  assertMatches(ICON.warning, stringContaining("\x1b[0m"));
});
test("ICON.info - should contain cyan ANSI code", () => {
  assertMatches(ICON.info, stringContaining("\x1b[36m"));
  assertMatches(ICON.info, stringContaining("\x1b[0m"));
});
test("PREFIX - should map to ICON values", () => {
  assert.strictEqual(PREFIX.success, ICON.success);
  assert.strictEqual(PREFIX.error, ICON.error);
  assert.strictEqual(PREFIX.warning, ICON.warning);
  assert.strictEqual(PREFIX.info, ICON.info);
  assert.strictEqual(PREFIX.step, ICON.step);
  assert.strictEqual(PREFIX.save, ICON.arrow);
  assert.strictEqual(PREFIX.next, ICON.bullet);
});
test("STEP - should contain step icon and step numbers", () => {
  assertMatches(STEP.config, stringContaining(ICON.step));
  assertMatches(STEP.config, stringContaining("Step 1"));
  assertMatches(STEP.config, stringContaining("Configuration Location"));
  assertMatches(STEP.workspace, stringContaining(ICON.step));
  assertMatches(STEP.workspace, stringContaining("Step 2"));
  assertMatches(STEP.workspace, stringContaining("Workspace Configuration"));
  assertMatches(STEP.security, stringContaining(ICON.step));
  assertMatches(STEP.security, stringContaining("Step 3"));
  assertMatches(STEP.security, stringContaining("Security Configuration"));
});
test("ICON - symbols should be single characters (excluding ANSI codes)", () => {
  assert.strictEqual(stripAnsi(ICON.success).length, 1);
  assert.strictEqual(stripAnsi(ICON.error).length, 1);
  assert.strictEqual(stripAnsi(ICON.warning).length, 1);
  assert.strictEqual(stripAnsi(ICON.info).length, 1);
  assert.strictEqual(stripAnsi(ICON.arrow).length, 1);
  assert.strictEqual(stripAnsi(ICON.bullet).length, 1);
  assert.strictEqual(stripAnsi(ICON.check).length, 1);
  assert.strictEqual(stripAnsi(ICON.step).length, 1);
  assert.strictEqual(stripAnsi(ICON.section).length, 1);
  assert.strictEqual(stripAnsi(ICON.search).length, 1);
  assert.strictEqual(stripAnsi(ICON.edit).length, 1);
  assert.strictEqual(stripAnsi(ICON.folder).length, 1);
  assert.strictEqual(stripAnsi(ICON.skip).length, 1);
  assert.strictEqual(stripAnsi(ICON.help).length, 1);
});
test("ICON - all icons should be distinct Unicode characters", () => {
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
  assert.strictEqual(uniqueSymbols.size, symbols.length);
});
