#!/bin/bash

set -e

echo "\nTesting Onboarding"
echo "=================="

SETUP_ROOT="${PASTORALIST_SETUP_ROOT:-/app/pastoralist-package}"
SETUP_SKILL="$SETUP_ROOT/scripts/setup-pastoralist-skill.sh"
PASTORALIST_CLI="${PASTORALIST_CLI_PATH:-/app/pastoralist/index.js}"

print_result() {
    if [ $1 -eq 0 ]; then
        echo "PASS: $2"
    else
        echo "FAIL: $2"
        exit 1
    fi
}

assert_contains() {
    value="$1"
    expected="$2"

    echo "$value" | grep -q -- "$expected"
}

reset_repo() {
    rm -rf /tmp/test-onboarding
    mkdir -p /tmp/test-onboarding
    cd /tmp/test-onboarding
}

write_package_json() {
    cat > package.json <<'EOF'
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

echo "\n1. Testing onboard command output"
reset_repo
write_package_json
BEFORE=$(hash_file package.json)
OUTPUT=$(node "$PASTORALIST_CLI" onboard)
AFTER=$(hash_file package.json)

assert_contains "$OUTPUT" "Pastoralist onboarding"
assert_contains "$OUTPUT" "Human quick start"
assert_contains "$OUTPUT" "Agent quick setup"
assert_contains "$OUTPUT" "Prompt for a setup agent"
assert_contains "$OUTPUT" "Prompt for a maintenance agent"
assert_contains "$OUTPUT" "Agent setup loop"
assert_contains "$OUTPUT" "GitHub Action setup"
assert_contains "$OUTPUT" "pastoralist-setup-local-dev --dry-run"
assert_contains "$OUTPUT" "--agent codex --skills all --hooks git,postinstall"
assert_contains "$OUTPUT" "Apply the smallest needed setup command"
print_result $? "Onboard command printed setup scripts, prompts, and loop"

if [ "$BEFORE" != "$AFTER" ]; then
    echo "FAIL: onboard command modified package.json"
    exit 1
fi

echo "\n2. Testing onboarding flag alias"
reset_repo
OUTPUT=$(node "$PASTORALIST_CLI" --onboarding)

assert_contains "$OUTPUT" "Pastoralist onboarding"
assert_contains "$OUTPUT" "Agent setup loop"
assert_contains "$OUTPUT" "Review this repository's Pastoralist setup"
print_result $? "Onboarding flag printed expected output"

echo "\n3. Testing installed Pastoralist skill onboarding guidance"
reset_repo
sh "$SETUP_SKILL"
print_result $? "Pastoralist skill installer completed"

if ! grep -q "npx pastoralist onboard" ".agents/skills/pastoralist/SKILL.md"; then
    echo "FAIL: installed skill missing onboard command"
    exit 1
fi

if ! grep -q "Agent Loop" ".agents/skills/pastoralist/SKILL.md"; then
    echo "FAIL: installed skill missing agent loop"
    exit 1
fi

if ! grep -q "pastoralist-setup-local-dev --dry-run" ".agents/skills/pastoralist/SKILL.md"; then
    echo "FAIL: installed skill missing local dev dry run"
    exit 1
fi

echo "\nOnboarding tests passed"
echo "========================"
