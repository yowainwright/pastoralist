import { LOG_PREFIX } from "../constants";
import { logMethod } from "../scripts";
import { ConsoleMethod } from "../interfaces";

describe("logMethod", () => {
  beforeEach(() => {
    // Mock console methods before each test
    jest.spyOn(console, "debug").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods after each test
    jest.restoreAllMocks();
  });

  it("should not log when isLogging is false", () => {
    const logFn = logMethod("debug" as ConsoleMethod, false, "test.ts");
    logFn("test message");
    expect(console.debug).not.toHaveBeenCalled();
  });

  it("should log the correct message with caller", () => {
    const logFn = logMethod("info" as ConsoleMethod, true, "test.ts");
    logFn("test message", "testCaller");
    expect(console.info).toHaveBeenCalledWith(
      `${LOG_PREFIX}[test.ts][testCaller] test message`,
    );
  });

  it("should log the correct message without caller", () => {
    const logFn = logMethod("error" as ConsoleMethod, true, "test.ts");
    logFn("test message");
    expect(console.error).toHaveBeenCalledWith(
      `${LOG_PREFIX}[test.ts] test message`,
    );
  });

  it("should log additional arguments", () => {
    const logFn = logMethod("debug" as ConsoleMethod, true, "test.ts");
    logFn("test message", "testCaller", 123, { foo: "bar" });
    expect(console.debug).toHaveBeenCalledWith(
      `${LOG_PREFIX}[test.ts][testCaller] test message`,
      123,
      { foo: "bar" },
    );
  });

  it("should handle all console methods", () => {
    const consoleMethods: ConsoleMethod[] = ["debug", "error", "info"];
    consoleMethods.forEach((method) => {
      const logFn = logMethod(method, true, "test.ts");
      logFn("test message");
      expect(console[method]).toHaveBeenCalledWith(
        `${LOG_PREFIX}[test.ts] test message`,
      );
    });
  });
});
