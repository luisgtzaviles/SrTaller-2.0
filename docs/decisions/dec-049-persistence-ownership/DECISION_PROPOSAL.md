# DEC-049 — Repositorios y propiedad lógica de persistencia

## 1. Identificador y título

| Campo | Valor |
| --- | --- |
| Identificador | `DEC-049` |
| Título | Repositorios y propiedad lógica de persistencia |
| Tipo | Decisión técnica complementaria |
| Alcance | Acceso a PostgreSQL, ownership lógico, aislamiento y transacciones |

## 2. Estado

**Accepted**

El análisis, el contrato recomendado y la
[revisión formal multidisciplinaria](FORMAL_REVIEW.md) están completos. El
resultado técnico fue `PASS WITH CONDITIONS` en Arquitectura, Ingeniería,
Seguridad, Operaciones y Calidad. El Responsable del Proyecto emitió las
conformidades de Seguridad, Operaciones y Calidad y las aprobaciones de
Arquitectura e Ingeniería el 2026-07-24. Las condiciones DEC049-C01 a
DEC049-C08 fueron aceptadas y permanecen obligatorias, trazables y pendientes
para la futura materialización.

Esta aceptación es arquitectónica. No instala dependencias, materializa
persistencia, crea un PBI técnico ni autoriza R0, Sprint 00, merge o deploy.

Estado anterior inmediato: `Ready for formal decision — Formal Review Complete
/ Approval Pending`.

Estado histórico anterior: `Ready for decision`, sin documento autoritativo
propio.

## 3. Fecha

Propuesta consolidada: **2026-07-23**.

Revisión formal completada: **2026-07-24**.

Fecha de aceptación: **2026-07-24**.

## 4. Autoridad

| Función | Participación requerida | Estado |
| --- | --- | --- |
| Arquitectura | Aprueba fronteras, ownership y excepciones | Aprobada por el Responsable del Proyecto el 2026-07-24; condiciones aceptadas |
| Ingeniería | Aprueba mecanismo, contratos y factibilidad | Aprobada por el Responsable del Proyecto el 2026-07-24; condiciones aceptadas |
| Seguridad | Revisa aislamiento, acceso administrativo, SQL raw y RLS | Conforme por el Responsable del Proyecto el 2026-07-24; condiciones aceptadas |
| Operaciones | Revisa pool, timeouts, ciclo de conexiones, transacciones y señales | Conforme por el Responsable del Proyecto el 2026-07-24; condiciones aceptadas |
| Calidad | Revisa estrategia de pruebas y criterios de enforcement | Conforme por el Responsable del Proyecto el 2026-07-24; condiciones aceptadas |
| Producto | Se consulta si cambia alcance, clasificación u ownership de negocio | No se propone cambio; sin dictamen requerido por esta selección técnica |

La atribución de las cinco resoluciones corresponde únicamente al Responsable
del Proyecto conforme a la autoridad explícita de esta tarea; no se inventan
nombres, firmas ni revisores externos. Producto conserva autoridad sobre
clasificación y ownership de negocio cuando un dato futuro no pueda
clasificarse con las decisiones vigentes.

## 5. Contexto

SR Taller 2.0 inicia como herramienta operativa para Avicell y futuras
sucursales, preservando una evolución SaaS sin pagar anticipadamente el costo de
una plataforma para miles de tenants. Las decisiones aceptadas ya fijan:

- monolito modular y ownership lógico por módulo en
  [ADR-002](../proposed/ADR-002-modular-monolith-first.md);
- PostgreSQL 18.x en
  [ADR-003](../proposed/ADR-003-postgresql-primary-database.md);
- base física y esquema lógico compartidos, con denegación por defecto, en
  [ADR-004](../proposed/ADR-004-shared-schema-multitenancy.md);
- NestJS sólo como shell técnico y puertos hacia adentro en
  [ADR-005](../proposed/ADR-005-nestjs-backend.md);
- repositorio único sin package ORM transversal en
  [ADR-009](../proposed/ADR-009-monorepo-strategy.md);
- contexto operativo, identidad, autorización y refuerzo en
  [ADR-010](../proposed/ADR-010-station-bound-operational-context.md),
  [ADR-011](../proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md),
  [ADR-012](../proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md)
  y
  [ADR-013](../proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md).

[DEC-005](../dec-005-modular-monolith-organization/DECISION_PROPOSAL.md) ya
materializó y verificó la frontera de código. DEC-049 no la reabre: define el
contrato de persistencia que deberá respetarla.

## 6. Problema

Una base y un esquema compartidos facilitan la operación inicial, pero también
permiten que una consulta sin scope o un acceso transversal conviertan tablas
internas en una API accidental. Sin un contrato explícito:

- un módulo podría escribir tablas de otro;
- un método genérico podría omitir `tenant_id` o `branch_id`;
- una transacción podría fragmentarse entre conexiones;
- un flujo operativo podría usar por accidente una capacidad administrativa;
- los errores internos de PostgreSQL podrían escapar a presentación;
- los mocks podrían ocultar fallos reales de aislamiento e integridad.

DEC-049 debe elegir el mecanismo de acceso y convertir ownership, scope,
transacciones y excepciones en reglas verificables.

## 7. Drivers

1. Velocidad razonable para el equipo actual.
2. SQL y planes de ejecución comprensibles.
3. Tipado útil con TypeScript sin convertirlo en autoridad de integridad.
4. Aislamiento tenant/sucursal denegado por defecto.
5. Transacciones explícitas y coordinadas por casos de uso.
6. Ownership modular auditable.
7. Compatibilidad con Node.js 24.x, TypeScript 6, ESM y PostgreSQL 18.x.
8. Pruebas reales contra PostgreSQL.
9. Bajo costo de depuración y operación.
10. Evolución modular sin lock-in innecesario.

## 8. Restricciones

- Una base física y un esquema lógico compartidos.
- Ninguna consulta ordinaria cross-tenant.
- Controllers, dominio y aplicación no conocen SQL, driver o query builder.
- Ningún módulo importa infraestructura o repositorios de otro.
- No existe modo operativo ordinario “sin tenant”.
- La autoridad final de invariantes estructurales pertenece a PostgreSQL.
- DEC-050 conserva migraciones; DEC-044 conserva taxonomía y mapeo HTTP de
  errores; DEC-051 conserva gates y herramientas de pruebas.
- Esta propuesta no crea módulos, tablas, schemas, migraciones, conexiones,
  consultas, dependencias ni PBI de materialización.

## 9. Hechos conocidos

- La baseline aceptada usa Node.js `24.x`, TypeScript `6.0.3`, ESM/NodeNext,
  NestJS `11.x` y PostgreSQL `18.x`.
- `tenancy`, `stations` y `access` son los módulos actuales verificados; los
  demás nombres son contextos probables, no módulos autorizados.
- El contexto efectivo se deriva en servidor de una estación vinculada y no de
  un tenant o sucursal enviados por el cliente.
- La documentación de Kysely lo define como query builder SQL tipado, con
  dialecto PostgreSQL, ESM y SQL visible; su metadata oficial actual declara
  Node.js `>=22` y prueba TypeScript 6. La compatibilidad exacta se revalidará al
  fijar versiones.
- `node-postgres` soporta ESM y pool. Su documentación exige usar el mismo
  cliente para todas las sentencias de una transacción.
- La auditoría legado muestra SQL embebido, límites de mutación distribuidos,
  joins operativos por tenant/sucursal y garantías de concurrencia
  insuficientes. Es evidencia del riesgo, no un diseño a copiar.

Fuentes técnicas primarias consultadas:

- [Kysely — sitio oficial](https://www.kysely.dev/).
- [Kysely — metadata oficial](https://github.com/kysely-org/kysely/blob/master/package.json).
- [node-postgres — ESM](https://node-postgres.com/features/esm).
- [node-postgres — pooling](https://node-postgres.com/features/pooling).
- [node-postgres — transactions](https://node-postgres.com/features/transactions).
- [node-postgres — parameterized queries](https://node-postgres.com/features/queries).

## 10. Supuestos

- R0 opera en un único proceso backend y una base PostgreSQL primaria.
- No se requiere transacción distribuida, microservicio, sharding ni réplica de
  lectura.
- El volumen inicial permite priorizar claridad sobre optimización especulativa.
- Las operaciones administrativas SaaS serán pocas, sensibles y separables.
- Los contextos futuros definirán su ownership antes de materializar tablas.
- La recomendación de librerías no autoriza instalarlas; las versiones exactas
  se fijarán y verificarán en una materialización posterior autorizada.

## 11. Opciones consideradas

### Opción A — ORM con repositorios por módulo

Entidades mapeadas, repositorios por módulo y transacciones del ORM. Acelera
CRUD simple, pero agrega estado y convenciones capaces de ocultar SQL, scope,
joins, carga y límites transaccionales. Sus entidades pueden filtrarse hacia el
dominio y favorecer un modelo anémico o un `BaseRepository<T>`.

### Opción B — Query builder tipado con repositorios explícitos

Kysely como query builder, dialecto PostgreSQL respaldado por `pg`, repositorios
de escritura por agregado, query services por caso de uso y transaction context
explícito. Mantiene SQL visible y resultados tipados sin imponer identity map,
change tracking o un modelo de entidades.

Esta opción admite un híbrido controlado: `sql`/driver directo únicamente
dentro de infraestructura del módulo owner y tras cumplir el escape hatch de
la [sección 28](#28-escape-hatches).

### Opción C — Driver SQL directo con capa propia

`pg`, SQL parametrizado y helpers mínimos. Ofrece máximo control y menor
lock-in, pero obliga a construir y mantener tipado, composición, mapping,
ergonomía y disciplina transaccional propios. El riesgo de helpers genéricos
inseguros crece con el número de consultas.

## 12. Matriz comparativa

Escala: 1 desfavorable, 3 adecuada, 5 favorable para el contexto de R0.

| Criterio | A — ORM | B — query builder | C — driver |
| --- | ---: | ---: | ---: |
| Velocidad CRUD inicial | 5 | 4 | 2 |
| SQL y debugging transparentes | 2 | 5 | 5 |
| Tipado de consultas/resultados | 4 | 5 | 2 |
| Aislamiento explícito por scope | 3 | 5 | 4 |
| Transacciones explícitas | 3 | 5 | 4 |
| Constraints PostgreSQL compuestos | 3 | 5 | 5 |
| Testabilidad sin magia | 3 | 5 | 4 |
| Rendimiento predecible | 3 | 5 | 5 |
| Mantenimiento por equipo pequeño | 3 | 5 | 2 |
| Riesgo de abstracción/lock-in | 2 | 4 | 5 |
| ESM/Node/TypeScript/PostgreSQL | 4 | 5 | 5 |
| Costo de disciplina propia | 4 | 4 | 2 |
| **Total orientativo** | **39/60** | **57/60** | **45/60** |

La puntuación no sustituye el juicio: B gana porque combina transparencia y
tipado con menor superficie propia que C y menos semántica implícita que A.
Migraciones no diferencian esta decisión porque su herramienta pertenece a
DEC-050.

## 13. Decisión recomendada

La autoridad registrada acepta la **Opción B**:

- **Kysely** como query builder tipado;
- dialecto PostgreSQL respaldado por **`node-postgres` (`pg`)**;
- repositorios explícitos de escritura y query services explícitos de lectura;
- contextos de persistencia y transacción pasados explícitamente;
- SQL raw permitido sólo como excepción dentro de infraestructura autorizada;
- pool compartido por la infraestructura de la aplicación, con ciclo de vida y
  límites revisados por Operaciones;
- versiones exactas fijadas y revalidadas durante la materialización.

No se adopta un ORM ni un Unit of Work con change tracking. Tampoco se crea una
capa propia equivalente a un ORM.

## 14. Contratos normativos

Las palabras DEBE, NO DEBE y PUEDE son normativas:

1. Todo acceso operativo DEBE entrar por un puerto propiedad del módulo.
2. Todo acceso tenant-scoped DEBE recibir contexto validado con `tenantId`.
3. Todo acceso branch-scoped DEBE recibir `tenantId` y `branchId` coherentes.
4. Ningún repositorio operativo PUEDE exponer una variante global.
5. Presentación, dominio y aplicación NO DEBEN importar Kysely, `pg`, records de
   persistencia ni transaction handles del driver.
6. La aplicación DEBE decidir la frontera transaccional.
7. Sólo el módulo owner PUEDE escribir o evolucionar sus objetos de base.
8. El acceso administrativo DEBE usar contratos separados y autorización
   reforzada.
9. El SQL raw NO DEBE ser una API pública ni un helper compartido libre.
10. Constraints y pruebas reales DEBEN respaldar los scopes; el tipado no los
    sustituye.

## 15. Ownership

Cada tabla, índice, constraint, trigger, vista y migración tendrá exactamente
un owner lógico. El registro futuro de objetos deberá contener:

| Campo | Regla |
| --- | --- |
| Objeto | Nombre físico estable |
| Módulo owner | Uno y sólo uno |
| Scope | Global, tenant o tenant + sucursal |
| Escritura | Sólo infraestructura del owner |
| Lectura ordinaria | Owner o contrato público del owner |
| Evolución | Owner; revisión del consumidor si rompe contrato |
| Invariantes | Owner de negocio + owner técnico |
| Excepciones | Registro explícito, autoridad, tests y expiración/revisión |

`tenancy`, `stations` y `access` aplicarán estas reglas cuando exista
persistencia autorizada. `customers`, `devices`, `repairs`, `inventory`,
`cash`, `payments`, `warranties`, `attachments` y `audit` son sólo candidatos:
esta decisión no los crea ni asigna tablas inexistentes.

Dos módulos NO DEBEN administrar el mismo objeto. Una constraint que referencia
objetos de dos módulos requiere propuesta del owner de la tabla que la contiene,
revisión del otro owner y compatibilidad documentada; no crea co-ownership.

## 16. Scope tenant/sucursal

| Clase | Contexto obligatorio | Contrato de datos |
| --- | --- | --- |
| Global del sistema | Identidad de servicio/capacidad allowlisted | Ausencia de `tenant_id` justificada y registrada |
| Tenant-scoped | `tenantId` | `tenant_id NOT NULL`; uniques/FKs incluyen tenant cuando protegen aislamiento |
| Tenant + sucursal | `tenantId` + `branchId` | Ambos `NOT NULL`; FK compuesta demuestra que la sucursal pertenece al tenant |
| Administración SaaS | Actor/sesión/capacidad reforzada + motivo/correlación | Contrato y observabilidad separados; nunca repositorio operativo |

Reglas:

- Un dato ordinario sin tenant está prohibido salvo clasificación global
  explícita.
- `tenant_id` forma parte de claves únicas y FKs cuando una colisión o
  referencia entre tenants sea posible.
- `branch_id` forma parte del scope y de constraints cuando la invariante es de
  sucursal. No se agrega por reflejo a datos tenant-wide.
- `station_id` atribuye origen o contexto cuando la semántica lo exige; no es
  una partición universal ni sustituye `branch_id`.
- Una consulta tenant-wide sigue exigiendo `tenantId` y un método cuyo nombre
  haga visible ese alcance.
- Ningún parámetro de cliente puede cambiar el tenant/sucursal efectivos.
- Toda escritura valida scope antes de ejecutar y PostgreSQL lo respalda con
  constraints donde sea estructuralmente posible.

## 17. Contexto

La aplicación construirá un `PersistenceContext` inmutable a partir del
`OperationalContext` ya autenticado y autorizado:

- `tenantId`, siempre para operación tenant;
- `branchId`, cuando el caso y los datos son branch-scoped;
- identidad de usuario, estación y sesión para atribución cuando aplique;
- `correlationId`;
- capacidad/propósito administrativo sólo en el contrato administrativo.

El middleware/adaptador de entrada puede validar y preparar el contexto; el caso
de uso decide el scope requerido y lo pasa explícitamente al puerto. El
repositorio valida presencia y coherencia, pero no reconstruye autoridad desde
headers o payload.

`AsyncLocalStorage` PUEDE propagar correlación y metadatos técnicos después de
la validación. NO PUEDE ser la única fuente de tenant/sucursal, autorización o
transaction handle. El contexto no se cambia durante un caso de uso y no se
reutiliza entre requests, jobs o transacciones.

Los jobs construyen un contexto de servicio explícito por unidad de trabajo. Un
repositorio operativo no puede operar sin el scope que su contrato declara.

## 18. Repositorios

- Repositorios de escritura se organizan por agregado o autoridad de mutación,
  no por tabla, DTO o CRUD.
- Query services/puertos de lectura se organizan por caso de uso y devuelven
  proyecciones mínimas.
- Un write repository devuelve agregados, value objects o resultados de
  dominio; no devuelve records Kysely/`pg`.
- Un read service devuelve DTOs/proyecciones del contrato público; no filtra
  tablas o columnas internas.
- El mapping record ↔ dominio ocurre en infraestructura del módulo owner.
- Se prohíben `BaseRepository<T>`, repositorios genéricos, métodos CRUD públicos
  (`findAll`, `saveAny`, `deleteWhere`) y exposición de `db`, query builder o
  transaction client.
- Una consulta ad hoc PUEDE existir como método nombrado y scopeado dentro del
  owner. Si se vuelve contrato estable, debe promoverse a query service/puerto.
- Los repositorios no autorizan, no eligen tenant y no contienen reglas de
  presentación.

## 19. Transacciones

- El caso de uso/capa de aplicación es la autoridad de la frontera
  transaccional.
- Infraestructura expondrá un `TransactionRunner` estrecho que ejecuta una
  función con un `TransactionContext` explícito.
- Los repositorios participantes reciben ese contexto y usan la misma conexión.
- Un repositorio NO DEBE iniciar, confirmar o revertir una transacción
  independiente cuando ya participa en un caso de uso.
- No se adopta un Unit of Work genérico con seguimiento de cambios. El runner
  sólo coordina atomicidad y propagación.
- Una operación cross-module dentro de la misma base puede coordinar puertos
  públicos en una transacción si los owners aceptan la invariante; no accede a
  sus tablas.
- Se prohíben transacciones distribuidas y transacciones que esperan interacción
  humana o I/O remoto.
- Rollback ocurre ante error; reintentos por serialización/deadlock pertenecen a
  aplicación y sólo se permiten con operación idempotente y política acotada.
- Timeouts, isolation level y límites del pool serán explícitos por clase de
  operación y revisados por Operaciones durante la materialización.

## 20. Cross-module reads

Regla por defecto: **ningún módulo consulta directamente tablas de otro para
lógica operativa ordinaria**.

Orden de preferencia:

1. servicio público de aplicación del owner;
2. puerto/query service de lectura propiedad del owner;
3. proyección o vista de lectura con owner único;
4. evento para información asincrónica que no exige consistencia inmediata;
5. acceso directo excepcional, sólo lectura.

La excepción debe registrar consumidor, owner, propósito, objetos/columnas,
scope, consistencia, autorización, tests, observabilidad y fecha de
revisión/expiración. No puede escribir, importar infraestructura del owner ni
convertirse en un query builder compartido.

## 21. Administración global

Las consultas globales ordinarias y los métodos operativos sin scope quedan
prohibidos.

Una operación cross-tenant requiere:

- caso administrativo SaaS explícito;
- capacidad dedicada y, según ADR-013, reautenticación, motivo o segundo
  aprobador;
- interfaz/repository administrativo separado;
- implementación y composición separadas de los repositorios operativos;
- allowlist de operaciones, columnas y scopes;
- auditoría de actor, propósito, filtros, resultado y correlación;
- pruebas negativas que demuestren que código tenant no puede resolverla.

La materialización deberá evaluar un rol de base y/o pool separado. DEC-049 no
lo impone sin evidencia operativa, pero prohíbe inyectar un repositorio
administrativo donde se espera uno operativo.

## 22. Integridad

PostgreSQL es la autoridad final de invariantes estructurales:

- `NOT NULL`, `CHECK`, `UNIQUE` y `FOREIGN KEY` protegen estructura y scope;
- constraints compuestas preservan pertenencia tenant/sucursal;
- versión optimista es el default recomendado para agregados mutables con
  riesgo de edición concurrente;
- locks pesimistas sólo se justifican por contención o serialización demostrada;
- idempotency keys y uniques protegen reintentos/doble envío;
- folios, inventario, pagos y transiciones de reparación requieren contratos
  propios antes de materializar sus garantías;
- autorización y reglas de dominio se validan en código, sin duplicar en SQL
  aquello que no sea una invariante estructural estable.

## 23. Errores

Infraestructura traduce errores de Kysely/`pg` a una taxonomía estable antes de
salir del adaptador:

| Evento de persistencia | Resultado estable |
| --- | --- |
| Unique violation | Conflicto/idempotencia ya satisfecha según caso |
| Foreign key violation | Referencia inválida o conflicto de integridad |
| Check/not-null violation | Invariante de persistencia incumplida |
| Serialization failure/deadlock | Conflicto transitorio potencialmente reintentable |
| Timeout/cancelación | Dependencia no disponible/timeout estable |
| Versión no coincide | Conflicto de concurrencia |
| Sin fila esperada | `NotFound` o resultado vacío según contrato |
| Error desconocido | Error interno sanitizado con correlación |

No se exponen SQLSTATE, mensajes, SQL, nombres internos ni stack traces a
controllers o usuarios. DEC-044 definirá la taxonomía transversal y el mapeo
HTTP; esta decisión sólo fija la frontera de traducción de persistencia.

## 24. Testing

Mínimos obligatorios para la materialización:

- unit tests de mapping y contratos sin pretender validar PostgreSQL con mocks;
- integration tests contra PostgreSQL 18.x real;
- dos tenants y al menos dos sucursales, incluyendo identificadores lógicos
  coincidentes;
- lecturas y escrituras negativas cross-tenant/cross-branch;
- pertenencia sucursal↔tenant y constraints compuestas;
- commit, rollback y participación de varios repositorios;
- concurrencia optimista, uniques, idempotencia y reintentos autorizados;
- contratos de lectura cross-module;
- separación y denegación de repositorios administrativos;
- sanitización/traducción de errores;
- lifecycle del pool y liberación del cliente transaccional.

DEC-050 definirá pruebas de migración y DEC-051 las herramientas, comandos,
frecuencia y gates. La suite de
[aislamiento multitenant](../../quality/MULTITENANT_ISOLATION_TESTING.md) es
normativa como inventario de riesgos, no evidencia ejecutada.

## 25. Observabilidad

Cada operación de persistencia debe emitir señales estructuradas y sanitizadas:

- módulo owner;
- nombre estable de operación/query, no SQL completo;
- clase de scope;
- IDs de tenant/sucursal/usuario/estación/sesión sólo cuando sean necesarios y
  permitidos;
- agregado u objeto lógico;
- duración, filas/resultados agregados y outcome;
- clase estable de error;
- `correlationId` y correlación transaccional cuando aplique.

Nunca se registran PIN, credenciales, secretos, valores SQL, payload completo,
PII innecesaria ni connection strings. Métricas deben permitir detectar
timeouts, errores, pool agotado, reintentos y denegaciones sin crear un canal
lateral de datos.

## 26. Seguridad

- Denegación por defecto en construcción, autorización, repositorio y
  constraints.
- Queries parametrizadas; concatenación de valores queda prohibida.
- Credenciales y roles de base aplican mínimo privilegio.
- Código tenant no recibe interfaces administrativas.
- El contexto efectivo procede del servidor y es inmutable.
- Los datos retornados se minimizan según el contrato público.
- SQL raw y excepciones se revisan por Seguridad.
- Una prueba positiva nunca sustituye pruebas negativas de aislamiento.
- La ausencia de RLS no reduce estos controles.

## 27. RLS

RLS queda **diferida como defensa secundaria candidata**, no seleccionada ni
rechazada definitivamente.

R0 estará cubierto por contexto explícito, filtros scopeados, ownership,
interfaces separadas, constraints compuestas, mínimo privilegio y pruebas
negativas. RLS no reemplazaría ninguno.

Antes de adoptarla se requieren [SPIKE-002 y SPIKE-003](../../reviews/sprint-00/PROTOTYPE_CANDIDATES.md):
el primero demuestra el patrón shared-schema y el segundo evalúa RLS con el
mecanismo de acceso/pooling ya seleccionado. Una decisión futura deberá fijar
roles, `SET LOCAL`/contexto por transacción, políticas, bypass administrativo,
pool safety, migraciones, observabilidad y pruebas. No se habilita RLS por
inferencia desde DEC-049.

## 28. Escape hatches

Reporting, BI, administración, migraciones, mantenimiento, recuperación y
soporte sólo pueden usar un escape hatch si existe:

1. interfaz explícita y no inyectable en operación ordinaria;
2. owner y propósito;
3. autorización/capacidad y refuerzo cuando corresponda;
4. scope y columnas allowlisted;
5. queries parametrizadas;
6. auditoría y correlación;
7. pruebas positivas y negativas;
8. revisión de Seguridad/Operaciones;
9. fecha de revisión o condición de retiro.

El SQL raw queda dentro de infraestructura del módulo owner o herramienta
operativa autorizada. Se prohíbe `db.raw()` o equivalente disponible
globalmente. Migraciones y recuperación no usan credenciales ni interfaces de
runtime ordinario.

## 29. Consecuencias

### Positivas

- Ownership y escrituras quedan atribuibles.
- Scope tenant/sucursal es visible y verificable.
- SQL, planes y transacciones permanecen depurables.
- El tipado reduce errores de columnas/resultados sin fingir integridad.
- Auditoría y administración SaaS se separan de operación.
- Los módulos pueden evolucionar sin convertir tablas en APIs.

### Negativas

- Más código explícito y mappings.
- Mayor disciplina en nombres y contratos.
- Pruebas de integración reales más costosas que mocks.
- Proyecciones de lectura pueden duplicar modelos.
- Excepciones y ownership requieren registro y revisión.
- El equipo debe dominar SQL y comportamiento transaccional de PostgreSQL.

## 30. Riesgos y mitigaciones

| Riesgo | Mitigación verificable |
| --- | --- |
| Bypass por SQL raw | Imports restringidos, allowlist, revisión y test de arquitectura |
| Scope omitido | Contexto obligatorio en firma, builder/helper owner-scoped, constraints y tests negativos |
| Contexto implícito o stale | Argumento inmutable por caso; ALS no autoritativo; tests de requests/jobs concurrentes |
| Transaction handle mal propagado | Runner estrecho, misma conexión, prohibición de tx internas y test de rollback |
| Repositorios demasiado grandes | Por agregado; separar query services; revisión de superficie pública |
| Lecturas cross-module ocultas | Regla de imports, registry de excepciones y tests de arquitectura |
| Abstracción excesiva | Prohibir base/genérico/UoW; revisar cada helper por owner y scope |
| Fuga de records de infraestructura | Tipos internos y contract tests de puertos |
| Pool agotado o cliente filtrado | Límites/timeouts, `finally`, métricas y pruebas de lifecycle |
| Error PostgreSQL expuesto | Mapper central por adaptador y pruebas de sanitización |
| RLS asumida como solución total | Mantener controles de aplicación/DB y spike previo |
| Drift entre tipos y schema | DEC-050 define generación/verificación; integración real detecta drift |

## 31. Alternativas descartadas

- **ORM como default (A):** descartado para recomendación porque sus entidades,
  relaciones y unidad de trabajo agregan semántica implícita donde el riesgo
  principal exige scope, SQL y transacciones visibles. No hay evidencia de que
  el ahorro CRUD compense ese costo.
- **Driver directo como default (C):** descartado porque obliga al equipo a
  construir tipado y composición propios, con más superficie para helpers
  inseguros. Se conserva sólo como sustrato de Kysely y escape hatch.
- **Repositorio genérico:** descartado porque borra agregado, owner, scope y
  lenguaje de caso de uso.
- **Acceso directo cross-module:** descartado como regla ordinaria porque
  convierte tablas en contratos no gobernados.
- **RLS como defensa primaria inmediata:** descartada para R0 sin los spikes,
  roles, pool safety y operación requeridos.

## 32. Decisiones diferidas

- Schema completo, nombres finales y tablas de Reparaciones.
- Herramienta y formato de migraciones (DEC-050).
- Runner, gates y CI de pruebas (DEC-051).
- Taxonomía completa y mapeo HTTP de errores (DEC-044).
- Versiones exactas de Kysely/`pg` y configuración del pool.
- Rol/pool administrativo físicamente separado.
- Adopción de RLS y políticas concretas.
- Outbox, eventos completos, cache, réplicas, particionamiento, sharding, CQRS,
  event sourcing y microservicios.
- Hosting, backup, retención, warehouse/BI e interfaz final de super admin.
- PBI y diseño de materialización.

## 33. Enforcement futuro

Una materialización posterior deberá proponer reglas ejecutables para:

- impedir imports de Kysely/`pg` fuera de infraestructura autorizada;
- impedir `BaseRepository`, repositorios genéricos y raw SQL libre;
- exigir ownership del repository/adapter dentro del módulo;
- impedir imports y acceso a infraestructura cross-module;
- limitar imports intermodulares a APIs públicas;
- separar contratos operativos y administrativos;
- exigir contexto en puertos scopeados;
- verificar que una excepción esté en registry;
- detectar records de persistencia en APIs públicas;
- ejecutar suites de aislamiento y transacción contra PostgreSQL.

Estos criterios no autorizan modificar el checker de DEC-005 en esta tarea.

## 34. Criterios de aceptación

- [x] Tres opciones completas comparadas.
- [x] Tecnología y alternativa recomendadas.
- [x] Repositorios, mapping y queries ad hoc gobernados.
- [x] Owner único de objetos de base definido.
- [x] Scopes global, tenant, tenant+sucursal y administrativo definidos.
- [x] Contexto explícito e inmutable definido.
- [x] Queries globales ordinarias prohibidas.
- [x] Administración SaaS y cross-module reads separados.
- [x] Autoridad transaccional y propagación definidas.
- [x] Integridad, concurrencia, errores, tests y observabilidad definidos.
- [x] RLS, raw SQL y escape hatches gobernados.
- [x] Riesgos con mitigaciones verificables.
- [x] Diferidos y enforcement futuro explícitos.
- [x] Revisión técnica multidisciplinaria documentada en
  [FORMAL_REVIEW.md](FORMAL_REVIEW.md).
- [x] Aprobación explícita de Arquitectura e Ingeniería por el Responsable del
  Proyecto el 2026-07-24.
- [x] Conformidades explícitas de Seguridad, Operaciones y Calidad por el
  Responsable del Proyecto el 2026-07-24.
- [x] Condiciones DEC049-C01 a DEC049-C08 aceptadas como obligaciones de la
  futura materialización, sin marcarlas cumplidas.

## 35. Dependencias

| Relación | Estado |
| --- | --- |
| ADR-002/003/004/005/009 | Satisfechas; imponen módulos, PostgreSQL, scope, shell y topología |
| ADR-010/011/012/013 | Satisfechas; imponen contexto, identidad y autorización |
| DEC-004 | Selección satisfecha; evidencia final independiente no impide este dictamen |
| DEC-005 / PBI-022 | Materializada, formalmente verificada / `Done` |
| DEC-007 | Materialmente respondida por ADR-004 |
| DEC-044 | Paralela; recibe frontera de traducción de errores |
| DEC-050 | Posterior; recibe owner y límites de migraciones |
| DEC-051 | Posterior; recibe contratos que debe verificar |
| DEC-063 | Posterior a DEC-051 |

Documentos de apoyo:

- [Arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md).
- [Modelo multitenant](../../architecture/MULTITENANCY_MODEL.md).
- [Ownership de dominio](../../domain/OWNERSHIP_MATRIX.md).
- [Puertos y repositorios candidatos](../../architecture-readiness/repair-mvp/PUERTOS_Y_REPOSITORIOS_CANDIDATOS.md).
- [Límites transaccionales](../../architecture-readiness/repair-mvp/LIMITES_TRANSACCIONALES.md).
- [Política de migraciones](../../operations/MIGRATION_POLICY.md).
- [Estrategia de observabilidad](../../architecture/OBSERVABILITY_STRATEGY.md).

## 36. Impacto en R0

DEC-049 queda cerrada para H0 por aceptación explícita. El conteo cambia de
cuatro H0 cerrados y cinco abiertos a **cinco H0 cerrados y cuatro abiertos**.
La aceptación habilita preparar DEC-050 y satisface la entrada de persistencia
de DEC-051; no autoriza código, materialización, R0, Sprint 00, merge ni deploy.

R0 continúa **no autorizado**. Los remanentes de DEC-004, DEC-044, DEC-051,
DEC-063, los H1 aplicables, el cierre de Sprint 00/gate sucesor y la
autorización organizacional conservan su autoridad.

## 37. Siguiente acción

Trabajar **DEC-044 — estrategia de errores** como siguiente gate concreto de
R0. DEC-051 necesita los contratos aceptados de DEC-049 y DEC-044; DEC-063
depende de DEC-051; y VC-024 de la evidencia final de DEC-004 también depende
de DEC-051. La ratificación Linux nativa de DEC-004 puede avanzar en paralelo
bajo su propia autoridad.

Las condiciones DEC049-C01 a DEC049-C08 deben trasladarse sin cambios a una
futura materialización autorizada. En esta tarea no se crea ese PBI ni se
instala Kysely/`pg`.
