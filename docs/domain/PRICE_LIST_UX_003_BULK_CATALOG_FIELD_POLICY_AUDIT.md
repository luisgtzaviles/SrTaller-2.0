# UX-003 — Bulk Catalog Field Policy Audit

> Follow-up boundary: [UX-004 Catalog Operational Authorization Audit](PRICE_LIST_UX_004_CATALOG_OPERATIONAL_AUTHORIZATION_AUDIT.md)
> records the separate Role → capability decision surface. It does not change
> the effective-field policy, its cost redaction or Composer behavior.

## Estado del documento

- **Estado:** UX-003.1 authority, UX-003.2 configuration, UX-003.3 Composer consumption y UX-003.4 required-effective enforcement materialized locally for Owner Review.
- **Alcance:** PBI-041, policy Tenant-wide consumida por Bulk Catalog Composer para presentación y para impedir Apply de valores efectivos incompletos. No amplia Catalog manual ni crea policy por Branch/Supplier.
- **Método:** trazabilidad estática de Composer, API, dominio, autorización, persistencia y la configuración existente de Nueva reparación; preflight local read-only.
- **Preflight:** rama feature/pbi-041-bulk-catalog-composer, HEAD bb9595a30f12587347c46e77c560d762d6620b6d, localhost/backend health 200; PostgreSQL local con 72 migraciones y TimeZone = Etc/UTC.
- **Mutaciones:** UX-003.4 utilizó una versión QA local no aplicada para comprobar Analyze/Reanalyze; no hubo mutación de Catalog, Resolution ni memory antes de Apply. La policy final se restauró a `v8`: Descripción Opcional, Marca Esencial y Costo Esencial. El artefacto Owner preexistente apps/dev-preview-web/src/.DS_Store permanece sin seguimiento.
- **Próxima revisión:** Owner Review de UX-003.4; no hay snapshot de policy y no se autoriza integración, deploy ni ampliación Catalog-wide.

## Hallazgo ejecutivo

La carga masiva tiene dos contratos distintos que hoy aparecen mezclados en la UI:

    Contrato de fila por modo       FULL: Tipo + Título + Categoría + Precio
                                    COMPACT: Código proveedor | SKU | Barcode

    Calidad de Catalog objetivo     datos que el Tenant requiere de un CatalogItem

FULL y COMPACT no son una política de calidad del Tenant: son modos de captura con garantías distintas. FULL puede crear un item nuevo; COMPACT prohíbe NEW y necesita un identificador de entrada. Convertir «Marca obligatoria» en «Marca debe llegar en cada fila» rompería actualizaciones COMPACT de artículos ya identificados.

La dirección segura es **valor efectivo requerido**: la policy comprueba el valor que tendría el Catalog tras resolución segura, nunca historia de proveedor inferida ni un default silencioso. La policy debe ser **Tenant-wide**: CatalogItems, referencias, Sources, Versions, Listings, identificadores, precios y costos ya son Tenant-scoped; branchId atribuye la operación y el único override actual de Branch es precio. Una calidad como «Avicell exige Marca» no debe variar por estación, usuario o SupplierSource.

Modelo recomendado:

    Catalog field policy (Tenant)      calidad: required / non-required
    Composer presentation (Tenant)     Esenciales: required ∪ selected essential

Esto evita que un layout vuelva opcional una invariante de calidad. El enforcement inicial debe ser Composer-only; obligar también al alta/edición manual de Catalog es expansión Catalog-wide fuera de PBI-041 hasta otra autorización.

## Referencia: Configuración → Nueva reparación → Campos de recepción

| Aspecto | Hallazgo material | Aplicación a UX-003 |
| --- | --- | --- |
| Registry | Registry de producto tipado con estados permitidos, fijos/configurables/condicionales y defaults. | Reutilizar registry validado; no aceptar nombres/estados arbitrarios del cliente. |
| Scope | Política efectiva por tenant_id + branch_id, con fallback de sistema sin row. | No copiar scope: Catalog es Tenant-wide. |
| Versioning | policyVersion, expected-version, head actual e historial append-only. | Reutilizar optimistic concurrency y audit. |
| UI | Estado dirty, Guardar, Descartar, Restaurar, badge FIJO, fuente/default y versión. | Reutilizar lenguaje/semántica, no necesariamente componentes. |
| Enforcement | Backend valida el policy en la creación de Repair; UI sólo presenta. | Validación Catalog debe ser server-side. |
| Permissions | repairs.configuration.read/manage explícitas. | Recomendada capability Catalog de configuración explícita. |

Nueva reparación usa además hidden y conditional; no deben copiarse en V1 de Composer sin definir cómo afectarían import, export y API.

## Inventario autoritativo actual

Los siguientes son todos los campos de FULL_COLUMNS; COMPACT muestra su subconjunto. La entrada de Título conserva texto observado de proveedor como supplierObservedTitle y una propuesta normalizada para título canónico; no son dos columnas Owner independientes hoy.

| Campo | Tipo/destino actual | FULL | COMPACT | Identidad sensible | Tenant puede exigir valor efectivo | Esencial/optional | Esencial actual | Validación/persistencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tipo | enum; CatalogItem.kind | requerido | no | sí | no V1, ya fijo FULL | fijo/esencial | no | UI + parseBulkRows; Listing/Catalog |
| Título | texto observado + propuesta canónica | requerido | no | sí | no V1, ya fijo FULL | fijo/esencial | sí | UI + parseBulkRows; Listing inmutable/Catalog |
| Descripción | texto | opcional | opcional | firma sin código | sí | sí | no | longitud; Listing/Catalog al Apply |
| Categoría | texto → referencia/pending | requerido | no | sí | no V1, ya fijo FULL | fijo/esencial | no | compatibilidad + backend; Listing/Catalog |
| Marca | texto → referencia/pending | opcional | opcional | sí | sí | sí | no | compatibilidad cuando existe; Listing/Catalog |
| Código proveedor | observación Source/Version | opcional | uno de tres | señal, no identidad Catalog | no | sí | no | longitud; Listing/Resolution, nunca SKU/barcode |
| SKU interno | identificador Catalog | opcional | uno de tres | sí, Tenant-unique | no como policy V1 | sí | no | normalización/unique; Listing + Catalog al Apply |
| Código de barras | identificador Catalog | opcional | uno de tres | sí, Tenant-unique | no como policy V1 | sí | no | normalización/unique; Listing + Catalog al Apply |
| Costo referencia | dinero/revisión de costo | opcional | opcional | no | sí, con scope/permisos | sí | sí | money + catalog.reference_cost.*; revisión sólo Apply |
| Precio base | dinero/revisión de precio | requerido | opcional | no | no V1, ya fijo FULL | fijo/esencial FULL | sí | UI + backend; revisión sólo Apply |
| Estado | lifecycle ACTIVE/INACTIVE | N/A | N/A | lifecycle | no | no | no | no importable; sólo operación/Apply controlado |

La vista **Esenciales** actual es Título, Costo, Precio: no representa el contrato FULL, porque Tipo y Categoría quedan fuera pese a ser requeridos. La definición objetivo debe ser:

    ESSENTIALS = domain-fixed-required ∪ tenant-required ∪ tenant-selected-essential
    REQUIRED ⇒ ESSENTIAL

En COMPACT se conserva el preset de actualización; no autoriza crear items incompletos.

## Semántica de valor efectivo

| Caso con Marca REQUIRED | Dirección recomendada |
| --- | --- |
| A. Item conocido, Catalog tiene Apple, llegada COMPACT identificada omite Marca | permitir: la resolución segura conserva Apple; no exigir columna raw. |
| B. Item nuevo FULL sin Marca | bloquear Review/Analyze y mostrar campo/filas agregados. |
| C. Item conocido con Marca canónica vacía, proveedor la omite | bloquear: falta valor efectivo. |
| D. Historia dice Apple, Catalog dice Samsung | Catalog actual y contradicción explícita ganan; la historia no rellena ni corrige. |
| E. 100 celdas vacías | mostrar agregado por campo y ofrecer **Completar datos faltantes**; Owner aplica explícitamente. |

UX-002E.1 permanece correcta: helper explícito, empty-only y efímero. No hay perfil de SupplierSource, sugerencia, provenance ni inferencia durable. La validación recomendada tiene cuatro capas: indicación durante captura; gate autoritativo de Review; validación backend en Draft/Analyze; defensa final en Apply frente a policy stale. El error Owner debe agruparse por campo/filas, no presentarse sólo como INVALID.

## Scope, permisos y configuración

Navegación recomendada:

    Configuración → Catálogos → Lista de precios → Campos de carga masiva

La policy es Tenant-owned y debe usar contexto confiable; frontend no aporta tenantId, branchId ni sourceId como autoridad. Se recomienda una capability nueva catalog.configuration.read/manage, Tenant-wide y server-side, no convertir catalog.manage o catalog.import.prepare en super-permisos.

Para configuración se recomienda un selector único por campo: **Obligatorio | Esencial | Opcional**. Un registry restringe los campos fijos y representa REQUIRED ⇒ ESSENTIAL por construcción. Reutilizar estado dirty, versión, Save/Discard/Restore y auditoría de Nueva reparación.

## Compatibilidad, versiones e historia

Sin configuración persistida, el backend debe devolver defaults de producto que reproduzcan exactamente hoy: FULL requiere Tipo/Título/Categoría/Precio; Marca, Descripción, códigos, SKU, barcode y Costo son opcionales; Esenciales actuales siguen Título/Costo/Precio hasta que Owner apruebe cambio. Persistir sólo override o Restore explícito.

Se recomienda policy Tenant-wide versionada con expected-version y audit append-only. En V1, la policy más reciente gana en Review/Analyze; si cambió durante la operación, backend rechaza y pide reload. No se recomienda snapshot de policy en SupplierCatalogVersion V1: los Listings/decisiones APPLIED ya son históricos y no se reescriben. Un snapshot sólo es necesario si Owner exige que un Draft conserve su policy inicial o que Reanalyze sea determinista bajo la regla antigua; eso requiere contrato y migración separados.

CatalogItems históricos no conformes no deben bloquear guardar una policy ni reescribirse. V1 puede advertir y aplicar la regla sólo a nuevas mutaciones Bulk. Reparación histórica o enforcement sobre alta/edición manual requiere alcance Catalog-wide explícito.

## Owner decisions required

Cada dirección es recomendación, no decisión aceptada.

| ID | Pregunta / evidencia | Opciones y riesgo | Dirección recomendada | Domain | DB | Migration | Independiente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UX3-001 | Scope; Catalog/Sources/Versions Tenant-scoped. | Tenant, Branch, Supplier, User, global; Branch/Supplier fragmentan calidad. | **Tenant**, sin Branch override V1. | YES | YES | YES | YES |
| UX3-002 | Composer-only vs Catalog-wide; alta manual existe aparte. | Composer deja bypass; Catalog-wide amplía PBI; separación C. | **C**: quality Catalog + presentation Composer; enforcement inicial Composer-only. | PARTIAL | YES | YES | NO |
| UX3-003 | REQUIRED raw/effective/hybrid; COMPACT exige identificador, no atributos. | Raw rompe updates; historia no es default. | **Hybrid effective value**: explícito/helper/Catalog seguro, nunca inferido. | YES | YES | LIKELY | NO |
| UX3-004 | Required implies Essential; Esenciales hoy oculta Tipo/Categoría. | Dos checks permiten contradicción. | **Invariant mandatory**, enum único. | YES | YES | LIKELY | YES |
| UX3-005 | Campos configurables; inventario anterior. | Todo mezcla lifecycle/identidad; mínimo acotado. | **Marca, Descripción, Costo** inicialmente; IDs/Estado fuera V1. | YES | YES | LIKELY | NO |
| UX3-006 | Campos fijos; backend FULL exige Tipo/Título/Categoría/Precio. | Hacerlos opcionales debilita contrato. | **Esos cuatro fijos para FULL**; no hace COMPACT imposible. | NO/registry YES | YES | LIKELY | YES |
| UX3-007 | Policy + FULL. | Raw por fila, effective, UI only. | Mantiene mínimos y suma valor efectivo antes de Analyze/Apply. | YES | YES | LIKELY | NO |
| UX3-008 | Policy + COMPACT. | Exigir columnas, bypass, effective. | Validar target resuelto; omisiones aceptables, NEW nunca. | YES | YES | LIKELY | NO |
| UX3-009 | Revision; Nueva reparación tiene version/audit. | Sin versión pierde concurrencia/audit. | **Sí**, Tenant-wide optimistic concurrency/audit. | YES | YES | YES | NO |
| UX3-010 | Draft abierto y cambio Admin. | latest, draft-bound, conflict. | **Latest wins** en Review/Analyze; stale request rechaza/reload. | YES | YES | LIKELY | NO |
| UX3-011 | Reanalyze/historia. | original snapshot/latest/both. | Applied histórico; no-applied usa **latest**. Snapshot sólo con caso explícito. | YES | PARTIAL | snapshot LIKELY | NO |
| UX3-012 | Permisos; imports y catálogo hoy tienen capabilities separadas. | Reusar grants amplios crea super-permiso. | **catalog.configuration.read/manage explícita**, server-side. | YES | YES | YES | NO |
| UX3-013 | Default retrocompatible. | Seed endurece; fallback/no-row. | **Fallback sin row** reproduce actual; persistir sólo override/restore. | YES | PARTIAL | LIKELY | NO |
| UX3-014 | Históricos no conformes; Brand puede ser null. | bloquear, reparar, warn, future-only. | **Guardar + advertir; future Bulk only**, sin cleanup implícito. | YES | optional read | NO V1 | YES |
| UX3-015 | UI; Nueva reparación materializa registry/dirty/version. | dos checks, tres estados, hidden. | **Tres estados** + FIJO; Lista de precios en Configuración. | YES | NO extra | NO extra | YES after model |
| UX3-016 | Persistencia. | blob/table-per-field/settings genérico. | **Tenant head + append-only JSONB versions validated by registry**. | YES | YES | YES | NO |
| UX3-017 | Snapshot en Version. | none/draft/all; aumenta lifecycle. | **No V1**; revalidar current policy; snapshot sólo por determinismo aprobado. | PARTIAL | NO V1 | NO V1 | NO |

## Avicell si Owner acepta la dirección

    REQUIRED / ESSENTIAL: Tipo, Título, Categoría, Marca, Costo, Precio
    OPTIONAL:              Descripción, Código proveedor, SKU, Código de barras

- 2,000 FULL completas: Review inmediato.
- 100 NEW sin Marca: bloqueadas con **Faltan datos obligatorios: Marca · 100 filas**.
- Todas Apple: Owner usa explícitamente **Completar datos faltantes**; Samsung existente se preserva.
- Mixtas: corrección por fila/bloque explícito; no Supplier history/title inference.
- COMPACT identificado sin Marca: pasa sólo si el target seguro ya conserva Marca.

Costo sigue siendo dato sensible y opcional en el contrato vigente. UX3-005 debe confirmar si Avicell lo exige sólo en Bulk, para NEW o para toda mutación futura.

## Resultado

- **Policy owner recomendado:** Tenant.
- **Composer-only o Catalog-wide:** calidad Catalog + presentación Composer; enforcement inicial Composer-only.
- **Required semantics:** valor efectivo híbrido; nunca raw-only ni inferencia.
- **Required ⇒ Essential:** obligatorio.
- **Domain/API/persistence/migration esperados:** sí para una futura implementación; no realizados.
- **DB writes:** 0.
- **Product changes:** none.
- **Remote actions:** none.

**BULK CATALOG FIELD POLICY UNDERSTOOD**
**TENANT DATA-QUALITY BOUNDARY IDENTIFIED**
**CONFIGURATION MODEL READY FOR OWNER DECISION**
## UX-003.1 implementation boundary

La autorización posterior materializó sólo la autoridad de configuración:

- registry cerrado de diez campos, defaults retrocompatibles y la invariante
  `REQUIRED ⇒ ESSENTIAL` mediante el único enum de nivel;
- `catalog_field_policy_heads` Tenant-wide y
  `catalog_field_policy_versions` append-only con actor, estación, sesión,
  capability, correlation y versión previa;
- fallback de producto sin fila tenant, `expectedVersion` para Save/Restore y
  REST interno bajo contexto confiable; el cliente no envía tenant ni branch;
- capabilities separadas `catalog.configuration.read/manage`, compuestas con
  `catalog.reference_cost.read/manage` para no filtrar ni administrar una
  policy que revela Costo sin su permiso sensible.

No se modificó FULL/COMPACT, el grid, Draft/Analyze/Apply, el alta manual de
Catalog ni `SupplierCatalogVersion`. La validación de valores efectivos y las
señales visuales son consumo futuro explícitamente pendiente.

## UX-003.2 — Tenant configuration surface

La iteración posterior consume esa API autoritativa únicamente desde
`Configuración → Lista de precios → Campos de carga masiva`:

- carga el registry y la policy efectiva desde el servidor, muestra versión y
  fuente (`Predeterminada por SR Taller` o configuración personalizada) y no
  replica reglas de campo en el cliente;
- expone los mínimos de dominio como campos `FIJO` inmutables y los tres
  campos configurables actuales —Marca, Descripción y Costo de referencia— con
  un único selector de nivel `Obligatorio` / `Esencial` / `Opcional`;
- conserva edición local, dirty state, descarte y Save explícito con
  `expectedVersion`; un `409` requiere recargar, nunca sobrescribe;
- usa el restore versionado/auditado, distinguido de descartar cambios, sin
  borrar historia;
- compone la visibilidad de ruta/navegación con
  `catalog.configuration.read` y `catalog.reference_cost.read`; gestión exige
  las dos capabilities `*.manage`, por lo que no se filtra ni administra
  metadata sensible de costo sin esa autoridad.

La superficie no consume la policy en el Composer: no modifica FULL/COMPACT,
Esenciales, Review, Analyze, Apply, `SupplierCatalogVersion` ni `CatalogItem`.
El acceso local de prueba requiere que el rol administrador tenga asignadas las
nuevas capabilities, igual que cualquier otro permiso del catálogo.

Proof local posterior: Save → reload preservó la versión autoritativa; un
cambio no guardado volvió al estado persistido con Descartar; Restore creó una
nueva versión append-only con los defaults de producto. La policy permanece
sin consumidor en Composer.

El proof material Chrome a `768 px` y `640 px` confirmó título, fuente/versión,
leyenda de estados, filas fijas y configurables, Costo de referencia autorizado,
dirty/discard, controles nativos y Tab/Shift+Tab en ambos temas. Se corrigió
únicamente la presentación responsive de la tarjeta de estado para separar
visualmente fuente y contexto; no hubo overflow horizontal, clipping ni
superposición y no se emitió ninguna escritura durante esa comprobación.

## UX-003.3 — Policy-driven Essentials

La implementación consume `GET /api/catalog/bulk/field-policy`, una proyección
operacional distinta de la ruta de Configuración. El backend deriva Tenant del
contexto confiable, exige `catalog.import.prepare` y consulta
`catalog.reference_cost.read` de forma independiente. Si esa segunda
autorización falta, filtra Costo de referencia antes de serializar la respuesta;
ocultar la columna no es la protección primaria.

El frontend no conserva una lista Tenant de Esenciales: adapta las claves del
registry a las columnas existentes y deriva `REQUIRED ∪ ESSENTIAL`, en orden
de registry. `Todas` usa el conjunto completo ya autorizado. Tipo, Título,
Categoría y Precio base siguen visibles y anunciados como obligatorios;
Descripción, Marca y Costo responden al nivel efectivo. No se agregó
enforcement de valores, no se reinterpretaron modos FULL/COMPACT y no se
modificaron Save, Review, Analyze, Apply, CatalogItem ni SupplierCatalogVersion.

El proof local cambió Descripción a Esencial y Marca a Opcional, recargó el
Composer y verificó seis Esenciales con Descripción incluida y Marca excluida;
en Todas ambas aparecieron. La restauración explícita dejó la policy final en
`v6` con Descripción Opcional, Marca Esencial y Costo Esencial. Chrome pasó
768 px y 640 px en ambos temas sin overflow horizontal; Tab y Shift+Tab
conservaron el foco de celda. Los contratos focalizados, typecheck, build,
DEC-005 y PostgreSQL material PBI-041 (74 migraciones) pasaron. Esto es
evidencia local para Owner Review, no aceptación ni integración.

## UX-003.4 — Required effective value enforcement

`REQUIRED` no obliga a repetir una celda en cada observación. Tras resolver
identidad/reconciliación, Analyze valida el resultado efectivo contra los
mínimos de dominio y la policy Tenant vigente. Sólo un valor explícito o un
valor existente preservado de un `CatalogItem` seguro cuenta; no hay inferencia
desde SupplierSource, títulos, memoria ni candidatos ambiguos. La atención se
persiste como `MISSING_REQUIRED_EFFECTIVE_VALUE:<field>`, separada de la
identidad. Duplicados descartados y filas excluidas no participan.

La UI muestra `Faltan datos obligatorios`, cuenta filas/campos por separado y
abre el helper explícito UX-002E.1 sin completar datos automáticamente. La
resolución manual vuelve a evaluar su target y Apply relee policy dentro de la
transacción. Por eso una policy endurecida tras Analyze o una llamada directa
no pueden publicar un Catalog incompleto. El mensaje sobre costo nunca expone
el valor protegido y sus capabilities siguen separadas. `ESSENTIAL` y
`OPTIONAL` no generan bloqueo.

PostgreSQL aislado pasó NEW sin Marca bloqueado, known/COMPACT que conserva
Marca y Apply rechazado tras endurecer Descripción. Chrome verificó el resumen,
el foco a Marca, corrección explícita y reanálisis sin Apply. La policy quedó
restaurada en `v8`: Descripción Opcional, Marca Esencial y Costo Esencial.
Composer pasó 768/640 px, claro/oscuro y teclado sin overflow. Es un checkpoint
local de Owner Review.
