# Security Baseline

## Test Fixture Policy

Security tests intentionally create vulnerable packages, but committed fixtures should not look like production dependency manifests.

- `tests/e2e/fixtures/**` stores package fixture JSON under non-manifest filenames.
- `tests/sandboxes/**/package.json` may include demo packages, but they must be listed under `devDependencies`.
- Generated vulnerable `package.json` files should be created at test time under `/tmp`, containers, or another disposable path.

## Scorecard Test Exceptions

The Scorecard workflow excludes `PinnedDependenciesID` findings for
`npmCommand not pinned by hash` when their only location is one of these files:

- `tests/e2e/Dockerfile`: pnpm compatibility tests.
- `tests/e2e/Dockerfile.pnpm-yaml`: pnpm workspace configuration tests.
- `tests/e2e/Dockerfile.yarn`: Yarn compatibility tests.

These containers use version-pinned `npm install --global` commands to exercise
package-manager compatibility. Their lack of a committed integrity hash is an
accepted exception limited to these package-manager bootstrap installs.

Container-image findings, other rules, and findings outside these files remain visible.
All E2E base images must remain pinned by digest.
The filter only changes the SARIF uploaded to GitHub code scanning; Scorecard still
publishes its complete results and score.

See [Scorecard's test Dockerfile policy](https://github.com/ossf/scorecard/blob/main/docs/faq.md#pinned-dependencies-will-scorecard-detect-unpinned-dependencies-in-tests-with-dockerfiles)
and [Pinned-Dependencies guidance](https://github.com/ossf/scorecard/blob/main/docs/checks.md#pinned-dependencies).

## Review Guidelines

When reviewing security alerts:

1. Treat production code, the root `package.json`, and lockfiles as release-blocking.
2. Investigate any committed test manifest alert with runtime scope.
3. Keep intentional vulnerable fixtures isolated to test data or generated runtime files.
