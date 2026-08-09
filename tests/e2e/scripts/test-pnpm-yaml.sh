#!/bin/bash

set -euo pipefail

project_dir="/tmp/pastoralist-pnpm-yaml-e2e"
mkdir -p "$project_dir"
cp /app/fixtures/package.json "$project_dir/package.json"
cp /app/fixtures/pnpm-workspace.yaml "$project_dir/pnpm-workspace.yaml"
cp "$project_dir/pnpm-workspace.yaml" "$project_dir/pnpm-workspace.before.yaml"
cd "$project_dir"

pnpm_version="$(pnpm --version)"
test "${pnpm_version%%.*}" = "11"

pnpm install

installed_lodash="$(node -p "require('./node_modules/lodash/package.json').version")"
test "$installed_lodash" = "4.17.21"
cmp pnpm-workspace.before.yaml pnpm-workspace.yaml
jq -e '.pastoralist.appendix["lodash@4.17.21"]' package.json >/dev/null
jq -e '(.pnpm.overrides // null) == null' package.json >/dev/null

output="$(node /app/pastoralist/index.js --dry-run --outputFormat json)"
result="$(printf '%s\n' "$output" | tail -n 1)"
test "$(printf '%s' "$result" | jq -r '.overrideCount')" = "1"
test "$(printf '%s' "$result" | jq -r '.appliedOverrides.lodash')" = "4.17.21"

echo "pnpm YAML override E2E passed"
