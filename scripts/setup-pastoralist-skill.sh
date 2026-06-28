#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

exec sh "$script_dir/setup-local-dev.sh" --agent skip --skills pastoralist --hooks none "$@"
