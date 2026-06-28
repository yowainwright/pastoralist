var e=`---
title: Onboarding
description: "First-run checklist for local use, agent setup, and CI"
---

Use onboarding when you are adding Pastoralist to a repo for the first time or
when you want a repeatable setup path for contributors and agents.

## Start Read-Only

Check the current project without writing files:

\`\`\`bash
npx pastoralist doctor
\`\`\`

Print the full checklist from the CLI:

\`\`\`bash
npx pastoralist onboard
\`\`\`

## Add Project Setup

Install Pastoralist and create the initial config:

\`\`\`bash
npm install pastoralist --save-dev
npx pastoralist --init
\`\`\`

Update the appendix once the config is in place:

\`\`\`bash
npx pastoralist
\`\`\`

Keep it current after dependency installs:

\`\`\`bash
npx pastoralist --setup-hook
\`\`\`

## Add Agent Setup

Install only the bundled Pastoralist skill:

\`\`\`bash
npx -p pastoralist pastoralist-setup-skill
\`\`\`

Preview local dev setup before writing files:

\`\`\`bash
npx -p pastoralist pastoralist-setup-local-dev --dry-run
\`\`\`

Set up agent config, bundled skills, and local hooks:

\`\`\`bash
npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
\`\`\`

The local dev setup script auto-detects Codex or Claude when possible. You can
pin the target explicitly:

\`\`\`bash
npx -p pastoralist pastoralist-setup-local-dev --agent codex
npx -p pastoralist pastoralist-setup-local-dev --agent claude
\`\`\`

## Copy/Paste Prompts

Use this prompt when you want an agent to do the setup:

\`\`\`text
Set up Pastoralist in this repository.
Start with \`npx pastoralist doctor\` and inspect the current package manager setup.
Run \`npx -p pastoralist pastoralist-setup-local-dev --dry-run\` before writing files.
Configure the Pastoralist skill, local agent config, GitHub Action, and postinstall hook only when appropriate.
Keep changes scoped to setup files, docs, and tests.
\`\`\`

Use this prompt when you want an agent to review an existing setup:

\`\`\`text
Review this repository's Pastoralist setup.
Run \`npx pastoralist --dry-run\` and summarize stale overrides, security checks, and missing setup.
Do not remove overrides unless \`npx pastoralist --remove-unused --dry-run\` shows they are unused.
If setup is missing, propose the smallest script, skill, hook, or GitHub Action change.
\`\`\`

## Agent Setup Loop

Use this loop when an agent owns the setup:

1. Run \`npx pastoralist doctor\`.
2. Run \`npx -p pastoralist pastoralist-setup-local-dev --dry-run\`.
3. Apply the smallest needed setup command.
4. Run \`npx pastoralist --dry-run\`.
5. Report changed files and remaining manual steps.

## Add CI

Create \`.github/workflows/pastoralist.yml\`:

\`\`\`yaml
name: Override Check
on: [pull_request]

jobs:
  pastoralist:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          check-security: false
\`\`\`

## Verify

Use these commands before merging setup changes:

\`\`\`bash
npx pastoralist --dry-run
npx pastoralist --summary
npx pastoralist --checkSecurity
\`\`\`
`;export{e as default};