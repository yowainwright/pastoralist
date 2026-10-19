import{a as e}from"./motion-kOo5Kq9S.js";var t=e();function n(e){let n={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[`CLI flags take precedence over `,(0,t.jsx)(n.code,{children:`package.json`}),` settings, which take precedence
over external config files. Security settings are deep merged across sources.`]}),`
`,(0,t.jsx)(n.h2,{id:`configuration-files`,children:`Configuration Files`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist searches for configuration files in this order (first found wins):`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`.pastoralistrc`}),` (JSON format)`]}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:`.pastoralistrc.json`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:`pastoralist.json`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:`pastoralist.config.cjs`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:`pastoralist.config.js`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:`pastoralist.config.mjs`})}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`All external config files use the same top-level Pastoralist settings. Choose
the filename by format and convention:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`.pastoralistrc`}),`: extensionless rc file parsed as JSON`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`.pastoralistrc.json`}),`: explicit JSON rc file, and the JSON option created by
`,(0,t.jsx)(n.code,{children:`pastoralist init`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`pastoralist.json`}),`: visible non-dotfile JSON config`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`pastoralist.config.cjs`}),`: CommonJS module with `,(0,t.jsx)(n.code,{children:`module.exports`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`pastoralist.config.js`}),`: JavaScript config. CommonJS exports are accepted;
otherwise it is imported as a module`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`pastoralist.config.mjs`}),`: ESM module with `,(0,t.jsx)(n.code,{children:`export default`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Use `,(0,t.jsx)(n.code,{children:`pastoralist.json`}),`, not `,(0,t.jsx)(n.code,{children:`.pastoralist.json`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`example-configurations`,children:`Example Configurations`}),`
`,(0,t.jsx)(n.h4,{id:`minimal-configuration`,children:`Minimal Configuration`}),`
`,(0,t.jsx)(n.p,{children:`Enable security checks with OSV:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "checkSecurity": true
}
`})}),`
`,(0,t.jsx)(n.h4,{id:`pastoralistrcjson`,children:(0,t.jsx)(n.code,{children:`.pastoralistrc.json`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title=".pastoralistrc.json"`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "medium"
  }
}
`})}),`
`,(0,t.jsx)(n.h4,{id:`pastoralistconfigjs`,children:(0,t.jsx)(n.code,{children:`pastoralist.config.js`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-js`,"data-meta":`title="pastoralist.config.js"`,children:`module.exports = {
  depPaths: ["packages/*/package.json", "apps/*/package.json"],
  checkSecurity: true,
  security: {
    provider: "osv",
    severityThreshold: "high",
    excludePackages: ["@types/*"],
  },
};
`})}),`
`,(0,t.jsx)(n.h4,{id:`pastoralistconfigmjs`,children:(0,t.jsx)(n.code,{children:`pastoralist.config.mjs`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-js`,"data-meta":`title="pastoralist.config.mjs"`,children:`export default {
  checkSecurity: true,
  depPaths: "workspace",
  security: {
    provider: "osv",
    severityThreshold: "critical",
  },
};
`})}),`
`,(0,t.jsx)(n.h2,{id:`configuration-priority`,children:`Configuration Priority`}),`
`,(0,t.jsxs)(n.p,{children:[`When both external config files and `,(0,t.jsx)(n.code,{children:`package.json`}),` configuration exist,
Pastoralist merges them and lets `,(0,t.jsx)(n.code,{children:`package.json`}),` take precedence:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`External config`}),` provides base settings`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`package.json`})}),` overrides top-level fields`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Nested objects`}),` (like `,(0,t.jsx)(n.code,{children:`security`}),`) are deep merged`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`example-config-merging`,children:`Example: Config Merging`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`.pastoralistrc.json`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title=".pastoralistrc.json"`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "medium"
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`package.json`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "pastoralist": {
    "security": {
      "severityThreshold": "high"
    }
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Effective configuration:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "high"
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`configuration-options`,children:`Configuration Options`}),`
`,(0,t.jsx)(n.h3,{id:`top-level-options`,children:`Top-Level Options`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Option`}),(0,t.jsx)(n.th,{children:`Type`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`checkSecurity`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Enable security vulnerability scanning`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`compactAppendix`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsxs)(n.td,{children:[`Collapse routine appendix entries to `,(0,t.jsx)(n.code,{children:`{ addedDate }`}),`; reasons, security data, patches, and keep constraints stay expanded`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`depPaths`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`"workspace"`}),` | `,(0,t.jsx)(n.code,{children:`"workspaces"`}),` | `,(0,t.jsx)(n.code,{children:`string[]`})]}),(0,t.jsx)(n.td,{children:`Paths to scan for dependencies in monorepos`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`overrideSource`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`string`})}),(0,t.jsx)(n.td,{children:`JSON or YAML file containing package-manager overrides`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`appendixSource`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`string`})}),(0,t.jsxs)(n.td,{children:[`JSON file or `,(0,t.jsx)(n.code,{children:`.pastoralistrc`}),` receiving the appendix`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`appendix`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`object`})}),(0,t.jsx)(n.td,{children:`Auto-generated dependency tracking (managed by Pastoralist)`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`overridePaths`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`object`})}),(0,t.jsx)(n.td,{children:`Manual override tracking for specific paths`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`resolutionPaths`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`object`})}),(0,t.jsx)(n.td,{children:`Manual resolution tracking for specific paths`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`bestCase`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`object`})}),(0,t.jsx)(n.td,{children:`Opt-in dependency-portfolio optimization policy`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`security`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`object`})}),(0,t.jsx)(n.td,{children:`Security scanning configuration`})]})]})]}),`
`,(0,t.jsx)(n.h3,{id:`security-configuration`,children:`Security Configuration`}),`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.code,{children:`security`}),` object supports the following options:`]}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Option`}),(0,t.jsx)(n.th,{children:`Type`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`enabled`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Enable/disable security checks`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`provider`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`"osv"`}),` | `,(0,t.jsx)(n.code,{children:`"github"`}),` | `,(0,t.jsx)(n.code,{children:`"snyk"`}),` | `,(0,t.jsx)(n.code,{children:`"npm"`}),` | `,(0,t.jsx)(n.code,{children:`"socket"`}),` | `,(0,t.jsx)(n.code,{children:`"spektion"`}),` | array`]}),(0,t.jsx)(n.td,{children:`Security provider or providers to use`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`autoFix`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Automatically apply security fixes`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`interactive`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Use interactive mode for security fixes`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`securityProviderToken`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`string`})}),(0,t.jsx)(n.td,{children:`API token for providers that require authentication. Prefer provider environment variables; use this only for controlled config that will not be committed.`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`severityThreshold`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`"low"`}),` | `,(0,t.jsx)(n.code,{children:`"medium"`}),` | `,(0,t.jsx)(n.code,{children:`"high"`}),` | `,(0,t.jsx)(n.code,{children:`"critical"`})]}),(0,t.jsx)(n.td,{children:`Minimum severity level to report`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`excludePackages`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`string[]`})}),(0,t.jsx)(n.td,{children:`Packages to exclude from security checks`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`hasWorkspaceSecurityChecks`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Include workspace packages in security scans`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`preferLatest`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Prefer the latest candidate without reported vulnerabilities over the minimum patched version`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`strict`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Fail when a security provider cannot complete`})]})]})]}),`
`,(0,t.jsx)(n.h3,{id:`best-case-portfolio-configuration`,children:`Best-Case Portfolio Configuration`}),`
`,(0,t.jsxs)(n.p,{children:[`Enable `,(0,t.jsx)(n.code,{children:`bestCase`}),` to rank candidate version combinations under one policy.
The built-in evaluator checks advisory data for the candidate state; it does
not materialize a lockfile or resolve peer compatibility. Supply an API
`,(0,t.jsx)(n.code,{children:`bestCaseEvaluator`}),` when the project needs those checks.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "pastoralist": {
    "checkSecurity": true,
    "bestCase": {
      "enabled": true,
      "userOwnedOverrides": ["alpha"],
      "riskAggregation": "both",
      "objectives": [
        "known-exploited",
        "critical",
        "high",
        "expected-exploitation",
        "package-exposures",
        "compatibility",
        "change-count",
        "oldness"
      ],
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
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Option`}),(0,t.jsx)(n.th,{children:`Type`}),(0,t.jsx)(n.th,{children:`Default`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`enabled`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})}),(0,t.jsx)(n.td,{children:`Enable portfolio selection during security checks`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`userOwnedOverrides`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`string[]`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`[]`})}),(0,t.jsx)(n.td,{children:`Hard-constrain listed packages to their active override version`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`riskAggregation`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`"unique-cves"`}),` | `,(0,t.jsx)(n.code,{children:`"package-exposures"`}),` | `,(0,t.jsx)(n.code,{children:`"both"`})]}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`"both"`})}),(0,t.jsx)(n.td,{children:`Choose how vulnerability risk is counted`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`objectives`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`BestCaseObjective[]`})}),(0,t.jsx)(n.td,{children:`See above`}),(0,t.jsx)(n.td,{children:`Set the lexicographic ranking order`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`search.mode`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`"auto"`}),` | `,(0,t.jsx)(n.code,{children:`"exact"`}),` | `,(0,t.jsx)(n.code,{children:`"beam"`})]}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`"auto"`})}),(0,t.jsx)(n.td,{children:`Select exhaustive or deterministic bounded search`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`search.exactStateLimit`})}),(0,t.jsx)(n.td,{children:`positive integer`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`256`})}),(0,t.jsx)(n.td,{children:`Limit exact search to this many states in auto mode`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`search.beamWidth`})}),(0,t.jsx)(n.td,{children:`positive integer`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`16`})}),(0,t.jsx)(n.td,{children:`Retain this many states at each step during beam search`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`search.maxEvaluations`})}),(0,t.jsx)(n.td,{children:`positive integer`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`1000`})}),(0,t.jsx)(n.td,{children:`Stop after this many complete-state evaluations`})]})]})]}),`
`,(0,t.jsxs)(n.p,{children:[`Objectives are compared in array order; Pastoralist does not combine them
into a weighted sum. Supported objectives are `,(0,t.jsx)(n.code,{children:`known-exploited`}),`, `,(0,t.jsx)(n.code,{children:`critical`}),`,
`,(0,t.jsx)(n.code,{children:`high`}),`, `,(0,t.jsx)(n.code,{children:`medium`}),`, `,(0,t.jsx)(n.code,{children:`low`}),`, `,(0,t.jsx)(n.code,{children:`expected-exploitation`}),`, `,(0,t.jsx)(n.code,{children:`package-exposures`}),`,
`,(0,t.jsx)(n.code,{children:`compatibility`}),`, `,(0,t.jsx)(n.code,{children:`change-count`}),`, and `,(0,t.jsx)(n.code,{children:`oldness`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[`An exact search reports `,(0,t.jsx)(n.code,{children:`provenOptimal: true`}),` only when it evaluates every
state. Beam search and capped exact search report `,(0,t.jsx)(n.code,{children:`provenOptimal: false`}),`.`]}),`
`,(0,t.jsx)(n.h2,{id:`workspace-paths-and-external-sources`,children:`Workspace Paths and External Sources`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`depPaths: "workspace"`}),` reads patterns from `,(0,t.jsx)(n.code,{children:`package.json#workspaces`}),` and
`,(0,t.jsx)(n.code,{children:`pnpm-workspace.yaml`}),`. Use explicit package manifest globs for other layouts.
See `,(0,t.jsx)(n.a,{href:`/docs/workspaces`,children:`Workspaces`}),` for package-manager examples.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`overrideSource`}),` reads and writes overrides from a separate JSON or YAML file.
For pnpm 11+, Pastoralist resolves `,(0,t.jsx)(n.code,{children:`pnpm-workspace.yaml`}),` automatically.
`,(0,t.jsx)(n.code,{children:`appendixSource`}),` writes the appendix to a JSON config file or `,(0,t.jsx)(n.code,{children:`.pastoralistrc`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "pastoralist": {
    "overrideSource": "config/overrides.json",
    "appendixSource": ".pastoralistrc.json"
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`security-tracking`,children:`Security Tracking`}),`
`,(0,t.jsxs)(n.p,{children:[`Expanded appendix entries include `,(0,t.jsx)(n.code,{children:`ledger.addedDate`}),`. Security fixes can add
CVE, severity, provider, and vulnerable-range metadata to that ledger:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" {27}`,children:`{
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "my-app": "lodash@^4.17.0"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Security vulnerability CVE-2021-23337",
          "source": "security",
          "securityChecked": true,
          "securityCheckDate": "2026-05-30T00:00:00.000Z",
          "securityCheckResult": "clean",
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
          "patchedVersion": "4.17.21",
          "keep": true
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`With `,(0,t.jsx)(n.code,{children:`compactAppendix: true`}),`, routine entries can use top-level `,(0,t.jsx)(n.code,{children:`addedDate`}),`
instead of a ledger. Entries with reasons, security data, patches, or keep
constraints stay expanded.`]}),`
`,(0,t.jsx)(n.h3,{id:`ledger-fields`,children:`Ledger Fields`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`addedDate`})}),`: Date recorded when the entry was first written`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`reason`})}),`: Why the override was needed. Accepts a non-empty string, a `,(0,t.jsx)(n.code,{children:`ProjectReason`}),`, or a `,(0,t.jsx)(n.code,{children:`BestCaseReason`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`source`})}),`: How the entry was created — `,(0,t.jsx)(n.code,{children:`"manual"`}),` or `,(0,t.jsx)(n.code,{children:`"security"`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`securityChecked`})}),`: Whether a security check was performed`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`securityCheckDate`})}),`: When the last security check occurred`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`securityCheckResult`})}),`: Result of the last check — `,(0,t.jsx)(n.code,{children:`"clean"`}),`, `,(0,t.jsx)(n.code,{children:`"error"`}),`, or `,(0,t.jsx)(n.code,{children:`"skipped"`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`securityProvider`})}),`: Which provider detected the vulnerability`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`cves`})}),`: All CVE identifiers related to this vulnerability`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`cveDetails`})}),`: Per-CVE objects with `,(0,t.jsx)(n.code,{children:`cve`}),`, `,(0,t.jsx)(n.code,{children:`severity`}),`, and `,(0,t.jsx)(n.code,{children:`patchedVersion`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`severity`})}),`: Highest severity across all CVEs (`,(0,t.jsx)(n.code,{children:`low`}),`, `,(0,t.jsx)(n.code,{children:`medium`}),`, `,(0,t.jsx)(n.code,{children:`high`}),`, `,(0,t.jsx)(n.code,{children:`critical`}),`)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`vulnerableRange`})}),`: Semver range that is affected`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`patchedVersion`})}),`: Version that resolves the vulnerability`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`keep`})}),`: Prevent `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` from removing this entry. Set to `,(0,t.jsx)(n.code,{children:`true`}),` or a `,(0,t.jsx)(n.code,{children:`KeepConstraint`}),` object`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`structured-ledger-reasons`,children:`Structured Ledger Reasons`}),`
`,(0,t.jsx)(n.p,{children:`Use a project reason for an engineer-selected pin or patch:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "reason": {
    "type": "project",
    "summary": "Keep the patched fork until upstream publishes a release.",
    "pin": "2.4.1",
    "patch": "patches/example+2.4.1.patch",
    "constraints": ["Requires the current plugin API"],
    "references": ["https://example.com/upstream/issue/123"]
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`summary`}),` is required. `,(0,t.jsx)(n.code,{children:`pin`}),`, `,(0,t.jsx)(n.code,{children:`patch`}),`, `,(0,t.jsx)(n.code,{children:`constraints`}),`, and `,(0,t.jsx)(n.code,{children:`references`}),` are
optional and descriptive; package-manager overrides and appendix patch paths
remain authoritative.`]}),`
`,(0,t.jsx)(n.p,{children:`Best-case selection writes a reason tied to the complete portfolio decision:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "reason": {
    "type": "best-case",
    "summary": "Selected as part of the lowest-risk dependency portfolio",
    "decisionId": "best-case-4b825dc642cb",
    "policyHash": "d14a028c2a3a2bc9",
    "search": {
      "evaluatedStates": 64,
      "provenOptimal": true
    },
    "impact": {
      "fixedVulnerabilities": 3,
      "introducedVulnerabilities": 0,
      "remainingVulnerabilities": 1
    }
  },
  "cves": ["CVE-2026-1234"]
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`The reason belongs to one dependency item. Dependencies selected by the same
portfolio share a `,(0,t.jsx)(n.code,{children:`decisionId`}),`. CVEs remain in the sibling `,(0,t.jsx)(n.code,{children:`cves`}),` field.`]}),`
`,(0,t.jsxs)(n.h3,{id:`keeping-overrides-with-keep`,children:[`Keeping Overrides with `,(0,t.jsx)(n.code,{children:`keep`})]}),`
`,(0,t.jsxs)(n.p,{children:[`To pin an override so `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` never removes it, set `,(0,t.jsx)(n.code,{children:`keep: true`}),` on the ledger:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`{4}`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "keep": true
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`To keep an override until a date or version is reached, use a `,(0,t.jsx)(n.code,{children:`KeepConstraint`}),` object:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`{4}`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "keep": {
      "reason": "Waiting for upstream patch",
      "until": "2027-06-01",
      "untilVersion": "4.18.0"
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`KeepConstraint`}),` fields:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`reason`})}),` `,(0,t.jsx)(n.em,{children:`(required)`}),`: Why this override is being kept`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`until`})}),`: ISO date after which the keep is considered expired`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`untilVersion`})}),`: Semver. The keep expires once the root dependency meets or exceeds this version`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`reviewBy`})}),`: Freeform field for tracking who should review the decision`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`This shows which packages were overridden for security reasons and when they
were last checked.`}),`
`,(0,t.jsx)(n.h2,{id:`javascript-config-files`,children:`JavaScript Config Files`}),`
`,(0,t.jsxs)(n.p,{children:[`Use `,(0,t.jsx)(n.code,{children:`pastoralist.config.cjs`}),` for CommonJS or `,(0,t.jsx)(n.code,{children:`pastoralist.config.mjs`}),` for ESM:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-js`,"data-meta":`title="pastoralist.config.mjs"`,children:`export default {
  checkSecurity: true,
  depPaths: "workspace",
  security: {
    provider: "osv",
    severityThreshold: "high",
  },
};
`})}),`
`,(0,t.jsx)(n.p,{children:`TypeScript config files are not loaded directly. Use JSON, CJS, JS, or MJS
config files.`}),`
`,(0,t.jsx)(n.h2,{id:`migration-from-cli-flags`,children:`Migration from CLI Flags`}),`
`,(0,t.jsx)(n.p,{children:`If you're currently using CLI flags, you can migrate to config files:`}),`
`,(0,t.jsx)(n.h3,{id:`before-cli-flags`,children:`Before (CLI flags)`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist --checkSecurity --depPaths "packages/*/package.json"
`})}),`
`,(0,t.jsx)(n.h3,{id:`after-config-file`,children:`After (config file)`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`{3}`,children:`{
  "checkSecurity": true,
  "depPaths": ["packages/*/package.json"]
}
`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist
`})}),`
`,(0,t.jsx)(n.p,{children:`CLI flags still work and will override config file settings.`})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`configuration-files`,text:`Configuration Files`},{depth:3,slug:`example-configurations`,text:`Example Configurations`},{depth:4,slug:`minimal-configuration`,text:`Minimal Configuration`},{depth:4,slug:`pastoralistrcjson`,text:"`.pastoralistrc.json`"},{depth:4,slug:`pastoralistconfigjs`,text:"`pastoralist.config.js`"},{depth:4,slug:`pastoralistconfigmjs`,text:"`pastoralist.config.mjs`"},{depth:2,slug:`configuration-priority`,text:`Configuration Priority`},{depth:3,slug:`example-config-merging`,text:`Example: Config Merging`},{depth:2,slug:`configuration-options`,text:`Configuration Options`},{depth:3,slug:`top-level-options`,text:`Top-Level Options`},{depth:3,slug:`security-configuration`,text:`Security Configuration`},{depth:3,slug:`best-case-portfolio-configuration`,text:`Best-Case Portfolio Configuration`},{depth:2,slug:`workspace-paths-and-external-sources`,text:`Workspace Paths and External Sources`},{depth:2,slug:`security-tracking`,text:`Security Tracking`},{depth:3,slug:`ledger-fields`,text:`Ledger Fields`},{depth:3,slug:`structured-ledger-reasons`,text:`Structured Ledger Reasons`},{depth:3,slug:`keeping-overrides-with-keep`,text:"Keeping Overrides with `keep`"},{depth:2,slug:`javascript-config-files`,text:`JavaScript Config Files`},{depth:2,slug:`migration-from-cli-flags`,text:`Migration from CLI Flags`},{depth:3,slug:`before-cli-flags`,text:`Before (CLI flags)`},{depth:3,slug:`after-config-file`,text:`After (config file)`}];export{r as default,i as headings};