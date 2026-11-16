#!/usr/bin/env bash
# Compares or refreshes the vendored Swiss Ephemeris sources against upstream.
#
#   ./update.sh check [ref]    report which vendored files differ; changes nothing
#   ./update.sh update [ref]   overwrite src/ and the licence files, bump UPSTREAM
#
# ref is a branch, tag or full commit hash; it defaults to master.
set -euo pipefail

cd "$(dirname "$0")"
# shellcheck source=UPSTREAM
. ./UPSTREAM

cmd=${1:-check}
ref=${2:-master}
licences=(LICENSE agpl-3.0.txt)

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Sparse and blobless: only top-level files are downloaded, which skips the
# ~480 MB of ephemeris data in ephe/.
git init -q "$tmp"
git -C "$tmp" remote add origin "$url"
git -C "$tmp" sparse-checkout init --cone
git -C "$tmp" fetch -q --depth 1 --filter=blob:none origin "$ref"
git -C "$tmp" checkout -q FETCH_HEAD
head=$(git -C "$tmp" rev-parse HEAD)

changed=()
for f in src/*; do
  name=${f#src/}
  if [ ! -f "$tmp/$name" ]; then
    echo "error: $name no longer exists upstream; resolve by hand" >&2
    exit 2
  fi
  cmp -s "$f" "$tmp/$name" || changed+=("$name")
done

echo "pinned:   $commit"
echo "upstream: $head ($ref)"
if [ ${#changed[@]} -eq 0 ]; then
  echo "vendored files are identical to upstream"
else
  echo "changed upstream: ${changed[*]}"
  echo "review: ${url%.git}/compare/$commit...$head"
fi

case $cmd in
  check)
    [ ${#changed[@]} -eq 0 ]
    ;;
  update)
    for f in src/*; do cp "$tmp/${f#src/}" "$f"; done
    for f in "${licences[@]}"; do cp "$tmp/$f" "$f"; done
    printf 'url=%s\ncommit=%s\n' "$url" "$head" >UPSTREAM
    echo "updated to $head; now run: npm run sweph:build && npm run test"
    ;;
  *)
    echo "usage: $0 [check|update] [ref]" >&2
    exit 64
    ;;
esac
