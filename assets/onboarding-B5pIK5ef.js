import{n as e}from"./motion-CF4NsPJN.js";var t=e();function n(e){let n={code:`code`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`Use onboarding when you are adding Pastoralist to a repo for the first time or
when you want a repeatable setup path for contributors and agents.`}),`
`,(0,t.jsx)(n.h2,{id:`start-read-only`,children:`Start Read-Only`}),`
`,(0,t.jsx)(n.p,{children:`Check the current project without writing files:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist doctor
`})}),`
`,(0,t.jsx)(n.p,{children:`Print the full checklist from the CLI:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist onboard
`})}),`
`,(0,t.jsx)(n.h2,{id:`add-project-setup`,children:`Add Project Setup`}),`
`,(0,t.jsx)(n.p,{children:`Install Pastoralist and create the initial config:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install pastoralist --save-dev
npx pastoralist --init
`})}),`
`,(0,t.jsx)(n.p,{children:`Update the appendix once the config is in place:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,t.jsx)(n.p,{children:`Keep it current after dependency installs:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,t.jsx)(n.h2,{id:`add-agent-setup`,children:`Add Agent Setup`}),`
`,(0,t.jsx)(n.p,{children:`Install only the bundled Pastoralist skill:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-skill
`})}),`
`,(0,t.jsx)(n.p,{children:`Preview local dev setup before writing files:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-local-dev --dry-run
`})}),`
`,(0,t.jsx)(n.p,{children:`Set up agent config, bundled skills, and local hooks:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
`})}),`
`,(0,t.jsx)(n.p,{children:`The local dev setup script auto-detects Codex or Claude when possible. You can
pin the target explicitly:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-local-dev --agent codex
npx -p pastoralist pastoralist-setup-local-dev --agent claude
`})}),`
`,(0,t.jsx)(n.h2,{id:`copypaste-prompts`,children:`Copy/Paste Prompts`}),`
`,(0,t.jsx)(n.p,{children:`Use this prompt when you want an agent to do the setup:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-text`,children:`Set up Pastoralist in this repository.
Start with \`npx pastoralist doctor\` and inspect the current package manager setup.
Run \`npx -p pastoralist pastoralist-setup-local-dev --dry-run\` before writing files.
Configure the Pastoralist skill, local agent config, GitHub Action, and postinstall hook only when appropriate.
Keep changes scoped to setup files, docs, and tests.
`})}),`
`,(0,t.jsx)(n.p,{children:`Use this prompt when you want an agent to review an existing setup:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-text`,children:`Review this repository's Pastoralist setup.
Run \`npx pastoralist --dry-run\` and summarize stale overrides, security checks, and missing setup.
Do not remove overrides unless \`npx pastoralist --remove-unused --dry-run\` shows they are unused.
If setup is missing, propose the smallest script, skill, hook, or GitHub Action change.
`})}),`
`,(0,t.jsx)(n.h2,{id:`agent-setup-loop`,children:`Agent Setup Loop`}),`
`,(0,t.jsx)(n.p,{children:`Use this loop when an agent owns the setup:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Run `,(0,t.jsx)(n.code,{children:`npx pastoralist doctor`}),`.`]}),`
`,(0,t.jsxs)(n.li,{children:[`Run `,(0,t.jsx)(n.code,{children:`npx -p pastoralist pastoralist-setup-local-dev --dry-run`}),`.`]}),`
`,(0,t.jsx)(n.li,{children:`Apply the smallest needed setup command.`}),`
`,(0,t.jsxs)(n.li,{children:[`Run `,(0,t.jsx)(n.code,{children:`npx pastoralist --dry-run`}),`.`]}),`
`,(0,t.jsx)(n.li,{children:`Report changed files and remaining manual steps.`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`add-ci`,children:`Add CI`}),`
`,(0,t.jsxs)(n.p,{children:[`Create `,(0,t.jsx)(n.code,{children:`.github/workflows/pastoralist.yml`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`name: Override Check
on: [pull_request]

jobs:
  pastoralist:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          check-security: false
`})}),`
`,(0,t.jsx)(n.h2,{id:`verify`,children:`Verify`}),`
`,(0,t.jsx)(n.p,{children:`Use these commands before merging setup changes:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --dry-run
npx pastoralist --summary
npx pastoralist --checkSecurity
`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};