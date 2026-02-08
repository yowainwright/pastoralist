# Basic Overrides Example Pastoralist Sandbox

Demonstrates appendix generation for override tracking using [Pastoralist](https://github.com/yowainwright/pastoralist).

## Setup

- express dependency (which uses `qs` internally)
- qs override to version `6.11.2` (controls transitive dependency)
- pastoralist as devDependency

## Test

Run pastoralist and check `package.json` for the generated appendix tracking the override.

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

After running, check `package.json` to see the generated `pastoralist.appendix` section that tracks why the qs override exists and which dependency uses it.
