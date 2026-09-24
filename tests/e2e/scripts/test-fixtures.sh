#!/bin/bash

set -e

setup_project() {
  echo "🧪 E2E Test: Test Fixtures"
  echo "=========================="

  TEST_DIR="/tmp/pastoralist-test-fixtures-$$"
  mkdir -p "$TEST_DIR"

  trap '
  echo "🧹 Cleaning up test directory..."
  rm -rf "$TEST_DIR"
' EXIT

  cd "$TEST_DIR"

  cp /pastoralist/tests/e2e/fixtures/test-fixtures-package.json ./package.json

  echo ""
}

check_fixable_metadata() {
  if grep -q "CVE-FAKE-PASTORALIST-2024-0001" output.txt; then
    echo "✅ PASS: Found CVE-FAKE-PASTORALIST-2024-0001"
  else
    echo "❌ FAIL: CVE not found in output"
    cat output.txt
    exit 1
  fi

  if grep -q "critical" output.txt; then
    echo "✅ PASS: Found critical severity"
  else
    echo "❌ FAIL: Severity not found"
    cat output.txt
    exit 1
  fi

  echo ""
}

test_fixable_alert() {
  echo "📝 Testing --isIRLFix flag (resolvable alert)..."
  /pastoralist/dist/index.js --checkSecurity --isIRLFix >output.txt 2>&1 || true

  if grep -q "fake-pastoralist-check-2" output.txt; then
    echo "✅ PASS: Found fake-pastoralist-check-2 alert"
  else
    echo "❌ FAIL: fake-pastoralist-check-2 alert not found"
    cat output.txt
    exit 1
  fi

  check_fixable_metadata
}

check_unfixable_metadata() {
  if grep -q "CVE-FAKE-PASTORALIST-2024-0002" output2.txt; then
    echo "✅ PASS: Found CVE-FAKE-PASTORALIST-2024-0002"
  else
    echo "❌ FAIL: CVE not found in output"
    cat output2.txt
    exit 1
  fi

  if grep -q "No fix available" output2.txt; then
    echo "✅ PASS: Correctly shows no fix available"
  else
    echo "❌ FAIL: 'No fix available' not found"
    cat output2.txt
    exit 1
  fi

  echo ""
}

test_unfixable_alert() {
  echo "📝 Testing --isIRLCatch flag (non-fixable alert)..."
  cp /pastoralist/tests/e2e/fixtures/test-fixtures-package.json ./package.json
  /pastoralist/dist/index.js --checkSecurity --isIRLCatch >output2.txt 2>&1 || true

  if grep -q "fake-pastoralist-check-4" output2.txt; then
    echo "✅ PASS: Found fake-pastoralist-check-4 alert"
  else
    echo "❌ FAIL: fake-pastoralist-check-4 alert not found"
    cat output2.txt
    exit 1
  fi

  check_unfixable_metadata
}

test_both_flags() {
  echo "📝 Testing both flags together..."
  cp /pastoralist/tests/e2e/fixtures/test-fixtures-package.json ./package.json
  /pastoralist/dist/index.js --checkSecurity --isIRLFix --isIRLCatch >output3.txt 2>&1 || true

  ALERT_COUNT=$(grep -c "fake-pastoralist-check" output3.txt || echo "0")

  if [ "$ALERT_COUNT" -ge 2 ]; then
    echo "✅ PASS: Found both fixture alerts"
  else
    echo "❌ FAIL: Expected at least 2 alerts, found $ALERT_COUNT"
    cat output3.txt
    exit 1
  fi

  echo ""
}

check_override() {
  if grep -q '"fake-pastoralist-check-2": "2.1.0"' package.json; then
    echo "✅ PASS: Override added to package.json"
  else
    echo "❌ FAIL: Override not added to package.json"
    cat package.json
    exit 1
  fi
}

check_appendix_entry() {
  if grep -q "fake-pastoralist-check-2@2.1.0" package.json; then
    echo "✅ PASS: Appendix entry created"
  else
    echo "❌ FAIL: Appendix entry not created"
    cat package.json
    exit 1
  fi
}

check_security_metadata() {
  if grep -q "securityChecked" package.json; then
    echo "✅ PASS: Security ledger metadata added"
  else
    echo "❌ FAIL: Security metadata missing"
    cat package.json
    exit 1
  fi
}

check_appendix() {
  if [ -f package.json ]; then
    check_override
    check_appendix_entry
    check_security_metadata
  else
    echo "❌ FAIL: package.json not found"
    exit 1
  fi
  echo ""
}

test_appendix() {
  echo "📝 Testing appendix creation with --isIRLFix --forceSecurityRefactor..."
  cp /pastoralist/tests/e2e/fixtures/test-fixtures-package.json ./package.json
  /pastoralist/dist/index.js --checkSecurity --isIRLFix --forceSecurityRefactor >output4.txt 2>&1 || true

  check_appendix
}

print_success() {
  echo "🎉 All test fixture E2E tests passed!"
  exit 0
}

main() {
  setup_project
  test_fixable_alert
  test_unfixable_alert
  test_both_flags
  test_appendix
  print_success
}

main "$@"
