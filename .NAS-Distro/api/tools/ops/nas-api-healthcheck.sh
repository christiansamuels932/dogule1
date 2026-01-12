#!/bin/sh
set -eu

ROOT="/volume1/dogule1nasfolder/dogule1"
SOCKET="${DOGULE1_MARIADB_SOCKET:-/run/mysqld/mysqld10.sock}"
API_URL="${DOGULE1_HEALTHCHECK_URL:-http://127.0.0.1:5177/api/kunden}"

timestamp() {
  date "+%Y-%m-%dT%H:%M:%S%z"
}

echo "$(timestamp) healthcheck: start"

if [ -n "$SOCKET" ]; then
  if [ -S "$SOCKET" ]; then
    echo "$(timestamp) healthcheck: mariadb socket ok ($SOCKET)"
  else
    echo "$(timestamp) healthcheck: mariadb socket missing ($SOCKET)"
  fi
fi

if command -v curl >/dev/null 2>&1; then
  code="$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" || true)"
  if [ "$code" = "200" ]; then
    echo "$(timestamp) healthcheck: api ok ($API_URL)"
  else
    echo "$(timestamp) healthcheck: api fail ($API_URL) code=$code"
  fi
else
  echo "$(timestamp) healthcheck: curl missing, api check skipped"
fi
