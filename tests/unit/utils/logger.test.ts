import { test, expect, spyOn } from "bun:test";
import { logger as testLogger, logMethod } from "../../../src/utils/logger";

test("logMethod should log when isLogging is true", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logMethod("debug", true, "test.ts");
  log("Test message");
  expect(consoleDebugSpy).toHaveBeenCalled();
  consoleDebugSpy.mockRestore();
});

test("logMethod should not log when isLogging is false", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logMethod("debug", false, "test.ts");
  log("Test message");
  expect(consoleDebugSpy).not.toHaveBeenCalled();
  consoleDebugSpy.mockRestore();
});

test("logMethod should include file name in log output", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logMethod("debug", true, "test.ts");
  log("Test message");
  expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining("[test.ts]"));
  consoleDebugSpy.mockRestore();
});

test("logMethod should include caller in log output when provided", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logMethod("debug", true, "test.ts");
  log("Test message", "myFunction");
  expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining("[myFunction]"));
  consoleDebugSpy.mockRestore();
});

test("logMethod should not include caller brackets when not provided", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logMethod("debug", true, "test.ts");
  log("Test message");
  const call = consoleDebugSpy.mock.calls[0][0];
  expect(call).not.toMatch(/\[\]\s/);
  consoleDebugSpy.mockRestore();
});

test("logMethod should pass additional arguments to console", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logMethod("debug", true, "test.ts");
  const obj = { foo: "bar" };
  const arr = [1, 2, 3];
  log("Test message", "caller", obj, arr);
  expect(consoleDebugSpy).toHaveBeenCalledWith(expect.any(String), obj, arr);
  consoleDebugSpy.mockRestore();
});

test("logMethod should use error method for error logs", () => {
  const consoleErrorSpy = spyOn(console, "error");
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logMethod("error", true, "test.ts");
  log("Error message");
  expect(consoleErrorSpy).toHaveBeenCalled();
  expect(consoleDebugSpy).not.toHaveBeenCalled();
  consoleErrorSpy.mockRestore();
  consoleDebugSpy.mockRestore();
});

test("logMethod should use info method for info logs", () => {
  const consoleInfoSpy = spyOn(console, "info");
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logMethod("info", true, "test.ts");
  log("Info message");
  expect(consoleInfoSpy).toHaveBeenCalled();
  expect(consoleDebugSpy).not.toHaveBeenCalled();
  consoleInfoSpy.mockRestore();
  consoleDebugSpy.mockRestore();
});

test("logger should create logger with debug error and info methods", () => {
  const log = testLogger({ file: "test.ts", isLogging: true });
  expect(log.debug).toBeFunction();
  expect(log.error).toBeFunction();
  expect(log.info).toBeFunction();
});

test("logger should default isLogging to false", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = testLogger({ file: "test.ts" });
  log.debug("Test message");
  expect(consoleDebugSpy).not.toHaveBeenCalled();
  consoleDebugSpy.mockRestore();
});

test("logger should not log when isLogging is false", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = testLogger({ file: "test.ts", isLogging: false });
  log.debug("Debug");
  expect(consoleDebugSpy).not.toHaveBeenCalled();
  consoleDebugSpy.mockRestore();
});
