var e=`---
title: Interactive Tutorial
description: Learn pastoralist step-by-step
---

## The Problem

When using npm overrides or yarn resolutions, you often:

- Forget why an override was added
- Leave outdated overrides in place
- Don't know which packages need them

## The Solution

Pastoralist automatically:

- Documents each override with an appendix
- Shows which packages require each override
- Detects unnecessary overrides and removes them with \`--remove-unused\`
- Runs via postinstall hooks

## Quick Start

\`\`\`bash
# Create a test project
mkdir test-pastoralist && cd test-pastoralist

# Create package.json with overrides
echo '{
  "name": "test",
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "overrides": {
    "lodash": "4.17.20"
  }
}' > package.json

# Install and run pastoralist
npm install
npm install --save-dev pastoralist
npx pastoralist

# See the result - an appendix was added!
cat package.json
\`\`\`

## How It Works

### Before Pastoralist

\`\`\`json
{
  "dependencies": {
    "lodash": "^4.17.21",
    "express": "^4.18.0"
  },
  "overrides": {
    "lodash": "4.17.20"
  }
}
\`\`\`

### After Pastoralist

\`\`\`json
{
  "overrides": {
    "lodash": "4.17.20"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.20": {
        "dependents": {
          "express": "lodash@^4.17.0"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      }
    }
  }
}
\`\`\`

### Cleanup

When dependencies no longer need an override, Pastoralist labels it as unused.
Run with \`--remove-unused\` to remove the override and appendix entry:

\`\`\`bash
npx pastoralist --remove-unused
\`\`\`

## Setup

### Install

\`\`\`bash
npm install --save-dev pastoralist
\`\`\`

### Add to postinstall

\`\`\`json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

### For Monorepos

\`\`\`bash
# Root package
pastoralist

# Specific workspace
pastoralist --path packages/app/package.json
\`\`\`

## Common Use Cases

### Security Patches

\`\`\`json
{
  "overrides": {
    "minimist": "1.2.6"
  },
  "pastoralist": {
    "appendix": {
      "minimist@1.2.6": {
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Security fix",
          "source": "security"
        }
      }
    }
  }
}
\`\`\`

Pastoralist keeps the security context with the override so you can remove it
when upstream dependencies no longer need it.

### Version Conflicts

\`\`\`json
{
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
\`\`\`

The appendix shows which packages aren't ready for React 18.

### API Usage

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, path });
}
\`\`\`

## Try It Now

<a
  href="https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

[Open Interactive Demos](/docs/introduction) to see pastoralist in action!

## Resources

- [GitHub](https://github.com/yowainwright/pastoralist)
- [npm](https://www.npmjs.com/package/pastoralist)
- [Issues & Questions](https://github.com/yowainwright/pastoralist/issues)
`;export{e as default};