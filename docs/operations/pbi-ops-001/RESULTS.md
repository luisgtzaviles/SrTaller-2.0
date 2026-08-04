# PBI-OPS-001 results

Status: Implemented and remotely verified — development preview only.

FileBrowser Quantum `v1.3.3-stable` is active at
`https://files.srtaller.dev` behind Caddy. The service binds only to
`127.0.0.1:3200`, uses an isolated non-login identity, sees only the root-built
curated release view and has independent Basic Auth and internal read-only auth.

`MemoryDenyWriteExecute=true` was tested and removed because this Go binary
repeatedly terminated with `SIGSEGV`. The exception is bounded by an empty
capability set, syscall filtering, strict filesystem protection, private
devices/tmp, `NoNewPrivileges`, read/write path allowlisting and resource caps.

See `evidence/RESULTS.md` for the sanitized closure record.

Implementation, deployment and verification results are pending. This document
must not claim completion until the curated root, read-only controls, TLS,
authentication, negative tests, resource limits, rollback and governance closure
have all produced evidence.
