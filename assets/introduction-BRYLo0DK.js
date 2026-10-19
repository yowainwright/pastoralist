var e=`---
title: Introduction to Pastoralist
description: "Pastoralist keeps dependency overrides explainable, current, and removable"
---

<div className="flex flex-wrap gap-2 mb-8">
  <a href="https://www.npmjs.com/package/pastoralist" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/v/pastoralist.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/pastoralist" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/dm/pastoralist.svg" alt="npm downloads" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer">
    <img
      src="https://img.shields.io/badge/TypeScript-types%20included-blue"
      alt="TypeScript types included"
    />
  </a>
</div>

Pastoralist tracks your dependency overrides: why they're there, which packages
need them, and when you can remove them.

It works with npm and Bun \`overrides\`, pnpm \`pnpm.overrides\` or
\`pnpm-workspace.yaml\` (pnpm 11+), and Yarn \`resolutions\`.

## Override Tracking

Running Pastoralist adds an appendix entry to an existing override:

<ScrollyCode example="tracking" />

This output was generated from a fixture with an \`express → qs\` dependency.
Your dependents and dates reflect your project. Add a ledger \`reason\` when
you want to record a decision that the dependency tree cannot explain.

## What Pastoralist Handles

- Shows which direct or workspace packages still depend on each override
- Removes stale overrides with \`--remove-unused\`
- Links \`patch-package\` files to the overrides they support
- Checks security advisories with OSV, GitHub Dependabot alerts, npm audit,
  Snyk, Socket, or Spektion
- Supports monorepos through \`workspaces\`, \`depPaths\`, \`overridePaths\`, and
  \`resolutionPaths\`
- Provides CI-friendly output with \`--dry-run\`, \`--quiet\`, \`--summary\`, and
  \`--outputFormat json\`

## Requirements

Use Node.js 20.19 or newer. Security scanning is optional; OSV is the default
provider when scanning is enabled and requires no token.

## Start Here

\`\`\`bash
npm install pastoralist --save-dev
npx pastoralist init
\`\`\`

Then add it to \`postinstall\`:

\`\`\`json title="package.json" {3}
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

Continue with the [setup guide](/docs/setup), or try a sandbox:

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>
`;export{e as default};