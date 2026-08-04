# Implementation plan

Status: Authorized — implementation may begin; development preview only.

1. Select a maintained, pinned and officially distributed open-source tool.
2. Record its license, release date and integrity mechanism.
3. Add repository-owned configuration, refresh, install, verify and remove assets.
4. Create the dedicated identity and private state directory.
5. Build the curated root using read-only mounts and root-generated metadata.
6. Install the loopback-only hardened systemd service.
7. Generate independent credentials outside Git.
8. Validate DNS before enabling the Caddy site and automatic TLS.
9. Exercise Linux, HTTP, escape, resource, firewall and preview regression tests.
10. Record sanitized evidence, publish the operational branch and open a Draft PR.

The refresh mechanism remains independent from preview deploy until its failure
modes are proven not to weaken or interrupt the existing release process.

## Selected tool

- Name: FileBrowser Quantum.
- Version: `v1.3.3-stable` (released 2026-05-18).
- Official source: <https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.3.3-stable>.
- Linux x86_64 asset: `linux-amd64-filebrowser`.
- Official GitHub asset digest: `sha256:a5cd7091245bc8b04f5e8c85f6abc2708bbe0489ed47c10442da73a398efcdd6`.
- License: Apache-2.0.

It was selected for its maintained stable release, standalone Linux binary,
restricted source root, password authentication, non-admin permission model and
reverse-proxy compatibility. Shell commands are not part of this fork. The
deployment still treats application permissions as secondary to OS isolation.
