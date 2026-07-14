# Trazabilidad del Current State

**Estado:** Borrador para revisión de evidencia y cobertura.
**Propósito:** Relacionar hechos y hallazgos del Current State con fuentes legacy, evidencia del Product Owner, referencias canónicas, conflictos y validaciones pendientes.
**Alcance:** Los 38 eventos catalogados y 12 hallazgos de síntesis; cobertura complementaria de las demás familias `CSE-*`.
**Fuente:** Documentación canónica de dominio; auditorías legacy de nueva reparación/detalle; evidencia operativa aportada por el Product Owner.
**Audiencia:** Product Owner, operaciones, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Regla de relación

Una referencia canónica indica tema cercano, no equivalencia ni aprobación. `—` significa que no existe relación demostrable en la evidencia consultada. La columna “conflicto” sólo registra incompatibilidades concretas; una ausencia común se trata como pregunta o gap.

Abreviaturas de fuente:

- [Eventos canónicos](../../domain/DOMAIN_EVENTS.md) y [preguntas canónicas](../../domain/DOMAIN_OPEN_QUESTIONS.md).
- [Auditoría de alta](../../legacy-audit/NEW_REPAIR_FORM_AUDIT.md), [hallazgos de alta](../../legacy-audit/NEW_REPAIR_DOMAIN_FINDINGS.md) y [trazabilidad de alta](../../legacy-audit/NEW_REPAIR_TRACEABILITY.md).
- [Auditoría de detalle](../../legacy-audit/repair-detail/REPAIR_DETAIL_AUDIT.md), [hallazgos de detalle](../../legacy-audit/repair-detail/REPAIR_DETAIL_DOMAIN_FINDINGS.md) y [preguntas de detalle](../../legacy-audit/repair-detail/REPAIR_DETAIL_OPEN_QUESTIONS.md).

## Matriz principal de eventos

| ID Current State | Tipo | Documento fuente | ID canónico relacionado | ID de auditoría legacy | Evidencia operativa del Product Owner | Estado | Conflicto | Pregunta pendiente | Futura área de validación |
|---|---|---|---|---|---|---|---|---|---|
| `CSE-EVENT-001` | Evento humano | Sesión PO | — | — | Cliente llega/contacta y consulta. | `Confirmed by Product Owner` | — | ¿Se registra algo antes del ingreso? | `Pending Product Owner validation` |
| `CSE-EVENT-002` | Evento humano | Sesión PO | — | — | Recepción ofrece precio/calidades; ejemplo Incell/OLED. | `Confirmed by Product Owner` | — | ¿Fuente, vigencia y alcance del precio? | `Pending Product Owner validation` |
| `CSE-EVENT-003` | Evento humano | Sesión PO | — | — | Persona puede decidir no dejar el equipo. | `Confirmed by Product Owner` | — | ¿La consulta abandonada deja rastro? | `Pending Product Owner validation` |
| `CSE-EVENT-004` | Evento humano | Sesión PO | `EVENT-005` sólo relacionado | — | Persona decide dejar el equipo. | `Confirmed by Product Owner` | — | ¿Qué acepta exactamente? | `Pending Product Owner validation` |
| `CSE-EVENT-005` | Evento humano | Sesión PO | `EVENT-005` relacionado | — | Recepción formal empieza al dejarlo. | `Confirmed by Product Owner` | — | ¿Cuándo empieza custodia? | `Pending Product Owner validation` |
| `CSE-EVENT-006` | Evento de sistema | Auditoría de alta | `EVENT-001` | `LEGACY-NR-FINDING-002` | Se busca por nombre/teléfono. | `Confirmed by both` | — | Duplicados y coincidencias. | `Pending architecture review` |
| `CSE-EVENT-007` | Evento de sistema | Auditoría de alta | `EVENT-002` | `LEGACY-NR-FINDING-002` | Se crea si no existe. | `Confirmed by both` | — | Identidad/fusión. | `Pending architecture review` |
| `CSE-EVENT-008` | Evento de sistema | Hallazgos de alta | — | `LEGACY-NR-FINDING-003` | Sólo la persona de la nota queda registrada. | `Confirmed by both` | — | Histórico frente a dato vivo. | `Pending Product Owner validation` |
| `CSE-EVENT-009` | Evento de sistema | Hallazgos de alta | `EVENT-004` relacionado | `LEGACY-NR-FINDING-004` | Se capturan marca/modelo y rasgos. | `Confirmed by both` | — | Equipo sin IMEI e identidad reusable. | `Pending architecture review` |
| `CSE-EVENT-010` | Evento de sistema | Auditoría de alta | `EVENT-005/006` relacionados | `LEGACY-NR-FINDING-005` | Recepción pregunta falla/cómo ocurrió. | `Confirmed by both` | — | Reporte frente a inspección. | `Pending Product Owner validation` |
| `CSE-EVENT-011` | Evento de sistema | Auditoría de alta/detalle | — | `LEGACY-NR-FINDING-007/008`; `LEGACY-RD-FINDING-020` | Se solicita información para trabajar equipo. | `Confirmed by both` | — | Consentimiento y secreto. | `Pending security review` |
| `CSE-EVENT-012` | Evento de sistema | Flujo de alta | `EVENT-007` | `LEGACY-NR-RULE-001` | Orden nace después de guardar correctamente. | `Confirmed by both` | — | Tratamiento de fallos parciales. | `Pending architecture review` |
| `CSE-EVENT-013` | Evento de sistema/físico | Auditoría de alta y sesión PO | — | `LEGACY-NR-FINDING-001` | Folio se pega como sticker. | `Confirmed by both` | Predicción no reserva; no contradice sticker posterior. | Unicidad concurrente. | `Pending architecture review` |
| `CSE-EVENT-014` | Evento monetario técnico | Auditoría de alta/detalle | `EVENT-033` relacionado | `LEGACY-NR-FINDING-009/010`; `LEGACY-RD-FINDING-012` | Puede cobrarse anticipo. | `Confirmed by both` | — | Tipo, caja y aplicación. | `Pending finance review` |
| `CSE-EVENT-015` | Evento técnico | Auditoría de detalle | — | `LEGACY-RD-FINDING-024`; `LEGACY-NR-FINDING-014/015` | Nota se imprime antes de fotos. | `Confirmed by both` | Auditoría previa afirma doble consulta; corte específico observa una. `Conflict`. | Emisión, impresión, snapshot. | `Pending finance review` |
| `CSE-EVENT-016` | Evento de sistema | Auditorías de alta/detalle | — | `LEGACY-NR-FINDING-012/013`; `LEGACY-RD-FINDING-018` | Fotos se agregan después de terminar/imprimir. | `Confirmed by both` | — | Tipo, tiempo, retención y vínculo. | `Pending security review` |
| `CSE-EVENT-017` | Evento de sistema | Hallazgos de detalle | `EVENT-021` | `LEGACY-RD-FINDING-007` | Técnico atiende la reparación. | `Inferred from combined evidence` | — | Identidad, periodo y aceptación. | `Pending Product Owner validation` |
| `CSE-EVENT-018` | Evento humano inferido | Sesión PO + detalle | `EVENT-022` relacionado | `LEGACY-RD-FINDING-007/017` | En ejemplo se trabaja pantalla. | `Inferred from combined evidence` | — | Inicio y diferencia diagnóstico/trabajo. | `Pending Product Owner validation` |
| `CSE-EVENT-019` | Evento humano | Sesión PO | — | `LEGACY-RD-FINDING-011/023` como límites | Se descubre falla de batería. | `Confirmed by Product Owner` | — | Hallazgo, pieza y severidad. | `Pending Product Owner validation` |
| `CSE-EVENT-020` | Evento humano | Sesión PO | — | `LEGACY-RD-FINDING-017` como representación | Se llama al cliente/contacto. | `Confirmed by Product Owner` | — | Número, resultado y hora. | `Pending security review` |
| `CSE-EVENT-021` | Evento humano | Sesión PO | `EVENT-016/017/018` relacionados | `LEGACY-RD-FINDING-011` | Cliente autoriza trabajo adicional; otras decisiones no validadas. | `Confirmed by Product Owner` | Rechazo/pendiente permanecen sin confirmar. | Autoridad, monto, alcance y prueba. | `Pending Product Owner validation` |
| `CSE-EVENT-022` | Evento de sistema | Hallazgos de detalle | `EVENT-015` relacionado | `LEGACY-RD-FINDING-010` | Presupuesto cambia tras autorización del ejemplo. | `Confirmed by both` | — | Versión y causalidad. | `Pending finance review` |
| `CSE-EVENT-023` | Evento humano inferido | Sesión PO + detalle | `EVENT-020/023` relacionados | `LEGACY-RD-FINDING-001/017` | Tras decidir, trabajo puede seguir/detenerse. | `Inferred from combined evidence` | — | Reglas habilitantes. | `Pending Product Owner validation` |
| `CSE-EVENT-024` | Evento de sistema | Hallazgos de detalle | — | `LEGACY-RD-FINDING-017` | Se narra autorización/hallazgo. | `Confirmed by both` | — | Categorías y vínculo. | `Pending Product Owner validation` |
| `CSE-EVENT-025` | Evento de sistema | Hallazgos de detalle | — | `LEGACY-RD-FINDING-001/009` | Operación cambia estados. | `Confirmed by legacy code` | Valores activos `Unknown`. | Vocabulario/transiciones. | `Pending Product Owner validation` |
| `CSE-EVENT-026` | Evento de sistema | Auditoría de detalle | `EVENT-036` relacionado | `LEGACY-RD-FINDING-003/006` | Existe uso operativo de “listo”, significado no precisado. | `Confirmed by legacy code` | — | Listo frente a QC/aviso. | `Pending Product Owner validation` |
| `CSE-EVENT-027` | Evento técnico externo | Hallazgos de detalle | `EVENT-037` no equivalente | `LEGACY-RD-FINDING-004/005` | Se notifican avances según práctica general, canal exacto no validado. | `Confirmed by legacy code` | Intento anterior al guardado. | Disparador, payload, resultado. | `Pending architecture review` |
| `CSE-EVENT-028` | Evento técnico externo | Catálogo de acciones de detalle | `EVENT-037` relacionado | `LEGACY-RD-ACTION-014` | Teléfono registrado recibe notificaciones. | `Confirmed by both` | Apertura no prueba envío. | Consentimiento y bitácora. | `Pending security review` |
| `CSE-EVENT-029` | Evento monetario técnico | Hallazgos de detalle | `EVENT-032/033` relacionados | `LEGACY-RD-FINDING-012/013/014` | Cualquier persona puede pagar. | `Confirmed by both` | — | Tipo, corrección, caja y aplicación. | `Pending finance review` |
| `CSE-EVENT-030` | Evento humano | Sesión PO | — | `LEGACY-RD-FINDING-015` como ausencia | Nota/INE/reconocimiento/llamada/excepción se evalúan. | `Confirmed by Product Owner` | Sistema no estructura la regla. | Jerarquía y evidencia de legitimación. | `Pending security review` |
| `CSE-EVENT-031` | Evento de sistema | Hallazgos de detalle | `EVENT-038` relacionado | `LEGACY-RD-FINDING-015/016` | Operación marca entrega. | `Confirmed by both` | Marca no prueba acto físico. | Precondiciones y receptor. | `Pending Product Owner validation` |
| `CSE-EVENT-032` | Evento humano | Sesión PO | `EVENT-038` relacionado | `LEGACY-RD-FINDING-015` como ausencia | Equipo se entrega físicamente tras legitimación aceptada. | `Confirmed by Product Owner` | Puede no coincidir en tiempo con marca. | Vínculo marca-acto. | `Pending Product Owner validation` |
| `CSE-EVENT-033` | Evento técnico | Hallazgos de detalle | `EVENT-031` sólo relacionado | `LEGACY-RD-FINDING-003/022` | Puede haber reingreso. | `Confirmed by both` | Reingreso humano no equivale necesariamente a sobrescribir estado. | Ciclos y motivo. | `Pending Product Owner validation` |
| `CSE-EVENT-034` | Evento técnico | Auditorías de alta/detalle | `EVENT-040` no equivalente | `LEGACY-NR-FINDING-006`; `LEGACY-RD-FINDING-022` | Puede existir garantía/reingreso. | `Confirmed by both` | Bandera/etiqueta no prueba activación. | Vigencia, cobertura y relación. | `Pending Product Owner validation` |
| `CSE-EVENT-035` | Gap futuro | Sesión PO + mapa monetario | [MONEY_MODEL](../../domain/MONEY_MODEL.md), sin ID equivalente | `LEGACY-RD-FINDING-012` | Es deseable que cobro afecte caja. | `Desired future behavior` | — | Definir pago/aplicación/caja. | `Pending finance review` |
| `CSE-EVENT-036` | Gap futuro | Sesión PO + hallazgos de detalle | `EVENT-016/017/018` relacionados | `LEGACY-RD-FINDING-011` | Ejemplo muestra necesidad de demostrar autorización. | `Desired future behavior` | — | Prueba y vínculo con versión. | `Pending Product Owner validation` |
| `CSE-EVENT-037` | Gap futuro | Hallazgos de detalle | `EVENT-025` relacionado | `LEGACY-RD-FINDING-023` | Caso batería evidencia pieza adicional. | `Desired future behavior` | — | Ciclo de refacción. | `Pending architecture review` |
| `CSE-EVENT-038` | Gap futuro | Sesión PO + hallazgos de detalle | `EVENT-038` relacionado | `LEGACY-RD-FINDING-015` | Operación legitima antes de entregar. | `Desired future behavior` | — | Registro mínimo y privacidad. | `Pending security review` |

## Hallazgos de síntesis

| ID Current State | Tipo | Documento fuente | ID canónico relacionado | ID de auditoría legacy | Evidencia operativa del Product Owner | Estado | Conflicto | Pregunta pendiente | Futura área de validación |
|---|---|---|---|---|---|---|---|---|---|
| `CSE-FINDING-001` | Hallazgo de frontera | Panorama y sesión PO | — | — | La interacción comercial precede la orden. | `Confirmed by Product Owner` | — | ¿Qué parte merece registro? | `Pending Product Owner validation` |
| `CSE-FINDING-002` | Hallazgo de identidad | Alta + escenarios 2/3 | `EVENT-001/002` relacionados | `LEGACY-NR-FINDING-002/003` | Cliente operativo no prueba propietario/entregador. | `Confirmed by both` | — | Identidades y autoridades. | `Pending Product Owner validation` |
| `CSE-FINDING-003` | Hallazgo de alta | Flujo de alta | `EVENT-007` | `LEGACY-NR-FINDING-001/009` | Orden nace tras guardar; sticker usa folio. | `Confirmed by both` | — | Concurrencia y parciales. | `Pending architecture review` |
| `CSE-FINDING-004` | Hallazgo de evidencia | Alta/detalle | — | `LEGACY-NR-FINDING-012/013` | Fotos se toman después de imprimir. | `Confirmed by both` | — | Momento, propósito y retención. | `Pending security review` |
| `CSE-FINDING-005` | Hallazgo de autorización | Caso pantalla+batería | `EVENT-015/016` relacionados | `LEGACY-RD-FINDING-010/011` | Autorización verbal y cambio de total ocurren. | `Confirmed by both` | Causalidad sólo narrativa. | Evidencia y versión. | `Pending finance review` |
| `CSE-FINDING-006` | Hallazgo de ciclo | Detalle | `EVENT-036/038` relacionados | `LEGACY-RD-FINDING-002/003` | Equipo listo puede seguir en tienda. | `Confirmed by both` | — | Estados, custodia y hitos. | `Pending Product Owner validation` |
| `CSE-FINDING-007` | Hallazgo financiero | Mapa monetario | `EVENT-032/033/035` relacionados | `LEGACY-RD-FINDING-012/014` | Anticipos no impactan correctamente caja. | `Confirmed by both` | — | Pago, aplicación, saldo y caja. | `Pending finance review` |
| `CSE-FINDING-008` | Hallazgo de entrega | Escenarios 8-12 | `EVENT-038` relacionado | `LEGACY-RD-FINDING-015/016` | Legitimación se realiza humanamente. | `Confirmed by both` | Sistema permite omitirla. | Prueba, excepción y receptor. | `Pending security review` |
| `CSE-FINDING-009` | Hallazgo de QC | Detalle + canónicos | `EVENT-028` a `031` sólo hipótesis | `LEGACY-RD-FINDING-008` | No se aportó proceso de QC. | `Unknown` | `revisor` no demuestra revisión. | ¿Existe QC manual? | `Pending Product Owner validation` |
| `CSE-FINDING-010` | Hallazgo documental | Impresión | — | `LEGACY-RD-FINDING-024`; `LEGACY-NR-FINDING-015` | Nota inicial se imprime. | `Conflict` | Una frente a dos consultas en auditorías. | Reproducir ruta exacta. | `Pending architecture review` |
| `CSE-FINDING-011` | Hallazgo de reingreso | Detalle/alta | `EVENT-040/041` no equivalentes | `LEGACY-RD-FINDING-022` | Puede existir reingreso/garantía. | `Confirmed by both` | Etiqueta no prueba proceso. | Ciclo, relación y efectos. | `Pending Product Owner validation` |
| `CSE-FINDING-012` | Hallazgo de separación | Catálogo de eventos | Eventos deseados `035` a `038` | Hallazgos `011/012/015/023` | Sólo caja fue expresada como intención explícita; demás son gaps de representación. | `Desired future behavior` | — | Definir qué se desea y aprobarlo por área. | `Pending architecture review` |

## Cobertura de las demás familias

| Familia | Cobertura interna | Vínculo con esta matriz |
|---|---|---|
| `CSE-ACTOR-001` a `019` | Fuente/estado individual en [mapa de actores](CURRENT_STATE_COMMAND_POLICY_ACTOR_MAP.md). | Cada comando y evento identifica participantes; no se declaran roles definitivos. |
| `CSE-COMMAND-001` a `028` | Actor, resultado, registro y estado en el [mapa](CURRENT_STATE_COMMAND_POLICY_ACTOR_MAP.md). | Enlazan directamente a `CSE-EVENT-*` de esta matriz. |
| `CSE-POLICY-001` a `027` | Clasificación y fuente en el [mapa](CURRENT_STATE_COMMAND_POLICY_ACTOR_MAP.md). | Explican escenarios y hallazgos; `027` permanece intención futura. |
| `CSE-READ-001` a `012` | Fuente/consumidor/calidad en el [mapa](CURRENT_STATE_COMMAND_POLICY_ACTOR_MAP.md). | Distinguen lectura disponible de datos ausentes. |
| `CSE-EXTERNAL-001` a `005` | Interacción/resultado/estado en el [mapa](CURRENT_STATE_COMMAND_POLICY_ACTOR_MAP.md). | Sustentan eventos `015/016/027/028` sin prescribir componentes futuros. |
| `CSE-TIME-001` a `021` | Timestamp, lugar, actor, zona y riesgo en la [línea temporal](CURRENT_STATE_TIMELINE.md). | Separan ocurrencia, captura, mutación, notificación e impresión de los eventos. |
| `CSE-HOTSPOT-001` a `030` | Evidencia, cuatro impactos, preguntas, urgencia y estado en [hotspots](CURRENT_STATE_HOTSPOTS.md). | Derivan de los hallazgos/auditorías indicados, no de preferencias de diseño. |
| `CSE-SCENARIO-001` a `015` | Secuencia, referencias, datos, fallos y preguntas en [escenarios](CURRENT_STATE_SCENARIO_WALKTHROUGHS.md). | Prueban combinaciones de eventos/políticas de esta matriz. |

## Conteo y procedencia

La matriz principal contiene **50 relaciones individuales**: 38 eventos y 12 hallazgos. Su procedencia primaria se distribuye entre código, Product Owner, ambas fuentes, inferencia, intención futura, un conflicto y un desconocido. Los conteos exactos se calculan sobre el valor de la columna “Estado”; no deben inferirse de la mera presencia de un ID legacy o canónico.
