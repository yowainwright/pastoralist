const n=`---
title: Setup
description: "Install Pastoralist and keep your override appendix current"
---

## Install

Add Pastoralist as a dev dependency:

\`\`\`bash
npm install pastoralist --save-dev
\`\`\`

Other package managers work too:

\`\`\`bash
pnpm add pastoralist --save-dev
yarn add pastoralist --dev
bun add pastoralist --dev
\`\`\`

## Initialize

Run the guided setup:

\`\`\`bash
npx pastoralist --init
\`\`\`

The initializer can detect workspace packages, ask whether security checks
should run, and save the configuration in \`package.json\` or a config file.

For a simple project, you can also run Pastoralist directly:

\`\`\`bash
npx pastoralist
\`\`\`

It will scan your package manager overrides or resolutions, update the
\`pastoralist.appendix\`, and leave unrelated package fields alone.

## Add The Install Hook

Most projects should run Pastoralist after dependency installs:

\`\`\`json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

Pastoralist can add that hook automatically:

\`\`\`bash
npx pastoralist --setup-hook
\`\`\`

## Verify Changes

Preview the package.json update before writing anything:

\`\`\`bash
npx pastoralist --dry-run
\`\`\`

Print summary metrics for CI or release checks:

\`\`\`bash
npx pastoralist --summary
\`\`\`

Remove overrides that no package still depends on:

\`\`\`bash
npx pastoralist --remove-unused
\`\`\`

## Common Starting Config

For a workspace project with OSV security checks:

\`\`\`json
{
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": true,
    "security": {
      "provider": "osv",
      "severityThreshold": "medium",
      "hasWorkspaceSecurityChecks": true
    }
  }
}
\`\`\`

Next, read [Configuration](/docs/configuration) for all options or
[Workspaces & Monorepos](/docs/workspaces) for monorepo setup.
`;export{n as default};
