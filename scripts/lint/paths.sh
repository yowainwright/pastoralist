#!/bin/sh
set -eu

main() {
  if [ -x .cache/fs-lint/build/fs-lint ]; then
    find tests/unit app/tests/unit app/src -type f -name '*.test.ts' \
      -exec .cache/fs-lint/build/fs-lint check -- {} +
    return
  fi
  find tests/unit app/tests/unit app/src -type f -name '*.test.ts' \
    -exec fs-lint check -- {} +
}

main "$@"
