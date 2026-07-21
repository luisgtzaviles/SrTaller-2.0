# Transiciones y precondiciones

## Alcance

Las transiciones documentan condiciones de negocio del flujo validado. No constituyen una máquina de estados definitiva ni prescriben comandos técnicos.

## Catálogo actual y catálogo candidato

Los estados confirmados como usados por SR Taller 1.0 son Pendiente, Listo, No quedó, En espera de refacción, En espera de anticipo y En espera de autorización. En diagnóstico, En reparación y En segunda revisión son términos candidatos cuya adopción permanece abierta.

## Matriz de transiciones operativas

| Origen operativo | Acción | Precondiciones | Resultado de negocio | Estado resultante | Ubicación resultante | Evento requerido | Inconsistencia inválida |
|---|---|---|---|---|---|---|---|
| orden recién recibida | colocar en pendientes | orden creada, custodia e identificación vigentes | queda disponible para toma | Pendiente | pendientes | FOT-EVT-001/002 | equipo sin ubicación |
| pendientes | técnico toma y escanea | identificación legible y sesión válida | orden localizada | sin cambio obligatorio | taller si hubo movimiento | actividad de escaneo; FOT-EVT-002 si se mueve | asumir trabajo iniciado por escaneo |
| revisión técnica | registrar diagnóstico | hallazgos/pruebas atribuibles | conclusión disponible | por definir o En espera de autorización | taller/segunda revisión según flujo | FOT-EVT-003 | diagnóstico sólo en nota |
| servicio exitoso | terminar trabajo | resultado y pruebas documentados | pasa a filtro independiente | todavía no Listo | segunda revisión | FOT-EVT-004/002 | marcar Listo sin revisión |
| servicio no exitoso | solicitar decisión | diagnóstico y conceptos comunicables | espera respuesta | En espera de autorización | ubicación conocida, no inferida | FOT-EVT-003/007 | usar estado como ubicación |
| espera de autorización | registrar aceptación | decisión y conceptos atribuibles | alcance habilitado | estado de trabajo por definir | taller | FOT-EVT-008/002 | trabajar sin autorización |
| espera de autorización | registrar rechazo | decisión y conceptos atribuibles | trabajo no autorizado queda excluido | No quedó | no quedó | FOT-EVT-009/011/002 | borrar hallazgos |
| reparación terminada | enviar a segunda revisión | trabajo y pruebas documentados | inicia filtro | no Listo todavía | segunda revisión | FOT-EVT-004/002 | confundir traslado con aprobación |
| segunda revisión | aprobar | revisor, momento, resultado y criterios | puede marcarse Listo | Listo | listos | FOT-EVT-005/011/002 | aprobar sin revisor |
| segunda revisión | rechazar | fallas y observaciones documentadas | vuelve a taller | no puede permanecer Listo | taller | FOT-EVT-006/011/002 | mantener Listo |
| Listo en tienda | notificar | contacto y resultado registrables | cliente informado o intento fallido | Listo | listos | FOT-EVT-007 | notificación tratada como entrega |
| Listo/No quedó en tienda | entregar | receptor y reglas de cobro/entrega satisfechas | custodia transferida | resultado técnico puede conservarse | salida | FOT-EVT-013 | ubicación interna activa |
| Listo durante prueba al cliente | detectar falla antes de entregar | custodia todavía vigente | vuelve a taller | ya no debe presentarse como listo vigente | taller | FOT-EVT-006 o hecho de falla por definir/002 | marcar Entregado |

## Precondiciones transversales

### Cambio de estado

- usuario autenticado y autorizado;
- estado anterior conocido;
- estado nuevo perteneciente al catálogo aplicable;
- precondición de negocio satisfecha;
- momento y contexto conservados;
- motivo cuando existe excepción o retroceso.

Un cambio de estado no mueve físicamente el dispositivo.

### Movimiento físico

- orden y dispositivo identificables;
- ubicación de origen conocida o excepción explícita;
- ubicación destino válida;
- actor y momento atribuibles.

Un movimiento no cambia automáticamente el estado.

### Asignación técnica

- técnico identificable y elegible según política pendiente;
- alcance o propósito de la asignación;
- asignador y momento;
- conservación de asignaciones anteriores.

Asignar no significa aceptar, iniciar, reparar ni poseer físicamente.

### Marcar Listo

En el flujo Avicell requiere:

- trabajo terminado;
- segunda revisión aprobada;
- actor revisor;
- momento;
- resultado y observaciones;
- ubicación posterior conocida.

La universalidad y excepciones para otros tenants son política pendiente.

### Entrega

- orden localizable;
- dispositivo físicamente localizado;
- persona receptora y legitimación conforme a política pendiente;
- revisión frente al cliente cuando aplica;
- cobro o excepción financiera resueltos conforme a política pendiente;
- usuario que entrega y momento registrados.

Sólo la entrega válida termina custodia.

## Ciclos y retrocesos

Los ciclos Taller → Segunda revisión → Taller son válidos y no cambian la identidad de la orden. Cada iteración debe conservar resultado, participantes y momento; no debe sobrescribir la revisión anterior.

Un retorno desde Listo antes de entregar también conserva custodia y orden. No es un reingreso posterior: el ciclo original todavía no terminó.

## Propuestas

### FOT-PROP-010 — Transiciones explícitas

Validar precondiciones por transición y detectar combinaciones inconsistentes es una propuesta. No se decide implementación, bloqueo, permisos ni catálogo final.

### FOT-PROP-011 — Movimientos como hechos

Representar movimientos físicos relevantes como hechos explícitos es una propuesta. La granularidad, obligatoriedad del escaneo y retención permanecen abiertas.

## Estados inválidos

- Control de calidad rechazado con estado Listo vigente.
- Entregado sin actor interno.
- Listo usado como prueba de cobro o notificación.
- No quedó usado como prueba de salida.
- Reasignación que borra técnico anterior.
- Estado cambiado y ubicación asumida sin movimiento.
- Movimiento realizado y estado cambiado automáticamente sin política.
- Ciclo de retrabajo sobrescrito como si nunca hubiera ocurrido.
