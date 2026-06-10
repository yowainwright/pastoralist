import{n as e}from"./motion-B8hZlCEG.js";var t=e();function n(e){let n={code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`Pastoralist works seamlessly with workspace and monorepo setups. This guide covers how to effectively use pastoralist across multiple packages.`}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/monorepo?title=Pastoralist%20Monorepo&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,t.jsx)(n.h2,{id:`how-pastoralist-works-in-workspaces`,children:`How Pastoralist Works in Workspaces`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist updates one target `,(0,t.jsx)(n.code,{children:`package.json`}),`, usually the workspace root. When
`,(0,t.jsx)(n.code,{children:`depPaths`}),` is configured, it also reads workspace package manifests so the root
appendix can show which packages still need each override.`]}),`
`,(0,t.jsxs)(n.p,{children:[`You can also run it against an individual workspace package with `,(0,t.jsx)(n.code,{children:`--path`}),` when
that package owns its own override field.`]}),`
`,(0,t.jsx)(n.h2,{id:`configuration-methods`,children:`Configuration Methods`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist provides multiple ways to configure workspace scanning in monorepos:`}),`
`,(0,t.jsx)(n.h3,{id:`method-1-deppaths-in-packagejson-recommended`,children:`Method 1: depPaths in package.json (Recommended)`}),`
`,(0,t.jsxs)(n.p,{children:[`Configure dependency paths directly in your `,(0,t.jsx)(n.code,{children:`package.json`}),` for automatic workspace tracking:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "name": "my-monorepo",
  "workspaces": ["packages/*", "apps/*"],
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsxs)(n.strong,{children:[`Using `,(0,t.jsx)(n.code,{children:`"workspace"`}),` string`]}),` - Pastoralist automatically uses all packages defined in your `,(0,t.jsx)(n.code,{children:`workspaces`}),` field:`]}),`
`,(0,t.jsx)(n.p,{children:`Benefits:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Single source of truth in package.json`}),`
`,(0,t.jsx)(n.li,{children:`No CLI flags needed`}),`
`,(0,t.jsx)(n.li,{children:`Works automatically with postinstall scripts`}),`
`,(0,t.jsx)(n.li,{children:`Appendix only appears in root (workspace packages stay clean)`}),`
`,(0,t.jsx)(n.li,{children:`Self-documenting configuration`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Using array of paths`}),` - Specify custom paths to scan:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "pastoralist": {
    "depPaths": ["packages/app-a/package.json", "packages/app-b/package.json"]
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`After running `,(0,t.jsx)(n.code,{children:`pastoralist`}),`, your root package.json will contain:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace",
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "app-a": "lodash@^4.17.0",
          "app-b": "lodash@^4.17.0",
          "package-c": "lodash@^4.17.0"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`The workspace packages (`,(0,t.jsx)(n.code,{children:`packages/*/package.json`}),` and `,(0,t.jsx)(n.code,{children:`apps/*/package.json`}),`) remain clean without any pastoralist appendix.`]}),`
`,(0,t.jsx)(n.h3,{id:`method-2-cli-deppaths-flag`,children:`Method 2: CLI depPaths Flag`}),`
`,(0,t.jsx)(n.p,{children:`Specify paths at runtime:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Scan specific paths
pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"

# CLI flags override package.json configuration
pastoralist --depPaths "packages/app-a/package.json"
`})}),`
`,(0,t.jsx)(n.h3,{id:`method-3-guided-configuration`,children:`Method 3: Guided Configuration`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist offers guided configuration for monorepo setups:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Initialize with guided setup
pastoralist --init
`})}),`
`,(0,t.jsx)(n.p,{children:`The initializer can:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Detect `,(0,t.jsx)(n.code,{children:`workspaces`}),` entries from `,(0,t.jsx)(n.code,{children:`package.json`})]}),`
`,(0,t.jsxs)(n.li,{children:[`Let you choose `,(0,t.jsx)(n.code,{children:`depPaths: "workspace"`}),` or custom package globs`]}),`
`,(0,t.jsxs)(n.li,{children:[`Save configuration to `,(0,t.jsx)(n.code,{children:`package.json`}),` or a supported config file`]}),`
`,(0,t.jsx)(n.li,{children:`Optionally configure security scanning`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`basic-usage`,children:`Basic Usage`}),`
`,(0,t.jsx)(n.h3,{id:`running-on-root-package`,children:`Running on Root Package`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Run on the root package.json
pastoralist
`})}),`
`,(0,t.jsxs)(n.p,{children:[`This will manage overrides in your root `,(0,t.jsx)(n.code,{children:`package.json`}),`, which affect all workspaces.`]}),`
`,(0,t.jsx)(n.h3,{id:`running-on-workspace-packages`,children:`Running on Workspace Packages`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Run on a specific workspace package
pastoralist --path packages/app-a/package.json

# Or navigate to the package
cd packages/app-a
pastoralist
`})}),`
`,(0,t.jsx)(n.h2,{id:`common-patterns`,children:`Common Patterns`}),`
`,(0,t.jsx)(n.h3,{id:`pattern-1-root-level-overrides`,children:`Pattern 1: Root-Level Overrides`}),`
`,(0,t.jsx)(n.p,{children:`Most monorepos use root-level overrides that apply to all workspaces:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "name": "my-monorepo",
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21",
    "react": "18.2.0"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist at the root:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`pattern-2-package-specific-overrides`,children:`Pattern 2: Package-Specific Overrides`}),`
`,(0,t.jsx)(n.p,{children:`Some packages may need their own overrides:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "name": "legacy-app",
  "overrides": {
    "react": "17.0.2"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Run pastoralist for this package:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist --path packages/legacy-app/package.json
`})}),`
`,(0,t.jsx)(n.h3,{id:`pattern-3-automated-workspace-management`,children:`Pattern 3: Automated Workspace Management`}),`
`,(0,t.jsx)(n.p,{children:`Create a script to run pastoralist across all workspaces:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "scripts": {
    "pastoralist:all": "npm run pastoralist:root && npm run pastoralist:workspaces",
    "pastoralist:root": "pastoralist",
    "pastoralist:workspaces": "lerna run pastoralist --parallel"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Or with a custom script:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`#!/bin/bash
# scripts/update-overrides.sh

echo "Updating root overrides..."
pastoralist

echo "Updating workspace overrides..."
for pkg in packages/*/package.json; do
  if grep -q "overrides" "$pkg"; then
    echo "Updating $pkg..."
    pastoralist --path "$pkg"
  fi
done
`})}),`
`,(0,t.jsx)(n.h2,{id:`integration-strategies`,children:`Integration Strategies`}),`
`,(0,t.jsx)(n.h3,{id:`strategy-1-centralized-management-with-deppaths-recommended`,children:`Strategy 1: Centralized Management with depPaths (Recommended)`}),`
`,(0,t.jsxs)(n.p,{children:[`Keep all overrides in the root `,(0,t.jsx)(n.code,{children:`package.json`}),` and use `,(0,t.jsx)(n.code,{children:`depPaths`}),` configuration:`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Pros:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Single source of truth`}),`
`,(0,t.jsx)(n.li,{children:`Easier to maintain`}),`
`,(0,t.jsx)(n.li,{children:`Consistent versions across packages`}),`
`,(0,t.jsx)(n.li,{children:`Automatic workspace tracking`}),`
`,(0,t.jsx)(n.li,{children:`Clean workspace package.json files`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Setup:`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "workspaces": ["packages/*", "apps/*"],
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`strategy-2-distributed-management`,children:`Strategy 2: Distributed Management`}),`
`,(0,t.jsx)(n.p,{children:`Allow packages to manage their own overrides:`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Pros:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Package autonomy`}),`
`,(0,t.jsx)(n.li,{children:`Specific version requirements`}),`
`,(0,t.jsx)(n.li,{children:`Gradual migrations`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Setup:`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`strategy-3-hybrid-approach`,children:`Strategy 3: Hybrid Approach`}),`
`,(0,t.jsx)(n.p,{children:`Combine root overrides with package-specific ones:`}),`
`,(0,t.jsx)(n.p,{children:`Root overrides can hold shared security patches:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "minimist": "1.2.8"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Package overrides can hold feature-specific constraints:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "react": "17.0.2"
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`real-world-examples`,children:`Real-World Examples`}),`
`,(0,t.jsx)(n.h3,{id:`example-1-lerna-monorepo`,children:`Example 1: Lerna Monorepo`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "name": "my-lerna-monorepo",
  "scripts": {
    "postinstall": "lerna bootstrap && pastoralist",
    "update-overrides": "pastoralist && lerna run pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`example-2-npm-workspaces`,children:`Example 2: npm Workspaces`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "name": "my-npm-workspace",
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "postinstall": "pastoralist",
    "check-overrides": "pastoralist --debug"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`example-3-pnpm-workspace`,children:`Example 3: pnpm Workspace`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist",
    "update-all": "pnpm -r exec pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`example-4-yarn-workspaces`,children:`Example 4: Yarn Workspaces`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "private": true,
  "workspaces": {
    "packages": ["packages/*"]
  },
  "scripts": {
    "postinstall": "pastoralist",
    "workspaces:update": "yarn workspaces foreach run pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`best-practices`,children:`Best Practices`}),`
`,(0,t.jsx)(n.h3,{id:`1-choose-a-consistent-strategy`,children:`1. Choose a Consistent Strategy`}),`
`,(0,t.jsx)(n.p,{children:`Decide whether to:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Manage all overrides at the root (recommended for most cases)`}),`
`,(0,t.jsx)(n.li,{children:`Allow package-specific overrides (for complex requirements)`}),`
`,(0,t.jsx)(n.li,{children:`Use a hybrid approach (for gradual migrations)`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`2-automate-with-postinstall`,children:`2. Automate with postinstall`}),`
`,(0,t.jsx)(n.p,{children:`Always add pastoralist to postinstall scripts:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`3-document-your-strategy`,children:`3. Document Your Strategy`}),`
`,(0,t.jsxs)(n.p,{children:[`Create a `,(0,t.jsx)(n.code,{children:`DEPENDENCIES.md`}),` file:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-markdown`,children:`# Dependency Management

We use pastoralist to manage overrides. Strategy:

1. Security patches: Root package.json
2. Feature overrides: Package-specific
3. Run \`npm run update-overrides\` after changes
`})}),`
`,(0,t.jsx)(n.h3,{id:`4-cicd-integration`,children:`4. CI/CD Integration`}),`
`,(0,t.jsx)(n.p,{children:`Ensure overrides are valid in CI:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- name: Validate overrides
  run: |
    npm run pastoralist:all
    git diff --exit-code
`})}),`
`,(0,t.jsx)(n.h2,{id:`troubleshooting`,children:`Troubleshooting`}),`
`,(0,t.jsx)(n.h3,{id:`issue-overrides-not-applied`,children:`Issue: Overrides Not Applied`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Symptom:`}),` Workspace packages don't respect root overrides`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` Ensure you're using a package manager that supports workspace overrides:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`npm 8.3+ ✅`}),`
`,(0,t.jsx)(n.li,{children:`yarn 1.x (use resolutions) ✅`}),`
`,(0,t.jsx)(n.li,{children:`pnpm (use pnpm.overrides) ✅`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`issue-duplicate-appendix-entries`,children:`Issue: Duplicate Appendix Entries`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Symptom:`}),` Same override tracked in multiple package.json files`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` This is normal! Each package.json maintains its own appendix for clarity.`]}),`
`,(0,t.jsx)(n.h3,{id:`issue-performance-in-large-monorepos`,children:`Issue: Performance in Large Monorepos`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Symptom:`}),` Pastoralist takes long to run across many packages`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` Run in parallel:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Using GNU parallel
find . -name "package.json" -path "*/node_modules" -prune -o -print | \\
  parallel "pastoralist --path {}"
`})}),`
`,(0,t.jsx)(n.h2,{id:`migration-guide`,children:`Migration Guide`}),`
`,(0,t.jsx)(n.h3,{id:`moving-to-centralized-overrides`,children:`Moving to Centralized Overrides`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`Collect all overrides:`}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`find . -name "package.json" -not -path "*/node_modules/*" \\
  -exec jq '.overrides // {}' {} \\; | jq -s 'add'
`})}),`
`,(0,t.jsxs)(n.ol,{start:`2`,children:[`
`,(0,t.jsx)(n.li,{children:`Add to root package.json`}),`
`,(0,t.jsx)(n.li,{children:`Remove from individual packages`}),`
`,(0,t.jsx)(n.li,{children:`Run pastoralist at root`}),`
`]}),`
`,(0,t.jsx)(n.h3,{id:`splitting-overrides`,children:`Splitting Overrides`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`Identify package-specific needs`}),`
`,(0,t.jsx)(n.li,{children:`Move relevant overrides to packages`}),`
`,(0,t.jsx)(n.li,{children:`Run pastoralist on each package`}),`
`,(0,t.jsx)(n.li,{children:`Update CI/CD scripts`}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`advanced-patterns`,children:`Advanced Patterns`}),`
`,(0,t.jsx)(n.h3,{id:`dynamic-override-detection`,children:`Dynamic Override Detection`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`// scripts/check-overrides.js
const { execSync } = require("child_process");
const { readdirSync } = require("fs");

const packages = readdirSync("./packages");
packages.forEach((pkg) => {
  try {
    execSync(\`pastoralist --path packages/\${pkg}/package.json\`);
    console.log(\`✅ \${pkg}: overrides updated\`);
  } catch (error) {
    console.log(\`❌ \${pkg}: no overrides or error\`);
  }
});
`})}),`
`,(0,t.jsx)(n.h3,{id:`override-inheritance`,children:`Override Inheritance`}),`
`,(0,t.jsx)(n.p,{children:`Create a base configuration:`}),`
`,(0,t.jsxs)(n.p,{children:[`For example, `,(0,t.jsx)(n.code,{children:`packages/base-config/overrides.json`}),` can define shared override
versions:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "lodash": "4.17.21",
  "minimist": "1.2.8"
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Apply to packages:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`// scripts/apply-base-overrides.js
const base = require("./packages/base-config/overrides.json");
// Apply base overrides to each package
`})}),`
`,(0,t.jsx)(n.h2,{id:`next-steps`,children:`Next Steps`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Set up pastoralist in your workspace`}),`
`,(0,t.jsx)(n.li,{children:`Choose a management strategy`}),`
`,(0,t.jsx)(n.li,{children:`Add automation scripts`}),`
`,(0,t.jsx)(n.li,{children:`Document your approach for the team`}),`
`]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};