# Security Baseline

## Expected Security Alerts

The following directories contain intentional vulnerable code for demonstration and testing purposes:

### `/demo/` Directory
- **Purpose**: Contains demonstration code showing Pastoralist's security detection capabilities
- **Expected Alerts**: Various npm/yarn/pnpm security vulnerabilities
- **Justification**: These vulnerabilities are intentionally included to demonstrate how Pastoralist can detect and help fix security issues

### `/e2e/fixtures/` Directory
- **Purpose**: End-to-end testing fixtures with vulnerable packages
- **Expected Alerts**: Known vulnerable dependencies used for testing
- **Justification**: Required for testing security detection features

## Review Guidelines

When reviewing security alerts:
1. Ignore alerts from `/demo/` and `/e2e/fixtures/` directories
2. Focus on alerts in production code (`/src/`, root `package.json`)
3. Any new vulnerabilities outside demo/test directories should be addressed immediately