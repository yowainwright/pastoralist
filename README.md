# [Pastoralist](https://jeffry.in/pastoralist/)

[![npm version](https://img.shields.io/npm/v/pastoralist.svg)](https://www.npmjs.com/package/pastoralist)
[![npm downloads](https://img.shields.io/npm/dm/pastoralist.svg)](https://www.npmjs.com/package/pastoralist)
[![TypeScript](https://img.shields.io/badge/TypeScript-types%20included-blue)](https://www.typescriptlang.org/)
![CI](https://github.com/yowainwright/pastoralist/actions/workflows/ci.yml/badge.svg)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/yowainwright/pastoralist/badge)](https://scorecard.dev/viewer/?uri=github.com/yowainwright/pastoralist)
[![codecov](https://codecov.io/gh/yowainwright/pastoralist/branch/main/graph/badge.svg)](https://codecov.io/gh/yowainwright/pastoralist)
[![GitHub stars](https://img.shields.io/github/stars/yowainwright/pastoralist?style=social)](https://github.com/yowainwright/pastoralist)
<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=6f41d7dd-fce9-49ea-ae43-040a51f458bd" />

Pastoralist is an audit trail for package manager overrides.

Overrides often start as real fixes: a CVE patch, a compatibility pin, a fork,
or a temporary transitive dependency workaround. Months later, the override is
still in `package.json`, but the reason is usually somewhere else.

Pastoralist keeps the package-manager instruction where it belongs and adds the
missing review record: why the override exists, which packages still need it,
which security provider found it, and when it can be removed.

<!-- first-run CLI commands from src/cli/parser/constants.ts and src/cli/onboarding/ -->

## Quick Start

Start with a read-only check:

```bash
npx pastoralist doctor
```

For first-run guidance across local use, agents, and CI:

```bash
npx pastoralist onboard
```

The onboarding output includes quick scripts and copy/paste prompts for agents.
See the [Onboarding guide](https://jeffry.in/pastoralist/docs/onboarding) for
the same checklist in the docs.

Set up the Pastoralist agent skill in a repo:

```bash
npx pastoralist --init agent-skill
```

Set up local dev with selected skills and hooks:

```bash
npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
```

When you are ready to add it to the project:

```bash
npm install pastoralist --save-dev
npx pastoralist init
npx pastoralist
```

Optionally keep the appendix current after installs:

```json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
```

Pastoralist can add that hook for you:

```bash
npx pastoralist --setup-hook
```

## Why It Exists

Package managers already know how to force a version:

```json
{
  "overrides": {
    "qs": "6.11.2"
  }
}
```

That may be exactly the right fix. The missing part is the operational record.
Pastoralist adds one without moving the override:

```json
{
  "overrides": {
    "qs": "6.11.2"
  },
  "pastoralist": {
    "appendix": {
      "qs@6.11.2": {
        "dependents": {
          "express": "qs@6.11.0"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Pin qs while upstream dependencies adopt the patched version.",
          "source": "manual"
        }
      }
    }
  }
}
```

The override controls installation. The appendix explains the decision.
When security checks run, the same ledger can include CVEs, severity, provider,
and patched-version metadata.

## What It Does

- Tracks npm and Bun `overrides`, pnpm `pnpm.overrides`, and Yarn `resolutions`
- Records why an override was added and which packages still depend on it
- Connects security metadata such as CVEs, severity, provider, and patched version
- Links `patch-package` files to the override entries they support
- Reports stale overrides and removes them only when you pass `--remove-unused`
- Reads workspace manifests and writes one consolidated root appendix
- Provides dry-run, summary, quiet, and JSON output for CI

<!-- public CLI commands from src/cli/parser/constants.ts -->

## Commands

| Command                                   | Purpose                                        |
| ----------------------------------------- | ---------------------------------------------- |
| `npx pastoralist onboard`                 | Show setup, agent, and GitHub Action guidance  |
| `npx pastoralist doctor`                  | Read-only setup and override health check      |
| `npx pastoralist init`                    | Initialize Pastoralist configuration           |
| `npx pastoralist --init agent-skill`      | Set up the Pastoralist agent skill             |
| `npx pastoralist`                         | Update the override appendix                   |
| `npx pastoralist --dry-run`               | Preview package.json changes                   |
| `npx pastoralist --remove-unused`         | Remove overrides no package still needs        |
| `npx pastoralist --checkSecurity`         | Check advisories with the default OSV provider |
| `npx pastoralist --quiet --checkSecurity` | Minimal CI output and vulnerability exit code  |
| `npx pastoralist --summary`               | Print package, override, and security metrics  |

## Setup Helpers

| Command                                                                               | Purpose                              |
| ------------------------------------------------------------------------------------- | ------------------------------------ |
| `npx pastoralist --init agent-skill`                                                  | Set up the Pastoralist agent skill   |
| `npx -p pastoralist pastoralist-setup-local-dev --help`                               | Show local dev setup options         |
| `npx -p pastoralist pastoralist-setup-local-dev --dry-run`                            | Preview agent, skill, and hook setup |
| `npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall` | Set up skills and hooks              |

## Configuration

Pastoralist can use `package.json`, `.pastoralistrc`, `.pastoralistrc.json`,
`pastoralist.json`, `pastoralist.config.cjs`, `pastoralist.config.js`, or
`pastoralist.config.mjs`. External JSON config files use top-level settings;
`package.json` keeps settings under `pastoralist`.

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

See [Configuration](https://jeffry.in/pastoralist/docs/configuration) and
[Workspaces](https://jeffry.in/pastoralist/docs/workspaces) for the full setup
surface.

## GitHub Action

Check override tracking on pull requests:

```yaml
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
```

The action can also run security checks, update files, or open scheduled
maintenance PRs. See the
[GitHub Action docs](https://jeffry.in/pastoralist/docs/github-action).

## Security and Release Assurance

Pastoralist can write to `package.json`, so the package should be boring to
verify.

- Releases are published from GitHub Actions with npm provenance
- Published tarballs are packed before release and attached to GitHub Releases
  with artifact attestations
- CI runs CodeQL, OpenSSF Scorecard, unit, integration, e2e, and dependency
  policy checks

You can verify registry signatures from your project:

```bash
npm audit signatures
```

## Docs

- [Why Pastoralist](https://jeffry.in/why-pastoralist/)
- [Setup](https://jeffry.in/pastoralist/docs/setup)
- [Onboarding](https://jeffry.in/pastoralist/docs/onboarding)
- [Configuration](https://jeffry.in/pastoralist/docs/configuration)
- [Security](https://jeffry.in/pastoralist/docs/security)
- [Workspaces](https://jeffry.in/pastoralist/docs/workspaces)
- [GitHub Action](https://jeffry.in/pastoralist/docs/github-action)
- [API Reference](https://jeffry.in/pastoralist/docs/api-reference)
- [Architecture](https://jeffry.in/pastoralist/docs/architecture)

## Thanks

Shout out to [Bryant Cabrera](https://github.com/bryantcabrera) and
[Mardin](https://github.com/mardinyadegar) for the conversation, insight, and
pairing around this topic.

Made by [@yowainwright](https://github.com/yowainwright). [MIT](./LICENSE), 2022.
