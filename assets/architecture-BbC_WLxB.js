import{n as e}from"./motion-CBP81KKf.js";var t=e();function n(e){let n={code:`code`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components},{Mermaid:r}=n;return r||i(`Mermaid`,!0),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`how-pastoralist-works`,children:`How Pastoralist Works`}),`
`,(0,t.jsx)(r,{chart:`flowchart LR
    Manifest["package.json overrides / resolutions"] --> Config["Load CLI and project config"]
    Config --> Security{"Security enabled?"}
    Security -->|Yes| Scan["Scan providers and collect alerts"]
    Scan --> Fixes["Merge fixable security overrides"]
    Security -->|No| Update["Run update()"]
    Fixes --> Update
    Update --> Patches["Detect patch-package files"]
    Patches --> Overrides["Resolve package manager overrides"]
    Overrides --> Workspaces{"Workspace paths?"}
    Workspaces -->|Yes| WorkspaceAppendix["Read workspace manifests"]
    Workspaces -->|No| Appendix["Build appendix"]
    WorkspaceAppendix --> Appendix
    Appendix --> Cleanup{"--remove-unused?"}
    Cleanup -->|Yes| Remove["Remove verified unused overrides"]
    Cleanup -->|No| Write["Write package.json or appendix target"]
    Remove --> Write
    Write --> Result["Report metrics and outputs"]`}),`
`,(0,t.jsxs)(n.p,{children:[`Pastoralist reads the root `,(0,t.jsx)(n.code,{children:`package.json`}),`, maps each override or resolution into
a `,(0,t.jsx)(n.code,{children:`pastoralist.appendix`}),` entry, and records when the entry was created in its
`,(0,t.jsx)(n.code,{children:`ledger`}),`. Patches created by tools such as `,(0,t.jsx)(n.code,{children:`patch-package`}),` are detected and
tracked on the same entry.`]}),`
`,(0,t.jsxs)(n.p,{children:[`If an override or resolution is no longer needed, Pastoralist marks the appendix
entry as unused and prints a cleanup notice. The override and its appendix entry
are removed only when you run with `,(0,t.jsx)(n.code,{children:`--remove-unused`}),`. Patch files are reported
as potentially unused; Pastoralist does not delete patch files for you.`]}),`
`,(0,t.jsx)(n.p,{children:`You manage the override or resolution field; Pastoralist manages the appendix.`}),`
`,(0,t.jsx)(n.h3,{id:`workspace-support`,children:`Workspace Support`}),`
`,(0,t.jsx)(n.p,{children:`In workspace/monorepo setups, Pastoralist:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Reads the root `,(0,t.jsx)(n.code,{children:`package.json`}),` or project manifest file`]}),`
`,(0,t.jsxs)(n.li,{children:[`Maps overrides, resolutions, and patches to the `,(0,t.jsx)(n.code,{children:`pastoralist.appendix`}),`, with a
`,(0,t.jsx)(n.code,{children:`ledger`}),` entry recording when each override was added`]}),`
`,(0,t.jsxs)(n.li,{children:[`Reads workspace package manifests when `,(0,t.jsx)(n.code,{children:`depPaths`}),` or `,(0,t.jsx)(n.code,{children:`workspaces`}),` are configured`]}),`
`,(0,t.jsxs)(n.li,{children:[`Writes the consolidated appendix to the target `,(0,t.jsx)(n.code,{children:`package.json`}),`, usually the root`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`simple-project-architecture`,children:`Simple Project Architecture`}),`
`,(0,t.jsx)(n.p,{children:`Standard single-package project with overrides:`}),`
`,(0,t.jsx)(r,{chart:`flowchart TD
    PkgJson[package.json] --> Pastoralist[Pastoralist]
    NodeModules[node_modules] --> Pastoralist
    Pastoralist --> UpdatedPkg[Updated package.json with appendix]

    style PkgJson fill:#e3f2fd
    style Pastoralist fill:#f3e5f5
    style UpdatedPkg fill:#e8f5e9`}),`
`,(0,t.jsx)(n.h2,{id:`monorepo-architecture`,children:`Monorepo Architecture`}),`
`,(0,t.jsx)(n.p,{children:`Complex workspace setup with shared overrides:`}),`
`,(0,t.jsx)(r,{chart:`flowchart TD
    Root[Root package.json] --> Pastoralist[Pastoralist]
    WS1[Workspace A] --> Pastoralist
    WS2[Workspace B] --> Pastoralist
    Pastoralist --> Output[Root package.json with consolidated appendix]

    style Root fill:#e3f2fd
    style Pastoralist fill:#f3e5f5
    style Output fill:#e8f5e9`}),`
`,(0,t.jsx)(n.h2,{id:`what-are-overrides-resolutions-and-patches`,children:`What Are Overrides, Resolutions, and Patches?`}),`
`,(0,t.jsx)(n.h3,{id:`overrides-npm`,children:`Overrides (npm)`}),`
`,(0,t.jsx)(n.p,{children:`Overrides replace a package version in your dependency tree with the version
you choose. This is npm's way to handle dependency conflicts:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "foo": "1.0.0",
    "bar": {
      "baz": "1.0.0"
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`resolutions-yarn`,children:`Resolutions (Yarn)`}),`
`,(0,t.jsx)(n.p,{children:`Resolutions serve the same purpose for Yarn users:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "resolutions": {
    "foo": "1.0.0",
    "**/bar/baz": "1.0.0"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`patches`,children:`Patches`}),`
`,(0,t.jsxs)(n.p,{children:[`Patches are local changes to `,(0,t.jsx)(n.code,{children:`node_modules`}),` packages, usually created with
tools such as `,(0,t.jsx)(n.code,{children:`patch-package`}),`. Pastoralist detects and tracks these patches.`]}),`
`,(0,t.jsx)(n.h2,{id:`object-anatomy`,children:`Object Anatomy`}),`
`,(0,t.jsxs)(n.p,{children:[`The Pastoralist object in `,(0,t.jsx)(n.code,{children:`package.json`}),` records what the tool manages:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "minimist": "1.2.8"
  },
  "pastoralist": {
    "appendix": {
      "minimist@1.2.8": {
        "dependents": {
          "my-app": "minimist@^1.2.6",
          "mkdirp": "minimist@^1.2.5"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Pin minimist while upstream packages adopt the patched version.",
          "source": "manual"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`appendix-properties`,children:`Appendix Properties`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`appendix key`}),`: The package and override version, such as `,(0,t.jsx)(n.code,{children:`minimist@1.2.8`})]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`dependents`}),`: Direct, workspace, or transitive packages that still require the override`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`patches`}),`: Patch files associated with the package, when any are detected`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`ledger`}),`: Always present on entries written by current Pastoralist. Holds
`,(0,t.jsx)(n.code,{children:`addedDate`}),`, optional `,(0,t.jsx)(n.code,{children:`reason`}),` and `,(0,t.jsx)(n.code,{children:`source`}),`, security metadata (`,(0,t.jsx)(n.code,{children:`securityProvider`}),`,
`,(0,t.jsx)(n.code,{children:`cves`}),`, `,(0,t.jsx)(n.code,{children:`cveDetails`}),`, `,(0,t.jsx)(n.code,{children:`severity`}),`, `,(0,t.jsx)(n.code,{children:`vulnerableRange`}),`, `,(0,t.jsx)(n.code,{children:`patchedVersion`}),`), and
optional `,(0,t.jsx)(n.code,{children:`keep`}),` constraints`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{id:`nested-override-architecture`,children:`Nested Override Architecture`}),`
`,(0,t.jsx)(n.p,{children:`How nested overrides work for transitive dependencies:`}),`
`,(0,t.jsx)(r,{chart:`flowchart TD
    App[Your App] --> ParentPkg[Parent Package]
    ParentPkg --> NestedDep[Nested Dependency]
    Override[Override in package.json] -.->|Forces version| NestedDep

    style App fill:#e3f2fd
    style Override fill:#fff3cd
    style NestedDep fill:#e8f5e9`}),`
`,(0,t.jsx)(n.h2,{id:`design-decisions`,children:`Design Decisions`}),`
`,(0,t.jsx)(n.h3,{id:`synchronous-io`,children:`Synchronous I/O`}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist uses sync file I/O intentionally. As a CLI tool, predictable execution and simple debugging outweigh async benefits.`}),`
`,(0,t.jsx)(n.h3,{id:`caching`,children:`Caching`}),`
`,(0,t.jsxs)(n.p,{children:[`Two caches avoid redundant work: `,(0,t.jsx)(n.code,{children:`jsonCache`}),` (parsed package.json files) and `,(0,t.jsx)(n.code,{children:`dependencyTreeCache`}),` (npm ls output). Caches persist across `,(0,t.jsx)(n.code,{children:`update()`}),` calls - pass `,(0,t.jsx)(n.code,{children:`clearCache: true`}),` to reset.`]}),`
`,(0,t.jsx)(n.h3,{id:`rate-limiting`,children:`Rate Limiting`}),`
`,(0,t.jsx)(n.p,{children:`npm registry requests are limited to 5 concurrent to avoid rate limits during security scans.`}),`
`,(0,t.jsx)(n.h2,{id:`dependency-resolution-flow`,children:`Dependency Resolution Flow`}),`
`,(0,t.jsx)(n.p,{children:`How package managers resolve dependencies with overrides:`}),`
`,(0,t.jsx)(r,{chart:`flowchart TD
    Install[npm install] --> ReadPkg[Read package.json]
    ReadPkg --> CheckOverrides{Overrides exist?}
    CheckOverrides -->|Yes| ApplyOverrides[Apply overrides to dependency tree]
    CheckOverrides -->|No| NormalInstall[Normal install]
    ApplyOverrides --> UpdateLock[Update lock file]
    NormalInstall --> UpdateLock
    UpdateLock --> Done[✓ Dependencies installed]

    style Install fill:#e3f2fd
    style ApplyOverrides fill:#fff3cd
    style Done fill:#e8f5e9`})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}function i(e,t){throw Error(`Expected `+(t?`component`:`object`)+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}export{r as default};