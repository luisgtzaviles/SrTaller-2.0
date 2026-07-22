# Comandos, actores y políticas candidatas

**Estado:** `Proposed`.
**Propósito:** Mapear quién intenta cada decisión, qué resultado puede producir y qué política candidata la gobierna.
**Alcance:** Segmento comercial y de recepción hasta habilitar el dispositivo para diagnóstico.
**Fuente:** Future State Big Picture, Current State, auditorías legacy y reglas canónicas no aprobadas.
**Audiencia:** Product Owner, Operaciones, Recepción, Seguridad, Legal y Arquitectura.
**Última actualización:** 2026-07-14.

## Actores candidatos

No son roles de autorización ni perfiles técnicos aprobados.

| ID | Actor/perspectiva | Responsabilidad candidata | Límite | Estado |
|---|---|---|---|---|
| `FSR-ACTOR-001` | Persona que consulta | Expresar necesidad y decidir si continúa. | Puede no ser cliente, propietario ni entregante. | `Proposed` |
| `FSR-ACTOR-002` | Persona que entrega | Transferir físicamente el equipo y declarar relaciones/accesorios. | No se presume propietaria ni autorizada para todo. | `Proposed` |
| `FSR-ACTOR-003` | Cliente operativo de la orden | Ser la referencia nominal del caso. | No equivale automáticamente a contacto o propietario. | `Pending Product Owner validation` |
| `FSR-ACTOR-004` | Contacto de la orden | Recibir comunicaciones y quizá decidir según propósito/autoridad. | Registrar teléfono no concede toda autoridad. | `Pending Product Owner validation` |
| `FSR-ACTOR-005` | Personal de recepción | Orientar, capturar, inspeccionar y confirmar recepción. | Excepciones y datos sensibles requieren autoridad diferenciada. | `Pending operations validation` |
| `FSR-ACTOR-006` | Persona decisora de riesgo | Aceptar, rechazar o limitar el riesgo comunicado. | Autoridad legal/operativa depende de relación y caso. | `Pending legal review` |
| `FSR-ACTOR-007` | Supervisor de recepción | Autorizar una excepción candidata y responder por pendientes. | No es rol ni aprobación automática; si actúa como segundo aprobador debe cumplir ADR-013. | `Pending Product Owner validation` |
| `FSR-ACTOR-008` | Sistema de operación | Confirmar resultados, asignar referencia y exponer pendientes. | No prescribe componente ni arquitectura. | `Pending architecture review` |
| `FSR-ACTOR-009` | Canal del comprobante | Entregar o materializar una versión emitida. | Canal no es autoridad sobre contenido. | `Proposed` |
| `FSR-ACTOR-010` | Siguiente fase de diagnóstico | Consumir recepción completa y límites visibles. | No corrige ni completa silenciosamente la recepción. | `Proposed` |

## Comandos candidatos

| ID / comando | Intención | Actor candidato | Precondiciones | Evento posible | Rechazos/excepciones | Estado / revisión |
|---|---|---|---|---|---|---|
| `FSR-COMMAND-001` StartCommercialInquiry | Comenzar consulta y obtener básicos del equipo. | `FSR-ACTOR-001/005` | Necesidad expresada. | `FSR-EVENT-001/002` | Datos desconocidos no bloquean orientación. | `Recommended`; Operaciones |
| `FSR-COMMAND-002` PresentServiceAlternative | Comunicar alternativa de servicio/calidad/precio. | `FSR-ACTOR-005` | Básicos suficientes; fuente válida por definir. | `FSR-EVENT-003`; después `004/005` | No presentar diagnóstico ni compromiso falso. | `Proposed`; Product Owner |
| `FSR-COMMAND-003` StartReception | Declarar inicio de recepción formal. | `FSR-ACTOR-005` | `FSR-EVENT-005`; sucursal válida. | `FSR-EVENT-006` | Persona declina o equipo no se entrega. | `Pending Product Owner validation` |
| `FSR-COMMAND-004` SelectOrderCustomer | Elegir cliente operativo tras contrastar coincidencias. | `FSR-ACTOR-005` | Búsqueda y procedencia visibles. | `FSR-EVENT-007` | Coincidencia ambigua; no fusionar automáticamente. | `Recommended`; Product Owner |
| `FSR-COMMAND-005` RegisterOrderContact | Registrar contacto y propósito para esta orden. | `FSR-ACTOR-005`, con declaración de persona | Cliente elegido o excepción. | `FSR-EVENT-008` | Número inválido/compartido o autoridad incierta queda visible. | `Recommended`; Seguridad |
| `FSR-COMMAND-006` RegisterDeliveringPerson | Registrar entregante cuando la política lo exija o aporte valor. | `FSR-ACTOR-005` | Recepción activa y regla de captura aplicable. | `FSR-EVENT-009` | Captura puede omitirse en caso estándar si así se valida. | `Pending Product Owner validation` |
| `FSR-COMMAND-007` DescribeReceivedDevice | Describir el objeto físico bajo custodia. | `FSR-ACTOR-005` | Equipo presente. | `FSR-EVENT-010` | Marca/modelo desconocidos admiten rasgos alternos. | `Recommended`; Operaciones |
| `FSR-COMMAND-008` RecordDeviceIdentifier | Registrar identificador o ausencia explícita. | `FSR-ACTOR-005` | Dispositivo descrito. | `FSR-EVENT-011` | Conflicto/duplicado no se resuelve automáticamente. | `Recommended`; Arquitectura |
| `FSR-COMMAND-009` RecordInitialCondition | Documentar condición y límites de inspección. | `FSR-ACTOR-005` | Equipo observable en algún grado. | `FSR-EVENT-012` | Apagado/bloqueado: marcar no comprobable. | `Recommended`; Operaciones/Legal |
| `FSR-COMMAND-010` RecordCustodyItem | Declarar accesorio presente, ausente o desconocido. | `FSR-ACTOR-005`, fuente `002` | Recepción activa. | `FSR-EVENT-013` | Incertidumbre se conserva; no se convierte en “no”. | `Recommended`; Operaciones |
| `FSR-COMMAND-011` IdentifyReceptionRisk | Registrar un riesgo observado/declarado. | `FSR-ACTOR-005` | Condición o relato suficiente. | `FSR-EVENT-014` | Riesgo duplicado o no aplicable puede rechazarse con razón. | `Recommended`; Operaciones |
| `FSR-COMMAND-012` CommunicateReceptionRisk | Explicar riesgo y alcance a decisor. | `FSR-ACTOR-005` | Riesgo identificado y destinatario disponible. | `FSR-EVENT-015` | Sin comunicación no puede registrarse aceptación. | `Recommended`; Legal |
| `FSR-COMMAND-013` RecordRiskDecision | Registrar aceptación, rechazo o límite atribuible. | `FSR-ACTOR-005`, decisión de `006` | Riesgo comunicado; autoridad suficiente. | `FSR-EVENT-016/017` | Decisor no autorizado o evidencia insuficiente. | `Pending legal review` |
| `FSR-COMMAND-014` DefineDeviceAccessMethod | Definir acceso asistido, protegido, temporal o no proporcionado. | `FSR-ACTOR-005` con cliente/contacto autorizado | Propósito y alcance identificados. | `FSR-EVENT-018` | Secreto ordinario/inseguro debe rechazarse. | `Pending security review` |
| `FSR-COMMAND-015` CreateWorkOrder | Confirmar nacimiento de orden con mínimos válidos. | `FSR-ACTOR-005/008` | Recepción mínima o excepción `FSR-DECISION-020`. | `FSR-EVENT-019` | Contexto inválido, identidad/custodia insuficiente. | `Recommended`; Product Owner/Arquitectura |
| `FSR-COMMAND-016` AssignWorkOrderNumber | Asignar referencia pública segura. | `FSR-ACTOR-008` | Orden creada. | `FSR-EVENT-020` | Colisión o contexto inválido no deben producir asignación falsa. | `Recommended`; Arquitectura |
| `FSR-COMMAND-017` IssueReceptionReceipt | Emitir comprobante de una versión concreta. | `FSR-ACTOR-005/008` | Orden numerada y contenido coherente. | `FSR-EVENT-021` | Fallo de canal no elimina orden; emisión queda pendiente. | `Pending legal review` |
| `FSR-COMMAND-018` CaptureInitialEvidence | Capturar evidencia con propósito de recepción. | `FSR-ACTOR-005` | Orden/recepción identificable y privacidad aplicable. | `FSR-EVENT-022` | Fallo de captura produce pendiente, no silencio. | `Pending operations validation` |
| `FSR-COMMAND-019` MarkInitialEvidencePending | Declarar evidencia faltante y condición de resolución. | `FSR-ACTOR-005/007` | Evidencia aplicable no capturable. | `FSR-EVENT-023` | Sin motivo/responsable/bloqueo según política. | `Recommended`; Operaciones |
| `FSR-COMMAND-020` CompleteReception | Confirmar mínimos y cerrar la fase. | `FSR-ACTOR-005`; `007` para excepción | Información, decisiones y evidencia resueltas según política. | `FSR-EVENT-024/025` | Pendiente bloqueante o excepción inválida. | `Recommended`; Product Owner/Operaciones |

## Políticas candidatas

| ID | Política | Tipo | Justificación / evidencia actual | Mejora propuesta | Riesgo | Excepción candidata | Estado | Validación requerida |
|---|---|---|---|---|---|---|---|---|
| `FSR-POLICY-001` | La atención comercial no crea una orden. | Frontera operativa | PO confirma consulta previa y abandono posible; Current State no registra esa fase. | Mantener mostrador ligero y evitar órdenes sin custodia. | Perder contexto útil si se exige cero registro. | Registro comercial mínimo fuera de orden, si aporta valor. | `Recommended` | Product Owner / Operaciones |
| `FSR-POLICY-002` | La orden sólo nace al confirmar una recepción mínima válida. | Política de nacimiento | Current State nace tras guardado, pero mínimos semánticos no están definidos. | Alinear nacimiento con identidad/custodia suficientes. | Captura demasiado extensa retrasa mostrador. | `FSR-POLICY-018`. | `Recommended` | Product Owner / Operaciones |
| `FSR-POLICY-003` | El número se asigna de forma segura al crear la orden, no por predicción. | Integridad | `LEGACY-NR-FINDING-001`, `CSE-HOTSPOT-003`. | Evitar colisión y sticker divergente. | Dependencia tecnológica prematura si se prescribe mecanismo. | Referencia temporal visible, no folio final, durante captura. | `Recommended` | Arquitectura / Operaciones |
| `FSR-POLICY-004` | Cliente, contacto y entregante son conceptos distintos aunque coincidan. | Identidad/custodia | PO y `CSE-HOTSPOT-001`. | Registrar propósito de cada relación sin duplicar datos innecesarios. | Sobrecarga si siempre se preguntan tres personas. | Reutilizar la misma persona con roles declarados. | `Recommended` | Product Owner / Legal |
| `FSR-POLICY-005` | El teléfono localiza coincidencias, no es identidad única. | Identidad | Dedupe legacy y teléfonos compartidos. | Contrastar antes de seleccionar/crear; no fusionar automáticamente. | Duplicados si el contraste es demasiado débil. | Cliente sin teléfono o contacto alterno. | `Recommended` | Product Owner / Arquitectura |
| `FSR-POLICY-006` | La orden conserva una representación histórica mínima de cliente/contacto. | Trazabilidad | Snapshot legacy útil pero ambiguo. | Preservar lo usado en la recepción y permitir correcciones trazables. | Copia obsoleta confundida con dato vivo. | Corrección anexada con procedencia. | `Recommended` | Product Owner / Arquitectura |
| `FSR-POLICY-007` | El dispositivo recibido puede existir sin IMEI/serie. | Custodia | PO y escenario actual sin IMEI. | Usar rasgos e identificadores alternos, declarando incertidumbre. | Confusión entre dispositivos parecidos. | Evidencia física/etiqueta reforzada según riesgo. | `Recommended` | Operaciones |
| `FSR-POLICY-008` | La custodia física queda ligada a la orden desde recepción. | Custodia | Current State usa sticker/folio, pero acto no está estructurado. | Atribuir sucursal, actor, momento, dispositivo y accesorios. | Minutos previos al nacimiento de orden quedan ambiguos. | Referencia temporal durante captura. | `Pending Product Owner validation` | Product Owner / Operaciones |
| `FSR-POLICY-009` | Accesorios distinguen `sí`, `no` y `desconocido`. | Calidad de información | Vacío/booleano no expresa incertidumbre. | Evitar disputas por chip, memoria, funda o cargador. | Lista excesiva hace lenta la captura. | Catálogo corto/configurable y “otro” narrativo. | `Recommended` | Operaciones |
| `FSR-POLICY-010` | Condición inicial tiene estructura o narrativa con propósito claro. | Evidencia/custodia | `CSE-EVENT-010`, fotos posteriores y mezcla con falla. | Separar observación, relato y no comprobable. | Falsa precisión o captura larga. | Inspección mínima proporcional al tipo/riesgo. | `Recommended` | Operaciones / Legal |
| `FSR-POLICY-011` | Un riesgo no queda aceptado porque un empleado lo seleccionó. | Consentimiento | `LEGACY-NR-FINDING-007`, `CSE-HOTSPOT-007`. | Separar identificación, comunicación y decisión. | Recepción detenida por formalidad desproporcionada. | Riesgo informativo no material puede no requerir aceptación. | `Recommended` | Product Owner / Legal |
| `FSR-POLICY-012` | Aceptar riesgo registra actor, momento, alcance y evidencia suficiente. | Consentimiento/auditoría | Legacy no demuestra aceptación. | Hacer decisión atribuible y revisable. | Recopilar datos excesivos o firmas innecesarias. | Evidencia proporcional al riesgo/canal. | `Pending legal review` | Legal / Seguridad / Product Owner |
| `FSR-POLICY-013` | La credencial no se trata como dato ordinario. | Seguridad | Secreto reversible/expuesto en legacy. | Preferir no guardar, acceso asistido o método temporal/protegido según revisión. | Bloquear pruebas legítimas o retener secreto sensible. | “Acceso no proporcionado” con límites visibles. | `Pending security review` | Seguridad / Product Owner |
| `FSR-POLICY-014` | Una orden puede existir con evidencia pendiente sólo bajo política explícita. | Continuidad operativa | PO confirma que hoy puede quedar pendiente. | Mantener velocidad sin ocultar falta. | Diagnóstico avanza sin base de custodia. | Tipo de servicio/riesgo o falla de captura autorizada. | `Pending operations validation` | Operaciones / Legal |
| `FSR-POLICY-015` | La evidencia pendiente es visible y accionable. | Trazabilidad | Current State carece de pendiente estructurado. | Conservar motivo, responsable y condición de resolución/bloqueo. | Acumulación de pendientes ignorados. | Cierre justificado por supervisor si deja de aplicar. | `Recommended` | Operaciones / Arquitectura |
| `FSR-POLICY-016` | El comprobante corresponde a una versión concreta de recepción. | Documento/evidencia | Reimpresión actual reconstruye presente. | Reproducir lo emitido y distinguir reimpresión. | Versionado complejo sin valor legal definido. | Corrección posterior genera nueva versión o anexo. | `Pending legal review` | Legal / Operaciones / Arquitectura |
| `FSR-POLICY-017` | Completar recepción no implica diagnóstico, autorización de reparación ni pago total. | Separación semántica | Current State mezcla hitos y canónicos los distinguen. | Proteger fronteras y lenguaje. | Usuarios podrían esperar automatismos implícitos. | Ninguna: las fases posteriores conservan sus propias decisiones. | `Recommended` | Product Owner / Operaciones |
| `FSR-POLICY-018` | No pasa a diagnóstico hasta recepción completa o excepción autorizada. | Regla de avance | Evidencia/condición pueden quedar pendientes hoy. | Evitar avance prematuro con excepción atribuible y limitada. | Supervisor convertido en bypass habitual. | Autoridad, motivo, pendientes y límites; clasificar nivel 2–4 conforme a ADR-013 si se aprueba. | `Pending Product Owner validation` | Product Owner / Operaciones / Seguridad |

## Criterio de rechazo

Un comando rechazado no produce el evento de éxito. Puede conservarse evidencia mínima del intento cuando sea necesaria para custodia, seguridad o auditoría, pero esa necesidad permanece `Pending security review` y no autoriza registrar contenido sensible indiscriminadamente.
