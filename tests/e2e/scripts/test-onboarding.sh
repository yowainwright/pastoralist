#!/bin/bash

set -euo pipefail

print_header() {
	printf '\nTesting Onboarding\n'
	echo "=================="
}

print_header

SETUP_ROOT="${PASTORALIST_SETUP_ROOT:-/app/pastoralist-package}"
SETUP_SCRIPT="$SETUP_ROOT/scripts/setup/setup.sh"
PASTORALIST_CLI="${PASTORALIST_CLI_PATH:-/app/pastoralist/index.js}"

print_result() {
	if [ "$1" -eq 0 ]; then
		echo "PASS: $2"
	else
		echo "FAIL: $2"
		exit 1
	fi
}

assert_contains() {
	local value="${1?Missing output}"
	local expected="${2?Missing expected text}"

	if grep -Fq -- "$expected" <<<"$value"; then
		return
	fi

	printf 'FAIL: expected output to contain "%s"\nActual output:\n%s\n' "$expected" "$value" >&2
	exit 1
}

reset_repo() {
	rm -rf /tmp/test-onboarding
	mkdir -p /tmp/test-onboarding
	cd /tmp/test-onboarding
}

write_package_json() {
	cat >package.json <<'EOF'
{
  "name": "test-onboarding",
  "version": "1.0.0",
  "overrides": {
    "lodash": "4.17.21"
  },
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF
}

hash_file() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum "$1" | awk '{print $1}'
		return
	fi

	shasum -a 256 "$1" | awk '{print $1}'
}

check_onboard_safety() {
	if grep -Fq -- "setup:local-dev" <<<"$OUTPUT"; then
		echo "FAIL: onboard command recommended maintainer-only setup"
		exit 1
	fi

	print_result 0 "Onboard command printed consumer setup, prompts, and loop"

	if [ "$BEFORE" != "$AFTER" ]; then
		echo "FAIL: onboard command modified package.json"
		exit 1
	fi
}

check_onboard_output() {
	assert_contains "$OUTPUT" "Pastoralist onboarding"
	assert_contains "$OUTPUT" "Human quick start"
	assert_contains "$OUTPUT" "Agent quick setup"
	assert_contains "$OUTPUT" "Prompt for a setup agent"
	assert_contains "$OUTPUT" "Prompt for a maintenance agent"
	assert_contains "$OUTPUT" "Agent setup loop"
	assert_contains "$OUTPUT" "GitHub Action setup"
	assert_contains "$OUTPUT" "npx pastoralist doctor"
	assert_contains "$OUTPUT" "npx pastoralist --dry-run"
	assert_contains "$OUTPUT" "npx pastoralist --setup-hook"
	assert_contains "$OUTPUT" "npx pastoralist --init agent-skill --dry-run"
	assert_contains "$OUTPUT" ".agents/skills/pastoralist/SKILL.md"
	assert_contains "$OUTPUT" "Apply the smallest needed setup command"

	check_onboard_safety
}

test_onboard_command() {
	printf '\n1. Testing onboard command output\n'
	reset_repo
	write_package_json
	BEFORE=$(hash_file package.json)
	OUTPUT=$(node "$PASTORALIST_CLI" onboard)
	AFTER=$(hash_file package.json)

	check_onboard_output
}

test_onboarding_flag() {
	printf '\n2. Testing onboarding flag alias\n'
	reset_repo
	OUTPUT=$(node "$PASTORALIST_CLI" --onboarding)

	assert_contains "$OUTPUT" "Pastoralist onboarding"
	assert_contains "$OUTPUT" "Agent setup loop"
	assert_contains "$OUTPUT" "Review this repository's Pastoralist setup"
	print_result $? "Onboarding flag printed expected output"
}

check_installed_skill() {
	if cmp "$SETUP_ROOT/skills/pastoralist/SKILL.md" ".agents/skills/pastoralist/SKILL.md"; then
		return 0
	fi
	echo "FAIL: installed skill differs from the packaged skill"
	exit 1
}

test_installed_skill() {
	printf '\n3. Testing installed Pastoralist skill onboarding guidance\n'
	reset_repo
	sh "$SETUP_SCRIPT" skill
	print_result $? "Pastoralist skill installer completed"

	check_installed_skill
}

print_success() {
	printf '\nOnboarding tests passed\n'
	echo "========================"
}

main() {
	test_onboard_command
	test_onboarding_flag
	test_installed_skill
	print_success
}

main "$@"
