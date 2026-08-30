import{n as e}from"./motion-CBP81KKf.js";var t=e();function n(e){let n={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`Pastoralist provides both a CLI interface and a Node.js API for programmatic usage.`}),`
`,(0,t.jsxs)(n.p,{children:[`:::tip[Configuration Files]
Most CLI options can be configured using config files. See the `,(0,t.jsx)(n.a,{href:`/docs/configuration`,children:`Configuration`}),` documentation for details on using `,(0,t.jsx)(n.code,{children:`.pastoralistrc`}),`, `,(0,t.jsx)(n.code,{children:`pastoralist.config.js`}),`, or `,(0,t.jsx)(n.code,{children:`package.json`}),` for persistent settings.
:::`]}),`
`,`
`,(0,t.jsx)(n.h2,{id:`cli`,children:`CLI`}),`
`,(0,t.jsx)(n.p,{children:`CLI commands and options have their own headings so each entry can be linked
directly.`}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist`,children:(0,t.jsx)(n.code,{children:`pastoralist`})}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist on the current directory's package.json.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
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
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`pastoralist onboarding`}),` and `,(0,t.jsx)(n.code,{children:`pastoralist --onboard`}),` are aliases.`]}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---path-path`,children:(0,t.jsx)(n.code,{children:`pastoralist --path <path>`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"package.json"`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist on a specific package.json file.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --path packages/app/package.json
+npx pastoralist --path ./nested/project/package.json
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---deppaths-paths`,children:(0,t.jsx)(n.code,{children:`pastoralist --depPaths [paths...]`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string[]`})}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist on multiple package.json files using glob patterns.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --depPaths "packages/*/package.json"
+npx pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---ignore-patterns`,children:(0,t.jsx)(n.code,{children:`pastoralist --ignore [patterns...]`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string[]`})}),`
Default: `,(0,t.jsx)(n.code,{children:`[]`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Exclude files matching glob patterns.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --ignore "**/test/**" "**/dist/**"
+npx pastoralist --depPaths "**/*package.json" --ignore "**/node_modules/**" "**/legacy/**"
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---root-root`,children:(0,t.jsx)(n.code,{children:`pastoralist --root <root>`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: derived from `,(0,t.jsx)(n.code,{children:`--path`}),` or the current working directory`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Set the root directory for all operations.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --root /path/to/project
+npx pastoralist --root ../my-project --path package.json
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist-init`,children:(0,t.jsx)(n.code,{children:`pastoralist init`})}),`
`,(0,t.jsx)(n.p,{children:`Initialize configuration with the guided setup. The wizard can configure
workspace paths, security scanning, and where the configuration should be saved.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:`+npx pastoralist init
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`pastoralist init config`}),` and `,(0,t.jsx)(n.code,{children:`pastoralist --init config`}),` run the same config
wizard.`]}),`
`,(0,t.jsx)(n.p,{children:`When run, this will:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Detect `,(0,t.jsx)(n.code,{children:`workspaces`}),` entries from `,(0,t.jsx)(n.code,{children:`package.json`})]}),`
`,(0,t.jsxs)(n.li,{children:[`Prompt for `,(0,t.jsx)(n.code,{children:`depPaths: "workspace"`}),` or custom package globs`]}),`
`,(0,t.jsx)(n.li,{children:`Offer security provider and severity threshold setup`}),`
`,(0,t.jsxs)(n.li,{children:[`Save configuration to `,(0,t.jsx)(n.code,{children:`package.json`}),` or a supported config file`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---init-agent-skill`,children:(0,t.jsx)(n.code,{children:`pastoralist --init agent-skill`})}),`
`,(0,t.jsxs)(n.p,{children:[`Install the bundled Pastoralist agent skill into `,(0,t.jsx)(n.code,{children:`.agents/skills/pastoralist`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:`+npx pastoralist --init agent-skill
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`pastoralist init agent-skill`}),` is also supported.`]}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---interactive`,children:(0,t.jsx)(n.code,{children:`pastoralist --interactive`})}),`
`,(0,t.jsxs)(n.p,{children:[`Review security fixes interactively. Use this with `,(0,t.jsx)(n.code,{children:`--checkSecurity`}),` when you
want to approve fixes instead of applying everything with `,(0,t.jsx)(n.code,{children:`--forceSecurityRefactor`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --interactive
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---debug`,children:(0,t.jsx)(n.code,{children:`pastoralist --debug`})}),`
`,(0,t.jsx)(n.p,{children:`Enable detailed debug output.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --debug
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---dry-run`,children:(0,t.jsx)(n.code,{children:`pastoralist --dry-run`})}),`
`,(0,t.jsx)(n.p,{children:`Preview changes without modifying package.json.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --dry-run
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---outputformat-json`,children:(0,t.jsx)(n.code,{children:`pastoralist --outputFormat json`})}),`
`,(0,t.jsx)(n.p,{children:`Return machine-readable output for CI or custom tooling.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --summary
+npx pastoralist --summary --outputFormat json
`})}),`
`,(0,t.jsx)(n.p,{children:`JSON output is a single result object.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-jsonc`,children:`{
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
`,(0,t.jsx)(n.h3,{id:`pastoralist---quiet`,children:(0,t.jsx)(n.code,{children:`pastoralist --quiet`})}),`
`,(0,t.jsx)(n.p,{children:`Quiet mode for CI pipelines. Outputs minimal text and uses exit codes.`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Exit 0: No vulnerabilities found`}),`
`,(0,t.jsx)(n.li,{children:`Exit 1: Vulnerabilities detected`}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --quiet --checkSecurity
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---summary`,children:(0,t.jsx)(n.code,{children:`pastoralist --summary`})}),`
`,(0,t.jsx)(n.p,{children:`Display metrics after run.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --summary
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---setup-hook`,children:(0,t.jsx)(n.code,{children:`pastoralist --setup-hook`})}),`
`,(0,t.jsx)(n.p,{children:`Add pastoralist to your postinstall script automatically.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --setup-hook
`})}),`
`,(0,t.jsx)(n.h3,{id:`pnpm-run-setuplocal-dev`,children:(0,t.jsx)(n.code,{children:`pnpm run setup:local-dev`})}),`
`,(0,t.jsx)(n.p,{children:`Set up local agent config, selected skills, and selected local hooks.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:`+pnpm run setup:local-dev -- --dry-run
+pnpm run setup:local-dev -- --skills all --hooks git,postinstall
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---remove-unused`,children:(0,t.jsx)(n.code,{children:`pastoralist --remove-unused`})}),`
`,(0,t.jsx)(n.p,{children:`Remove overrides that no package in your project depends on. When Pastoralist detects unused overrides during a run, it displays a notice suggesting this flag.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --remove-unused
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---checksecurity`,children:(0,t.jsx)(n.code,{children:`pastoralist --checkSecurity`})}),`
`,(0,t.jsx)(n.p,{children:`Enable security vulnerability scanning.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --checkSecurity
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---securityprovider-provider`,children:(0,t.jsx)(n.code,{children:`pastoralist --securityProvider <provider...>`})}),`
`,(0,t.jsxs)(n.p,{children:[`Choose one or more security providers. Supported values are `,(0,t.jsx)(n.code,{children:`osv`}),`, `,(0,t.jsx)(n.code,{children:`github`}),`,
`,(0,t.jsx)(n.code,{children:`npm`}),`, `,(0,t.jsx)(n.code,{children:`snyk`}),`, `,(0,t.jsx)(n.code,{children:`socket`}),`, and `,(0,t.jsx)(n.code,{children:`spektion`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --securityProvider osv npm
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---securityprovidertoken-token`,children:(0,t.jsx)(n.code,{children:`pastoralist --securityProviderToken <token>`})}),`
`,(0,t.jsx)(n.p,{children:`Pass a provider token without writing it to config. Prefer environment variables
for committed workflows.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity --securityProvider github
+npx pastoralist --checkSecurity --securityProvider github --securityProviderToken "$GITHUB_TOKEN"
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---hasworkspacesecuritychecks`,children:(0,t.jsx)(n.code,{children:`pastoralist --hasWorkspaceSecurityChecks`})}),`
`,(0,t.jsx)(n.p,{children:`Include workspace package manifests in security scans when workspaces are
configured.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --hasWorkspaceSecurityChecks
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---forcesecurityrefactor`,children:(0,t.jsx)(n.code,{children:`pastoralist --forceSecurityRefactor`})}),`
`,(0,t.jsx)(n.p,{children:`Apply security override fixes without prompting.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --forceSecurityRefactor
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---promptforreasons`,children:(0,t.jsx)(n.code,{children:`pastoralist --promptForReasons`})}),`
`,(0,t.jsx)(n.p,{children:`Prompt for ledger reasons when Pastoralist adds manual override records.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --promptForReasons
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---strict`,children:(0,t.jsx)(n.code,{children:`pastoralist --strict`})}),`
`,(0,t.jsx)(n.p,{children:`Fail when a security provider, network request, or API call cannot complete.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --strict
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---cache-dir-path`,children:(0,t.jsx)(n.code,{children:`pastoralist --cache-dir <path>`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: `,(0,t.jsx)(n.code,{children:`node_modules/.cache/pastoralist/`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Store provider cache data in a custom directory.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --cache-dir .cache/pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---cache-ttl-seconds`,children:(0,t.jsx)(n.code,{children:`pastoralist --cache-ttl <seconds>`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`number`})}),`
Default: provider default`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Override the provider cache TTL.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --cache-ttl 3600
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---no-cache`,children:(0,t.jsx)(n.code,{children:`pastoralist --no-cache`})}),`
`,(0,t.jsx)(n.p,{children:`Bypass cache reads and writes for a security run.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --no-cache
`})}),`
`,(0,t.jsx)(n.h3,{id:`pastoralist---refresh-cache`,children:(0,t.jsx)(n.code,{children:`pastoralist --refresh-cache`})}),`
`,(0,t.jsx)(n.p,{children:`Bypass cache reads and write fresh provider results.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --refresh-cache
`})}),`
`,(0,t.jsx)(n.h2,{id:`ci`,children:`CI`}),`
`,(0,t.jsx)(n.p,{children:`Use the CLI directly when CI only needs to validate or report data.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+npx pastoralist --dry-run --summary
+npx pastoralist --quiet --checkSecurity
+npx pastoralist --dry-run --outputFormat json
`})}),`
`,(0,t.jsx)(n.p,{children:`Use the GitHub Action when the workflow should also expose outputs or create a
maintenance PR.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` - uses: yowainwright/pastoralist@v1
  id: pastoralist
  with:
+    mode: check
+    check-security: true
+    security-provider: osv

 - name: Block unused overrides
+  if: steps.pastoralist.outputs.has-unused-overrides == 'true'
+  run: exit 1
`})}),`
`,(0,t.jsxs)(n.p,{children:[`The action exposes `,(0,t.jsx)(n.code,{children:`has-security-issues`}),`, `,(0,t.jsx)(n.code,{children:`has-unused-overrides`}),`, `,(0,t.jsx)(n.code,{children:`updated`}),`,
`,(0,t.jsx)(n.code,{children:`security-count`}),`, `,(0,t.jsx)(n.code,{children:`unused-count`}),`, `,(0,t.jsx)(n.code,{children:`override-count`}),`, and `,(0,t.jsx)(n.code,{children:`pr-url`}),`.`]}),`
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
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import { resolveJSON, update } from "pastoralist";

 const path = "./package.json";
 const config = resolveJSON(path);

 if (config) {
  const result = update({
    config,
    path,
+    dryRun: true,
+    outputFormat: "json",
+    summary: true,
    depPaths: ["packages/*/package.json"],
    ignore: ["**/test/**"],
  });

+  process.stdout.write(\`\${result.metrics?.appendixEntriesUpdated ?? 0} entries\\n\`);
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
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import { resolveJSON, SecurityChecker } from "pastoralist";

 const config = resolveJSON("./package.json");
 const checker = new SecurityChecker({ provider: "osv" });

 if (config) {
  const result = await checker.checkSecurity(config, {
+    root: process.cwd(),
+    packageJsonPath: "./package.json",
+    severityThreshold: "high",
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
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import {
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
+  config: {
+    enabled: true,
+    search: { mode: "auto", exactStateLimit: 256 },
+  },
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
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import type { LedgerReason } from "pastoralist";

 const reason: LedgerReason = {
+  type: "project",
+  summary: "Pin this dependency while the upstream fix is reviewed.",
+  pin: "3.2.1",
+  patch: "patches/example+3.2.1.patch",
+  constraints: ["Must retain the current runtime API"],
+  references: ["https://example.com/upstream/issue/123"],
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
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import { logger } from "pastoralist";

 const log = logger({
  file: "my-script.js",
+  isLogging: true,
 });

+log.debug("starting action", "method-name", { data: "value" });
+log.error("unexpected error", "method-name", { error: err });
`})}),`
`,(0,t.jsx)(n.h2,{id:`examples`,children:`Examples`}),`
`,(0,t.jsx)(n.h3,{id:`build-tool-integration`,children:`Build Tool Integration`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import { resolveJSON, update } from "pastoralist";

 const path = "./package.json";
 const config = resolveJSON(path);

 if (config) {
+  update({ config, path });
+  console.log("Package overrides verified");
 }
`})}),`
`,(0,t.jsx)(n.h3,{id:`workspace-automation`,children:`Workspace Automation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import { resolveJSON, update } from "pastoralist";
 import glob from "glob";

 const packages = glob.sync("packages/*/package.json");

+for (const pkgPath of packages) {
+  const pkg = resolveJSON(pkgPath);
+  if (pkg) {
+    update({ config: pkg, path: pkgPath });
+    console.log(\`Updated \${pkgPath}\`);
+  }
+}
`})}),`
`,(0,t.jsx)(n.h3,{id:`cicd-validation`,children:`CI/CD Validation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import { resolveJSON, update } from "pastoralist";
 import { execSync } from "child_process";

 const path = "./package.json";
 const config = resolveJSON(path);

 const before = execSync("git status --porcelain").toString();
 if (config) {
+  update({ config, path });
 }
 const after = execSync("git status --porcelain").toString();

 if (before !== after) {
+  console.error("Package.json overrides need updating");
+  process.exit(1);
 }
`})}),`
`,(0,t.jsx)(n.h3,{id:`custom-logger`,children:`Custom Logger`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import { logger, resolveJSON, update } from "pastoralist";

 const log = logger({
  file: "my-script.js",
+  isLogging: process.env.DEBUG === "true",
 });

 const path = "./package.json";
 const config = resolveJSON(path);

+log.debug("starting", "custom-action", { time: Date.now() });

 if (config) {
+  update({ config, path, debug: true });
 }

+log.debug("completed", "custom-action", { time: Date.now() });
`})}),`
`,(0,t.jsx)(n.h3,{id:`error-handling`,children:`Error Handling`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";

try {
  const path = "./package.json";
  const config = resolveJSON(path);
  if (!config) throw new Error("Package.json not found");
  update({ config, path });
} catch (error) {
  if (error.message === "Package.json not found") {
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
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` npx pastoralist
+DEBUG=true npx pastoralist
`})}),`
`,(0,t.jsx)(n.h2,{id:`typescript`,children:`TypeScript`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist includes full TypeScript support.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` import { resolveJSON, update, type Options } from "pastoralist";

 const path = "./package.json";
 const config = resolveJSON(path);

 if (!config) {
  throw new Error("Package.json not found");
 }

 const options: Options = {
  config,
  path,
+  debug: true,
 };

 update(options);
`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};