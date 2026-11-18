#!/bin/bash

set -euo pipefail

project_dir="${PYTHON_E2E_DIR:-/app/e2e-python}"
fixture_dir="${PYTHON_FIXTURE_DIR:-/app/fixtures}"
cli="${PASTORALIST_CLI:-/app/pastoralist/index.js}"

run_cli() {
  case "$cli" in
  *.js) node "$cli" "$@" ;;
  *) "$cli" "$@" ;;
  esac
}

prepare_project() {
  mkdir -p "$project_dir"
  cp "$fixture_dir/pyproject.toml" "$project_dir/pyproject.toml"
  cp "$fixture_dir/uv.lock" "$project_dir/uv.lock"
  test ! -e "$project_dir/package.json"
}

check_dry_run() {
  run_cli --root "$project_dir" --dry-run --outputFormat json >"$project_dir/dry-run.json"
  jq -e '.success and .overrideCount == 1 and .updated == false' "$project_dir/dry-run.json" >/dev/null
  jq -e '.dependencyDiagnostics[0].reason == "unverified-lockfile"' "$project_dir/dry-run.json" >/dev/null
  test ! -e "$project_dir/.pastoralistrc"
}

check_tracking() {
  run_cli --root "$project_dir" --outputFormat json >"$project_dir/result.json"
  jq -e '.success and .appliedOverrides.urllib3 == "==2.8.0"' "$project_dir/result.json" >/dev/null
  jq -e '.appendix["urllib3@==2.8.0"].dependents["uv-fixture"] == "urllib3 (required by requests)"' "$project_dir/.pastoralistrc" >/dev/null
  cp "$project_dir/.pastoralistrc" "$project_dir/first-run.json"
  run_cli --root "$project_dir" --outputFormat json >"$project_dir/second-run.json"
  jq -e '.success and .updated == false' "$project_dir/second-run.json" >/dev/null
  cmp "$project_dir/first-run.json" "$project_dir/.pastoralistrc"
}

check_native_resolution() {
  uv lock --project "$project_dir" --check --offline --no-python-downloads
  uv export --project "$project_dir" --frozen --no-hashes --format requirements-txt >"$project_dir/requirements.txt"
  grep -Fx 'urllib3==2.8.0' "$project_dir/requirements.txt"
  cmp "$fixture_dir/pyproject.toml" "$project_dir/pyproject.toml"
  cmp "$fixture_dir/uv.lock" "$project_dir/uv.lock"
  test ! -e "$project_dir/package.json"
}

check_stale_lock() {
  local stale_dir="$project_dir/stale"
  mkdir -p "$stale_dir"
  sed 's/^dependencies = .*/dependencies = []/' "$fixture_dir/pyproject.toml" >"$stale_dir/pyproject.toml"
  cp "$fixture_dir/uv.lock" "$stale_dir/uv.lock"
  if uv lock --project "$stale_dir" --check --offline --no-python-downloads >"$stale_dir/check.log" 2>&1; then
    echo "uv accepted a stale lockfile" >&2
    return 1
  fi
  grep -F 'needs to be updated' "$stale_dir/check.log"
  run_cli --root "$stale_dir" --dry-run --outputFormat json >"$stale_dir/result.json"
  jq -e '.success and .overrideCount == 1 and .unusedOverrideCount == 0 and .dependencyDiagnostics[0].reason == "unverified-lockfile"' "$stale_dir/result.json" >/dev/null
  cmp "$fixture_dir/uv.lock" "$stale_dir/uv.lock"
  test ! -e "$stale_dir/.pastoralistrc"
}

main() {
  prepare_project
  check_dry_run
  check_tracking
  check_native_resolution
  check_stale_lock
  echo "uv override tracking E2E passed"
}

main "$@"
