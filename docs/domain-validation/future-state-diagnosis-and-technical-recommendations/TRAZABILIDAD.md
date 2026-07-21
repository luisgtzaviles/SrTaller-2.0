# Trazabilidad

## Propósito

Este documento relaciona hechos validados, propuestas, escenarios, evidencia del sistema anterior y documentos generales aún en descubrimiento. Una referencia no promueve automáticamente el estado de la fuente relacionada.

## Fuentes y autoridad

| Fuente | Autoridad | Uso |
|---|---|---|
| Solicitud del Product Owner, 2026-07-21 | hechos explícitos y separaciones obligatorias | fuente primaria de DTR-DEC y escenarios |
| Flujo operativo y trazabilidad | validación posterior del flujo Avicell | actores, segunda revisión, historia, eventos y límites de rol |
| Recepción mínima y autorización comercial | validación posterior comercial | conceptos, autorización parcial, rechazo e historia |
| Estado futuro de recepción | propuesta no aprobada | frontera de entrada al diagnóstico |
| Mapa de eventos del estado actual | evidencia combinada del presente | mezcla actual de diagnóstico, seguimiento, autorización y total |
| Auditorías del sistema anterior | evidencia de código | campos libres, sobrescrituras y ausencia de estructura |
| Dominio general | descubrimiento no aprobado | vocabulario, estados, reglas y eventos candidatos |

## Registro de decisiones

| IDs | Contenido | Documento principal |
|---|---|---|
| DTR-DEC-001–008 | trabajo diagnóstico, pruebas y baja fricción | [Estado futuro](FUTURE_STATE_DIAGNOSTICO.md) |
| DTR-DEC-009–013 | conclusión, observaciones, certeza y precio | [Conclusión técnica](CONCLUSION_TECNICA.md) |
| DTR-DEC-014–018 | recomendaciones y prioridad | [Recomendaciones](RECOMENDACIONES_TECNICAS.md) |
| DTR-DEC-019–024 | descubrimientos posteriores e historia | [Iteraciones](ITERACIONES_DIAGNOSTICAS.md) |
| DTR-DEC-025–030 | frontera con cotización y autorización | [Transición a cotización](TRANSICION_A_COTIZACION.md) |
| DTR-DEC-031–036 | responsabilidades del técnico | [Responsabilidades](RESPONSABILIDADES_DEL_TECNICO.md) |
| DTR-DEC-037–041 | resultados diagnósticos | [Resultados](RESULTADOS_DEL_DIAGNOSTICO.md) |
| DTR-PROP-001–011 | organización futura propuesta | documentos temáticos del paquete |
| DTR-INV-001–020 | condiciones clasificadas | [Reglas e invariantes](REGLAS_E_INVARIANTES.md) |
| DTR-ESC-001–010 | casos mínimos y contraejemplos | [Escenarios](ESCENARIOS.md) |
| DTR-PREG-001–040 | decisiones pendientes | [Preguntas abiertas](PREGUNTAS_ABIERTAS.md) |

## Trazabilidad de propuestas solicitadas

| Propuesta solicitada | Tratamiento | Estado |
|---|---|---|
| iteraciones diagnósticas | DTR-PROP-006 | propuesta; repetición operativa validada |
| versionado de recomendaciones | DTR-PROP-004 | propuesta |
| separación conclusión/recomendación | DTR-PROP-002 | distinción semántica validada; forma propuesta |
| separación recomendación/cotización | DTR-PROP-003/010 | distinción semántica validada; relación propuesta |
| clasificación futura de prioridades | DTR-PROP-005 | propuesta abierta |
| conservación completa de historia | DTR-PROP-007/009 | no sobrescritura validada; organización propuesta |
| relación iteraciones/autorizaciones | DTR-PROP-008/011 | propuesta; nueva decisión para alcance nuevo validada |

## Relación con el estado futuro de recepción

| Referencia | Relación |
|---|---|
| FSR-EVENT-024 | recepción completa no significa diagnóstico realizado |
| FSR-EVENT-025 | equipo disponible habilita la fase, pero no la inicia |
| FSR-POLICY-017 | recepción no implica autorización de reparación |
| FSR-POLICY-018 | pendientes o excepciones de recepción pueden limitar evaluación posterior |
| FSR-ACTOR-010 | la fase diagnóstica consume contexto sin corregir recepción silenciosamente |

## Relación con flujo operativo y trazabilidad

| Referencia | Relación |
|---|---|
| FOT-DEC-002/003 | escaneo abre contexto y las pruebas no prueban instalación o venta |
| FOT-DEC-004/005 | servicio resuelto y servicio no resuelto originan rutas distintas |
| FOT-DEC-007 | trabajo autorizado vuelve a taller y luego a segunda revisión |
| FOT-DEC-013 | técnico produce información; recepción conduce lo comercial |
| FOT-DEC-026–028 | pueden participar varios técnicos sin perder historia |
| FOT-EVT-003/004 | diagnóstico registrado y trabajo terminado son hechos distintos |
| FOT-INV-010/018/020 | reasignar no borra, estado no prueba reparación e identidad de orden permanece |

## Relación con recepción mínima y autorización comercial

| Referencia | Relación |
|---|---|
| RMCA-INV-011 | problema reportado permanece separado de la conclusión |
| RMCA-DEC-019/020 | una orden admite varios conceptos y decisiones por concepto |
| RMCA-DEC-021/022 | autorización parcial y rechazo preservado limitan ejecución |
| RMCA-DEC-023/024 | nota no basta y el total debe poder explicarse |
| RMCA-PREG-026 | versionado de cotización sigue abierto y no se resuelve aquí |

## Relación con dominio general

| Referencia | Efecto de esta validación | Acción posterior |
|---|---|---|
| UBIQUITOUS_LANGUAGE: Diagnóstico | se valida que el resultado principal es la conclusión y que puede repetirse | promover sólo mediante reconciliación |
| UBIQUITOUS_LANGUAGE: Hallazgo | no se exige uno por cada prueba | precisar granularidad y alias |
| UBIQUITOUS_LANGUAGE: Cotización | se fortalece su separación frente a recomendación | conservar versionado como pregunta |
| DOMAIN_CONCEPTS: Diagnóstico | “versionable o repetible” recibe evidencia operativa | decidir identidad conceptual |
| DOMAIN-QUESTION-008/026 | parcialmente aclaradas: hay múltiples evaluaciones y resultado inconcluso | permanecen detalles de granularidad y vigencia |
| DOMAIN-DECISION-004 | la ruta técnica hacia cotización se aclara en su frontera | no se cierra todo el lifecycle comercial |
| EVENT-010–012 | inicio, conclusión e inconcluso son compatibles conceptualmente | no se aprueban como contratos técnicos |
| EVENT-013–020 | oferta y decisión siguen después de recomendación | reconciliar con autorización por concepto |
| STATE_MACHINES: diagnóstico | Completed no debe reabrirse sobrescribiendo | evaluar nueva evaluación o corrección |
| RULE-006 | conclusión atribuible queda fortalecida | actualizar sólo en promoción canónica |
| INV-006/012 | autorización por versión y cotización no sobrescrita siguen compatibles | no diseñar persistencia aquí |

## Evidencia del sistema anterior y contradicciones

| Evidencia | Aclaración de este paquete |
|---|---|
| LEGACY-NR-FINDING-005 | “Falla” mezcla problema, categoría y diagnóstico; el futuro los separa |
| LEGACY-RD-FINDING-007 | técnico textual no conserva quién concluyó o trabajó |
| LEGACY-RD-FINDING-009 | un guardado mezcla técnico, estado, total y custodia; no representa la cadena validada |
| LEGACY-RD-FINDING-010 | presupuesto final sobrescrito no conserva ofertas ni su origen técnico |
| LEGACY-RD-FINDING-011 | seguimiento libre no prueba autorización sobre recomendación/cotización |
| LEGACY-RD-FINDING-017 | nota libre conserva contexto, pero no separa conclusión, recomendación y decisión |
| CSE-EVENT-018/019 | trabajo y diagnóstico se mezclan; el hallazgo posterior sí está confirmado por Product Owner |
| CSE-SCENARIO-006 | pantalla más batería evidencia evolución, pero el sistema anterior pierde versión, vínculo y causalidad |

## Contradicciones y aclaraciones explícitas

1. El dominio general sugiere hallazgos mínimos en una conclusión; esta validación aclara que no se registra uno por cada prueba. Debe conservarse sólo el detalle con valor suficiente.
2. La máquina candidata permite Completed o Inconclusive; el flujo validado añade que puede haber otra evaluación posterior sin reescribir la anterior.
3. El catálogo canónico relaciona DiagnosisCompleted con preparar cotización; esta validación introduce una recomendación técnica intermedia en significado, sin imponer un nuevo componente.
4. El estado actual permite narrar autorización y sobrescribir total; eso contradice la separación validada entre recomendación, cotización, decisión y alcance ejecutable.
5. El técnico normalmente diagnostica y repara, pero la historia multiusuario validada impide convertir esa práctica en unicidad universal.
6. “Irreparable”, “no recomendable” e “inconcluso” no deben fusionarse hasta que sus criterios se decidan.

## Estado de promoción

| Destino | Estado |
|---|---|
| Este paquete | hechos validados; organización futura propuesta |
| Dominio general | no promovido; continúa en borrador y descubrimiento |
| Estado futuro de recepción | no aprobado en conjunto; sólo se consume su frontera |
| Flujo operativo y autorización comercial | autoridad previa conservada |
| Auditorías del sistema anterior | evidencia histórica sin sobrescritura |
| Arquitectura, base de datos y ejecución | no diseñadas ni modificadas |

## Regla de mantenimiento

Una decisión posterior debe registrar autoridad, fecha, hechos sustituidos, efecto sobre conclusiones, recomendaciones, cotizaciones, autorizaciones y escenarios. Nunca se modifica una auditoría del sistema anterior para hacer parecer que ya preservaba estas separaciones.
