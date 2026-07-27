# Aplicabilidad de DEC-051

## Estado de entrada

- DEC-051: `Accepted`.
- C01/C07/C09: `Satisfied` por la evidencia autoritativa previa.
- C02: canónicamente `Pending — external platform enforcement unavailable`;
  materialmente `Partially satisfied`.
- La autorización independiente permitió implementación en rama; no permite
  merge.
- PBI-024: riesgo alto por contexto, station y persistencia.

## Matriz

| Condición | Trigger | Aplicabilidad | Estado para PBI-024 | Evidencia requerida |
| --- | --- | --- | --- | --- |
| C01 | primer merge funcional | directa | baseline disponible; re-run requerido | workflow y jobs del SHA |
| C02 | antes del primer merge funcional | directa/bloqueante | `Pending` | protección efectiva + prueba de rechazo, o decisión formal separada |
| C03 | persistencia | directa | baseline PBI-023 disponible; reejecución requerida | PostgreSQL 18.4, lifecycle, cleanup |
| C04 | contexto/persistencia/acceso | directa | PASS material para PBI-024 | AD-01–AD-20 con subcasos, dos tenants, mutaciones |
| C05 | primera API funcional | parcial | no se cierra; PBI-024 no crea API | mapping interno y sanitización solamente |
| C06 | persistencia funcional | directa | PASS material para PBI-024 | ownership, transaction, constraints, rollback |
| C07 | VC-024 | no reabre | `Satisfied` histórico | preservar pipeline |
| C08 | primera cuarentena/retry diagnóstico | no activada | `Pending` | sólo si existe cuarentena |
| C09 | cambio checker/regla | directa si se modifica | `Satisfied` histórico + evidencia nueva | valid/negative/mutation/double run |
| C10 | bypass administrativo | no activada | `Pending` | no se permite bypass |

## C02

El [tratamiento temporal](DEC_051_C02_TEMPORARY_TREATMENT.md) no es waiver.
Permite completar este expediente y una revisión independiente. Una eventual
autorización puede permitir trabajo local o en rama, pero el primer merge
funcional continúa prohibido mientras:

- C02 no quede `Satisfied`; y
- DEC-051 no haya sido modificada por una decisión formal separada.

La revisión formal debe consultar otra vez el estado remoto y registrar el
resultado. No puede inferir protección desde un PR verde.

## C04 — aislamiento

La implementación debe demostrar:

- contexto ausente/conflictivo/manipulado fail-closed;
- dos tenants y dos branches;
- station desconocida/unlinked/revoked;
- branch/tenant mismatch;
- payload no autoritativo;
- relink/revision stale;
- resolve/revoke concurrentes;
- ambos órdenes de adquisición del station row lock;
- anti-enumeración;
- mutations del filtro tenant, contrato de elegibilidad, cierre de binding,
  atomicidad de revoke y deny.

Una suite positiva no satisface C04.

## C05 — errores

PBI-024 materializaría códigos internos, mapping de persistencia y resultados
de aplicación. Como no crea API, no puede declarar completa la automatización
del envelope HTTP, logs exteriores o primera API. Sus pruebas se conservan como
evidencia parcial y PBI-025/primer borde funcional deberá completar el trigger.

## C06 — persistencia

Aplica a:

- owner único de `stations` y `station_bindings`;
- ports/adapters explícitos;
- Kysely sólo en infraestructura;
- tenant/branch scope;
- misma conexión transaccional;
- CAS/revision;
- FK/unique/check;
- rollback y mapping DEC-044.

## CI requerido

Los runs remediados `run-1` y `run-2` ejecutaron desde checkout limpio:

- frozen install;
- architecture;
- typecheck/build;
- pruebas;
- PostgreSQL real;
- mutaciones críticas;
- smoke;
- cleanup;
- manifest/artifacts.

`comparison` demostró igualdad semántica en push `30239752229` y
pull_request `30239754842`. No hubo retry interno para fabricar verde ni skips
críticos. Ambos eventos ejecutaron PostgreSQL real, parser/harness negativo y
25 mutaciones con correlación estructurada. El expected test incorrecto fue
rechazado como `UNRELATED_TEST_FAILURE`.

## Dictamen de aplicabilidad

La implementación aportó evidencia material para C04/C06 y preserva C02
canónicamente `Pending`. La siguiente revisión independiente debe validar el
SHA, artifacts y expediente; no puede autorizar merge mientras C02 siga
pendiente.
