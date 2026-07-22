#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)"
BIN="$ROOT_DIR/artifacts/pastoralist"

fail() {
  printf '[FAIL] %s\n' "$1"
  exit 1
}

cd "$ROOT_DIR"
bun run build:bin

help_output=$("$BIN" --help)
printf '%s\n' "$help_output" | grep -Fq "Pastoralist" || fail "binary help"
printf '[PASS] binary help\n'

expected_version=$(bun -e 'import manifest from "./package.json"; process.stdout.write(manifest.version)')
actual_version=$("$BIN" --version)
[ "$actual_version" = "$expected_version" ] || fail "binary version"
printf '[PASS] binary version\n'

temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT
cp tests/e2e/fixtures/with-patches-package.json "$temp_dir/package.json"
before=$(shasum -a 256 "$temp_dir/package.json")
"$BIN" --path "$temp_dir/package.json" --dry-run --summary >/dev/null
after=$(shasum -a 256 "$temp_dir/package.json")
[ "$before" = "$after" ] || fail "binary dry run modified package.json"
printf '[PASS] binary dry run\n'
