# Rollback and removal

Status: Authorized — implementation may begin; development preview only.

Removal must be explicit and ordered:

1. Validate the retained Caddy configuration before any change.
2. Remove only the `files.srtaller.dev` site and reload Caddy.
3. Stop and disable only the explorer service.
4. Unmount the curated read-only mounts.
5. Remove explorer state, credentials, configuration and pinned binary.
6. Remove the dedicated user/group after verifying no owned process remains.
7. Remove `/srv/srtaller-file-explorer`.
8. Verify ports, Caddy, `srtaller-preview`, HTTPS and the preview API.

No database restore, preview rollback or product deployment is part of removal.
The concrete validated commands will be recorded with deployment evidence.
