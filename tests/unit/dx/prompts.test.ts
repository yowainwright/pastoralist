import { describe, test, expect } from "bun:test";
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
import { ICON } from "../../../src/utils/icons";

const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, "");

describe("Enhanced Prompt UI Components", () => {
  describe("formatConfirmPrompt", () => {
    test("formats default yes prompt with green styling", () => {
      const result = formatConfirmPrompt("Enable security scanning?", true);

      expect(result).toContain("Enable security scanning?");
      expect(result).toContain("Y");
      expect(result).toContain("n");
      expect(result).toContain("[enter for yes]");
      expect(result).toContain(green("●"));
    });

    test("formats default no prompt with gray styling", () => {
      const result = formatConfirmPrompt("Skip workspace setup?", false);

      expect(result).toContain("Skip workspace setup?");
      expect(result).toContain("y");
      expect(result).toContain("N");
      expect(result).toContain("[enter for no]");
      expect(result).toContain(gray("○"));
    });
  });

  describe("formatChoiceList", () => {
    test("formats choice list with yellow bordered box", () => {
      const choices = [
        { name: "Option A", value: "a" },
        { name: "Option B", value: "b" },
      ];
      const result = formatChoiceList("Choose an option:", choices);

      expect(result).toContain("Choose an option:");
      expect(stripAnsi(result)).toContain("1. Option A");
      expect(stripAnsi(result)).toContain("2. Option B");
      expect(result).toContain(yellow("Configuration"));
      expect(result).toContain("┌");
      expect(result).toContain("└");
    });

    test("numbers choices with cyan color", () => {
      const choices = [{ name: "Test Option", value: "test" }];
      const result = formatChoiceList("Test:", choices);

      expect(result).toContain(cyan("1."));
    });
  });

  describe("formatChoicePrompt", () => {
    test("formats choice input prompt with cyan arrow", () => {
      const result = formatChoicePrompt();

      expect(result).toContain(cyan("▶"));
      expect(result).toContain("Enter your choice");
      expect(result).toContain(gray("(number)"));
    });
  });

  describe("formatInputPrompt", () => {
    test("formats input prompt with default value hint", () => {
      const result = formatInputPrompt("Enter name", "default-name");

      expect(result).toContain("Enter name");
      expect(result).toContain(cyan("◆"));
      expect(result).toContain(gray('[enter for "default-name"]'));
    });

    test("formats input prompt without default value", () => {
      const result = formatInputPrompt("Enter name");

      expect(result).toContain("Enter name");
      expect(result).toContain(cyan("◆"));
      expect(result).not.toContain("[enter for");
    });
  });

  describe("formatStepHeader", () => {
    test("formats step header with yellow border and step number", () => {
      const result = formatStepHeader(2, "Security Configuration");

      expect(result).toContain("Step 2:");
      expect(result).toContain("Security Configuration");
      expect(result).toContain(cyan("▶ Step 2:"));
      expect(result).toContain("┌");
      expect(result).toContain("└");
    });
  });

  describe("formatInfo", () => {
    test("formats info message with gray styling and icon", () => {
      const result = formatInfo("No workspaces detected");

      expect(stripAnsi(result)).toContain("No workspaces detected");
      expect(result).toContain(ICON.info);
      expect(result.startsWith("   ")).toBe(true); // Should be indented
    });
  });

  describe("formatSuccess", () => {
    test("formats success message with green check icon", () => {
      const result = formatSuccess("Configuration saved");

      expect(result).toContain("Configuration saved");
      expect(result).toContain(green(ICON.CHECK));
    });
  });

  describe("formatWarning", () => {
    test("formats warning message with yellow warning icon", () => {
      const result = formatWarning("Token not provided");

      expect(result).toContain("Token not provided");
      expect(result).toContain(yellow(ICON.warning));
    });
  });

  describe("formatCompletion", () => {
    test("formats completion box with next steps", () => {
      const steps = [
        "Run pastoralist to update dependencies",
        "Check documentation for options",
      ];
      const result = formatCompletion("Setup complete!", steps);

      expect(stripAnsi(result)).toContain("✓ Setup complete!");
      expect(stripAnsi(result)).toContain("1. Run pastoralist to upd");
      expect(stripAnsi(result)).toContain("2. Check documentation fo");
      expect(result).toContain(yellow("Next Steps"));
    });

    test("formats completion box with custom shimmer title", () => {
      const steps = ["Next step"];
      const shimmerTitle = "Shimmering completion!";
      const result = formatCompletion("Regular title", steps, shimmerTitle);

      expect(result).toContain("Shimmering completion!");
      expect(result).not.toContain("Regular title");
      expect(stripAnsi(result)).toContain("1. Next step");
    });

    test("applies yellow borders to completion box", () => {
      const steps = ["Test step"];
      const result = formatCompletion("Test", steps);

      // Should contain yellow border characters
      expect(result).toMatch(/\[\d+m┌/); // Yellow top border
      expect(result).toMatch(/\[\d+m└/); // Yellow bottom border
    });
  });
});