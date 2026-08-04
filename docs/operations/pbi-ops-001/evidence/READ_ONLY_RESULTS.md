# Read-only results

- Allowed metadata listing: HTTP 200.
- Allowed non-sensitive `README.txt` download: PASS.
- Linux read: PASS; Linux write/touch: permission denied.
- HTTP create: 403.
- HTTP edit: 500 with no filesystem change; OS layer denied write.
- HTTP delete: 403.
- HTTP rename/move: 403.
- Upload/create capability: disabled and HTTP 403.
- Permission/API/admin/share capabilities: disabled.
- Shell/command feature: absent from selected fork.
- Plain traversal: 404.
- Double-encoded traversal: 404.
- Absolute outside-root path: 404.
- hidden `.env` request: 404.
- Symlink escape: structurally impossible in refreshed root; symlinks removed.

The refresh is idempotent, validates the active 40-character release SHA and
`REVISION`, copies only compiled artifacts plus approved metadata, deletes
symlinks, applies root ownership and `0555/0444`, and atomically replaces the
view without touching the running preview application.
