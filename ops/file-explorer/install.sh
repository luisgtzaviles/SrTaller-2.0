#!/usr/bin/env bash
set -euo pipefail

[[ "${EUID}" -eq 0 ]] || { echo "run as root" >&2; exit 1; }
[[ $# -eq 1 ]] || { echo "usage: install.sh /path/to/verified-linux-amd64-filebrowser" >&2; exit 1; }

BINARY="$1"
EXPECTED_SHA256=a5cd7091245bc8b04f5e8c85f6abc2708bbe0489ed47c10442da73a398efcdd6
ACTUAL_SHA256="$(sha256sum "$BINARY" | awk '{print $1}')"
[[ "$ACTUAL_SHA256" == "$EXPECTED_SHA256" ]] || { echo "binary checksum mismatch" >&2; exit 1; }

id srtaller-file-explorer >/dev/null 2>&1 || useradd \
  --system --user-group --home-dir /var/lib/srtaller-file-explorer \
  --shell /usr/sbin/nologin srtaller-file-explorer
passwd -l srtaller-file-explorer >/dev/null

install -d -m 0750 -o root -g srtaller-file-explorer /etc/srtaller-file-explorer
install -d -m 0700 -o srtaller-file-explorer -g srtaller-file-explorer /var/lib/srtaller-file-explorer
install -d -m 0700 -o srtaller-file-explorer -g srtaller-file-explorer /var/lib/srtaller-file-explorer/cache
install -m 0755 "$BINARY" /usr/local/bin/srtaller-file-explorer
install -m 0755 ./refresh-view.sh /usr/local/sbin/srtaller-file-explorer-refresh

INTERNAL_USER="viewer-$(openssl rand -hex 4)"
INTERNAL_PASSWORD="$(openssl rand -base64 36 | tr -d '\n')"
BOOTSTRAP_USER="bootstrap-$(openssl rand -hex 4)"
BOOTSTRAP_PASSWORD="$(openssl rand -base64 36 | tr -d '\n')"
AUTH_KEY="$(openssl rand -hex 32)"
BASIC_USER="observer-$(openssl rand -hex 4)"
BASIC_PASSWORD="$(openssl rand -base64 36 | tr -d '\n')"
BASIC_HASH="$(caddy hash-password --plaintext "$BASIC_PASSWORD")"

sed \
  -e "s/__GENERATED_AUTH_KEY__/$AUTH_KEY/" \
  -e "s/__BOOTSTRAP_USER__/$BOOTSTRAP_USER/" \
  -e "s#__BOOTSTRAP_PASSWORD__#$BOOTSTRAP_PASSWORD#" \
  ./config.yaml.example >/etc/srtaller-file-explorer/config.yaml
chown root:srtaller-file-explorer /etc/srtaller-file-explorer/config.yaml
chmod 0640 /etc/srtaller-file-explorer/config.yaml

install -m 0600 /dev/null /root/srtaller-file-explorer-credentials
{
  printf 'BASIC_USER=%s\nBASIC_PASSWORD=%s\n' "$BASIC_USER" "$BASIC_PASSWORD"
  printf 'INTERNAL_USER=%s\nINTERNAL_PASSWORD=%s\n' "$INTERNAL_USER" "$INTERNAL_PASSWORD"
  printf 'BOOTSTRAP_USER=%s\nBOOTSTRAP_PASSWORD=%s\n' "$BOOTSTRAP_USER" "$BOOTSTRAP_PASSWORD"
} >/root/srtaller-file-explorer-credentials

/usr/local/sbin/srtaller-file-explorer-refresh
install -m 0644 ./srtaller-file-explorer.service /etc/systemd/system/srtaller-file-explorer.service
systemctl daemon-reload
systemctl enable --now srtaller-file-explorer.service

for _ in $(seq 1 30); do
  curl --silent --max-time 2 http://127.0.0.1:3200/ >/dev/null && break
  sleep 1
done

systemctl stop srtaller-file-explorer.service
runuser -u srtaller-file-explorer -- /usr/local/bin/srtaller-file-explorer \
  set -u "$INTERNAL_USER,$INTERNAL_PASSWORD" -c /etc/srtaller-file-explorer/config.yaml
systemctl start srtaller-file-explorer.service

grep -v '^SR_FILES_BASIC_AUTH_' /etc/caddy/srtaller-preview.env >/etc/caddy/srtaller-preview.env.new
printf 'SR_FILES_BASIC_AUTH_USER=%s\nSR_FILES_BASIC_AUTH_HASH=%s\n' "$BASIC_USER" "$BASIC_HASH" \
  >>/etc/caddy/srtaller-preview.env.new
chown root:caddy /etc/caddy/srtaller-preview.env.new
chmod 0640 /etc/caddy/srtaller-preview.env.new
mv /etc/caddy/srtaller-preview.env.new /etc/caddy/srtaller-preview.env

echo "Installation complete. Credentials are recoverable only with: sudo cat /root/srtaller-file-explorer-credentials"
