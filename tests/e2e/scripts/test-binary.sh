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

if "$BIN" --nonsense >/dev/null 2>&1; then
  fail "binary invalid option exit status"
fi
printf '[PASS] binary invalid option exit status\n'

temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT
isolated_bin="$temp_dir/pastoralist"
skill_file="$temp_dir/.agents/skills/pastoralist/SKILL.md"
cp "$BIN" "$isolated_bin"
(cd "$temp_dir" && "$isolated_bin" init agent-skill)
[ -f "$skill_file" ] || fail "binary agent skill"
grep -Fq "name: pastoralist" "$skill_file" || fail "binary agent skill contents"
printf '[PASS] binary agent skill\n'

cp tests/e2e/fixtures/with-patches-package.json "$temp_dir/package.json"
before=$(shasum -a 256 "$temp_dir/package.json")
"$BIN" --path "$temp_dir/package.json" --dry-run --summary >/dev/null
after=$(shasum -a 256 "$temp_dir/package.json")
[ "$before" = "$after" ] || fail "binary dry run modified package.json"
printf '[PASS] binary dry run\n'
