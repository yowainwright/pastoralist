# [Pastoralist](https://jeffry.in/pastoralist/)

![Typed with TypeScript](https://flat.badgen.net/badge/icon/Typed?icon=typescript&label&labelColor=blue&color=555555)
[![npm version](https://badge.fury.io/js/pastoralist.svg)](https://badge.fury.io/js/pastoralist)
![ci](https://github.com/yowainwright/pastoralist/actions/workflows/ci.yml/badge.svg)
[![Github](https://badgen.net/badge/icon/github?icon=github&label&color=grey)](https://github.com/yowainwright/pastoralist)
![Twitter](https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2Fyowainwright%2Fpastoralist)

#### Manage your package.json \*`overrides`, `resolutions`, and `patches` with ease!

With the Pastoralist CLI, you can ensure your project's overrides _(or resolutions)_ and patches are kept up-to-date by running a single one word command! Jump to [setup](#setup) or scroll on!

---

## What _are_ \*overrides and resolutions?

> Overrides and resolutions solve the same problem!<br>**_They give developers a way to specify dependency versions downloaded to a repository's node_modules folder_**.

Node package manager CLIs, like npm, yarn, and pnpm, enable engineers to solve dependency specificity issues by adding an overrides or resolutions object to a repository's root package.json. This is awesome for fixing dependency issues with security and/or code. Read more about [npm](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides), [yarn](https://yarnpkg.com/configuration/manifest#resolutions), and [pnpm](https://pnpm.io/package_json#pnpmoverrides) overrides or resolution solutions.

---

## Why is Pastoralist Awesome?

> Is the override still needed? Is there a better fix? Like a security patch or a major release?

After using overrides or resolutions to fix dependency specificity issues for a while, **_it is easy to lose track of why a dependency is in an overrides or resolutions package.json object!_** This is an inconvenient problem when trying to maintain dependencies over time. This information is not really known—**until now!**

With Pastoralist CLI, you can run the `pastoralist` CLI command and an overrides (resolution) object that looks like this:

```js
// Note the trim dependency in overrides
"overrides": {
  "trim": "^0.0.3"
},
```

Will look like this:

```js
// Note the trim dependency is now added to the appendix
"overrides": {
  "trim": "^0.0.3"
},
"pastoralist": {
  "appendix": {
    "trim@^0.0.3": {
      "dependents": {
        "remark-parse": "4.0.0"
      }
    }
  }
}
```

But there's more!

If Pastoralist is run and an override or resolution is no longer required, Pastoralist will remove the dependency from pastoralist.appendix, overrides, or resolutions!

AKA, the object above, will now look like the object below if trim is no longer needed.

```js
// Note that since trim is no longer needed,
// it has been removed from the appendix and overrides
"overrides": {},
"pastoralist": {
  "appendix": {}
}
```

### ✨ New Features

**Nested Overrides Support**: Pastoralist now fully supports npm's nested overrides for overriding transitive dependencies:

```js
// Override a transitive dependency of pg
"overrides": {
  "pg": {
    "pg-types": "^4.0.1"
  }
}
```

This is tracked in the appendix as:

```js
"pastoralist": {
  "appendix": {
    "pg-types@^4.0.1": {
      "dependents": {
        "my-app": "pg@^8.13.1 (nested override)"
      }
    }
  }
}
```

**Security Vulnerability Detection (Experimental)**: Pastoralist can check for security vulnerabilities and automatically generate overrides to fix them:

```bash
# Check for vulnerabilities and show report
pastoralist --checkSecurity

# Automatically apply security fixes
pastoralist --checkSecurity --forceSecurityRefactor

# Interactive mode - choose which fixes to apply
pastoralist --checkSecurity --interactive

# Include workspace packages in security scan
pastoralist --checkSecurity --includeWorkspaces

# Initialize interactive configuration for monorepo support
pastoralist --init

# Use interactive mode to configure monorepo paths when overrides are detected
pastoralist --interactive
```

Configure security checks in your `package.json`:

```js
"pastoralist": {
  "security": {
    "enabled": false,                  // Disabled by default for performance
    "provider": "osv",                 // Currently only "osv" is implemented
    "autoFix": false,                  // Automatically apply fixes
    "interactive": false,              // Use interactive mode  
    "securityProviderToken": "",       // Token for future providers that require auth
    "includeWorkspaces": false,        // Include workspace packages (default: false)
    "severityThreshold": "medium",     // Minimum severity (low, medium, high, critical)
    "excludePackages": []              // Packages to exclude from checks
  }
}
```

**Note**: Currently, Pastoralist uses the [OSV (Open Source Vulnerabilities)](https://osv.dev/) database for security scanning. OSV is a distributed vulnerability database for open source, created by Google and the open source community. It aggregates vulnerabilities from multiple sources and requires no authentication - making it fast and accessible. Huge thanks to the OSV team for providing this valuable service! 

Support for additional providers (GitHub, Snyk, NPM, Socket) is planned for future releases.

**Patch Support**: Pastoralist now automatically detects and tracks patches (e.g., from `patch-package`) in your project:

```js
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
```

**Enhanced Dependency Support**: Now supports `peerDependencies` alongside `dependencies` and `devDependencies` for complete dependency tracking.

**Smart Cleanup**: Get notified about unused patches when dependencies are removed:

```
🐑 Found 2 potentially unused patch files:
  - patches/old-package+1.0.0.patch
Consider removing these patches if the packages are no longer used.
```

There is more to come with Pastoralist! But for now, by adding pastoralist to [package.json postInstall script](https://docs.npmjs.com/cli/v8/using-npm/scripts#npm-install), you don't have to worry about installing unneeded override or resolution packages anymore!

---

## How Pastoralist works

> #### Pastoralist manages overrides and resolutions so you don't have to!

It is comprised of a few functions which read the root package.json file's overrides or resolutions and map the packages in them to a `pastoralist.appendix` object.

If Pastoralist observes an override or resolution is no longer needed, it removes it from resolutions or overrides, and the pastoralist appendix object.

This means with Pastoralist, your only concern is adding dependencies to the overrides and resolutions objects.
Broken down, Pastoralist manages your overrides and resolutions with 4 simple steps demonstrated in the flow chart below.

```mermaid
flowchart TD
    Start([Start]) --> Find[Find overrides/resolutions<br/>in package.json]
    Find --> Review[Review dependencies<br/>Compare with appendix]
    Review --> Decision{Changes needed?}
    Decision -->|New overrides| Add[Add to<br/>pastoralist.appendix]
    Decision -->|Unused overrides| Remove[Remove from overrides<br/>and appendix]
    Decision -->|No changes| End([End])
    Add --> End
    Remove --> End

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style Find fill:#e3f2fd
    style Review fill:#e3f2fd
    style Add fill:#f3e5f5
    style Remove fill:#f3e5f5
```

### Key notes

1. Pastoralist does **not** manage what is added to overrides or resolutions objects.
2. Pastoralist **does** manage dependencies that exist in a `package.json`'s overrides or resolutions objects.
3. Pastoralist will remove overrides and resolutions if they become unneeded according to child package.json's spec!

**For detailed architecture diagrams and use cases**, see [Architecture Documentation](docs/architecture.md)

### Using Pastoralist with Workspaces and Monorepos

Pastoralist now provides enhanced support for monorepo scenarios where overrides are defined at the root but the overridden packages are installed in workspace packages.

#### Monorepo Override Tracking

When you have overrides at the root of a monorepo for packages that are only installed in workspace packages, Pastoralist can track these properly:

```js
// Root package.json with overrides for workspace packages
{
  "overrides": {
    "lodash": "4.17.21"  // Used by workspace packages, not root
  },
  "pastoralist": {
    "overridePaths": {
      "packages/app-a/package.json": {
        "lodash@4.17.21": {
          "dependents": {
            "app-a": "lodash@^4.17.0"
          }
        }
      }
    }
  }
}
```

#### Configuration Options

1. **Interactive Configuration** - Let Pastoralist guide you through setup:
```bash
# Initialize with interactive prompts
pastoralist --init

# Or use --interactive when overrides are detected
pastoralist --interactive
```

When Pastoralist detects overrides for packages not in root dependencies, it will:
- Prompt you to configure workspace paths
- Offer to auto-detect common monorepo structures
- Allow you to specify custom paths
- Optionally save the configuration to your package.json

2. **Using depPaths** - Specify paths to scan for package.json files:
```bash
pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
```

3. **Using overridePaths/resolutionPaths** - Configure in your package.json:
```js
"pastoralist": {
  "overridePaths": {  // or "resolutionPaths" for yarn
    "packages/app-a/package.json": { /* appendix for app-a */ },
    "packages/app-b/package.json": { /* appendix for app-b */ }
  }
}
```

This configuration ensures that:
- Overrides for packages not in root dependencies are preserved
- Each workspace package's usage is tracked separately
- The appendix correctly maps overrides to their actual consumers

For detailed information about using Pastoralist in workspace/monorepo environments, including best practices and automation strategies, see [Workspaces and Monorepos](docs/workspaces.md).

---

## Setup

> #### Okay! Hopefully the breakdowns above were clear enough on why you might want to use Pastoralist!

Please submit a [pull request](https://github.com/yowainwright/pastoralist/pulls) or [issue](https://github.com/yowainwright/pastoralist/issues) if it wasn't!

Now for the super simple setup!

1. Install

```bash
npm install pastoralist --save-dev
# pastoralist does not expect to be a dependency! It's a tool!!!
```

2. run

```bash
pastoralist
# => That's it! Check out your package.json
```

3. (recommended) add Pastoralist to a postInstall script

```js
// package.json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
```

---

## Testing

### Unit Tests

```bash
pnpm test
```

### End-to-End Tests

Run comprehensive e2e tests using Docker to verify real-world scenarios:

```bash
pnpm run test-e2e
```

The e2e tests create a realistic monorepo workspace with lodash dependencies and verify:

- Appendix creation and updates
- Override version changes
- Appendix preservation when overrides are removed (bug fix verification)
- Cross-package dependency tracking
- Patch detection and tracking
- PeerDependencies support

In the near future, Pastoralist will fully support a config file but this is it for now!

Read on to understand what is going on under the hood of Pastoralist!

---

### Examples

#### Simple Overrides

For direct dependency overrides:

```js
// package.json
"dependencies": {
  "lodash": "^4.17.0"
},
"overrides": {
  "lodash": "4.17.21"  // Pin to specific version
}
```

#### Nested Overrides (Transitive Dependencies)

For overriding dependencies of dependencies:

```js
// package.json
"dependencies": {
  "pg": "^8.13.1",
  "express": "^4.18.0"
},
"overrides": {
  // Override pg's dependency on pg-types
  "pg": {
    "pg-types": "^4.0.1"
  },
  // Override express's cookie dependency
  "express": {
    "cookie": "0.5.0"
  },
  // You can also mix simple and nested overrides
  "lodash": "4.17.21"
}
```

After running `pastoralist`, you'll see:

```js
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
    },
    "lodash@4.17.21": {
      "dependents": {
        "my-app": "lodash@^4.17.0"
      }
    }
  }
}
```

### Pastoralist Object Anatomy

When **Pastoralist** is run in a repository with override or resolution dependencies, it will output a shape like below.

```js
// package.json
"pastoralist": {
  // the appendix contains mapped resolutions/overrides
  "appendix": {
    // the resolution/override is stringified with it's version
    "trim@^0.0.3": {
      // dependents contain dependents which actually require the override/resolution dependency
      "dependents": {
        "remark-parse": "4.0.0"
      }
    }
  }
}
```

When ever **Pastoralist** is run again, it will check the `pastoralist.appendix` object and remove any resolutions/overrides that are no longer needed.

## Thanks

Shout out to [Bryant Cabrera](https://github.com/bryantcabrera) and the infamous [Mardin](https://github.com/mardinyadegar) for all the fun conversation, insights, and pairing around this topic.

---

Made by [@yowainwright](https://github.com/yowainwright) for fun with passion! MIT, 2022
