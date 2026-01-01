#!/bin/sh
set -eu

ROOT="/volume1/dogule1nasfolder/dogule1"
LOG="$ROOT/api.log"
SOCKET="${DOGULE1_MARIADB_SOCKET:-/run/mysqld/mysqld10.sock}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"

if pgrep -f "tools/server/apiServer.js" >/dev/null 2>&1; then
  exit 0
fi

cd "$ROOT"
set -a
. "$ROOT/.env"
set +a

if [ -z "$NODE_BIN" ]; then
  echo "node not found in PATH; set NODE_BIN or update PATH" >> "$LOG"
  exit 1
fi

if [ -n "$SOCKET" ]; then
  tries=0
  while [ ! -S "$SOCKET" ] && [ "$tries" -lt 30 ]; do
    tries=$((tries + 1))
    sleep 2
  done
fi

nohup "$NODE_BIN" tools/server/apiServer.js >> "$LOG" 2>&1 &
