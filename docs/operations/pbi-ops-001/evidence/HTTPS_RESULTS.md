# HTTPS results

- URL: `https://files.srtaller.dev`.
- Automatic certificate: valid Let's Encrypt certificate for the hostname.
- TLS verification result: 0 (valid).
- Unauthenticated request: 401.
- Authenticated outer request: 200 and internal login page rendered.
- HSTS, nosniff, no-referrer, CSP, DENY framing, Permissions-Policy and
  noindex headers: present.
- Caddy configuration validation: PASS; Caddy active after restart.
- `https://preview.srtaller.dev`: TLS valid, frontend/context/list/detail/history PASS.
