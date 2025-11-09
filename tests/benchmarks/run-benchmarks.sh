#!/bin/bash

set -e

cd "$(dirname "$0")/../.."

echo "Running benchmarks..."
bun test tests/benchmarks/*.test.ts --timeout 30000
