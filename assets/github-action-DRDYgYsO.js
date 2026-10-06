import{n as e}from"./motion-BpbLCQiD.js";var t=e();function n(e){let n={blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,p:`p`,pre:`pre`,strong:`strong`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`quick-start`,children:`Quick Start`}),`
`,(0,t.jsx)(n.h3,{id:`basic-pr-check`,children:`Basic PR Check`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` name: Override Check
 on: [pull_request]

 jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
+      - uses: yowainwright/pastoralist@v1
+        with:
+          mode: check
+          check-security: false
`})}),`
`,(0,t.jsxs)(n.p,{children:[`The action enables OSV security scanning by default. Set
`,(0,t.jsx)(n.code,{children:`check-security: false`}),` when you only want to validate override tracking.`]}),`
`,(0,t.jsx)(n.h3,{id:`scheduled-maintenance-with-pr-creation`,children:`Scheduled Maintenance with PR Creation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` name: Override Maintenance
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
`})}),`
`,(0,t.jsx)(n.h2,{id:`modes`,children:`Modes`}),`
`,(0,t.jsx)(n.h3,{id:`mode-check`,children:(0,t.jsx)(n.code,{children:`mode: check`})}),`
`,(0,t.jsx)(n.p,{children:`Runs Pastoralist in dry-run mode. Reports issues without modifying files.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` - uses: yowainwright/pastoralist@v1
  with:
+    mode: check
`})}),`
`,(0,t.jsx)(n.h3,{id:`mode-update`,children:(0,t.jsx)(n.code,{children:`mode: update`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Default: selected when `,(0,t.jsx)(n.code,{children:`mode`}),` is unset`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Runs Pastoralist and modifies `,(0,t.jsx)(n.code,{children:`package.json`}),`. Use when you want to handle commits yourself.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` - uses: actions/checkout@v7

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
`})}),`
`,(0,t.jsx)(n.h3,{id:`mode-pr`,children:(0,t.jsx)(n.code,{children:`mode: pr`})}),`
`,(0,t.jsxs)(n.p,{children:[`Runs Pastoralist and creates a PR if changes are needed. This is best for scheduled workflows.
Use this mode with `,(0,t.jsx)(n.code,{children:`contents: write`}),` and `,(0,t.jsx)(n.code,{children:`pull-requests: write`}),` workflow
permissions.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` - uses: yowainwright/pastoralist@v1
  with:
+    mode: pr
+    pr-title: "fix(security): update vulnerable overrides"
`})}),`
`,(0,t.jsx)(n.h2,{id:`inputs`,children:`Inputs`}),`
`,(0,t.jsx)(n.h3,{id:`mode`,children:(0,t.jsx)(n.code,{children:`mode`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`"check" | "update" | "pr"`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"update"`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Selects validation, direct file updates, or PR creation.`}),`
`,(0,t.jsx)(n.h3,{id:`check-security`,children:(0,t.jsx)(n.code,{children:`check-security`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`boolean`})}),`
Default: `,(0,t.jsx)(n.code,{children:`true`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Enables vulnerability scanning.`}),`
`,(0,t.jsx)(n.h3,{id:`security-provider`,children:(0,t.jsx)(n.code,{children:`security-provider`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`"osv" | "github" | "npm" | "snyk" | "socket" | "spektion"`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"osv"`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Selects the security provider used when `,(0,t.jsx)(n.code,{children:`check-security`}),` is enabled.`]}),`
`,(0,t.jsx)(n.h3,{id:`security-token`,children:(0,t.jsx)(n.code,{children:`security-token`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Passes a token to providers that require authentication.`}),`
`,(0,t.jsx)(n.h3,{id:`auto-fix`,children:(0,t.jsx)(n.code,{children:`auto-fix`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`boolean`})}),`
Default: `,(0,t.jsx)(n.code,{children:`true`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Applies security fixes automatically when the action can write files.`}),`
`,(0,t.jsx)(n.h3,{id:`dry-run`,children:(0,t.jsx)(n.code,{children:`dry-run`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`boolean`})}),`
Default: `,(0,t.jsx)(n.code,{children:`false`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Previews changes without modifying files. `,(0,t.jsx)(n.code,{children:`mode: check`}),` always runs as a dry
run.`]}),`
`,(0,t.jsx)(n.h3,{id:`root-dir`,children:(0,t.jsx)(n.code,{children:`root-dir`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Sets the project root directory passed to `,(0,t.jsx)(n.code,{children:`pastoralist --root`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`dep-paths`,children:(0,t.jsx)(n.code,{children:`dep-paths`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Passes space-separated workspace package patterns to `,(0,t.jsx)(n.code,{children:`pastoralist --depPaths`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`config`,children:(0,t.jsx)(n.code,{children:`config`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Deprecated. Config files are auto-detected from `,(0,t.jsx)(n.code,{children:`root-dir`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`fail-on-security`,children:(0,t.jsx)(n.code,{children:`fail-on-security`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`boolean`})}),`
Default: `,(0,t.jsx)(n.code,{children:`true`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Fails the action when vulnerabilities are found.`}),`
`,(0,t.jsx)(n.h3,{id:`fail-on-unused`,children:(0,t.jsx)(n.code,{children:`fail-on-unused`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`boolean`})}),`
Default: `,(0,t.jsx)(n.code,{children:`false`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Fails the action when unused overrides are detected.`}),`
`,(0,t.jsx)(n.h3,{id:`silent`,children:(0,t.jsx)(n.code,{children:`silent`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`boolean`})}),`
Default: `,(0,t.jsx)(n.code,{children:`false`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Deprecated compatibility input. The action ignores it and prints a warning when
it is enabled.`}),`
`,(0,t.jsx)(n.h3,{id:`debug`,children:(0,t.jsx)(n.code,{children:`debug`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`boolean`})}),`
Default: `,(0,t.jsx)(n.code,{children:`false`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Passes `,(0,t.jsx)(n.code,{children:`--debug`}),` to Pastoralist.`]}),`
`,(0,t.jsx)(n.h3,{id:`pr-title`,children:(0,t.jsx)(n.code,{children:`pr-title`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"chore(deps): update dependency overrides"`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Sets the PR title for `,(0,t.jsx)(n.code,{children:`mode: pr`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`pr-body`,children:(0,t.jsx)(n.code,{children:`pr-body`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: auto-generated`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Sets the PR body for `,(0,t.jsx)(n.code,{children:`mode: pr`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`pr-branch`,children:(0,t.jsx)(n.code,{children:`pr-branch`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"pastoralist/updates"`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Sets the PR branch for `,(0,t.jsx)(n.code,{children:`mode: pr`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`pr-labels`,children:(0,t.jsx)(n.code,{children:`pr-labels`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"dependencies"`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Adds space-separated labels to the PR created by `,(0,t.jsx)(n.code,{children:`mode: pr`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`github-token`,children:(0,t.jsx)(n.code,{children:`github-token`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: `,(0,t.jsx)(n.code,{children:`github.token`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Sets the GitHub token for PR creation.`}),`
`,(0,t.jsx)(n.h2,{id:`outputs`,children:`Outputs`}),`
`,(0,t.jsx)(n.h3,{id:`has-security-issues`,children:(0,t.jsx)(n.code,{children:`has-security-issues`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`"true" | "false"`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"false"`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Reports whether vulnerabilities were found.`}),`
`,(0,t.jsx)(n.h3,{id:`has-unused-overrides`,children:(0,t.jsx)(n.code,{children:`has-unused-overrides`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`"true" | "false"`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"false"`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Reports whether unused overrides were detected.`}),`
`,(0,t.jsx)(n.h3,{id:`updated`,children:(0,t.jsx)(n.code,{children:`updated`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`"true" | "false"`})}),`
Default: `,(0,t.jsx)(n.code,{children:`"false"`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Reports whether `,(0,t.jsx)(n.code,{children:`package.json`}),` was modified.`]}),`
`,(0,t.jsx)(n.h3,{id:`security-count`,children:(0,t.jsx)(n.code,{children:`security-count`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`number`})}),`
Default: `,(0,t.jsx)(n.code,{children:`0`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Reports the number of security vulnerabilities found.`}),`
`,(0,t.jsx)(n.h3,{id:`unused-count`,children:(0,t.jsx)(n.code,{children:`unused-count`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`number`})}),`
Default: `,(0,t.jsx)(n.code,{children:`0`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Reports the number of unused overrides detected.`}),`
`,(0,t.jsx)(n.h3,{id:`override-count`,children:(0,t.jsx)(n.code,{children:`override-count`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`number`})}),`
Default: `,(0,t.jsx)(n.code,{children:`0`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Reports the number of tracked overrides after the run.`}),`
`,(0,t.jsx)(n.h3,{id:`pr-url`,children:(0,t.jsx)(n.code,{children:`pr-url`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Type: `,(0,t.jsx)(n.strong,{children:(0,t.jsx)(n.code,{children:`string`})}),`
Default: `,(0,t.jsx)(n.code,{children:`""`})]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Reports the created PR URL in `,(0,t.jsx)(n.code,{children:`mode: pr`}),`.`]}),`
`,(0,t.jsx)(n.h2,{id:`examples`,children:`Examples`}),`
`,(0,t.jsx)(n.h3,{id:`pr-check-with-security-gate`,children:`PR Check with Security Gate`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` name: Override Security
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
`})}),`
`,(0,t.jsx)(n.h3,{id:`monorepo-support`,children:`Monorepo Support`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` - uses: yowainwright/pastoralist@v1
  with:
+    dep-paths: "packages/*/package.json apps/*/package.json"
`})}),`
`,(0,t.jsx)(n.h3,{id:`using-github-security-provider`,children:`Using GitHub Security Provider`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` - uses: yowainwright/pastoralist@v1
  with:
+    security-provider: github
+    security-token: \${{ secrets.GITHUB_TOKEN }}
`})}),`
`,(0,t.jsx)(n.h3,{id:`conditional-pr-on-vulnerabilities`,children:`Conditional PR on Vulnerabilities`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` - uses: yowainwright/pastoralist@v1
+  id: pastoralist
  with:
+    mode: check

+- name: Create security PR
+  if: steps.pastoralist.outputs.has-security-issues == 'true'
+  run: |
+    # Custom PR logic here
`})}),`
`,(0,t.jsx)(n.h3,{id:`weekly-maintenance-with-slack-notification`,children:`Weekly Maintenance with Slack Notification`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` name: Weekly Override Maintenance
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
+              "text": "Pastoralist created a PR: \${{ steps.pastoralist.outputs.pr-url }}"
+            }
`})}),`
`,(0,t.jsx)(n.h2,{id:`permissions`,children:`Permissions`}),`
`,(0,t.jsxs)(n.p,{children:[`For `,(0,t.jsx)(n.code,{children:`mode: pr`}),`, the action needs write permissions:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:` permissions:
+  contents: write
+  pull-requests: write
`})}),`
`,(0,t.jsx)(n.h2,{id:`security-providers`,children:`Security Providers`}),`
`,(0,t.jsx)(n.h3,{id:`security-provider-osv`,children:(0,t.jsx)(n.code,{children:`security-provider: osv`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Auth: `,(0,t.jsx)(n.strong,{children:`none`}),`
Default: selected when `,(0,t.jsx)(n.code,{children:`security-provider`}),` is unset`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Uses the Open Source Vulnerabilities database.`}),`
`,(0,t.jsx)(n.h3,{id:`security-provider-npm`,children:(0,t.jsx)(n.code,{children:`security-provider: npm`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Auth: `,(0,t.jsx)(n.strong,{children:`none`}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Uses the detected package manager's audit command.`}),`
`,(0,t.jsx)(n.h3,{id:`security-provider-github`,children:(0,t.jsx)(n.code,{children:`security-provider: github`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Auth: `,(0,t.jsx)(n.strong,{children:`required`}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Reads Dependabot alerts. Pass `,(0,t.jsx)(n.code,{children:`GITHUB_TOKEN`}),` or rely on an authenticated `,(0,t.jsx)(n.code,{children:`gh`}),`
CLI session.`]}),`
`,(0,t.jsx)(n.h3,{id:`security-provider-snyk`,children:(0,t.jsx)(n.code,{children:`security-provider: snyk`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Auth: `,(0,t.jsx)(n.strong,{children:`required`}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Requires `,(0,t.jsx)(n.code,{children:`SNYK_TOKEN`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`security-provider-socket`,children:(0,t.jsx)(n.code,{children:`security-provider: socket`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Auth: `,(0,t.jsx)(n.strong,{children:`required`}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Requires `,(0,t.jsx)(n.code,{children:`SOCKET_SECURITY_API_KEY`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`security-provider-spektion`,children:(0,t.jsx)(n.code,{children:`security-provider: spektion`})}),`
`,(0,t.jsxs)(n.blockquote,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Auth: `,(0,t.jsx)(n.strong,{children:`required`}),`
Default: unset`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Requires `,(0,t.jsx)(n.code,{children:`SPEKTION_API_KEY`}),`.`]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`quick-start`,text:`Quick Start`},{depth:3,slug:`basic-pr-check`,text:`Basic PR Check`},{depth:3,slug:`scheduled-maintenance-with-pr-creation`,text:`Scheduled Maintenance with PR Creation`},{depth:2,slug:`modes`,text:`Modes`},{depth:3,slug:`mode-check`,text:"`mode: check`"},{depth:3,slug:`mode-update`,text:"`mode: update`"},{depth:3,slug:`mode-pr`,text:"`mode: pr`"},{depth:2,slug:`inputs`,text:`Inputs`},{depth:3,slug:`mode`,text:"`mode`"},{depth:3,slug:`check-security`,text:"`check-security`"},{depth:3,slug:`security-provider`,text:"`security-provider`"},{depth:3,slug:`security-token`,text:"`security-token`"},{depth:3,slug:`auto-fix`,text:"`auto-fix`"},{depth:3,slug:`dry-run`,text:"`dry-run`"},{depth:3,slug:`root-dir`,text:"`root-dir`"},{depth:3,slug:`dep-paths`,text:"`dep-paths`"},{depth:3,slug:`config`,text:"`config`"},{depth:3,slug:`fail-on-security`,text:"`fail-on-security`"},{depth:3,slug:`fail-on-unused`,text:"`fail-on-unused`"},{depth:3,slug:`silent`,text:"`silent`"},{depth:3,slug:`debug`,text:"`debug`"},{depth:3,slug:`pr-title`,text:"`pr-title`"},{depth:3,slug:`pr-body`,text:"`pr-body`"},{depth:3,slug:`pr-branch`,text:"`pr-branch`"},{depth:3,slug:`pr-labels`,text:"`pr-labels`"},{depth:3,slug:`github-token`,text:"`github-token`"},{depth:2,slug:`outputs`,text:`Outputs`},{depth:3,slug:`has-security-issues`,text:"`has-security-issues`"},{depth:3,slug:`has-unused-overrides`,text:"`has-unused-overrides`"},{depth:3,slug:`updated`,text:"`updated`"},{depth:3,slug:`security-count`,text:"`security-count`"},{depth:3,slug:`unused-count`,text:"`unused-count`"},{depth:3,slug:`override-count`,text:"`override-count`"},{depth:3,slug:`pr-url`,text:"`pr-url`"},{depth:2,slug:`examples`,text:`Examples`},{depth:3,slug:`pr-check-with-security-gate`,text:`PR Check with Security Gate`},{depth:3,slug:`monorepo-support`,text:`Monorepo Support`},{depth:3,slug:`using-github-security-provider`,text:`Using GitHub Security Provider`},{depth:3,slug:`conditional-pr-on-vulnerabilities`,text:`Conditional PR on Vulnerabilities`},{depth:3,slug:`weekly-maintenance-with-slack-notification`,text:`Weekly Maintenance with Slack Notification`},{depth:2,slug:`permissions`,text:`Permissions`},{depth:2,slug:`security-providers`,text:`Security Providers`},{depth:3,slug:`security-provider-osv`,text:"`security-provider: osv`"},{depth:3,slug:`security-provider-npm`,text:"`security-provider: npm`"},{depth:3,slug:`security-provider-github`,text:"`security-provider: github`"},{depth:3,slug:`security-provider-snyk`,text:"`security-provider: snyk`"},{depth:3,slug:`security-provider-socket`,text:"`security-provider: socket`"},{depth:3,slug:`security-provider-spektion`,text:"`security-provider: spektion`"}];export{r as default,i as headings};