#!/bin/sh
set -eu

main() {
  SHELLCHECK_VERSION=$(shellcheck --version)
  SHELLCHECK_LEGIBILITY_VERSION=$(shellcheck-legibility --version)
  SHELL_LINT_PLATFORM=$(uname -sm)
  export SHELLCHECK_VERSION SHELLCHECK_LEGIBILITY_VERSION SHELL_LINT_PLATFORM
  exec turbo run lint:shell:check "$@"
}

main "$@"
