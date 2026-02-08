# Patches Example Pastoralist Sandbox

Demonstrates patch file tracking using [Pastoralist](https://github.com/yowainwright/pastoralist).

## Setup

- lodash dependency at version `^4.17.21`
- pnpm `patchedDependencies` configuration pointing to patch file
- Actual patch file at `patches/lodash@4.17.21.patch`

## Test

Run pastoralist and check the appendix for patch file detection and tracking.

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

After running, check `package.json` to see how Pastoralist tracks the patch file in the appendix, linking it to the lodash dependency.
