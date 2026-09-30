import { errorIncludes } from "../setup";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { runBrewCli, validateStableVersion } from "../../../scripts/release/brew";

const cases = [
  {
    name: "accepts stable versions",
    run: () => {
      ["0.0.0", "1.13.5", "10.20.30"].forEach((version) =>
        assert.doesNotThrow(() => validateStableVersion(version)),
      );
    },
  },
  {
    name: "rejects prereleases, malformed versions, and leading zeroes",
    run: () => {
      const versions = ["1.13.0-beta.1", "v1.13.0", "01.2.3", "1.02.3", "1.2.03", "1.2"];
      versions.forEach((version) =>
        assert.throws(
          () => validateStableVersion(version),
          errorIncludes("Invalid stable version"),
        ),
      );
    },
  },
  {
    name: "validates versions without formula inputs",
    run: () => {
      const env = { VERSION: "1.13.5" };
      const argv = ["validate-version"];
      const defaultArgs: string[] = [];
      assert.doesNotThrow(() => runBrewCli({ argv, env }));
      assert.doesNotThrow(() => runBrewCli({ argv: defaultArgs, env }));
    },
  },
  {
    name: "rejects missing versions",
    run: () => {
      const argv: string[] = [];
      const env = {};
      assert.throws(() => runBrewCli({ argv, env }), errorIncludes("VERSION is required"));
    },
  },
  {
    name: "rejects prereleases through the CLI",
    run: () => {
      const env = { VERSION: "1.13.0-rc.0" };
      const argv = ["validate-version"];
      assert.throws(() => runBrewCli({ argv, env }), errorIncludes("Invalid stable version"));
    },
  },
  {
    name: "rejects the removed npm formula commands",
    run: () => {
      const env = { VERSION: "1.13.5" };
      ["generate", "generate-local", "unknown"].forEach((command) => {
        const argv = [command];
        assert.throws(() => runBrewCli({ argv, env }), errorIncludes("Unknown command"));
      });
    },
  },
];

describe("scripts/release/brew", () => {
  cases.forEach(({ name, run }) => test(name, run));
});
