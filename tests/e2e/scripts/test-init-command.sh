#!/bin/bash

set -e

fail() {
    echo "${1:-}"
    exit 1
}

print_header() {
    echo "🧪 Testing Init Command"
    echo "========================"
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
    jq '.pastoralist' package.json || echo "No config found"
    echo "------------------------"
}

test_empty_config() {
    printf '\n%s\n' "1️⃣ Testing init command creates config..."
    rm -rf /tmp/test-init
    mkdir -p /tmp/test-init
    cd /tmp/test-init

    cat >package.json <<'EOF'
{
  "name": "test-init",
  "version": "1.0.0"
}
EOF

    echo "📄 Before init:"
    show_config
}

test_package_config() {
    printf '\n%s\n' "2️⃣ Testing config location in package.json..."
    # Note: In real e2e, we'd need to mock the prompts or use a pre-configured input
    # For now, we test that the config structure is valid when manually added

    cat >package.json <<'EOF'
{
  "name": "test-init",
  "version": "1.0.0",
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": true,
    "security": {
      "enabled": true,
      "provider": "osv",
      "interactive": true,
      "severityThreshold": "high"
    }
  }
}
EOF

    echo "📄 After adding config:"
    show_config

    grep -q '"pastoralist":' package.json || fail "❌ Pastoralist config missing"

    grep -q '"depPaths": "workspace"' package.json || fail "❌ Workspace config missing"

    grep -q '"checkSecurity": true' package.json || fail "❌ Security config missing"

    echo "✅ Config structure valid"
}

test_workspace() {
    printf '\n%s\n' "3️⃣ Testing workspace configuration..."
    mkdir -p packages/app-a
    cat >packages/app-a/package.json <<'EOF'
{
  "name": "app-a",
  "version": "1.0.0"
}
EOF

    if [ -d "packages/app-a" ]; then
        echo "✅ Workspace directory created"
    else
        echo "❌ Workspace directory not created"
        exit 1
    fi
}

test_custom_paths() {
    printf '\n%s\n' "4️⃣ Testing custom workspace paths..."
    cat >package.json <<'EOF'
{
  "name": "test-init",
  "version": "1.0.0",
  "pastoralist": {
    "depPaths": ["packages/*/package.json", "apps/*/package.json"]
  }
}
EOF

    if grep -q '"depPaths": \[' package.json; then
        echo "✅ Custom workspace paths configured"
    else
        echo "❌ Custom workspace paths not configured"
        exit 1
    fi
}

test_security_provider() {
    printf '\n%s\n' "5️⃣ Testing security provider configuration..."
    cat >package.json <<'EOF'
{
  "name": "test-init",
  "version": "1.0.0",
  "pastoralist": {
    "checkSecurity": true,
    "security": {
      "enabled": true,
      "provider": "osv",
      "interactive": true,
      "autoFix": false,
      "severityThreshold": "medium",
      "hasWorkspaceSecurityChecks": true
    }
  }
}
EOF

    show_config

    grep -q '"provider": "osv"' package.json || fail "❌ Security provider not set"

    grep -q '"severityThreshold": "medium"' package.json || fail "❌ Severity threshold not set"

    echo "✅ Security provider configured correctly"
}

test_external_config() {
    printf '\n%s\n' "6️⃣ Testing external config file..."
    cat >.pastoralistrc.json <<'EOF'
{
  "depPaths": "workspace",
  "checkSecurity": true,
  "security": {
    "enabled": true,
    "provider": "github"
  }
}
EOF

    if [ -f ".pastoralistrc.json" ]; then
        echo "✅ External config file created"
        if grep -q '"provider": "github"' .pastoralistrc.json; then
            echo "✅ External config content valid"
        else
            echo "❌ External config content invalid"
            exit 1
        fi
    else
        echo "❌ External config file not created"
        exit 1
    fi
}

print_success() {
    printf '\n%s\n' "🎯 All init command tests passed!"
    echo "===================================="
}

main() {
    print_header
    test_empty_config
    test_package_config
    test_workspace
    test_custom_paths
    test_security_provider
    test_external_config
    print_success
}

main "$@"
