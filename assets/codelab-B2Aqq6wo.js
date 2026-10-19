var e=`---
title: Interactive Tutorial
description: Learn Pastoralist step by step
---

This tutorial follows an \`express → qs\` override through tracking and cleanup.
The versions are fixture inputs, not package-version recommendations.

## Create a Test Project

\`\`\`bash
mkdir test-pastoralist
cd test-pastoralist
npm init -y
npm pkg set name=shepherd-cli
npm pkg set overrides.qs=6.11.2
npm install express@4.18.2 --save-exact
npm install pastoralist --save-dev
\`\`\`

## Generate Tracking

\`\`\`bash
npx pastoralist
\`\`\`

Pastoralist generated this diff from the fixture's dependency graph:

\`\`\`diff
--- package.json
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
\`\`\`

\`dependents\` identifies the project and the package requiring \`qs\`.
\`ledger.addedDate\` records when Pastoralist first tracked the override.
Actual dependents reflect your resolved dependency tree.

## Review Before Writing

\`\`\`bash
npx pastoralist doctor
npx pastoralist --dry-run
\`\`\`

## Remove an Unused Override

Remove the dependency that required the override, then preview cleanup:

\`\`\`bash
npm uninstall express
npx pastoralist --remove-unused --dry-run
\`\`\`

If no other package needs \`qs\`, apply cleanup:

\`\`\`bash
npx pastoralist --remove-unused
\`\`\`

Pastoralist removes the unused override and its appendix entry. Active keep
constraints protect entries from removal; uncertain usage is not proof that
an override is unused.

## Keep Tracking Current

Opt into running Pastoralist after dependency installs:

\`\`\`bash
npx pastoralist --setup-hook
\`\`\`

Use [Configuration](/docs/configuration) for ledger reasons and keep constraints,
or [Workspaces](/docs/workspaces) for monorepo setup.

## Try It Now

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

[Open Interactive Demos](/docs/introduction) to see Pastoralist in action.

## Resources

- [GitHub](https://github.com/yowainwright/pastoralist)
- [npm](https://www.npmjs.com/package/pastoralist)
- [Issues and Questions](https://github.com/yowainwright/pastoralist/issues)
`;export{e as default};