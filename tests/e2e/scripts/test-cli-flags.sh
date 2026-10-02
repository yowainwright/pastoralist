#!/bin/bash

set -e

print_header() {
  echo "🧪 Testing CLI Flags & Options"
  echo "=============================="
}

print_result() {
  if [ "$1" -eq 0 ]; then
    echo "✅ $2"
  else
    echo "❌ $2"
    exit 1
  fi
}

check_dry_run() {
  echo "Comparing files after dry-run..."
  if diff package.json package-original.json; then
    echo "✅ --dry-run did not modify package.json"
  else
    echo "❌ --dry-run should not modify files"
    echo "Differences found:"
    diff package.json package-original.json
    exit 1
  fi
}

test_dry_run() {
  # Test 1: --dry-run flag
  echo ""
  echo "1️⃣ Testing --dry-run Flag..."
  echo "---------------------------"

  mkdir -p /tmp/dryrun-test
  cd /tmp/dryrun-test

  cp /app/e2e/fixtures/dryrun-test-package.json package.json
  cp package.json package-original.json

  echo "Initial package.json:"
  cat package.json
  echo ""

  echo "Running pastoralist with --dry-run..."
  node /app/pastoralist/index.js --dry-run
  print_result $? "Dry-run command executed"

  check_dry_run
}

check_custom_path() {
  if grep -q "pastoralist" subdir/custom.json; then
    echo "✅ --path correctly targeted custom package.json"
  else
    echo "❌ --path did not modify target file"
    exit 1
  fi

  # Verify it didn't create package.json in current directory
  if [ -f package.json ]; then
    echo "❌ Should not create package.json in working directory"
    exit 1
  fi
  echo "✅ Did not create package.json in working directory"
}

test_custom_path() {
  # Test 2: --path flag (custom package.json path)
  echo ""
  echo "2️⃣ Testing --path Flag..."
  echo "------------------------"

  mkdir -p /tmp/custom-path-test/subdir
  cd /tmp/custom-path-test

  cp /app/e2e/fixtures/custom-root-package.json subdir/custom.json

  echo "Running pastoralist with --path subdir/custom.json..."
  node /app/pastoralist/index.js --path subdir/custom.json
  print_result $? "Custom path flag executed"

  check_custom_path
}

test_root() {
  # Test 3: --root flag (custom root directory)
  echo ""
  echo "3️⃣ Testing --root Flag..."
  echo "------------------------"

  mkdir -p /tmp/root-flag-test/project
  cd /tmp/root-flag-test

  cp /app/e2e/fixtures/npm-single-package.json project/package.json

  echo "Running pastoralist with --root project..."
  node /app/pastoralist/index.js --root project
  print_result $? "Custom root flag executed"

  if grep -q "pastoralist" project/package.json; then
    echo "✅ --root correctly targeted project directory"
  else
    echo "❌ --root did not process target directory"
    exit 1
  fi
}

check_dep_paths() {
  if grep -q '"app1"' package.json; then
    echo "✅ Specified package tracked via CLI flag"
  else
    echo "❌ CLI-specified package not tracked"
    exit 1
  fi

  if grep -q '"app2"' package.json; then
    echo "❌ Non-specified package should not be tracked"
    exit 1
  fi
  echo "✅ Non-specified package correctly excluded"
}

test_dep_paths() {
  # Test 5: --depPaths flag (CLI override)
  echo ""
  echo "5️⃣ Testing --depPaths CLI Flag..."
  echo "--------------------------------"

  mkdir -p /tmp/deppaths-cli-test/packages/app1 /tmp/deppaths-cli-test/packages/app2
  cd /tmp/deppaths-cli-test

  cat >package.json <<'EOF'
{
  "name": "deppaths-test",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21"
  }
}
EOF

  cat >packages/app1/package.json <<'EOF'
{
  "name": "app1",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

  cat >packages/app2/package.json <<'EOF'
{
  "name": "app2",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
EOF

  echo "Running pastoralist with --depPaths 'packages/app1/package.json'..."
  node /app/pastoralist/index.js --depPaths "packages/app1/package.json"
  print_result $? "depPaths CLI flag executed"

  check_dep_paths
}

test_combined_flags() {
  # Test 8: Combining multiple flags
  echo ""
  echo "8️⃣ Testing Multiple Flags Combined..."
  echo "-------------------------------------"

  mkdir -p /tmp/multi-flag-test/project
  cd /tmp/multi-flag-test

  cp /app/e2e/fixtures/npm-single-package.json project/package.json

  echo "Running pastoralist with --root, --debug, and --dry-run..."
  node /app/pastoralist/index.js --root project --debug --dry-run
  print_result $? "Multiple flags executed"

  cp project/package.json project/package-after.json
  if diff /app/e2e/fixtures/npm-single-package.json project/package-after.json; then
    echo "✅ --dry-run still prevents modifications with other flags"
  else
    echo "❌ --dry-run should prevent modifications even with other flags"
    exit 1
  fi
}

print_success() {
  echo "🎉 All CLI Flags & Options Tests Passed!"
  echo "========================================"
}

main() {
  print_header
  test_dry_run
  test_custom_path
  test_root
  test_dep_paths
  test_combined_flags
  print_success
}

main "$@"
