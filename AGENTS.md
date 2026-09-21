# AGENTS.md — SR Taller 2.0

## Propósito

Este archivo es la constitución operativa y puerta de entrada del repositorio.
SR Taller 2.0 es una plataforma SaaS multitenant para talleres de reparación de
celulares. El repositorio, Git y la evidencia vigente del runtime son la fuente
de verdad; una conversación o memoria externa nunca los sustituye.

AGENTS.md resume cómo trabajar y dirige a los contratos autoritativos. No copia
sus reglas ni concede por sí solo autorización de producto, merge, datos o
deploy.

## Inicio obligatorio

Antes de modificar cualquier archivo:

1. Inspeccionar ruta, rama, `HEAD`, `origin/main`, divergencia y working tree.
2. Leer [`docs/work/ACTIVE_CHECKLIST.md`](docs/work/ACTIVE_CHECKLIST.md) y
   reconciliarlo contra Git. Su estado es operacional y temporal.
3. Leer el objetivo autorizado y la documentación permanente aplicable desde
   el [índice de documentación](docs/README.md).
4. Leer el
   [Work Unit Lifecycle](docs/delivery/WORK_UNIT_LIFECYCLE.md), el
   [workflow end-to-end](docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md) y
   la [política de ramas](docs/delivery/BRANCH_POLICY.md).
5. Confirmar alcance, exclusiones, riesgo, ambiente, datos involucrados,
   autoridad y gates antes de actuar.

Si Git, runtime y documentos discrepan, detener las afirmaciones de estado,
investigar y reconciliar. No corregir silenciosamente al repositorio desde la
memoria del chat.

## Work Unit y disciplina de ejecución

Una **Work Unit** es un objetivo coherente ejecutado en una rama corta, con un
checklist activo y un lifecycle de promoción. Puede abarcar varias sesiones,
agentes, conversaciones y commits; no equivale necesariamente a un PBI, chat o
commit.

- Mantener una sola Work Unit activa, salvo autorización explícita contraria.
- Crear la rama desde `main` actualizado y preservar trabajo ajeno o no
  rastreado.
- No iniciar producto sin PBI/readiness/selección/autorización cuando esos
  contratos apliquen. Bugs, recovery y governance también requieren objetivo y
  autoridad explícitos, aunque no sean un PBI nuevo.
- No ampliar alcance, inventar decisiones, prioridades, aceptación, waivers ni
  excepciones.
- Una decisión Accepted se aplica; el trabajo normal no vuelve a decidirla.
  Cambiar arquitectura, una decisión Accepted o un contrato fundamental exige
  el proceso ADR/DEC aplicable.
- Al llegar al checkpoint autorizado, detenerse. Nunca iniciar automáticamente
  la siguiente Work Unit o PBI.

El contrato completo, incluidos los estados `ACTIVE`,
`READY_FOR_PROMOTION`, cierre derivado y transición con PBI/Sprint, está en
[`WORK_UNIT_LIFECYCLE.md`](docs/delivery/WORK_UNIT_LIFECYCLE.md).

## Mapa de conocimiento permanente

Leer sólo las fuentes necesarias para el cambio, sin confundir documentos
`Proposed` o históricos con política vigente.

| Tema | Fuente autoritativa o índice |
|---|---|
| Producto, alcance y prioridad | [`PRODUCT_VISION.md`](docs/product/PRODUCT_VISION.md), [`PRODUCT_SCOPE.md`](docs/product/PRODUCT_SCOPE.md), [`MVP_OPERATING_ROADMAP.md`](docs/product/MVP_OPERATING_ROADMAP.md) |
| Arquitectura y módulos | [`MODULE_CREATION.md`](docs/engineering/MODULE_CREATION.md), [`APPLICATION_ARCHITECTURE.md`](docs/architecture/APPLICATION_ARCHITECTURE.md), [`MODULE_MAP.md`](docs/product/MODULE_MAP.md), [`architecture/dec-005-policy.json`](architecture/dec-005-policy.json) |
| Tenant, sucursal y datos | [`MULTITENANCY_MODEL.md`](docs/architecture/MULTITENANCY_MODEL.md), [`DATA_ARCHITECTURE.md`](docs/architecture/DATA_ARCHITECTURE.md) |
| Identidad, sesiones y autorización | [`IDENTITY_ACCESS_AND_PERMISSIONS.md`](docs/architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [`BRANCH_AND_DEVICE_MODEL.md`](docs/architecture/BRANCH_AND_DEVICE_MODEL.md), ADR-010 a ADR-014 en el [registro de decisiones](docs/decisions/README.md) |
| Persistencia y migraciones | [`DATA_ARCHITECTURE.md`](docs/architecture/DATA_ARCHITECTURE.md), [DEC-049](docs/decisions/dec-049-persistence-ownership/DECISION_PROPOSAL.md), [`MIGRATION_POLICY.md`](docs/operations/MIGRATION_POLICY.md) |
| Errores | [DEC-044](docs/decisions/dec-044-error-strategy/DECISION_PROPOSAL.md) |
| Seguridad y secretos | [`SECURITY_BASELINE.md`](docs/architecture/SECURITY_BASELINE.md), [`SECURITY_TESTING.md`](docs/quality/SECURITY_TESTING.md) |
| UI y componentes | [`COMPONENT_CATALOG.md`](docs/design-system/COMPONENT_CATALOG.md), [`DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md`](docs/design-system/DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md), `apps/dev-preview-web/src/components/ui/` |
| Accesibilidad | [`ACCESSIBILITY_STRATEGY.md`](docs/quality/ACCESSIBILITY_STRATEGY.md) |
| Testing y gates | [`QUALITY_STRATEGY.md`](docs/quality/QUALITY_STRATEGY.md), [DEC-051](docs/decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md), [`DEFINITION_OF_DONE.md`](docs/delivery/DEFINITION_OF_DONE.md) |
| Delivery, ramas y ambientes | [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md), [`BRANCH_POLICY.md`](docs/delivery/BRANCH_POLICY.md), [`ENVIRONMENTS.md`](docs/delivery/ENVIRONMENTS.md) |
| Autoridad de estado | [`SOURCE_OF_TRUTH.md`](docs/delivery/SOURCE_OF_TRUTH.md): Git/GitHub/CI/runtime para hechos derivables; contratos para reglas |
| Trabajo actual | [`ACTIVE_CHECKLIST.md`](docs/work/ACTIVE_CHECKLIST.md) |

Antes de crear UI, buscar primero componentes, patrones y tokens compartidos.
Una pantalla no introduce primitivas, colores, spacing, modal, tabla o patrón
responsive paralelo sin justificar que el sistema actual no cubre la necesidad.

Antes de crear o extender un módulo, seguir
[`MODULE_CREATION.md`](docs/engineering/MODULE_CREATION.md): buscar contratos y
owners existentes antes de duplicar; resolver explícitamente scope de tenant y
sucursal antes de persistir; y evaluar autorización backend antes de exponer
una acción en API o UI.

Antes de persistir, consultar, filtrar, agrupar o presentar fechas/horas, leer
[`DATA_ARCHITECTURE.md`](docs/architecture/DATA_ARCHITECTURE.md). La timezone
del browser, servidor o proceso no sustituye `Branch.timeZone`.

## Desarrollo y verificación

- Antes de cualquier comando Node.js o pnpm usar `./scripts/pnpm-governed` o
  activar Node.js `24.18.0` y pnpm `11.15.1`. No usar el toolchain ambiental
  por conveniencia ni relajar `verify:toolchain`.
- Durante iteración ejecutar preflight y checks focalizados proporcionales al
  delta. No usar `verify:full` repetidamente como feedback ordinario.
- Antes de promoción ejecutar los gates vigentes del riesgo y tipo de cambio.
  El clasificador general continúa `SHADOW`; sólo `DOCS_ONLY` puede reducir el
  pipeline cuando su allowlist fail-closed lo demuestra.
- Persistencia, migraciones, tenancy, autenticación, autorización, secretos,
  infraestructura y datos exigen sus pruebas materiales y negativas.
- Registrar en el checklist qué se ejecutó y qué queda pendiente; no declarar
  un gate por código escrito o evidencia de otro SHA.

## Git, remoto y ambientes

- `main` es la única baseline integrada. Usar ramas cortas `feature/*`,
  `fix/*`, `ops/*` o `chore/*` conforme a
  [`BRANCH_POLICY.md`](docs/delivery/BRANCH_POLICY.md).
- No descartar cambios existentes, reescribir historia, hacer force push,
  merge, deploy, tocar datos remotos o cambiar infraestructura sin autoridad.
- Checks verdes no conceden merge, aceptación de producto, release ni deploy.
- Preview es el único ambiente remoto materializado. Staging y Production
  siguen planeados; no afirmar que existen ni promover hacia ellos.
- Commits, PR, CI, merge, deploy, validación y cierre son estados distintos.
  Cada resultado debe estar ligado al SHA exacto al que corresponde.

## ACTIVE_CHECKLIST

`docs/work/ACTIVE_CHECKLIST.md` es la memoria operacional compartida de la Work
Unit actual, no historia canónica, arquitectura, roadmap, Git status ni base de
datos de CI.

- Inicializarlo al comenzar la rama y actualizarlo después de bloques
  significativos.
- Reflejar objetivo, alcance, contratos, riesgos, plan, progreso, bloqueos,
  descubrimientos, verificación y handoff.
- No marcar PR, CI, review, merge, aceptación, `Done`, `Released` o deploy antes
  de que ocurran.
- Antes de promoción mover toda decisión duradera a su fuente permanente.
- No ponerlo en `IDLE` mientras el cambio siga sin integrar. El cierre se
  resuelve mediante el predicado verificable definido en el Work Unit
  Lifecycle, sin crear un PR post-merge sólo para cambiar wording.

Las decisiones duraderas siempre se materializan en la fuente canónica
correspondiente. El checklist nunca puede otorgar autoridad ni modificar por sí
solo el estado de un PBI, Sprint, decisión o release.
