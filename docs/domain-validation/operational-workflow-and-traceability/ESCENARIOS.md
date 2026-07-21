# Escenarios operativos

## Convención

Cada escenario conserva estado, ubicación, participantes, acciones, hechos, custodia y riesgos. Los estados candidatos se identifican como tales; no se diseña interfaz ni persistencia.

## FOT-ESC-001 — Cuatro personas en el ciclo

| Aspecto | Descripción |
|---|---|
| Estado inicial | Sin orden formal; después Pendiente al crear correctamente |
| Ubicación inicial | recepción y luego pendientes |
| Participantes | Ana recibe, Bruno diagnostica, Carla repara, Diego entrega |
| Acciones | crear orden, tomar equipo, diagnosticar, reparar, revisar, notificar y entregar |
| Eventos | FOT-EVT-001/002/003/004/005/007/013 |
| Notas | sólo contexto adicional; no sustituyen diagnóstico, control ni entrega |
| Estado final | Listo como resultado técnico conservado |
| Ubicación final | salida; ninguna ubicación interna activa |
| Custodia final | terminada por entrega válida |
| Trazabilidad esperada | recibió Ana; diagnosticó Bruno; reparó Carla; revisor identificado; entregó Diego |
| Inválido/inconsistente | mostrar un único usuario como autor de todo el ciclo |

## FOT-ESC-002 — Equipo mojado resuelto sólo con servicio

| Aspecto | Descripción |
|---|---|
| Estado inicial | Pendiente |
| Ubicación inicial | pendientes |
| Participantes | técnico y recepcionista revisor |
| Acciones | escanear, desarmar, aplicar servicio, probar, armar, registrar seguimiento, mover a segunda revisión |
| Eventos | FOT-EVT-002/003/004/005/011 |
| Notas | observaciones del servicio pueden complementar |
| Estado final | Listo |
| Ubicación final | listos |
| Custodia final | continúa bajo custodia |
| Trazabilidad esperada | técnico, pruebas, resultado, revisor y momento de Listo |
| Inválido/inconsistente | marcar Listo sin segunda revisión o tratar prueba temporal como pieza vendida |

## FOT-ESC-003 — Equipo mojado requiere autorización de pantalla

| Aspecto | Descripción |
|---|---|
| Estado inicial | Pendiente |
| Ubicación inicial | taller |
| Participantes | técnico y recepción |
| Acciones | servicio, pruebas, diagnóstico de pantalla, seguimiento, traslado a segunda revisión y contacto |
| Eventos | FOT-EVT-003/002/007/011 |
| Notas | intento de contacto y contexto, sin sustituir la decisión |
| Estado final | En espera de autorización |
| Ubicación final | segunda revisión u otra ubicación conocida |
| Custodia final | continúa |
| Trazabilidad esperada | técnico del diagnóstico, conceptos propuestos, usuario que contactó y resultado |
| Inválido/inconsistente | inferir ubicación a partir del estado o iniciar reparación sin autorización |

## FOT-ESC-004 — Autorización, reparación y segunda revisión aprobada

| Aspecto | Descripción |
|---|---|
| Estado inicial | En espera de autorización |
| Ubicación inicial | segunda revisión |
| Participantes | recepción registra decisión, técnico repara, recepción revisa |
| Acciones | registrar autorización, mover a taller, reparar, mover a segunda revisión, aprobar, marcar Listo y notificar |
| Eventos | FOT-EVT-008/002/004/005/011/007 |
| Notas | detalle contextual de la conversación, si existe |
| Estado final | Listo |
| Ubicación final | listos |
| Custodia final | continúa |
| Trazabilidad esperada | decisor y registrador, técnico, revisor, notificador y momentos |
| Inválido/inconsistente | autorización sólo en nota o notificar antes de aprobar control |

## FOT-ESC-005 — Cliente no autoriza

| Aspecto | Descripción |
|---|---|
| Estado inicial | En espera de autorización |
| Ubicación inicial | segunda revisión |
| Participantes | cliente decisor y recepción |
| Acciones | registrar rechazo, cambiar estado y mover a No quedó |
| Eventos | FOT-EVT-009/011/002 |
| Notas | motivo o contexto complementario |
| Estado final | No quedó |
| Ubicación final | no quedó |
| Custodia final | continúa En tienda hasta entrega |
| Trazabilidad esperada | conceptos rechazados, decisor, usuario, canal/evidencia, momento y movimiento |
| Inválido/inconsistente | borrar hallazgos o tratar No quedó como Entregado |

## FOT-ESC-006 — Segunda revisión rechaza

| Aspecto | Descripción |
|---|---|
| Estado inicial | pendiente de segunda revisión |
| Ubicación inicial | segunda revisión |
| Participantes | revisor y técnico que recibe retrabajo |
| Acciones | probar, registrar falla, rechazar, mover a taller y reasignar si aplica |
| Eventos | FOT-EVT-006/011/002/012 |
| Notas | observaciones y pruebas complementarias |
| Estado final | estado activo por definir; no Listo |
| Ubicación final | taller |
| Custodia final | continúa |
| Trazabilidad esperada | revisor, resultado, falla, técnico posterior y nueva iteración |
| Inválido/inconsistente | conservar Listo o sobrescribir la revisión fallida |

## FOT-ESC-007 — Dos técnicos participan

| Aspecto | Descripción |
|---|---|
| Estado inicial | Pendiente |
| Ubicación inicial | taller |
| Participantes | Técnico A diagnostica; Técnico B repara |
| Acciones | diagnóstico, cambio/asignación, reparación y registro de contribuciones |
| Eventos | FOT-EVT-003/012/004 |
| Notas | contexto técnico no estructurado, si aporta valor |
| Estado final | pendiente de segunda revisión |
| Ubicación final | segunda revisión |
| Custodia final | continúa |
| Trazabilidad esperada | A como diagnosticador y B como reparador |
| Inválido/inconsistente | mostrar sólo B y perder a A |

## FOT-ESC-008 — Cambio de técnico sin pérdida

| Aspecto | Descripción |
|---|---|
| Estado inicial | Pendiente o trabajo activo según catálogo |
| Ubicación inicial | taller |
| Participantes | técnico anterior, técnico nuevo y asignador |
| Acciones | cambiar asignación y continuar trabajo |
| Eventos | FOT-EVT-012 y posteriores hechos técnicos |
| Notas | motivo del cambio cuando aplica |
| Estado final | sin cambio obligatorio por reasignar |
| Ubicación final | taller |
| Custodia final | continúa |
| Trazabilidad esperada | anterior, nuevo, asignador, momento, motivo y participaciones |
| Inválido/inconsistente | sobrescribir un único campo y borrar historia |

## FOT-ESC-009 — Dos llamadas, dos usuarios

| Aspecto | Descripción |
|---|---|
| Estado inicial | En espera de autorización |
| Ubicación inicial | ubicación conocida bajo custodia |
| Participantes | recepción A intenta; recepción B consigue decisión |
| Acciones | primer contacto sin respuesta; segundo contacto; registrar autorización |
| Eventos | dos FOT-EVT-007 con resultado distinto y FOT-EVT-008 |
| Notas | “volver a llamar mañana” puede ser narrativa contextual |
| Estado final | alcance autorizado; estado de trabajo por definir |
| Ubicación final | taller después del movimiento |
| Custodia final | continúa |
| Trazabilidad esperada | ambos usuarios, momentos, destinatario, resultados y decisor final |
| Inválido/inconsistente | atribuir autorización al primer usuario o usar silencio como aceptación |

## FOT-ESC-010 — Listo falla frente al cliente

| Aspecto | Descripción |
|---|---|
| Estado inicial | Listo |
| Ubicación inicial | listos y luego mostrador |
| Participantes | recepción, cliente y técnico posterior |
| Acciones | probar frente al cliente, detectar falla, no entregar, devolver a taller |
| Eventos | FOT-EVT-006 o hecho de falla por definir, FOT-EVT-011/002 |
| Notas | contexto de la falla observada frente al cliente |
| Estado final | estado activo por definir; no Listo vigente |
| Ubicación final | taller |
| Custodia final | continúa porque no hubo entrega |
| Trazabilidad esperada | quién probó, resultado, momento y devolución a trabajo |
| Inválido/inconsistente | marcar Entregado o conservar Listo sin reconciliación |

## FOT-ESC-011 — Anticipo recibido por otra persona

| Aspecto | Descripción |
|---|---|
| Estado inicial | orden bajo custodia; estado operativo independiente |
| Ubicación inicial | cualquier ubicación interna conocida |
| Participantes | una persona recibió la orden y otra recibió el anticipo |
| Acciones | registrar movimiento financiero relacionado |
| Eventos | FOT-EVT-010 |
| Notas | referencia complementaria cuando aplica |
| Estado final | sin cambio operativo obligatorio |
| Ubicación final | sin movimiento obligatorio |
| Custodia final | continúa |
| Trazabilidad esperada | receptor de orden separado de receptor de anticipo; monto, moneda, sucursal y momento |
| Inválido/inconsistente | atribuir anticipo a quien recibió la orden por defecto |

## FOT-ESC-012 — Movimiento sin cambio de estado

| Aspecto | Descripción |
|---|---|
| Estado inicial | Pendiente |
| Ubicación inicial | pendientes |
| Participantes | técnico que mueve |
| Acciones | tomar y llevar al taller |
| Eventos | FOT-EVT-002; actividad de escaneo si ocurre |
| Notas | ninguna obligatoria |
| Estado final | Pendiente |
| Ubicación final | taller |
| Custodia final | continúa |
| Trazabilidad esperada | origen, destino, usuario y momento |
| Inválido/inconsistente | cambiar estado automáticamente sin política |

## FOT-ESC-013 — Estado cambiado sin movimiento

| Aspecto | Descripción |
|---|---|
| Estado inicial | Pendiente |
| Ubicación inicial | pendientes |
| Participantes | usuario que cambia estado |
| Acciones | marcar En espera de autorización sin mover físicamente |
| Eventos | FOT-EVT-011 |
| Notas | motivo/comunicación si existe, sin sustituir evento |
| Estado final | En espera de autorización |
| Ubicación final | pendientes |
| Custodia final | continúa |
| Trazabilidad esperada | estado anterior/nuevo, actor y momento; ubicación permanece explícita |
| Inválido/inconsistente | mostrar segunda revisión como ubicación inferida o afirmar movimiento realizado |

## FOT-ESC-014 — Escaneo sólo consulta

| Aspecto | Descripción |
|---|---|
| Estado inicial | Pendiente |
| Ubicación inicial | pendientes |
| Participantes | técnico |
| Acciones | escanear y abrir contexto; no tomar ni trabajar |
| Eventos | actividad automática de consulta; no evento de inicio de trabajo |
| Notas | ninguna |
| Estado final | Pendiente |
| Ubicación final | pendientes |
| Custodia final | continúa |
| Trazabilidad esperada | consulta atribuible sólo si la política de retención lo exige |
| Inválido/inconsistente | asignar, mover o iniciar cronómetro automáticamente sin decisión |

## FOT-ESC-015 — Sesión abandonada

| Aspecto | Descripción |
|---|---|
| Estado inicial | cualquiera bajo custodia |
| Ubicación inicial | ubicación conocida |
| Participantes | usuario A deja sesión; usuario B llega |
| Acciones | ninguna acción sensible debe atribuirse a B bajo identidad de A; cierre por inactividad reduce riesgo |
| Eventos | actividad de sesión según política futura; ningún hecho de negocio falso |
| Notas | no aplica |
| Estado final | sin cambio por el abandono |
| Ubicación final | sin cambio |
| Custodia final | sin cambio |
| Trazabilidad esperada | sesión válida y usuario real antes de actuar |
| Inválido/inconsistente | compartir PIN o registrar entrega/anticipo desde sesión ajena |

## FOT-ESC-016 — Entrega distinta de notificación

| Aspecto | Descripción |
|---|---|
| Estado inicial | Listo |
| Ubicación inicial | listos |
| Participantes | recepción A notificó; recepción B entrega |
| Acciones | localizar, probar, cobrar si corresponde y entregar |
| Eventos | FOT-EVT-007 previo y FOT-EVT-013 |
| Notas | comentario relevante de entrega |
| Estado final | Listo como resultado técnico conservado |
| Ubicación final | salida |
| Custodia final | terminada |
| Trazabilidad esperada | A como notificador, B como quien entrega, receptor y momentos separados |
| Inválido/inconsistente | usar al notificador como entregador o mantener ubicación listos activa |

## Cobertura

| Dimensión | Escenarios |
|---|---|
| Participación distribuida | FOT-ESC-001/007–009/016 |
| Flujo mojado y autorización | FOT-ESC-002–005 |
| Control y retrabajo | FOT-ESC-006/010 |
| Anticipos | FOT-ESC-011 |
| Estado y ubicación | FOT-ESC-012/013 |
| Escaneo y atribución | FOT-ESC-014/015 |
