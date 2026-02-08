# Monorepo Example Pastoralist Sandbox

Demonstrates workspace override tracking across packages using [Pastoralist](https://github.com/yowainwright/pastoralist).

## Setup

- Root override for lodash at version 4.17.21
- packages/app depends on express, lodash
- packages/lib depends on lodash, underscore

## Test

Run pastoralist and check the appendix for cross-workspace tracking. Pastoralist automatically detects workspace packages and tracks which packages use the overridden dependencies.

## Run

**Run Pastoralist:**

```sh
npm run demo
```

**Preview changes (dry run):**

```sh
npm run demo:dry
```

**Show summary:**

```sh
npm run demo:summary
```

After running, check the root `package.json` to see the generated `pastoralist.appendix` section that maps the lodash override to its usage across workspace packages.
