import{n as e}from"./motion-B8hZlCEG.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`frequently-asked-questions`,children:`Frequently Asked Questions`}),`
`,(0,t.jsx)(n.h3,{id:`what-is-pastoralist`,children:`What is pastoralist?`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist manages npm and Bun `,(0,t.jsx)(n.code,{children:`overrides`}),`, pnpm `,(0,t.jsx)(n.code,{children:`pnpm.overrides`}),`, and Yarn
`,(0,t.jsx)(n.code,{children:`resolutions`}),` by creating an appendix that documents why each override exists
and which packages depend on it.`]}),`
`,(0,t.jsx)(n.h3,{id:`why-do-i-need-pastoralist`,children:`Why do I need pastoralist?`}),`
`,(0,t.jsx)(n.p,{children:`Without pastoralist, it's easy to forget why an override was added, which
packages still need it, or whether it's safe to remove.`}),`
`,(0,t.jsx)(n.h3,{id:`does-pastoralist-work-with-yarn-pnpm-and-bun`,children:`Does pastoralist work with Yarn, pnpm, and Bun?`}),`
`,(0,t.jsx)(n.p,{children:`Yes. Pastoralist reads and writes the override field your package manager uses:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`npm and Bun`}),`: `,(0,t.jsx)(n.code,{children:`overrides`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`pnpm`}),`: `,(0,t.jsx)(n.code,{children:`pnpm.overrides`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Yarn`}),`: `,(0,t.jsx)(n.code,{children:`resolutions`})]}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`is-pastoralist-safe-to-use`,children:`Is pastoralist safe to use?`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist is designed to keep changes reviewable:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Only modifies override/resolution fields and the `,(0,t.jsx)(n.code,{children:`pastoralist`}),` section of package.json`]}),`
`,(0,t.jsx)(n.li,{children:`Normalizes package.json output to two-space JSON`}),`
`,(0,t.jsx)(n.li,{children:`Leaves changes visible in git so you can review or revert them`}),`
`,(0,t.jsx)(n.li,{children:`Creates a temporary backup before security auto-fix writes package.json`}),`
`]}),`
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
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` The override might still be needed by a transitive dependency. Run with debug mode to see why:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --debug
`})}),`
`,(0,t.jsx)(n.p,{children:`Look for output showing which packages require the override.`}),`
`,(0,t.jsx)(n.h3,{id:`packagejson-formatting-changes`,children:`Package.json Formatting Changes`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Problem:`}),` Pastoralist changes the formatting of my package.json.`]}),`
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
`,(0,t.jsx)(n.h3,{id:`performance-issues`,children:`Performance Issues`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Problem:`}),` Pastoralist takes a long time to run.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` For large monorepos:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`Run on specific packages instead of all at once`}),`
`,(0,t.jsxs)(n.li,{children:[`Use `,(0,t.jsx)(n.code,{children:`--ignore`}),` to skip unnecessary directories`]}),`
`,(0,t.jsx)(n.li,{children:`Run packages in parallel:`}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Instead of
pastoralist --depPaths "**/*package.json"

# Try
find . -name "package.json" -not -path "*/node_modules/*" | \\
  xargs -P 4 -I {} npx pastoralist --path {}
`})}),`
`,(0,t.jsx)(n.h3,{id:`monorepo-override-conflicts`,children:`Monorepo Override Conflicts`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Problem:`}),` Different packages in my monorepo need different versions.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` Use package-specific overrides:`]}),`
`,(0,t.jsx)(n.p,{children:`Root package.json can hold shared security patches:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "minimist": "1.2.8"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Packages can hold their own compatibility requirements:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "react": "17.0.2"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`ci-failures`,children:`CI Failures`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Problem:`}),` CI fails saying package.json was modified.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` Run pastoralist locally and commit the changes:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist
git add package.json
git commit -m "Update override appendix"
`})}),`
`,(0,t.jsx)(n.p,{children:`Then add to your CI check:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- run: npx pastoralist
- run: git diff --exit-code package.json
`})}),`
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
`,(0,t.jsx)(n.p,{children:`Pastoralist can't locate your package.json. Solutions:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Run from project root`}),`
`,(0,t.jsxs)(n.li,{children:[`Use `,(0,t.jsx)(n.code,{children:`--path`}),` to specify location`]}),`
`,(0,t.jsx)(n.li,{children:`Check file permissions`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`invalid-packagejson`,children:`"Invalid package.json"`}),`
`,(0,t.jsx)(n.p,{children:`Your package.json has syntax errors. Validate with:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx json package.json
`})}),`
`,(0,t.jsx)(n.h3,{id:`no-overrides-found`,children:`"No overrides found"`}),`
`,(0,t.jsx)(n.p,{children:`This is normal if you don't have any overrides. Pastoralist will:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Clean up any existing appendix`}),`
`,(0,t.jsx)(n.li,{children:`Exit successfully`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`best-practices`,children:`Best Practices`}),`
`,(0,t.jsx)(n.h3,{id:`1-regular-updates`,children:`1. Regular Updates`}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist regularly:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`2-document-override-reasons`,children:`2. Document Override Reasons`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:`package.json`}),` does not support comments. Every appendix entry has a `,(0,t.jsx)(n.code,{children:`ledger`}),`;
add a `,(0,t.jsx)(n.code,{children:`reason`}),` to it (or provide manual reasons when you generate the appendix):`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "CVE-2021-12345 fix",
          "source": "manual"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`3-monitor-patch-files`,children:`3. Monitor Patch Files`}),`
`,(0,t.jsx)(n.p,{children:`When you see this warning:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:`🐑 Found potentially unused patch files:
  - patches/old-package+1.0.0.patch
`})}),`
`,(0,t.jsx)(n.p,{children:`Review and remove unused patches to keep your repo clean.`}),`
`,(0,t.jsx)(n.h2,{id:`getting-help`,children:`Getting Help`}),`
`,(0,t.jsx)(n.h3,{id:`resources`,children:`Resources`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`GitHub Issues`}),` - Report bugs & ask questions`]}),`
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
`,(0,t.jsx)(n.li,{children:`Package manager (npm/yarn/pnpm)`}),`
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
`,(0,t.jsx)(n.h2,{id:`advanced-debugging`,children:`Advanced Debugging`}),`
`,(0,t.jsx)(n.h3,{id:`trace-dependency-paths`,children:`Trace Dependency Paths`}),`
`,(0,t.jsx)(n.p,{children:`To understand why an override is needed:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`// debug-override.js
import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, debug: true, path });
}

// Check the debug output for dependency paths
`})}),`
`,(0,t.jsx)(n.h3,{id:`analyze-appendix`,children:`Analyze Appendix`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`// analyze-appendix.js
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const appendix = pkg.pastoralist?.appendix || {};

console.log("Override Report:");
Object.entries(appendix).forEach(([override, info]) => {
  console.log(\`\\n\${override}:\`);
  console.log("  Dependents:", Object.keys(info.dependents || {}));
  console.log("  Patches:", info.patches || "none");
});
`})})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};