# Mapa legacy de dinero y autorización

**Estado:** Borrador para validación financiera y operativa.
**Propósito:** Reconstruir cómo el detalle representa presupuesto, anticipos, saldo, autorización e impresión.
**Alcance:** Datos y acciones monetarias del detalle, sus controles, trazabilidad y relación encontrada con caja, inventario y tickets.
**Fuente:** Código local de SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
**Audiencia:** Product Owner, finanzas, operaciones, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Resultado principal

El flujo contiene un presupuesto inicial, un presupuesto final mutable y filas llamadas anticipos. El saldo no es una obligación persistida: se deriva en el navegador como presupuesto final actual menos la suma de esas filas. No hay cotización versionada, partidas, impuestos/descuentos visibles, aceptación estructurada, cuenta por cobrar, integración con caja ni regla que impida entregar con deuda. **Estado de conocimiento:** `Confirmed by legacy code` para el comportamiento; elementos no implementados: `Not found`.

## Conceptos monetarios observados

| Concepto legacy | Fuente/persistencia | Escritura desde detalle | Regla observable | Limitación de evidencia | Conocimiento |
|---|---|---|---|---|---|
| Presupuesto inicial | Campo de `reparaciones` capturado en alta | Solo lectura | Se muestra en el resumen | No se descompone en partidas ni se compara formalmente con autorizaciones | `Confirmed by legacy code` |
| Presupuesto final | Campo único `presupuesto_final` de `reparaciones` | Se sobrescribe en guardado principal | El navegador envía número; vacío/no numérico termina en `0` desde UI | No tiene versión, motivo, actor dedicado, moneda, impuestos, líneas o aceptación vinculada | `Confirmed by legacy code` |
| Anticipo/pago | Fila en `reparacion_pagos` | Inserción independiente | Monto, método fijo por defecto, fecha y nombre de sesión | No elige método real, caja, turno, referencia, asignación ni tipo contable | `Confirmed by legacy code` |
| Suma de anticipos | Calculada en JavaScript desde filas leídas | No se persiste | Suma todos los `monto` recibidos | Puede incluir valores negativos; no hay conciliación | `Confirmed by legacy code` |
| Saldo pendiente | Solo DOM: `presupuesto_final - suma anticipos` | No se persiste | Se recalcula al cargar pagos y editar total | No actúa como restricción ni prueba de adeudo | `Confirmed by legacy code` |
| Último pago para ticket | Consulta con `ORDER BY fecha DESC LIMIT 1` | Solo impresión | Expone monto, método, fecha y usuario del último registro | No es total pagado ni necesariamente pago final | `Confirmed by legacy code` |

## Presupuesto final

El control es `input type="number"`. El guardado usa `parseFloat` y convierte un valor vacío/no numérico a cero. El backend solo exige folio; no comprueba que el presupuesto sea numérico, no negativo, mayor que los anticipos, coherente con el presupuesto inicial o aprobado. Una llamada directa puede evitar las restricciones propias del control HTML.

Cada guardado reemplaza el valor anterior en la misma fila. No se encontró tabla de versiones, detalle de servicios/refacciones, razón del cambio, autor específico del cambio, momento específico del cambio, vigencia, estado de propuesta o firma. El actor de la petición puede aparecer indirectamente en `revisor` solo si es el primer cambio fuera de `Pendiente`, pero eso no prueba quién cotizó o autorizó el nuevo total. **Estado de conocimiento:** `Confirmed by legacy code`; interpretación futura: `Pending finance review` y `Pending Product Owner validation`.

## Registro de anticipos

### Camino visible

1. El usuario captura un monto.
2. El navegador exige un número mayor que cero.
3. Envía `folio` y `monto` a `guardar_anticipo.php` con CSRF.
4. El backend confirma que el folio pertenece al tenant/sucursal.
5. Inserta una fila con `metodo_pago = 'Anticipo'`, fecha y nombre de sesión.
6. El navegador vuelve a cargar la lista y recalcula el saldo.

### Controles y ausencias

| Regla/control | UI | Backend | Efecto |
|---|---|---|---|
| Monto numérico | Sí | Sí, mediante `is_numeric` | Rechaza texto no numérico |
| Monto mayor que cero | Sí | No; solo exige valor truthy | Una llamada directa puede insertar negativos |
| Monto cero | Rechazado | Rechazado por valor falsy | No se inserta |
| No exceder presupuesto/saldo | No | No | Sobrepago y saldo negativo son posibles |
| Elegir método de pago | No | No | Se persiste el rótulo genérico `Anticipo` |
| Elegir caja/turno | No | No | No se crea vínculo con sesión de caja |
| Referencia de transacción | No | No | No hay conciliación explícita |
| Recibo/snapshot | No encontrado | No encontrado | La impresión posterior usa estado actual y último pago |
| Reversa/devolución/corrección | No encontrada | No encontrada en módulo | Un error no tiene compensación explícita desde detalle |
| Permiso financiero específico | No | No | Basta la capacidad técnica de acceder/invocar el endpoint |

**Estado de conocimiento:** `Confirmed by legacy code` para controles presentes; ausencias: `Not found`; aceptabilidad: `Pending finance review`.

## Saldo

La fórmula observada es:

`saldo mostrado = presupuesto_final actual - suma de monto de reparacion_pagos`

El resultado se colorea, pero un valor negativo no bloquea acciones. Cambiar el presupuesto final modifica el saldo aparente sin tocar los pagos; agregar un pago modifica el saldo sin tocar el presupuesto. No existe una validación equivalente en backend al marcar `Entregado`.

Consecuencias observables:

- un presupuesto vacío convertido a cero frente a anticipos produce saldo negativo;
- reducir el presupuesto por debajo de lo cobrado produce saldo negativo;
- un anticipo negativo directo aumenta el saldo;
- entregar no requiere saldo cero;
- reabrir o cancelar no ajusta pagos;
- la lista devuelta no incluye ID ni método, lo que limita corrección desde UI.

**Estado de conocimiento:** `Confirmed by legacy code`.

## Autorización de cambios

No existe un objeto o acción explícita de autorización. El seguimiento libre puede afirmar “cliente autoriza”, y el presupuesto final puede cambiar en una petición distinta, pero no hay enlace técnico entre la afirmación y el nuevo valor.

| Dato de autorización esperado | Representación encontrada | Capacidad probatoria |
|---|---|---|
| Decisión (`aprobado`, `rechazado`, parcial) | Texto libre opcional | No estructurada |
| Persona que decide | Puede escribirse en comentario | No enlazada a identidad de cliente/contacto |
| Canal | Puede escribirse en comentario | No tipificado ni validado |
| Fecha/hora de decisión | Fecha del seguimiento | Prueba cuándo se guardó la nota, no cuándo ocurrió la decisión |
| Monto autorizado | Puede escribirse en comentario o reflejarse en total | Sin vínculo entre nota y versión monetaria |
| Alcance autorizado | Texto libre | Sin servicios/refacciones estructurados |
| Evidencia | Imagen genérica opcional | Sin categoría ni obligación |
| Actor que registra | `colaborador` textual del seguimiento | No es necesariamente quien recibió/emitió autorización |
| Revocación o cambio | Otra nota y otra sobrescritura | Sin cadena de versiones |

Por ello, el legacy puede conservar una narración de autorización, pero no puede demostrar estructuralmente que una persona aprobó un alcance y monto determinados que produjeron una versión concreta del presupuesto. **Estado de conocimiento:** `Inferred from legacy behavior`; suficiencia legal/operativa: `Pending Product Owner validation` y `Pending security review`.

## Seguimientos como soporte monetario

El seguimiento admite comentario y/o imagen. Antes de enviar, el navegador convierte a minúsculas todo el texto excepto la primera letra; esa transformación puede alterar acrónimos, códigos, nombres o convenciones monetarias. El backend guarda nombre de sesión y fecha, pero no categoría, número telefónico, contacto, monto autorizado, estado de autorización ni presupuesto relacionado.

Guardar seguimiento y cambiar presupuesto son operaciones independientes. Son posibles, entre otros, estos resultados parciales:

- nota de autorización guardada y presupuesto sin cambiar;
- presupuesto cambiado sin nota;
- nota guardada y evidencia fallida;
- archivo subido a R2 con persistencia relacional incompleta;
- cierre/entrega guardados sin autorización.

**Estado de conocimiento:** `Confirmed by legacy code` para fronteras; consecuencias: `Inferred from legacy behavior`.

## Escenario pantalla + batería

Supuesto de observación: una reparación ingresó por pantalla, durante diagnóstico se descubre una batería defectuosa, se llama al cliente, este autoriza y cambia el total.

| Paso | Lo que puede hacer el legacy | Lo que queda sin demostrar |
|---|---|---|
| Registrar falla original | Mostrar `falla` del ingreso | No editarla ni convertirla en alcance versionado desde detalle |
| Registrar hallazgo de batería | Escribir seguimiento | Tipo de hallazgo, diagnóstico, componente y severidad |
| Registrar llamada | Escribir que se llamó | Número usado, contacto efectivo, grabación, resultado o consentimiento |
| Registrar autorización | Escribir que autorizó | Identidad, canal, decisión, monto y alcance estructurados |
| Cambiar total | Sobrescribir presupuesto final | Relación causal con la nota y diferencia contra versión anterior |
| Registrar batería | No hay línea de refacción en detalle | SKU, costo, precio, cantidad, reserva, instalación o devolución |
| Afectar inventario | No ocurre desde este flujo | Movimiento, responsable, almacén y momento |
| Cobrar diferencia | Insertar anticipo genérico | Caja, método real, recibo, aplicación al concepto y saldo exigible |

La secuencia puede documentarse narrativamente, pero no como una cadena transaccional verificable. **Estado de conocimiento:** `Confirmed by legacy code` y `Not found` según cada celda.

## Caja, contabilidad y cuentas por cobrar

El repositorio contiene módulos de POS e inventario, pero `guardar_anticipo.php` inserta directamente en `reparacion_pagos` y no llama sus helpers, no crea movimiento de caja y no referencia una venta, caja, turno, método de cobro o cuenta por cobrar. La coincidencia de conceptos en otros módulos no prueba integración.

No se encontró consumo posterior de `reparacion_pagos` por caja ni una relación desde el detalle a movimientos POS. **Estado de conocimiento:** `Not found`; la posible conciliación manual o externa es `Unknown` y está `Pending finance review`.

## Entrega y deuda

El guardado permite `Entregado` con cualquier estado y presupuesto/saldo. No lee pagos, no calcula saldo y no requiere excepción aprobada. Tampoco genera un pago final, cuenta por cobrar o compromiso. Si la práctica real permite crédito o cortesía, el motivo no queda estructurado en esta acción.

**Estado de conocimiento:** `Confirmed by legacy code`; política operativa: `Pending Product Owner validation`; impacto contable: `Pending finance review`.

## Impresión y reimpresión

`imprimir_ticket.php` selecciona una plantilla por tipo, lee la reparación actual completa, humaniza algunos campos, incorpora datos de sucursal y sustituye tokens. Para pagos consulta solo la fila más reciente por fecha. No se encontró almacenamiento del HTML final, versión de plantilla usada, número de impresión, usuario impresor o vínculo entre impresión y entrega/cobro.

Implicaciones:

- una reimpresión puede mostrar presupuesto, estado, custodia o datos personales diferentes a los del momento original;
- `{{monto}}` representa el último pago, no la suma;
- el contenido financiero exacto depende de una plantilla activa desconocida;
- el código de seguridad solo se borra automáticamente si `tipo_seguridad` normaliza a `no_tiene`; para otros tipos podría sustituirse si la plantilla usa el token.

**Estado de conocimiento:** `Confirmed by legacy code` para el motor; contenido activo: `Unknown`; exposición: `Pending security review`.

## Refacciones, compras e inventario

El detalle no representa partidas. Fuera del módulo se encontró `referencia_reparacion` como texto manual en la lista/orden de compra, sin clave foránea ni validación visible contra el folio; las rutas de escritura inspeccionadas comienzan con un bloqueo legacy. No hay conexión desde esa referencia hacia presupuesto, autorización, seguimiento, consumo o entrega del detalle.

No se encontró movimiento de inventario al agregar un hallazgo, cambiar estado, marcar entrega, reabrir, cancelar o usar un cierre de garantía. **Estado de conocimiento:** `Not found`.

## Decisiones pendientes

- Semántica de presupuesto, anticipo, pago, saldo, crédito, cortesía, devolución y cancelación: `Pending finance review`.
- Autoridad, evidencia y excepciones de entrega/autorización: `Pending Product Owner validation`.
- Protección de datos de contacto, código de seguridad, tickets y evidencia: `Pending security review`.
- Versionado, atomicidad, caja, inventario e identidad: `Pending architecture review`.

Las preguntas concretas están en [REPAIR_DETAIL_OPEN_QUESTIONS.md](REPAIR_DETAIL_OPEN_QUESTIONS.md).

## Navegación

- [Índice](README.md)
- [Auditoría integral](REPAIR_DETAIL_AUDIT.md)
- [Catálogo de acciones](REPAIR_DETAIL_ACTION_CATALOG.md)
- [Estado y custodia](REPAIR_DETAIL_STATE_AND_CUSTODY_MAP.md)
- [Hallazgos](REPAIR_DETAIL_DOMAIN_FINDINGS.md)
