import{n as e}from"./motion-B8hZlCEG.js";var t=e();function n(e){let n={code:`code`,em:`em`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[`Pastoralist supports multiple configuration methods to fit your project's needs. Configuration can be defined in external files or directly in your `,(0,t.jsx)(n.code,{children:`package.json`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:`For most projects, start small: enable workspace scanning only if you have
workspaces, and enable security checks only where you want advisory data.`}),`
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
`,(0,t.jsx)(n.h3,{id:`example-configurations`,children:`Example Configurations`}),`
`,(0,t.jsx)(n.h4,{id:`minimal-configuration`,children:`Minimal Configuration`}),`
`,(0,t.jsx)(n.p,{children:`Enable security checks with defaults:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv"
  }
}
`})}),`
`,(0,t.jsx)(n.h4,{id:`pastoralistrcjson`,children:(0,t.jsx)(n.code,{children:`.pastoralistrc.json`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "medium"
  }
}
`})}),`
`,(0,t.jsx)(n.h4,{id:`pastoralistconfigjs`,children:(0,t.jsx)(n.code,{children:`pastoralist.config.js`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-js`,children:`module.exports = {
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
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-js`,children:`export default {
  checkSecurity: true,
  depPaths: "workspace",
  security: {
    provider: "osv",
    severityThreshold: "critical",
  },
};
`})}),`
`,(0,t.jsx)(n.h2,{id:`configuration-priority`,children:`Configuration Priority`}),`
`,(0,t.jsxs)(n.p,{children:[`When both external config files and `,(0,t.jsx)(n.code,{children:`package.json`}),` configuration exist, they are merged with `,(0,t.jsx)(n.code,{children:`package.json`}),` taking precedence:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`External config`}),` provides base settings`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`package.json`})}),` overrides top-level fields`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Nested objects`}),` (like `,(0,t.jsx)(n.code,{children:`security`}),`) are deep merged`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`example-config-merging`,children:`Example: Config Merging`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`.pastoralistrc.json`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "medium"
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`package.json`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
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
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Option`}),(0,t.jsx)(n.th,{children:`Type`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`checkSecurity`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Enable security vulnerability scanning`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`compactAppendix`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsxs)(n.td,{children:[`Collapse routine appendix entries to `,(0,t.jsx)(n.code,{children:`{ addedDate }`}),`; entries with security info, patches, or active `,(0,t.jsx)(n.code,{children:`keep`}),` constraints stay expanded`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`depPaths`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`"workspace"`}),` | `,(0,t.jsx)(n.code,{children:`"workspaces"`}),` | `,(0,t.jsx)(n.code,{children:`string[]`})]}),(0,t.jsx)(n.td,{children:`Paths to scan for dependencies in monorepos`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`appendix`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`object`})}),(0,t.jsx)(n.td,{children:`Auto-generated dependency tracking (managed by Pastoralist)`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`overridePaths`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`object`})}),(0,t.jsx)(n.td,{children:`Manual override tracking for specific paths`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`resolutionPaths`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`object`})}),(0,t.jsx)(n.td,{children:`Manual resolution tracking for specific paths`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`security`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`object`})}),(0,t.jsx)(n.td,{children:`Security scanning configuration`})]})]})]}),`
`,(0,t.jsx)(n.h3,{id:`security-configuration`,children:`Security Configuration`}),`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.code,{children:`security`}),` object supports the following options:`]}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Option`}),(0,t.jsx)(n.th,{children:`Type`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`enabled`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Enable/disable security checks`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`provider`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`"osv"`}),` | `,(0,t.jsx)(n.code,{children:`"github"`}),` | `,(0,t.jsx)(n.code,{children:`"snyk"`}),` | `,(0,t.jsx)(n.code,{children:`"npm"`}),` | `,(0,t.jsx)(n.code,{children:`"socket"`}),` | `,(0,t.jsx)(n.code,{children:`"spektion"`}),` | array`]}),(0,t.jsx)(n.td,{children:`Security provider or providers to use`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`autoFix`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Automatically apply security fixes`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`interactive`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Use interactive mode for security fixes`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`securityProviderToken`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`string`})}),(0,t.jsx)(n.td,{children:`API token for providers that require authentication. Prefer provider environment variables; use this only for controlled config that will not be committed.`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`severityThreshold`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`"low"`}),` | `,(0,t.jsx)(n.code,{children:`"medium"`}),` | `,(0,t.jsx)(n.code,{children:`"high"`}),` | `,(0,t.jsx)(n.code,{children:`"critical"`})]}),(0,t.jsx)(n.td,{children:`Minimum severity level to report`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`excludePackages`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`string[]`})}),(0,t.jsx)(n.td,{children:`Packages to exclude from security checks`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`hasWorkspaceSecurityChecks`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Include workspace packages in security scans`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`strict`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Fail when a security provider cannot complete`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`preferLatest`})}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`boolean`})}),(0,t.jsx)(n.td,{children:`Prefer the newest safe version when fixes are resolved`})]})]})]}),`
`,(0,t.jsx)(n.h2,{id:`packagejson-configuration`,children:`Package.json Configuration`}),`
`,(0,t.jsxs)(n.p,{children:[`You can configure Pastoralist directly in your `,(0,t.jsx)(n.code,{children:`package.json`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "name": "my-project",
  "version": "1.0.0",
  "pastoralist": {
    "checkSecurity": true,
    "depPaths": "workspace",
    "security": {
      "provider": "osv",
      "severityThreshold": "medium",
      "excludePackages": ["@types/*"]
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`monorepo-configuration`,children:`Monorepo Configuration`}),`
`,(0,t.jsxs)(n.p,{children:[`For monorepos, use `,(0,t.jsx)(n.code,{children:`depPaths`}),` to specify which package.json files to scan:`]}),`
`,(0,t.jsx)(n.h3,{id:`using-workspace`,children:`Using "workspace"`}),`
`,(0,t.jsxs)(n.p,{children:[`The simplest approach for monorepos with a `,(0,t.jsx)(n.code,{children:`workspaces`}),` field:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "workspaces": ["packages/*", "apps/*"],
  "pastoralist": {
    "depPaths": "workspace"
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`This automatically scans all workspace packages defined in your `,(0,t.jsx)(n.code,{children:`workspaces`}),` field.
`,(0,t.jsx)(n.code,{children:`"workspaces"`}),` is accepted as an alias.`]}),`
`,(0,t.jsx)(n.h3,{id:`using-custom-paths`,children:`Using Custom Paths`}),`
`,(0,t.jsx)(n.p,{children:`For more control, specify custom glob patterns:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "pastoralist": {
    "depPaths": ["packages/*/package.json", "apps/*/package.json"]
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`security-tracking`,children:`Security Tracking`}),`
`,(0,t.jsxs)(n.p,{children:[`Every appendix entry gets a `,(0,t.jsx)(n.code,{children:`ledger`}),` with at least `,(0,t.jsx)(n.code,{children:`addedDate`}),`. When a security
provider detects a fix, Pastoralist adds CVE, severity, provider, and
vulnerable-range metadata to the same ledger:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
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
`,(0,t.jsx)(n.h3,{id:`ledger-fields`,children:`Ledger Fields`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`addedDate`})}),`: ISO timestamp recorded when the entry was first written. Always present`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`reason`})}),`: Why the override was needed (e.g., security issue description)`]}),`
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
`,(0,t.jsxs)(n.h3,{id:`keeping-overrides-with-keep`,children:[`Keeping Overrides with `,(0,t.jsx)(n.code,{children:`keep`})]}),`
`,(0,t.jsxs)(n.p,{children:[`To pin an override so `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` never removes it, set `,(0,t.jsx)(n.code,{children:`keep: true`}),` on the ledger:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "keep": true
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`For time-bounded or version-bounded keeps, use a `,(0,t.jsx)(n.code,{children:`KeepConstraint`}),` object:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
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
`,(0,t.jsx)(n.p,{children:`This allows you to see at a glance which packages were overridden due to security issues and when they were last verified.`}),`
`,(0,t.jsx)(n.h2,{id:`best-practices`,children:`Best Practices`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Use external config files`}),` for shared settings across teams`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsxs)(n.strong,{children:[`Use `,(0,t.jsx)(n.code,{children:`package.json`})]}),` for project-specific overrides`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Commit config files`}),` to version control`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsxs)(n.strong,{children:[`Use `,(0,t.jsx)(n.code,{children:`depPaths: "workspace"`})]}),` for most monorepos`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Enable security checks`}),` in CI/CD pipelines with `,(0,t.jsx)(n.code,{children:`--checkSecurity`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Version control`}),` your `,(0,t.jsx)(n.code,{children:`.pastoralistrc`}),` or config files`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Document custom configurations`}),` in your project README`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`javascript-config-files`,children:`JavaScript Config Files`}),`
`,(0,t.jsxs)(n.p,{children:[`Use `,(0,t.jsx)(n.code,{children:`pastoralist.config.cjs`}),` for CommonJS or `,(0,t.jsx)(n.code,{children:`pastoralist.config.mjs`}),` for ESM:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-js`,children:`export default {
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
`,(0,t.jsx)(n.h2,{id:`environment-specific-configuration`,children:`Environment-Specific Configuration`}),`
`,(0,t.jsx)(n.p,{children:`You can use JavaScript config files to provide environment-specific settings:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-js`,children:`// pastoralist.config.js
const isDev = process.env.NODE_ENV === "development";
const isCI = process.env.CI === "true";

module.exports = {
  checkSecurity: !isDev, // Only check in production/CI
  depPaths: "workspace",
  security: {
    provider: "osv",
    severityThreshold: isCI ? "high" : "medium",
    autoFix: isCI && !isDev,
  },
};
`})}),`
`,(0,t.jsx)(n.h2,{id:`migration-from-cli-flags`,children:`Migration from CLI Flags`}),`
`,(0,t.jsx)(n.p,{children:`If you're currently using CLI flags, you can migrate to config files:`}),`
`,(0,t.jsx)(n.h3,{id:`before-cli-flags`,children:`Before (CLI flags)`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist --checkSecurity --depPaths "packages/*/package.json"
`})}),`
`,(0,t.jsx)(n.h3,{id:`after-config-file`,children:`After (config file)`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": ["packages/*/package.json"]
}
`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist
`})}),`
`,(0,t.jsx)(n.p,{children:`CLI flags still work and will override config file settings.`})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};