---
name: pastoralist
description: >
  Use when setting up, running, or maintaining Pastoralist override tracking,
  security checks, install hooks, GitHub Actions, or dependency override docs.
---

# Pastoralist

Start with `npx pastoralist onboard` when setting up a repo.
Use `npx pastoralist doctor` for read-only project health.
Run `npx -p pastoralist pastoralist-setup-local-dev --dry-run` before setup writes.
Use `npx pastoralist --init` to create config.
Use `npx pastoralist` to update the override appendix.
Use `npx pastoralist --setup-hook` to keep the appendix current after installs.
Use `npx pastoralist --checkSecurity` for advisory checks.
Use `npx pastoralist --remove-unused` only after reviewing dry-run output.

## Agent Setup

Prefer the packaged setup script for agent config and skills:

```bash
npx -p pastoralist pastoralist-setup-local-dev --agent codex --skills all --hooks git,postinstall
```

If only the skill is needed:

```bash
npx -p pastoralist pastoralist-setup-skill
```

## Agent Loop

1. Run `npx pastoralist doctor`.
2. Run `npx -p pastoralist pastoralist-setup-local-dev --dry-run`.
3. Apply the smallest needed setup command.
4. Run `npx pastoralist --dry-run`.
5. Report changed files and remaining manual steps.

For CI, add `yowainwright/pastoralist@v1` to a pull request workflow.
Keep secrets in environment variables, not config files.
