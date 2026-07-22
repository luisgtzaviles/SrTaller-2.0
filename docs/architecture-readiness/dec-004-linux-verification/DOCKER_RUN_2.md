# DEC-004 — Docker preliminary run 2

## Classification and result

**Preliminary — emulated linux/amd64.** This is not native Linux `x86_64`
ratification.

`PASS — TECHNICAL PRELIMINARY RUN`

Run 2 started after run 1 had completed and used its own read-only bundle,
container filesystem, home, pnpm store, Git clone, `node_modules/` and `dist/`.
It completed with exit `0` and did not consume output from run 1.

## Git transport

| Field | Result |
| --- | --- |
| Transport | Independent copy `run-2.bundle` |
| Bundle SHA-256 | `872ee96304211f12021c8a8ba613000d665cdd4a9f1ccd9d21136786e5fbc927` |
| Bundle verification | Exit `0`; complete history; SHA-1 object format |
| Included ref | `refs/heads/dec004-bundle-temp` at the exact target SHA |
| Mount | `/workspace/source.bundle`, bind, read-only |
| Clone source | Local bundle only |
| Private Git network | None |
| Credentials | None |
| Temporary ref after checkout | Removed |

The checkout was detached at
`056e8695b9b7f1620ecade03081eaf2c824de4e6`. Initial, post-install and final
Git status checks were clean.

## Environment and toolchain

| Field | Result |
| --- | --- |
| Started UTC | `2026-07-22T21:30:56Z` |
| Completed UTC | `2026-07-22T21:33:23Z` |
| Kernel | Linux `6.12.76-linuxkit` |
| Architecture | `x86_64`; dpkg `amd64` |
| Distribution | Debian GNU/Linux `12` Bookworm |
| libc | GNU glibc `2.36` |
| Node.js | `v24.18.0` |
| Corepack | `0.35.0` |
| pnpm | `11.15.1` |
| TypeScript | `6.0.3`, local |
| NestJS | common/core/platform-express `11.1.28` |
| TTY | stdin `no`; stdout `no` |

## Verification results

- Frozen installation, typecheck, build, five tests and `verify`: exit `0`.
- Compiled startup/listener and SIGTERM shutdown: pass.
- Controlled PATH and local TypeScript: pass; no global `tsc`.
- Development watch: zero errors and emitted-JavaScript startup observed.
- Node, npm user-agent and wrong-pnpm negative cases: rejected.
- Lock mismatch, lifecycle, type-error and casing fixtures: rejected safely.
- Production fixture: starts without source or TypeScript.
- Missing/invalid variable matrix: five of five cases rejected.
- Source maps: external, no inline sources, controlled stack mapped correctly.
- Final artifact: eight files, 5,600 bytes, mode `644`.
- Emitted `/workspace/` and `/home/` references: zero.

Evidence:

- [Summary](generated/run-2/summary.env)
- [Command log](generated/run-2/run.log)
- [Diagnostics](generated/run-2/diagnostics.json)
- [Container inspection](generated/run-2/container.inspect)
- [Canonical inventory](docker-run-2.inventory)
- [Canonical SHA-256 manifest](docker-run-2.sha256)
