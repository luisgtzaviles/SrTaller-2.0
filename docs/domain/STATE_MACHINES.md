# Máquinas de estado candidatas

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Separación obligatoria

Los nombres siguientes son ejemplos para entrevista. Estado operativo, diagnóstico, cotización, finanzas y garantía expresan preguntas diferentes; no se condensan en un único estatus. Un comando solicita una transición, una regla decide si procede y un evento registra el hecho.

## Estado operativo de la orden

**Propósito:** mostrar el hito operativo dominante sin fingir el estado de pago o garantía.

**Estados candidatos:** Draft, Received, UnderReview, AwaitingQuote, AwaitingAuthorization, Authorized, InProgress, WaitingForPart, QualityControl, ReadyForDelivery, Delivered, Cancelled y Closed.

~~~mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Received: RecordIntake
    Received --> UnderReview: StartDiagnosis
    UnderReview --> AwaitingQuote: CompleteDiagnosis
    AwaitingQuote --> AwaitingAuthorization: IssueQuote
    AwaitingAuthorization --> Authorized: ApproveQuote
    Authorized --> InProgress: StartRepair
    InProgress --> WaitingForPart: RequestPart
    WaitingForPart --> InProgress: ResumeRepair
    InProgress --> QualityControl: CompleteRepair
    QualityControl --> InProgress: RequestRework
    QualityControl --> ReadyForDelivery: PassQualityCheck
    ReadyForDelivery --> Delivered: DeliverDevice
    Delivered --> Closed: CloseWorkOrder
    Draft --> Cancelled: CancelWorkOrder
    Received --> Cancelled: CancelWorkOrder
    AwaitingAuthorization --> Cancelled: CancelWorkOrder
    Cancelled --> Closed: CloseWorkOrder
~~~

| Transición | Intención | Reglas previas | Evento | Actores candidatos |
|---|---|---|---|---|
| Draft → Received | RecordIntake | orden y custodia identificables | DeviceIntakeRecorded | Recepcionista |
| Received → UnderReview | StartDiagnosis | alcance de revisión permitido | DiagnosisStarted | Técnico |
| UnderReview → AwaitingQuote | CompleteDiagnosis | conclusión o ruta inconclusa documentada | DiagnosisCompleted | Técnico |
| AwaitingQuote → AwaitingAuthorization | IssueQuote | versión completa y emitible | QuoteIssued | Vendedor/recepción |
| AwaitingAuthorization → Authorized | ApproveQuote | autorización atribuible a versión | RepairAuthorized | Cliente autorizado |
| Authorized → InProgress | StartRepair | alcance y responsable vigentes | RepairStarted | Técnico |
| InProgress ↔ WaitingForPart | RequestPart/ResumeRepair | razón y parte identificadas | PartRequested/RepairStarted | Técnico/supervisor |
| InProgress → QualityControl | CompleteRepair | resultado e intervenciones documentados | RepairCompleted | Técnico |
| QualityControl → InProgress | RequestRework | fallo y alcance de retrabajo | ReworkRequested | QC/supervisor |
| QualityControl → ReadyForDelivery | MarkReadyForDelivery | controles aplicables aprobados | DeviceMarkedReady | Actor por decidir |
| ReadyForDelivery → Delivered | DeliverDevice | receptor y política de saldo satisfechos | DeviceDelivered | Recepción/cajero |
| Delivered/Cancelled → Closed | CloseWorkOrder | pendientes operativos resueltos | WorkOrderClosed | Gerente/proceso |

**Transiciones prohibidas candidatas:** Draft → Delivered; AwaitingAuthorization → InProgress sin autorización válida; QualityControl → ReadyForDelivery tras fallo sin nueva evaluación; Closed → InProgress sin un comando explícito de reapertura todavía no aprobado.

**Preguntas:** DQ-018/020/029. Cancelled no debería ser accesible desde cualquier estado sin evaluar custodia, consumos y pagos. La reapertura podría ser excepcional o reemplazarse por orden relacionada.

## Estado del diagnóstico

**Propósito:** expresar progreso y certeza de la evaluación, independiente del estado de la orden.

~~~mermaid
stateDiagram-v2
    [*] --> NotStarted
    NotStarted --> InProgress: StartDiagnosis
    InProgress --> Completed: CompleteDiagnosis
    InProgress --> Inconclusive: MarkDiagnosisInconclusive
    Inconclusive --> InProgress: ResumeDiagnosis
~~~

| Estados y transición | Intención | Regla previa | Evento | Actor |
|---|---|---|---|---|
| NotStarted → InProgress | StartDiagnosis | responsable y permiso de revisión | DiagnosisStarted | Técnico |
| InProgress → Completed | CompleteDiagnosis | hallazgos y conclusión documentados | DiagnosisCompleted | Técnico |
| InProgress → Inconclusive | MarkDiagnosisInconclusive | límites o evidencia insuficiente explicados | DiagnosisMarkedInconclusive | Técnico |
| Inconclusive → InProgress | ResumeDiagnosis | nueva evidencia o autorización | DiagnosisStarted | Técnico/supervisor |

**Prohibidas candidatas:** NotStarted → Completed sin atribución; Completed → InProgress sobrescribiendo resultado anterior. Un diagnóstico nuevo podría ser otra revisión, no mutación silenciosa.

**Preguntas:** ¿puede cotizarse desde NotStarted o Inconclusive?, ¿hay diagnósticos múltiples o pagados?, ¿quién puede concluir? DQ-008/026.

## Estado de cotización

**Propósito:** conservar preparación, emisión y decisión sobre cada versión.

~~~mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Issued: IssueQuote
    Issued --> Approved: ApproveQuote
    Issued --> PartiallyApproved: PartiallyApproveQuote
    Issued --> Rejected: RejectQuote
    Issued --> Expired: ExpireQuote
    Issued --> Superseded: ReviseQuote
    PartiallyApproved --> Superseded: ReviseQuote
    Draft --> Cancelled: CancelQuote
    Issued --> Cancelled: CancelQuote
~~~

| Transición | Intención | Regla previa | Evento | Actor |
|---|---|---|---|---|
| Draft → Issued | IssueQuote | versión, partidas, total y vigencia conocidos | QuoteIssued | Vendedor/recepción |
| Issued → Approved | ApproveQuote | decisor y versión verificables | QuoteApproved | Cliente autorizado |
| Issued → PartiallyApproved | PartiallyApproveQuote | partidas aceptadas explícitas | QuotePartiallyApproved | Cliente autorizado |
| Issued → Rejected | RejectQuote | decisión atribuible | QuoteRejected | Cliente autorizado |
| Issued → Expired | ExpireQuote | vigencia vencida según política | QuoteExpired | Proceso |
| Issued/PartiallyApproved → Superseded | ReviseQuote | nueva versión conserva anterior | QuoteRevised | Quoting |

**Prohibidas candidatas:** editar Issued; aprobar Expired/Superseded; cambiar Approved sin crear versión y nueva autorización. **Pregunta clave:** una cotización aprobada sí puede requerir cambio, pero la aprobación previa no debe extenderse automáticamente. DQ-009/011.

## Estado financiero

**Propósito:** expresar aplicación y reversa de valor, independiente de progreso técnico.

~~~mermaid
stateDiagram-v2
    [*] --> Unpaid
    Unpaid --> PartiallyPaid: RecordPayment
    Unpaid --> Paid: RecordPayment
    PartiallyPaid --> Paid: RecordPayment
    Paid --> PartiallyRefunded: RefundPayment
    Paid --> Refunded: RefundPayment
    PartiallyPaid --> PartiallyRefunded: RefundPayment
    PartiallyPaid --> WrittenOff: WriteOffBalance
    Unpaid --> WrittenOff: WriteOffBalance
~~~

| Transición | Intención | Regla previa | Evento | Actor |
|---|---|---|---|---|
| Unpaid/PartiallyPaid → PartiallyPaid/Paid | RecordPayment | pago válido y aplicado | PaymentRecorded; BalanceSettled si cero | Cajero |
| Paid/PartiallyPaid → PartiallyRefunded/Refunded | RefundPayment | pago previo, importe y autoridad | PaymentRefunded | Cajero/supervisor |
| Unpaid/PartiallyPaid → WrittenOff | WriteOffBalance | autoridad y motivo excepcionales | Evento por definir | Gerente |

**Prohibidas candidatas:** marcar Paid sin aplicaciones suficientes; refund superar lo pagado; usar importe negativo como devolución. Contracargos pueden requerir estado/evento aparte.

**Preguntas:** ¿pago completo es requisito obligatorio de entrega? Se mantiene como política candidata con excepción, no invariante aprobada. DQ-012/019.

## Estado de garantía

**Propósito:** separar elegibilidad/cobertura de la vida de una reclamación.

~~~mermaid
stateDiagram-v2
    [*] --> NotApplicable
    [*] --> Eligible
    Eligible --> Active: ActivateWarranty
    Active --> Expired: ExpireWarranty
    Active --> ClaimOpened: OpenWarrantyClaim
    ClaimOpened --> UnderEvaluation: StartWarrantyEvaluation
    UnderEvaluation --> Accepted: AcceptWarrantyClaim
    UnderEvaluation --> Rejected: RejectWarrantyClaim
    Accepted --> Resolved: ResolveWarranty
    Rejected --> Resolved: CloseRejectedClaim
~~~

| Transición | Intención | Regla previa | Evento | Actor |
|---|---|---|---|---|
| Eligible → Active | ActivateWarranty | entrega/inicio y cobertura conocidos | WarrantyActivated | Proceso autorizado |
| Active → ClaimOpened | OpenWarrantyClaim | solicitud vinculada y dentro de criterio inicial | WarrantyClaimOpened | Recepción/cliente |
| ClaimOpened → UnderEvaluation | StartWarrantyEvaluation | responsable y evidencia inicial | Evento por definir | Técnico/supervisor |
| UnderEvaluation → Accepted/Rejected | Accept/RejectWarrantyClaim | cobertura evaluada y motivo | WarrantyClaimAccepted/Rejected | Autoridad por decidir |
| Accepted/Rejected → Resolved | ResolveWarranty | acción o cierre documentado | WarrantyResolved | Warranty |

**Prohibidas candidatas:** ClaimOpened → Accepted sin evaluación; Expired → Active sin extensión explícita; alterar la orden original para ocultar reclamación.

**Preguntas:** NotApplicable/Eligible/Active describen cobertura, mientras ClaimOpened–Resolved describen una reclamación; podrían ser dos máquinas o agregados. Garantía como caso separado es hipótesis preferente, no decisión. DQ-021.

## Análisis transversal

- **Delivered vs. Closed:** deben permanecer separados durante discovery: Delivered prueba transferencia física; Closed indica ausencia de trabajo operativo pendiente.
- **Ready:** puede ser un hito derivado de QC o un estado operativo real. No debe ser sólo color o etiqueta visual.
- **Garantía:** puede pertenecer a cobertura derivada de la orden, mientras una reclamación vive en un caso relacionado.
- **Cancelación:** no es universal; cada fase debe resolver custodia, partes, pagos y evidencia.
- **Reapertura:** no aprobada; comparar reabrir con crear orden/reclamación relacionada.
- **Cambio de cotización aprobada:** requiere nueva versión y análisis de nueva autorización.
- **Entrega y pago:** pago completo no es requisito aprobado; cualquier política deberá describir crédito y excepción.
