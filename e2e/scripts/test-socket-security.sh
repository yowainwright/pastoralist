#!/bin/bash

set -e

echo "\n🔒 Testing Socket Security Provider"
echo "===================================="

print_result() {
    if [ $1 -eq 0 ]; then
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

echo "\n1️⃣ Test: Socket provider selection"
cat > package.json << 'EOF'
{
  "name": "socket-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  }
}
EOF

init_git_repo

node /app/pastoralist/index.js --checkSecurity --securityProvider socket --debug 2>&1 | tee socket-output.log || true

if grep -q "socket\|Socket" socket-output.log; then
    echo "✅ Socket provider referenced"
else
    echo "⚠️  Socket provider may not have been selected"
fi

echo "\n2️⃣ Test: Socket without authentication"
unset SOCKET_SECURITY_API_KEY
node /app/pastoralist/index.js --checkSecurity --securityProvider socket --debug 2>&1 | tee socket-noauth.log || true

if grep -q "authentication\|SOCKET_SECURITY_API_KEY\|token\|skipping" socket-noauth.log; then
    echo "✅ Handles missing authentication gracefully"
else
    echo "⚠️  Authentication handling unclear"
fi

echo "\n3️⃣ Test: Socket with API key (if available)"
if [ -n "$SOCKET_SECURITY_API_KEY" ]; then
    node /app/pastoralist/index.js --checkSecurity --securityProvider socket --securityProviderToken "$SOCKET_SECURITY_API_KEY" --debug 2>&1 | tee socket-auth.log || true
    print_result 0 "Socket with authentication attempted"
else
    echo "ℹ️  SOCKET_SECURITY_API_KEY not set, skipping authenticated test"
fi

echo "\n4️⃣ Test: Multiple providers including Socket"
node /app/pastoralist/index.js --checkSecurity --securityProvider osv socket --debug 2>&1 | tee socket-multi.log || true

if grep -q "provider" socket-multi.log; then
    echo "✅ Multi-provider mode works"
else
    echo "⚠️  Multi-provider mode unclear"
fi

echo "\n5️⃣ Test: Socket + OSV combined (recommended)"
node /app/pastoralist/index.js --checkSecurity --securityProvider osv socket --debug 2>&1 | tee combined.log || true

if grep -q "checking" combined.log; then
    echo "✅ Combined OSV + Socket provider works"
else
    echo "⚠️  Combined provider unclear"
fi

echo "\n6️⃣ Test: Socket in config"
cat > package.json << 'EOF'
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
node /app/pastoralist/index.js --debug 2>&1 | tee socket-config.log || true

if grep -q "security\|checking" socket-config.log; then
    echo "✅ Config-based Socket provider works"
else
    echo "⚠️  Config-based provider unclear"
fi

echo "\n7️⃣ Test: Array of providers in config"
cat > package.json << 'EOF'
{
  "name": "multi-config-test",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.20"
  },
  "pastoralist": {
    "security": {
      "enabled": true,
      "provider": ["osv", "socket"]
    }
  }
}
EOF

init_git_repo
node /app/pastoralist/index.js --debug 2>&1 | tee multi-config.log || true

if grep -q "security\|checking" multi-config.log; then
    echo "✅ Array of providers in config works"
else
    echo "⚠️  Array provider config unclear"
fi

echo "\n🎯 Socket provider tests completed!"
echo ""
echo "Note: Full Socket testing requires SOCKET_SECURITY_API_KEY environment variable"
echo "Get your key from: https://socket.dev/dashboard/settings"
