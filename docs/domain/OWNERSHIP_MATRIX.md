# Matriz candidata de ownership de información

## Metadatos

- **Estado:** Initial hypothesis / Pending Product Owner validation
- **Propósito:** Identificar posibles fuentes de verdad y conflictos de autoridad sin establecer ownership definitivo.
- **Alcance:** Información organizacional, operativa, financiera, de inventario, comunicación, auditoría y suscripción.
- **Audiencia:** Product Owner, responsables operativos, administración, finanzas, inventario, soporte y arquitectura.
- **Última actualización:** 2026-07-13

## Cómo leer la matriz

Una fila expresa una hipótesis de autoridad semántica, no una asignación técnica ni organizacional aprobada. Los nombres de contextos remiten a [candidatos todavía no aprobados](BOUNDED_CONTEXT_CANDIDATES.md). Una fuente de verdad candidata puede publicar información a consumidores; eso no autoriza a dichos consumidores a corregirla.

## Definiciones de trabajo

| ID | Término | Definición candidata | Distinción pendiente |
|---|---|---|---|
| OWN-DEF-001 | owner del concepto | autoridad semántica que podría gobernar identidad, ciclo y corrección | no equivale a equipo, servicio o tabla |
| OWN-DEF-002 | productor | actor o contexto que origina un hecho o dato | producir no concede necesariamente autoridad para corregir |
| OWN-DEF-003 | modificador | autoridad candidata para aceptar un cambio legítimo | puede requerir evidencia o aprobación humana |
| OWN-DEF-004 | consumidor | contexto o actor que usa una representación autorizada | no adquiere ownership por conservarla |
| OWN-DEF-005 | copia local | réplica con propósito y frescura explícitos | puede quedar obsoleta; no reemplaza la fuente candidata |
| OWN-DEF-006 | proyección | vista reorganizada para una necesidad de lectura | no agrega autoridad al dato de origen |
| OWN-DEF-007 | dato derivado | resultado calculado desde hechos o datos identificables | su owner depende del cálculo y de sus insumos |
| OWN-DEF-008 | evidencia histórica | registro que preserva qué se conoció, decidió o hizo | no necesariamente representa el estado vigente |
| OWN-DEF-009 | autoridad humana | persona o rol capaz de aprobar o corregir según política | ADR-012 fija el modelo de rol/capacidad; la autoridad de negocio concreta sigue pendiente |
| OWN-DEF-010 | autoridad operacional | capacidad que gobierna una decisión durante la operación | puede diferir de la autoridad legal |
| OWN-DEF-011 | autoridad legal | persona o entidad legitimada para consentir, contratar o recibir | requiere validación legal y del Product Owner |

## Matriz mínima

La columna de consistencia describe una necesidad candidata. `Inmediata local` no define una transacción distribuida; sólo advierte que el propietario candidato necesitaría decidir con información vigente dentro de su límite.

| ID | Información o concepto | Owner candidato | Productor candidato | Modificadores candidatos | Consumidores candidatos | Alcance | Consistencia candidata | Evidencia | Preguntas relacionadas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|
| OWN-001 | identidad del tenant | Tenant Administration | administración de plataforma | administración autorizada | Branch, IAM, Subscription Billing, Audit | global de plataforma / tenant | inmediata local; publicación posterior | PRODUCT_SCOPE | Q005, DQ-028 | Initial hypothesis |
| OWN-002 | identidad de sucursal | Branch Operations | administración del tenant | administración del tenant | Repair, Inventory, Cash, Delivery, IAM | tenant | inmediata local; vistas posteriores | DOMAIN-FINDING-004 | DQ-002 | Initial hypothesis |
| OWN-003 | usuario | Identity and Access | persona invitada/administración | usuario y administración según campo TBD | contextos que autorizan acciones, Audit | exactamente un tenant en ADR-004/011 | inmediata para acceso | Q009–Q012 | DQ-003 | Unknown |
| OWN-004 | roles, capacidades y asignaciones | Identity and Access | administración autorizada | autoridad IAM por definir | todos los comandos protegidos, Audit | tenant-wide o sucursal explícita en ADR-012 | inmediata para autorización | RULE-015, INV-010, ADR-012 | DQ-003/027 | Initial hypothesis |
| OWN-005 | cliente | Customer Management | recepción, importación o cliente TBD | personal autorizado; quizá cliente | Repair, Delivery, Messaging, CRM | tenant o global desconocido | corrección local; publicación eventual | EVENT-001/002 | DQ-004 | Unknown |
| OWN-006 | propietario | Customer Management o relación por orden TBD | recepción/cliente | autoridad legal u operación autorizada | Repair, Authorization, Delivery, Warranty | cliente/orden TBD | vigente al decidir; historia preservada | DQ-004 | Q002, DQ-016/020 | Unknown |
| OWN-007 | contacto autorizado | Customer Management o Work Order TBD | propietario/recepción | propietario o autoridad operacional TBD | Quoting, Delivery, Messaging | cliente/orden | vigente al autorizar o entregar | RULE-008, EDGE-009 | DQ-004/016/020 | Unknown |
| OWN-008 | teléfono | Customer Management | cliente, recepción, CRM o Messaging | autoridad y reconciliación TBD | Repair, Messaging, Notifications, CRM | identidad/tenant TBD | eventual con procedencia visible | EVENT-003, DOMAIN-FINDING-006 | DQ-004 | Unknown |
| OWN-009 | canal preferido | Customer Management o Messaging TBD | cliente/recepción | cliente y personal autorizado TBD | Messaging, Notifications, CRM | cliente/propósito TBD | eventual | EVENT-003 | Q018–Q020 | Unknown |
| OWN-010 | dispositivo del cliente | Customer Management o Repair Operations TBD | recepción | personal autorizado con evidencia | Diagnosis, Repair, Warranty, Delivery | tenant/cliente | inmediata local para identidad | EVENT-004/006 | DQ-005/006 | Unknown |
| OWN-011 | identificadores del dispositivo | contexto dueño del dispositivo TBD | recepción/técnico/fabricante | autoridad con evidencia | Diagnosis, Repair, Warranty, Audit | global o tenant desconocido | deduplicación por validar | EVENT-004, EDGE-003/004 | DQ-005/006 | Unknown |
| OWN-012 | evidencia de recepción | Repair Operations | recepción y dispositivo de captura | corrección anexada, no sobrescritura TBD | Diagnosis, Delivery, Warranty, Audit | orden/sucursal | preservación histórica | EVENT-005/006, INV-003 | DQ-007/025 | Initial hypothesis |
| OWN-013 | orden | Repair Operations | recepción | Repair según reglas candidatas | Diagnosis, Quote, Inventory, Payments, Delivery, Warranty | tenant/sucursal origen | inmediata local; referencias posteriores | EVENT-007 | DQ-001/002 | Initial hypothesis |
| OWN-014 | estado operativo | Repair Operations para flujo general; estados especializados conservan autoridad propia | comandos y hechos de cada etapa | contexto responsable de la transición | operación, cliente, reportes | orden | coordinación explícita entre límites | STATE_MACHINES, DOMAIN-FINDING-009 | DQ-001/018 | Unknown |
| OWN-015 | falla reportada | Repair Operations o Diagnosis TBD | cliente/recepción | recepción; técnico agrega hallazgos sin sustituir relato | Diagnosis, Quote, Warranty | orden/dispositivo | historia del relato preservada | EVENT-008 | DQ-008 | Initial hypothesis |
| OWN-016 | diagnóstico | Technical Diagnosis | técnico | técnico/supervisor autorizado TBD | Quote, Repair, Warranty | orden o intervención TBD | inmediata local; versión publicada | EVENT-010–012 | DQ-008/026 | Initial hypothesis |
| OWN-017 | cotización | Quoting and Authorization | asesor/sistema de cotización TBD | autoridad comercial antes de decisión | cliente, Repair, Payments | orden/versión | inmediata por versión | EVENT-013–015, RULE-007 | DQ-009 | Initial hypothesis |
| OWN-018 | autorización | Quoting and Authorization | propietario/contacto por canal | revocación o corrección con evidencia TBD | Repair, Payments, Audit | cotización/orden | decisión vigente antes del trabajo | EVENT-016–020, RULE-008 | DQ-011/016 | Initial hypothesis |
| OWN-019 | asignación técnica | Repair Operations | coordinador/técnico TBD | autoridad operacional | técnico, Branch, Audit | orden/sucursal | inmediata local | EVENT-021, INV-009 | DQ-013/027 | Initial hypothesis |
| OWN-020 | intervención | Repair Operations o registro técnico especializado TBD | técnico | técnico/supervisor con historia | QC, Warranty, Quote, Audit | reparación/orden | orden relativo preservado | EVENT-022/023/027 | DQ-013/026 | Initial hypothesis |
| OWN-021 | QC | Repair Operations o capacidad de calidad TBD | técnico distinto/supervisor TBD | autoridad de calidad | Delivery, Warranty, Audit | reparación/orden | vigente antes de declarar listo | EVENT-028–030, INV-008 | DQ-013 | Initial hypothesis |
| OWN-022 | refacción | Inventory para catálogo/stock; Repair para necesidad técnica | compras/inventario/técnico | según aspecto del concepto | Quote, Repair, Warranty | tenant/sucursal/orden según aspecto | límites todavía ambiguos | EVENT-024–026 | DQ-010/023 | Unknown |
| OWN-023 | disponibilidad | Inventory como dato derivado candidato | existencias, reservas y políticas | Inventory | Quote, Repair | sucursal/ubicación | posible inmediata al reservar; vista eventual | INV-007/013 | DQ-023 | Initial hypothesis |
| OWN-024 | reserva | Inventory | Repair solicita; Inventory acepta/rechaza | Inventory | Repair, Quote, Audit | sucursal/orden | inmediata local | EVENT-024/025 | DQ-010/023 | Initial hypothesis |
| OWN-025 | pieza instalada | Repair conserva el hecho técnico; Inventory conserva consumo candidato | técnico | corrección técnica e inventario según aspecto | Warranty, Quote, Audit | orden/intervención | coordinación con orden explícito | EVENT-026/027 | DQ-010/026 | Unknown |
| OWN-026 | importe cotizado | Quoting and Authorization | cotizador | autoridad comercial por versión | cliente, Repair, Payments | cotización/orden | inmutable por versión candidata | EVENT-013/014 | DQ-009 | Initial hypothesis |
| OWN-027 | importe autorizado | Quoting and Authorization | propietario/contacto autorizado | nueva decisión sobre nueva versión TBD | Repair, Payments, Audit | autorización/orden | vigente antes del trabajo sujeto a aprobación | EVENT-016/017 | DQ-011 | Initial hypothesis |
| OWN-028 | pago | Payments | caja/procesador/operador | Payments mediante corrección o reembolso trazable | Repair, Delivery, Cash, Audit | tenant/sucursal/obligación TBD | inmediata local; confirmación externa explícita | EVENT-032–034, INV-004 | DQ-012 | Initial hypothesis |
| OWN-029 | saldo | Payments como dato derivado candidato | pagos, aplicaciones y obligación | Payments al cambiar insumos | Repair, Delivery, Reporting | obligación/orden | vigente antes de entrega; vistas eventuales | EVENT-035, INV-011/015 | DQ-019 | Initial hypothesis |
| OWN-030 | movimiento de caja | Cash Management | operador/caja a partir de hecho físico | autoridad de caja con ajuste auditado TBD | Payments, Reporting, Audit | sucursal/caja/sesión | inmediata local; conciliación posterior | Q022, DOMAIN-FINDING-011 | DQ-012 | Unknown |
| OWN-031 | entrega | Delivery | personal de entrega/receptor | autoridad de entrega con evidencia | Repair, Warranty, Customer, Audit | orden/sucursal | decisión vigente al transferir custodia | EVENT-036–038, RULE-014 | DQ-014/020 | Initial hypothesis |
| OWN-032 | garantía | Warranty | política/entrega/reclamo | autoridad de garantía TBD | Repair, Diagnosis, Quote, Inventory, cliente | reparación/entrega/caso TBD | cobertura vigente; historia preservada | EVENT-040–044 | DQ-021/022 | Unknown |
| OWN-033 | conversación | Messaging | participantes/canales | participantes según política | Customer, Repair, CRM, Audit reducido | cliente/propósito/canal TBD | eventual entre canales | DOMAIN-FINDING-006 | Q018–Q020 | Unknown |
| OWN-034 | mensaje | Messaging normaliza; proveedor origina evidencia externa | participante/proveedor | correcciones no destructivas TBD | conversación, Repair, Notifications | conversación/canal | procedencia y orden visibles | DOMAIN-FINDING-006 | Q018–Q020 | Unknown |
| OWN-035 | notificación | Notifications para intento; hecho original permanece en productor | contexto solicitante/política | Notifications | destinatario, Repair, Messaging, Audit reducido | tenant/destinatario | eventual | EVENT-014/036/038 | Q017–Q020 | Initial hypothesis |
| OWN-036 | auditoría | Audit para evidencia transversal candidata; cada contexto conserva su hecho | contextos y actores | anexos/correcciones controladas TBD | cumplimiento, soporte, administración | tenant/global TBD | posterior sin pérdida por validar | RULE-021, INV-012 | DQ-025 | Initial hypothesis |
| OWN-037 | suscripción SaaS | Subscription Billing | plataforma/proveedor comercial | autoridad comercial de plataforma | Tenant Administration, Audit | tenant/global de plataforma | vigente para nuevas acciones según política TBD | DOMAIN-FINDING-012 | Q023–Q025 | Initial hypothesis |
| OWN-038 | catálogo de producto | Inventory o compras TBD | compras/proveedor | inventario/compras | Quote, Repair, Warranty | tenant/global desconocido | publicación eventual | Q015/Q016 | DQ-010 | Unknown |
| OWN-039 | existencia física | Inventory con custodio de sucursal/ubicación | recepción, conteo, movimientos | inventario con evidencia | disponibilidad, Repair, Reporting | sucursal/ubicación | inmediata local; conteo reconciliado | RULE-020 | DQ-023 | Initial hypothesis |
| OWN-040 | costo | Inventory, compras o capacidad financiera TBD | compra/proveedor | autoridad comercial/financiera TBD | Quote, Reporting | tenant/sucursal/lote TBD | versionada o histórica por validar | Q015–Q016 | DQ-010 | Unknown |
| OWN-041 | transferencia de inventario | Inventory con sucursales participantes | sucursal origen | origen/destino según etapa TBD | disponibilidad, Repair, Audit | tenant/múltiples sucursales | etapas explícitas; no simultaneidad supuesta | SCENARIO-020 | DQ-002/031 | Initial hypothesis |
| OWN-042 | garantía de proveedor | Inventory, compras o Warranty TBD | proveedor/compras | autoridad de reclamación TBD | Inventory, Repair, finanzas | proveedor/parte/tenant TBD | eventual por respuesta externa | EDGE-022 | DQ-010/021 | Unknown |
| OWN-043 | consumo de inventario | Inventory conserva movimiento; Repair origina uso técnico candidato | técnico/Repair | Inventory y corrección técnica según aspecto | disponibilidad, Warranty, Audit | sucursal/orden | coordinación cercana por validar | EVENT-026, INV-007 | DQ-010/023 | Initial hypothesis |

## Conflictos de ownership

| ID | Conflicto | Riesgo si se duplica autoridad | Evidencia disponible | Pregunta para validación | Estado |
|---|---|---|---|---|---|
| OWN-CONFLICT-001 | identidad global del cliente frente a identidad por tenant | fusionar o separar personas incorrectamente | DQ-004 | ¿qué alcance conserva identidad y quién corrige duplicados? | Unknown |
| OWN-CONFLICT-002 | teléfono actualizado desde CRM, recepción o mensajería | sobrescritura sin procedencia o contacto al número obsoleto | EVENT-003, DOMAIN-FINDING-006 | ¿qué fuente puede proponer, confirmar y corregir? | Unknown |
| OWN-CONFLICT-003 | propietario frente a contacto autorizado | consentimiento o entrega a persona no legitimada | EDGE-009/015 | ¿qué autoridad aplica a cada decisión y por cuánto tiempo? | Unknown |
| OWN-CONFLICT-004 | estado de orden frente a estados especializados | combinación imposible o cierre prematuro | DOMAIN-FINDING-009 | ¿qué estado decide cada capacidad y cuál sólo proyecta? | Initial hypothesis |
| OWN-CONFLICT-005 | saldo calculado en Payments frente a almacenado en Repair | entrega basada en un saldo obsoleto | INV-011/015 | ¿Repair necesita copia, proyección o consulta autorizada? | Initial hypothesis |
| OWN-CONFLICT-006 | existencia frente a disponibilidad | doble reserva o promesa sobre stock no utilizable | INV-007/013 | ¿qué insumos y política explican disponibilidad? | Initial hypothesis |
| OWN-CONFLICT-007 | conversación multicanal | hilos duplicados y autorizaciones inferidas | DOMAIN-FINDING-006 | ¿qué une mensajes sin fingir orden total? | Unknown |
| OWN-CONFLICT-008 | mensajes originados en proveedores externos | proveedor convertido en autoridad del dominio | Q018–Q020 | ¿qué evidencia externa se conserva y quién la interpreta? | Unknown |
| OWN-CONFLICT-009 | entrega frente a cierre | equipo entregado mientras obligaciones siguen abiertas | RULE-014, DQ-018 | ¿qué hechos cierran custodia, operación y finanzas por separado? | Initial hypothesis |
| OWN-CONFLICT-010 | garantía originada por orden frente a caso independiente | historia original reescrita o reclamo sin vínculo | RULE-016, DQ-021/022 | ¿cuándo nace caso nuevo y qué referencia conserva? | Unknown |
| OWN-CONFLICT-011 | ownership tenant frente a sucursal | datos invisibles o modificables desde alcance incorrecto | DOMAIN-FINDING-006 | ¿qué decisiones pertenecen al tenant, sucursal o ubicación? | Unknown |
| OWN-CONFLICT-012 | pagos operativos frente a billing del SaaS | bloquear reparación por deuda distinta o mezclar deudores | DOMAIN-FINDING-012 | ¿qué vocabulario, evidencia y autoridad mantiene cada ciclo? | Initial hypothesis |

## Criterios futuros de resolución

| ID | Pregunta de resolución | Evidencia esperada |
|---|---|---|
| OWN-CRIT-001 | ¿Quién puede corregir el concepto y mediante qué autoridad? | ejemplos de corrección, rechazo y escalamiento |
| OWN-CRIT-002 | ¿Quién conserva la evidencia original y su procedencia? | documentos, mensajes o registros reales anonimizados |
| OWN-CRIT-003 | ¿Quién responde ante una inconsistencia? | relato operativo con responsable y consecuencia |
| OWN-CRIT-004 | ¿Qué dato necesita sobrevivir si otro contexto no está disponible? | escenarios de continuidad y recuperación |
| OWN-CRIT-005 | ¿Qué cambio necesita rastro y motivo? | política y casos de disputa o auditoría |
| OWN-CRIT-006 | ¿La identidad tiene alcance global, tenant, sucursal, orden o caso? | ejemplos de homónimos, transferencias y duplicados |
| OWN-CRIT-007 | ¿Qué decisión necesita información vigente y cuál tolera demora visible? | ventana temporal y daño de obsolescencia |
| OWN-CRIT-008 | ¿El concepto posee ciclo, lenguaje y autoridad propios? | eventos, reglas y responsables narrados por expertos |

Resolver estas preguntas puede cambiar, dividir o eliminar filas. Arquitectura sólo podrá proponer mecanismos después de que Product Owner y operación validen la autoridad semántica necesaria.
