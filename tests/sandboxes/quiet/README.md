# Quiet Mode Example Pastoralist Sandbox

Demonstrates quiet mode for CI pipelines using [Pastoralist](https://github.com/yowainwright/pastoralist).

## Setup

- Vulnerable versions: minimist@^1.2.5, lodash@^4.17.15
- Security fix overrides: minimist@1.2.6, lodash@4.17.21

## Test

Run pastoralist with `--quiet` flag for minimal CI-friendly output. Exit codes: 0=clean, 1=vulnerabilities found.

## Run

**Run Quiet Mode (minimal output):**

```sh
npm run demo
```

**Quiet Dry Run:**

```sh
npm run demo:dry
```

**Verbose Mode (for comparison):**

```sh
npm run demo:verbose
```

Compare the output between quiet and verbose modes. Quiet mode is ideal for CI/CD pipelines where you need minimal output but still want to check exit codes for success/failure.
