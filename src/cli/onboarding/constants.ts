import type { OnboardingSection } from "./types";

export const ONBOARDING_TITLE = "Pastoralist onboarding";

export const ONBOARDING_SECTIONS: readonly OnboardingSection[] = [
  {
    title: "Human quick start",
    lines: [
      "1. Inspect the project without writing files:",
      "   npx pastoralist doctor",
      "2. Add Pastoralist and create config:",
      "   npm install pastoralist --save-dev",
      "   npx pastoralist --init",
      "3. Update the override appendix:",
      "   npx pastoralist",
      "4. Keep it current after installs:",
      "   npx pastoralist --setup-hook",
    ],
  },
  {
    title: "Agent quick setup",
    lines: [
      "1. Install only the Pastoralist skill:",
      "   npx -p pastoralist pastoralist-setup-skill",
      "2. Preview local dev setup:",
      "   npx -p pastoralist pastoralist-setup-local-dev --dry-run",
      "3. Set up Codex with skills and hooks:",
      "   npx -p pastoralist pastoralist-setup-local-dev --agent codex --skills all --hooks git,postinstall",
      "4. Set up Claude with skills and hooks:",
      "   npx -p pastoralist pastoralist-setup-local-dev --agent claude --skills all --hooks git,postinstall",
    ],
  },
  {
    title: "Prompt for a setup agent",
    lines: [
      "Set up Pastoralist in this repository.",
      "Start with `npx pastoralist doctor` and inspect the current package manager setup.",
      "Run `npx -p pastoralist pastoralist-setup-local-dev --dry-run` before writing files.",
      "Configure the Pastoralist skill, local agent config, GitHub Action, and postinstall hook only when appropriate.",
      "Keep changes scoped to setup files, docs, and tests.",
    ],
  },
  {
    title: "Prompt for a maintenance agent",
    lines: [
      "Review this repository's Pastoralist setup.",
      "Run `npx pastoralist --dry-run` and summarize stale overrides, security checks, and missing setup.",
      "Do not remove overrides unless `npx pastoralist --remove-unused --dry-run` shows they are unused.",
      "If setup is missing, propose the smallest script, skill, hook, or GitHub Action change.",
    ],
  },
  {
    title: "Agent setup loop",
    lines: [
      "1. Run `npx pastoralist doctor`.",
      "2. Run `npx -p pastoralist pastoralist-setup-local-dev --dry-run`.",
      "3. Apply the smallest needed setup command.",
      "4. Run `npx pastoralist --dry-run`.",
      "5. Report changed files and remaining manual steps.",
    ],
  },
  {
    title: "GitHub Action setup",
    lines: [
      "Create .github/workflows/pastoralist.yml:",
      "",
      "```yaml",
      "name: Override Check",
      "on: [pull_request]",
      "jobs:",
      "  pastoralist:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v6.0.2",
      "      - uses: yowainwright/pastoralist@v1",
      "        with:",
      "          mode: check",
      "          check-security: false",
      "```",
    ],
  },
  {
    title: "Useful commands",
    lines: [
      "npx pastoralist --dry-run",
      "npx pastoralist --summary",
      "npx pastoralist --checkSecurity",
      "npx pastoralist --remove-unused",
    ],
  },
];
