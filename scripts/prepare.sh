#!/bin/sh

if [ "$CI" = "true" ] || [ "$CI" = "1" ]; then
  echo "CI environment detected, skipping git hooks installation"
  exit 0
fi

if command -v bun >/dev/null 2>&1; then
  bun run scripts/install-hooks.ts
else
  echo "Bun not found, skipping git hooks installation"
  exit 0
fi
