#!/bin/sh

show_environment() {
    echo "🔧 Verifying E2E Test Setup"
    echo "==========================="

    printf '\n%s\n' "📍 Current directory: $(pwd)"
    echo "📍 Node version: $(node --version)"
    echo "📍 NPM version: $(npm --version)"

    if command -v pnpm >/dev/null 2>&1; then
        echo "📍 PNPM version: $(pnpm --version)"
    else
        echo "❌ PNPM not available"
    fi
}

show_files() {
    printf '\n%s\n' "📁 Available files:"
    echo "-------------------"
    ls -la

    printf '\n%s\n' "📁 Pastoralist binary:"
    echo "----------------------"
    ls -la /app/pastoralist/

    printf '\n%s\n' "📁 Test scripts:"
    echo "----------------"
    ls -la /app/test-scripts/
}

show_package() {
    printf '\n%s\n' "📦 Package.json content:"
    echo "------------------------"
    if [ -f package.json ]; then
        cat package.json | head -20
        echo "..."
    else
        echo "❌ package.json not found"
    fi

    printf '\n%s\n' "📦 Workspace packages:"
    echo "----------------------"
    ls -la packages/*/package.json
}

test_binary() {
    printf '\n%s\n' "🧪 Testing pastoralist binary..."
    echo "--------------------------------"
    if node /app/pastoralist/index.cjs --help; then
        echo "✅ Pastoralist binary works!"
    else
        echo "❌ Pastoralist binary failed"
        exit 1
    fi

    printf '\n%s\n' "✨ Setup verification complete!"
}

main() {
    show_environment
    show_files
    show_package
    test_binary
}

main "$@"
