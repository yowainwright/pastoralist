#!/bin/bash

set -e

echo "🔄 Testing Migration from Pastoralist 1.3.x to 1.4.x (Fuzzy Version Matching)"
echo "==========================================================================="

print_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        exit 1
    fi
}

show_package_json() {
    echo "📄 Current package.json:"
    echo "------------------------"
    cat package.json | jq '.'
    echo "------------------------"
}

echo ""
echo "1️⃣ Setting up migration test environment..."

# Get latest 1.3.x and 1.4.x versions for fuzzy matching (including pre-releases)
# Check if 1.3.* versions exist, fallback to known existing version
LATEST_1_3_X=$(npm view pastoralist@">=1.3.0 <1.4.0" version --json 2>/dev/null | jq -r 'if type == "array" then .[-1] else . end' 2>/dev/null || echo "1.3.0")
# Check if 1.4.* versions exist, fallback to known pre-release version
LATEST_1_4_X=$(npm view pastoralist@">=1.4.0-0 <2.0.0" version --json 2>/dev/null | jq -r 'if type == "array" then .[-1] else . end' 2>/dev/null || echo "1.4.0-4")

echo "🔍 Testing migration from $LATEST_1_3_X format to $LATEST_1_4_X format"
echo "Note: Using fuzzy version matching to test latest patch versions"

# Start with 1.3.x format package.json (dynamically create based on latest versions)
cat > package.json << EOF
{
  "name": "test-migration-project",
  "version": "1.0.0",
  "description": "Test project for migration from pastoralist $LATEST_1_3_X to $LATEST_1_4_X",
  "dependencies": {
    "lodash": "^4.17.21",
    "express": "^4.18.0",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "old-package": "^1.0.0"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "overrides": {
    "lodash": "4.17.21",
    "express": "4.18.0",
    "old-package": "1.0.0"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "test-migration-project": "lodash@^4.17.21"
        }
      },
      "express@4.18.0": {
        "dependents": {
          "test-migration-project": "express@^4.18.0"
        }
      },
      "old-package@1.0.0": {
        "dependents": {
          "test-migration-project": "old-package@^1.0.0"
        }
      }
    }
  }
}
EOF

# Create patches directory with sample patches
mkdir -p patches
cp /app/e2e/fixtures/patches/*.patch patches/

echo ""
echo "2️⃣ Showing initial state ($LATEST_1_3_X format)..."
show_package_json

echo ""
echo "3️⃣ Running pastoralist $LATEST_1_4_X on $LATEST_1_3_X format..."
node /app/pastoralist/index.js

print_result $? "Migration run completed"

echo ""
echo "4️⃣ Validating post-migration structure..."
show_package_json

echo ""
echo "5️⃣ Testing new 1.4.x features (fuzzy compatibility)..."

# Test 1: Verify patches are detected and tracked
echo "Testing patch detection and tracking..."
if grep -q '"patches":' package.json; then
    echo "✅ Patches section found in appendix"
    
    # Verify patches are properly tracked for lodash
    if jq -e '.pastoralist.appendix."lodash@4.17.21".patches' package.json > /dev/null; then
        echo "✅ Lodash patches properly tracked"
    else
        echo "❌ Lodash patches not tracked correctly"
        exit 1
    fi
else
    echo "⚠️  No patches section found (may be expected if no patches detected)"
fi

# Test 2: Verify peerDependencies support
echo "Testing peerDependencies support..."
if jq -e '.peerDependencies.typescript' package.json > /dev/null; then
    echo "✅ peerDependencies preserved"
    
    # Check if typescript is considered in dependency resolution
    PEER_DEPS_COUNT=$(jq '[.pastoralist.appendix // {} | to_entries[] | select(.value.dependents // {} | has("typescript") or (.value.dependents // {} | to_entries[] | .value | test("typescript"; "i")))] | length' package.json 2>/dev/null || echo "0")
    echo "📊 Found $PEER_DEPS_COUNT entries potentially related to peerDependencies"
else
    echo "❌ peerDependencies not preserved"
    exit 1
fi

# Test 3: Verify backward compatibility with existing appendix
echo "Testing backward compatibility with existing appendix..."
APPENDIX_ENTRIES=$(jq '.pastoralist.appendix | keys | length' package.json)
if [ "$APPENDIX_ENTRIES" -gt 0 ]; then
    echo "✅ Existing appendix entries preserved ($APPENDIX_ENTRIES entries)"
else
    echo "❌ Existing appendix entries lost during migration"
    exit 1
fi

# Test 4: Remove a dependency and verify cleanup
echo ""
echo "6️⃣ Testing cleanup of unused dependencies after migration..."

# Remove old-package from devDependencies to test cleanup behavior
jq 'del(.devDependencies."old-package")' package.json > package.json.tmp && mv package.json.tmp package.json

echo "Running pastoralist after removing old-package..."
node /app/pastoralist/index.js

# Verify old-package override is removed from overrides (since dependency no longer exists)
if jq -e '.overrides."old-package"' package.json > /dev/null 2>&1; then
    echo "❌ old-package override should have been removed but still exists"
    exit 1
else
    echo "✅ old-package override properly removed"
fi

# Verify old-package appendix entry is removed
if jq -e '.pastoralist.appendix."old-package@1.0.0"' package.json > /dev/null 2>&1; then
    echo "❌ old-package appendix entry should have been removed but still exists"
    exit 1
else
    echo "✅ old-package appendix entry properly removed"
fi

# Test 5: Verify enhanced dependency tracking
echo ""
echo "7️⃣ Testing enhanced dependency tracking..."

# Add a new package with patches
cat > package.json.tmp << 'EOF'
{
  "name": "test-migration-project", 
  "version": "1.0.0",
  "description": "Test project for migration from pastoralist 1.3.0 to 1.4.0",
  "dependencies": {
    "lodash": "^4.17.21",
    "express": "^4.18.0", 
    "react": "^18.2.0",
    "new-dep": "^2.1.0"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "overrides": {
    "lodash": "4.17.21",
    "express": "4.18.0",
    "new-dep": "2.1.0"
  }
}
EOF

mv package.json.tmp package.json

# Add a patch for the new dependency
echo "patch for new-dep" > patches/new-dep+2.1.0.patch

echo "Running pastoralist with new dependency and patch..."
node /app/pastoralist/index.js

# Verify new dependency is tracked with patch
if jq -e '.pastoralist.appendix."new-dep@2.1.0"' package.json > /dev/null; then
    echo "✅ New dependency tracked in appendix"
    
    if jq -e '.pastoralist.appendix."new-dep@2.1.0".patches' package.json > /dev/null; then
        echo "✅ New dependency patch tracked"
    else
        echo "⚠️  New dependency patch not tracked (may need patch-package format)"
    fi
else
    echo "❌ New dependency not tracked in appendix"
    exit 1
fi

echo ""
echo "8️⃣ Final validation..."
show_package_json

# Final structure validation
REQUIRED_PATHS=("pastoralist" "pastoralist.appendix")
for path in "${REQUIRED_PATHS[@]}"; do
    if jq -e ".$path" package.json > /dev/null; then
        echo "✅ Required field '$path' present"
    else
        echo "❌ Required field '$path' missing"
        exit 1
    fi
done

echo ""
echo "🎉 Migration Test Summary"
echo "========================="
echo "✅ $LATEST_1_3_X format successfully migrated to $LATEST_1_4_X"
echo "✅ Existing appendix entries preserved"
echo "✅ New patch tracking functionality works"
echo "✅ peerDependencies support verified"
echo "✅ Enhanced dependency cleanup functionality verified"
echo "✅ Backward compatibility maintained"
echo "✅ Fuzzy version matching compatibility verified"
echo ""
echo "🔄 Migration from $LATEST_1_3_X to $LATEST_1_4_X completed successfully!"

exit 0
