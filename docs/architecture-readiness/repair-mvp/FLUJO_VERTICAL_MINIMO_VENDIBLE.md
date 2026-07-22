# Flujo vertical mínimo vendible

## Secuencia

**[RP]** El flujo mínimo vendible es:

> Usuario entra → crea orden → inicia custodia → identifica equipo → técnico consulta orden → registra conclusión → se genera propuesta comercial → cliente autoriza → se registra trabajo → segunda revisión → equipo listo → cobro → entrega → custodia termina.

## Contrato e información mínima por etapa

| Etapa | Información mínima existente | Resultado observable | Invariante principal | Clasificación |
| --- | --- | --- | --- | --- |
| Entrada | Tenant, sucursal, estación, usuario y permisos | Contexto ADR-010 verificable | Ninguna operación sin contexto completo ni autorización | RDD |
| Recepción | Cliente con nombre, problema, receptor, fecha/hora y política aplicada | Orden identificada | La creación inicia custodia | RDD |
| Identificación | Folio, descripción física y estado de impresión/manual | Vínculo inequívoco | Un folio no identifica dos órdenes en su alcance | RDD |
| Consulta técnica | Orden, custodia, ubicación, notas, asignación y línea temporal | Detalle autorizado | Lectura limitada al contexto autorizado | RDD |
| Conclusión | Revisión, autor, fecha, hallazgo y recomendaciones separadas | Resultado técnico trazable | Conclusión no equivale a recomendación | RDD |
| Propuesta | Versión, conceptos, precios históricos, moneda y total | Oferta reproducible | Una decisión refiere a una versión | RDD |
| Autorización | Decisor, evidencia, momento y decisión por concepto | Alcance inequívoco | No hay trabajo sin autorización aplicable | RDD |
| Trabajo | Revisión, concepto autorizado, participante, actividad y resultado | Ejecución trazable | Sólo alcance autorizado | RDD |
| Segunda revisión | Revisión examinada, revisor, criterios, resultado y observaciones | Aprobación o retorno a Taller | Listo requiere control mínimo acordado | RDD |
| Resolución | Listo o No quedó, actor, fecha y razón | Cierre técnico explícito | La resolución no termina custodia | RDD |
| Cobro | Movimientos, monto, moneda, medio, sucursal, actor y saldo | Posición financiera explicable | No se reescribe historia de pagos | RDD |
| Entrega | Receptor, actor, momento, evidencia, condición financiera y custodia vigente | Equipo entregado una vez | Sólo entrega válida termina custodia | RDD |

## Caminos no felices mínimos

- **[RP]** Cliente rechaza todos o algunos conceptos: se preserva la decisión y sólo se ejecuta lo autorizado.
- **[RP]** El equipo queda “No quedó”: permanece trazable hasta entrega.
- **[RP]** QC rechaza: el trabajo vuelve a corrección sin declarar Listo.
- **[RP]** Anticipo parcial: el saldo se deriva de movimientos válidos.
- **[RP]** Entrega a tercero: requiere evidencia y regla de autorización por definir.
- **[R]** Reintentos de creación, cobro o entrega no pueden duplicar efectos.

## Variantes esenciales

| Variante | Comportamiento mínimo | Información preservada | Clasificación |
| --- | --- | --- | --- |
| Equipo sólo con servicio | Concepto de servicio sin pieza ni stock | Concepto, precio, autorización y trabajo | RP |
| Equipo que requiere pieza | Concepto descriptivo sin inventario completo | Descripción, cantidad, precio y autorización; no stock ficticio | RP |
| Autorización parcial | Sólo conceptos aceptados pasan a ejecución | Versión, decisión por concepto, total, decisor y momento | RDD |
| Cliente no autoriza | No inicia trabajo; custodia sigue hasta resolución/entrega | Rechazo, evidencia, actor y próxima acción | RDD |
| Segunda revisión rechazada | Retorna a Taller o corrección sin marcar Listo | Revisión, defectos, revisor y nueva revisión esperada | RDD |
| Equipo No quedó | Cierra intento técnico, no custodia | Razón, conclusión, actor y condición de entrega | RDD |
| Anticipo | Agrega movimiento y recalcula saldo | Monto, moneda, medio, orden, sucursal, actor e idempotencia | RDD |
| Falla de impresora | La orden sigue válida con identificación manual controlada | Folio, impresión pendiente, actor y reimpresiones | DAR |

## Visibilidad

**[DAR]** Cada etapa expone resultado, bloqueos y próxima acción. Una falla lateral, como impresión o notificación, queda pendiente y reintentable sin ocultar que la operación principal fue confirmada.

## Condición de venta

**[DAR]** La primera versión vendible debe demostrar el flujo completo y sus caminos de rechazo esenciales en un tenant y una sucursal, aun si algunas tareas auxiliares son manuales. Una demo parcial de recepción o diagnóstico no constituye el MVP vendible.

## Decisiones pendientes

- **[PB]** Catálogo mínimo de estados y transiciones.
- **[PB]** Alcance de unicidad del folio.
- **[PB]** Evidencia válida de autorización y entrega.
- **[PB]** Regla mínima de QC y rol que puede aprobarlo.
- **[PB]** Condiciones de saldo para permitir entrega.
