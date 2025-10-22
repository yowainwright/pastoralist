# Pastoralist Init Command Demo

This demo showcases the `pastoralist init` command, which provides an interactive wizard to configure Pastoralist for your project.

## What It Does

The init command helps you:
- Choose where to store configuration (package.json or external file)
- Set up workspace dependency tracking
- Configure security vulnerability scanning
- Select security providers and scanning options
- All steps are completely optional

## Usage

```bash
# View current configuration
npm start

# Run the init wizard
npm run init

# Run pastoralist with the new config
npm run fix

# Check for security vulnerabilities
npm run check
```

## Init Wizard Steps

### 1. Configuration Location
Choose where to store your Pastoralist config:
- **package.json** - Simple, keeps everything in one file
- **External file** - Better for complex setups
  - `.pastoralistrc.json` - JSON format
  - `pastoralist.config.js` - JavaScript module
  - `pastoralist.config.ts` - TypeScript module

### 2. Workspace Configuration
Set up monorepo/workspace tracking:
- **Workspace mode** - Auto-detect from package.json workspaces
- **Custom paths** - Specify custom glob patterns
- **Skip** - Don't track workspace dependencies

### 3. Security Configuration
Enable vulnerability scanning:
- Choose security provider (OSV, GitHub, npm, Snyk, Socket)
- Set severity threshold (low, medium, high, critical)
- Enable interactive mode or auto-fix
- Configure workspace security checks
- Add API tokens for providers that require them

## Example Configurations

### Minimal (workspace tracking only)
```json
{
  "pastoralist": {
    "depPaths": "workspace"
  }
}
```

### Security enabled
```json
{
  "pastoralist": {
    "checkSecurity": true,
    "security": {
      "enabled": true,
      "provider": "osv",
      "interactive": true,
      "severityThreshold": "high"
    }
  }
}
```

### Complete
```json
{
  "pastoralist": {
    "depPaths": ["packages/*", "apps/*"],
    "checkSecurity": true,
    "security": {
      "enabled": true,
      "provider": "github",
      "interactive": true,
      "autoFix": false,
      "severityThreshold": "medium",
      "hasWorkspaceSecurityChecks": true
    }
  }
}
```

## Tips

- You can re-run `pastoralist init` to update your configuration
- The wizard will detect existing config and ask if you want to overwrite
- All prompts have sensible defaults
- Press Ctrl+C at any time to cancel

## Next Steps

After running init:
1. Review the generated configuration
2. Run `pastoralist` to apply it
3. Use `--checkSecurity` flag to scan for vulnerabilities
4. Use `--interactive` flag to review changes before applying
