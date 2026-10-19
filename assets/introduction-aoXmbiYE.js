import{a as e}from"./motion-kOo5Kq9S.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,li:`li`,p:`p`,pre:`pre`,ul:`ul`,...e.components},{ScrollyCode:r}=n;return r||i(`ScrollyCode`,!0),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(`div`,{className:`flex flex-wrap gap-2 mb-8`,children:[(0,t.jsx)(`a`,{href:`https://www.npmjs.com/package/pastoralist`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://img.shields.io/npm/v/pastoralist.svg`,alt:`npm version`})}),(0,t.jsx)(`a`,{href:`https://www.npmjs.com/package/pastoralist`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://img.shields.io/npm/dm/pastoralist.svg`,alt:`npm downloads`})}),(0,t.jsx)(`a`,{href:`https://www.typescriptlang.org/`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://img.shields.io/badge/TypeScript-types%20included-blue`,alt:`TypeScript types included`})})]}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist tracks your dependency overrides: why they're there, which packages
need them, and when you can remove them.`}),`
`,(0,t.jsxs)(n.p,{children:[`It works with npm and Bun `,(0,t.jsx)(n.code,{children:`overrides`}),`, pnpm `,(0,t.jsx)(n.code,{children:`pnpm.overrides`}),` or
`,(0,t.jsx)(n.code,{children:`pnpm-workspace.yaml`}),` (pnpm 11+), and Yarn `,(0,t.jsx)(n.code,{children:`resolutions`}),`.`]}),`
`,(0,t.jsx)(n.h2,{id:`override-tracking`,children:`Override Tracking`}),`
`,(0,t.jsx)(n.p,{children:`Running Pastoralist adds an appendix entry to an existing override:`}),`
`,(0,t.jsx)(r,{example:`tracking`}),`
`,(0,t.jsxs)(n.p,{children:[`This output was generated from a fixture with an `,(0,t.jsx)(n.code,{children:`express → qs`}),` dependency.
Your dependents and dates reflect your project. Add a ledger `,(0,t.jsx)(n.code,{children:`reason`}),` when
you want to record a decision that the dependency tree cannot explain.`]}),`
`,(0,t.jsx)(n.h2,{id:`what-pastoralist-handles`,children:`What Pastoralist Handles`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Shows which direct or workspace packages still depend on each override`}),`
`,(0,t.jsxs)(n.li,{children:[`Removes stale overrides with `,(0,t.jsx)(n.code,{children:`--remove-unused`})]}),`
`,(0,t.jsxs)(n.li,{children:[`Links `,(0,t.jsx)(n.code,{children:`patch-package`}),` files to the overrides they support`]}),`
`,(0,t.jsx)(n.li,{children:`Checks security advisories with OSV, GitHub Dependabot alerts, npm audit,
Snyk, Socket, or Spektion`}),`
`,(0,t.jsxs)(n.li,{children:[`Supports monorepos through `,(0,t.jsx)(n.code,{children:`workspaces`}),`, `,(0,t.jsx)(n.code,{children:`depPaths`}),`, `,(0,t.jsx)(n.code,{children:`overridePaths`}),`, and
`,(0,t.jsx)(n.code,{children:`resolutionPaths`})]}),`
`,(0,t.jsxs)(n.li,{children:[`Provides CI-friendly output with `,(0,t.jsx)(n.code,{children:`--dry-run`}),`, `,(0,t.jsx)(n.code,{children:`--quiet`}),`, `,(0,t.jsx)(n.code,{children:`--summary`}),`, and
`,(0,t.jsx)(n.code,{children:`--outputFormat json`})]}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`requirements`,children:`Requirements`}),`
`,(0,t.jsx)(n.p,{children:`Use Node.js 20.19 or newer. Security scanning is optional; OSV is the default
provider when scanning is enabled and requires no token.`}),`
`,(0,t.jsx)(n.h2,{id:`start-here`,children:`Start Here`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install pastoralist --save-dev
npx pastoralist init
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Then add it to `,(0,t.jsx)(n.code,{children:`postinstall`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" {3}`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Continue with the `,(0,t.jsx)(n.a,{href:`/docs/setup`,children:`setup guide`}),`, or try a sandbox:`]}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}function i(e,t){throw Error(`Expected `+(t?`component`:`object`)+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}var a=[{depth:2,slug:`override-tracking`,text:`Override Tracking`},{depth:2,slug:`what-pastoralist-handles`,text:`What Pastoralist Handles`},{depth:2,slug:`requirements`,text:`Requirements`},{depth:2,slug:`start-here`,text:`Start Here`}];export{r as default,a as headings};