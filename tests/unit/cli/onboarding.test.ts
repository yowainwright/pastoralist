import { describe, expect, test } from "bun:test";
import { buildOnboardingText } from "../../../src/cli/onboarding";

describe("cli onboarding", () => {
  test("buildOnboardingText includes initial usage", () => {
    const text = buildOnboardingText();

    expect(text).toContain("Pastoralist onboarding");
    expect(text).toContain("npx pastoralist doctor");
    expect(text).toContain("npx pastoralist --init");
    expect(text).toContain("npx pastoralist --setup-hook");
  });

  test("buildOnboardingText includes agent setup", () => {
    const text = buildOnboardingText();

    expect(text).toContain("Agent setup");
    expect(text).toContain("AGENTS.md");
    expect(text).toContain(".codex/config.toml");
    expect(text).toContain(".agents/skills/");
    expect(text).toContain("pastoralist-setup-skill");
    expect(text).toContain("pastoralist-setup-local-dev");
  });

  test("buildOnboardingText includes GitHub Action setup", () => {
    const text = buildOnboardingText();

    expect(text).toContain("GitHub Action setup");
    expect(text).toContain(".github/workflows/pastoralist.yml");
    expect(text).toContain("uses: yowainwright/pastoralist@v1");
  });
});
