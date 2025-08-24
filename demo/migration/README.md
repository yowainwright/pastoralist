# Pastoralist Migration Demo

This demo shows how to migrate from manual override management to pastoralist.

## The Problem

Many projects have accumulated overrides over time:
- ❌ No documentation about why they exist
- ❌ Some might be outdated or unnecessary
- ❌ No automatic security updates
- ❌ Technical debt accumulation

## The Solution

Pastoralist helps you:
- ✅ Document all existing overrides
- ✅ Remove unnecessary ones
- ✅ Add automatic maintenance
- ✅ Enable security scanning

## Try It Live

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/yowainwright/pastoralist/tree/main/demo/migration)

## Run Locally

```bash
# Clone and navigate to demo
git clone https://github.com/yowainwright/pastoralist.git
cd pastoralist/demo/migration

# Install dependencies
bun install

# Show demo overview
bun start

# Show current problematic state
bun run before

# Run the migration
bun run migrate

# Show the cleaned result
bun run after
```

## Migration Process

### Step 1: Analyze
Pastoralist analyzes your existing overrides to determine:
- Which packages actually need them
- Why they were added (security, compatibility, etc.)
- Which can be safely removed

### Step 2: Clean
Removes unnecessary overrides that:
- No dependencies require anymore
- Were for packages no longer in use
- Have been superseded by updates

### Step 3: Document
Adds documentation showing:
- Which packages require each override
- Security vulnerabilities being patched
- Reason for the override

### Step 4: Automate
Configures pastoralist for:
- Automatic cleanup on install
- Security vulnerability scanning
- Ongoing maintenance

## Before & After

### Before
```json
{
  "overrides": {
    "lodash": "4.17.21",
    "minimist": "1.2.6",
    "glob-parent": "6.0.2",
    "trim-newlines": "3.0.1",
    "node-fetch": "2.6.7"
  },
  "comment": "These overrides were added manually over time without documentation"
}
```

### After
```json
{
  "overrides": {
    "lodash": "4.17.21",
    "minimist": "1.2.6",
    "node-fetch": "2.6.7"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": { "express": "4.16.0" },
        "reason": "Security fix: CVE-2021-23337"
      },
      "minimist@1.2.6": {
        "dependents": { "various": "multiple" },
        "reason": "Security fix: CVE-2021-44906"
      },
      "node-fetch@2.6.7": {
        "dependents": { "axios": "0.21.0" },
        "reason": "Security fix: SSRF vulnerability"
      }
    }
  }
}
```

## Benefits After Migration

- **Documentation**: Every override is explained
- **Cleanliness**: Unnecessary overrides removed
- **Security**: Automatic vulnerability scanning
- **Maintenance**: Self-maintaining going forward
- **Team Clarity**: Everyone understands the overrides

## Real-World Migration

```bash
# Install pastoralist
npm install --save-dev pastoralist

# Run initial analysis
npx pastoralist --check

# Apply fixes and documentation
npx pastoralist

# Add to postinstall for automation
npm pkg set scripts.postinstall="pastoralist"

# Enable security scanning
npx pastoralist --security
```