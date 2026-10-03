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
  printf '\n%s\n' "🔒 Testing Socket Security Provider"
  echo "===================================="
}

init_git_repo() {
  git init 2>/dev/null || true
  git remote remove origin 2>/dev/null || true
  git remote add origin https://github.com/test/test-repo.git
}

test_provider() {
  printf '\n%s\n' "1️⃣ Test: Socket provider selection"
  cat >package.json <<'EOF'
{
  "name": "socket-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  }
}
EOF

  init_git_repo

  node /app/pastoralist/index.js --checkSecurity --securityProvider socket --debug 2>&1 | tee socket-output.log
  require_provider_log "Socket provider is EXPERIMENTAL" socket-output.log
  require_provider_log "Socket requires authentication" socket-output.log
}

test_multiple_providers() {
  printf '\n%s\n' "2️⃣ Test: Multiple providers including Socket"
  PASTORALIST_MOCK_SECURITY=true node /app/pastoralist/index.js --checkSecurity --securityProvider github socket --debug 2>&1 | tee socket-multi.log
  require_provider_log "Socket provider is EXPERIMENTAL" socket-multi.log
  require_provider_log "Using mock Dependabot alerts" socket-multi.log
  require_provider_log "Socket requires authentication" socket-multi.log
}

test_config() {
  printf '\n%s\n' "3️⃣ Test: Socket in config"
  cat >package.json <<'EOF'
{
  "name": "socket-config-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  },
  "pastoralist": {
    "security": {
      "enabled": true,
      "provider": "socket"
    }
  }
}
EOF

  init_git_repo
  node /app/pastoralist/index.js --debug 2>&1 | tee socket-config.log
  require_provider_log "Socket provider is EXPERIMENTAL" socket-config.log
  require_provider_log "Socket requires authentication" socket-config.log
}

test_config_array() {
  printf '\n%s\n' "4️⃣ Test: Array of providers in config"
  cat >package.json <<'EOF'
{
  "name": "multi-config-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  },
  "pastoralist": {
    "security": {
      "enabled": true,
      "provider": ["github", "socket"]
    }
  }
}
EOF

  init_git_repo
  PASTORALIST_MOCK_SECURITY=true node /app/pastoralist/index.js --debug 2>&1 | tee multi-config.log
  require_provider_log "Using mock Dependabot alerts" multi-config.log
  require_provider_log "Socket requires authentication" multi-config.log
}

print_success() {
  printf '\n%s\n' "🎯 Socket provider tests completed!"
  echo ""
  echo "Socket CLI invocation is stubbed; authenticated scans are intentionally excluded."
}

main() {
  print_header
  prepare_security_provider_cli_stubs
  test_provider
  test_multiple_providers
  test_config
  test_config_array
  assert_no_provider_scans
  print_success
}

main "$@"
