#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT=/opt/srtaller-preview
VIEW_ROOT=/srv/srtaller-file-explorer
ACTIVE_PATH="$(readlink -f "$SOURCE_ROOT/current")"

case "$ACTIVE_PATH" in
  "$SOURCE_ROOT"/releases/[0-9a-f][0-9a-f]*) ;;
  *) echo "active release is outside the approved releases root" >&2; exit 1 ;;
esac

ACTIVE_SHA="$(basename "$ACTIVE_PATH")"
[[ "$ACTIVE_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "invalid active release SHA" >&2; exit 1; }
[[ -d "$ACTIVE_PATH/dist" && -f "$ACTIVE_PATH/REVISION" ]] || { echo "active release is incomplete" >&2; exit 1; }
[[ "$(tr -d '\r\n' < "$ACTIVE_PATH/REVISION")" == "$ACTIVE_SHA" ]] || { echo "REVISION does not match active directory" >&2; exit 1; }

STAGE="$(mktemp -d /srv/.srtaller-file-explorer.XXXXXX)"
cleanup() { rm -rf -- "$STAGE"; }
trap cleanup EXIT

install -d -m 0555 "$STAGE/releases" "$STAGE/current-release"
cat >"$STAGE/README.txt" <<'EOF'
SR Taller 2.0 — DEV_PREVIEW read-only release explorer

This curated view contains only compiled release artifacts and non-sensitive
deployment metadata. It deliberately excludes shared state, environment files,
database data, credentials, SSH material, backups and operating-system paths.
EOF

ACTIVATED_AT="$(stat -c '%y' "$SOURCE_ROOT/current")"
printf 'SHA=%s\nRELEASE_PATH=%s\nACTIVATED_AT=%s\nHOSTNAME=%s\nENVIRONMENT=DEV_PREVIEW\n' \
  "$ACTIVE_SHA" "$SOURCE_ROOT/releases/$ACTIVE_SHA" "$ACTIVATED_AT" "$(hostname)" >"$STAGE/ACTIVE_RELEASE.txt"

while IFS= read -r release; do
  sha="$(basename "$release")"
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || continue
  [[ -d "$release/dist" && -f "$release/REVISION" ]] || continue
  [[ "$(tr -d '\r\n' < "$release/REVISION")" == "$sha" ]] || continue
  install -d -m 0555 "$STAGE/releases/$sha"
  install -m 0444 "$release/REVISION" "$STAGE/releases/$sha/REVISION"
  cp -a --no-preserve=ownership,mode "$release/dist" "$STAGE/releases/$sha/compiled"
  find "$STAGE/releases/$sha/compiled" -type l -delete
done < <(find "$SOURCE_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -print | sort)

cp -a "$STAGE/releases/$ACTIVE_SHA/." "$STAGE/current-release/"
find "$STAGE" -type d -exec chmod 0555 {} +
find "$STAGE" -type f -exec chmod 0444 {} +
chown -R root:root "$STAGE"

if [[ -e "$VIEW_ROOT" ]]; then
  OLD="${VIEW_ROOT}.old"
  rm -rf -- "$OLD"
  mv -- "$VIEW_ROOT" "$OLD"
  mv -- "$STAGE" "$VIEW_ROOT"
  rm -rf -- "$OLD"
else
  mv -- "$STAGE" "$VIEW_ROOT"
fi
trap - EXIT

