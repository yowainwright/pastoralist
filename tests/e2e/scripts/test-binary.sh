#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH='' cd -- "$SCRIPT_DIR/../../.." && pwd)"
BIN="$ROOT_DIR/artifacts/pastoralist"

fail() {
    printf '[FAIL] %s\n' "$1"
    exit 1
}

build_binary() {
    cd "$ROOT_DIR"
    pnpm run build:bin
}

isolate_binary() {
    temp_dir=$(mktemp -d "$ROOT_DIR/artifacts/binary-test.XXXXXX")
    trap 'rm -rf "$temp_dir"' EXIT
    isolated_bin="$temp_dir/pastoralist"
    cp "$BIN" "$isolated_bin"
}

run_binary() {
    (cd "$temp_dir" && env -i PATH="$temp_dir" HOME="$temp_dir" "$isolated_bin" "$@")
}

test_help() {
    help_output=$(run_binary --help)
    printf '%s\n' "$help_output" | grep -Fq "Pastoralist" || fail "binary help"
    printf '[PASS] binary help\n'
}

test_version() {
    expected_version=$(node -e 'process.stdout.write(require("./package.json").version)')
    actual_version=$(run_binary --version)
    [ "$actual_version" = "$expected_version" ] || fail "binary version"
    printf '[PASS] binary version\n'
}

test_invalid_option() {
    if run_binary --nonsense >/dev/null 2>&1; then
        fail "binary invalid option exit status"
    fi
    printf '[PASS] binary invalid option exit status\n'
}

test_agent_skill() {
    skill_file="$temp_dir/.agents/skills/pastoralist/SKILL.md"
    run_binary init agent-skill
    [ -f "$skill_file" ] || fail "binary agent skill"
    grep -Fq "name: pastoralist" "$skill_file" || fail "binary agent skill contents"
    printf '[PASS] binary agent skill\n'
}

test_dry_run() {
    cp tests/e2e/fixtures/with-patches-package.json "$temp_dir/package.json"
    before=$(shasum -a 256 "$temp_dir/package.json")
    run_binary --path "$temp_dir/package.json" --dry-run --summary >/dev/null
    after=$(shasum -a 256 "$temp_dir/package.json")
    [ "$before" = "$after" ] || fail "binary dry run modified package.json"
    printf '[PASS] binary dry run\n'
}

main() {
    build_binary
    isolate_binary
    test_help
    test_version
    test_invalid_option
    test_agent_skill
    test_dry_run
}

main "$@"
