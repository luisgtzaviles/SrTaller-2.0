# Modelo preliminar de multitenancy

## Estado del documento

- **Estado:** Dirección multitenant y contexto operativo aceptados; persistencia física y pruebas pendientes.
- **Naturaleza:** ADR-004, ADR-010, ADR-011 y ADR-012 son autoritativos para propiedad, contexto, identidad/sesión y autorización ordinaria; RLS y mecanismos concretos siguen sujetos a evaluación.
- **Dirección aceptada:** Base y esquema compartidos con aislamiento lógico; motor y Row-Level Security (RLS) pendientes.
- **ADRs relacionados:** [ADR-004](../decisions/proposed/ADR-004-shared-schema-multitenancy.md), [ADR-010](../decisions/proposed/ADR-010-station-bound-operational-context.md) y [ADR-011](../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md), todos `Accepted`.

## Objetivo de seguridad

Una operación de un tenant no debe leer, modificar, inferir, publicar, cachear ni entregar datos de otro tenant, incluso ante errores de programación comunes. El aislamiento abarca persistencia, API, jobs, WebSockets, archivos, caché, logs, reportes, integraciones y operación de soporte.

## Separación de conceptos

- **Tenant candidato:** resultado de resolver el hostname; todavía no concede acceso.
- **Tenant efectivo:** tenant derivado de la sucursal vinculada a la estación y contrastado con el usuario activo.
- **Contexto de tenant:** valor inmutable que acompaña una operación una vez autorizada.
- **Contexto de sucursal:** restricción operativa adicional dentro de un tenant; no reemplaza `tenant_id`.
- **Contexto de plataforma:** operación administrativa global excepcional, separada del flujo de tenant y auditada.

## Resolución del tenant

```mermaid
sequenceDiagram
    actor U as Usuario
    participant S as Estación vinculada
    participant A as API
    participant B as Autoridad de sucursal/estación
    participant I as Identidad

    S->>A: Solicitud con identidad técnica
    A->>B: Validar estación y vinculación
    B-->>A: Sucursal y tenant derivados, o rechazo
    U->>A: Identificación dentro del tenant
    A->>I: Validar usuario y estado en ese tenant
    I-->>A: Usuario válido o rechazo
    A->>A: Construir contexto tenant/sucursal/estación/usuario/sesión
    alt Contexto completo y coherente
        A-->>U: Autorizar por separado y ejecutar
    else No coinciden o contexto ambiguo
        A-->>U: Denegar sin revelar otro tenant
    end
```

### Reglas aceptadas

1. La estación vinculada resuelve una sucursal y de ella deriva un tenant.
2. El usuario se identifica dentro de ese tenant y debe pertenecer exactamente a él.
3. `tenant_id`, `sucursal_id`, estación o actor recibidos desde el cliente no prevalecen sobre el contexto resuelto.
4. Estación desvinculada/revocada, sucursal inactiva, usuario ausente o conflicto fallan de forma cerrada.
5. El nombre de host puede aportar un candidato adicional si ADR-008 se acepta, pero nunca reemplaza la estación.
6. Reubicar una estación exige desvinculación y nueva vinculación; no se muta silenciosamente el contexto.
7. Plataforma, soporte y recursos públicos requieren contextos separados; no caen en un tenant por defecto.

## Propagación del contexto

Un contexto mínimo conceptual contiene:

- `tenant_id` efectivo;
- `branch_id` efectivo;
- identidad de estación;
- usuario autenticado dentro del tenant;
- sesión operativa válida;
- identificador de correlación;
- tipo de contexto: tenant o plataforma.

Debe construirse una vez en un borde confiable y pasarse explícitamente. No se propone una variable global mutable ni se admite que un repositorio lo deduzca del payload.

## Persistencia compartida

### Reglas propuestas

- Toda entidad propiedad de un tenant incluye `tenant_id` obligatorio y no nulo.
- `branch_id` sólo aparece donde el concepto tenga alcance de sucursal y siempre se valida que pertenezca al mismo tenant.
- Referencias entre datos tenant-scoped incluyen o comprueban el tenant común; una coincidencia de ID aislada no basta.
- Claves naturales y restricciones de unicidad se definen con alcance explícito: típicamente `(tenant_id, valor)` y, si corresponde, `(tenant_id, branch_id, valor)`.
- Índices de consultas tenant-scoped comienzan normalmente por `tenant_id`; el orden final depende de patrones medidos.
- Relaciones globales legítimas —por ejemplo catálogo de planes— se modelan y autorizan como globales, no omitiendo accidentalmente `tenant_id`.
- El identificador no debe cambiar de tenant; una transferencia requiere un proceso de negocio explícito o recreación controlada.

Este documento no define tablas, columnas físicas ni migraciones.

## Repositorios conscientes del tenant

La interfaz de un repositorio tenant-scoped debe hacer difícil o imposible consultar sin contexto:

- recibe un `TenantContext` validado o queda construida con ese alcance;
- no ofrece métodos globales genéricos al código operativo;
- aplica `tenant_id` tanto en lectura como en actualización y eliminación;
- valida `branch_id` dentro del mismo tenant;
- rechaza resultados cuyo contexto sea incoherente;
- mantiene separadas las interfaces administrativas globales;
- registra pruebas de contrato de aislamiento.

No basta con recordar añadir un filtro manual en cada consulta.

## Prevención de consultas globales accidentales

Se propone defensa en profundidad:

1. Tipos e interfaces distintas para datos globales y tenant-scoped.
2. Contexto obligatorio en casos de uso y repositorios.
3. Linting o reglas arquitectónicas que impidan usar adaptadores sin alcance.
4. Constraints compuestos que prevengan referencias cruzadas.
5. Pruebas automáticas con al menos dos tenants y datos deliberadamente similares.
6. Revisión de código con checklist multitenant.
7. Evaluación de PostgreSQL RLS como barrera adicional.
8. Credenciales y paths distintos para tareas administrativas excepcionales.

## Evaluación de Row-Level Security

RLS podría limitar filas por una variable de sesión/transacción y reducir el impacto de una consulta que omita el filtro. Antes de aceptarlo se necesita un spike documental/técnico controlado que evalúe:

- propagación segura del tenant en pools de conexiones;
- limpieza del contexto al reutilizar conexiones;
- políticas para lecturas, escrituras, joins y datos globales;
- comportamiento de migraciones, workers y tareas administrativas;
- privilegios que puedan omitir RLS y uso de `FORCE ROW LEVEL SECURITY`;
- compatibilidad con el ORM o query builder propuesto;
- pruebas que demuestren denegación cruzada;
- costo de operación y diagnóstico.

**Decisión pendiente:** RLS no sustituye el contexto en la aplicación ni los filtros conscientes del tenant. Su adopción, alcance y configuración requieren ADR.

## Contexto en superficies no SQL

| Superficie | Regla de aislamiento propuesta |
|---|---|
| Jobs | `tenant_id`, versión, correlación e idempotency key en el envelope; el worker revalida antes de actuar |
| WebSockets | Autorización al conectar y al unirse a cada room; namespace de tenant y conversación/sucursal |
| Caché | Claves con namespace versionado y tenant; nunca una clave sólo por ID de entidad |
| Redis pub/sub | Canales con tenant y tipo de evento; payload mínimo y autorización antes de entrega |
| Archivos | Prefijo o namespace no predecible por tenant más metadatos autoritativos; acceso mediante autorización, no sólo URL |
| Búsqueda y reportes | Índices, exportaciones y consultas siempre particionados por tenant; operaciones globales separadas |
| Logs y trazas | `tenant_id` como contexto controlado, sin incluir secretos ni contenido sensible |
| Webhooks salientes | Destino pertenece al tenant; firma/credencial y cuotas se resuelven desde ese contexto |

## Alcance de sucursal

- Una sucursal pertenece exactamente a un tenant conforme a ADR-004.
- `branch_id` restringe un subconjunto de operaciones; no crea una frontera equivalente a tenant.
- El usuario pertenece al tenant, no a una sucursal permanente; roles/permisos futuros no pueden sustituir la sucursal derivada.
- Una estación se vincula a una sucursal y deriva su tenant conforme al [modelo de sucursal y dispositivo](BRANCH_AND_DEVICE_MODEL.md).
- Transferir datos entre sucursales requiere una regla de negocio por módulo; no se asume permitido.
- Agregados tenant-wide —por ejemplo ciertos reportes— requieren permiso explícito y no eliminan el filtro de tenant.

## Administración de plataforma y soporte

No se propone un “supertenant”. Las operaciones globales deben:

- usar identidad y permisos de plataforma separados de los usuarios ordinarios de tenant;
- requerir justificación y autenticación reforzada para acciones sensibles;
- seleccionar explícitamente el tenant objetivo;
- limitar alcance y duración de la elevación;
- producir auditoría inmutable o protegida según la política futura;
- evitar consultas masivas por defecto;
- impedir que la suplantación de soporte sea invisible para auditoría.

## Pruebas automáticas de aislamiento

La estrategia dedicada está en [Pruebas de aislamiento multitenant](../quality/MULTITENANT_ISOLATION_TESTING.md). Como mínimo, cada superficie debería comprobar:

- mismo ID lógico o datos similares en tenants A y B;
- lectura, búsqueda, paginación, actualización y eliminación cruzadas denegadas;
- referencias de sucursal de otro tenant rechazadas;
- discrepancia estación–tenant–usuario rechazada;
- job y room manipulados no cruzan contexto;
- caché no devuelve resultados de otro tenant;
- archivo o URL de otro tenant no se revela;
- rutas administrativas requieren contexto separado;
- errores y métricas no filtran contenido ajeno.

## Observabilidad del aislamiento

- Métricas agregadas de discrepancias y denegaciones, sin etiquetas de cardinalidad no controlada.
- Logs estructurados con tenant, actor, operación, correlación y resultado, sujeto a minimización.
- Alertas por patrones de autorización anómalos, no por cada error esperado.
- Auditoría de accesos excepcionales de plataforma.
- Trazas que permitan seguir API, job e integración conservando el contexto autorizado.

## Riesgos

- Una consulta sin filtro en esquema compartido puede tener impacto transversal.
- Un pool de conexiones mal configurado puede conservar contexto RLS anterior.
- IDs globalmente únicos pueden dar falsa sensación de aislamiento.
- Caché, archivos, exports y rooms suelen quedar fuera de pruebas centradas sólo en SQL.
- Herramientas de reporting o soporte pueden eludir repositorios seguros.
- Alta cardinalidad de tenant en métricas puede elevar costo o degradar observabilidad.
- Un hostname controlado por el cliente podría usarse como autoridad única.

## Decisiones pendientes

- Aplicar y probar el esquema compartido aceptado con discriminación tenant/sucursal.
- Definir si RLS será obligatoria, selectiva o descartada.
- Aprobar subdominios wildcard y estrategia para dominios personalizados.
- Definir alcance de unicidad y retención por agregado.
- Diseñar acceso de soporte y exportaciones globales.
- Definir estrategia futura de partición o extracción para tenants excepcionales.

## Preguntas abiertas

- ¿Cómo se correlacionará una misma persona entre tenants sin convertir al usuario ordinario en multi-tenant?
- ¿Qué composición concreta de roles y capacidades necesita cada rebanada dentro del contexto y modelo de autorización ya aceptados?
- ¿Existirán usuarios, clientes o catálogos compartidos entre tenants?
- ¿Se permitirán dominios personalizados además de subdominios?
- ¿Qué requisitos regulatorios podrían exigir aislamiento físico o residencia regional?
- ¿Cómo se gestionarán backups, restauraciones o exportaciones de un solo tenant?
- ¿Qué límites de volumen justificarían partición, archivado o estrategia híbrida?

Las respuestas deben consolidarse en [preguntas abiertas](../product/OPEN_QUESTIONS.md) y, cuando cambien la dirección, en un ADR.

## Próxima revisión

- **Momento:** antes de definir cualquier esquema ejecutable o repositorio.
- **Evidencia esperada:** modelo de amenazas, pruebas negativas de ADR-004/010/011/012 y prototipo controlado de RLS sólo si se autoriza.
- **Responsable:** TBD.
