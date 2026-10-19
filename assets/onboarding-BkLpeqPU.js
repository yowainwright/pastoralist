import{a as e}from"./motion-kOo5Kq9S.js";var t=e();function n(e){let n={code:`code`,h2:`h2`,p:`p`,pre:`pre`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`Follow these steps to add Pastoralist to a repo and share the setup with
contributors and agents.`}),`
`,(0,t.jsx)(n.h2,{id:`start-read-only`,children:`Start Read-Only`}),`
`,(0,t.jsx)(n.p,{children:`Check the current project without writing files:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist doctor
`})}),`
`,(0,t.jsx)(n.h2,{id:`add-project-setup`,children:`Add Project Setup`}),`
`,(0,t.jsx)(n.p,{children:`Install Pastoralist and create the initial config:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install pastoralist --save-dev
npx pastoralist init
`})}),`
`,(0,t.jsx)(n.p,{children:`Update the appendix once the config is in place:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,t.jsx)(n.p,{children:`Keep it current after dependency installs:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,t.jsx)(n.h2,{id:`add-agent-setup`,children:`Add Agent Setup`}),`
`,(0,t.jsx)(n.p,{children:`Install the bundled Pastoralist skill:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist init agent-skill
`})}),`
`,(0,t.jsx)(n.p,{children:`The skill gives agents the commands and override tracking rules for this project.
Review proposed config and override changes before applying them.`}),`
`,(0,t.jsx)(n.h2,{id:`add-ci`,children:`Add CI`}),`
`,(0,t.jsxs)(n.p,{children:[`Create `,(0,t.jsx)(n.code,{children:`.github/workflows/pastoralist.yml`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,"data-meta":`title=".github/workflows/pastoralist.yml"`,children:`name: Override Check
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
npx pastoralist --dry-run --summary
npx pastoralist --dry-run --quiet --checkSecurity --strict
`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`start-read-only`,text:`Start Read-Only`},{depth:2,slug:`add-project-setup`,text:`Add Project Setup`},{depth:2,slug:`add-agent-setup`,text:`Add Agent Setup`},{depth:2,slug:`add-ci`,text:`Add CI`},{depth:2,slug:`verify`,text:`Verify`}];export{r as default,i as headings};