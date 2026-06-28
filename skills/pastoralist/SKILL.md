---
name: pastoralist
description: >
  Use when setting up, running, or maintaining Pastoralist override tracking,
  security checks, install hooks, GitHub Actions, or dependency override docs.
---

# Pastoralist

Start with `npx pastoralist doctor` for read-only project health.
Use `npx pastoralist --init` to create config.
Use `npx pastoralist` to update the override appendix.
Use `npx pastoralist --setup-hook` to keep the appendix current after installs.
Use `npx pastoralist --checkSecurity` for advisory checks.
Use `npx pastoralist --remove-unused` only after reviewing dry-run output.

For CI, add `yowainwright/pastoralist@v1` to a pull request workflow.
Keep secrets in environment variables, not config files.
