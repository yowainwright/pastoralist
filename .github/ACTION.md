# Pastoralist GitHub Action

Automated dependency override management for npm, yarn, pnpm, and bun projects.

## Features

- **Security scanning** - Detect vulnerabilities in your dependency overrides
- **Auto-cleanup** - Remove unused overrides automatically
- **Override tracking** - Document why each override exists with full audit trail
- **PR automation** - Create pull requests with override updates on a schedule

## Quick Start

### Basic Usage (PR Check)

```yaml
name: Override Check
on: [pull_request]

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
```

### Scheduled PR Creation

```yaml
name: Override Maintenance
on:
  schedule:
    - cron: "0 0 * * 1" # Weekly on Monday

permissions:
  contents: write
  pull-requests: write

jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
      - uses: yowainwright/pastoralist@v1
        with:
          mode: pr
          pr-title: "chore(deps): update dependency overrides"
          pr-labels: "dependencies automated"
```

## Inputs

| Input               | Description                                                | Default                                    |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `mode`              | Operation mode: `check`, `update`, or `pr`                 | `update`                                   |
| `check-security`    | Enable security scanning                                   | `true`                                     |
| `security-provider` | Provider: `osv`, `github`, `snyk`, `socket`                | `osv`                                      |
| `security-token`    | Token for security provider                                | -                                          |
| `auto-fix`          | Apply security fixes automatically                         | `true`                                     |
| `dry-run`           | Preview changes only                                       | `false`                                    |
| `root-dir`          | Project root directory                                     | -                                          |
| `dep-paths`         | Workspace patterns (space-separated)                       | -                                          |
| `config`            | Deprecated; config files are auto-detected from `root-dir` | -                                          |
| `fail-on-security`  | Fail if vulnerabilities found                              | `true`                                     |
| `fail-on-unused`    | Fail if unused overrides found                             | `false`                                    |
| `silent`            | Suppress output                                            | `false`                                    |
| `debug`             | Enable debug logging                                       | `false`                                    |
| `pr-title`          | PR title (mode: pr)                                        | `chore(deps): update dependency overrides` |
| `pr-body`           | PR body (mode: pr)                                         | Auto-generated                             |
| `pr-branch`         | PR branch name (mode: pr)                                  | `pastoralist/updates`                      |
| `pr-labels`         | PR labels (space-separated)                                | `dependencies`                             |
| `github-token`      | GitHub token for PR creation                               | `GITHUB_TOKEN`                             |

## Outputs

| Output                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `has-security-issues`  | `true` if vulnerabilities were found     |
| `has-unused-overrides` | `true` if unused overrides detected      |
| `updated`              | `true` if package.json was modified      |
| `security-count`       | Number of security vulnerabilities found |
| `pr-url`               | URL of created PR (mode: pr only)        |

## Modes

### `check` - Validate Only

Runs pastoralist in dry-run mode. Reports issues without modifying files.

```yaml
permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
```

### `update` - Modify Files (Default)

Runs pastoralist and modifies `package.json`. Use in workflows where you handle commits yourself.

```yaml
permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
      - uses: yowainwright/pastoralist@v1
        with:
          mode: update
      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package.json
          git diff --staged --quiet || git commit -m "chore: update overrides"
          git push
```

### `pr` - Create Pull Request

Runs pastoralist and creates a PR if changes are needed. Ideal for scheduled workflows.

```yaml
permissions:
  contents: write
  pull-requests: write

jobs:
  pr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
      - uses: yowainwright/pastoralist@v1
        with:
          mode: pr
          pr-title: "fix(security): update vulnerable overrides"
```

## Examples

### PR Check with Security Gate

```yaml
name: Override Security
on: [pull_request]

permissions:
  contents: read

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          fail-on-security: true
          security-provider: osv
```

### Monorepo Support

```yaml
permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
      - uses: yowainwright/pastoralist@v1
        with:
          dep-paths: "packages/*/package.json apps/*/package.json"
```

### Using GitHub Security Provider

```yaml
- uses: yowainwright/pastoralist@v1
  with:
    security-provider: github
    security-token: ${{ secrets.GITHUB_TOKEN }}
```

### Conditional PR on Vulnerabilities

```yaml
- uses: yowainwright/pastoralist@v1
  id: pastoralist
  with:
    mode: check

- name: Create security PR
  if: steps.pastoralist.outputs.has-security-issues == 'true'
  run: |
    # Custom PR logic here
```

### Weekly Maintenance PR

```yaml
name: Override Maintenance
on:
  schedule:
    - cron: "0 9 * * 1"

permissions:
  contents: write
  pull-requests: write

jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
      - uses: yowainwright/pastoralist@v1
        id: pastoralist
        with:
          mode: pr
      - name: Summary
        if: steps.pastoralist.outputs.pr-url != ''
        run: echo "Created PR - ${{ steps.pastoralist.outputs.pr-url }}"
```

### Extending with Notifications

The `pr-url` output lets you wire in any notification system after the action runs:

```yaml
- uses: yowainwright/pastoralist@v1
  id: pastoralist
  with:
    mode: pr

# Example: send to Slack, Teams, Discord, etc.
- name: Notify
  if: steps.pastoralist.outputs.pr-url != ''
  run: |
    curl -s -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"Override PR created: ${{ steps.pastoralist.outputs.pr-url }}\"}"
  env:
    WEBHOOK_URL: ${{ secrets.NOTIFY_WEBHOOK_URL }}
```

## Security

All action references in these examples are pinned to commit SHAs. This protects
against supply-chain attacks where a mutable version tag (e.g. `@v4`) is silently
moved to point at different — potentially malicious — code.

When upgrading an action, update both the SHA and the version comment together.
Tools like [Dependabot](https://docs.github.com/en/code-security/dependabot) or
[Renovate](https://docs.renovatebot.com/) can automate this for you.

## Security Providers

| Provider | Auth Required | Notes                                          |
| -------- | ------------- | ---------------------------------------------- |
| `osv`    | No            | Open Source Vulnerabilities database (default) |
| `github` | Yes           | GitHub Security API, good transitive scanning  |
| `snyk`   | Yes           | Requires Snyk API token                        |
| `socket` | Yes           | Socket.dev, supply chain focused               |

## Permissions

Declare only the permissions your workflow needs:

| Mode     | Required permissions                      |
| -------- | ----------------------------------------- |
| `check`  | `contents: read`                          |
| `update` | `contents: write`                         |
| `pr`     | `contents: write`, `pull-requests: write` |

## Related

- [Pastoralist CLI](https://github.com/yowainwright/pastoralist) - The underlying CLI tool
- [Pastoralist Documentation](https://yowainwright.github.io/pastoralist/) - Full documentation
