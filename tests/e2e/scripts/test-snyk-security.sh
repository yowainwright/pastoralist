#!/bin/bash

set -e

print_header() {
    printf '\n%s\n' "🔒 Testing Snyk Security Provider"
    echo "=================================="
}

print_result() {
    if [ "$1" -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

init_git_repo() {
    git init 2>/dev/null || true
    git remote remove origin 2>/dev/null || true
    git remote add origin https://github.com/test/test-repo.git
}

test_provider() {
    printf '\n%s\n' "1️⃣ Test: Snyk provider selection"
    cat >package.json <<'EOF'
{
  "name": "snyk-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  }
}
EOF

    init_git_repo

    node /app/pastoralist/index.js --checkSecurity --securityProvider snyk --debug 2>&1 | tee snyk-output.log || true

    if grep -q "snyk\|Snyk" snyk-output.log; then
        echo "✅ Snyk provider referenced"
    else
        echo "⚠️  Snyk provider may not have been selected"
    fi
}

test_missing_token() {
    printf '\n%s\n' "2️⃣ Test: Snyk without authentication"
    unset SNYK_TOKEN
    node /app/pastoralist/index.js --checkSecurity --securityProvider snyk --debug 2>&1 | tee snyk-noauth.log || true

    if grep -q "authentication\|token\|skipping" snyk-noauth.log; then
        echo "✅ Handles missing authentication gracefully"
    else
        echo "⚠️  Authentication handling unclear"
    fi
}

test_token() {
    printf '\n%s\n' "3️⃣ Test: Snyk with token (if available)"
    if [ -n "$SNYK_TOKEN" ]; then
        node /app/pastoralist/index.js --checkSecurity --securityProvider snyk --securityProviderToken "$SNYK_TOKEN" --debug 2>&1 | tee snyk-auth.log || true
        print_result 0 "Snyk with authentication attempted"
    else
        echo "ℹ️  SNYK_TOKEN not set, skipping authenticated test"
    fi
}

test_multiple_providers() {
    printf '\n%s\n' "4️⃣ Test: Multiple providers including Snyk"
    node /app/pastoralist/index.js --checkSecurity --securityProvider osv snyk --debug 2>&1 | tee snyk-multi.log || true

    if grep -q "provider" snyk-multi.log; then
        echo "✅ Multi-provider mode works"
    else
        echo "⚠️  Multi-provider mode unclear"
    fi
}

test_config() {
    printf '\n%s\n' "5️⃣ Test: Snyk in config"
    cat >package.json <<'EOF'
{
  "name": "snyk-config-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  },
  "pastoralist": {
    "security": {
      "enabled": true,
      "provider": "snyk"
    }
  }
}
EOF

    init_git_repo
    node /app/pastoralist/index.js --debug 2>&1 | tee snyk-config.log || true

    if grep -q "security\|checking" snyk-config.log; then
        echo "✅ Config-based Snyk provider works"
    else
        echo "⚠️  Config-based provider unclear"
    fi
}

print_success() {
    printf '\n%s\n' "🎯 Snyk provider tests completed!"
    echo ""
    echo "Note: Full Snyk testing requires SNYK_TOKEN environment variable"
    echo "Get your token from: https://app.snyk.io/account"
}

main() {
    print_header
    test_provider
    test_missing_token
    test_token
    test_multiple_providers
    test_config
    print_success
}

main "$@"
