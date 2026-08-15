import { test } from "node:test";
import assert from "node:assert/strict";
import { ICON, PREFIX, STEP, BRAND } from "../../../src/constants";

test("BRAND - should be defined and contain Pastoralist", () => {
  assert.notStrictEqual(BRAND, undefined);
  assert.ok(BRAND.includes("Pastoralist"));
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
  assert.ok(ICON.success.includes("\x1b[32m"));
  assert.ok(ICON.success.includes("\x1b[0m"));
});

test("ICON.error - should contain red ANSI code", () => {
  assert.ok(ICON.error.includes("\x1b[31m"));
  assert.ok(ICON.error.includes("\x1b[0m"));
});

test("ICON.warning - should contain yellow ANSI code", () => {
  assert.ok(ICON.warning.includes("\x1b[33m"));
  assert.ok(ICON.warning.includes("\x1b[0m"));
});

test("ICON.info - should contain cyan ANSI code", () => {
  assert.ok(ICON.info.includes("\x1b[36m"));
  assert.ok(ICON.info.includes("\x1b[0m"));
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
  assert.ok(STEP.config.includes(ICON.step));
  assert.ok(STEP.config.includes("Step 1"));
  assert.ok(STEP.config.includes("Configuration Location"));

  assert.ok(STEP.workspace.includes(ICON.step));
  assert.ok(STEP.workspace.includes("Step 2"));
  assert.ok(STEP.workspace.includes("Workspace Configuration"));

  assert.ok(STEP.security.includes(ICON.step));
  assert.ok(STEP.security.includes("Step 3"));
  assert.ok(STEP.security.includes("Security Configuration"));
});

test("ICON - symbols should be single characters (excluding ANSI codes)", () => {
  const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");

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
  assert.strictEqual(uniqueSymbols.size, symbols.length);
});
