# Cleanup Example Pastoralist Sandbox

Demonstrates automatic removal of stale overrides using [Pastoralist](https://github.com/yowainwright/pastoralist).

## Setup

- Only express as dependency
- Unused overrides for lodash, minimist, qs that will be cleaned up

## Test

Run pastoralist and watch it remove unused overrides from the package.json.

## Run

**Run Pastoralist:**

```sh
npm run demo
```

**Preview cleanup (dry run):**

```sh
npm run demo:dry
```

**Show summary:**

```sh
npm run demo:summary
```

After running, the `overrides` section in package.json should be cleaned up, removing lodash, minimist, and qs since they're not actually used by the express dependency.
