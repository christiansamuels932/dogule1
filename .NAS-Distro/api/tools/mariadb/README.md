# MariaDB local setup (Station 74)

This folder contains the Dogule1 MariaDB schema and local dev bootstrap notes.

## Paths

- Data directory: `/home/ran/codex/.local/mariadb`
- Socket: `/home/ran/codex/.local/mariadb/mariadb.sock`
- PID file: `/home/ran/codex/.local/mariadb/mariadb.pid`
- Error log: `/home/ran/codex/.local/mariadb/mariadb.err`

## Initialize (first run)

```
mariadbd --initialize-insecure --datadir /home/ran/codex/.local/mariadb
```

## Start (foreground)

```
mariadbd \
  --datadir /home/ran/codex/.local/mariadb \
  --socket /home/ran/codex/.local/mariadb/mariadb.sock \
  --pid-file /home/ran/codex/.local/mariadb/mariadb.pid \
  --log-error /home/ran/codex/.local/mariadb/mariadb.err \
  --port 3307 \
  --bind-address 127.0.0.1
```

If TCP bind is blocked, run socket-only:

```
mariadbd \
  --datadir /home/ran/codex/.local/mariadb \
  --socket /home/ran/codex/.local/mariadb/mariadb.sock \
  --pid-file /home/ran/codex/.local/mariadb/mariadb.pid \
  --log-error /home/ran/codex/.local/mariadb/mariadb.err \
  --skip-networking
```

## Apply schema

```
mariadb \
  --protocol=socket \
  --socket /home/ran/codex/.local/mariadb/mariadb.sock \
  < tools/mariadb/schema.sql
```

## Stop

```
mariadb-admin \
  --protocol=socket \
  --socket /home/ran/codex/.local/mariadb/mariadb.sock \
  shutdown
```

## Environment variables

```
DOGULE1_STORAGE_MODE=mariadb
DOGULE1_MARIADB_SOCKET=/home/ran/codex/.local/mariadb/mariadb.sock
DOGULE1_MARIADB_DATABASE=dogule1
DOGULE1_MARIADB_USER=root
DOGULE1_MARIADB_PASSWORD=
```
