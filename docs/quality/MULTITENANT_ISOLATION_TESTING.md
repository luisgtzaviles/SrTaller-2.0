# Pruebas de aislamiento multitenant

## Estado del documento

- **Estado:** Propuesta
- **Prioridad:** Control crítico de seguridad y calidad.
- **Modelo bajo evaluación:** Base y esquema compartidos con `tenant_id`, con Row-Level Security de PostgreSQL como posible defensa adicional.
- **Decisión pendiente:** Implementación exacta de enforcement, RLS, herramientas y gates.

## Objetivo

Demostrar de forma repetible que una identidad, sesión, dispositivo, job o conexión de un tenant no puede leer, modificar, inferir, recibir ni afectar recursos de otro tenant, incluso cuando conoce o manipula identificadores.

Las pruebas validan el modelo descrito en [Multitenancy Model](../architecture/MULTITENANCY_MODEL.md); no se limitan a comprobar que la interfaz oculta datos.

## Invariantes

1. Toda operación tenant-scoped posee contexto de tenant validado en servidor.
2. El hostname no sustituye validación de membresía/identidad.
3. `tenant_id` nunca se toma como autoridad sólo porque lo envía el cliente.
4. `branch_id` pertenece al tenant y respeta el alcance autorizado.
5. Identificadores válidos de otro tenant no cambian una denegación segura.
6. Jobs, caché, rooms realtime, archivos, logs y exportaciones conservan aislamiento.
7. Operaciones globales de plataforma son explícitas, privilegiadas y auditadas; no son un bypass reutilizable.
8. Un error no revela existencia, contenido ni metadatos innecesarios de otro tenant.

## Dataset mínimo reproducible

| Entidad | Tenant Alfa | Tenant Beta |
|---|---|---|
| Sucursales | Alfa Norte, Alfa Sur | Beta Centro |
| Usuarios | propietario, usuario limitado, usuario sin sucursal | administrador, usuario limitado |
| Identidad entre tenants (condicional) | Si el modelo multi-tenant se aprueba: una identidad global con membresías y permisos separados | Si se rechaza: identidades distintas y un intento de segunda membresía que debe fallar sin fuga |
| Dispositivos | activo Norte, activo Sur, revocado | activo Centro, revocado |
| Recursos | clientes, reparaciones, inventario, mensajes, archivos y pagos sintéticos | equivalentes con IDs distintos |
| Asincronía | jobs/eventos válidos, duplicados y sin contexto | equivalentes |

Los nombres son alias de prueba, no datos reales. El dataset debe poder recrearse sin copiar producción.

## Matriz base de acceso

Para cada recurso tenant-scoped y operación `list/read/create/update/delete/export/subscribe`, validar:

| Contexto | Resultado esperado |
|---|---|
| Actor de Alfa sobre recurso autorizado de Alfa | Permitido según rol y sucursal. |
| Actor de Alfa sin permiso sobre Alfa | Denegado y auditado cuando corresponde. |
| Actor de Alfa sobre ID válido de Beta | Denegado sin fuga de contenido. |
| Actor de Alfa manipulando `tenant_id` a Beta | Denegado; el cliente no redefine contexto. |
| Actor de Alfa usando hostname de Beta | Denegado si no tiene membresía; contexto no mezclado. |
| Actor con membresías Alfa/Beta, sólo si se aprueba ese modelo | Debe seleccionar/resolver contexto explícito; permisos no se heredan entre membresías. Si el modelo se rechaza, el alta/uso cruzado debe denegarse sin revelar el otro tenant. |
| Sucursal Alfa Norte sobre recurso restringido a Alfa Sur | Denegado o permitido sólo por permiso explícito validado. |
| Sesión/dispositivo revocado | Denegado aunque token, socket o caché previos existan. |
| Sin contexto tenant | Fail closed; sólo operación global explícita puede continuar. |

El caso de una identidad con varias membresías es una bifurcación de prueba, no un requisito de producto. La suite debe conservar el aislamiento con cualquiera de las dos decisiones documentadas en [Identity, Access and Permissions](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md).

El código HTTP o detalle exacto de error queda pendiente; debe evitar enumeración y seguir un contrato consistente.

## Superficies de prueba

### Resolución y API

- Host válido, desconocido, deshabilitado y manipulado.
- Host del tenant A con token de B y viceversa.
- IDs de B en path, query, body, filtros, relaciones y operaciones masivas de A.
- Paginación, búsqueda, conteos, agregados, autocompletado, reportes y exportaciones sin filas/metadatos ajenos.
- Errores y tiempos que no revelen existencia cuando el riesgo lo justifique.
- Operaciones de platform administration separadas y auditadas.

### Persistencia y repositorios

- Todas las lecturas y escrituras tenant-scoped requieren contexto explícito.
- Relaciones compuestas no permiten asociar entidades de tenants distintos.
- Actualización/borrado por ID afecte cero filas fuera del tenant.
- Consultas globales sólo desde caminos privilegiados identificados.
- Concurrencia y transacciones no mezclan contexto entre requests.
- Si se adopta RLS, probar políticas con roles de aplicación reales, `INSERT/UPDATE/DELETE`, pooling y ausencia/fallo de contexto; no tratar RLS como reemplazo del control de aplicación.

### Sucursal

- `branch_id` de otro tenant siempre se rechaza.
- Cambio de sucursal no conserva datos, filtros o permisos del contexto anterior.
- Usuario multibranch sólo accede al conjunto autorizado.
- Dispositivo vinculado a una sucursal no amplía el permiso personal del usuario.

### Jobs, eventos y workers

- Payload sin tenant, con tenant inválido o en conflicto falla cerrado y es observable.
- Reintentos conservan el tenant original; no reutilizan contexto de otro job.
- Jobs concurrentes de A/B no comparten estado mutable.
- Dead-letter/replay, scheduling y backfills exigen contexto y autorización operativa.
- Idempotency keys incluyen namespace suficiente para evitar colisión entre tenants.

### Redis y caché

- Claves, locks, rate limits, sesiones y cachés incluyen namespace de tenant cuando corresponde.
- Misma clave lógica de A/B produce valores independientes.
- Invalidar A no elimina ni expone B.
- Cache hit no omite autorización vigente; revocación se propaga dentro del objetivo TBD.
- Flush o comandos globales quedan restringidos a operación controlada.

### Realtime y mensajería

- Handshake autentica tenant; hostname, token y membresía concuerdan.
- Rooms incluyen tenant y conversación; conocer nombre/ID ajeno no permite unirse.
- Eventos de A nunca llegan a sockets de B, incluso con reconexión o cambio de contexto.
- Revocación, logout o cambio de membresía expulsa/inhabilita según política TBD.
- Indicadores de escritura, presencia, estados y conteos también son datos aislados.
- Webhooks deduplicados no colisionan entre tenants/canales.

### Archivos y storage

- Namespace y metadatos incluyen tenant validado.
- URLs firmadas o descargas verifican actor y tenant, no sólo posesión del enlace.
- Listados, previews, derivados y borrado no cruzan prefijos.
- Un nombre de objeto manipulado no escapa del namespace.
- Procesamiento asíncrono y antivirus futuro conserva contexto.

### Logs, observabilidad y soporte

- Logs incluyen identificador de tenant no sensible para investigación, sin contenido de clientes, PIN o secretos.
- Dashboards/alertas y herramientas de soporte respetan alcance.
- Correlation IDs no permiten consultar trazas de otro tenant a actores no autorizados.
- Impersonation o soporte privilegiado, si se aprueba, debe ser explícito, temporal y auditado.

## Técnicas de prueba propuestas

- Casos parametrizados reutilizados por repositorio y endpoint.
- Generación de pares `actor/resource` permitidos y prohibidos.
- Mutation/negative testing sobre identificadores y hosts.
- Pruebas de concurrencia para contaminación de contexto.
- Contract tests para eventos, jobs y sockets.
- Revisión estática de rutas que omiten el contexto de tenant.
- Pruebas de regresión por cada vulnerabilidad o bug de aislamiento.

Las herramientas y adopción de property-based testing quedan por evaluar.

## Gates

- La suite esencial se ejecutará en pull requests que afecten contexto, persistencia o superficies compartidas.
- La suite ampliada se ejecutará antes de promover el candidato.
- Cualquier acceso cruzado confirmado bloquea release y activa gestión de seguridad/incidente según impacto.
- Una prueba inestable de aislamiento no se ignora: se corrige o se mantiene el release bloqueado con una mitigación formal aún por definir.
- Evidencia registra dos tenants, versión/digest, ambiente y casos negativos sin datos sensibles.

## Riesgos específicos

- Filtrado manual omitido en una ruta nueva.
- Contexto de request reutilizado por asincronía o pooling.
- Claves de caché o idempotencia sin tenant.
- Rooms o topics construidos sólo con ID de conversación.
- URLs de archivos consideradas autorización suficiente.
- Operación “administrativa” que se vuelve bypass general.
- Tests que usan un solo tenant y producen falsa confianza.
- RLS mal configurado o conexión privilegiada que ignora políticas.

## Preguntas abiertas

- ¿Se adoptará RLS y para qué tablas/roles, tras qué prueba de concepto?
- ¿Qué respuesta evita enumeración sin perjudicar operación y soporte?
- ¿Cómo se seleccionará contexto para usuarios con varias membresías?
- ¿Cuál será el objetivo de propagación de revocación a cachés y sockets?
- ¿Qué funciones exactas tendrá soporte de plataforma y cómo se controlará su acceso?
- ¿Qué herramienta ejecutará pruebas de concurrencia y generación de casos?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** aprobación del modelo multitenant/repositorios o antes de implementar el primer endpoint tenant-scoped.
- **Documentos relacionados:** [Identity, Access and Permissions](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [Branch and Device Model](../architecture/BRANCH_AND_DEVICE_MODEL.md), [Security Testing](./SECURITY_TESTING.md), [QA Evidence Template](./QA_EVIDENCE_TEMPLATE.md).
