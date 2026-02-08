# Setup Hook Example Pastoralist Sandbox

Demonstrates automatic postinstall script setup using [Pastoralist](https://github.com/yowainwright/pastoralist).

## Setup

- No postinstall script initially
- lodash dependency and override configured
- pastoralist as devDependency

## Test

Run pastoralist with `--setup-hook` flag to automatically add a postinstall script. This enables pastoralist to run automatically after every `npm install`.

## Run

**Setup postinstall hook:**

```sh
npm run demo
```

**Preview setup (dry run):**

```sh
npm run demo:dry
```

**Check current scripts:**

```sh
npm run show-scripts
```

After running the setup command, check `package.json` to see the added `postinstall` script that will run pastoralist automatically on every install.
