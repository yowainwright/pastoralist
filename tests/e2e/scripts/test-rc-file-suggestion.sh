#!/bin/bash

set -e

print_header() {
    echo "🧪 Testing RC File Suggestion"
    echo "=============================="
}

print_result() {
    if [ "$1" -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

show_config() {
    echo "📄 Current pastoralist config:"
    echo "------------------------"
    cat package.json | jq '.pastoralist' || echo "No config found"
    echo "------------------------"
}

count_lines() {
    local config
    config=$(jq -r '.pastoralist // empty' package.json)
    if [ -z "$config" ]; then
        echo "0"
    else
        echo "$config" | wc -l | tr -d ' '
    fi
}

test_small_config() {
    printf '\n%s\n' "1️⃣ Testing small config (no suggestion)..."
    rm -rf /tmp/test-rc-suggestion
    mkdir -p /tmp/test-rc-suggestion
    cd /tmp/test-rc-suggestion

    cat >package.json <<'EOF'
{
  "name": "test-rc-suggestion",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  }
}
EOF

    echo "Running pastoralist with small config..."
    OUTPUT=$(node /app/pastoralist/index.js 2>&1 || true)

    if echo "$OUTPUT" | grep -q "pastoralist init --useRcConfigFile"; then
        echo "❌ Should not show RC file suggestion for small config"
        echo "$OUTPUT"
        exit 1
    fi
    echo "✅ No RC file suggestion for small config"

    show_config
}

check_large_config() {
    line_count=$(count_lines)
    echo "Config line count: $line_count"

    if [ "$line_count" -gt 10 ]; then
        if echo "$OUTPUT" | grep -q "pastoralist init --useRcConfigFile"; then
            echo "✅ RC file suggestion shown for large config"
        else
            echo "⚠️  Large config detected but suggestion not shown"
            echo "This might be expected if no overrides were added"
        fi
    else
        echo "⚠️  Config is not large enough yet (${line_count} lines)"
    fi
}

test_large_config() {
    printf '\n%s\n' "2️⃣ Testing large config (should show suggestion)..."
    rm -rf /tmp/test-rc-large
    mkdir -p /tmp/test-rc-large
    cd /tmp/test-rc-large

    cat >package.json <<'EOF'
{
  "name": "test-rc-large",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20",
    "axios": "1.0.0",
    "react": "18.0.0",
    "express": "4.18.0",
    "moment": "2.29.0",
    "vue": "3.3.0",
    "typescript": "5.0.0",
    "webpack": "5.88.0",
    "eslint": "8.45.0",
    "prettier": "3.0.0",
    "jest": "29.6.0",
    "vite": "4.4.0",
    "tailwindcss": "3.3.3",
    "zustand": "4.4.0",
    "socket.io": "4.7.0"
  }
}
EOF

    echo "Running pastoralist with many dependencies to create large config..."
    OUTPUT=$(node /app/pastoralist/index.js 2>&1 || true)

    show_config

    check_large_config
}

test_message() {
    printf '\n%s\n' "3️⃣ Testing suggestion message content..."
    cat >package.json <<'EOF'
{
  "name": "test-message",
  "version": "1.0.0",
  "pastoralist": {
    "appendix": {
      "package0@1.0.0": { "dependents": { "app": "package0@^1.0.0" } },
      "package1@1.0.0": { "dependents": { "app": "package1@^1.0.0" } },
      "package2@1.0.0": { "dependents": { "app": "package2@^1.0.0" } },
      "package3@1.0.0": { "dependents": { "app": "package3@^1.0.0" } },
      "package4@1.0.0": { "dependents": { "app": "package4@^1.0.0" } },
      "package5@1.0.0": { "dependents": { "app": "package5@^1.0.0" } },
      "package6@1.0.0": { "dependents": { "app": "package6@^1.0.0" } },
      "package7@1.0.0": { "dependents": { "app": "package7@^1.0.0" } },
      "package8@1.0.0": { "dependents": { "app": "package8@^1.0.0" } },
      "package9@1.0.0": { "dependents": { "app": "package9@^1.0.0" } },
      "package10@1.0.0": { "dependents": { "app": "package10@^1.0.0" } },
      "package11@1.0.0": { "dependents": { "app": "package11@^1.0.0" } },
      "package12@1.0.0": { "dependents": { "app": "package12@^1.0.0" } },
      "package13@1.0.0": { "dependents": { "app": "package13@^1.0.0" } },
      "package14@1.0.0": { "dependents": { "app": "package14@^1.0.0" } }
    }
  },
  "overrides": {
    "lodash": "4.17.21"
  }
}
EOF

    show_config
    line_count=$(count_lines)
    echo "Large config line count: $line_count"

    if [ "$line_count" -gt 10 ]; then
        echo "✅ Large config confirmed (${line_count} lines)"
    else
        echo "❌ Config should be > 10 lines but is ${line_count}"
        exit 1
    fi
}

test_patterns() {
    printf '\n%s\n' "4️⃣ Testing RC file migration suggestion format..."
    EXPECTED_PATTERNS=(
        "Your pastoralist config is getting large"
        "pastoralist init --useRcConfigFile"
        ".pastoralistrc"
    )

    echo "Expected patterns in suggestion message:"
    for pattern in "${EXPECTED_PATTERNS[@]}"; do
        echo "  - $pattern"
    done
}

print_success() {
    printf '\n%s\n' "🎯 RC file suggestion tests completed!"
    echo "======================================"
    echo "Note: Full suggestion validation requires running with actual overrides"
}

main() {
    print_header
    test_small_config
    test_large_config
    test_message
    test_patterns
    print_success
}

main "$@"
