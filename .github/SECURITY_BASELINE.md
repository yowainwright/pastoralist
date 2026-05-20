# Security Baseline

## Test Fixture Policy

Security tests intentionally create vulnerable packages, but committed fixtures should not look like production dependency manifests.

- `tests/e2e/fixtures/**` stores package fixture JSON under non-manifest filenames.
- `tests/sandboxes/**/package.json` may include demo packages, but they must be listed under `devDependencies`.
- Generated vulnerable `package.json` files should be created at test time under `/tmp`, containers, or another disposable path.

## Review Guidelines

When reviewing security alerts:

1. Treat production code, the root `package.json`, and lockfiles as release-blocking.
2. Investigate any committed test manifest alert with runtime scope.
3. Keep intentional vulnerable fixtures isolated to test data or generated runtime files.
