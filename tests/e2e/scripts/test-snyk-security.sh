#!/bin/bash

set -e
set -o pipefail

prepare_security_provider_cli_stubs() {
  local stub_directory="$PWD/security-test-bin"
  mkdir -p "$stub_directory"
  for command_name in snyk socket; do
    cat >"$stub_directory/$command_name" <<'EOF'
#!/bin/sh
printf '%s %s\n' "${0##*/}" "$*" >>"$SECURITY_PROVIDER_CALLS"
exit 1
EOF
    chmod +x "$stub_directory/$command_name"
  done
  PATH="$stub_directory:$PATH"
  export PATH
  SECURITY_PROVIDER_CALLS="$PWD/security-provider-cli-calls.log"
  export SECURITY_PROVIDER_CALLS
  : >"$SECURITY_PROVIDER_CALLS"
  unset SNYK_TOKEN SOCKET_SECURITY_API_KEY
}

require_provider_log() {
  local pattern="${1:?Expected log pattern is required}"
  local output_file="${2:?Output file is required}"
  if grep -q "$pattern" "$output_file"; then
    return 0
  fi
  echo "❌ Expected provider output was missing: $pattern"
  cat "$output_file"
  exit 1
}

assert_no_provider_scans() {
  if grep -Eq 'snyk test --json|socket report create' "$SECURITY_PROVIDER_CALLS"; then
    echo "❌ A provider scan ran without credentials"
    cat "$SECURITY_PROVIDER_CALLS"
    exit 1
  fi
}

print_header() {
  printf '\n%s\n' "🔒 Testing Snyk Security Provider"
  echo "=================================="
}

print_result() {
  if [ "$1" -eq 0 ]; then
    echo "✅ $2"
  else
    echo "❌ $2"
    exit 1
  fi
}

init_git_repo() {
  git init 2>/dev/null || true
  git remote remove origin 2>/dev/null || true
  git remote add origin https://github.com/test/test-repo.git
}

test_provider() {
  printf '\n%s\n' "1️⃣ Test: Snyk provider selection"
  cat >package.json <<'EOF'
{
  "name": "snyk-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  }
}
EOF

  init_git_repo

  node /app/pastoralist/index.js --checkSecurity --securityProvider snyk --debug 2>&1 | tee snyk-output.log
  require_provider_log "Snyk provider is EXPERIMENTAL" snyk-output.log
  require_provider_log "Snyk authentication failed, skipping Snyk scan" snyk-output.log
}

test_multiple_providers() {
  printf '\n%s\n' "2️⃣ Test: Multiple providers including Snyk"
  node /app/pastoralist/index.js --checkSecurity --securityProvider snyk socket --debug 2>&1 | tee snyk-multi.log
  require_provider_log "Snyk provider is EXPERIMENTAL" snyk-multi.log
  require_provider_log "Socket provider is EXPERIMENTAL" snyk-multi.log
}

test_config() {
  printf '\n%s\n' "3️⃣ Test: Snyk in config"
  cat >package.json <<'EOF'
{
  "name": "snyk-config-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  },
  "pastoralist": {
    "security": {
      "enabled": true,
      "provider": "snyk"
    }
  }
}
EOF

  init_git_repo
  node /app/pastoralist/index.js --debug 2>&1 | tee snyk-config.log
  require_provider_log "Snyk provider is EXPERIMENTAL" snyk-config.log
}

print_success() {
  printf '\n%s\n' "🎯 Snyk provider tests completed!"
  echo "Snyk CLI invocation is stubbed; authenticated scans are intentionally excluded."
}

main() {
  print_header
  prepare_security_provider_cli_stubs
  test_provider
  test_multiple_providers
  test_config
  assert_no_provider_scans
  print_success
}

main "$@"
