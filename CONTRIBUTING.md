# Contribuir a SR Taller 2.0

## Estado del documento

**Estado:** Resumen operativo de DEC-051 y DEC-063 aceptadas con condiciones.
**Alcance actual:** documentación, foundation técnica y cambios expresamente autorizados.

## Antes de comenzar

1. Verificar el [backlog](docs/backlog/PRODUCT_BACKLOG.md) y el [sprint actual](docs/sprints/sprint-00/SPRINT_BACKLOG.md).
2. No iniciar trabajo de implementación sin un PBI listo, asignado a un sprint de implementación y aprobado.
3. Durante Sprint 00, no iniciar funcionalidad de R0 sin autorización
   organizacional explícita; los cambios técnicos requieren alcance autorizado.
4. Leer la [Definition of Ready](docs/delivery/DEFINITION_OF_READY.md), la [Definition of Done](docs/delivery/DEFINITION_OF_DONE.md) y el [flujo de desarrollo](docs/delivery/DEVELOPMENT_WORKFLOW.md).
5. Hacer visibles supuestos, preguntas y dependencias; usar `TBD` cuando falte una respuesta.

## Cambios documentales

- Un cambio debe vincular un PBI o explicar por qué corrige una inconsistencia.
- Usar español y conservar términos técnicos en inglés cuando aporten precisión.
- Distinguir `Hecho conocido`, `Hipótesis`, `Propuesta`, `Decisión pendiente` y `Decisión aceptada`.
- Mantener enlaces relativos y actualizar índices cuando se agregue un documento.
- No presentar una propuesta técnica como decisión aceptada.
- Registrar alternativas, consecuencias y criterios de reconsideración en un ADR cuando corresponda.
- No introducir fechas, responsables, prioridades finales ni estimaciones sin aprobación.

## Revisión

Los cambios deben ser pequeños y trazables. La revisión comprueba contenido,
consistencia de términos, enlaces, identificadores, impacto multitenant,
decisiones relacionadas y evidencia aplicable. Debe usar la
[plantilla de pull request](.github/pull_request_template.md), clasificar el
riesgo de forma fail-closed y aplicar la
[Definition of Done](docs/delivery/DEFINITION_OF_DONE.md).

## Commits y pull requests

`main` es la única baseline integrada y los cambios ordinarios usan ramas de
vida corta. La política operativa, su relación con Preview y el tratamiento
fail-closed de `DEC051-C02` se describen en la
[política de ramas](docs/delivery/BRANCH_POLICY.md). La protección técnica de
`main` permanece pendiente, por lo que su existencia no debe inferirse. Este
documento no autoriza por sí solo commit, push, merge, deploy ni release.

## Condiciones abiertas

- `DEC051-C02`: materializar y demostrar protección de `main`.
- `DEC063-C02`: materializar clasificación de riesgo.
- `DEC063-C08`: materializar waivers y excepciones.

## Próxima revisión

Antes del primer cambio funcional autorizado o al cambiar DEC-051/063.
