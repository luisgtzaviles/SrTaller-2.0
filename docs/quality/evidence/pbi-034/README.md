# PBI-034 — Operational Session Evidence

## Estado

- **Estado:** Done; cierre documental integrado y CI exacto GREEN.
- **PBI actual / WIP:** NONE / `0/1` durante el cierre PBI-026.
- **Risk / size:** Critical / Large.
- **DoR:** [PASS](./DEFINITION_OF_READY.md).
- **Threat model:** [complete](./THREAT_MODEL.md).
- **Owner Start Authorization:** Identity Master Goal y decisión Owner de
  reanudación vigentes para este slice exacto.
- **DEC-005 Option A:** policy v4 integrada para composición dirigida por
  aristas explícitas y contratos públicos; verificación exacta PASS.
- **Released / deployed:** NO / NO.

## Evidencia exacta

- Candidate: `cdf2805344a5302844a8f7f6f042cb39fbe1515c`.
- Candidate CI: `34149620560`; run-1/run-2/comparison `SUCCESS`.
- Focused Critical-risk review: PASS; `0` BLOCKER, `0` HIGH, `0` MEDIUM, `1`
  LOW.
- PR funcional: #33.
- Merge funcional: `f3e394b59ec7421e13b36ed6bfddff28e45c0dd7`,
  `2026-09-07T18:11:35Z`.
- CI autoritativo exact-main: `34150632738`; run-1/run-2/comparison `SUCCESS`.
- Owner Acceptance condicional: `APPROVED`.
- Cierre: [candidato de cierre](./CLOSURE_CANDIDATE.md).
- PR de cierre: #34; merge
  `54ddc251cda8ec7465b7913786c647f8d3ccbeac`.
- CI exacto post-cierre: `34153470560`; run-1/run-2/comparison `SUCCESS`.

## Candidate scope

- Session Access-owned, una activa por Station;
- start/resolve/touch/logout/switch con expiración y revocación;
- bearer opaco en cookie segura y CSRF/origin contract;
- CAS servidor y coordinación browser por origen para cookies compartidas,
  tabs concurrentes y orden adversarial de responses;
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
| Cross-tab actor/cookie coherence | Web Locks + invalidation-only BroadcastChannel + CAS | PASS local |
| Stale response cookie safety | disjoint login CSRF + GET/denied DELETE without authoritative `Set-Cookie` | PASS local |
| Exact logout | bearer + CSRF close under Station guard | PASS local |
| Lost-cookie expiry recovery | due-only reap under Station guard | PASS local |
| Shared-runtime contention/shutdown | bounded scheduler unit tests + same-runtime PostgreSQL | PASS local |
| Idle/absolute expiry | controlled clock + PostgreSQL | PASS local |
| Logout/switch/reload | application + UI/local runtime | PASS local |
| Lifecycle invalidation | PostgreSQL material negatives | PASS local |
| DEC-005 Option A | checker + 188 fixtures/53 product mutations | PASS local |
| Light/Dark/responsive/focus | local visual validation | PASS local; 390/768/1024/1280/1440 |
| Two-run reproducibility | CI run-1/run-2/comparison | PASS exact candidate/main |

## Local verification

- Toolchain: Node.js `24.18.0`, pnpm `11.15.1`, PostgreSQL `18.4`.
- `pnpm run verify`: PASS después de la remediación; `577` tests, `561` PASS,
  `16` skips PostgreSQL gobernados y `0` FAIL; typecheck, build,
  unit/contracts, structure, architecture, external-configuration, UI
  foundation y production UI exclusion all green.
- Focused Session/UI/scheduler: PASS; latest-response and mutation-generation
  races, cookie/origin/CSRF/no-store, replacement, expiry, invalidation,
  backpressure and focus contracts covered; `55/55` en la selección afectada.
- Arquitectura: `307/307` PASS después de eliminar el raw SQL detectado por
  D5-R046.
- Material PostgreSQL 18.4: `7/7` owner-scoped suites PASS en dos runs, cleanup
  PASS y comparison MATCH; material SHA-256
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

Los resultados anteriores quedaron confirmados por candidate CI, focused
review, merge funcional y CI exacto de `main`.

## Evidencia del candidato exacto

| Evidencia | Estado |
|---|---|
| SHA final del candidato | `cdf2805344a5302844a8f7f6f042cb39fbe1515c` |
| `pnpm run typecheck` | PASS local |
| `pnpm run build` | PASS local |
| `pnpm run test:architecture` | PASS local `307/307` |
| Suites funcionales y PostgreSQL 18.4 de Session | PASS local y CI exacto |
| Validación visual local responsive/focus | PASS local |
| Focused Critical-risk review | PASS; `0B/0H/0M/1L` |
| PR y candidate CI run-1/run-2/comparison | PR #33; `34149620560` GREEN |
| Merge autorizado y CI exacto de `main` | `f3e394b59ec7421e13b36ed6bfddff28e45c0dd7`; `34150632738` GREEN |
| Owner Acceptance y cierre documental | APPROVED; PR #34/CI `34153470560` completan `Done` |

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
configuración/startup y `smoke:start` contra PostgreSQL 18.4. Requirió nuevo
commit, focused review y CI autoritativo completo sobre el nuevo HEAD; el run
fallido permanece como trazabilidad, no como waiver ni señal intermitente.

El siguiente run `34146007196` sobre
`b622d72da36fe96bdfeab98bc2758db32a36faf5` dejó run-1, run-2 y comparison
GREEN, pero **queda supersedido como evidencia final**: la focused review del
SHA exacto detectó riesgos materiales que exigían modificar el candidato. No se
reutiliza ese GREEN para autorizar el nuevo HEAD.

## Focused review del candidato supersedido

La revisión Critical-risk sobre `b622d72` encontró `0 BLOCKER / 2 HIGH / 3
MEDIUM / 0 LOW` antes de remediación:

1. actor visible por tab podía divergir de las cookies compartidas durante una
   mutación concurrente;
2. logout podía reportarse como exitoso después de agotar una carrera CAS sin
   demostrar el cierre de la fila activa;
3. `GET`/DELETE obsoletos podían alterar el par autoritativo de cookies;
4. `SR_PIN_PEPPER` malformado no se materializaba durante startup;
5. evidencia/PR declaraban PASS antes de completar la revisión exacta.

La remediación integrada introduce coordinación origin-wide fail-closed,
invalidación previa y final sin identidad, CAS explícito, prueba de posesión del
bearer para switch, logout autenticado y atómico, challenge CSRF disjunto,
recovery sólo de Sessions materialmente vencidas y validación eager del pepper.
Una mutación admitida conserva el lock hasta conocer el resultado para evitar
un commit servidor cuyo `Set-Cookie` se pierda por abandono cliente. Los tests
adversariales cubren success/error, response ordering, replay, cancelación,
timeouts pre-admisión y carreras PostgreSQL.

Estos findings quedaron cerrados en el candidato verificado, con BLOCKER `0`,
HIGH `0` y MEDIUM `0` restante. El dictamen final quedó fijado sobre
`cdf2805344a5302844a8f7f6f042cb39fbe1515c` y su CI autoritativo.

Durante esa remediación, el gate ejecutable D5-R046 detectó además un BLOCKER:
un predicado temporal nuevo había usado raw SQL fuera de una migración y hacía
fallar la policy y sus mutaciones controladas. Se reemplazó por el expression
builder tipado de Kysely y un cutoff derivado de
`OPERATIONAL_SESSION_IDLE_MS`; `pnpm run test:architecture` volvió a pasar
`307/307` y el full verify local posterior quedó GREEN.

## Boundaries

No contextual business authorization, business audit, Operational Note
retrofit, production secrets, remote infrastructure, release or deploy.

## Siguiente gate

PBI-034 está `Done` y G3 `PASS` sin closure-of-closure. PBI-026 queda
`Done candidate`, G4 `PASS candidate`; PBI-028 está seleccionado y no iniciado.
