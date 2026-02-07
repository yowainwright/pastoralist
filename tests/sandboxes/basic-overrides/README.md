# Basic Overrides Example Pastoralist Sandbox

Demonstrates appendix generation for override tracking using [Pastoralist](https://github.com/yowainwright/pastoralist).

## Setup

- lodash dependency at version `^4.17.21`
- lodash override to version `4.17.20`
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

After running, check `package.json` to see the generated `pastoralist.appendix` section that tracks why the lodash override exists.
