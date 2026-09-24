#!/bin/bash

set -e

setup_project() {
  echo "🧪 E2E Test: Security Appendix Population"
  echo "=========================================="

  TEST_DIR="/tmp/pastoralist-appendix-e2e-$$"
  mkdir -p "$TEST_DIR"

  trap '
  echo "🧹 Cleaning up..."
  rm -rf "$TEST_DIR"
' EXIT

  cd "$TEST_DIR"

  echo ""
  echo "Creating test package.json..."
  cat >package.json <<'EOF'
{
  "name": "appendix-e2e-test",
  "version": "1.0.0",
  "dependencies": {
    "test-dep": "1.0.0"
  }
}
EOF

  echo ""
  echo "📝 BEFORE: package.json WITHOUT security appendix"
  echo "---------------------------------------------------"
  cat package.json

  echo ""
  echo ""
}

run_security_check() {
  echo "🔒 Running: pastoralist --checkSecurity --isIRLFix --forceSecurityRefactor"
  echo "--------------------------------------------------------------------------"
  /pastoralist/dist/index.js --checkSecurity --isIRLFix --forceSecurityRefactor >output.log 2>&1 || true

  echo ""
  echo "📝 AFTER: package.json WITH security appendix"
  echo "----------------------------------------------"
  cat package.json

  echo ""
  echo ""
  echo "✅ Verifying Fix:"
  echo "-----------------"
}

check_override() {
  # Check 1: Override was added
  if grep -q '"fake-pastoralist-check-2": "2.1.0"' package.json; then
    echo "✅ PASS: Override added to package.json"
  else
    echo "❌ FAIL: Override missing"
    cat package.json
    exit 1
  fi
}

check_appendix() {
  # Check 2: Appendix exists
  if grep -q '"appendix"' package.json; then
    echo "✅ PASS: pastoralist.appendix field exists"
  else
    echo "❌ FAIL: appendix field missing"
    cat package.json
    exit 1
  fi
}

check_security() {
  # Check 3: Security metadata in appendix
  if grep -q '"securityChecked": true' package.json; then
    echo "✅ PASS: securityChecked metadata present"
  else
    echo "❌ FAIL: securityChecked missing"
    exit 1
  fi
}

check_provider() {
  # Check 4: Security provider tracked
  if grep -q '"securityProvider"' package.json; then
    echo "✅ PASS: securityProvider tracked"
  else
    echo "❌ FAIL: securityProvider missing"
    exit 1
  fi
}

check_date() {
  # Check 5: Security check date tracked
  if grep -q '"securityCheckDate"' package.json; then
    echo "✅ PASS: securityCheckDate tracked"
  else
    echo "❌ FAIL: securityCheckDate missing"
    exit 1
  fi

  echo ""
}

print_success() {
  echo "🎉 All security appendix E2E checks passed!"
  echo ""
  echo "This proves the fix for Issue #2:"
  echo "  ✓ Security alerts are now added to pastoralist.appendix"
  echo "  ✓ Ledger includes securityChecked, provider, and date"
  echo "  ✓ Override tracking works end-to-end"

  exit 0
}

main() {
  setup_project
  run_security_check
  check_override
  check_appendix
  check_security
  check_provider
  check_date
  print_success
}

main "$@"
