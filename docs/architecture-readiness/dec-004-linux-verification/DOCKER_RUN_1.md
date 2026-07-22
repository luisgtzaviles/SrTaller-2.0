# DEC-004 — Docker preliminary run 1

## Classification and result

**Preliminary — emulated linux/amd64.** This is not native Linux `x86_64`
ratification.

`PASS — TECHNICAL PRELIMINARY RUN`

Run 1 used its own read-only bundle, container filesystem, home, pnpm store,
Git clone, `node_modules/` and `dist/`. It completed with exit `0`.

## Git transport

| Field | Result |
| --- | --- |
| Transport | Independent copy `run-1.bundle` |
| Bundle SHA-256 | `872ee96304211f12021c8a8ba613000d665cdd4a9f1ccd9d21136786e5fbc927` |
| Bundle verification | Exit `0`; complete history; SHA-1 object format |
| Included ref | `refs/heads/dec004-bundle-temp` at the exact target SHA |
| Mount | `/workspace/source.bundle`, bind, read-only |
| Clone source | Local bundle only |
| Private Git network | None |
| Credentials | None |
| Temporary ref after checkout | Removed |

The container cloned from its bundle, checked out
`056e8695b9b7f1620ecade03081eaf2c824de4e6` detached and removed the origin and
temporary branch reference. The initial and final working trees were clean.

## Environment and toolchain

| Field | Result |
| --- | --- |
| Started UTC | `2026-07-22T21:28:23Z` |
| Completed UTC | `2026-07-22T21:30:56Z` |
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

## Positive commands

| Command | Exit | Result |
| --- | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | Clean install; 105 packages; Git clean |
| `pnpm run typecheck` | 0 | No diagnostics; zero emit |
| `pnpm run build` | 0 | Eight files under `dist/` |
| `pnpm test` | 0 | Five tests passed |
| `pnpm run verify` | 0 | Complete canonical gate passed |
| `pnpm run smoke:start` | 0 | Compiled listener and SIGTERM shutdown passed |
| Controlled-PATH `verify` | 0 | Local `./node_modules/.bin/tsc`; no global `tsc` |
| `pnpm run diagnose:local` | 0 | All diagnostic assertions passed |
| `pnpm run dev` smoke | Expected signal exit 130 | Watch compiled with zero errors and started emitted JavaScript |

## Negative cases

| Case | Observed exit/result |
| --- | --- |
| Node.js `25.9.0` controlled fact | Rejected, exit `25` |
| npm user-agent | Rejected, exit `1` |
| pnpm `11.15.0` | Rejected, exit `1` |
| Manifest/lock mismatch | Rejected; lockfile unchanged |
| Unapproved lifecycle fixture | Marker absent; install rejected |
| Controlled type error | Exit `2`; no `dist/` |
| Incorrect import casing | Exit `2` |
| Production artifact without source/TypeScript | Started successfully |
| Missing `HOST`, `NODE_ENV` or `PORT` | Each rejected, exit `1` |
| Invalid `NODE_ENV` or `PORT` | Each rejected, exit `1` |
| Controlled source-map error | Exit `1`; mapped to `src/startup-config.ts` |

## Artifact and boundary

- Eight files, 5,600 bytes total, mode `644`.
- External source maps contain no `sourcesContent`.
- No `/workspace/` or `/home/` reference exists in emitted artifacts.
- No `.env` was read.
- Container: `privileged=false`, bridge network, no published ports.
- The bundle was the only bind and was read-only.

Evidence:

- [Summary](generated/run-1/summary.env)
- [Command log](generated/run-1/run.log)
- [Diagnostics](generated/run-1/diagnostics.json)
- [Container inspection](generated/run-1/container.inspect)
- [Canonical inventory](docker-run-1.inventory)
- [Canonical SHA-256 manifest](docker-run-1.sha256)
