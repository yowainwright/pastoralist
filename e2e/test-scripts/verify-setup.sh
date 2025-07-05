#!/bin/sh

echo "🔧 Verifying E2E Test Setup"
echo "==========================="

echo "\n📍 Current directory: $(pwd)"
echo "📍 Node version: $(node --version)"
echo "📍 NPM version: $(npm --version)"

if command -v pnpm >/dev/null 2>&1; then
    echo "📍 PNPM version: $(pnpm --version)"
else
    echo "❌ PNPM not available"
fi

echo "\n📁 Available files:"
echo "-------------------"
ls -la

echo "\n📁 Pastoralist binary:"
echo "----------------------"
ls -la /app/pastoralist/

echo "\n📁 Test scripts:"
echo "----------------"
ls -la /app/test-scripts/

echo "\n📦 Package.json content:"
echo "------------------------"
if [ -f package.json ]; then
    cat package.json | head -20
    echo "..."
else
    echo "❌ package.json not found"
fi

echo "\n📦 Workspace packages:"
echo "----------------------"
ls -la packages/*/package.json

echo "\n🧪 Testing pastoralist binary..."
echo "--------------------------------"
if node /app/pastoralist/index.js --help; then
    echo "✅ Pastoralist binary works!"
else
    echo "❌ Pastoralist binary failed"
    exit 1
fi

echo "\n✨ Setup verification complete!"
