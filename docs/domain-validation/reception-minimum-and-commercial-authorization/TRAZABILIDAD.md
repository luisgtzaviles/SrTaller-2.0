# Trazabilidad

## Propósito

Este documento conecta las decisiones validadas con su ubicación, la evidencia legacy y los artefactos de discovery que quedan aclarados, parcialmente resueltos o todavía pendientes. No modifica retrospectivamente el estado de otros documentos.

## Fuente de autoridad

| Fuente | Autoridad | Uso |
|---|---|---|
| Solicitud de validación del Product Owner, 2026-07-21 | decisión explícita | fuente primaria de RMCA-DEC, RMCA-INV y variantes RMCA-POL |
| Auditoría legacy de recepción | evidencia de comportamiento | contraste de campos, configuración, creación, impresión y fotos |
| Auditoría legacy del detalle | evidencia de comportamiento | contraste de presupuestos, comentarios, totales y autorizaciones |
| Future State Reception | propuesta no aprobada | identificación de puntos que esta validación aclara |
| Dominio general | discovery no aprobado | vocabulario y preguntas que requieren promoción separada |

## Registro de decisiones

| IDs | Decisión validada | Documento principal |
|---|---|---|
| RMCA-DEC-001/002 | la orden nace con la creación correcta y representa un ciclo | [Recepción mínima](RECEPCION_MINIMA.md) |
| RMCA-DEC-003/004 | mínimos capturados y contexto generado universal | [Recepción mínima](RECEPCION_MINIMA.md) |
| RMCA-DEC-005/006 | campos configurables y fotos posteriores | [Recepción mínima](RECEPCION_MINIMA.md) |
| RMCA-DEC-007–009 | inicio/fin de custodia, varios trabajos y nuevo ciclo al regreso | [Custodia](CUSTODIA_E_IDENTIFICACION_FISICA.md) |
| RMCA-DEC-010–013 | identificación física, contingencia, unión y reposición | [Custodia](CUSTODIA_E_IDENTIFICACION_FISICA.md) |
| RMCA-DEC-014/015 | definición y obligatoriedad del problema reportado | [Problema reportado](PROBLEMA_REPORTADO.md) |
| RMCA-DEC-016–018 | significado de autorización inicial y caso Avicell | [Autorización inicial](AUTORIZACION_COMERCIAL_INICIAL.md) |
| RMCA-DEC-019–024 | conceptos, decisión parcial, historia, estructura y total | [Cotizaciones](COTIZACIONES_Y_DECISIONES_POR_CONCEPTO.md) |
| RMCA-DEC-025 | política de composición comercial configurable | [Políticas de precio](POLITICAS_COMERCIALES_DE_PRECIO.md) |
| RMCA-INV-001–015 | condiciones universales resultantes | [Reglas e invariantes](REGLAS_E_INVARIANTES_DE_DOMINIO.md) |
| RMCA-POL-001–005 | variantes comerciales permitidas | [Políticas de precio](POLITICAS_COMERCIALES_DE_PRECIO.md) |
| RMCA-ESC-001–008 | ejemplos positivos y contraejemplos | [Escenarios](ESCENARIOS.md) |
| RMCA-PREG-001–035 | decisiones todavía no resueltas | [Preguntas abiertas](PREGUNTAS_ABIERTAS.md) |

## Trazabilidad con auditoría legacy de recepción

| Evidencia legacy | Relación con este paquete | Resultado |
|---|---|---|
| LEGACY-RPC-FINDING-001 | el registro legacy no es una política completa | confirmado como límite; se crea clasificación explícita |
| LEGACY-RPC-FIELD nombre/apellido | nombre fijo y apellido configurable | nombre universal; apellido sigue sujeto a política |
| LEGACY-RPC-FIELD contacto/marca/modelo/IMEI/color/señas | campos configurables en legacy | configurabilidad de obligatoriedad validada, sin copiar mecanismo |
| LEGACY-RPC-FIELD falla | podía configurarse en legacy | superado: problema reportado es universal |
| LEGACY-RPC-FINDING-002 | nombre era el único requisito fijo del registro | parcialmente superado: problema reportado también es universal |
| LEGACY-RPC-FINDING-011 | faltan reglas condicionales | permanece como necesidad; condiciones concretas siguen abiertas |
| LEGACY-RPC-FINDING-017 | el éxito de creación es frontera transaccional observable | coincide con el inicio formal validado de orden/custodia |
| LEGACY-RPC-FINDING-018 | contexto y custodia no son checkboxes | confirmado como contexto universal no configurable |
| LEGACY-RPC-FINDING-019 | gobernanza tenant/sucursal incompleta | permanece abierta |
| Fotografías posteriores al alta | evidencia temporal legacy | el momento posterior queda validado; obligatoriedad no |

## Trazabilidad con auditoría legacy del detalle

| Evidencia legacy | Relación con este paquete | Resultado |
|---|---|---|
| LEGACY-RD-FINDING-010 | presupuestos inicial/final sin composición ni versiones | se exige total derivable por conceptos y políticas; versionado sigue abierto |
| LEGACY-RD-FINDING-011 | autorización narrable, no estructurada | se valida decisión estructurada por concepto y narrativa complementaria |
| LEGACY-RD-FINDING-017 | seguimiento libre pierde estructura | no basta como única evidencia de aceptación/rechazo |
| Mapa legacy de dinero y autorización | totales y comentarios no demuestran alcance | se separan propuesta, decisión, autorización y ejecución |
| Ejemplo pantalla/batería | el legacy sólo puede narrar una aceptación parcial | se valida autorización parcial y preservación del rechazo |
| “Presupuesto inicial” | semántica ambigua | se aclara que frecuentemente expresa autorización comercial inicial |

## Aclaraciones al Future State Reception

| Referencia futura | Estado previo | Aclaración validada |
|---|---|---|
| FSR-DECISION-002 | momento exacto de nacimiento pendiente | la orden y custodia formal nacen con la creación correcta |
| FSR-EVENT-006 ReceptionStarted | podía leerse como responsabilidad formal antes de la orden | la conversación/captura previa no constituye custodia formal |
| FSR-POLICY-008 | custodia vinculada a la orden, frontera ambigua | no existe custodia formal previa a la orden |
| FSR-QUESTION-009 | inicio exacto de custodia pendiente | resuelta dentro del alcance de este paquete |
| FSR-DECISION-009 | equipo sin IMEI aceptable | compatible con IMEI configurable e identificación por folio |
| FSR-DECISION-013 | obligación de evidencia pendiente | sólo se resuelve que las fotos ocurren después de crear |
| FSR-SCENARIO-014 | contingencia de impresión de nota | no sustituye la identificación física del dispositivo |

El resto del Future State continúa en estado Proposed o Recommended. Este paquete no aprueba sus eventos, comandos, owners, pantallas ni modelo de información.

## Relación con el dominio general

| Referencia canónica en discovery | Efecto de esta validación | Acción posterior necesaria |
|---|---|---|
| DQ-001 / DOMAIN-DECISION-001 | parcialmente resuelta: una orden admite varios trabajos en un ciclo | precisar vocabulario “orden”, “reparación”, “trabajo” y cardinalidades fuera de este alcance |
| DQ-007 | parcialmente resuelta: mínimos e inicio de custodia | conservar preguntas de evidencia, actores y excepciones |
| DQ-008 / TERM-DEC-004 | parcialmente resuelta: problema reportado no es hallazgo ni diagnóstico | decidir término canónico y alias legacy |
| DQ-009 / DOMAIN-DECISION-004 | parcialmente resuelta: varios conceptos y decisión por línea | decidir versiones, vigencia y flujo completo |
| DQ-011 / DOMAIN-DECISION-005 | parcialmente resuelta: decisión atribuida a concepto | decidir autoridad, canal y evidencia |
| DQ-019 | no resuelta | definir pagos, saldo y total financiero |
| DQ-022 / DOMAIN-DECISION-009 | parcialmente resuelta: el regreso crea orden nueva | definir vínculo de garantía y cobertura |
| RULE-006 | compatible | conservar separación relato/diagnóstico |
| RULE-007/008 | fortalecidas dentro de este alcance | promover sólo después de reconciliar versiones y evidencia |
| INV-005/006/008/012 | compatibles o parcialmente fortalecidas | no cambiar estado canónico sin promoción explícita |
| MONEY-GAP-004 | parcialmente aclarado | falta definir nacimiento de obligación, pagos y contabilidad |

## Cambios de interpretación explícitos

1. Un campo legacy configurable llamado “falla” no puede usarse para hacer opcional el problema reportado en SR Taller 2.0.
2. Cualquier propuesta futura que ubique custodia formal antes de crear la orden queda superada por RMCA-DEC-001 y RMCA-DEC-007.
3. “Presupuesto inicial” no debe copiarse como cotización final de una sola cifra; su semántica operativa frecuente es una autorización comercial inicial condicionada.
4. Una autorización general de cotización no representa correctamente el caso de aceptación parcial.
5. Una nota o comentario libre puede conservar contexto, pero no debe ser la única representación futura de la decisión.

## Estado de promoción

| Destino | Estado actual |
|---|---|
| Este paquete | Validado por Product Owner |
| Documentos de dominio general | no promovidos; conservan sus estados actuales |
| Future State Reception | no aprobado en conjunto; aclarado sólo en los puntos listados |
| Auditorías legacy | evidencia histórica; no se reescriben |
| Diseño técnico | no iniciado ni autorizado por este paquete |

## Regla de mantenimiento

Si una decisión posterior cambia alguno de estos resultados, debe registrar autoridad, fecha, motivo, alcance, decisiones sustituidas, escenarios afectados y documentos que requieren promoción. No se debe editar una auditoría legacy para simular que el comportamiento histórico siempre coincidió con la política nueva.
