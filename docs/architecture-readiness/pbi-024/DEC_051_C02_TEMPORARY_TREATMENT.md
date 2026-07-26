# Tratamiento temporal de DEC051-C02 para PBI-024

## Estado y dictamen

- **Resultado:** `PASS — DEC-051 C02 TEMPORARY GOVERNANCE TREATMENT APPROVED`.
- **Fecha:** 2026-07-26.
- **Estado del tratamiento:** activo únicamente para refinamiento y revisión
  formal de PBI-024.
- **DEC051-C02 canónico:** `Pending — external platform enforcement
  unavailable`.
- **Evaluación material:** `Partially satisfied`.
- **PBI-024:** `Draft — refinement authorized; implementation not authorized`.

Este tratamiento no satisface, elimina, rebaja ni modifica DEC051-C02. Tampoco
es un waiver del gate de merge: conserva íntegro su trigger antes del primer
merge funcional posterior a PBI-023.

## Autoridad

La autoridad decisora es el **Responsable del Proyecto**, ejerciendo las
funciones de Arquitectura y Operaciones que son owners de DEC051-C02. Esta
autoridad ya está registrada en
[DEC-051](../../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md) y
en la [autorización de R0](../R0_AUTHORIZATION.md).

Producto no necesita emitir una aprobación separada para este tratamiento
porque no cambia alcance, riesgo aceptado, costo, release ni criterio de
aceptación. Seguridad y Calidad conservan sus funciones de revisión en el
futuro expediente de PBI-024. Una autorización de implementación requerirá un
dictamen posterior y separado.

## Fuentes y evidencia

- [DEC-051](../../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md)
  fija C02, sus owners, su evidencia y el trigger previo al primer merge
  funcional.
- La
  [aplicabilidad de DEC-051](../pbi-023/DEC_051_APPLICABILITY.md)
  registra C02 como materialmente `Partially satisfied` y canónicamente
  `Pending`.
- El
  [expediente post-merge de PBI-023](../pbi-023/post-merge/README.md)
  demuestra merge real, aprobación independiente, CI post-merge, PostgreSQL
  `18.4`, artifacts y ausencia de regresión.
- [DEC-063](../../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md)
  exige que estados, autoridad, riesgo, excepciones y gates permanezcan
  explícitos.
- [PBI-024](../../backlog/pbis/PBI-024.md) permanece `Draft`, no iniciado y
  sin autorización de implementación.

La inspección remota disponible confirmó que `main` no está protegida. Las
consultas de branch protection y rulesets devolvieron HTTP `403` con la
limitación de plan del repositorio privado actual. Esa respuesta demuestra
indisponibilidad del enforcement, no cumplimiento del gate.

## Problema

La evidencia lograda para C02 cubre:

- primer merge real a `main`;
- aprobación independiente sobre el head integrado;
- CI autoritativa post-merge;
- `VC-024 run-1`, `run-2` y `comparison`;
- PostgreSQL `18.4`, artifacts y trazabilidad;
- ausencia de regresión observada.

Continúa faltando:

- protección efectiva de `main`;
- PR y aprobación obligatorios impuestos por GitHub;
- checks requeridos y stale approval enforcement;
- rechazo verificable de un push o merge incumplido.

La ausencia de estas capacidades no autoriza a fingir protección, pero tampoco
convierte el refinamiento documental y la revisión de un PBI en un merge
funcional.

## Impacto exacto de C02

| Actividad | ¿C02 la bloquea por sí sola? | Estado bajo este tratamiento |
| --- | --- | --- |
| Refinar PBI-024 | No | Permitido |
| Realizar revisión formal de PBI-024 | No | Permitido |
| Decidir posteriormente si se autoriza implementación | No | Permitido como decisión separada |
| Programar localmente o en rama | No por sí sola; requiere autorización del PBI | No autorizado por este tratamiento |
| Crear commits funcionales | No por sí sola; requiere autorización del PBI | No autorizado por este tratamiento |
| Abrir un PR funcional | No es el trigger de C02; requiere autorización expresa | No autorizado por este tratamiento |
| Integrar el primer merge funcional | Sí | Bloqueado |
| Release o producción | C02 no es el único gate, pero su incumplimiento impide una integración gobernada | Bloqueados |

PBI-024 puede recibir en el futuro una autorización limitada para trabajo
local o en rama, pero esa decisión deberá mantener explícitamente bloqueado el
merge funcional mientras C02 siga `Pending`.

## Alternativas evaluadas

| Alternativa | Proporcionalidad y costo | Seguridad | Roadmap y MVP | Reversibilidad | Decisión |
| --- | --- | --- | --- | --- | --- |
| A. Comprar GitHub Pro ahora | Costo externo inmediato para un único gate | Permitiría enforcement real | Puede cerrar C02, sin valor funcional directo | Reversible por plan | No seleccionada en esta tarea |
| B. Hacer público el repositorio | Desproporcionado para obtener una capacidad | Amplía exposición y cambia el riesgo | No aporta valor de producto | Revertible, con exposición ya ocurrida | Rechazada |
| C. Modificar definitivamente DEC-051 C02 | Requiere reabrir contrato aceptado | Puede debilitar el gate | Desbloquea merge, pero cambia gobierno | Requiere nueva decisión formal | Diferida |
| D. Mantener C02 `Pending` y permitir refinamiento/revisión | Bajo costo y alcance mínimo | Conserva el bloqueo de merge | Permite preparar PBI-024 sin fingir cumplimiento | Totalmente reversible | **Seleccionada** |
| E. Congelar toda actividad | Evita cualquier riesgo de integración | No mejora el control existente | Retrasa R0 y el MVP innecesariamente | Reversible | Rechazada |

La opción D es proporcional porque preserva el contrato y la seguridad del
merge, a la vez que habilita exclusivamente trabajo intelectual y documental.

## Decisión normativa

1. DEC051-C02 permanece canónicamente `Pending`.
2. Su evaluación material permanece `Partially satisfied`.
3. La deuda externa queda visible como
   `external platform enforcement unavailable`.
4. Se permite refinar y revisar formalmente PBI-024.
5. PBI-024 no queda `Ready`, `In progress` ni autorizado para implementación.
6. Antes del primer merge funcional posterior a PBI-023 debe ocurrir una de
   estas condiciones:
   - DEC051-C02 queda `Satisfied` mediante protección efectiva y prueba de
     rechazo verificable; o
   - el contrato de DEC-051 se modifica mediante una decisión formal separada
     de la autoridad competente.
7. Mientras ninguna condición ocurra, una futura autorización puede permitir
   trabajo local o en rama, pero no integración funcional a `main`.
8. Este tratamiento no se hereda por PBI-025–PBI-029, R1, release o
   producción.

## Actividades permitidas

- completar alcance y exclusiones de PBI-024;
- clasificar su riesgo;
- definir criterios de aceptación;
- preparar matrices allow/deny;
- preparar lifecycle y plan de pruebas;
- definir evidencia esperada y gates;
- estimar el trabajo;
- realizar revisión formal;
- emitir posteriormente una decisión separada de autorización o rechazo.

## Actividades no autorizadas

- iniciar implementación de PBI-024;
- crear commits o PR funcionales;
- mergear código funcional;
- omitir, rebajar o marcar C02 como satisfecha;
- iniciar PBI-025–PBI-029;
- ampliar R0;
- abrir R1 o implementar Reparaciones;
- crear release, deploy o cambio productivo;
- cambiar planes, visibilidad o configuración de GitHub.

## Vigencia, revisión y cierre

El tratamiento comienza con la publicación del commit documental que contiene
este expediente y expira automáticamente cuando ocurra el primero de estos
eventos:

1. se emita el dictamen separado de autorización o rechazo de PBI-024;
2. DEC051-C02 quede `Satisfied`; o
3. DEC-051 sea modificada formalmente.

Antes de autorizar implementación, crear una rama o PR funcional, o extender
este tratamiento, debe revisarse de nuevo el estado de C02. La expiración no
otorga permisos implícitos. Cualquier tratamiento para PBI-025–PBI-029
requiere su propio expediente.

## Riesgos y compensaciones

| Riesgo | Compensación |
| --- | --- |
| Confundir refinamiento con autorización | Estado `Draft` y prohibiciones repetidas en PBI-024 y R0 |
| Integrar sin enforcement remoto | Merge funcional explícitamente bloqueado |
| Deuda indefinida | Expiración por evento y revisión obligatoria antes de autorización |
| Herencia silenciosa | Alcance limitado a PBI-024 |
| Falsa afirmación de protección | Estado canónico `Pending` y limitación externa registradas |

## Trazabilidad y siguiente acción

Este expediente complementa DEC-051 y R0 sin alterar su historia. No reemplaza
la evidencia de PBI-023 ni materializa DEC063-C08 porque no exceptúa el gate de
merge: sólo gobierna actividades anteriores a su trigger.

La siguiente acción autorizada es:

**Refinar PBI-024, completar sus gates y someterlo a revisión formal para
decidir su autorización de implementación.**
