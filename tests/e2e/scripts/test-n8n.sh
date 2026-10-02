#!/bin/bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cli="${PASTORALIST_E2E_CLI:-$script_dir/../../../dist/index.js}"
n8n_dir="${N8N_DIR:?set N8N_DIR to a checkout of n8n}"
work_dir="$(mktemp -d)"
overrides_before=0

export CI=true
export IS_DEBUGGING=false
export npm_config_manage_package_manager_versions=false

cleanup() {
    rm -rf "$work_dir"
}

trap cleanup EXIT

override_count() {
    jq '(.pnpm.overrides // {}) | length' package.json
}

install_deps() {
    test -z "${N8N_SKIP_INSTALL:-}" || return 0
    pnpm install --frozen-lockfile --ignore-scripts
}

run_cli() {
    node "$cli" --quiet --no-cache "$@"
}

write_direct_deps() {
    find . -name package.json -not -path '*/node_modules/*' -exec jq -c '
        select(type == "object" and (.name | type) == "string")
        | {key: .name, value: ([.dependencies, .devDependencies, .peerDependencies | objects] | map(keys) | add // [])}
    ' {} \; 2>/dev/null |
        jq -s 'from_entries' >"$work_dir/direct.json"
    jq -e 'length > 1' "$work_dir/direct.json" >/dev/null
}

check_overrides_kept() {
    test "$(override_count)" = "$overrides_before"
}

check_appendix_filled() {
    jq -e '.pastoralist.appendix | length > 0 and all(.[]; (.dependents // {}) | length > 0)' package.json >/dev/null
}

check_top_level_dependents() {
    jq -e --slurpfile direct "$work_dir/direct.json" '
        [.pastoralist.appendix | to_entries[] | .value.dependents // {} | to_entries[]
            | select(.value | test("required by "))
            | {who: .key, names: (.value | capture("required by (?<names>.+)\\)$").names | split(", "))}]
        | length > 0 and all(.[]; . as $entry
            | all($entry.names[]; . as $name
                | (($direct[0][$entry.who] // []) | index($name)) != null))
    ' package.json >/dev/null
}

check_stable() {
    cp package.json "$work_dir/once.json"
    run_cli
    cmp "$work_dir/once.json" package.json
}

fix_security() {
    status=0
    output="$(run_cli --checkSecurity --forceSecurityRefactor --outputFormat json)" || status=$?
    test "$status" -le 1
    printf '%s\n' "$output" | tail -n 1 | jq -e '.success == true' >/dev/null
    test "$(override_count)" -ge "$overrides_before"
    jq -e . package.json >/dev/null
}

check_lockfile_resolves() {
    pnpm install --lockfile-only --ignore-scripts
}

main() {
    cd "$n8n_dir"
    overrides_before="$(override_count)"
    echo "n8n declares $overrides_before pnpm overrides"
    install_deps
    run_cli
    write_direct_deps
    check_overrides_kept
    check_appendix_filled
    check_top_level_dependents
    check_stable
    test -n "${N8N_SKIP_SECURITY:-}" || fix_security
    test -n "${N8N_SKIP_SECURITY:-}" || check_lockfile_resolves
    echo "n8n E2E passed"
}

main "$@"
