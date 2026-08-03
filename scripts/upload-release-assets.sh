#!/bin/sh
set -eu

release_tag=${1:?Release tag is required}
shift

if [ "$#" -eq 0 ]; then
  printf 'At least one release asset is required\n' >&2
  exit 1
fi

releases_endpoint="repos/$GITHUB_REPOSITORY/releases?per_page=100"
release_json=$(gh api --paginate --slurp "$releases_endpoint" | \
  jq -c --arg tag "$release_tag" '[.[][] | select(.tag_name == $tag)] | first // empty')

if [ -z "$release_json" ]; then
  printf 'Release not found: %s\n' "$release_tag" >&2
  exit 1
fi

release_id=$(printf '%s' "$release_json" | jq -r '.id')
upload_url=$(printf '%s' "$release_json" | jq -r '.upload_url | split("{")[0]')
expected_upload_url="https://uploads.github.com/repos/$GITHUB_REPOSITORY/releases/$release_id/assets"

if [ "$upload_url" != "$expected_upload_url" ]; then
  printf 'Unexpected release upload URL: %s\n' "$upload_url" >&2
  exit 1
fi

for asset_path in "$@"; do
  asset_name=$(basename "$asset_path")
  expected_digest="sha256:$(shasum -a 256 "$asset_path" | awk '{print $1}')"
  published_digest=$(printf '%s' "$release_json" | jq -r --arg name "$asset_name" \
    '[.assets[] | select(.name == $name)] | if length == 0 then "missing" else .[0].digest // "unavailable" end')

  if [ "$published_digest" = "missing" ]; then
    encoded_name=$(jq -nr --arg name "$asset_name" '$name | @uri')
    asset_url="${upload_url}?name=${encoded_name}"
    gh api --method POST \
      --header "Content-Type: application/octet-stream" \
      --input "$asset_path" \
      "$asset_url" >/dev/null
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

printf '%s\n' "$release_id"
