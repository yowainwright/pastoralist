#!/bin/sh
set -eu

release_tag=${1:?Release tag is required}
shift

if [ "$#" -eq 0 ]; then
  printf 'At least one release asset is required\n' >&2
  exit 1
fi

release_json=$(gh api "repos/$GITHUB_REPOSITORY/releases/tags/$release_tag")

for asset_path in "$@"; do
  asset_name=$(basename "$asset_path")
  expected_digest="sha256:$(shasum -a 256 "$asset_path" | awk '{print $1}')"
  published_digest=$(printf '%s' "$release_json" | jq -r --arg name "$asset_name" \
    '[.assets[] | select(.name == $name)] | if length == 0 then "missing" else .[0].digest // "unavailable" end')

  if [ "$published_digest" = "missing" ]; then
    gh release upload "$release_tag" "$asset_path"
    continue
  fi

  if [ "$published_digest" = "$expected_digest" ]; then
    continue
  fi

  if [ "$published_digest" = "unavailable" ]; then
    printf 'Release asset digest unavailable: %s\n' "$asset_name" >&2
    exit 1
  fi

  printf 'Release asset digest mismatch: %s\n' "$asset_name" >&2
  exit 1
done
