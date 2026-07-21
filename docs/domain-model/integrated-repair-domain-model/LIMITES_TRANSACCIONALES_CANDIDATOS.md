# Límites transaccionales candidatos

## Alcance

**PM:** esta página identifica cambios que parecen necesitar consistencia inmediata y otros que pueden coordinarse mediante un proceso visible. No define base de datos, locks, colas, sagas, servicios ni protocolo técnico.

## Consistencia inmediata candidata

| Decisión/cambio | Condición indivisible para el negocio | Riesgo si se divide | Contextos participantes |
|---|---|---|---|
| Crear orden e iniciar custodia | no existe uno sin el otro tras éxito | equipo bajo custodia sin orden u orden sin custodia | Órdenes, Recepción/Custodia |
| Generar folio | reservar identidad legible única en su alcance | folios duplicados o sticker de otra orden | Órdenes, Recepción |
| Registrar decisión por concepto | decisión refiere concepto y versión vigentes | autorización ambigua/obsoleta | Comercial |
| Calcular total autorizado | corresponde a decisiones y política aplicable | total inexplicable | Comercial |
| Registrar anticipo | movimiento conserva identidad, monto, moneda y actor | doble cobro o campo sobrescrito | Pagos |
| Aprobar QC | resultado refiere trabajo vigente | revisión de una versión obsoleta | Calidad, Técnico |
| Completar entrega | entrega válida y fin de custodia ocurren juntos | doble entrega o custodia incoherente | Entrega, Custodia |

**Clasificación:** PM sustentada por DDV. “Inmediata” expresa expectativa del dominio, no tecnología.

## Coordinación por proceso candidata

| Proceso | Pasos distinguibles | Pendiente/compensación visible |
|---|---|---|
| Identificación física | orden creada → imprimir/escribir → adherir | identificación pendiente o contingencia manual |
| Evidencia inicial | orden creada → capturar → vincular | evidencia pendiente con responsable |
| Diagnóstico a cotización | concluir → recomendar → construir propuesta | atención comercial pendiente |
| Autorización a ejecución | decidir → derivar trabajo autorizado → asignar | trabajo por asignar |
| Trabajo a Listo | terminar → solicitar QC → aprobar → marcar Listo | QC pendiente/rechazado |
| Movimiento físico | decidir traslado → registrar salida → confirmar llegada | movimiento en curso o discrepancia |
| Pago y entrega | registrar cobro → verificar condición → entregar | cobro pendiente, crédito o excepción |
| Participación técnica | ejecutar acción → registrar contribución → actualizar proyección | proyección retrasada sin perder historia |

**Clasificación:** PM. El proceso debe hacer visible el trabajo incompleto; no se selecciona mecanismo de coordinación.

## Fronteras que no deben fusionarse sólo por conveniencia

- **DDV:** pago y autorización.
- **DDV:** QC aprobado y estado Listo.
- **DDV:** cobro completado y entrega física.
- **DDV:** movimiento físico y cambio de estado.
- **DDV:** recomendación técnica y cotización.
- **PM:** preservar esas separaciones permite explicar fallos parciales sin una transacción distribuida monolítica.

## Riesgos de frontera

| Riesgo | Ejemplo | Protección conceptual candidata |
|---|---|---|
| Agregado monolítico | toda la orden bloqueada por cualquier cambio | fronteras pequeñas y versiones explícitas |
| Transacción distribuida implícita | pago, estado y webhook cambian como si fueran uno | hechos confirmados y pendientes visibles |
| Duplicidad | reintento crea dos pagos o entregas | identidad de intención e idempotencia conceptual |
| Edición simultánea | dos usuarios autorizan versiones diferentes | control de vigencia/versionado |
| Lectura desactualizada | ubicación mostrada no coincide con último movimiento | reconciliación y señal de frescura |

## Decisiones pendientes

- **PA:** qué cambios requieren confirmación sincronizada para operar sin riesgo.
- **PA:** cómo se reserva el folio bajo concurrencia.
- **PA:** qué significa “trabajo vigente” para QC.
- **PA:** si el cobro debe estar completo antes de entregar o admite crédito/excepción.
- **PA:** cómo se reconcilia un movimiento físico no registrado.
