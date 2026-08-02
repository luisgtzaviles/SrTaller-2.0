#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <release.tar.gz> <git-sha>" >&2
  exit 64
fi

readonly archive="$1"
readonly sha="$2"
readonly root=/opt/srtaller-preview
readonly release="$root/releases/$sha"
readonly shared="$root/shared"
readonly environment_file="$shared/.env"
readonly previous="$(readlink -f "$root/current" 2>/dev/null || true)"

if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]] || [[ ! -f "$archive" ]]; then
  echo "release archive or SHA is invalid" >&2
  exit 65
fi
if [[ ! -r "$environment_file" ]]; then
  echo "private preview environment is unavailable" >&2
  exit 66
fi
if [[ -e "$release" ]]; then
  echo "release directory already exists" >&2
  exit 67
fi

mkdir -p "$release" "$shared/backups" "$shared/logs"
tar -xzf "$archive" -C "$release" --no-same-owner
if [[ "$(tr -d '\n' < "$release/REVISION")" != "$sha" ]]; then
  echo "release revision marker does not match requested SHA" >&2
  exit 68
fi

# The governed mutation harness uses `git status` to prove that every
# controlled mutation restores its workspace. Release archives intentionally
# exclude repository history, so provide only the local metadata required by
# that gate; REVISION remains the authoritative deployed commit marker.
git -C "$release" init --quiet

set -a
# shellcheck disable=SC1090
source "$environment_file"
set +a

cd "$release"
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm run test:architecture
pnpm test
pnpm run verify
pnpm run smoke:start

readonly backup="$shared/backups/preview-$(date -u +%Y%m%dT%H%M%SZ)-$sha.dump"
PGPASSWORD="$SR_DB_PASSWORD" pg_dump \
  --host "$SR_DB_HOST" \
  --port "$SR_DB_PORT" \
  --username "$SR_DB_USER" \
  --dbname "$SR_DB_NAME" \
  --format custom \
  --file "$backup"
chmod 0640 "$backup"

SR_DB_ROLE=migration SR_DB_MIGRATIONS_ENABLED=true pnpm run db:migrate
pnpm run preview:seed

ln -sfn "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"

rollback() {
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn "$previous" "$root/current.rollback"
    mv -Tf "$root/current.rollback" "$root/current"
    sudo systemctl restart srtaller-preview
  fi
}
trap rollback ERR
sudo systemctl restart srtaller-preview
curl --fail --silent --show-error --max-time 10 \
  http://127.0.0.1:3100/api/preview/context >/dev/null
trap - ERR

printf 'activated VS0 release %s\n' "$sha"
printf 'database backup: %s\n' "$backup"
