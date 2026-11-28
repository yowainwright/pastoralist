import{a as e}from"./motion-B9BBAFO9.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,p:`p`,pre:`pre`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`install`,children:`Install`}),`
`,(0,t.jsx)(`p`,{id:`add-project-setup`,children:`Install Pastoralist as a dev dependency in your project.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install pastoralist --save-dev
`})}),`
`,(0,t.jsx)(n.p,{children:`Other package managers work too:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pnpm add pastoralist --save-dev
yarn add pastoralist --dev
bun add pastoralist --dev
`})}),`
`,(0,t.jsx)(n.p,{children:`For a global CLI, install with npm or Homebrew:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install --global pastoralist
brew install yowainwright/tap/pastoralist
`})}),`
`,(0,t.jsx)(n.h2,{id:`initialize`,children:`Initialize`}),`
`,(0,t.jsx)(`p`,{id:`start-read-only`,children:`From your project root, preview what Pastoralist would change.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist doctor
`})}),`
`,(0,t.jsx)(n.p,{children:`To save workspace and security settings, run guided setup before updating the appendix.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist init # Opens guided setup for this project.
npx pastoralist # Updates the override appendix.
`})}),`
`,(0,t.jsx)(n.h2,{id:`add-agent-setup`,children:`Add Agent Setup`}),`
`,(0,t.jsx)(n.p,{children:`Install the bundled skill to give coding agents the project's override tracking commands.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist init agent-skill
`})}),`
`,(0,t.jsx)(n.h2,{id:`add-the-install-hook`,children:`Add The Install Hook`}),`
`,(0,t.jsx)(n.p,{children:`To update tracking after dependency installs, add a postinstall hook:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" {3}`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist can add that hook automatically:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,t.jsx)(n.h2,{id:`verify-changes`,children:`Verify Changes`}),`
`,(0,t.jsx)(`p`,{id:`verify`,children:`Preview the changes before applying them locally or in CI.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --dry-run # Previews the appendix update.
npx pastoralist --dry-run --summary # Adds a summary of the proposed changes.
npx pastoralist --dry-run --quiet --checkSecurity --strict # Exits with an error if the security scan fails or finds vulnerabilities.
`})}),`
`,(0,t.jsx)(n.p,{children:`Preview unused override removal before applying it:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --remove-unused --dry-run
npx pastoralist --remove-unused
`})}),`
`,(0,t.jsx)(n.h2,{id:`add-ci`,children:`Add CI`}),`
`,(0,t.jsxs)(n.p,{children:[`To check override tracking on pull requests, copy the Basic PR Check workflow
from the `,(0,t.jsx)(n.a,{href:`/docs/github-action`,children:`GitHub Action guide`}),` into `,(0,t.jsx)(n.code,{children:`.github/workflows/pastoralist.yml`}),`.`]}),`
`,(0,t.jsx)(n.h2,{id:`common-starting-config`,children:`Common Starting Config`}),`
`,(0,t.jsx)(n.p,{children:`For a workspace project with OSV security checks:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": true,
    "security": {
      "provider": "osv",
      "severityThreshold": "medium",
      "hasWorkspaceSecurityChecks": true
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Read `,(0,t.jsx)(n.a,{href:`/docs/configuration`,children:`Configuration`}),` for all options or
`,(0,t.jsx)(n.a,{href:`/docs/workspaces`,children:`Workspaces & Monorepos`}),` for monorepo setup.`]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`install`,text:`Install`},{depth:2,slug:`initialize`,text:`Initialize`},{depth:2,slug:`add-agent-setup`,text:`Add Agent Setup`},{depth:2,slug:`add-the-install-hook`,text:`Add The Install Hook`},{depth:2,slug:`verify-changes`,text:`Verify Changes`},{depth:2,slug:`add-ci`,text:`Add CI`},{depth:2,slug:`common-starting-config`,text:`Common Starting Config`}];export{r as default,i as headings};