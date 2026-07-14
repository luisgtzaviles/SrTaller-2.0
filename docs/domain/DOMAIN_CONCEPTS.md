# Conceptos centrales candidatos

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Criterio

Las fichas describen significado e identidad conceptual, no campos, tipos, tablas ni contratos. Todos los ciclos son hipótesis.

## Cliente

- **Definición y propósito:** participante comercial identificable con quien el taller mantiene relación; permite continuidad sin asumir que es propietario.
- **Identidad conceptual:** la relación reconocida por el tenant, con deduplicación pendiente.
- **Ciclo de vida:** identificado o creado → actualizado → posiblemente fusionado/archivado según política.
- **Relaciones:** contactos, propietarios, dispositivos, órdenes, conversaciones.
- **Información mínima:** referencia humana suficiente y forma válida de distinguirlo; **opcional:** medios, preferencias, organización y notas autorizadas.
- **Reglas candidatas:** RULE-002; no fusionar automáticamente.
- **Eventos:** EVENT-001/002/003.
- **Ambigüedades:** persona u organización; tenant-wide o sucursal.
- **Preguntas:** DQ-004, Q006, Q018.

## Dispositivo del cliente

- **Definición y propósito:** equipo físico atendido, independiente de la terminal que opera el sistema.
- **Identidad conceptual:** continuidad de un equipo aun cuando falten o cambien identificadores observables.
- **Ciclo de vida:** registrado → recibido en distintas órdenes → historial relacionado.
- **Relaciones:** cliente/propietario, recepciones, órdenes, accesorios.
- **Información mínima:** tipo y rasgos disponibles; **opcional:** marca, modelo, IMEI, serie, fotos.
- **Reglas candidatas:** RULE-003/004; identificadores ausentes no deben inventarse.
- **Eventos:** EVENT-004/005/006.
- **Ambigüedades:** ownership, dual IMEI, sustitución de placa.
- **Preguntas:** DQ-003/005.

## Orden de trabajo

- **Definición y propósito:** caso coordinador candidato desde recepción hasta cierre.
- **Identidad conceptual:** folio o referencia estable dentro del tenant; no es el dispositivo ni el resultado técnico.
- **Ciclo de vida:** Draft/Received → evaluación/decisión/trabajo → entrega/cancelación → cierre.
- **Relaciones:** cliente, dispositivo, recepción, diagnóstico, cotizaciones, reparaciones, pagos, entrega, garantía.
- **Información mínima:** tenant, sucursal de origen, dispositivo, propósito y actor; **opcional:** prioridad, asignación y referencias.
- **Reglas candidatas:** RULE-001/020.
- **Eventos:** EVENT-007/008/009/039.
- **Ambigüedades:** una o varias reparaciones; reapertura.
- **Preguntas:** DQ-001/018.

## Recepción

- **Definición y propósito:** acto y evidencia de entrada/custodia.
- **Identidad conceptual:** ocurrencia asociada a una orden; podría ser entidad, hecho o snapshot.
- **Ciclo de vida:** preparada → confirmada → corregida sólo con trazabilidad.
- **Relaciones:** orden, entregante, dispositivo, accesorios, condición.
- **Información mínima:** quién entrega, qué entra, condición y momento; **opcional:** fotos, firma, secreto protegido.
- **Reglas candidatas:** RULE-004/005.
- **Eventos:** EVENT-005/006.
- **Ambigüedades:** recepción sin custodia o reingreso.
- **Preguntas:** DQ-006/007/027.

## Diagnóstico

- **Definición y propósito:** evaluación técnica de síntomas, hallazgos y posibilidades.
- **Identidad conceptual:** evaluación atribuible y versionable o repetible por decidir.
- **Ciclo de vida:** NotStarted → InProgress → Completed o Inconclusive.
- **Relaciones:** falla reportada, pruebas, hallazgos, cotización, técnico.
- **Información mínima:** objetivo, responsable, hallazgos y conclusión; **opcional:** evidencia, costo, alternativas.
- **Reglas candidatas:** RULE-006.
- **Eventos:** EVENT-010/011/012.
- **Ambigüedades:** varios diagnósticos y diagnóstico pagado.
- **Preguntas:** DQ-008/026.

## Cotización

- **Definición y propósito:** propuesta comercial versionada de alcance, partes, trabajo y condiciones.
- **Identidad conceptual:** continuidad entre versiones, cada una inmutable tras emisión como hipótesis.
- **Ciclo de vida:** Draft → Issued → Approved/PartiallyApproved/Rejected/Expired/Superseded/Cancelled.
- **Relaciones:** orden, diagnóstico, partidas, autorización, anticipo.
- **Información mínima:** versión, partidas, total/moneda, vigencia y condiciones; **opcional:** alternativas y notas.
- **Reglas candidatas:** RULE-007.
- **Eventos:** EVENT-013–019.
- **Ambigüedades:** opciones paralelas y cambio después de anticipo.
- **Preguntas:** DQ-009/011.

## Autorización

- **Definición y propósito:** decisión atribuible sobre una versión y alcance concreto.
- **Identidad conceptual:** evidencia de quién decidió, con qué autoridad y por qué medio.
- **Ciclo de vida:** solicitada → otorgada parcial/total o rechazada; una revisión posterior no altera la anterior.
- **Relaciones:** propietario/cliente, cotización, reparación, evidencia.
- **Información mínima:** decisor, versión, alcance, decisión y momento; **opcional:** canal, mensaje o firma.
- **Reglas candidatas:** RULE-008.
- **Eventos:** EVENT-016/017/018/020.
- **Ambigüedades:** verbal, mensajería, silencio, preautorización.
- **Preguntas:** DQ-011.

## Intervención técnica

- **Definición y propósito:** actividad técnica trazable dentro de una reparación.
- **Identidad conceptual:** ocurrencia atribuida a responsable, alcance y periodo.
- **Ciclo de vida:** planeada → iniciada → pausada/completada/fallida.
- **Relaciones:** reparación, técnico, partes, pruebas, hallazgos.
- **Información mínima:** responsable, acción, resultado y autorización relacionada; **opcional:** duración, evidencia, tercero.
- **Reglas candidatas:** RULE-009/010/011.
- **Eventos:** EVENT-021/022/023/026/027.
- **Ambigüedades:** granularidad y cambio de técnico.
- **Preguntas:** DQ-013/015.

## Reparación

- **Definición y propósito:** esfuerzo y resultado técnico para corregir alcance autorizado.
- **Identidad conceptual:** posible unidad separada por falla o alcance; todavía no decidido.
- **Ciclo de vida:** autorizada → en curso/pausada → completada o no resuelta.
- **Relaciones:** orden, autorizaciones, intervenciones, partes, control de calidad.
- **Información mínima:** alcance, autorización, responsable y resultado; **opcional:** causa, tiempo, costo real.
- **Reglas candidatas:** RULE-010/011/012.
- **Eventos:** EVENT-020–027.
- **Ambigüedades:** reparación parcial, varias fallas, trabajo externo.
- **Preguntas:** DQ-001/015/017.

## Control de calidad

- **Definición y propósito:** evaluación del resultado contra criterios definidos antes de declarar listo.
- **Identidad conceptual:** ejecución de un plan de comprobación, quizá repetible.
- **Ciclo de vida:** iniciado → aprobado o fallido → posible retrabajo y repetición.
- **Relaciones:** reparación, pruebas, orden, supervisor.
- **Información mínima:** criterios, ejecutor, resultado y hallazgos; **opcional:** evidencia y conformidad.
- **Reglas candidatas:** RULE-012.
- **Eventos:** EVENT-028–031.
- **Ambigüedades:** independencia del técnico y criterio por servicio.
- **Preguntas:** DQ-016/028.

## Pago

- **Definición y propósito:** reconocimiento de valor recibido y aplicado a una obligación del taller.
- **Identidad conceptual:** hecho financiero propio, no subparte mutable de la orden ni cobro SaaS.
- **Ciclo de vida:** registrado → aplicado → eventualmente reembolsado parcial/total.
- **Relaciones:** obligación/cotización, orden, caja, método, devolución.
- **Información mínima:** importe, moneda, medio, actor, aplicación y momento; **opcional:** referencia externa.
- **Reglas candidatas:** RULE-009/013.
- **Eventos:** EVENT-032/033/034/035.
- **Ambigüedades:** anticipo, contracargo, múltiples obligaciones.
- **Preguntas:** DQ-012/019.

## Entrega

- **Definición y propósito:** transferencia documentada de custodia al receptor.
- **Identidad conceptual:** acto asociado a orden y dispositivo, separado de estar listo y cerrar.
- **Ciclo de vida:** posible programación → verificación → entregada o fallida.
- **Relaciones:** orden, receptor/autorizado, saldo, evidencia, garantía.
- **Información mínima:** receptor, autoridad/evidencia, dispositivo, condición y momento; **opcional:** firma, cita, observaciones.
- **Reglas candidatas:** RULE-013/014/015.
- **Eventos:** EVENT-036/037/038.
- **Ambigüedades:** saldo, otra sucursal y tercero.
- **Preguntas:** DQ-014/020.

## Garantía

- **Definición y propósito:** compromiso limitado de evaluar y resolver una reclamación cubierta.
- **Identidad conceptual:** cobertura y reclamación pueden ser conceptos separados; vínculo con orden original obligatorio como hipótesis.
- **Ciclo de vida:** elegible/activa/expirada; reclamación abierta → evaluada → aceptada/rechazada → resuelta.
- **Relaciones:** reparación original, partes, entrega, reingreso, reclamación.
- **Información mínima:** cobertura, vigencia, origen y resultado; **opcional:** exclusiones y evidencia.
- **Reglas candidatas:** RULE-016/017.
- **Eventos:** EVENT-040–044.
- **Ambigüedades:** caso relacionado o reapertura, cobertura parcial.
- **Preguntas:** DQ-021/022.

## Refacción

- **Definición y propósito:** componente propuesto o utilizado en una intervención.
- **Identidad conceptual:** pieza requerida por compatibilidad; puede o no corresponder a producto del inventario.
- **Ciclo de vida:** propuesta → solicitada/reservada → consumida/devuelta/mermada.
- **Relaciones:** producto, proveedor, reserva, cotización, reparación.
- **Información mínima:** descripción y compatibilidad declarada; **opcional:** procedencia, serie, garantía y costo.
- **Reglas candidatas:** RULE-011.
- **Eventos:** EVENT-024/025/026.
- **Ambigüedades:** parte del cliente, equivalente o serializada.
- **Preguntas:** DQ-010/023.

## Reserva de inventario

- **Definición y propósito:** compromiso temporal de una cantidad disponible para un fin.
- **Identidad conceptual:** reserva por producto/ubicación/orden con vigencia por decidir.
- **Ciclo de vida:** solicitada → activa → consumida, liberada o expirada.
- **Relaciones:** orden, refacción, existencia, consumo.
- **Información mínima:** propósito, cantidad y alcance; **opcional:** vencimiento y prioridad.
- **Reglas candidatas:** RULE-011.
- **Eventos:** EVENT-024/025/026.
- **Ambigüedades:** reserva obligatoria, negativos y concurrencia.
- **Preguntas:** DQ-023.

## Asignación técnica

- **Definición y propósito:** responsabilidad vigente por trabajo técnico.
- **Identidad conceptual:** relación temporal entre trabajo y técnico/proveedor.
- **Ciclo de vida:** propuesta → activa → reasignada/completada/cancelada.
- **Relaciones:** orden, reparación, técnico, supervisor, sucursal.
- **Información mínima:** responsable, alcance, inicio y motivo; **opcional:** prioridad, cola y vencimiento.
- **Reglas candidatas:** RULE-010.
- **Eventos:** EVENT-008/020/027.
- **Ambigüedades:** asignación por orden, reparación o intervención.
- **Preguntas:** DQ-013.

## Pregunta transversal

La identidad, el ownership y los límites de consistencia de estos conceptos sólo podrán elevarse después de contrastar escenarios reales. Ninguna ficha autoriza un modelo persistente.
