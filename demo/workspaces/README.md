# Pastoralist Workspaces Demo

This demo shows how pastoralist manages overrides in monorepos with workspaces.

## Features Demonstrated

- 🏗️ Monorepo override management
- 📦 Cross-workspace dependency tracking
- 🔄 Unified override application
- 🧹 Workspace-aware cleanup
- 🔒 Security fixes across all packages

## Try It Live

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/yowainwright/pastoralist/tree/main/demo/workspaces)

## Run Locally

```bash
# Clone and navigate to demo
git clone https://github.com/yowainwright/pastoralist.git
cd pastoralist/demo/workspaces

# Install dependencies
bun install

# Show demo structure
bun start

# Check root package only
bun run check

# Fix root overrides
bun run fix

# Fix including all workspaces
bun run fix-workspaces
```

## Monorepo Structure

```
workspaces/
├── package.json          # Root with overrides
└── packages/
    ├── app/             # React application
    │   └── package.json
    └── shared/          # Shared utilities
        └── package.json
```

## How It Works

1. **Root Overrides**: Define overrides in the root `package.json`
2. **Workspace Scanning**: Pastoralist scans all workspace packages
3. **Dependency Tracking**: Identifies which packages need overrides
4. **Unified Management**: Single source of truth for versions
5. **Cleanup**: Removes overrides not needed by any workspace

## Example Scenarios

### Scenario 1: Security Fix
A vulnerability is found in `lodash@4.17.20` used by the shared package:
- Add override in root: `"lodash": "4.17.21"`
- Applies to all workspaces automatically
- Pastoralist documents which workspace needs it

### Scenario 2: Version Consistency
Multiple packages use different React versions:
- Add override in root: `"react": "18.2.0"`
- Ensures all packages use the same version
- Prevents version conflicts

### Scenario 3: Cleanup
A package no longer uses an overridden dependency:
- Pastoralist detects unused overrides
- Automatically removes them
- Keeps package.json clean

## Configuration for Workspaces

```json
{
  "scripts": {
    "postinstall": "pastoralist --includeWorkspaces"
  },
  "pastoralist": {
    "includeWorkspaces": true,
    "security": {
      "enabled": true,
      "includeWorkspaces": true
    }
  }
}
```

## Benefits

- **Single Source of Truth**: One place for all overrides
- **Consistency**: Same versions across all packages
- **Security**: Apply fixes once, protect everywhere
- **Maintenance**: Easier to manage and audit
- **Performance**: Reduced duplication in node_modules