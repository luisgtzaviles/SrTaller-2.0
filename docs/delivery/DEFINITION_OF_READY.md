# Definition of Ready

## Estado del documento

- **Estado:** Resumen operativo de
  [DEC-063 aceptada](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md)
- **Propósito:** Establecer condiciones mínimas para comprometer trabajo sin ocultar incertidumbre crítica.
- **Alcance:** Incluye entregables documentales de Sprint 00 y futuros PBIs de implementación.
- **Condiciones satisfechas:** DEC063-C01, C03 y C04.
- **Condiciones pendientes:** DEC063-C02, C05, C06, C07 y C08; este resumen no las materializa.

## Principio

`Ready` significa que el resultado, límites y forma de validación son suficientemente claros para planificarlo. No significa que todas las incógnitas estén resueltas, que el trabajo esté aprobado o que deba entrar al siguiente sprint.

Un elemento no puede declararse `Ready` si conserva una pregunta bloqueante. Las hipótesis no bloqueantes deben ser explícitas, comprobables y acompañadas por una forma de validación.

Como base obligatoria, todo trabajo declara objetivo, alcance, exclusiones,
owner, dependencias, criterios de aceptación, riesgo, decisiones aplicables,
evidencia esperada y gates. La ambigüedad de tipo, riesgo o alcance falla
cerrado conforme a
[DEC-063](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md#13-definition-of-ready).

## DoR para entregables documentales

Un PBI del Sprint 00 puede considerarse `Ready` cuando cumple todo lo aplicable:

- [ ] Tiene `ID`, título, epic, tipo, estado, prioridad y sprint.
- [ ] Explica el problema o incertidumbre que se busca resolver.
- [ ] Indica el valor o reducción de riesgo esperada.
- [ ] Define alcance y fuera de alcance; no implica código funcional.
- [ ] Nombra el documento o registro que debe producir o actualizar.
- [ ] Incluye criterios de aceptación verificables para el documento.
- [ ] Identifica fuentes conocidas, hechos, hipótesis y propuestas sin mezclarlos.
- [ ] Enumera actores que deben revisar o aportar información; nombres y responsables pueden permanecer `TBD`.
- [ ] Registra dependencias, riesgos y preguntas abiertas.
- [ ] Analiza si el tema afecta tenant, sucursal, identidad, permisos, datos, seguridad u operación.
- [ ] Enlaza ADRs `Proposed` cuando se comparan alternativas técnicas.
- [ ] Define evidencia esperada: revisión, enlaces válidos, consistencia u otra prueba documental.
- [ ] No presenta como aceptada una decisión que aún requiere aprobación.

## DoR para futuros PBIs de implementación

Un PBI no puede entrar a un sprint de implementación hasta cumplir todo lo aplicable:

### Resultado y límites

- [ ] Problema claramente descrito y confirmado con la fuente pertinente.
- [ ] Valor esperado explícito y relacionado con un epic.
- [ ] Alcance y fuera de alcance entendibles.
- [ ] Criterios de aceptación observables y verificables, incluidos errores y casos límite relevantes.
- [ ] Dependencias conocidas y disponibles, o con un plan explícito.
- [ ] Riesgos principales registrados con mitigación o decisión de aceptación pendiente.
- [ ] Estimación acordada por el equipo; no se inventan story points.

### Impactos transversales

- [ ] **Multitenancy:** resolución y propagación del tenant, prevención de acceso cruzado, caché, archivos, jobs y realtime evaluados según aplique.
- [ ] **Sucursales:** alcance de `branch_id`, cambios de sucursal y acceso entre sucursales evaluados.
- [ ] **Permisos:** actor, acción, recurso, ámbito y comportamiento ante denegación definidos.
- [ ] **Datos:** ownership, ciclo de vida, migración, retención, compatibilidad y rollback evaluados.
- [ ] **Seguridad y privacidad:** amenazas, datos sensibles, auditoría y abuso relevante evaluados.
- [ ] **Visual:** estados de carga, vacío, error, permisos insuficientes, responsive, accesibilidad y consistencia del design system evaluados cuando corresponde.
- [ ] **Operación:** observabilidad, soporte, alertas, despliegue y runbook evaluados cuando corresponde.
- [ ] **Integraciones:** idempotencia, reintentos, límites, timeouts y fallos de terceros evaluados cuando corresponde.

### Decisiones y verificabilidad

- [ ] Preguntas bloqueantes resueltas y su respuesta trazada.
- [ ] Documentación relacionada identificada.
- [ ] ADR aprobado cuando sea necesario; un ADR `Proposed` no habilita por sí solo una elección irreversible.
- [ ] Estrategia de pruebas definida al nivel del PBI, incluida prueba de aislamiento multitenant cuando aplique.
- [ ] Evidencia QA esperada definida.
- [ ] Criterio de rollout y rollback entendido cuando el cambio afecta producción.

## Evaluación

La revisión debe registrar:

| Campo | Valor |
|---|---|
| PBI | `PBI-###` |
| Resultado | `Ready` / `Not ready` |
| Elementos no aplicables y justificación | TBD |
| Preguntas bloqueantes | `QUESTION-###` / Ninguna |
| Riesgos relevantes | `RISK-###` / Ninguno identificado |
| Revisores | TBD |
| Evidencia de revisión | Enlace TBD |

No se debe marcar un punto como no aplicable sólo para acelerar la entrada al sprint. La justificación debe ser verificable.

## Excepciones

Una excepción propuesta debe contener criterio exacto, alcance, razón,
evidencia, riesgo, autoridad, owner, compensación, vencimiento y remediación.
Seguridad, autorización y aislamiento de tenant no son controles opcionales.
No existe waiver implícito, permanente ni autoaprobado. DEC063-C08 conserva
pendiente su materialización.

## Aplicación pendiente

Los templates mínimos de DEC063-C01 ya están materializados. La matriz de
riesgo y el registro operativo de waivers se materializarán sólo mediante
trabajos autorizados para DEC063-C02 y C08. Los checklists especializados de
persistencia, seguridad y release permanecen en C05, C06 y C07.
Las autoridades de Producto, Seguridad, Operaciones y Arquitectura participan
según la superficie afectada.

## Próxima revisión

- **Fecha:** antes de materializar DEC063-C02 o al cambiar DEC-063.
- **Disparador:** clasificación de riesgo, waiver o cambio del [flujo de desarrollo](./DEVELOPMENT_WORKFLOW.md).
- **Documentos relacionados:** [DEC-063](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md), [PBI Template](./PBI_TEMPLATE.md), [Definition of Done](./DEFINITION_OF_DONE.md), [Testing Strategy](../quality/TESTING_STRATEGY.md).
