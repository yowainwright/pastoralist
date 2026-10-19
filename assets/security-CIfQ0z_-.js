var e=`---
title: Security Vulnerability Detection
description: Detect vulnerabilities and select lowest-risk dependency portfolios
---

Pastoralist can scan dependencies with security providers and record fixes
in the override appendix.

## Overview

Security checks scan your dependencies, report vulnerable packages, and can
suggest or apply package-manager overrides when a patched version is available. The
appendix keeps the CVE, provider, severity, patched version, and reason with the
override.

## Quick Start

### Basic Check

\`\`\`bash
# Check for vulnerabilities and display a report
pastoralist --checkSecurity --dry-run
\`\`\`

Applying fixes requires \`--interactive\`, \`--forceSecurityRefactor\`, or the
matching config option. Review changes and reinstall dependencies to update
the lockfile.

### Auto Fix

\`\`\`bash
# Automatically apply security fixes
pastoralist --checkSecurity --forceSecurityRefactor
\`\`\`

### Interactive

\`\`\`bash
# Choose which fixes to apply
pastoralist --checkSecurity --interactive
\`\`\`

### Workspaces

\`\`\`bash
# Include workspace packages in the scan
pastoralist --checkSecurity --hasWorkspaceSecurityChecks
\`\`\`

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/security-scan?title=Pastoralist%20Security%20Scan&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

## Configuration

You can configure security settings in your \`package.json\`:

\`\`\`json title="package.json"
{
  "pastoralist": {
    "security": {
      "enabled": false,
      "provider": "osv",
      "autoFix": false,
      "interactive": false,
      "hasWorkspaceSecurityChecks": false,
      "severityThreshold": "medium",
      "excludePackages": []
    },
    "bestCase": {
      "enabled": false,
      "userOwnedOverrides": []
    }
  }
}
\`\`\`

### Configuration Options

| Option                       | Type            | Default    | Description                                                                                                                                                |
| ---------------------------- | --------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \`enabled\`                    | boolean         | \`false\`    | Enable automatic security checks when running pastoralist                                                                                                  |
| \`provider\`                   | string or array | \`"osv"\`    | Provider: \`"osv"\`, \`"github"\`, \`"npm"\`, \`"snyk"\` [EXPERIMENTAL], \`"socket"\` [EXPERIMENTAL], \`"spektion"\` [EXPERIMENTAL]                                    |
| \`autoFix\`                    | boolean         | \`false\`    | Automatically apply security fixes without prompting                                                                                                       |
| \`interactive\`                | boolean         | \`false\`    | Use interactive mode to select which fixes to apply                                                                                                        |
| \`securityProviderToken\`      | string          | \`""\`       | Authentication token for providers that require it. Prefer provider environment variables; use this only for controlled config that will not be committed. |
| \`hasWorkspaceSecurityChecks\` | boolean         | \`false\`    | Include workspace packages in security scan                                                                                                                |
| \`severityThreshold\`          | string          | \`"medium"\` | Minimum severity level to report (low, medium, high, critical)                                                                                             |
| \`excludePackages\`            | array           | \`[]\`       | List of package names to exclude from security checks                                                                                                      |
| \`strict\`                     | boolean         | \`false\`    | Fail when a provider cannot complete                                                                                                                       |

### Best-Case Portfolio Selection

Independent upgrades can interact: one package fix may introduce a
vulnerability or compatibility failure in another package. Enable \`bestCase\`
to rank complete package-version portfolios under one policy:

\`\`\`json title="package.json"
{
  "pastoralist": {
    "checkSecurity": true,
    "bestCase": {
      "enabled": true,
      "riskAggregation": "both",
      "search": {
        "mode": "auto",
        "exactStateLimit": 256,
        "beamWidth": 16,
        "maxEvaluations": 1000
      }
    }
  }
}
\`\`\`

Each patchable package contributes its current version, known patched versions,
and latest compatible version. Auto mode exhaustively evaluates small products
and uses deterministic beam search above the configured cap. The result includes
the selected state, decision ID, policy hash, vulnerability impact, duration,
evaluated-state count, and \`provenOptimal\` status.

Declare a package as user-owned when its active override must win over portfolio
ranking. Interactive mode also prompts before promoting a newer independent
security update and persists an approved package name.

\`\`\`json title="package.json" /appendix/
{
  "overrides": {
    "alpha": "2.5.0"
  },
  "pastoralist": {
    "bestCase": {
      "enabled": true,
      "userOwnedOverrides": ["alpha"]
    },
    "appendix": {
      "alpha@2.5.0": {
        "ledger": {
          "addedDate": "2026-08-09T00:00:00.000Z"
        }
      }
    }
  }
}
\`\`\`

\`userOwnedOverrides\` is the machine-readable ownership declaration. The active
override supplies the constrained version. The ledger \`addedDate\` is shown
as “user-owned since”, but the date alone does not establish ownership.

The built-in evaluator scans root packages and candidate-controlled packages.
It does not materialize lockfiles or resolve peer compatibility. A patched
version is not a guarantee of compatibility or freedom from other vulnerabilities. Projects that materialize lockfiles, solve peer constraints, or model
version-combination behavior can pass a whole-state \`bestCaseEvaluator\` through
the Node.js API.

## CLI Options

| Option                            | Description                                           |
| --------------------------------- | ----------------------------------------------------- |
| \`--checkSecurity\`                 | Enable security vulnerability checking                |
| \`--forceSecurityRefactor\`         | Automatically apply security fixes without prompting  |
| \`--securityProvider <provider>\`   | Specify one or more security providers                |
| \`--securityProviderToken <token>\` | Provide an authentication token for one-off/local use |
| \`--interactive\`                   | Use interactive mode to select fixes                  |
| \`--hasWorkspaceSecurityChecks\`    | Include workspace packages in the security scan       |
| \`--strict\`                        | Fail on provider, network, or API errors              |

### Token Handling

Set provider tokens with environment variables whenever possible:
\`GITHUB_TOKEN\`, \`SNYK_TOKEN\`, \`SOCKET_SECURITY_API_KEY\`, or \`SPEKTION_API_KEY\`.
\`securityProviderToken\` remains available for controlled local or generated
config, but do not commit real tokens to the repository.

## Release Assurance

Pastoralist npm releases are published from GitHub Actions with npm provenance.
The release workflow also packs the npm tarball before publishing and creates a
GitHub artifact attestation for that exact tarball.

You can inspect provenance on the npm package page and verify registry
signatures from your own project:

\`\`\`bash
npm audit signatures
\`\`\`

These checks prove where the package was built and which artifact was published.
They do not prove the code is bug-free, so the project also runs CI, CodeQL,
OpenSSF Scorecard, dependency update policy checks, and unit, integration, and
e2e tests.

## Security Providers

### OSV (Open Source Vulnerabilities)

Free and requires no token.

The [OSV database](https://osv.dev/) is a distributed vulnerability database for open source, created by Google and the open source community.

### GitHub Provider

Requires authentication. The GitHub provider reads your repository's
Dependabot alerts, including alerts for transitive dependencies.

#### Setup

The GitHub provider supports two authentication methods:

**Option 1: GitHub CLI**

If you have the [GitHub CLI](https://cli.github.com/) installed and authenticated, no additional setup is required:

\`\`\`bash
# Install and authenticate gh CLI
gh auth login

# Run pastoralist with GitHub provider
pastoralist --checkSecurity --securityProvider github
\`\`\`

**Option 2: Personal Access Token**

If you don't have the GitHub CLI, you can provide a GitHub token:

1. Create a personal access token at https://github.com/settings/tokens with \`repo\` scope
2. Set the token as an environment variable:
   \`\`\`bash
   export GITHUB_TOKEN="..."
   \`\`\`
3. Or pass it via CLI in one-off/local use:
   \`\`\`bash
   pastoralist --checkSecurity --securityProvider github --securityProviderToken "$GITHUB_TOKEN"
   \`\`\`

#### CI Permissions

When using the GitHub provider in CI workflows, you need to:

1. **Add workflow permissions:**

\`\`\`yaml
permissions:
  contents: read
  vulnerability-alerts: read
\`\`\`

2. **Enable Dependabot alerts** in your repository: Settings → Code security and analysis → Dependabot alerts

If permissions are insufficient, Pastoralist displays a warning and continues.

### npm Audit Provider

Runs the current package manager's audit command and converts the result into
Pastoralist security alerts.

\`\`\`bash
pastoralist --checkSecurity --securityProvider npm
\`\`\`

This provider uses the package manager detected for the project: npm, Yarn,
pnpm, or Bun.

### Snyk Provider [EXPERIMENTAL]

The Snyk provider is experimental and may have breaking changes. Report issues at https://github.com/yowainwright/pastoralist/issues

Requires the Snyk CLI and API authentication token.

\`\`\`bash
# Set your Snyk token
export SNYK_TOKEN="..."

# Run with Snyk provider
pastoralist --checkSecurity --securityProvider snyk
\`\`\`

### Socket Provider [EXPERIMENTAL]

The Socket provider is experimental and may have breaking changes. Report issues at https://github.com/yowainwright/pastoralist/issues

Requires the Socket CLI and API key.

\`\`\`bash
# Set your Socket API key
export SOCKET_SECURITY_API_KEY=your_key_here

# Run with Socket provider
pastoralist --checkSecurity --securityProvider socket
\`\`\`

### Spektion Provider [EXPERIMENTAL]

The Spektion provider is experimental and may have breaking changes. Report issues at https://github.com/yowainwright/pastoralist/issues

Requires a Spektion API key.

\`\`\`bash
# Set your Spektion API key
export SPEKTION_API_KEY=your_key_here

# Run with Spektion provider
pastoralist --checkSecurity --securityProvider spektion
\`\`\`

## CVE Tracking in the Ledger

Expanded appendix entries have a \`ledger\`. When a security provider detects a fix,
Pastoralist adds CVE, severity, provider, and vulnerable-range metadata to that
ledger alongside the \`addedDate\`:

\`\`\`json
{
  "lodash@4.17.21": {
    "dependents": { "my-app": "lodash@^4.17.0" },
    "ledger": {
      "addedDate": "2026-05-30T00:00:00.000Z",
      "source": "security",
      "securityChecked": true,
      "securityProvider": "osv",
      "cves": ["CVE-2021-23337"],
      "cveDetails": [
        {
          "cve": "CVE-2021-23337",
          "severity": "high",
          "patchedVersion": "4.17.21"
        }
      ],
      "severity": "high",
      "vulnerableRange": "<4.17.21",
      "patchedVersion": "4.17.21"
    }
  }
}
\`\`\`

For packages with multiple CVEs, \`cveDetails\` records the severity and patched
version for each CVE when available. \`cves\` lists the unique CVE identifiers.

\`reason\` accepts a non-empty string or a typed \`project\` or \`best-case\` object.
A best-case reason links each dependency entry to the shared portfolio decision;
the fixed CVEs remain in the sibling \`cves\` field.

## Keeping Security Overrides with \`keep\`

By default, \`--remove-unused\` removes overrides whose dependents no longer
require them. For security overrides you want to retain, set \`keep\` on the
ledger:

\`\`\`json {5}
{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": true
  }
}
\`\`\`

For expiring keeps, use a \`KeepConstraint\` object:

\`\`\`json {5}
{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": {
      "reason": "Waiting for upstream patch",
      "untilVersion": "4.18.0"
    }
  }
}
\`\`\`

Once the root dependency reaches \`4.18.0\`, the keep is expired and
\`--remove-unused\` can treat it as removable again.

## How It Works

1. **Scanning**: Pastoralist extracts all dependencies from your \`package.json\` (and optionally workspace packages)
2. **Checking**: Dependencies are checked against the configured provider or providers
3. **Reporting**: Vulnerable packages are displayed with severity levels and available fixes
4. **Fixing**: If fixes are available, Pastoralist can:
   - Display them for review
   - Apply them automatically (with \`--forceSecurityRefactor\`)
   - Let you choose interactively (with \`--interactive\`)
5. **Applying**: Selected fixes are added to your \`package.json\` overrides section with full CVE context in the ledger

## Performance Considerations

- Security scanning is **disabled by default** for CLI config and enabled by default in the GitHub Action
- Workspace scanning is **opt-in** via the \`hasWorkspaceSecurityChecks\` option
- The OSV provider is optimized for batch queries
- Provider results can be cached using the CLI cache options
- Results are processed in parallel when possible
- Best-case results record duration and evaluated-state count

## Limitations

- Security checks focus on npm ecosystem packages
- Some providers require credentials or local CLI access
- Some vulnerabilities may not have available fixes
- \`--dry-run\` prevents project-file changes; providers may still write caches

## Troubleshooting

### No vulnerabilities found when expected

- Ensure you're using the latest version of Pastoralist
- Check that your dependencies are correctly specified in \`package.json\`
- Try running with \`--debug\` to see detailed logs

### Fixes not being applied

- Verify you have write permissions to \`package.json\`
- Check for existing overrides that might conflict
- Ensure the package manager supports overrides

### Performance issues

- Disable workspace scanning if not needed
- Consider excluding large dependency trees with \`excludePackages\`
- Use severity threshold to limit results

### GitHub provider shows "security check skipped"

This happens when the GitHub API can't access Dependabot alerts. To fix:

1. Add \`vulnerability-alerts: read\` permission to your workflow
2. Enable Dependabot alerts in Settings → Code security and analysis
3. Ensure the \`GITHUB_TOKEN\` is available in your workflow

Pastoralist will show specific guidance in the warning message.

## Example: CI Integration

\`--quiet --checkSecurity\` exits non-zero on findings. Add \`--strict\` to fail on
provider errors and \`--dry-run\` to preview project changes.

### GitHub Actions

\`\`\`yaml title=".github/workflows/security.yml"
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      vulnerability-alerts: read # Required for GitHub provider
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6.4.0
      - run: npm install
      - run: npx pastoralist --dry-run --quiet --checkSecurity --securityProvider github --strict
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

For OSV provider (no permissions needed):

\`\`\`yaml title=".github/workflows/security.yml"
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6.4.0
      - run: npm install
      - run: npx pastoralist --dry-run --quiet --checkSecurity --strict
\`\`\`

### GitLab CI

\`\`\`yaml title=".gitlab-ci.yml"
security:
  script:
    - npm install
    - npx pastoralist --dry-run --quiet --checkSecurity --strict
  only:
    - main
    - merge_requests
\`\`\`
`;export{e as default};