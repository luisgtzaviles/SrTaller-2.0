# Flujo operativo actual validado

## Alcance y autoridad

El recorrido describe la operación confirmada por el Product Owner para Avicell. Los estados y áreas citados reflejan lenguaje operativo actual; su catálogo futuro y configurabilidad permanecen abiertos.

## Decisiones validadas

### FOT-DEC-001 — Recepción atribuible

Cuando se recibe un dispositivo, la orden debe conservar quién lo recibió. Después de crear la orden e identificar físicamente el equipo, éste se coloca en el área designada para pendientes.

### FOT-DEC-002 — Toma y consulta técnica

El técnico toma físicamente el dispositivo del área de pendientes, escanea su identificación y localiza la orden. El escaneo muestra contexto para proceder, pero no demuestra por sí solo que comenzó diagnóstico, reparación, asignación o traslado.

### FOT-DEC-003 — Evaluación y pruebas

El técnico puede:

- desarmar el dispositivo para revisarlo;
- aplicar servicio con alcohol isopropílico cuando está mojado;
- efectuar pruebas;
- probar piezas temporalmente para determinar qué componente falla.

Una pieza probada temporalmente no queda por ello instalada, vendida, consumida ni autorizada como reparación definitiva.

### FOT-DEC-004 — Servicio que resuelve

Si el equipo queda funcionando únicamente con servicio, el técnico lo arma, registra seguimiento y lo pasa a segunda revisión.

### FOT-DEC-005 — Servicio que no resuelve

Si el equipo no queda funcionando, el técnico registra diagnóstico y seguimiento y lo pasa a segunda revisión. Recepción contacta al cliente para solicitar decisión sobre las piezas propuestas.

### FOT-DEC-006 — Decisión negativa

Si el cliente no autoriza:

- se registra el rechazo;
- el estado pasa a No quedó;
- el dispositivo se coloca en el área física de No quedó;
- la evidencia y los seguimientos permanecen;
- la custodia continúa mientras siga En tienda.

### FOT-DEC-007 — Decisión positiva

Si el cliente autoriza:

- se registra la autorización;
- el equipo vuelve al taller;
- se realiza el alcance autorizado;
- regresa a segunda revisión;
- sólo tras aprobar puede marcarse Listo.

### FOT-DEC-008 — Segunda revisión

La segunda revisión es un filtro diferente del trabajo técnico. En Avicell la realiza normalmente recepción o el recepcionista en turno. Su propósito es detectar fallas antes de notificar al cliente.

### FOT-DEC-009 — Resultado aprobado

Cuando la segunda revisión confirma funcionamiento:

- recepción marca Listo;
- llama al cliente;
- registra seguimiento con usuario, fecha, hora y comentario;
- asigna o actualiza el técnico resumen con quien realizó la reparación, sin borrar otras asignaciones ni participaciones;
- coloca el dispositivo en el área de listos.

Listo no termina la custodia.

### FOT-DEC-010 — Entrega

Cuando el cliente llega, recepción:

1. recibe la nota o folio;
2. abre la orden;
3. localiza el equipo en listos;
4. prueba o revisa el equipo frente al cliente;
5. cobra o completa el cobro y pasa por Caja cuando corresponde;
6. registra la entrega y quién la efectuó;
7. cambia la condición de En tienda a Entregado;
8. conserva el comentario relevante.

La entrega válida termina la custodia.

## Recorrido principal

| Paso | Acción humana | Hecho que debe quedar trazable | Estado de negocio observado o candidato | Ubicación física | Custodia |
|---:|---|---|---|---|---|
| 1 | Recepción crea la orden | orden recibida y actor receptor | Pendiente | pendientes | bajo custodia |
| 2 | Técnico toma y escanea | consulta/escaneo; movimiento si se registra | Pendiente o estado técnico por definir | taller | bajo custodia |
| 3 | Técnico revisa y prueba | diagnóstico, hallazgos y pruebas | catálogo definitivo pendiente | taller | bajo custodia |
| 4A | Servicio deja funcionando | trabajo terminado y seguimiento | Pendiente hasta control, según catálogo actual | segunda revisión | bajo custodia |
| 4B | Servicio no deja funcionando | diagnóstico y necesidad comercial | En espera de autorización, si aplica | segunda revisión | bajo custodia |
| 5A | Cliente rechaza | rechazo por concepto | No quedó | no quedó | bajo custodia |
| 5B | Cliente autoriza | autorización por concepto | estado autorizado/en reparación por definir | taller | bajo custodia |
| 6 | Trabajo autorizado termina | trabajo terminado | pendiente de control | segunda revisión | bajo custodia |
| 7A | Segunda revisión aprueba | control aprobado, estado cambiado, cliente notificado | Listo | listos | bajo custodia |
| 7B | Segunda revisión rechaza | control rechazado y retorno | no puede quedar Listo | taller | bajo custodia |
| 8 | Cliente recoge y se prueba | entrega registrada | Listo o No quedó según resultado técnico | salida; no ubicación interna activa | custodia terminada |

“En reparación”, “En diagnóstico” y “En segunda revisión” son nombres candidatos para separar fases; no se declaran parte confirmada del catálogo legacy.

## Bucles válidos

- Taller → Segunda revisión → Taller puede repetirse varias veces dentro de la misma orden.
- Un técnico puede diagnosticar y otro reparar.
- Una primera llamada puede quedar sin respuesta y otra persona registrar después la autorización.
- Un cambio de técnico no crea una orden nueva ni borra la participación anterior.
- Un equipo Listo puede volver a Taller si falla durante la revisión frente al cliente antes de la entrega.

En todos esos casos la custodia continúa y la identidad de la orden no cambia.

## Límites de rol

El técnico genera hallazgos, diagnóstico, pruebas y trabajo realizado. En el flujo validado, recepción o atención al cliente conduce comunicación, cotización, autorización, notificación y entrega. Esto describe Avicell; la segregación universal o configurable para otros tenants permanece abierta.

## Inconsistencias que deben detectarse

- Estado Listo sin control aprobado.
- Estado No quedó tratado como entrega.
- En espera de autorización usado como ubicación.
- Movimiento físico inferido sólo porque cambió el estado.
- Cambio de estado usado como prueba de reparación.
- Técnico asignado tratado como poseedor físico permanente.
- Entregado mientras el dispositivo permanece en una ubicación interna activa.
- Nota manual usada como única evidencia de autorización, anticipo o entrega.

## Relación con recepción validada

El recorrido comienza después de la creación correcta definida en [Recepción mínima](../reception-minimum-and-commercial-authorization/RECEPCION_MINIMA.md). La orden y la custodia ya existen, y el dispositivo debe conservar su identificación física durante todos los movimientos.
