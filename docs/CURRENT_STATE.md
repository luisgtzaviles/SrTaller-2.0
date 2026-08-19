# SR Taller 2.0 — Current Repository Audit

## Estado y alcance del documento

- **Estado:** Fotografía canónica del repositorio, reconciliada el 2026-08-18.
- **Baseline técnica integrada:** `main` en
  `c8628fb42226aa7a4f0d010ec8ef3d9d70a01823`.
- **PBI-030 integrado:** PR #8 fusionada con merge commit `c8628fb`; Technical
  DoD e independent review pasan. El PBI permanece `In review`, con Owner
  Acceptance, evidencia AT/cross-browser restante y Preview deployment
  pendientes.
- **Alcance:** código, configuración, documentación vigente, Git/GitHub y
  contraste HTTP de sólo lectura con Preview.
- **Regla:** este documento describe estado; no autoriza implementación,
  merge, deploy, migraciones ni mutaciones de infraestructura.
- **Deriva:** todo hecho operacional debe volver a verificarse si cambia
  `main`, CI, Dokploy o Preview.

## 1. Executive Summary

SR Taller 2.0 ya tiene una foundation técnica ejecutable: monorepo pnpm,
frontend React/Vite, shell NestJS, PostgreSQL, migraciones, aislamiento base de
tenant/sucursal, quality gates, imagen OCI y Preview en Dokploy. Preview está
accesible y sus health checks están sanos.

Todavía no existe un flujo funcional de negocio. La interfaz recuperada muestra
dashboard y Reparaciones, pero sus llamadas `/api/preview/*` reciben `404`
porque `main` no contiene esos controllers, casos de uso ni tablas. Identidad,
PIN, sesión, roles, capacidades y estación confiable permanecen conceptuales o
fuera de `main`.

La base permite comenzar refinamiento de producto y conserva CI canónico verde.
PR #8 integró Design System/Application Shell V1 mediante `c8628fb`; el run de
`main` `32217905296` pasó ambos jobs y la comparación reproducible. PBI-030
permanece `In review`: la integración no afirma Owner Acceptance, `Done` ni
Preview deployment. Además,
PBI-024 tiene una implementación extensa sólo en una rama y PR
draft divergentes; debe decidirse si se recupera o se descarta antes de
duplicar esa foundation.

## 2. Git State

| Hecho | Estado auditado |
|---|---|
| Repositorio | `/Users/luisantoniogutierrez/Documents/GitHub/SrTaller-2.0` |
| Rama auditada | `main` |
| Baseline técnica integrada | `c8628fb42226aa7a4f0d010ec8ef3d9d70a01823` |
| Implementación PBI-030 | PR #8 integrada; candidate `5ca8866`, merge `c8628fb` |
| Remote | `origin`: `https://github.com/luisgtzaviles/SrTaller-2.0.git` |
| Upstream | `origin/main` |
| Divergencia local/upstream | `0/0`; `ls-remote` confirmó el mismo SHA |
| Working tree al iniciar la auditoría | Limpio; sin staged ni untracked |
| Tags | Ninguno |
| PR de `main` | Ninguna asociada |

Commits recientes significativos:

- `c8628fb`: merge autorizado de PR #8; PBI-030 integrado en `main`.
- `5ca8866`: revisión independiente y reconciliación documental del candidato.
- `70a7b4d`: remediaciones de contraste, responsive, accesibilidad y checker.
- `f802fee`: merge autorizado de PR #7; estimación acordada y PBI-030 `Ready`.
- `a8f2302`: reconciliación post-merge de readiness y CI de PBI-030.
- `efd9ec0`: merge autorizado de PR #5 y restauración de CI compilado.
- `18dab5a`: workflow canónico de desarrollo y delivery.
- `fc3271e`: comando one-shot de migración para Dokploy.
- `9026789`: foundation PostgreSQL de Preview.
- `be3845d`: `main` como baseline integrada única.
- `de220d4`: consolidación de Visual Slice 0.

Ramas/PR relevantes para interpretar la baseline:

- [PR #3](https://github.com/luisgtzaviles/SrTaller-2.0/pull/3),
  `r0/pbi-024-trusted-station-context` → `main`: draft, `CONFLICTING`,
  17 commits detrás y 26 adelante de `main`. Sus checks históricos fueron
  verdes, pero no prueban compatibilidad actual.
- [PR #4](https://github.com/luisgtzaviles/SrTaller-2.0/pull/4),
  `ops/pbi-ops-001-readonly-file-explorer` →
  `preview/visual-slice-0`: draft y basada en una rama histórica, no en la
  baseline canónica actual.
- [PR #5](https://github.com/luisgtzaviles/SrTaller-2.0/pull/5),
  `fix/pbi-030-readiness-ci` → `main`: integrada con autorización Owner como
  `efd9ec05`; CI de `main` verde en los runs `32199570584` y `32201164615`.
- [PR #7](https://github.com/luisgtzaviles/SrTaller-2.0/pull/7), promoción de
  estimación/readiness de PBI-030: integrada con autorización Owner como
  `f802fee`; CI de `main` verde en el run `32203154573`.
- [PR #8](https://github.com/luisgtzaviles/SrTaller-2.0/pull/8), Design System
  & Application Shell V1: integrada con autorización Owner como `c8628fb`; CI
  de `main` verde en el run `32217905296`.

Evidencia: Git actual, `docs/delivery/BRANCH_POLICY.md` y las PR #3/#4/#5/#7/#8
en GitHub.

## 3. Repository Map

```text
SR Taller 2.0
├── apps/dev-preview-web       React/Vite: Visual Slice 0
├── src                        shell NestJS y composición
│   ├── health                 liveness/readiness
│   ├── infrastructure/database configuración, conexión, migración y transacción
│   └── modules                access, stations y tenancy
├── architecture              política ejecutable de límites modulares
├── scripts                    build, verificación, CI, PostgreSQL y OCI
├── test                       contratos, arquitectura, health y persistencia
├── docs                       producto, decisiones, delivery y evidencia histórica
├── .github/workflows          CI canónico
└── Dockerfile                 artefacto OCI único de frontend + backend
```

Existe un workspace raíz y `apps/dev-preview-web`; no existe `packages/` ni
Docker Compose canónico. `dist/` y `node_modules/` locales están ignorados y no
son fuente de verdad.

## 4. Current Stack

| Capa | Baseline real | Evidencia |
|---|---|---|
| Runtime | Node.js `24.18.0`, pnpm `11.15.1` | `package.json`, workflow CI, `Dockerfile` |
| Lenguaje | TypeScript `6.0.3`, ESM/NodeNext | `package.json`, `tsconfig.json` |
| Workspace | pnpm: raíz + `apps/dev-preview-web` | `pnpm-workspace.yaml` |
| Frontend | React/ReactDOM `19.2.8`, Vite `8.2.0` | `apps/dev-preview-web/package.json` |
| Routing | `react-router-dom` `7.18.2` | frontend `package.json`, `src/App.tsx` |
| Estado/data | estado React local + `fetch`; sin store dedicado | frontend `src/` |
| CSS | CSS propio; sin design system empaquetado | `apps/dev-preview-web/src/styles.css` |
| Backend | NestJS `11.1.28` + Express | `package.json`, `src/main.ts` |
| Persistencia | PostgreSQL 18.x/18.4, Kysely `0.29.4`, `pg` `8.22.0` | `package.json`, docs de DB, CI |
| Delivery | Docker/OCI multi-stage, Dokploy/Traefik | `Dockerfile`, deployment docs |

No hay librería de validación HTTP/DTO, autenticación, estado frontend global,
suite frontend dedicada, Redis, WAHA, workers ni almacenamiento R2 en la
baseline.

## 5. Software Architecture

La arquitectura materializada es un monolito modular de un único artefacto.
`architecture/dec-005-policy.json` y
`scripts/lib/architecture-checker.mjs` hacen ejecutables los límites:

- módulos permitidos: `tenancy`, `stations`, `access`;
- dependencias: `access → stations/tenancy`, `stations → tenancy`,
  `tenancy → ninguna`;
- consumo entre módulos sólo por superficies públicas;
- ownership de persistencia por módulo;
- prohibición de `shared`, `common`, `core`, repositorios genéricos y acceso
  global a DB;
- scopes tipados y errores técnicos sanitizados;
- health como única superficie HTTP backend autorizada actualmente.

ADRs relevantes vigentes: ADR-001 (TypeScript/Node), ADR-002 (monolito
modular), ADR-003 (PostgreSQL), ADR-004 (shared-schema multitenancy), ADR-005
(NestJS con condiciones), ADR-007 (OCI), ADR-009 (repositorio único), ADR-010
(contexto por estación), ADR-011 (usuario/PIN/sesión), ADR-012
(roles/capacidades) y ADR-013 (autorización reforzada). Véase
`docs/decisions/README.md`.

ADR-006 (Next.js) y ADR-008 (wildcard subdomains) siguen `Proposed`; no
describen el frontend React/Vite ni el routing actual.

## 6. Tenancy / Identity / Access Foundation

| Concepto | Decisión/docs | Código en `main` | Persistencia | API | UI |
|---|---|---|---|---|---|
| Tenant | Aceptado | IDs, scopes y repository | `tenants` | No | Sólo etiqueta no confiable |
| Branch | Aceptado | IDs, scopes y repository | `branches` | No | Sólo contexto esperado |
| Station | ADR-010 aceptado | módulo vacío/contrato mínimo | No | No | No |
| Usuario | ADR-011 conceptual | No | No | No | No |
| PIN/sesión | ADR-011 conceptual | No | No | No | No |
| Roles/capacidades | ADR-012/013 conceptual | módulo `access` vacío | No | No | No |

Los adapters de tenant/branch son tenant-scoped y fallan cerrado, pero todavía
no están registrados como providers Nest ni consumidos por una API. La
implementación de estación confiable existe únicamente en la rama divergente
de PBI-024, no en `main`.

## 7. Database State

`src/infrastructure/database` materializa configuración fail-closed,
conexión, capabilities por rol, migrador Kysely one-shot y transaction runner.
Las variables canónicas son `SR_DB_*`; connection strings genéricos como
`DATABASE_URL` están prohibidos.

La única migración productiva de `main` es
`src/infrastructure/database/migrations/20260725183832_database_create_tenants_and_branches.ts`:

- `tenants`: `tenant_id UUID` PK y `created_at TIMESTAMPTZ`;
- `branches`: `tenant_id`, `branch_id`, `created_at`, PK compuesta
  `(tenant_id, branch_id)` y FK restrictiva a `tenants`;
- no hay tablas funcionales de reparaciones, clientes, usuarios, sesiones,
  roles, permisos o estaciones;
- no hay seeds/dev data productivos.

El journal Kysely y el schema mínimo se verifican en readiness. CI crea
PostgreSQL 18.4 aislado por ejecución y ejecuta pruebas reales de conexión,
migración, schema, transacciones y repositories. Preview responde `/readyz`
con 200, evidencia indirecta de compatibilidad runtime; esta auditoría no
consultó el catálogo con credenciales.

## 8. Frontend State

Rutas materializadas en `apps/dev-preview-web/src/App.tsx`:

- `/`: dashboard;
- `/reparaciones`: listado;
- `/reparaciones/nueva`: alta;
- `/reparaciones/:id`: detalle;
- cualquier otra ruta del router redirige a `/`.

Existe layout con sidebar, header, navegación y barra de contexto. El data
layer en `apps/dev-preview-web/src/api.ts` llama:

- `GET /api/preview/context`;
- `GET/POST /api/preview/repairs`;
- `GET /api/preview/repairs/:id`;
- `PATCH /api/preview/repairs/:id/status`.

Ninguna de esas APIs existe en `main`. La UI muestra estados vacíos/error y
etiqueta de datos sintéticos; el formulario se puede llenar visualmente, pero
no puede persistir. No existe autenticación visible ni suite unitaria/E2E
frontend dedicada.

La dirección
[Design System & Application Shell V1](design-system/DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md)
fue autorizada para implementación. La implementación de
[PBI-030](backlog/pbis/PBI-030.md) materializa tokens semánticos,
light/dark/system, CSS Modules, Lucide, responsive, shell y catálogo dentro del
cliente React/Vite. Está integrada en `main` y permanece `In review`; CI de PR,
CI de `main` e independent review pasan, mientras la matriz Primary/AT no
disponible permanece parcial. Preview aún ejecuta la baseline desplegada
anterior hasta una autorización y entrega posteriores.

## 9. Backend State

| Módulo | API | Persistencia | UI | Estado funcional |
|---|---|---|---|---|
| Health | `/livez`, `/readyz` | readiness consulta DB/journal/schema | No | Funcional |
| Tenancy | Ninguna | tenant/branch repositories | Contexto visual sin datos | Foundation no conectada |
| Stations | Ninguna | Ninguna en `main` | No | Contrato/esqueleto |
| Access | Ninguna | Ninguna | No | Esqueleto |
| Reparaciones | Ninguna | Ninguna | Visual Slice 0 | No funcional |

`src/main.ts` inicializa DB, crea Nest, registra readiness, monta la SPA
estática y escucha. `src/app.module.ts` importa los tres módulos y sólo registra
`HealthController`. No hay services/use cases de producto, guards,
interceptors, auth, tenancy resolution HTTP, DTO validation ni controllers de
producto.

## 10. Testing and Quality Gates

Comandos vigentes de `package.json`:

| Comando | Propósito |
|---|---|
| `pnpm run typecheck` | TypeScript raíz + frontend |
| `pnpm run build` | build limpio backend + Vite |
| `pnpm test` | suite Node de contratos/unidad/arquitectura |
| `pnpm run test:architecture` | suite arquitectónica dedicada |
| `pnpm run architecture` | policy/checker DEC-005 |
| `pnpm run verify` | gate local compuesto |
| `pnpm run smoke:start` | arranque del artefacto compilado |
| `pnpm run smoke:ui` | rutas, assets y health de la UI compilada |
| `pnpm run verify:container` | build/runtime OCI con PostgreSQL real |
| `pnpm run test:preview-db` | contrato runtime contra PostgreSQL Preview compatible |

La suite cubre arquitectura, configuración, errores, migraciones,
transacciones, tenancy repositories, health, static routes y evidencia CI.
No hay mutation suite activa en `main` ni pruebas funcionales frontend/API.

## 11. CI/CD

`.github/workflows/authoritative-linux-ci.yml` es el único workflow y el CI
canónico. Se ejecuta en PRs, pushes a `main`/`ci/**`/`r0/**` y manualmente. Dos
runs independientes sobre Ubuntu 24.04:

1. verifican checkout/toolchain y frozen lockfile;
2. ejecutan arquitectura, typecheck y build;
3. ejecutan suites reales con PostgreSQL 18.4;
4. ejecutan tests, `verify` y smokes;
5. comprueban inmutabilidad del checkout;
6. producen evidencia sanitizada y comparan hashes/resultados.

El run histórico
[`32127917819`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/32127917819)
de `18dab5a` falló en ambos jobs en
`Run compiled artifact smoke`. `scripts/smoke-start.mjs` arranca el backend sin
las variables `SR_DB_*` ahora obligatorias y el proceso termina con
`PERSISTENCE_CONFIG_REQUIRED`. Los gates anteriores, incluida la suite
PostgreSQL real y 359 pruebas del `verify`, pasaron; la comparación fue omitida.

CI no publica imagen, no usa registry y no despliega.

La revisión de PBI-030 reprodujo la causa bajo Node `24.18.0` y publicó en la
PR #5 un arreglo mínimo: PostgreSQL 18.4 aislado por job, migración explícita,
smokes con rol de aplicación y colector compatible con los assets controlados
del bundle sin relajar detección de rutas personales. Tras la integración
autorizada, el [run `32199570584`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/32199570584)
sobre `efd9ec05` pasó `smoke:start`, `smoke:ui`, ambos jobs y la comparación de
evidencia. **CI BASELINE: GREEN.**
Véase
[PBI-030 Readiness Review](design-system/PBI_030_READINESS_REVIEW.md#7-recuperación-de-ci-base).

## 12. Docker / OCI / Dokploy / Preview

El `Dockerfile` multi-stage fija Node 24.18.0 por digest, usa pnpm exacto,
construye backend y frontend, instala sólo dependencias productivas y ejecuta
como usuario `node`. La imagen expone puerto 3000, contiene la SPA y el backend,
y usa `/readyz` como health check.

Flujo real actual:

```text
Developer
    ↓
temporary branch
    ↓
Pull Request + authoritative CI
    ↓
explicit merge/push to main
    ↓
manual Dokploy build from Git + Dockerfile
    ↓
local OCI image/container on srtaller-app-01
    ↓
Traefik TLS/routing
    ↓
https://preview.srtaller.dev
```

No hay registry en el flujo actual. Dokploy clona `main` con deploy key de
sólo lectura y construye. `srtaller-postgres` 18.4 vive en la red interna, sin
puerto público y con volumen persistente. Cloudflare publica el registro DNS;
Traefik termina TLS. Los secretos se inyectan en Dokploy y no viven en Git.

Rollback de Preview está documentado como corrección/roll-forward y redeploy.
La promoción/rollback por digest es objetivo futuro para Staging/Production,
no capacidad actual. Evidencia: `Dockerfile`,
`docs/architecture/DEPLOYMENT_STRATEGY.md`, `docs/delivery/ENVIRONMENTS.md` y
`docs/architecture-readiness/preview-postgresql-foundation.md`.

## 13. Canonical Development Workflow

El flujo vigente es:

```text
Owner/PBI → rama temporal desde main → cambio mínimo → validación local
→ commit → push/PR → CI → review/autoridad → merge explícito a main
→ push main → deploy manual Dokploy Preview → smoke remoto → validación Owner
```

Ramas normales: `feature/*`, `fix/*`, `ops/*`. `main` es la única baseline;
Preview/Staging/Production no son ramas. Merge, deploy, validación de producto
y cierre son estados separados. Production, datos reales, cambios destructivos,
costos, DNS estratégico, relajación de seguridad y operaciones irreversibles
requieren aprobación humana explícita.

La entrada obligatoria es `CONTRIBUTING.md`; el manual end-to-end es
`docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`.

## 14. Canonical Documentation

Lectura mínima ordenada:

| Orden | Documento | Autoridad actual |
|---:|---|---|
| 1 | `docs/product/PRODUCT_VISION.md` | Dirección de producto; conserva hipótesis/TBD |
| 2 | `docs/product/PRODUCT_SCOPE.md` | Alcance R0 y frontera de capacidades |
| 3 | `docs/architecture/APPLICATION_ARCHITECTURE.md` | Contrato parcial materializado |
| 4 | `architecture/dec-005-policy.json` | Política arquitectónica ejecutable |
| 5 | `docs/architecture/MULTITENANCY_MODEL.md` | Reglas de aislamiento y contexto |
| 6 | `docs/architecture/DATA_ARCHITECTURE.md` | Foundation física y dirección de datos |
| 7 | `docs/quality/QUALITY_STRATEGY.md` + `TESTING_STRATEGY.md` | Estrategia; partes aún Proposed |
| 8 | `docs/operations/MIGRATION_POLICY.md` | Política vigente de migraciones |
| 9 | `CONTRIBUTING.md` + workflow canónico | Entrada y proceso operativo |
| 10 | `docs/architecture/DEPLOYMENT_STRATEGY.md` + `ENVIRONMENTS.md` | Preview current; futuro claramente separado |
| 11 | `docs/decisions/README.md` | Estados de ADR/DEC |
| 12 | `docs/backlog/PRODUCT_BACKLOG.md` | Tracking actual, sujeto a reconciliación indicada abajo |

Este documento y el `README.md` raíz sustituyen la afirmación obsoleta de que
el proyecto sigue siendo sólo documental. Evidencias bajo
`docs/architecture-readiness`, revisiones de Sprint 00 y ramas históricas
conservan trazabilidad; no son baseline operativa.

## 15. Backlog / Decisions / Current Project State

- Último PBI integrado: PBI-030, todavía `In review`; último PBI cerrado:
  PBI-023.
- PBI-024: autorizado y con implementación/evidencia sólo en PR draft #3;
  no integrado, conflictivo y divergente.
- PBI-025 y PBI-027: `Blocked`.
- PBI-026, PBI-028 y PBI-029: `Draft`, no autorizados.
- Sprint 00: `Closed`; no hay sprint de implementación vigente.
- PR #4: trabajo ops draft sobre una base histórica, no producto ni `main`.
- DEC051-C02 y condiciones DEC-063 continúan documentadas como pendientes.

La existencia de código en una rama no lo convierte en producto actual. El
backlog se reconcilió para evitar “implementation not started”, pero no se
marca PBI-024 `Done` ni se autoriza su merge.

## 16. Foundation vs Product Boundary

### Foundation disponible

- toolchain y workspace reproducibles;
- monolito modular y checker de arquitectura;
- frontend/SPA empaquetado con el backend;
- health, OCI y Preview Dokploy;
- PostgreSQL 18.4, migrador, readiness y transaction runner;
- tablas y repositories tenant/branch con pruebas de aislamiento;
- CI profundo y verde sobre `main` `f802fee` en el run `32203154573`;
- workflow y separación Local/Preview/Staging/Production.

### Producto todavía por construir

- contexto de estación integrado en `main`;
- usuario, PIN, sesión, roles, capacidades y autorización;
- customers, devices de negocio y Reparaciones end-to-end;
- endpoints `/api/preview/*` y wiring de repositories/use cases;
- validación HTTP/DTO y pruebas funcionales frontend/API;
- Caja, inventario, lista de precios, pagos, cortes, CRM, mensajería,
  suscripciones y administración SaaS;
- Staging/Production y controles requeridos para datos reales.

## 17. Preview User Experience Today

Al abrir `https://preview.srtaller.dev`:

1. Traefik entrega el contenedor Dokploy construido desde `main`.
2. Nest/Express sirve el `index.html` y assets de React.
3. El usuario ve sidebar, dashboard, Reparaciones y contexto de development.
4. React solicita `/api/preview/context` y `/api/preview/repairs`.
5. Nest responde `404`; la UI muestra contexto no disponible, cero registros y
   error de carga.
6. La ruta de alta muestra un formulario, pero enviarlo no puede persistir.
7. `/livez` y `/readyz` responden 200; rutas API desconocidas responden 404.

Funcional hoy: navegación visual, rutas SPA, assets y health. Placeholder o
incompleto: contexto, métricas y Reparaciones. Inexistente: autenticación y
operaciones de negocio persistentes.

## 18. Risks Before Product Development

| Severidad | Riesgo evidenciado | ¿Antes del primer PBI funcional? |
|---|---|---|
| HIGH | PBI-024 existe en PR conflictiva y no integrada; duplicarlo perdería trabajo y evidencia | Sí, antes de un slice dependiente de contexto |
| HIGH | No existe identidad/contexto/autorización runtime en `main` | Sí para operaciones tenant reales; debe formar parte de la secuencia autorizada |
| HIGH | Visual Slice 0 sugiere acciones que la API no implementa | Debe quedar explícito al definir el primer slice; no bloquea refinamiento |
| MEDIUM | Root README y tracking PBI-024 estaban desactualizados | Corregido por esta reconciliación documental |
| MEDIUM | PR #4 apunta a una rama histórica | Resolver/parkear antes de confundir el flujo, no bloquea producto por sí sola |
| MEDIUM | Sin tests frontend/E2E de producto | Incorporar proporcionalmente con el primer slice funcional |
| LOW | Documentación histórica contiene topologías previas | Mantener como historia con etiquetas; no usar como operación actual |

## 19. Recommended Starting Point

Si mañana comenzamos a construir funcionalidad, el punto técnico es `main`, no
una rama histórica ni el runtime manual anterior. El punto documental es esta
auditoría, `CONTRIBUTING.md`, el workflow canónico y el PBI autorizado que
corresponda.

Secuencia mínima previa a producto, sin diseñar todavía un roadmap:

1. tomar una decisión Owner/Ingeniería sobre PR #3: recuperar selectivamente y
   revalidar PBI-024 contra `main`, o descartarla/supersederla con razón
   explícita;
2. no iniciar PBI-025 ni una API de Reparaciones hasta resolver ese contexto y
   emitir la autoridad/PBI correspondiente;
3. seleccionar después una rebanada vertical pequeña con UI + API + use case +
   persistencia + tenant/auth scope + pruebas, en lugar de ampliar sólo la UI.

No se crea aquí un PBI, epic, sprint ni roadmap nuevo.

## 20. Final Verdict

**CONDITIONAL PASS — PRODUCT DEVELOPMENT CAN START WITH CONDITIONS**

| Área | Veredicto |
|---|---|
| Baseline técnica | `main` / `c8628fb42226aa7a4f0d010ec8ef3d9d70a01823` |
| Working tree inicial | Limpio y sincronizado |
| Infraestructura | Preview Dokploy/OCI/PostgreSQL disponible |
| Aplicación | Foundation ejecutable, sin workflow de negocio |
| Frontend | Design System/Application Shell V1 integrado en `main`; API ausente |
| Backend | Health + DB runtime; sin endpoints de producto |
| PostgreSQL | Foundation tenant/branch activa; sin esquema funcional |
| CI | **PASS** autoritativo en `main`; run `32217905296` |
| Preview | UI y health disponibles; acciones de negocio no funcionales |
| Readiness | PBI-030 integrado y `In review`; Technical DoD e independent review pasan, con matriz AT parcial y Owner Acceptance/Preview deployment pendientes. PBI-024 requiere reconciliación antes de slices dependientes de contexto |

La foundation no requiere otra etapa amplia de infraestructura. El gate técnico
está restaurado; PBI-030 debe completar revisión sin confundir integración con
`Done`, Owner Acceptance o deploy. El linaje pendiente de PBI-024 sigue aplicando
al siguiente slice que requiera contexto confiable.
