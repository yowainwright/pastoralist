#!/bin/sh

echo "🔍 Validating Appendix Content"
echo "==============================="

# Function to check if a dependency is listed in the appendix
check_dependency_in_appendix() {
    local dep_name=$1
    local expected_version=$2
    
    echo "Checking if $dep_name@$expected_version is in appendix..."
    
    if grep -q "\"$dep_name@$expected_version\"" package.json; then
        echo "✅ Found $dep_name@$expected_version in appendix"
        
        # Extract and show the dependents
        echo "   Dependents:"
        grep -A 10 "\"$dep_name@$expected_version\"" package.json | grep -E '(@workspace|"dependents")' | head -5
    else
        echo "❌ $dep_name@$expected_version not found in appendix"
        return 1
    fi
}

# Function to count total appendix entries
count_appendix_entries() {
    local count=$(grep -c "@[0-9]" package.json || echo "0")
    echo "📊 Total appendix entries: $count"
    return $count
}

echo "\n📋 Current appendix content:"
echo "----------------------------"
# Show just the pastoralist section
sed -n '/pastoralist/,/}/p' package.json | head -20

echo "\n🧪 Running validation tests..."

# Test 1: Check if lodash entries exist
echo "\n1️⃣ Checking for lodash entries..."
if grep -q "lodash@" package.json; then
    echo "✅ Lodash entries found in appendix"
    grep "lodash@" package.json | head -3
else
    echo "❌ No lodash entries found in appendix"
fi

# Test 2: Check for workspace dependencies
echo "\n2️⃣ Checking for workspace dependencies..."
if grep -q "@workspace" package.json; then
    echo "✅ Workspace dependencies found in appendix"
    grep "@workspace" package.json | head -3
else
    echo "ℹ️ No workspace dependencies in appendix (may be expected)"
fi

# Test 3: Validate appendix structure
echo "\n3️⃣ Validating appendix JSON structure..."
if node -e "
const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
if (pkg.pastoralist && pkg.pastoralist.appendix) {
    console.log('✅ Appendix structure is valid JSON');
    const entries = Object.keys(pkg.pastoralist.appendix);
    console.log('📝 Appendix entries:');
    entries.forEach(entry => {
        const dependents = pkg.pastoralist.appendix[entry].dependents || {};
        const depCount = Object.keys(dependents).length;
        console.log('   - ' + entry + ' (' + depCount + ' dependents)');
    });
} else {
    console.log('❌ Invalid or missing appendix structure');
    process.exit(1);
}
"; then
    echo "✅ Appendix validation passed"
else
    echo "❌ Appendix validation failed"
    exit 1
fi

echo "\n🎯 Validation complete!"
