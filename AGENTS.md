
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
3. [`docs/work/ACTIVE_CHECKLIST.md`](docs/work/ACTIVE_CHECKLIST.md).
4. Los documentos del Sprint activo.
5. El documento del PBI actual.
6. Los ADR/DEC y los contratos de entrega relevantes al alcance, incluidos
   [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md),
   [`DEFINITION_OF_DONE.md`](docs/delivery/DEFINITION_OF_DONE.md),
   [`BRANCH_POLICY.md`](docs/delivery/BRANCH_POLICY.md) y
   [`TRACEABILITY_MODEL.md`](docs/delivery/TRACEABILITY_MODEL.md).

Usar roadmap, Sprint y PBI para determinar el trabajo vigente y el siguiente
candidato. Si no existe Sprint activo, PBI actual, readiness o autoridad
suficiente, fallar cerrado y detener la ejecución, salvo una tarea explícita
de governance o revisión autorizada dentro de su alcance.

## Disciplina de ejecución

- Antes de cualquier comando del repositorio que ejecute Node.js o pnpm, usar
  `./scripts/pnpm-governed` o activar explícitamente los pins del repositorio
  (Node.js `24.18.0`, pnpm `11.15.1`). No usar el Node ambiental sólo porque
  aparezca primero en `PATH` ni relajar `verify:toolchain`.
- WIP operacional: un solo PBI.
- No iniciar trabajo sin alcance y autorización vigentes.
- No inventar decisiones, prioridades, aceptación ni excepciones del Owner.
- No inferir Owner Acceptance ni autoridad de merge o deploy a partir de tests,
  CI, estado mergeable, revisión técnica o silencio.
- No ampliar el alcance ni absorber trabajo de otro PBI.
- Al llegar a `Owner Review`, detenerse y entregar un resultado revisable.
- Nunca iniciar automáticamente el siguiente PBI. Su selección sólo lo deja
  como candidato; requiere sus propios gates y autorización.

## Checklist operacional de progreso

Para cualquier Goal, milestone o tarea de implementación que abarque más de un
bloque significativo de trabajo, mantener un checklist operacional visible para
el Owner.

Archivo canónico del trabajo activo:

`docs/work/ACTIVE_CHECKLIST.md`

El checklist existe para responder rápidamente:

1. ¿Qué estamos construyendo?
2. ¿Qué ya terminó?
3. ¿Qué está haciendo Codex ahora?
4. ¿Qué sigue?
5. ¿Existe algún bloqueo?
6. ¿Cuánto falta para llegar al checkpoint visible actual?

El checklist es una superficie de visibilidad operacional. No sustituye
`CURRENT_STATE.md`, Roadmap, Sprint, PBI, ADR/DEC, Definition of Done ni
evidencia.

### Reglas del checklist

- Leer `docs/work/ACTIVE_CHECKLIST.md` al inicio de cualquier Goal de
  desarrollo. Crearlo antes de continuar si existe trabajo activo y falta.
- Mantener un único checklist activo.
- Al reanudar trabajo existente, leer primero el checklist y reconciliarlo
  contra Git, `CURRENT_STATE.md`, Roadmap, Sprint y PBI antes de confiar en él.
- El estado real del repositorio tiene prioridad sobre el checklist si existe
  divergencia.
- Actualizar el checklist después de bloques significativos de trabajo, no
  después de cada comando o edición.
- No marcar un ítem como completado sólo porque se escribió código.
- Marcar un ítem como completado únicamente cuando su condición material de
  aceptación para la etapa actual esté satisfecha.
- Reflejar inmediatamente cualquier bloqueo material.
- No marcar PR, CI, review, merge, Owner Acceptance, `Done` o `Released` antes
  de que realmente ocurran.
- No usar el checklist para otorgar autoridad, cerrar gates o cambiar el estado
  canónico de un PBI.
- Mantener el checklist comprensible para una persona no técnica.
- Evitar detalles de implementación que no ayuden a entender el progreso.
- Cuando cambie el PBI dentro de un milestone autorizado, reconciliar la sección
  del PBI actual sin perder la vista general del milestone.
- Cuando el milestone termine, archivar el checklist en
  `docs/work/history/` con un nombre estable y crear uno nuevo cuando comience
  el siguiente milestone.
- Reconciliarlo antes de entregar el turno: milestone/meta funcional, Sprint,
  Current PBI, WIP, progreso, Current, Next, blockers y timestamp.

### Estados visuales

Usar:

- `[ ]` pendiente.
- `[~]` en progreso.
- `[x]` completado.
- `[!]` bloqueado.

No representar como `[x]` algo que sólo esté parcialmente implementado.

### Cabecera obligatoria

El checklist debe incluir como mínimo:

- Milestone actual.
- Sprint.
- PBI actual.
- Estado general.
- Progreso (`completados / total`).
- Trabajo actual.
- Siguiente bloque.
- Bloqueos.
- Última actualización.

## Contratos transversales y memoria del repositorio

Antes de modificar una superficie que persista, consulte, filtre, agrupe o
presente fechas/horas, leer
[`docs/architecture/DATA_ARCHITECTURE.md`](docs/architecture/DATA_ARCHITECTURE.md).
La timezone del browser, servidor/proceso o la memoria del chat no sustituyen
ese contrato canónico.

Las decisiones duraderas deben materializarse en la fuente canónica del
repositorio. Si una decisión transversal aprobada cambia durante el trabajo,
identificar y actualizar esa fuente antes del cierre; no usar
`ACTIVE_CHECKLIST.md` como registro permanente de arquitectura.
