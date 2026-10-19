var e=`---
title: Workspaces & Monorepos
description: Track root overrides and the workspace packages that need them
---

Pastoralist tracks root overrides and reads workspace manifests to identify
which packages depend on each overridden dependency.

## Root Overrides

npm reads overrides only from the root \`package.json\`. Overrides in workspace
packages do not affect npm's dependency resolution.
See [npm's override rules](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides).

Keep shared overrides at the root and use \`depPaths\` to include workspace
dependency context:

\`\`\`json title="package.json"
{
  "name": "my-monorepo",
  "workspaces": ["packages/*", "apps/*"],
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  }
}
\`\`\`

Run Pastoralist from the root:

\`\`\`bash
npx pastoralist
\`\`\`

Pastoralist reads workspace manifests to find dependents and writes the
appendix to the configured target, usually the root manifest.

## Dependency Paths

\`"workspace"\` and \`"workspaces"\` read workspace patterns from both
\`package.json#workspaces\` and \`pnpm-workspace.yaml\`.
Yarn's \`workspaces: { "packages": [...] }\` form is also supported.

For other layouts, configure explicit manifest globs:

\`\`\`json title="package.json"
{
  "pastoralist": {
    "depPaths": ["packages/*/package.json", "apps/*/package.json"]
  }
}
\`\`\`

Or pass them for one run:

\`\`\`bash
npx pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
\`\`\`

CLI paths take precedence over configured paths. Use \`--ignore\` to exclude
generated or vendored manifests.

## pnpm Workspaces

pnpm 11+ stores overrides in the root \`pnpm-workspace.yaml\`:

\`\`\`yaml title="pnpm-workspace.yaml"
packages:
  - "packages/*"
  - "apps/*"
overrides:
  lodash: "4.17.21"
\`\`\`

Configure Pastoralist in \`package.json\`:

\`\`\`json title="package.json"
{
  "packageManager": "pnpm@11.0.0",
  "pastoralist": {
    "depPaths": "workspace"
  }
}
\`\`\`

Pastoralist selects the YAML override source when it already contains
overrides or the declared or lockfile-resolved pnpm version is 11 or newer.
For earlier pnpm versions, it also supports \`package.json#pnpm.overrides\`.

If the pnpm version cannot be resolved, pin an exact \`packageManager\`
version or set \`pastoralist.overrideSource\` explicitly.

## Yarn Workspaces

Keep resolutions at the root:

\`\`\`json title="package.json"
{
  "private": true,
  "workspaces": {
    "packages": ["packages/*"]
  },
  "resolutions": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  }
}
\`\`\`

## Parent-Specific npm Overrides

Use a nested root override when a transitive dependency needs a version
under one parent:

\`\`\`json title="package.json"
{
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
\`\`\`

\`--path\` selects a manifest in another project. It does not make npm honor
overrides inside a workspace package.

## Security Checks

Workspace paths configured through \`depPaths\` are included when security
scanning is enabled. \`--hasWorkspaceSecurityChecks\` also enables discovered
workspace paths:

\`\`\`bash
npx pastoralist --checkSecurity --hasWorkspaceSecurityChecks --dry-run
\`\`\`

See [Security](/docs/security) for providers and fix options.

## CI

Check tracking without writing files:

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    mode: check
    check-security: false
    fail-on-unused: true
    dep-paths: "packages/*/package.json apps/*/package.json"
\`\`\`

## Troubleshooting

If an override appears unused, confirm that \`depPaths\` includes the
manifests that depend on it. Use explicit globs to narrow large scans and
\`--debug\` to inspect dependency resolution.

If multiple appendixes describe the same shared override, run Pastoralist
once at the root with workspace paths configured.
`;export{e as default};