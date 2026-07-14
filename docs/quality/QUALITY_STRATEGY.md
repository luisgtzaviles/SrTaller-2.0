# Estrategia de calidad

## Estado del documento

- **Estado:** Propuesta
- **Alcance:** Fundación documental y futuro ciclo de producto de SR Taller 2.0.
- **Hecho conocido:** El aislamiento multitenant, permisos, trazabilidad y despliegues repetibles son riesgos centrales.
- **Decisión pendiente:** Objetivos medibles, herramientas, roles de QA y umbrales de liberación.

## Propósito

Construir confianza mediante prevención, revisión, pruebas y evidencia desde el refinamiento hasta producción. Calidad no es una fase final ni responsabilidad exclusiva de QA; cada PBI debe anticipar cómo demostrar valor, seguridad y operación correcta.

## Objetivos de calidad

1. Evitar lectura, modificación o inferencia de datos entre tenants.
2. Aplicar autorización por actor, permiso, tenant, sucursal, dispositivo y sesión según corresponda.
3. Preservar consistencia e idempotencia en API, jobs, realtime e integraciones.
4. Ofrecer experiencias predecibles en éxito, carga, vacío, error y denegación.
5. Hacer cambios pequeños, observables, reversibles y trazables.
6. Detectar regresiones antes de producción y aprender de defectos e incidentes.
7. Mantener documentación y evidencia suficientes para reproducir decisiones y validaciones.

No se fijan todavía porcentajes de cobertura, tasas de defecto, objetivos de disponibilidad o rendimiento; deberán acordarse con contexto y nunca usarse aisladamente.

## Dimensiones

| Dimensión | Pregunta de calidad | Evidencia esperada |
|---|---|---|
| Adecuación | ¿Resuelve el problema y sus criterios sin ampliar alcance? | Review de producto y criterios trazados. |
| Aislamiento | ¿Cada tenant sólo observa y modifica su ámbito? | Matriz negativa y pruebas automatizadas. |
| Acceso | ¿Actor, sucursal, dispositivo y permiso se validan en servidor? | Pruebas permitidas/denegadas y auditoría. |
| Integridad | ¿Reintentos, concurrencia y fallos parciales conservan datos correctos? | Integración, idempotencia y reconciliación. |
| Seguridad y privacidad | ¿Reduce abuso y exposición de información? | Threat model, pruebas y hallazgos tratados. |
| Usabilidad y accesibilidad | ¿La operación es comprensible y utilizable en contextos reales? | Revisión de estados, teclado, lector y responsive. |
| Rendimiento y escala | ¿Cumple objetivos acordados con crecimiento de tenants? | Perfil, carga y límites; objetivos TBD. |
| Resiliencia | ¿Se recupera de fallos de dependencias y despliegues? | Timeouts, reintentos, degradación, backup y rollback. |
| Observabilidad | ¿Se puede detectar y explicar un fallo sin exponer secretos? | Logs contextuales, métricas, traces y alertas. |
| Mantenibilidad | ¿Respeta límites modulares y contratos? | Revisión, pruebas y ADRs/documentación. |

## Calidad durante el ciclo

### Descubrimiento y refinamiento

- Definir criterios observables y casos negativos.
- Analizar tenant, sucursal, permisos, datos, accesibilidad, operación e integraciones.
- Hacer visibles hipótesis y preguntas bloqueantes.
- Seleccionar nivel de prueba y evidencia según riesgo.
- Verificar la [Definition of Ready](../delivery/DEFINITION_OF_READY.md).

### Diseño

- Revisar límites de módulo y propiedad de datos.
- Modelar amenazas y abuso en cambios sensibles.
- Diseñar idempotencia, errores, auditoría, observabilidad y rollback.
- Registrar alternativas difíciles de revertir en ADR antes de implementar.

### Implementación futura

- Usar pruebas cercanas al comportamiento y controles automáticos tempranos.
- Revisar código y contratos; no confiar en filtros manuales de tenant.
- Mantener datos de prueba sintéticos y reproducibles.
- Añadir prueba de regresión a cada defecto corregido.

### Validación y liberación

- Ejecutar la combinación de pruebas definida en [Testing Strategy](./TESTING_STRATEGY.md).
- Conservar evidencia en [QA Evidence Template](./QA_EVIDENCE_TEMPLATE.md).
- Validar candidato en staging con el mismo digest que se promoverá.
- Bloquear producción ante hallazgos críticos, evidencia incompleta en controles esenciales o rollback inviable.
- Verificar salud después de desplegar y convertir hallazgos en trabajo trazable.

## Enfoque basado en riesgo

La profundidad aumenta cuando el cambio:

- cruza límites de tenant o sucursal;
- afecta identidad, PIN, roles, permisos o dispositivo autorizado;
- modifica datos, migraciones, pagos, caja, suscripciones o auditoría;
- procesa webhooks, archivos, mensajes, jobs o reintentos;
- cambia contratos compartidos por API, workers, web o móvil futuro;
- carece de rollback simple o puede causar pérdida silenciosa;
- tiene alta frecuencia o impacto operativo.

Clasificación, probabilidad, impacto y autoridad para aceptar riesgo quedan `TBD`. Un resultado de bajo riesgo no elimina controles esenciales de acceso y tenant.

## Gates propuestos

| Gate | Evidencia mínima |
|---|---|
| Ready | Criterios, impactos, riesgos, plan de prueba y preguntas bloqueantes resueltas. |
| Review | Revisión por pares, controles automáticos y documentación/ADR consistentes. |
| QA | Criterios trazados a casos, build y ambiente exactos, hallazgos clasificados. |
| Production | Aislamiento y seguridad aprobados según riesgo, migración/rollback y operación preparadas. |
| Done | Evidencia enlazada, riesgos residuales explícitos y aprobación correspondiente. |

## Defectos y hallazgos

- Registrar bugs con la [plantilla](../delivery/BUG_TEMPLATE.md).
- Separar severidad de prioridad; escalas y tiempos están pendientes.
- Tratar sospecha de vulnerabilidad o acceso entre tenants mediante canal restringido e [Incident Management](../operations/INCIDENT_MANAGEMENT.md) cuando haya impacto activo.
- No cerrar un defecto sin prueba de regresión o justificación documentada.
- Analizar patrones de causa, no sólo conteos.

## Evidencia y trazabilidad

Cada resultado debe conectar criterio → caso → ejecución → resultado → hallazgo → resolución → release. La evidencia identifica PBI/bug, versión/digest, ambiente, datos no sensibles y ejecutor/automatización. Se sigue el [modelo de trazabilidad](../delivery/TRACEABILITY_MODEL.md).

## Métricas candidatas, aún no aprobadas

Se evaluará medir tendencias, sin fijar metas numéricas todavía:

- defectos escapados y reincidencia;
- tiempo de detección y recuperación;
- estabilidad de suites y duración de feedback;
- cobertura de riesgos/criterios, no sólo cobertura de líneas;
- frecuencia de rollbacks e incidentes por cambio;
- fallos de aislamiento o autorización, cuyo objetivo esperado debe ser cero pero requiere definición operativa;
- deuda de accesibilidad y hallazgos de seguridad abiertos;
- PBIs bloqueados por preguntas descubiertas tarde.

## Responsabilidades preliminares

| Rol | Contribución |
|---|---|
| Product Owner | Confirmar problema, criterios y aceptación de producto. |
| Ingeniería | Diseñar controles, automatizar pruebas y aportar evidencia técnica. |
| QA | Evaluar riesgos, diseñar escenarios y revisar evidencia/hallazgos. |
| Seguridad | Revisar amenazas y hallazgos sensibles según umbral TBD. |
| Operaciones | Validar observabilidad, despliegue, recuperación y runbooks. |

Asignaciones, independencia de aprobación y disponibilidad real son `TBD`.

## Preguntas abiertas

- ¿Qué roles de calidad, seguridad y operación existirán inicialmente?
- ¿Qué objetivos medibles y gates se aprobarán por nivel de riesgo?
- ¿Qué navegadores, dispositivos y condiciones de red se soportarán?
- ¿Cómo se almacenará evidencia sin conservar datos sensibles?
- ¿Qué suite mínima bloqueará un pull request y cuál un release?
- ¿Qué proceso aceptará riesgo residual y por cuánto tiempo?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** aprobación del modelo de riesgos o antes del primer sprint de implementación.
- **Documentos relacionados:** [Definition of Done](../delivery/DEFINITION_OF_DONE.md), [Security Testing](./SECURITY_TESTING.md), [Multitenant Isolation Testing](./MULTITENANT_ISOLATION_TESTING.md), [Accessibility Strategy](./ACCESSIBILITY_STRATEGY.md).
