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
# Prevent macOS tar from materializing AppleDouble `._*` entries in a Linux
# release. Extended provenance attributes are also removed from the temporary
# export before the final archive is created.
export COPYFILE_DISABLE=1
git archive "$expected_sha" | tar -x -C "$temporary"
if [[ "$(uname -s)" == "Darwin" ]] && command -v xattr >/dev/null 2>&1; then
  xattr -cr "$temporary"
fi
printf '%s\n' "$expected_sha" > "$temporary/REVISION"
tar -czf "$output" -C "$temporary" .
printf 'packaged VS0 release %s\n' "$expected_sha"
