#!/usr/bin/env bash
set -euo pipefail

DATABASE="spike009"

is_postgres_18() {
  [ -x "$1/postgres" ] && "$1/postgres" --version | grep -Eq ' 18\.'
}

discover_pg_bin() {
  if [ -n "${POSTGRES_BIN:-}" ]; then
    if [ -x "$POSTGRES_BIN/pg_ctl" ] && is_postgres_18 "$POSTGRES_BIN"; then
      printf '%s\n' "$POSTGRES_BIN"
      return
    fi
    printf '%s\n' 'POSTGRES_BIN must point to PostgreSQL 18.x binaries.' >&2
    return 1
  fi
  for candidate in /opt/homebrew/opt/postgresql@18/bin /usr/lib/postgresql/18/bin /usr/local/pgsql/bin; do
    if [ -x "$candidate/pg_ctl" ] && is_postgres_18 "$candidate"; then
      printf '%s\n' "$candidate"
      return
    fi
  done
  if command -v pg_config >/dev/null 2>&1; then
    local candidate
    candidate="$("$(command -v pg_config)" --bindir)"
    if [ -x "$candidate/pg_ctl" ] && is_postgres_18 "$candidate"; then
      printf '%s\n' "$candidate"
      return
    fi
  fi
  printf '%s\n' 'PostgreSQL 18 binaries were not found; set POSTGRES_BIN.' >&2
  return 1
}

available_port() {
  node -e "const net=require('node:net');const s=net.createServer();s.listen(0,'127.0.0.1',()=>{process.stdout.write(String(s.address().port));s.close();});"
}

owned_run_dir() {
  [ -n "${SPIKE_PG_RUN_DIR:-}" ] && [ -f "$SPIKE_PG_RUN_DIR/.spike009-owned" ]
}

write_environment() {
  local environment_file="$SPIKE_PG_RUN_DIR/environment"
  umask 077
  {
    printf "export POSTGRES_BIN='%s'\n" "$POSTGRES_BIN"
    printf "export SPIKE_PG_RUN_DIR='%s'\n" "$SPIKE_PG_RUN_DIR"
    printf "export SPIKE_POSTGRES_PORT='%s'\n" "$SPIKE_POSTGRES_PORT"
    printf "export SPIKE_POSTGRES_SOCKET='%s'\n" "$SPIKE_POSTGRES_SOCKET"
    printf "export SPIKE_DATABASE_URL='%s'\n" "$SPIKE_DATABASE_URL"
  } >"$environment_file"
}

start() {
  POSTGRES_BIN="$(discover_pg_bin)"
  export POSTGRES_BIN
  if [ -z "${SPIKE_PG_RUN_DIR:-}" ]; then
    SPIKE_PG_RUN_DIR="$(mktemp -d "${SPIKE_TMP_ROOT:-/tmp}/srtaller-spike009.XXXXXX")"
    export SPIKE_PG_RUN_DIR
  else
    mkdir -p "$SPIKE_PG_RUN_DIR"
  fi
  : >"$SPIKE_PG_RUN_DIR/.spike009-owned"
  local data_dir="$SPIKE_PG_RUN_DIR/postgres-data"
  local log_file="$SPIKE_PG_RUN_DIR/postgres.log"
  SPIKE_POSTGRES_SOCKET="$SPIKE_PG_RUN_DIR/socket"
  export SPIKE_POSTGRES_SOCKET
  mkdir -p "$SPIKE_POSTGRES_SOCKET"
  if [ ! -f "$data_dir/PG_VERSION" ]; then
    "$POSTGRES_BIN/initdb" -D "$data_dir" -A trust -U postgres --no-locale --encoding=UTF8 >/dev/null
  fi

  local attempt
  for attempt in 1 2 3 4 5; do
    SPIKE_POSTGRES_PORT="${SPIKE_POSTGRES_PORT:-$(available_port)}"
    export SPIKE_POSTGRES_PORT
    if "$POSTGRES_BIN/pg_ctl" -D "$data_dir" -l "$log_file" \
      -o "-p $SPIKE_POSTGRES_PORT -h 127.0.0.1 -k $SPIKE_POSTGRES_SOCKET" start >/dev/null 2>&1; then
      break
    fi
    if [ "$attempt" -eq 5 ] || [ -n "${SPIKE_POSTGRES_PORT_FIXED:-}" ]; then
      printf '%s\n' 'PostgreSQL could not start on an isolated port.' >&2
      return 1
    fi
    unset SPIKE_POSTGRES_PORT
  done

  SPIKE_DATABASE_URL="postgresql://postgres@127.0.0.1:${SPIKE_POSTGRES_PORT}/${DATABASE}"
  export SPIKE_DATABASE_URL
  if ! "$POSTGRES_BIN/psql" "postgresql://postgres@127.0.0.1:${SPIKE_POSTGRES_PORT}/postgres" \
    -Atqc "SELECT 1 FROM pg_database WHERE datname = '${DATABASE}'" | grep -qx 1; then
    "$POSTGRES_BIN/createdb" -h 127.0.0.1 -p "$SPIKE_POSTGRES_PORT" -U postgres "$DATABASE"
  fi
  write_environment
  printf "export POSTGRES_BIN='%s'\n" "$POSTGRES_BIN"
  printf "export SPIKE_PG_RUN_DIR='%s'\n" "$SPIKE_PG_RUN_DIR"
  printf "export SPIKE_POSTGRES_PORT='%s'\n" "$SPIKE_POSTGRES_PORT"
  printf "export SPIKE_POSTGRES_SOCKET='%s'\n" "$SPIKE_POSTGRES_SOCKET"
  printf "export SPIKE_DATABASE_URL='%s'\n" "$SPIKE_DATABASE_URL"
}

stop() {
  if ! owned_run_dir; then
    return 0
  fi
  POSTGRES_BIN="${POSTGRES_BIN:-$(discover_pg_bin)}"
  local data_dir="$SPIKE_PG_RUN_DIR/postgres-data"
  if [ -f "$data_dir/PG_VERSION" ] && "$POSTGRES_BIN/pg_ctl" -D "$data_dir" status >/dev/null 2>&1; then
    "$POSTGRES_BIN/pg_ctl" -D "$data_dir" stop -m fast >/dev/null
  fi
  find "$SPIKE_PG_RUN_DIR" -depth -delete
}

status() {
  if ! owned_run_dir; then
    printf '%s\n' 'No isolated SPIKE-009 PostgreSQL run is selected.' >&2
    return 3
  fi
  POSTGRES_BIN="${POSTGRES_BIN:-$(discover_pg_bin)}"
  "$POSTGRES_BIN/pg_ctl" -D "$SPIKE_PG_RUN_DIR/postgres-data" status
}

case "${1:-}" in
  start) start ;;
  stop|cleanup) stop ;;
  status) status ;;
  *) printf '%s\n' "usage: $0 {start|stop|status|cleanup}" >&2; exit 2 ;;
esac
