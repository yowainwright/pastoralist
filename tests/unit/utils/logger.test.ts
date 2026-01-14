import { test, expect, spyOn } from "bun:test";
import { logger } from "../../../src/utils/logger";

test("logger.debug should log when isLogging is true", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  log.debug("Test message", "caller");
  expect(consoleDebugSpy).toHaveBeenCalled();
  consoleDebugSpy.mockRestore();
});

test("logger.debug should not log when isLogging is false", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: false });
  log.debug("Test message", "caller");
  expect(consoleDebugSpy).not.toHaveBeenCalled();
  consoleDebugSpy.mockRestore();
});

test("logger.debug should include file name in log output", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  log.debug("Test message", "caller");
  expect(consoleDebugSpy).toHaveBeenCalledWith(
    expect.stringContaining("[test.ts]"),
  );
  consoleDebugSpy.mockRestore();
});

test("logger.debug should include caller in log output", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  log.debug("Test message", "myFunction");
  expect(consoleDebugSpy).toHaveBeenCalledWith(
    expect.stringContaining("[myFunction]"),
  );
  consoleDebugSpy.mockRestore();
});

test("logger.debug should pass additional arguments to console", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  const obj = { foo: "bar" };
  const arr = [1, 2, 3];
  log.debug("Test message", "caller", obj, arr);
  expect(consoleDebugSpy).toHaveBeenCalledWith(expect.any(String), obj, arr);
  consoleDebugSpy.mockRestore();
});

test("logger.error should use error method", () => {
  const consoleErrorSpy = spyOn(console, "error");
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts", isLogging: true });
  log.error("Error message", "caller");
  expect(consoleErrorSpy).toHaveBeenCalled();
  expect(consoleDebugSpy).not.toHaveBeenCalled();
  consoleErrorSpy.mockRestore();
  consoleDebugSpy.mockRestore();
});

test("logger should create logger with debug, error, warn, and print methods", () => {
  const log = logger({ file: "test.ts", isLogging: true });
  expect(log.debug).toBeFunction();
  expect(log.error).toBeFunction();
  expect(log.warn).toBeFunction();
  expect(log.print).toBeFunction();
  expect(log.line).toBeFunction();
  expect(log.indent).toBeFunction();
  expect(log.item).toBeFunction();
});

test("logger should default isLogging to false", () => {
  const consoleDebugSpy = spyOn(console, "debug");
  const log = logger({ file: "test.ts" });
  log.debug("Test message", "caller");
  expect(consoleDebugSpy).not.toHaveBeenCalled();
  consoleDebugSpy.mockRestore();
});

test("logger.warn should always log regardless of isLogging", () => {
  const consoleWarnSpy = spyOn(console, "warn");
  const log = logger({ file: "test.ts", isLogging: false });
  log.warn("Warning message", "caller");
  expect(consoleWarnSpy).toHaveBeenCalled();
  consoleWarnSpy.mockRestore();
});

test("logger.warn should include file and caller in output", () => {
  const consoleWarnSpy = spyOn(console, "warn");
  const log = logger({ file: "test.ts", isLogging: true });
  log.warn("Warning message", "myCaller");
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    expect.stringContaining("[test.ts]"),
  );
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    expect.stringContaining("[myCaller]"),
  );
  consoleWarnSpy.mockRestore();
});

test("logger.print should output plain message", () => {
  const consoleLogSpy = spyOn(console, "log");
  const log = logger({ file: "test.ts", isLogging: false });
  log.print("User message");
  expect(consoleLogSpy).toHaveBeenCalledWith("User message");
  consoleLogSpy.mockRestore();
});

test("logger.line should output message with newline prefix", () => {
  const consoleLogSpy = spyOn(console, "log");
  const log = logger({ file: "test.ts", isLogging: false });
  log.line("User message");
  expect(consoleLogSpy).toHaveBeenCalledWith("\nUser message");
  consoleLogSpy.mockRestore();
});

test("logger.indent should output message with 3-space indent", () => {
  const consoleLogSpy = spyOn(console, "log");
  const log = logger({ file: "test.ts", isLogging: false });
  log.indent("User message");
  expect(consoleLogSpy).toHaveBeenCalledWith("   User message");
  consoleLogSpy.mockRestore();
});

test("logger.item should output numbered item", () => {
  const consoleLogSpy = spyOn(console, "log");
  const log = logger({ file: "test.ts", isLogging: false });
  log.item(1, "First item");
  expect(consoleLogSpy).toHaveBeenCalledWith("   1. First item");
  consoleLogSpy.mockRestore();
});
