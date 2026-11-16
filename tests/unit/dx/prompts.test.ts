import { assertMatches, stringContaining, notStringContaining } from "../setup";
import { test } from "node:test";
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
import { green, cyan, gray, yellow } from "../../../src/dx/utils";
import { ICON } from "../../../src/constants";
import { ANSI_PATTERN } from "../../../src/dx/constants";
const stripAnsi = (str: string): string => str.replace(ANSI_PATTERN, "");
test("Enhanced Prompt UI Components / formatConfirmPrompt / formats default yes prompt with green styling", () => {
  const result = formatConfirmPrompt("Enable security scanning?", true);
  assertMatches(result, stringContaining("Enable security scanning?"));
  assertMatches(result, stringContaining("Y"));
  assertMatches(result, stringContaining("n"));
  assertMatches(result, stringContaining("[enter for yes]"));
  assertMatches(result, stringContaining(green("●")));
});
test("Enhanced Prompt UI Components / formatConfirmPrompt / formats default no prompt with gray styling", () => {
  const result = formatConfirmPrompt("Skip workspace setup?", false);
  assertMatches(result, stringContaining("Skip workspace setup?"));
  assertMatches(result, stringContaining("y"));
  assertMatches(result, stringContaining("N"));
  assertMatches(result, stringContaining("[enter for no]"));
  assertMatches(result, stringContaining(gray("○")));
});
test("Enhanced Prompt UI Components / formatChoiceList / formats choice list with yellow bordered box", () => {
  const choices = [
    { name: "Option A", value: "a" },
    { name: "Option B", value: "b" },
  ];
  const result = formatChoiceList("Choose an option:", choices);
  assertMatches(result, stringContaining("Choose an option:"));
  assertMatches(stripAnsi(result), stringContaining("1. Option A"));
  assertMatches(stripAnsi(result), stringContaining("2. Option B"));
  assertMatches(result, stringContaining(yellow("Configuration")));
  assertMatches(result, stringContaining("┌"));
  assertMatches(result, stringContaining("└"));
});
test("Enhanced Prompt UI Components / formatChoiceList / numbers choices with cyan color", () => {
  const choices = [{ name: "Test Option", value: "test" }];
  const result = formatChoiceList("Test:", choices);
  assertMatches(result, stringContaining(cyan("1.")));
});
test("Enhanced Prompt UI Components / formatChoiceList / uses an explicit terminal width when provided", () => {
  const result = formatChoiceList("Test:", [{ name: "Option", value: "option" }], 40);
  const topBorder = stripAnsi(result).split("\n")[0];
  assert.strictEqual(topBorder?.length, 36);
});
test("Enhanced Prompt UI Components / formatChoicePrompt / formats choice input prompt with cyan arrow", () => {
  const result = formatChoicePrompt();
  assertMatches(result, stringContaining(cyan("▶")));
  assertMatches(result, stringContaining("Enter your choice"));
  assertMatches(result, stringContaining(gray("(number)")));
});
test("Enhanced Prompt UI Components / formatInputPrompt / formats input prompt with default value hint", () => {
  const result = formatInputPrompt("Enter name", "default-name");
  assertMatches(result, stringContaining("Enter name"));
  assertMatches(result, stringContaining(cyan("◆")));
  assertMatches(result, stringContaining(gray('[enter for "default-name"]')));
});
test("Enhanced Prompt UI Components / formatInputPrompt / formats input prompt without default value", () => {
  const result = formatInputPrompt("Enter name");
  assertMatches(result, stringContaining("Enter name"));
  assertMatches(result, stringContaining(cyan("◆")));
  assertMatches(result, notStringContaining("[enter for"));
});
test("Enhanced Prompt UI Components / formatStepHeader / formats step header with yellow border and step number", () => {
  const result = formatStepHeader(2, "Security Configuration");
  assertMatches(result, stringContaining("Step 2:"));
  assertMatches(result, stringContaining("Security Configuration"));
  assertMatches(result, stringContaining(cyan("▶ Step 2:")));
  assertMatches(result, stringContaining("┌"));
  assertMatches(result, stringContaining("└"));
});
test("Enhanced Prompt UI Components / formatInfo / formats info message with gray styling and icon", () => {
  const result = formatInfo("No workspaces detected");
  assertMatches(stripAnsi(result), stringContaining("No workspaces detected"));
  assertMatches(result, stringContaining(ICON.info));
  assert.strictEqual(result.startsWith("   "), true);
});
test("Enhanced Prompt UI Components / formatSuccess / formats success message with green check icon", () => {
  const result = formatSuccess("Configuration saved");
  assertMatches(result, stringContaining("Configuration saved"));
  assertMatches(result, stringContaining(green(ICON.CHECK)));
});
test("Enhanced Prompt UI Components / formatWarning / formats warning message with yellow warning icon", () => {
  const result = formatWarning("Token not provided");
  assertMatches(result, stringContaining("Token not provided"));
  assertMatches(result, stringContaining(yellow(ICON.warning)));
});
test("Enhanced Prompt UI Components / formatCompletion / formats completion box with next steps", () => {
  const steps = ["Run pastoralist to update dependencies", "Check documentation for options"];
  const result = formatCompletion("Setup complete!", steps);
  assertMatches(stripAnsi(result), stringContaining("✓ Setup complete!"));
  assertMatches(stripAnsi(result), stringContaining("1. Run pastoralist to upd"));
  assertMatches(stripAnsi(result), stringContaining("2. Check documentation fo"));
  assertMatches(result, stringContaining(yellow("Next Steps")));
});
test("Enhanced Prompt UI Components / formatCompletion / formats completion box with custom shimmer title", () => {
  const steps = ["Next step"];
  const shimmerTitle = "Shimmering completion!";
  const result = formatCompletion("Regular title", steps, shimmerTitle);
  assertMatches(result, stringContaining("Shimmering completion!"));
  assertMatches(result, notStringContaining("Regular title"));
  assertMatches(stripAnsi(result), stringContaining("1. Next step"));
});
test("Enhanced Prompt UI Components / formatCompletion / applies yellow borders to completion box", () => {
  const steps = ["Test step"];
  const result = formatCompletion("Test", steps);
  assert.match(result, /\[\d+m┌/);
  assert.match(result, /\[\d+m└/);
});
