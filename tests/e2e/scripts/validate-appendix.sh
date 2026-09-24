#!/bin/sh

show_appendix() {
    echo "🔍 Validating Appendix Content"
    echo "==============================="

    printf '\n%s\n' "📋 Current appendix content:"
    echo "----------------------------"
    sed -n '/pastoralist/,/}/p' package.json | head -20

    printf '\n%s\n' "🧪 Running validation tests..."
}

check_lodash() {
    printf '\n%s\n' "1️⃣ Checking for lodash entries..."
    if grep -q "lodash@" package.json; then
        echo "✅ Lodash entries found in appendix"
        grep "lodash@" package.json | head -3
    else
        echo "❌ No lodash entries found in appendix"
    fi
}

check_workspaces() {
    printf '\n%s\n' "2️⃣ Checking for workspace dependencies..."
    if grep -q "@workspace" package.json; then
        echo "✅ Workspace dependencies found in appendix"
        grep "@workspace" package.json | head -3
    else
        echo "ℹ️ No workspace dependencies in appendix (may be expected)"
    fi
}

check_structure() {
    printf '\n%s\n' "3️⃣ Validating appendix JSON structure..."
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

    printf '\n%s\n' "🎯 Validation complete!"
}

main() {
    show_appendix
    check_lodash
    check_workspaces
    check_structure
}

main "$@"
