---
name: pastoralist
description: >
  Set up and use Pastoralist to explain dependency overrides, find stale overrides,
  scan vulnerabilities, and apply security fixes in npm, pnpm, Yarn, or Bun projects.
  Use for Pastoralist onboarding, override maintenance, install hooks, agent skills,
  or CI checks involving overrides, resolutions, pnpm-workspace.yaml, or the appendix.
---

# Pastoralist

## Understand it in 30 seconds

Pastoralist manages the reasons for dependency overrides. The package manager
still installs the dependencies.

- **Overrides** choose versions: npm/Bun `overrides`, Yarn `resolutions`, or pnpm
  overrides in `pnpm-workspace.yaml` (legacy `package.json#pnpm.overrides` is supported).
- **Appendix** records dependents and a ledger of dates, reasons, and security
  evidence under `pastoralist.appendix`.
- **Lockfile** records resolved versions. After changing overrides, run the
  project's package manager to update it. Pastoralist does not run that install.

## Set up a project

Read `package.json`, its scripts, lockfile, workspace settings, and any existing
Pastoralist config first. Use the project's package manager; do not replace its
lockfile or overwrite existing hooks. Pastoralist requires Node >=20.19.0.

For pnpm, run from the project root:

```sh
pnpm add -D pastoralist
pnpm exec pastoralist doctor
pnpm exec pastoralist --dry-run
pnpm exec pastoralist
```

Use `pnpm add -Dw pastoralist` when installing at a pnpm workspace root. For npm,
use `npm install -D pastoralist` and `npx pastoralist`. Use the equivalent local
CLI runner for Yarn or Bun. For a one-off preview before installing, use
`npx pastoralist doctor`.

Basic tracking needs no config wizard. Run `pastoralist init` interactively
when workspace paths, an external config, or security defaults need configuring.
Config belongs under `package.json#pastoralist`, or as top-level settings in
`.pastoralistrc`, `.pastoralistrc.json`, `pastoralist.json`, or `pastoralist.config.*`.

Optional setup, using the installed CLI:

```sh
pnpm exec pastoralist --setup-hook --dry-run
pnpm exec pastoralist --setup-hook
pnpm exec pastoralist init agent-skill --dry-run
pnpm exec pastoralist init agent-skill
```

The hook appends `pastoralist` to `postinstall`, preserving an existing script.
The skill installs at `.agents/skills/pastoralist/SKILL.md`; an existing unmanaged
skill is left alone. `setup:local-dev` is for developing Pastoralist itself,
not a prerequisite in consumer projects.

## Choose the task

Commands below use `pastoralist` as shorthand for the installed CLI runner above.

| Task                             | Command                                                                                    | Effect                                |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------- |
| Inspect setup and overrides      | `pastoralist doctor`                                                                       | Dry-run with summary                  |
| Preview tracking changes         | `pastoralist --dry-run`                                                                    | No project writes                     |
| Refresh the appendix             | `pastoralist`                                                                              | Writes tracking data                  |
| Preview stale override removal   | `pastoralist --remove-unused --dry-run`                                                    | Review before removing                |
| Remove reviewed unused overrides | `pastoralist --remove-unused`                                                              | Writes overrides and appendix         |
| Inspect security findings        | `pastoralist --checkSecurity --dry-run --securityProvider osv --strict`                    | Scan without applying fixes           |
| Gate CI on security findings     | `pastoralist --checkSecurity --dry-run --securityProvider osv --strict --quiet --no-cache` | Exit 1 on findings or provider errors |

`--checkSecurity` alone can update tracking data: include `--dry-run` for a preview.
OSV needs no token. Keep other provider credentials in environment variables.
Use `--outputFormat json` for machine-readable output; check the process exit
status and reported findings, not just whether the scan completed.

## Fix, install, verify

When automatic security fixes are requested:

```sh
pnpm exec pastoralist --checkSecurity --forceSecurityRefactor --securityProvider osv --strict
pnpm install --no-frozen-lockfile
pnpm exec pastoralist --checkSecurity --dry-run --securityProvider osv --strict --quiet --no-cache
```

Review the override, appendix, and lockfile diff, then run the project's checks.
A successful fix command does not prove the installed dependency tree is clean:
the final scan must run after installation. Fixes may be unavailable or require
a direct dependency update. Report remaining findings rather than bypassing CI.

Use `--root <project-directory>` to target another project. For independently
locked packages such as a docs app, repeat the cycle in that package. Add
`--hasWorkspaceSecurityChecks` when workspace packages must be included.

For GitHub Actions, the existing `yowainwright/pastoralist@v1` action supports
`mode: check`. Follow the repository's install and security policy.

## Preserve deliberate overrides

When best-case selection conflicts with an override the user controls, show its
active version and appendix ledger `addedDate`. Ask whether it should be
user-owned; the date alone does not establish ownership. Persist approved names
in `pastoralist.bestCase.userOwnedOverrides`. The active override supplies the
required version. Re-run security checks with those versions as hard constraints.

Finish with changed files, verification results, and any remaining findings.
