#!/bin/bash

set -e

has_appendix_entry() {
  jq -e --arg key "$1" '.pastoralist.appendix | has($key)' package.json >/dev/null
}

malformed_package_missing() {
  [ ! -f package.json ]
}

malformed_package_modified() {
  ! diff package.json /app/e2e/fixtures/malformed-package.json >/dev/null
}

invalid_json_report_missing() {
  ! grep -Fq "Invalid JSON at:" output.log
}

missing_package_error_missing() {
  ! grep -Fq "Unable to read JSON at:" output.log
}

appendix_entry_missing() {
  ! has_appendix_entry "$1"
}

has_matching_runs() {
  diff package-first-normalized.json package-second-normalized.json && diff package-second-normalized.json package-third-normalized.json
}

has_nested_override() {
  grep -q "pg-types@4.0.1" package.json || grep -q "pg>pg-types" package.json
}

print_header() {
  echo "🧪 Testing Error Handling & Edge Cases"
  echo "======================================"
}

print_result() {
  if [ "$1" -eq 0 ]; then
    echo "✅ $2"
  else
    echo "❌ $2"
    exit 1
  fi
}

check_malformed_json() {
  if malformed_package_missing; then
    echo "❌ Malformed package.json was deleted or moved"
    exit 1
  fi

  if malformed_package_modified; then
    echo "❌ Malformed package.json was modified"
    exit 1
  fi

  if invalid_json_report_missing; then
    echo "❌ Invalid JSON was not reported"
    cat output.log
    exit 1
  fi

  echo "✅ Invalid JSON was reported and the file stayed unchanged"
}

test_malformed_json() {
  # Test 1: Malformed JSON handling
  echo ""
  echo "1️⃣ Testing Malformed JSON Handling..."
  echo "-------------------------------------"

  mkdir -p /tmp/malformed-test
  cd /tmp/malformed-test

  cp /app/e2e/fixtures/malformed-package.json package.json

  echo "Running pastoralist with malformed JSON..."
  node /app/pastoralist/index.js >output.log 2>&1 || true

  # Pastoralist should handle malformed JSON gracefully without crashing
  check_malformed_json
}

test_empty_package() {
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
  fi
  echo "✅ No pastoralist section added to empty package"
}

test_missing_package() {
  # Test 3: Missing package.json
  echo ""
  echo "3️⃣ Testing Missing package.json..."
  echo "----------------------------------"

  mkdir -p /tmp/missing-test
  cd /tmp/missing-test

  echo "Running pastoralist without package.json..."
  node /app/pastoralist/index.js >output.log 2>&1 || true

  if [ -f package.json ]; then
    echo "❌ Pastoralist created a package.json that was missing"
    exit 1
  fi

  if missing_package_error_missing; then
    echo "❌ Missing package.json was not reported"
    cat output.log
    exit 1
  fi

  echo "✅ Missing package.json was reported and stayed absent"
}

check_scoped_packages() {
  echo "📄 Checking for scoped packages in appendix:"
  grep -A 20 "appendix" package.json

  if has_appendix_entry "@types/node@20.10.0"; then
    echo "✅ Scoped package @types/node tracked correctly"
  else
    echo "❌ Scoped package @types/node not tracked"
    exit 1
  fi

  if has_appendix_entry "@babel/core@7.23.0"; then
    echo "✅ Scoped package @babel/core tracked correctly"
  else
    echo "❌ Scoped package @babel/core not tracked"
    exit 1
  fi
}

test_scoped_packages() {
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

  check_scoped_packages
}

check_beta_version() {
  if has_appendix_entry "typescript@5.4.0-beta"; then
    echo "✅ Pre-release version (beta) handled correctly"
  else
    echo "❌ Beta version not tracked"
    exit 1
  fi
}

check_prerelease_versions() {
  echo "📄 Checking for pre-release versions in appendix:"
  grep -A 30 "appendix" package.json

  if has_appendix_entry "react@18.3.0-next.1"; then
    echo "✅ Pre-release version (next) handled correctly"
  else
    echo "❌ Pre-release version not tracked"
    exit 1
  fi

  if has_appendix_entry "next@14.1.0-canary.0"; then
    echo "✅ Pre-release version (canary) handled correctly"
  else
    echo "❌ Canary version not tracked"
    exit 1
  fi

  check_beta_version
}

test_prerelease_versions() {
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

  check_prerelease_versions
}

test_nested_overrides() {
  # Test 7: Nested dependency overrides (pg > pg-types format)
  echo ""
  echo "7️⃣ Testing Nested Dependency Overrides..."
  echo "-----------------------------------------"

  mkdir -p /tmp/nested-override-test
  cd /tmp/nested-override-test

  cat >package.json <<'EOF'
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
  grep -A 30 "appendix" package.json

  if has_nested_override; then
    echo "✅ Nested dependency override tracked"
  else
    echo "❌ Nested dependency override was not tracked"
    exit 1
  fi
}

check_idempotency() {
  echo "Comparing results (ignoring timestamps)..."
  # Remove timestamps before comparison
  jq 'del(.pastoralist.appendix | .. | .ledger?.addedDate?, .ledger?.updatedDate?)' package-first.json >package-first-normalized.json
  jq 'del(.pastoralist.appendix | .. | .ledger?.addedDate?, .ledger?.updatedDate?)' package-second.json >package-second-normalized.json
  jq 'del(.pastoralist.appendix | .. | .ledger?.addedDate?, .ledger?.updatedDate?)' package-third.json >package-third-normalized.json

  if has_matching_runs; then
    echo "✅ Idempotent - multiple runs produce identical results (excluding timestamps)"
  else
    echo "❌ Multiple runs produced different results"
    echo "Differences between runs:"
    diff package-first-normalized.json package-second-normalized.json || true
    exit 1
  fi
}

run_idempotency() {
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

  check_idempotency
}

test_idempotency() {
  # Test 8: Idempotency - running multiple times
  echo ""
  echo "8️⃣ Testing Idempotency (Multiple Runs)..."
  echo "-----------------------------------------"

  mkdir -p /tmp/idempotency-test
  cd /tmp/idempotency-test

  cp /app/e2e/fixtures/npm-single-package.json package.json

  run_idempotency
}

test_multiple_overrides() {
  # Test 9: Multiple direct overrides
  echo ""
  echo "9️⃣ Testing Multiple Direct Overrides..."
  echo "--------------------------------------"

  mkdir -p /tmp/long-chain-test
  cd /tmp/long-chain-test

  cat >package.json <<'EOF'
{
  "name": "long-chain-test",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "express": "^4.18.0",
    "axios": "^1.6.0",
    "lodash": "^4.17.0",
    "moment": "^2.29.0",
    "follow-redirects": "^1.15.0",
    "cookie": "^0.5.0",
    "qs": "^6.11.0",
    "debug": "^4.3.4",
    "ms": "^2.1.3"
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

  echo "Running pastoralist with ten direct overrides..."
  node /app/pastoralist/index.js
  print_result $? "Multiple override test run"

  expected_overrides=(
    "react@18.2.0"
    "express@4.18.2"
    "axios@1.6.2"
    "lodash@4.17.21"
    "moment@2.29.4"
    "follow-redirects@1.15.4"
    "cookie@0.5.0"
    "qs@6.11.0"
    "debug@4.3.4"
    "ms@2.1.3"
  )
  for override_key in "${expected_overrides[@]}"; do
    if appendix_entry_missing "$override_key"; then
      echo "❌ Missing appendix entry: $override_key"
      exit 1
    fi
  done
  echo "✅ All ten direct overrides were tracked"
}

test_unicode() {
  # Test 10: Unicode and special characters in reasons
  echo ""
  echo "🔟 Testing Unicode and Special Characters..."
  echo "-------------------------------------------"

  mkdir -p /tmp/unicode-test
  cd /tmp/unicode-test

  cat >package.json <<'EOF'
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
      "react@18.2.0": {
        "dependents": { "unicode-test": "react@^17.0.0" },
        "ledger": {
          "addedDate": "2024-01-01T00:00:00.000Z",
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

  if jq -e '.pastoralist.appendix["react@18.2.0"].dependents["unicode-test"] == "react@^18.0.0" and .pastoralist.appendix["react@18.2.0"].ledger.reason == "Testing 中文 and émojis 🚀 and symbols: @#$%"' package.json >/dev/null; then
    echo "✅ Unicode characters preserved correctly"
  else
    echo "❌ Unicode characters were not preserved"
    exit 1
  fi

  echo ""
}

print_success() {
  echo "🎉 All Error Handling & Edge Case Tests Passed!"
  echo "==============================================="
}

main() {
  print_header
  test_malformed_json
  test_empty_package
  test_missing_package
  test_scoped_packages
  test_prerelease_versions
  test_nested_overrides
  test_idempotency
  test_multiple_overrides
  test_unicode
  print_success
}

main "$@"
