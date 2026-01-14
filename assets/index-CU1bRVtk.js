const l=`---
title: Advanced Features
description: Deep dive into pastoralist's advanced capabilities
---

Pastoralist includes several advanced features that make dependency override management more powerful and maintainable.

## Nested Overrides (Transitive Dependencies)

Pastoralist fully supports npm's nested override syntax for overriding transitive dependencies (dependencies of dependencies).

### How It Works

When you need to override a transitive dependency, you can use nested overrides:

\`\`\`json
{
  "dependencies": {
    "pg": "^8.13.1"
  },
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
\`\`\`

This tells npm to use \`pg-types@^4.0.1\` whenever it's required by the \`pg\` package, regardless of what version \`pg\` actually specifies.

### Multiple Nested Overrides

You can override multiple transitive dependencies:

\`\`\`json
{
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
\`\`\`

### Tracking in Appendix

Nested overrides are tracked with a special notation in the appendix:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "pg-types@^4.0.1": {
        "dependents": {
          "my-app": "pg@^8.13.1 (nested override)"
        }
      },
      "cookie@0.5.0": {
        "dependents": {
          "my-app": "express@^4.18.0 (nested override)"
        }
      }
    }
  }
}
\`\`\`

### Use Cases

Nested overrides are particularly useful for:

1. **Security Fixes**: Override vulnerable transitive dependencies without waiting for upstream updates
2. **Bug Fixes**: Apply fixes to deeply nested dependencies
3. **Version Conflicts**: Resolve version conflicts in the dependency tree
4. **Testing**: Test with specific versions of transitive dependencies

### Workspace Support

In monorepos, nested overrides in workspace packages are also tracked:

\`\`\`json
// packages/app/package.json
{
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
\`\`\`

Pastoralist will detect and manage these nested overrides across all workspace packages when using the \`--depPaths\` option.

## Patch Support

Pastoralist automatically detects and tracks patches created by tools like \`patch-package\`.

### How It Works

When you have patches in your \`patches/\` directory:

\`\`\`
patches/
├── lodash+4.17.21.patch
├── express+4.18.0.patch
└── react+18.2.0.patch
\`\`\`

Pastoralist will track them in the appendix:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "my-app": "lodash@^4.17.0"
        },
        "patches": ["patches/lodash+4.17.21.patch"]
      }
    }
  }
}
\`\`\`

### Benefits

- **Visibility**: See which overrides have patches applied
- **Cleanup Detection**: Get notified about unused patches
- **Documentation**: Understand why patches exist alongside overrides

### Unused Patch Detection

When a dependency is removed, pastoralist alerts you:

\`\`\`
🐑 Found 2 potentially unused patch files:
  - patches/old-package+1.0.0.patch
  - patches/removed-dep+2.0.0.patch
Consider removing these patches if the packages are no longer used.
\`\`\`

<a
  href="https://codesandbox.io/p/github/yowainwright/pastoralist/main?file=/tests/sandboxes/patches/README.md"
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src="https://img.shields.io/badge/Try_Patches-CodeSandbox-blue?logo=codesandbox"
    alt="Try Patches on CodeSandbox"
  />
</a>

## PeerDependencies Support

Pastoralist now considers \`peerDependencies\` when tracking override usage.

### Example

\`\`\`json
{
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"
  },
  "overrides": {
    "react": "18.2.0"
  }
}
\`\`\`

The appendix will reflect peer dependency requirements:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "react@18.2.0": {
        "dependents": {
          "my-component": "react@^17.0.0 || ^18.0.0"
        }
      }
    }
  }
}
\`\`\`

## Smart Cleanup

Pastoralist intelligently removes overrides that are no longer needed.

### Automatic Removal

When a dependency is updated and no longer needs an override:

**Before:**

\`\`\`json
{
  "dependencies": {
    "lodash": "^4.17.0"
  },
  "overrides": {
    "lodash": "4.17.21"
  }
}
\`\`\`

**After updating lodash to 4.17.21:**

\`\`\`json
{
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "overrides": {}
}
\`\`\`

<a
  href="https://codesandbox.io/p/github/yowainwright/pastoralist/main?file=/tests/sandboxes/cleanup/README.md"
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src="https://img.shields.io/badge/Try_Cleanup-CodeSandbox-blue?logo=codesandbox"
    alt="Try Cleanup on CodeSandbox"
  />
</a>

### Transitive Dependency Tracking

Pastoralist tracks overrides needed by transitive dependencies:

\`\`\`json
{
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
\`\`\`

## Fuzzy Version Matching

Pastoralist intelligently matches version ranges to determine if overrides are needed.

### How It Works

Given these dependencies:

\`\`\`json
{
  "dependencies": {
    "express": "^4.18.0"
  }
}
\`\`\`

And this override:

\`\`\`json
{
  "overrides": {
    "express": "4.18.2"
  }
}
\`\`\`

Pastoralist understands that \`^4.18.0\` could resolve to \`4.18.2\` naturally, so the override might not be necessary unless it's fixing a specific issue.

## Appendix Preservation

The appendix is preserved even when overrides are temporarily removed, maintaining historical context.

### Example Scenario

1. **Initial state**: Override with appendix
2. **Dependency removed**: Override removed, appendix preserved
3. **Dependency re-added**: Override can be restored with context

This helps teams understand the history of override decisions.

## Multi-Format Support

While pastoralist uses npm's \`overrides\` format, it understands conversions from:

- **Yarn 1.x**: \`resolutions\`
- **pnpm**: \`pnpm.overrides\`
- **Yarn Berry**: \`resolutions\` with different syntax

### Conversion Example

From Yarn:

\`\`\`json
{
  "resolutions": {
    "package-a": "1.0.0",
    "**/package-b": "2.0.0"
  }
}
\`\`\`

To npm (what pastoralist uses):

\`\`\`json
{
  "overrides": {
    "package-a": "1.0.0",
    "package-b": "2.0.0"
  }
}
\`\`\`

## Performance Optimizations

### Caching

Pastoralist caches dependency trees during execution to avoid repeated file system reads.

### Parallel Processing

When using \`--depPaths\`, multiple package.json files are processed efficiently.

### Minimal File Writes

Package.json is only rewritten if changes are detected, preserving timestamps and reducing unnecessary git changes.

## Debug Mode Insights

Debug mode (\`--debug\`) provides detailed information:

\`\`\`
🐑 pastoralist checking herd...
[DEBUG] Reading package.json from /path/to/package.json
[DEBUG] Found 3 overrides
[DEBUG] Analyzing dependency tree...
[DEBUG] lodash@4.17.21 required by:
  - express@4.18.0 (wants lodash@^4.17.0)
  - custom-utils@1.0.0 (wants lodash@~4.17.0)
[DEBUG] Writing updated package.json
✅ pastoralist the herd is safe!
\`\`\`

## Integration with Other Tools

### patch-package

Pastoralist complements \`patch-package\` by tracking which overrides have associated patches:

\`\`\`bash
# Apply a patch
npx patch-package lodash

# Run pastoralist to update tracking
npx pastoralist
\`\`\`

### npm-check-updates

Use with \`npm-check-updates\` to manage both regular updates and overrides:

\`\`\`bash
# Update dependencies
npx npm-check-updates -u

# Update override tracking
npx pastoralist
\`\`\`

### Renovate/Dependabot

Configure automated tools to run pastoralist after updates:

\`\`\`json
{
  "postUpgradeTasks": {
    "commands": ["npm install", "npx pastoralist"],
    "fileFilters": ["package.json"]
  }
}
\`\`\`

## Custom Workflows

### Override Policies

Create policies for when overrides should be used:

\`\`\`javascript
// scripts/check-override-policy.js
const pkg = require("./package.json");

const policies = {
  security: ["minimist", "lodash"], // Always override for security
  compatibility: ["react"], // Override for compatibility
  temporary: ["experimental-pkg"], // Temporary overrides
};

// Validate overrides match policies
Object.keys(pkg.overrides || {}).forEach((override) => {
  const category = Object.entries(policies).find(([_, pkgs]) =>
    pkgs.includes(override),
  )?.[0];

  if (!category) {
    console.warn(\`Override '\${override}' has no policy!\`);
  }
});
\`\`\`

### Appendix Analysis

Extract insights from the appendix:

\`\`\`javascript
const pkg = require("./package.json");
const appendix = pkg.pastoralist?.appendix || {};

// Find overrides with most dependents
const overrideImpact = Object.entries(appendix)
  .map(([override, info]) => ({
    override,
    dependentCount: Object.keys(info.dependents || {}).length,
  }))
  .sort((a, b) => b.dependentCount - a.dependentCount);

console.log("Highest impact overrides:", overrideImpact.slice(0, 5));
\`\`\`

## Future-Proofing

Pastoralist is designed to adapt as package managers evolve:

- **Version compatibility**: Handles different package.json formats
- **Extensible appendix**: Room for additional metadata
- **Backward compatibility**: Older versions can read newer appendixes

## Best Practices

1. **Regular Updates**: Run pastoralist regularly, ideally in postinstall
2. **Review Patches**: Periodically review patches for upstream fixes
3. **Document Policies**: Create clear policies for override usage
4. **Monitor Impact**: Track which overrides affect the most packages
5. **Clean Regularly**: Remove overrides as soon as they're not needed
`,d=`---
title: API Reference
description: Complete reference for pastoralist CLI and Node.js API
---

Pastoralist provides both a CLI interface and a Node.js API for programmatic usage.

:::tip[Configuration Files]
Most CLI options can be configured using config files. See the [Configuration](/docs/configuration) documentation for details on using \`.pastoralistrc\`, \`pastoralist.config.js\`, or \`package.json\` for persistent settings.
:::

## CLI

### \`pastoralist\`

Run pastoralist on the current directory's package.json.

\`\`\`bash
npx pastoralist
\`\`\`

### \`pastoralist --path <path>\`

Run pastoralist on a specific package.json file.

**params:**

- \`<path>\`: path to a package.json file

\`\`\`bash
# Run on a specific package
npx pastoralist --path packages/app/package.json

# Run on a nested project
npx pastoralist --path ./nested/project/package.json
\`\`\`

### \`pastoralist --depPaths [paths...]\`

Run pastoralist on multiple package.json files using glob patterns.

**params:**

- \`[paths...]\`: array of glob patterns

\`\`\`bash
# Run on all packages in monorepo
npx pastoralist --depPaths "packages/*/package.json"

# Run on multiple directories
npx pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
\`\`\`

### \`pastoralist --ignore [patterns...]\`

Exclude files matching glob patterns.

**params:**

- \`[patterns...]\`: array of glob patterns to ignore

\`\`\`bash
# Ignore test directories
npx pastoralist --ignore "**/test/**" "**/dist/**"

# Ignore specific packages
npx pastoralist --depPaths "**/*package.json" --ignore "**/node_modules/**" "**/legacy/**"
\`\`\`

### \`pastoralist --root <root>\`

Set the root directory for all operations.

**params:**

- \`<root>\`: root directory path

\`\`\`bash
# Run from different directory
npx pastoralist --root /path/to/project

# Combine with other options
npx pastoralist --root ../my-project --path package.json
\`\`\`

### \`pastoralist --init\`

Initialize interactive configuration for monorepo support. This will guide you through setting up workspace paths and configuration.

\`\`\`bash
# Start interactive setup
npx pastoralist --init
\`\`\`

When run, this will:

- Detect if you have overrides for packages not in root dependencies
- Prompt you to choose between auto-detection or manual configuration
- Offer common workspace structures (standard, packages-only, apps-only, custom)
- Optionally save configuration to your package.json

### \`pastoralist --interactive\`

Run pastoralist in interactive mode. When overrides are detected for packages not in root dependencies, you'll be prompted to configure monorepo support.

\`\`\`bash
# Run with interactive prompts
npx pastoralist --interactive

# Combine with security checks
npx pastoralist --checkSecurity --interactive
\`\`\`

### \`pastoralist --debug\`

Enable detailed debug output.

\`\`\`bash
npx pastoralist --debug
\`\`\`

### \`pastoralist --dry-run\`

Preview changes without modifying package.json.

\`\`\`bash
npx pastoralist --dry-run
\`\`\`

### \`pastoralist --quiet\`

Quiet mode for CI pipelines. Outputs minimal text and uses exit codes.

- Exit 0: No vulnerabilities found
- Exit 1: Vulnerabilities detected

\`\`\`bash
npx pastoralist --quiet --checkSecurity
\`\`\`

### \`pastoralist --summary\`

Display metrics table after run.

\`\`\`bash
npx pastoralist --summary
\`\`\`

### \`pastoralist --setup-hook\`

Add pastoralist to your postinstall script automatically.

\`\`\`bash
npx pastoralist --setup-hook
\`\`\`

### \`pastoralist --checkSecurity\`

Enable security vulnerability scanning.

\`\`\`bash
npx pastoralist --checkSecurity
\`\`\`

## Node.js API

### Installation

\`\`\`bash
npm install pastoralist
\`\`\`

### \`update(options)\`

Update package.json overrides and manage the appendix.

**params:**

- \`options\`: configuration object (optional)
  - \`path\`: path to package.json (default: './package.json')
  - \`depPaths\`: array of glob patterns for multiple files
  - \`ignore\`: array of glob patterns to ignore
  - \`root\`: root directory path
  - \`debug\`: enable debug logging

\`\`\`javascript
import { update } from "pastoralist";

// Basic usage
await update();

// With specific path
await update({
  path: "./packages/app/package.json",
});

// With debug mode
await update({
  debug: true,
});

// Multiple packages
await update({
  depPaths: ["packages/*/package.json"],
  ignore: ["**/test/**"],
});
\`\`\`

### \`logger(config)\`

Create a logger instance for custom debugging.

**params:**

- \`config\`: logger configuration
  - \`file\`: source file name
  - \`isLogging\`: enable/disable logging

\`\`\`javascript
import { logger } from "pastoralist";

// Create logger
const log = logger({
  file: "my-script.js",
  isLogging: true,
});

// Use logger
log.debug("method-name", "action", { data: "value" });
log.error("method-name", "error", { error: err });
\`\`\`

## Examples

### Build Tool Integration

\`\`\`javascript
import { update } from "pastoralist";

// Ensure overrides are up-to-date before building
await update();
console.log("✓ Package overrides verified");
\`\`\`

### Workspace Automation

\`\`\`javascript
import { update } from "pastoralist";
import glob from "glob";

// Update all workspace packages
const packages = glob.sync("packages/*/package.json");

for (const pkgPath of packages) {
  await update({ path: pkgPath });
  console.log(\`✓ Updated \${pkgPath}\`);
}
\`\`\`

### CI/CD Validation

\`\`\`javascript
import { update } from "pastoralist";
import { execSync } from "child_process";

// Check if overrides are up-to-date
const before = execSync("git status --porcelain").toString();
await update();
const after = execSync("git status --porcelain").toString();

if (before !== after) {
  console.error("❌ Package.json overrides need updating");
  process.exit(1);
}
\`\`\`

### Custom Logger

\`\`\`javascript
import { update, logger } from "pastoralist";

// Create custom logger
const log = logger({
  file: "my-script.js",
  isLogging: process.env.DEBUG === "true",
});

// Log custom events
log.debug("custom-action", "starting", { time: Date.now() });

await update({ debug: true });

log.debug("custom-action", "completed", { time: Date.now() });
\`\`\`

### Error Handling

\`\`\`javascript
import { update } from "pastoralist";

try {
  await update({ path: "./package.json" });
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("Package.json not found");
  } else {
    console.error("Unexpected error:", error);
  }
}
\`\`\`

## Environment Variables

### \`DEBUG=pastoralist*\`

Enable debug output (equivalent to --debug flag).

\`\`\`bash
DEBUG=pastoralist* npx pastoralist
\`\`\`

## TypeScript

Pastoralist includes full TypeScript support.

\`\`\`typescript
import { update, Options } from "pastoralist";

const options: Options = {
  path: "./package.json",
  debug: true,
};

await update(options);
\`\`\`
`,u=`---
title: Architecture
description: "Deep dive into how Pastoralist works, including overrides, resolutions, patches, and the object anatomy"
---

## How Pastoralist Works

\`\`\`mermaid
flowchart LR
    You[You add override] --> Install[npm install]
    Install --> Pastor[Pastoralist runs]
    Pastor --> Track[Tracks it]
    Pastor --> Scan[Scans it]
    Pastor --> Clean[Cleans if unused]
    Track --> Chill[You go back to coding]
    Scan --> Chill
    Clean --> Chill

    style You fill:#e3f2fd
    style Pastor fill:#f3e5f5
    style Chill fill:#e8f5e9
\`\`\`

Pastoralist manages overrides, resolutions, and patches so you don't have to!

It is comprised of a few functions which read the root package.json file's overrides or resolutions and map the packages in them to a \`pastoralist.appendix\` object. Additionally, it automatically detects and tracks patches in your project (such as those created by \`patch-package\`).

If Pastoralist observes an override, resolution, or patch is no longer needed, it removes it from the respective objects and the pastoralist appendix object, and notifies you about unused patches.

This means with Pastoralist, your only concern is adding dependencies to the overrides and resolutions objects - patch tracking happens automatically.

### Workspace Support

In workspace/monorepo setups, Pastoralist:

- Reads the root package.json or project manifest file
- Maps all overrides, resolutions, and patches to the \`pastoralist.appendix\` object
- Updates dependencies across all workspaces
- Maintains consistency throughout your monorepo

## Simple Project Architecture

Standard single-package project with overrides:

\`\`\`mermaid
flowchart TD
    PkgJson[package.json] --> Pastoralist[Pastoralist]
    NodeModules[node_modules] --> Pastoralist
    Pastoralist --> UpdatedPkg[Updated package.json with appendix]

    style PkgJson fill:#e3f2fd
    style Pastoralist fill:#f3e5f5
    style UpdatedPkg fill:#e8f5e9
\`\`\`

## Monorepo Architecture

Complex workspace setup with shared overrides:

\`\`\`mermaid
flowchart TD
    Root[Root package.json] --> Pastoralist[Pastoralist]
    WS1[Workspace A] --> Pastoralist
    WS2[Workspace B] --> Pastoralist
    Pastoralist --> Output[Root package.json with consolidated appendix]

    style Root fill:#e3f2fd
    style Pastoralist fill:#f3e5f5
    style Output fill:#e8f5e9
\`\`\`

## What Are Overrides, Resolutions, and Patches?

### Overrides (npm)

Overrides allow you to replace a package version in your dependency tree with a different version. This is npm's way of handling dependency conflicts:

\`\`\`json
{
  "overrides": {
    "foo": "1.0.0",
    "bar": {
      "baz": "1.0.0"
    }
  }
}
\`\`\`

### Resolutions (Yarn)

Resolutions serve the same purpose for Yarn users, allowing you to force specific versions:

\`\`\`json
{
  "resolutions": {
    "foo": "1.0.0",
    "**/bar/baz": "1.0.0"
  }
}
\`\`\`

### Patches

Patches are custom modifications to node_modules packages, typically created with tools like \`patch-package\`. Pastoralist automatically detects and tracks these patches.

## Object Anatomy

The Pastoralist object in your package.json provides full transparency into what's being managed:

\`\`\`json
{
  "overrides": {
    "minimist": "1.2.8"
  },
  "pastoralist": {
    "appendix": {
      "minimist": {
        "key": "minimist",
        "version": "1.2.8",
        "parentKeys": [".", "mkdirp"],
        "hasOverride": true,
        "hasResolution": false,
        "hasPatch": false
      }
    }
  }
}
\`\`\`

### Appendix Properties

- **key**: The package name
- **version**: Current override version
- **parentKeys**: Where this dependency appears in your tree
- **hasOverride**: Whether an npm override exists
- **hasResolution**: Whether a Yarn resolution exists
- **hasPatch**: Whether a patch file exists

## Nested Override Architecture

How nested overrides work for transitive dependencies:

\`\`\`mermaid
flowchart TD
    App[Your App] --> ParentPkg[Parent Package]
    ParentPkg --> NestedDep[Nested Dependency]
    Override[Override in package.json] -.->|Forces version| NestedDep

    style App fill:#e3f2fd
    style Override fill:#fff3cd
    style NestedDep fill:#e8f5e9
\`\`\`

## Design Decisions

### Synchronous I/O

Pastoralist uses sync file I/O intentionally. As a CLI tool, predictable execution and simple debugging outweigh async benefits.

### Caching

Two caches avoid redundant work: \`jsonCache\` (parsed package.json files) and \`dependencyTreeCache\` (npm ls output). Caches persist across \`update()\` calls - pass \`clearCache: true\` to reset.

### Rate Limiting

npm registry requests are limited to 5 concurrent to avoid rate limits during security scans.

## Dependency Resolution Flow

Complete flow of how dependencies are resolved with overrides:

\`\`\`mermaid
flowchart TD
    Install[npm install] --> ReadPkg[Read package.json]
    ReadPkg --> CheckOverrides{Overrides exist?}
    CheckOverrides -->|Yes| ApplyOverrides[Apply overrides to dependency tree]
    CheckOverrides -->|No| NormalInstall[Normal install]
    ApplyOverrides --> UpdateLock[Update lock file]
    NormalInstall --> UpdateLock
    UpdateLock --> Done[✓ Dependencies installed]

    style Install fill:#e3f2fd
    style ApplyOverrides fill:#fff3cd
    style Done fill:#e8f5e9
\`\`\`
`,h=`---
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
- Removes unnecessary overrides
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
    "lodash": "4.17.20" // Why is this here?
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
          "express": "^4.18.0" // Now we know!
        }
      }
    }
  }
}
\`\`\`

### Automatic Cleanup

When dependencies no longer need an override, pastoralist removes it automatically:

\`\`\`bash
🐑 Removed 1 unnecessary override:
  - lodash@4.17.20
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
"overrides": {
  "minimist": "1.2.6"  // Security fix
}
\`\`\`

Pastoralist tracks when the fix is incorporated upstream and removes the override.

### Version Conflicts

\`\`\`json
"overrides": {
  "react": "17.0.2"  // Some packages need React 17
}
\`\`\`

The appendix shows which packages aren't ready for React 18.

### API Usage

\`\`\`javascript
import { runPastoralist } from "pastoralist";

await runPastoralist({
  path: "./package.json",
  silent: false,
});
\`\`\`

## Try It Now

<a
  href="https://codesandbox.io/p/github/yowainwright/pastoralist/main?file=/tests/sandboxes/basic-overrides/README.md"
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src="https://img.shields.io/badge/Try_it-CodeSandbox-blue?logo=codesandbox"
    alt="Try it on CodeSandbox"
  />
</a>

[Open Interactive Demos](/docs/introduction) to see pastoralist in action!

## Resources

- [GitHub](https://github.com/yowainwright/pastoralist)
- [npm](https://www.npmjs.com/package/pastoralist)
- [Issues & Questions](https://github.com/yowainwright/pastoralist/issues)
`,g=`---
title: Configuration
description: Learn how to configure Pastoralist using config files or package.json
---

Pastoralist supports multiple configuration methods to fit your project's needs. Configuration can be defined in external files or directly in your \`package.json\`.

## Configuration Files

Pastoralist searches for configuration files in this order (first found wins):

1. \`.pastoralistrc\` (JSON format)
2. \`.pastoralistrc.json\`
3. \`pastoralist.json\`
4. \`pastoralist.config.js\`
5. \`pastoralist.config.ts\`

### Example Configurations

#### Minimal Configuration

Enable security checks with defaults:

\`\`\`json
{
  "depPaths": "workspaces",
  "security": {
    "enabled": true
  }
}
\`\`\`

#### \`.pastoralistrc.json\`

\`\`\`json
{
  "depPaths": "workspaces",
  "security": {
    "enabled": true,
    "provider": "osv",
    "severityThreshold": "medium"
  }
}
\`\`\`

#### \`pastoralist.config.js\`

\`\`\`js
module.exports = {
  depPaths: ["packages/*/package.json", "apps/*/package.json"],
  security: {
    enabled: true,
    provider: "osv",
    severityThreshold: "high",
    excludePackages: ["@types/*"],
  },
};
\`\`\`

#### \`pastoralist.config.ts\`

\`\`\`ts
import { PastoralistConfig } from "pastoralist";

const config: PastoralistConfig = {
  depPaths: "workspaces",
  security: {
    enabled: true,
    provider: "osv",
    severityThreshold: "critical",
  },
};

export default config;
\`\`\`

## Configuration Priority

When both external config files and \`package.json\` configuration exist, they are merged with \`package.json\` taking precedence:

1. **External config** provides base settings
2. **\`package.json\`** overrides top-level fields
3. **Nested objects** (like \`security\`) are deep merged

### Example: Config Merging

\`\`\`js
// .pastoralistrc.json
{
  "checkSecurity": true,
  "depPaths": "workspaces",
  "security": {
    "provider": "osv",
    "severityThreshold": "medium"
  }
}

// package.json
{
  "pastoralist": {
    "security": {
      "severityThreshold": "high"  // Overrides "medium"
    }
  }
}

// Effective configuration:
{
  "checkSecurity": true,
  "depPaths": "workspaces",
  "security": {
    "provider": "osv",
    "severityThreshold": "high"  // From package.json
  }
}
\`\`\`

## Configuration Options

### Top-Level Options

| Option            | Type                                          | Description                                                 |
| ----------------- | --------------------------------------------- | ----------------------------------------------------------- |
| \`checkSecurity\`   | \`boolean\`                                     | Enable security vulnerability scanning                      |
| \`depPaths\`        | \`"workspace"\` \\| \`"workspaces"\` \\| \`string[]\` | Paths to scan for dependencies in monorepos                 |
| \`appendix\`        | \`object\`                                      | Auto-generated dependency tracking (managed by Pastoralist) |
| \`overridePaths\`   | \`object\`                                      | Manual override tracking for specific paths                 |
| \`resolutionPaths\` | \`object\`                                      | Manual resolution tracking for specific paths               |
| \`security\`        | \`object\`                                      | Security scanning configuration                             |

### Security Configuration

The \`security\` object supports the following options:

| Option                       | Type                                                       | Description                                           |
| ---------------------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| \`enabled\`                    | \`boolean\`                                                  | Enable/disable security checks                        |
| \`provider\`                   | \`"osv"\` \\| \`"github"\` \\| \`"snyk"\` \\| \`"npm"\` \\| \`"socket"\` | Security provider (currently only OSV is implemented) |
| \`autoFix\`                    | \`boolean\`                                                  | Automatically apply security fixes                    |
| \`interactive\`                | \`boolean\`                                                  | Use interactive mode for security fixes               |
| \`securityProviderToken\`      | \`string\`                                                   | API token for providers that require authentication   |
| \`severityThreshold\`          | \`"low"\` \\| \`"medium"\` \\| \`"high"\` \\| \`"critical"\`          | Minimum severity level to report                      |
| \`excludePackages\`            | \`string[]\`                                                 | Packages to exclude from security checks              |
| \`hasWorkspaceSecurityChecks\` | \`boolean\`                                                  | Include workspace packages in security scans          |

## Package.json Configuration

You can configure Pastoralist directly in your \`package.json\`:

\`\`\`json
{
  "name": "my-project",
  "version": "1.0.0",
  "pastoralist": {
    "checkSecurity": true,
    "depPaths": "workspaces",
    "security": {
      "provider": "osv",
      "severityThreshold": "medium",
      "excludePackages": ["@types/*"]
    }
  }
}
\`\`\`

## Monorepo Configuration

For monorepos, use \`depPaths\` to specify which package.json files to scan:

### Using "workspaces"

The simplest approach for monorepos with a \`workspaces\` field:

\`\`\`json
{
  "workspaces": ["packages/*", "apps/*"],
  "pastoralist": {
    "depPaths": "workspaces"
  }
}
\`\`\`

This automatically scans all workspace packages defined in your \`workspaces\` field.

### Using Custom Paths

For more control, specify custom glob patterns:

\`\`\`json
{
  "pastoralist": {
    "depPaths": ["packages/*/package.json", "apps/*/package.json"]
  }
}
\`\`\`

## Security Tracking

When security vulnerabilities are detected and fixed, Pastoralist tracks this information in the appendix ledger:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "my-app": "lodash@^4.17.0"
        },
        "ledger": {
          "addedDate": "2024-01-15T10:30:00.000Z",
          "reason": "Security vulnerability CVE-2021-23337",
          "securityChecked": true,
          "securityCheckDate": "2024-01-15T10:30:00.000Z",
          "securityProvider": "osv"
        }
      }
    }
  }
}
\`\`\`

### Ledger Fields

- **\`addedDate\`**: When the override was first added
- **\`reason\`**: Why the override was needed (e.g., security issue description)
- **\`securityChecked\`**: Whether a security check was performed
- **\`securityCheckDate\`**: When the last security check occurred
- **\`securityProvider\`**: Which provider detected the vulnerability

This allows you to see at a glance which packages were overridden due to security issues and when they were last verified.

## Best Practices

1. **Use external config files** for shared settings across teams
2. **Use \`package.json\`** for project-specific overrides
3. **Commit config files** to version control
4. **Use \`depPaths: "workspaces"\`** for most monorepos
5. **Enable security checks** in CI/CD pipelines with \`--checkSecurity\`
6. **Version control** your \`.pastoralistrc\` or config files
7. **Document custom configurations** in your project README

## TypeScript Support

When using TypeScript config files, Pastoralist will attempt to load them using \`tsx\` or \`ts-node\`. Install one of these as a dev dependency:

\`\`\`bash
npm install tsx --save-dev
# or
npm install ts-node --save-dev
\`\`\`

Then create your \`pastoralist.config.ts\`:

\`\`\`ts
import type { PastoralistConfig } from "pastoralist";

const config: PastoralistConfig = {
  checkSecurity: true,
  depPaths: "workspaces",
  security: {
    provider: "osv",
    severityThreshold: "high",
  },
};

export default config;
\`\`\`

## Environment-Specific Configuration

You can use JavaScript config files to provide environment-specific settings:

\`\`\`js
// pastoralist.config.js
const isDev = process.env.NODE_ENV === "development";
const isCI = process.env.CI === "true";

module.exports = {
  checkSecurity: !isDev, // Only check in production/CI
  depPaths: "workspaces",
  security: {
    provider: "osv",
    severityThreshold: isCI ? "high" : "medium",
    autoFix: isCI && !isDev,
  },
};
\`\`\`

## Migration from CLI Flags

If you're currently using CLI flags, you can migrate to config files:

### Before (CLI flags)

\`\`\`bash
pastoralist --checkSecurity --depPaths "packages/*/package.json"
\`\`\`

### After (config file)

\`\`\`json
{
  "checkSecurity": true,
  "depPaths": ["packages/*/package.json"]
}
\`\`\`

\`\`\`bash
pastoralist
\`\`\`

CLI flags still work and will override config file settings.
`,m=`---
title: GitHub Action
description: Automated dependency override management for CI/CD
---

Pastoralist provides a GitHub Action for automated dependency override management in your CI/CD pipelines.

## Quick Start

### Basic PR Check

\`\`\`yaml
name: Override Check
on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: yowainwright/pastoralist@v1
\`\`\`

### Scheduled Maintenance with PR Creation

\`\`\`yaml
name: Override Maintenance
on:
  schedule:
    - cron: "0 0 * * 1" # Weekly on Monday

jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: yowainwright/pastoralist@v1
        with:
          mode: pr
          pr-title: "chore(deps): update dependency overrides"
          pr-labels: "dependencies automated"
\`\`\`

## Modes

| Mode     | Description                                            |
| -------- | ------------------------------------------------------ |
| \`check\`  | Validate only - reports issues without modifying files |
| \`update\` | Modify package.json (default) - you handle commits     |
| \`pr\`     | Create pull request with changes automatically         |

### Check Mode

Runs pastoralist in dry-run mode. Reports issues without modifying files.

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    mode: check
\`\`\`

### Update Mode (Default)

Runs pastoralist and modifies \`package.json\`. Use when you want to handle commits yourself.

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    mode: update

- name: Commit changes
  run: |
    git config user.name github-actions[bot]
    git config user.email github-actions[bot]@users.noreply.github.com
    git add package.json
    git diff --staged --quiet || git commit -m "chore: update overrides"
    git push
\`\`\`

### PR Mode

Runs pastoralist and creates a PR if changes are needed. Ideal for scheduled workflows.

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    mode: pr
    pr-title: "fix(security): update vulnerable overrides"
\`\`\`

## Inputs

| Input               | Description                                 | Default                                    |
| ------------------- | ------------------------------------------- | ------------------------------------------ |
| \`mode\`              | Operation mode: \`check\`, \`update\`, or \`pr\`  | \`update\`                                   |
| \`check-security\`    | Enable security scanning                    | \`true\`                                     |
| \`security-provider\` | Provider: \`osv\`, \`github\`, \`snyk\`, \`socket\` | \`osv\`                                      |
| \`security-token\`    | Token for security provider                 | -                                          |
| \`auto-fix\`          | Apply security fixes automatically          | \`true\`                                     |
| \`dry-run\`           | Preview changes only                        | \`false\`                                    |
| \`root-dir\`          | Project root directory                      | -                                          |
| \`dep-paths\`         | Workspace patterns (space-separated)        | -                                          |
| \`config\`            | Config file path                            | -                                          |
| \`fail-on-security\`  | Fail if vulnerabilities found               | \`true\`                                     |
| \`fail-on-unused\`    | Fail if unused overrides found              | \`false\`                                    |
| \`silent\`            | Suppress output                             | \`false\`                                    |
| \`debug\`             | Enable debug logging                        | \`false\`                                    |
| \`pr-title\`          | PR title (mode: pr)                         | \`chore(deps): update dependency overrides\` |
| \`pr-body\`           | PR body (mode: pr)                          | Auto-generated                             |
| \`pr-branch\`         | PR branch name (mode: pr)                   | \`pastoralist/updates\`                      |
| \`pr-labels\`         | PR labels (space-separated)                 | \`dependencies\`                             |
| \`github-token\`      | GitHub token for PR creation                | \`GITHUB_TOKEN\`                             |

## Outputs

| Output                 | Description                              |
| ---------------------- | ---------------------------------------- |
| \`has-security-issues\`  | \`true\` if vulnerabilities were found     |
| \`has-unused-overrides\` | \`true\` if unused overrides detected      |
| \`updated\`              | \`true\` if package.json was modified      |
| \`security-count\`       | Number of security vulnerabilities found |
| \`pr-url\`               | URL of created PR (mode: pr only)        |

## Examples

### PR Check with Security Gate

\`\`\`yaml
name: Override Security
on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          fail-on-security: true
          security-provider: osv
\`\`\`

### Monorepo Support

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    dep-paths: "packages/*/package.json apps/*/package.json"
\`\`\`

### Using GitHub Security Provider

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    security-provider: github
    security-token: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

### Conditional PR on Vulnerabilities

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  id: pastoralist
  with:
    mode: check

- name: Create security PR
  if: steps.pastoralist.outputs.has-security-issues == 'true'
  run: |
    # Custom PR logic here
\`\`\`

### Weekly Maintenance with Slack Notification

\`\`\`yaml
name: Weekly Override Maintenance
on:
  schedule:
    - cron: "0 9 * * 1"

jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: yowainwright/pastoralist@v1
        id: pastoralist
        with:
          mode: pr

      - name: Notify Slack
        if: steps.pastoralist.outputs.pr-url != ''
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Pastoralist created a PR: \${{ steps.pastoralist.outputs.pr-url }}"
            }
\`\`\`

## Permissions

For \`mode: pr\`, the action needs write permissions:

\`\`\`yaml
permissions:
  contents: write
  pull-requests: write
\`\`\`

## Security Providers

| Provider | Auth Required | Notes                                             |
| -------- | ------------- | ------------------------------------------------- |
| \`osv\`    | No            | Open Source Vulnerabilities database (default)    |
| \`github\` | Yes           | GitHub Security API, good for transitive scanning |
| \`snyk\`   | Yes           | Requires Snyk API token [EXPERIMENTAL]            |
| \`socket\` | Yes           | Socket.dev, supply chain focused [EXPERIMENTAL]   |
`,y=`---
title: Introduction to Pastoralist
description: "Pastoralist is a dependency management tool that helps keep your package.json overrides, resolutions, and patches up-to-date"
---

<div className="flex flex-wrap gap-2 mb-8">
  <a
    href="https://badge.fury.io/js/pastoralist"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img src="https://badge.fury.io/js/pastoralist.svg" alt="npm version" />
  </a>
  <a
    href="https://github.com/yowainwright/pastoralist"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="https://img.shields.io/github/stars/yowainwright/pastoralist?style=social"
      alt="GitHub stars"
    />
  </a>
  <a
    href="https://www.typescriptlang.org/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="https://img.shields.io/badge/TypeScript-Ready-blue"
      alt="TypeScript Ready"
    />
  </a>
  <a href="https://osaasy.dev" target="_blank" rel="noopener noreferrer">
    <img
      src="https://img.shields.io/badge/License-O'Sassy-blue.svg"
      alt="License: O'Sassy"
    />
  </a>
</div>

## What is Pastoralist?

Pastoralist is a command-line tool that helps manage and update your package.json overrides, resolutions, and patches. It helps keep your dependency overrides up-to-date, saving you time and helping reduce security vulnerabilities.

## Why Pastoralist?

### The Problem

When working with Node.js projects, you often need to override specific package versions due to:

- Security vulnerabilities in transitive dependencies
- Bug fixes that haven't been merged upstream
- Breaking changes you need to avoid
- Custom patches for specific use cases

However, managing these overrides manually is tedious and error-prone:

\`\`\`json
{
  "overrides": {
    "lodash": "4.17.19",
    "minimist": "1.2.5",
    "node-fetch": "2.6.7"
  }
}
\`\`\`

Over time, these overrides become outdated, and you might miss important security updates or bug fixes.

### The Solution

Pastoralist automates this process by:

- Scanning your package.json for overrides, resolutions, and patches
- Checking for newer versions of overridden packages
- Updating them while maintaining compatibility
- Removing overrides that are no longer needed

With one simple command, you can ensure all your overrides are current:

\`\`\`bash
pastoralist
\`\`\`

<a
  href="https://codesandbox.io/p/github/yowainwright/pastoralist/main?file=/tests/sandboxes/basic-overrides/README.md"
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src="https://img.shields.io/badge/Try_it-CodeSandbox-blue?logo=codesandbox"
    alt="Try it on CodeSandbox"
  />
</a>

## Benefits

- **Automated Updates**: No more manual version checking
- **Security**: Stay current with security patches
- **Transparency**: Clear tracking of all overrides
- **Clean**: Removes unnecessary overrides
- **Fast**: Updates all overrides with one command
- **Compatible**: Works with npm, yarn, pnpm, and bun
`,f=`---
title: Security Vulnerability Detection
description: Detect and fix security vulnerabilities in your dependencies
---

Pastoralist includes an experimental security feature that can detect vulnerabilities in your dependencies and automatically generate package overrides to fix them.

## Overview

The security feature scans your project's dependencies against vulnerability databases and suggests or applies fixes through package overrides. This helps maintain secure dependencies without manual intervention.

## Quick Start

### Basic Check

\`\`\`bash
# Check for vulnerabilities and display a report
pastoralist --checkSecurity
\`\`\`

### Auto Fix

\`\`\`bash
# Automatically apply security fixes
pastoralist --checkSecurity --forceSecurityRefactor
\`\`\`

### Interactive

\`\`\`bash
# Choose which fixes to apply
pastoralist --checkSecurity --interactive
\`\`\`

### Workspaces

\`\`\`bash
# Include workspace packages in the scan
pastoralist --checkSecurity --includeWorkspaces
\`\`\`

<a
  href="https://codesandbox.io/p/github/yowainwright/pastoralist/main?file=/tests/sandboxes/security-scan/README.md"
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src="https://img.shields.io/badge/Try_Security_Scanning-CodeSandbox-blue?logo=codesandbox"
    alt="Try Security Scanning on CodeSandbox"
  />
</a>

## Configuration

You can configure security settings in your \`package.json\`:

\`\`\`json
{
  "pastoralist": {
    "security": {
      "enabled": false,
      "provider": "osv",
      "autoFix": false,
      "interactive": false,
      "securityProviderToken": "",
      "includeWorkspaces": false,
      "severityThreshold": "medium",
      "excludePackages": []
    }
  }
}
\`\`\`

### Configuration Options

| Option                  | Type    | Default    | Description                                                                                      |
| ----------------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| \`enabled\`               | boolean | \`false\`    | Enable automatic security checks when running pastoralist                                        |
| \`provider\`              | string  | \`"osv"\`    | Security provider: "osv" (recommended), "github", "snyk" [EXPERIMENTAL], "socket" [EXPERIMENTAL] |
| \`autoFix\`               | boolean | \`false\`    | Automatically apply security fixes without prompting                                             |
| \`interactive\`           | boolean | \`false\`    | Use interactive mode to select which fixes to apply                                              |
| \`securityProviderToken\` | string  | \`""\`       | Authentication token for providers that require it                                               |
| \`includeWorkspaces\`     | boolean | \`false\`    | Include workspace packages in security scan                                                      |
| \`severityThreshold\`     | string  | \`"medium"\` | Minimum severity level to report (low, medium, high, critical)                                   |
| \`excludePackages\`       | array   | \`[]\`       | List of package names to exclude from security checks                                            |

## CLI Options

| Option                            | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| \`--checkSecurity\`                 | Enable security vulnerability checking                 |
| \`--forceSecurityRefactor\`         | Automatically apply security fixes without prompting   |
| \`--securityProvider <provider>\`   | Specify the security provider (default: "osv")         |
| \`--securityProviderToken <token>\` | Provide authentication token for the security provider |
| \`--interactive\`                   | Use interactive mode to select fixes                   |
| \`--includeWorkspaces\`             | Include workspace packages in the security scan        |

## Security Providers

### OSV (Open Source Vulnerabilities)

Free but only checks top-level dependencies from \`package.json\`.

The [OSV database](https://osv.dev/) is a distributed vulnerability database for open source, created by Google and the open source community.

#### Benefits of OSV

- Fully open source and transparent
- No authentication required
- Aggregates data from multiple vulnerability sources
- Fast and reliable API
- Comprehensive coverage of npm packages

### GitHub Provider

Requires a token but provides more in-depth security awareness, including transitive dependencies.

The GitHub provider uses Dependabot alerts to check for vulnerabilities. This provider queries GitHub's Dependabot API for your repository.

#### Setup

The GitHub provider supports two authentication methods:

**Option 1: GitHub CLI (Recommended)**

If you have the [GitHub CLI](https://cli.github.com/) installed and authenticated, no additional setup is required:

\`\`\`bash
# Install and authenticate gh CLI
gh auth login

# Run pastoralist with GitHub provider
pastoralist --checkSecurity --securityProvider github
\`\`\`

**Option 2: Personal Access Token**

If you don't have the GitHub CLI, you can provide a GitHub token:

1. Create a personal access token at https://github.com/settings/tokens with \`repo\` scope
2. Set the token as an environment variable:
   \`\`\`bash
   export GITHUB_TOKEN=your_token_here
   \`\`\`
3. Or pass it via CLI:
   \`\`\`bash
   pastoralist --checkSecurity --securityProvider github --securityProviderToken your_token_here
   \`\`\`

#### CI/CD Permissions

When using the GitHub provider in CI workflows, you need to:

1. **Add workflow permissions:**

\`\`\`yaml
permissions:
  contents: write
  vulnerability-alerts: read
\`\`\`

2. **Enable Dependabot alerts** in your repository: Settings → Code security and analysis → Dependabot alerts

If permissions are insufficient, Pastoralist will display a warning with guidance and continue (your workflow won't fail).

#### Benefits

- Uses GitHub's official Dependabot alerts
- Integrates with your existing GitHub security settings
- No additional API rate limits beyond GitHub's standard limits
- Graceful handling when permissions are missing

### Snyk Provider [EXPERIMENTAL]

:::caution[Experimental]
The Snyk provider is experimental and may have breaking changes. Report issues at https://github.com/yowainwright/pastoralist/issues
:::

Requires the Snyk CLI and API authentication token.

\`\`\`bash
# Set your Snyk token
export SNYK_TOKEN=your_token_here

# Run with Snyk provider
pastoralist --checkSecurity --securityProvider snyk
\`\`\`

### Socket Provider [EXPERIMENTAL]

:::caution[Experimental]
The Socket provider is experimental and may have breaking changes. Report issues at https://github.com/yowainwright/pastoralist/issues
:::

Requires the Socket CLI and API key.

\`\`\`bash
# Set your Socket API key
export SOCKET_SECURITY_API_KEY=your_key_here

# Run with Socket provider
pastoralist --checkSecurity --securityProvider socket
\`\`\`

## How It Works

1. **Scanning**: Pastoralist extracts all dependencies from your \`package.json\` (and optionally workspace packages)
2. **Checking**: Dependencies are checked against the OSV database for known vulnerabilities
3. **Reporting**: Vulnerable packages are displayed with severity levels and available fixes
4. **Fixing**: If fixes are available, Pastoralist can:
   - Display them for review
   - Apply them automatically (with \`--forceSecurityRefactor\`)
   - Let you choose interactively (with \`--interactive\`)
5. **Applying**: Selected fixes are added to your \`package.json\` overrides section

## Example Output

\`\`\`
🔒 pastoralist checking for security vulnerabilities...

🔒 Security Check Report
══════════════════════════════════════════════════

Found 3 vulnerable package(s):

🔥 lodash@4.17.20
   Prototype Pollution
   CVE: CVE-2021-23337
   ✅ Fix available: 4.17.21
   🔗 https://osv.dev/vulnerability/GHSA-35jh-r3h4-6jhm

⚠️ minimist@1.2.5
   Prototype Pollution
   CVE: CVE-2021-44906
   ✅ Fix available: 1.2.6
   🔗 https://osv.dev/vulnerability/GHSA-xvch-5gv4-984h

📝 Generated 2 override(s):

  "lodash": "4.17.21" // Security fix: Prototype Pollution (high)
  "minimist": "1.2.6" // Security fix: Prototype Pollution (medium)
\`\`\`

## Performance Considerations

:::caution[Performance Impact]

- Security scanning is **disabled by default** to maintain fast performance
- Workspace scanning is **opt-in** via the \`includeWorkspaces\` option
- The OSV provider is optimized for batch queries
- Results are processed in parallel when possible
  :::

## Best Practices

- **Regular Scanning**: Run security checks as part of your CI/CD pipeline
- **Review First**: Always review suggested fixes before applying them
- **Test After Fixes**: Ensure your application still works after applying security overrides
- **Monitor Workspaces**: In monorepos, consider enabling workspace scanning for comprehensive coverage

## Limitations

:::note[Current Limitations]

- Currently only supports npm packages
- Only the OSV provider is implemented
- Interactive mode requires the \`inquirer\` package (installed on demand)
- Some vulnerabilities may not have available fixes
  :::

## Troubleshooting

### No vulnerabilities found when expected

- Ensure you're using the latest version of pastoralist
- Check that your dependencies are correctly specified in package.json
- Try running with \`--debug\` to see detailed logs

### Fixes not being applied

- Verify you have write permissions to package.json
- Check for existing overrides that might conflict
- Ensure the package manager supports overrides

### Performance issues

- Disable workspace scanning if not needed
- Consider excluding large dependency trees with \`excludePackages\`
- Use severity threshold to limit results

### GitHub provider shows "security check skipped"

This happens when the GitHub API can't access Dependabot alerts. To fix:

1. Add \`vulnerability-alerts: read\` permission to your workflow
2. Enable Dependabot alerts in Settings → Code security and analysis
3. Ensure the \`GITHUB_TOKEN\` is available in your workflow

Pastoralist will show specific guidance in the warning message.

## Example: CI/CD Integration

### GitHub Actions

\`\`\`yaml
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      vulnerability-alerts: read # Required for GitHub provider
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npx pastoralist --checkSecurity --securityProvider github
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

For OSV provider (no permissions needed):

\`\`\`yaml
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npx pastoralist --checkSecurity
\`\`\`

### GitLab CI

\`\`\`yaml
security:
  script:
    - npm install
    - npx pastoralist --checkSecurity
  only:
    - main
    - merge_requests
\`\`\`

## Contributing

The security feature is experimental and we welcome contributions! Areas for improvement:

- Additional security provider implementations
- Enhanced vulnerability filtering
- Better workspace integration
- Performance optimizations

Please see our [contributing guide](https://github.com/yowainwright/pastoralist/blob/main/CONTRIBUTING.md) for more information.
`,k=`---
title: Setup
description: "Quick and easy setup guide for Pastoralist CLI"
---

<section>

## Getting Started

1. Install Pastoralist globally:

   \`\`\`bash
   bun add -g pastoralist
   \`\`\`

2. Run it in your project:

   \`\`\`bash
   pastoralist
   \`\`\`

3. That's it! Pastoralist will automatically:
   - Scan for overrides and resolutions
   - Check for updates
   - Update your package.json
   - Track everything in the appendix

## Setup

Okay! Hopefully the breakdowns above were clear enough on why you might want to use Pastoralist!
Please submit a [pull request](https://github.com/yowainwright/pastoralist/pulls) or [issue](https://github.com/yowainwright/pastoralist/issues) if it wasn't!

Now for the super simple setup!

1. Install

\`\`\`bash
bun add pastoralist --dev
# pastoralist does not expect to be a dependency! It's a tool!!!
\`\`\`

2. run

\`\`\`bash
pastoralist
# => That's it! Check out your package.json
# Pastoralist will automatically detect and track:
# - Overrides and resolutions
# - Patches (from patch-package and similar tools)
# - All dependency types (dependencies, devDependencies, peerDependencies)
\`\`\`

3. (recommended) add Pastoralist to a postInstall script

\`\`\`js
// package.json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

Or automate it:

\`\`\`bash
pastoralist --setup-hook
\`\`\`

Read on to understand what is going on under the hood of Pastoralist!

---

</section>
`,v=`---
title: Troubleshooting & FAQ
description: Common issues and frequently asked questions
---

## Frequently Asked Questions

### What is pastoralist?

Pastoralist is a tool that automatically manages your npm overrides (or yarn resolutions) by creating an appendix that documents why each override exists and which packages depend on them.

### Why do I need pastoralist?

Without pastoralist, it's easy to:

- Forget why an override was added
- Leave outdated overrides in your package.json
- Not know which packages need specific overrides
- Accumulate technical debt over time

### Does pastoralist work with yarn/pnpm?

Pastoralist uses npm's \`overrides\` format. If you're using:

- **Yarn 1.x**: Convert \`resolutions\` to \`overrides\`
- **pnpm**: Convert \`pnpm.overrides\` to \`overrides\`
- **Yarn Berry**: Use \`resolutions\` but consider converting

### Is pastoralist safe to use?

Yes! Pastoralist:

- Only modifies the \`overrides\` and \`pastoralist\` sections of package.json
- Preserves all formatting and other fields
- Creates backups in version control (through git)
- Can be rolled back by removing the \`pastoralist\` section

### When should overrides be used?

Use overrides for:

- Security patches before upstream updates
- Compatibility issues between packages
- Bug fixes not yet released
- Temporary workarounds

## Common Issues

### Overrides Not Being Removed

**Problem:** Pastoralist isn't removing overrides that seem unnecessary.

**Solution:** The override might still be needed by a transitive dependency. Run with debug mode to see why:

\`\`\`bash
npx pastoralist --debug
\`\`\`

Look for output showing which packages require the override.

### Package.json Formatting Changes

**Problem:** Pastoralist changes the formatting of my package.json.

**Solution:** Pastoralist preserves formatting as much as possible. If you see changes:

1. Ensure you're using the latest version
2. Check if you have a \`.prettierrc\` or \`.editorconfig\` that might conflict
3. Consider running a formatter after pastoralist

### Patches Not Detected

**Problem:** My patch files aren't being tracked in the appendix.

**Solution:** Ensure patches follow the standard naming convention:

\`\`\`
patches/
├── package-name+1.0.0.patch    # Correct
├── package-name@1.0.0.patch    # Incorrect
└── custom-patch.patch          # Won't be detected
\`\`\`

### Performance Issues

**Problem:** Pastoralist takes a long time to run.

**Solution:** For large monorepos:

1. Run on specific packages instead of all at once
2. Use \`--ignore\` to skip unnecessary directories
3. Run packages in parallel:

\`\`\`bash
# Instead of
pastoralist --depPaths "**/*package.json"

# Try
find . -name "package.json" -not -path "*/node_modules/*" | \\
  xargs -P 4 -I {} npx pastoralist --path {}
\`\`\`

### Monorepo Override Conflicts

**Problem:** Different packages in my monorepo need different versions.

**Solution:** Use package-specific overrides:

\`\`\`json
// root package.json - security patches only
{
  "overrides": {
    "minimist": "1.2.8"
  }
}

// packages/legacy-app/package.json - specific needs
{
  "overrides": {
    "react": "17.0.2"
  }
}
\`\`\`

### CI Failures

**Problem:** CI fails saying package.json was modified.

**Solution:** Run pastoralist locally and commit the changes:

\`\`\`bash
npx pastoralist
git add package.json
git commit -m "Update override appendix"
\`\`\`

Then add to your CI check:

\`\`\`yaml
- run: npx pastoralist
- run: git diff --exit-code package.json
\`\`\`

## Debug Mode

Enable debug mode for detailed information:

\`\`\`bash
npx pastoralist --debug
\`\`\`

Debug output includes:

- Package resolution paths
- Dependency tree analysis
- Override usage detection
- File operation details

## Error Messages

### "Cannot find package.json"

Pastoralist can't locate your package.json. Solutions:

- Run from project root
- Use \`--path\` to specify location
- Check file permissions

### "Invalid package.json"

Your package.json has syntax errors. Validate with:

\`\`\`bash
npx json package.json
\`\`\`

### "No overrides found"

This is normal if you don't have any overrides. Pastoralist will:

- Clean up any existing appendix
- Exit successfully

## Best Practices

### 1. Regular Updates

Run pastoralist regularly:

\`\`\`json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

### 2. Document Override Reasons

While pastoralist tracks what depends on overrides, consider adding comments:

\`\`\`json
{
  "overrides": {
    "lodash": "4.17.21", // CVE-2021-12345 fix
    "react": "17.0.2" // Legacy app compatibility
  }
}
\`\`\`

### 3. Review Periodically

Set reminders to review overrides:

- Check if security patches are merged upstream
- Test if compatibility issues are resolved
- Remove overrides as soon as possible

### 4. Monitor Patch Files

When you see this warning:

\`\`\`
🐑 Found potentially unused patch files:
  - patches/old-package+1.0.0.patch
\`\`\`

Review and remove unused patches to keep your repo clean.

## Getting Help

### Resources

- [GitHub Issues](https://github.com/yowainwright/pastoralist/issues) - Report bugs & ask questions
- [Stack Overflow](https://stackoverflow.com/questions/tagged/pastoralist) - Community help

### Before Filing an Issue

1. Update to the latest version
2. Run with \`--debug\` flag
3. Check existing issues
4. Provide minimal reproduction

### Issue Template

When reporting issues, include:

- Pastoralist version
- Node.js version
- Package manager (npm/yarn/pnpm)
- Relevant package.json sections
- Debug output

## Migration Help

### From Manual Management

If you're tracking overrides manually (in comments or docs), pastoralist will:

1. Automatically document all current overrides
2. Track their usage going forward
3. Clean up when no longer needed

### From Other Tools

Moving from other override management tools:

1. Convert to npm \`overrides\` format
2. Run \`npx pastoralist\`
3. Remove old tool configuration

## Advanced Debugging

### Trace Dependency Paths

To understand why an override is needed:

\`\`\`javascript
// debug-override.js
import { update } from "pastoralist";

await update({
  debug: true,
  path: "./package.json",
});

// Check the debug output for dependency paths
\`\`\`

### Analyze Appendix

\`\`\`javascript
// analyze-appendix.js
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const appendix = pkg.pastoralist?.appendix || {};

console.log("Override Report:");
Object.entries(appendix).forEach(([override, info]) => {
  console.log(\`\\n\${override}:\`);
  console.log("  Dependents:", Object.keys(info.dependents || {}));
  console.log("  Patches:", info.patches || "none");
});
\`\`\`
`,b=`---
title: Workspaces & Monorepos
description: Using pastoralist in workspace and monorepo environments
---

Pastoralist works seamlessly with workspace and monorepo setups. This guide covers how to effectively use pastoralist across multiple packages.

<a
  href="https://codesandbox.io/p/github/yowainwright/pastoralist/main?file=/tests/sandboxes/monorepo/README.md"
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src="https://img.shields.io/badge/Try_Monorepo-CodeSandbox-blue?logo=codesandbox"
    alt="Try Monorepo on CodeSandbox"
  />
</a>

## How Pastoralist Works in Workspaces

Pastoralist operates on a single \`package.json\` at a time. In a workspace setup, you can run it on:

- The root package.json
- Individual workspace packages
- Multiple packages using scripts

## Configuration Methods

Pastoralist provides multiple ways to configure workspace scanning in monorepos:

### Method 1: depPaths in package.json (Recommended)

Configure dependency paths directly in your \`package.json\` for automatic workspace tracking:

\`\`\`json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*", "apps/*"],
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace" // Automatically scans all workspaces
  },
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

**Using \`"workspace"\` string** - Pastoralist automatically uses all packages defined in your \`workspaces\` field:

Benefits:

- Single source of truth in package.json
- No CLI flags needed
- Works automatically with postinstall scripts
- Appendix only appears in root (workspace packages stay clean)
- Self-documenting configuration

**Using array of paths** - Specify custom paths to scan:

\`\`\`json
{
  "pastoralist": {
    "depPaths": ["packages/app-a/package.json", "packages/app-b/package.json"]
  }
}
\`\`\`

After running \`pastoralist\`, your root package.json will contain:

\`\`\`json
{
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
        }
      }
    }
  }
}
\`\`\`

The workspace packages (\`packages/*/package.json\` and \`apps/*/package.json\`) remain clean without any pastoralist appendix.

### Method 2: CLI depPaths Flag

Specify paths at runtime:

\`\`\`bash
# Scan specific paths
pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"

# CLI flags override package.json configuration
pastoralist --depPaths "packages/app-a/package.json"
\`\`\`

### Method 3: Interactive Configuration

Pastoralist offers interactive configuration for monorepo setups:

\`\`\`bash
# Initialize with guided setup
pastoralist --init

# Or use interactive mode when running
pastoralist --interactive
\`\`\`

When Pastoralist detects overrides for packages not in root dependencies, it will:

- Guide you through workspace configuration
- Auto-detect common structures (packages/_, apps/_, etc.)
- Allow custom path specification
- Optionally save configuration to package.json

## Basic Usage

### Running on Root Package

\`\`\`bash
# Run on the root package.json
pastoralist
\`\`\`

This will manage overrides in your root \`package.json\`, which affect all workspaces.

### Running on Workspace Packages

\`\`\`bash
# Run on a specific workspace package
pastoralist --path packages/app-a/package.json

# Or navigate to the package
cd packages/app-a
pastoralist
\`\`\`

## Common Patterns

### Pattern 1: Root-Level Overrides

Most monorepos use root-level overrides that apply to all workspaces:

\`\`\`json
// root package.json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21",
    "react": "18.2.0"
  }
}
\`\`\`

Run pastoralist at the root:

\`\`\`bash
pastoralist
\`\`\`

### Pattern 2: Package-Specific Overrides

Some packages may need their own overrides:

\`\`\`json
// packages/legacy-app/package.json
{
  "name": "legacy-app",
  "overrides": {
    "react": "17.0.2" // This app needs React 17
  }
}
\`\`\`

Run pastoralist for this package:

\`\`\`bash
pastoralist --path packages/legacy-app/package.json
\`\`\`

### Pattern 3: Automated Workspace Management

Create a script to run pastoralist across all workspaces:

\`\`\`json
// root package.json
{
  "scripts": {
    "pastoralist:all": "npm run pastoralist:root && npm run pastoralist:workspaces",
    "pastoralist:root": "pastoralist",
    "pastoralist:workspaces": "lerna run pastoralist --parallel"
  }
}
\`\`\`

Or with a custom script:

\`\`\`bash
#!/bin/bash
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
\`\`\`

## Integration Strategies

### Strategy 1: Centralized Management with depPaths (Recommended)

Keep all overrides in the root \`package.json\` and use \`depPaths\` configuration:

**Pros:**

- Single source of truth
- Easier to maintain
- Consistent versions across packages
- Automatic workspace tracking
- Clean workspace package.json files

**Setup:**

\`\`\`json
// root package.json
{
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
\`\`\`

### Strategy 2: Distributed Management

Allow packages to manage their own overrides:

**Pros:**

- Package autonomy
- Specific version requirements
- Gradual migrations

**Setup:**

\`\`\`json
// packages/*/package.json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

### Strategy 3: Hybrid Approach

Combine root overrides with package-specific ones:

\`\`\`json
// root: security patches
{
  "overrides": {
    "minimist": "1.2.8"  // Security fix
  }
}

// packages: feature-specific
{
  "overrides": {
    "react": "17.0.2"  // Compatibility requirement
  }
}
\`\`\`

## Real-World Examples

### Example 1: Lerna Monorepo

\`\`\`json
{
  "name": "my-lerna-monorepo",
  "scripts": {
    "postinstall": "lerna bootstrap && pastoralist",
    "update-overrides": "pastoralist && lerna run pastoralist"
  }
}
\`\`\`

### Example 2: npm Workspaces

\`\`\`json
{
  "name": "my-npm-workspace",
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "postinstall": "pastoralist",
    "check-overrides": "pastoralist --debug"
  }
}
\`\`\`

### Example 3: pnpm Workspace

\`\`\`yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
\`\`\`

\`\`\`json
// root package.json
{
  "scripts": {
    "postinstall": "pastoralist",
    "update-all": "pnpm -r exec pastoralist"
  }
}
\`\`\`

### Example 4: Yarn Workspaces

\`\`\`json
{
  "private": true,
  "workspaces": {
    "packages": ["packages/*"]
  },
  "scripts": {
    "postinstall": "pastoralist",
    "workspaces:update": "yarn workspaces foreach run pastoralist"
  }
}
\`\`\`

## Best Practices

### 1. Choose a Consistent Strategy

Decide whether to:

- Manage all overrides at the root (recommended for most cases)
- Allow package-specific overrides (for complex requirements)
- Use a hybrid approach (for gradual migrations)

### 2. Automate with postinstall

Always add pastoralist to postinstall scripts:

\`\`\`json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

### 3. Document Your Strategy

Create a \`DEPENDENCIES.md\` file:

\`\`\`markdown
# Dependency Management

We use pastoralist to manage overrides. Strategy:

1. Security patches: Root package.json
2. Feature overrides: Package-specific
3. Run \`npm run update-overrides\` after changes
\`\`\`

### 4. CI/CD Integration

Ensure overrides are valid in CI:

\`\`\`yaml
- name: Validate overrides
  run: |
    npm run pastoralist:all
    git diff --exit-code
\`\`\`

## Troubleshooting

### Issue: Overrides Not Applied

**Symptom:** Workspace packages don't respect root overrides

**Solution:** Ensure you're using a package manager that supports workspace overrides:

- npm 8.3+ ✅
- yarn 1.x (use resolutions) ✅
- pnpm (use pnpm.overrides) ✅

### Issue: Duplicate Appendix Entries

**Symptom:** Same override tracked in multiple package.json files

**Solution:** This is normal! Each package.json maintains its own appendix for clarity.

### Issue: Performance in Large Monorepos

**Symptom:** Pastoralist takes long to run across many packages

**Solution:** Run in parallel:

\`\`\`bash
# Using GNU parallel
find . -name "package.json" -path "*/node_modules" -prune -o -print | \\
  parallel "pastoralist --path {}"
\`\`\`

## Migration Guide

### Moving to Centralized Overrides

1. Collect all overrides:

\`\`\`bash
find . -name "package.json" -not -path "*/node_modules/*" \\
  -exec jq '.overrides // {}' {} \\; | jq -s 'add'
\`\`\`

2. Add to root package.json
3. Remove from individual packages
4. Run pastoralist at root

### Splitting Overrides

1. Identify package-specific needs
2. Move relevant overrides to packages
3. Run pastoralist on each package
4. Update CI/CD scripts

## Advanced Patterns

### Dynamic Override Detection

\`\`\`javascript
// scripts/check-overrides.js
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
\`\`\`

### Override Inheritance

Create a base configuration:

\`\`\`json
// packages/base-config/overrides.json
{
  "lodash": "4.17.21",
  "minimist": "1.2.8"
}
\`\`\`

Apply to packages:

\`\`\`javascript
// scripts/apply-base-overrides.js
const base = require("./packages/base-config/overrides.json");
// Apply base overrides to each package
\`\`\`

## Next Steps

- Set up pastoralist in your workspace
- Choose a management strategy
- Add automation scripts
- Document your approach for the team
`;function w(e){const n=e.match(/^---\n([\s\S]*?)\n---/);if(!n)return{};const t={},s=n[1].split(`
`);for(const a of s){const o=a.indexOf(":");if(o===-1)continue;const c=a.slice(0,o).trim();let i=a.slice(o+1).trim();i=i.replace(/^["']|["']$/g,""),t[c]=i}return t}const r=Object.assign({"./docs/advanced-features.mdx":l,"./docs/api-reference.mdx":d,"./docs/architecture.mdx":u,"./docs/codelab.mdx":h,"./docs/configuration.mdx":g,"./docs/github-action.mdx":m,"./docs/introduction.mdx":y,"./docs/security.mdx":f,"./docs/setup.mdx":k,"./docs/troubleshooting.mdx":v,"./docs/workspaces.mdx":b}),p=Object.entries(r).map(([e,n])=>{const t=e.replace("./docs/","").replace(".mdx",""),s=w(n);return{slug:t,title:s.title??t,description:s.description??""}});function P(e){return p.find(n=>n.slug===e)}function j(e){const n=`./docs/${e}.mdx`;return r[n]}function x(){return p}export{P as a,j as b,x as g};
