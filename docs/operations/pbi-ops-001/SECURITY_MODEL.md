# Security model

Status: Authorized — implementation may begin; development preview only.

## Trust boundary

The explorer is development infrastructure, not a product authorization
surface. Internet traffic terminates at Caddy; the explorer listens only on
loopback and sees only a root-curated filesystem view.

## Defense in depth

1. Independent Caddy Basic Auth credentials stored outside Git.
2. Independent internal account when supported by the selected tool.
3. Dedicated system user with `nologin`, no password and no sudo.
4. Curated `/srv/srtaller-file-explorer` root only.
5. Read-only bind mounts and UNIX permissions enforced by root.
6. Application configured for read-only operation.
7. systemd sandboxing, empty capabilities and explicit resource limits.
8. Loopback listener with no firewall exception.

## Allowed information

Release directory names, non-sensitive compiled files, active SHA, release path,
activation timestamp when available, hostname and the `DEV_PREVIEW` label.

## Denied information

Secrets, `.env`, keys, shell history, database backups/configuration, journals,
temporary files, uploaded real data, `/proc`, `/sys`, `/opt/srtaller-preview/shared`
and any path outside the curated root.

## Failure policy

Unknown releases, unsafe paths, writable mounts, unavailable credentials or
failed checks block refresh/startup/public exposure. No permissive fallback is
allowed.
