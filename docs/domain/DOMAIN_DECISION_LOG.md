# Registro de decisiones de dominio

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Regla

Este registro sólo contiene entradas Pending. Decisión describe lo que debe decidirse, no una respuesta. No se cierra ninguna pregunta ni se acepta ningún ADR.

| ID | Título | Fecha | Estado | Contexto | Decisión | Alternativas | Consecuencia | Product Owner | Documentos afectados | Preguntas cerradas | ADR relacionado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DOMAIN-DECISION-001 | Identidad de orden y reparación | TBD | Pending | Recorrido central | TBD: definir relación y cardinalidad | sinónimos; orden coordina reparaciones; una reparación por orden | afecta lifecycle y límites | TBD | Language, Concepts, Aggregates, States | Ninguna; DQ-001 abierta | ADR-002 futuro impacto |
| DOMAIN-DECISION-002 | Ownership tenant/sucursal | TBD | Pending | Operación multisucursal | TBD por concepto | tenant-wide; branch-scoped; híbrido | afecta permisos y transferencias | TBD | Status, Contexts, Rules | Ninguna; DQ-002 abierta | ADR-004 |
| DOMAIN-DECISION-003 | Personas y autoridad sobre el dispositivo | TBD | Pending | Recepción/entrega | TBD: cliente, propietario, contacto y autorizado | roles combinados; relaciones separadas | afecta consentimiento y entrega | TBD | Actors, Language, Rules | Ninguna; DQ-004 abierta | No inicialmente |
| DOMAIN-DECISION-004 | Ruta de diagnóstico y cotización | TBD | Pending | Evaluación comercial | TBD: pasos obligatorios y atajos | diagnóstico siempre; cotización inmediata; preautorización | afecta estados y comandos | TBD | Workflow, States, Events | Ninguna; DQ-008/009 abiertas | No inicialmente |
| DOMAIN-DECISION-005 | Evidencia de autorización | TBD | Pending | Consentimiento | TBD: autoridad y medios válidos | firma, verbal, mensaje, combinación | afecta trazabilidad y retención | TBD | Rules, Values, Interview | Ninguna; DQ-011 abierta | Mensajería futuro |
| DOMAIN-DECISION-006 | Mínimo de inventario | TBD | Pending | Reparación con partes | TBD: catálogo, reserva, consumo y negativos | sin reservas; reservas; inventario completo | afecta alcance y consistencia | TBD | Rules, Invariants, Contexts | Ninguna; DQ-023 abierta | ADR-002/003 según alcance |
| DOMAIN-DECISION-007 | Pago completo y entrega | TBD | Pending | Cierre comercial | TBD: regla normal y excepciones | obligatorio; crédito; supervisor | afecta saldo, entrega y cierre | TBD | Rules, States, Scenarios | Ninguna; DQ-019 abierta | No inicialmente |
| DOMAIN-DECISION-008 | Delivered frente a Closed | TBD | Pending | Fin del caso | TBD: hitos separados o derivados | separados; cierre al entregar; cierre por pendientes | afecta métricas y garantía | TBD | Workflow, States, Concepts | Ninguna; DQ-018/020 abiertas | No inicialmente |
| DOMAIN-DECISION-009 | Modelo de garantía | TBD | Pending | Post-entrega | TBD: cobertura y reclamación | reapertura; caso relacionado; nueva orden | afecta historia e invariantes | TBD | States, Aggregates, Events | Ninguna; DQ-021/022 abiertas | ADR-002 futuro impacto |
| DOMAIN-DECISION-010 | Abandono y custodia | TBD | Pending | Equipo no recogido | TBD con revisión legal | avisos/plazo; almacenamiento; disposición | afecta responsabilidad y datos | TBD | Rules, Exceptions, Interview | Ninguna; DQ-030 abierta | No; revisión legal |
| DOMAIN-DECISION-011 | Transferencias multisucursal | TBD | Pending | Recepción/reparación/entrega distintas | TBD por orden, equipo, stock y pago | no permitir; transferir; casos coordinados | afecta ownership y auditoría | TBD | Workflow, Contexts, Scenarios | Ninguna; DQ-002/031 abiertas | ADR-004 posible |
| DOMAIN-DECISION-012 | Alcance de CRM y mensajería | TBD | Pending | Comunicación | TBD: incluir o diferir | fuera; notificaciones; conversación/canal | afecta consentimiento y contexto | TBD | Contexts, Relationships, Traceability | Ninguna; Q017–Q020 abiertas | ADR futuro si aplica |

## Proceso futuro

Una entrada sólo podrá cambiar tras registrar respuesta, evidencia, autoridad, fecha, alternativas consideradas, efectos y actualizaciones. El estado Pending no significa recomendación implícita.
