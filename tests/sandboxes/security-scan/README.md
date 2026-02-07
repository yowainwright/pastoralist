# Security Scan Example Pastoralist Sandbox

Demonstrates security vulnerability scanning using [Pastoralist](https://github.com/yowainwright/pastoralist).

## Setup

- Old vulnerable versions: minimist@^1.2.5, trim@^0.0.1, lodash@^4.17.15
- Security fix overrides: minimist@1.2.6, trim@0.0.3, lodash@4.17.21
- Pastoralist security configuration using OSV provider

## Test

Run pastoralist with security scanning enabled. It will scan for vulnerabilities and track security fixes in the appendix.

## Run

**Run Security Scan:**

```sh
npm run demo
```

**Preview security changes (dry run):**

```sh
npm run demo:dry
```

**Show security summary:**

```sh
npm run demo:summary
```

After running, check the output for vulnerability reports and see how Pastoralist tracks security fixes in the `pastoralist.appendix` section with vulnerability details.
