# PBI-040 — Implementation Evidence

## Checkpoint y autoridad

- **Checkpoint:** funcional listo para `Owner Review`; no equivale a `Done`.
- **Branch:** `feature/pbi-040-catalog-pricing-core`.
- **Baseline:** `40684d7554cdf02551f941e5e3f0beabbe563125` con CI de
  `main` `34623060504` SUCCESS.
- **Candidato de código probado:** `4f0f083cabecdb632c84232101b1f276e86cf6ac`.
- **No autorizado/no realizado:** push, PR, merge, deploy, release o cambio de
  infraestructura.

## Resultado funcional

- `CatalogItem`, categorías, marcas e identificadores son Tenant-wide.
- Precio base Tenant-wide y override opcional de la Branch operativa conservan
  revisiones append-only; revocar el override restaura la herencia.
- Refacción, Producto y Servicio son oferta comercial. Insumo conserva identidad
  de catálogo, pero no aparece en Lista de precios.
- Moneda proviene de `Tenant.operatingCurrency`; Avicell recibe `MXN` por
  backfill explícito y no existe default estructural de moneda.
- Costo de referencia es opcional y queda omitido en servidor salvo que la
  sesión tenga `catalog.reference_cost.read`. La preferencia personal sólo
  decide si el cliente solicita mostrarlo.
- Alta/edición individual, lifecycle, navegación `Listas > Lista de precios`,
  búsqueda por tokens de nombre y coincidencia exacta de SKU/barcode, filtros y
  precio efectivo quedaron disponibles sin construir importación ni Files.

## Seguridad, persistencia y fronteras

- Ocho capabilities gobernadas separan consulta, identidad, precio base,
  override Branch, lectura/gestión de costo y la autoridad futura de importación.
- Administración Tenant-wide rechaza asignaciones sólo-Branch y combina los
  commit guards contextual y Tenant-wide antes del commit.
- Writes usan allowlists estrictas, CSRF, idempotencia, `expectedVersion`, actor,
  correlation y auditoría. Constraints Tenant-aware protegen referencias y la
  unicidad histórica de SKU/barcode/GTIN.
- Cuatro migraciones aditivas materializan moneda operativa, capabilities,
  preferencia personal y Catalog/Pricing. El rollback de aplicación conserva
  datos; no existe migración destructiva en el slice.
- DEC-005/policy registra la nueva frontera. Catalog/Pricing no adquiere
  ownership de Inventory, Procurement, Repair, Payments, Cash, Files, pedidos o
  solicitudes.

## Evidencia automatizada

- Build gobernado y pruebas focalizadas posteriores a la remediación del GET de
  detalle: `13/13 PASS`, cero skips.
- Base suite: `812` tests; `792 PASS`, `20` skips PostgreSQL gobernados, cero
  failures. Los skips se ejecutan en stages materiales separados.
- PostgreSQL PBI-040: `55` migraciones, cero skips; aislamiento de dos Tenants,
  dos Branches, constraints, concurrencia, revisiones, tipos y búsqueda.
- Benchmark local con `10,000` items: p95 observado entre `6.89 ms` y
  `8.89 ms`, bajo el presupuesto fijado de `750 ms`.
- Suite PostgreSQL compuesta aislada: `8/8` files/tests PASS, cero skips.
- Campaña `verify:full` previa a la remediación final: `13/13` stages PASS,
  incluida UI smoke, runtime, schema/migrations y PBI-040 PostgreSQL.
- La campaña final se ejecuta sobre el HEAD documental reconciliado y su
  resultado se entrega en el handoff de Owner Review.

## Prueba funcional HTTP local

Con PostgreSQL 18.4, 55 migraciones, datos sintéticos y sesión operacional real:

1. alta de categoría, marca y Refacción con precio, costo, SKU y barcode;
2. búsqueda inequívoca por nombre, SKU y barcode;
3. ausencia de costo en la respuesta normal y proyección con capability;
4. aplicación de override Branch `1499.00`, seguida de revocación y retorno al
   precio base `1399.00` con fuente `TENANT_BASE`;
5. GET de detalle/reload persistente;
6. cambio y restauración de `priceListShowReferenceCost`.

El primer recorrido detectó un `403` al recargar detalle: el GET reutilizaba una
clasificación de transporte `state-change`. Se corrigió a lectura protegida por
`catalog.manage`, se agregó una regresión y el recorrido completo terminó
`PASS`. No se relajó la capability Tenant-wide ni ningún commit guard.

## UI formal y gates posteriores

La UI compila y sus contratos de navegación, autorización, estados, transporte
y preferencia pasan; el smoke automatizado también está verde. La superficie de
browser nativo/Chrome no estuvo disponible en esta sesión (`Sky Computer Use
native pipe startup failed`), por lo que no se inventan screenshots ni se marca
la matriz visual real como ejecutada.

Owner Review debe recorrer `/listas/precios` en Chrome real, al menos en Light y
Dark/responsive, y confirmar copy/jerarquía/operabilidad. Después permanecen
separados: aceptación Owner, hardening/revisión independiente, PR/CI, merge,
exact-main CI y cualquier Preview/deploy autorizado.

## Exclusiones verificadas

- PBI-041 no fue iniciado: no hay bulk import ni Supplier reconciliation.
- PBI-042 no fue iniciado: no hay imagen, Files o R2.
- No se construyeron Inventory, Caja, Repair Concepts, compras, pedidos,
  solicitudes, reportes, impuestos, descuentos o multi-currency/FX.
