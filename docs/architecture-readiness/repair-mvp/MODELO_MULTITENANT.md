# Modelo multitenant

## Restricción central

**[RDD]** Toda operación y lectura debe ocurrir bajo un tenant inequívoco. La sucursal añade alcance operativo, pero no sustituye el tenant. El aislamiento no puede depender sólo de filtros voluntarios en la interfaz de usuario.

## Contexto mínimo

| Elemento | Fuente confiable | Uso | Clasificación |
| --- | --- | --- | --- |
| Tenant | Sesión/membresía verificada | Partición y autorización | RDD |
| Sucursal | Alcance permitido en la sesión | Folios, configuración y operación | RDD |
| Actor | Identidad autenticada y atribución operativa | Auditoría y permisos | RDD |
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
| Usuarios/roles/permisos | Usuario ordinario con alcance tenant y acceso verificable | Propiedad aceptada; mecanismo/permiso bloqueante | PB |
| Políticas/catálogos | SaaS global, extensión tenant y ajuste permitido por sucursal | Niveles aceptados; resolución/versionado bloqueante | PB |
| Folios | Alcance de unicidad y concurrencia | Bloqueante de Recepción | PB |
| Archivos | Tenant/sucursal, autorización y rutas opacas | Propiedad aceptada; estrategia bloqueante antes de evidencia | PB |
| Sesiones | Tenant y sucursal activa inequívocos | Bloqueante | PB |
| Auditoría/consultas | Filtro obligatorio y prueba negativa | Bloqueante antes de producción | RDD |
| Índices conceptuales | Tenant como prefijo de búsquedas/únicos cuando aplique | Bloqueante al diseñar persistencia | DAR |
| Trabajos en segundo plano | Contexto explícito y deduplicación | Bloqueante al introducirlos | DAR |
| Notificaciones | Resolución de tenant y minimización de datos | Diferible con la integración | DD |

## Decisiones aceptadas por ADR-004

- **[RDD]** Un tenant es la organización y frontera obligatoria de aislamiento; una sucursal pertenece exactamente a un tenant.
- **[RDD]** La topología inicial usa una base y esquema compartidos con aislamiento lógico; no usa base, esquema o despliegue por tenant.
- **[RDD]** Todo dato con alcance tenant conserva tenant explícito; todo dato con alcance sucursal conserva además sucursal coherente.
- **[RDD]** El usuario ordinario pertenece exactamente a un tenant, puede rotar entre sucursales habilitadas y no se duplica por sucursal.
- **[RDD]** El cliente operativo pertenece a una sucursal y no se fusiona automáticamente entre sucursales.
- **[RDD]** La Orden conserva tenant y sucursal de origen inmutables y no se traslada.
- **[RDD]** SaaS, tenant y sucursal tienen niveles de propiedad explícitos para catálogos, precios y configuración.
- **[RDD]** Repositorios, trabajos en segundo plano, cachés, eventos, archivos, reportes y auditoría deben preservar el contexto aplicable.

## Decisiones que siguen bloqueando

1. **[PB]** ¿Cómo se resuelven de forma confiable tenant, estación, sucursal activa y actor?
2. **[PB]** ¿Cómo se vincula/reubica una estación y cómo cambia el turno o contexto sin conservar alcance anterior?
3. **[PB]** ¿Qué roles y permisos habilitan a un usuario para cada sucursal asignada?
4. **[PB]** ¿El folio es único por tenant, sucursal o global?
5. **[PB]** ¿Qué políticas admiten ajuste por sucursal y cuál es su precedencia ejecutable?
6. **[PB]** ¿Una Orden abierta conserva versión o instantánea cuando cambia la política?
7. **[PB]** ¿Qué estrategia concreta gobierna archivos, soporte y consultas administrativas?
8. **[PB]** ¿Se evaluará RLS después de aceptar PostgreSQL y con qué alcance?

## Estado de ADR

**[ADR]** [ADR-004](../../decisions/proposed/ADR-004-shared-schema-multitenancy.md) está `Accepted` y fija base/esquema compartidos, propiedad lógica e invariantes. El motor, RLS, el contexto operativo y el enrutamiento por subdominio de ADR-008 permanecen sin aceptar.

## Gate

**[R]** No debe escribirse persistencia real hasta acordar el contexto mínimo y la estrategia de pruebas de aislamiento.
