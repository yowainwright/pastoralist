# Monorepo Example Pastoralist Sandbox

Demonstrates workspace override tracking across packages using [Pastoralist](https://github.com/yowainwright/pastoralist).

## Setup

- Root override for lodash
- packages/app depends on express, lodash
- packages/lib depends on lodash, underscore

## Test

Run pastoralist and check appendix for cross-workspace tracking.

## Run

```sh
bun run start
```
