#!/bin/bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cli="${PASTORALIST_E2E_CLI:-$script_dir/../../../dist/index.js}"
test_root="${PASTORALIST_E2E_ROOT:-$script_dir/../tmp/top-level-mgrs}"
managers="${PASTORALIST_E2E_MANAGERS:-npm pnpm yarn bun}"
registry="https://registry.npmjs.org"
project_root=""

export CI=true
export IS_DEBUGGING=false
export npm_config_manage_package_manager_versions=false
export npm_config_cache="$test_root/npm-cache"
export BUN_INSTALL_CACHE_DIR="$test_root/bun-cache"

cleanup() {
  test -z "$project_root" || rm -rf "$project_root"
}

trap cleanup EXIT

install_deps() {
  case "$1" in
  npm) npm install --ignore-scripts --registry="$registry" --no-audit --no-fund ;;
  pnpm) pnpm install --ignore-scripts --registry="$registry" --ignore-pnpmfile --no-frozen-lockfile --store-dir "$test_root/pnpm-store" ;;
  yarn) yarn install --ignore-scripts --registry="$registry" --non-interactive --cache-folder "$test_root/yarn-cache" ;;
  bun) bun install --ignore-scripts --registry="$registry" ;;
  esac
}

override_field() {
  case "$1" in
  yarn) echo "resolutions" ;;
  *) echo "overrides" ;;
  esac
}

create_project() {
  manager="${1:?manager required}"
  version="$("$manager" --version)"
  field="$(override_field "$manager")"
  mkdir -p docs
  jq -n --arg name "top-$manager-root" --arg manager "$manager@$version" --arg field "$field" \
    '{name: $name, version: "1.0.0", private: true, packageManager: $manager, workspaces: ["docs"], devDependencies: {braces: "3.0.3"}} | .[$field] = {"is-number": "7.0.0"}' \
    >package.json
  jq -n --arg name "top-$manager-docs" \
    '{name: $name, version: "1.0.0", private: true, dependencies: {"is-odd": "3.0.1"}}' \
    >docs/package.json
  if [ "$manager" = "pnpm" ]; then
    jq 'del(.workspaces, .overrides)' package.json >package.next.json
    mv package.next.json package.json
    printf 'packages:\n  - docs\noverrides:\n  is-number: 7.0.0\n' >pnpm-workspace.yaml
  fi
}

run_cli() {
  node "$cli" --quiet --no-cache
}

dependent() {
  jq -r --arg who "$1" '.pastoralist.appendix["is-number@7.0.0"].dependents[$who]' package.json
}

check_root() {
  test "$(dependent "top-$1-root")" = "is-number (required by braces)"
}

check_workspace() {
  test "$(dependent "top-$1-docs")" = "is-number (required by is-odd)"
}

check_stable() {
  cp package.json package.once.json
  run_cli
  cmp package.once.json package.json
  rm package.once.json
}

run_manager() {
  manager="${1:?manager required}"
  echo "Checking top-level dependents with $manager"
  mkdir -p "$test_root"
  project_root="$(mktemp -d "$test_root/$manager-XXXXXX")"
  cd "$project_root"
  create_project "$manager"
  install_deps "$manager"
  run_cli
  check_root "$manager"
  check_workspace "$manager"
  check_stable
  cd "$script_dir"
  cleanup
  project_root=""
}

main() {
  for manager in $managers; do
    run_manager "$manager"
  done
  echo "top-level dependents E2E passed"
}

main "$@"
