# PBI-040 — Threat Model

## Estado

- **Resultado:** PASS for Definition of Ready — controls specified, not yet
  implemented or verified.
- **Fecha:** 2026-09-11.
- **Alcance:** Catalog/Pricing core, individual management, Branch effective
  price, reference-cost visibility and fast lookup.
- **Exclusión:** bulk files/parsing/publish belong to PBI-041 and require its
  own threat-model refinement.

## Activos y trust boundaries

| Activo | Riesgo principal | Frontera |
|---|---|---|
| CatalogItem/identifiers | lectura o mutación cross-tenant | Tenant confiable vs input cliente |
| base/override revisions | precio incorrecto u overwrite | Tenant admin vs Branch operation |
| Reference Cost | fuga de dato comercial interno | capability server-side vs UI preference |
| Tenant currency | importes mal interpretados | configuración Tenancy vs Catalog |
| history/audit | borrado o atribución falsa | write transaccional vs logs/evidence |
| search | enumeración y extracción masiva | query operativa vs otro Tenant |
| user preference | confundir presentación con permiso | Users vs Access/Catalog |

La estación/sesión aporta Tenant/Branch para operación. Administración
tenant-wide usa un contexto separado y explícito. IDs, Branch, capability,
currency, source y sensitivity enviados por cliente nunca son autoridad.

## Amenazas y controles requeridos

| ID | Amenaza | Impacto | Controles de diseño | Prueba mínima |
|---|---|---|---|---|
| PL-T01 | IDOR lee/modifica item de otro Tenant | Critical | scope en use case/repository/constraint; 404 no revelador | dos Tenants, mismos códigos, IDs cruzados |
| PL-T02 | Branch libre obtiene/aplica otro override | Critical | Branch derivada de station o admin scope validado; pertenencia mismo Tenant | branch spoof, cross-tenant Branch, admin denied |
| PL-T03 | lector de lista recibe costo | High | response shape sin campo; capability `reference_cost.read`; include flag revalidado | contract y browser/network negativos |
| PL-T04 | toggle personal concede permiso | High | Users sólo guarda boolean; Access decide; Catalog omite sin grant | activar pref sin capability sigue sin dato |
| PL-T05 | carrera duplica SKU/barcode | High | normalización única, constraint Tenant+scheme, transacción | dos creates simultáneos, un ganador |
| PL-T06 | last-write-wins pierde precio | High | expectedVersion y revisions append-only | dos editors; stale 409, historia intacta |
| PL-T07 | override huérfano/cruzado | High | FKs/validación Tenant-aware y lifecycle | Branch/item de distintos Tenants rechazados |
| PL-T08 | cambio de moneda reinterpreta historia | High | moneda en cada revision; cambio bloqueado con precios publicados | backfill, read old revision, denied change |
| PL-T09 | búsqueda enumera catálogo/costo | High | capability, Tenant predicates, page limit, rate/telemetry existente, error uniforme | exact SKU ajeno, wildcard/long query, pagination |
| PL-T10 | normalización fusiona OLED/LCD | High | nombre no es identidad; exact identifier only for identity | nombres parecidos siguen items distintos |
| PL-T11 | identifier reutilizado suplanta historia | High | inactive/tombstone; no hard delete/reuse | inactivar y crear mismo identifier falla |
| PL-T12 | UI oculta pero DOM/API conserva costo | High | no request when hidden; endpoint omits unless authorized+requested | inspección response/DOM/cache |
| PL-T13 | cache mezcla Tenant/Branch/costo | Critical | no shared response cache inicial; keys completas si se introduce después | alternar sesiones/Branches, authorized/denied |
| PL-T14 | audit diverge del cambio | High | outcome/actor/correlation; atomicity conforme owner audit contract | fallo audit obligatorio revierte si policy exige |
| PL-T15 | input/log injection o datos excesivos | Medium | allowlist/length/encoding; structured logs sin costo/título completo | payload largo/control chars/error logs |
| PL-T16 | módulo accede tablas ajenas | High | public contracts, DEC-005/049 checker y review | architecture check + import/persistence matrix |
| PL-T17 | monto decimal pierde precisión | High | minor units/decimal parser; moneda ISO; no float | límites, 0, máximos, decimales inválidos |
| PL-T18 | CSRF/replay repite write | High | CSRF/origin vigente + clientRequestId/outcome | replay exacto/incompatible y cross-session |
| PL-T19 | carrera o normalización crea canon/pending equivalente | High | identidad Tenant-scoped serializada, uniques, canonical-first y conflicto tipado | Category/Brand exactas, dos writers, Tipos y Tenants distintos |

## Abuso por actor

- Un empleado con `price_list.read` puede buscar, pero no listar costos ni
  escribir.
- Un manager de item no obtiene automáticamente price/cost/import capabilities.
- Un price manager no cambia Branch ajena a su alcance administrativo.
- Un usuario con acceso al navegador/DOM no recupera costo si el servidor no lo
  entregó.
- Un operador de plataforma no obtiene acceso rutinario cross-tenant por su rol
  global; usa contratos y evidencia de intervención separados.

## Clasificación ADR-013

Writes individuales y publicación futura son nivel 1 bajo capabilities
específicas, porque crean revisiones reversibles y no reescriben snapshots.
Publicación masiva pertenece a PBI-041 y se reevalúa ante thresholds,
automatización externa o irreversibilidad. Cualquier nueva acción sensible sin
política queda nivel 4/fail-closed.

## Criterios de salida de seguridad para implementación

- cero Blocker/Critical/High abierto en focused review;
- pruebas negativas de T01–T18 aplicables;
- migration/constraint evidence con Tenant/Branch explícitos;
- response/network proof de costo omitido;
- architecture checker y persistence ownership PASS;
- ninguna excepción de seguridad implícita; cualquier waiver sigue DEC-063.

## Riesgo residual previo a implementación

No hay riesgo aceptado por anticipado. Los controles están especificados pero
sin evidencia material; PBI-040 sólo podrá cerrar después de probarlos. Ready
no equivale a Security PASS de la implementación.
