# Panorama del Future State de recepción

**Estado:** `Proposed`.
**Propósito:** Representar el recorrido operativo candidato desde consulta comercial hasta disponibilidad para la siguiente fase.
**Alcance:** Veintiún pasos de atención, recepción, custodia, riesgo, evidencia, orden y comprobante.
**Fuente:** Current State Event Storming, auditorías legacy, evidencia del Product Owner y dominio canónico no aprobado.
**Audiencia:** Product Owner, Operaciones, Recepción, Seguridad, Legal y Arquitectura.
**Última actualización:** 2026-07-14.

## Principio del recorrido

La interacción comercial sigue siendo ligera. La formalidad comienza cuando la persona decide dejar el equipo. A partir de ahí, cada dato adicional debe justificar custodia, contacto, riesgo, evidencia o avance; no se propone pedir información sin propósito.

## Recorrido propuesto de 21 pasos

| # | Fase | Intención | Hecho candidato | Condición o salida | Estado |
|---:|---|---|---|---|---|
| 1 | Pre-recepción | `FSR-COMMAND-001` StartCommercialInquiry | `FSR-EVENT-001` CommercialInquiryStarted | No crea orden. | `Recommended` |
| 2 | Pre-recepción | Identificar marca, modelo, falla y origen | `FSR-EVENT-002` DeviceBasicsIdentified | Información suficiente para orientar, no para diagnosticar. | `Recommended` |
| 3 | Pre-recepción | `FSR-COMMAND-002` PresentServiceAlternative | `FSR-EVENT-003` ServiceAlternativePresented | Puede haber varias calidades o rangos. | `Proposed` |
| 4 | Pre-recepción | Persona decide continuar o no | `FSR-EVENT-004` CustomerDeclinedService o `FSR-EVENT-005` CustomerAcceptedReception | Rechazo termina sin orden; aceptación habilita recepción. | `Recommended` |
| 5 | Recepción formal | `FSR-COMMAND-003` StartReception | `FSR-EVENT-006` ReceptionStarted | Comienza responsabilidad de captura/custodia. | `Recommended` |
| 6 | Identidad/contacto | `FSR-COMMAND-004/005` SelectOrderCustomer / RegisterOrderContact | `FSR-EVENT-007` OrderCustomerSelected y `FSR-EVENT-008` OrderContactRecorded | Cliente y contacto pueden coincidir, pero no se presumen iguales. | `Recommended` |
| 7 | Identidad/contacto | `FSR-COMMAND-006` RegisterDeliveringPerson cuando aplique | `FSR-EVENT-009` DeliveringPersonRecorded | Captura opcional o condicionada; política pendiente. | `Pending Product Owner validation` |
| 8 | Custodia/dispositivo | `FSR-COMMAND-007` DescribeReceivedDevice | `FSR-EVENT-010` ReceivedDeviceDescribed | Describe el objeto físico recibido. | `Recommended` |
| 9 | Custodia/dispositivo | `FSR-COMMAND-008` RecordDeviceIdentifier | `FSR-EVENT-011` DeviceIdentifierRecorded | IMEI, serie o identificador alterno; ausencia permitida. | `Recommended` |
| 10 | Condición/evidencia | `FSR-COMMAND-009` RecordInitialCondition | `FSR-EVENT-012` InitialConditionInspected | Registra lo observable y lo no comprobable. | `Recommended` |
| 11 | Custodia | `FSR-COMMAND-010` RecordCustodyItem | `FSR-EVENT-013` CustodyItemRecorded | Accesorio: presente, ausente o desconocido. | `Recommended` |
| 12 | Riesgo | `FSR-COMMAND-011` IdentifyReceptionRisk | `FSR-EVENT-014` ReceptionRiskIdentified | Identificación interna aún no equivale a consentimiento. | `Recommended` |
| 13 | Riesgo | `FSR-COMMAND-012` CommunicateReceptionRisk | `FSR-EVENT-015` ReceptionRiskCommunicated | Riesgo y alcance se explican a decisor. | `Recommended` |
| 14 | Riesgo | `FSR-COMMAND-013` RecordRiskDecision | `FSR-EVENT-016` ReceptionRiskAccepted o `FSR-EVENT-017` ReceptionRiskRejected | Decisión atribuible; rechazo puede terminar o limitar recepción. | `Pending legal review` |
| 15 | Acceso | `FSR-COMMAND-014` DefineDeviceAccessMethod | `FSR-EVENT-018` DeviceAccessMethodDefined | Incluye “no proporcionado”; no obliga a guardar secreto. | `Pending security review` |
| 16 | Orden | `FSR-COMMAND-015` CreateWorkOrder | `FSR-EVENT-019` WorkOrderCreated | Sólo con recepción mínima válida o excepción candidata. | `Recommended` |
| 17 | Orden | `FSR-COMMAND-016` AssignWorkOrderNumber | `FSR-EVENT-020` WorkOrderNumberAssigned | Se asigna de forma segura, no por predicción. | `Recommended` |
| 18 | Comprobante | `FSR-COMMAND-017` IssueReceptionReceipt | `FSR-EVENT-021` ReceptionReceiptIssued | Corresponde a una versión concreta de recepción. | `Pending legal review` |
| 19 | Evidencia | `FSR-COMMAND-018` CaptureInitialEvidence o `FSR-COMMAND-019` MarkInitialEvidencePending | `FSR-EVENT-022` InitialEvidenceCaptured o `FSR-EVENT-023` InitialEvidenceMarkedPending | Obligatoriedad depende de política; pendiente es visible. | `Pending operations validation` |
| 20 | Cierre de recepción | `FSR-COMMAND-020` CompleteReception | `FSR-EVENT-024` ReceptionCompleted | Cumple mínimos o excepción atribuible. | `Recommended` |
| 21 | Frontera siguiente | Consecuencia de recepción completa | `FSR-EVENT-025` DeviceMadeAvailableForDiagnosis | No significa diagnóstico iniciado ni reparación autorizada. | `Recommended` |

## 1. Pre-recepción comercial

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| `FSR-ACTOR-001` Persona que consulta; `FSR-ACTOR-005` Recepción | `FSR-COMMAND-001/002` | `FSR-EVENT-001` a `005` | `FSR-POLICY-001` atención comercial no crea orden | `FSR-INFO-005` básicos del dispositivo y necesidad expresada; precio/calidad comunicados | Consulta termina sin orden si la persona declina | `FSR-DECISION-001`: frontera exacta entre consulta y recepción |

**Estado del bloque:** `Recommended`. La oferta comercial no se presenta como diagnóstico, cotización formal ni compromiso contractual.

## 2. Recepción formal

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| `FSR-ACTOR-005` Recepción; `FSR-ACTOR-002` Persona que entrega | `FSR-COMMAND-003` | `FSR-EVENT-006` | `FSR-POLICY-002` orden nace al confirmar mínimos, no al iniciar captura | Motivo, sucursal y referencia temporal del inicio | Interrupción antes de confirmar no crea orden | `FSR-DECISION-002`: momento exacto de nacimiento |

**Estado del bloque:** `Pending Product Owner validation` para definir si el inicio de custodia física precede a la creación de orden y cómo se identifica durante esos minutos.

## 3. Identidad y contacto

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| Cliente operativo, contacto, persona que entrega y recepción (`FSR-ACTOR-002` a `005`) | `FSR-COMMAND-004` a `006` | `FSR-EVENT-007` a `009` | `FSR-POLICY-004/005/006` | `FSR-INFO-001` cliente; `002` contacto; `003` entregante; `004` propietario declarado | Contacto ausente o entregante no capturado requiere regla explícita, no identidad inventada | `FSR-DECISION-004` a `008` |

**Estado del bloque:** `Pending Product Owner validation`. Se recomienda buscar por teléfono sin fusionar ni tratarlo como identidad única.

## 4. Custodia

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| Persona que entrega y recepción | `FSR-COMMAND-007`, `008`, `010` | `FSR-EVENT-010`, `011`, `013` | `FSR-POLICY-007/008/009` | `FSR-INFO-005` dispositivo y `006` custodia/accesorios | Identificador ausente y accesorio incierto son valores válidos, no datos falsos | `FSR-DECISION-009/010/012` |

**Estado del bloque:** `Recommended`; la continuidad histórica del dispositivo sigue `Pending architecture review`.

## 5. Condición y evidencia

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| Recepción; persona que entrega como fuente | `FSR-COMMAND-009`, `018`, `019` | `FSR-EVENT-012`, `022`, `023` | `FSR-POLICY-010/014/015` | `FSR-INFO-006` condición; `009` evidencia con propósito | Equipo apagado, cámara no disponible o evidencia pendiente deben quedar visibles | `FSR-DECISION-011/013/014` |

**Estado del bloque:** `Pending operations validation`; no se propone que toda recepción exija el mismo número de fotografías.

## 6. Riesgo y consentimiento

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| Recepción y `FSR-ACTOR-006` Decisor de riesgo | `FSR-COMMAND-011` a `013` | `FSR-EVENT-014` a `017` | `FSR-POLICY-011/012` | `FSR-INFO-007`: riesgo, comunicación, decisión, actor, momento, alcance y evidencia | Rechazo puede cancelar ingreso o limitar alcance; resultado debe quedar explícito | `FSR-DECISION-015/016` |

**Estado del bloque:** `Pending legal review`. Seleccionar un riesgo internamente nunca cuenta como aceptación.

## 7. Credencial y acceso

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| Cliente/contacto autorizado, recepción y personal futuro con propósito | `FSR-COMMAND-014` | `FSR-EVENT-018` | `FSR-POLICY-013` credencial no es dato ordinario | `FSR-INFO-008`: método, propósito, alcance, disponibilidad y límites | “No proporcionado” y acceso asistido son resultados válidos | `FSR-DECISION-017` política de credenciales |

**Estado del bloque:** `Pending security review`; no se decide tecnología ni se presupone que un secreto deba almacenarse.

## 8. Creación y número de orden

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| Recepción y `FSR-ACTOR-008` Sistema | `FSR-COMMAND-015/016` | `FSR-EVENT-019/020` | `FSR-POLICY-002/003` | Sucursal, cliente operativo, contacto aplicable, dispositivo recibido y mínimos de recepción | `FSR-POLICY-018` permite excepción atribuible, si se aprueba | `FSR-DECISION-002/003/020` |

**Estado del bloque:** `Recommended`. “Asignación segura” expresa ausencia de colisión, no una técnica concreta.

## 9. Comprobante

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| Recepción, sistema y `FSR-ACTOR-009` Canal de entrega del comprobante | `FSR-COMMAND-017` | `FSR-EVENT-021` | `FSR-POLICY-016` comprobante corresponde a versión concreta | `FSR-INFO-010`: folio, versión, contenido, riesgos/aceptación, emisor, momento y entrega | Falla de impresión no debe borrar orden; emisión alternativa por validar | `FSR-DECISION-018` valor/versionado del comprobante |

**Estado del bloque:** `Pending legal review`; comprobante emitido no significa necesariamente impreso en papel.

## 10. Cierre de recepción

| Actor | Comando | Evento | Política | Información requerida | Excepción | Decisión pendiente |
|---|---|---|---|---|---|---|
| Recepción; supervisor sólo para excepción | `FSR-COMMAND-020` | `FSR-EVENT-024/025` | `FSR-POLICY-017/018` | Mínimos completos, evidencia resuelta o pendiente permitida, riesgos decididos y acceso definido | Excepción con autoridad, motivo, pendientes y límite de avance | `FSR-DECISION-019/020` |

**Estado del bloque:** `Pending operations validation`. Completar recepción no implica diagnóstico, reparación autorizada ni pago total.
