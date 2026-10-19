import{a as e}from"./motion-kOo5Kq9S.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,li:`li`,p:`p`,pre:`pre`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[`This tutorial follows an `,(0,t.jsx)(n.code,{children:`express → qs`}),` override through tracking and cleanup.
The versions are fixture inputs, not package-version recommendations.`]}),`
`,(0,t.jsx)(n.h2,{id:`create-a-test-project`,children:`Create a Test Project`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`mkdir test-pastoralist
cd test-pastoralist
npm init -y
npm pkg set name=shepherd-cli
npm pkg set overrides.qs=6.11.2
npm install express@4.18.2 --save-exact
npm install pastoralist --save-dev
`})}),`
`,(0,t.jsx)(n.h2,{id:`generate-tracking`,children:`Generate Tracking`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist generated this diff from the fixture's dependency graph:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:`--- package.json
+++ package.json
@@ -5,5 +5,17 @@
   },
   "overrides": {
     "qs": "6.11.2"
+  },
+  "pastoralist": {
+    "appendix": {
+      "qs@6.11.2": {
+        "dependents": {
+          "shepherd-cli": "qs (required by express)"
+        },
+        "ledger": {
+          "addedDate": "2026-10-16"
+        }
+      }
+    }
   }
 }
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`dependents`}),` identifies the project and the package requiring `,(0,t.jsx)(n.code,{children:`qs`}),`.
`,(0,t.jsx)(n.code,{children:`ledger.addedDate`}),` records when Pastoralist first tracked the override.
Actual dependents reflect your resolved dependency tree.`]}),`
`,(0,t.jsx)(n.h2,{id:`review-before-writing`,children:`Review Before Writing`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist doctor
npx pastoralist --dry-run
`})}),`
`,(0,t.jsx)(n.h2,{id:`remove-an-unused-override`,children:`Remove an Unused Override`}),`
`,(0,t.jsx)(n.p,{children:`Remove the dependency that required the override, then preview cleanup:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm uninstall express
npx pastoralist --remove-unused --dry-run
`})}),`
`,(0,t.jsxs)(n.p,{children:[`If no other package needs `,(0,t.jsx)(n.code,{children:`qs`}),`, apply cleanup:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --remove-unused
`})}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist removes the unused override and its appendix entry. Active keep
constraints protect entries from removal; uncertain usage is not proof that
an override is unused.`}),`
`,(0,t.jsx)(n.h2,{id:`keep-tracking-current`,children:`Keep Tracking Current`}),`
`,(0,t.jsx)(n.p,{children:`Opt into running Pastoralist after dependency installs:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Use `,(0,t.jsx)(n.a,{href:`/docs/configuration`,children:`Configuration`}),` for ledger reasons and keep constraints,
or `,(0,t.jsx)(n.a,{href:`/docs/workspaces`,children:`Workspaces`}),` for monorepo setup.`]}),`
`,(0,t.jsx)(n.h2,{id:`try-it-now`,children:`Try It Now`}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.a,{href:`/docs/introduction`,children:`Open Interactive Demos`}),` to see Pastoralist in action.`]}),`
`,(0,t.jsx)(n.h2,{id:`resources`,children:`Resources`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist`,children:`GitHub`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`https://www.npmjs.com/package/pastoralist`,children:`npm`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`Issues and Questions`})}),`
`]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`create-a-test-project`,text:`Create a Test Project`},{depth:2,slug:`generate-tracking`,text:`Generate Tracking`},{depth:2,slug:`review-before-writing`,text:`Review Before Writing`},{depth:2,slug:`remove-an-unused-override`,text:`Remove an Unused Override`},{depth:2,slug:`keep-tracking-current`,text:`Keep Tracking Current`},{depth:2,slug:`try-it-now`,text:`Try It Now`},{depth:2,slug:`resources`,text:`Resources`}];export{r as default,i as headings};