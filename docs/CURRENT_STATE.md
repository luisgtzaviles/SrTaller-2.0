# Current Repository State

## DEPRECATED / NOT AUTHORITATIVE

Este archivo se conserva únicamente como **deprecated pointer** para no romper
enlaces históricos. Ya no es una fuente operacional ni debe actualizarse como
snapshot manual.

La versión anterior mezclaba estado derivable de Git/GitHub/runtime con
roadmap, PBI, Sprint, historia y reglas permanentes. Esas responsabilidades ya
tienen autoridades separadas:

| Pregunta | Autoridad vigente |
|---|---|
| ¿Qué trabajo se ejecuta ahora? | [`ACTIVE_CHECKLIST.md`](work/ACTIVE_CHECKLIST.md), validado contra Git. |
| ¿Cuál es la prioridad de producto? | [`MVP_OPERATING_ROADMAP.md`](product/MVP_OPERATING_ROADMAP.md) y [backlog](backlog/README.md). |
| ¿Cuál es la rama/SHA actual? | Git. |
| ¿Cuál es el estado de PR, review, merge o CI? | GitHub y GitHub Actions. |
| ¿Qué está desplegado y healthy? | Provenance/health del ambiente y plataforma de deployment. |
| ¿Qué reglas y decisiones permanentes aplican? | [`AGENTS.md`](../AGENTS.md), contratos temáticos vigentes y ADR/DEC aceptadas. |
| ¿Dónde vive la historia? | Git, PR, CI, releases, PBI y evidencia no derivable. |

La asignación completa está en
[`SOURCE_OF_TRUTH.md`](delivery/SOURCE_OF_TRUTH.md).

## Política de compatibilidad

- Los enlaces existentes a esta ruta pueden permanecer durante la transición.
- Un agente no debe leer este archivo para reconstruir el estado actual.
- No se copian aquí SHAs, runs, estados de PBI/Sprint ni resultados de health.
- El contenido anterior permanece recuperable en Git y no se reescribe como
  historia nueva.
