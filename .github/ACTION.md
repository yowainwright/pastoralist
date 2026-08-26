# Pastoralist GitHub Action

Automated dependency override management for npm, yarn, pnpm, and bun projects.

## Features

- **Security scanning** - Detect vulnerabilities in your dependency overrides
- **Auto-cleanup** - Remove unused overrides automatically
- **Override tracking** - Document why each override exists with full audit trail
- **PR automation** - Create pull requests with override updates on a schedule

## Quick Start

### Basic Usage (PR Check)

```diff
 name: Override Check
 on: [pull_request]

 jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
+      - uses: yowainwright/pastoralist@v1
+        with:
+          mode: check
```

### Scheduled PR Creation

```diff
 name: Override Maintenance
 on:
  schedule:
    - cron: "0 0 * * 1" # Weekly on Monday

+permissions:
+  contents: write
+  pull-requests: write

 jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
+      - uses: yowainwright/pastoralist@v1
+        with:
+          mode: pr
+          pr-title: "chore(deps): update dependency overrides"
+          pr-labels: "dependencies automated"
```

## Inputs

### `mode`

> Type: **`"check" | "update" | "pr"`**
> Default: `"update"`

Selects validation, direct file updates, or PR creation.

### `check-security`

> Type: **`boolean`**
> Default: `true`

Enables vulnerability scanning.

### `security-provider`

> Type: **`"osv" | "github" | "npm" | "snyk" | "socket" | "spektion"`**
> Default: `"osv"`

Selects the security provider used when `check-security` is enabled.

### `security-token`

> Type: **`string`**
> Default: unset

Passes a token to providers that require authentication.

### `auto-fix`

> Type: **`boolean`**
> Default: `true`

Applies security fixes automatically when the action can write files.

### `dry-run`

> Type: **`boolean`**
> Default: `false`

Previews changes without modifying files. `mode: check` always runs as a dry
run.

### `root-dir`

> Type: **`string`**
> Default: unset

Sets the project root directory passed to `pastoralist --root`.

### `dep-paths`

> Type: **`string`**
> Default: unset

Passes space-separated workspace package patterns to `pastoralist --depPaths`.

### `config`

> Type: **`string`**
> Default: unset

Deprecated. Config files are auto-detected from `root-dir`.

### `fail-on-security`

> Type: **`boolean`**
> Default: `true`

Fails the action when vulnerabilities are found.

### `fail-on-unused`

> Type: **`boolean`**
> Default: `false`

Fails the action when unused overrides are detected.

### `silent`

> Type: **`boolean`**
> Default: `false`

Deprecated compatibility input. The action ignores it and prints a warning when
it is enabled.

### `debug`

> Type: **`boolean`**
> Default: `false`

Passes `--debug` to Pastoralist.

### `pr-title`

> Type: **`string`**
> Default: `"chore(deps): update dependency overrides"`

Sets the PR title for `mode: pr`.

### `pr-body`

> Type: **`string`**
> Default: auto-generated

Sets the PR body for `mode: pr`.

### `pr-branch`

> Type: **`string`**
> Default: `"pastoralist/updates"`

Sets the PR branch for `mode: pr`.

### `pr-labels`

> Type: **`string`**
> Default: `"dependencies"`

Adds space-separated labels to the PR created by `mode: pr`.

### `github-token`

> Type: **`string`**
> Default: `github.token`

Sets the GitHub token for PR creation.

## Outputs

### `has-security-issues`

> Type: **`"true" | "false"`**
> Default: `"false"`

Reports whether vulnerabilities were found.

### `has-unused-overrides`

> Type: **`"true" | "false"`**
> Default: `"false"`

Reports whether unused overrides were detected.

### `updated`

> Type: **`"true" | "false"`**
> Default: `"false"`

Reports whether `package.json` was modified.

### `security-count`

> Type: **`number`**
> Default: `0`

Reports the number of security vulnerabilities found.

### `unused-count`

> Type: **`number`**
> Default: `0`

Reports the number of unused overrides detected.

### `override-count`

> Type: **`number`**
> Default: `0`

Reports the number of tracked overrides after the run.

### `pr-url`

> Type: **`string`**
> Default: `""`

Reports the created PR URL in `mode: pr`.

## Modes

### `check` - Validate Only

Runs pastoralist in dry-run mode. Reports issues without modifying files.

```diff
 - uses: yowainwright/pastoralist@v1
  with:
+    mode: check
```

### `update` - Modify Files (Default)

Runs pastoralist and modifies `package.json`. Use in workflows where you handle commits yourself.

```diff
 - uses: yowainwright/pastoralist@v1
  with:
+    mode: update

+- name: Commit changes
+  run: |
+    git config user.name github-actions[bot]
+    git config user.email github-actions[bot]@users.noreply.github.com
+    git add package.json
+    git diff --staged --quiet || git commit -m "chore: update overrides"
+    git push
```

### `pr` - Create Pull Request

Runs pastoralist and creates a PR if changes are needed. Ideal for scheduled workflows.

```diff
 - uses: yowainwright/pastoralist@v1
  with:
+    mode: pr
+    pr-title: "fix(security): update vulnerable overrides"
```

## Examples

### PR Check with Security Gate

```diff
 name: Override Security
 on: [pull_request]

 jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: yowainwright/pastoralist@v1
        with:
+          mode: check
+          fail-on-security: true
+          security-provider: osv
```

### Monorepo Support

```diff
 - uses: yowainwright/pastoralist@v1
  with:
+    dep-paths: "packages/*/package.json apps/*/package.json"
```

### Using GitHub Security Provider

```diff
 - uses: yowainwright/pastoralist@v1
  with:
+    security-provider: github
+    security-token: ${{ secrets.GITHUB_TOKEN }}
```

### Conditional PR on Vulnerabilities

```diff
 - uses: yowainwright/pastoralist@v1
+  id: pastoralist
  with:
+    mode: check

+- name: Create security PR
+  if: steps.pastoralist.outputs.has-security-issues == 'true'
+  run: |
+    # Custom PR logic here
```

### Weekly Maintenance with Slack Notification

```diff
 name: Weekly Override Maintenance
 on:
  schedule:
    - cron: "0 9 * * 1"

+permissions:
+  contents: write
+  pull-requests: write

 jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

+      - uses: yowainwright/pastoralist@v1
+        id: pastoralist
+        with:
+          mode: pr
+
+      - name: Notify Slack
+        if: steps.pastoralist.outputs.pr-url != ''
+        uses: slackapi/slack-github-action@v3.0.3
+        with:
+          payload: |
+            {
+              "text": "Pastoralist created a PR: ${{ steps.pastoralist.outputs.pr-url }}"
+            }
```

## Security Providers

### `security-provider: osv`

> Auth: **none**
> Default: selected when `security-provider` is unset

Uses the Open Source Vulnerabilities database.

### `security-provider: npm`

> Auth: **none**
> Default: unset

Uses the detected package manager's audit command.

### `security-provider: github`

> Auth: **required**
> Default: unset

Reads Dependabot alerts. Pass `GITHUB_TOKEN` or rely on an authenticated `gh`
CLI session.

### `security-provider: snyk`

> Auth: **required**
> Default: unset

Requires `SNYK_TOKEN`.

### `security-provider: socket`

> Auth: **required**
> Default: unset

Requires `SOCKET_SECURITY_API_KEY`.

### `security-provider: spektion`

> Auth: **required**
> Default: unset

Requires `SPEKTION_API_KEY`.

## Permissions

For `mode: pr`, the action needs write permissions:

```diff
 permissions:
+  contents: write
+  pull-requests: write
```

## Related

- [Pastoralist CLI](https://github.com/yowainwright/pastoralist) - The underlying CLI tool
- [Pastoralist Documentation](https://jeffry.in/pastoralist/) - Full documentation
