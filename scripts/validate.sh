#!/bin/sh
set -e

pnpm run check:test-manifests
pnpm run typecheck-src
pnpm run lint
pnpm run test:unit

if [ "$1" != "--full" ]; then
  exit 0
fi

pnpm run test:e2e
pnpm run test:bench
