#!/usr/bin/env bash
# Build the Chrome Web Store upload: dist/divpointers-<version>.zip
# (manifest.json at the zip root, no repo-only files - just what the
# extension actually loads: manifest, background, engine, icons).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
version="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$root/manifest.json" | head -n 1)"
out="$root/dist/divpointers-$version.zip"

mkdir -p "$root/dist"
rm -f "$out"
(cd "$root" && zip -r -X -q "$out" manifest.json background.js engine.js icons -x '*.DS_Store')
echo "Built $out"
unzip -l "$out"
