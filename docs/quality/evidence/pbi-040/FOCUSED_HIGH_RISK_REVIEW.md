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
