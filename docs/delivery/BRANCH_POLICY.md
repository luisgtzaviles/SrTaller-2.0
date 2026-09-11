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

Las ramas ya absorbidas, sustituidas o históricas pueden conservarse durante la
transición como evidencia. Su eliminación es una acción separada, posterior a
confirmar que no contienen trabajo válido exclusivo y que `main` y Preview se
mantienen estables.

## Criterio de reconsideración

Revisar esta política al habilitar protección técnica de `main`, introducir un
ambiente adicional, autorizar Production o requerir una estrategia de release
distinta.
