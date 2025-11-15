import { describe, expect, test } from "bun:test";
import { parseArgs } from "../../../../src/cli/parser";

describe("parseArgs", () => {
  describe("boolean flags", () => {
    test("should parse --debug flag", () => {
      const result = parseArgs(["node", "script.js", "--debug"]);

      expect(result.options.debug).toBe(true);
    });

    test("should parse --dry-run flag", () => {
      const result = parseArgs(["node", "script.js", "--dry-run"]);

      expect(result.options.dryRun).toBe(true);
    });

    test("should parse multiple boolean flags", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--debug",
        "--dry-run",
        "--interactive",
      ]);

      expect(result.options.debug).toBe(true);
      expect(result.options.dryRun).toBe(true);
      expect(result.options.interactive).toBe(true);
    });

    test("should parse -t flag", () => {
      const result = parseArgs(["node", "script.js", "-t"]);

      expect(result.options.isTestingCLI).toBe(true);
    });
  });

  describe("flags with values", () => {
    test("should parse -p flag with value", () => {
      const result = parseArgs(["node", "script.js", "-p", "test.json"]);

      expect(result.options.path).toBe("test.json");
    });

    test("should parse --path flag with value", () => {
      const result = parseArgs(["node", "script.js", "--path", "package.json"]);

      expect(result.options.path).toBe("package.json");
    });

    test("should parse -r flag with value", () => {
      const result = parseArgs(["node", "script.js", "-r", "/tmp"]);

      expect(result.options.root).toBe("/tmp");
    });

    test("should parse --root flag with value", () => {
      const result = parseArgs(["node", "script.js", "--root", "/home/user"]);

      expect(result.options.root).toBe("/home/user");
    });

    test("should parse flag with equals sign", () => {
      const result = parseArgs(["node", "script.js", "--path=custom.json"]);

      expect(result.options.path).toBe("custom.json");
    });

    test("should parse --securityProviderToken with value", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--securityProviderToken",
        "abc123",
      ]);

      expect(result.options.securityProviderToken).toBe("abc123");
    });
  });

  describe("array flags", () => {
    test("should parse -d flag with multiple values", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "-d",
        "path1",
        "path2",
        "path3",
      ]);

      expect(result.options.depPaths).toEqual(["path1", "path2", "path3"]);
    });

    test("should parse --depPaths flag with multiple values", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--depPaths",
        "packages/*",
        "workspaces/*",
      ]);

      expect(result.options.depPaths).toEqual(["packages/*", "workspaces/*"]);
    });

    test("should parse --ignore flag with multiple values", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--ignore",
        "node_modules",
        "dist",
        "build",
      ]);

      expect(result.options.ignore).toEqual(["node_modules", "dist", "build"]);
    });

    test("should parse --securityProvider flag with multiple values", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--securityProvider",
        "osv",
        "github",
        "snyk",
      ]);

      expect(result.options.securityProvider).toEqual([
        "osv",
        "github",
        "snyk",
      ]);
    });

    test("should handle array flag with no values following it", () => {
      const result = parseArgs(["node", "script.js", "--depPaths", "--debug"]);

      expect(result.options.depPaths).toBeUndefined();
      expect(result.options.debug).toBe(true);
    });

    test("should handle array flag at end of arguments", () => {
      const result = parseArgs(["node", "script.js", "--debug", "--depPaths"]);

      expect(result.options.debug).toBe(true);
      expect(result.options.depPaths).toBeUndefined();
    });
  });

  describe("default values", () => {
    test("should apply default value for path", () => {
      const result = parseArgs(["node", "script.js"]);

      expect(result.options.path).toBe("package.json");
    });

    test("should not apply default value for securityProvider when not provided", () => {
      const result = parseArgs(["node", "script.js"]);

      expect(result.options.securityProvider).toBeUndefined();
    });

    test("should override default value when provided", () => {
      const result = parseArgs(["node", "script.js", "--path", "custom.json"]);

      expect(result.options.path).toBe("custom.json");
    });

    test("should override default securityProvider when provided", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--securityProvider",
        "github",
      ]);

      expect(result.options.securityProvider).toEqual(["github"]);
    });
  });

  describe("commands", () => {
    test("should parse init command", () => {
      const result = parseArgs(["node", "script.js", "init"]);

      expect(result.command).toBe("init");
    });

    test("should parse command with options", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "init",
        "--path",
        "test.json",
      ]);

      expect(result.command).toBe("init");
      expect(result.options.path).toBe("test.json");
    });

    test("should parse command with options before command", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--path",
        "test.json",
        "init",
      ]);

      expect(result.command).toBe("init");
      expect(result.options.path).toBe("test.json");
    });
  });

  describe("mixed flags", () => {
    test("should parse combination of short and long flags", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "-p",
        "test.json",
        "--debug",
        "-r",
        "/tmp",
      ]);

      expect(result.options.path).toBe("test.json");
      expect(result.options.debug).toBe(true);
      expect(result.options.root).toBe("/tmp");
    });

    test("should parse boolean, value, and array flags together", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--debug",
        "-d",
        "path1",
        "path2",
        "--path",
        "custom.json",
        "--interactive",
      ]);

      expect(result.options.debug).toBe(true);
      expect(result.options.depPaths).toEqual(["path1", "path2"]);
      expect(result.options.path).toBe("custom.json");
      expect(result.options.interactive).toBe(true);
    });

    test("should parse all security-related flags", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--checkSecurity",
        "--forceSecurityRefactor",
        "--securityProvider",
        "osv",
        "github",
        "--securityProviderToken",
        "token123",
        "--interactive",
        "--hasWorkspaceSecurityChecks",
      ]);

      expect(result.options.checkSecurity).toBe(true);
      expect(result.options.forceSecurityRefactor).toBe(true);
      expect(result.options.securityProvider).toEqual(["osv", "github"]);
      expect(result.options.securityProviderToken).toBe("token123");
      expect(result.options.interactive).toBe(true);
      expect(result.options.hasWorkspaceSecurityChecks).toBe(true);
    });

    test("should parse test mode flags", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--isTesting",
        "--isTestingCLI",
        "--isIRLFix",
        "--isIRLCatch",
      ]);

      expect(result.options.isTesting).toBe(true);
      expect(result.options.isTestingCLI).toBe(true);
      expect(result.options.isIRLFix).toBe(true);
      expect(result.options.isIRLCatch).toBe(true);
    });
  });

  describe("unknown flags", () => {
    test("should ignore unknown flags", () => {
      const result = parseArgs(["node", "script.js", "--unknown", "--debug"]);

      expect(result.options.debug).toBe(true);
      expect(result.options.unknown).toBeUndefined();
    });

    test("should ignore unknown short flags", () => {
      const result = parseArgs(["node", "script.js", "-x", "-p", "test.json"]);

      expect(result.options.path).toBe("test.json");
      expect(result.options.x).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    test("should handle empty arguments", () => {
      const result = parseArgs(["node", "script.js"]);

      expect(result.command).toBeUndefined();
      expect(result.options.path).toBe("package.json");
      expect(result.options.securityProvider).toBeUndefined();
    });

    test("should handle only command", () => {
      const result = parseArgs(["node", "script.js", "init"]);

      expect(result.command).toBe("init");
      expect(result.options.path).toBe("package.json");
    });

    test("should handle flag with empty string value as boolean", () => {
      const result = parseArgs(["node", "script.js", "--path", ""]);

      expect(result.options.path).toBe(true);
    });

    test("should handle flag with equals and empty value", () => {
      const result = parseArgs(["node", "script.js", "--path="]);

      expect(result.options.path).toBe("");
    });

    test("should handle multiple equals signs in value", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--securityProviderToken=abc=123=xyz",
      ]);

      expect(result.options.securityProviderToken).toBe("abc=123=xyz");
    });

    test("should handle flag at end without value", () => {
      const result = parseArgs(["node", "script.js", "--debug", "--path"]);

      expect(result.options.debug).toBe(true);
      expect(result.options.path).toBe(true);
    });

    test("should handle prompt-related flags", () => {
      const result = parseArgs(["node", "script.js", "--promptForReasons"]);

      expect(result.options.promptForReasons).toBe(true);
    });

    test("should handle init flag", () => {
      const result = parseArgs(["node", "script.js", "--init"]);

      expect(result.options.init).toBe(true);
    });

    test("should parse all flags correctly", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--debug",
        "--dry-run",
        "-p",
        "custom.json",
        "-d",
        "path1",
        "path2",
        "--ignore",
        "node_modules",
        "-r",
        "/root",
        "-t",
        "--isTesting",
        "--isIRLFix",
        "--isIRLCatch",
        "--init",
        "--checkSecurity",
        "--forceSecurityRefactor",
        "--securityProvider",
        "osv",
        "github",
        "--securityProviderToken",
        "token",
        "--interactive",
        "--hasWorkspaceSecurityChecks",
        "--promptForReasons",
      ]);

      expect(result.options.debug).toBe(true);
      expect(result.options.dryRun).toBe(true);
      expect(result.options.path).toBe("custom.json");
      expect(result.options.depPaths).toEqual(["path1", "path2"]);
      expect(result.options.ignore).toEqual(["node_modules"]);
      expect(result.options.root).toBe("/root");
      expect(result.options.isTestingCLI).toBe(true);
      expect(result.options.isTesting).toBe(true);
      expect(result.options.isIRLFix).toBe(true);
      expect(result.options.isIRLCatch).toBe(true);
      expect(result.options.init).toBe(true);
      expect(result.options.checkSecurity).toBe(true);
      expect(result.options.forceSecurityRefactor).toBe(true);
      expect(result.options.securityProvider).toEqual(["osv", "github"]);
      expect(result.options.securityProviderToken).toBe("token");
      expect(result.options.interactive).toBe(true);
      expect(result.options.hasWorkspaceSecurityChecks).toBe(true);
      expect(result.options.promptForReasons).toBe(true);
    });
  });

  describe("camelCase conversion", () => {
    test("should convert --dry-run to dryRun", () => {
      const result = parseArgs(["node", "script.js", "--dry-run"]);

      expect(result.options.dryRun).toBe(true);
      expect(result.options["dry-run"]).toBeUndefined();
    });

    test("should convert --security-provider to securityProvider", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--securityProvider",
        "osv",
      ]);

      expect(result.options.securityProvider).toEqual(["osv"]);
    });

    test("should convert --is-testing-cli to isTestingCLI", () => {
      const result = parseArgs(["node", "script.js", "-t"]);

      expect(result.options.isTestingCLI).toBe(true);
    });
  });
});
