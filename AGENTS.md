# AGENTS.md — SR Taller 2.0

## Propósito

Este archivo es la puerta de entrada para Codex. Resume las reglas operativas;
no sustituye el roadmap, el Sprint, el PBI ni las decisiones del repositorio.

## Fuente de verdad y lectura obligatoria

El repositorio, su historial Git y la evidencia vigente de CI/runtime son la
fuente de verdad. La conversación y la memoria del chat sólo aportan contexto:
nunca sustituyen ni corrigen silenciosamente al repositorio.

Antes de actuar, leer en este orden:

1. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).
2. [`docs/product/MVP_OPERATING_ROADMAP.md`](docs/product/MVP_OPERATING_ROADMAP.md).
3. Los documentos del Sprint activo.
4. El documento del PBI actual.
5. Los ADR/DEC y los contratos de entrega relevantes al alcance, incluidos
   [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md),
   [`DEFINITION_OF_DONE.md`](docs/delivery/DEFINITION_OF_DONE.md),
   [`BRANCH_POLICY.md`](docs/delivery/BRANCH_POLICY.md) y
   [`TRACEABILITY_MODEL.md`](docs/delivery/TRACEABILITY_MODEL.md).

Usar roadmap, Sprint y PBI para determinar el trabajo vigente y el siguiente
candidato. Si no existe Sprint activo, PBI actual, readiness o autoridad
suficiente, fallar cerrado y detener la ejecución, salvo una tarea explícita
de governance o revisión autorizada dentro de su alcance.

## Disciplina de ejecución

- WIP operacional: un solo PBI.
- No iniciar trabajo sin alcance y autorización vigentes.
- No inventar decisiones, prioridades, aceptación ni excepciones del Owner.
- No inferir Owner Acceptance ni autoridad de merge o deploy a partir de tests,
  CI, estado mergeable, revisión técnica o silencio.
- No ampliar el alcance ni absorber trabajo de otro PBI.
- Al llegar a `Owner Review`, detenerse y entregar un resultado revisable.
- Nunca iniciar automáticamente el siguiente PBI. Su selección sólo lo deja
  como candidato; requiere sus propios gates y autorización.

## Definition of Done

La autoridad pertenece a
[`DEFINITION_OF_DONE.md`](docs/delivery/DEFINITION_OF_DONE.md) y a
[`DEC-063`](docs/decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md).
Este archivo sólo resume el gate y no crea una Definition of Done paralela.

No declarar un PBI `Done` hasta que, como mínimo:

- el cambio esté integrado en `main` mediante merge autorizado;
- el CI autoritativo de `main` esté verde sobre el SHA integrado exacto;
- documentación y evidencia estén reconciliadas en `main`; y
- se hayan satisfecho la Definition of Done, los gates y la Owner Acceptance
  aplicables.

Un resultado local, una rama, un PR verde o una review aprobada no equivalen a
`Done`. `Done` tampoco equivale a `Released` ni autoriza deploy.

## Git, merge y deploy

- Inspeccionar branch, baseline, tracking, divergencia y working tree antes de
  modificar archivos.
- Preservar cambios ajenos y trabajo local no relacionado.
- No hacer force push.
- Seguir [`BRANCH_POLICY.md`](docs/delivery/BRANCH_POLICY.md) para integración e
  historia; no reescribir historia compartida ni usar rebase o squash para
  eludir trazabilidad o autorización.
- No hacer merge sin autorización explícita del Owner.
- No hacer deploy, release ni cambios de infraestructura sin autorización
  explícita y específica.

## Contratos técnicos y de seguridad

- Usar los pins canónicos verificados por [`package.json`](package.json),
  [`DEC-004`](docs/decisions/dec-004-toolchain-contract/DECISION_PROPOSAL.md) y
  [`LOCAL_DEVELOPMENT.md`](docs/delivery/LOCAL_DEVELOPMENT.md): Node.js
  `24.18.0`, pnpm `11.15.1` y PostgreSQL `18.4`.
- Ante ambigüedad de contexto, identidad, tenant, branch, autorización,
  configuración, evidencia o alcance, fallar cerrado.
- Respetar `DEC-005`, el ownership modular y los checks de arquitectura. No
  introducir bypasses, dependencias prohibidas ni excepciones implícitas.
- Después de superar el gate de identidad aplicable, los actores sintéticos se
  permiten únicamente en desarrollo, pruebas y fixtures; no en writes
  productivos aprobados.
- Mantener la documentación y evidencia exigidas por el workflow; no dejar
  código integrado con `CURRENT_STATE.md` desactualizado.

Cuando una instrucción local parezca contradecir el estado canónico, detenerse,
mostrar la contradicción y solicitar decisión del Owner.
