# Pastoralist Security Feature

## Overview
Pastoralist now includes built-in security vulnerability detection that can automatically generate overrides to fix vulnerable dependencies.

## Features

### 🔒 Security Vulnerability Detection
- Fetches vulnerability data from GitHub Dependabot alerts
- Supports both GitHub CLI (`gh`) and GitHub API authentication
- Identifies vulnerable packages in your dependencies
- Generates appropriate overrides for packages with available fixes

### 📋 Configuration Options

#### CLI Options
- `--checkSecurity`: Enable security vulnerability checking
- `--forceSecurityRefactor`: Automatically apply all available security fixes
- `--interactive`: Interactive mode to selectively apply fixes
- `--securityProvider <provider>`: Choose provider (currently: github)
- `--githubToken <token>`: Provide GitHub token for API access

#### Package.json Configuration
```json
{
  "pastoralist": {
    "security": {
      "enabled": false,
      "provider": "github",
      "autoFix": false,
      "interactive": false,
      "severityThreshold": "medium",
      "excludePackages": []
    }
  }
}
```

## Usage Examples

### Basic Security Check
```bash
pastoralist --checkSecurity
```

### Auto-fix Vulnerabilities
```bash
pastoralist --checkSecurity --forceSecurityRefactor
```

### Interactive Mode
```bash
pastoralist --checkSecurity --interactive
```

### Enable via Configuration
```json
{
  "pastoralist": {
    "security": {
      "enabled": true,
      "autoFix": true
    }
  }
}
```

## Implementation Details

### Architecture
- **SecurityChecker**: Main class coordinating security checks
- **GitHubSecurityProvider**: Handles GitHub Dependabot API integration
- **InteractiveSecurityManager**: Manages interactive prompts (requires inquirer)

### Security Best Practices
- Uses `execFile` instead of `exec` to prevent command injection
- Supports mock mode for testing (via environment variables)
- Security checks are disabled by default (opt-in feature)
- Properly handles authentication tokens

### Testing
- Comprehensive unit tests in `tests/security.test.ts`
- E2E tests in `packages/e2e/scripts/test-security-features.sh`
- Mock data support for predictable testing

## Future Enhancements
- Support for additional security providers (npm audit, Snyk)
- Severity threshold filtering
- Package exclusion lists
- Security report export formats