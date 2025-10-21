#!/bin/bash

set -e

echo "🧪 Testing Workspace Override Tracking"
echo "======================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURE_DIR="$SCRIPT_DIR/../fixtures/workspace-overrides"
TEST_DIR="/tmp/pastoralist-workspace-test-$$"

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

echo "\n1️⃣ Setting up monorepo with workspace overrides..."

cat > package.json <<'EOF'
{
  "name": "test-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": false
  }
}
EOF

mkdir -p packages/app-a packages/app-b

cat > packages/app-a/package.json <<'EOF'
{
  "name": "app-a",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.21",
    "react": "^18.0.0"
  },
  "overrides": {
    "esbuild": "^0.25.9"
  }
}
EOF

cat > packages/app-b/package.json <<'EOF'
{
  "name": "app-b",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  },
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
EOF

echo "✅ Monorepo structure created"

echo "\n2️⃣ Running pastoralist to detect workspace overrides..."
node /app/pastoralist/index.js --debug 2>&1 | tee pastoralist-output.log
print_result $? "Pastoralist execution completed"

echo "\n3️⃣ Verifying appendix was created with workspace overrides..."

if ! grep -q '"pastoralist": {' package.json; then
    echo "❌ Pastoralist section not found"
    cat package.json
    exit 1
fi

if ! grep -q '"appendix": {' package.json; then
    echo "❌ Appendix not found in root package.json"
    cat package.json
    exit 1
fi

echo "✅ Appendix created in root package.json"

echo "\n4️⃣ Checking for esbuild override in appendix..."
if grep -q '"esbuild@' package.json; then
    echo "✅ esbuild override detected"
else
    echo "❌ esbuild override not found in appendix"
    cat package.json
    exit 1
fi

echo "\n5️⃣ Checking for pg-types override in appendix..."
if grep -q '"pg-types@' package.json; then
    echo "✅ pg-types override detected"
else
    echo "❌ pg-types override not found in appendix"
    cat package.json
    exit 1
fi

echo "\n6️⃣ Verifying debug output shows workspace scanning..."
if grep -q "Found.*overrides in.*packages" pastoralist-output.log; then
    echo "✅ Debug output confirms workspace packages were scanned"
else
    echo "❌ No evidence of workspace scanning in debug output"
    cat pastoralist-output.log
    exit 1
fi

echo "\n✨ All workspace override tracking tests PASSED!"
