# Aplicabilidad de DEC-051

## Estado de entrada

- C01, C07 y C09: `Satisfied`.
- C02–C06, C08 y C10: `Pending` según trigger.

Este expediente no modifica esos estados. SPIKE-002 aporta evidencia
preparatoria y el Paso 4 demuestra frozen install/checker/tests para el primer
cambio técnico. El Paso 5 agrega unit/contract/architecture tests de config;
ninguno constituye cumplimiento PostgreSQL runtime.

## Matriz

| Condición | Trigger para PBI-023 | Aplicabilidad | Estado | Mecanismo verificable | Evidencia futura | Responsable/gate |
|---|---|---|---|---|---|---|
| C02 — protección de `main` | antes del primer merge funcional | directa | `Pending` | requerir checks CI sin bypass ordinario | configuración exportable/captura segura y PR rechazado sin checks | Operaciones + Arquitectura / merge |
| C03 — PostgreSQL real | primera suite persistence | directa | `Partial — local PostgreSQL PASS / product CI Pending` | servicio efímero PG `18.4`, base por run, cleanup | connection y transaction suites locales; falta job productivo | Ingeniería + Operaciones / antes del merge |
| C04 — aislamiento negativo | primera persistencia tenant | directa | `Pending — product suite` | matriz dos tenants/branches y mutaciones | E6–E10 del spike PASS; faltan ISO productivos | Seguridad + Calidad / merge |
| C05 — API pública/errores | antes de API funcional | no activada | `Pending` | PBI-023 no crea API; sí prueba traducción interna DEC-044 | contrato HTTP se difiere; errores persistence se prueban | Ingeniería + Seguridad + Calidad / PBI futuro |
| C06 — ownership/persistencia | primera persistencia | directa | `Partial — static/transaction enforcement PASS` | registry, checker, constraints, transaction runner | D5-R037–D5-R048 y runner cierran frontera; faltan constraints/adapters | Arquitectura + Ingeniería + Calidad / merge |
| C08 — flakiness/quarantine | antes de retry/cuarentena | no activada | `Pending` | no retries de test ni quarantine | registro sólo si aparece un caso real | Calidad + Operaciones |
| C10 — bypass/emergency | antes de habilitar bypass | no activada | `Pending` | no bypass ni excepción | policy/expiración/restauración sólo si se propone | Operaciones + Seguridad + Arquitectura |

## C02 — mecanismo exacto

Antes del primer merge persistente:

1. `main` debe exigir los checks actuales `VC-024 run-1`, `VC-024 run-2` y
   `VC-024 comparison`;
2. el futuro job PostgreSQL de PBI-023 debe ser requerido cuando exista;
3. branch protection debe impedir merge mientras un check esté pendiente,
   fallido o ausente;
4. no se autoriza push directo ni bypass ordinario;
5. la evidencia debe identificar regla, checks requeridos, commit y una prueba
   controlada de rechazo;
6. cualquier escape hatch permanece bajo C10 y no se crea en PBI-023.

Esta tarea no modifica configuración remota.

## C03 — persistencia real

- PostgreSQL `18.4` exacto.
- Linux `ubuntu-24.04`.
- base aislada por run/worker.
- credencial sintética efímera.
- migración desde vacío y estado anterior.
- cleanup en éxito/fallo.
- timeout y lifecycle visibles.
- ninguna dependencia de mocks/SQLite para comportamiento crítico.

## C04 — negativos

Se usa
[TENANT_ISOLATION_TEST_PLAN.md](TENANT_ISOLATION_TEST_PLAN.md). C04 no cierra
con tests estáticos ni con el probe solamente. SPIKE-002 retiró el bloqueo de
viabilidad; la suite productiva sigue pendiente.

## C05 — alcance preciso

No se crea controller, endpoint, DTO ni respuesta HTTP. Por tanto el trigger de
API no está activado. PBI-023 sí debe probar que errores `pg` no escapan del
adapter y que logs están sanitizados; esto satisface su parte DEC-044/049, no
la futura condición HTTP completa.

## C06 — boundaries

El checker vigente ya verifica:

- paquetes Kysely/pg sólo en infraestructura;
- puertos hacia adentro;
- adapters dentro del módulo owner;
- facility raíz exacta y revisada;
- no repositorio genérico ni raw SQL fuera del owner;
- caso válido, negativos, mutaciones y doble run.

La misma conexión por transacción y su boundary están verificadas. Siguen
pendientes adapters owner-scoped, constraints reales y aislamiento tenant.

## Protección del Paso 4

Las versiones exactas pasaron dos instalaciones limpias frozen y tres ciclos
de architecture, typecheck, build, tests, verify y smoke. El workflow no se
modificó y el PR permanece Draft. C03/C04 no se marcan satisfechas: todavía no
existe suite PostgreSQL productiva ni aislamiento runtime.

## Dictamen

DEC-051 está completamente trazada. SPIKE-002 confirmó estrategia,
testabilidad y PostgreSQL real para C03/C04/C06, sin satisfacer sus triggers
productivos. El Paso 4 agrega evidencia de reproducibilidad del paquete, sin
cambiar esos estados. C03/C04 y la parte runtime de C06 bloquean el primer
merge persistente; C02 bloquea
cualquier primer merge funcional. C05, C08 y C10 no se activaron.

## Evidencia del Paso 5

La [configuración tipada](typed-configuration/TEST_MATRIX.md) prueba
validación, sanitización, inmutabilidad, no red y boundaries. Esto amplía la
evidencia estática de C06/C09 sin satisfacer C03/C04 ni la traducción de
errores de driver de C05. No se agregó job ni se cambió branch protection.

## Evidencia del Paso 6

La [facility de conexión](connection-facility/POSTGRESQL_TEST_MATRIX.md)
ejecutó dos instancias efímeras PostgreSQL `18.4` con auth negativa, base
inexistente, timeout, SSL, pool, concurrencia, cierre y cleanup `PASS`.
DEC051-C05 gana evidencia para errores de conexión y C06 para boundaries, pero
no se satisfacen por completo: faltan API/adapters, transaction runner,
constraints e isolation. DEC051-C03 permanece `Pending` porque el workflow
productivo aún no ejecuta PostgreSQL.

## Evidencia del Paso 7

El [transaction runner](transaction-runner/RESULTS.md) verifica commit,
rollback, cuatro niveles de aislamiento, read-only, `40001`, `40P01`, `57014`,
errores sanitizados, concurrencia y cleanup en PostgreSQL `18.4`. D5-R048
refuerza C06. C03 mejora a evidencia local parcial, pero no queda satisfecha
mientras la CI autoritativa mantenga el test PostgreSQL como gated skip. C04
permanece pendiente porque `transaction_probe` no representa tenant/branch.
