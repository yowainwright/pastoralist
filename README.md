# [Pastoralist](https://jeffry.in/pastoralist/)

[![Socket Badge][socket-badge]][socket-package] [![npm version][npm-version-badge]][npm-package]
[![npm downloads](https://img.shields.io/npm/dm/pastoralist.svg)](https://www.npmjs.com/package/pastoralist)
![CI](https://github.com/yowainwright/pastoralist/actions/workflows/ci.yml/badge.svg)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/yowainwright/pastoralist/badge)](https://scorecard.dev/viewer/?uri=github.com/yowainwright/pastoralist)
[![codecov](https://codecov.io/gh/yowainwright/pastoralist/branch/main/graph/badge.svg)](https://codecov.io/gh/yowainwright/pastoralist)
<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=6f41d7dd-fce9-49ea-ae43-040a51f458bd" />

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
<th width="50%">Without Pastoralist</th>
<th width="50%">With Pastoralist</th>
</tr>
</thead>
<tbody>
<tr>
<td width="50%" valign="top">
<pre lang="diff">{
  "overrides": {
-    // Why is this in overrides?
    "barn-yard": "2.0.0",
-    // Is this still needed?
    "old-goat": "4.1.0",
-    // What is the CVE?
    "escaped-sheep": "1.0.1",
-    // Is this a patch?
    "patchy-alpaca": "1.4.0"
  }
}</pre>
</td>
<td width="50%" valign="top">
<pre lang="diff">{
  "overrides": {
    "barn-yard": "2.0.0",
    "old-goat": "4.1.0",
    "escaped-sheep": "1.0.1",
    "patchy-alpaca": "1.4.0"
  },
  "pastoralist": {
    "appendix": {
+      // Keeps the gate API compatible with shepherd-cli.
      "barn-yard@2.0.0": {
        "ledger": {
          "addedDate": "2026-08-22T00:00:00.000Z",
          "reason": "Compatibility pin"
        }
      },
+      // shepherd-cli still depends on old-goat@^3.
      "old-goat@4.1.0": {
        "dependents": { "shepherd-cli": "old-goat@^3" }
      },
+      // Pins the fix for CVE-escaped-sheep.
      "escaped-sheep@1.0.1": {
        "ledger": {
          "addedDate": "2026-08-22T00:00:00.000Z",
          "cves": ["CVE-escaped-sheep"]
        }
      },
+      // Carries the local alpaca patch.
      "patchy-alpaca@1.4.0": {
        "patches": ["patches/patchy-alpaca+1.4.0.patch"]
      }
    }
  }
}</pre>
</td>
</tr>
</tbody>
</table>

Pastoralist keeps the package-manager instruction where it belongs and adds the
missing review record: why the override exists, which packages still need it,
which security provider found it, and when it can be removed.

<!-- first-run CLI commands from src/cli/parser/constants.ts and src/cli/cmds/init/ -->

---

## Quick Start

> [!NOTE]
> For the quick start section, we will be using `npx` as we're assuming pastoralist is not installed.
> Ensure your agent doesn't establish this pattern long term because it will use more memory.

Start with a read-only check:

```bash
npx pastoralist doctor
```

Or install it with Homebrew:

```bash
brew install yowainwright/tap/pastoralist
```

For first-run guidance across local use, agents, and CI:

```bash
npx pastoralist onboard
```

> [!NOTE]
> The onboarding output includes quick scripts and copy/paste prompts for agents.
> See the [Onboarding guide](https://jeffry.in/pastoralist/docs/onboarding) for the same checklist in the docs.

Set up the Pastoralist agent skill in a repo:

```bash
npx pastoralist --init agent-skill
```

Set up local dev with selected skills and hooks:

```bash
npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
```

When you are ready to add it to the project:

```bash
npm install pastoralist --save-dev
npx pastoralist init
npx pastoralist
```

Optionally keep the appendix current after installs:

```json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
```

Pastoralist can add that hook for you:

```bash
npx pastoralist --setup-hook
```

---

## What It Does

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

```jsonc
{
  "pastoralist": {
    "appendix": {
      "barn-yard@2.0.0": {
        "dependents": { "shepherd-cli": "barn-yard@^1" },
        "ledger": {
          "addedDate": "2026-08-22T00:00:00.000Z",
          "reason": "Keep the gate API compatible.",
        },
        //  the ledger object provides insight so you can quickly know why an override was added
      },
    },
  },
}
```

### Keep Security Context With the Override

Security records include the advisory, severity, provider, and patched version.

```jsonc
// we can provide an object ledger to make decisions clear
{
  "pastoralist": {
    "appendix": {
      "escaped-sheep@1.0.1": {
        "ledger": {
          "addedDate": "2026-08-22T00:00:00.000Z",
          "cves": ["CVE-escaped-sheep"],
          "severity": "high",
          "securityProvider": "osv",
          "patchedVersion": "1.0.1",
        },
      },
    },
  },
}
```

### Link Local Patches

Pastoralist records the `patch-package` files that support an override.

```jsonc
{
  "pastoralist": {
    "appendix": {
      // Connect this override to the patch that maintains it.
      "patchy-alpaca@1.4.0": {
        "patches": ["patches/patchy-alpaca+1.4.0.patch"],
      },
    },
  },
}
```

### Remove Stale Overrides Safely

Preview unused overrides before explicitly removing them.

```bash
# Show what would be removed without changing package.json.
pastoralist --remove-unused --dry-run

# Remove overrides confirmed as unused.
pastoralist --remove-unused
```

### Consolidate Workspace Overrides

Read workspace manifests and write one appendix in the root `package.json`.

```jsonc
{
  "pastoralist": {
    // Discover manifests from the package manager's workspace configuration.
    "depPaths": "workspace",
  },
}
```

### Run Pastoralist in CI

Choose preview, summary, quiet, or machine-readable output.

```bash
# Preview package.json changes.
pastoralist --dry-run

# Print package, override, and security metrics.
pastoralist --summary

# Report vulnerabilities with minimal output and a CI exit code.
pastoralist --quiet --checkSecurity

# Return structured output for another tool to consume.
pastoralist --outputFormat json
```

<!-- public CLI commands from src/cli/parser/constants.ts -->

## Commands

### Trace an Override to the Package That Needs It

Pastoralist reads the installed dependency graph from the lockfile.

```jsonc
// package-lock.json
{
  "packages": {
    // shepherd-cli still requests the older old-goat API.
    "node_modules/shepherd-cli": {
      "dependencies": {
        "old-goat": "^3.0.0",
      },
    },
    // The override resolves old-goat to the newer version.
    "node_modules/old-goat": {
      "version": "4.1.0",
    },
  },
}
```

```bash
# Preview the package.json update without writing it.
pastoralist --dry-run
```

```diff
+[DRY RUN] Would write to package.json
+└── Updating overrides
+    ├── old-goat@4.1.0
+    │   └── Used by: 1 package
+    └── 1 override applied
```

Pastoralist adds the relationship to `package.json`:

```diff
 {
   "overrides": {
     "old-goat": "4.1.0"
+  },
+  "pastoralist": {
+    "appendix": {
+      // shepherd-cli still requires old-goat's previous major version.
+      "old-goat@4.1.0": {
+        "dependents": {
+          "shepherd-cli": "old-goat@^3.0.0"
+        }
+      }
+    }
   }
 }
```

### Send Structured Results to CI

JSON output exposes the same result without terminal formatting.

```bash
# Return a machine-readable dry-run result.
pastoralist --dry-run --outputFormat json
```

```jsonc
{
  "success": true,
  "hasSecurityIssues": false,
  "hasUnusedOverrides": true,
  // Dry-run prevented package.json from being written.
  "updated": false,
  // These overrides can be reviewed for removal.
  "unusedOverrides": ["escaped-sheep@1.0.0"],
  "metrics": {
    "appendixEntriesUpdated": 2,
    "overridesRemoved": 0,
  },
}
```

## Setup Helpers

| Command                                                                               | Purpose                              |
| ------------------------------------------------------------------------------------- | ------------------------------------ |
| `npx pastoralist --init agent-skill`                                                  | Set up the Pastoralist agent skill   |
| `npx -p pastoralist pastoralist-setup-local-dev --help`                               | Show local dev setup options         |
| `npx -p pastoralist pastoralist-setup-local-dev --dry-run`                            | Preview agent, skill, and hook setup |
| `npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall` | Set up skills and hooks              |

## Configuration

Pastoralist supports several config file types.
It also provides an exportable schema.
You can do whatever crazy dynamic stuff you or your agent want to do!

<!-- supported configuration files from src/config/constants.ts and schema export from package.json -->

### Config Files

Pastoralist supports the following config file types.

- `package.json`
- `.pastoralistrc`
- `.pastoralistrc.json`
- `pastoralist.json`
- `pastoralist.config.cjs`
- `pastoralist.config.js`
- `pastoralist.config.mjs`

External JSON config files use top-level settings; `package.json` keeps settings under `pastoralist`.
Please let me know if we can support other configurations for you!

## Schema

The JSON Schema is exported as `pastoralist/schema.json`.

External JSON config files can reference `./node_modules/pastoralist/src/schema.json` with `$schema`.
Configs that reference this schema reject unknown or mistyped fields; other configs retain compatible validation behavior.

```jsonc
{
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": true,
    "security": {
      "provider": "osv",
      "severityThreshold": "medium",
      "hasWorkspaceSecurityChecks": true,
    },
  },
}
```

See [Configuration](https://jeffry.in/pastoralist/docs/configuration) and
[Workspaces](https://jeffry.in/pastoralist/docs/workspaces) for the full setup
surface.

## GitHub Action

Check override tracking on pull requests:

```yaml
name: Override Check
on: [pull_request]

jobs:
  pastoralist:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          check-security: false
```

The action can also run security checks, update files, or open scheduled
maintenance PRs. See the
[GitHub Action docs](https://jeffry.in/pastoralist/docs/github-action).

## Security and Release Assurance

Pastoralist can write to `package.json`, so the package should be boring to
verify.

<!-- release behavior from .github/workflows/publish.yml and .github/workflows/homebrew.yml -->

- Releases are published from GitHub Actions with npm provenance
- Published tarballs are packed before release and attached to GitHub Releases
  with artifact attestations
- ScriptC binaries are built, tested, and attested only for stable Homebrew releases
- Stable releases open a reviewed Homebrew tap update
- CI runs CodeQL, OpenSSF Scorecard, unit, integration, e2e, and dependency
  policy checks

You can verify registry signatures from your project:

```bash
npm audit signatures
```

Please reach out with any desired security requests and I will do my best to support you!

## Thanks

Shout out to [Bryant Cabrera](https://github.com/bryantcabrera) and
[Mardin](https://github.com/mardinyadegar) for the conversation, insight, and
pairing around this topic.

Made by [@yowainwright](https://github.com/yowainwright). [MIT](./LICENSE), 2022-2026.
