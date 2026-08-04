# Security results

- Dedicated system user: PASS; password locked, `nologin`, private group only.
- Sudo access: NONE.
- Curated root only: PASS.
- `/opt/srtaller-preview/shared/.env` read as service user: BLOCKED.
- Curated symlinks: NONE.
- Hidden/sensitive named artifacts in curated root: NONE.
- Internal permissions: `admin=false`, `api=false`, `modify=false`,
  `share=false`, `create=false`, `delete=false`, `download=true`.
- Basic Auth absent/invalid: HTTP 401.
- Internal invalid login: HTTP 401; valid login: HTTP 200.
- Logout: HTTP 200; reuse of logged-out session: HTTP 401.
- Root SSH: rejected; password-only SSH: rejected; `luis` key SSH: accepted.
- Temporary `/etc/sudoers.d/90-luis-codex-preview`: removed.
- Full `visudo -c`: PASS after removal.
- `sudo -k && sudo -n true`: expected failure restored.
