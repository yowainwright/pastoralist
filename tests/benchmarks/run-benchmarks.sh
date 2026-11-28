#!/bin/bash

set -e

main() {
  cd "$(dirname "$0")/../.."

  echo "Running benchmarks..."
  pnpm run build
  node --no-warnings \
    --import ./tests/unit/setup.ts \
    --test \
    --test-concurrency=1 \
    --test-timeout=30000 \
    'tests/benchmarks/*.test.ts'
}

main "$@"
