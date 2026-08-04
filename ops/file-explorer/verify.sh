#!/usr/bin/env bash
set -euo pipefail

SERVICE=srtaller-file-explorer
VIEW=/srv/srtaller-file-explorer

systemctl is-active --quiet "$SERVICE"
ss -lnt | grep -Eq '127\.0\.0\.1:3200[[:space:]]'
! ss -lnt | grep -Eq '(0\.0\.0\.0|\[::\]):3200[[:space:]]'
runuser -u "$SERVICE" -- test -r "$VIEW/README.txt"
runuser -u "$SERVICE" -- test ! -w "$VIEW/README.txt"
runuser -u "$SERVICE" -- test ! -r /opt/srtaller-preview/shared/.env
! find "$VIEW" -type l -print -quit | grep -q .
! find "$VIEW" -name '.env' -o -name 'authorized_keys' | grep -q .
status="$(curl --silent --show-error --max-time 5 --output /dev/null --write-out '%{http_code}' http://127.0.0.1:3200/)"
[[ "$status" == "200" ]]
