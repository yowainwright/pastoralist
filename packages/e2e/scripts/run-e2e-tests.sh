#!/bin/bash

set -e

if [ ! -f /.dockerenv ]; then
    echo "🔨 Building Pastoralist..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR/../../.."
    bun run build
    cd packages/e2e
    
    echo "🐳 Starting E2E Tests..."
    echo "========================"
    
    docker compose down --remove-orphans 2>/dev/null || true
    
    echo "📦 Building Docker containers..."
    docker compose build
    
    echo "🧪 Running E2E tests..."
    docker compose up --abort-on-container-exit e2e-test
    
    TEST_EXIT_CODE=$?
    
    echo ""
    echo "📊 Test Results:"
    echo "================"
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo "🎉 All E2E tests PASSED!"
    else
        echo "❌ E2E tests FAILED!"
        echo ""
        echo "🔍 Container logs:"
        docker compose logs e2e-test
        exit 1
    fi
    
    echo ""
    echo "🧹 Cleaning up..."
    docker compose down --remove-orphans
    
    echo ""
    echo "✨ E2E test run complete!"
    exit 0
fi

echo "🧪 Starting Pastoralist E2E Tests"
echo "================================="

print_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

show_package_json() {
    echo "📄 Current package.json:"
    echo "------------------------"
    cat package.json | head -30
    echo "------------------------"
}

echo "\n1️⃣ Initial state - showing current package.json before pastoralist"
show_package_json

echo "\n2️⃣ Running pastoralist for the first time..."
node /app/pastoralist/index.js
print_result $? "Initial pastoralist run completed"

echo "\n3️⃣ Checking if appendix was created..."
show_package_json

if grep -q '"pastoralist": {' package.json; then
    echo "✅ Pastoralist section exists"
    if grep -q '"appendix": {' package.json && grep -q '"dependents": {' package.json; then
        echo "✅ Appendix with dependents created successfully"
    else
        echo "❌ Appendix missing or malformed"
        exit 1
    fi
else
    echo "❌ Pastoralist section missing"
    exit 1
fi

echo "\n4️⃣ Testing override formats..."

cp /app/e2e/fixtures/npm-package.json package.json
echo "Testing npm overrides:"
node /app/pastoralist/index.js
print_result $? "NPM overrides test completed"
if ! grep -q '"pastoralist": {' package.json; then
    echo "❌ Pastoralist section missing for npm overrides"
    exit 1
fi

cp /app/e2e/fixtures/pnpm-package.json package.json
echo "Testing pnpm overrides:"
node /app/pastoralist/index.js
print_result $? "PNPM overrides test completed"
if ! grep -q '"pastoralist": {' package.json; then
    echo "❌ Pastoralist section missing for pnpm overrides"
    exit 1
fi

cp /app/e2e/fixtures/yarn-package.json package.json
echo "Testing yarn resolutions:"
node /app/pastoralist/index.js
print_result $? "Yarn resolutions test completed"
if ! grep -q '"pastoralist": {' package.json; then
    echo "❌ Pastoralist section missing for yarn resolutions"
    exit 1
fi

echo "\n5️⃣ Testing patch detection..."
cp /app/e2e/fixtures/with-patches-package.json package.json
mkdir -p patches
cp /app/e2e/fixtures/patches/*.patch patches/
echo "Running pastoralist with patches:"
node /app/pastoralist/index.js
print_result $? "Patch detection test completed"
if ! grep -q '"patches": \[' package.json; then
    echo "❌ Patches section missing"
    exit 1
fi

echo "\n6️⃣ Testing override removal..."
cp /app/e2e/fixtures/npm-package.json package.json
node /app/pastoralist/index.js
jq 'del(.overrides) | del(.pnpm.overrides) | del(.resolutions)' package.json > package.json.tmp && mv package.json.tmp package.json
node /app/pastoralist/index.js
if grep -q '"pastoralist": {' package.json; then
    echo "❌ Pastoralist section should be removed when no overrides"
    exit 1
fi

echo "\n7️⃣ Testing workspace package overrides..."
cp /app/e2e/fixtures/workspace-root-package.json package.json
mkdir -p packages/child
cp /app/e2e/fixtures/workspace-child-package.json packages/child/package.json

echo "Running pastoralist on child package..."
node /app/pastoralist/index.js --path packages/child/package.json

echo "📄 Checking child package.json appendix..."
if ! grep -q '"pastoralist":' packages/child/package.json; then
  echo "❌ Pastoralist section missing in child package.json"
  exit 1
fi

echo "📄 Checking root package.json not modified..."
if grep -q '"pastoralist":' package.json; then
  echo "❌ Root package.json should not have pastoralist section"
  exit 1
fi

echo "\n🔄 Running Migration Tests..."
echo "=============================="
/app/scripts/test-migration-1.3.0-to-1.4.0.sh
print_result $? "Migration test (1.3.0 to 1.4.0) completed"

echo "\n🎯 All E2E tests passed!"
echo "===================================="
