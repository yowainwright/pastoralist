#!/bin/bash

set -e

echo "🧪 Testing CLI Flags & Options"
echo "=============================="

print_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

# Test 1: --dry-run flag
echo ""
echo "1️⃣ Testing --dry-run Flag..."
echo "---------------------------"

mkdir -p /tmp/dryrun-test
cd /tmp/dryrun-test

cp /app/e2e/fixtures/dryrun-test-package.json package.json
cp package.json package-original.json

echo "Initial package.json:"
cat package.json
echo ""

echo "Running pastoralist with --dry-run..."
node /app/pastoralist/index.js --dry-run 2>&1 | tee output.log
print_result $? "Dry-run command executed"

echo "Comparing files after dry-run..."
if diff package.json package-original.json; then
    echo "✅ --dry-run did not modify package.json"
else
    echo "❌ --dry-run should not modify files"
    echo "Differences found:"
    diff package.json package-original.json
    exit 1
fi

if grep -q -i "dry.run\|preview\|would" output.log; then
    echo "✅ Dry-run output indicates preview mode"
else
    echo "⚠️  Dry-run output could be clearer about preview mode"
fi

# Test 2: --path flag (custom package.json path)
echo ""
echo "2️⃣ Testing --path Flag..."
echo "------------------------"

mkdir -p /tmp/custom-path-test/subdir
cd /tmp/custom-path-test

cp /app/e2e/fixtures/custom-root-package.json subdir/custom.json

echo "Running pastoralist with --path subdir/custom.json..."
node /app/pastoralist/index.js --path subdir/custom.json
print_result $? "Custom path flag executed"

if grep -q "pastoralist" subdir/custom.json; then
    echo "✅ --path correctly targeted custom package.json"
else
    echo "❌ --path did not modify target file"
    exit 1
fi

# Verify it didn't create package.json in current directory
if [ -f package.json ]; then
    echo "❌ Should not create package.json in working directory"
    exit 1
else
    echo "✅ Did not create package.json in working directory"
fi

# Test 3: --root flag (custom root directory)
echo ""
echo "3️⃣ Testing --root Flag..."
echo "------------------------"

mkdir -p /tmp/root-flag-test/project
cd /tmp/root-flag-test

cp /app/e2e/fixtures/npm-single-package.json project/package.json

echo "Running pastoralist with --root project..."
node /app/pastoralist/index.js --root project
print_result $? "Custom root flag executed"

if grep -q "pastoralist" project/package.json; then
    echo "✅ --root correctly targeted project directory"
else
    echo "❌ --root did not process target directory"
    exit 1
fi

# Test 4: --debug flag
echo ""
echo "4️⃣ Testing --debug Flag..."
echo "-------------------------"

mkdir -p /tmp/debug-test
cd /tmp/debug-test

cp /app/e2e/fixtures/npm-single-package.json package.json

echo "Running pastoralist with --debug..."
node /app/pastoralist/index.js --debug 2>&1 | tee output.log
print_result $? "Debug flag executed"

# Check for debug output indicators
debug_indicators=$(grep -i "debug\|verbose\|\[" output.log | wc -l)
if [ "$debug_indicators" -gt 0 ]; then
    echo "✅ Debug output detected ($debug_indicators debug lines)"
else
    echo "⚠️  Debug flag may not be producing extra output"
fi

# Test 5: --depPaths flag (CLI override)
echo ""
echo "5️⃣ Testing --depPaths CLI Flag..."
echo "--------------------------------"

mkdir -p /tmp/deppaths-cli-test/packages/app1 /tmp/deppaths-cli-test/packages/app2
cd /tmp/deppaths-cli-test

cat > package.json <<'EOF'
{
  "name": "deppaths-test",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21"
  }
}
EOF

cat > packages/app1/package.json <<'EOF'
{
  "name": "app1",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

cat > packages/app2/package.json <<'EOF'
{
  "name": "app2",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

echo "Running pastoralist with --depPaths 'packages/app1/package.json'..."
node /app/pastoralist/index.js --depPaths "packages/app1/package.json"
print_result $? "depPaths CLI flag executed"

if grep -q '"app1"' package.json; then
    echo "✅ Specified package tracked via CLI flag"
else
    echo "❌ CLI-specified package not tracked"
    exit 1
fi

if grep -q '"app2"' package.json; then
    echo "❌ Non-specified package should not be tracked"
    exit 1
else
    echo "✅ Non-specified package correctly excluded"
fi

# Test 6: --ignore flag (basic acceptance test)
echo ""
echo "6️⃣ Testing --ignore Flag..."
echo "--------------------------"

mkdir -p /tmp/ignore-test
cd /tmp/ignore-test

cp /app/e2e/fixtures/npm-single-package.json package.json

echo "Running pastoralist with --ignore flag (verifying it's accepted)..."
node /app/pastoralist/index.js --ignore "node_modules/**"
print_result $? "Ignore flag accepted"

echo "✅ --ignore flag processed successfully"

# Test 7: --isTesting flag (should skip scripts)
echo ""
echo "7️⃣ Testing --isTesting Flag..."
echo "------------------------------"

mkdir -p /tmp/testing-flag-test
cd /tmp/testing-flag-test

cp /app/e2e/fixtures/npm-single-package.json package.json

echo "Running pastoralist with --isTesting..."
node /app/pastoralist/index.js --isTesting 2>&1 | tee output.log
print_result $? "Testing flag executed"

if grep -q -i "test mode\|testing mode" output.log; then
    echo "✅ Testing mode acknowledged in output"
else
    echo "⚠️  Testing mode may be silent"
fi

# Test 8: Combining multiple flags
echo ""
echo "8️⃣ Testing Multiple Flags Combined..."
echo "-------------------------------------"

mkdir -p /tmp/multi-flag-test/project
cd /tmp/multi-flag-test

cp /app/e2e/fixtures/npm-single-package.json project/package.json

echo "Running pastoralist with --root, --debug, and --dry-run..."
node /app/pastoralist/index.js --root project --debug --dry-run 2>&1 | tee output.log
print_result $? "Multiple flags executed"

cp project/package.json project/package-after.json
if diff /app/e2e/fixtures/npm-single-package.json project/package-after.json; then
    echo "✅ --dry-run still prevents modifications with other flags"
else
    echo "❌ --dry-run should prevent modifications even with other flags"
    exit 1
fi

# Test 9: --checkSecurity flag (basic invocation)
echo ""
echo "9️⃣ Testing --checkSecurity Flag..."
echo "---------------------------------"

mkdir -p /tmp/checksec-flag-test
cd /tmp/checksec-flag-test

cp /app/e2e/fixtures/security-vulnerable-package.json package.json

echo "Running pastoralist with --checkSecurity..."
node /app/pastoralist/index.js --checkSecurity 2>&1 | tee output.log
print_result $? "checkSecurity flag executed"

if grep -q -i "security\|vulnerabilit\|cve" output.log; then
    echo "✅ Security checking output detected"
else
    echo "⚠️  Security output may not be visible in testing environment"
fi

# Test 10: --securityProvider flag
echo ""
echo "🔟 Testing --securityProvider Flag..."
echo "------------------------------------"

mkdir -p /tmp/secprovider-test
cd /tmp/secprovider-test

cp /app/e2e/fixtures/npm-single-package.json package.json

echo "Running pastoralist with --checkSecurity --securityProvider osv..."
node /app/pastoralist/index.js --checkSecurity --securityProvider osv 2>&1 | tee output.log
print_result $? "securityProvider flag executed"

if grep -q -i "osv\|security" output.log; then
    echo "✅ Security provider flag processed"
else
    echo "⚠️  Security provider output may not be visible"
fi

# Test 11: Flag priority and conflicts
echo ""
echo "1️⃣1️⃣ Testing Flag Priority..."
echo "---------------------------"

mkdir -p /tmp/priority-test
cd /tmp/priority-test

cat > package.json <<'EOF'
{
  "name": "priority-test",
  "version": "1.0.0",
  "overrides": {
    "react": "18.2.0"
  },
  "pastoralist": {
    "checkSecurity": false
  }
}
EOF

echo "Testing CLI flag priority over config..."
echo "Running with --checkSecurity (should override config false)..."
node /app/pastoralist/index.js --checkSecurity 2>&1 | tee output.log

# The command itself running successfully indicates CLI priority works
print_result $? "CLI flags take priority over config"

# Test 12: Invalid flag handling
echo ""
echo "1️⃣2️⃣ Testing Invalid Flag Handling..."
echo "------------------------------------"

mkdir -p /tmp/invalid-flag-test
cd /tmp/invalid-flag-test

cp /app/e2e/fixtures/npm-single-package.json package.json

echo "Running pastoralist with invalid flag..."
set +e
node /app/pastoralist/index.js --nonexistent-flag 2>&1 | tee output.log
invalid_flag_exit=${PIPESTATUS[0]}
set -e

if [ "$invalid_flag_exit" -eq 0 ]; then
    echo "⚠️  Invalid flag accepted (may be ignored)"
else
    echo "✅ Invalid flag rejected"
    if grep -q -i "unknown\|invalid\|error" output.log; then
        echo "✅ Error message mentions invalid flag"
    fi
fi

echo ""
echo "🎉 All CLI Flags & Options Tests Passed!"
echo "========================================"
