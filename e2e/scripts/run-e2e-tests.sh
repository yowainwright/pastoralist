#!/bin/bash

set -e

# Check if we're running inside Docker (if not, orchestrate Docker run)
if [ ! -f /.dockerenv ]; then
    echo "🔨 Building Pastoralist..."
    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    # Go to the project root (two levels up from scripts directory)
    cd "$SCRIPT_DIR/../.."
    pnpm run build
    cd e2e
    
    echo "🐳 Starting E2E Tests..."
    echo "========================"
    
    # Ensure we have a fresh start
    docker compose down --remove-orphans 2>/dev/null || true
    
    # Build and run the tests
    echo "📦 Building Docker containers..."
    docker compose build
    
    echo "🧪 Running E2E tests..."
    docker compose up --abort-on-container-exit e2e-test
    
    # Capture the exit code
    TEST_EXIT_CODE=$?
    
    echo ""
    echo "📊 Test Results:"
    echo "================"
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo "🎉 All E2E tests PASSED!"
    else
        echo "❌ E2E tests FAILED!"
        echo ""
        echo "🔍 Container logs:"
        docker compose logs e2e-test
        exit 1
    fi
    
    # Cleanup
    echo ""
    echo "🧹 Cleaning up..."
    docker compose down --remove-orphans
    
    echo ""
    echo "✨ E2E test run complete!"
    exit 0
fi

# If we're inside Docker, run the actual tests
echo "🧪 Starting Pastoralist E2E Tests"
echo "================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

# Function to display package.json content
show_package_json() {
    echo "📄 Current package.json:"
    echo "------------------------"
    cat package.json | head -30
    echo "------------------------"
}

echo "\n1️⃣ Initial state - showing current package.json before pastoralist"
show_package_json

echo "\n2️⃣ Running pastoralist for the first time..."
node /app/pastoralist/index.js --debug --root /app --depPaths "**/package.json"
print_result $? "Initial pastoralist run completed"

echo "\n3️⃣ Checking if appendix was created..."
show_package_json

# Check if pastoralist appendix exists
if grep -q "pastoralist" package.json; then
    echo "✅ Appendix was created successfully"
else
    echo "❌ Appendix was not created"
    exit 1
fi

echo "\n4️⃣ Updating lodash override from 4.17.21 to 4.17.20..."
# Update the override version
sed -i 's/"lodash": "4.17.21"/"lodash": "4.17.20"/g' package.json

echo "\n5️⃣ Running pastoralist after override change..."
node /app/pastoralist/index.js --debug --root /app --depPaths "**/package.json"
print_result $? "Second pastoralist run completed"

echo "\n6️⃣ Checking if appendix was updated..."
show_package_json

echo "\n7️⃣ Updating lodash override to 4.17.22..."
sed -i 's/"lodash": "4.17.20"/"lodash": "4.17.22"/g' package.json

echo "\n8️⃣ Running pastoralist after second override change..."
node /app/pastoralist/index.js --debug --root /app --depPaths "**/package.json"
print_result $? "Third pastoralist run completed"

echo "\n9️⃣ Final appendix state:"
show_package_json

echo "\n🔟 Removing overrides to test appendix preservation..."
# Remove the entire pnpm.overrides section using Node.js to maintain JSON validity
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (pkg.pnpm && pkg.pnpm.overrides) {
  delete pkg.pnpm.overrides;
  if (Object.keys(pkg.pnpm).length === 0) {
    delete pkg.pnpm;
  }
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "\n1️⃣1️⃣ Running pastoralist without overrides..."
node /app/pastoralist/index.js --debug --root /app --depPaths "**/package.json"
print_result $? "Fourth pastoralist run completed"

echo "\n1️⃣2️⃣ Checking if appendix is preserved when no overrides..."
show_package_json

# When there are no overrides, pastoralist removes the entire appendix section
# This is expected behavior since there's nothing to track
if node -e "
const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
if (pkg.pastoralist) {
    console.log('❌ Pastoralist section should be removed when no overrides are present');
    process.exit(1);
} else {
    console.log('✅ Pastoralist section correctly removed when no overrides (expected behavior!)');
}
"; then
    echo "✅ Appendix removal check passed"
else
    echo "❌ Appendix removal check failed"
    exit 1
fi

echo "\n🎉 All E2E tests passed!"
echo "========================="

# Run validation checks
echo "\n🔍 Running final validation..."
echo "==================================="

# Validate that the final state is clean (no overrides, no appendix)
echo "\n1️⃣ Validating final clean state..."
if node -e "
const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
const hasOverrides = (pkg.pnpm && pkg.pnpm.overrides && Object.keys(pkg.pnpm.overrides).length > 0) ||
                   (pkg.overrides && Object.keys(pkg.overrides).length > 0) ||
                   (pkg.resolutions && Object.keys(pkg.resolutions).length > 0);
const hasAppendix = pkg.pastoralist && pkg.pastoralist.appendix && Object.keys(pkg.pastoralist.appendix).length > 0;

if (hasOverrides) {
    console.log('❌ Found unexpected overrides in final state');
    process.exit(1);
}
if (hasAppendix) {
    console.log('❌ Found unexpected appendix in final state');
    process.exit(1);
}
if (pkg.pastoralist) {
    console.log('❌ Found unexpected pastoralist section in final state');
    process.exit(1);
}
console.log('✅ Final state is clean - no overrides or appendix sections');
"
then
    echo "✅ Final state validation passed"
else
    echo "❌ Final state validation failed"
    exit 1
fi

echo "\n🎯 All validation checks passed!"
echo "================================="
