import{a as e}from"./motion-kOo5Kq9S.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,p:`p`,pre:`pre`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`Pastoralist tracks root overrides and reads workspace manifests to identify
which packages depend on each overridden dependency.`}),`
`,(0,t.jsx)(n.h2,{id:`root-overrides`,children:`Root Overrides`}),`
`,(0,t.jsxs)(n.p,{children:[`npm reads overrides only from the root `,(0,t.jsx)(n.code,{children:`package.json`}),`. Overrides in workspace
packages do not affect npm's dependency resolution.
See `,(0,t.jsx)(n.a,{href:`https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides`,children:`npm's override rules`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[`Keep shared overrides at the root and use `,(0,t.jsx)(n.code,{children:`depPaths`}),` to include workspace
dependency context:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "name": "my-monorepo",
  "workspaces": ["packages/*", "apps/*"],
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Run Pastoralist from the root:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist reads workspace manifests to find dependents and writes the
appendix to the configured target, usually the root manifest.`}),`
`,(0,t.jsx)(n.h2,{id:`dependency-paths`,children:`Dependency Paths`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`"workspace"`}),` and `,(0,t.jsx)(n.code,{children:`"workspaces"`}),` read workspace patterns from both
`,(0,t.jsx)(n.code,{children:`package.json#workspaces`}),` and `,(0,t.jsx)(n.code,{children:`pnpm-workspace.yaml`}),`.
Yarn's `,(0,t.jsx)(n.code,{children:`workspaces: { "packages": [...] }`}),` form is also supported.`]}),`
`,(0,t.jsx)(n.p,{children:`For other layouts, configure explicit manifest globs:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "pastoralist": {
    "depPaths": ["packages/*/package.json", "apps/*/package.json"]
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Or pass them for one run:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
`})}),`
`,(0,t.jsxs)(n.p,{children:[`CLI paths take precedence over configured paths. Use `,(0,t.jsx)(n.code,{children:`--ignore`}),` to exclude
generated or vendored manifests.`]}),`
`,(0,t.jsx)(n.h2,{id:`pnpm-workspaces`,children:`pnpm Workspaces`}),`
`,(0,t.jsxs)(n.p,{children:[`pnpm 11+ stores overrides in the root `,(0,t.jsx)(n.code,{children:`pnpm-workspace.yaml`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,"data-meta":`title="pnpm-workspace.yaml"`,children:`packages:
  - "packages/*"
  - "apps/*"
overrides:
  lodash: "4.17.21"
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Configure Pastoralist in `,(0,t.jsx)(n.code,{children:`package.json`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "packageManager": "pnpm@11.0.0",
  "pastoralist": {
    "depPaths": "workspace"
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist selects the YAML override source when it already contains
overrides or the declared or lockfile-resolved pnpm version is 11 or newer.
For earlier pnpm versions, it also supports `,(0,t.jsx)(n.code,{children:`package.json#pnpm.overrides`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[`If the pnpm version cannot be resolved, pin an exact `,(0,t.jsx)(n.code,{children:`packageManager`}),`
version or set `,(0,t.jsx)(n.code,{children:`pastoralist.overrideSource`}),` explicitly.`]}),`
`,(0,t.jsx)(n.h2,{id:`yarn-workspaces`,children:`Yarn Workspaces`}),`
`,(0,t.jsx)(n.p,{children:`Keep resolutions at the root:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "private": true,
  "workspaces": {
    "packages": ["packages/*"]
  },
  "resolutions": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`parent-specific-npm-overrides`,children:`Parent-Specific npm Overrides`}),`
`,(0,t.jsx)(n.p,{children:`Use a nested root override when a transitive dependency needs a version
under one parent:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`--path`}),` selects a manifest in another project. It does not make npm honor
overrides inside a workspace package.`]}),`
`,(0,t.jsx)(n.h2,{id:`security-checks`,children:`Security Checks`}),`
`,(0,t.jsxs)(n.p,{children:[`Workspace paths configured through `,(0,t.jsx)(n.code,{children:`depPaths`}),` are included when security
scanning is enabled. `,(0,t.jsx)(n.code,{children:`--hasWorkspaceSecurityChecks`}),` also enables discovered
workspace paths:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --hasWorkspaceSecurityChecks --dry-run
`})}),`
`,(0,t.jsxs)(n.p,{children:[`See `,(0,t.jsx)(n.a,{href:`/docs/security`,children:`Security`}),` for providers and fix options.`]}),`
`,(0,t.jsx)(n.h2,{id:`ci`,children:`CI`}),`
`,(0,t.jsx)(n.p,{children:`Check tracking without writing files:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  with:
    mode: check
    check-security: false
    fail-on-unused: true
    dep-paths: "packages/*/package.json apps/*/package.json"
`})}),`
`,(0,t.jsx)(n.h2,{id:`troubleshooting`,children:`Troubleshooting`}),`
`,(0,t.jsxs)(n.p,{children:[`If an override appears unused, confirm that `,(0,t.jsx)(n.code,{children:`depPaths`}),` includes the
manifests that depend on it. Use explicit globs to narrow large scans and
`,(0,t.jsx)(n.code,{children:`--debug`}),` to inspect dependency resolution.`]}),`
`,(0,t.jsx)(n.p,{children:`If multiple appendixes describe the same shared override, run Pastoralist
once at the root with workspace paths configured.`})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`root-overrides`,text:`Root Overrides`},{depth:2,slug:`dependency-paths`,text:`Dependency Paths`},{depth:2,slug:`pnpm-workspaces`,text:`pnpm Workspaces`},{depth:2,slug:`yarn-workspaces`,text:`Yarn Workspaces`},{depth:2,slug:`parent-specific-npm-overrides`,text:`Parent-Specific npm Overrides`},{depth:2,slug:`security-checks`,text:`Security Checks`},{depth:2,slug:`ci`,text:`CI`},{depth:2,slug:`troubleshooting`,text:`Troubleshooting`}];export{r as default,i as headings};