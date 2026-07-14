# Definition of Done

## Estado del documento

- **Estado:** Propuesta
- **Propósito:** Evitar que un resultado se declare terminado sólo porque existe o funciona en un caso feliz.
- **Alcance:** Dos perfiles: entregables documentales actuales y funcionalidades futuras.
- **Decisión pendiente:** Autoridades de aprobación y umbrales por tipo de cambio.

## Principio

`Done` exige un resultado verificable, evidencia conservada y riesgos residuales visibles. No se deben cerrar criterios incumplidos trasladándolos implícitamente a “después”. Los puntos no aplicables requieren una justificación breve.

## DoD de documentación para Sprint 00

Un documento o PBI documental sólo está terminado cuando:

- [ ] Cumple todos sus criterios de aceptación.
- [ ] El archivo esperado existe en la ubicación acordada y usa Markdown legible.
- [ ] Distingue hechos conocidos, hipótesis, propuestas, decisiones pendientes y decisiones aceptadas.
- [ ] No presenta una dirección técnica preliminar como irrevocable.
- [ ] Incluye `Estado del documento` y `Próxima revisión`.
- [ ] Incluye `Preguntas abiertas` cuando quedan incertidumbres.
- [ ] Usa `TBD` para fechas, responsables, métricas o estimaciones no acordadas.
- [ ] Los enlaces relativos internos resuelven a archivos existentes o comprometidos en el mismo cambio.
- [ ] Los IDs son únicos y siguen las convenciones establecidas.
- [ ] Epics, PBIs, sprint, ADRs y preguntas relacionados son consistentes.
- [ ] Los ADRs creados durante esta etapa permanecen en `Proposed`.
- [ ] No incorpora reglas de negocio supuestas ni decisiones ocultas.
- [ ] Recibió revisión de contenido; revisor y evidencia quedan registrados.
- [ ] Tiene evidencia documental suficiente: checklist, revisión, validación de enlaces y, cuando aplique, render correcto de Mermaid.
- [ ] No se creó código funcional, scaffolding, migraciones, esquemas ejecutables ni infraestructura como parte del PBI.
- [ ] Las observaciones pendientes se convirtieron en preguntas, riesgos o trabajo futuro trazable.
- [ ] El Product Owner aprobó el resultado cuando el criterio de salida de Sprint 00 así lo requiere.

## DoD para una funcionalidad futura

La lista se aplica según el tipo de cambio, pero ninguna exclusión es implícita.

### Producto y comportamiento

- [ ] Criterios de aceptación cumplidos, incluidos casos de error y límites.
- [ ] Alcance implementado sin incorporar trabajo fuera del PBI.
- [ ] Aprobación del Product Owner registrada.
- [ ] Estados de carga, vacío, error y permisos insuficientes verificados cuando existe interfaz.

### Ingeniería

- [ ] Revisión de código completada.
- [ ] Lint y type checking sin fallos.
- [ ] Pruebas unitarias relevantes aprobadas.
- [ ] Pruebas de integración relevantes aprobadas.
- [ ] Pruebas end-to-end relevantes aprobadas.
- [ ] Manejo de errores, timeouts, reintentos e idempotencia cubiertos cuando aplican.
- [ ] No se introducen dependencias entre módulos que contradigan los límites documentados.

### Tenant, acceso y auditoría

- [ ] Aislamiento multitenant probado con al menos dos tenants y casos negativos.
- [ ] Alcance por sucursal probado cuando aplica.
- [ ] Autorización probada por rol, permiso y contexto; la denegación es segura.
- [ ] Jobs, caché, realtime y archivos propagan y validan contexto de tenant cuando aplican.
- [ ] Acciones sensibles generan auditoría suficiente y no exponen secretos.

### Experiencia y calidad

- [ ] Accesibilidad verificada según la [estrategia](../quality/ACCESSIBILITY_STRATEGY.md).
- [ ] Comportamiento responsive y navegadores/dispositivos acordados verificados.
- [ ] Consistencia con el design system validada; excepciones documentadas.
- [ ] QA completado y evidencia conservada mediante la [plantilla](../quality/QA_EVIDENCE_TEMPLATE.md).
- [ ] Riesgos de regresión relevantes cubiertos.
- [ ] Pruebas de carga o rendimiento completadas cuando el riesgo lo exige.

### Datos, operación y liberación

- [ ] Migración de datos revisada, probada y compatible hacia adelante cuando aplica.
- [ ] Plan de backup o recuperación considerado para cambios de alto riesgo.
- [ ] Observabilidad incorporada: logs con contexto, métricas y alertas según corresponda.
- [ ] Documentación de producto, arquitectura, API, soporte y runbooks actualizada.
- [ ] Artefacto versionado y reproducible disponible.
- [ ] Estrategia de rollout y rollback probada o validada.
- [ ] Verificación en staging completada con credenciales y datos separados de producción.
- [ ] Evidencia vinculada al PBI, PR, pruebas y release.

Los puntos de staging y release se completan **después** de construir el candidato y validarlo en staging. Antes de ese momento el elemento puede estar listo como candidato, pero no `Done`. Esta secuencia evita usar DoD como gate de entrada a la misma validación que DoD exige.

## Evidencia de cierre

| Campo | Valor |
|---|---|
| Elemento | `PBI-###`, `BUG-###` o `TASK-###` |
| Criterios | Enlace TBD |
| Cambios/PR | Enlace TBD |
| Pruebas | Enlace TBD |
| Evidencia QA | Enlace TBD |
| Riesgos residuales | `RISK-###` / Ninguno identificado |
| Release | Versión/enlace TBD o `No aplica` justificado |
| Aprobaciones | TBD |

## Trabajo diferido

Un pendiente descubierto durante el cierre debe registrarse con ID, impacto y prioridad propuesta. Que exista un nuevo PBI no convierte automáticamente en aceptable un incumplimiento del PBI actual; debe confirmarse que el criterio original sigue satisfecho.

## Preguntas abiertas

- ¿Qué subconjuntos de controles serán obligatorios por tipo de cambio?
- ¿Quién aprueba excepciones a la DoD y cómo se auditarán?
- ¿Qué estándares de accesibilidad, rendimiento y cobertura serán objetivos aceptados?
- ¿Qué evidencia deberá conservarse y por cuánto tiempo?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** aprobación de la estrategia técnica o antes del primer sprint de implementación.
- **Documentos relacionados:** [Definition of Ready](./DEFINITION_OF_READY.md), [Quality Strategy](../quality/QUALITY_STRATEGY.md), [Release Process](./RELEASE_PROCESS.md), [Traceability Model](./TRACEABILITY_MODEL.md).
