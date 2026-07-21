# Consistencia y procesos multipaso

## Estrategia

**[DAR]** Se usa consistencia inmediata dentro de un agregado y coordinación explícita entre agregados. Los procesos largos conservan estado, correlación y pasos compensables; no requieren transacciones distribuidas.

## Procesos principales

| Proceso | Pasos y coordinador candidato | Inmediata / eventual | Compensación, fallas y reintentos | Visibilidad | Clasificación |
| --- | --- | --- | --- | --- | --- |
| Recepción e identificación | Aplicación de Recepción crea orden/custodia y solicita etiqueta | Orden+custodia inmediata; impresión eventual | Impresora falla: folio manual, impresión pendiente; reintento por folio | Orden válida y tarea pendiente | DAR |
| Diagnóstico a cotización | Aplicación Comercial toma revisión concluida y crea versión | Cada registro inmediato; enlace posterior permitido | Cotización falla: diagnóstico intacto; reintento no duplica versión | “Diagnóstico listo, propuesta pendiente” | DAR |
| Autorización a ejecución | Comercial decide conceptos; Ejecución abre revisión | Decisión inmediata; apertura coordinada | Versión vieja rechazada; reintento reutiliza decisión | Alcance autorizado y trabajo pendiente | DAR |
| Trabajo a control de calidad | Ejecución cierra revisión; Calidad abre segunda revisión | Cierre inmediato; solicitud posterior | Solicitud fallida se reintenta; no marca Listo | “Pendiente de segunda revisión” | DAR |
| Control aprobado a Listo | Flujo coordina resultado QC y transición | Consistencia inmediata entre aprobación aplicable y Listo | Conflicto de revisión rechaza; reintento idempotente | Aprobado/Listo o rechazo visible | RDD |
| Listo a notificación | Notificaciones consume EquipoListo | Eventual | Canal falla: reintento/agotar; no revierte Listo | Aviso pendiente/fallido | DAR |
| Cobro a entrega | Entrega consulta posición y política, registra entrega y termina custodia | Pago y entrega son transacciones propias; fin de custodia inmediato con entrega | Error de Caja no duplica; entrega fallida mantiene custodia | Saldo, elegibilidad y resultado | RDD |
| Devolución a Taller | Flujo registra causa y nueva ubicación después de rechazo | Movimiento/estado coherentes inmediatamente | Conflicto impide movimiento; reintento por intención | Orden vuelve a Taller con razón | DAR |
| Corrección de pago | Pagos agrega movimiento compensatorio | Movimiento inmediato; proyección eventual | Nunca borra original; reintento no duplica | Original, corrección y saldo | RDD |
| Reimpresión de etiqueta | Evidencia/documentos solicita impresión del mismo folio | Eventual | Falla reintentable; contador/actor evita identidad nueva | Impresión pendiente o completada | DAR |

## Estado del proceso

**[DAR]** Cada proceso multipaso debe distinguir pendiente, completado y fallido recuperable, conservar el último paso exitoso y aceptar reintentos idempotentes.

## Compensaciones

- **[RDD]** Un pago no se borra: se compensa con movimiento autorizado.
- **[RDD]** Una autorización no se reescribe: una nueva decisión refiere a versión o reemplazo definido.
- **[DAR]** Una notificación fallida se reintenta o marca agotada; no revierte el estado.
- **[PB]** Definir cómo retirar una entrega registrada por error sin falsificar custodia histórica.

## Eventos y sincronía

**[DAP]** Dentro del monolito, la coordinación puede ser sincrónica cuando el usuario necesita respuesta inmediata. Los eventos posteriores a confirmar la transacción sirven para proyecciones y efectos laterales. No se prescriben sagas, colas ni intermediarios hasta demostrar necesidad y registrar ADR.
