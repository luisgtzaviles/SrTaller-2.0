# PBI-OPS-001 — Read-only development server explorer

Status: Authorized — implementation may begin; development preview only.

Owner: Responsable del Proyecto

Sprint: OPS-SPRINT-001 — Development Operations Visibility

## Objective and justification

Expose a private visual inventory of deployed preview releases, the active
release, compiled artifacts and non-sensitive deployment structure at
`files.srtaller.dev`. This substitutes only the safe, observational part of a
traditional hosting file manager.

## In scope

- A curated root at `/srv/srtaller-file-explorer`.
- Release and active-release views with non-sensitive metadata.
- A pinned open-source browser behind Caddy and bound to loopback.
- OS-level and application-level read-only enforcement.
- Reproducible refresh, installation, verification and removal procedures.

## Exclusions

No product functionality, business data, database administration, shell,
uploads, edits, deletes, credentials, `/opt/srtaller-preview/shared`, production,
R1 or functional backlog changes.

## Binary acceptance criteria

1. The service runs as a dedicated non-login, non-sudo system identity.
2. Only a curated root is readable and it is not writable by that identity.
3. Shared configuration and `.env` are unreadable.
4. The listener is loopback-only and no firewall port is added.
5. Caddy provides TLS and independent Basic Auth.
6. The application has an independent read-only account where supported.
7. Create, edit, upload, rename, move and delete operations are rejected.
8. Traversal, encoded traversal, absolute paths, hidden files and symlink escape fail closed.
9. systemd sandboxing and resource limits are effective and recorded.
10. Preview remains healthy and rollback/removal is reproducible.
11. Evidence contains no reusable secret.
12. Git and governance closure requirements remain satisfied.

## Risks

Accidental secret exposure, symlink escape, write-capable defaults, credential
reuse, resource contention and coupling to preview deployment. Each requires a
negative test and a removal path.

## Evidence

Evidence is recorded under `docs/operations/pbi-ops-001/evidence/` using only
sanitized commands, results, versions, checksums and binary PASS/FAIL outcomes.
