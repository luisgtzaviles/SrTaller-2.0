# Registro de decisiones de dominio

## Estado documental

- **Estado:** Draft / Discovery con decisiones aceptadas registradas
- **Autoridad:** Cada fila aceptada identifica al Responsable de Producto y su ADR; las demás no están aprobadas
- **Propietario de decisión:** Product Owner
- **Última revisión:** 2026-09-11
- **Próxima revisión:** al cambiar una decisión Owner o frontera aceptada

## Regla

Este registro conserva decisiones pendientes y aceptadas. `Accepted` sólo se usa con fecha, autoridad y ADR o evidencia explícita; las demás filas siguen describiendo lo que debe decidirse.

| ID | Título | Fecha | Estado | Contexto | Decisión | Alternativas | Consecuencia | Product Owner | Documentos afectados | Preguntas cerradas | ADR relacionado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DOMAIN-DECISION-001 | Identidad de orden y reparación | TBD | Pending | Recorrido central | TBD: definir relación y cardinalidad | sinónimos; orden coordina reparaciones; una reparación por orden | afecta lifecycle y límites | TBD | Language, Concepts, Aggregates, States | Ninguna; DQ-001 abierta | ADR-002 futuro impacto |
| DOMAIN-DECISION-002 | Propiedad y contexto tenant/sucursal | 2026-07-21 | Accepted | Operación multisucursal | ADR-004 clasifica propiedad; ADR-010 deriva tenant/sucursal de la estación y mantiene usuario por tenant | alcance de tenant; alcance de sucursal; híbrido; selección manual descartada | propiedad/contexto explicables; transferencias de negocio siguen separadas | Responsable de Producto | Estado, contextos, reglas y trazabilidad | DQ-002 y contexto de DQ-031; transferencias siguen abiertas | ADR-004/010 |
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
| DOMAIN-DECISION-013 / PLD-001 | Tipos iniciales | 2026-09-11 | Accepted | Catálogo comercial | Refacción, Producto, Servicio e Insumo; capabilities separadas | copiar V1/ENL; tipo como única capability | lenguaje estable sin sobrecargar tipo | Product Owner | Glossary, Architecture, PBI-040 | PLD-001 | ADR-004 + PRICE_LIST_ARCHITECTURE |
| DOMAIN-DECISION-014 / PLD-002 | Visibilidad de Insumo | 2026-09-11 | Accepted | Lista de precios | sólo Refacción/Producto/Servicio; si se vende se modela Producto | mostrar todo; flag implícito | separa consumo interno de oferta pública | Product Owner | Glossary, Architecture | PLD-002 | PRICE_LIST_ARCHITECTURE |
| DOMAIN-DECISION-015 / PLD-003 | Visibilidad de costo | 2026-09-11 | Accepted | Seguridad comercial | capability server-side + preferencia personal default oculta | ocultar sólo CSS; costo para todo lector | menor privilegio real | Product Owner | Architecture, Access, Users, PBI-040 | PLD-003 | ADR-012/013 |
| DOMAIN-DECISION-016 / PLD-004 | Semántica de costo inicial | 2026-09-11 | Accepted | Pricing | Reference Cost opcional con procedencia; no contable/Inventory | promedio; última compra implícita | evita falsa autoridad financiera | Product Owner | Glossary, Ownership, Architecture | PLD-004 | PRICE_LIST_ARCHITECTURE |
| DOMAIN-DECISION-017 / PLD-005 | Identidad y precio multisucursal | 2026-09-11 | Accepted | Tenant/Branch | item/base Tenant + override Branch; revocar hereda; perfiles después | copia por Branch; perfiles primero | escala sin migrar identidad | Product Owner | Architecture, Module Map, PBI-040 | PLD-005 | ADR-004 |
| DOMAIN-DECISION-018 / PLD-006 | Moneda y precio inicial | 2026-09-11 | Accepted | Money/Pricing | moneda configurada en Tenant, Avicell MXN; precio final; sin FX/impuestos iniciales | MXN hardcoded; multi-currency inmediato | contrato monetario explícito | Product Owner | Architecture, Roadmap, PBI-040 | PLD-006 | MONEY_MODEL + PRICE_LIST_ARCHITECTURE |
| DOMAIN-DECISION-019 / PLD-007 | Matching masivo | 2026-09-11 | Accepted | Importación | sólo itemId, SKU, barcode/GTIN o source+code; fuzzy sólo sugerencia humana | match por nombre | no actualiza el item equivocado | Product Owner | Architecture, PBI-041 | PLD-007 | PRICE_LIST_ARCHITECTURE |
| DOMAIN-DECISION-020 / PLD-008 | Resolución antes de publish | 2026-09-11 | Accepted | Importación | pending decisions = 0; corregir/vincular/crear/excluir explícito; reporte por fila | skip silencioso; partial success opaco | publicación reconciliable/auditable | Product Owner | Architecture, PBI-041 | PLD-008 | DEC-044/049 |
| DOMAIN-DECISION-021 / PLD-018 | Navegación Listas | 2026-09-11 | Accepted | Shell | grupo Listas con sólo Lista de precios inicialmente; sin placeholders | bajo Operación; mostrar futuros | IA refleja capacidad real | Product Owner | Design System, PBI-040 | PLD-018 | UI Foundation |

## Proceso futuro

Una entrada sólo podrá cambiar tras registrar respuesta, evidencia, autoridad, fecha, alternativas consideradas, efectos y actualizaciones. El estado Pending no significa recomendación implícita.
