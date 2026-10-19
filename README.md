<p align="center">
  <img src="https://raw.githubusercontent.com/yowainwright/pastoralist/main/app/public/favicon.svg" alt="Pastoralist icon" width="50" />
</p>

# Pastoralist

[![Socket Badge][socket-badge]][socket-package] [![npm version][npm-version-badge]][npm-package]
[![npm downloads](https://img.shields.io/npm/dm/pastoralist.svg)](https://www.npmjs.com/package/pastoralist)
![CI](https://github.com/yowainwright/pastoralist/actions/workflows/ci.yml/badge.svg)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/yowainwright/pastoralist/badge)](https://scorecard.dev/viewer/?uri=github.com/yowainwright/pastoralist)
[![codecov](https://codecov.io/gh/yowainwright/pastoralist/branch/main/graph/badge.svg)](https://codecov.io/gh/yowainwright/pastoralist)

[npm-package]: https://www.npmjs.com/package/pastoralist
[npm-version-badge]: https://img.shields.io/npm/v/pastoralist.svg
[socket-badge]: https://badge.socket.dev/npm/package/pastoralist/latest
[socket-package]: https://socket.dev/npm/package/pastoralist

Pastoralist keeps projects more secure while maintaining dependency overrides.

It tracks each override in an appendix: which packages depend on it, when it
was first recorded, and whether it can be removed.

## Override Tracking

With an existing `qs` override, running `pastoralist` adds this record:

```diff
--- package.json
+++ package.json
@@ -5,5 +5,17 @@
   },
   "overrides": {
     "qs": "6.11.2"
+  },
+  "pastoralist": {
+    "appendix": {
+      "qs@6.11.2": {
+        "dependents": {
+          "shepherd-cli": "qs (required by express)"
+        },
+        "ledger": {
+          "addedDate": "2026-10-16"
+        }
+      }
+    }
   }
 }
```

This example uses `express → qs`. The dependents and date are generated;
the versions shown are fixture inputs.

## Quick Start

Install the global CLI with npm or Homebrew:

```sh
npm install --global pastoralist
# or
brew install yowainwright/tap/pastoralist
```

For a project, install it as a dev dependency:

```sh
npm install pastoralist --save-dev
npx pastoralist doctor
npx pastoralist
```

`doctor` previews changes. Running `pastoralist` updates the appendix.

Install the bundled agent skill with `npx pastoralist init agent-skill`.
Use `npx pastoralist --setup-hook` to add it to `postinstall`.

See the [docs](https://jeffry.in/pastoralist/docs/introduction) for setup,
configuration, workspaces, security, and interactive examples.

## CLI API

The direct commands below assume `pastoralist` is available from a project
script, global npm install, or Homebrew install. Use `npx pastoralist ...` for
one-off project setup.

#### `pastoralist`

> Type: **`command`**

Updates the target package manifest's override appendix. It reads npm
`overrides`, pnpm `pnpm.overrides` or `pnpm-workspace.yaml` (pnpm 11+),
Yarn `resolutions`, and Bun `overrides`.

```sh
pastoralist
pastoralist --dry-run
```

#### `--help` and `--version`

> Type: **`boolean options`**

Prints CLI help or the installed package version.

```sh
pastoralist --help
pastoralist --version # -v
```

Check the installed version and available commands before adding Pastoralist
to scripts or CI.

#### `--styleguide`

> Type: **`boolean option`**

Opens an interactive radio menu for exploring the Pastoralist DX components
without reading or changing project configuration. Use the arrow keys and Enter
to choose a demo. In the prompt demo, Space toggles choices, `a` selects all,
`n` selects none, and Esc cancels.

```sh
pastoralist --styleguide
```

#### `pastoralist doctor`

> Type: **`command`**

Runs a read-only health check. Internally this enables `dryRun: true` and
`summary: true`.

```sh
pastoralist doctor
pastoralist doctor --outputFormat json
```

#### `pastoralist init`

> Type: **`command`**

Starts the config wizard. The wizard can save config to `package.json` or an
external config file, configure workspace paths, and set up security scanning.

```sh
pastoralist init
```

#### `pastoralist init agent-skill`

> Type: **`command`**

Installs the bundled Pastoralist agent skill into
`.agents/skills/pastoralist`. Existing unmanaged skill files are preserved.

```sh
pastoralist init agent-skill
```

#### `--path`, `-p`

> Type: **`string option`**
> Default: **`"package.json"`**

Selects the package manifest Pastoralist should read and update.

```sh
pastoralist --path packages/app/package.json # -p packages/app/package.json
```

#### `--root`, `-r`

> Type: **`string option`**

Sets the root directory used to resolve relative paths, config files, lockfiles,
patches, and workspace globs.

```sh
pastoralist --root ../my-project # -r ../my-project
```

#### `--depPaths`, `-d`

> Type: **`string[] option`**

Scans additional package manifests for monorepo dependency context. Values are
collected until the next flag.

```sh
pastoralist --depPaths "packages/*/package.json" # -d "packages/*/package.json"
```

#### `--ignore`

> Type: **`string[] option`**

Excludes package manifests from `--depPaths` matching.

```sh
pastoralist --ignore "**/node_modules/**"
```

#### `--debug`

> Type: **`boolean option`**

Enables debug logging for CLI execution.

```sh
pastoralist --debug
```

#### `--dry-run`

> Type: **`boolean option`**

Previews changes to project files. Security providers may still write caches.

```sh
pastoralist --dry-run
```

#### `--outputFormat`

> Type: **`"text" | "json" option`**
> Default: **`"text"`**

Selects terminal output or a single machine-readable JSON result.

```sh
pastoralist --dry-run --outputFormat json
```

JSON output includes result status, findings, applied overrides, and metrics.

```json
{
  "success": true,
  "updated": false,
  "overrideCount": 1
}
```

#### `--summary`

> Type: **`boolean option`**

Prints the metrics table after a text-mode run.

```sh
pastoralist --summary
```

#### `--quiet`, `-q`

> Type: **`boolean option`**

Suppresses normal text output for CI. Security findings make the command exit
with code `1`; clean security checks exit with code `0`.

```sh
pastoralist --quiet --checkSecurity # -q --checkSecurity
```

#### `--setup-hook`

> Type: **`boolean option`**

Adds `pastoralist` to the target manifest's `postinstall` script. Existing
postinstall scripts are appended with `&& pastoralist`.

```sh
pastoralist --setup-hook
```

Keeps the appendix current after package installs:

```diff
 {
   "scripts": {
-    "postinstall": "build"
+    "postinstall": "build && pastoralist"
   }
 }
```

#### `--remove-unused`

> Type: **`boolean option`**

Removes verified unused override entries from the active override source and
appendix. Preview first with `--dry-run`.

```sh
pastoralist --remove-unused
```

#### `--checkSecurity`

> Type: **`boolean option`**

Runs vulnerability scanning before the appendix update. Fixable security
findings can add override data and security ledger fields.

```sh
pastoralist --checkSecurity
```

Apply fixes with `--interactive` or `--forceSecurityRefactor`.

#### `--securityProvider`

> Type: **`"osv" | "github" | "snyk" | "npm" | "socket" | "spektion" | string[] option`**

Chooses one or more security providers. OSV is the default when security is
enabled and no provider is set.

```sh
pastoralist --checkSecurity --securityProvider osv
```

#### `--securityProviderToken`

> Type: **`string option`**

Passes a provider token for a single run. Prefer provider environment variables
for CI: `GITHUB_TOKEN`, `SNYK_TOKEN`, `SOCKET_SECURITY_API_KEY`, or
`SPEKTION_API_KEY`.

```sh
pastoralist --checkSecurity --securityProvider github --securityProviderToken "$GITHUB_TOKEN"
```

#### Security Mode Flags

> Type: **`boolean options`**

Controls how security findings are handled: `--interactive` prompts for fixes,
`--forceSecurityRefactor` applies available fixes without prompting,
`--hasWorkspaceSecurityChecks` includes workspace packages, `--promptForReasons`
asks for manual ledger reasons, and `--strict` fails on provider errors.

```sh
pastoralist --checkSecurity --interactive
pastoralist --checkSecurity --forceSecurityRefactor --strict
pastoralist --checkSecurity --hasWorkspaceSecurityChecks
pastoralist --promptForReasons
```

Use `--interactive` for review, `--forceSecurityRefactor` for unattended fixes,
and `--strict` when provider errors should fail the run.

#### Cache Flags

> Type: **`string | number | boolean options`**

Controls provider cache behavior. `--cache-dir` changes the cache directory,
`--cache-ttl` sets TTL seconds, `--no-cache` bypasses reads and writes, and
`--refresh-cache` bypasses reads while writing fresh data.

```sh
pastoralist --checkSecurity --cache-dir .cache/pastoralist
pastoralist --checkSecurity --cache-ttl 3600
pastoralist --checkSecurity --no-cache
pastoralist --checkSecurity --refresh-cache
```

Use these to avoid repeated provider calls, shorten cache windows, or force a
fresh advisory lookup.

## Thanks

Shout out to [Mardin](https://github.com/mardinyadegar) for the conversation, insight, and
pairing around this topic.

Made by [@yowainwright](https://github.com/yowainwright). [MIT](./LICENSE), 2022-2026.
