import{n as e}from"./motion-CF4NsPJN.js";var t=e();function n(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:`quick-start`,children:`Quick Start`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Create a test project
mkdir test-pastoralist && cd test-pastoralist

# Create package.json with a transitive override
echo '{
  "name": "test",
  "dependencies": {
    "express": "^4.18.0"
  },
  "overrides": {
    "qs": "6.11.2"
  }
}' > package.json

# Install and run pastoralist
npm install
npm install --save-dev pastoralist
npx pastoralist

# Check the result
cat package.json
`})}),`
`,(0,t.jsx)(n.h2,{id:`how-it-works`,children:`How It Works`}),`
`,(0,t.jsx)(n.h3,{id:`before-pastoralist`,children:`Before Pastoralist`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "dependencies": {
    "express": "^4.18.0"
  },
  "overrides": {
    "qs": "6.11.2"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`after-pastoralist`,children:`After Pastoralist`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "qs": "6.11.2"
  },
  "pastoralist": {
    "appendix": {
      "qs@6.11.2": {
        "dependents": {
          "express": "qs@6.11.0"
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
`,(0,t.jsx)(n.h3,{id:`cleanup`,children:`Cleanup`}),`
`,(0,t.jsxs)(n.p,{children:[`When dependencies no longer need an override, Pastoralist labels it as unused.
Run with `,(0,t.jsx)(n.code,{children:`--remove-unused`}),` to remove the override and appendix entry:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npx pastoralist --remove-unused
`})}),`
`,(0,t.jsx)(n.h2,{id:`setup`,children:`Setup`}),`
`,(0,t.jsx)(n.h3,{id:`install`,children:`Install`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`npm install --save-dev pastoralist
`})}),`
`,(0,t.jsx)(n.h3,{id:`add-to-postinstall`,children:`Add to postinstall`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,t.jsx)(n.h3,{id:`for-monorepos`,children:`For Monorepos`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-bash`,children:`# Root package
pastoralist

# Specific workspace
pastoralist --path packages/app/package.json
`})}),`
`,(0,t.jsx)(n.h2,{id:`common-use-cases`,children:`Common Use Cases`}),`
`,(0,t.jsx)(n.h3,{id:`security-patches`,children:`Security Patches`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "minimist": "1.2.8"
  },
  "pastoralist": {
    "appendix": {
      "minimist@1.2.8": {
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Pin minimist to a patched version while upstream dependencies update.",
          "source": "security",
          "cves": ["CVE-2021-44906"],
          "severity": "high",
          "patchedVersion": "1.2.8"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Pastoralist keeps the security context with the override so you can remove it
when upstream dependencies no longer need it.`}),`
`,(0,t.jsx)(n.h3,{id:`version-conflicts`,children:`Version Conflicts`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-json`,children:`{
  "overrides": {
    "react": "17.0.2"
  },
  "pastoralist": {
    "appendix": {
      "react@17.0.2": {
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Legacy app compatibility",
          "source": "manual"
        }
      }
    }
  }
}
`})}),`
`,(0,t.jsx)(n.p,{children:`The appendix shows which packages aren't ready for React 18.`}),`
`,(0,t.jsx)(n.h3,{id:`api-usage`,children:`API Usage`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, path });
}
`})}),`
`,(0,t.jsx)(n.h2,{id:`try-it-now`,children:`Try It Now`}),`
`,(0,t.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,t.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.a,{href:`/docs/introduction`,children:`Open Interactive Demos`}),` to see pastoralist in action!`]}),`
`,(0,t.jsx)(n.h2,{id:`resources`,children:`Resources`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist`,children:`GitHub`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`https://www.npmjs.com/package/pastoralist`,children:`npm`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`Issues & Questions`})}),`
`]})]})}function r(e={}){let{wrapper:r}=e.components||{};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(n,{...e})}):n(e)}export{r as default};