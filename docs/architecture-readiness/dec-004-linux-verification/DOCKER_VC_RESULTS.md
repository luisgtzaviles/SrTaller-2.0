# DEC-004 — Preliminary Docker VC results

## Authority

VC-001 to VC-023 have technical result **Pass** with evidence authority
**Preliminary — emulated linux/amd64**. They are not native Linux `x86_64`
ratification. VC-024 was not executed and remains `Pending` under DEC-051.

## Matrix

| VC | Technical result | Evidence authority | Evidence |
| --- | --- | --- | --- |
| VC-001 | Pass | Preliminary — emulated `linux/amd64` | Node.js `v24.18.0` exact in both runs |
| VC-002 | Pass | Preliminary — emulated `linux/amd64` | Controlled Node `25.9.0` rejected in both runs |
| VC-003 | Pass | Preliminary — emulated `linux/amd64` | Corepack `0.35.0`; pnpm `11.15.1` exact |
| VC-004 | Pass | Preliminary — emulated `linux/amd64` | npm user-agent and pnpm `11.15.0` rejected; Git remained clean |
| VC-005 | Pass | Preliminary — emulated `linux/amd64` | Independent bundle clones; frozen installs exit `0`; no mutation |
| VC-006 | Pass | Preliminary — emulated `linux/amd64` | Manifest mismatch rejected; lockfile hash unchanged |
| VC-007 | Pass | Preliminary — emulated `linux/amd64` | Product root contains only `pnpm-lock.yaml`; no workspace |
| VC-008 | Pass | Preliminary — emulated `linux/amd64` | Controlled PATH gate passed; local `tsc`; global `tsc` absent |
| VC-009 | Pass | Preliminary — emulated `linux/amd64` | Unapproved lifecycle marker absent; fixture install rejected |
| VC-010 | Pass | Preliminary — emulated `linux/amd64` | Typecheck exit `0`; zero emit |
| VC-011 | Pass | Preliminary — emulated `linux/amd64` | Controlled type error exit `2`; no build output |
| VC-012 | Pass | Preliminary — emulated `linux/amd64` | Clean build emitted only eight allowed files under `dist/` |
| VC-013 | Pass | Preliminary — emulated `linux/amd64` | NestJS/ESM/provider shell starts without loader errors |
| VC-014 | Pass | Preliminary — emulated `linux/amd64` | Compiled `dist/main.js` listener and SIGTERM passed |
| VC-015 | Pass | Preliminary — emulated `linux/amd64` | Production fixture starts without source or TypeScript |
| VC-016 | Pass | Preliminary — emulated `linux/amd64` | Stack maps to TS; external maps have no inline sources |
| VC-017 | Pass | Preliminary — emulated `linux/amd64` | Valid technical variables permit startup |
| VC-018 | Pass | Preliminary — emulated `linux/amd64` | Three missing and two invalid variable cases rejected per run |
| VC-019 | Pass | Preliminary — emulated `linux/amd64` | VC-001 to VC-018 ran on Debian 12, `x86_64`, glibc 2.36 |
| VC-020 | Pass | Preliminary — emulated `linux/amd64` | Two independent clones/builds produced identical inventories and hashes |
| VC-021 | Pass | Preliminary — emulated `linux/amd64` | Incorrect casing rejected with exit `2` |
| VC-022 | Pass | Preliminary — emulated `linux/amd64` | Initial, post-install and final Git status clean in both runs |
| VC-023 | Pass | Preliminary — emulated `linux/amd64` | No TTY; canonical commands terminated and propagated exits |
| VC-024 | Pending | Not executed | DEC-051 remains Proposed; no CI selected or run |

## Governance limit

These technical passes do not change DEC-004 to `Verified` or `Closed`, do not
make PBI-021 `Done`, do not close Sprint 00 and do not authorize CI, deploy or
functional R0 work.
