import { errorIncludes } from "../../setup";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { normalizeArgv, parseArgs } from "../../../../src/cli/parser";
import { HELP_TEXT } from "../../../../src/cli/parser/constants";

const argvCases = [
  [[], ["pastoralist", "pastoralist"]],
  [
    ["pastoralist", "--debug"],
    ["pastoralist", "pastoralist", "--debug"],
  ],
  [
    ["node", "node", "--help"],
    ["node", "pastoralist", "--help"],
  ],
  [
    ["node", "cli.js", "--debug"],
    ["node", "cli.js", "--debug"],
  ],
  [
    ["node", "src/cli", "--help"],
    ["node", "src/cli", "--help"],
  ],
];

argvCases.forEach(([input, expected]) => {
  test(`normalizeArgv handles ${JSON.stringify(input)}`, () => {
    const before = input.slice();
    const result = normalizeArgv(input);
    assert.deepStrictEqual(result, expected);
    assert.deepStrictEqual(input, before);
    assert.notStrictEqual(result, input);
  });
});

const ONBOARDING_HELP_PHRASES = [
  "onboard",
  "--onboard, --onboarding",
  "GitHub Action guidance",
  "init [config|agent-skill]",
];

const MULTIPLE_PROVIDER_ARGS = ["node", "script.js", "--securityProvider", "osv", "github", "snyk"];

const MIXED_FLAG_ARGS = [
  "node",
  "script.js",
  "--debug",
  "-d",
  "path1",
  "path2",
  "--path",
  "custom.json",
  "--interactive",
];

const SECURITY_FLAG_ARGS = [
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
];

const ALL_FLAG_ARGS = [
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
];

const OUTPUT_FORMAT_WITH_FLAGS_ARGS = [
  "node",
  "script.js",
  "--outputFormat",
  "json",
  "--dry-run",
  "--checkSecurity",
];

const registerHelpTextTests = () => {
  test("should document onboarding", () => {
    ONBOARDING_HELP_PHRASES.forEach((phrase) => assert.ok(HELP_TEXT.includes(phrase)));
  });
};

const registerBooleanFlagsTestsPart1 = () => {
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
};

const registerBooleanFlagsTestsPart2 = () => {
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
};

const registerBooleanFlagsTestsPart3 = () => {
  test("should parse version flags", () => {
    const longVersion = parseArgs(["node", "script.js", "--version"]);
    const shortVersion = parseArgs(["node", "script.js", "-v"]);

    assert.strictEqual(longVersion.options.version, true);
    assert.strictEqual(shortVersion.options.version, true);
  });
};

const registerBooleanFlagsTests = () => {
  registerBooleanFlagsTestsPart1();
  registerBooleanFlagsTestsPart2();
  registerBooleanFlagsTestsPart3();
};

const registerFlagsWithValuesTestsPart1 = () => {
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
};

const registerFlagsWithValuesTestsPart2 = () => {
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
};

const registerFlagsWithValuesTests = () => {
  registerFlagsWithValuesTestsPart1();
  registerFlagsWithValuesTestsPart2();
};

const registerArrayFlagsTestsPart1 = () => {
  test("should parse -d flag with multiple values", () => {
    const result = parseArgs(["node", "script.js", "-d", "path1", "path2", "path3"]);

    assert.deepStrictEqual(result.options.depPaths, ["path1", "path2", "path3"]);
  });

  test("should parse inline --depPaths value as an array", () => {
    const result = parseArgs(["node", "script.js", "--depPaths=packages/*"]);

    assert.deepStrictEqual(result.options.depPaths, ["packages/*"]);
  });

  test("should parse inline --ignore and --securityProvider values as arrays", () => {
    const result = parseArgs(["node", "script.js", "--ignore=lodash", "--securityProvider=osv"]);

    assert.deepStrictEqual(result.options.ignore, ["lodash"]);
    assert.deepStrictEqual(result.options.securityProvider, ["osv"]);
  });

  test("should parse --depPaths flag with multiple values", () => {
    const result = parseArgs(["node", "script.js", "--depPaths", "packages/*", "workspaces/*"]);

    assert.deepStrictEqual(result.options.depPaths, ["packages/*", "workspaces/*"]);
  });
};

const registerArrayFlagsTestsPart2 = () => {
  test("should parse --ignore flag with multiple values", () => {
    const result = parseArgs(["node", "script.js", "--ignore", "node_modules", "dist", "build"]);

    assert.deepStrictEqual(result.options.ignore, ["node_modules", "dist", "build"]);
  });

  test("should parse --securityProvider flag with multiple values", () => {
    const result = parseArgs(MULTIPLE_PROVIDER_ARGS);

    assert.deepStrictEqual(result.options.securityProvider, ["osv", "github", "snyk"]);
  });

  test("should reject array flag with no values following it", () => {
    assert.throws(
      () => parseArgs(["node", "script.js", "--depPaths", "--debug"]),
      errorIncludes("Option depPaths requires a value"),
    );
  });
};

const registerArrayFlagsTestsPart3 = () => {
  test("should reject array flag at end of arguments", () => {
    assert.throws(
      () => parseArgs(["node", "script.js", "--debug", "--depPaths"]),
      errorIncludes("Option depPaths requires a value"),
    );
  });
};

const registerArrayFlagsTests = () => {
  registerArrayFlagsTestsPart1();
  registerArrayFlagsTestsPart2();
  registerArrayFlagsTestsPart3();
};

const registerDefaultValuesTests = () => {
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
};

const registerCommandsTestsPart1 = () => {
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
};

const registerCommandsTestsPart2 = () => {
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
};

const registerCommandsTestsPart3 = () => {
  test("should parse command with options before command", () => {
    const result = parseArgs(["node", "script.js", "--path", "test.json", "init"]);

    assert.strictEqual(result.command, "init");
    assert.strictEqual(result.options.path, "test.json");
  });
};

const registerCommandsTests = () => {
  registerCommandsTestsPart1();
  registerCommandsTestsPart2();
  registerCommandsTestsPart3();
};

const registerMixedFlagsTestsPart1 = () => {
  test("should parse combination of short and long flags", () => {
    const result = parseArgs(["node", "script.js", "-p", "test.json", "--debug", "-r", "/tmp"]);

    assert.strictEqual(result.options.path, "test.json");
    assert.strictEqual(result.options.debug, true);
    assert.strictEqual(result.options.root, "/tmp");
  });

  test("should parse boolean, value, and array flags together", () => {
    const result = parseArgs(MIXED_FLAG_ARGS);

    assert.strictEqual(result.options.debug, true);
    assert.deepStrictEqual(result.options.depPaths, ["path1", "path2"]);
    assert.strictEqual(result.options.path, "custom.json");
    assert.strictEqual(result.options.interactive, true);
  });
};

const registerMixedFlagsTestsPart2 = () => {
  test("should parse all security-related flags", () => {
    const result = parseArgs(SECURITY_FLAG_ARGS);

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
};

const registerMixedFlagsTests = () => {
  registerMixedFlagsTestsPart1();
  registerMixedFlagsTestsPart2();
};

const registerUnknownFlagsTestsPart1 = () => {
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
};

const registerUnknownFlagsTestsPart2 = () => {
  test("should parse help flags", () => {
    const longHelp = parseArgs(["node", "script.js", "--help"]);
    const shortHelp = parseArgs(["node", "script.js", "-h"]);

    assert.strictEqual(longHelp.options.help, true);
    assert.strictEqual(shortHelp.options.help, true);
  });
};

const registerUnknownFlagsTests = () => {
  registerUnknownFlagsTestsPart1();
  registerUnknownFlagsTestsPart2();
};

const registerEdgeCasesTestsPart1 = () => {
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
};

const registerEdgeCasesTestsPart2 = () => {
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
};

const registerEdgeCasesTestsPart3 = () => {
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
};

const registerEdgeCasesTestsPart4 = () => {
  test("should handle onboarding flags", () => {
    const onboardResult = parseArgs(["node", "script.js", "--onboard"]);
    const onboardingResult = parseArgs(["node", "script.js", "--onboarding"]);

    assert.strictEqual(onboardResult.options.onboard, true);
    assert.strictEqual(onboardingResult.options.onboard, true);
  });

  test("should parse styleguide flag", () => {
    const result = parseArgs(["node", "script.js", "--styleguide"]);

    assert.strictEqual(result.options.styleguide, true);
  });

  test("should parse all flags correctly", parsesAllFlagsCorrectly);
};

const parsesAllFlagsCorrectly = () => {
  const result = parseArgs(ALL_FLAG_ARGS);

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
};

const registerEdgeCasesTests = () => {
  registerEdgeCasesTestsPart1();
  registerEdgeCasesTestsPart2();
  registerEdgeCasesTestsPart3();
  registerEdgeCasesTestsPart4();
};

const registerCamelCaseConversionTests = () => {
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
};

const registerOutputFormatFlagTestsPart1 = () => {
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
};

const registerOutputFormatFlagTestsPart2 = () => {
  test("should work with other flags", () => {
    const result = parseArgs(OUTPUT_FORMAT_WITH_FLAGS_ARGS);

    assert.strictEqual(result.options.outputFormat, "json");
    assert.strictEqual(result.options.dryRun, true);
    assert.strictEqual(result.options.checkSecurity, true);
  });
};

const registerOutputFormatFlagTests = () => {
  registerOutputFormatFlagTestsPart1();
  registerOutputFormatFlagTestsPart2();
};

describe("parseArgs", () => {
  describe("help text", registerHelpTextTests);
  describe("boolean flags", registerBooleanFlagsTests);
  describe("flags with values", registerFlagsWithValuesTests);
  describe("array flags", registerArrayFlagsTests);
  describe("default values", registerDefaultValuesTests);
  describe("commands", registerCommandsTests);
  describe("mixed flags", registerMixedFlagsTests);
  describe("unknown flags", registerUnknownFlagsTests);
  describe("edge cases", registerEdgeCasesTests);
  describe("camelCase conversion", registerCamelCaseConversionTests);
  describe("outputFormat flag", registerOutputFormatFlagTests);
});
