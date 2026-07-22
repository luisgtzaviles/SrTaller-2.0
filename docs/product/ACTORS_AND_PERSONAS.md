# Actores y personas preliminares

## Estado del documento

- **Estado:** Borrador inicial.
- **Naturaleza:** Hipótesis de actores y contextos de uso; no define roles, permisos ni estructura laboral definitiva.
- **Aprobación:** El contexto de usuario/estación se rige por ADR-010; actores, roles, permisos y responsabilidades permanecen pendientes.
- **Datos personales ficticios:** No se utilizan nombres, biografías ni características no confirmadas.

## Distinciones necesarias

- Un **actor** representa una relación con el sistema; no equivale necesariamente a un puesto laboral.
- Un **rol de autorización** es una agrupación de permisos. No debe deducirse automáticamente del nombre de un actor.
- Un usuario ordinario pertenece a un tenant y puede rotar entre sucursales mediante estaciones vinculadas; roles, permisos y variaciones de responsabilidad siguen pendientes.
- “Cliente” en este documento significa cliente del taller; las aplicaciones consumidoras de la API se denominan clientes técnicos.

Las capacidades permitidas se definirán en [Identity, Access and Permissions](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), no en este documento.

## Propietario del taller

- **Responsabilidades — hipótesis:** supervisar el negocio, definir políticas operativas y revisar resultados del tenant.
- **Objetivos — hipótesis:** comprender desempeño, controlar riesgos y mantener continuidad entre sucursales.
- **Alcance de acceso — pendiente:** podría requerir visibilidad de todo el tenant, pero no se asume acceso irrestricto ni cotidiano a todos los datos.
- **Posibles restricciones:** acciones sensibles con autenticación reforzada; separación entre propiedad comercial y administración técnica; privacidad del personal y clientes.
- **Preguntas pendientes:** ¿propietario y administrador del tenant pueden ser personas distintas? ¿qué acciones sólo puede aprobar el propietario? Véanse [QUESTION-004](./OPEN_QUESTIONS.md#question-004) y [QUESTION-010](./OPEN_QUESTIONS.md#question-010).

## Administrador del tenant

- **Responsabilidades — hipótesis:** administrar configuración, usuarios, acceso, sucursales y estaciones dentro del tenant.
- **Objetivos — hipótesis:** mantener la operación habilitada y los accesos alineados con las responsabilidades reales.
- **Alcance de acceso — pendiente:** tenant completo para funciones administrativas específicas; no implica permiso sobre toda información operativa o financiera.
- **Posibles restricciones:** no administrar la plataforma global; no elevar sus propios privilegios sin control; acciones críticas auditadas.
- **Preguntas pendientes:** ¿quién crea al primer administrador? ¿puede delegar administración por sucursal? Véanse [QUESTION-005](./OPEN_QUESTIONS.md#question-005) y [QUESTION-010](./OPEN_QUESTIONS.md#question-010).

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

## Usuario con permisos personalizados

- **Responsabilidades — hipótesis:** cumplir una combinación de funciones que los roles predefinidos no representen.
- **Objetivos — hipótesis:** acceder sólo a las capacidades necesarias para su trabajo real.
- **Alcance de acceso — pendiente:** permisos evaluados dentro del contexto tenant/sucursal/estación/usuario/sesión de ADR-010/011, sin asignación permanente de sucursal.
- **Posibles restricciones:** combinaciones incompatibles, privilegios sensibles, cambios a su propia autorización y complejidad de soporte.
- **Preguntas pendientes:** ¿se permitirán roles personalizados, permisos directos o ambos? ¿cómo se evita una combinación peligrosa? Véase [QUESTION-010](./OPEN_QUESTIONS.md#question-010).

## Cliente del taller

- **Responsabilidades — hipótesis:** proporcionar información y autorizaciones necesarias, recibir comunicaciones y cumplir acuerdos de entrega o pago.
- **Objetivos — hipótesis:** conocer el estado de su equipo, tomar decisiones informadas y conservar evidencia de la operación.
- **Alcance de acceso — pendiente:** sólo su información o casos mediante un mecanismo todavía no definido; no se confirma un portal de autoservicio.
- **Posibles restricciones:** verificación de identidad, consentimiento, privacidad de terceros, enlaces temporales y datos internos del taller.
- **Preguntas pendientes:** ¿interactuará directamente con la plataforma? ¿qué información puede consultar o corregir? Véanse [QUESTION-018](./OPEN_QUESTIONS.md#question-018), [QUESTION-019](./OPEN_QUESTIONS.md#question-019) y [QUESTION-025](./OPEN_QUESTIONS.md#question-025).

## Administrador de la plataforma

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
- **Alcance de acceso:** sin operación ordinaria si no existe vinculación vigente; con ella, limitado además por sesión válida, usuario activo y permisos pendientes.
- **Posibles restricciones:** activación, expiración, revocación, pérdida, cambio de sucursal, cierre remoto y eventual capacidad offline no confirmada.
- **Preguntas pendientes:** ¿qué equipos pueden vincularse y mediante qué flujo? ¿qué puede hacer un dispositivo sin usuario activo? Véanse [QUESTION-008](./OPEN_QUESTIONS.md#question-008), [QUESTION-011](./OPEN_QUESTIONS.md#question-011) y [QUESTION-012](./OPEN_QUESTIONS.md#question-012).

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

## Próxima revisión

Revisar después de entrevistas con representantes del segmento inicial y antes de diseñar el catálogo de permisos o los recorridos de interfaz. **Fecha: TBD.**
