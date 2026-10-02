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

output_pattern_missing() {
  ! grep -Fq "$1" <<<"$OUTPUT"
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
  OUTPUT=$(node /app/pastoralist/index.js 2>&1)

  if echo "$OUTPUT" | grep -q "pastoralist init --useRcConfigFile"; then
    echo "❌ Should not show RC file suggestion for small config"
    echo "$OUTPUT"
    exit 1
  fi
  echo "✅ No RC file suggestion for small config"

}

test_large_config() {
  printf '\n%s\n' "2️⃣ Testing suggestion for a generated large config..."
  rm -rf /tmp/test-rc-large
  mkdir -p /tmp/test-rc-large
  cd /tmp/test-rc-large

  cat >package.json <<'EOF'
{
  "name": "test-large-config",
  "version": "1.0.0",
  "dependencies": { "lodash": "^4.17.20" },
  "overrides": { "lodash": "4.17.21" }
}
EOF

  OUTPUT=$(node /app/pastoralist/index.js 2>&1)
  EXPECTED_PATTERNS=(
    "Your pastoralist config is getting large"
    "pastoralist init --useRcConfigFile"
    ".pastoralistrc"
  )

  for pattern in "${EXPECTED_PATTERNS[@]}"; do
    if output_pattern_missing "$pattern"; then
      echo "❌ Missing RC file suggestion text: $pattern"
      echo "$OUTPUT"
      exit 1
    fi
  done
  echo "✅ RC file suggestion shown for a generated large config"
}

print_success() {
  printf '\n%s\n' "🎯 RC file suggestion tests completed!"
  echo "======================================"
}

main() {
  print_header
  test_small_config
  test_large_config
  print_success
}

main "$@"
