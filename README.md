# [Pastoralist](https://jeffry.in/pastoralist/)

[![npm version](https://img.shields.io/npm/v/pastoralist.svg)](https://www.npmjs.com/package/pastoralist)
[![npm downloads](https://img.shields.io/npm/dm/pastoralist.svg)](https://www.npmjs.com/package/pastoralist)
[![TypeScript](https://img.shields.io/badge/TypeScript-types%20included-blue)](https://www.typescriptlang.org/)
![CI](https://github.com/yowainwright/pastoralist/actions/workflows/ci.yml/badge.svg)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/yowainwright/pastoralist/badge)](https://scorecard.dev/viewer/?uri=github.com/yowainwright/pastoralist)
[![codecov](https://codecov.io/gh/yowainwright/pastoralist/branch/main/graph/badge.svg)](https://codecov.io/gh/yowainwright/pastoralist)
[![GitHub stars](https://img.shields.io/github/stars/yowainwright/pastoralist?style=social)](https://github.com/yowainwright/pastoralist)
<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=6f41d7dd-fce9-49ea-ae43-040a51f458bd" />

Pastoralist keeps package manager overrides from turning into mystery state.

I built it for the override that starts as a real fix, then sits in
`package.json` for months after everyone forgets why it exists. Pastoralist
keeps the override where your package manager expects it, and adds an appendix
that explains who still needs it, why it was added, and when it can go away.

It works with npm and Bun `overrides`, pnpm `pnpm.overrides`, Yarn
`resolutions`, patch files, workspaces, and security advisory fixes.

## Quick Start

```bash
npm install pastoralist --save-dev
npx pastoralist doctor
npx pastoralist --init
```

Add it to `postinstall` so the appendix is rebuilt on every install:

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

## What It Adds

Without Pastoralist, an override usually looks like this:

```json
{
  "overrides": {
    "lodash": "4.17.21"
  }
}
```

That may be exactly the right fix. The problem is that the reason is not in the
file. Pastoralist keeps the override intact and adds the missing record:

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
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Security vulnerability CVE-2021-23337",
          "source": "security",
          "securityProvider": "osv",
          "cves": ["CVE-2021-23337"],
          "severity": "high",
          "patchedVersion": "4.17.21",
          "keep": true
        }
      }
    }
  }
}
```

The version is only half the fix. The other half is knowing why that version is
there.

## What It Tracks

- Which direct or workspace packages still depend on each override
- Why an override was added, including manual notes and security context
- Whether a patch file belongs to the same package/version
- Whether an override looks stale and can be removed with `--remove-unused`
- Which security provider found a vulnerability and which version patched it
- Which workspace manifests were checked when building the appendix

## Where It Helps

| Situation                     | What Pastoralist does                                                       |
| ----------------------------- | --------------------------------------------------------------------------- |
| Security override             | Stores CVE, severity, provider, patched version, and reason                 |
| Old compatibility override    | Shows which packages still require the pinned version                       |
| Monorepo/workspace dependency | Reads workspace manifests and writes one consolidated appendix              |
| `patch-package` patch         | Links patch files to the override entry they support                        |
| Cleanup pass                  | Reports unused overrides; removes them only when you pass `--remove-unused` |
| CI check                      | Gives dry-run, quiet, summary, and JSON output for workflows                |

## Common Commands

```bash
# Run a read-only setup and override health check
npx pastoralist doctor

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
`pastoralist.config.cjs`, `pastoralist.config.js`, or `pastoralist.config.mjs`.

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
      - uses: actions/checkout@v6.0.2
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          fail-on-security: true
```

The action can validate, update files, or open maintenance PRs. See the
[GitHub Action docs](https://jeffry.in/pastoralist/docs/github-action) or
[ACTION.md](.github/ACTION.md).

## Trust and Releases

Pastoralist can write to `package.json`, so the package should be boring to
verify. Releases are published from GitHub Actions with npm provenance, and the
published npm tarball is packed before release and attached to GitHub Releases
with a matching artifact attestation.

The repo also runs CI, CodeQL, OpenSSF Scorecard, unit/integration/e2e tests, and
dependency policy checks. Provenance does not prove the code is bug-free, but it
does make the release path auditable:

```bash
npm audit signatures
```

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

Made by [@yowainwright](https://github.com/yowainwright). [MIT](./LICENSE), 2022.
