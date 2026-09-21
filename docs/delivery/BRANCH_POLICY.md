# Política de ramas

## Estado del documento

- **Estado:** Aceptada para desarrollo y Preview.
- **Baseline integrada:** `main`.
- **Alcance:** repositorio SR Taller 2.0 y despliegue de desarrollo en Preview.
- **Fuera de alcance:** Staging, Production y autorización de releases.
- **Workflow superior:**
  [DEVELOPMENT_AND_DELIVERY_WORKFLOW.md](./DEVELOPMENT_AND_DELIVERY_WORKFLOW.md).

## Política operativa

1. `main` es la única baseline integrada y la fuente del ambiente Preview.
2. El trabajo ordinario usa ramas de vida corta creadas desde `main` y vuelve a
   `main` mediante un cambio revisado y verificable.
   Los prefijos normales son `feature/*`, `fix/*`, `ops/*` y `chore/*`;
   `chore/*` se reserva para mantenimiento o governance sin cambio de producto.
3. No se mantienen ramas permanentes por ambiente o por etapa. Una rama de
   recuperación, operación, PBI o experimento no constituye una segunda
   baseline.
4. Los commits y merges deben conservar trazabilidad del alcance, pruebas y
   autorización aplicable.
5. Por defecto una funcionalidad aprobada viaja en un solo cambio de
   integración con pruebas, hardening, documentación canónica y evidencia no
   derivable. Un PR posterior existe sólo si hay otro cambio real; no para
   copiar CI/SHA ni convertir wording pre-merge.
6. Preview puede desplegar el nuevo `main` cuando el alcance de runtime lo
   autoriza, el mecanismo sea claro y observable y no amplíe a otros ambientes.
7. Staging y Production requieren su propia autorización y no se infieren de un
   despliegue exitoso en Preview.

Cada objetivo se organiza como una Work Unit conforme a
[`WORK_UNIT_LIFECYCLE.md`](./WORK_UNIT_LIFECYCLE.md). La Work Unit añade memoria
operacional y handoff. El trabajo de producto conserva roadmap/backlog/PBI;
bugs, recovery, mantenimiento y governance no necesitan inventar uno. Ninguna
Work Unit reduce los gates vigentes.

## Una meta activa, una rama

1. `main` actualizado es la última verdad integrada y el único origen normal de
   un objetivo nuevo.
2. Una meta funcional, remediación o cambio de governance activo usa una sola
   rama corta. Las iteraciones y correcciones del mismo objetivo permanecen en
   esa rama mientras no haya sido integrada.
3. Una rama ya integrada nunca se reutiliza. Un objetivo, hotfix o remediación
   posterior crea una rama nueva desde el `main` actualizado, aunque afecte la
   misma superficie.
4. Antes de entregar Owner Review o ejecutar gates de integración se debe
   demostrar:
   - ancestry de la rama contra la baseline declarada;
   - ausencia de commits ajenos al objetivo;
   - provenance del runtime observado contra el commit candidato.
5. Un branch de trabajo congelado no se trata como baseline. Si otra
   remediación debe precederlo, se conserva sin modificar y sólo se reconcilia
   desde el nuevo `main` cuando esa remediación cierre.
6. Después de merge autorizado y validación aplicable, se eliminan las ramas
   local y remota ya absorbidas y se ejecuta `fetch --prune`, siempre después
   de confirmar que no contienen trabajo exclusivo.

La rama `feature/pbi-040-catalog-pricing-core` fue una excepción histórica de transición:
su WIP Price List permaneció congelado durante PBI-043. Después del cierre de
PBI-043 se reconcilió por merge explícito con `main` `5be5cd6`, preservando el
HEAD histórico `68843ba` como padre y sin reescribir el historial. PR #49 la
integró; PR #50/#51 integraron remediaciones acotadas. Preview validó el `main`
funcional `09e14c8`, por lo que las tres ramas absorbidas deben eliminarse al
completar el cierre documental y su exact-main CI. Ninguna se reutiliza.

Git branches y deployment environments son ejes distintos. Dokploy representa
ambientes; no se crean ramas permanentes `preview`, `staging` o `production`.
El autodeploy actual de Preview está deshabilitado y el deployment es manual.

## Protección de `main`

La condición `DEC051-C02` continúa abierta: el repositorio público observado no
tiene branch protection ni rulesets configurados. Mientras esa condición no se
satisfaga o DEC-051 no sea modificada formalmente:

- no se debe afirmar que `main` está protegido técnicamente;
- checks verdes no equivalen por sí solos a autorización de merge;
- cada integración necesita la autoridad aplicable y evidencia registrada;
- una delegación Owner explícita de delivery puede cubrir los pasos rutinarios
  de una feature/PBI autorizada, sin cubrir Production, force push, rewrites,
  datos Owner destructivos ni ampliación material de alcance;
- no se fuerza, reescribe ni elude el historial para simular cumplimiento.

## Ramas después de integrar

El historial integrado y su evidencia viven en Git, PR, CI y documentación; no
requieren conservar indefinidamente la rama. Tras merge y validación Preview,
la limpieza local/remota es parte del cierre normal. Si una rama absorbida se
conserva temporalmente por investigación, debe estar explícitamente marcada y
no puede recibir nuevos commits.

## Criterio de reconsideración

Revisar esta política al habilitar protección técnica de `main`, introducir un
ambiente adicional, autorizar Production o requerir una estrategia de release
distinta.
