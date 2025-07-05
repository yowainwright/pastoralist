#!/bin/bash

set -e

echo "🔨 Building Pastoralist..."
cd ..
pnpm run build
cd e2e

echo "🐳 Starting E2E Tests..."
echo "========================"

# Ensure we have a fresh start
docker-compose down --remove-orphans 2>/dev/null || true

# Build and run the tests
echo "📦 Building Docker containers..."
docker-compose build

echo "🧪 Running E2E tests..."
docker-compose up --abort-on-container-exit e2e-test

# Capture the exit code
TEST_EXIT_CODE=$?

echo ""
echo "📊 Test Results:"
echo "================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "🎉 All E2E tests PASSED!"
    
    echo ""
    echo "🔍 Running additional validation..."
    docker-compose run --rm e2e-test /app/test-scripts/validate-appendix.sh
    
    VALIDATION_EXIT_CODE=$?
    if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
        echo "✅ Validation also PASSED!"
    else
        echo "❌ Validation FAILED!"
        exit 1
    fi
else
    echo "❌ E2E tests FAILED!"
    echo ""
    echo "🔍 Container logs:"
    docker-compose logs e2e-test
    exit 1
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
docker-compose down --remove-orphans

echo ""
echo "✨ E2E test run complete!"
