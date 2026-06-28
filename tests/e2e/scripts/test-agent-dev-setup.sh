#!/bin/bash

set -e

echo "\nTesting Agent And Local Dev Setup"
echo "================================="

SETUP_ROOT="${PASTORALIST_SETUP_ROOT:-/app/pastoralist-package}"
SETUP_SKILL="$SETUP_ROOT/scripts/setup-pastoralist-skill.sh"
SETUP_LOCAL_DEV="$SETUP_ROOT/scripts/setup-local-dev.sh"
PASTORALIST_CLI="${PASTORALIST_CLI_PATH:-/app/pastoralist/index.js}"

print_result() {
    if [ $1 -eq 0 ]; then
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
    cat > package.json <<'EOF'
{
  "name": "test-agent-dev-setup",
  "version": "1.0.0"
}
EOF
}

assert_file_contains() {
    file="$1"
    expected="$2"

    if ! grep -q "$expected" "$file"; then
        echo "FAIL: expected $file to contain $expected"
        exit 1
    fi
}

assert_output_contains() {
    value="$1"
    expected="$2"

    if ! echo "$value" | grep -q -- "$expected"; then
        echo "FAIL: expected output to contain $expected"
        exit 1
    fi
}

echo "\n1. Testing Pastoralist skill dry run"
reset_repo
OUTPUT=$(sh "$SETUP_SKILL" --dry-run)

assert_output_contains "$OUTPUT" "Would install .agents/skills/pastoralist/SKILL.md"
print_result 0 "Pastoralist skill dry run printed expected action"

if [ -e ".agents/skills/pastoralist/SKILL.md" ]; then
    echo "FAIL: dry run wrote Pastoralist skill"
    exit 1
fi

echo "\n2. Testing Pastoralist skill install"
reset_repo
sh "$SETUP_SKILL"
print_result $? "Pastoralist skill installer completed"

assert_file_contains ".agents/skills/pastoralist/SKILL.md" "npx pastoralist doctor"
assert_file_contains ".agents/skills/pastoralist/.pastoralist-agent-config" "pastoralist-agent-config"

if [ -e "AGENTS.md" ]; then
    echo "FAIL: skill-only setup wrote AGENTS.md"
    exit 1
fi

echo "\n3. Testing local dev setup dry run"
reset_repo
OUTPUT=$(
    sh "$SETUP_LOCAL_DEV" \
        --dry-run \
        --agent codex \
        --skills all \
        --hooks git,postinstall
)

assert_output_contains "$OUTPUT" "Would write AGENTS.md"
assert_output_contains "$OUTPUT" "Would install .agents/skills/pastoralist/SKILL.md"
assert_output_contains "$OUTPUT" "Would install .agents/skills/eslint-plugin-legibility/SKILL.md"
assert_output_contains "$OUTPUT" "Would install git hooks"
assert_output_contains "$OUTPUT" "Would add Pastoralist postinstall hook"
print_result 0 "Local dev dry run printed selected setup actions"

if [ -e "AGENTS.md" ] || [ -e ".agents/skills/pastoralist/SKILL.md" ]; then
    echo "FAIL: local dev dry run wrote files"
    exit 1
fi

echo "\n4. Testing selected local dev setup"
reset_repo
sh "$SETUP_LOCAL_DEV" \
    --agent codex \
    --skills all \
    --hooks none
print_result $? "Local dev setup completed"

assert_file_contains "AGENTS.md" "Pastoralist Agent Instructions"
assert_file_contains ".codex/config.toml" "model_reasoning_effort"
assert_file_contains ".agents/skills/pastoralist/SKILL.md" "npx pastoralist doctor"
assert_file_contains ".agents/skills/eslint-plugin-legibility/SKILL.md" "ESLint Plugin Legibility"

echo "\n5. Testing unmanaged skill preservation"
reset_repo
mkdir -p .agents/skills/pastoralist
echo "custom skill" > .agents/skills/pastoralist/SKILL.md
OUTPUT=$(sh "$SETUP_SKILL")

assert_output_contains "$OUTPUT" "existing file is unmanaged"
assert_file_contains ".agents/skills/pastoralist/SKILL.md" "custom skill"
print_result 0 "Unmanaged Pastoralist skill was preserved"

echo "\n6. Testing postinstall hook selection"
reset_repo
write_package_json
mkdir -p bin
cat > bin/pastoralist <<EOF
#!/bin/sh
exec node "$PASTORALIST_CLI" "\$@"
EOF
chmod +x bin/pastoralist

OLD_PATH="$PATH"
PATH="/tmp/test-agent-dev-setup/bin:$OLD_PATH"
export PATH
sh "$SETUP_LOCAL_DEV" \
    --agent skip \
    --skills none \
    --hooks postinstall
print_result $? "Local dev postinstall hook setup completed"

POSTINSTALL=$(jq -r '.scripts.postinstall' package.json)
if [ "$POSTINSTALL" != "pastoralist" ]; then
    echo "FAIL: expected postinstall hook pastoralist, got $POSTINSTALL"
    exit 1
fi

echo "\nAgent and local dev setup tests passed"
echo "====================================="
