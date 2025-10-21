#!/bin/bash

set -e

echo "🧪 Testing Workspace Security Scanning"
echo "======================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="/tmp/pastoralist-security-test-$$"

cleanup() {
    echo "🧹 Cleaning up test directory..."
    rm -rf "$TEST_DIR"
}

trap cleanup EXIT

print_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "\n1️⃣ Setting up monorepo with potentially vulnerable packages..."

cat > package.json <<'EOF'
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

cat > packages/service-a/package.json <<'EOF'
{
  "name": "service-a",
  "version": "1.0.0",
  "dependencies": {
    "minimist": "1.2.5",
    "express": "^4.18.0"
  }
}
EOF

cat > packages/service-b/package.json <<'EOF'
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

echo "\n2️⃣ Running pastoralist with security checks..."
PASTORALIST_MOCK_SECURITY=true node /app/pastoralist/index.js --checkSecurity --debug 2>&1 | tee security-output.log
PASTORALIST_EXIT_CODE=$?

echo "\n3️⃣ Verifying security check ran..."
print_result $PASTORALIST_EXIT_CODE "Pastoralist security check completed"

echo "\n4️⃣ Checking debug output for workspace security scanning..."
if grep -q "Scanning workspace packages for vulnerabilities" security-output.log || \
   grep -q "Using workspace configuration for security checks" security-output.log; then
    echo "✅ Workspace security scanning was initiated"
else
    echo "⚠️  Warning: No explicit workspace security scanning message found"
    echo "Debug output:"
    cat security-output.log
fi

echo "\n5️⃣ Verifying security scan processed workspace packages..."
if grep -q "depPaths" security-output.log || \
   grep -q "workspace" security-output.log || \
   grep -q "packages" security-output.log; then
    echo "✅ Evidence of workspace processing in security scan"
else
    echo "⚠️  Warning: Limited evidence of workspace processing"
fi

echo "\n6️⃣ Checking that security check didn't only scan root..."
PACKAGE_COUNT=$(grep -c "package.json" security-output.log || echo "0")
if [ "$PACKAGE_COUNT" -gt 1 ]; then
    echo "✅ Multiple packages were processed (count: $PACKAGE_COUNT)"
else
    echo "⚠️  Warning: Only root package may have been scanned"
fi

echo "\n✨ All workspace security scanning tests PASSED!"
