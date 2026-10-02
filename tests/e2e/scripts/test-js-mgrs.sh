#!/bin/bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cli="${PASTORALIST_E2E_CLI:-$script_dir/../../../dist/index.js}"
test_root="${PASTORALIST_E2E_ROOT:-$script_dir/../tmp/js-mgrs}"
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

lockfile_for() {
  case "$1" in
  npm) echo "package-lock.json" ;;
  pnpm) echo "pnpm-lock.yaml" ;;
  yarn) echo "yarn.lock" ;;
  bun) echo "bun.lock" ;;
  esac
}

install_deps() {
  case "$1" in
  npm) npm install --ignore-scripts --registry="$registry" --no-audit --no-fund ;;
  pnpm) pnpm install --ignore-scripts --registry="$registry" --ignore-pnpmfile --no-frozen-lockfile --store-dir "$test_root/pnpm-store" ;;
  yarn) yarn install --ignore-scripts --registry="$registry" --non-interactive --cache-folder "$test_root/yarn-cache" ;;
  bun) bun install --ignore-scripts --registry="$registry" ;;
  esac
}

installed_version() {
  node --eval '
const { createRequire } = require("node:module");
const parentRequire = createRequire(require.resolve("is-odd/package.json"));
process.stdout.write(parentRequire("is-number/package.json").version);
'
}

create_project() {
  manager="${1:?manager required}"
  version="$("$manager" --version)"
  jq -n --arg name "pastoralist-$manager-e2e" --arg manager "$manager@$version" \
    '{name: $name, version: "1.0.0", private: true, packageManager: $manager, devDependencies: {"is-odd": "3.0.1"}}' \
    >package.json
  test "$manager" != "pnpm" || printf 'packages: []\n' >pnpm-workspace.yaml
}

add_override() {
  manager="${1:?manager required}"
  if [ "$manager" = "pnpm" ]; then
    printf '# Keep this comment\npackages: []\noverrides:\n  is-number: 7.0.0\n' >pnpm-workspace.yaml
    return
  fi
  field="overrides"
  test "$manager" != "yarn" || field="resolutions"
  jq --arg field "$field" '.[$field] = {"is-number": "7.0.0"}' package.json >package.next.json
  mv package.next.json package.json
}

tracked_files() {
  manager="${1:?manager required}"
  echo "package.json $(lockfile_for "$manager")"
  test "$manager" != "pnpm" || echo "pnpm-workspace.yaml"
}

snapshot() {
  destination="${1:?destination required}"
  mkdir -p "$destination"
  for file in $(tracked_files "$manager"); do
    cp "$file" "$destination/$file"
  done
}

assert_unchanged() {
  destination="${1:?destination required}"
  for file in $(tracked_files "$manager"); do
    cmp "$destination/$file" "$file"
  done
}

run_cli() {
  output="$(node "$cli" --outputFormat json --cache-dir "$PWD/.cache" "$@")"
  result="$(printf '%s\n' "$output" | sed $'s/\x1b\\[[0-9;]*[A-Za-z]//g' | tail -n 1)"
  printf '%s' "$result" | jq -e '.success == true and .overrideCount == 1 and .appliedOverrides["is-number"] == "7.0.0"' >/dev/null
}

verify_cli() {
  manager="${1:?manager required}"
  snapshot .before
  run_cli --dry-run
  assert_unchanged .before
  run_cli
  snapshot .after
  jq -e '.pastoralist.appendix["is-number@7.0.0"]' package.json >/dev/null
  cmp ".before/$(lockfile_for "$manager")" "$(lockfile_for "$manager")"
  test "$manager" != "pnpm" || cmp .before/pnpm-workspace.yaml pnpm-workspace.yaml
  run_cli
  assert_unchanged .after
  test "$(installed_version)" = "7.0.0"
}

run_manager() {
  manager="${1:?manager required}"
  echo "Checking native $manager overrides"
  mkdir -p "$test_root"
  project_root="$(mktemp -d "$test_root/$manager-XXXXXX")"
  cd "$project_root"
  create_project "$manager"
  install_deps "$manager"
  test "$(installed_version)" = "6.0.0"
  add_override "$manager"
  install_deps "$manager"
  test "$(installed_version)" = "7.0.0"
  verify_cli "$manager"
  cd "$script_dir"
  cleanup
  project_root=""
}

main() {
  for manager in $managers; do
    run_manager "$manager"
  done
  echo "JS package manager E2E passed"
  "$script_dir/test-top-level-mgrs.sh"
}

main "$@"
