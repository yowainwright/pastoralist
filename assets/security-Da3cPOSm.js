import{a as e}from"./motion-kOo5Kq9S.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`Pastoralist can scan dependencies with security providers and record fixes
in the override appendix.`}),`
`,(0,t.jsx)(n.h2,{id:`overview`,children:`Overview`}),`
`,(0,t.jsx)(n.p,{children:`Security checks scan your dependencies, report vulnerable packages, and can
suggest or apply package-manager overrides when a patched version is available. The
appendix keeps the CVE, provider, severity, patched version, and reason with the
override.`}),`
`,(0,t.jsx)(n.h2,{id:`quick-start`,children:`Quick Start`}),`
`,(0,t.jsx)(n.h3,{id:`basic-check`,children:`Basic Check`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Check for vulnerabilities and display a report
pastoralist --checkSecurity --dry-run
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Applying fixes requires `,(0,t.jsx)(n.code,{children:`--interactive`}),`, `,(0,t.jsx)(n.code,{children:`--forceSecurityRefactor`}),`, or the
matching config option. Review changes and reinstall dependencies to update
the lockfile.`]}),`
`,(0,t.jsx)(n.h3,{id:`auto-fix`,children:`Auto Fix`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Automatically apply security fixes
pastoralist --checkSecurity --forceSecurityRefactor
`})}),`
`,(0,t.jsx)(n.h3,{id:`interactive`,children:`Interactive`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Choose which fixes to apply
pastoralist --checkSecurity --interactive
`})}),`
`,(0,t.jsx)(n.h3,{id:`workspaces`,children:`Workspaces`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Include workspace packages in the scan
pastoralist --checkSecurity --hasWorkspaceSecurityChecks
`})}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/security-scan?title=Pastoralist%20Security%20Scan&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,t.jsx)(n.h2,{id:`configuration`,children:`Configuration`}),`
`,(0,t.jsxs)(n.p,{children:[`You can configure security settings in your `,(0,t.jsx)(n.code,{children:`package.json`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
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
`})}),`
`,(0,t.jsx)(n.h3,{id:`configuration-options`,children:`Configuration Options`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Option`}),(0,t.jsx)(n.th,{children:`Type`}),(0,t.jsx)(n.th,{children:`Default`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`enabled`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Enable automatic security checks when running pastoralist`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`provider`})}),(0,t.jsx)(n.td,{children:`string or array`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`"osv"`})}),(0,t.jsxs)(n.td,{children:[`Provider: `,(0,t.jsx)(n.code,{children:`"osv"`}),`, `,(0,t.jsx)(n.code,{children:`"github"`}),`, `,(0,t.jsx)(n.code,{children:`"npm"`}),`, `,(0,t.jsx)(n.code,{children:`"snyk"`}),` [EXPERIMENTAL], `,(0,t.jsx)(n.code,{children:`"socket"`}),` [EXPERIMENTAL], `,(0,t.jsx)(n.code,{children:`"spektion"`}),` [EXPERIMENTAL]`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`autoFix`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Automatically apply security fixes without prompting`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`interactive`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Use interactive mode to select which fixes to apply`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`securityProviderToken`})}),(0,t.jsx)(n.td,{children:`string`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`""`})}),(0,t.jsx)(n.td,{children:`Authentication token for providers that require it. Prefer provider environment variables; use this only for controlled config that will not be committed.`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`hasWorkspaceSecurityChecks`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Include workspace packages in security scan`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`severityThreshold`})}),(0,t.jsx)(n.td,{children:`string`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`"medium"`})}),(0,t.jsx)(n.td,{children:`Minimum severity level to report (low, medium, high, critical)`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`excludePackages`})}),(0,t.jsx)(n.td,{children:`array`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`[]`})}),(0,t.jsx)(n.td,{children:`List of package names to exclude from security checks`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`strict`})}),(0,t.jsx)(n.td,{children:`boolean`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Fail when a provider cannot complete`})]})]})]}),`
`,(0,t.jsx)(n.h3,{id:`best-case-portfolio-selection`,children:`Best-Case Portfolio Selection`}),`
`,(0,t.jsxs)(n.p,{children:[`Independent upgrades can interact: one package fix may introduce a
vulnerability or compatibility failure in another package. Enable `,(0,t.jsx)(n.code,{children:`bestCase`}),`
to rank complete package-version portfolios under one policy:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
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
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Each patchable package contributes its current version, known patched versions,
and latest compatible version. Auto mode exhaustively evaluates small products
and uses deterministic beam search above the configured cap. The result includes
the selected state, decision ID, policy hash, vulnerability impact, duration,
evaluated-state count, and `,(0,t.jsx)(n.code,{children:`provenOptimal`}),` status.`]}),`
`,(0,t.jsx)(n.p,{children:`Declare a package as user-owned when its active override must win over portfolio
ranking. Interactive mode also prompts before promoting a newer independent
security update and persists an approved package name.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" /appendix/`,children:`{
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
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`userOwnedOverrides`}),` is the machine-readable ownership declaration. The active
override supplies the constrained version. The ledger `,(0,t.jsx)(n.code,{children:`addedDate`}),` is shown
as “user-owned since”, but the date alone does not establish ownership.`]}),`
`,(0,t.jsxs)(n.p,{children:[`The built-in evaluator scans root packages and candidate-controlled packages.
It does not materialize lockfiles or resolve peer compatibility. A patched
version is not a guarantee of compatibility or freedom from other vulnerabilities. Projects that materialize lockfiles, solve peer constraints, or model
version-combination behavior can pass a whole-state `,(0,t.jsx)(n.code,{children:`bestCaseEvaluator`}),` through
the Node.js API.`]}),`
`,(0,t.jsx)(n.h2,{id:`cli-options`,children:`CLI Options`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Option`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--checkSecurity`})}),(0,t.jsx)(n.td,{children:`Enable security vulnerability checking`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--forceSecurityRefactor`})}),(0,t.jsx)(n.td,{children:`Automatically apply security fixes without prompting`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--securityProvider <provider>`})}),(0,t.jsx)(n.td,{children:`Specify one or more security providers`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--securityProviderToken <token>`})}),(0,t.jsx)(n.td,{children:`Provide an authentication token for one-off/local use`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--interactive`})}),(0,t.jsx)(n.td,{children:`Use interactive mode to select fixes`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--hasWorkspaceSecurityChecks`})}),(0,t.jsx)(n.td,{children:`Include workspace packages in the security scan`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`--strict`})}),(0,t.jsx)(n.td,{children:`Fail on provider, network, or API errors`})]})]})]}),`
`,(0,t.jsx)(n.h3,{id:`token-handling`,children:`Token Handling`}),`
`,(0,t.jsxs)(n.p,{children:[`Set provider tokens with environment variables whenever possible:
`,(0,t.jsx)(n.code,{children:`GITHUB_TOKEN`}),`, `,(0,t.jsx)(n.code,{children:`SNYK_TOKEN`}),`, `,(0,t.jsx)(n.code,{children:`SOCKET_SECURITY_API_KEY`}),`, or `,(0,t.jsx)(n.code,{children:`SPEKTION_API_KEY`}),`.
`,(0,t.jsx)(n.code,{children:`securityProviderToken`}),` remains available for controlled local or generated
config, but do not commit real tokens to the repository.`]}),`
`,(0,t.jsx)(n.h2,{id:`release-assurance`,children:`Release Assurance`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist npm releases are published from GitHub Actions with npm provenance.
The release workflow also packs the npm tarball before publishing and creates a
GitHub artifact attestation for that exact tarball.`}),`
`,(0,t.jsx)(n.p,{children:`You can inspect provenance on the npm package page and verify registry
signatures from your own project:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm audit signatures
`})}),`
`,(0,t.jsx)(n.p,{children:`These checks prove where the package was built and which artifact was published.
They do not prove the code is bug-free, so the project also runs CI, CodeQL,
OpenSSF Scorecard, dependency update policy checks, and unit, integration, and
e2e tests.`}),`
`,(0,t.jsx)(n.h2,{id:`security-providers`,children:`Security Providers`}),`
`,(0,t.jsx)(n.h3,{id:`osv-open-source-vulnerabilities`,children:`OSV (Open Source Vulnerabilities)`}),`
`,(0,t.jsx)(n.p,{children:`Free and requires no token.`}),`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.a,{href:`https://osv.dev/`,children:`OSV database`}),` is a distributed vulnerability database for open source, created by Google and the open source community.`]}),`
`,(0,t.jsx)(n.h3,{id:`github-provider`,children:`GitHub Provider`}),`
`,(0,t.jsx)(n.p,{children:`Requires authentication. The GitHub provider reads your repository's
Dependabot alerts, including alerts for transitive dependencies.`}),`
`,(0,t.jsx)(n.h4,{id:`setup`,children:`Setup`}),`
`,(0,t.jsx)(n.p,{children:`The GitHub provider supports two authentication methods:`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Option 1: GitHub CLI`})}),`
`,(0,t.jsxs)(n.p,{children:[`If you have the `,(0,t.jsx)(n.a,{href:`https://cli.github.com/`,children:`GitHub CLI`}),` installed and authenticated, no additional setup is required:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Install and authenticate gh CLI
gh auth login

# Run pastoralist with GitHub provider
pastoralist --checkSecurity --securityProvider github
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Option 2: Personal Access Token`})}),`
`,(0,t.jsx)(n.p,{children:`If you don't have the GitHub CLI, you can provide a GitHub token:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Create a personal access token at `,(0,t.jsx)(n.a,{href:`https://github.com/settings/tokens`,children:`https://github.com/settings/tokens`}),` with `,(0,t.jsx)(n.code,{children:`repo`}),` scope`]}),`
`,(0,t.jsxs)(n.li,{children:[`Set the token as an environment variable:`,`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`export GITHUB_TOKEN="..."
`})}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`Or pass it via CLI in one-off/local use:`,`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist --checkSecurity --securityProvider github --securityProviderToken "$GITHUB_TOKEN"
`})}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h4,{id:`ci-permissions`,children:`CI Permissions`}),`
`,(0,t.jsx)(n.p,{children:`When using the GitHub provider in CI workflows, you need to:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.strong,{children:`Add workflow permissions:`})}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`permissions:
  contents: read
  vulnerability-alerts: read
`})}),`
`,(0,t.jsxs)(n.ol,{start:`2`,children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Enable Dependabot alerts`}),` in your repository: Settings → Code security and analysis → Dependabot alerts`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`If permissions are insufficient, Pastoralist displays a warning and continues.`}),`
`,(0,t.jsx)(n.h3,{id:`npm-audit-provider`,children:`npm Audit Provider`}),`
`,(0,t.jsx)(n.p,{children:`Runs the current package manager's audit command and converts the result into
Pastoralist security alerts.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist --checkSecurity --securityProvider npm
`})}),`
`,(0,t.jsx)(n.p,{children:`This provider uses the package manager detected for the project: npm, Yarn,
pnpm, or Bun.`}),`
`,(0,t.jsx)(n.h3,{id:`snyk-provider-experimental`,children:`Snyk Provider [EXPERIMENTAL]`}),`
`,(0,t.jsxs)(n.p,{children:[`The Snyk provider is experimental and may have breaking changes. Report issues at `,(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`https://github.com/yowainwright/pastoralist/issues`})]}),`
`,(0,t.jsx)(n.p,{children:`Requires the Snyk CLI and API authentication token.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Set your Snyk token
export SNYK_TOKEN="..."

# Run with Snyk provider
pastoralist --checkSecurity --securityProvider snyk
`})}),`
`,(0,t.jsx)(n.h3,{id:`socket-provider-experimental`,children:`Socket Provider [EXPERIMENTAL]`}),`
`,(0,t.jsxs)(n.p,{children:[`The Socket provider is experimental and may have breaking changes. Report issues at `,(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`https://github.com/yowainwright/pastoralist/issues`})]}),`
`,(0,t.jsx)(n.p,{children:`Requires the Socket CLI and API key.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Set your Socket API key
export SOCKET_SECURITY_API_KEY=your_key_here

# Run with Socket provider
pastoralist --checkSecurity --securityProvider socket
`})}),`
`,(0,t.jsx)(n.h3,{id:`spektion-provider-experimental`,children:`Spektion Provider [EXPERIMENTAL]`}),`
`,(0,t.jsxs)(n.p,{children:[`The Spektion provider is experimental and may have breaking changes. Report issues at `,(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`https://github.com/yowainwright/pastoralist/issues`})]}),`
`,(0,t.jsx)(n.p,{children:`Requires a Spektion API key.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Set your Spektion API key
export SPEKTION_API_KEY=your_key_here

# Run with Spektion provider
pastoralist --checkSecurity --securityProvider spektion
`})}),`
`,(0,t.jsx)(n.h2,{id:`cve-tracking-in-the-ledger`,children:`CVE Tracking in the Ledger`}),`
`,(0,t.jsxs)(n.p,{children:[`Expanded appendix entries have a `,(0,t.jsx)(n.code,{children:`ledger`}),`. When a security provider detects a fix,
Pastoralist adds CVE, severity, provider, and vulnerable-range metadata to that
ledger alongside the `,(0,t.jsx)(n.code,{children:`addedDate`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,t.jsxs)(n.p,{children:[`For packages with multiple CVEs, `,(0,t.jsx)(n.code,{children:`cveDetails`}),` records the severity and patched
version for each CVE when available. `,(0,t.jsx)(n.code,{children:`cves`}),` lists the unique CVE identifiers.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`reason`}),` accepts a non-empty string or a typed `,(0,t.jsx)(n.code,{children:`project`}),` or `,(0,t.jsx)(n.code,{children:`best-case`}),` object.
A best-case reason links each dependency entry to the shared portfolio decision;
the fixed CVEs remain in the sibling `,(0,t.jsx)(n.code,{children:`cves`}),` field.`]}),`
`,(0,t.jsxs)(n.h2,{id:`keeping-security-overrides-with-keep`,children:[`Keeping Security Overrides with `,(0,t.jsx)(n.code,{children:`keep`})]}),`
`,(0,t.jsxs)(n.p,{children:[`By default, `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` removes overrides whose dependents no longer
require them. For security overrides you want to retain, set `,(0,t.jsx)(n.code,{children:`keep`}),` on the
ledger:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`{5}`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": true
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`For expiring keeps, use a `,(0,t.jsx)(n.code,{children:`KeepConstraint`}),` object:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`{5}`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": {
      "reason": "Waiting for upstream patch",
      "untilVersion": "4.18.0"
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Once the root dependency reaches `,(0,t.jsx)(n.code,{children:`4.18.0`}),`, the keep is expired and
`,(0,t.jsx)(n.code,{children:`--remove-unused`}),` can treat it as removable again.`]}),`
`,(0,t.jsx)(n.h2,{id:`how-it-works`,children:`How It Works`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Scanning`}),`: Pastoralist extracts all dependencies from your `,(0,t.jsx)(n.code,{children:`package.json`}),` (and optionally workspace packages)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Checking`}),`: Dependencies are checked against the configured provider or providers`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Reporting`}),`: Vulnerable packages are displayed with severity levels and available fixes`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Fixing`}),`: If fixes are available, Pastoralist can:`,`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Display them for review`}),`
`,(0,t.jsxs)(n.li,{children:[`Apply them automatically (with `,(0,t.jsx)(n.code,{children:`--forceSecurityRefactor`}),`)`]}),`
`,(0,t.jsxs)(n.li,{children:[`Let you choose interactively (with `,(0,t.jsx)(n.code,{children:`--interactive`}),`)`]}),`
`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Applying`}),`: Selected fixes are added to your `,(0,t.jsx)(n.code,{children:`package.json`}),` overrides section with full CVE context in the ledger`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`performance-considerations`,children:`Performance Considerations`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Security scanning is `,(0,t.jsx)(n.strong,{children:`disabled by default`}),` for CLI config and enabled by default in the GitHub Action`]}),`
`,(0,t.jsxs)(n.li,{children:[`Workspace scanning is `,(0,t.jsx)(n.strong,{children:`opt-in`}),` via the `,(0,t.jsx)(n.code,{children:`hasWorkspaceSecurityChecks`}),` option`]}),`
`,(0,t.jsx)(n.li,{children:`The OSV provider is optimized for batch queries`}),`
`,(0,t.jsx)(n.li,{children:`Provider results can be cached using the CLI cache options`}),`
`,(0,t.jsx)(n.li,{children:`Results are processed in parallel when possible`}),`
`,(0,t.jsx)(n.li,{children:`Best-case results record duration and evaluated-state count`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`limitations`,children:`Limitations`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Security checks focus on npm ecosystem packages`}),`
`,(0,t.jsx)(n.li,{children:`Some providers require credentials or local CLI access`}),`
`,(0,t.jsx)(n.li,{children:`Some vulnerabilities may not have available fixes`}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`--dry-run`}),` prevents project-file changes; providers may still write caches`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`troubleshooting`,children:`Troubleshooting`}),`
`,(0,t.jsx)(n.h3,{id:`no-vulnerabilities-found-when-expected`,children:`No vulnerabilities found when expected`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Ensure you're using the latest version of Pastoralist`}),`
`,(0,t.jsxs)(n.li,{children:[`Check that your dependencies are correctly specified in `,(0,t.jsx)(n.code,{children:`package.json`})]}),`
`,(0,t.jsxs)(n.li,{children:[`Try running with `,(0,t.jsx)(n.code,{children:`--debug`}),` to see detailed logs`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`fixes-not-being-applied`,children:`Fixes not being applied`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Verify you have write permissions to `,(0,t.jsx)(n.code,{children:`package.json`})]}),`
`,(0,t.jsx)(n.li,{children:`Check for existing overrides that might conflict`}),`
`,(0,t.jsx)(n.li,{children:`Ensure the package manager supports overrides`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`performance-issues`,children:`Performance issues`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Disable workspace scanning if not needed`}),`
`,(0,t.jsxs)(n.li,{children:[`Consider excluding large dependency trees with `,(0,t.jsx)(n.code,{children:`excludePackages`})]}),`
`,(0,t.jsx)(n.li,{children:`Use severity threshold to limit results`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`github-provider-shows-security-check-skipped`,children:`GitHub provider shows "security check skipped"`}),`
`,(0,t.jsx)(n.p,{children:`This happens when the GitHub API can't access Dependabot alerts. To fix:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Add `,(0,t.jsx)(n.code,{children:`vulnerability-alerts: read`}),` permission to your workflow`]}),`
`,(0,t.jsx)(n.li,{children:`Enable Dependabot alerts in Settings → Code security and analysis`}),`
`,(0,t.jsxs)(n.li,{children:[`Ensure the `,(0,t.jsx)(n.code,{children:`GITHUB_TOKEN`}),` is available in your workflow`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist will show specific guidance in the warning message.`}),`
`,(0,t.jsx)(n.h2,{id:`example-ci-integration`,children:`Example: CI Integration`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`--quiet --checkSecurity`}),` exits non-zero on findings. Add `,(0,t.jsx)(n.code,{children:`--strict`}),` to fail on
provider errors and `,(0,t.jsx)(n.code,{children:`--dry-run`}),` to preview project changes.`]}),`
`,(0,t.jsx)(n.h3,{id:`github-actions`,children:`GitHub Actions`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,"data-meta":`title=".github/workflows/security.yml"`,children:`name: Security Check
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
`})}),`
`,(0,t.jsx)(n.p,{children:`For OSV provider (no permissions needed):`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,"data-meta":`title=".github/workflows/security.yml"`,children:`name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6.4.0
      - run: npm install
      - run: npx pastoralist --dry-run --quiet --checkSecurity --strict
`})}),`
`,(0,t.jsx)(n.h3,{id:`gitlab-ci`,children:`GitLab CI`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,"data-meta":`title=".gitlab-ci.yml"`,children:`security:
  script:
    - npm install
    - npx pastoralist --dry-run --quiet --checkSecurity --strict
  only:
    - main
    - merge_requests
`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`overview`,text:`Overview`},{depth:2,slug:`quick-start`,text:`Quick Start`},{depth:3,slug:`basic-check`,text:`Basic Check`},{depth:3,slug:`auto-fix`,text:`Auto Fix`},{depth:3,slug:`interactive`,text:`Interactive`},{depth:3,slug:`workspaces`,text:`Workspaces`},{depth:2,slug:`configuration`,text:`Configuration`},{depth:3,slug:`configuration-options`,text:`Configuration Options`},{depth:3,slug:`best-case-portfolio-selection`,text:`Best-Case Portfolio Selection`},{depth:2,slug:`cli-options`,text:`CLI Options`},{depth:3,slug:`token-handling`,text:`Token Handling`},{depth:2,slug:`release-assurance`,text:`Release Assurance`},{depth:2,slug:`security-providers`,text:`Security Providers`},{depth:3,slug:`osv-open-source-vulnerabilities`,text:`OSV (Open Source Vulnerabilities)`},{depth:3,slug:`github-provider`,text:`GitHub Provider`},{depth:4,slug:`setup`,text:`Setup`},{depth:4,slug:`ci-permissions`,text:`CI Permissions`},{depth:3,slug:`npm-audit-provider`,text:`npm Audit Provider`},{depth:3,slug:`snyk-provider-experimental`,text:`Snyk Provider [EXPERIMENTAL]`},{depth:3,slug:`socket-provider-experimental`,text:`Socket Provider [EXPERIMENTAL]`},{depth:3,slug:`spektion-provider-experimental`,text:`Spektion Provider [EXPERIMENTAL]`},{depth:2,slug:`cve-tracking-in-the-ledger`,text:`CVE Tracking in the Ledger`},{depth:2,slug:`keeping-security-overrides-with-keep`,text:"Keeping Security Overrides with `keep`"},{depth:2,slug:`how-it-works`,text:`How It Works`},{depth:2,slug:`performance-considerations`,text:`Performance Considerations`},{depth:2,slug:`limitations`,text:`Limitations`},{depth:2,slug:`troubleshooting`,text:`Troubleshooting`},{depth:3,slug:`no-vulnerabilities-found-when-expected`,text:`No vulnerabilities found when expected`},{depth:3,slug:`fixes-not-being-applied`,text:`Fixes not being applied`},{depth:3,slug:`performance-issues`,text:`Performance issues`},{depth:3,slug:`github-provider-shows-security-check-skipped`,text:`GitHub provider shows "security check skipped"`},{depth:2,slug:`example-ci-integration`,text:`Example: CI Integration`},{depth:3,slug:`github-actions`,text:`GitHub Actions`},{depth:3,slug:`gitlab-ci`,text:`GitLab CI`}];export{r as default,i as headings};