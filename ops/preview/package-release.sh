#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <git-sha> <output.tar.gz>" >&2
  exit 64
fi

readonly expected_sha="$1"
readonly output="$2"
readonly actual_sha="$(git rev-parse HEAD)"

if [[ ! "$expected_sha" =~ ^[0-9a-f]{40}$ ]] || [[ "$actual_sha" != "$expected_sha" ]]; then
  echo "release SHA does not match the checked-out commit" >&2
  exit 65
fi
if [[ -n "$(git status --short)" ]]; then
  echo "release packaging requires a clean working tree" >&2
  exit 66
fi

temporary="$(mktemp -d)"
trap 'rm -rf "$temporary"' EXIT
git archive "$expected_sha" | tar -x -C "$temporary"
printf '%s\n' "$expected_sha" > "$temporary/REVISION"
tar -czf "$output" -C "$temporary" .
printf 'packaged VS0 release %s\n' "$expected_sha"
