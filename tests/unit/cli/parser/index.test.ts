import { errorIncludes } from "../../setup";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../../../../src/cli/parser";
import { HELP_TEXT } from "../../../../src/cli/parser/constants";

describe("parseArgs", () => {
  describe("help text", () => {
    test("should document onboarding", () => {
      assert.ok(HELP_TEXT.includes("onboard"));
      assert.ok(HELP_TEXT.includes("--onboard, --onboarding"));
      assert.ok(HELP_TEXT.includes("GitHub Action guidance"));
      assert.ok(HELP_TEXT.includes("init [config|agent-skill]"));
    });
  });

  describe("boolean flags", () => {
    test("should parse --debug flag", () => {
      const result = parseArgs(["node", "script.js", "--debug"]);

      assert.strictEqual(result.options.debug, true);
    });

    test("should parse --dry-run flag", () => {
      const result = parseArgs(["node", "script.js", "--dry-run"]);

      assert.strictEqual(result.options.dryRun, true);
    });

    test("should coerce inline boolean values", () => {
      const disabled = parseArgs(["node", "script.js", "--dry-run=false"]);
      const enabled = parseArgs(["node", "script.js", "--debug=true"]);

      assert.strictEqual(disabled.options.dryRun, false);
      assert.strictEqual(enabled.options.debug, true);
    });

    test("should reject invalid inline boolean values", () => {
      assert.throws(
        () => parseArgs(["node", "script.js", "--dry-run=0"]),
        errorIncludes("Boolean option dryRun requires true or false"),
      );
    });

    test("should parse multiple boolean flags", () => {
      const result = parseArgs(["node", "script.js", "--debug", "--dry-run", "--interactive"]);

      assert.strictEqual(result.options.debug, true);
      assert.strictEqual(result.options.dryRun, true);
      assert.strictEqual(result.options.interactive, true);
    });

    test("should parse -t flag", () => {
      const result = parseArgs(["node", "script.js", "-t"]);

      assert.strictEqual(result.options.isTestingCLI, true);
    });

    test("should parse version flags", () => {
      const longVersion = parseArgs(["node", "script.js", "--version"]);
      const shortVersion = parseArgs(["node", "script.js", "-v"]);

      assert.strictEqual(longVersion.options.version, true);
      assert.strictEqual(shortVersion.options.version, true);
    });
  });

  describe("flags with values", () => {
    test("should parse -p flag with value", () => {
      const result = parseArgs(["node", "script.js", "-p", "test.json"]);

      assert.strictEqual(result.options.path, "test.json");
    });

    test("should parse --path flag with value", () => {
      const result = parseArgs(["node", "script.js", "--path", "package.json"]);

      assert.strictEqual(result.options.path, "package.json");
    });

    test("should parse -r flag with value", () => {
      const result = parseArgs(["node", "script.js", "-r", "/tmp"]);

      assert.strictEqual(result.options.root, "/tmp");
    });

    test("should parse --root flag with value", () => {
      const result = parseArgs(["node", "script.js", "--root", "/home/user"]);

      assert.strictEqual(result.options.root, "/home/user");
    });

    test("should parse flag with equals sign", () => {
      const result = parseArgs(["node", "script.js", "--path=custom.json"]);

      assert.strictEqual(result.options.path, "custom.json");
    });

    test("should parse --securityProviderToken with value", () => {
      const result = parseArgs(["node", "script.js", "--securityProviderToken", "abc123"]);

      assert.strictEqual(result.options.securityProviderToken, "abc123");
    });

    test("should parse --cache-ttl with value", () => {
      const result = parseArgs(["node", "script.js", "--cache-ttl", "3600"]);

      assert.strictEqual(result.options.cacheTtl, "3600");
    });
  });

  describe("array flags", () => {
    test("should parse -d flag with multiple values", () => {
      const result = parseArgs(["node", "script.js", "-d", "path1", "path2", "path3"]);

      assert.deepStrictEqual(result.options.depPaths, ["path1", "path2", "path3"]);
    });

    test("should parse --depPaths flag with multiple values", () => {
      const result = parseArgs(["node", "script.js", "--depPaths", "packages/*", "workspaces/*"]);

      assert.deepStrictEqual(result.options.depPaths, ["packages/*", "workspaces/*"]);
    });

    test("should parse --ignore flag with multiple values", () => {
      const result = parseArgs(["node", "script.js", "--ignore", "node_modules", "dist", "build"]);

      assert.deepStrictEqual(result.options.ignore, ["node_modules", "dist", "build"]);
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

      assert.deepStrictEqual(result.options.securityProvider, ["osv", "github", "snyk"]);
    });

    test("should reject array flag with no values following it", () => {
      assert.throws(
        () => parseArgs(["node", "script.js", "--depPaths", "--debug"]),
        errorIncludes("Option depPaths requires a value"),
      );
    });

    test("should reject array flag at end of arguments", () => {
      assert.throws(
        () => parseArgs(["node", "script.js", "--debug", "--depPaths"]),
        errorIncludes("Option depPaths requires a value"),
      );
    });
  });

  describe("default values", () => {
    test("should apply default value for path", () => {
      const result = parseArgs(["node", "script.js"]);

      assert.strictEqual(result.options.path, "package.json");
    });

    test("should not apply default value for securityProvider when not provided", () => {
      const result = parseArgs(["node", "script.js"]);

      assert.strictEqual(result.options.securityProvider, undefined);
    });

    test("should override default value when provided", () => {
      const result = parseArgs(["node", "script.js", "--path", "custom.json"]);

      assert.strictEqual(result.options.path, "custom.json");
    });

    test("should override default securityProvider when provided", () => {
      const result = parseArgs(["node", "script.js", "--securityProvider", "github"]);

      assert.deepStrictEqual(result.options.securityProvider, ["github"]);
    });
  });

  describe("commands", () => {
    test("should parse init command", () => {
      const result = parseArgs(["node", "script.js", "init"]);

      assert.strictEqual(result.command, "init");
      assert.deepStrictEqual(result.commandArgs, []);
    });

    test("should parse init command target", () => {
      const result = parseArgs(["node", "script.js", "init", "agent-skill"]);

      assert.strictEqual(result.command, "init");
      assert.deepStrictEqual(result.commandArgs, ["agent-skill"]);
    });

    test("should parse init command target args", () => {
      const result = parseArgs(["node", "script.js", "init", "agent-skill", "extra"]);

      assert.strictEqual(result.command, "init");
      assert.deepStrictEqual(result.commandArgs, ["agent-skill", "extra"]);
    });

    test("should parse doctor command", () => {
      const result = parseArgs(["node", "script.js", "doctor"]);

      assert.strictEqual(result.command, "doctor");
    });

    test("should parse onboard command", () => {
      const result = parseArgs(["node", "script.js", "onboard"]);

      assert.strictEqual(result.command, "onboard");
    });

    test("should parse command with options", () => {
      const result = parseArgs(["node", "script.js", "init", "--path", "test.json"]);

      assert.strictEqual(result.command, "init");
      assert.strictEqual(result.options.path, "test.json");
    });

    test("should parse command with options before command", () => {
      const result = parseArgs(["node", "script.js", "--path", "test.json", "init"]);

      assert.strictEqual(result.command, "init");
      assert.strictEqual(result.options.path, "test.json");
    });
  });

  describe("mixed flags", () => {
    test("should parse combination of short and long flags", () => {
      const result = parseArgs(["node", "script.js", "-p", "test.json", "--debug", "-r", "/tmp"]);

      assert.strictEqual(result.options.path, "test.json");
      assert.strictEqual(result.options.debug, true);
      assert.strictEqual(result.options.root, "/tmp");
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

      assert.strictEqual(result.options.debug, true);
      assert.deepStrictEqual(result.options.depPaths, ["path1", "path2"]);
      assert.strictEqual(result.options.path, "custom.json");
      assert.strictEqual(result.options.interactive, true);
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

      assert.strictEqual(result.options.checkSecurity, true);
      assert.strictEqual(result.options.forceSecurityRefactor, true);
      assert.deepStrictEqual(result.options.securityProvider, ["osv", "github"]);
      assert.strictEqual(result.options.securityProviderToken, "token123");
      assert.strictEqual(result.options.interactive, true);
      assert.strictEqual(result.options.hasWorkspaceSecurityChecks, true);
    });

    test("should parse test mode flags", () => {
      const result = parseArgs(["node", "script.js", "--isTesting", "--isTestingCLI"]);

      assert.strictEqual(result.options.isTesting, true);
      assert.strictEqual(result.options.isTestingCLI, true);
    });
  });

  describe("unknown flags", () => {
    test("should throw for unknown flags", () => {
      assert.throws(
        () => parseArgs(["node", "script.js", "--unknown", "--debug"]),
        errorIncludes("Unknown option: --unknown"),
      );
    });

    test("should throw for unknown short flags", () => {
      assert.throws(
        () => parseArgs(["node", "script.js", "-x", "-p", "test.json"]),
        errorIncludes("Unknown option: -x"),
      );
    });

    test("should parse help flags", () => {
      const longHelp = parseArgs(["node", "script.js", "--help"]);
      const shortHelp = parseArgs(["node", "script.js", "-h"]);

      assert.strictEqual(longHelp.options.help, true);
      assert.strictEqual(shortHelp.options.help, true);
    });
  });

  describe("edge cases", () => {
    test("should handle empty arguments", () => {
      const result = parseArgs(["node", "script.js"]);

      assert.strictEqual(result.command, undefined);
      assert.strictEqual(result.options.path, "package.json");
      assert.strictEqual(result.options.securityProvider, undefined);
    });

    test("should handle only command", () => {
      const result = parseArgs(["node", "script.js", "init"]);

      assert.strictEqual(result.command, "init");
      assert.strictEqual(result.options.path, "package.json");
    });

    test("should reject a separate empty string value", () => {
      assert.throws(
        () => parseArgs(["node", "script.js", "--path", ""]),
        errorIncludes("Option path requires a value"),
      );
    });

    test("should handle flag with equals and empty value", () => {
      const result = parseArgs(["node", "script.js", "--path="]);

      assert.strictEqual(result.options.path, "");
    });

    test("should handle multiple equals signs in value", () => {
      const result = parseArgs(["node", "script.js", "--securityProviderToken=abc=123=xyz"]);

      assert.strictEqual(result.options.securityProviderToken, "abc=123=xyz");
    });

    test("should reject flag at end without value", () => {
      assert.throws(
        () => parseArgs(["node", "script.js", "--debug", "--path"]),
        errorIncludes("Option path requires a value"),
      );
    });

    test("should handle prompt-related flags", () => {
      const result = parseArgs(["node", "script.js", "--promptForReasons"]);

      assert.strictEqual(result.options.promptForReasons, true);
    });

    test("should handle init flag", () => {
      const result = parseArgs(["node", "script.js", "--init"]);

      assert.strictEqual(result.options.init, true);
    });

    test("should handle init flag with target args", () => {
      const result = parseArgs(["node", "script.js", "--init", "agent-skill", "extra"]);

      assert.deepStrictEqual(result.options.init, ["agent-skill", "extra"]);
    });

    test("should handle inline init flag target", () => {
      const result = parseArgs(["node", "script.js", "--init=agent-skill"]);

      assert.strictEqual(result.options.init, "agent-skill");
    });

    test("should handle onboarding flags", () => {
      const onboardResult = parseArgs(["node", "script.js", "--onboard"]);
      const onboardingResult = parseArgs(["node", "script.js", "--onboarding"]);

      assert.strictEqual(onboardResult.options.onboard, true);
      assert.strictEqual(onboardingResult.options.onboard, true);
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

      assert.strictEqual(result.options.debug, true);
      assert.strictEqual(result.options.dryRun, true);
      assert.strictEqual(result.options.path, "custom.json");
      assert.deepStrictEqual(result.options.depPaths, ["path1", "path2"]);
      assert.deepStrictEqual(result.options.ignore, ["node_modules"]);
      assert.strictEqual(result.options.root, "/root");
      assert.strictEqual(result.options.isTestingCLI, true);
      assert.strictEqual(result.options.isTesting, true);
      assert.strictEqual(result.options.init, true);
      assert.strictEqual(result.options.checkSecurity, true);
      assert.strictEqual(result.options.forceSecurityRefactor, true);
      assert.deepStrictEqual(result.options.securityProvider, ["osv", "github"]);
      assert.strictEqual(result.options.securityProviderToken, "token");
      assert.strictEqual(result.options.interactive, true);
      assert.strictEqual(result.options.hasWorkspaceSecurityChecks, true);
      assert.strictEqual(result.options.promptForReasons, true);
    });
  });

  describe("camelCase conversion", () => {
    test("should convert --dry-run to dryRun", () => {
      const result = parseArgs(["node", "script.js", "--dry-run"]);

      assert.strictEqual(result.options.dryRun, true);
      assert.strictEqual(result.options["dry-run"], undefined);
    });

    test("should convert --security-provider to securityProvider", () => {
      const result = parseArgs(["node", "script.js", "--securityProvider", "osv"]);

      assert.deepStrictEqual(result.options.securityProvider, ["osv"]);
    });

    test("should convert --is-testing-cli to isTestingCLI", () => {
      const result = parseArgs(["node", "script.js", "-t"]);

      assert.strictEqual(result.options.isTestingCLI, true);
    });
  });

  describe("outputFormat flag", () => {
    test("should parse --outputFormat with json value", () => {
      const result = parseArgs(["node", "script.js", "--outputFormat", "json"]);

      assert.strictEqual(result.options.outputFormat, "json");
    });

    test("should parse --outputFormat with text value", () => {
      const result = parseArgs(["node", "script.js", "--outputFormat", "text"]);

      assert.strictEqual(result.options.outputFormat, "text");
    });

    test("should parse --outputFormat with equals syntax", () => {
      const result = parseArgs(["node", "script.js", "--outputFormat=json"]);

      assert.strictEqual(result.options.outputFormat, "json");
    });

    test("should default to text when not specified", () => {
      const result = parseArgs(["node", "script.js"]);

      assert.strictEqual(result.options.outputFormat, "text");
    });

    test("should work with other flags", () => {
      const result = parseArgs([
        "node",
        "script.js",
        "--outputFormat",
        "json",
        "--dry-run",
        "--checkSecurity",
      ]);

      assert.strictEqual(result.options.outputFormat, "json");
      assert.strictEqual(result.options.dryRun, true);
      assert.strictEqual(result.options.checkSecurity, true);
    });
  });
});
