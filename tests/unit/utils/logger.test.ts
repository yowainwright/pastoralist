import { anyValue, assertCalledWith, spyOn, stringContaining } from "../setup.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { logger } from "../../../src/utils";

test("logger.debug should log when isLogging is true", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  log.debug("Test message", "caller");
  assert.ok(consoleDebugSpy.mock.callCount() > 0);
  consoleDebugSpy.mockRestore();
});

test("logger.debug should not log when isLogging is false", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: false });
  log.debug("Test message", "caller");
  assert.strictEqual(consoleDebugSpy.mock.callCount(), 0);
  consoleDebugSpy.mockRestore();
});

test("logger.debug should include file name in log output", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  log.debug("Test message", "caller");
  assertCalledWith(consoleDebugSpy, stringContaining("[test.ts]"));
  consoleDebugSpy.mockRestore();
});

test("logger.debug should include caller in log output", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  log.debug("Test message", "myFunction");
  assertCalledWith(consoleDebugSpy, stringContaining("[myFunction]"));
  consoleDebugSpy.mockRestore();
});

test("logger.debug should pass additional arguments to console", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  const obj = { foo: "bar" };
  const arr = [1, 2, 3];
  log.debug("Test message", "caller", obj, arr);
  assertCalledWith(consoleDebugSpy, anyValue(String), obj, arr);
  consoleDebugSpy.mockRestore();
});

test("logger.error should use error method", () => {
  const consoleErrorSpy = spyOn(console, "error");
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  log.error("Error message", "caller");
  assert.ok(consoleErrorSpy.mock.callCount() > 0);
  assert.strictEqual(consoleDebugSpy.mock.callCount(), 0);
  consoleErrorSpy.mockRestore();
  consoleDebugSpy.mockRestore();
});

test("logger should create logger with debug, error, fail, warn, and print methods", () => {
  const log = logger({ file: "test.ts", isLogging: true });
  assert.strictEqual(typeof log.debug, "function");
  assert.strictEqual(typeof log.error, "function");
  assert.strictEqual(typeof log.fail, "function");
  assert.strictEqual(typeof log.warn, "function");
  assert.strictEqual(typeof log.print, "function");
  assert.strictEqual(typeof log.line, "function");
  assert.strictEqual(typeof log.indent, "function");
  assert.strictEqual(typeof log.item, "function");
});

test("logger should default isLogging to false", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts" });
  log.debug("Test message", "caller");
  assert.strictEqual(consoleDebugSpy.mock.callCount(), 0);
  consoleDebugSpy.mockRestore();
});

test("logger.warn should always log regardless of isLogging", () => {
  const consoleWarnSpy = spyOn(console, "warn");
  const log = logger({ file: "test.ts", isLogging: false });
  log.warn("Warning message", "caller");
  assert.ok(consoleWarnSpy.mock.callCount() > 0);
  consoleWarnSpy.mockRestore();
});

test("logger.warn should include file and caller in output", () => {
  const consoleWarnSpy = spyOn(console, "warn");
  const log = logger({ file: "test.ts", isLogging: true });
  log.warn("Warning message", "myCaller");
  assertCalledWith(consoleWarnSpy, stringContaining("[test.ts]"));
  assertCalledWith(consoleWarnSpy, stringContaining("[myCaller]"));
  consoleWarnSpy.mockRestore();
});

test("logger.print should output plain message", () => {
  const consoleLogSpy = spyOn(console, "log");
  const log = logger({ file: "test.ts", isLogging: false });
  log.print("User message");
  assertCalledWith(consoleLogSpy, "User message");
  consoleLogSpy.mockRestore();
});

test("logger.fail should output plain error message", () => {
  const consoleErrorSpy = spyOn(console, "error");
  const log = logger({ file: "test.ts", isLogging: false });
  log.fail("User error");
  assertCalledWith(consoleErrorSpy, "User error");
  consoleErrorSpy.mockRestore();
});

test("logger.line should output message with newline prefix", () => {
  const consoleLogSpy = spyOn(console, "log");
  const log = logger({ file: "test.ts", isLogging: false });
  log.line("User message");
  assertCalledWith(consoleLogSpy, "\nUser message");
  consoleLogSpy.mockRestore();
});

test("logger.indent should output message with 3-space indent", () => {
  const consoleLogSpy = spyOn(console, "log");
  const log = logger({ file: "test.ts", isLogging: false });
  log.indent("User message");
  assertCalledWith(consoleLogSpy, "   User message");
  consoleLogSpy.mockRestore();
});

test("logger.item should output numbered item", () => {
  const consoleLogSpy = spyOn(console, "log");
  const log = logger({ file: "test.ts", isLogging: false });
  log.item(1, "First item");
  assertCalledWith(consoleLogSpy, "   1. First item");
  consoleLogSpy.mockRestore();
});
