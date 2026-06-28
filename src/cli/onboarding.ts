const INITIAL_USAGE_LINES = [
  "Initial usage",
  "",
  "1. Inspect the project without writing files:",
  "   npx pastoralist doctor",
  "2. Add Pastoralist and create config:",
  "   npm install pastoralist --save-dev",
  "   npx pastoralist --init",
  "3. Update the override appendix:",
  "   npx pastoralist",
  "4. Keep it current after installs:",
  "   npx pastoralist --setup-hook",
] as const;

const AGENT_SETUP_LINES = [
  "Agent setup",
  "",
  "1. Add project instructions for coding agents:",
  "   AGENTS.md",
  "2. Add local Codex config when Codex is the active agent:",
  "   .codex/config.toml",
  "3. Add reusable skills where your agent expects them:",
  "   .agents/skills/",
  "4. Install the Pastoralist skill:",
  "   npx -p pastoralist pastoralist-setup-skill",
  "5. Set up local dev with selected skills and hooks:",
  "   npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall",
  "6. Optional readability loop:",
  "   npx eslint-plugin-legibility-install-skill --target codex",
] as const;

const GITHUB_ACTION_LINES = [
  "GitHub Action setup",
  "",
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
] as const;

const NEXT_COMMAND_LINES = [
  "Useful commands",
  "",
  "npx pastoralist --dry-run",
  "npx pastoralist --summary",
  "npx pastoralist --checkSecurity",
  "npx pastoralist --remove-unused",
] as const;

const joinSection = (lines: readonly string[]): string => lines.join("\n");

export const buildOnboardingText = (): string => {
  const sections = [
    "Pastoralist onboarding",
    joinSection(INITIAL_USAGE_LINES),
    joinSection(AGENT_SETUP_LINES),
    joinSection(GITHUB_ACTION_LINES),
    joinSection(NEXT_COMMAND_LINES),
  ];

  return sections.join("\n\n");
};

export const showOnboarding = (): void => {
  console.log(buildOnboardingText());
};
