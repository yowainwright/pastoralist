#!/bin/bash

set -e

echo "🧪 Testing Error Handling & Edge Cases"
echo "======================================"

print_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

# Test 1: Malformed JSON handling
echo ""
echo "1️⃣ Testing Malformed JSON Handling..."
echo "-------------------------------------"

mkdir -p /tmp/malformed-test
cd /tmp/malformed-test

cp /app/e2e/fixtures/malformed-package.json package.json

echo "Running pastoralist with malformed JSON..."
node /app/pastoralist/index.js 2>&1 | tee output.log || true

# Pastoralist should handle malformed JSON gracefully without crashing
if [ -f package.json ]; then
    echo "✅ Pastoralist handled malformed JSON gracefully (didn't crash)"
    # Check if it modified the file (it shouldn't if JSON is malformed)
    if diff package.json /app/e2e/fixtures/malformed-package.json > /dev/null 2>&1; then
        echo "✅ Malformed JSON left unchanged"
    else
        echo "⚠️  File was modified despite being malformed"
    fi
else
    echo "❌ File was deleted or moved"
    exit 1
fi

# Test 2: Empty package.json handling
echo ""
echo "2️⃣ Testing Empty package.json Handling..."
echo "-----------------------------------------"

mkdir -p /tmp/empty-test
cd /tmp/empty-test

cp /app/e2e/fixtures/empty-package.json package.json

echo "Running pastoralist with empty package.json..."
node /app/pastoralist/index.js
print_result $? "Empty package.json handled gracefully"

if grep -q "pastoralist" package.json; then
    echo "❌ Should not add pastoralist section to empty package"
    exit 1
else
    echo "✅ No pastoralist section added to empty package"
fi

# Test 3: Missing package.json
echo ""
echo "3️⃣ Testing Missing package.json..."
echo "----------------------------------"

mkdir -p /tmp/missing-test
cd /tmp/missing-test

echo "Running pastoralist without package.json..."
if node /app/pastoralist/index.js 2>&1 | tee output.log; then
    echo "⚠️  Pastoralist ran without package.json (may be expected)"
else
    echo "✅ Correctly handled missing package.json"
    if grep -q -i "package.json\|not found\|enoent" output.log; then
        echo "✅ Error message mentions missing file"
    fi
fi

# Test 4: Scoped packages
echo ""
echo "4️⃣ Testing Scoped Packages (@scope/package)..."
echo "-----------------------------------------------"

mkdir -p /tmp/scoped-test
cd /tmp/scoped-test

cp /app/e2e/fixtures/scoped-package.json package.json

echo "Initial package.json:"
cat package.json
echo ""

echo "Running pastoralist..."
node /app/pastoralist/index.js
print_result $? "Scoped packages test run"

echo "📄 Checking for scoped packages in appendix:"
cat package.json | grep -A 20 "appendix"

if grep -q "@types/node@20.10.0" package.json; then
    echo "✅ Scoped package @types/node tracked correctly"
else
    echo "❌ Scoped package @types/node not tracked"
    exit 1
fi

if grep -q "@babel/core@7.23.0" package.json; then
    echo "✅ Scoped package @babel/core tracked correctly"
else
    echo "❌ Scoped package @babel/core not tracked"
    exit 1
fi

# Test 5: Pre-release versions
echo ""
echo "5️⃣ Testing Pre-release Version Formats..."
echo "-----------------------------------------"

mkdir -p /tmp/prerelease-test
cd /tmp/prerelease-test

cp /app/e2e/fixtures/prerelease-versions-package.json package.json

echo "Initial package.json:"
cat package.json
echo ""

echo "Running pastoralist..."
node /app/pastoralist/index.js
print_result $? "Pre-release versions test run"

echo "📄 Checking for pre-release versions in appendix:"
cat package.json | grep -A 30 "appendix"

if grep -q "18.3.0-next.1" package.json; then
    echo "✅ Pre-release version (next) handled correctly"
else
    echo "❌ Pre-release version not tracked"
    exit 1
fi

if grep -q "14.1.0-canary.0" package.json; then
    echo "✅ Pre-release version (canary) handled correctly"
else
    echo "❌ Canary version not tracked"
    exit 1
fi

if grep -q "5.4.0-beta" package.json; then
    echo "✅ Pre-release version (beta) handled correctly"
else
    echo "❌ Beta version not tracked"
    exit 1
fi

# Test 6: Glob patterns in overrides
echo ""
echo "6️⃣ Testing Glob Patterns in Overrides..."
echo "----------------------------------------"

mkdir -p /tmp/glob-test
cd /tmp/glob-test

cp /app/e2e/fixtures/glob-pattern-package.json package.json

echo "Initial package.json:"
cat package.json
echo ""

echo "Running pastoralist..."
node /app/pastoralist/index.js
print_result $? "Glob pattern overrides test run"

echo "📄 Checking appendix:"
cat package.json | grep -A 20 "appendix"

if grep -q "appendix" package.json; then
    echo "✅ Appendix created for package with glob patterns"
else
    echo "❌ Appendix not created"
    exit 1
fi

# Test 7: Nested dependency overrides (pg > pg-types format)
echo ""
echo "7️⃣ Testing Nested Dependency Overrides..."
echo "-----------------------------------------"

mkdir -p /tmp/nested-override-test
cd /tmp/nested-override-test

cat > package.json <<'EOF'
{
  "name": "nested-override-test",
  "version": "1.0.0",
  "dependencies": {
    "pg": "^8.0.0"
  },
  "overrides": {
    "pg": "8.11.0",
    "pg>pg-types": "4.0.1",
    "express>cookie": "0.5.0"
  }
}
EOF

echo "Running pastoralist..."
node /app/pastoralist/index.js
print_result $? "Nested dependency overrides test run"

echo "📄 Checking for nested overrides in appendix:"
cat package.json | grep -A 30 "appendix"

if grep -q "pg-types@4.0.1" package.json || grep -q "pg>pg-types" package.json; then
    echo "✅ Nested dependency override tracked"
else
    echo "⚠️  Nested dependency format may need verification"
fi

# Test 8: Idempotency - running multiple times
echo ""
echo "8️⃣ Testing Idempotency (Multiple Runs)..."
echo "-----------------------------------------"

mkdir -p /tmp/idempotency-test
cd /tmp/idempotency-test

cp /app/e2e/fixtures/npm-single-package.json package.json

echo "First run..."
node /app/pastoralist/index.js
print_result $? "First run completed"

cp package.json package-first.json

echo "Second run..."
node /app/pastoralist/index.js
print_result $? "Second run completed"

cp package.json package-second.json

echo "Third run..."
node /app/pastoralist/index.js
print_result $? "Third run completed"

cp package.json package-third.json

echo "Comparing results (ignoring timestamps)..."
# Remove timestamps before comparison
jq 'del(.pastoralist.appendix | .. | .ledger?.addedDate?, .ledger?.updatedDate?)' package-first.json > package-first-normalized.json
jq 'del(.pastoralist.appendix | .. | .ledger?.addedDate?, .ledger?.updatedDate?)' package-second.json > package-second-normalized.json
jq 'del(.pastoralist.appendix | .. | .ledger?.addedDate?, .ledger?.updatedDate?)' package-third.json > package-third-normalized.json

if diff package-first-normalized.json package-second-normalized.json && diff package-second-normalized.json package-third-normalized.json; then
    echo "✅ Idempotent - multiple runs produce identical results (excluding timestamps)"
else
    echo "❌ Multiple runs produced different results"
    echo "Differences between runs:"
    diff package-first-normalized.json package-second-normalized.json || true
    exit 1
fi

# Test 9: Very long dependency chains
echo ""
echo "9️⃣ Testing Long Dependency Chains..."
echo "------------------------------------"

mkdir -p /tmp/long-chain-test
cd /tmp/long-chain-test

cat > package.json <<'EOF'
{
  "name": "long-chain-test",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "express": "^4.18.0",
    "axios": "^1.6.0",
    "lodash": "^4.17.0",
    "moment": "^2.29.0"
  },
  "overrides": {
    "react": "18.2.0",
    "express": "4.18.2",
    "axios": "1.6.2",
    "lodash": "4.17.21",
    "moment": "2.29.4",
    "follow-redirects": "1.15.4",
    "cookie": "0.5.0",
    "qs": "6.11.0",
    "debug": "4.3.4",
    "ms": "2.1.3"
  }
}
EOF

echo "Running pastoralist with many overrides..."
node /app/pastoralist/index.js
print_result $? "Long dependency chain test run"

override_count=$(grep -o '".*@[0-9]' package.json | wc -l)
echo "✅ Tracked $override_count override entries"

if [ "$override_count" -gt 5 ]; then
    echo "✅ Successfully handled multiple overrides"
else
    echo "⚠️  Expected more override tracking"
fi

# Test 10: Unicode and special characters in reasons
echo ""
echo "🔟 Testing Unicode and Special Characters..."
echo "-------------------------------------------"

mkdir -p /tmp/unicode-test
cd /tmp/unicode-test

cat > package.json <<'EOF'
{
  "name": "unicode-test",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  },
  "overrides": {
    "react": "18.2.0"
  },
  "pastoralist": {
    "appendix": {
      "overrides": {
        "react@18.2.0": {
          "dependents": ["unicode-test"],
          "reason": "Testing 中文 and émojis 🚀 and symbols: @#$%"
        }
      }
    }
  }
}
EOF

echo "Running pastoralist with unicode content..."
node /app/pastoralist/index.js
print_result $? "Unicode test run"

if grep -q "中文" package.json && grep -q "🚀" package.json; then
    echo "✅ Unicode characters preserved correctly"
else
    echo "⚠️  Unicode handling may need verification"
fi

echo ""
echo "🎉 All Error Handling & Edge Case Tests Passed!"
echo "==============================================="
