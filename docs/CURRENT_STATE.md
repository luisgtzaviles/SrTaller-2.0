# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** snapshot de runtime provenance y reconciliación visual PBI-039
  dentro de PBI-040.
- **Baseline Git integrada observada:** `main` y `origin/main` en
  `40684d7554cdf02551f941e5e3f0beabbe563125`.
- **CI autoritativa exacta de `main`:** run
  [`34623060504`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34623060504),
  `SUCCESS`; run-1, run-2 y comparison verdes.
- **PBI actual:** `PBI-040` — Owner Review; no `Done` ni Owner Accepted.
- **WIP:** `1/1`.
- **Preview:** desplegado desde el merge exacto `0d1c576…`, saludable y
  validado con un flujo autenticado New Repair create/detail/reload/worklist.
- **Production:** no desplegada ni autorizada.
- **Regla:** PBI-040 detuvo trabajo de producto, reconcilió Preview/local y
  vuelve a Owner Review sólo con provenance material; aceptación sigue
  pendiente; merge, deploy,
  Production y release no están autorizados.

## Resumen ejecutivo

PBI-040 materializó el primer slice vertical de Catalog/Pricing: identidad
Tenant-wide, precio base Tenant-wide, override Branch con herencia, costo de
referencia protegido, moneda Tenant, alta/edición individual y búsqueda rápida
por nombre/SKU/barcode en `Listas > Lista de precios`. El candidato funcional
está listo para una nueva revisión Owner, no está aceptado ni integrado.

La revisión humana inicial pidió reconciliar operación rápida con gobierno
central. La iteración `c97c05d` incorporó Category/Brand como comboboxes
escribibles con aplicabilidad por Tipo, creación explícita Por revisar y
reconciliación en `Configuración > Catálogos > Lista de precios`. También separó
SKU y código de barras internos automáticos server-side. Cambiar Tipo limpia e
informa selecciones incompatibles; costo y pricing mantienen sus fronteras.

La iteración Owner más reciente conserva en `/listas/precios` la cascada
navegable `Buscar | Tipo | Categoría | Marca`: Tipo limita categorías y
Tipo + Categoría limita marcas a compatibilidades comerciales conocidas de
artículos activos vendibles. Los cambios preservan sólo filtros compatibles;
la búsqueda continúa server-side, Tenant/Branch-scoped y sin entregar costo
sin capability. Insumo permanece fuera de la oferta comercial.

La misma iteración simplifica el contrato de identidad comercial: sólo SKU y
Código de barras internos. Ambos se generan server-side si se dejan vacíos;
los valores explícitos se normalizan, preservan y permanecen únicos por Tenant.
Code 128 es una representación futura del código de barras, no una tercera
identidad. La UI y API de identificadores externos quedan fuera del slice.

La iteración Owner anterior convergió `Configuración > Catálogos > Reparaciones`
y `Lista de precios` sobre las mismas primitives de navegación, lifecycle,
contadores, acciones y estados visuales. La investigación del catálogo Repairs
vacío en local confirmó una omisión del seed: las tablas autoritativas no tenían
filas, aunque las reparaciones sintéticas conservaban snapshots de marca/modelo.
No fue una regresión de PBI-040, autorización, scope, query o migración. El seed
gobernado define 38 registros Tenant-scoped; New Repair y Configuración obtienen
los mismos IDs desde el mismo repositorio Repairs. Las Repairs históricas
locales conservan sólo snapshots y cero vínculos canónicos: no se enlazaron por
nombre. La UI ahora llama **Uso canónico** al contador exacto.

La auditoría de preservación probó que la rama nació de `40684d7554…`, contiene
los merges #42/#43/#44/#45 y no está detrás de `origin/main`. Worklist, New
Repair, Repair Detail, CSS, API/read model, controller, repository y contratos
aceptados conservan los blobs exactos del baseline. Las diferencias restantes
se clasificaron sólo A (integración necesaria), B (refactor visual neutro) o C
(tests/fixtures), con D/E en cero. `verify:full` sobre `453eeb0` terminó 13/13
PASS y Stage 0 verificó ancestry más 16 superficies protegidas.

La auditoría runtime posterior identificó el Preview desplegado mediante
checkout, imagen y assets: el SHA exacto es `0d1c5760ce962d17a8292b841f5de43a8cb453a7`
y un rebuild limpio produjo HTML/JS/CSS byte-identical. El proceso Vite local
era anterior al ciclo PBI-039 y no publicaba SHA, mientras el backend había sido
reconstruido después. Con el mismo read model controlado, ambos runtimes
mostraron la misma estructura de Repair Detail; la divergencia visible provenía
de densidad de datos distinta, no de una pérdida del componente. El launcher
local ahora exige igualdad entre `git HEAD/status`, manifest frontend y headers
backend. El próximo build OCI autorizado deberá grabar la misma revisión en
label, frontend y backend; Preview no fue redesplegado.

PBI-039 entregó Customer Minimum, New Repair Classic 2.0, Personal Form Mode,
Guided V2, política de campos por Branch, catálogos administrativos y las
superficies aceptadas de Repair Detail. El Functional Slice fue aceptado por
Owner; Formal UI Verification, Hardening, Authoritative Full Verification,
CI / PR Readiness, CI autoritativa y revisión independiente terminaron `PASS`.

El cambio principal se integró mediante PR
[#42](https://github.com/luisgtzaviles/SrTaller-2.0/pull/42), merge
`6c04e57c8a5d3bf8600cd4a2a3a191958aa0f0c2`, y recibió CI exacta de `main`
[`34604591354`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34604591354)
verde. La revisión independiente había encontrado una omisión HIGH de
`canonicalDeviceTypeId` en la huella idempotente y una contradicción MEDIUM en
documentación viva; ambos findings se remediaron y reverificaron antes del
merge.

La validación post-deploy de Preview descubrió dos defectos reales de
integración, ya cerrados sin reabrir decisiones de producto:

1. PR [#43](https://github.com/luisgtzaviles/SrTaller-2.0/pull/43), merge
   `5ccc525a09d29fd6dcabbbfaabff9b811677c985`, corrigió el cache/ETag del
   entrypoint SPA. CI exacta de `main` `34614530586` terminó verde.
2. PR [#44](https://github.com/luisgtzaviles/SrTaller-2.0/pull/44), merge
   `0d1c5760ce962d17a8292b841f5de43a8cb453a7`, recompuso Repairs sobre la
   conexión compartida gobernada para que el runtime OCI de Preview use los
   repositorios persistentes. CI exacta de `main` `34619271236` terminó verde.

PR #45 integró el cierre documental como `40684d7554…`; CI exacta de `main`
`34623060504` terminó SUCCESS. PBI-039 y SPRINT-02 están cerrados.

El único warning de build observado es el chunk Vite mayor a 500 kB. No se
redujo cobertura, no se ocultaron skips materiales y no se inició PBI-041,
PBI-042, Caja, Inventory, Repair Concepts ni otro downstream.

## Checkpoint funcional PBI-040

| Área | Evidencia vigente |
|---|---|
| Branch de trabajo | `feature/pbi-040-catalog-pricing-core` desde `40684d7554…` |
| Dominio/persistencia | Catalog Tenant-wide, revisiones append-only, constraints e índices Tenant-aware |
| Pricing | Base Tenant + override Branch revocable; moneda desde Tenancy |
| Seguridad de costo | omisión server-side sin capability; preferencia personal default oculta |
| UI | operación en `/listas/precios`; gobierno en `/configuracion/catalogos?module=price-list` |
| Cascada | Buscar + Tipo + Category + Brand navegables; Category un Tipo; Brand uno o varios; pares comerciales conocidos; reset determinista |
| Identificadores | SKU y código de barras internos automáticos server-side; Code 128 es sólo representación futura |
| Integridad Repairs local | 38 definiciones sintéticas Tenant-wide; Repairs legacy sin canonical IDs; sin matching por texto |
| UI de Catálogos | Repairs y Lista de precios comparten tabs, lifecycle, counters, acciones y estados |
| PostgreSQL | 56 migraciones; aislamiento/aplicabilidad/reconciliación/concurrencia PASS; cero skips materiales |
| Rendimiento | 10,000 items; p95 más reciente 6.98 ms contra presupuesto 750 ms |
| HTTP local | sesión Owner/Station, fixtures por API, costo protegido y override Branch PASS |
| Full Verification | runtime provenance 13/13 stages PASS; 828 tests base; PBI-039 2/2 y PostgreSQL material sin skips críticos |
| Formal UI real | Chrome local autenticado, con dos ventanas lado a lado de Catálogos Repairs/Lista de precios; Owner Review pendiente |
| Baseline guard | ancestry/merge-base/SHA + 16 blobs; genealogía material `0d1c576…` → `40684d7…` |
| Runtime provenance | manifest frontend + headers backend + launcher fail-closed; SHA exacto consultable con `verify:runtime-provenance` |
| Estado de entrega | Owner Review; sin push, PR, CI de branch, merge, deploy o release |

## Evidencia de cierre PBI-039

| Área | Evidencia vigente |
|---|---|
| Functional Slice | Frozen — Owner Accepted |
| Formal UI Verification | PASS |
| Hardening | PASS |
| Full Verification del candidato principal | PASS; campañas y fingerprints conservados en el expediente PBI |
| Revisión independiente | PASS; registrada como comentario formal por restricción de autoaprobación GitHub |
| Integración principal | PR #42 -> `6c04e57…` |
| Cache/ETag Preview | PR #43 -> `5ccc525…`; exact-main CI `34614530586` PASS |
| Repairs shared runtime | PR #44 -> `0d1c576…`; exact-main CI `34619271236` PASS |
| Full Verification hotfix runtime | `local-full-verification-20260911154146-5ccc525a09d2`; 12/12 PASS; fingerprint `10fb843932175f6dc0d7c75ce5e3b08404d69858b016d407cb6480ad6cf3f4c4` |
| PostgreSQL material | PBI-023 17/17 y PBI-039 2/2, cero skips materiales |
| Preview endpoints | root 200 con `Cache-Control: no-store`; `/livez` 200; `/readyz` 200; API desconocida 404 |
| Preview UI | sesión Luis/Station reconocida; create/detail/reload/worklist PASS con `SR-2026-1000` y datos sintéticos |
| Production | No desplegada; no autorizada |

## Capacidades integradas relevantes

- Trusted Station Context, Users, Roles, capabilities, PIN y Operational
  Session con autorización contextual server-side.
- Customer mínimo y New Repair persistentes, Tenant/Branch scoped, con create
  idempotente y transaccional.
- New Repair Classic, Personal Form Mode y Guided V2 comparten dominio y
  comando; Device Access no persiste secretos.
- Catálogos de Device Types, Risks, Brands, Models y Problem Categories con
  reconciliación no bloqueante donde corresponde.
- Repair Worklist/Detail, Operational Header, Recepción, Historial y superficies
  read-only de Conceptos/Evidencias según el alcance aceptado.
- Auditoría y timeline atómicos para los writes cubiertos.

## Límites y deuda conocida

- Basic Operational Evidence con mutación, venta personalizada, Caja,
  venta personalizada, Caja, Anticipo, Abonos, Liquidación, Diagnosis avanzada,
  analytics/AI y promoción de catálogos siguen diferidos y no bloquearon
  PBI-039.
- Los secretos de acceso de dispositivos no se persisten; su almacenamiento
  seguro requiere arquitectura y autorización separadas.
- El warning Vite de tamaño de chunk queda visible como deuda no bloqueante.
- Preview contiene datos sintéticos de validación; no es Production.
- El repositorio público observado continúa sin branch protection/ruleset;
  autorización humana y evidencia siguen siendo gates obligatorios.

## Roadmap y WIP

| Elemento | Estado vigente |
|---|---|
| Sprint activo | SPRINT-03 — Price List Foundation; PBI-040 en Owner Review |
| Current PBI | `PBI-040` — Owner iteration / Owner Review |
| WIP | `1/1` |
| Next candidate | ninguno seleccionado; PBI-041 permanece Planned |
| G6 Customer mínimo | PASS |
| G7 New Repair / Intake | PASS |
| G9 Pricing | PBI-040 runtime provenance PASS; ready for Owner Review; not accepted |
| Preview | Desplegado y validado en `0d1c576…` |
| Production / release | NO / NO |

## Próxima acción

Ejecutar de nuevo Owner Review de PBI-040 en `/listas/precios` y en el módulo
Lista de precios de Configuración > Catálogos. Según el resultado,
registrar Owner Acceptance o remediar feedback sin iniciar PBI-041. PR, merge,
Production, release y deploy conservan autorización independiente.
