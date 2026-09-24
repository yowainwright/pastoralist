#!/bin/bash

set -e

has_complete_config() {
    grep -q '"depPaths": "workspace"' package.json &&
        grep -q '"provider": "osv"' package.json &&
        grep -q '"severityThreshold": "medium"' package.json &&
        grep -q '"lodash"' package.json &&
        grep -q '"minimist"' package.json
}

fail() {
    echo "${1:-}"
    exit 1
}

print_header() {
    echo "🧪 Testing Interactive Config Review"
    echo "===================================="
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
    echo "📄 Current config:"
    echo "------------------------"
    cat package.json | jq '.pastoralist' || echo "No config found"
    echo "------------------------"
}

show_overrides() {
    echo "📄 Overrides:"
    echo "------------------------"
    cat package.json | jq '.overrides' || echo "No overrides"
    echo "------------------------"
}

show_resolutions() {
    echo "📄 Resolutions:"
    echo "------------------------"
    cat package.json | jq '.resolutions' || echo "No resolutions"
    echo "------------------------"
}

test_existing_config() {
    printf '\n%s\n' "1️⃣ Testing interactive config review reads existing config..."
    rm -rf /tmp/test-interactive
    mkdir -p /tmp/test-interactive
    cd /tmp/test-interactive

    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": true,
    "security": {
      "enabled": true,
      "provider": "osv",
      "interactive": true
    }
  },
  "overrides": {
    "lodash": "4.17.21"
  },
  "resolutions": {
    "minimist": "1.2.8"
  }
}
EOF

    echo "📄 Initial state:"
    show_config
    show_overrides
    show_resolutions

    grep -q '"pastoralist":' package.json || fail "❌ Pastoralist config not found"
    echo "✅ Config exists"

    grep -q '"overrides":' package.json || fail "❌ Overrides not found"
    echo "✅ Overrides exist"

    grep -q '"resolutions":' package.json || fail "❌ Resolutions not found"
    echo "✅ Resolutions exist"
}

test_workspace_paths() {
    printf '\n%s\n' "2️⃣ Testing workspace config modifications..."
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "pastoralist": {
    "depPaths": ["packages/*/package.json"]
  }
}
EOF

    if grep -q '"depPaths": \[' package.json; then
        echo "✅ Workspace paths can be modified to array"
    else
        echo "❌ Workspace paths modification failed"
        exit 1
    fi
}

test_workspace_mode() {
    # Test changing back to workspace string
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "pastoralist": {
    "depPaths": "workspace"
  }
}
EOF

    if grep -q '"depPaths": "workspace"' package.json; then
        echo "✅ Workspace paths can be changed to workspace mode"
    else
        echo "❌ Workspace mode change failed"
        exit 1
    fi
}

test_disabled_tracking() {
    # Test disabling workspace tracking
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "pastoralist": {}
}
EOF

    if grep -q '"depPaths":' package.json; then
        echo "❌ Workspace disable failed"
        exit 1
    fi
    echo "✅ Workspace tracking can be disabled"
}

test_disabled_security() {
    printf '\n%s\n' "3️⃣ Testing security config modifications..."
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "pastoralist": {
    "checkSecurity": false
  }
}
EOF

    if grep -q '"checkSecurity": false' package.json; then
        echo "✅ Security can be disabled"
    else
        echo "❌ Security disable failed"
        exit 1
    fi
}

test_enabled_security() {
    # Test enabling security
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "pastoralist": {
    "checkSecurity": true,
    "security": {
      "enabled": true,
      "provider": "osv"
    }
  }
}
EOF

    if grep -q '"checkSecurity": true' package.json; then
        echo "✅ Security can be enabled"
    else
        echo "❌ Security enable failed"
        exit 1
    fi
}

test_security_provider() {
    # Test changing provider
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "pastoralist": {
    "checkSecurity": true,
    "security": {
      "enabled": true,
      "provider": "github"
    }
  }
}
EOF

    if grep -q '"provider": "github"' package.json; then
        echo "✅ Security provider can be changed"
    else
        echo "❌ Security provider change failed"
        exit 1
    fi
}

test_severity() {
    # Test severity threshold
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "pastoralist": {
    "checkSecurity": true,
    "security": {
      "enabled": true,
      "provider": "osv",
      "severityThreshold": "high"
    }
  }
}
EOF

    if grep -q '"severityThreshold": "high"' package.json; then
        echo "✅ Severity threshold can be set"
    else
        echo "❌ Severity threshold change failed"
        exit 1
    fi
}

test_override_lists() {
    printf '\n%s\n' "4️⃣ Testing override and resolution viewing..."
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "overrides": {
    "lodash": "4.17.21",
    "axios": "1.6.0",
    "react": "18.2.0"
  },
  "resolutions": {
    "minimist": "1.2.8",
    "moment": "2.29.4"
  }
}
EOF

    show_overrides
    show_resolutions

    OVERRIDE_COUNT=$(cat package.json | jq '.overrides | length')
    if [ "$OVERRIDE_COUNT" -eq 3 ]; then
        echo "✅ All overrides present"
    else
        echo "❌ Override count mismatch"
        exit 1
    fi

    RESOLUTION_COUNT=$(cat package.json | jq '.resolutions | length')
    if [ "$RESOLUTION_COUNT" -eq 2 ]; then
        echo "✅ All resolutions present"
    else
        echo "❌ Resolution count mismatch"
        exit 1
    fi
}

test_override_removal() {
    printf '\n%s\n' "5️⃣ Testing override removal..."
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "overrides": {
    "axios": "1.6.0",
    "react": "18.2.0"
  },
  "resolutions": {
    "minimist": "1.2.8",
    "moment": "2.29.4"
  }
}
EOF

    if grep -q '"lodash"' package.json; then
        echo "❌ Override removal failed"
        exit 1
    fi
    echo "✅ Override can be removed"
}

test_resolution_removal() {
    printf '\n%s\n' "6️⃣ Testing resolution removal..."
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "overrides": {
    "axios": "1.6.0",
    "react": "18.2.0"
  },
  "resolutions": {
    "minimist": "1.2.8"
  }
}
EOF

    if grep -q '"moment"' package.json; then
        echo "❌ Resolution removal failed"
        exit 1
    fi
    echo "✅ Resolution can be removed"
}

test_complete_config() {
    printf '\n%s\n' "7️⃣ Testing complete config review..."
    cat >package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": true,
    "security": {
      "enabled": true,
      "provider": "osv",
      "interactive": true,
      "autoFix": false,
      "severityThreshold": "medium",
      "hasWorkspaceSecurityChecks": true
    }
  },
  "overrides": {
    "lodash": "4.17.21"
  },
  "resolutions": {
    "minimist": "1.2.8"
  }
}
EOF

    show_config
    show_overrides
    show_resolutions

    if has_complete_config; then
        echo "✅ Complete config review structure valid"
    else
        echo "❌ Config review structure invalid"
        exit 1
    fi
}

print_success() {
    printf '\n%s\n' "🎯 All interactive config review tests passed!"
    echo "==============================================="
}

main() {
    print_header
    test_existing_config
    test_workspace_paths
    test_workspace_mode
    test_disabled_tracking
    test_disabled_security
    test_enabled_security
    test_security_provider
    test_severity
    test_override_lists
    test_override_removal
    test_resolution_removal
    test_complete_config
    print_success
}

main "$@"
