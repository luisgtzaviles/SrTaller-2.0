# Registro de decisiones terminológicas

## Metadatos

- **Estado:** Unknown / Pending Product Owner validation
- **Propósito:** Registrar propuestas, discusión y futuras decisiones sobre términos sin sustituir el lenguaje ubicuo.
- **Alcance:** Ambigüedades transversales detectadas en discovery y su mecanismo de resolución.
- **Audiencia:** Product Owner, expertos operativos, diseño de producto, soporte y arquitectura.
- **Última actualización:** 2026-07-13

## Relación con el lenguaje ubicuo

Este registro complementa [UBIQUITOUS_LANGUAGE](UBIQUITOUS_LANGUAGE.md). Aquel documento reúne vocabulario candidato; éste conserva la deliberación, evidencia, autoridad y consecuencia de cada decisión. Ninguna fila inicial contiene aprobación explícita.

## Estados del registro

| Estado posible | Significado operativo del registro |
|---|---|
| Proposed | alguien presentó una alternativa identificable |
| Discussed | existe evidencia de conversación con participantes |
| Accepted | el aprobador requerido dejó evidencia explícita de aceptación |
| Rejected | el aprobador requerido dejó evidencia explícita de rechazo |
| Context-restricted | la evidencia limita el uso a un contexto definido |
| Alias | la evidencia conserva una equivalencia controlada |
| Prohibited | existe aprobación explícita para evitar el término en un alcance |
| Ambiguous | la evidencia confirma más de un significado sin resolución |
| Pending Product Owner validation | todavía no hay evidencia suficiente para asignar uno de los estados anteriores |

## Decisiones pendientes

`TBD` en la columna Decisión evita inferir una preferencia. Accepted, Rejected, Alias, Context-restricted y Prohibited sólo podrán usarse con evidencia y fecha.

| ID | Término | Alternativas | Contexto | Problema | Decisión | Estado | Evidencia | Aprobador requerido | Fecha | Consecuencias |
|---|---|---|---|---|---|---|---|---|---|---|
| TERM-DEC-001 | orden | reparación | Repair Operations | orden puede ser expediente, mandato o flujo; reparación puede ser trabajo o resultado | TBD | Pending Product Owner validation | DOMAIN-FINDING-002, DQ-001 | Product Owner + operación | TBD | afecta identidad, estados, UI y métricas |
| TERM-DEC-002 | cliente | propietario / contacto | Customer Management, Authorization, Delivery | una persona puede comprar, poseer, autorizar o recibir sin ser la misma | TBD | Pending Product Owner validation | DOMAIN-FINDING-010, DQ-004 | Product Owner + operación/legal | TBD | afecta consentimiento, privacidad y entrega |
| TERM-DEC-003 | equipo | dispositivo | Customer Management, Repair, IAM | dispositivo puede referir al objeto reparado o al autorizado para acceder | TBD | Pending Product Owner validation | DQ-005/006, Q011–Q012 | Product Owner + operación | TBD | afecta identidad y navegación |
| TERM-DEC-004 | falla | síntoma / diagnóstico | Repair, Technical Diagnosis | relato del cliente, observación y conclusión técnica no son equivalentes | TBD | Pending Product Owner validation | DQ-008, EVENT-008/011 | Product Owner + técnicos | TBD | afecta búsqueda, cotización y garantía |
| TERM-DEC-005 | servicio | partida / intervención | Quoting, Repair | oferta comercial, renglón de precio y trabajo ejecutado tienen ciclos distintos | TBD | Pending Product Owner validation | DQ-009/026, EVENT-013/027 | Product Owner + operación | TBD | afecta cotización, costo e historia técnica |
| TERM-DEC-006 | refacción | producto / pieza | Inventory, Repair | definición catalogada, objeto físico y componente usado pueden confundirse | TBD | Pending Product Owner validation | DQ-010/023, OWN-022 | Product Owner + inventario/técnicos | TBD | afecta stock, reserva, costo y garantía |
| TERM-DEC-007 | listo | terminado | Repair, Delivery | trabajo técnico terminado no prueba QC, pago, notificación o disponibilidad para entrega | TBD | Pending Product Owner validation | EVENT-027–030/036, INV-008 | Product Owner + operación | TBD | afecta promesas al cliente y métricas |
| TERM-DEC-008 | entregado | cerrado | Delivery, Repair, Payments | transferir custodia no necesariamente concluye todas las obligaciones | TBD | Pending Product Owner validation | RULE-014, DQ-018 | Product Owner + operación/finanzas | TBD | afecta ciclo, garantía y reportes |
| TERM-DEC-009 | garantía | reingreso | Warranty, Repair | un retorno puede ser reclamo cubierto, nueva falla o continuación | TBD | Pending Product Owner validation | RULE-016, DQ-021/022 | Product Owner + garantías | TBD | afecta cobertura, cobro e historia |
| TERM-DEC-010 | anticipo | pago / abono | Payments, Quoting | momento, aplicación y propósito financiero siguen abiertos | TBD | Pending Product Owner validation | RULE-009, DQ-012 | Product Owner + finanzas | TBD | afecta saldo, reembolso y autorización |
| TERM-DEC-011 | sucursal | ubicación | Branch, Inventory, Cash, Delivery | unidad organizacional y lugar físico pueden no coincidir | TBD | Pending Product Owner validation | DOMAIN-FINDING-004, DQ-002 | Product Owner + operación multisucursal | TBD | afecta alcance, custodia y permisos |
| TERM-DEC-012 | dispositivo del cliente | dispositivo autorizado | Customer Management/Repair, IAM | objeto reparado y dispositivo de acceso pertenecen a problemas distintos | TBD | Pending Product Owner validation | DOMAIN-FINDING-003, Q012 | Product Owner + seguridad/operación | TBD | evita mezclar inventario del cliente con control de acceso |
| TERM-DEC-013 | caja | Cash Register / Cash Management | Payments, Cash Management | lugar, sesión, instrumento y capacidad operativa pueden usar la misma palabra | TBD | Pending Product Owner validation | DOMAIN-FINDING-011, Q022 | Product Owner + caja/finanzas | TBD | afecta movimientos, arqueo y permisos |
| TERM-DEC-014 | pago operativo | Subscription Billing | Payments, Subscription Billing | cliente del taller y tenant pagan obligaciones diferentes | TBD | Pending Product Owner validation | DOMAIN-FINDING-012, Q023–Q025 | Product Owner + finanzas/plataforma | TBD | evita mezclar saldos y restricciones de acceso |
| TERM-DEC-015 | conversación | chat / hilo | Messaging, CRM | canal, agrupación y continuidad multicanal no están definidos | TBD | Pending Product Owner validation | DOMAIN-FINDING-006, Q018–Q020 | Product Owner + atención | TBD | afecta trazabilidad, privacidad y autorización |
| TERM-DEC-016 | técnico asignado | responsable | Repair Operations | asignación de trabajo, custodia y responsabilidad final pueden diferir | TBD | Pending Product Owner validation | DQ-013/027, EVENT-021 | Product Owner + operación técnica | TBD | afecta carga, escalamiento y auditoría |
| TERM-DEC-017 | cancelación | cierre | Repair, Payments, Delivery | detener trabajo no extingue automáticamente custodia ni obligaciones | TBD | Pending Product Owner validation | RULE-018, SCENARIO-015 | Product Owner + operación/finanzas | TBD | afecta estados, pagos y devolución del equipo |
| TERM-DEC-018 | reapertura | reingreso | Repair, Warranty | continuar una orden y crear un caso relacionado preservan historias distintas | TBD | Pending Product Owner validation | RULE-019, DQ-022 | Product Owner + garantías | TBD | afecta identidad, métricas y cobertura |

## Mecanismo candidato para reglas terminológicas

Estas categorías permiten documentar una decisión futura; todavía no asignan ninguna a los términos anteriores.

| ID | Categoría futura | Pregunta de registro | Evidencia mínima candidata | Estado |
|---|---|---|---|---|
| TERM-RULE-001 | término preferido | ¿qué expresión usa el dominio para un significado definido? | aprobación y ejemplos positivos | Initial hypothesis |
| TERM-RULE-002 | término permitido sólo en cierto contexto | ¿en qué límite conserva un significado no ambiguo? | contexto, participantes y contraste | Initial hypothesis |
| TERM-RULE-003 | término de interfaz | ¿qué palabra entiende el usuario aunque el dominio interno use otra? | investigación de usuario y mapeo explícito | Initial hypothesis |
| TERM-RULE-004 | término legal | ¿qué expresión necesita conservarse por obligación o evidencia? | fuente legal/política revisada | Initial hypothesis |
| TERM-RULE-005 | término coloquial | ¿qué expresión se tolera al conversar pero no identifica el concepto? | ejemplos reales y riesgo evaluado | Initial hypothesis |
| TERM-RULE-006 | alias externo | ¿qué vocabulario de proveedor necesita traducción controlada? | contrato externo y concepto equivalente | Initial hypothesis |
| TERM-RULE-007 | término deprecado | ¿qué término se retirará gradualmente y dónde permanece visible? | decisión aprobada y plan documental | Initial hypothesis |
| TERM-RULE-008 | término prohibido | ¿qué daño concreto justifica evitarlo en un alcance? | aprobación explícita, alcance y alternativa | Initial hypothesis |

## Flujo de revisión candidato

1. Registrar ejemplos textuales anonimizados y sus hablantes.
2. Identificar si existe una diferencia de significado o sólo de redacción.
3. Proponer alcance, alternativa y consecuencia sin cambiar aún el estado.
4. Discutir con los expertos de los contextos afectados.
5. Solicitar decisión al aprobador indicado.
6. Registrar evidencia, fecha y estado; después sincronizar [UBIQUITOUS_LANGUAGE](UBIQUITOUS_LANGUAGE.md) y documentos afectados.

La ausencia de decisión permanece visible como riesgo de interpretación; no autoriza a escoger silenciosamente un sinónimo.
