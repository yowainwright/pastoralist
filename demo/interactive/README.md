# Pastoralist Interactive Mode Demo

This demo showcases the `--interactive` flag, which provides an interactive interface to review and modify your Pastoralist configuration, overrides, and resolutions.

## What It Does

The interactive mode lets you:
- Review and modify workspace configuration
- Update security settings
- View and remove package overrides
- View and remove package resolutions
- Review all configuration at once
- Save or discard changes

## Usage

```bash
# View current state
npm start

# Launch interactive review
npm run interactive

# Run pastoralist normally
npm run fix
```

## Interactive Menu Options

### 1. Workspace Configuration
- Enable/disable workspace tracking
- Switch between workspace mode and custom paths
- Set custom workspace glob patterns
- Back to main menu

### 2. Security Configuration
- Enable/disable security scanning
- Change security provider (OSV, GitHub, npm, Snyk, Socket)
- Update severity threshold
- Toggle interactive mode
- Toggle auto-fix mode
- Configure workspace security checks
- Manage excluded packages
- Back to main menu

### 3. Overrides
- View all npm and pnpm overrides
- Remove specific overrides (comma-separated)
- Back to main menu

### 4. Resolutions
- View all resolutions
- Remove specific resolutions (comma-separated)
- Back to main menu

### 5. General Configuration
- View complete Pastoralist configuration
- Back to main menu

### 6. Review All
- Display all configuration, overrides, and resolutions at once

### 7. Exit
- Exit interactive mode
- Prompts to save changes if any were made

## Example Workflow

```bash
# Start interactive mode
npm run interactive

# Select "Security Configuration"
> What would you like to review? Security configuration

# Select "Change security provider"
> What would you like to do? provider

# Choose GitHub
> Select security provider: GitHub Advisory Database

# Go back to main menu
> What would you like to do? back

# Select "Overrides"
> What would you like to review? Overrides

# View overrides
> What would you like to do? view

# Remove some overrides
> What would you like to do? remove
> Enter override names to remove: lodash, axios

# Exit
> What would you like to review? exit

# Save changes
> Save changes to package.json? Yes
```

## Features

- **Non-destructive**: Changes aren't saved until you confirm
- **Flexible navigation**: Back out of any section anytime
- **Clear feedback**: See current values before making changes
- **Batch operations**: Remove multiple overrides/resolutions at once
- **Comprehensive view**: Review all option shows everything

## Tips

- Use "Review all" first to see your complete configuration
- Changes are accumulated - you can modify multiple sections before saving
- The "back" option returns you to the main menu
- Press Ctrl+C to exit without saving changes
- Re-run anytime to make more changes

## Integration with Other Commands

The `--interactive` flag works with other pastoralist options:

```bash
# Interactive security check
pastoralist --checkSecurity --interactive

# Interactive with specific path
pastoralist --interactive --path ./packages/app/package.json

# Interactive with workspace paths
pastoralist --interactive --depPaths "packages/*"
```

## Next Steps

After using interactive mode:
1. Review the changes in package.json
2. Run `pastoralist` to apply the configuration
3. Use `pastoralist --checkSecurity` to scan for vulnerabilities
4. Re-run interactive mode anytime to adjust settings
