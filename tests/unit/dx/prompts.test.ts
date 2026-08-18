import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  formatConfirmPrompt,
  formatChoiceList,
  formatChoicePrompt,
  formatInputPrompt,
  formatStepHeader,
  formatInfo,
  formatSuccess,
  formatWarning,
  formatCompletion,
} from "../../../src/dx/prompts";
import { green, cyan, gray, yellow } from "../../../src/utils/colors";
import { ICON } from "../../../src/constants";

const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, "");

describe("Enhanced Prompt UI Components", () => {
  describe("formatConfirmPrompt", () => {
    test("formats default yes prompt with green styling", () => {
      const result = formatConfirmPrompt("Enable security scanning?", true);

      assert.ok(result.includes("Enable security scanning?"));
      assert.ok(result.includes("Y"));
      assert.ok(result.includes("n"));
      assert.ok(result.includes("[enter for yes]"));
      assert.ok(result.includes(green("●")));
    });

    test("formats default no prompt with gray styling", () => {
      const result = formatConfirmPrompt("Skip workspace setup?", false);

      assert.ok(result.includes("Skip workspace setup?"));
      assert.ok(result.includes("y"));
      assert.ok(result.includes("N"));
      assert.ok(result.includes("[enter for no]"));
      assert.ok(result.includes(gray("○")));
    });
  });

  describe("formatChoiceList", () => {
    test("formats choice list with yellow bordered box", () => {
      const choices = [
        { name: "Option A", value: "a" },
        { name: "Option B", value: "b" },
      ];
      const result = formatChoiceList("Choose an option:", choices);

      assert.ok(result.includes("Choose an option:"));
      assert.ok(stripAnsi(result).includes("1. Option A"));
      assert.ok(stripAnsi(result).includes("2. Option B"));
      assert.ok(result.includes(yellow("Configuration")));
      assert.ok(result.includes("┌"));
      assert.ok(result.includes("└"));
    });

    test("numbers choices with cyan color", () => {
      const choices = [{ name: "Test Option", value: "test" }];
      const result = formatChoiceList("Test:", choices);

      assert.ok(result.includes(cyan("1.")));
    });
  });

  describe("formatChoicePrompt", () => {
    test("formats choice input prompt with cyan arrow", () => {
      const result = formatChoicePrompt();

      assert.ok(result.includes(cyan("▶")));
      assert.ok(result.includes("Enter your choice"));
      assert.ok(result.includes(gray("(number)")));
    });
  });

  describe("formatInputPrompt", () => {
    test("formats input prompt with default value hint", () => {
      const result = formatInputPrompt("Enter name", "default-name");

      assert.ok(result.includes("Enter name"));
      assert.ok(result.includes(cyan("◆")));
      assert.ok(result.includes(gray('[enter for "default-name"]')));
    });

    test("formats input prompt without default value", () => {
      const result = formatInputPrompt("Enter name");

      assert.ok(result.includes("Enter name"));
      assert.ok(result.includes(cyan("◆")));
      assert.ok(!result.includes("[enter for"));
    });
  });

  describe("formatStepHeader", () => {
    test("formats step header with yellow border and step number", () => {
      const result = formatStepHeader(2, "Security Configuration");

      assert.ok(result.includes("Step 2:"));
      assert.ok(result.includes("Security Configuration"));
      assert.ok(result.includes(cyan("▶ Step 2:")));
      assert.ok(result.includes("┌"));
      assert.ok(result.includes("└"));
    });
  });

  describe("formatInfo", () => {
    test("formats info message with gray styling and icon", () => {
      const result = formatInfo("No workspaces detected");

      assert.ok(stripAnsi(result).includes("No workspaces detected"));
      assert.ok(result.includes(ICON.info));
      assert.strictEqual(result.startsWith("   "), true);
    });
  });

  describe("formatSuccess", () => {
    test("formats success message with green check icon", () => {
      const result = formatSuccess("Configuration saved");

      assert.ok(result.includes("Configuration saved"));
      assert.ok(result.includes(green(ICON.CHECK)));
    });
  });

  describe("formatWarning", () => {
    test("formats warning message with yellow warning icon", () => {
      const result = formatWarning("Token not provided");

      assert.ok(result.includes("Token not provided"));
      assert.ok(result.includes(yellow(ICON.warning)));
    });
  });

  describe("formatCompletion", () => {
    test("formats completion box with next steps", () => {
      const steps = ["Run pastoralist to update dependencies", "Check documentation for options"];
      const result = formatCompletion("Setup complete!", steps);

      assert.ok(stripAnsi(result).includes("✓ Setup complete!"));
      assert.ok(stripAnsi(result).includes("1. Run pastoralist to upd"));
      assert.ok(stripAnsi(result).includes("2. Check documentation fo"));
      assert.ok(result.includes(yellow("Next Steps")));
    });

    test("formats completion box with custom shimmer title", () => {
      const steps = ["Next step"];
      const shimmerTitle = "Shimmering completion!";
      const result = formatCompletion("Regular title", steps, shimmerTitle);

      assert.ok(result.includes("Shimmering completion!"));
      assert.ok(!result.includes("Regular title"));
      assert.ok(stripAnsi(result).includes("1. Next step"));
    });

    test("applies yellow borders to completion box", () => {
      const steps = ["Test step"];
      const result = formatCompletion("Test", steps);

      assert.match(result, /\[\d+m┌/);
      assert.match(result, /\[\d+m└/);
    });
  });
});
