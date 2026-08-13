#!/bin/sh

set -e

pnpm install
pnpm --dir app install
pnpm run build
pnpm run test:unit

echo "Setup complete. Run pnpm run dev:link to use pastoralist globally."
