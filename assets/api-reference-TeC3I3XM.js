import{n as e}from"./motion-BpbLCQiD.js";var t=e();function n(e){let n={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`Pastoralist provides a CLI and a Node.js API.`}),`
`,(0,t.jsxs)(n.p,{children:[`:::tip[Configuration Files]
Most CLI options can be stored in config files. See `,(0,t.jsx)(n.a,{href:`/docs/configuration`,children:`Configuration`}),` for `,(0,t.jsx)(n.code,{children:`.pastoralistrc`}),`, `,(0,t.jsx)(n.code,{children:`pastoralist.config.js`}),`, and `,(0,t.jsx)(n.code,{children:`package.json`}),` settings.
:::`]}),`
`,`
`,(0,t.jsx)(n.h2,{id:`cli`,children:`CLI`}),`
`,(0,t.jsx)(n.p,{children:`CLI commands and options have their own headings so each entry can be linked
directly.`}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist`,children:(0,t.jsx)(n.code,{children:`pastoralist`})}),`
`,(0,t.jsxs)(n.p,{children:[`Run Pastoralist on the current directory's `,(0,t.jsx)(n.code,{children:`package.json`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,t.jsxs)(n.h3,{id:`--help-and---version`,children:[(0,t.jsx)(n.code,{children:`--help`}),` and `,(0,t.jsx)(n.code,{children:`--version`})]}),`
`,(0,t.jsx)(n.p,{children:`Print CLI help or the installed package version.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --help
npx pastoralist --version # -v
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist-doctor`,children:(0,t.jsx)(n.code,{children:`pastoralist doctor`})}),`
`,(0,t.jsxs)(n.p,{children:[`Run a read-only setup and override health check. This command enables dry-run
summary mode and does not modify `,(0,t.jsx)(n.code,{children:`package.json`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist doctor
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist-onboard`,children:(0,t.jsx)(n.code,{children:`pastoralist onboard`})}),`
`,(0,t.jsx)(n.p,{children:`Print a first-run onboarding checklist with initial local usage, agent setup,
and GitHub Action setup.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist onboard
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Aliases: `,(0,t.jsx)(n.code,{children:`pastoralist onboarding`}),`, `,(0,t.jsx)(n.code,{children:`pastoralist --onboard`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---path-path`,children:(0,t.jsx)(n.code,{children:`pastoralist --path <path>`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"package.json"`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Run Pastoralist on a specific `,(0,t.jsx)(n.code,{children:`package.json`}),` file.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --path packages/app/package.json # -p packages/app/package.json
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---deppaths-paths`,children:(0,t.jsx)(n.code,{children:`pastoralist --depPaths [paths...]`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string[]`})}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Read dependency data from multiple `,(0,t.jsx)(n.code,{children:`package.json`}),` files using glob patterns.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --depPaths "packages/*/package.json" # -d "packages/*/package.json"
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---ignore-patterns`,children:(0,t.jsx)(n.code,{children:`pastoralist --ignore [patterns...]`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string[]`})}),`
Default: `,(0,t.jsx)(n.code,{children:`[]`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Exclude files matching glob patterns.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --ignore "**/node_modules/**"
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---root-root`,children:(0,t.jsx)(n.code,{children:`pastoralist --root <root>`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: derived from `,(0,t.jsx)(n.code,{children:`--path`}),` or the current working directory`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Set the root directory for all operations.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --root ../my-project # -r ../my-project
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist-init`,children:(0,t.jsx)(n.code,{children:`pastoralist init`})}),`
`,(0,t.jsx)(n.p,{children:`Initialize configuration with the guided setup. The wizard can configure
workspace paths, security scanning, and where the configuration should be saved.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist init
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Aliases: `,(0,t.jsx)(n.code,{children:`pastoralist init config`}),`, `,(0,t.jsx)(n.code,{children:`pastoralist --init config`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:`When run, this will:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Detect `,(0,t.jsx)(n.code,{children:`workspaces`}),` entries from `,(0,t.jsx)(n.code,{children:`package.json`})]}),`
`,(0,t.jsxs)(n.li,{children:[`Prompt for `,(0,t.jsx)(n.code,{children:`depPaths: "workspace"`}),` or custom package globs`]}),`
`,(0,t.jsx)(n.li,{children:`Offer security provider and severity threshold setup`}),`
`,(0,t.jsxs)(n.li,{children:[`Save configuration to `,(0,t.jsx)(n.code,{children:`package.json`}),` or a supported config file`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---init-agent-skill`,children:(0,t.jsx)(n.code,{children:`pastoralist --init agent-skill`})}),`
`,(0,t.jsxs)(n.p,{children:[`Install the bundled Pastoralist agent skill into `,(0,t.jsx)(n.code,{children:`.agents/skills/pastoralist`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist init agent-skill
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Alias: `,(0,t.jsx)(n.code,{children:`pastoralist --init agent-skill`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---interactive`,children:(0,t.jsx)(n.code,{children:`pastoralist --interactive`})}),`
`,(0,t.jsxs)(n.p,{children:[`Review security fixes interactively. Use this with `,(0,t.jsx)(n.code,{children:`--checkSecurity`}),` when you
want to approve fixes instead of applying everything with `,(0,t.jsx)(n.code,{children:`--forceSecurityRefactor`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --interactive
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---debug`,children:(0,t.jsx)(n.code,{children:`pastoralist --debug`})}),`
`,(0,t.jsx)(n.p,{children:`Enable detailed debug output.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --debug
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---dry-run`,children:(0,t.jsx)(n.code,{children:`pastoralist --dry-run`})}),`
`,(0,t.jsxs)(n.p,{children:[`Preview changes without modifying `,(0,t.jsx)(n.code,{children:`package.json`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --dry-run
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---outputformat-json`,children:(0,t.jsx)(n.code,{children:`pastoralist --outputFormat json`})}),`
`,(0,t.jsx)(n.p,{children:`Return machine-readable output for CI or custom tooling.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --summary --outputFormat json
`})}),`
`,(0,t.jsx)(n.p,{children:`JSON output is a single result object.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-jsonc`,"data-meta":`noLineNumbers`,children:`{
  "success": true,
  "hasSecurityIssues": false,
  "hasUnusedOverrides": true,
  "updated": false,
  "securityAlertCount": 0,
  "unusedOverrideCount": 1,
  "overrideCount": 2,
  "errors": [],
  "securityAlerts": [],
  "unusedOverrides": ["left-pad@1.3.0"],
  "appliedOverrides": {
    "left-pad": "1.3.0",
  },
  "metrics": {
    "packagesScanned": 1,
    "workspacePackagesScanned": 0,
    "appendixEntriesUpdated": 2,
    "vulnerabilitiesBlocked": 0,
    "overridesAdded": 0,
    "overridesRemoved": 0,
    "writeSuccess": false,
    "writeSkipped": true,
  },
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---styleguide`,children:(0,t.jsx)(n.code,{children:`pastoralist --styleguide`})}),`
`,(0,t.jsxs)(n.p,{children:[`Open an interactive radio menu for exploring the Pastoralist DX components
without changing project configuration. Use the arrow keys and Enter to choose
a demo. In the prompt demo, Space toggles choices, `,(0,t.jsx)(n.code,{children:`a`}),` selects all, `,(0,t.jsx)(n.code,{children:`n`}),` selects
none, and Esc cancels.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --styleguide
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---quiet`,children:(0,t.jsx)(n.code,{children:`pastoralist --quiet`})}),`
`,(0,t.jsx)(n.p,{children:`Quiet mode for CI pipelines. Outputs minimal text and uses exit codes.`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Exit 0: No vulnerabilities found`}),`
`,(0,t.jsx)(n.li,{children:`Exit 1: Vulnerabilities detected`}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --quiet --checkSecurity # -q --checkSecurity
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---summary`,children:(0,t.jsx)(n.code,{children:`pastoralist --summary`})}),`
`,(0,t.jsx)(n.p,{children:`Display metrics after run.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --summary
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---setup-hook`,children:(0,t.jsx)(n.code,{children:`pastoralist --setup-hook`})}),`
`,(0,t.jsxs)(n.p,{children:[`Add Pastoralist to your `,(0,t.jsx)(n.code,{children:`postinstall`}),` script automatically.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---remove-unused`,children:(0,t.jsx)(n.code,{children:`pastoralist --remove-unused`})}),`
`,(0,t.jsx)(n.p,{children:`Remove overrides that no package in your project depends on. When Pastoralist detects unused overrides during a run, it suggests this flag.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --remove-unused
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---checksecurity`,children:(0,t.jsx)(n.code,{children:`pastoralist --checkSecurity`})}),`
`,(0,t.jsx)(n.p,{children:`Enable security vulnerability scanning.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---securityprovider-provider`,children:(0,t.jsx)(n.code,{children:`pastoralist --securityProvider <provider...>`})}),`
`,(0,t.jsxs)(n.p,{children:[`Choose one or more security providers. Supported values are `,(0,t.jsx)(n.code,{children:`osv`}),`, `,(0,t.jsx)(n.code,{children:`github`}),`,
`,(0,t.jsx)(n.code,{children:`npm`}),`, `,(0,t.jsx)(n.code,{children:`snyk`}),`, `,(0,t.jsx)(n.code,{children:`socket`}),`, and `,(0,t.jsx)(n.code,{children:`spektion`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --securityProvider osv
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---securityprovidertoken-token`,children:(0,t.jsx)(n.code,{children:`pastoralist --securityProviderToken <token>`})}),`
`,(0,t.jsx)(n.p,{children:`Pass a provider token without writing it to config. Prefer environment variables
for committed workflows.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --securityProvider github --securityProviderToken "$GITHUB_TOKEN"
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---hasworkspacesecuritychecks`,children:(0,t.jsx)(n.code,{children:`pastoralist --hasWorkspaceSecurityChecks`})}),`
`,(0,t.jsx)(n.p,{children:`Include workspace package manifests in security scans when workspaces are
configured.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --hasWorkspaceSecurityChecks
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---forcesecurityrefactor`,children:(0,t.jsx)(n.code,{children:`pastoralist --forceSecurityRefactor`})}),`
`,(0,t.jsx)(n.p,{children:`Apply security override fixes without prompting.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --forceSecurityRefactor
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---promptforreasons`,children:(0,t.jsx)(n.code,{children:`pastoralist --promptForReasons`})}),`
`,(0,t.jsx)(n.p,{children:`Prompt for ledger reasons when Pastoralist adds manual override records.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --promptForReasons
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---strict`,children:(0,t.jsx)(n.code,{children:`pastoralist --strict`})}),`
`,(0,t.jsx)(n.p,{children:`Fail when a security provider, network request, or API call cannot complete.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --strict
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---cache-dir-path`,children:(0,t.jsx)(n.code,{children:`pastoralist --cache-dir <path>`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: `,(0,t.jsx)(n.code,{children:`node_modules/.cache/pastoralist/`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Store provider cache data in a custom directory.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --cache-dir .cache/pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---cache-ttl-seconds`,children:(0,t.jsx)(n.code,{children:`pastoralist --cache-ttl <seconds>`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`number`})}),`
Default: provider default`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Override the provider cache TTL.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --cache-ttl 3600
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---no-cache`,children:(0,t.jsx)(n.code,{children:`pastoralist --no-cache`})}),`
`,(0,t.jsx)(n.p,{children:`Bypass cache reads and writes for a security run.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --no-cache
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---refresh-cache`,children:(0,t.jsx)(n.code,{children:`pastoralist --refresh-cache`})}),`
`,(0,t.jsx)(n.p,{children:`Bypass cache reads and write fresh provider results.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --refresh-cache
`})}),`
`,(0,t.jsx)(n.h2,{id:`ci`,children:`CI`}),`
`,(0,t.jsx)(n.p,{children:`Use the CLI directly when CI only needs to validate or report data.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,"data-meta":`{2-4}`,children:`npx pastoralist
npx pastoralist --dry-run --summary
npx pastoralist --quiet --checkSecurity
npx pastoralist --dry-run --outputFormat json
`})}),`
`,(0,t.jsx)(n.p,{children:`Use the GitHub Action when the workflow should also expose outputs or create a
maintenance PR.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,"data-meta":`{4-6,9-10}`,children:`- uses: yowainwright/pastoralist@v1
  id: pastoralist
  with:
    mode: check
    check-security: true
    security-provider: osv

- name: Block unused overrides
  if: steps.pastoralist.outputs.has-unused-overrides == 'true'
  run: exit 1
`})}),`
`,(0,t.jsxs)(n.p,{children:[`The action exposes `,(0,t.jsx)(n.code,{children:`has-security-issues`}),`, `,(0,t.jsx)(n.code,{children:`has-unused-overrides`}),`, `,(0,t.jsx)(n.code,{children:`updated`}),`,
`,(0,t.jsx)(n.code,{children:`security-count`}),`, `,(0,t.jsx)(n.code,{children:`unused-count`}),`, `,(0,t.jsx)(n.code,{children:`override-count`}),`, and `,(0,t.jsx)(n.code,{children:`pr-url`}),`.`]}),`
`,`
`,(0,t.jsx)(n.h2,{id:`data-api`,children:`Data API`}),`
`,(0,t.jsx)(n.p,{children:`Use these shapes when you read JSON output, inspect the appendix, or build
tooling around Pastoralist.`}),`
`,(0,t.jsx)(n.h3,{id:`pastoralistresult`,children:(0,t.jsx)(n.code,{children:`PastoralistResult`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`PastoralistResult`}),` is the JSON object returned by `,(0,t.jsx)(n.code,{children:`--outputFormat json`}),`. It
reports whether the run succeeded, whether files changed, what security or
unused-override issues were found, and the run metrics.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --dry-run --outputFormat json
`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-jsonc`,"data-meta":`noLineNumbers`,children:`{
  "success": true,
  "hasSecurityIssues": false,
  "hasUnusedOverrides": true,
  "updated": false,
  "securityAlertCount": 0,
  "unusedOverrideCount": 1,
  "overrideCount": 2,
  "errors": [],
  "securityAlerts": [],
  "unusedOverrides": ["left-pad@1.3.0"],
  "appliedOverrides": {
    "left-pad": "1.3.0",
  },
  "metrics": {
    "packagesScanned": 1,
    "workspacePackagesScanned": 0,
    "appendixEntriesUpdated": 2,
    "vulnerabilitiesBlocked": 0,
    "overridesAdded": 0,
    "overridesRemoved": 0,
    "severityCritical": 0,
    "severityHigh": 0,
    "severityMedium": 0,
    "severityLow": 0,
    "writeSuccess": false,
    "writeSkipped": true,
  },
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Optional fields include `,(0,t.jsx)(n.code,{children:`securityAlerts`}),`, `,(0,t.jsx)(n.code,{children:`unusedOverrides`}),`,
`,(0,t.jsx)(n.code,{children:`appliedOverrides`}),`, `,(0,t.jsx)(n.code,{children:`removalVerification`}),`, `,(0,t.jsx)(n.code,{children:`bestCase`}),`, and `,(0,t.jsx)(n.code,{children:`metrics`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`pastoralistappendix`,children:(0,t.jsx)(n.code,{children:`pastoralist.appendix`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`pastoralist.appendix`}),` stores one entry per override version. Keys use
`,(0,t.jsx)(n.code,{children:`package-name@version`}),`; values can include root dependencies, dependents, patch
files, and ledger data.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" /appendix/`,children:`{
  "pastoralist": {
    "appendix": {
      "left-pad@1.3.0": {
        "dependents": {
          "example-app": "left-pad@^1.0.0"
        },
        "patches": ["patches/left-pad+1.3.0.patch"],
        "ledger": {
          "addedDate": "2026-08-22T00:00:00.000Z",
          "reason": "Keep the legacy formatter working."
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`appendixitemledger`,children:(0,t.jsx)(n.code,{children:`AppendixItem.ledger`})}),`
`,(0,t.jsxs)(n.p,{children:[`Every current appendix entry has a `,(0,t.jsx)(n.code,{children:`ledger`}),` with `,(0,t.jsx)(n.code,{children:`addedDate`}),`. Manual records can
add `,(0,t.jsx)(n.code,{children:`reason`}),`; security runs can add provider, CVE, severity, vulnerable range,
patched version, confidence, source, and resolution fields.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`{11}`,children:`{
  "ledger": {
    "addedDate": "2026-08-22T00:00:00.000Z",
    "source": "security",
    "securityProvider": "osv",
    "cves": ["CVE-2026-1234"],
    "severity": "high",
    "vulnerableRange": "<1.3.0",
    "patchedVersion": "1.3.0",
    "confidence": "confirmed",
    "keep": {
      "reason": "Wait for upstream compatibility confirmation.",
      "reviewBy": "2026-09-30"
    }
  }
}
`})}),`
`,`
`,(0,t.jsx)(n.h2,{id:`nodejs-api`,children:`Node.js API`}),`
`,(0,t.jsx)(n.h3,{id:`installation`,children:`Installation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install pastoralist
`})}),`
`,(0,t.jsxs)(n.p,{children:[`The Node API runs the same override policy from JavaScript or TypeScript. The
CLI loads config, runs security checks, then calls `,(0,t.jsx)(n.code,{children:`update()`}),`. If you use the
API directly, call the pieces you need in that order.`]}),`
`,(0,t.jsx)(n.h3,{id:`updateoptions`,children:(0,t.jsx)(n.code,{children:`update(options)`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`(options: Options) => UpdateContext`})}),`
Default: `,(0,t.jsx)(n.code,{children:`{ path: "package.json" }`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Update `,(0,t.jsx)(n.code,{children:`package.json`}),` overrides and the appendix. Each appendix entry includes a
`,(0,t.jsx)(n.code,{children:`ledger`}),` with at least `,(0,t.jsx)(n.code,{children:`addedDate`}),`. Pass the parsed package manifest as
`,(0,t.jsx)(n.code,{children:`config`}),`; the function is synchronous and returns an `,(0,t.jsx)(n.code,{children:`UpdateContext`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="update.ts" {10-12,17}`,children:`import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  const result = update({
    config,
    path,
    dryRun: true,
    outputFormat: "json",
    summary: true,
    depPaths: ["packages/*/package.json"],
    ignore: ["**/test/**"],
  });

  process.stdout.write(\`\${result.metrics?.appendixEntriesUpdated ?? 0} entries\\n\`);
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`securitycheckerchecksecurityconfig-options`,children:(0,t.jsx)(n.code,{children:`SecurityChecker.checkSecurity(config, options)`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`(config: PastoralistJSON, options?: SecurityCheckRuntimeOptions) => Promise<SecurityCheckResult>`})}),`
Default: provider and cache settings come from the `,(0,t.jsx)(n.code,{children:`SecurityChecker`}),`
constructor.`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Run vulnerability scanning directly and receive provider alerts, suggested
overrides, update suggestions, package counts, and optional best-case metadata.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="security-check.ts" {8-10}`,children:`import { resolveJSON, SecurityChecker } from "pastoralist";

const config = resolveJSON("./package.json");
const checker = new SecurityChecker({ provider: "osv" });

if (config) {
  const result = await checker.checkSecurity(config, {
    root: process.cwd(),
    packageJsonPath: "./package.json",
    severityThreshold: "high",
  });

  process.stdout.write(\`\${result.alerts.length} alerts found\\n\`);
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`optimizebestcaseportfoliooptions`,children:(0,t.jsx)(n.code,{children:`optimizeBestCasePortfolio(options)`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`(options: OptimizeBestCaseOptions) => Promise<BestCaseResult>`})}),`
Default: policy from `,(0,t.jsx)(n.code,{children:`resolveBestCasePolicy()`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Evaluate complete package-version states and return the lowest-risk state under
a lexicographic policy. The evaluator must return alerts for the complete state,
not for one package in isolation.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="best-case.ts" {38-41}`,children:`import {
  optimizeBestCasePortfolio,
  type BestCaseEvaluator,
  type BestCasePackageChoice,
} from "pastoralist";

const choices: BestCasePackageChoice[] = [
  {
    packageName: "example",
    currentVersion: "1.0.0",
    versions: ["1.0.0", "1.1.0"],
  },
];

const evaluate: BestCaseEvaluator = async (state) => {
  const usesVulnerableVersion = state.example === "1.0.0";
  const alerts = usesVulnerableVersion
    ? [
        {
          packageName: "example",
          currentVersion: state.example,
          vulnerableVersions: "<1.1.0",
          patchedVersion: "1.1.0",
          severity: "high" as const,
          title: "Example vulnerability",
          cves: ["CVE-2026-1234"],
          fixAvailable: true,
        },
      ]
    : [];

  return { alerts };
};

const result = await optimizeBestCasePortfolio({
  choices,
  evaluate,
  config: {
    enabled: true,
    search: { mode: "auto", exactStateLimit: 256 },
  },
});

console.log(result.selectedState);
console.log(result.search.provenOptimal);
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`BestCaseEvaluation`}),` may also return `,(0,t.jsx)(n.code,{children:`incompatibilities`}),`, `,(0,t.jsx)(n.code,{children:`oldness`}),`, `,(0,t.jsx)(n.code,{children:`valid`}),`,
and `,(0,t.jsx)(n.code,{children:`error`}),`. Rejected callbacks are recorded as invalid states and do not abort
other evaluations.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`SecurityChecker.checkSecurity(config, options)`}),` accepts `,(0,t.jsx)(n.code,{children:`bestCase`}),` and a
project-supplied `,(0,t.jsx)(n.code,{children:`bestCaseEvaluator`}),`. Package JSON can configure `,(0,t.jsx)(n.code,{children:`bestCase`}),`, but
the evaluator is an API option because functions cannot be stored in JSON.`]}),`
`,(0,t.jsx)(n.h3,{id:`ledger-reason-types`,children:`Ledger reason types`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`LedgerReason`}),` is a non-empty string, `,(0,t.jsx)(n.code,{children:`ProjectReason`}),`, or `,(0,t.jsx)(n.code,{children:`BestCaseReason`}),`.
Reasons are stored per appendix dependency.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="ledger-reason.ts" {4-9}`,children:`import type { LedgerReason } from "pastoralist";

const reason: LedgerReason = {
  type: "project",
  summary: "Pin this dependency while the upstream fix is reviewed.",
  pin: "3.2.1",
  patch: "patches/example+3.2.1.patch",
  constraints: ["Must retain the current runtime API"],
  references: ["https://example.com/upstream/issue/123"],
};
`})}),`
`,(0,t.jsxs)(n.p,{children:[`A `,(0,t.jsx)(n.code,{children:`BestCaseReason`}),` contains `,(0,t.jsx)(n.code,{children:`decisionId`}),`, `,(0,t.jsx)(n.code,{children:`policyHash`}),`, `,(0,t.jsx)(n.code,{children:`search`}),`, and `,(0,t.jsx)(n.code,{children:`impact`}),`.
CVEs stay in `,(0,t.jsx)(n.code,{children:`ledger.cves`}),`; they are not duplicated in the reason.`]}),`
`,(0,t.jsx)(n.h3,{id:`loggerconfig`,children:(0,t.jsx)(n.code,{children:`logger(config)`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`(config: LoggerOptions) => Logger`})}),`
Default: `,(0,t.jsx)(n.code,{children:`{ isLogging: false }`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Create a logger instance for custom debugging.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="logger.ts" {5,8-9}`,children:`import { logger } from "pastoralist";

const log = logger({
  file: "my-script.js",
  isLogging: true,
});

log.debug("starting action", "method-name", { data: "value" });
log.error("unexpected error", "method-name", { error: err });
`})}),`
`,(0,t.jsx)(n.h2,{id:`examples`,children:`Examples`}),`
`,(0,t.jsx)(n.h3,{id:`build-tool-integration`,children:`Build Tool Integration`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="build.ts" {7-8}`,children:`import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, path });
  console.log("Package overrides verified");
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`workspace-automation`,children:`Workspace Automation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="workspaces.ts" {6-12}`,children:`import { resolveJSON, update } from "pastoralist";
import glob from "glob";

const packages = glob.sync("packages/*/package.json");

for (const pkgPath of packages) {
  const pkg = resolveJSON(pkgPath);
  if (pkg) {
    update({ config: pkg, path: pkgPath });
    console.log(\`Updated \${pkgPath}\`);
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`ci-validation`,children:`CI Validation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="ci-validate.ts" {9,14-15}`,children:`import { resolveJSON, update } from "pastoralist";
import { execSync } from "child_process";

const path = "./package.json";
const config = resolveJSON(path);

const before = execSync("git status --porcelain").toString();
if (config) {
  update({ config, path });
}
const after = execSync("git status --porcelain").toString();

if (before !== after) {
  console.error("Package.json overrides need updating");
  process.exit(1);
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`custom-logger`,children:`Custom Logger`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="custom-logger.ts" {5,11,14,17}`,children:`import { logger, resolveJSON, update } from "pastoralist";

const log = logger({
  file: "my-script.js",
  isLogging: process.env.DEBUG === "true",
});

const path = "./package.json";
const config = resolveJSON(path);

log.debug("starting", "custom-action", { time: Date.now() });

if (config) {
  update({ config, path, debug: true });
}

log.debug("completed", "custom-action", { time: Date.now() });
`})}),`
`,(0,t.jsx)(n.h3,{id:`error-handling`,children:`Error Handling`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="error-handling.ts"`,children:`import { resolveJSON, update } from "pastoralist";

try {
  const path = "./package.json";
  const config = resolveJSON(path);
  if (!config) throw new Error("Package.json not found");
  update({ config, path });
} catch (error) {
  const isNotFound = error instanceof Error && error.message === "Package.json not found";
  if (isNotFound) {
    console.error("Package.json not found");
  } else {
    console.error("Unexpected error:", error);
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`environment-variables`,children:`Environment Variables`}),`
`,(0,t.jsx)(n.h3,{id:`debugtrue`,children:(0,t.jsx)(n.code,{children:`DEBUG=true`})}),`
`,(0,t.jsx)(n.p,{children:`Enable debug output (equivalent to --debug flag).`}),`
`,(0,t.jsx)(n.h3,{id:`provider-tokens`,children:`Provider Tokens`}),`
`,(0,t.jsxs)(n.p,{children:[`Security providers read tokens from environment variables when a token is not
passed with `,(0,t.jsx)(n.code,{children:`--securityProviderToken`}),` or `,(0,t.jsx)(n.code,{children:`SecurityChecker`}),` options.`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`github`}),`: `,(0,t.jsx)(n.code,{children:`GITHUB_TOKEN`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`snyk`}),`: `,(0,t.jsx)(n.code,{children:`SNYK_TOKEN`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`socket`}),`: `,(0,t.jsx)(n.code,{children:`SOCKET_SECURITY_API_KEY`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`spektion`}),`: `,(0,t.jsx)(n.code,{children:`SPEKTION_API_KEY`})]}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,"data-meta":`{2}`,children:`npx pastoralist
DEBUG=true npx pastoralist
`})}),`
`,(0,t.jsx)(n.h2,{id:`typescript`,children:`TypeScript`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist includes full TypeScript support.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-ts`,"data-meta":`title="index.ts" {13}`,children:`import { resolveJSON, update, type Options } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (!config) {
  throw new Error("Package.json not found");
}

const options: Options = {
  config,
  path,
  debug: true,
};

update(options);
`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`cli`,text:`CLI`},{depth:3,slug:`pastoralist`,text:"`pastoralist`"},{depth:3,slug:`--help-and---version`,text:"`--help` and `--version`"},{depth:3,slug:`pastoralist-doctor`,text:"`pastoralist doctor`"},{depth:3,slug:`pastoralist-onboard`,text:"`pastoralist onboard`"},{depth:3,slug:`pastoralist---path-path`,text:"`pastoralist --path <path>`"},{depth:3,slug:`pastoralist---deppaths-paths`,text:"`pastoralist --depPaths [paths...]`"},{depth:3,slug:`pastoralist---ignore-patterns`,text:"`pastoralist --ignore [patterns...]`"},{depth:3,slug:`pastoralist---root-root`,text:"`pastoralist --root <root>`"},{depth:3,slug:`pastoralist-init`,text:"`pastoralist init`"},{depth:3,slug:`pastoralist---init-agent-skill`,text:"`pastoralist --init agent-skill`"},{depth:3,slug:`pastoralist---interactive`,text:"`pastoralist --interactive`"},{depth:3,slug:`pastoralist---debug`,text:"`pastoralist --debug`"},{depth:3,slug:`pastoralist---dry-run`,text:"`pastoralist --dry-run`"},{depth:3,slug:`pastoralist---outputformat-json`,text:"`pastoralist --outputFormat json`"},{depth:3,slug:`pastoralist---styleguide`,text:"`pastoralist --styleguide`"},{depth:3,slug:`pastoralist---quiet`,text:"`pastoralist --quiet`"},{depth:3,slug:`pastoralist---summary`,text:"`pastoralist --summary`"},{depth:3,slug:`pastoralist---setup-hook`,text:"`pastoralist --setup-hook`"},{depth:3,slug:`pastoralist---remove-unused`,text:"`pastoralist --remove-unused`"},{depth:3,slug:`pastoralist---checksecurity`,text:"`pastoralist --checkSecurity`"},{depth:3,slug:`pastoralist---securityprovider-provider`,text:"`pastoralist --securityProvider <provider...>`"},{depth:3,slug:`pastoralist---securityprovidertoken-token`,text:"`pastoralist --securityProviderToken <token>`"},{depth:3,slug:`pastoralist---hasworkspacesecuritychecks`,text:"`pastoralist --hasWorkspaceSecurityChecks`"},{depth:3,slug:`pastoralist---forcesecurityrefactor`,text:"`pastoralist --forceSecurityRefactor`"},{depth:3,slug:`pastoralist---promptforreasons`,text:"`pastoralist --promptForReasons`"},{depth:3,slug:`pastoralist---strict`,text:"`pastoralist --strict`"},{depth:3,slug:`pastoralist---cache-dir-path`,text:"`pastoralist --cache-dir <path>`"},{depth:3,slug:`pastoralist---cache-ttl-seconds`,text:"`pastoralist --cache-ttl <seconds>`"},{depth:3,slug:`pastoralist---no-cache`,text:"`pastoralist --no-cache`"},{depth:3,slug:`pastoralist---refresh-cache`,text:"`pastoralist --refresh-cache`"},{depth:2,slug:`ci`,text:`CI`},{depth:2,slug:`data-api`,text:`Data API`},{depth:3,slug:`pastoralistresult`,text:"`PastoralistResult`"},{depth:3,slug:`pastoralistappendix`,text:"`pastoralist.appendix`"},{depth:3,slug:`appendixitemledger`,text:"`AppendixItem.ledger`"},{depth:2,slug:`nodejs-api`,text:`Node.js API`},{depth:3,slug:`installation`,text:`Installation`},{depth:3,slug:`updateoptions`,text:"`update(options)`"},{depth:3,slug:`securitycheckerchecksecurityconfig-options`,text:"`SecurityChecker.checkSecurity(config, options)`"},{depth:3,slug:`optimizebestcaseportfoliooptions`,text:"`optimizeBestCasePortfolio(options)`"},{depth:3,slug:`ledger-reason-types`,text:`Ledger reason types`},{depth:3,slug:`loggerconfig`,text:"`logger(config)`"},{depth:2,slug:`examples`,text:`Examples`},{depth:3,slug:`build-tool-integration`,text:`Build Tool Integration`},{depth:3,slug:`workspace-automation`,text:`Workspace Automation`},{depth:3,slug:`ci-validation`,text:`CI Validation`},{depth:3,slug:`custom-logger`,text:`Custom Logger`},{depth:3,slug:`error-handling`,text:`Error Handling`},{depth:2,slug:`environment-variables`,text:`Environment Variables`},{depth:3,slug:`debugtrue`,text:"`DEBUG=true`"},{depth:3,slug:`provider-tokens`,text:`Provider Tokens`},{depth:2,slug:`typescript`,text:`TypeScript`}];export{r as default,i as headings};