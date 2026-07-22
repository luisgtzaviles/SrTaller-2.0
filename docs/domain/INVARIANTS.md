# Invariantes candidatas

## Estado documental

- **Estado:** Draft / Discovery con restricciones arquitectónicas aceptadas
- **Autoridad:** INV-008 se rige por ADR-010/011 e INV-010 por ADR-010/011/012; las demás invariantes no están aprobadas
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Criterio

Una invariante candidata expresa algo que debería mantenerse verdadero dentro de un límite de consistencia. Strong candidate implica que una violación produciría un estado inválido; Weak candidate necesita definición adicional; Operational policy puede admitir excepción autorizada. Immediate significa que la acción no debe confirmarse sin preservarla; Eventual permite coordinación posterior entre contextos sin presentar una certeza falsa.

| ID | Enunciado candidato | Clasificación | Límite posible | Consistencia | Por qué importa | Matiz pendiente |
|---|---|---|---|---|---|---|
| INV-001 | Una orden pertenece a exactamente un tenant durante toda su vida. | Strong candidate | WorkOrder | Immediate | Previene mezcla organizacional. | Migración entre tenants no se propone. |
| INV-002 | Una orden tiene una sucursal de origen válida dentro de su tenant. | Strong candidate | WorkOrder | Immediate | Atribuye recepción y contexto. | Transferencia posterior no cambia necesariamente origen. |
| INV-003 | Un dispositivo del cliente nunca representa una estación operativa del sistema. | Strong candidate | Lenguaje y referencias entre contextos | Immediate en toda relación | Evita cruzar reparación con acceso. | Ambos son objetos físicos, pero tienen identidad y autoridad distintas. |
| INV-004 | Un pago y la obligación a la que se aplica pertenecen al mismo tenant. | Strong candidate | Payment/aplicación | Immediate | Impide valor cruzado entre negocios. | Pago a varias obligaciones requiere decidir alcance. |
| INV-005 | Una entrega se refiere a una orden y a un dispositivo bajo custodia relacionada. | Strong candidate | Delivery | Immediate | Evita entrega huérfana o del equipo equivocado. | Entrega parcial de accesorios necesita modelado. |
| INV-006 | Una autorización se refiere a una versión concreta y un alcance explícito de cotización. | Strong candidate | Authorization/Quote | Immediate | Preserva qué aceptó la persona. | Preautorización puede requerir otro concepto. |
| INV-007 | Un consumo de refacción expresa una cantidad mayor que cero; una reversa es otro hecho. | Strong candidate | Inventory consumption | Immediate | Evita usar negativos como corrección opaca. | Unidad y fraccionamiento siguen abiertos. |
| INV-008 | Toda acción relevante conserva tenant, sucursal, estación, usuario, sesión, fecha/hora y atribución histórica inmutable. | Restricción arquitectónica aceptada | Cada contexto + Audit | Immediate local, Eventual hacia auditoría central | Sostiene responsabilidad. | Definir relevancia, integridad técnica, acceso y retención. |
| INV-009 | Toda transición de estado pertenece al catálogo permitido de su máquina y cumple condiciones previas. | Strong candidate | Entidad que gobierna la máquina | Immediate | Evita saltos contradictorios. | Los catálogos aún son hipótesis. |
| INV-010 | Una operación protegida se evalúa con contexto/sesión válidos y capacidad/alcance suficientes; autenticación no sustituye autorización y la ausencia de capacidad deniega. | Restricción arquitectónica aceptada | Sesión/operación | Immediate | Protege aislamiento, atribución y privilegio mínimo. | Casos de plataforma usan contexto y decisión separados. |
| INV-011 | El saldo mostrado como definitivo considera obligaciones y aplicaciones vigentes conocidas. | Weak candidate | Payments | Immediate dentro de Payments; Eventual hacia Repair/Delivery | Evita decisiones con dato obsoleto. | Procesador externo o contracargo puede introducir estado ambiguo. |
| INV-012 | Una cotización emitida no cambia silenciosamente; una revisión conserva la versión previa. | Strong candidate | Quote | Immediate | Preserva evidencia comercial. | Cambios editoriales materiales vs no materiales. |
| INV-013 | Una reserva activa no compromete más cantidad que la disponible, salvo política de negativo explícita. | Weak candidate | InventoryReservation | Immediate en Inventory | Evita sobreasignación. | La política de negativos no está aprobada. |
| INV-014 | Una reclamación no se presenta como garantía aceptada antes de evaluarse. | Strong candidate | WarrantyClaim | Immediate | Evita prometer cobertura sin decisión. | Evaluador y criterios pendientes. |
| INV-015 | Entregar con saldo pendiente requiere una excepción atribuible y vigente. | Operational policy | Delivery + Payments | Immediate para decisión; Eventual para seguimiento | Protege cobro sin asumir prohibición universal. | El PO puede decidir crédito como flujo normal. |
| INV-016 | Un cambio de técnico no borra responsables ni intervenciones previas. | Strong candidate | Technical assignment | Immediate | Conserva atribución del trabajo. | Nivel de detalle de intervención pendiente. |

## Restricciones de coordinación

### Consistencia inmediata candidata

INV-008 es restricción aceptada por ADR-010/011 e INV-010 por ADR-010/011/012. INV-001 a INV-007, INV-009, INV-012, INV-014 e INV-016 siguen siendo candidatas que deberían protegerse al aceptar la intención que las afecta. El mecanismo técnico no se define aquí.

### Consistencia eventualmente coordinable

- Audit puede recibir una representación posterior de un hecho ya preservado localmente, sin perder atribución.
- Repair puede conocer posteriormente un pago o reserva, siempre que no declare saldo o disponibilidad definitiva mientras la información sea incierta.
- Notifications y Messaging pueden reaccionar después de los eventos; nunca son la evidencia autoritativa del cambio.
- Reporting puede estar retrasado si comunica su frescura.

## No invariantes todavía

- “Toda orden requiere diagnóstico” es una regla de flujo pendiente, no una verdad confirmada.
- “Toda entrega exige pago completo” es una política candidata con posibles excepciones.
- “Todo trabajo requiere cotización” depende de preautorizaciones y rutas inmediatas.
- “Toda reparación tiene garantía” depende de cobertura, ley y tipo de servicio.

## Revisión necesaria

El Product Owner debe confirmar qué violaciones son imposibles, cuáles admiten supervisión y cuáles sólo son preferencias del segmento inicial. Arquitectura podrá proponer límites técnicos únicamente después de esa clasificación.
