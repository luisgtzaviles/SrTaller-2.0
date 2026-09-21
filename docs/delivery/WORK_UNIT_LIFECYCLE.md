# Work Unit Lifecycle

## Estado del documento

- **Estado:** Contrato operacional de transición, materializado en Harness 2.0
  Iteration 3.
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

## Relación con PBI, Sprint y roadmap

La Work Unit organiza **cómo se ejecuta** el trabajo; no decide **qué producto
se construye** ni cuándo está `Done`.

- El trabajo de producto gobernado por roadmap normalmente usa PBI con alcance,
  criterios y autorización vigentes.
- Un PBI puede materializarse mediante una Work Unit o, si su alcance coherente
  lo exige, mediante varias Work Units autorizadas y trazables.
- Un bug, recovery, auditoría o cambio de governance puede ser una Work Unit sin
  crear un PBI nuevo cuando exista autorización explícita.
- El roadmap ordena prioridades y el PBI conserva requisito/historia. Sprint es
  un timebox/capacity construct opcional, no un gate universal de ingeniería.
- DoD y ADR/DEC conservan su autoridad temática.
- La Work Unit no reduce los gates aceptados en DEC-051, DEC-063 ni
  `DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md`.
- Si aparece una contradicción material que esas fuentes no resuelven, se
  registra `OWNER DECISION REQUIRED` y se detiene sólo el paso afectado.

## Estados

| Estado | Significado |
|---|---|
| `IDLE` | No existe objetivo autorizado en ejecución. En `main`, puede estar persistido explícitamente o derivarse de un ref Git de cierre válido para el último snapshot integrado. |
| `ACTIVE` | Rama creada, alcance vigente y desarrollo/auditoría en curso. |
| `BLOCKED` | Existe un impedimento material explícito; conserva owner y condición de desbloqueo. |
| `READY_FOR_PROMOTION` | Implementación y evidencia local requeridas están completas; promoción todavía no ha terminado. |
| `PROMOTION` | Algún hecho observable `PR_OPEN`, CI, review, merge o validación aplicable está en curso. GitHub/runtime son su autoridad. |
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
publish deterministic closure ref
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
  forma confiable en Git/GitHub/runtime. Puede enlazar la autoridad o fijar el
  predicado sin transcribirla.
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

El pipeline de PR ejecuta el checker en modo `PROMOTION`. Sólo permite
`READY_FOR_PROMOTION` o `PROMOTION` sobre la rama declarada; un snapshot
`ACTIVE` no puede convertirse en candidato integrable.

Al abrir el PR, GitHub pasa a ser autoridad de `PR_OPEN`, review, checks y
`MERGED`; el checklist conserva contexto de handoff, no copia cada evento
remoto. El estado puede representarse como `PROMOTION` cuando una actualización
de la rama ya sea necesaria por otros motivos, pero esa copia no es requisito.

## Cierre sin closure-of-closure

No se cambia el checklist a `IDLE` antes del merge. En su lugar, el candidato
registra un predicado verificable, por ejemplo:

```text
PR autorizado merged
AND exact-main CI GREEN
AND deployment/VALIDATED requerido por el alcance PASS o N/A justificado
AND rama absorbida sin commits exclusivos
```

Cuando Git, GitHub y el ambiente aplicable demuestran ese predicado, el comando
gobernado de cierre publica un **ref Git de cierre** determinista. Es un tag
anotado cuyo nombre se deriva del nombre, rama y base de la Work Unit y que
apunta al merge ordinario exacto. El comando falla cerrado salvo que:

- se ejecute en `main` limpio y sincronizado con `origin/main`;
- el `HEAD`, el remote-tracking ref y `refs/heads/main` consultado directamente
  en `origin` coincidan, para no aceptar un cache local obsoleto;
- el merge sea ordinario y contenga el snapshot de la rama candidata;
- la evidencia consultada sea un run `push` exitoso de
  `Authoritative Linux CI` para la rama `main` sobre ese `HEAD` exacto;
- `Authoritative promotion gate` sea exitoso; y
- el operador confirme que también evaluó el predicado completo, incluido el
  ambiente cuando aplique.

Sólo entonces `work-unit:check --mode MAIN` deriva estado efectivo `IDLE` del
snapshot `READY_FOR_PROMOTION` o `PROMOTION` aterrizado. El archivo conserva su
handoff veraz y Git conserva la transición; no se reescribe `main`. Si falta el
ref, el CI falla o la rama no fue integrada, el estado efectivo permanece
`PROMOTION` y el checker falla. La siguiente Work Unit sólo puede reemplazar el
checklist después de observar el mismo ref compartido.

Este cierre derivado evita:

- declarar `IDLE` mientras el PR sigue abierto;
- un commit directo posterior al merge;
- un PR sólo para cambiar wording;
- automatización que reescriba `main` sin revisión.

No se crean, mueven ni borran manualmente estos tags. El único flujo ordinario
es `work-unit:close` después del exact-main requerido; su publicación es parte
del cierre autorizado, no un release ni un deploy.

## Decisión de diseño de cierre

Se evaluaron las alternativas exigidas por la remediación del lifecycle:

| Opción | Resultado |
|---|---|
| A. Mantener en `main` una plantilla `IDLE` separada | Rechazada: el merge ordinario aterriza el archivo versionado de la rama; mantener dos contenidos exige magia de merge o una mutación posterior oculta. |
| B. Reescribir determinísticamente el archivo después del merge | Rechazada como flujo normal: crea un commit directo o un segundo PR de estado y altera historia después de review. |
| C. Separar snapshot persistido de estado efectivo | Seleccionada: la rama conserva un snapshot veraz de promoción y `main` deriva `IDLE` desde el merge, CI exacto y un ref Git compartido. |
| D. Inferir cierre sólo por ancestry o por texto | Rechazada: no prueba exact-main CI ni distingue un merge incompleto o fallido. |

La opción C es portable entre clones y agentes, compatible con Git/PR, no usa
estado oculto o sin commit y falla cerrado. Un merge fallido no crea el ref; un
CI fallido tampoco. El historial anterior permanece en Git/PR sin convertir
`ACTIVE_CHECKLIST` en ledger permanente.

Antes de promoción, las decisiones o descubrimientos únicos que deban vivir a
largo plazo se mueven a la fuente permanente apropiada. No se archiva el
checklist completo por defecto. Se crea un resumen bajo `docs/work/history/`
sólo cuando contiene contexto no derivable y no representado por PBI, PR, Git,
CI, runtime, ADR/DEC o documentación canónica.

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

## Contrato mecánico mínimo

Iteration 2 añade un bloque estable al inicio del checklist. La automatización
lee exclusivamente estas claves y los encabezados `##`; no intenta interpretar
la prosa operacional:

```text
<!-- WORK_UNIT_METADATA
work_unit: Nombre o identificador no vacío
iteration: Texto informativo de la iteración
type: Tipo informativo
risk: LOW | MEDIUM | HIGH | TRANSITIONAL | NORMAL | SENSITIVE | ARCHITECTURAL
shadow_risk: NORMAL | SENSITIVE | ARCHITECTURAL
branch: refs/heads compatible sin prefijo
base_sha: SHA Git completo de 40 caracteres
status: IDLE | ACTIVE | BLOCKED | READY_FOR_PROMOTION | PROMOTION | CLOSED
closure_mode: DERIVED
last_updated: YYYY-MM-DD
-->
```

`work_unit`, `branch`, `base_sha`, `status`, `risk` y `last_updated` son
obligatorios. El checker además exige todas las secciones del contrato mínimo,
comprueba que `base_sha` exista y sea ancestro de `HEAD`, y que la rama
registrada coincida con la rama activa.

En `main`, el modo explícito `MAIN` admite dos representaciones persistidas:

- `IDLE` con `branch: main`;
- el snapshot aterrizado de una rama con `closure_mode: DERIVED` y estado
  `READY_FOR_PROMOTION`, `PROMOTION` o `CLOSED`.

La primera pasa directamente. La segunda sólo pasa cuando el ref Git de cierre
correspondiente existe, apunta a un merge ordinario ancestro del `HEAD`, el
snapshot aterrizado coincide y uno de los padres integrados contiene ese mismo
snapshot. Sin esa prueba, `MAIN` devuelve `DERIVED_CLOSURE_UNPROVEN`.

Comandos locales:

- `./scripts/pnpm-governed run work-unit:check` valida sin red ni mutaciones;
- `./scripts/pnpm-governed run work-unit:check -- --mode PROMOTION` valida el
  estado integrable de una rama;
- `./scripts/pnpm-governed run work-unit:close -- --run-id <id> --confirm-predicate --push`
  consulta el exact-main CI y publica el ref compartido; y
- `./scripts/pnpm-governed run work-unit:start -- --name ... --branch ... --objective ...` escribe una
  estructura determinista sólo después de que una persona/agente haya creado y
  seleccionado explícitamente la rama correcta.

El inicializador nunca crea, cambia, elimina ni publica ramas. Rechaza `main`,
un árbol tracked sucio, un `HEAD` distinto de `origin/main`, una rama distinta
de la declarada y el reemplazo de una Work Unit `ACTIVE`/`BLOCKED`. Un snapshot
`READY_FOR_PROMOTION`/`PROMOTION` requiere la confirmación explícita
`--confirm-previous-closed` y un ref de cierre válido. La confirmación humana no
puede sustituir la prueba mecánica.

## Verificación focalizada en Iteration 3

No se crea todavía `verify:focused`. El repositorio no puede inferir de forma
segura la cobertura suficiente desde rutas modificadas, y un selector aparente
podría normalizar la omisión de pruebas. Durante desarrollo se ejecutan el
checker y pruebas focalizadas elegidas explícitamente. Promoción continúa bajo
los gates actuales completos; el futuro selector requiere datos de uso y una
decisión Owner separada.
