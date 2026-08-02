# VS0 preview operations

This directory defines the reproducible, DEV_ONLY deployment contract for the
SR Taller 2.0 Visual Slice 0. It is not a production deployment strategy.

## Host baseline

- Ubuntu 24.04 LTS, Node.js 24.18.0 and pnpm 11.15.1;
- PostgreSQL 18.4 bound only to localhost/private networking;
- Caddy on public ports 80/443 with HTTPS and Basic Auth;
- the Node process bound to `127.0.0.1:3100` under the unprivileged
  `srtaller-preview` account;
- firewall allowing only the existing controlled SSH path plus 80/443;
- `/opt/srtaller-preview/releases/<sha>`, `current`, and `shared` owned with
  least privilege.

The real hostname, Basic Auth user/hash, database password, station evidence,
and environment file stay outside Git. `env.example` contains placeholders and
synthetic identifiers only. Caddy credentials must be supplied through its
root-owned systemd environment and must never be printed in a deploy log.

## One-time host preparation

1. Create the service user and `/opt/srtaller-preview/{releases,shared/logs}`.
2. Copy `env.example` to `/opt/srtaller-preview/shared/.env`, replace every
   placeholder, then set ownership `root:srtaller-preview` and mode `0640`.
3. Install the systemd unit and the Caddy site after substituting the dedicated
   preview hostname; configure the Basic Auth variables outside the repository.
4. Confirm PostgreSQL listens locally, Caddy is the only public application
   listener, and the firewall exposes no database or Node port.

These are deliberate operator actions. The repository scripts do not change a
firewall, create credentials, or bootstrap an unknown server.

## Release by SHA

From a clean local checkout of the exact preview commit:

```sh
ops/preview/package-release.sh <sha> /tmp/srtaller-preview-<sha>.tar.gz
```

Transfer that one archive over the separately authorized preview SSH channel.
On the VPS, run `deploy-release.sh <archive> <sha>` as the deployment operator.
The script verifies the revision, installs from the frozen lockfile, runs the
gates, creates a PostgreSQL backup, migrates with the migration role, seeds only
the configured synthetic scope, atomically switches `current`, restarts
systemd, and probes the private local API. It does not use `git pull`, rsync, or
`--delete`.

After local smoke passes, verify through Caddy without exposing credentials:

```sh
curl --fail --silent --show-error --user "$PREVIEW_AUTH" \
  https://<dedicated-preview-host>/api/preview/context >/dev/null
```

Also verify the browser shell, navigation, creation, list, detail, state CAS,
reload, HTTPS certificate, Basic Auth challenge, systemd status, and Caddy logs.

## Rollback

`rollback-release.sh <previous-sha>` atomically re-points `current`, restarts
the service, and probes the local API. A schema/data rollback requires the
explicit preview-database restore procedure and the backup emitted by the
deploy; it is never automatic or destructive.

## Current operational limitation

A dedicated Hetzner preview VPS and authorized SSH transfer channel are
available as of 2026-08-02. The application is deployed and reachable only on
the VPS loopback interface. The dedicated preview hostname remains `TBD`, so
Caddy is intentionally disabled and external HTTPS/Basic Auth verification is
still blocked. Staging and production aliases belonging to SR Taller 1.0
remain explicitly out of scope.
