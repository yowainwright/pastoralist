# Security Baseline

## Expected Security Alerts

The following directories contain intentional vulnerable code for testing purposes:

### `/tests/e2e/fixtures/` Directory

- **Purpose**: End-to-end testing fixtures with vulnerable packages
- **Expected Alerts**: Known vulnerable dependencies used for testing
- **Justification**: Required for testing security detection features

## Review Guidelines

When reviewing security alerts:

1. Ignore alerts from `/tests/e2e/fixtures/` directories
2. Focus on alerts in production code (`/src/`, root `package.json`)
3. Any new vulnerabilities outside test directories should be addressed immediately
