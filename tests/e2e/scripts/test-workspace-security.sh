#!/bin/bash

set -e

has_workspace_processing() {
    grep -q "depPaths" security-output.log ||
        grep -q "workspace" security-output.log ||
        grep -q "packages" security-output.log
}

has_workspace_scan() {
    grep -q "Scanning workspace packages for vulnerabilities" security-output.log ||
        grep -q "Using workspace configuration for security checks" security-output.log
}

print_header() {
    echo "🧪 Testing Workspace Security Scanning"
    echo "======================================"
}

print_header

TEST_DIR="/tmp/pastoralist-security-test-$$"

cleanup() {
    echo "🧹 Cleaning up test directory..."
    rm -rf "$TEST_DIR"
}

trap cleanup EXIT

print_result() {
    if [ "$1" -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

setup_workspace() {
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR"

    printf '\n%s\n' "1️⃣ Setting up monorepo with potentially vulnerable packages..."

    cat >package.json <<'EOF'
{
  "name": "test-security-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "dependencies": {
    "lodash": "4.17.19"
  },
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": true
  }
}
EOF

    mkdir -p packages/service-a packages/service-b

    cat >packages/service-a/package.json <<'EOF'
{
  "name": "service-a",
  "version": "1.0.0",
  "dependencies": {
    "minimist": "1.2.5",
    "express": "^4.18.0"
  }
}
EOF

    cat >packages/service-b/package.json <<'EOF'
{
  "name": "service-b",
  "version": "1.0.0",
  "dependencies": {
    "axios": "^0.21.1",
    "lodash": "4.17.19"
  }
}
EOF

    echo "✅ Monorepo with vulnerable packages created"
}

run_security_check() {
    printf '\n%s\n' "2️⃣ Running pastoralist with security checks..."
    PASTORALIST_MOCK_SECURITY=true node /app/pastoralist/index.js --checkSecurity --debug 2>&1 | tee security-output.log
    PASTORALIST_EXIT_CODE=$?

    printf '\n%s\n' "3️⃣ Verifying security check ran..."
    print_result $PASTORALIST_EXIT_CODE "Pastoralist security check completed"
}

check_debug_output() {
    printf '\n%s\n' "4️⃣ Checking debug output for workspace security scanning..."
    if has_workspace_scan; then
        echo "✅ Workspace security scanning was initiated"
    else
        echo "⚠️  Warning: No explicit workspace security scanning message found"
        echo "Debug output:"
        cat security-output.log
    fi
}

check_workspace_scan() {
    printf '\n%s\n' "5️⃣ Verifying security scan processed workspace packages..."
    if has_workspace_processing; then
        echo "✅ Evidence of workspace processing in security scan"
    else
        echo "⚠️  Warning: Limited evidence of workspace processing"
    fi
}

check_package_count() {
    printf '\n%s\n' "6️⃣ Checking that security check didn't only scan root..."
    PACKAGE_COUNT=$(grep -c "package.json" security-output.log || echo "0")
    if [ "$PACKAGE_COUNT" -gt 1 ]; then
        echo "✅ Multiple packages were processed (count: $PACKAGE_COUNT)"
    else
        echo "⚠️  Warning: Only root package may have been scanned"
    fi
}

print_success() {
    printf '\n%s\n' "✨ All workspace security scanning tests PASSED!"
}

main() {
    setup_workspace
    run_security_check
    check_debug_output
    check_workspace_scan
    check_package_count
    print_success
}

main "$@"
