# Network results

- DNS A: `files.srtaller.dev -> 204.168.203.127`; no AAAA result.
- Explorer: `127.0.0.1:3200` only; external port probe blocked.
- Preview Node: `127.0.0.1:3100` only.
- PostgreSQL: loopback `5432` only.
- Public listeners/firewall allowances: SSH 22, HTTP 80, HTTPS 443 only.
- UFW: active, default incoming deny.
- No firewall rule was changed.
- SSH effective policy: `PermitRootLogin no`, `PasswordAuthentication no`,
  `PubkeyAuthentication yes`.
