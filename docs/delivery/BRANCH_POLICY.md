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
   Los prefijos normales son `feature/*`, `fix/*` y `ops/*`.
3. No se mantienen ramas permanentes por ambiente o por etapa. Una rama de
   recuperación, operación, PBI o experimento no constituye una segunda
   baseline.
4. Los commits y merges deben conservar trazabilidad del alcance, pruebas y
   autorización aplicable.
5. Después de cerrar un PBI, el avance de roadmap usa una rama documental
   `ops/pbi-###-roadmap-advance` creada desde el nuevo `main`. Ese PR registra
   el cierre candidato, actualiza Sprint/roadmap y selecciona el siguiente PBI
   sin iniciar su implementación. Su merge autorizado y CI de `main` GREEN
   sobre el SHA exacto materializan `Done`; no se crea una rama o PR adicional
   sólo para convertir wording pre-merge `Done candidate`.
6. Preview puede desplegar automáticamente un nuevo `main` sólo cuando el
   mecanismo sea claro, observable y no amplíe el alcance a otros ambientes.
7. Staging y Production requieren su propia autorización y no se infieren de un
   despliegue exitoso en Preview.

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
6. Después de merge autorizado y validación Preview satisfactoria, se eliminan
   las ramas local y remota ya absorbidas y se ejecuta `fetch --prune`, siempre
   después de confirmar que no contienen trabajo exclusivo.

La rama `feature/pbi-040-catalog-pricing-core` es actualmente una excepción de
transición explícita: contiene WIP Price List no integrado, permanece congelada
y no debe eliminarse ni reutilizarse para PBI-043. La implementación futura de
PBI-043 deberá usar una rama `fix/*` nueva creada desde el `main` vigente.

Git branches y deployment environments son ejes distintos. Dokploy representa
ambientes; no se crean ramas permanentes `preview`, `staging` o `production`.
El autodeploy actual de Preview está deshabilitado y el deployment es manual.

## Protección de `main`

La condición `DEC051-C02` continúa abierta: el repositorio público observado no
tiene branch protection ni rulesets configurados. Mientras esa condición no se
satisfaga o DEC-051 no sea modificada formalmente:

- no se debe afirmar que `main` está protegido técnicamente;
- checks verdes no equivalen por sí solos a autorización de merge;
- cualquier integración funcional alcanzada por ese gate necesita autorización
  explícita y evidencia registrada;
- cualquier PR documental de avance también requiere autorización Owner
  explícita de merge;
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
