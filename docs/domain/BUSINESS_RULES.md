# Reglas de negocio candidatas

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Convención

Todas las reglas tienen estado Candidate / Unapproved. El origen explica por qué se propuso; no demuestra que sea correcta. Product Owner sólo podrá aparecer como origen después de aportar evidencia, por lo que ninguna regla actual usa ese origen.

| ID | Título | Estado | Descripción | Motivo | Ejemplo | Excepción | Responsable/contexto | Conceptos | Origen | ¿Validar? | Preguntas |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RULE-001 | Creación de la orden | Candidate / Unapproved | Una orden se abre para un tenant, sucursal de origen, dispositivo y propósito identificables. | Atribuir custodia y alcance. | Recepción abre OT-123 al aceptar un teléfono. | Atención sin custodia o cliente aún no identificado. | Recepción | Orden, dispositivo, sucursal | Documentation inference | Sí | DQ-001/002 |
| RULE-002 | Identificación del cliente | Candidate / Unapproved | Se busca antes de crear y no se fusionan coincidencias automáticamente. | Evitar duplicados y atribuciones erróneas. | Dos nombres iguales requieren contraste. | Cliente sin medio de contacto. | Customer Management | Cliente, contacto | Industry hypothesis | Sí | DQ-004 |
| RULE-003 | Propiedad no presumida | Candidate / Unapproved | Cliente, propietario, contacto y entregante se registran como relaciones distintas cuando difieran. | No atribuir autoridad por conveniencia. | Padre entrega teléfono de su hija. | Operación donde propiedad no pueda verificarse. | Recepción | Cliente, propietario, dispositivo | Industry hypothesis | Sí | DQ-004/011 |
| RULE-004 | Recepción y evidencia | Candidate / Unapproved | La condición y accesorios se documentan antes de intervenir, con correcciones trazables. | Reducir disputas y pérdida de custodia. | Foto de golpe previo y cargador recibido. | Emergencia operativa sin cámara; evidencia alternativa. | Recepción | Recepción, condición, evidencia | Industry hypothesis | Sí | DQ-007 |
| RULE-005 | Códigos sensibles | Candidate / Unapproved | Un código del dispositivo sólo se solicita con propósito, autorización y acceso limitado; no aparece en notas generales. | Proteger secreto del cliente. | Código temporal para probar cámara. | Pruebas posibles sin código. | Recepción/técnico autorizado | Código, prueba | Documentation inference | Sí | DQ-006 |
| RULE-006 | Diagnóstico atribuible | Candidate / Unapproved | Una conclusión técnica indica responsable, hallazgos, evidencia suficiente y si es inconclusa. | Separar síntoma de conclusión. | “No enciende” pasa a “batería no entrega voltaje”. | Cotización inmediata basada en síntoma declarado. | Técnico | Diagnóstico, hallazgo | Industry hypothesis | Sí | DQ-008/026 |
| RULE-007 | Cambio de cotización | Candidate / Unapproved | Una cotización emitida no se sobrescribe; un cambio material crea versión y vuelve a evaluar autorización. | Preservar qué se ofreció y aceptó. | v2 añade pantalla y sustituye v1. | Corrección editorial sin efecto, por definir. | Quoting | Cotización, partida | Documentation inference | Sí | DQ-009 |
| RULE-008 | Autorización específica | Candidate / Unapproved | La autorización se atribuye a una persona con autoridad, versión, alcance y medio de evidencia. | Evitar trabajo no consentido. | Cliente aprueba sólo dos de tres partidas. | Preautorización dentro de límites explícitos. | Cliente/propietario/autorizado | Autorización, cotización | Industry hypothesis | Sí | DQ-011 |
| RULE-009 | Anticipo como pago aplicado | Candidate / Unapproved | Todo anticipo se reconoce como pago aplicado, sin convertirlo por sí solo en autorización. | Separar decisión comercial y flujo de valor. | Depósito para pedir parte; aprobación se registra aparte. | Política explícita que una acción combine ambos con evidencia. | Payments | Anticipo, pago, saldo | Documentation inference | Sí | DQ-012 |
| RULE-010 | Asignación vigente | Candidate / Unapproved | El trabajo activo tiene responsable o cola explícita; una reasignación conserva historia y motivo. | Evitar ownership invisible. | Técnico A entrega a B por ausencia. | Trabajo externo con responsable organizacional. | Supervisor técnico | Asignación, intervención | Industry hypothesis | Sí | DQ-013 |
| RULE-011 | Consumo de refacciones | Candidate / Unapproved | Sólo se consume cantidad positiva, compatible, disponible o autorizada como excepción, vinculada al trabajo. | Proteger exactitud y trazabilidad. | Una pantalla reservada pasa a consumida al instalarse. | Parte aportada por cliente no afecta existencia propia. | Técnico/Inventory | Refacción, reserva, consumo | Industry hypothesis | Sí | DQ-010/023 |
| RULE-012 | Control de calidad | Candidate / Unapproved | Declarar trabajo terminado no equivale a listo hasta satisfacer controles aplicables o una excepción autorizada. | Evitar entrega de resultado no comprobado. | Falla de carga envía a retrabajo. | Servicio sin prueba técnica definida; verificación mínima TBD. | Técnico/supervisor | Reparación, QC, retrabajo | Industry hypothesis | Sí | DQ-016/028 |
| RULE-013 | Saldo conocido | Candidate / Unapproved | Antes de entregar se calcula y muestra un saldo basado en obligaciones y pagos vigentes. | Evitar cobro o salida inconsistentes. | Dos pagos dejan saldo cero. | Disputa o dato externo ambiguo. | Payments/recepción | Pago, saldo, entrega | Documentation inference | Sí | DQ-019 |
| RULE-014 | Entrega con saldo | Candidate / Unapproved | El valor por defecto a evaluar es no entregar con saldo; cualquier excepción requiere autoridad, motivo y seguimiento. | Proteger cobro sin inventar política absoluta. | Gerente documenta crédito excepcional. | Crédito o convenio aprobado. | Gerente/cajero | Entrega, saldo | Industry hypothesis | Sí | DQ-019/020 |
| RULE-015 | Identidad de quien recoge | Candidate / Unapproved | La persona receptora se contrasta con el propietario o una autorización verificable y queda evidencia. | Evitar entrega indebida. | Hermana presenta folio y autorización registrada. | Proceso alterno ante pérdida de evidencia. | Recepción | Receptor, autorización, entrega | Industry hypothesis | Sí | DQ-014 |
| RULE-016 | Garantía explícita | Candidate / Unapproved | Cobertura, inicio, duración y exclusiones se relacionan con trabajo/parte concreta. | No prometer cobertura implícita. | Mano de obra cubierta; parte del cliente excluida, hipótesis. | Obligación legal superior. | Warranty | Garantía, reparación, parte | Industry hypothesis | Sí | DQ-021 |
| RULE-017 | Reingreso evaluado | Candidate / Unapproved | Un reingreso no se marca como garantía hasta evaluar relación, vigencia y cobertura. | Separar solicitud de aceptación. | Falla nueva abre orden relacionada sin garantía. | Reingreso administrativo por entrega fallida. | Warranty/recepción | Reingreso, reclamación | Documentation inference | Sí | DQ-021/022 |
| RULE-018 | Cancelación controlada | Candidate / Unapproved | Cancelar conserva motivo, actor, condición del equipo, trabajo realizado, partes y efecto financiero. | Evitar pérdida de obligaciones e historia. | Cliente cancela tras diagnóstico pagado. | Orden duplicada sin actividad; aun así se conserva vínculo. | Repair Operations | Orden, cancelación, pago | Industry hypothesis | Sí | DQ-018/029 |
| RULE-019 | Equipo no recogido | Candidate / Unapproved | Un equipo no recogido sigue bajo custodia y no se dispone sin avisos, plazo y autoridad definidos. | Riesgo legal, físico y reputacional. | Tras varios avisos pasa a condición de abandono pendiente. | Riesgo de seguridad o perecedero, por definir. | Gerente | Custodia, entrega, abandono | Industry hypothesis | Sí | DQ-030 |
| RULE-020 | Auditoría relevante | Candidate / Unapproved | Cambios de autorización, cotización, estado, asignación, pago, entrega y garantía conservan actor, motivo y secuencia. | Resolver disputas y atribución. | Reasignación y cambio de precio quedan visibles. | Minimización de datos sensibles limita contenido. | Cada contexto/Audit | Todos los críticos | Documentation inference | Sí | DQ-025 |
| RULE-021 | Permisos por sucursal | Candidate / Unapproved | Un actor sólo solicita acciones en tenant y sucursal autorizados; visibilidad transversal requiere alcance explícito. | Evitar cruces y operaciones locales erróneas. | Técnico asignado a Norte no consume stock Centro. | Gerente multisucursal con permiso separado. | Identity/Branch | Usuario, sucursal, orden, stock | Documentation inference | Sí | DQ-002/031 |

## Orígenes permitidos

- **Product Owner:** respuesta o decisión registrada; ninguna regla actual.
- **Legacy observation:** observación contrastada del sistema anterior; ninguna se eleva a regla aquí.
- **Industry hypothesis:** práctica plausible que debe comprobarse en talleres reales.
- **Documentation inference:** consecuencia provisional derivada de documentos actuales.

## Regla de aprobación

La validación requiere respuesta del Product Owner, al menos un ejemplo normal y uno excepcional, documentos afectados y autoridad registrada. Hasta entonces, todas las reglas siguen sin aprobar.
