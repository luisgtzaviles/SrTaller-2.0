#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPIKE_PG_RUN_DIR="$(mktemp -d "${SPIKE_TMP_ROOT:-/tmp}/srtaller-spike009.XXXXXX")"
export SPIKE_PG_RUN_DIR

cleanup() {
  bash "$ROOT/scripts/postgres.sh" cleanup
}

on_exit() {
  local code=$?
  trap - EXIT
  cleanup
  exit "$code"
}

trap on_exit EXIT
child_pid=""

on_signal() {
  local signal="$1"
  local code="$2"
  trap - INT TERM HUP
  if [ -n "$child_pid" ] && kill -0 "$child_pid" >/dev/null 2>&1; then
    kill "-$signal" "$child_pid" >/dev/null 2>&1 || true
    set +e
    wait "$child_pid"
    set -e
  fi
  exit "$code"
}

trap 'on_signal INT 130' INT
trap 'on_signal TERM 143' TERM
trap 'on_signal HUP 129' HUP

eval "$(bash "$ROOT/scripts/postgres.sh" start)"
if [ -n "${SPIKE_RUN_RECORD:-}" ]; then
  {
    printf 'run_dir=%s\n' "$SPIKE_PG_RUN_DIR"
    printf 'port=%s\n' "$SPIKE_POSTGRES_PORT"
    printf 'socket=%s\n' "$SPIKE_POSTGRES_SOCKET"
  } >"$SPIKE_RUN_RECORD"
fi

"$@" &
child_pid=$!
set +e
wait "$child_pid"
command_status=$?
set -e
child_pid=""
exit "$command_status"
