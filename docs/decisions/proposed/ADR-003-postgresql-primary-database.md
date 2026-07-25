# ADR-003 — PostgreSQL como base de datos primaria

**Status: Accepted**
**Fecha:** 2026-07-21
**Autoridad de aceptación:** Arquitectura + Ingeniería
**Revisión obligatoria:** Seguridad + Operaciones

## Estado del documento

Decisión aceptada para el motor relacional transaccional primario de SR Taller 2.0. La ruta histórica bajo `proposed/` se conserva para no romper referencias; el estado dentro de este ADR y el [registro de decisiones](../README.md) son autoritativos.

Este ADR selecciona el motor y gobierna su ciclo de vida. No autoriza implementación, no contiene esquema ejecutable y no selecciona proveedor, topología de replicación, ORM, query builder, driver, librería de migraciones, pooler, extensión, RLS, alta disponibilidad, réplicas de lectura, particionamiento, backup, data warehouse ni plataforma de operación.

## Contexto

El dominio combina relaciones, transacciones, auditoría, consultas operativas y aislamiento multitenant. Requiere una fuente de verdad durable que permita reforzar invariantes mediante transacciones, constraints, integridad referencial e índices, sin acoplar el dominio a herramientas o proveedores concretos.

[ADR-002](ADR-002-modular-monolith-first.md) acepta un monolito modular inicial y una sola base de datos física coordinada. [ADR-004](ADR-004-shared-schema-multitenancy.md) acepta una base física inicial y un esquema lógico compartido, con aislamiento obligatorio por tenant y sucursal. Este ADR decide el motor que soportará esa persistencia; no reabre ni reemplaza ninguna de esas decisiones.

## Fuerzas de decisión

- Integridad relacional y transaccional.
- Controles multitenant y constraints compuestos.
- Consultas operativas, concurrencia y locking explícitos.
- Mantenimiento, actualización, backup, restore y observabilidad.
- Reproducibilidad entre local, CI y ambientes desplegados.
- Portabilidad razonable entre modalidades compatibles con PostgreSQL.
- Ciclo de soporte suficiente para un producto nuevo.

## Opciones consideradas

1. **PostgreSQL 18 fijado dentro del ADR:** ofrece la mayor ventana de soporte para R0, pero haría envejecer una decisión arquitectónica durable por el avance normal de versiones.
2. **PostgreSQL 17 fijado dentro del ADR:** ofrece mayor antigüedad operativa, pero reduce la ventana de soporte y anticipa una actualización major sin una incompatibilidad demostrada con PostgreSQL 18.
3. **PostgreSQL como motor durable y una baseline técnica separada:** mantiene estable el ADR y permite gobernar la major y el minor efectivo mediante un registro técnico enlazado.
4. **MySQL/MariaDB:** alternativa relacional viable, pero sin evidencia documental u operativa que ofrezca una ventaja para las invariantes y el ciclo inicial de SR Taller 2.0.
5. **Base documental o persistencia políglota inicial:** flexibilidad o especialización prematuras a costa de integridad y operación más complejas.

## Decisión

SR Taller 2.0 utilizará PostgreSQL como motor relacional transaccional primario y como fuente autoritativa de los datos operativos durables del producto.

“Primario” significa autoridad transaccional de datos. No significa topología primary/replica, selección de proveedor, alta disponibilidad, réplica de lectura, particionamiento ni data warehouse.

La decisión se aplica a la persistencia transaccional del monolito modular inicial y queda subordinada a las invariantes de ADR-004. Otros almacenes sólo podrán asumir responsabilidades específicas mediante decisiones propias y nunca se consideran aceptados por este ADR.

## Baseline técnica de R0

La línea inicial aprobada para R0 es **PostgreSQL 18.x**. La versión efectiva inicial, vigente al aceptar este ADR, es **PostgreSQL 18.4**.

La línea y versión efectiva se registran en la [baseline técnica de DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md), no como parte inmutable de esta decisión durable. La mención de PostgreSQL 18.4 en este ADR conserva el contexto histórico de aceptación y no inmortaliza ese minor.

- El minor efectivo debe fijarse reproduciblemente en todos los ambientes autorizados.
- El minor puede cambiar mediante mantenimiento normal y controlado.
- Debe mantenerse el minor vigente de la línea soportada, salvo incompatibilidad demostrada y temporal.
- PostgreSQL 19 beta y cualquier prerelease están prohibidos como baseline de R0.
- PostgreSQL 17 sólo puede usarse como fallback por incompatibilidad demostrable de proveedor, driver o tooling con PostgreSQL 18, mediante excepción temporal documentada y aprobada por Arquitectura + Ingeniería, con revisión de Seguridad y Operaciones.

## Política de soporte y actualizaciones

### Líneas soportadas

- Sólo se utilizarán versiones major oficialmente soportadas por PostgreSQL.
- No se iniciará una nueva baseline sobre una major próxima a EOL.
- El plan de salida comenzará como máximo doce meses antes del fin de soporte.
- Los ambientes autorizados operarán sobre la misma major y versiones efectivas controladas.
- No se presumirá compatibilidad automática de backups, restores, extensiones o herramientas entre majors.

### Actualizaciones minor

Las actualizaciones minor son la vía ordinaria de corrección y seguridad. Toda actualización incluirá, según el riesgo:

- revisión de release notes;
- pruebas de integración;
- pruebas de migraciones;
- pruebas de aislamiento multitenant;
- pruebas de backup y restore;
- validación de compatibilidad de driver y tooling;
- promoción controlada;
- plan de reversión, recuperación o roll-forward.

Una vulnerabilidad crítica puede activar una vía acelerada, pero no elimina pruebas mínimas, respaldo ni evidencia de recuperación.

### Actualizaciones major

Toda actualización major requiere decisión explícita de Arquitectura + Ingeniería, con revisión obligatoria de Operaciones y Seguridad, e incluye:

- análisis de compatibilidad y cambios incompatibles;
- revisión de driver, ORM o query builder cuando existan;
- verificación de extensiones;
- backup comprobado y restore ensayado;
- procedimiento reproducible de migración;
- pruebas de rendimiento, integridad y aislamiento cross-tenant;
- estrategia de rollback o roll-forward;
- ventana y responsables operativos.

Una actualización major no se tratará como un simple reemplazo de binarios.

## Relación obligatoria con ADR-004

La persistencia en PostgreSQL conserva como obligatorio:

- una base física inicial;
- un esquema lógico compartido;
- `tenant_id` obligatorio y no nulo en datos tenant-scoped;
- `tenant_id` y `sucursal_id` obligatorios y coherentes en datos locales;
- servidor como autoridad del contexto;
- denegación por defecto;
- repositorios tenant-aware;
- filtros tenant explícitos;
- constraints que refuercen tenant y sucursal;
- pruebas negativas cross-tenant sobre persistencia real.

Este ADR prohíbe introducir durante el MVP una base por tenant o un esquema por tenant, confiar en `tenant_id` aportado por el cliente, depender sólo de UUID globales o sustituir la autorización contextual de [ADR-012](ADR-012-tenant-roles-capabilities-and-contextual-authorization.md).

## Row-Level Security

RLS queda **pendiente de spike y como defensa adicional opcional**.

- No forma parte obligatoria de R0.
- No bloquea el primer recorrido de persistencia si las invariantes de ADR-004 se demuestran mediante aplicación, repositorios, constraints y pruebas.
- No puede ser la única defensa tenant.
- No sustituye filtros tenant explícitos, autorización contextual ni pruebas cross-tenant.

Antes de adoptar RLS, un spike autorizado validará al menos:

- rol de aplicación sin privilegios de bypass;
- propietario de tablas y `FORCE ROW LEVEL SECURITY`;
- contexto tenant con alcance transaccional y sin estado residual;
- compatibilidad con pooling;
- jobs, migraciones, administración y soporte;
- lecturas, escrituras, joins y errores;
- rendimiento;
- integración con el mecanismo de acceso a datos seleccionado.

Un resultado válido del spike es rechazar RLS.

## Política de extensiones

Ninguna extensión queda aceptada por seleccionar PostgreSQL. R0 no tiene una necesidad documentada que justifique seleccionar extensiones concretas.

Toda extensión futura registrará:

- necesidad, alternativas y propietario;
- versión, soporte y ciclo de vida;
- disponibilidad en local, CI, staging y producción;
- compatibilidad con backup, restore y actualización major;
- impacto de seguridad, rendimiento y portabilidad;
- procedimiento de eliminación o migración.

Una extensión no puede sustituir lógica de dominio, constraints esenciales, aislamiento multitenant, autorización ni trazabilidad. Las funciones propietarias de un proveedor se tratan como decisión explícita de lock-in aunque no sean formalmente extensiones.

## Pooling y conexiones

Este ADR define principios y no selecciona PgBouncer ni otro producto:

- las conexiones tendrán límites y se prohíben conexiones ilimitadas;
- cada instancia tendrá un presupuesto de conexiones y se reservará capacidad para migraciones y operación;
- el pooling será obligatorio cuando la concurrencia o el ambiente lo requieran;
- existirán timeouts apropiados de conexión, adquisición, operación, lock e inactividad transaccional;
- la saturación producirá cola acotada, backpressure o rechazo controlado;
- los retries serán limitados y dependerán del tipo de error;
- se observarán conexiones activas, espera, saturación, locks, transacciones largas y fugas;
- no se conservará tenant o sucursal en estado de sesión reutilizable sin limpieza demostrada;
- cualquier RLS futura será compatible con el método de pooling.

Seleccionar un pooler externo requiere decisión posterior.

## Proveedor y portabilidad

ADR-003 es neutral respecto del proveedor:

- se prefiere semántica estándar de PostgreSQL;
- la major y configuración esencial serán reproducibles en local y CI;
- los proveedores se evaluarán por versiones, regiones, conexiones, upgrades, backups, restore, observabilidad y exportación;
- se evitan características propietarias salvo decisión explícita;
- se conserva una ruta razonable de salida.

Neutralidad no significa portabilidad perfecta, soporte simultáneo de varios proveedores, abstracción de todas las capacidades del motor ni migración sin costo.

El proveedor se elegirá cuando existan decisiones suficientes sobre región, residencia de datos, RPO, RTO, carga, presupuesto, operación, responsabilidades y compromisos comerciales.

## Principios de persistencia

- Las transacciones cubren invariantes completas y son tan cortas como razonablemente sea posible.
- Un módulo no muta directamente tablas propiedad de otro.
- Constraints e integridad referencial refuerzan invariantes.
- Claves y unicidad respetan su alcance lógico.
- Los índices responden a consultas y evidencia.
- La concurrencia tiene una estrategia explícita.
- Los locks tienen alcance, orden y timeout controlados.
- Los instantes se almacenan con semántica UTC; la zona operativa se conserva separadamente cuando es relevante.
- SQL directo sólo existe dentro de adaptadores o repositorios propietarios y es parametrizado, tenant-aware, revisado y observable.
- JSONB puede usarse para atributos verdaderamente variables y acotados; no se usa para evitar modelado relacional, constraints o aislamiento.

## Migraciones

ADR-003 no selecciona una herramienta de migraciones. Exige:

- migraciones versionadas y ejecución reproducible;
- evidencia de aplicación y validación de integridad;
- compatibilidad con despliegues coordinados;
- migraciones aplicadas inmutables;
- backfills reiniciables y observables;
- estrategia expand/migrate/contract cuando exista convivencia entre versiones;
- estrategia explícita para migraciones no reversibles.

Al aceptar ADR-003, `DEC-050` continuaba abierta. El 2026-07-24 quedó
[Accepted with conditions](../dec-050-migration-strategy/DECISION_PROPOSAL.md);
su materialización y evidencia permanecen pendientes.

## ORM, query builder, driver y repositorios

ADR-003 no selecciona ORM, query builder, driver, librería de migraciones ni
implementación del repository pattern. Al aceptar este ADR, `DEC-049`
continuaba abierta; el 2026-07-24 quedó
[Accepted](../dec-049-persistence-ownership/DECISION_PROPOSAL.md) con sus
condiciones de materialización vigentes.

Cualquier herramienta futura deberá demostrar:

- soporte para PostgreSQL 18;
- transacciones explícitas;
- acceso tenant-aware y control de queries;
- observabilidad;
- migraciones compatibles;
- ausencia de filtros tenant implícitos e inseguros;
- capacidad para implementar constraints e índices necesarios.

## Escenarios normativos

| Escenario | Resultado |
| --- | --- |
| Tabla tenant-scoped sin `tenant_id` | Prohibido |
| Tabla local sin sucursal | Prohibido |
| Consulta sin filtro tenant | Prohibido |
| Manipulación cross-tenant mediante ID | Prohibido |
| Transacción que cruza módulos mediante acceso directo a tablas | Prohibido |
| Coordinación transaccional explícita entre módulos | Permitida con condición |
| Extensión sin justificación | Prohibida |
| Extensión no reproducible en otro ambiente | Prohibida |
| JSONB para evitar modelado relacional | Prohibido |
| RLS como única defensa tenant | Prohibido |
| Conexiones sin límites | Prohibido |
| Major próxima a EOL como nueva baseline | Prohibida |
| Actualización minor de seguridad | Permitida con condición |
| Actualización major | Requiere decisión |
| Función propietaria de proveedor | Requiere decisión |
| Restore en otro ambiente | Permitido con condición |
| Migración no reversible | Requiere justificación y estrategia |
| Locking concurrente controlado | Permitido con condición |
| Timestamp sin política temporal | Prohibido |
| ORM que oculta tenant | Prohibido |
| Repositorio que acepta `tenant_id` arbitrario del cliente | Prohibido |
| PostgreSQL 19 beta como baseline de R0 | Prohibido |
| PostgreSQL 18.4 como versión efectiva inicial | Permitido |
| Cambio de minor dentro de PostgreSQL 18 | Permitido con validación |
| PostgreSQL 17 por incompatibilidad demostrada | Requiere excepción temporal |

## Autoridad y operación

| Decisión | Autoridad decisora | Revisión obligatoria |
| --- | --- | --- |
| Aceptar ADR-003 | Arquitectura + Ingeniería | Seguridad + Operaciones |
| Cambiar de major | Arquitectura + Ingeniería | Operaciones + Seguridad |
| Aprobar extensión | Arquitectura + Ingeniería y propietario funcional | Seguridad + Operaciones |
| Elegir proveedor | Arquitectura + Operaciones + Ingeniería | Seguridad |
| Cambiar estrategia de pooling | Ingeniería + Operaciones | Arquitectura si cambia semántica |
| Autorizar función propietaria | Arquitectura + Ingeniería + Operaciones | Seguridad |
| Atender EOL | Arquitectura + Ingeniería + Operaciones | Seguridad |
| Responder a vulnerabilidad crítica | Seguridad + Ingeniería + Operaciones | Arquitectura informada |

Producto participa cuando una decisión afecta alcance, coste, mercado, región, residencia, compromisos de servicio o restricciones comerciales.

## Consecuencias positivas

- Fuente transaccional coherente con el dominio y ADR-004.
- Ventana de soporte amplia para un proyecto nuevo.
- Constraints, transacciones e índices adecuados para invariantes y aislamiento.
- Ciclo de vida separado de proveedor y tooling.
- Portabilidad razonable si se evita lock-in no autorizado.

## Consecuencias negativas y riesgos

- Requiere disciplina de índices, conexiones, mantenimiento y actualizaciones.
- Escala y aislamiento no se obtienen automáticamente por elegir el motor.
- Shared-schema aumenta el impacto de una consulta sin contexto.
- Extensiones o características propietarias pueden reducir portabilidad.
- PostgreSQL 18 exige validar compatibilidad del driver y tooling finalmente elegidos.
- Algunas cargas futuras podrían necesitar almacenes especializados mediante decisiones separadas.

## Impacto en decisiones abiertas

- Cierra el motor de persistencia dentro de `DEC-004` y registra PostgreSQL 18.x como baseline de R0.
- Por sí solo no cerró `DEC-004`. Posteriormente, el 2026-07-22, DEC-004 aceptó la selección del toolchain como `Accepted — Selection Approved / Evidence Pending`; materialización, VC-001 a VC-024, evidencia Linux y reproducibilidad final continúan pendientes.
- No cerró `DEC-049` ni `DEC-050` por sí mismo; ambas recibieron después
  decisión propia y conservan condiciones de materialización.
- No autoriza el primer cambio funcional de R0. DEC-004 autoriza únicamente su PBI técnico de materialización y verificación.

## Criterios para reconsiderar

- Evidencia de carga dominante incompatible con PostgreSQL.
- Requisitos regulatorios, regionales o de aislamiento no cubiertos.
- Incompatibilidad sostenida del ecosistema requerido.
- Cambio de topología multitenant aceptado por un ADR posterior.
- Coste u operación que haga inviable la modalidad disponible.

## Referencias

- [Baseline técnica de DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md)
- [Arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md)
- [Modelo multitenant](../../architecture/MULTITENANCY_MODEL.md)
- [Política de migraciones](../../operations/MIGRATION_POLICY.md)
- [Backup y recuperación](../../operations/BACKUP_AND_RECOVERY.md)
- [PBI-011](../../backlog/pbis/PBI-011.md)

## Próxima revisión

Al seleccionar proveedor o acceso a datos, al autorizar un spike de RLS, al acercarse la major efectiva a EOL o ante una incompatibilidad demostrada. Toda revisión conserva las autoridades definidas en este ADR.
