#!/bin/sh
set -eu

main() {
  status=0
  find scripts tests/benchmarks tests/e2e/scripts -type f -name '*.sh' -exec shellcheck -- {} + || status=$?
  shellcheck-legibility check --config scripts/.shellcheck-legibilityrc \
    scripts tests/benchmarks tests/e2e/scripts || status=$?
  return "$status"
}

main "$@"
