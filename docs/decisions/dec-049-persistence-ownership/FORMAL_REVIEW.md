# Revisión formal de DEC-049 — Repositorios y propiedad lógica de persistencia

## 1. Título

Revisión formal multidisciplinaria de
[DEC-049 — Repositorios y propiedad lógica de persistencia](DECISION_PROPOSAL.md).

## 2. Fecha

2026-07-24.

## 3. Estado inicial

- **Estado canónico recibido:** `Ready for formal decision`.
- **Subestado recibido:** propuesta completa; revisiones y aprobación pendientes.
- **Materialización:** no iniciada ni autorizada.
- **R0:** no autorizado.
- **Sprint 00:** abierto.

## 4. Alcance

La revisión determina si la propuesta:

- es coherente con las decisiones aceptadas y con la organización verificada de
  DEC-005;
- ofrece un contrato implementable para PostgreSQL, Kysely y `pg`;
- gobierna ownership, scopes, transacciones, lecturas cross-module,
  administración SaaS y SQL raw;
- conserva aislamiento tenant/sucursal, mínimo privilegio y denegación por
  defecto;
- define evidencia operativa y de calidad suficiente para una futura
  materialización;
- clasifica RLS sin convertirla en requisito implícito ni en sustituto de otros
  controles.

No forman parte de esta revisión la instalación de dependencias, schema, SQL,
migraciones, repositorios, conexión a base, checker, fixtures, PBI técnico,
runtime funcional, CI o despliegue.

## 5. Metodología

1. Se comprobó el estado Git y se preservaron por SHA-256 las rutas
   preexistentes.
2. Se leyó la propuesta completa y se contrastó con ADR-002 a ADR-005,
   ADR-009 a ADR-013, DEC-004, DEC-005, los gates de R0, Sprint 00, ownership,
   multitenancy, seguridad, observabilidad, calidad y operaciones.
3. Se contrastaron las afirmaciones técnicas con documentación primaria
   vigente de Kysely, node-postgres y PostgreSQL 18.
4. Se ejecutaron cinco perspectivas separadas: Arquitectura, Ingeniería,
   Seguridad, Operaciones y Calidad.
5. Cada punto normativo recibió un resultado explícito y las condiciones se
   asignaron a autoridad, momento y evidencia futura.
6. Se distinguió deliberadamente entre **revisión técnica satisfactoria** y
   **aprobación formal por autoridad**.

La escala por disciplina es `PASS`, `PASS WITH CONDITIONS` o `FAIL`. El
resultado global se limita a `Accepted`, `Accepted with conditions`,
`Approval Pending` o `Rejected`.

## 6. Fuentes

### Decisiones y gobierno

- [DEC-049](DECISION_PROPOSAL.md).
- [Registro de decisiones](../README.md).
- [DEC-004](../dec-004-toolchain-contract/DECISION_PROPOSAL.md).
- [DEC-005](../dec-005-modular-monolith-organization/DECISION_PROPOSAL.md).
- [ADR-002](../proposed/ADR-002-modular-monolith-first.md).
- [ADR-003](../proposed/ADR-003-postgresql-primary-database.md).
- [ADR-004](../proposed/ADR-004-shared-schema-multitenancy.md).
- [ADR-005](../proposed/ADR-005-nestjs-backend.md).
- [ADR-009](../proposed/ADR-009-monorepo-strategy.md).
- [ADR-010](../proposed/ADR-010-station-bound-operational-context.md).
- [ADR-011](../proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md).
- [ADR-012](../proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md).
- [ADR-013](../proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md).
- [Siguiente gate de R0](../../architecture-readiness/NEXT_R0_GATE_ASSESSMENT.md).
- [Inventario de bloqueantes](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md).
- [Plan de cierre](../../architecture-readiness/blocker-closure/PLAN_DE_CIERRE.md).
- [Criterios de inicio de implementación](../../architecture-readiness/repair-mvp/CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md).
- [Matriz de readiness de ADRs](../../reviews/sprint-00/ADR_READINESS_MATRIX.md).
- [Evaluación de cierre de Sprint 00](../../reviews/sprint-00/SPRINT_00_CLOSURE_ASSESSMENT.md).

### Arquitectura, dominio, seguridad, calidad y operaciones

- [Arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md).
- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md).
- [Modelo multitenant](../../architecture/MULTITENANCY_MODEL.md).
- [Identidad, acceso y permisos](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md).
- [Línea base de seguridad](../../architecture/SECURITY_BASELINE.md).
- [Estrategia de observabilidad](../../architecture/OBSERVABILITY_STRATEGY.md).
- [Matriz de ownership](../../domain/OWNERSHIP_MATRIX.md).
- [Puertos y repositorios candidatos](../../architecture-readiness/repair-mvp/PUERTOS_Y_REPOSITORIOS_CANDIDATOS.md).
- [Límites transaccionales](../../architecture-readiness/repair-mvp/LIMITES_TRANSACCIONALES.md).
- [Pruebas de aislamiento multitenant](../../quality/MULTITENANT_ISOLATION_TESTING.md).
- [Estrategia de pruebas](../../quality/TESTING_STRATEGY.md).
- [Pruebas de seguridad](../../quality/SECURITY_TESTING.md).
- [Política de migraciones](../../operations/MIGRATION_POLICY.md).

### Fuentes técnicas primarias

- [Kysely — getting started](https://www.kysely.dev/docs/getting-started).
- [Kysely — transacción simple](https://www.kysely.dev/docs/examples/transactions/simple-transaction).
- [Kysely — transacción controlada](https://www.kysely.dev/docs/examples/transactions/controlled-transaction).
- [Kysely — metadata oficial](https://github.com/kysely-org/kysely/blob/master/package.json).
- [node-postgres — ESM](https://node-postgres.com/features/esm).
- [node-postgres — pooling](https://node-postgres.com/features/pooling).
- [node-postgres — transactions](https://node-postgres.com/features/transactions).
- [node-postgres — parameterized queries](https://node-postgres.com/features/queries).
- [PostgreSQL 18 — transactions](https://www.postgresql.org/docs/18/tutorial-transactions.html).
- [PostgreSQL 18 — transaction isolation](https://www.postgresql.org/docs/18/transaction-iso.html).
- [PostgreSQL 18 — constraints](https://www.postgresql.org/docs/18/ddl-constraints.html).
- [PostgreSQL 18 — Row Security Policies](https://www.postgresql.org/docs/18/ddl-rowsecurity.html).

La metadata oficial observada declara Kysely `0.29.4`, Node.js `>=22` y ESM;
esto demuestra compatibilidad de rango con Node.js 24, pero no selecciona una
versión para SR Taller. Kysely declara que su dialecto PostgreSQL usa `pg`.
node-postgres exige el mismo cliente para todas las sentencias de una
transacción y advierte que `pool.query` no sirve para coordinarlas. PostgreSQL
documenta constraints compuestas y que RLS, cuando se habilita, requiere
políticas explícitas; el owner de una tabla normalmente puede eludirlas. Estas
propiedades respaldan las condiciones de materialización, no constituyen
evidencia ejecutada del producto.

## 7. Revisión de Arquitectura

**Resultado: PASS WITH CONDITIONS.**

### Coherencia y fronteras

- La propuesta aplica DEC-005 sin reabrir sus módulos, estructura o grafo:
  infraestructura implementa puertos internos y dominio/aplicación no importan
  Kysely, `pg` ni records de persistencia.
- El repositorio por agregado o autoridad de escritura preserva invariantes y
  lenguaje del módulo. Prohibir `BaseRepository<T>`, CRUD genérico y acceso al
  query builder evita convertir tablas en API transversal.
- Un owner por tabla, índice, constraint, trigger, vista y migración es
  compatible con ADR-002/009. Una FK cross-module no crea co-ownership.
- Los query services y puertos por caso de uso preservan lecturas útiles sin
  conceder escritura ni exponer internals.
- El orden de preferencia para lecturas cross-module es correcto. El acceso
  directo excepcional, registrado y sólo de lectura, es un escape controlado,
  no una segunda arquitectura.
- La administración SaaS usa contexto, interfaz y composición separados; no
  reutiliza repositorios operativos como capacidad global.
- El `TransactionRunner` estrecho conserva la autoridad en aplicación y no
  introduce un Unit of Work genérico.
- Kysely es un detalle reversible de infraestructura. No se convierte en
  dependencia de dominio ni en modelo de objetos.

### Impacto sobre módulos futuros

La decisión no crea `customers`, `repairs`, `inventory`, `payments` u otros
módulos candidatos. Todo módulo futuro deberá declarar owner y contratos antes
de materializar objetos. Esto evita que DEC-049 congele fronteras no aceptadas.

### Condiciones aplicables

DEC049-C02, DEC049-C05 y DEC049-C07.

No se encontró contradicción material con DEC-005, ADR-002, ADR-004 o ADR-009.

## 8. Revisión de Ingeniería

**Resultado: PASS WITH CONDITIONS.**

### Viabilidad técnica

- Kysely + `pg` es viable con ESM, Node.js 24 y TypeScript 6 según la
  documentación y metadata vigentes. La compatibilidad exacta depende de los
  pins futuros y debe demostrarse con el toolchain aceptado.
- El dialecto PostgreSQL oficial de Kysely se apoya en `pg`; no exige una capa
  propia equivalente a un ORM.
- Kysely conserva SQL visible, typing de consultas y composición. No reemplaza
  validación runtime, constraints, autorización o mapping.
- El costo de repositorios explícitos y mapping es mayor que CRUD genérico,
  pero reduce acoplamiento, hace visibles scope y transacción y es razonable
  para un equipo pequeño y un monolito modular.
- La frontera transaccional propuesta coincide con Kysely y `pg`: el runner
  entrega un handle limitado y todos los repositorios participantes usan la
  misma conexión. Usar `pool.query` dentro de esa transacción quedaría
  prohibido por contrato y por la documentación de `pg`.
- La traducción de errores en infraestructura es correcta, siempre que se haga
  por operación y constraint conocida. Una `unique violation` desconocida no
  debe interpretarse automáticamente como idempotencia satisfecha.
- Las pruebas reales en PostgreSQL son necesarias: mocks no demuestran
  constraints, aislamiento, bloqueo, rollback ni comportamiento del driver.
- La propuesta mejora debugging al conservar nombre estable de operación,
  SQL inspeccionable en entorno autorizado, correlación y errores internos
  sanitizados.

### Riesgos de implementación

- helpers de Kysely compartidos sin owner podrían recrear un repositorio
  genérico;
- pasar la instancia global en lugar del transaction context fragmentaría la
  atomicidad;
- tipos Kysely podrían filtrarse a contratos públicos;
- pins incompatibles podrían quebrar ESM o TypeScript;
- un pool sin límites, timeout y cierre drenado degradaría disponibilidad.

### Condiciones aplicables

DEC049-C01, DEC049-C03, DEC049-C04, DEC049-C06 y DEC049-C07.

## 9. Revisión de Seguridad

**Resultado: PASS WITH CONDITIONS.**

### Aislamiento y denegación

- `tenantId` obligatorio y `tenantId + branchId` para datos de sucursal
  mantienen las fronteras aceptadas por ADR-004/010.
- Un FK compuesto de sucursal debe referenciar una clave única o primaria
  compatible en PostgreSQL; el modelo físico deberá demostrar esta garantía.
- Datos sin tenant sólo se permiten como globales allowlisted. No existe un
  default global ni un repositorio operativo sin scope.
- El contexto es explícito, inmutable y derivado por el servidor.
  `AsyncLocalStorage` queda limitado a correlación/metadatos y no puede ser
  fuente única de tenant, autorización o transacción.
- Código tenant no recibe interfaces administrativas. Operaciones cross-tenant
  exigen caso de uso, capacidad reforzada, propósito, auditoría y composición
  separados.
- SQL raw queda dentro de infraestructura del owner o herramienta operativa
  autorizada, parametrizado y sujeto a registry, revisión y pruebas. No existe
  un `raw()` global.
- La taxonomía de error preserva anti-enumeración y evita exponer SQLSTATE,
  SQL, constraints internas, stack o connection strings.
- Observabilidad minimiza PII y prohíbe PIN, tokens, secretos, valores SQL y
  payloads completos.
- Las pruebas negativas con dos tenants y sucursales son obligatorias; un caso
  positivo no demuestra aislamiento.

### Dictamen sobre RLS

**Clasificación: diferida como defensa secundaria; no seleccionada para R0.**

La deferencia es legítima porque R0 conserva defensas independientes:
contexto explícito, interfaces scopeadas, ownership, constraints compuestas,
mínimo privilegio, separación administrativa y pruebas negativas. RLS no
reemplazaría ninguna de ellas.

No se requiere RLS sólo para administración: PostgreSQL advierte que owners y
roles con `BYPASSRLS` pueden eludir políticas, por lo que no sería una barrera
administrativa suficiente sin diseñar roles, pools y sesión SQL. Tampoco se
rechaza definitivamente. Su adopción requiere SPIKE-002, SPIKE-003 y una
decisión posterior sobre roles, `SET LOCAL`, pooling, bypass, migraciones,
observabilidad y pruebas.

### Condiciones aplicables

DEC049-C03, DEC049-C05, DEC049-C06, DEC049-C07 y DEC049-C08.

## 10. Revisión de Operaciones

**Resultado: PASS WITH CONDITIONS.**

### Operabilidad

- Un pool acotado y único por base es coherente con node-postgres. La futura
  configuración deberá fijar tamaño, espera, conexión, statement/transaction
  timeout, idle timeout, shutdown y tratamiento de clientes idle fallidos.
- Todo cliente obtenido debe liberarse en `finally`; el cierre de aplicación
  debe drenar el pool. La fuga de un cliente es un fallo de disponibilidad.
- Deadlocks y serialization failures sólo pueden reintentarse con SQLSTATE
  reconocido, operación idempotente, presupuesto, backoff y correlación.
  Timeouts y errores desconocidos no se reintentan indiscriminadamente.
- Las transacciones no deben esperar I/O remoto ni interacción humana. Esto
  reduce locks largos y agotamiento.
- Las señales propuestas permiten observar duración, outcome, pool agotado,
  timeouts, reintentos y denegaciones sin registrar SQL o valores sensibles.
- Administración, soporte, mantenimiento y recuperación permanecen en
  herramientas/contratos separados; no usan credenciales ni repositorios
  ordinarios.
- Migraciones, backups, hosting, RPO/RTO y proveedor siguen diferidos a sus
  decisiones. DEC-049 no debe inferirlos ni ejecutarlos.
- Un escape hatch sin owner, revisión, allowlist, auditoría y expiración se
  considera inexistente y debe fallar cerrado.

### Condiciones aplicables

DEC049-C04, DEC049-C05, DEC049-C06 y DEC049-C08.

## 11. Revisión de Calidad

**Resultado: PASS WITH CONDITIONS.**

### Testabilidad y evidencia

- Puertos, mapping y transaction context explícitos permiten unit tests útiles
  sin fingir que mocks validan PostgreSQL.
- La suite de integración debe usar PostgreSQL 18.x real y fixtures
  deterministas con al menos dos tenants, dos sucursales por alcance y
  identificadores deliberadamente coincidentes.
- Deben existir casos negativos de lectura, escritura, update condicional,
  delete cuando exista, joins, queries cross-module, jobs y administración.
- Commit, rollback y varios repositorios deben demostrar misma conexión y
  ausencia de efectos parciales.
- Constraints compuestas, uniques, FKs, checks, optimistic concurrency,
  idempotencia y errores traducidos requieren evidencia directa.
- El pool debe probar liberación en éxito/error, agotamiento acotado y cierre.
- Los criterios son automatizables: imports de Kysely/`pg`, repositorios
  genéricos, raw SQL, API pública, contexto obligatorio, excepciones y
  dependencias cross-module pueden incorporarse al enforcement futuro.
- DEC-051 conserva herramientas, comandos, frecuencia y gates; esta revisión
  no selecciona runner ni CI.

### Condiciones aplicables

DEC049-C01, DEC049-C03, DEC049-C04, DEC049-C06 y DEC049-C07.

## 12. Matriz de puntos de decisión

`CONFIRMADO` valida el contrato conceptual; no equivale a aprobación de
DEC-049 ni autoriza materialización.

| Área | Punto de decisión | Dictamen | Fundamento |
| --- | --- | --- | --- |
| Tecnología | PostgreSQL | CONFIRMADO | ADR-003 y baseline 18.x aceptadas |
| Tecnología | Kysely como query builder tipado | CONFIRMADO CON DEC049-C01 | Viable, SQL visible y detalle de infraestructura |
| Tecnología | `pg` como driver | CONFIRMADO CON DEC049-C01/C04 | Dialecto oficial; pool y tx exigen evidencia |
| Tecnología | ORM general no seleccionado | CONFIRMADO | Evita semántica implícita y UoW no requeridos |
| Tecnología | SQL directo no es API predeterminada | CONFIRMADO | Sólo escape hatch owner-scoped |
| Repositorios | Explícitos por agregado/autoridad | CONFIRMADO | Preserva owner e invariantes |
| Repositorios | Sin `BaseRepository<T>` | CONFIRMADO | Evita CRUD y scope genéricos |
| Repositorios | Sin CRUD genérico público | CONFIRMADO | Contratos nombrados por caso |
| Repositorios | Mapping en infraestructura del owner | CONFIRMADO | Dominio no conoce records/driver |
| Repositorios | Query services/puertos por caso | CONFIRMADO | Lecturas mínimas con owner |
| Ownership | Owner único por tabla | CONFIRMADO CON DEC049-C02 | Requiere registry al materializar |
| Ownership | Mismo principio para índices/constraints/triggers/vistas/migraciones | CONFIRMADO CON DEC049-C02 | Evita co-ownership físico |
| Ownership | Sólo owner escribe | CONFIRMADO | Escritura cross-module prohibida |
| Ownership | Lecturas externas por contrato público | CONFIRMADO | Orden de preferencia explícito |
| Ownership | Schema alterado sólo por owner | CONFIRMADO | DEC-050 conservará ejecución |
| Scope | `tenantId` explícito | CONFIRMADO | Firma obligatoria y contexto servidor |
| Scope | `tenantId + branchId` explícitos | CONFIRMADO | Scope de sucursal no sustituye tenant |
| Scope | Constraints respaldan coherencia | CONFIRMADO CON DEC049-C03 | FK/unique compuestos en PG real |
| Scope | Sin tenant sólo para globales clasificados | CONFIRMADO | Allowlist, servicio y propósito |
| Scope | Consultas globales ordinarias prohibidas | CONFIRMADO | Admin separado |
| Scope | Denegación por defecto | CONFIRMADO | Capas de aplicación, repo y DB |
| Contexto | Contexto explícito e inmutable | CONFIRMADO | Se pasa desde aplicación |
| Contexto | No depende exclusivamente de ALS | CONFIRMADO | ALS sólo técnico después de validar |
| Contexto | Sin variables globales autoritativas | CONFIRMADO | Impide contaminación concurrente |
| Contexto | Sin contexto stale | CONFIRMADO CON DEC049-C03 | Tests concurrentes requests/jobs |
| Contexto | Repositorios ordinarios no operan sin scope | CONFIRMADO | No existe método global operativo |
| Contexto | Excepciones administrativas separadas | CONFIRMADO CON DEC049-C05 | DI/API/credencial separables |
| Transacciones | Aplicación/caso de uso es autoridad | CONFIRMADO | Preserva límite de negocio |
| Transacciones | Transaction context explícito | CONFIRMADO CON DEC049-C04 | Handle estrecho, no global |
| Transacciones | Misma conexión durante la tx | CONFIRMADO CON DEC049-C04 | Requisito de `pg` y PostgreSQL |
| Transacciones | Repos no abren tx independientes | CONFIRMADO | Runner único coordina |
| Transacciones | Sin transacciones distribuidas R0 | CONFIRMADO | Un backend y una base |
| Transacciones | Sin UoW genérico | CONFIRMADO | No hay change tracking |
| Cross-module | Servicios públicos | CONFIRMADO | Primera preferencia |
| Cross-module | Puertos/query services | CONFIRMADO | Owner conserva contrato |
| Cross-module | Proyecciones | CONFIRMADO | Lectura no transfiere escritura |
| Cross-module | Directo excepcional sólo lectura y registrado | CONFIRMADO CON DEC049-C05 | Scope, tests, owner y expiración |
| Administración | Separada de operación tenant | CONFIRMADO CON DEC049-C05 | Contexto y composición distintos |
| Administración | Interfaces distintas | CONFIRMADO CON DEC049-C05 | No inyectable como repo operativo |
| Administración | Autorización reforzada | CONFIRMADO | ADR-013 |
| Administración | Auditoría | CONFIRMADO CON DEC049-C05/C06 | Actor, propósito, filtro y resultado |
| Administración | No reutiliza repos ordinarios | CONFIRMADO | Prohibición explícita |
| SQL raw | Sólo infraestructura autorizada | CONFIRMADO CON DEC049-C05 | Sin helper global |
| SQL raw | Escape hatch, revisión y tests | CONFIRMADO CON DEC049-C05/C07 | Registry y enforcement |
| SQL raw | Auditoría cuando corresponde | CONFIRMADO CON DEC049-C05/C06 | Separada de logs técnicos |
| Integridad | PostgreSQL es autoridad estructural | CONFIRMADO | Constraints, no sólo types |
| Integridad | Unique/FK/check constraints | CONFIRMADO CON DEC049-C03 | Diseño por scope y caso |
| Integridad | Concurrencia por caso de uso | CONFIRMADO | Optimista default; locks justificados |
| Integridad | Errores traducidos | CONFIRMADO CON DEC049-C06 | Constraint/operación conocida |
| RLS | Defensa secundaria diferida | CONFIRMADO CON DEC049-C08 | No requerida ni seleccionada para R0 |

## 13. Condiciones

Las condiciones fueron aceptadas junto con DEC-049 el 2026-07-24. Permanecen
obligatorias, trazables y **no cumplidas**; bloquean únicamente el hito indicado
de una futura materialización.

| ID | Condición verificable | Owner | Momento | Evidencia requerida | Dependencia declarada |
| --- | --- | --- | --- | --- | --- |
| DEC049-C01 | Fijar versiones exactas compatibles de Kysely, `pg` y types antes de instalar | Ingeniería; revisión Arquitectura/Seguridad | Antes de la primera instalación del PBI de materialización | lockfile frozen sin cambio no autorizado; Node 24/TS 6/ESM typecheck, build y smoke de conexión | PBI de materialización requerido, no creado |
| DEC049-C02 | Registrar owner, scope, escritura, lectura, invariantes y evolución de cada objeto | Arquitectura + owner de módulo | Antes de crear cada tabla/migración/repositorio | registry revisado; objeto sin owner o con co-owner rechazado | DEC-050 y futuro PBI |
| DEC049-C03 | Demostrar constraints y aislamiento tenant/sucursal en PostgreSQL 18 real | Ingeniería + Seguridad + Calidad | Antes de aceptar la primera persistencia tenant-scoped | dos tenants/sucursales; FK/unique/check compuestos; casos negativos de lectura/escritura y contexto stale | SPIKE-002 y DEC-051; no exige RLS |
| DEC049-C04 | Definir y probar pool/transaction runner con misma conexión y retries acotados | Ingeniería + Operaciones | Antes de la primera transacción de aplicación | configuración revisada; commit/rollback; varios repos; liberación; agotamiento; shutdown; deadlock/serialization idempotentes | Futuro PBI; DEC-051 para gates |
| DEC049-C05 | Mantener registry y composición separada para admin, raw SQL y accesos directos excepcionales | Arquitectura + Seguridad + Operaciones | Antes del primer uso excepcional o cross-tenant | allowlist, owner, propósito, scope, autorización, auditoría, tests y revisión/expiración; prueba de no inyección tenant | ADR-013 y futuro PBI |
| DEC049-C06 | Traducir errores y emitir observabilidad sanitizada por operación/constraint conocida | Ingeniería + Seguridad + Operaciones + Calidad | Antes del primer endpoint o job persistente | contract tests sin SQLSTATE/SQL/PII; correlación, clase estable y métricas de pool/timeout/retry | DEC-044/045-048 y futuro PBI |
| DEC049-C07 | Automatizar límites de imports, superficie pública, repositorios genéricos, raw SQL y cross-module | Arquitectura + Calidad | Antes del merge de la materialización | checker/tests que fallen ante Kysely/`pg` fuera de infraestructura, `BaseRepository`, `raw()` global, record filtrado o deep import | DEC-051 y futuro PBI; no modificar checker actual en esta tarea |
| DEC049-C08 | No habilitar RLS sin SPIKE-002, SPIKE-003 y decisión posterior de roles/pool/políticas | Arquitectura + Seguridad + Operaciones | Antes de cualquier adopción de RLS; no bloquea R0 sin RLS | resultados de spikes, decisión explícita y pruebas de owner/bypass/`SET LOCAL`/pool/jobs/admin | Decisión futura declarada |

## 14. Riesgos residuales

| Riesgo | Estado después de la revisión |
| --- | --- |
| Omisión de scope por error de programación | Reducido por firmas/constraints/tests; no demostrado hasta DEC049-C03/C07 |
| Fuga por acceso administrativo o raw SQL | Gobernada; no demostrada hasta DEC049-C05 |
| Transacción fragmentada entre conexiones | Contrato correcto; no demostrado hasta DEC049-C04 |
| Agotamiento o fuga del pool | Requiere límites y pruebas de DEC049-C04 |
| Abstracción genérica reaparece como helper | Requiere enforcement DEC049-C07 |
| Error interno o PII expuestos | Requiere mapper y pruebas DEC049-C06 |
| Drift entre tipos Kysely y schema | Depende de DEC-050 y pruebas reales |
| Ausencia de RLS | Riesgo residual aceptable para R0 sólo con C03/C05/C07; revisar en C08 |
| Lecturas cross-module erosionan ownership | Excepción registrada y revisión periódica pendientes |
| Owner físico contradice ownership de dominio aún candidato | Todo objeto futuro debe validar C02; DEC-049 no crea módulos |

Ninguno invalida la estrategia central. Todos requieren evidencia antes de su
hito correspondiente.

## 15. Decisiones diferidas

- versiones exactas de Kysely, `pg` y tipos;
- herramienta/formato/ejecución de migraciones, bajo DEC-050;
- runner, fixtures, comandos y gates de pruebas, bajo DEC-051;
- taxonomía transversal y mapeo HTTP de errores, bajo DEC-044;
- rol o pool físicamente separado para administración;
- adopción, políticas y operación de RLS;
- configuración cuantitativa del pool, timeouts, retries y SLOs;
- schema, tablas y constraints concretos de módulos futuros;
- outbox, caché, réplicas, particionamiento, CQRS, event sourcing y
  microservicios;
- proveedor, hosting, backup, RPO/RTO, retención y warehouse/BI;
- PBI y diseño de materialización.

DEC-063 continúa posterior a DEC-051. Ninguna decisión diferida queda aceptada
por esta revisión.

## 16. Trazabilidad

| Contrato | Sección DEC-049 | Revisor | Riesgo | Mitigación | Evidencia futura | Decisión/PBI responsable | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tecnología Kysely + `pg` | 9, 11-14 | Ingeniería | incompatibilidad/tooling | pins y validación ESM | C01 | futuro PBI DEC-049 | Condicionado |
| Ownership de objetos | 15 | Arquitectura | co-ownership | registry y owner único | C02 | DEC-050 + futuro PBI | Condicionado |
| Tenant scope | 16-17 | Seguridad | fuga cross-tenant | contexto + constraints | C03 | SPIKE-002/DEC-051 | Condicionado |
| Branch scope | 16-17 | Seguridad/Calidad | sucursal de otro tenant | FK compuesta + negativos | C03 | SPIKE-002/DEC-051 | Condicionado |
| Consultas globales | 16, 21 | Seguridad | bypass ordinario | interfaz admin separada | C05 | futuro PBI | Condicionado |
| Repositorios explícitos | 18 | Arquitectura/Ingeniería | CRUD genérico | puertos por agregado/caso | C07 | futuro PBI/DEC-051 | Condicionado |
| Contexto explícito | 17 | Arquitectura/Seguridad | ALS/global stale | argumento inmutable | C03/C07 | futuro PBI/DEC-051 | Condicionado |
| Transacciones | 19 | Ingeniería/Operaciones | conexiones distintas | runner/handle explícito | C04 | futuro PBI/DEC-051 | Condicionado |
| Cross-module | 20 | Arquitectura | tablas como API | contratos, proyección, registry | C05/C07 | futuro PBI | Condicionado |
| Administración SaaS | 21 | Seguridad/Operaciones | escalada cross-tenant | composición/capacidad/auditoría | C05 | futuro PBI | Condicionado |
| Integridad | 22 | Ingeniería/Calidad | estado inválido | PG constraints y concurrencia | C03 | DEC-050/051 | Condicionado |
| Errores | 23 | Ingeniería/Seguridad | filtración/enumeración | mapper estable y sanitizado | C06 | DEC-044 | Condicionado |
| Testing | 24 | Calidad | falsa confianza por mocks | PostgreSQL real y negativos | C03/C04 | DEC-051 | Condicionado |
| Observabilidad | 25 | Operaciones/Seguridad | PII/cardinalidad | señales mínimas sanitizadas | C06 | DEC-045-048 | Condicionado |
| Seguridad general | 26 | Seguridad | bypass/inyección | parametrización, mínimo privilegio | C03/C05/C07 | futuro PBI/DEC-051 | Condicionado |
| RLS | 27 | Seguridad/Arquitectura | adopción incompleta | deferir y decidir tras spikes | C08 | SPIKE-002/003 + decisión futura | Diferido gobernado |
| Escape hatches/SQL raw | 28 | Seguridad/Operaciones | bypass no gobernado | allowlist/registry/tests | C05/C07 | futuro PBI | Condicionado |
| Migraciones | 15, 28, 32, 35 | Ingeniería/Operaciones | drift/despliegue inseguro | owner + DEC-050 | suite de migración futura | DEC-050 | Diferido |
| Enforcement | 30, 33 | Arquitectura/Calidad | erosión de límites | checker y tests | C07 | DEC-051/futuro PBI | Condicionado |

## 17. Resultado global

### Resultado técnico de la revisión

**PASS WITH CONDITIONS en las cinco disciplinas.**

Las cinco revisiones técnicas son satisfactorias con condiciones concretas,
asignables y materializables. La selección PostgreSQL + Kysely + `pg`, el
ownership, los scopes, las transacciones y las excepciones son coherentes y no
presentan contradicciones materiales.

El resultado original al completar esta revisión fue `Approval Pending`, pues
todavía no existían aprobaciones explícitas atribuibles. Ese estado se conserva
como historia y fue resuelto por la autoridad registrada en la
[sección 18](#18-autoridad).

### Resolución final

**Accepted.**

El Responsable del Proyecto emitió el 2026-07-24 las cinco resoluciones
explícitas requeridas y aceptó las condiciones DEC049-C01 a DEC049-C08. La
aceptación es arquitectónica y no constituye evidencia de materialización.

## 18. Autoridad

### Evidencia técnica presente

- propuesta completa y trazable;
- cinco perspectivas técnicas documentadas;
- decisiones previas con sus autoridades registradas;
- fuentes técnicas primarias vigentes.

### Resoluciones explícitas

La autoridad de esta tarea atribuye las cinco resoluciones al **Responsable del
Proyecto**, con fecha **2026-07-24**. No se registran terceros, firmas
manuscritas ni revisores externos.

| Función | Resolución explícita | Alcance aceptado |
| --- | --- | --- |
| Seguridad | **Conforme con las condiciones documentadas.** | `tenantId`; `tenantId + branchId`; denegación por defecto; prohibición de queries globales ordinarias; administración SaaS separada; SQL raw gobernado; errores sanitizados; pruebas negativas multitenant; RLS diferida como defensa secundaria |
| Operaciones | **Conforme con las condiciones documentadas.** | pool gobernado; misma conexión por transacción; timeouts y agotamiento; rollback; retries limitados y clasificados; observabilidad; escape hatches; operación administrativa separada |
| Calidad | **Conforme con las condiciones documentadas.** | PostgreSQL real en integración; aislamiento tenant/sucursal; constraints; transacciones; rollback; pruebas negativas; enforcement futuro; evidencia reproducible |
| Arquitectura | **Aprueba la decisión y acepta las condiciones.** | PostgreSQL; Kysely + `pg`; repositorios explícitos; ownership único; prohibición de `BaseRepository` genérico; puertos y query services; transacciones dirigidas por aplicación; separación administrativa; límites cross-module |
| Ingeniería | **Aprueba la decisión y acepta las condiciones.** | Node.js 24; TypeScript 6; ESM; Kysely + `pg`; transaction context explícito; mapping en infraestructura; código explícito; testabilidad; debugging; condiciones de materialización |

Producto conserva autoridad si una materialización futura cambia alcance,
clasificación de datos u ownership de negocio; no se identificó ese cambio.

## 19. Estado final recomendado

- **Estado anterior:** `Ready for formal decision — Formal Review Complete /
  Approval Pending`.
- **Estado canónico final:** `Accepted`.
- **Fecha de revisión:** 2026-07-24.
- **Fecha de aceptación:** 2026-07-24.
- **Autoridad:** Responsable del Proyecto, ejerciendo las conformidades y
  aprobaciones explícitas detalladas en la sección 18.
- **Referencia:** este documento.

Las condiciones DEC049-C01 a DEC049-C08 quedan aceptadas, vigentes y pendientes
de evidencia. Deben trasladarse sin cambios a la futura materialización
autorizada; ninguna se marca cumplida en esta resolución.

## 20. Impacto sobre R0

- R0 continúa **no autorizado**.
- DEC-049 queda cerrada para H0.
- El conteo cambia de **cuatro H0 cerrados y cinco H0 abiertos** a **cinco H0
  cerrados y cuatro H0 abiertos**.
- Los cuatro H0 abiertos son: evidencia final de DEC-004, DEC-044, DEC-051 y
  DEC-063.
- No se crea ni autoriza un PBI técnico.
- DEC-050 puede prepararse documentalmente, sin inferir materialización.

## 21. Impacto sobre Sprint 00

- Sprint 00 continúa abierto.
- El cierre de DEC-049 se registra como avance de gobierno, pero no cierra el
  Sprint ni sus demás criterios de salida.
- No existe autorización de implementación funcional.
- La aceptación no sustituye el cierre o la autorización organizacional
  requeridos.

## 22. Siguiente acción

Trabajar **DEC-044 — estrategia de errores** como siguiente gate concreto de
R0. DEC-051 recibe los contratos de DEC-049 y DEC-044; DEC-063 depende de
DEC-051; y VC-024 de la evidencia final de DEC-004 espera el gate de DEC-051.
La ratificación Linux nativa de DEC-004 puede continuar en paralelo bajo su
propia autoridad.

No instalar Kysely/`pg`, no crear el PBI técnico y no materializar persistencia
en esta resolución.
