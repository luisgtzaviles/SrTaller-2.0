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
