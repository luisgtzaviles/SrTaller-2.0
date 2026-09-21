# Work Unit Lifecycle

## Estado del documento

- **Estado:** Contrato operacional de transición, materializado en Harness 2.0
  Iteration 1.
- **Autoridad:** autorización Owner de SR Taller Development Harness 2.0.
- **Alcance:** organizar un objetivo coherente desde su rama local hasta su
  cierre sin sustituir PBI, Sprint, DoD, ADR/DEC, review, CI o autoridad Owner.
- **Exclusiones:** no cambia gates de CI, producto, arquitectura, ambientes,
  permisos GitHub ni reglas de datos.
- **Próxima revisión:** después de usar el modelo en una Work Unit completa o
  cuando cambien branch protection, Staging o el workflow de promoción.

## Definición

Una **Work Unit** es el único objetivo de desarrollo activo representado por
una rama corta. Puede contener muchas conversaciones, sesiones, agentes,
iteraciones y commits lógicos, pero conserva:

- un objetivo;
- una rama;
- un `ACTIVE_CHECKLIST`;
- un alcance y autoridad explícitos;
- un lifecycle de promoción.

No tiene que equivaler a un commit, una sesión, una conversación ni un PBI
pequeño.

## Relación transitoria con PBI, Sprint y roadmap

La Work Unit organiza **cómo se ejecuta** el trabajo; no decide **qué producto
se construye** ni cuándo está `Done`.

- Una feature de producto gobernada por roadmap sigue necesitando PBI `Ready`,
  selección y autorización Owner vigentes.
- Un PBI puede materializarse mediante una Work Unit o, si su alcance coherente
  lo exige, mediante varias Work Units autorizadas y trazables.
- Un bug, recovery, auditoría o cambio de governance puede ser una Work Unit sin
  crear un PBI nuevo cuando exista autorización explícita.
- Sprint, roadmap, PBI, DoD y ADR/DEC conservan su autoridad actual.
- La Work Unit no reduce los gates aceptados en DEC-051, DEC-063 ni
  `DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md`.
- Si aparece una contradicción material que esas fuentes no resuelven, se
  registra `OWNER DECISION REQUIRED` y se detiene sólo el paso afectado.

## Estados

| Estado | Significado |
|---|---|
| `IDLE` | No existe objetivo autorizado en ejecución. En `main`, se deriva cuando no hay una Work Unit abierta o el predicado del último registro ya se cumplió. |
| `ACTIVE` | Rama creada, alcance vigente y desarrollo/auditoría en curso. |
| `BLOCKED` | Existe un impedimento material explícito; conserva owner y condición de desbloqueo. |
| `READY_FOR_PROMOTION` | Implementación y evidencia local requeridas están completas; promoción todavía no ha terminado. |
| `PROMOTION` | PR, CI, review, merge o validación aplicable están en curso. |
| `CLOSED` | El predicado de cierre fue satisfecho por hechos verificables. No requiere un commit posterior de wording. |

`Done`, `Released`, `Accepted`, `Materialized` y `Formally Verified` conservan
la semántica de DEC-063. No son alias de estos estados operacionales.

## Lifecycle normal

```text
IDLE
  ↓ autorización
START WORK UNIT
  ↓
branch from current origin/main
  ↓
initialize ACTIVE_CHECKLIST
  ↓
audit / plan
  ↓
ACTIVE iterative development
  ↓
focused verification → logical commit → repeat
  ↓
READY_FOR_PROMOTION
  ↓
promotion verification
  ↓
PR → authoritative CI → risk-appropriate review
  ↓
authorized merge to main
  ↓
exact-main verification and environment validation when applicable
  ↓
CLOSED by its recorded predicate
  ↓
safe branch cleanup
  ↓
IDLE
```

Una etapa técnica verde no concede autoridad para la siguiente.

## Inicio

1. Verificar repositorio, rama, `HEAD`, `origin/main`, divergencia y working
   tree sin modificar trabajo ajeno.
2. Confirmar objetivo, alcance, exclusiones, riesgo, ambiente, datos y
   autoridad.
3. Crear una rama corta desde `origin/main` vigente.
4. Reemplazar el contenido operacional de `ACTIVE_CHECKLIST.md` con la nueva
   Work Unit.
5. Leer únicamente los contratos permanentes aplicables.

El checklist anterior no se copia automáticamente. Historia, decisiones y
evidencia única deben vivir en PBI, ADR/DEC, documentos permanentes, PR, CI o
Git. El historial Git preserva la evolución del checklist.

## Desarrollo iterativo

- Mantener `STATUS: ACTIVE` y actualizar Current, Next, blockers y progreso
  después de bloques significativos.
- Usar pruebas focalizadas durante iteración y commits lógicos tantas veces
  como sea útil.
- No duplicar en el checklist SHAs, resultados o inventarios disponibles de
  forma confiable en Git/GitHub, salvo que sean necesarios para un handoff o
  para fijar el predicado de cierre.
- Promover descubrimientos duraderos a su fuente autoritativa antes del
  candidato final.

## Promoción

Antes del PR:

1. cumplir criterios y plan de la Work Unit;
2. ejecutar los gates de promoción actualmente vigentes;
3. reconciliar documentación permanente afectada;
4. fijar `STATUS: READY_FOR_PROMOTION`;
5. registrar el **predicado de cierre** exacto;
6. declarar cualquier gate pendiente sin anticipar su resultado.

Al abrir el PR, cambiar el estado a `PROMOTION` cuando una actualización de la
rama sea necesaria por otros motivos. El PR y GitHub pasan a ser autoridad para
review, checks y merge; el checklist conserva contexto de handoff, no copia
cada evento remoto.

## Cierre sin closure-of-closure

No se cambia el checklist a `IDLE` antes del merge. En su lugar, el candidato
registra un predicado verificable, por ejemplo:

```text
PR autorizado merged
AND exact-main CI GREEN
AND deployment/validation requerido por el alcance PASS o N/A justificado
AND rama absorbida sin commits exclusivos
```

Cuando Git, GitHub y el ambiente aplicable demuestran ese predicado, la Work
Unit está `CLOSED` aunque el snapshot que aterrizó en `main` conserve
`READY_FOR_PROMOTION` o `PROMOTION`. Sobre `main`, un agente debe evaluar el
predicado antes de tratar el archivo como trabajo activo. Si ya se cumplió, el
estado operacional es `IDLE` y la siguiente Work Unit autorizada reemplaza el
checklist al crear su rama.

Este cierre derivado evita:

- declarar `IDLE` mientras el PR sigue abierto;
- un commit directo posterior al merge;
- un PR sólo para cambiar wording;
- automatización que reescriba `main` sin revisión.

Antes de promoción, las decisiones o descubrimientos únicos que deban vivir a
largo plazo se mueven a la fuente permanente apropiada. No se archiva el
checklist completo por defecto. Se crea un resumen bajo `docs/work/history/`
sólo cuando contiene contexto operacional no representado por PBI, PR, Git,
CI, ADR/DEC o documentación canónica.

## Ambientes

Estado actual:

- Local: materializado.
- Preview: materializado; despliegue manual y datos propios/sintéticos.
- Staging: no materializado.
- Production: no materializado ni autorizado.

El cierre usa únicamente el ambiente exigido por el alcance vigente. No se
presenta Preview como Staging.

Dirección futura, no materializada por este contrato:

```text
main → immutable artifact → Staging → validate → same artifact → Production
```

## Contrato mínimo de ACTIVE_CHECKLIST

El checklist debe incluir:

- Work Unit, tipo/riesgo si se conoce, rama, base SHA, status y actualización;
- Objective y Why;
- In Scope y Out of Scope;
- Applicable Contracts;
- Risks;
- Plan;
- Current, Next y Blockers;
- Important Discoveries;
- Focused Verification;
- Promotion Gates;
- Remote Actions / Authorization;
- Handoff Notes;
- Closure Predicate.

Su información debe ser suficiente para transferir la rama entre Codex,
Claude, GPT o una persona sin usar el chat como memoria.
