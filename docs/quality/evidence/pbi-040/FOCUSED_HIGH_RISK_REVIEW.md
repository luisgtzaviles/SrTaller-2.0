# PBI-040 — Focused High-Risk Self-Review

## Alcance

Revisión del candidato funcional en las superficies de mayor riesgo: aislamiento
Tenant/Branch, autorización de costo, administración Tenant-wide, concurrencia,
historia de precios, transporte web y ownership entre módulos.

## Resultado

- **Aislamiento:** PASS en constraints/repository con dos Tenants y dos
  Branches; las referencias ajenas fallan sin revelar datos.
- **Costo:** PASS; omisión server-side sin capability y solicitud UI sólo con
  capability más preferencia. No se usa CSS como frontera de autorización.
- **Administración:** PASS; el executor Tenant-wide rechaza autoridad
  Branch-restricted y conserva ambos guards al commit.
- **Concurrencia/idempotencia:** PASS; versión obsoleta y colisiones de
  identificador no sobrescriben ni fusionan artículos.
- **Historia:** PASS; base, override y costo usan revisiones append-only.
- **Ownership:** PASS; los contratos expresan capacidades futuras sin tablas ni
  writes de Inventory, Procurement, Repairs, Payments o Cash.

## Findings y remediaciones

1. **HIGH — suites PostgreSQL compuestas no aislaban objetos de Catalog.** Se
   extendió la limpieza y se preservaron fixtures/migraciones históricas. Suite
   compuesta posterior: PASS, cero skips.
2. **HIGH — GET de detalle clasificado como `state-change`.** La alta y la
   búsqueda funcionaban, pero el reload del diálogo administrativo recibía
   `403` porque un GET no porta CSRF. Se introdujo requisito
   `catalog.manage/read`; las mutaciones conservan `state-change`, CSRF y guards.
   Regresión focalizada y recorrido HTTP posterior: PASS.
3. **HIGH — backfill sin semántica de aplicabilidad.** Un backfill universal
   habría preservado combinaciones como Pantallas/Servicio. Se reemplazó por
   inferencia desde el Tipo de los artículos existentes; sólo referencias sin
   uso, donde no existe evidencia, conservan compatibilidad amplia. Cada item
   previo queda cubierto y todo valor nuevo exige aplicabilidad explícita.
4. **GATE — registro de ownership incompleto.** La primera campaña de iteración
   detectó que la lectura de `catalog_items` del backfill no figuraba en su
   registro DEC-005. Se agregó la tabla exacta a la migración Catalog-owned;
   arquitectura y 36 mutaciones controladas posteriores PASS.

## Pendiente independiente

Esta es auto-revisión de ingeniería, no sustituye la revisión independiente ni
la aceptación Owner. Ambas conservan su gate posterior y no se infieren de las
pruebas verdes.

## Final closure review — 2026-09-13

A separate closure pass re-read the frozen candidate from its public HTTP
boundary through service validation, tenant-wide/contextual authorization,
repository transactions, constraints and evidence contracts. It also reviewed
the complete `origin/main...HEAD` inventory for scope drift.

- Controller DTOs remain strict server-side allowlists and transport only
  cookie/origin/host/fetch-site/content-type/CSRF evidence.
- Reads and writes retain distinct fixed capabilities. Cost is omitted unless
  the server authorizes `catalog.reference_cost.read`; the preference cannot
  grant that capability.
- Tenant-wide identity/reference/base-price/cost mutations reject Branch-only
  authority, while Branch override remains contextual to the requesting
  Branch.
- Every mutation revalidates the complete authorization guard set inside the
  transaction before the effect, applies optimistic versions and persists
  idempotent command/audit evidence.
- Identifier allocation and explicit identifier writes remain Tenant-scoped
  and constraint-backed. Canonical merge locks identities/resources, rejects
  incompatible or foreign references and leaves append-only evidence.
- No Product code, migration, endpoint, job or table for PBI-041 was present;
  its files are readiness documentation only.

**Final findings:** no open Critical, High or Medium finding. The accepted Vite
main-chunk size warning remains visible as non-blocking delivery debt.

This closure pass is independent in time and purpose from implementation and
the earlier engineering self-review. It does not represent a human or external
reviewer; its material backstop is the authoritative full verification and the
exact-head CI comparison gate.
