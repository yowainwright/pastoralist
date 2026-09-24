#!/bin/bash

set -e

has_setup_files() {
	[ -e "AGENTS.md" ] || [ -e ".agents/skills/pastoralist/SKILL.md" ]
}

print_header() {
	printf '\n%s\n' "Testing Agent And Local Dev Setup"
	echo "================================="

	SETUP_ROOT="${PASTORALIST_SETUP_ROOT:-/app/pastoralist-package}"
	SETUP_SCRIPT="$SETUP_ROOT/scripts/setup/setup.sh"
	PASTORALIST_CLI="${PASTORALIST_CLI_PATH:-/app/pastoralist/index.js}"
}

print_result() {
	if [ "$1" -eq 0 ]; then
		echo "PASS: $2"
	else
		echo "FAIL: $2"
		exit 1
	fi
}

reset_repo() {
	rm -rf /tmp/test-agent-dev-setup
	mkdir -p /tmp/test-agent-dev-setup
	cd /tmp/test-agent-dev-setup
}

write_package_json() {
	cat >package.json <<'EOF'
{
  "name": "test-agent-dev-setup",
  "version": "1.0.0"
}
EOF
}

assert_file_contains() {
	file="${1:-}"
	expected="${2:-}"

	if grep -q "$expected" "$file"; then
		return 0
	fi
	echo "FAIL: expected $file to contain $expected"
	exit 1
}

assert_output_contains() {
	value="${1:-}"
	expected="${2:-}"

	if echo "$value" | grep -q -- "$expected"; then
		return 0
	fi
	echo "FAIL: expected output to contain $expected"
	exit 1
}

test_skill_dry_run() {
	printf '\n%s\n' "1. Testing Pastoralist skill dry run"
	reset_repo
	OUTPUT=$(sh "$SETUP_SCRIPT" skill --dry-run)

	assert_output_contains "$OUTPUT" "Would install .agents/skills/pastoralist/SKILL.md"
	print_result 0 "Pastoralist skill dry run printed expected action"

	if [ -e ".agents/skills/pastoralist/SKILL.md" ]; then
		echo "FAIL: dry run wrote Pastoralist skill"
		exit 1
	fi
}

test_skill_flag() {
	printf '\n%s\n' "2. Testing Pastoralist skill CLI flag dry run"
	reset_repo
	OUTPUT=$(node "$PASTORALIST_CLI" --init agent-skill --dry-run)

	assert_output_contains "$OUTPUT" "Would install .agents/skills/pastoralist/SKILL.md"
	print_result 0 "Pastoralist skill CLI flag dry run printed expected action"

	if [ -e ".agents/skills/pastoralist/SKILL.md" ]; then
		echo "FAIL: CLI flag dry run wrote Pastoralist skill"
		exit 1
	fi
}

test_skill_command() {
	printf '\n%s\n' "3. Testing Pastoralist skill CLI command dry run"
	reset_repo
	OUTPUT=$(node "$PASTORALIST_CLI" init agent-skill --dry-run)

	assert_output_contains "$OUTPUT" "Would install .agents/skills/pastoralist/SKILL.md"
	print_result 0 "Pastoralist skill CLI command dry run printed expected action"

	if [ -e ".agents/skills/pastoralist/SKILL.md" ]; then
		echo "FAIL: CLI command dry run wrote Pastoralist skill"
		exit 1
	fi
}

test_skill_install() {
	printf '\n%s\n' "4. Testing Pastoralist skill install"
	reset_repo
	sh "$SETUP_SCRIPT" skill
	print_result $? "Pastoralist skill installer completed"

	assert_file_contains ".agents/skills/pastoralist/SKILL.md" "npx pastoralist doctor"
	assert_file_contains ".agents/skills/pastoralist/.pastoralist-agent-config" "pastoralist-agent-config"

	if [ -e "AGENTS.md" ]; then
		echo "FAIL: skill-only setup wrote AGENTS.md"
		exit 1
	fi
}

check_setup_dry_run() {
	assert_output_contains "$OUTPUT" "Would write AGENTS.md"
	assert_output_contains "$OUTPUT" "Would install .agents/skills/pastoralist/SKILL.md"
	assert_output_contains "$OUTPUT" "Would install .agents/skills/oxlint-plugin-legibility/SKILL.md"
	assert_output_contains "$OUTPUT" "Would install git hooks"
	assert_output_contains "$OUTPUT" "Would add Pastoralist postinstall hook"
	print_result 0 "Local dev dry run printed selected setup actions"

	if has_setup_files; then
		echo "FAIL: local dev dry run wrote files"
		exit 1
	fi
}

test_setup_dry_run() {
	printf '\n%s\n' "5. Testing local dev setup dry run"
	reset_repo
	OUTPUT=$(
		sh "$SETUP_SCRIPT" local-dev \
			--dry-run \
			--agent codex \
			--skills all \
			--hooks git,postinstall
	)

	check_setup_dry_run
}

test_selected_setup() {
	printf '\n%s\n' "6. Testing selected local dev setup"
	reset_repo
	sh "$SETUP_SCRIPT" local-dev \
		--agent codex \
		--skills all \
		--hooks none
	print_result $? "Local dev setup completed"

	assert_file_contains "AGENTS.md" "Pastoralist Agent Instructions"
	assert_file_contains ".codex/config.toml" "model_reasoning_effort"
	assert_file_contains ".agents/skills/pastoralist/SKILL.md" "npx pastoralist doctor"
	assert_file_contains ".agents/skills/oxlint-plugin-legibility/SKILL.md" "Oxlint Plugin Legibility"
}

test_unmanaged_skill() {
	printf '\n%s\n' "7. Testing unmanaged skill preservation"
	reset_repo
	mkdir -p .agents/skills/pastoralist
	echo "custom skill" >.agents/skills/pastoralist/SKILL.md
	OUTPUT=$(sh "$SETUP_SCRIPT" skill)

	assert_output_contains "$OUTPUT" "existing file is unmanaged"
	assert_file_contains ".agents/skills/pastoralist/SKILL.md" "custom skill"
	print_result 0 "Unmanaged Pastoralist skill was preserved"
}

check_postinstall_hook() {
	OLD_PATH="$PATH"
	PATH="/tmp/test-agent-dev-setup/bin:$OLD_PATH"
	export PATH
	sh "$SETUP_SCRIPT" local-dev \
		--agent skip \
		--skills none \
		--hooks postinstall
	print_result $? "Local dev postinstall hook setup completed"

	POSTINSTALL=$(jq -r '.scripts.postinstall' package.json)
	if [ "$POSTINSTALL" != "pastoralist" ]; then
		echo "FAIL: expected postinstall hook pastoralist, got $POSTINSTALL"
		exit 1
	fi
}

test_postinstall_hook() {
	printf '\n%s\n' "8. Testing postinstall hook selection"
	reset_repo
	write_package_json
	mkdir -p bin
	cat >bin/pastoralist <<EOF
#!/bin/sh
exec node "$PASTORALIST_CLI" "\$@"
EOF
	chmod +x bin/pastoralist

	check_postinstall_hook
}

print_success() {
	printf '\n%s\n' "Agent and local dev setup tests passed"
	echo "====================================="
}

main() {
	print_header
	test_skill_dry_run
	test_skill_flag
	test_skill_command
	test_skill_install
	test_setup_dry_run
	test_selected_setup
	test_unmanaged_skill
	test_postinstall_hook
	print_success
}

main "$@"
