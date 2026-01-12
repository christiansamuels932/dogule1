#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/volume1/dogule1}"
SRC="${2:-/volume1/dogule1/repo}"

if [[ ! -d "$SRC" ]]; then
  echo "Missing repo at $SRC" >&2
  exit 1
fi

cd "$SRC"

git pull
pnpm install
pnpm build

rsync -a --delete "$SRC/dist/" "$ROOT/app/"

if [[ -f "$ROOT/config/dogule1.env" ]]; then
  echo "Restart API manually or via service manager."
fi
