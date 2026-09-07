# PBI-034 — Operational Session Evidence

## Estado

- **Estado:** In review; candidato de integración todavía no integrado ni
  `Done`.
- **PBI actual / WIP:** PBI-034 / `1/1`.
- **Risk / size:** Critical / Large.
- **DoR:** [PASS](./DEFINITION_OF_READY.md).
- **Threat model:** [complete](./THREAT_MODEL.md).
- **Owner Start Authorization:** Identity Master Goal y decisión Owner de
  reanudación vigentes para este slice exacto.
- **DEC-005 Option A:** policy v4 materializada para composición dirigida por
  aristas explícitas y contratos públicos; verificación local PASS, SHA/CI
  exactos pendientes.
- **Released / deployed:** NO / NO.

## Baseline

- `main`: `ccdd7e243265c0f4d19e9798b8ddfa90d97e8c9e`.
- Cierre PBI-025: PR #32, merge exacto anterior.
- CI autoritativo exact-main: run `34124746317`, run-1/run-2/comparison GREEN
  en attempt 1.
- PBI-025: `Done`; G3 permanece Pending hasta cerrar PBI-034.

La baseline anterior es evidencia histórica de `main`, no identidad del
candidato actual. SHA final, PR y runs de CI del candidato permanecen
pendientes; no se reutilizan los identificadores de PBI-025.

## Candidate scope

- Session Access-owned, una activa por Station;
- start/resolve/touch/logout/switch con expiración y revocación;
- bearer opaco en cookie segura y CSRF/origin contract;
- composición DEC-005 dirigida de Access hacia contratos públicos de Stations
  y Users;
- bootstrap Station sólo local/test;
- gate de login y actor real visible en el Application Shell;
- migración, PostgreSQL material, tests, documentación y evidencia.

`SR_SESSION_SIGNING_KEY` permanece reservado y sin consumidor. El candidato
usa bearer y CSRF aleatorios de alta entropía, conserva sólo verificadores
SHA-256 en PostgreSQL y no introduce JWT ni firma de Session.

## DEC-005 Option A

La materialización y el criterio de verificación acotado de policy v4 se
registran en
[PBI-034 Option A Verification](../../../architecture-readiness/dec-005-materialization/PBI_034_OPTION_A_VERIFICATION.md).
La policy autoriza exclusivamente `AccessModule -> StationsModule` y
`AccessModule -> UsersModule`; no transfiere ownership, no permite internals y
no implementa la autorización contextual de PBI-026.

## Verification matrix

| Riesgo / criterio | Evidencia | Estado |
|---|---|---|
| Contexto server-side e isolation | application/HTTP/PostgreSQL | PASS local |
| Bearer/cookies/CSRF/no-store | contract tests + runtime HTTP | PASS local |
| One active Session + concurrency | PostgreSQL material | PASS local |
| Shared-runtime contention/shutdown | bounded scheduler unit tests + same-runtime PostgreSQL | PASS local |
| Idle/absolute expiry | controlled clock + PostgreSQL | PASS local |
| Logout/switch/reload | application + UI/local runtime | PASS local |
| Lifecycle invalidation | PostgreSQL material negatives | PASS local |
| DEC-005 Option A | checker + 188 fixtures/53 product mutations | PASS local |
| Light/Dark/responsive/focus | local visual validation | PASS local; 390/768/1024/1280/1440 |
| Two-run reproducibility | CI run-1/run-2/comparison | Pending |

## Local verification

- Toolchain: Node.js `24.18.0`, pnpm `11.15.1`, PostgreSQL `18.4`.
- `pnpm run verify`: PASS; typecheck, build, unit/contracts, structure,
  architecture, external-configuration, UI foundation and production UI
  exclusion all green.
- Focused Session/UI/scheduler: PASS; latest-response and mutation-generation
  races, cookie/origin/CSRF/no-store, replacement, expiry, invalidation,
  backpressure and focus contracts covered.
- Material PostgreSQL 18.4: 7/7 owner-scoped suites PASS, cleanup PASS and
  comparison MATCH; material SHA-256
  `19ff8e60323e62e99e1d64ec1d398cd837778c766521c8b69d7dbc7477e65600`.
- Fresh guarded local reset/migration/seed: 23 migrations applied, zero
  pending; deterministic synthetic fixtures PASS.
- Local HTTP lifecycle: Station bootstrap, login, reload persistence, failed
  switch preservation, successful replacement and logout PASS; raw bearer
  absent from JSON and identity responses `no-store`.
- Browser: Light/Dark, 390/768/1024/1280/1440, no global horizontal overflow,
  keyboard order and console PASS. The authenticated lifecycle was exercised
  through the local HTTP contract without printing credential values.
- `git diff --check`: PASS.

## Evidencia pendiente del candidato exacto

| Evidencia | Estado |
|---|---|
| SHA final del candidato | Pending |
| `pnpm run typecheck` | PASS local; repetir sobre SHA final |
| `pnpm run build` | PASS local; repetir sobre SHA final |
| `pnpm run test:architecture` | PASS local; repetir sobre SHA final |
| Suites funcionales y PostgreSQL 18.4 de Session | PASS local; CI exacto pendiente |
| Validación visual local responsive/focus | PASS local |
| Focused Critical-risk review | Pending |
| PR y candidate CI run-1/run-2/comparison | Pending |
| Merge autorizado y CI exacto de `main` | Pending |
| Owner Acceptance y cierre documental | Pending |

## Remediación del primer CI candidato

El run autoritativo `34144612467` sobre
`e0a38fd0b250115b29fae391183b892aa9b46d68` ejecutó correctamente
arquitectura, typecheck, build, PostgreSQL material, full tests y el gate
canónico en ambos legs, pero ambos fallaron en `smoke:start`; comparison quedó
omitida y ese run **no** es evidencia GREEN reutilizable. La causa fue de
startup: `main.ts` intentaba verificar la conexión antes de que el lifecycle de
Nest ejecutara `onModuleInit()` y materializara el runtime de base de datos.

La remediación hace explícito `application.init()` antes de la verificación
fail-closed y mantiene `database.verify()` antes de abrir el listener. Agrega
un contrato de orden y pasó localmente typecheck, build, el test focalizado de
configuración/startup y `smoke:start` contra PostgreSQL 18.4. Requiere nuevo
commit, focused review y CI autoritativo completo sobre el nuevo HEAD; el run
fallido permanece como trazabilidad, no como waiver ni señal intermitente.

## Boundaries

No contextual business authorization, business audit, Operational Note
retrofit, production secrets, remote infrastructure, release or deploy.

## Siguiente gate

Reconciliar resultados sobre el SHA final, ejecutar focused Critical-risk
review y, sólo si pasa junto con CI exacto GREEN, entregar a Owner Review. G3
permanece `Pending` y PBI-026 no ha iniciado.
