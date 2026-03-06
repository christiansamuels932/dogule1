#!/bin/sh
set -eu

API_URL="${DOGULE1_HEALTHCHECK_URL:-http://127.0.0.1:5177/healthz}"
SOCKET="${DOGULE1_MARIADB_SOCKET:-/run/mysqld/mysqld.sock}"

timestamp() {
  date "+%Y-%m-%dT%H:%M:%S%z"
}

echo "$(timestamp) healthcheck: start"

if [ -n "$SOCKET" ]; then
  if [ -S "$SOCKET" ]; then
    echo "$(timestamp) healthcheck: mariadb socket ok ($SOCKET)"
  else
    echo "$(timestamp) healthcheck: mariadb socket missing ($SOCKET)"
    exit 1
  fi
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "$(timestamp) healthcheck: curl missing"
  exit 1
fi

code="$(curl -fsS -o /dev/null -w "%{http_code}" "$API_URL" || true)"
if [ "$code" != "200" ]; then
  echo "$(timestamp) healthcheck: api fail ($API_URL) code=$code"
  exit 1
fi

echo "$(timestamp) healthcheck: api ok ($API_URL)"
