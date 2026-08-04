#!/usr/bin/env bash
set -euo pipefail

systemctl disable --now srtaller-file-explorer.service
rm -f /etc/systemd/system/srtaller-file-explorer.service
rm -f /usr/local/bin/srtaller-file-explorer /usr/local/sbin/srtaller-file-explorer-refresh
rm -rf /etc/srtaller-file-explorer /var/lib/srtaller-file-explorer /srv/srtaller-file-explorer
userdel srtaller-file-explorer
systemctl daemon-reload
echo "Remove the files.srtaller.dev site block and SR_FILES_* values, validate Caddy, then reload it."

