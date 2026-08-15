#!/bin/bash

set -e

cd "$(dirname "$0")/../.."

echo "Running benchmarks..."
node --no-warnings \
  --import ./tests/unit/setup.ts \
  --test \
  --test-timeout=30000 \
  'tests/benchmarks/*.test.ts'
