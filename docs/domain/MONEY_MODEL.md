# Modelo financiero conceptual del recorrido operativo

## Metadatos

- **Estado:** Initial hypothesis / Pending Product Owner validation
- **Propósito:** Separar lenguaje, ciclos y responsabilidades financieras sin diseñar contabilidad ni persistencia.
- **Alcance:** Cotización, obligación, pagos del cliente, caja, devoluciones, crédito y separación de facturación SaaS.
- **Audiencia:** Product Owner, recepción, caja, administración, finanzas/contabilidad como experto y arquitectura.
- **Última actualización:** 2026-07-13

## Límites de la exploración

- El dinero del taller describe valor relacionado con reparaciones, servicios o productos.
- Payments registra pagos, aplicaciones y devoluciones como contexto candidato.
- Cash Management/Cash Register explora control físico u operativo de caja; no prueba el pago por sí solo.
- Subscription Billing describe la relación comercial entre plataforma y tenant.
- Este documento no define reconocimiento contable, fiscalidad, facturación legal, cuentas contables ni almacenamiento.

## Conceptos financieros candidatos

| ID | Concepto | Significado candidato | No confundir con | Pregunta principal | Estado |
|---|---|---|---|---|---|
| MONEY-CONCEPT-001 | Precio | valor unitario u ofrecido para un concepto | importe final | ¿quién lo fija y en qué vigencia? | Initial hypothesis |
| MONEY-CONCEPT-002 | Importe | valor monetario asociado a una línea o hecho | precio sin cantidad | ¿admite signo o sólo dirección? | Initial hypothesis |
| MONEY-CONCEPT-003 | Subtotal | suma previa a ajustes/impuestos según política | total | ¿qué incluye? | Unknown |
| MONEY-CONCEPT-004 | Descuento | reducción aplicada antes o al formar obligación | bonificación posterior | ¿quién lo autoriza? | Initial hypothesis |
| MONEY-CONCEPT-005 | Impuesto | importe derivado de obligación fiscal aplicable | ingreso del taller | país y cálculo pendientes | Unknown |
| MONEY-CONCEPT-006 | Total | importe resultante de una versión u obligación | saldo | ¿cotizado, autorizado o final? | Initial hypothesis |
| MONEY-CONCEPT-007 | Anticipo | pago aplicado antes de completar trabajo o entrega | autorización | ¿reembolsable y a qué se aplica? | Initial hypothesis |
| MONEY-CONCEPT-008 | Abono | pago parcial aplicado a una obligación | movimiento de caja | ¿es alias de pago parcial? | Initial hypothesis |
| MONEY-CONCEPT-009 | Pago | valor recibido/reconocido y potencialmente aplicado | cobro SaaS o caja | ¿cuándo se confirma? | Initial hypothesis |
| MONEY-CONCEPT-010 | Saldo | diferencia vigente calculada entre obligación y aplicaciones | efectivo disponible | ¿quién lo calcula? | Initial hypothesis |
| MONEY-CONCEPT-011 | Saldo pendiente | parte aún no cubierta de una obligación | crédito acordado | ¿impide entrega? | Initial hypothesis |
| MONEY-CONCEPT-012 | Saldo a favor | valor aplicado superior o disponible para devolución/reasignación | descuento | ¿puede trasladarse? | Unknown |
| MONEY-CONCEPT-013 | Reembolso | salida de valor que revierte total o parte de un pago | devolución física | autoridad y medio pendientes | Initial hypothesis |
| MONEY-CONCEPT-014 | Devolución | término ambiguo para reembolso, retorno comercial o entrega de equipo | refund técnico | ¿qué vocabulario usa el taller? | Unknown |
| MONEY-CONCEPT-015 | Cancelación financiera | decisión de anular/revertir efecto financiero dentro de reglas por definir | cancelación de orden | ¿qué hechos permanecen? | Unknown |
| MONEY-CONCEPT-016 | Cargo | importe añadido a una obligación | pago | ¿servicio, penalización o ajuste? | Unknown |
| MONEY-CONCEPT-017 | Contracargo | reversión/disputa iniciada por un proveedor después de un pago | reembolso voluntario | ¿cuándo se considera definitivo? | Initial hypothesis |
| MONEY-CONCEPT-018 | Ajuste | corrección explicada de un importe, aplicación o diferencia | edición silenciosa | autoridad y dirección pendientes | Initial hypothesis |
| MONEY-CONCEPT-019 | Bonificación | valor concedido después o fuera de la formación ordinaria del precio | descuento | ¿genera saldo a favor? | Unknown |
| MONEY-CONCEPT-020 | Crédito | permiso o acuerdo para mantener saldo pendiente | saldo a favor | ¿es caso normal o excepción? | Unknown |
| MONEY-CONCEPT-021 | Cuenta por cobrar | obligación reconocida para cobro posterior | cotización autorizada | ¿existe en el alcance inicial? | Unknown |
| MONEY-CONCEPT-022 | Método de pago | forma declarada de entregar valor | procesador/proveedor | efectivo, terminal, transferencia o mezcla | Initial hypothesis |
| MONEY-CONCEPT-023 | Referencia | identificador o evidencia de un pago externo | identidad del pago | alcance y confiabilidad pendientes | Initial hypothesis |
| MONEY-CONCEPT-024 | Moneda | unidad monetaria inseparable del importe | país o método | ¿una o varias por tenant? | Initial hypothesis |
| MONEY-CONCEPT-025 | Tipo de cambio | relación usada al convertir monedas en un momento | precio | ¿se necesita y qué fuente aplica? | Unknown |
| MONEY-CONCEPT-026 | Movimiento de caja | entrada/salida de control asociada a una caja o sesión | pago | ¿qué movimientos no vienen de pagos? | Initial hypothesis |
| MONEY-CONCEPT-027 | Apertura | inicio de una caja/sesión con responsable y condición | sesión operativa | significado de caja pendiente | Unknown |
| MONEY-CONCEPT-028 | Cierre | final de una caja/sesión con conteo y evidencia | cierre de orden | autoridad y reapertura pendientes | Unknown |
| MONEY-CONCEPT-029 | Corte | observación o conciliación parcial/total de un periodo | cierre definitivo | ¿es hito o documento? | Unknown |
| MONEY-CONCEPT-030 | Diferencia | discrepancia entre esperado y observado | ajuste automático | investigación y responsabilidad pendientes | Initial hypothesis |
| MONEY-CONCEPT-031 | Ingreso | entrada de valor a caja o negocio según contexto | pago aplicado | definición contable fuera de alcance | Unknown |
| MONEY-CONCEPT-032 | Egreso | salida de valor de caja o negocio según contexto | reembolso necesariamente | definición contable fuera de alcance | Unknown |

## Distinciones críticas

| ID | Contraste | Distinción candidata | Riesgo si se mezcla | Referencias |
|---|---|---|---|---|
| MONEY-DIST-001 | anticipo / pago | el anticipo podría ser un pago por momento/propósito | inferir autorización o reembolso | RULE-009, DQ-012 |
| MONEY-DIST-002 | pago / movimiento de caja | pago prueba valor aplicado; caja controla entrada/salida local | duplicar fuente de verdad | EVENT-032, Q022 |
| MONEY-DIST-003 | pago / liquidación | un pago puede dejar saldo; liquidación describe saldo cero conocido | marcar Paid por cada cobro | EVENT-032/035 |
| MONEY-DIST-004 | autorización / cobro | aprobar trabajo no prueba recepción de valor | ejecutar o cobrar indebidamente | RULE-008/009 |
| MONEY-DIST-005 | cotización / obligación | una propuesta emitida podría no ser deuda exigible | cuentas por cobrar prematuras | DQ-009/011/019 |
| MONEY-DIST-006 | precio cotizado / precio final | revisiones, parciales y ajustes pueden diferenciarlos | saldo sobre versión incorrecta | RULE-007/013 |
| MONEY-DIST-007 | devolución / reembolso | devolución es ambigua; reembolso describe salida financiera | mezclar parte, equipo y dinero | EVENT-034 |
| MONEY-DIST-008 | descuento / bonificación | descuento modifica oferta; bonificación podría ocurrir después | historia comercial opaca | POI-4.4 |
| MONEY-DIST-009 | saldo pendiente / crédito | saldo es cálculo; crédito es autoridad/acuerdo | entregar sin seguimiento | RULE-014, INV-015 |
| MONEY-DIST-010 | cancelación operativa / financiera | detener orden no revierte automáticamente pagos/cargos | pérdida de obligación o doble reversa | RULE-018 |
| MONEY-DIST-011 | Payments / Cash Management | Payments conoce pago/aplicación; Cash controla caja/sesión | ownership recíproco | DOMAIN-FINDING-011 |
| MONEY-DIST-012 | pago operativo / Subscription Billing | cliente paga al taller; tenant paga a la plataforma | mezclar deudor, reglas y acceso | DOMAIN-FINDING-012 |

## Ciclos candidatos

| ID | Ciclo | Secuencia candidata | IDs existentes | Preguntas abiertas |
|---|---|---|---|---|
| MONEY-CYCLE-001 | cotización sin pago | EVENT-013/014 → decisión pendiente | RULE-007/008 | DQ-009/011 |
| MONEY-CYCLE-002 | anticipo antes de intervención | EVENT-016/017 → EVENT-033 → EVENT-022 | SCENARIO-007, RULE-009 | ¿pago antes o después de autorización? |
| MONEY-CYCLE-003 | múltiples abonos | EVENT-032 repetido → saldo recalculado | SCENARIO-012/014, DQ-012/019 | aplicación y orden |
| MONEY-CYCLE-004 | pago total | EVENT-032 → EVENT-035 | INV-011 | confirmación externa |
| MONEY-CYCLE-005 | entrega con saldo | saldo pendiente → excepción → EVENT-038 | RULE-014, INV-015, SCENARIO-014 | autoridad y seguimiento |
| MONEY-CYCLE-006 | devolución parcial | EVENT-032 → EVENT-034 parcial | EDGE-030 | límite y medio |
| MONEY-CYCLE-007 | contracargo posterior | EVENT-038 → contracargo TBD | EDGE-031 | estado, saldo y cierre |
| MONEY-CYCLE-008 | cambio tras anticipo | EVENT-033 → EVENT-015 → nueva decisión | SCENARIO-021 | reasignar/reembolsar diferencia |
| MONEY-CYCLE-009 | garantía con cobro parcial | EVENT-041/042 → obligación/cobro TBD | SCENARIO-018/022 | qué está cubierto |
| MONEY-CYCLE-010 | cancelación con gasto | EVENT-024/026 o diagnóstico → EVENT-009 | RULE-018, SCENARIO-015 | cargo permitido y devolución |
| MONEY-CYCLE-011 | pago y entrega en sucursales distintas | EVENT-032 en A → EVENT-038 en B | DQ-031, SCENARIO-020 | caja, alcance y evidencia |
| MONEY-CYCLE-012 | pago mixto | dos métodos → aplicaciones → saldo | POI-4.2 | una o varias identidades de pago |
| MONEY-CYCLE-013 | pago externo no confirmado | intento/referencia → estado incierto → EVENT-032 o fallo TBD | EDGE-038/039 | cuándo reconocer valor |

## Invariantes financieras existentes

| Invariante/regla | Aplicación financiera | Hueco que permanece |
|---|---|---|
| INV-004 | pago y obligación comparten tenant | varias obligaciones o sucursales |
| INV-011 | saldo definitivo considera obligaciones y aplicaciones vigentes conocidas | proveedor externo ambiguo y contracargo |
| INV-015 | entrega con saldo requiere excepción atribuible bajo la hipótesis actual | crédito como flujo normal |
| INV-006/012 | autorización conserva versión de cotización | creación de obligación |
| RULE-007/009/013/014/018/020 | versión, anticipo, saldo, entrega, cancelación y auditoría | autoridad financiera y reversas |

## Gaps financieros para validación

Estos gaps no crean nuevas invariantes canónicas.

| ID | Pregunta | Riesgo | Revisión |
|---|---|---|---|
| MONEY-GAP-001 | ¿Un pago puede aplicarse a varias obligaciones? | saldo duplicado o incompleto | Product Owner/finanzas |
| MONEY-GAP-002 | ¿Todo anticipo es reembolsable y bajo qué deducciones? | promesa financiera incorrecta | Product Owner/legal |
| MONEY-GAP-003 | ¿Un pago puede originar cero, uno o varios movimientos de caja? | conciliación falsa | caja/finanzas |
| MONEY-GAP-004 | ¿Cuándo una cotización autorizada crea obligación? | cobro prematuro | Product Owner/finanzas |
| MONEY-GAP-005 | ¿Cómo se limita un reembolso frente a pagos previos? | devolver más de lo recibido | finanzas |
| MONEY-GAP-006 | ¿Cómo cambia saldo ante contracargo incierto? | entrega/cierre con dato obsoleto | finanzas/operación |
| MONEY-GAP-007 | ¿Una garantía puede tener cargos no cubiertos? | presentar garantía como gratuita | Product Owner/garantías |
| MONEY-GAP-008 | ¿Qué significa saldo a favor y quién puede usarlo? | crédito transversal no autorizado | finanzas |
| MONEY-GAP-009 | ¿Qué monedas y tipo de cambio admite la operación? | importes no comparables | Product Owner/finanzas |
| MONEY-GAP-010 | ¿Qué diferencia de caja puede corregirse y quién responde? | ajustes sin atribución | caja/administración |

## Matriz de ownership financiero candidato

La matriz completa está en [OWNERSHIP_MATRIX](OWNERSHIP_MATRIX.md).

| Información | Referencia de ownership | Fuente candidata | Consumidores | Estado |
|---|---|---|---|---|
| importe cotizado | OWN-026 | Quoting and Authorization | Repair, Payments, cliente | Initial hypothesis |
| importe autorizado | OWN-027 | Quoting and Authorization | Repair, Payments | Initial hypothesis |
| importe pagado | OWN-028 | Payments | Repair, Delivery, Cash | Initial hypothesis |
| saldo | OWN-029 | Payments como cálculo candidato | Repair, Delivery | Initial hypothesis |
| movimiento de caja | OWN-030 | Cash Management/Register | Payments, Reporting, Audit | Unknown |
| reembolso | OWN-028 | Payments, vinculado al pago previo | Cash, Repair, Audit | Initial hypothesis |
| contracargo | OWN-028 | proveedor origina evidencia; Payments normaliza | Repair, Delivery, Audit | Unknown |
| deuda/cuenta por cobrar | OWN-029 | Payments o capacidad financiera TBD | Repair, Reporting | Unknown |
| facturación SaaS | OWN-037 | Subscription Billing | Tenant Administration, Audit | Initial hypothesis |

## Afirmaciones que permanecen abiertas

- DQ-019 mantiene abierta la entrega con saldo.
- MONEY-GAP-002 mantiene abierta la reembolsabilidad del anticipo.
- MONEY-GAP-003 mantiene abierta la cardinalidad pago–caja.
- MONEY-GAP-004 mantiene abierta la relación autorización–cuenta por cobrar.
- MONEY-GAP-007 mantiene abierto el cobro durante garantía.

Ninguna cotización, pago o estado financiero de este documento representa una política contable aprobada.
