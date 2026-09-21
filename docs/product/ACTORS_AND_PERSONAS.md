# Actores y personas preliminares

## Estado del documento

- **Estado:** Borrador inicial.
- **Naturaleza:** Hipótesis de actores y contextos de uso; no define roles, permisos ni estructura laboral definitiva.
- **Aprobación:** El contexto operativo se rige por ADR-010/011/014,
  autorización ordinaria por ADR-012 y refuerzo por ADR-013. Tenant Lifecycle
  aprueba que la persona inicial sea el primer Tenant User con starter Tenant
  Admin Role; el control plane está aceptado en ADR-015.
- **Datos personales ficticios:** No se utilizan nombres, biografías ni características no confirmadas.

## Distinciones necesarias

- Un **actor** representa una relación con el sistema; no equivale necesariamente a un puesto laboral.
- Un **rol de autorización** es una agrupación de capacidades del tenant. No debe deducirse automáticamente del nombre de un actor.
- Un usuario ordinario pertenece a un tenant, puede rotar entre sucursales mediante estaciones vinculadas y puede tener varios roles; su composición concreta y las responsabilidades de negocio siguen pendientes.
- “Cliente” en este documento significa cliente del taller; las aplicaciones consumidoras de la API se denominan clientes técnicos.

Las capacidades permitidas se definirán en [Identity, Access and Permissions](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), no en este documento.

## Propietario del taller

No existe un agregado comercial `Owner` separado en Tenant Lifecycle MVP. Este
actor describe una relación de negocio posible; la persona inicial se
materializa como Tenant User con autoridad Tenant Admin y no recibe privilegio
por la etiqueta “propietario”.

- **Responsabilidades — hipótesis:** supervisar el negocio, definir políticas operativas y revisar resultados del tenant.
- **Objetivos — hipótesis:** comprender desempeño, controlar riesgos y mantener continuidad entre sucursales.
- **Alcance de acceso — pendiente:** podría requerir visibilidad de todo el tenant, pero no se asume acceso irrestricto ni cotidiano a todos los datos.
- **Posibles restricciones:** acciones sensibles con autenticación reforzada; separación entre propiedad comercial y administración técnica; privacidad del personal y clientes.
- **Dirección MVP:** el starter Role es protegido/system-managed; nunca se
  retira el último Admin efectivo; Admins adicionales requieren invitación de
  email verificado, aceptación y Role assignment autorizado. Las capacidades
  concretas siguen [QUESTION-004](./OPEN_QUESTIONS.md#question-004) y
  [QUESTION-010](./OPEN_QUESTIONS.md#question-010).

## Administrador del tenant

- **Responsabilidades — dirección MVP:** administrar mediante capacidades
  explícitas configuración, usuarios, roles, sucursales y estaciones del
  Tenant dentro del control plane.
- **Objetivos — dirección MVP:** completar onboarding, mantener la operación
  habilitada y los accesos alineados con responsabilidades reales.
- **Alcance de acceso:** Tenant derivado server-side y capacidades
  administrativas efectivas; no implica permiso sobre información operativa o
  financiera ni crea una Operational Session.
- **Posibles restricciones:** no administrar la plataforma global; no elevar sus propios privilegios sin control; acciones críticas auditadas.
- **Decisión vigente:** el bootstrap crea al primer Tenant User y starter
  Tenant Admin Role sin selección de privilegios desde cliente.
- **Decisión vigente:** starter Role system-managed/protegido/versionado,
  guard transaccional de último Admin e invitación verificada con aceptación y
  Role assignment explícito. Scopes concretos por Branch se definen por slice.

## Gerente de sucursal

- **Responsabilidades — hipótesis:** coordinar la operación y el personal de una sucursal.
- **Objetivos — hipótesis:** conocer carga de trabajo, incidencias, existencias y resultados dentro de su alcance.
- **Alcance de acceso — pendiente:** posibles capacidades de supervisión sobre una o varias sucursales, sin cambiar la sucursal efectiva de la estación ni crear pertenencia permanente.
- **Posibles restricciones:** sin acceso automático a otras sucursales; algunas configuraciones, cierres o excepciones podrían requerir nivel tenant.
- **Preguntas pendientes:** ¿una persona puede gestionar varias sucursales? ¿qué acciones requieren supervisor? Véanse [QUESTION-007](./OPEN_QUESTIONS.md#question-007) y [QUESTION-004](./OPEN_QUESTIONS.md#question-004).

## Recepcionista

- **Responsabilidades — hipótesis:** identificar o registrar clientes y equipos, iniciar la recepción y comunicar información operativa.
- **Objetivos — hipótesis:** capturar lo necesario con rapidez y consultar el estado autorizado de una reparación.
- **Alcance de acceso — pendiente:** operaciones de recepción de la sucursal activa y datos mínimos necesarios del cliente.
- **Posibles restricciones:** información financiera, costos internos, ajustes de inventario y cambios sensibles de estado.
- **Preguntas pendientes:** ¿qué datos y evidencia exige la recepción? ¿puede operar casos de otra sucursal? Véanse [QUESTION-003](./OPEN_QUESTIONS.md#question-003), [QUESTION-006](./OPEN_QUESTIONS.md#question-006) y [QUESTION-013](./OPEN_QUESTIONS.md#question-013).

## Técnico

- **Responsabilidades — hipótesis:** diagnosticar, ejecutar o documentar trabajo técnico y actualizar el estado que le corresponda.
- **Objetivos — hipótesis:** disponer de contexto, tareas, partes y autorizaciones necesarias sin exposición de datos ajenos.
- **Alcance de acceso — pendiente:** reparaciones asignadas o visibles en la sucursal y movimientos estrictamente necesarios.
- **Posibles restricciones:** precios, pagos, cajas, configuración, reasignaciones y estados que requieran autorización.
- **Preguntas pendientes:** ¿cómo se asigna una reparación? ¿qué datos del cliente necesita? ¿qué cambios requieren supervisión? Véanse [QUESTION-013](./OPEN_QUESTIONS.md#question-013) y [QUESTION-014](./OPEN_QUESTIONS.md#question-014).

## Vendedor

- **Responsabilidades — hipótesis:** registrar una venta y consultar disponibilidad comercial autorizada.
- **Objetivos — hipótesis:** completar una venta con información consistente de artículos, cliente, pago y entrega.
- **Alcance de acceso — pendiente:** Sales, consulta acotada de Inventory y posiblemente Customers dentro de una sucursal.
- **Posibles restricciones:** costos, ajustes de existencias, devoluciones, descuentos y cierres fuera de umbral.
- **Preguntas pendientes:** ¿la venta independiente de una reparación está dentro del recorrido inicial? ¿cómo se autorizan descuentos y devoluciones? Véanse [QUESTION-003](./OPEN_QUESTIONS.md#question-003), [QUESTION-016](./OPEN_QUESTIONS.md#question-016) y [QUESTION-021](./OPEN_QUESTIONS.md#question-021).

## Cajero

- **Responsabilidades — hipótesis:** registrar pagos y operar una caja durante un turno o sesión.
- **Objetivos — hipótesis:** cobrar, emitir evidencia y cerrar su operación con diferencias visibles.
- **Alcance de acceso — pendiente:** caja asignada, pagos y documentos relacionados dentro de la sucursal activa.
- **Posibles restricciones:** anulación, devolución, ajuste, reapertura y consulta de otras cajas o sucursales.
- **Preguntas pendientes:** ¿qué representa una sesión de caja? ¿qué medios y acciones requieren supervisión? Véanse [QUESTION-021](./OPEN_QUESTIONS.md#question-021) y [QUESTION-022](./OPEN_QUESTIONS.md#question-022).

## Usuario con varios roles

- **Responsabilidades — hipótesis:** cumplir varias funciones sin duplicar identidad ni sesión.
- **Objetivos — decisión aceptada:** acceder a la unión de capacidades de sus roles vigentes dentro del alcance aplicable.
- **Alcance de acceso — decisión aceptada:** asignaciones tenant-wide y, sólo por necesidad explícita, restringidas a la sucursal efectiva conforme a ADR-012.
- **Posibles restricciones:** niveles de ADR-013, cambios a su propia autorización y combinaciones que la política concreta mantenga en nivel 4.
- **Preguntas pendientes:** ¿qué composición mínima necesita cada rebanada y qué acciones exigen control reforzado? Véanse [QUESTION-004](./OPEN_QUESTIONS.md#question-004) y [QUESTION-010](./OPEN_QUESTIONS.md#question-010).

## Cliente del taller

- **Responsabilidades — hipótesis:** proporcionar información y autorizaciones necesarias, recibir comunicaciones y cumplir acuerdos de entrega o pago.
- **Objetivos — hipótesis:** conocer el estado de su equipo, tomar decisiones informadas y conservar evidencia de la operación.
- **Alcance de acceso — pendiente:** sólo su información o casos mediante un mecanismo todavía no definido; no se confirma un portal de autoservicio.
- **Posibles restricciones:** verificación de identidad, consentimiento, privacidad de terceros, enlaces temporales y datos internos del taller.
- **Preguntas pendientes:** ¿interactuará directamente con la plataforma? ¿qué información puede consultar o corregir? Véanse [QUESTION-018](./OPEN_QUESTIONS.md#question-018), [QUESTION-019](./OPEN_QUESTIONS.md#question-019) y [QUESTION-025](./OPEN_QUESTIONS.md#question-025).

## Administrador de la plataforma

Este actor y cualquier Super Admin están fuera del Tenant Lifecycle MVP. No
participan en el registro público ni en el bootstrap autoservicio.

- **Responsabilidades — hipótesis:** operar configuración global, ciclo de vida de tenants, planes y controles de plataforma.
- **Objetivos — hipótesis:** mantener la plataforma disponible, segura y gobernable.
- **Alcance de acceso — pendiente:** funciones globales explícitas; no implica acceso rutinario al contenido operativo de tenants.
- **Posibles restricciones:** separación de funciones, acceso just-in-time, autenticación reforzada y auditoría de toda intervención sensible.
- **Preguntas pendientes:** ¿qué acciones globales existen? ¿quién las autoriza y revisa? Véanse [QUESTION-005](./OPEN_QUESTIONS.md#question-005), [QUESTION-024](./OPEN_QUESTIONS.md#question-024) y [QUESTION-029](./OPEN_QUESTIONS.md#question-029).

## Soporte de la plataforma

- **Responsabilidades — hipótesis:** diagnosticar incidencias, orientar a usuarios autorizados y escalar problemas.
- **Objetivos — hipótesis:** resolver casos con la mínima exposición y con trazabilidad suficiente.
- **Alcance de acceso — pendiente:** metadatos y herramientas de soporte; acceso excepcional y temporal a datos del tenant sólo si se aprueba un proceso.
- **Posibles restricciones:** consentimiento, propósito, tiempo limitado, enmascaramiento, no modificación y revisión posterior.
- **Preguntas pendientes:** ¿qué puede observar soporte sin impersonar? ¿existe acceso de emergencia? Véanse [QUESTION-029](./OPEN_QUESTIONS.md#question-029) y [QUESTION-030](./OPEN_QUESTIONS.md#question-030).

## Servicio externo

- **Responsabilidades — hipótesis:** intercambiar mensajes, pagos, archivos, notificaciones u otros eventos conforme a un contrato autorizado.
- **Objetivos — hipótesis:** entregar o recibir información de forma verificable e idempotente.
- **Alcance de acceso — pendiente:** credenciales y operaciones mínimas por integración, tenant y ambiente cuando corresponda.
- **Posibles restricciones:** rate limits, disponibilidad, reintentos, firma de webhooks, residencia, costos y términos del proveedor.
- **Preguntas pendientes:** ¿qué integraciones son prioritarias? ¿quién posee credenciales, consentimiento y respuesta a fallos? Véanse [QUESTION-019](./OPEN_QUESTIONS.md#question-019), [QUESTION-021](./OPEN_QUESTIONS.md#question-021) y [QUESTION-028](./OPEN_QUESTIONS.md#question-028).

## Estación operativa

- **Tipo:** actor técnico no humano.
- **Responsabilidades — decisión aceptada:** mantener una vinculación verificable con una sucursal, derivar de ella el tenant y presentar identidad de estación en las solicitudes permitidas.
- **Objetivos — decisión aceptada:** habilitar una sesión operativa activa de usuario sin convertirse por sí sola en prueba suficiente para acciones sensibles.
- **Alcance de acceso:** sin operación ordinaria si no existe vinculación vigente; con ella, limitado además por sesión válida, usuario activo, capacidad y alcance conforme a ADR-012.
- **Posibles restricciones:** activación, expiración, revocación, pérdida, cambio de sucursal, cierre remoto y eventual capacidad offline no confirmada.
- **Dirección MVP:** un Admin con capability explícita emite un challenge de
  alta entropía, un uso y TTL de 10 minutos para una Branch concreta; el equipo
  lo canjea sin elegir Tenant/Branch.
- **Control sensible:** issue/revoke/relink son Level 2 con password reauth
  vigente 10 minutos; el canje revalida autoridad/estado/revisions sin pedir
  password al equipo. Lifecycle técnico detallado sigue
  [QUESTION-008](./OPEN_QUESTIONS.md#question-008).

## Contextos que deben validarse en investigación

- taller de una sola sucursal frente a operación multisucursal;
- una persona con varias funciones frente a separación estricta de responsabilidades;
- estación compartida frente a dispositivo personal;
- recepción, mesa técnica, mostrador, caja y supervisión;
- interacción presencial frente a comunicación remota;
- conectividad confiable frente a interrupciones; el modo offline no es un requisito confirmado;
- administración cotidiana frente a acceso excepcional de soporte o plataforma.

## Preguntas abiertas

Las preguntas de cada actor están enlazadas al registro central. Además, falta validar:

- qué actores existen realmente en el segmento inicial;
- cuáles comparten una persona y cuáles requieren separación;
- qué tareas son frecuentes, sensibles, excepcionales o imposibles de delegar;
- qué información necesita cada actor y qué información no debería ver;
- qué actor representa al propietario del producto para aprobar reglas operativas.

Véase [Preguntas abiertas](./OPEN_QUESTIONS.md).

## Documentos relacionados

- [Glosario de dominio](./DOMAIN_GLOSSARY.md)
- [Mapa de módulos](./MODULE_MAP.md)
- [Modelo de identidad, acceso y permisos](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md)
- [Modelo de sucursales y dispositivos](../architecture/BRANCH_AND_DEVICE_MODEL.md)
- [ADR-011 — Identidad, autenticación por PIN y sesión operativa](../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md)
- [ADR-012 — Roles de tenant, capacidades y autorización contextual](../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md)
- [ADR-013 — Acciones sensibles y autorización reforzada](../decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md)

## Próxima revisión

Revisar después de entrevistas con representantes del segmento inicial y antes de componer roles/capacidades por rebanada o diseñar recorridos de interfaz. **Fecha: TBD.**
