import{n as e}from"./motion-B8hZlCEG.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,p:`p`,pre:`pre`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`install`,children:`Install`}),`
`,(0,t.jsx)(n.p,{children:`Add Pastoralist as a dev dependency:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install pastoralist --save-dev
`})}),`
`,(0,t.jsx)(n.p,{children:`Other package managers work too:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pnpm add pastoralist --save-dev
yarn add pastoralist --dev
bun add pastoralist --dev
`})}),`
`,(0,t.jsx)(n.h2,{id:`initialize`,children:`Initialize`}),`
`,(0,t.jsx)(n.p,{children:`Run a read-only setup and override health check first:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist doctor
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`doctor`}),` runs in dry-run summary mode, so it shows current override health
without modifying `,(0,t.jsx)(n.code,{children:`package.json`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:`Run the guided setup:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --init
`})}),`
`,(0,t.jsxs)(n.p,{children:[`The initializer can detect workspace packages, ask whether security checks
should run, and save the configuration in `,(0,t.jsx)(n.code,{children:`package.json`}),` or a config file.`]}),`
`,(0,t.jsx)(n.p,{children:`For a simple project, you can also run Pastoralist directly:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,t.jsxs)(n.p,{children:[`It will scan your package manager overrides or resolutions, update the
`,(0,t.jsx)(n.code,{children:`pastoralist.appendix`}),`, and leave unrelated package fields alone.`]}),`
`,(0,t.jsx)(n.h2,{id:`add-the-install-hook`,children:`Add The Install Hook`}),`
`,(0,t.jsx)(n.p,{children:`Most projects should run Pastoralist after dependency installs:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist can add that hook automatically:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,t.jsx)(n.h2,{id:`verify-changes`,children:`Verify Changes`}),`
`,(0,t.jsx)(n.p,{children:`Preview the package.json update before writing anything:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --dry-run
`})}),`
`,(0,t.jsx)(n.p,{children:`Print summary metrics for CI or release checks:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --summary
`})}),`
`,(0,t.jsx)(n.p,{children:`Remove overrides that no package still depends on:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --remove-unused
`})}),`
`,(0,t.jsx)(n.h2,{id:`common-starting-config`,children:`Common Starting Config`}),`
`,(0,t.jsx)(n.p,{children:`For a workspace project with OSV security checks:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
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
`,(0,t.jsxs)(n.p,{children:[`Next, read `,(0,t.jsx)(n.a,{href:`/docs/configuration`,children:`Configuration`}),` for all options or
`,(0,t.jsx)(n.a,{href:`/docs/workspaces`,children:`Workspaces & Monorepos`}),` for monorepo setup.`]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};