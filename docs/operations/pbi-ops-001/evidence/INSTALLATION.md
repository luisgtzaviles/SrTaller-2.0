# Installation

- Tool: FileBrowser Quantum `v1.3.3-stable`.
- Official asset: `linux-amd64-filebrowser` from the official GitHub release.
- Verified SHA-256: `a5cd7091245bc8b04f5e8c85f6abc2708bbe0489ed47c10442da73a398efcdd6`.
- License: Apache-2.0.
- Binary: `/usr/local/bin/srtaller-file-explorer`.
- Configuration: `/etc/srtaller-file-explorer/config.yaml` (`0640`).
- Private state: `/var/lib/srtaller-file-explorer` (`0700`).
- Credential recovery: `sudo cat /root/srtaller-file-explorer-credentials`.

No remote script, mirror, floating `latest` release or package repository was
used. Rotation is performed by generating independent random values, updating
the root-only credential record/application database and replacing the Caddy
environment hash, followed by validation and controlled service restart.
