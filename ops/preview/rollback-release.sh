#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]] || [[ ! "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "usage: $0 <previous-git-sha>" >&2
  exit 64
fi

readonly root=/opt/srtaller-preview
readonly release="$root/releases/$1"
if [[ ! -d "$release" ]] || [[ "$(tr -d '\n' < "$release/REVISION")" != "$1" ]]; then
  echo "requested rollback release is not available" >&2
  exit 65
fi

ln -sfn "$release" "$root/current.rollback"
mv -Tf "$root/current.rollback" "$root/current"
sudo systemctl restart srtaller-preview
curl --fail --silent --show-error --max-time 10 \
  http://127.0.0.1:3100/api/preview/context >/dev/null
printf 'rolled back VS0 to %s\n' "$1"
