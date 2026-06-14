import{n as e}from"./motion-B8hZlCEG.js";var t=e();function n(e){let n={code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`nested-overrides-transitive-dependencies`,children:`Nested Overrides (Transitive Dependencies)`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist supports npm's nested override syntax for overriding transitive dependencies (dependencies of dependencies).`}),`
`,(0,t.jsx)(n.h3,{id:`how-it-works`,children:`How It Works`}),`
`,(0,t.jsx)(n.p,{children:`When you need to override a transitive dependency, you can use nested overrides:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "dependencies": {
    "pg": "^8.13.1"
  },
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`This tells npm to use `,(0,t.jsx)(n.code,{children:`pg-types@^4.0.1`}),` whenever it's required by the `,(0,t.jsx)(n.code,{children:`pg`}),` package, regardless of what version `,(0,t.jsx)(n.code,{children:`pg`}),` actually specifies.`]}),`
`,(0,t.jsx)(n.h3,{id:`multiple-nested-overrides`,children:`Multiple Nested Overrides`}),`
`,(0,t.jsx)(n.p,{children:`You can override multiple transitive dependencies:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1",
      "pg-protocol": "^1.6.0"
    },
    "express": {
      "cookie": "0.5.0"
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`tracking-in-appendix`,children:`Tracking in Appendix`}),`
`,(0,t.jsxs)(n.p,{children:[`Nested overrides are tracked with a special notation in the appendix. Each entry
still gets a `,(0,t.jsx)(n.code,{children:`ledger`}),` recording when it was added:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "pastoralist": {
    "appendix": {
      "pg-types@^4.0.1": {
        "dependents": {
          "my-app": "pg@^8.13.1 (nested override)"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      },
      "cookie@0.5.0": {
        "dependents": {
          "my-app": "express@^4.18.0 (nested override)"
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
`,(0,t.jsx)(n.h3,{id:`workspace-support`,children:`Workspace Support`}),`
`,(0,t.jsxs)(n.p,{children:[`In monorepos, nested overrides in workspace packages are also tracked. For example,
`,(0,t.jsx)(n.code,{children:`packages/app/package.json`}),` might contain:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist will detect and manage these nested overrides across all workspace packages when using the `,(0,t.jsx)(n.code,{children:`--depPaths`}),` option.`]}),`
`,(0,t.jsx)(n.h2,{id:`patch-support`,children:`Patch Support`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist automatically detects and tracks patches created by tools like `,(0,t.jsx)(n.code,{children:`patch-package`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`how-it-works-1`,children:`How It Works`}),`
`,(0,t.jsxs)(n.p,{children:[`When you have patches in your `,(0,t.jsx)(n.code,{children:`patches/`}),` directory:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:`patches/
├── lodash+4.17.21.patch
├── express+4.18.0.patch
└── react+18.2.0.patch
`})}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist will track them in the appendix:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "my-app": "lodash@^4.17.0"
        },
        "patches": ["patches/lodash+4.17.21.patch"],
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`unused-patch-detection`,children:`Unused Patch Detection`}),`
`,(0,t.jsx)(n.p,{children:`When a dependency is removed, pastoralist alerts you:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:`🐑 Found 2 potentially unused patch files:
  - patches/old-package+1.0.0.patch
  - patches/removed-dep+2.0.0.patch
Consider removing these patches if the packages are no longer used.
`})}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/patches?title=Pastoralist%20Patches&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,t.jsx)(n.h2,{id:`peerdependencies-support`,children:`PeerDependencies Support`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist considers `,(0,t.jsx)(n.code,{children:`peerDependencies`}),` when tracking override usage.`]}),`
`,(0,t.jsx)(n.h3,{id:`example`,children:`Example`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"
  },
  "overrides": {
    "react": "18.2.0"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`The appendix will reflect peer dependency requirements:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "pastoralist": {
    "appendix": {
      "react@18.2.0": {
        "dependents": {
          "my-component": "react@^17.0.0 || ^18.0.0"
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
`,(0,t.jsx)(n.h2,{id:`smart-cleanup`,children:`Smart Cleanup`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist identifies overrides that are no longer needed and can remove them
when you explicitly opt in.`}),`
`,(0,t.jsxs)(n.h3,{id:`removal-with---remove-unused`,children:[`Removal with `,(0,t.jsx)(n.code,{children:`--remove-unused`})]}),`
`,(0,t.jsx)(n.p,{children:`When a dependency is updated and no longer needs an override:`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Before:`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "dependencies": {
    "lodash": "^4.17.0"
  },
  "overrides": {
    "lodash": "4.17.21"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsxs)(n.strong,{children:[`After updating lodash to 4.17.21 and running `,(0,t.jsx)(n.code,{children:`pastoralist --remove-unused`}),`:`]})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "overrides": {}
}
`})}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/cleanup?title=Pastoralist%20Cleanup&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,t.jsx)(n.h3,{id:`unused-override-detection`,children:`Unused Override Detection`}),`
`,(0,t.jsxs)(n.p,{children:[`When an override exists but no package in your project depends on it, Pastoralist labels it as `,(0,t.jsx)(n.code,{children:`(unused override)`}),` in the appendix:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "pastoralist": {
    "appendix": {
      "stale-pkg@1.0.0": {
        "dependents": {
          "root": "stale-pkg (unused override)"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist displays a notice when unused overrides are detected:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:`|  1 unused override detected. Run with --remove-unused to clean up.  |
`})}),`
`,(0,t.jsxs)(n.p,{children:[`To remove them, run with the `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` flag:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist --remove-unused
`})}),`
`,(0,t.jsxs)(n.p,{children:[`This removes both the override from `,(0,t.jsx)(n.code,{children:`overrides`}),` and its entry from the appendix.`]}),`
`,(0,t.jsx)(n.h3,{id:`protecting-overrides-from-removal`,children:`Protecting Overrides from Removal`}),`
`,(0,t.jsxs)(n.p,{children:[`Set `,(0,t.jsx)(n.code,{children:`keep: true`}),` on a ledger entry to prevent `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` from ever removing it:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "lodash@4.17.21": {
    "ledger": {
      "addedDate": "2026-05-30T00:00:00.000Z",
      "keep": true
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`For time- or version-bounded protection, use a `,(0,t.jsx)(n.code,{children:`KeepConstraint`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "lodash@4.17.21": {
    "ledger": {
      "addedDate": "2026-05-30T00:00:00.000Z",
      "keep": {
        "reason": "Waiting for upstream patch",
        "untilVersion": "4.18.0",
        "until": "2027-06-01"
      }
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Once the condition is met, `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` can treat the override as removable
again.`]}),`
`,(0,t.jsx)(n.h3,{id:`transitive-dependency-tracking`,children:`Transitive Dependency Tracking`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist tracks overrides needed by transitive dependencies:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "pastoralist": {
    "appendix": {
      "minimist@1.2.8": {
        "dependents": {
          "mkdirp": "minimist@^1.2.6",
          "optimist": "minimist@~1.2.0"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`fuzzy-version-matching`,children:`Fuzzy Version Matching`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist uses version-range matching to determine if overrides are needed.`}),`
`,(0,t.jsx)(n.h3,{id:`how-it-works-2`,children:`How It Works`}),`
`,(0,t.jsx)(n.p,{children:`Given these dependencies:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "dependencies": {
    "express": "^4.18.0"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`And this override:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "express": "4.18.2"
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist understands that `,(0,t.jsx)(n.code,{children:`^4.18.0`}),` could resolve to `,(0,t.jsx)(n.code,{children:`4.18.2`}),` naturally, so the override might not be necessary unless it's fixing a specific issue.`]}),`
`,(0,t.jsx)(n.h2,{id:`appendix-cleanup`,children:`Appendix Cleanup`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist keeps appendix entries while an override is still tracked. When you
run with `,(0,t.jsx)(n.code,{children:`--remove-unused`}),`, it removes both the override and the matching
appendix entry.`]}),`
`,(0,t.jsx)(n.h3,{id:`example-scenario`,children:`Example Scenario`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Initial state`}),`: Override with appendix`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Dependency removed`}),`: Pastoralist reports the override as unused`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Cleanup run`}),`: `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` removes the override and appendix entry`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Use ledger `,(0,t.jsx)(n.code,{children:`reason`}),` and `,(0,t.jsx)(n.code,{children:`keep`}),` fields for override decisions that should stay
reviewable until a specific cleanup condition is met.`]}),`
`,(0,t.jsx)(n.h2,{id:`multi-format-support`,children:`Multi-Format Support`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist reads the override field your package manager already uses:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`npm and Bun`}),`: `,(0,t.jsx)(n.code,{children:`overrides`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`pnpm`}),`: `,(0,t.jsx)(n.code,{children:`pnpm.overrides`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Yarn`}),`: `,(0,t.jsx)(n.code,{children:`resolutions`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`When it writes changes, it preserves the existing override field when one is
present. If a security fix creates the first override field in a project,
Pastoralist chooses the field that matches the detected package manager.`}),`
`,(0,t.jsx)(n.h3,{id:`format-example`,children:`Format Example`}),`
`,(0,t.jsx)(n.p,{children:`Yarn resolutions:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "resolutions": {
    "package-a": "1.0.0",
    "**/package-b": "2.0.0"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`The equivalent npm or Bun override shape:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "package-a": "1.0.0",
    "package-b": "2.0.0"
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`debug-mode-insights`,children:`Debug Mode Insights`}),`
`,(0,t.jsxs)(n.p,{children:[`Debug mode (`,(0,t.jsx)(n.code,{children:`--debug`}),`) provides detailed information:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:`🐑 pastoralist checking herd...
[DEBUG] Reading package.json from /path/to/package.json
[DEBUG] Found 3 overrides
[DEBUG] Analyzing dependency tree...
[DEBUG] lodash@4.17.21 required by:
  - express@4.18.0 (wants lodash@^4.17.0)
  - custom-utils@1.0.0 (wants lodash@~4.17.0)
[DEBUG] Writing updated package.json
✅ pastoralist the herd is safe!
`})}),`
`,(0,t.jsx)(n.h2,{id:`integration-with-other-tools`,children:`Integration with Other Tools`}),`
`,(0,t.jsx)(n.h3,{id:`patch-package`,children:`patch-package`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist complements `,(0,t.jsx)(n.code,{children:`patch-package`}),` by tracking which overrides have associated patches:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Apply a patch
npx patch-package lodash

# Run pastoralist to update tracking
npx pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`npm-check-updates`,children:`npm-check-updates`}),`
`,(0,t.jsxs)(n.p,{children:[`Use with `,(0,t.jsx)(n.code,{children:`npm-check-updates`}),` to manage both regular updates and overrides:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Update dependencies
npx npm-check-updates -u

# Update override tracking
npx pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`renovatedependabot`,children:`Renovate/Dependabot`}),`
`,(0,t.jsx)(n.p,{children:`Configure automated tools to run pastoralist after updates:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "postUpgradeTasks": {
    "commands": ["npm install", "npx pastoralist"],
    "fileFilters": ["package.json"]
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`custom-workflows`,children:`Custom Workflows`}),`
`,(0,t.jsx)(n.h3,{id:`override-policies`,children:`Override Policies`}),`
`,(0,t.jsx)(n.p,{children:`Create policies for when overrides should be used:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`// scripts/check-override-policy.js
const pkg = require("./package.json");

const policies = {
  security: ["minimist", "lodash"], // Require review before keeping security overrides
  compatibility: ["react"], // Track compatibility overrides
  temporary: ["experimental-pkg"], // Review temporary overrides regularly
};

// Validate overrides match policies
Object.keys(pkg.overrides || {}).forEach((override) => {
  const category = Object.entries(policies).find(([_, pkgs]) => pkgs.includes(override))?.[0];

  if (!category) {
    console.warn(\`Override '\${override}' has no policy!\`);
  }
});
`})}),`
`,(0,t.jsx)(n.h3,{id:`appendix-analysis`,children:`Appendix Analysis`}),`
`,(0,t.jsx)(n.p,{children:`Extract insights from the appendix:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`const pkg = require("./package.json");
const appendix = pkg.pastoralist?.appendix || {};

// Find overrides with most dependents
const overrideImpact = Object.entries(appendix)
  .map(([override, info]) => ({
    override,
    dependentCount: Object.keys(info.dependents || {}).length,
  }))
  .sort((a, b) => b.dependentCount - a.dependentCount);

console.log("Highest impact overrides:", overrideImpact.slice(0, 5));
`})}),`
`,(0,t.jsx)(n.h2,{id:`best-practices`,children:`Best Practices`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Regular Updates`}),`: Run pastoralist on install, scheduled CI, or dependency-update PRs`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Review Patches`}),`: Check for upstream fixes when dependencies update`]}),`
`]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};