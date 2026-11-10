#!/bin/bash

set -euo pipefail

manager="${PACKAGE_MANAGER:-pnpm}"
scenario="${E2E_SCENARIO:-overrides}"
project=/app/e2e/interactive
baseline=/app/e2e/interactive-baseline

main() {
  validate_environment
  local command
  command="$(basename "$0")"
  if [ "$command" = interactive.sh ]; then
    command="${1:-start}"
  fi
  dispatch "$command" "$@"
}

dispatch() {
  local command="${1:?command required}"
  shift
  case "$command" in
  start) start_shell ;;
  init) initialize_project ;;
  shell) open_shell ;;
  pastoralist) node "${PASTORALIST_E2E_CLI:-/app/pastoralist/index.js}" "$@" ;;
  e2e-diff) e2e_diff ;;
  e2e-reset) e2e_reset ;;
  e2e-install) e2e_install ;;
  *) unknown_command "$command" ;;
  esac
}

start_shell() {
  initialize_project
  open_shell
}

initialize_project() {
  mkdir -p "$project"
  cd "$project"
  create_manifest
  if [ "$scenario" = overrides ]; then add_overrides; fi
  if [ "$scenario" = patches ]; then
    add_overrides
    add_patch_tool
  fi
  install_dependencies
  if [ "$scenario" = patches ]; then
    create_patch
    e2e_install
  fi
  snapshot_project
}

e2e_reset() {
  cd "$project"
  find "$project" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
  cp -a "$baseline/." "$project/"
  install_dependencies locked
  apply_patches
  printf 'Restored baseline files and dependencies.\n'
}

e2e_install() {
  cd "$project"
  install_dependencies
  apply_patches
}

open_shell() {
  cd "$project"
  environment_info
  printf '\nTry: pastoralist doctor\n'
  printf 'Security: pastoralist --checkSecurity --securityProvider osv --interactive --strict --refresh-cache\n'
  printf 'Inspect: e2e-diff | Reset: e2e-reset | Reinstall: e2e-install | Exit: exit\n\n'
  export PS1="e2e:$manager/$scenario \\w \\$ "
  exec bash --noprofile --norc -i
}

validate_environment() {
  case "$manager" in
  npm | pnpm | yarn | bun) ;;
  *) return 1 ;;
  esac
  case "$scenario" in
  clean | overrides | patches | security) ;;
  *) return 1 ;;
  esac
}

create_manifest() {
  local version
  version="$("$manager" --version)"
  jq -n --arg manager "$manager@$version" --arg scenario "$scenario" \
    '{name: "pastoralist-manual", version: "1.0.0", private: true, packageManager: $manager,
      dependencies: {"is-odd": "3.0.1"}} |
      if $scenario == "security" then .dependencies = {lodash: "4.17.15"} else . end' >package.json
  if [ "$manager" = pnpm ]; then
    printf 'packages: []\nenableGlobalVirtualStore: false\n' >pnpm-workspace.yaml
  fi
}

add_overrides() {
  if [ "$manager" = pnpm ]; then
    printf 'overrides:\n  is-number: 7.0.0\n  is-odd: 3.0.1\n' >>pnpm-workspace.yaml
    return
  fi
  local field=overrides
  if [ "$manager" = yarn ]; then field=resolutions; fi
  jq --arg field "$field" '.[$field] = {"is-number": "7.0.0", "is-odd": "3.0.1"}' package.json >package.next.json
  mv package.next.json package.json
}

add_patch_tool() {
  if [ "$manager" = pnpm ]; then return; fi
  jq '.devDependencies = {"patch-package": "8.0.0"} |
    .scripts = {postinstall: "patch-package"}' package.json >package.next.json
  mv package.next.json package.json
}

install_dependencies() {
  local mode="${1:-resolve}"
  case "$manager" in
  npm) install_npm "$mode" ;;
  pnpm) install_pnpm "$mode" ;;
  yarn) install_yarn "$mode" ;;
  bun) install_bun "$mode" ;;
  esac
}

install_npm() {
  local command=install
  if [ "$1" = locked ]; then command=ci; fi
  npm "$command" --ignore-scripts --no-audit --no-fund
}

install_yarn() {
  local args=()
  if [ "$1" = locked ]; then args+=(--frozen-lockfile); fi
  yarn install --ignore-scripts --non-interactive --cache-folder /cache/yarn "${args[@]}"
}

install_bun() {
  local args=()
  if [ "$1" = locked ]; then args+=(--frozen-lockfile); fi
  bun install --ignore-scripts "${args[@]}"
}

install_pnpm() {
  local args=(--no-frozen-lockfile)
  if [ "$1" = locked ]; then args=(--frozen-lockfile); fi
  pnpm install --ignore-scripts --ignore-pnpmfile --store-dir /cache/pnpm "${args[@]}"
}

create_patch() {
  mkdir -p patches
  cp node_modules/is-odd/index.js /app/e2e/patch-before.js
  cp /app/e2e/patch-before.js /app/e2e/patch-after.js
  printf '\nmodule.exports.e2e = true;\n' >>/app/e2e/patch-after.js
  local prefix=node_modules/is-odd/
  if [ "$manager" = pnpm ]; then prefix=""; fi
  printf 'diff --git a/%sindex.js b/%sindex.js\n' "$prefix" "$prefix" >patches/is-odd+3.0.1.patch
  diff -u --label "a/${prefix}index.js" --label "b/${prefix}index.js" \
    /app/e2e/patch-before.js /app/e2e/patch-after.js >>patches/is-odd+3.0.1.patch || test "$?" -eq 1
  if [ "$manager" = pnpm ]; then
    printf 'patchedDependencies:\n  is-odd@3.0.1: patches/is-odd+3.0.1.patch\n' >>pnpm-workspace.yaml
  fi
}

apply_patches() {
  if [ "$scenario" != patches ]; then return; fi
  if [ "$manager" = pnpm ]; then return; fi
  node node_modules/patch-package/index.js
}

snapshot_project() {
  mkdir -p "$baseline"
  tar --exclude='./node_modules' --exclude='./.cache' --exclude='./.perry-cache' \
    -cf - . | tar -xf - -C "$baseline"
}

e2e_diff() {
  local status=0
  diff -ruN --exclude=node_modules --exclude=.cache --exclude=.perry-cache \
    "$baseline" "$project" || status="$?"
  if [ "$status" -gt 1 ]; then return "$status"; fi
}

environment_info() {
  printf 'Manager: %s (%s)\nScenario: %s\nNode: %s\n' \
    "$manager" "$("$manager" --version)" "$scenario" "$(node --version)"
}

unknown_command() {
  printf 'Unknown E2E command: %s\n' "$1" >&2
  return 1
}

main "$@"
