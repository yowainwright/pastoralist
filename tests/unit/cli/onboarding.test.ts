import { describe, expect, test } from "bun:test";
import { buildOnboardingText } from "../../../src/cli/onboarding";

describe("cli onboarding", () => {
  test("buildOnboardingText includes human usage", () => {
    const text = buildOnboardingText();

    expect(text).toContain("Pastoralist onboarding");
    expect(text).toContain("Human quick start");
    expect(text).toContain("npx pastoralist doctor");
    expect(text).toContain("npx pastoralist --init");
    expect(text).toContain("npx pastoralist --setup-hook");
  });

  test("buildOnboardingText includes agent scripts", () => {
    const text = buildOnboardingText();

    expect(text).toContain("Agent quick setup");
    expect(text).toContain("pastoralist-setup-skill");
    expect(text).toContain("pastoralist-setup-local-dev --dry-run");
    expect(text).toContain("--agent codex --skills all --hooks git,postinstall");
    expect(text).toContain("--agent claude --skills all --hooks git,postinstall");
  });

  test("buildOnboardingText includes agent prompts", () => {
    const text = buildOnboardingText();

    expect(text).toContain("Prompt for a setup agent");
    expect(text).toContain("Set up Pastoralist in this repository.");
    expect(text).toContain("Prompt for a maintenance agent");
    expect(text).toContain("Review this repository's Pastoralist setup.");
  });

  test("buildOnboardingText includes the agent loop", () => {
    const text = buildOnboardingText();

    expect(text).toContain("Agent setup loop");
    expect(text).toContain("Apply the smallest needed setup command.");
    expect(text).toContain("Report changed files and remaining manual steps.");
  });

  test("buildOnboardingText includes GitHub Action setup", () => {
    const text = buildOnboardingText();

    expect(text).toContain("GitHub Action setup");
    expect(text).toContain(".github/workflows/pastoralist.yml");
    expect(text).toContain("uses: yowainwright/pastoralist@v1");
  });
});
