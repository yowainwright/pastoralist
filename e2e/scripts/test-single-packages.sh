#!/bin/bash

set -e

echo "🧪 Testing Single Package Scenarios"
echo "=================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

# Function to validate pastoralist appendix exists and has expected content
validate_appendix() {
    local package_name="$1"
    local expected_keys="$2"
    
    echo "📄 Checking package.json for $package_name:"
    cat package.json | head -40
    echo ""
    
    # Check if pastoralist section exists
    if ! grep -q "pastoralist" package.json; then
        echo "❌ Pastoralist section missing for $package_name"
        return 1
    fi
    
    # Check if appendix exists
    if ! grep -q "appendix" package.json; then
        echo "❌ Appendix missing for $package_name"
        return 1
    fi
    
    # Validate expected override keys exist in appendix
    for key in $expected_keys; do
        if ! grep -q "\"$key\":" package.json; then
            echo "❌ Expected key '$key' missing from appendix"
            return 1
        fi
    done
    
    # Validate that the root package is listed as dependent
    if ! grep -q "\"$package_name\":" package.json; then
        echo "❌ Root package '$package_name' not found as dependent"
        return 1
    fi
    
    echo "✅ Appendix validation passed for $package_name"
    return 0
}

# Test 1: NPM Overrides Single Package
echo ""
echo "1️⃣ Testing NPM Overrides Single Package..."
echo "----------------------------------------"

# Create test directory
mkdir -p /tmp/npm-single-test
cd /tmp/npm-single-test

# Copy the npm single package fixture
cp /app/e2e/fixtures/npm-single-package.json package.json

echo "Initial package.json:"
cat package.json
echo ""

# Run pastoralist
echo "Running pastoralist..."
node /app/pastoralist/index.js --debug
print_result $? "NPM single package pastoralist run"

# Validate results
validate_appendix "npm-single-test" "follow-redirects@1.14.0 cookie@0.5.0"
print_result $? "NPM single package appendix validation"

# Test 2: Yarn Resolutions Single Package
echo ""
echo "2️⃣ Testing Yarn Resolutions Single Package..."
echo "---------------------------------------------"

# Create test directory
mkdir -p /tmp/yarn-single-test
cd /tmp/yarn-single-test

# Copy the yarn single package fixture
cp /app/e2e/fixtures/yarn-single-package.json package.json

echo "Initial package.json:"
cat package.json
echo ""

# Run pastoralist
echo "Running pastoralist..."
node /app/pastoralist/index.js --debug
print_result $? "Yarn single package pastoralist run"

# Validate results
validate_appendix "yarn-single-test" "follow-redirects@1.14.0 cookie@0.5.0"
print_result $? "Yarn single package appendix validation"

# Test 3: PNPM Overrides Single Package
echo ""
echo "3️⃣ Testing PNPM Overrides Single Package..."
echo "-------------------------------------------"

# Create test directory
mkdir -p /tmp/pnpm-single-test
cd /tmp/pnpm-single-test

# Copy the pnpm single package fixture
cp /app/e2e/fixtures/pnpm-single-package.json package.json

echo "Initial package.json:"
cat package.json
echo ""

# Run pastoralist
echo "Running pastoralist..."
node /app/pastoralist/index.js --debug
print_result $? "PNPM single package pastoralist run"

# Validate results
validate_appendix "pnpm-single-test" "follow-redirects@1.14.0 cookie@0.5.0"
print_result $? "PNPM single package appendix validation"

# Test 4: Test override updates in single package
echo ""
echo "4️⃣ Testing Override Updates in Single Package..."
echo "------------------------------------------------"

cd /tmp/npm-single-test

# Update an override
echo "Updating follow-redirects from 1.14.0 to 1.15.0..."
sed -i 's/"follow-redirects": "1.14.0"/"follow-redirects": "1.15.0"/g' package.json

# Run pastoralist again
echo "Running pastoralist after override change..."
node /app/pastoralist/index.js --debug
print_result $? "NPM single package override update run"

# Validate the appendix was updated
if grep -q "follow-redirects@1.15.0" package.json; then
    echo "✅ Override update reflected in appendix"
else
    echo "❌ Override update not reflected in appendix"
    exit 1
fi

# Test 5: Test removal of overrides
echo ""
echo "5️⃣ Testing Override Removal in Single Package..."
echo "------------------------------------------------"

# Remove all overrides
echo "Removing all overrides..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.overrides;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Run pastoralist
echo "Running pastoralist after removing overrides..."
node /app/pastoralist/index.js --debug
print_result $? "NPM single package override removal run"

# Validate that pastoralist section is removed
if grep -q "pastoralist" package.json; then
    echo "❌ Pastoralist section should be removed when no overrides"
    exit 1
else
    echo "✅ Pastoralist section correctly removed when no overrides"
fi

# Test 6: Bun Overrides Single Package
echo ""
echo "6️⃣ Testing Bun Overrides Single Package..."
echo "------------------------------------------"

# Create test directory
mkdir -p /tmp/bun-single-test
cd /tmp/bun-single-test

# Copy the bun single package fixture
cp /app/e2e/fixtures/bun-single-package.json package.json

echo "Initial package.json:"
cat package.json
echo ""

# Run pastoralist (bun uses npm-style overrides)
echo "Running pastoralist..."
node /app/pastoralist/index.js --debug
print_result $? "Bun single package pastoralist run"

# Validate results
validate_appendix "bun-single-test" "follow-redirects@1.14.0 cookie@0.5.0"
print_result $? "Bun single package appendix validation"

# Test 7: Package with Patches
echo ""
echo "7️⃣ Testing Package with Patches..."
echo "----------------------------------"

# Create test directory
mkdir -p /tmp/patches-test
cd /tmp/patches-test

# Copy the fixture and patches
cp /app/e2e/fixtures/with-patches-package.json package.json
mkdir -p patches
cp /app/e2e/fixtures/patches/*.patch patches/

echo "Initial package.json:"
cat package.json
echo ""
echo "Patches directory:"
ls -la patches/
echo ""

# Run pastoralist
echo "Running pastoralist..."
node /app/pastoralist/index.js --debug
print_result $? "Patches test pastoralist run"

# Validate that patches are included in appendix
echo "📄 Checking for patches in appendix:"
cat package.json | grep -A 10 "patches"
if grep -q "patches" package.json; then
    echo "✅ Patches found in appendix"
else
    echo "❌ Patches not found in appendix"
    exit 1
fi

# Test 8: Package with PeerDependencies
echo ""
echo "8️⃣ Testing Package with PeerDependencies..."
echo "--------------------------------------------"

# Create test directory
mkdir -p /tmp/peers-test
cd /tmp/peers-test

# Copy the peers fixture
cp /app/e2e/fixtures/with-peers-package.json package.json

echo "Initial package.json:"
cat package.json
echo ""

# Run pastoralist
echo "Running pastoralist..."
node /app/pastoralist/index.js --debug
print_result $? "PeerDependencies test pastoralist run"

# Validate that peerDependency overrides are tracked in single-package projects
# In single-package projects, pastoralist tracks all overrides that relate to dependencies
# (including peerDependencies) to monitor potential conflicts
echo "📄 Checking peerDependencies handling:"
if grep -q "lodash@5.0.0" package.json; then
    echo "✅ PeerDependency override (lodash@5.0.0) tracked in appendix"
else
    echo "❌ PeerDependency override not tracked"
    exit 1
fi

if grep -q "react@18.2.0" package.json; then
    echo "✅ PeerDependency override (react@18.2.0) tracked in appendix"
else
    echo "❌ PeerDependency override not tracked"
    exit 1
fi

# Validate that both peerDependencies are included
echo "📄 Checking full appendix content:"
cat package.json | grep -A 20 "appendix"

# Test 9: Advanced Patch Management
echo ""
echo "9️⃣ Testing Advanced Patch Management..."
echo "--------------------------------------"

cd /tmp/patches-test

# Remove a dependency that has a patch
echo "Removing express dependency to test unused patch detection..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.dependencies.express;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Run pastoralist again - it should detect unused patches
echo "Running pastoralist to detect unused patches..."
node /app/pastoralist/index.js --debug 2>&1 | tee output.log
print_result $? "Unused patch detection run"

# Check if unused patch warning is shown
echo "📋 Debug output from pastoralist:"
cat output.log
echo ""

if grep -q "potentially unused patch files" output.log || grep -q "Found.*potentially unused" output.log; then
    echo "✅ Unused patch detection working"
elif grep -q "express+4.18.0.patch" output.log; then
    echo "✅ Unused patch detection working (patch file mentioned)"
else
    echo "❌ Unused patch detection not working"
    echo "Expected to find unused patch warning but got:"
    cat output.log
    exit 1
fi

echo ""
echo "🎉 All Single Package Tests Passed!"
echo "==================================="
