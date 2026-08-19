# Contribuir a SR Taller 2.0

## Estado del documento

**Estado:** Entry point operativo; resume DEC-051/063 y remite al workflow
canónico vigente.
**Alcance actual:** producto, documentación, foundation técnica y cambios
expresamente autorizados.

## MANDATORY FIRST READ

Antes de modificar código, documentación, infraestructura o deployment:

1. Leer la [fotografía auditada del estado actual](docs/CURRENT_STATE.md).
2. Leer el
   [workflow canónico de desarrollo y delivery](docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md).
3. Leer la [política de ramas](docs/delivery/BRANCH_POLICY.md).
4. Leer la [estrategia de despliegue](docs/architecture/DEPLOYMENT_STRATEGY.md).
5. Leer [ambientes](docs/delivery/ENVIRONMENTS.md).
6. Inspeccionar Git real y confirmar ambiente, sensibilidad de datos, alcance y
   autoridad antes de ejecutar.

Para cualquier cambio de interfaz, también es lectura obligatoria
[Design System & Application Shell V1](docs/design-system/DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md).
Su dirección está aprobada, pero el documento no autoriza implementación.

El repositorio, Git y la evidencia actual del runtime tienen precedencia sobre
el contexto de chat, memoria humana o supuestos de un agente.

## Antes de comenzar

1. Completar el `MANDATORY FIRST READ` y verificar el
   [backlog](docs/backlog/PRODUCT_BACKLOG.md) aplicable.
2. No iniciar trabajo de implementación sin un PBI listo, asignado a un sprint de implementación y aprobado.
3. No iniciar una nueva funcionalidad de R0 sin tarea/PBI y autoridad
   explícitos; la existencia de Preview no amplía el alcance autorizado.
4. Leer la [Definition of Ready](docs/delivery/DEFINITION_OF_READY.md), la
   [Definition of Done](docs/delivery/DEFINITION_OF_DONE.md) y el
   [lifecycle especializado](docs/delivery/DEVELOPMENT_WORKFLOW.md) cuando
   correspondan al tipo de trabajo.
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

- Restaurar el CI verde de `main`: el `HEAD` auditado falla en
  `smoke:start` porque el proceso compilado no recibe la configuración
  PostgreSQL obligatoria. La PR #5 tiene un candidato con CI autoritativo verde,
  pero falta integración a `main` mediante autoridad separada y CI verde sobre
  esa baseline.
- Reconciliar la implementación no integrada de PBI-024 en la PR draft #3
  antes de iniciar un slice dependiente de contexto de estación.
- `DEC051-C02`: materializar y demostrar protección de `main`.
- `DEC063-C02`: materializar clasificación de riesgo.
- `DEC063-C08`: materializar waivers y excepciones.

## Próxima revisión

Antes del primer cambio funcional autorizado o al cambiar DEC-051/063.
