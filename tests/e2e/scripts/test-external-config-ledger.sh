#!/bin/bash

set -euo pipefail

project_dir="/tmp/pastoralist-external-config-e2e"

setup_project() {
    mkdir -p "$project_dir"
    cp /app/fixtures/package.json "$project_dir/package.json"
    cp /app/fixtures/.pastoralistrc "$project_dir/.pastoralistrc"
    cd "$project_dir"
}

check_ledger() {
    jq -e '.pastoralist == null' package.json >/dev/null
    jq -e '.overrides.lodash == "4.17.21"' package.json >/dev/null
    jq -e '.security == {"enabled": false, "provider": "osv"}' .pastoralistrc >/dev/null
    jq -e '.appendix["lodash@4.17.21"]' .pastoralistrc >/dev/null
    test -z "$(find "$project_dir" -maxdepth 1 -name '*.tmp' -print -quit)"
}

check_second_run() {
    cp .pastoralistrc .pastoralistrc.after-first-run
    node /app/pastoralist/index.js --outputFormat json
    cmp .pastoralistrc.after-first-run .pastoralistrc
}

main() {
    setup_project
    node /app/pastoralist/index.js --outputFormat json
    check_ledger
    check_second_run
    echo "external config ledger E2E passed"
}

main "$@"
