#!/bin/bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cli="${PASTORALIST_E2E_CLI:-$script_dir/../../../dist/index.js}"
project_dir="$(mktemp -d)"
old_date="2022-06-13T19:05:47-07:00"
kept_date="2026-06-28T00:00:00.000Z"

cleanup() {
    rm -rf "$project_dir"
}

trap cleanup EXIT

write_manifest() {
    cat >"$project_dir/package.json" <<JSON
{
  "name": "refresh-e2e",
  "version": "1.0.0",
  "packageManager": "pnpm@12.2.1",
  "devDependencies": { "release-it": "21.1.0" },
  "pastoralist": {
    "appendix": {
      "undici@7.28.0": {
        "dependents": { "refresh-e2e": "undici (required by release-it)" },
        "ledger": { "addedDate": "$kept_date" }
      },
      "undici@7.29.0": {
        "dependents": { "refresh-e2e": "undici (required by release-it)" },
        "ledger": { "addedDate": "$kept_date" }
      },
      "undici@7.30.0": {
        "dependents": {
          "refresh-e2e": "undici (required by release-it)",
          "refresh-e2e-docs": "undici (required by shadcn)"
        },
        "ledger": { "addedDate": "$old_date" }
      },
      "postcss@8.5.18": {
        "dependents": { "refresh-e2e": "postcss (required by release-it)" },
        "ledger": { "addedDate": "$kept_date" }
      },
      "postcss@8.5.23": {
        "dependents": {
          "refresh-e2e": "postcss (required by release-it)",
          "gone": "stale dependent"
        },
        "ledger": { "addedDate": "$old_date" }
      },
      "vite@8.2.1": {
        "dependents": { "refresh-e2e": "vite (unused override)" },
        "ledger": { "addedDate": "$kept_date" }
      },
      "lodash@4.17.20": {
        "dependents": { "refresh-e2e": "lodash (kept)" },
        "ledger": { "addedDate": "$kept_date", "keep": true }
      }
    }
  }
}
JSON
}

write_lockfile() {
    cat >"$project_dir/pnpm-lock.yaml" <<'YAML'
lockfileVersion: '9.0'
importers:
  .:
    devDependencies:
      release-it:
        specifier: 21.1.0
        version: 21.1.0
  docs:
    dependencies:
      shadcn:
        specifier: 4.21.0
        version: 4.21.0
      vite:
        specifier: ^8.2.1
        version: 8.2.1
packages:
  release-it@21.1.0: {}
  shadcn@4.21.0: {}
  vite@8.2.1: {}
  undici@7.30.0: {}
  postcss@8.5.23: {}
  nanoid@3.3.18: {}
snapshots:
  release-it@21.1.0:
    dependencies:
      undici: 7.30.0
      postcss: 8.5.23
  shadcn@4.21.0:
    dependencies:
      undici: 7.30.0
      postcss: 8.5.23
  vite@8.2.1:
    dependencies:
      postcss: 8.5.23
  postcss@8.5.23:
    dependencies:
      nanoid: 3.3.18
  undici@7.30.0: {}
  nanoid@3.3.18: {}
YAML
}

write_workspace() {
    cat >"$project_dir/pnpm-workspace.yaml" <<'YAML'
packages:
  - docs
overrides:
  undici: 7.30.0
  postcss: 8.5.23
  nanoid: 3.3.18
  vite: 8.2.1
YAML
    mkdir -p "$project_dir/docs"
    cat >"$project_dir/docs/package.json" <<'JSON'
{
  "name": "refresh-e2e-docs",
  "version": "1.0.0",
  "private": true,
  "dependencies": { "shadcn": "4.21.0", "vite": "^8.2.1" }
}
JSON
}

run_cli() {
    cd "$project_dir"
    IS_DEBUGGING=false NODE_OPTIONS='' node "$cli" --quiet --no-cache
}

check_keys() {
    keys="$(jq -r '.pastoralist.appendix | keys | join(",")' package.json)"
    expected="lodash@4.17.20,nanoid@3.3.18,postcss@8.5.23,undici@7.30.0,vite@8.2.1"
    test "$keys" = "$expected"
}

check_keep() {
    jq -e '.pastoralist.appendix["lodash@4.17.20"].ledger.keep == true' package.json >/dev/null
}

check_unchanged_dates() {
    date="$(jq -r '.pastoralist.appendix["undici@7.30.0"].ledger.addedDate' package.json)"
    test "$date" = "$old_date"
}

is_recent() {
    key="${1:?key required}"
    added="$(jq -r --arg key "$key" '.pastoralist.appendix[$key].ledger.addedDate' package.json)"
    node -e 'const age = Date.now() - new Date(process.argv[1]).getTime(); process.exit(age >= 0 && age < 60000 ? 0 : 1)' "$added"
}

check_new_key_date() {
    is_recent "nanoid@3.3.18"
}

check_updated_dates() {
    is_recent "postcss@8.5.23"
    is_recent "vite@8.2.1"
}

check_dependents() {
    jq -e '.pastoralist.appendix["undici@7.30.0"].dependents == {"refresh-e2e": "undici (required by release-it)", "refresh-e2e-docs": "undici (required by shadcn)"}' package.json >/dev/null
    jq -e '.pastoralist.appendix["postcss@8.5.23"].dependents == {"refresh-e2e": "postcss (required by release-it)", "refresh-e2e-docs": "postcss (required by shadcn, vite)"}' package.json >/dev/null
    jq -e '.pastoralist.appendix["nanoid@3.3.18"].dependents == {"refresh-e2e": "nanoid (required by release-it)", "refresh-e2e-docs": "nanoid (required by shadcn, vite)"}' package.json >/dev/null
    jq -e '.pastoralist.appendix["vite@8.2.1"].dependents == {"refresh-e2e-docs": "vite@^8.2.1"}' package.json >/dev/null
}

main() {
    write_manifest
    write_lockfile
    write_workspace
    run_cli
    check_keys
    check_keep
    check_unchanged_dates
    check_new_key_date
    check_updated_dates
    check_dependents
    echo "appendix refresh E2E passed"
}

main "$@"
