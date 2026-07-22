# Trazabilidad

## Propósito

Este documento conecta los hechos operativos validados con las propuestas, preguntas, auditorías legacy y documentos canónicos todavía en discovery. Una relación no promueve automáticamente el estado de la fuente relacionada.

## Fuentes y autoridad

| Fuente | Autoridad | Uso |
|---|---|---|
| Solicitud de validación del Product Owner, 2026-07-21 | Hechos explícitos del flujo Avicell y necesidades de trazabilidad | fuente primaria de FOT-DEC y escenarios |
| [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md) | Decisión aceptada | fuente autoritativa de tenant/sucursal/estación/usuario efectivos y cambio de turno |
| [ADR-011](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) | Decisión aceptada | fuente autoritativa de identidad, PIN, sesión, usuario activo e inactividad |
| [ADR-012](../../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) | Decisión aceptada | fuente autoritativa de roles de tenant, capacidades, asignaciones, alcance y autorización ordinaria |
| [ADR-013](../../decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md) | Decisión aceptada | fuente autoritativa de niveles sensibles, reautenticación, segundo aprobador, segregación e invalidación |
| Recepción mínima y autorización comercial | Decisiones validadas | nacimiento/fin de custodia, identidad de orden, autorización por concepto y narrativa complementaria |
| Auditoría legacy del detalle | Evidencia de código | estado/custodia, técnico, revisor, seguimientos, anticipos, entrega y defectos |
| Auditoría legacy de recepción | Evidencia de código | actor receptor, sesión/contexto, Pendiente, En tienda y anticipo separado |
| Future State Reception | Propuesta no aprobada | frontera hasta habilitar diagnóstico |
| Dominio general | Discovery no aprobado | vocabulario, actores, estados y eventos candidatos |

## Registro del paquete

| IDs | Contenido | Documento principal |
|---|---|---|
| FOT-DEC-001–010 | recorrido desde recepción hasta entrega | [Flujo operativo](FLUJO_OPERATIVO_ACTUAL_VALIDADO.md) |
| FOT-DEC-011 | separación de dimensiones | [Estado, ubicación y responsabilidad](ESTADO_UBICACION_Y_RESPONSABILIDAD.md) |
| FOT-DEC-012–015 | identidad operativa, roles y participación | [Roles](ROLES_Y_RESPONSABILIDADES_OPERATIVAS.md) |
| FOT-DEC-016/017, FOT-EVT-001–013 | tipos de registro y hechos estructurados | [Eventos, notas y actividad](EVENTOS_NOTAS_Y_ACTIVIDAD.md) |
| FOT-DEC-018–020 | PIN, sesión y atribución | [Trazabilidad por usuario](TRAZABILIDAD_POR_USUARIO.md) |
| FOT-DEC-021–023 | segunda revisión | [Control de calidad](CONTROL_DE_CALIDAD_SEGUNDA_REVISION.md) |
| FOT-DEC-024/025 | áreas y ubicación | [Ubicaciones](UBICACIONES_FISICAS_Y_COLAS_OPERATIVAS.md) |
| FOT-DEC-026–028 | varios técnicos e historial | [Asignación técnica](MODELO_DE_ASIGNACION_TECNICA.md) |
| FOT-DEC-029–032 | anticipos básicos | [Anticipos](ANTICIPOS_Y_TRAZABILIDAD_FINANCIERA_BASICA.md) |
| FOT-PROP-001–020 | interpretaciones y mecanismos pendientes | documentos temáticos del paquete |
| FOT-INV-001–020 | condiciones clasificadas | [Reglas e invariantes](REGLAS_E_INVARIANTES.md) |
| FOT-ESC-001–016 | escenarios mínimos y resultados | [Escenarios](ESCENARIOS.md) |
| FOT-PREG-001–040 | decisiones abiertas | [Preguntas abiertas](PREGUNTAS_ABIERTAS.md) |

## Trazabilidad de interpretaciones propuestas

| Interpretación solicitada | Tratamiento | Estado |
|---|---|---|
| Estado, ubicación y responsabilidad como dimensiones | FOT-PROP-001/004 | propuesta; separación semántica validada |
| Historial de eventos como fuente | FOT-PROP-006 | propuesta; no prescribe Event Sourcing |
| Recibió/reparó/revisó/entregó como proyecciones | FOT-PROP-007/008 | propuesta |
| Eventos, notas y actividad separados | FOT-DEC-016 y FOT-PROP-005 | separación validada; presentación propuesta |
| Segunda revisión como control independiente | FOT-DEC-021–023 | validada en Avicell |
| Áreas configurables por sucursal | FOT-PROP-014 | propuesta |
| Movimientos físicos como hechos | FOT-PROP-011/013 | propuesta |
| Asignación mediante historial | FOT-PROP-016 | propuesta |
| Varios participantes técnicos por contribución | FOT-PROP-017 | propuesta |
| Escaneo abre contexto | FOT-PROP-015 | propuesta basada en práctica validada |
| Entrega termina custodia | FOT-EVT-013 y FOT-INV-005 | validada |
| Entregado no es ubicación interna ordinaria | FOT-PROP-003 | propuesta preferida |
| Evitar Event Sourcing prematuro | límite explícito del paquete | obligatorio |
| Retención diferenciada de actividad | FOT-PREG-017 | abierta |
| Tablas, endpoints y clases | fuera de alcance | no diseñados |

## Relación con recepción mínima y autorización comercial

| Referencia | Relación |
|---|---|
| RMCA-DEC-001/002/007/008 | la orden y custodia ya existen al iniciar este flujo; entrega termina el ciclo |
| RMCA-DEC-004 | tenant, sucursal, usuario receptor, momento y ubicación inicial son contexto de la orden |
| RMCA-DEC-010–013 | la identificación física acompaña al dispositivo durante cada movimiento |
| RMCA-DEC-019–024 | decisiones por concepto, rechazo preservado y narrativa complementaria |
| RMCA-INV-012–015 | autorización atribuible y total/política explicables |
| RMCA-PREG-013/014 | entrega y excepciones reciben aquí mayor detalle, pero no quedan totalmente cerradas |

Este paquete no cambia las políticas comerciales ni la recepción mínima ya validadas.

## Relación con Future State Reception

| Referencia FSR | Relación |
|---|---|
| FSR-EVENT-019/020 | orden y folio creados antes del recorrido técnico |
| FSR-EVENT-022/023 | evidencia posterior o pendiente puede acompañar el inicio operativo |
| FSR-EVENT-024 | completar recepción no equivale a diagnóstico |
| FSR-EVENT-025 | “disponible para diagnóstico” es la frontera de entrada a este flujo |
| FSR-ACTOR-005 | recepción continúa como actor operativo, sin convertir sus permisos en universales |

La propuesta FSR de responsabilidad formal previa a la orden ya fue aclarada por RMCA: no existe custodia formal antes de la creación correcta.

## Trazabilidad con auditoría legacy del detalle

| Evidencia legacy | Aclaración de este paquete |
|---|---|
| LEGACY-RD-FINDING-001 | el campo estado es etiqueta mutable; el catálogo futuro sigue abierto |
| LEGACY-RD-FINDING-002 | estado y custodia son independientes; ahora también se separa ubicación física |
| LEGACY-RD-FINDING-003 | fecha_listo/fecha_entregado son primeras marcas legacy, no estado vigente |
| LEGACY-RD-FINDING-004/005 | notificación y cambio de estado no son un solo hecho; no deben compartir evidencia implícita |
| LEGACY-RD-FINDING-006 | textos de cierre no prueban trabajo, control ni entrega |
| LEGACY-RD-FINDING-007 | técnico textual no conserva identidad, periodos ni historia |
| LEGACY-RD-FINDING-008 | revisor legacy no demuestra segunda revisión |
| LEGACY-RD-FINDING-011 | autorización narrativa no satisface el evento estructurado |
| LEGACY-RD-FINDING-012/013/014 | anticipo aislado y saldo negativo no definen el modelo financiero futuro |
| LEGACY-RD-FINDING-015/016 | actor/fecha de entrega y reversa de En tienda/Entregado son insuficientes |
| LEGACY-RD-FINDING-017 | seguimiento libre conserva contexto pero pierde estructura |
| LEGACY-RD-FINDING-019 | sesión/contexto no reemplazan permiso por acción |
| LEGACY-RD-FINDING-024 | impresión/reimpresión no prueba entrega ni historia original |

## Trazabilidad con auditoría de recepción

| Evidencia | Aclaración |
|---|---|
| Creación fija Pendiente y En tienda | son valores iniciales legacy; no catálogo universal |
| recibido_por desde sesión | coincide con la necesidad validada de saber quién recibió |
| usuario de sesión más tenant/sucursal de estación | forman el contexto efectivo con la estación, pero ADR-012 exige además capacidad, alcance y pertenencia del recurso |
| anticipo en petición separada | una falla de anticipo no deshace orden/custodia; el movimiento necesita historia propia |
| fotos/seguimiento posteriores | actividad posterior, no precondición de creación |

## Relación con dominio general

| Documento/ID | Relación | Acción posterior |
|---|---|---|
| UBIQUITOUS_LANGUAGE: sesión operativa/PIN | ADR-011 fija credencial limitada al tenant, una sesión activa por estación y atribución histórica; controles técnicos siguen abiertos | aplicar sin mezclar autenticación y autorización |
| UBIQUITOUS_LANGUAGE: rol/capacidad | ADR-012 fija rol tenant-scoped, unión de asignaciones y autorización negativa server-side | componer por rebanada sin convertir puestos en permisos |
| UBIQUITOUS_LANGUAGE: acción sensible/refuerzo | ADR-013 fija niveles 1–4, un solo uso, segundo aprobador e invalidación | clasificar por rebanada; auditoría técnica separada |
| UBIQUITOUS_LANGUAGE: asignación técnica | se confirma que no equivale a trabajo ni custodia | refinar periodo, participación y resumen |
| UBIQUITOUS_LANGUAGE: control de calidad/retrabajo | segunda revisión Avicell aporta ejemplo y bucle real | decidir universalidad y vocabulario |
| DOMAIN_ACTORS: Recepcionista/Técnico/Cajero | responsabilidades coinciden parcialmente | no convertir puestos en permisos |
| EVENT-008 WorkOrderAssigned | “responsable operativo” es demasiado amplio frente a asignación técnica | separar asignación de responsabilidad actual |
| EVENT-010–012 | diagnóstico iniciado/completado/inconcluso | alinea con hechos técnicos; escaneo no equivale a inicio |
| EVENT-021 | técnico asignado | alinea, pero necesita historia y asignador |
| EVENT-027–031 | trabajo, control y retrabajo | alinea con el ciclo validado de segunda revisión |
| EVENT-033 | anticipo registrado | alinea con trazabilidad mínima; Caja sigue fuera |
| EVENT-036 | marcado Listo | alinea sólo después de control; no implica entrega |
| EVENT-038 | equipo entregado | alinea con fin de custodia |
| STATE_MACHINES: QualityControl → ReadyForDelivery | compatible con Avicell | universalidad y excepciones abiertas |
| STATE_MACHINES: ReadyForDelivery → Delivered | compatible; entrega y cierre siguen separados | definir legitimación y fin operativo |

## Contradicciones y aclaraciones

1. El legacy llama revisor al primer usuario que guarda un estado no Pendiente; eso no prueba segunda revisión. El futuro necesita un resultado explícito.
2. El campo técnico legacy sobrescribe texto; contradice la necesidad validada de múltiples participantes e historial.
3. En tienda/Entregado está almacenado como campo de entrega/custodia; no identifica pendientes, taller, segunda revisión, listos o no quedó.
4. Los estados legacy pueden combinarse libremente con custodia. La independencia semántica está validada, pero las combinaciones no son automáticamente válidas.
5. Listo puede coexistir válidamente con En tienda; no prueba notificación, cobro ni entrega.
6. No quedó puede coexistir con En tienda; no prueba que la orden salió.
7. Un seguimiento conserva usuario y fecha de captura, pero no sustituye diagnóstico, autorización, control, anticipo o entrega estructurados.
8. El saldo negativo legacy revela falta de coordinación; no es regla financiera futura.
9. DOMAIN_EVENTS permite Técnico/QC como actor de control; Avicell valida recepción como revisor habitual. La autoridad por tipo de reparación permanece abierta.
10. WorkOrderAssigned del dominio general no debe interpretarse como custodia física ni como único responsable operativo.

## Estado de promoción

| Destino | Estado |
|---|---|
| Este paquete | Validado por Product Owner en hechos y alcance indicados |
| Flujo universal multi-tenant | no aprobado; requiere separar políticas Avicell/configurables |
| Dominio general | no promovido; mantiene Draft/Discovery |
| Future State Reception | no aprobado en conjunto |
| Auditorías legacy | evidencia histórica sin sobrescritura |
| Arquitectura técnica | no diseñada |
| Runtime/DB | no inspeccionados ni modificados |

## Regla de mantenimiento

Una decisión posterior debe registrar autoridad, fecha, alcance, elementos sustituidos, escenarios afectados y efecto sobre estado, ubicación, custodia, responsabilidad, participación y trazabilidad. Nunca se modifica una auditoría histórica para simular que el legacy ya cumplía la regla nueva.
