#!/bin/bash

set -e

if [ ! -f /.dockerenv ]; then
    echo "🔨 Building Pastoralist..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR/../../.."
    bun run build
    cd tests/e2e
    
    echo "🐳 Starting E2E Tests..."
    echo "========================"
    
    docker compose down --remove-orphans 2>/dev/null || true
    
    echo "📦 Building Docker containers..."
    docker compose build
    
    echo "🧪 Running E2E tests..."
    docker compose up --abort-on-container-exit e2e-pnpm

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
        docker compose logs e2e-pnpm
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

echo "\n8️⃣ Testing depPaths configuration..."
echo "======================================"

# Test 8.1: depPaths with "workspace" string
echo "Testing depPaths: 'workspace'..."
rm -rf /tmp/test-workspace
mkdir -p /tmp/test-workspace/packages/app-a /tmp/test-workspace/apps/app-b
cd /tmp/test-workspace

cat > package.json <<'EOF'
{
  "name": "test-monorepo",
  "version": "1.0.0",
  "workspaces": ["packages/*", "apps/*"],
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  }
}
EOF

cat > packages/app-a/package.json <<'EOF'
{
  "name": "app-a",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

cat > apps/app-b/package.json <<'EOF'
{
  "name": "app-b",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

node /app/pastoralist/index.js
print_result $? "depPaths workspace config completed"

if ! grep -q '"appendix":' package.json; then
    echo "❌ Appendix missing in root"
    exit 1
fi
if ! grep -q '"app-a":' package.json || ! grep -q '"app-b":' package.json; then
    echo "❌ Workspace packages not tracked in appendix"
    exit 1
fi
if grep -q '"pastoralist":' packages/app-a/package.json || grep -q '"pastoralist":' apps/app-b/package.json; then
    echo "❌ Workspace packages should not have pastoralist section"
    exit 1
fi
echo "✅ depPaths workspace configuration works correctly"

# Test 8.2: depPaths with array
echo "Testing depPaths with array..."
rm -rf /tmp/test-array
mkdir -p /tmp/test-array/packages/app-c /tmp/test-array/packages/app-d
cd /tmp/test-array

cat > package.json <<'EOF'
{
  "name": "test-monorepo",
  "version": "1.0.0",
  "overrides": {
    "react": "18.2.0"
  },
  "pastoralist": {
    "depPaths": ["packages/app-c/package.json"]
  }
}
EOF

cat > packages/app-c/package.json <<'EOF'
{
  "name": "app-c",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
EOF

cat > packages/app-d/package.json <<'EOF'
{
  "name": "app-d",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
EOF

node /app/pastoralist/index.js
print_result $? "depPaths array config completed"

if ! grep -q '"app-c":' package.json; then
    echo "❌ Specified package not tracked"
    exit 1
fi
if grep -q '"app-d":' package.json; then
    echo "❌ Non-specified package should not be tracked"
    exit 1
fi
echo "✅ depPaths array configuration works correctly"

# Test 8.3: CLI priority over config
echo "Testing CLI depPaths priority..."
rm -rf /tmp/test-priority
mkdir -p /tmp/test-priority/packages/app-e /tmp/test-priority/packages/app-f
cd /tmp/test-priority

cat > package.json <<'EOF'
{
  "name": "test-monorepo",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  }
}
EOF

cat > packages/app-e/package.json <<'EOF'
{
  "name": "app-e",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

cat > packages/app-f/package.json <<'EOF'
{
  "name": "app-f",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

node /app/pastoralist/index.js --depPaths "packages/app-e/package.json"
print_result $? "CLI depPaths override completed"

if ! grep -q '"app-e":' package.json; then
    echo "❌ CLI-specified package not tracked"
    exit 1
fi
if grep -q '"app-f":' package.json; then
    echo "❌ CLI should override workspace config"
    exit 1
fi
echo "✅ CLI depPaths correctly overrides config"

cd /app/e2e

echo "\n🔒 Running Security Feature Tests..."
echo "=============================="
/app/scripts/test-security-features.sh
print_result $? "Security feature tests completed"

echo "\n🎬 Running Init Command Tests..."
echo "=============================="
/app/scripts/test-init-command.sh
print_result $? "Init command tests completed"

echo "\n⚙️  Running Interactive Config Review Tests..."
echo "=============================="
/app/scripts/test-interactive-config.sh
print_result $? "Interactive config review tests completed"

echo "\n🔐 Running Snyk Security Provider Tests..."
echo "=============================="
/app/scripts/test-snyk-security.sh
print_result $? "Snyk security provider tests completed"

echo "\n🔌 Running Socket Security Provider Tests..."
echo "=============================="
/app/scripts/test-socket-security.sh
print_result $? "Socket security provider tests completed"

echo "\n🚨 Running Error Handling & Edge Cases Tests..."
echo "=============================="
/app/scripts/test-error-handling.sh
print_result $? "Error handling tests completed"

echo "\n🎛️  Running CLI Flags & Options Tests..."
echo "=============================="
/app/scripts/test-cli-flags.sh
print_result $? "CLI flags tests completed"

echo "\n📝 Running RC File Suggestion Tests..."
echo "=============================="
/app/scripts/test-rc-file-suggestion.sh
print_result $? "RC file suggestion tests completed"

echo "\n🎯 All E2E tests passed!"
echo "===================================="
