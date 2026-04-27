# [Pastoralist](https://jeffry.in/pastoralist/)

[![npm version](https://img.shields.io/npm/v/pastoralist.svg)](https://www.npmjs.com/package/pastoralist)
[![npm downloads](https://img.shields.io/npm/dm/pastoralist.svg)](https://www.npmjs.com/package/pastoralist)
![CI](https://github.com/yowainwright/pastoralist/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/yowainwright/pastoralist/branch/main/graph/badge.svg)](https://codecov.io/gh/yowainwright/pastoralist)
[![GitHub stars](https://img.shields.io/github/stars/yowainwright/pastoralist?style=social)](https://github.com/yowainwright/pastoralist)
[![TypeScript](https://img.shields.io/badge/TypeScript-types%20included-blue)](https://www.typescriptlang.org/)
<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=6f41d7dd-fce9-49ea-ae43-040a51f458bd" />

Pastoralist keeps dependency overrides explainable, current, and removable.

If your `package.json` has `overrides` or `resolutions`, Pastoralist records why
they exist, which packages still need them, and when they can be removed. It can
also connect security fixes, patch files, workspaces, and CI checks to the same
audit trail.

## Quick Start

```bash
npm install pastoralist --save-dev
npx pastoralist --init
```

Add it to `postinstall` so the appendix stays current after installs:

```json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
```

Or let Pastoralist add the hook for you:

```bash
npx pastoralist --setup-hook
```

## Why It Exists

Overrides are useful, but they usually lose context:

```json
{
  "overrides": {
    "lodash": "4.17.21"
  }
}
```

Pastoralist adds the missing record:

```json
{
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "my-app": "lodash@^4.17.0"
        },
        "ledger": {
          "reason": "Security vulnerability CVE-2021-23337",
          "securityProvider": "osv",
          "keep": true
        }
      }
    }
  }
}
```

The fix is not just the version. The fix is the record of why that version exists.

## What It Handles

- Tracks npm and Bun `overrides`, pnpm `pnpm.overrides`, and Yarn
  `resolutions`
- Shows which direct or workspace packages still depend on each override
- Cleans stale overrides with `--remove-unused`
- Links `patch-package` patch files to the overrides they support
- Checks security advisories with OSV, GitHub Dependabot alerts, npm audit,
  Snyk, Socket, or Spektion
- Supports monorepos through `workspaces`, `depPaths`, `overridePaths`, and
  `resolutionPaths`
- Provides CI-friendly output with `--dry-run`, `--quiet`, `--summary`, and
  `--outputFormat json`

## At A Glance

| Area               | Details                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| Package managers   | npm, pnpm, Yarn, Bun                                                           |
| Runtime            | Node 20+                                                                       |
| Security default   | OSV, no token required                                                         |
| Optional providers | GitHub, npm audit, Snyk, Socket, Spektion                                      |
| Monorepos          | Auto-detects `workspaces`; accepts explicit package globs                      |
| CI                 | CLI flags plus a GitHub Action                                                 |
| Test surface       | 1,700+ test cases across unit, integration, and e2e fixtures                   |
| Live package stats | npm version, monthly downloads, CI, coverage, and GitHub stars are shown above |

## Common Commands

```bash
# Update the appendix
npx pastoralist

# Preview package.json changes
npx pastoralist --dry-run

# Remove overrides no package still needs
npx pastoralist --remove-unused

# Check advisories with the default OSV provider
npx pastoralist --checkSecurity

# Fail CI on security check errors
npx pastoralist --checkSecurity --strict

# Minimal CI output; exits 1 when vulnerabilities are found
npx pastoralist --quiet --checkSecurity

# Print package, override, and vulnerability metrics
npx pastoralist --summary
```

## Minimal Config

Pastoralist can be configured in `package.json`, `.pastoralistrc.json`,
`pastoralist.config.js`, or `pastoralist.config.ts`.

```json
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
```

For full options, see
[Configuration](https://jeffry.in/pastoralist/docs/configuration).

## GitHub Action

```yaml
name: Override Check
on: [pull_request]

jobs:
  pastoralist:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          fail-on-security: true
```

The action can validate, update files, or open maintenance PRs. See the
[GitHub Action docs](https://jeffry.in/pastoralist/docs/github-action) or
[ACTION.md](.github/ACTION.md).

## Docs

- [Setup](https://jeffry.in/pastoralist/docs/setup)
- [API Reference](https://jeffry.in/pastoralist/docs/api-reference)
- [Configuration](https://jeffry.in/pastoralist/docs/configuration)
- [Security](https://jeffry.in/pastoralist/docs/security)
- [Workspaces](https://jeffry.in/pastoralist/docs/workspaces)
- [Architecture](https://jeffry.in/pastoralist/docs/architecture)

## Thanks

Shout out to [Bryant Cabrera](https://github.com/bryantcabrera) and
[Mardin](https://github.com/mardinyadegar) for the conversation, insight, and
pairing around this topic.

Made by [@yowainwright](https://github.com/yowainwright). [O'Sassy](https://osaasy.dev), 2022.
