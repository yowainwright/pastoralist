#!/bin/bash

set -euo pipefail

runtime=/app/tests/interactive.sh
export IS_DEBUGGING=false

main() {
  for manager in npm pnpm yarn bun; do
    run_manager "$manager"
  done
}

run_manager() {
  local manager="${1:?manager required}"
  for scenario in clean overrides patches security; do
    run_case "$manager" "$scenario"
  done
}

run_case() {
  export PACKAGE_MANAGER="${1:?manager required}" E2E_SCENARIO="${2:?scenario required}"
  cd /app/e2e
  rm -rf interactive interactive-baseline
  bash "$runtime" init
  cd /app/e2e/interactive
  verify_dependencies
  verify_cli
  verify_scripts_disabled
  verify_reset
  printf 'PASS: %s/%s\n' "$PACKAGE_MANAGER" "$E2E_SCENARIO"
}

verify_cli() {
  local result
  result="$(pastoralist --outputFormat json)"
  printf '%s\n' "$result" | jq -e '.success == true' >/dev/null
  pastoralist --version
}

verify_scripts_disabled() {
  jq '.scripts.postinstall = "touch lifecycle-ran"' package.json >package.next.json
  mv package.next.json package.json
  e2e-install
  test ! -e lifecycle-ran
}

verify_reset() {
  printf 'session edit\n' >session-created.txt
  rm package.json
  e2e-reset
  test ! -e session-created.txt
  test ! -e lifecycle-ran
  cmp package.json /app/e2e/interactive-baseline/package.json
  local differences
  differences="$(e2e-diff)"
  test -z "$differences"
  verify_dependencies
}

verify_dependencies() {
  if [ "$E2E_SCENARIO" = security ]; then
    node -e 'require("node:assert/strict").equal(require("lodash/package.json").version, "4.17.15")'
    return
  fi
  local expected=7.0.0
  if [ "$E2E_SCENARIO" = clean ]; then expected=6.0.0; fi
  node -e 'const {createRequire} = require("node:module");
    const parent = createRequire(require.resolve("is-odd/package.json"));
    require("node:assert/strict").equal(parent("is-number/package.json").version, process.argv[1]);' "$expected"
  if [ "$E2E_SCENARIO" = patches ]; then
    node -e 'require("node:assert/strict").equal(require("is-odd").e2e, true)'
  fi
}

main "$@"
