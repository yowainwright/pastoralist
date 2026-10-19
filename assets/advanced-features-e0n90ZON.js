import{a as e}from"./motion-kOo5Kq9S.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`nested-overrides-transitive-dependencies`,children:`Nested Overrides (Transitive Dependencies)`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist supports npm's nested override syntax for transitive dependencies.`}),`
`,(0,t.jsx)(n.h3,{id:`how-it-works`,children:`How It Works`}),`
`,(0,t.jsx)(n.p,{children:`When you need to override a transitive dependency, you can use nested overrides:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
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
`,(0,t.jsxs)(n.p,{children:[`This tells npm to use `,(0,t.jsx)(n.code,{children:`pg-types@^4.0.1`}),` whenever `,(0,t.jsx)(n.code,{children:`pg`}),` requests `,(0,t.jsx)(n.code,{children:`pg-types`}),`,
regardless of the version range declared by `,(0,t.jsx)(n.code,{children:`pg`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`multiple-nested-overrides`,children:`Multiple Nested Overrides`}),`
`,(0,t.jsx)(n.p,{children:`You can override multiple transitive dependencies:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
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
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" /appendix/`,children:`{
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
`,(0,t.jsxs)(n.p,{children:[`Keep npm overrides in the root `,(0,t.jsx)(n.code,{children:`package.json`}),`. Nested overrides scope a
transitive dependency to a parent; workspace manifests supply dependency
context through `,(0,t.jsx)(n.code,{children:`depPaths`}),`. npm ignores overrides declared inside workspace
packages.`]}),`
`,(0,t.jsx)(n.h2,{id:`patch-support`,children:`Patch Support`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist detects and tracks patches created by tools such as `,(0,t.jsx)(n.code,{children:`patch-package`}),`.`]}),`
`,(0,t.jsx)(n.h3,{id:`how-it-works-1`,children:`How It Works`}),`
`,(0,t.jsxs)(n.p,{children:[`When you have patches in your `,(0,t.jsx)(n.code,{children:`patches/`}),` directory:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:`patches/
├── lodash+4.17.21.patch
├── express+4.18.0.patch
└── react+18.2.0.patch
`})}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist tracks them in the appendix:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" /appendix/`,children:`{
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
`,(0,t.jsx)(n.p,{children:`Pastoralist reports potentially unused patch paths. Review those files when
dependencies change; Pastoralist does not delete patches.`}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/patches?title=Pastoralist%20Patches&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,t.jsx)(n.h2,{id:`peerdependencies-support`,children:`PeerDependencies Support`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist considers `,(0,t.jsx)(n.code,{children:`peerDependencies`}),` when tracking override usage.`]}),`
`,(0,t.jsx)(n.h3,{id:`example`,children:`Example`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json"`,children:`{
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"
  },
  "overrides": {
    "react": "18.2.0"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`The appendix will reflect peer dependency requirements:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" /appendix/`,children:`{
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
`,(0,t.jsxs)(n.p,{children:[`In this fixture, `,(0,t.jsx)(n.code,{children:`express`}),` has already been removed and no package needs
`,(0,t.jsx)(n.code,{children:`qs`}),`. Cleanup removes the override and its tracking entry:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-diff`,children:`--- package.json
+++ package.json
@@ -1,18 +1,4 @@
 {
   "name": "shepherd-cli",
-  "overrides": {
-    "qs": "6.11.2"
-  },
-  "pastoralist": {
-    "appendix": {
-      "qs@6.11.2": {
-        "dependents": {
-          "shepherd-cli": "qs (required by express)"
-        },
-        "ledger": {
-          "addedDate": "2026-10-16"
-        }
-      }
-    }
-  }
+  "overrides": {}
 }
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Preview removal with `,(0,t.jsx)(n.code,{children:`pastoralist --remove-unused --dry-run`}),`, then apply it
with `,(0,t.jsx)(n.code,{children:`pastoralist --remove-unused`}),`. Active `,(0,t.jsx)(n.code,{children:`ledger.keep`}),` constraints protect
entries from removal.`]}),`
`,(0,t.jsx)(n.h3,{id:`unused-override-detection`,children:`Unused Override Detection`}),`
`,(0,t.jsxs)(n.p,{children:[`When an override exists but no package in your project depends on it,
Pastoralist labels it as `,(0,t.jsx)(n.code,{children:`(unused override)`}),` in the appendix:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" /appendix/`,children:`{
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
`,(0,t.jsxs)(n.p,{children:[`Preview removal with `,(0,t.jsx)(n.code,{children:`--remove-unused --dry-run`}),`, then apply it:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`pastoralist --remove-unused
`})}),`
`,(0,t.jsxs)(n.p,{children:[`This removes both the override from `,(0,t.jsx)(n.code,{children:`overrides`}),` and its entry from the appendix.`]}),`
`,(0,t.jsx)(n.h3,{id:`protecting-overrides-from-removal`,children:`Protecting Overrides from Removal`}),`
`,(0,t.jsxs)(n.p,{children:[`Set `,(0,t.jsx)(n.code,{children:`keep: true`}),` on a ledger entry to prevent `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` from removing
it:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`{5}`,children:`{
  "lodash@4.17.21": {
    "ledger": {
      "addedDate": "2026-05-30T00:00:00.000Z",
      "keep": true
    }
  }
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`To keep an override until a date or version is reached, use a `,(0,t.jsx)(n.code,{children:`KeepConstraint`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`{5}`,children:`{
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
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" /appendix/`,children:`{
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
`,(0,t.jsx)(n.h2,{id:`version-ranges-and-cleanup`,children:`Version Ranges and Cleanup`}),`
`,(0,t.jsx)(n.p,{children:`A version range that includes an override does not prove the override is
redundant. Pastoralist checks dependency usage before removal and skips
entries when usage cannot be established. Use ledger reasons and keep
constraints for decisions that require human review.`}),`
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
`,(0,t.jsxs)(n.p,{children:[`Use ledger `,(0,t.jsx)(n.code,{children:`reason`}),` to explain why an override is needed and `,(0,t.jsx)(n.code,{children:`keep`}),` to control
when it can be removed.`]}),`
`,(0,t.jsx)(n.h2,{id:`multi-format-support`,children:`Multi-Format Support`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist reads the override field your package manager already uses:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`npm and Bun`}),`: `,(0,t.jsx)(n.code,{children:`overrides`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`pnpm`}),`: `,(0,t.jsx)(n.code,{children:`pnpm.overrides`}),`, or `,(0,t.jsx)(n.code,{children:`pnpm-workspace.yaml`}),` for pnpm 11+`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Yarn`}),`: `,(0,t.jsx)(n.code,{children:`resolutions`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`When it writes changes, it preserves the existing override field when one is
present. If a security fix creates the first override field in a project,
Pastoralist chooses the field that matches the detected package manager.`}),`
`,(0,t.jsx)(n.h3,{id:`format-example`,children:`Format Example`}),`
`,(0,t.jsx)(n.p,{children:`Yarn resolutions:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" {3}`,children:`{
  "resolutions": {
    "package-a": "1.0.0",
    "**/package-b": "2.0.0"
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`The equivalent npm or Bun override shape:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,"data-meta":`title="package.json" {3}`,children:`{
  "overrides": {
    "package-a": "1.0.0",
    "package-b": "2.0.0"
  }
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`debug-mode`,children:`Debug Mode`}),`
`,(0,t.jsxs)(n.p,{children:[`Use `,(0,t.jsx)(n.code,{children:`pastoralist --debug`}),` for dependency paths, config discovery, and removal
diagnostics.`]}),`
`,(0,t.jsx)(n.h2,{id:`integration-with-other-tools`,children:`Integration with Other Tools`}),`
`,(0,t.jsx)(n.h3,{id:`patch-package`,children:`patch-package`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist tracks which overrides have patches from `,(0,t.jsx)(n.code,{children:`patch-package`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Create a patch from local changes to lodash
npx patch-package lodash

# Apply existing patches
npx patch-package

# Run Pastoralist to update tracking
npx pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`npm-check-updates`,children:`npm-check-updates`}),`
`,(0,t.jsxs)(n.p,{children:[`Use with `,(0,t.jsx)(n.code,{children:`npm-check-updates`}),` to manage both regular updates and overrides:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Update dependencies
npx npm-check-updates -u
npm install

# Update override tracking
npx pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`dependency-update-bots`,children:`Dependency Update Bots`}),`
`,(0,t.jsxs)(n.p,{children:[`Run Pastoralist after your update bot installs dependencies to keep the
appendix current. Use the `,(0,t.jsx)(n.a,{href:`/docs/github-action`,children:`GitHub Action`}),` for scheduled
maintenance PRs.`]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}var i=[{depth:2,slug:`nested-overrides-transitive-dependencies`,text:`Nested Overrides (Transitive Dependencies)`},{depth:3,slug:`how-it-works`,text:`How It Works`},{depth:3,slug:`multiple-nested-overrides`,text:`Multiple Nested Overrides`},{depth:3,slug:`tracking-in-appendix`,text:`Tracking in Appendix`},{depth:3,slug:`workspace-support`,text:`Workspace Support`},{depth:2,slug:`patch-support`,text:`Patch Support`},{depth:3,slug:`how-it-works-1`,text:`How It Works`},{depth:3,slug:`unused-patch-detection`,text:`Unused Patch Detection`},{depth:2,slug:`peerdependencies-support`,text:`PeerDependencies Support`},{depth:3,slug:`example`,text:`Example`},{depth:2,slug:`smart-cleanup`,text:`Smart Cleanup`},{depth:3,slug:`removal-with---remove-unused`,text:"Removal with `--remove-unused`"},{depth:3,slug:`unused-override-detection`,text:`Unused Override Detection`},{depth:3,slug:`protecting-overrides-from-removal`,text:`Protecting Overrides from Removal`},{depth:3,slug:`transitive-dependency-tracking`,text:`Transitive Dependency Tracking`},{depth:2,slug:`version-ranges-and-cleanup`,text:`Version Ranges and Cleanup`},{depth:2,slug:`appendix-cleanup`,text:`Appendix Cleanup`},{depth:3,slug:`example-scenario`,text:`Example Scenario`},{depth:2,slug:`multi-format-support`,text:`Multi-Format Support`},{depth:3,slug:`format-example`,text:`Format Example`},{depth:2,slug:`debug-mode`,text:`Debug Mode`},{depth:2,slug:`integration-with-other-tools`,text:`Integration with Other Tools`},{depth:3,slug:`patch-package`,text:`patch-package`},{depth:3,slug:`npm-check-updates`,text:`npm-check-updates`},{depth:3,slug:`dependency-update-bots`,text:`Dependency Update Bots`}];export{r as default,i as headings};