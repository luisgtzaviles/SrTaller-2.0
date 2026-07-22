# DEC-004 — Preliminary Docker verification results

## Result

**PASS — PRELIMINARY DOCKER LINUX REPRODUCIBILITY PROVEN**

Two independent Docker containers produced identical technical results and
build artifacts on emulated `linux/amd64` with Debian 12 and GNU glibc. This is
preliminary evidence only; native Linux `x86_64` ratification remains pending.

## Git transport and integrity

| Field | Result |
| --- | --- |
| Method | Canonical Git bundle created from an explicit temporary ref |
| Target | `056e8695b9b7f1620ecade03081eaf2c824de4e6` |
| Bundle size | 1,298,583 bytes |
| Bundle SHA-256 | `872ee96304211f12021c8a8ba613000d665cdd4a9f1ccd9d21136786e5fbc927` |
| Bundle verification | Source, run 1 and run 2 copies: valid, complete history |
| Copies | Two physical, byte-identical files; independently verified |
| Uncommitted changes | Excluded by construction; bundle was created from the commit object |
| Container Git access | Bundle only; no private remote access |
| Credentials | None |
| Cleanup | Temporary ref and all three bundle files removed after evidence export |

The bundle is transport, not execution evidence. Each container still performed
its own clone, exact SHA resolution, detached checkout and clean-tree checks.

## Image and platform

| Item | Result |
| --- | --- |
| Host | macOS Apple Silicon `arm64` |
| Docker VM | Linux `arm64` |
| Container | Linux `x86_64` emulated |
| Distribution | Debian GNU/Linux 12 Bookworm |
| libc | GNU glibc 2.36 |
| Base digest | `sha256:7b140f374b289a7c2befc338f42ebe6441b7ea838a042bbd5acbfca6ec875818` |
| Verification image digest | `sha256:7c124d629e4f3de3eaddc46eb8431ae8f4d51fa1d05a7755a95664fe85228cd1` |
| Node archive SHA-256 | `55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742` |

## Toolchain

- Node.js `24.18.0`.
- Corepack `0.35.0`.
- pnpm `11.15.1`.
- TypeScript `6.0.3`, local.
- NestJS common/core/platform-express `11.1.28`.

## Runs and reproducibility

- [Run 1](DOCKER_RUN_1.md): exit `0`, Git clean, all technical checks pass.
- [Run 2](DOCKER_RUN_2.md): exit `0`, Git clean, all technical checks pass.
- [VC matrix](DOCKER_VC_RESULTS.md): VC-001 to VC-023 technical Pass,
  preliminary emulated authority; VC-024 Pending.
- [Comparison](DOCKER_COMPARISON.md): eight paths, sizes, modes, source maps and
  SHA-256 values match exactly.

Each output has eight files totaling 5,600 bytes. No artifact contains embedded
workspace/home paths or inline source content. No differences were observed.

## Network and isolation

The containers used the default bridge solely for public package installation.
Git cloned exclusively from the mounted bundle. There were no Git credentials,
private Git network calls, published ports, host network, Docker socket,
privileged mode, persistent volumes, shared pnpm store, shared checkout or shared
build output. The only bind per container was its own bundle copy, read-only.

## Cleanup and retained resource

- Run 1 and run 2 containers removed.
- No temporary volume or custom network created.
- Canonical bundle, run copies and temporary directory removed.
- Temporary branch removed without switching from `main`.
- No `docker system prune` or deletion of unrelated images.
- Verification image retained under its exact tag for reproducibility.

## Governance

| Element | State |
| --- | --- |
| DEC-004 | `Accepted — Selection Approved / Evidence Pending` |
| PBI-021 | `Ready`, `Unassigned`, not `Done` |
| DEC-051 | Proposed/unresolved |
| VC-024 | `Pending` |
| Sprint 00 | Open |
| CI / deploy / functional R0 | Not authorized and not performed |

## Next action

Continuar con la siguiente decisión o gate arquitectónico que impide iniciar R0,
manteniendo pendiente únicamente la ratificación nativa de DEC-004 y VC-024 por
DEC-051.
