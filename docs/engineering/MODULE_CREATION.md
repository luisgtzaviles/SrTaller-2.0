# Creación y extensión de módulos

## Propósito y autoridad

Esta guía es el mapa operativo mínimo para extender SR Taller sin inventar una
arquitectura paralela. No autoriza un módulo, PBI, schema o capability. La
autoridad permanece en las decisiones y contratos enlazados.

Antes de escribir código, confirmar la Work Unit en
[`ACTIVE_CHECKLIST.md`](../work/ACTIVE_CHECKLIST.md), el alcance de producto y
el ownership conceptual en [`MODULE_MAP.md`](../product/MODULE_MAP.md). La
estructura ejecutable y las dependencias permitidas están en
[`architecture/dec-005-policy.json`](../../architecture/dec-005-policy.json).

## Ruta de descubrimiento

| Pregunta | Leer/inspeccionar | Autoridad efectiva |
|---|---|---|
| ¿Pertenece al producto y a qué owner? | Roadmap/PBI y `docs/product/MODULE_MAP.md` | Alcance Owner + decisión específica vigente. |
| ¿Existe ya el módulo? | `src/modules/` y `architecture/dec-005-policy.json` | Código y policy DEC-005. |
| ¿Qué puede importar? | `dependencies`, `consumers` y `publicSurfaces` en la policy | Checker de arquitectura. |
| ¿Cómo se divide internamente? | [`APPLICATION_ARCHITECTURE.md`](../architecture/APPLICATION_ARCHITECTURE.md) y módulos comparables | Dominio → aplicación → infraestructura/presentación. |
| ¿De dónde sale tenant/sucursal/actor? | [`MULTITENANCY_MODEL.md`](../architecture/MULTITENANCY_MODEL.md), ADR-010–014 y ejecutores de `access` | Contexto confiable server-side. |
| ¿Cómo persiste? | [`DATA_ARCHITECTURE.md`](../architecture/DATA_ARCHITECTURE.md), [DEC-049](../decisions/dec-049-persistence-ownership/DECISION_PROPOSAL.md) y [`MIGRATION_POLICY.md`](../operations/MIGRATION_POLICY.md) | Owner de datos + repositorio explícito + Kysely/pg. |
| ¿Cómo se publican errores? | [DEC-044](../decisions/dec-044-error-strategy/DECISION_PROPOSAL.md) y controladores comparables | Error tipado, sanitizado y con correlación. |
| ¿Qué UI reutiliza? | [`COMPONENT_CATALOG.md`](../design-system/COMPONENT_CATALOG.md) y catálogo interno | Design System V1 + implementación actual. |
| ¿Cómo se verifica? | [DEC-051](../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md), [DEC-063](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md), scripts actuales y esta matriz | Riesgo mayor aplicable; dudas fallan cerrado. |

[`QUALITY_STRATEGY.md`](../quality/QUALITY_STRATEGY.md) y
[`TESTING_STRATEGY.md`](../quality/TESTING_STRATEGY.md) conservan taxonomía
útil, pero su header aún dice `Propuesta`. Para gates actuales prevalecen
DEC-051/DEC-063, [`DEFINITION_OF_DONE.md`](../delivery/DEFINITION_OF_DONE.md),
`package.json` y el workflow vigente.

## Forma física mínima

No crear carpetas vacías. Añadir sólo las capas que el caso necesita:

```text
src/modules/<module>/
  <module>.module.ts          # composición NestJS
  index.ts                    # única superficie pública cross-module
  domain/                     # invariantes y value objects sin framework
  application/
    ports/                    # contratos del owner
    use-cases/                # orquestación y autorización aplicable
  infrastructure/            # adapters Kysely/pg, storage o integraciones
  presentation/              # controllers/mappers de borde
```

Un módulo nuevo también requiere, según corresponda:

1. ownership y dependencias aprobadas;
2. entrada en `allowedModules`, `dependencies`, `publicSurfaces`, `consumers`,
   archivos estructurales y composición de
   `architecture/dec-005-policy.json`;
3. export público mínimo en `index.ts`; nunca deep imports a internals ajenos;
4. wiring en su `@Module` y, sólo si es top-level, en `src/app.module.ts`;
5. tests de arquitectura que demuestren el borde y sus negativos.

No crear raíces globales `base`, `common`, `core`, `helpers` o `utils`. Una
abstracción compartida necesita owner y contrato explícitos.

## Responsabilidades por capa

### Dominio

- Expresa invariantes, estados y value objects del owner.
- No importa NestJS, HTTP, Kysely, `pg`, logger ni records de persistencia.
- No recibe `tenantId`, `branchId`, actor o permisos desde payload como
  autoridad confiable.

### Aplicación

- Orquesta casos de uso y transacciones.
- Declara puertos estrechos por agregado/caso, no un `BaseRepository` genérico.
- Recibe contexto autorizado e inmutable.
- Mantiene los contratos de salida libres de tipos del driver.

### Infraestructura

- Implementa puertos del módulo owner.
- Usa la capability de base compartida desde `RuntimeInfrastructureModule`;
  no crea pools por módulo.
- Traduce SQLSTATE/driver a errores estables antes de cruzar el adapter.
- Acepta transaction context explícito cuando participa en una transacción
  iniciada por aplicación.

### Presentación

- Valida el borde, transporta cookie/header permitido y delega autoridad.
- Mapea errores tipados a respuesta pública sanitizada conforme a DEC-044.
- No autoriza mediante visibilidad UI ni confía en IDs de scope del cliente.
- Expone correlación también en errores cuando el contrato aplicable lo exige.

## Mapa SaaS y autorización

Una operación ordinaria sigue este orden:

```text
request
→ estación vinculada
→ tenant y branch derivados
→ usuario + sesión operativa vigentes
→ roles y capabilities efectivas
→ autorización contextual o tenant-wide
→ caso de uso
→ repositorio owner con scope explícito
```

Reglas que no se negocian localmente:

- `tenantId`, `branchId`, estación, actor y sesión del frontend no son
  autoridad;
- User recibe Roles, no permisos directos; effective capabilities son la unión
  vigente de roles aplicables;
- el módulo publica la capability requerida, pero `access` resuelve la
  autorización;
- acciones sensibles usan el nivel reforzado aplicable y commit guard cuando
  exista riesgo de cambio entre autorización y escritura;
- una denegación UI necesita denegación equivalente en backend;
- los tests negativos usan al menos dos tenants y sucursales incompatibles.

Ver implementaciones comparables en `src/modules/access/`,
`src/modules/repairs/application/repair-protected-operations.ts` y
`src/modules/catalog/application/catalog-protected-operations.ts`.

## Persistencia y migraciones

1. Definir primero owner, scope y constraints en el contrato del cambio.
2. Modelar `tenant_id` obligatorio y `branch_id` sólo cuando el concepto tenga
   scope de sucursal; toda FK compuesta debe impedir cruces de tenant.
3. Crear migración forward-only en
   `src/infrastructure/database/migrations/` mediante el registro vigente.
4. Mantener timestamps como instantes UTC. Para presentación o límites de día,
   aplicar el contrato IANA de `DATA_ARCHITECTURE.md`.
5. Implementar puerto de aplicación y adapter Kysely dentro del módulo owner.
6. Ejecutar varias escrituras atómicas en una transacción dirigida por
   aplicación y sobre la misma conexión.
7. Probar con PostgreSQL real: migración, rerun, constraints, aislamiento,
   rollback, errores y query path material.

No cambiar timezone global de PostgreSQL/Node, no persistir fixed offsets como
autoridad y no acceder directamente a tablas de otro módulo para modificar su
estado.

## UI de un módulo

1. Buscar y reutilizar el
   [`COMPONENT_CATALOG`](../design-system/COMPONENT_CATALOG.md).
2. Componer la ruta en `apps/dev-preview-web/src/App.tsx` y el shell actual;
   mantener lazy loading donde el policy de build lo exige.
3. Usar tokens y CSS Modules; no introducir colores, radios, iconos o
   breakpoints locales paralelos.
4. Tratar loading, empty, error, denied y success según aplique.
5. Verificar teclado, foco, nombres accesibles, light/dark y `640/768` además
   del desktop acordado.
6. La UI puede ocultar una acción, pero el backend continúa siendo autoridad.

## Si cambio X, verifico Y

Ejecutar comandos Node/pnpm sólo mediante `./scripts/pnpm-governed`. Esta tabla
selecciona feedback focalizado; no reduce el pipeline que determine el riesgo.

| Cambio | Verificación focalizada mínima | Evidencia material adicional |
|---|---|---|
| Regla pura de dominio | test unitario del módulo + `typecheck` | casos límite e inválidos. |
| Puerto/contrato público | unitario + contrato + `verify:architecture` | consumidor compatible y error shape. |
| Dependencia/módulo/composición | `test:architecture` + `verify:architecture` | fixture/mutación que falle ante bypass. |
| Controller/API | contrato HTTP + errores/correlación + `typecheck` | autenticación, denied y payload inválido. |
| Auth/capability/scope | tests application/contract + PostgreSQL owner-scoped | allow/deny, dos tenants, stale/revoked y API directa. |
| Repository/query/transaction | test focalizado + PostgreSQL real | constraints, rollback, concurrencia/SQLSTATE aplicable. |
| Schema/migración | tests de migración + PostgreSQL real | primera ejecución, rerun `0 pending`, compatibilidad forward. |
| UI compartida/tokens | test de componente + `verify:ui` | keyboard/a11y, responsive y light/dark. |
| Página/flujo UI | contrato de página + `typecheck` + build cuando aplique | Chrome material y backend deny si hay permisos. |
| Fecha/hora/filtro local | tests de timezone/boundaries | dos IANA, medianoche UTC e instantes sin mutar. |
| Script/checker/workflow | regresión positiva y negativa + arquitectura | demostrar que el gate detecta la mutación. |
| Documentación solamente | links + consistency + secret scan + diff check | clasificador fail-closed; no asumir DOCS_ONLY. |

Antes de promoción manda DEC-051/DEC-063 y el clasificador actual. Los checks
focalizados no sustituyen `verify`/`verify:full`, CI ni exact-main cuando el
workflow los exige.

## Enforcement: automático vs revisión

| Contrato | Estado | Mecanismo / gap |
|---|---|---|
| Módulos permitidos, layers, imports, ciclos, public surface y composición | `AUTOMATIC` | `verify:architecture` + policy DEC-005 + fixtures/mutaciones. |
| Tokens, breakpoints, iconos, CSS Modules, inline style/SVG y catálogo lazy | `AUTOMATIC` | `verify:ui` + tests UI. |
| Work Unit, branch/base/status y secciones del checklist | `AUTOMATIC` | `work-unit:check`. |
| Toolchain fijado | `AUTOMATIC` | `verify:toolchain` y wrapper gobernado. |
| Aislamiento/materialidad SQL de un cambio persistente | `CONDITIONAL` | tests PostgreSQL específicos; el checker estructural no demuestra queries. |
| Ownership semántico y límites de producto | `HUMAN REVIEW` | módulo/PBI/ADR; un nombre de carpeta no prueba ownership. |
| Correcta elección entre componente compartido y control especializado | `HUMAN REVIEW` | catálogo + búsqueda + prueba de interacción. |
| Selección completa de suites por cualquier delta | `SHADOW/GAP` | clasificador vigente falla cerrado; no existe selector focal automático confiable. |
| Calidad del copy, jerarquía visual y UX de dominio | `HUMAN REVIEW` | walkthrough Owner y evidencia proporcional. |

## Auditoría de descubrimiento de Iteration 3

| Necesidad de un agente fresco | Clasificación antes de esta guía | Resultado |
|---|---|---|
| Estado, autoridad y Work Unit | `CLEARLY DISCOVERABLE` | AGENTS/checklist/workflow ya lo resolvían. |
| Alcance/ownership conceptual | `DISCOVERABLE BUT FRAGMENTED` | Roadmap/PBI/mapa/decisiones deben leerse juntos. |
| Módulos y dependencias ejecutables | `CLEARLY DISCOVERABLE` | Policy DEC-005 es mecánica, ahora queda encaminada. |
| Forma física y orden de creación | `DISCOVERABLE BUT FRAGMENTED` | Se infería de módulos existentes; ahora está explícito. |
| Tenant/branch/session/auth | `DISCOVERABLE BUT FRAGMENTED` | Contratos sólidos, rutas múltiples; mapa SaaS añadido. |
| Persistencia/transacción/migración | `DISCOVERABLE BUT FRAGMENTED` | DEC-049, data, migration policy y adapters reunidos. |
| Errores y correlación | `DISCOVERABLE BUT FRAGMENTED` | DEC-044 + controladores ahora tienen ruta explícita. |
| Inventario exacto de componentes UI | `MISSING` | Cubierto por `COMPONENT_CATALOG.md`. |
| Regla permanente de reuse-before-create | `CLEARLY DISCOVERABLE` | AGENTS ya la exigía; catálogo vuelve operativa la búsqueda. |
| Qué verificar según el cambio | `MISSING` | Matriz focalizada añadida sin reducir gates. |
| Autoridad de los docs de testing | `STALE/AMBIGUOUS` | Se declara precedencia de DEC-051/063/scripts vigentes. |
| Estado del contrato visual | `STALE/AMBIGUOUS` | Header reconciliado con PBI-030 materializado. |

## Dry run: ampliar Customers sin implementarlo

Solicitud hipotética exacta: “crear un nuevo módulo Customers que almacene
clientes del tenant, pueda asociarlos opcionalmente con contexto de sucursal,
exponga una lista de clientes y requiera una capability apropiada”. El recorrido
desde `AGENTS.md`, sin memoria de chat ni implementación, produce:

1. `MODULE_MAP.md` confirma que Customers es owner de identidad/contactos; el
   teléfono no se convierte en identidad ni deduplicación automática.
2. `src/modules/customers/` y la policy muestran que Customers ya existe. Se
   extendería ese owner; no se crea un segundo módulo ni una raíz `common`.
3. El modelo físico y el contrato de intake actuales son branch-scoped:
   `CustomerIntakeScope` exige tenant + branch y la migración minimum enlaza
   Customer con Branch. La asociación “opcional” contradice esa baseline y el
   mapa conceptual aún deja abierto tenant vs sucursal. El agente debe pedir
   una decisión de dominio; no volver nullable `branch_id` ni inferir alcance.
4. No existe hoy una capability Customers específica para la lista. El agente
   debe definirla mediante el PBI/contrato de acceso autorizado, incorporarla
   al catálogo y asignaciones compatibles, y no reutilizar por conveniencia
   `repairs.read` ni inventarla dentro de la UI.
5. El contrato cross-module se añadiría, si fuera necesario, a
   `customers/index.ts` y a `publicSurfaces`/`consumers`; ningún consumidor haría
   deep import.
6. El caso de uso recibiría tenant/branch confiables desde estación/sesión y
   autorización server-side; no aceptaría scope del navegador como autoridad.
7. El puerto viviría en `customers/application/ports/` y el adapter en
   `customers/infrastructure/persistence/`; las consultas quedarían
   owner-scoped. Una decisión de scope que cambie schema exigiría migración
   forward-only y constraints compuestos.
8. La lista UI reutilizaría `PageHeader`, `ResponsiveDataList`, `FilterBar`,
   `EmptyState`, `ErrorState` y los tokens existentes; no crearía tabla o shell
   paralelos.
9. Los tests mínimos serían unit/contract, arquitectura si cambia superficie,
   autorización allow/deny, dos tenants y sucursales incompatibles, PostgreSQL
   de Customers para query/scope, UI contract y proof material.
10. Promoción se clasificaría por el mayor riesgo real y seguiría
    DEC-051/DEC-063; estos pasos no conceden inicio, merge ni deploy.

**Resultado:** `PASS WITH OWNER DECISIONS REQUIRED`. El harness localiza dos
decisiones materiales —semántica de Branch y capability de listado— y falla
cerrado antes de inventarlas. Todo lo demás tiene ruta concreta. Implementación,
API y producto permanecen fuera de esta Iteration.

## Mantenimiento

Actualizar esta guía cuando cambien la policy DEC-005, el layout físico, la
capability de persistencia, la autoridad de testing o el flujo de UI. No copiar
aquí un contrato completo: enlazar la fuente y conservar este archivo como
mapa operativo.
