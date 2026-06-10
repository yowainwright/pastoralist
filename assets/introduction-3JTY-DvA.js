import{n as e}from"./motion-B8hZlCEG.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,li:`li`,p:`p`,pre:`pre`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(`div`,{className:`flex flex-wrap gap-2 mb-8`,children:[(0,t.jsx)(`a`,{href:`https://www.npmjs.com/package/pastoralist`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://img.shields.io/npm/v/pastoralist.svg`,alt:`npm version`})}),(0,t.jsx)(`a`,{href:`https://www.npmjs.com/package/pastoralist`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://img.shields.io/npm/dm/pastoralist.svg`,alt:`npm downloads`})}),(0,t.jsx)(`a`,{href:`https://github.com/yowainwright/pastoralist`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://img.shields.io/github/stars/yowainwright/pastoralist?style=social`,alt:`GitHub stars`})}),(0,t.jsx)(`a`,{href:`https://www.typescriptlang.org/`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://img.shields.io/badge/TypeScript-types%20included-blue`,alt:`TypeScript types included`})})]}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist is the audit trail for package manager overrides.`}),`
`,(0,t.jsxs)(n.p,{children:[`If your project uses `,(0,t.jsx)(n.code,{children:`overrides`}),`, `,(0,t.jsx)(n.code,{children:`pnpm.overrides`}),`, or `,(0,t.jsx)(n.code,{children:`resolutions`}),`,
Pastoralist records why each entry exists, which packages still need it, and
when it can be removed. It can also connect security fixes, patch files,
workspace packages, and CI checks to the same record.`]}),`
`,(0,t.jsx)(n.h2,{id:`why-this-matters`,children:`Why This Matters`}),`
`,(0,t.jsx)(n.p,{children:`Overrides usually start with a good reason:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "lodash": "4.17.21"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Months later, the context is gone. Was it a security fix? A transitive bug? Who
still needs it? Is it safe to remove? The override should stay as the package
manager instruction; the appendix carries the review detail:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "web-app": "lodash@^4.17.20",
          "admin-ui": "lodash@^4.17.19"
        },
        "ledger": {
          "addedDate": "2026-05-06T00:00:00.000Z",
          "reason": "Pin lodash to a patched version while workspace packages finish upgrades.",
          "source": "manual",
          "securityChecked": true,
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
          "keep": {
            "reason": "Keep until each workspace requests lodash 4.17.21 or newer.",
            "untilVersion": "4.17.21"
          }
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`The override controls the installed version. The appendix explains why that
control exists, who still depends on it, what scanner or reviewer justified it,
and what condition makes it removable.`}),`
`,(0,t.jsx)(n.h2,{id:`what-pastoralist-handles`,children:`What Pastoralist Handles`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Tracks npm and Bun `,(0,t.jsx)(n.code,{children:`overrides`}),`, pnpm `,(0,t.jsx)(n.code,{children:`pnpm.overrides`}),`, and Yarn
`,(0,t.jsx)(n.code,{children:`resolutions`})]}),`
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
`,(0,t.jsx)(n.h2,{id:`at-a-glance`,children:`At A Glance`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Area`}),(0,t.jsx)(n.th,{children:`Details`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Package managers`}),(0,t.jsx)(n.td,{children:`npm, pnpm, Yarn, Bun`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Runtime`}),(0,t.jsx)(n.td,{children:`Node 20+`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Security default`}),(0,t.jsx)(n.td,{children:`OSV, no token required`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Optional providers`}),(0,t.jsx)(n.td,{children:`GitHub, npm audit, Snyk, Socket, Spektion`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Monorepos`}),(0,t.jsxs)(n.td,{children:[`Auto-detects `,(0,t.jsx)(n.code,{children:`workspaces`}),`; accepts explicit package globs`]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`CI`}),(0,t.jsx)(n.td,{children:`CLI flags plus a GitHub Action`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Test surface`}),(0,t.jsx)(n.td,{children:`1,700+ test cases across unit, integration, and e2e fixtures`})]})]})]}),`
`,(0,t.jsx)(n.h2,{id:`when-to-use-it`,children:`When To Use It`}),`
`,(0,t.jsx)(n.p,{children:`Use Pastoralist when your project has overrides that need a durable reason, a
regular cleanup path, or a security audit trail.`}),`
`,(0,t.jsx)(n.p,{children:`It is designed to sit beside tools such as npm audit, Dependabot, Renovate,
patch-package, syncpack, and depcheck. Those tools find or apply dependency
changes. Pastoralist keeps the resulting overrides from becoming invisible
technical debt.`}),`
`,(0,t.jsx)(n.h2,{id:`start-here`,children:`Start Here`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install pastoralist --save-dev
npx pastoralist --init
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Then add it to `,(0,t.jsx)(n.code,{children:`postinstall`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Continue with the `,(0,t.jsx)(n.a,{href:`/docs/setup`,children:`setup guide`}),`, or try a sandbox:`]}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};