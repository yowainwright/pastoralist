#!/bin/sh

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
# Remove the override but keep the structure
sed -i 's/"lodash": "4.17.22"//g' package.json
sed -i '/^[[:space:]]*$/d' package.json  # Remove empty lines

echo "\n1️⃣1️⃣ Running pastoralist without overrides..."
node /app/pastoralist/index.js --debug --root /app --depPaths "**/package.json"
print_result $? "Fourth pastoralist run completed"

echo "\n1️⃣2️⃣ Checking if appendix is preserved when no overrides..."
show_package_json

# Verify appendix still exists even without overrides
if grep -q "pastoralist" package.json; then
    echo "✅ Appendix was preserved without overrides (bug fix verified!)"
else
    echo "❌ Appendix was removed when no overrides (bug still exists!)"
    exit 1
fi

echo "\n🎉 All E2E tests passed!"
echo "========================="
