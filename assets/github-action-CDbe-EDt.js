import{n as e}from"./motion-CF4NsPJN.js";var t=e();function n(e){let n={code:`code`,h2:`h2`,h3:`h3`,p:`p`,pre:`pre`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`quick-start`,children:`Quick Start`}),`
`,(0,t.jsx)(n.h3,{id:`basic-pr-check`,children:`Basic PR Check`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`name: Override Check
on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6.0.2
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          check-security: false
`})}),`
`,(0,t.jsxs)(n.p,{children:[`The action enables OSV security scanning by default. Set
`,(0,t.jsx)(n.code,{children:`check-security: false`}),` when you only want to validate override tracking.`]}),`
`,(0,t.jsx)(n.h3,{id:`scheduled-maintenance-with-pr-creation`,children:`Scheduled Maintenance with PR Creation`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`name: Override Maintenance
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
      - uses: actions/checkout@v6.0.2
      - uses: yowainwright/pastoralist@v1
        with:
          mode: pr
          pr-title: "chore(deps): update dependency overrides"
          pr-labels: "dependencies automated"
`})}),`
`,(0,t.jsx)(n.h2,{id:`modes`,children:`Modes`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Mode`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`check`})}),(0,t.jsx)(n.td,{children:`Validate only - reports issues without modifying files`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`update`})}),(0,t.jsx)(n.td,{children:`Modify package.json (default) - you handle commits`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`pr`})}),(0,t.jsx)(n.td,{children:`Create pull request with changes automatically`})]})]})]}),`
`,(0,t.jsx)(n.h3,{id:`check-mode`,children:`Check Mode`}),`
`,(0,t.jsx)(n.p,{children:`Runs pastoralist in dry-run mode. Reports issues without modifying files.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  with:
    mode: check
`})}),`
`,(0,t.jsx)(n.h3,{id:`update-mode-default`,children:`Update Mode (Default)`}),`
`,(0,t.jsxs)(n.p,{children:[`Runs pastoralist and modifies `,(0,t.jsx)(n.code,{children:`package.json`}),`. Use when you want to handle commits yourself.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- uses: actions/checkout@v6.0.2

- uses: yowainwright/pastoralist@v1
  with:
    mode: update

- name: Commit changes
  run: |
    git config user.name github-actions[bot]
    git config user.email github-actions[bot]@users.noreply.github.com
    git add package.json
    git diff --staged --quiet || git commit -m "chore: update overrides"
    git push
`})}),`
`,(0,t.jsx)(n.h3,{id:`pr-mode`,children:`PR Mode`}),`
`,(0,t.jsxs)(n.p,{children:[`Runs pastoralist and creates a PR if changes are needed. Ideal for scheduled workflows.
Use this mode with `,(0,t.jsx)(n.code,{children:`contents: write`}),` and `,(0,t.jsx)(n.code,{children:`pull-requests: write`}),` workflow
permissions.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  with:
    mode: pr
    pr-title: "fix(security): update vulnerable overrides"
`})}),`
`,(0,t.jsx)(n.h2,{id:`inputs`,children:`Inputs`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Input`}),(0,t.jsx)(n.th,{children:`Description`}),(0,t.jsx)(n.th,{children:`Default`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`mode`})}),(0,t.jsxs)(n.td,{children:[`Operation mode: `,(0,t.jsx)(n.code,{children:`check`}),`, `,(0,t.jsx)(n.code,{children:`update`}),`, or `,(0,t.jsx)(n.code,{children:`pr`})]}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`update`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`check-security`})}),(0,t.jsx)(n.td,{children:`Enable security scanning`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`true`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`security-provider`})}),(0,t.jsxs)(n.td,{children:[`Provider: `,(0,t.jsx)(n.code,{children:`osv`}),`, `,(0,t.jsx)(n.code,{children:`github`}),`, `,(0,t.jsx)(n.code,{children:`npm`}),`, `,(0,t.jsx)(n.code,{children:`snyk`}),`, `,(0,t.jsx)(n.code,{children:`socket`}),`, `,(0,t.jsx)(n.code,{children:`spektion`})]}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`osv`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`security-token`})}),(0,t.jsx)(n.td,{children:`Token for security provider`}),(0,t.jsx)(n.td,{children:`-`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`auto-fix`})}),(0,t.jsx)(n.td,{children:`Apply security fixes automatically when the action can write`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`true`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`dry-run`})}),(0,t.jsx)(n.td,{children:`Preview changes only`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`root-dir`})}),(0,t.jsx)(n.td,{children:`Project root directory`}),(0,t.jsx)(n.td,{children:`-`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`dep-paths`})}),(0,t.jsx)(n.td,{children:`Workspace patterns (space-separated)`}),(0,t.jsx)(n.td,{children:`-`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`config`})}),(0,t.jsxs)(n.td,{children:[`Deprecated; config files are auto-detected from `,(0,t.jsx)(n.code,{children:`root-dir`})]}),(0,t.jsx)(n.td,{children:`-`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`fail-on-security`})}),(0,t.jsx)(n.td,{children:`Fail if vulnerabilities found`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`true`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`fail-on-unused`})}),(0,t.jsx)(n.td,{children:`Fail if unused overrides found`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`silent`})}),(0,t.jsx)(n.td,{children:`Deprecated compatibility input; ignored with a warning`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`debug`})}),(0,t.jsx)(n.td,{children:`Enable debug logging`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`false`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`pr-title`})}),(0,t.jsx)(n.td,{children:`PR title (mode: pr)`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`chore(deps): update dependency overrides`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`pr-body`})}),(0,t.jsx)(n.td,{children:`PR body (mode: pr)`}),(0,t.jsx)(n.td,{children:`Auto-generated`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`pr-branch`})}),(0,t.jsx)(n.td,{children:`PR branch name (mode: pr)`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`pastoralist/updates`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`pr-labels`})}),(0,t.jsx)(n.td,{children:`PR labels (space-separated)`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`dependencies`})})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`github-token`})}),(0,t.jsx)(n.td,{children:`GitHub token for PR creation`}),(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`GITHUB_TOKEN`})})]})]})]}),`
`,(0,t.jsx)(n.h2,{id:`outputs`,children:`Outputs`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Output`}),(0,t.jsx)(n.th,{children:`Description`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`has-security-issues`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`true`}),` if vulnerabilities were found`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`has-unused-overrides`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`true`}),` if unused overrides detected`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`updated`})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:`true`}),` if package.json was modified`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`security-count`})}),(0,t.jsx)(n.td,{children:`Number of security vulnerabilities found`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`unused-count`})}),(0,t.jsx)(n.td,{children:`Number of unused overrides detected`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`override-count`})}),(0,t.jsx)(n.td,{children:`Number of tracked overrides`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`pr-url`})}),(0,t.jsx)(n.td,{children:`URL of created PR (mode: pr only)`})]})]})]}),`
`,(0,t.jsx)(n.h2,{id:`examples`,children:`Examples`}),`
`,(0,t.jsx)(n.h3,{id:`pr-check-with-security-gate`,children:`PR Check with Security Gate`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`name: Override Security
on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6.0.2

      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          fail-on-security: true
          security-provider: osv
`})}),`
`,(0,t.jsx)(n.h3,{id:`monorepo-support`,children:`Monorepo Support`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  with:
    dep-paths: "packages/*/package.json apps/*/package.json"
`})}),`
`,(0,t.jsx)(n.h3,{id:`using-github-security-provider`,children:`Using GitHub Security Provider`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  with:
    security-provider: github
    security-token: \${{ secrets.GITHUB_TOKEN }}
`})}),`
`,(0,t.jsx)(n.h3,{id:`conditional-pr-on-vulnerabilities`,children:`Conditional PR on Vulnerabilities`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  id: pastoralist
  with:
    mode: check

- name: Create security PR
  if: steps.pastoralist.outputs.has-security-issues == 'true'
  run: |
    # Custom PR logic here
`})}),`
`,(0,t.jsx)(n.h3,{id:`weekly-maintenance-with-slack-notification`,children:`Weekly Maintenance with Slack Notification`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`name: Weekly Override Maintenance
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
      - uses: actions/checkout@v6.0.2

      - uses: yowainwright/pastoralist@v1
        id: pastoralist
        with:
          mode: pr

      - name: Notify Slack
        if: steps.pastoralist.outputs.pr-url != ''
        uses: slackapi/slack-github-action@v3.0.3
        with:
          payload: |
            {
              "text": "Pastoralist created a PR: \${{ steps.pastoralist.outputs.pr-url }}"
            }
`})}),`
`,(0,t.jsx)(n.h2,{id:`permissions`,children:`Permissions`}),`
`,(0,t.jsxs)(n.p,{children:[`For `,(0,t.jsx)(n.code,{children:`mode: pr`}),`, the action needs write permissions:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`permissions:
  contents: write
  pull-requests: write
`})}),`
`,(0,t.jsx)(n.h2,{id:`security-providers`,children:`Security Providers`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Provider`}),(0,t.jsx)(n.th,{children:`Auth`}),(0,t.jsx)(n.th,{children:`Notes`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`osv`})}),(0,t.jsx)(n.td,{children:`None`}),(0,t.jsx)(n.td,{children:`Open Source Vulnerabilities database (default)`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`npm`})}),(0,t.jsx)(n.td,{children:`None`}),(0,t.jsx)(n.td,{children:`Uses the detected package manager's audit command`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`github`})}),(0,t.jsx)(n.td,{children:`Required`}),(0,t.jsxs)(n.td,{children:[`Reads Dependabot alerts; pass `,(0,t.jsx)(n.code,{children:`GITHUB_TOKEN`}),` or rely on an authenticated `,(0,t.jsx)(n.code,{children:`gh`}),` CLI session`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`snyk`})}),(0,t.jsx)(n.td,{children:`Required`}),(0,t.jsxs)(n.td,{children:[`Requires `,(0,t.jsx)(n.code,{children:`SNYK_TOKEN`}),` [EXPERIMENTAL]`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`socket`})}),(0,t.jsx)(n.td,{children:`Required`}),(0,t.jsxs)(n.td,{children:[`Requires `,(0,t.jsx)(n.code,{children:`SOCKET_SECURITY_API_KEY`}),` [EXPERIMENTAL]`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.code,{children:`spektion`})}),(0,t.jsx)(n.td,{children:`Required`}),(0,t.jsxs)(n.td,{children:[`Requires `,(0,t.jsx)(n.code,{children:`SPEKTION_API_KEY`}),` [EXPERIMENTAL]`]})]})]})]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};