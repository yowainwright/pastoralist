#!/bin/bash

set -e
set -o pipefail

has_appendix() {
  grep -q '"pastoralist": {' package.json && grep -q '"appendix": {' package.json
}

print_header() {
  printf '\n%s\n' "🔒 Testing Security Features"
  echo "============================"
}

print_result() {
  if [ "$1" -eq 0 ]; then
    echo "✅ $2"
  else
    echo "❌ $2"
    exit 1
  fi
}

# Initialize git for security tests (needed for GitHub provider)
init_git_repo() {
  git init 2>/dev/null || true
  git remote remove origin 2>/dev/null || true
  git remote add origin https://github.com/test/test-repo.git
}

assert_mock_provider_ran() {
  output_file="${1:?Output file is required}"
  if grep -q "Using mock Dependabot alerts" "$output_file"; then
    return 0
  fi
  echo "❌ GitHub mock provider did not run"
  cat "$output_file"
  exit 1
}

test_default_security() {
  printf '\n%s\n' "1️⃣ Test: Security disabled by default"
  cp /app/e2e/fixtures/security-vulnerable-package.json package.json
  init_git_repo
  node /app/pastoralist/index.js
  if grep -q '"lodash": "4.17.21"' package.json; then
    echo "❌ Security should not run by default"
    exit 1
  fi
  print_result 0 "Security disabled by default"
}

test_security_flag() {
  printf '\n%s\n' "2️⃣ Test: Security check with --checkSecurity flag"
  cp /app/e2e/fixtures/security-vulnerable-package.json package.json
  init_git_repo

  # Mock the GitHub API response for testing
  export PASTORALIST_MOCK_SECURITY=true
  export MOCK_ALERTS_FILE=/app/e2e/fixtures/mock-dependabot-alerts.json

  node /app/pastoralist/index.js --checkSecurity --securityProvider github --no-cache --debug 2>&1 | tee security-output.log
  assert_mock_provider_ran security-output.log
  echo "✅ Security check used the GitHub mock provider"
}

test_disabled_config() {
  printf '\n%s\n' "3️⃣ Test: Security config from package.json (disabled)"
  cp /app/e2e/fixtures/security-disabled-package.json package.json
  init_git_repo
  node /app/pastoralist/index.js --debug 2>&1 | tee disabled-output.log

  if grep -q "checking for security" disabled-output.log; then
    echo "❌ Security ran when explicitly disabled"
    exit 1
  fi
  print_result 0 "Security respects disabled config"
}

test_enabled_config() {
  printf '\n%s\n' "4️⃣ Test: Security config from package.json (enabled)"
  cp /app/e2e/fixtures/security-config-package.json package.json
  init_git_repo

  # Use mock for predictable testing
  export PASTORALIST_MOCK_SECURITY=true
  node /app/pastoralist/index.js --no-cache --debug 2>&1 | tee enabled-output.log

  assert_mock_provider_ran enabled-output.log
  echo "✅ Security enabled via config"
}

test_cli_priority() {
  printf '\n%s\n' "5️⃣ Test: CLI options override config"
  cp /app/e2e/fixtures/security-disabled-package.json package.json
  init_git_repo

  # CLI flag should override config
  PASTORALIST_MOCK_SECURITY=true node /app/pastoralist/index.js --checkSecurity --securityProvider github --no-cache --debug 2>&1 | tee override-output.log
  assert_mock_provider_ran override-output.log
  echo "✅ CLI options override config"
}

test_appendix() {
  printf '\n%s\n' "6️⃣ Test: Security doesn't break existing functionality"
  cat >package.json <<'EOF'
{
  "name": "normal-function-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  },
  "overrides": {
    "lodash": "4.17.21"
  }
}
EOF

  init_git_repo
  node /app/pastoralist/index.js
  print_result $? "Normal pastoralist run completed"

  if has_appendix; then
    echo "✅ Appendix created correctly"
  else
    echo "❌ Normal functionality broken"
    exit 1
  fi
}

test_existing_overrides() {
  printf '\n%s\n' "7️⃣ Test: Security with existing overrides"
  cat >package.json <<'EOF'
{
  "name": "merge-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20",
    "express": "4.18.0"
  },
  "overrides": {
    "express": "4.18.2"
  }
}
EOF

  init_git_repo
  node /app/pastoralist/index.js

  # Check existing override is preserved
  if grep -q '"express": "4.18.2"' package.json; then
    echo "✅ Existing overrides preserved"
  else
    echo "❌ Existing overrides lost"
    exit 1
  fi
}

test_forced_refactor() {
  printf '\n%s\n' "8️⃣ Test: Force security refactor option"
  cp /app/e2e/fixtures/security-vulnerable-package.json package.json
  init_git_repo

  # Use mock and force refactor
  export PASTORALIST_MOCK_SECURITY=true
  export MOCK_FORCE_VULNERABLE=true # Force mock to return vulnerable packages

  PASTORALIST_MOCK_SECURITY=true node /app/pastoralist/index.js --checkSecurity --securityProvider github --forceSecurityRefactor --no-cache --debug 2>&1 | tee force-output.log
  assert_mock_provider_ran force-output.log
  echo "✅ Force refactor option used the GitHub mock provider"
}

print_success() {
  printf '\n%s\n' "🎯 Security feature tests completed!"
}

main() {
  print_header
  test_default_security
  test_security_flag
  test_disabled_config
  test_enabled_config
  test_cli_priority
  test_appendix
  test_existing_overrides
  test_forced_refactor
  print_success
}

main "$@"
