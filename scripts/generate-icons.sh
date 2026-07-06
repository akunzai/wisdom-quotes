#!/usr/bin/env bash
# Regenerate PWA PNG icons from public/icon.svg (macOS qlmanage).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/icon.svg"
OUT="$ROOT/public"
TMP="${TMPDIR:-/tmp}"

if ! command -v qlmanage >/dev/null 2>&1; then
  echo "qlmanage not found (macOS only). Edit public/icon.svg and export PNGs manually."
  exit 1
fi

render() {
  local size="$1" dest="$2"
  qlmanage -t -s "$size" -o "$TMP" "$SRC" >/dev/null
  cp "$TMP/icon.svg.png" "$dest"
}

render 180 "$OUT/apple-touch-icon.png"
render 192 "$OUT/icon-192.png"
render 512 "$OUT/icon-512.png"

echo "Generated: apple-touch-icon.png, icon-192.png, icon-512.png"