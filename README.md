# [Pastoralist](https://jeffry.in/pastoralist/)

[![Socket Badge][socket-badge]][socket-package] [![npm version][npm-version-badge]][npm-package]
[![npm downloads](https://img.shields.io/npm/dm/pastoralist.svg)](https://www.npmjs.com/package/pastoralist)
![CI](https://github.com/yowainwright/pastoralist/actions/workflows/ci.yml/badge.svg)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/yowainwright/pastoralist/badge)](https://scorecard.dev/viewer/?uri=github.com/yowainwright/pastoralist)
[![codecov](https://codecov.io/gh/yowainwright/pastoralist/branch/main/graph/badge.svg)](https://codecov.io/gh/yowainwright/pastoralist)

[npm-package]: https://www.npmjs.com/package/pastoralist
[npm-version-badge]: https://img.shields.io/npm/v/pastoralist.svg
[socket-badge]: https://socket.dev/api/badge/npm/package/pastoralist
[socket-package]: https://socket.dev/npm/package/pastoralist

Pastoralist is an audit trail for package manager overrides.

Overrides often start as real fixes: a CVE patch, a compatibility pin, a fork,
or a temporary transitive dependency workaround. Months later, the override is
still in `package.json`, but the reason is usually somewhere else.

<table width="100%">
<thead>
<tr>
<th>Without Pastoralist</th>
<th>With Pastoralist</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top">
<pre lang="diff">{
+  "overrides": {
+    // Why is "barn-yard" here? 🤷🏽
+    "barn-yard": "2.0.0"
+  }
}</pre>
</td>
<td valign="top">
<pre lang="diff">{
 "overrides": {
-   // Why is "barn-yard" here? 🤷🏽
  "barn-yard": "2.0.0",
 },
+ "pastoralist": {
+   "appendix": {
+     "barn-yard@2.0.0": {
+       "ledger": {
+         "addedDate": "2026-08-22T00:00:00.000Z",
+         "reason": "Compatibility pin for animals-js"
+       }
+     }
+   }
+ }
}</pre>
</td>
</tr>
</tbody>
</table>

Pastoralist handles your overrides and writes an appendix ledger so you know
why each override exists, which packages still need it, which security provider
found it, and when it can be removed.

<!-- first-run CLI commands from src/cli/parser/constants.ts and src/cli/cmds/init/ -->

---

## Quick Start

Install the global CLI with npm:

```sh
npm install --global pastoralist
```

Or install the global CLI with Homebrew:

```sh
brew install yowainwright/tap/pastoralist
```

That's basically it. You can now run `pastoralist` from your shell when you
manage overrides.

---

> For local projects where you just use pastoralist within scripts or CI,
> `npm install pastoralist --save-dev` is enough.
> Use Homebrew when you want a global CLI outside a project install.

---

### Try It

To see what Pastoralist will find, start with a read-only check:

```sh
pastoralist doctor
```

For first-run guidance across local use, agents, and CI:

```sh
pastoralist onboard
```

> The onboarding output includes quick scripts and copy/paste prompts for agents.
> See the [Onboarding guide](https://jeffry.in/pastoralist/docs/onboarding) for the same checklist in the docs.

---

### Working With Your Agent

Pastoralist does not need AI to work. It is ordinary CLI software.

If you use an agent, the included [skill](./skills/) gives it the project
instructions it needs to set up Pastoralist and keep override or CVE context
current later.

Set up the Pastoralist agent skill in a repo:

```sh
pastoralist --init agent-skill
```

### Add Pastoralist to a Project

When you are ready to add Pastoralist to the project:

```sh
npm install pastoralist --save-dev
npx pastoralist
```

This keeps the override where your package manager expects it, explains why it
exists, and leaves the installed version visible in the lockfile after install:

```diff
--- package.json
+++ package.json
@@
 {
   "name": "shepherd-cli",
   "version": "1.0.0",
   "dependencies": {
     "barn-yard": "^1.8.0"
   },
   "overrides": {
     "barn-yard": "2.0.0"
-  }
+  },
+  "pastoralist": {
+    "appendix": {
+      "barn-yard@2.0.0": {
+        "dependents": {
+          "shepherd-cli": "barn-yard@^1.8.0"
+        },
+        "ledger": {
+          "addedDate": "2026-08-22T00:00:00.000Z"
+        }
+      }
+    }
+  }
}

--- package-lock.json
+++ package-lock.json
@@ after npm install
-    "node_modules/barn-yard": { "version": "1.8.0" }
+    "node_modules/barn-yard": { "version": "2.0.0" }
```

Use `npx pastoralist init` when you want the config wizard for workspace paths,
external config, or security scanning.

Optionally keep the appendix current after installs:

```diff
 {
  "scripts": {
+    "postinstall": "pastoralist"
  }
 }
```

Pastoralist can even add the hook above for you:

```sh
npx pastoralist --setup-hook
```

---

## What Pastoralist Does

### Track Overrides Across Package Managers

Pastoralist reads each package manager's native override field.

```jsonc
{
  // npm and Bun
  "overrides": { "barn-yard": "2.0.0" },
  // pnpm
  "pnpm": { "overrides": { "old-goat": "4.1.0" } },
  // Yarn
  "resolutions": { "escaped-sheep": "1.0.1" },
}
```

### Record Why an Override Exists

The appendix keeps the reason beside the packages that still need the override.

```diff
 {
  "pastoralist": {
    "appendix": {
+      "barn-yard@2.0.0": {
+        "dependents": { "shepherd-cli": "barn-yard@^1" },
+        "ledger": {
+          "addedDate": "2026-08-22T00:00:00.000Z",
+          "reason": "Keep the gate API compatible.",
+        },
+      },
    },
  },
 }
```

### Keep Security Context With the Override

Security records include the advisory, severity, provider, and patched version.

```diff
 {
  "pastoralist": {
    "appendix": {
+      "escaped-sheep@1.0.1": {
+        "ledger": {
+          "addedDate": "2026-08-22T00:00:00.000Z",
+          "cves": ["CVE-escaped-sheep"],
+          "severity": "high",
+          "securityProvider": "osv",
+          "patchedVersion": "1.0.1",
+        },
+      },
    },
  },
 }
```

### Link Local Patches

Pastoralist records the `patch-package` files that support an override.

```diff
 {
  "pastoralist": {
    "appendix": {
      "patchy-alpaca@1.4.0": {
+        "patches": ["patches/patchy-alpaca+1.4.0.patch"],
      },
    },
  },
 }
```

### Remove Stale Overrides Safely

Preview unused overrides before explicitly removing them.

```sh
# first, test before removing
pastoralist --remove-unused --dry-run
# remove
pastoralist --remove-unused
```

### Consolidate Workspace Overrides

Read workspace manifests and write one appendix in the root `package.json`.

```diff
 {
  "pastoralist": {
+    "depPaths": "workspace",
  },
 }
```

### Run Pastoralist in CI

Choose preview, summary, quiet, or machine-readable output.

```sh
pastoralist --dry-run
pastoralist --summary
pastoralist --quiet --checkSecurity
pastoralist --outputFormat json
```

## CLI API

Full reference: [CLI API](https://jeffry.in/pastoralist/docs/api-reference#cli).

The direct commands below assume `pastoralist` is available from a project
script, global npm install, or Homebrew install. Use `npx pastoralist ...` for
one-off project setup.

#### `pastoralist`

> Type: **`command`**

Updates the target package manifest's override appendix. It reads npm
`overrides`, pnpm `pnpm.overrides`, Yarn `resolutions`, and Bun `overrides`.

```sh
pastoralist
pastoralist --dry-run
```

Use this after dependency changes so the appendix stays tied to the override
that package managers actually read. Use `--dry-run` to preview the same update
without writing files.

#### `--help` and `--version`

> Type: **`boolean options`**

Prints CLI help or the installed package version.

```sh
pastoralist --help
pastoralist --version # -v
```

Use these to check the installed CLI surface before wiring Pastoralist into
scripts or CI.

#### `pastoralist doctor`

> Type: **`command`**

Runs a read-only health check. Internally this enables `dryRun: true` and
`summary: true`.

```sh
pastoralist doctor
pastoralist doctor --outputFormat json
```

Use this before setup or cleanup work to see pending appendix, cleanup, and
security state without changing `package.json`.

In JSON mode, the important proof is small:

```json
{
  "updated": false,
  "overrideCount": 1
}
```

#### `pastoralist onboard`

> Type: **`command`**

Prints first-run guidance for local setup, agent setup, and GitHub Action setup.

```sh
pastoralist onboard
```

Use this when a human or agent needs the same first-run checklist, setup
commands, and CI prompt text.

#### `pastoralist init`

> Type: **`command`**

Starts the config wizard. The wizard can save config to `package.json` or an
external config file, configure workspace paths, and set up security scanning.

```sh
pastoralist init
```

Stores repeatable setup choices so future runs do not depend on memory or local
shell history:

```diff
 {
+  "pastoralist": {
+    "depPaths": "workspace",
+    "checkSecurity": true
+  }
 }
```

#### `pastoralist init agent-skill`

> Type: **`command`**

Installs the bundled Pastoralist agent skill into
`.agents/skills/pastoralist`. Existing unmanaged skill files are preserved.

```sh
pastoralist init agent-skill
```

Use this to give agents Pastoralist-specific setup and maintenance instructions.
The marker file lets Pastoralist update only the skill files it manages.

```diff
--- .agents/skills/pastoralist/SKILL.md
+++ .agents/skills/pastoralist/SKILL.md
@@
+Use `npx pastoralist doctor` for read-only project health.
+Use `npx pastoralist --remove-unused` only after reviewing dry-run output.

--- .agents/skills/pastoralist/.pastoralist-agent-config
+++ .agents/skills/pastoralist/.pastoralist-agent-config
@@
+pastoralist-agent-config
```

#### `--path`, `-p`

> Type: **`string option`**
> Default: **`"package.json"`**

Selects the package manifest Pastoralist should read and update.

```sh
pastoralist --path packages/app/package.json # -p packages/app/package.json
```

Use this when the manifest you want to check is not the root `package.json`.

#### `--root`, `-r`

> Type: **`string option`**

Sets the root directory used to resolve relative paths, config files, lockfiles,
patches, and workspace globs.

```sh
pastoralist --root ../my-project # -r ../my-project
```

Use this when scripts run outside the project directory but paths should still
resolve from the project root.

#### `--depPaths`, `-d`

> Type: **`string[] option`**

Scans additional package manifests for monorepo dependency context. Values are
collected until the next flag.

```sh
pastoralist --depPaths "packages/*/package.json" # -d "packages/*/package.json"
```

Use this in monorepos so one root appendix can explain which packages still need
each override.

For a small barn-yard workspace, it turns scattered dependents into one root
ledger entry:

```diff
--- package.json
+++ package.json
@@
+  "pastoralist": {
+    "appendix": {
+      "barn-yard@2.0.0": {
+        "dependents": {
+          "shepherd-cli": "barn-yard@^1.8.0",
+          "pasture-ui": "barn-yard@^1.9.0"
+        }
+      }
+    }
+  }
```

#### `--ignore`

> Type: **`string[] option`**

Excludes package manifests from `--depPaths` matching.

```sh
pastoralist --ignore "**/node_modules/**"
```

Use this to keep generated, vendored, or irrelevant manifests out of workspace
scans.

#### `--debug`

> Type: **`boolean option`**

Enables debug logging for CLI execution.

```sh
pastoralist --debug
```

Use this when config discovery, workspace matching, or provider behavior needs a
trace.

#### `--dry-run`

> Type: **`boolean option`**

Previews package, appendix, override-source, and security changes without
writing files.

```sh
pastoralist --dry-run
```

Use this before committing config, appendix, cleanup, or security changes.

#### `--outputFormat`

> Type: **`"text" | "json" option`**
> Default: **`"text"`**

Selects terminal output or a single machine-readable JSON result.

```sh
pastoralist --dry-run --outputFormat json
```

Use JSON output when CI or another tool needs stable fields instead of terminal
text. See `PastoralistResult` below for the full shape.

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

Use this for human-readable run metrics without switching to JSON output.

#### `--quiet`, `-q`

> Type: **`boolean option`**

Suppresses normal text output for CI. Security findings make the command exit
with code `1`; clean security checks exit with code `0`.

```sh
pastoralist --quiet --checkSecurity # -q --checkSecurity
```

Use this when CI should fail on vulnerabilities without printing the normal
terminal report.

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

Removes stale override records only after verification says they are no longer
needed:

```diff
--- package.json
+++ package.json
@@
 {
   "overrides": {
-    "stray-sheep": "1.0.0"
   },
   "pastoralist": {
     "appendix": {
-      "stray-sheep@1.0.0": {}
     }
   }
 }

--- package-lock.json
+++ package-lock.json
@@ after npm install
-    "node_modules/stray-sheep": { "version": "1.0.0" }
```

#### `--checkSecurity`

> Type: **`boolean option`**

Runs vulnerability scanning before the appendix update. Fixable security
findings can add override data and security ledger fields.

```sh
pastoralist --checkSecurity
```

Use this to connect vulnerability evidence to the override. With
`--forceSecurityRefactor` or an approved `--interactive` fix, Pastoralist can add
the patched override and security ledger fields:

```diff
--- package.json
+++ package.json
@@
 {
+  "overrides": {
+    "barn-yard": "2.0.0"
+  },
+  "pastoralist": {
+    "appendix": {
+      "barn-yard@2.0.0": {
+        "ledger": {
+          "source": "security",
+          "cves": ["CVE-barn-yard-gate"],
+          "patchedVersion": "2.0.0"
+        }
+      }
+    }
+  }
 }

--- package-lock.json
+++ package-lock.json
@@ after npm install
-    "node_modules/barn-yard": { "version": "1.8.0" }
+    "node_modules/barn-yard": { "version": "2.0.0" }
```

#### `--securityProvider`

> Type: **`"osv" | "github" | "snyk" | "npm" | "socket" | "spektion" | string[] option`**

Chooses one or more security providers. OSV is the default when security is
enabled and no provider is set.

```sh
pastoralist --checkSecurity --securityProvider osv
```

Use this when you need a specific advisory source. OSV is the default when
security is enabled and no provider is set.

#### `--securityProviderToken`

> Type: **`string option`**

Passes a provider token for a single run. Prefer provider environment variables
for CI: `GITHUB_TOKEN`, `SNYK_TOKEN`, `SOCKET_SECURITY_API_KEY`, or
`SPEKTION_API_KEY`.

```sh
pastoralist --checkSecurity --securityProvider github --securityProviderToken "$GITHUB_TOKEN"
```

Use this for a one-off authenticated scan without writing tokens to project
config.

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

<!-- public result and appendix data from src/cli/utils.ts and src/types.ts -->

## Data API

Full reference: [Data API](https://jeffry.in/pastoralist/docs/api-reference#data-api).

#### `PastoralistResult`

> Type: **`object`**

The JSON output shape returned by text-independent CLI runs. It reports write
status, security status, unused overrides, applied string overrides, errors, and
metrics.

```sh
pastoralist --dry-run --outputFormat json
```

```json
{
  "success": true,
  "hasSecurityIssues": false,
  "hasUnusedOverrides": true,
  "updated": false,
  "securityAlertCount": 0,
  "unusedOverrideCount": 1,
  "overrideCount": 2,
  "errors": [],
  "securityAlerts": [],
  "unusedOverrides": ["escaped-sheep@1.0.0"],
  "appliedOverrides": {
    "old-goat": "4.1.0"
  },
  "metrics": {
    "packagesScanned": 1,
    "workspacePackagesScanned": 0,
    "appendixEntriesUpdated": 2,
    "vulnerabilitiesBlocked": 0,
    "overridesAdded": 0,
    "overridesRemoved": 0,
    "removedOverridePackages": [],
    "severityCritical": 0,
    "severityHigh": 0,
    "severityMedium": 0,
    "severityLow": 0,
    "writeSuccess": false,
    "writeSkipped": true
  }
}
```

#### `pastoralist.appendix`

> Type: **`Record<string, AppendixItem>`**

Stores the ledger entry for each override version. Keys use
`package-name@version`; values can include root dependencies, dependents,
patches, and ledger metadata.

```json
{
  "pastoralist": {
    "appendix": {
      "old-goat@4.1.0": {
        "dependents": {
          "shepherd-cli": "old-goat@^3.0.0"
        },
        "ledger": {
          "addedDate": "2026-08-22T00:00:00.000Z",
          "reason": "Keep the older shepherd-cli integration working."
        }
      }
    }
  }
}
```

#### `AppendixItem.ledger`

> Type: **`object`**

Records why an override exists and the security context behind it. Security runs
can add CVEs, severity, provider, patched version, source, confidence, and
resolution fields.

```json
{
  "ledger": {
    "addedDate": "2026-08-22T00:00:00.000Z",
    "source": "security",
    "securityProvider": "osv",
    "cves": ["CVE-2026-1234"],
    "severity": "high",
    "patchedVersion": "4.1.0",
    "keep": {
      "reason": "Wait for upstream compatibility confirmation.",
      "reviewBy": "2026-09-30"
    }
  }
}
```

<!-- primary public Node.js API exports from src/index.ts and src/types.ts -->

## Node.js API

Full reference: [Node.js API](https://jeffry.in/pastoralist/docs/api-reference#nodejs-api).

#### `update(options)`

> Type: **`(options: Options) => UpdateContext`**

Runs the core override and appendix update from JavaScript or TypeScript. Pass a
parsed package manifest as `config` and the manifest `path`.

```ts
import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  const result = update({
    config,
    path,
    dryRun: true,
    depPaths: ["packages/*/package.json"],
  });

  process.stdout.write(`${result.metrics?.appendixEntriesUpdated ?? 0} entries\n`);
}
```

#### `SecurityChecker.checkSecurity(config, options)`

> Type: **`(config: PastoralistJSON, options?: SecurityCheckRuntimeOptions) => Promise<SecurityCheckResult>`**

Runs provider-backed vulnerability scanning directly and returns alerts,
suggested overrides, update suggestions, package counts, and optional best-case
metadata.

```ts
import { resolveJSON, SecurityChecker } from "pastoralist";

const config = resolveJSON("./package.json");
const checker = new SecurityChecker({ provider: "osv" });

if (config) {
  const result = await checker.checkSecurity(config, {
    root: process.cwd(),
    packageJsonPath: "./package.json",
    severityThreshold: "high",
  });

  process.stdout.write(`${result.alerts.length} alerts found\n`);
}
```

## Configuration

Pastoralist reads config from `package.json#pastoralist` or an external config
file. External config files use top-level Pastoralist settings.

<!-- supported configuration files from src/config/constants.ts and schema export from package.json -->

#### Config Files

> Type: **`".pastoralistrc" | ".pastoralistrc.json" | "pastoralist.json" | "pastoralist.config.cjs" | "pastoralist.config.js" | "pastoralist.config.mjs"`**

Pastoralist searches for the first matching external config file in this order:
`.pastoralistrc`, `.pastoralistrc.json`, `pastoralist.json`,
`pastoralist.config.cjs`, `pastoralist.config.js`, then
`pastoralist.config.mjs`. External config is merged with
`package.json#pastoralist`; package.json wins on conflicts.

```json
{
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": true
  }
}
```

```js
export default {
  depPaths: ["packages/*/package.json", "apps/*/package.json"],
  checkSecurity: true,
};
```

#### `$schema`

> Type: **`string`**

The JSON Schema is exported as `pastoralist/schema.json`.

External JSON config files can reference `./node_modules/pastoralist/src/schema.json` with `$schema`.
Configs that reference this schema reject unknown or mistyped fields; other configs retain compatible validation behavior.

```json
{
  "$schema": "./node_modules/pastoralist/src/schema.json",
  "depPaths": "workspace",
  "checkSecurity": true
}
```

#### `depPaths`

> Type: **`"workspace" | "workspaces" | string[]`**

Defines additional package manifests used for monorepo dependency context.
`"workspace"` and `"workspaces"` resolve from the root manifest's `workspaces`
field.

```json
{
  "workspaces": ["packages/*", "apps/*"],
  "pastoralist": {
    "depPaths": "workspace"
  }
}
```

```json
{
  "depPaths": ["packages/*/package.json", "apps/*/package.json"]
}
```

#### `overrideSource`

> Type: **`string`**

Reads and writes native overrides from a separate JSON or YAML file instead of
the target package manifest. For pnpm 11 projects, Pastoralist can also resolve
`pnpm-workspace.yaml` automatically.

```json
{
  "pastoralist": {
    "overrideSource": "config/overrides.json"
  }
}
```

```yaml
packages:
  - packages/*
overrides:
  old-goat: 4.1.0
```

#### `appendixSource`

> Type: **`string`**

Writes `appendix` data to a JSON config file instead of embedding it in
`package.json`. The target must be JSON or `.pastoralistrc`.

```json
{
  "pastoralist": {
    "appendixSource": ".pastoralistrc.json"
  }
}
```

#### `compactAppendix`

> Type: **`boolean`**

Stores routine appendix entries as `{ "addedDate": "..." }` when no dependency,
patch, security, or keep data needs to stay expanded.

```json
{
  "pastoralist": {
    "compactAppendix": true
  }
}
```

#### `overridePaths` and `resolutionPaths`

> Type: **`Record<string, Appendix>`**

Keeps manual appendix data for packages whose overrides or resolutions live in
workspace-specific paths. `resolutionPaths` is the Yarn-oriented fallback.

```json
{
  "pastoralist": {
    "overridePaths": {
      "packages/web/package.json": {
        "react@19.0.0": {
          "ledger": {
            "addedDate": "2026-08-22T00:00:00.000Z",
            "reason": "Pinned for the web app release."
          }
        }
      }
    }
  }
}
```

#### `checkSecurity`

> Type: **`boolean`**

Enables security scanning from config. `security.enabled` can override this
inside the nested security config.

```json
{
  "pastoralist": {
    "checkSecurity": true
  }
}
```

#### `security`

> Type: **`object`**

Configures security scanning. Supported fields are `enabled`, `provider`,
`autoFix`, `interactive`, `securityProviderToken`, `severityThreshold`,
`excludePackages`, `hasWorkspaceSecurityChecks`, `strict`, and `preferLatest`.

```json
{
  "pastoralist": {
    "security": {
      "enabled": true,
      "provider": ["osv", "npm"],
      "severityThreshold": "medium",
      "excludePackages": ["@types/*"],
      "hasWorkspaceSecurityChecks": true,
      "strict": true
    }
  }
}
```

#### `bestCase`

> Type: **`BestCaseConfig`**

Opts into portfolio-level security fix selection. Pastoralist ranks complete
version states by ordered objectives instead of picking each package fix in
isolation.

```json
{
  "pastoralist": {
    "checkSecurity": true,
    "bestCase": {
      "enabled": true,
      "userOwnedOverrides": ["alpha"],
      "riskAggregation": "both",
      "objectives": ["known-exploited", "critical", "high", "change-count"],
      "search": {
        "mode": "auto",
        "exactStateLimit": 256,
        "beamWidth": 16,
        "maxEvaluations": 1000
      }
    }
  }
}
```

See [Configuration](https://jeffry.in/pastoralist/docs/configuration) and
[Workspaces](https://jeffry.in/pastoralist/docs/workspaces) for the full setup
surface.

## GitHub Action

Check override tracking on pull requests:

```diff
 name: Override Check
 on: [pull_request]

 jobs:
  pastoralist:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
+      - uses: yowainwright/pastoralist@v1
+        with:
+          mode: check
+          check-security: false
```

The action can also run security checks, update files, or open scheduled
maintenance PRs. See the
[GitHub Action docs](https://jeffry.in/pastoralist/docs/github-action).

## Security and Release Assurance

<!-- release behavior from .github/workflows/publish.yml and .github/workflows/homebrew.yml -->

- Releases are published from GitHub Actions with npm provenance
- Published tarballs are packed before release and attached to GitHub Releases
  with artifact attestations
- Stable Homebrew releases build, test, and attest the binary asset matrix
- Stable releases open a reviewed Homebrew tap update
- CI runs CodeQL, OpenSSF Scorecard, unit, integration, e2e, and dependency
  policy checks

You can verify registry signatures from your project:

```bash
npm audit signatures
```

Please reach out with any desired security requests and I will do my best to support you!

## Thanks

Shout out to [Mardin](https://github.com/mardinyadegar) for the conversation, insight, and
pairing around this topic.

Made by [@yowainwright](https://github.com/yowainwright). [MIT](./LICENSE), 2022-2026.
