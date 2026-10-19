import{a as e}from"./motion-kOo5Kq9S.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`frequently-asked-questions`,children:`Frequently Asked Questions`}),`
`,(0,t.jsx)(n.h3,{id:`what-is-pastoralist`,children:`What is pastoralist?`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist manages npm and Bun `,(0,t.jsx)(n.code,{children:`overrides`}),`, pnpm `,(0,t.jsx)(n.code,{children:`pnpm.overrides`}),`, and Yarn
`,(0,t.jsx)(n.code,{children:`resolutions`}),` by creating an appendix that documents why each override exists
and which packages depend on it.`]}),`
`,(0,t.jsx)(n.h3,{id:`why-do-i-need-pastoralist`,children:`Why do I need pastoralist?`}),`
`,(0,t.jsx)(n.p,{children:`Without Pastoralist, it's easy to lose track of why an override was added, which
packages still need it, or whether it's safe to remove.`}),`
`,(0,t.jsx)(n.h3,{id:`does-pastoralist-work-with-yarn-pnpm-and-bun`,children:`Does pastoralist work with Yarn, pnpm, and Bun?`}),`
`,(0,t.jsx)(n.p,{children:`Yes. Pastoralist reads and writes the override field your package manager uses:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`npm and Bun`}),`: `,(0,t.jsx)(n.code,{children:`overrides`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`pnpm`}),`: `,(0,t.jsx)(n.code,{children:`pnpm.overrides`}),`, or `,(0,t.jsx)(n.code,{children:`pnpm-workspace.yaml`}),` for pnpm 11+`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Yarn`}),`: `,(0,t.jsx)(n.code,{children:`resolutions`})]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`which-files-can-change`,children:`Which Files Can Change?`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist updates the configured manifest, override source, and appendix
target. `,(0,t.jsx)(n.code,{children:`--setup-hook`}),` opts into a postinstall script change. Review changes
with `,(0,t.jsx)(n.code,{children:`--dry-run`}),`; providers may still write caches.`]}),`
`,(0,t.jsx)(n.p,{children:`Package manifests use two-space JSON. Security auto-fix creates a temporary
backup before writing.`}),`
`,(0,t.jsx)(n.h3,{id:`when-should-overrides-be-used`,children:`When should overrides be used?`}),`
`,(0,t.jsx)(n.p,{children:`Use overrides for:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Security patches before upstream updates`}),`
`,(0,t.jsx)(n.li,{children:`Compatibility issues between packages`}),`
`,(0,t.jsx)(n.li,{children:`Bug fixes not yet released`}),`
`,(0,t.jsx)(n.li,{children:`Temporary workarounds`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`common-issues`,children:`Common Issues`}),`
`,(0,t.jsx)(n.h3,{id:`overrides-not-being-removed`,children:`Overrides Not Being Removed`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Problem:`}),` Pastoralist isn't removing overrides that seem unnecessary.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` Cleanup requires `,(0,t.jsx)(n.code,{children:`--remove-unused`}),`. Preview it with
`,(0,t.jsx)(n.code,{children:`--remove-unused --dry-run`}),`. Active keep constraints and uncertain dependency
usage can prevent removal. Use debug mode to inspect the decision:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --debug
`})}),`
`,(0,t.jsx)(n.p,{children:`Look for output showing which packages require the override.`}),`
`,(0,t.jsx)(n.h3,{id:`packagejson-formatting-changes`,children:`package.json Formatting Changes`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Problem:`}),` Pastoralist changes the formatting of my `,(0,t.jsx)(n.code,{children:`package.json`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` Pastoralist rewrites `,(0,t.jsx)(n.code,{children:`package.json`}),` as two-space JSON. If you see unexpected changes:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`Ensure you're using the latest version`}),`
`,(0,t.jsxs)(n.li,{children:[`Check if you have a `,(0,t.jsx)(n.code,{children:`.prettierrc`}),` or `,(0,t.jsx)(n.code,{children:`.editorconfig`}),` that might conflict`]}),`
`,(0,t.jsx)(n.li,{children:`Consider running a formatter after pastoralist`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`patches-not-detected`,children:`Patches Not Detected`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Problem:`}),` My patch files aren't being tracked in the appendix.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` Ensure patches follow the standard naming convention:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:`patches/
├── package-name+1.0.0.patch    # Correct
├── package-name@1.0.0.patch    # Incorrect
└── custom-patch.patch          # Won't be detected
`})}),`
`,(0,t.jsx)(n.h3,{id:`workspace-scans-are-slow-or-incomplete`,children:`Workspace Scans Are Slow or Incomplete`}),`
`,(0,t.jsxs)(n.p,{children:[`Configure `,(0,t.jsx)(n.code,{children:`depPaths: "workspace"`}),` at the root, or use explicit manifest globs
to narrow the scan:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --depPaths "packages/*/package.json" --debug
`})}),`
`,(0,t.jsx)(n.p,{children:`npm overrides belong in the root manifest. Moving them into workspace
manifests does not make them package-specific; use root nested overrides
to scope a transitive override to a parent.`}),`
`,(0,t.jsx)(n.h3,{id:`ci-reports-tracking-changes`,children:`CI Reports Tracking Changes`}),`
`,(0,t.jsx)(n.p,{children:`Run Pastoralist locally, review the generated diff, and include the appendix
with your dependency change:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
git diff -- package.json
`})}),`
`,(0,t.jsxs)(n.p,{children:[`For external sources, include those files in the review as well.
See `,(0,t.jsx)(n.a,{href:`/docs/github-action`,children:`GitHub Action`}),` for checks and maintenance PRs.`]}),`
`,(0,t.jsx)(n.h2,{id:`debug-mode`,children:`Debug Mode`}),`
`,(0,t.jsx)(n.p,{children:`Enable debug mode for detailed information:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --debug
`})}),`
`,(0,t.jsx)(n.p,{children:`Debug output includes:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Package resolution paths`}),`
`,(0,t.jsx)(n.li,{children:`Dependency tree analysis`}),`
`,(0,t.jsx)(n.li,{children:`Override usage detection`}),`
`,(0,t.jsx)(n.li,{children:`File operation details`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`error-messages`,children:`Error Messages`}),`
`,(0,t.jsx)(n.h3,{id:`cannot-find-packagejson`,children:`"Cannot find package.json"`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist can't locate your `,(0,t.jsx)(n.code,{children:`package.json`}),`. Solutions:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Run from project root`}),`
`,(0,t.jsxs)(n.li,{children:[`Use `,(0,t.jsx)(n.code,{children:`--path`}),` to specify location`]}),`
`,(0,t.jsx)(n.li,{children:`Check file permissions`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`invalid-packagejson`,children:`"Invalid package.json"`}),`
`,(0,t.jsxs)(n.p,{children:[`Your `,(0,t.jsx)(n.code,{children:`package.json`}),` has syntax errors. Validate with:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`node -e 'JSON.parse(require("node:fs").readFileSync("package.json", "utf8"))'
`})}),`
`,(0,t.jsx)(n.h3,{id:`no-overrides-found`,children:`"No overrides found"`}),`
`,(0,t.jsxs)(n.p,{children:[`Confirm that the override is in the field or file used by your package manager.
For pnpm 11+, check `,(0,t.jsx)(n.code,{children:`pnpm-workspace.yaml`}),`. A project with no overrides does
not need an override appendix.`]}),`
`,(0,t.jsx)(n.h2,{id:`best-practices`,children:`Best Practices`}),`
`,(0,t.jsx)(n.h3,{id:`1-regular-updates`,children:`1. Regular Updates`}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist regularly:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" {3}`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`2-document-override-reasons`,children:`2. Document Override Reasons`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`package.json`}),` does not support comments. Add a ledger `,(0,t.jsx)(n.code,{children:`reason`}),` to record
why an override exists, or provide reasons with `,(0,t.jsx)(n.code,{children:`--promptForReasons`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" /appendix/`,children:`{
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Keep until upstream adopts the required version.",
          "source": "manual"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`3-monitor-patch-files`,children:`3. Monitor Patch Files`}),`
`,(0,t.jsx)(n.p,{children:`Review potentially unused patch paths reported by Pastoralist. It does not
delete patch files.`}),`
`,(0,t.jsx)(n.h2,{id:`getting-help`,children:`Getting Help`}),`
`,(0,t.jsx)(n.h3,{id:`resources`,children:`Resources`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`GitHub Issues`}),` - Report bugs and ask questions`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`before-filing-an-issue`,children:`Before Filing an Issue`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`Update to the latest version`}),`
`,(0,t.jsxs)(n.li,{children:[`Run with `,(0,t.jsx)(n.code,{children:`--debug`}),` flag`]}),`
`,(0,t.jsx)(n.li,{children:`Check existing issues`}),`
`,(0,t.jsx)(n.li,{children:`Provide minimal reproduction`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`issue-template`,children:`Issue Template`}),`
`,(0,t.jsx)(n.p,{children:`When reporting issues, include:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Pastoralist version`}),`
`,(0,t.jsx)(n.li,{children:`Node.js version`}),`
`,(0,t.jsx)(n.li,{children:`Package manager (npm, Yarn, pnpm, or Bun)`}),`
`,(0,t.jsx)(n.li,{children:`Relevant package.json sections`}),`
`,(0,t.jsx)(n.li,{children:`Debug output`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`migration-help`,children:`Migration Help`}),`
`,(0,t.jsx)(n.h3,{id:`from-manual-management`,children:`From Manual Management`}),`
`,(0,t.jsx)(n.p,{children:`If you're tracking overrides manually in docs or issue trackers, Pastoralist will:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Document all current overrides in `,(0,t.jsx)(n.code,{children:`pastoralist.appendix`})]}),`
`,(0,t.jsx)(n.li,{children:`Track their usage going forward`}),`
`,(0,t.jsxs)(n.li,{children:[`Flag unused overrides and remove them when you run with `,(0,t.jsx)(n.code,{children:`--remove-unused`})]}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`ledger-shape`,children:`Ledger Shape`}),`
`,(0,t.jsxs)(n.p,{children:[`Expanded entries include `,(0,t.jsx)(n.code,{children:`ledger.addedDate`}),`. With `,(0,t.jsx)(n.code,{children:`compactAppendix`}),`,
routine entries may contain only top-level `,(0,t.jsx)(n.code,{children:`addedDate`}),`. Reasons, security
data, patches, and keep constraints require expanded entries.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`reviewBy`}),` is descriptive metadata; it does not expire a keep constraint.
Use `,(0,t.jsx)(n.code,{children:`until`}),` or `,(0,t.jsx)(n.code,{children:`untilVersion`}),` for expiry.`]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`frequently-asked-questions`,text:`Frequently Asked Questions`},{depth:3,slug:`what-is-pastoralist`,text:`What is pastoralist?`},{depth:3,slug:`why-do-i-need-pastoralist`,text:`Why do I need pastoralist?`},{depth:3,slug:`does-pastoralist-work-with-yarn-pnpm-and-bun`,text:`Does pastoralist work with Yarn, pnpm, and Bun?`},{depth:3,slug:`which-files-can-change`,text:`Which Files Can Change?`},{depth:3,slug:`when-should-overrides-be-used`,text:`When should overrides be used?`},{depth:2,slug:`common-issues`,text:`Common Issues`},{depth:3,slug:`overrides-not-being-removed`,text:`Overrides Not Being Removed`},{depth:3,slug:`packagejson-formatting-changes`,text:`package.json Formatting Changes`},{depth:3,slug:`patches-not-detected`,text:`Patches Not Detected`},{depth:3,slug:`workspace-scans-are-slow-or-incomplete`,text:`Workspace Scans Are Slow or Incomplete`},{depth:3,slug:`ci-reports-tracking-changes`,text:`CI Reports Tracking Changes`},{depth:2,slug:`debug-mode`,text:`Debug Mode`},{depth:2,slug:`error-messages`,text:`Error Messages`},{depth:3,slug:`cannot-find-packagejson`,text:`"Cannot find package.json"`},{depth:3,slug:`invalid-packagejson`,text:`"Invalid package.json"`},{depth:3,slug:`no-overrides-found`,text:`"No overrides found"`},{depth:2,slug:`best-practices`,text:`Best Practices`},{depth:3,slug:`1-regular-updates`,text:`1. Regular Updates`},{depth:3,slug:`2-document-override-reasons`,text:`2. Document Override Reasons`},{depth:3,slug:`3-monitor-patch-files`,text:`3. Monitor Patch Files`},{depth:2,slug:`getting-help`,text:`Getting Help`},{depth:3,slug:`resources`,text:`Resources`},{depth:3,slug:`before-filing-an-issue`,text:`Before Filing an Issue`},{depth:3,slug:`issue-template`,text:`Issue Template`},{depth:2,slug:`migration-help`,text:`Migration Help`},{depth:3,slug:`from-manual-management`,text:`From Manual Management`},{depth:2,slug:`ledger-shape`,text:`Ledger Shape`}];export{r as default,i as headings};