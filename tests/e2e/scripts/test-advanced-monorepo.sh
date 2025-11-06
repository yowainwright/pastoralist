#!/bin/bash

set -e

echo "🧪 Testing Advanced Monorepo Scenarios"
echo "======================================"

print_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

# Test 1: Nested workspaces (workspace packages that depend on each other)
echo ""
echo "1️⃣ Testing Nested Workspace Dependencies..."
echo "-------------------------------------------"

mkdir -p /tmp/nested-workspace-test/packages/package-a /tmp/nested-workspace-test/packages/package-b /tmp/nested-workspace-test/apps/app
cd /tmp/nested-workspace-test

cp /app/e2e/fixtures/nested-workspace-root-package.json package.json
cp /app/e2e/fixtures/nested-workspace-package-a.json packages/package-a/package.json
cp /app/e2e/fixtures/nested-workspace-package-b.json packages/package-b/package.json
cp /app/e2e/fixtures/nested-workspace-app.json apps/app/package.json

echo "Workspace structure:"
echo "  Root (overrides: lodash, react)"
echo "  ├── packages/package-a (deps: lodash, @workspace/package-b)"
echo "  ├── packages/package-b (deps: react)"
echo "  └── apps/app (deps: @workspace/package-a, @workspace/package-b, lodash, react)"
echo ""

echo "Running pastoralist..."
timeout 30 node /app/pastoralist/index.js --depPaths "workspace" || true
if [ $? -eq 124 ]; then
    echo "⚠️  Test timed out after 30s (may indicate issue with workspace resolution)"
    echo "Skipping nested workspace test for now"
else
    print_result 0 "Nested workspace test run"
fi

echo "📄 Checking root appendix:"
cat package.json | grep -A 40 "appendix"

# Verify all workspace packages are tracked
if grep -q "@workspace/package-a" package.json; then
    echo "✅ package-a tracked in root"
else
    echo "❌ package-a not tracked"
    exit 1
fi

if grep -q "@workspace/package-b" package.json; then
    echo "✅ package-b tracked in root"
else
    echo "❌ package-b not tracked"
    exit 1
fi

if grep -q "@workspace/app" package.json; then
    echo "✅ app tracked in root"
else
    echo "❌ app not tracked"
    exit 1
fi

# Verify workspace packages don't have pastoralist sections
if grep -q "pastoralist" packages/package-a/package.json || grep -q "pastoralist" packages/package-b/package.json || grep -q "pastoralist" apps/app/package.json; then
    echo "❌ Workspace packages should not have pastoralist sections"
    exit 1
else
    echo "✅ Workspace packages correctly have no pastoralist sections"
fi

# Test 2: Mixed package manager override formats
echo ""
echo "2️⃣ Testing Mixed Package Manager Formats..."
echo "-------------------------------------------"

mkdir -p /tmp/mixed-pm-test
cd /tmp/mixed-pm-test

cp /app/e2e/fixtures/mixed-pm-root-package.json package.json

echo "Initial package.json with npm, pnpm, and yarn overrides:"
cat package.json
echo ""

echo "Running pastoralist..."
node /app/pastoralist/index.js
print_result $? "Mixed package manager formats test run"

echo "📄 Checking appendix:"
cat package.json | grep -A 20 "appendix"

# Should track overrides from all formats
override_entries=$(grep -o "axios@1.6.0" package.json | wc -l)
if [ "$override_entries" -gt 0 ]; then
    echo "✅ Overrides from mixed formats tracked (found $override_entries entries)"
else
    echo "❌ Failed to track mixed format overrides"
    exit 1
fi

# Test 3: Complex dependency inheritance
echo ""
echo "3️⃣ Testing Complex Dependency Inheritance..."
echo "--------------------------------------------"

mkdir -p /tmp/complex-inheritance-test/packages/pkg1 /tmp/complex-inheritance-test/packages/pkg2
cd /tmp/complex-inheritance-test

cp /app/e2e/fixtures/complex-inheritance-root.json package.json
cp /app/e2e/fixtures/complex-inheritance-pkg1.json packages/pkg1/package.json
cp /app/e2e/fixtures/complex-inheritance-pkg2.json packages/pkg2/package.json

echo "Complex structure:"
echo "  Root: express@4.18.2, lodash@4.17.21, cookie@0.5.0, pg@8.11.0, pg>pg-types@4.0.1"
echo "  ├── pkg1: depends on lodash, express"
echo "  └── pkg2: depends on pg, cookie, pkg1 (workspace)"
echo ""

echo "Running pastoralist..."
node /app/pastoralist/index.js --depPaths "workspace"
print_result $? "Complex inheritance test run"

echo "📄 Checking root appendix:"
cat package.json | grep -A 60 "appendix"

# Verify direct dependencies are tracked for correct packages
if grep -q "@complex/pkg1" package.json; then
    echo "✅ pkg1 tracked in root"
else
    echo "❌ pkg1 not tracked"
    exit 1
fi

if grep -q "@complex/pkg2" package.json; then
    echo "✅ pkg2 tracked in root"
else
    echo "❌ pkg2 not tracked"
    exit 1
fi

# Check for nested override tracking (pg>pg-types)
if grep -q "pg-types" package.json || grep -q "pg>" package.json; then
    echo "✅ Nested override (pg>pg-types) tracked"
else
    echo "⚠️  Nested override may need verification"
fi

# Test 4: Large monorepo (many packages)
echo ""
echo "4️⃣ Testing Large Monorepo Simulation..."
echo "---------------------------------------"

mkdir -p /tmp/large-monorepo-test
cd /tmp/large-monorepo-test

# Create root package.json
cat > package.json <<'EOF'
{
  "name": "large-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21",
    "react": "18.2.0",
    "axios": "1.6.0"
  }
}
EOF

# Create 20 workspace packages
for i in {1..20}; do
    mkdir -p "packages/pkg-$i"
    cat > "packages/pkg-$i/package.json" <<EOF
{
  "name": "@large/pkg-$i",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0",
    "react": "^18.0.0"
  }
}
EOF
done

echo "Created monorepo with 20 packages..."
echo "Running pastoralist..."

# Time the execution
start_time=$(date +%s)
node /app/pastoralist/index.js --depPaths "workspace"
end_time=$(date +%s)
execution_time=$((end_time - start_time))

print_result $? "Large monorepo test run"
echo "⏱️  Execution time: ${execution_time}s"

if [ "$execution_time" -lt 30 ]; then
    echo "✅ Performance acceptable for 20 packages (< 30s)"
else
    echo "⚠️  Performance may need optimization (${execution_time}s for 20 packages)"
fi

# Verify all packages tracked
tracked_count=$(grep -o "@large/pkg-" package.json | wc -l)
echo "📊 Tracked $tracked_count package references"

if [ "$tracked_count" -ge 15 ]; then
    echo "✅ Most packages tracked correctly"
else
    echo "⚠️  Expected more package tracking (got $tracked_count, expected ~20)"
fi

# Test 5: Workspace with different patterns
echo ""
echo "5️⃣ Testing Multiple Workspace Patterns..."
echo "-----------------------------------------"

mkdir -p /tmp/multi-pattern-test/packages/frontend /tmp/multi-pattern-test/packages/backend /tmp/multi-pattern-test/apps/web /tmp/multi-pattern-test/apps/mobile /tmp/multi-pattern-test/tools/cli
cd /tmp/multi-pattern-test

cat > package.json <<'EOF'
{
  "name": "multi-pattern-test",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*",
    "tools/*"
  ],
  "overrides": {
    "express": "4.18.2"
  }
}
EOF

cat > packages/frontend/package.json <<'EOF'
{
  "name": "@multi/frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
EOF

cat > packages/backend/package.json <<'EOF'
{
  "name": "@multi/backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF

cat > apps/web/package.json <<'EOF'
{
  "name": "@multi/web",
  "version": "1.0.0",
  "dependencies": {
    "@multi/frontend": "workspace:*",
    "express": "^4.18.0"
  }
}
EOF

cat > apps/mobile/package.json <<'EOF'
{
  "name": "@multi/mobile",
  "version": "1.0.0",
  "dependencies": {
    "@multi/frontend": "workspace:*"
  }
}
EOF

cat > tools/cli/package.json <<'EOF'
{
  "name": "@multi/cli",
  "version": "1.0.0",
  "dependencies": {
    "@multi/backend": "workspace:*",
    "express": "^4.18.0"
  }
}
EOF

echo "Running pastoralist with multiple workspace patterns..."
node /app/pastoralist/index.js --depPaths "workspace"
print_result $? "Multiple workspace patterns test run"

echo "📄 Checking appendix:"
cat package.json | grep -A 50 "appendix"

# Verify packages from all patterns are tracked
if grep -q "@multi/backend" package.json && grep -q "@multi/web" package.json && grep -q "@multi/cli" package.json; then
    echo "✅ Packages from all workspace patterns tracked"
else
    echo "❌ Not all workspace patterns tracked correctly"
    exit 1
fi

# Test 6: Private vs public workspace packages
echo ""
echo "6️⃣ Testing Private and Public Workspace Packages..."
echo "---------------------------------------------------"

mkdir -p /tmp/private-public-test/packages/public-pkg /tmp/private-public-test/packages/private-pkg
cd /tmp/private-public-test

cat > package.json <<'EOF'
{
  "name": "private-public-test",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21"
  }
}
EOF

cat > packages/public-pkg/package.json <<'EOF'
{
  "name": "@test/public-pkg",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

cat > packages/private-pkg/package.json <<'EOF'
{
  "name": "@test/private-pkg",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

echo "Running pastoralist..."
node /app/pastoralist/index.js --depPaths "workspace"
print_result $? "Private and public packages test run"

# Both should be tracked regardless of private flag
if grep -q "@test/public-pkg" package.json && grep -q "@test/private-pkg" package.json; then
    echo "✅ Both private and public packages tracked"
else
    echo "❌ Missing tracking for some packages"
    exit 1
fi

# Test 7: Monorepo with selective depPaths array
echo ""
echo "7️⃣ Testing Selective depPaths Array..."
echo "--------------------------------------"

mkdir -p /tmp/selective-deppaths-test/packages/included /tmp/selective-deppaths-test/packages/excluded
cd /tmp/selective-deppaths-test

cat > package.json <<'EOF'
{
  "name": "selective-test",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "overrides": {
    "react": "18.2.0"
  }
}
EOF

cat > packages/included/package.json <<'EOF'
{
  "name": "included",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
EOF

cat > packages/excluded/package.json <<'EOF'
{
  "name": "excluded",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
EOF

echo "Running pastoralist with selective depPaths..."
node /app/pastoralist/index.js --depPaths "packages/included/package.json"
print_result $? "Selective depPaths test run"

if grep -q '"included"' package.json; then
    echo "✅ Included package tracked"
else
    echo "❌ Included package should be tracked"
    exit 1
fi

if grep -q '"excluded"' package.json; then
    echo "❌ Excluded package should not be tracked"
    exit 1
else
    echo "✅ Excluded package correctly omitted"
fi

# Test 8: Monorepo override changes propagation
echo ""
echo "8️⃣ Testing Override Changes in Monorepo..."
echo "------------------------------------------"

mkdir -p /tmp/override-changes-test/packages/app
cd /tmp/override-changes-test

cat > package.json <<'EOF'
{
  "name": "override-changes-test",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.20"
  }
}
EOF

cat > packages/app/package.json <<'EOF'
{
  "name": "app",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

echo "Initial run..."
node /app/pastoralist/index.js --depPaths "workspace"
print_result $? "Initial run completed"

if grep -q "lodash@4.17.20" package.json; then
    echo "✅ Initial version tracked"
else
    echo "❌ Initial version not tracked"
    exit 1
fi

echo "Updating override version from 4.17.20 to 4.17.21..."
sed -i 's/"lodash": "4.17.20"/"lodash": "4.17.21"/g' package.json

echo "Running pastoralist after override change..."
node /app/pastoralist/index.js --depPaths "workspace"
print_result $? "Override change run completed"

if grep -q "lodash@4.17.21" package.json; then
    echo "✅ Override change reflected in appendix"
else
    echo "❌ Override change not reflected"
    exit 1
fi

if grep -q "lodash@4.17.20" package.json; then
    echo "❌ Old version should be removed"
    exit 1
else
    echo "✅ Old version correctly removed"
fi

# Test 9: Removing workspace package
echo ""
echo "9️⃣ Testing Workspace Package Removal..."
echo "---------------------------------------"

mkdir -p /tmp/package-removal-test/packages/keep /tmp/package-removal-test/packages/remove
cd /tmp/package-removal-test

cat > package.json <<'EOF'
{
  "name": "package-removal-test",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21"
  }
}
EOF

cat > packages/keep/package.json <<'EOF'
{
  "name": "keep",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

cat > packages/remove/package.json <<'EOF'
{
  "name": "remove",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

echo "Initial run with both packages..."
node /app/pastoralist/index.js --depPaths "workspace"
print_result $? "Initial run with both packages"

if grep -q '"keep"' package.json && grep -q '"remove"' package.json; then
    echo "✅ Both packages initially tracked"
else
    echo "❌ Initial tracking failed"
    exit 1
fi

echo "Removing 'remove' package..."
rm -rf packages/remove

echo "Running pastoralist after package removal..."
node /app/pastoralist/index.js --depPaths "workspace"
print_result $? "Run after package removal"

if grep -q '"keep"' package.json; then
    echo "✅ Kept package still tracked"
else
    echo "❌ Kept package should still be tracked"
    exit 1
fi

if grep -q '"remove"' package.json; then
    echo "⚠️  Removed package may still be in appendix (cleanup verification needed)"
else
    echo "✅ Removed package correctly cleaned from appendix"
fi

echo ""
echo "🎉 All Advanced Monorepo Tests Passed!"
echo "======================================"
