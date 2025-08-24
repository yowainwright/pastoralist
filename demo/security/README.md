# Pastoralist Security Demo

This demo showcases Pastoralist's security vulnerability detection and auto-fix capabilities.

## Features Demonstrated

- 🔍 Vulnerability scanning using OSV database
- 🤖 Automatic security patches via overrides
- 💬 Interactive mode for selective fixes
- 💾 Backup creation before modifications
- 📊 Detailed security reports

## Try It Live

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/yowainwright/pastoralist/tree/main/demo/security)

## Run Locally

```bash
# Clone and navigate to demo
git clone https://github.com/yowainwright/pastoralist.git
cd pastoralist/demo/security

# Install dependencies
bun install

# Show demo info
bun start

# Check for vulnerabilities
bun run check

# Auto-fix all vulnerabilities
bun run fix

# Interactive mode (choose which to fix)
bun run interactive
```

## Vulnerable Packages in Demo

| Package | Current | Fixed | Severity | CVE |
|---------|---------|-------|----------|-----|
| lodash | 4.17.20 | 4.17.21 | HIGH | CVE-2021-23337 |
| minimist | 1.2.5 | 1.2.6 | CRITICAL | CVE-2021-44906 |
| axios | 0.21.0 | 0.21.2 | HIGH | CVE-2021-3749 |
| express | 4.17.1 | 4.17.3 | MEDIUM | CVE-2022-24999 |
| moment | 2.29.1 | 2.29.4 | HIGH | CVE-2022-31129 |

## How It Works

1. **Scan**: Queries vulnerability databases (OSV, GitHub, etc.)
2. **Detect**: Identifies vulnerable packages in dependencies
3. **Report**: Shows severity levels and available fixes
4. **Fix**: Generates appropriate overrides/resolutions
5. **Backup**: Creates backup before modifying package.json
6. **Apply**: Updates package.json with security patches

## Configuration

Configure in `package.json`:

```json
{
  "pastoralist": {
    "security": {
      "enabled": true,
      "provider": "osv",
      "autoFix": true,
      "interactive": false
    }
  }
}
```

## Real-World Usage

```bash
# Basic security check
pastoralist --security

# Auto-fix vulnerabilities
pastoralist --security --auto-fix

# Interactive mode
pastoralist --security --interactive

# With specific provider
pastoralist --security --provider github
```