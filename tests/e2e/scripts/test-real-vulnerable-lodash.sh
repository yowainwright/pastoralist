#!/bin/bash

set -e

setup_project() {
  echo "E2E Test: Real Vulnerable Lodash Fix"
  echo "====================================="

  TEST_DIR="/tmp/pastoralist-lodash-e2e-$$"
  mkdir -p "$TEST_DIR"

  trap '
  echo "Cleaning up..."
  rm -rf "$TEST_DIR"
' EXIT

  cd "$TEST_DIR"

  echo ""
  echo "Creating test package with vulnerable lodash@4.17.15..."
  cat >package.json <<'EOF'
{
  "name": "test-vulnerable-lodash",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.15"
  }
}
EOF

  echo ""
  echo "BEFORE: package.json"
  echo "--------------------"
  cat package.json

  echo ""
}

run_security_check() {
  echo "Running: pastoralist --checkSecurity --forceSecurityRefactor --securityProvider osv"
  echo "------------------------------------------------------------------------------------"
  /pastoralist/dist/index.js --checkSecurity --forceSecurityRefactor --securityProvider osv 2>&1 || true

  echo ""
  echo "AFTER: package.json"
  echo "-------------------"
  cat package.json

  echo ""
  echo "Verifying results:"
  echo "------------------"
}

check_override() {
  if grep -q '"lodash": "4.17.21"' package.json; then
    echo "PASS: lodash override added (4.17.21)"
  else
    echo "FAIL: lodash override missing or incorrect"
    exit 1
  fi
}

check_appendix() {
  if grep -q '"appendix"' package.json; then
    echo "PASS: pastoralist.appendix exists"
  else
    echo "FAIL: appendix missing"
    exit 1
  fi
}

check_metadata() {
  if grep -q '"securityChecked": true' package.json; then
    echo "PASS: securityChecked metadata present"
  else
    echo "WARN: securityChecked not found (might be expected)"
  fi

  echo ""
  echo "Real vulnerable package test completed!"
  exit 0
}

main() {
  setup_project
  run_security_check
  check_override
  check_appendix
  check_metadata
}

main "$@"
