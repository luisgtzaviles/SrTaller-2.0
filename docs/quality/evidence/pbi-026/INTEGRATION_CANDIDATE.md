# PBI-026 — Contextual Authorization Integration Candidate

## Estado

- **Estado del PBI:** `Done candidate`; cierre documental pendiente.
- **Estado del artefacto:** candidato exacto integrado en `main`.
- **Riesgo / tamaño:** `Critical` / `Large`.
- **Rama temporal:** `feature/pbi-026-contextual-authorization`.
- **Baseline de `main`:** `54ddc251cda8ec7465b7913786c647f8d3ccbeac`.
- **Baseline CI:** run `34153470560`, run-1/run-2/comparison GREEN.
- **Candidate SHA / PR / CI:**
  `54b3cf01c6b5ae0b51ca0b8f432d23abbb229ab7` / PR #35 /
  `34157187442` GREEN.
- **Focused review / Owner Acceptance:** PASS `0B/0H/0M/0L` / APPROVED
  condicionalmente sobre merge y exact-main CI satisfechos.
- **Functional merge / exact-main CI:**
  `4db5d9384d13c200eb2031dceb32dd89efcca64d` /
  `34158203438` GREEN.
- **Released / deployed:** NO / NO.

Este documento conserva evidencia del candidato funcional exacto y su
integración. El estado `Done` y G4 `PASS` sólo se vuelven efectivos al integrar
el [cierre documental](./CLOSURE_CANDIDATE.md) y obtener su CI exacto GREEN.
No prueba release ni deploy.

## Diseño materializado

La decisión se separa en dos responsabilidades dirigidas:

1. Access resuelve Station confiable, Session vigente, User y capabilities
   frescas, valida el transporte de mutaciones y entrega un contexto inmutable.
2. Repairs fija la capability requerida por operación, resuelve el recurso
   dentro del Tenant/Branch autorizado y ejecuta el caso de uso propietario.

El request sólo aporta evidencia de transporte. `tenantId`, `branchId`,
`stationId`, `sessionId`, `userId`, nombres de role y capabilities enviados por
el cliente no son autoridad. No existe cache autoritativa de grants ni fallback
a `LocalRepairContext`.

## Matriz cerrada HTTP

| Método y ruta | Política fija | Resultado del candidato |
|---|---|---|
| `GET /api/repairs` | `repairs.read`, read | autorizado sólo dentro del Branch efectivo |
| `GET /api/repairs/technicians` | `repairs.read`, read | proyección read-only scoped |
| `GET /api/repairs/:id` | `repairs.read`, read | missing/foreign: `404 REPAIR_NOT_FOUND` uniforme |
| `GET /api/repairs/:repairId/evidence/:evidenceId/content` | `repairs.read`, read | evidence subordinada; missing/foreign/unavailable: `404 REPAIR_EVIDENCE_NOT_FOUND` uniforme |
| `POST /api/repairs/:repairId/notes` | `repairs.add_note`, state-change | exige same-origin, JSON y double-submit CSRF |
| D5 assign/reassign/unassign | `DENY_UNSUPPORTED` | `403 ACCESS_DENIED` antes de efectos |
| D6.1 start diagnosis | `DENY_UNSUPPORTED` | `403 ACCESS_DENIED` antes de efectos |
| D6.2 move workshop | `DENY_UNSUPPORTED` | `403 ACCESS_DENIED` antes de efectos |
| New Repair | sin capability aprobada | ruta/UI inaccesible; no se inventa un write |

La policy se selecciona por método del servidor, nunca por el payload. Las
lecturas y respuestas de identidad son `no-store`; los errores públicos no
enumeran qué predicado falló.

## Inventario de artefactos

### Access

- [`src/modules/access/index.ts`](../../../../src/modules/access/index.ts):
  contrato framework-neutral, token, contexto y error sanitizado.
- [`contextual-authorization.executor.ts`](../../../../src/modules/access/presentation/contextual-authorization.executor.ts):
  resolución ordenada y fresca de autoridad, CSRF/origin/JSON y ejecución.
- [`access.module.ts`](../../../../src/modules/access/access.module.ts):
  provider/export explícito.
- [`access-session.controller.ts`](../../../../src/modules/access/presentation/access-session.controller.ts):
  snapshot de
  capabilities sólo para una Session autenticada.

### Repairs

- [`repair-protected-operations.ts`](../../../../src/modules/repairs/application/repair-protected-operations.ts): matriz fija,
  composición y scope de recurso.
- [`repairs.module.ts`](../../../../src/modules/repairs/repairs.module.ts):
  única composición dirigida con
  Access; sin `LocalRepairContext` ni providers HTTP para writes no catalogados.
- [`repairs.controller.ts`](../../../../src/modules/repairs/presentation/repairs.controller.ts):
  evidencia de
  transporte, `no-store` y traducción pública 401/403/404.

### UI advisory

- [`session-capabilities.mjs`](../../../../apps/dev-preview-web/src/session/session-capabilities.mjs)
  y su declaración
  tipada: catálogo finito y parsing fail-closed.
- [`OperationalSessionGate.tsx`](../../../../apps/dev-preview-web/src/session/OperationalSessionGate.tsx)
  / [`session-api.ts`](../../../../apps/dev-preview-web/src/session/session-api.ts):
  snapshot y CSRF actuales;
  limpieza inmediata ante logout/switch/invalidation.
- [`ApplicationShell.tsx`](../../../../apps/dev-preview-web/src/components/shell/ApplicationShell.tsx),
  [`App.tsx`](../../../../apps/dev-preview-web/src/App.tsx),
  [`DashboardPage.tsx`](../../../../apps/dev-preview-web/src/pages/DashboardPage.tsx),
  [`RepairsPage.tsx`](../../../../apps/dev-preview-web/src/pages/RepairsPage.tsx),
  [`RepairDetailPage.tsx`](../../../../apps/dev-preview-web/src/pages/RepairDetailPage.tsx)
  y [`AccessDeniedPage.tsx`](../../../../apps/dev-preview-web/src/pages/AccessDeniedPage.tsx): navegación/rutas/controles
  proyectados sin reemplazar enforcement de backend.

### Persistencia

No existe migración PBI-026. El candidato consume Station, Session, User,
assignments, roles, capability catalog y Repairs ya persistidos. El write de
Operational Note conserva su modelo de actor sintético existente: actor real,
business audit y correlation pertenecen exclusivamente a PBI-028.

## Matriz riesgo → prueba

| Riesgo / criterio | Evidencia local | Resultado actual |
|---|---|---|
| orden Station → Session → grants y contexto inmutable | [`access-contextual-authorization-application.test.mjs`](../../../../test/access-contextual-authorization-application.test.mjs) | PASS local |
| ausencia/malformación y dependency failure fail-closed | [`access-contextual-authorization-application.test.mjs`](../../../../test/access-contextual-authorization-application.test.mjs) | PASS local |
| CSRF/origin/content-type/double-submit | [`access-contextual-authorization-application.test.mjs`](../../../../test/access-contextual-authorization-application.test.mjs), [`access-session-contract.test.mjs`](../../../../test/access-session-contract.test.mjs) | PASS local |
| revocación fresca, sin cache | application y PostgreSQL PBI-026 | PASS local y PostgreSQL material |
| contrato público y provider Access-owned | [`access-contextual-authorization-contract.test.mjs`](../../../../test/access-contextual-authorization-contract.test.mjs) | PASS local |
| matriz fija, scope confiable y errores sanitizados | [`repair-contextual-authorization-contract.test.mjs`](../../../../test/repair-contextual-authorization-contract.test.mjs) | PASS local; matriz exacta incluida |
| D5/D6 direct-call con cero efectos | contratos Repairs y PostgreSQL PBI-026 | PASS local y PostgreSQL material |
| snapshot UI estricto y limpieza de actor | [`contextual-authorization-ui-contract.test.mjs`](../../../../test/contextual-authorization-ui-contract.test.mjs), [`operational-session-ui-contract.test.mjs`](../../../../test/operational-session-ui-contract.test.mjs) | PASS local |
| affordances y rutas sin capability | [`contextual-authorization-ui-contract.test.mjs`](../../../../test/contextual-authorization-ui-contract.test.mjs) y contratos visuales | PASS contractual + runtime local |
| ownership/composición/registro cerrado | policy DEC-005 y tests de arquitectura | PASS local — policy v5; `307/307` tests |
| Tenant/Branch/resource isolation material | [`contextual-authorization-postgresql.test.mjs`](../../../../test/contextual-authorization-postgresql.test.mjs) con múltiples scopes | PASS — PostgreSQL 18.4, `8/8`; dos runs `MATCH` |
| Light/Dark/responsive/focus | validación local en navegador | PASS en 390, 768 y 1280 px |
| reproducibilidad | CI autoritativo run-1/run-2/comparison | PASS — candidate `34157187442`; exact-main `34158203438` |

El smoke sobre `AppModule`/routing Nest real sin Station confiable pasó con
`401 AUTHENTICATION_REQUIRED` y sin habilitar bootstrap local implícito; su
contrato está en
[`access-session-contract.test.mjs`](../../../../test/access-session-contract.test.mjs).
Este resultado y la matriz exacta de rutas quedaron además cubiertos por CI
autoritativo del candidate y del merge funcional exactos.

## Comandos de verificación

Los resultados sólo se registrarán después de ejecutar cada comando sobre el
mismo worktree candidato con Node `24.18.0`, pnpm `11.15.1` y PostgreSQL
`18.4`:

```text
pnpm run typecheck
pnpm run test:architecture
node --test test/access-contextual-authorization-application.test.mjs
node --test test/access-contextual-authorization-contract.test.mjs
node --test test/repair-contextual-authorization-contract.test.mjs
node --test test/contextual-authorization-ui-contract.test.mjs
node scripts/test-owner-scoped-persistence-postgresql.mjs --runs 2
pnpm run verify
git diff --check
```

El runner PostgreSQL usa su configuración efímera gobernada e incluye la suite
PBI-026 en el inventario cerrado. Su ejecución material sobre PostgreSQL 18.4
cerró `8/8 PASS`; dos runs fueron `MATCH`, con material SHA-256
`b6cbc03d7c758b613e31a4131c01e547603da691c846f04db205fc0c09a353b7`.
Esto prueba la suite PostgreSQL local; candidate CI `34157187442` y exact-main
CI `34158203438` reprodujeron run-1, run-2 y comparison GREEN.

## Resultados locales observados

- `pnpm run verify`: PASS con `599` tests totales, `582` PASS, `17` skips
  esperados para suites materiales separadas y `0` fail.
- El mismo verify dejó typecheck, build, policy de arquitectura v5,
  configuración externa, UI foundation y exclusión del catálogo productivo
  en PASS.
- Tests de arquitectura focalizados: `307/307` PASS.
- PostgreSQL 18.4 material: `8/8 PASS`; doble ejecución `MATCH`; hash material
  `b6cbc03d7c758b613e31a4131c01e547603da691c846f04db205fc0c09a353b7`.
- Matriz exacta de rutas Repairs y smoke no autenticado de `AppModule`: PASS.
- Revisión de seguridad pre-commit independiente: PASS después de aislar los
  borradores por Session y de resolver la proyección advisory antes de crear o
  reemplazar la Session; no quedaron findings BLOCKER/HIGH/MEDIUM abiertos.
- Runtime local en navegador: PASS en Light/Dark y 390/768/1280 px; login,
  Repairs, Detail, logout y entrada directa protegida fueron verificados. New
  Repair y writes D5/D6 no tuvieron affordances; el composer de nota sólo fue
  visible con `repairs.add_note`.
- Enlaces Markdown relativos: PASS sobre `586` archivos inspeccionados.
- `git diff --check`: PASS.

Candidate `54b3cf01c6b5ae0b51ca0b8f432d23abbb229ab7`, PR #35, focused review
PASS y CI autoritativo `34157187442` quedaron fijados. El merge funcional
`4db5d9384d13c200eb2031dceb32dd89efcca64d` y exact-main CI `34158203438`
también quedaron GREEN.

## Límites y riesgos residuales

- La proyección de capabilities puede quedar visualmente stale; el siguiente
  request vuelve a autorizar server-side.
- Un efecto ya linearizado antes de una revocación concurrente puede terminar;
  la siguiente decisión posterior al commit de revocación debe denegar.
- D5/D6/New Repair permanecen inaccesibles desde HTTP/UI hasta que capabilities
  específicas sean autorizadas.
- Operational Note todavía persiste actor sintético. PBI-026 no declara G5 ni
  G8; PBI-028 conserva actor real, auditoría y correlation.
- Enrollment/administración productiva, autorización reforzada, secretos
  productivos, release, deploy e infraestructura remota permanecen fuera.

## Cierre funcional

1. candidate y CI exactos: PASS;
2. focused Critical-risk review: PASS, `0B/0H/0M/0L`;
3. merge funcional y exact-main CI: PASS;
4. Owner Acceptance condicional: APPROVED;
5. cierre documental: pendiente de merge autorizado y CI exacto de `main`.

PBI-026 queda `Done candidate`, G4 `PASS candidate`, Current PBI `NONE`, WIP
`0/1` y PBI-028 seleccionado como candidato no iniciado.

## Próxima revisión

El merge autorizado del cierre y su CI exacto GREEN vuelven efectivos PBI-026
`Done` y G4 `PASS` sin closure-of-closure. No autorizan release, deploy ni el
inicio de PBI-028.
