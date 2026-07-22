# Modelo multitenant

## Restricción central

**[RDD]** Toda operación y lectura debe ocurrir bajo un tenant inequívoco. La sucursal añade alcance operativo, pero no sustituye el tenant. El aislamiento no puede depender sólo de filtros voluntarios en la interfaz de usuario.

## Contexto mínimo

| Elemento | Fuente confiable | Uso | Clasificación |
| --- | --- | --- | --- |
| Tenant | Derivado de la sucursal vinculada a la estación | Partición y autorización | RDD, ADR-010 |
| Sucursal | Vinculación de la estación mantenida del lado del servidor | Folios, configuración y operación | RDD, ADR-010 |
| Estación | Identidad técnica y estado vigentes en el servidor | Origen físico y alcance | RDD, ADR-010 |
| Actor | Usuario autenticado dentro del tenant efectivo y su sesión válida | Auditoría y permisos | RDD, ADR-011 |
| Correlación | Generada por el sistema | Diagnóstico e idempotencia | DAR |

## Reglas de diseño

1. **[DAR]** El contexto se resuelve una vez en el borde confiable y se propaga explícitamente.
2. **[DAR]** Repositorios, consultas, cachés, archivos, eventos y trabajos incluyen aislamiento.
3. **[DAR]** Las identidades externas no bastan para autorizar acceso a una entidad.
4. **[DAR]** Pruebas negativas intentan acceso cruzado por identificador, búsqueda, archivo y tarea asíncrona.
5. **[R]** Los roles de soporte o plataforma no reciben bypass implícito.

## Cobertura transversal

| Elemento | Readiness mínimo | Estado | Clasificación |
| --- | --- | --- | --- |
| Datos de negocio | Pertenencia explícita a tenant | Aceptado en ADR-004; falta aplicar/probar | RDD |
| Datos de sucursal | Regla de pertenencia por tipo de dato | Aceptado en ADR-004; falta aplicar/probar | RDD |
| Usuarios/roles/permisos | Usuario ordinario con alcance tenant y acceso verificable | Identidad/autenticación conceptual aceptadas; mecanismo/permiso bloqueante | PB |
| Políticas/catálogos | SaaS global, extensión tenant y ajuste permitido por sucursal | Niveles aceptados; resolución/versionado bloqueante | PB |
| Folios | Alcance de unicidad y concurrencia | Bloqueante de Recepción | PB |
| Archivos | Tenant/sucursal, autorización y rutas opacas | Propiedad aceptada; estrategia bloqueante antes de evidencia | PB |
| Sesiones | Contexto tenant/sucursal/estación y una sesión activa por estación | Semántica aceptada; mecanismo y pruebas bloqueantes | PB |
| Auditoría/consultas | Filtro obligatorio y prueba negativa | Bloqueante antes de producción | RDD |
| Índices conceptuales | Tenant como prefijo de búsquedas/únicos cuando aplique | Bloqueante al diseñar persistencia | DAR |
| Trabajos en segundo plano | Contexto explícito y deduplicación | Bloqueante al introducirlos | DAR |
| Notificaciones | Resolución de tenant y minimización de datos | Diferible con la integración | DD |

## Decisiones aceptadas por ADR-004

- **[RDD]** Un tenant es la organización y frontera obligatoria de aislamiento; una sucursal pertenece exactamente a un tenant.
- **[RDD]** La topología inicial usa una base y esquema compartidos con aislamiento lógico; no usa base, esquema o despliegue por tenant.
- **[RDD]** Todo dato con alcance tenant conserva tenant explícito; todo dato con alcance sucursal conserva además sucursal coherente.
- **[RDD]** El usuario ordinario pertenece exactamente a un tenant, puede rotar mediante estaciones autorizadas de sus sucursales y no se duplica por sucursal.
- **[RDD]** El cliente operativo pertenece a una sucursal y no se fusiona automáticamente entre sucursales.
- **[RDD]** La Orden conserva tenant y sucursal de origen inmutables y no se traslada.
- **[RDD]** SaaS, tenant y sucursal tienen niveles de propiedad explícitos para catálogos, precios y configuración.
- **[RDD]** Repositorios, trabajos en segundo plano, cachés, eventos, archivos, reportes y auditoría deben preservar el contexto aplicable.

## Decisiones aceptadas por ADR-010

- **[RDD]** La estación vinculada determina tenant y sucursal de toda operación ordinaria.
- **[RDD]** El usuario pertenece al tenant, no a una sucursal permanente, y puede rotar sin duplicar cuenta.
- **[RDD]** El PIN identifica dentro del tenant ya resuelto; no selecciona contexto ni concede permisos.
- **[RDD]** Reubicar una estación exige desvincular y volver a vincular; el cierre de usuario conserva la vinculación.
- **[RDD]** Comandos, consultas, eventos y auditoría preservan tenant, sucursal, estación, usuario y sesión cuando corresponde.

## Decisiones aceptadas por ADR-011

- **[RDD]** El PIN se evalúa únicamente dentro del tenant efectivo y nunca determina tenant o sucursal.
- **[RDD]** Una estación mantiene como máximo una sesión operativa activa y una sesión inválida no acepta acciones nuevas.
- **[RDD]** Cambio de turno, cierre e inactividad no alteran la vinculación de estación.
- **[RDD]** La atribución histórica conserva tenant, sucursal, estación, usuario, sesión, fecha y hora.
- **[RDD]** Autenticación y autorización son responsabilidades distintas.

## Decisiones que siguen bloqueando

1. **[PB]** ¿Cómo se implementan protección del PIN, sesión, intentos, recuperación y propagación de revocación respetando ADR-010/011?
2. **[PB]** ¿Qué roles y permisos habilitan cada capacidad dentro del contexto efectivo?
3. **[PB]** ¿El folio es único por tenant, sucursal o global?
4. **[PB]** ¿Qué políticas admiten ajuste por sucursal y cuál es su precedencia ejecutable?
5. **[PB]** ¿Una Orden abierta conserva versión o instantánea cuando cambia la política?
6. **[PB]** ¿Qué estrategia concreta gobierna archivos, soporte y consultas administrativas?
7. **[PB]** ¿Se evaluará RLS después de aceptar PostgreSQL y con qué alcance?

## Estado de ADR

**[ADR]** [ADR-004](../../decisions/proposed/ADR-004-shared-schema-multitenancy.md) fija base/esquema compartidos, propiedad e aislamiento; [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md) fija el contexto operativo por estación; [ADR-011](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) fija identidad, PIN y sesión. Motor, RLS, mecanismos técnicos de autenticación y enrutamiento de ADR-008 permanecen sin aceptar.

## Gate

**[R]** El contexto e identidad/sesión mínimos ya están acordados; no debe escribirse persistencia real hasta definir sus mecanismos y la estrategia de pruebas de aislamiento, además de los demás hitos H0/H1.
