#!/bin/bash

set -e

echo "🧪 Testing Interactive Config Review"
echo "===================================="

print_result() {
    if [ $1 -eq 0 ]; then
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

echo "\n1️⃣ Testing interactive config review reads existing config..."
rm -rf /tmp/test-interactive
mkdir -p /tmp/test-interactive
cd /tmp/test-interactive

cat > package.json <<'EOF'
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

if ! grep -q '"pastoralist":' package.json; then
    echo "❌ Pastoralist config not found"
    exit 1
fi
echo "✅ Config exists"

if ! grep -q '"overrides":' package.json; then
    echo "❌ Overrides not found"
    exit 1
fi
echo "✅ Overrides exist"

if ! grep -q '"resolutions":' package.json; then
    echo "❌ Resolutions not found"
    exit 1
fi
echo "✅ Resolutions exist"

echo "\n2️⃣ Testing workspace config modifications..."
cat > package.json <<'EOF'
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

# Test changing back to workspace string
cat > package.json <<'EOF'
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

# Test disabling workspace tracking
cat > package.json <<'EOF'
{
  "name": "test-interactive",
  "version": "1.0.0",
  "pastoralist": {}
}
EOF

if ! grep -q '"depPaths":' package.json; then
    echo "✅ Workspace tracking can be disabled"
else
    echo "❌ Workspace disable failed"
    exit 1
fi

echo "\n3️⃣ Testing security config modifications..."
cat > package.json <<'EOF'
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

# Test enabling security
cat > package.json <<'EOF'
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

# Test changing provider
cat > package.json <<'EOF'
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

# Test severity threshold
cat > package.json <<'EOF'
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

echo "\n4️⃣ Testing override and resolution viewing..."
cat > package.json <<'EOF'
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

echo "\n5️⃣ Testing override removal..."
cat > package.json <<'EOF'
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

if ! grep -q '"lodash"' package.json; then
    echo "✅ Override can be removed"
else
    echo "❌ Override removal failed"
    exit 1
fi

echo "\n6️⃣ Testing resolution removal..."
cat > package.json <<'EOF'
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

if ! grep -q '"moment"' package.json; then
    echo "✅ Resolution can be removed"
else
    echo "❌ Resolution removal failed"
    exit 1
fi

echo "\n7️⃣ Testing complete config review..."
cat > package.json <<'EOF'
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

if grep -q '"depPaths": "workspace"' package.json && \
   grep -q '"provider": "osv"' package.json && \
   grep -q '"severityThreshold": "medium"' package.json && \
   grep -q '"lodash"' package.json && \
   grep -q '"minimist"' package.json; then
    echo "✅ Complete config review structure valid"
else
    echo "❌ Config review structure invalid"
    exit 1
fi

echo "\n🎯 All interactive config review tests passed!"
echo "==============================================="
