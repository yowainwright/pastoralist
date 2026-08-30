import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildOnboardingText, showOnboarding } from "../../../src/cli/cmds/init";

describe("cli onboarding", () => {
  test("buildOnboardingText includes human usage", () => {
    const text = buildOnboardingText();

    assert.ok(text.includes("Pastoralist onboarding"));
    assert.ok(text.includes("Human quick start"));
    assert.ok(text.includes("npx pastoralist doctor"));
    assert.ok(text.includes("npx pastoralist --init"));
    assert.ok(text.includes("npx pastoralist --setup-hook"));
  });

  test("buildOnboardingText includes agent scripts", () => {
    const text = buildOnboardingText();

    assert.ok(text.includes("Agent quick setup"));
    assert.ok(text.includes("npx pastoralist --init agent-skill"));
    assert.ok(text.includes("pnpm run setup:local-dev -- --dry-run"));
    assert.ok(text.includes("--agent codex --skills all --hooks git,postinstall"));
    assert.ok(text.includes("--agent claude --skills all --hooks git,postinstall"));
  });

  test("buildOnboardingText includes agent prompts", () => {
    const text = buildOnboardingText();

    assert.ok(text.includes("Prompt for a setup agent"));
    assert.ok(text.includes("Set up Pastoralist in this repository."));
    assert.ok(text.includes("Prompt for a maintenance agent"));
    assert.ok(text.includes("Review this repository's Pastoralist setup."));
  });

  test("buildOnboardingText includes the agent loop", () => {
    const text = buildOnboardingText();

    assert.ok(text.includes("Agent setup loop"));
    assert.ok(text.includes("Apply the smallest needed setup command."));
    assert.ok(text.includes("Report changed files and remaining manual steps."));
  });

  test("buildOnboardingText includes GitHub Action setup", () => {
    const text = buildOnboardingText();

    assert.ok(text.includes("GitHub Action setup"));
    assert.ok(text.includes(".github/workflows/pastoralist.yml"));
    assert.ok(text.includes("uses: yowainwright/pastoralist@v1"));
  });

  test("showOnboarding prints the onboarding text", () => {
    const originalLog = console.log;
    const logged: string[] = [];
    console.log = (message: string) => logged.push(message);

    try {
      showOnboarding();
    } finally {
      console.log = originalLog;
    }

    assert.deepStrictEqual(logged, [buildOnboardingText()]);
  });
});
