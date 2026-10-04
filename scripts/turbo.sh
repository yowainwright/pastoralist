#!/bin/sh
set -eu

main() {
  PASTORALIST_RUNTIME=$(node -p '[process.version, process.platform, process.arch].join("-")')
  export PASTORALIST_RUNTIME

  exec turbo run "$@"
}

main "$@"
