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

Pastoralist keeps projects more secure while maintaining dependency overrides with clarity.

It tracks each override in an appendix: which packages depend on the override, when the overrides
was first added to overrides, and if it can be removed.

Packages you install bring dependencies of their own.
Overrides let you set a different version of a package—for example, to address a security issue.

---

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

---

## Quick Start

Install Pastoralist as a dev dependency and run it from your project root.

```sh
npm install pastoralist --save-dev
npx pastoralist doctor
npx pastoralist
```

`doctor` previews changes. Running `pastoralist` updates the appendix.

Install the bundled agent skill with `npx pastoralist init agent-skill`.
Use `npx pastoralist --setup-hook` to add it to `postinstall`.

See the [setup guide](https://jeffry.in/pastoralist/docs/setup/) for install hooks and workspace settings.

---

## CLI API

Use `npx pastoralist` with a project install, or install the CLI globally with
`npm install --global pastoralist`. See the [CLI reference](https://jeffry.in/pastoralist/docs/api-reference/#cli) for all commands and options.

#### `pastoralist`

In an npm project, reads `overrides` from `package.json` and updates the appendix.
Use `--dry-run` to preview the changes.

```sh
pastoralist --dry-run
```

#### `--help` and `--version`

Prints CLI help or the installed package version.

```sh
pastoralist --help
pastoralist --version # -v
```

#### `--styleguide`

Opens an interactive radio menu for exploring the Pastoralist DX components
without reading or changing project configuration. Use the arrow keys and Enter
to choose a demo. In the prompt demo, Space toggles choices, `a` selects all,
`n` selects none, and Esc cancels.

```sh
pastoralist --styleguide
```

#### `pastoralist doctor`

Previews the appendix update and prints a summary.

```sh
pastoralist doctor
pastoralist doctor --outputFormat json
```

#### `pastoralist init`

Starts the config wizard. The wizard can save config to `package.json` or an
external config file, configure workspace paths, and set up security scanning.

```sh
pastoralist init
```

#### `pastoralist init agent-skill`

Installs the bundled Pastoralist agent skill into
`.agents/skills/pastoralist`. Existing unmanaged skill files are preserved.

```sh
pastoralist init agent-skill
```

#### `--path`, `-p`

Pastoralist detects the project manifest by default. Use `--path` to select one.

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

Enables debug logging for CLI execution.

```sh
pastoralist --debug
```

#### `--dry-run`

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

Prints the metrics table after a text-mode run.

```sh
pastoralist --summary
```

#### `--quiet`, `-q`

Suppresses normal text output for CI. Security findings make the command exit
with code `1`; clean security checks exit with code `0`.

```sh
pastoralist --quiet --checkSecurity # -q --checkSecurity
```

#### `--setup-hook`

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

Removes verified unused override entries from the active override source and
appendix. Preview first with `--dry-run`.

```sh
pastoralist --remove-unused
```

#### `--checkSecurity`

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

```sh
pastoralist --checkSecurity --interactive # Scans for vulnerabilities and asks which fixes to apply.
pastoralist --checkSecurity --forceSecurityRefactor --strict # Applies available transitive fixes automatically and fails if vulnerabilities remain or a provider denies access.
pastoralist --checkSecurity --hasWorkspaceSecurityChecks # Scans root and workspace dependencies for vulnerabilities.
```

Direct dependency updates require interactive approval. Forced transitive fixes
may cross major versions and parent ranges. Overrides select the lowest known
patched version resolving the advisories. Reinstall dependencies and rescan after fixes.

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

## Node.js API

To preview the appendix from a script, pass your parsed manifest and its path to `update()`.

```js
import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);
if (!config) throw new Error(`Could not read ${path}`);

const { finalAppendix } = update({ config, path, dryRun: true, outputFormat: "json" });
process.stdout.write(JSON.stringify(finalAppendix ?? {}, null, 2) + "\n");
```

See the [Node.js API reference](https://jeffry.in/pastoralist/docs/api-reference/#nodejs-api) for more options and exports.

## Other Package Managers

| Package manager | Install in your project      | Where Pastoralist reads overrides                                                                      |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| pnpm            | `pnpm add -D pastoralist`    | `overrides` in `pnpm-workspace.yaml` (the default for pnpm 11+), or `pnpm.overrides` in `package.json` |
| Yarn            | `yarn add --dev pastoralist` | `resolutions` in `package.json`                                                                        |
| Bun             | `bun add --dev pastoralist`  | `overrides` in `package.json`                                                                          |

For a standalone CLI, Homebrew users can run `brew install yowainwright/tap/pastoralist`.

### uv

In a standalone Python project, Pastoralist reads [uv overrides](https://docs.astral.sh/uv/concepts/resolution/#dependency-overrides)
from `pyproject.toml`. This one pins `urllib3` to version `2.8.0`.

```toml
[tool.uv]
override-dependencies = ["urllib3==2.8.0"]
```

Run `pastoralist --dry-run` to preview the appendix. If `uv.lock` shows that
`requests` depends on `urllib3`, running `pastoralist` records
`urllib3 (required by requests)` in `.pastoralistrc`.

If the repo also has a `package.json`, use `pastoralist --path pyproject.toml` to
track the Python overrides. With a JavaScript config file, set `appendixSource`
to a separate JSON file for the appendix.

uv tracking supports one global override per package. Workspace and scoped
overrides, security scanning, automatic fixes, and removal are currently unsupported for uv.

## Thanks

Shout out to [Mardin](https://github.com/mardinyadegar) for the conversation, insight, and
pairing around this topic.

Made by [@yowainwright](https://github.com/yowainwright). [MIT](./LICENSE), 2022-2026.
