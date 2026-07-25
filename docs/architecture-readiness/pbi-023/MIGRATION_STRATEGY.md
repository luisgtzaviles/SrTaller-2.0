# Estrategia ejecutable de migraciones

## Autoridad

Este documento operacionaliza
[DEC-050](../../decisions/dec-050-migration-strategy/DECISION_PROPOSAL.md) sin
reemplazarla.

SPIKE-002 verificó materialmente el patrón de lifecycle, orden, journal,
transacción, lock, fallo, re-run, hashes y cleanup; véase la
[evidencia](spike-002-evidence/README.md). Los pasos siguen siendo normativos
para la futura migración productiva.

## Lifecycle

1. Registrar owner, scope e invariantes.
2. Crear un archivo con timestamp UTC y nombre determinista.
3. Implementar `up`; agregar `down` sólo si es seguro.
4. Revisar compatibilidad, locks, tenant y recuperación.
5. Aplicar en PostgreSQL `18.4` desde vacío.
6. Aplicar desde el estado inmediatamente anterior.
7. Ejecutar de nuevo; esperar cero pendientes.
8. Probar fallo y dos ejecutores concurrentes.
9. Ejecutar integración/aislamiento/cleanup.
10. Producir manifest SHA-256 y dos runs Linux.
11. Promover el mismo commit/artefacto mediante runner explícito.
12. Verificar status y resultados por ambiente.

## Naming

`YYYYMMDDHHMMSS_<owner>_<verbo>_<objeto>.ts`

Reglas:

- UTC, 14 dígitos;
- minúsculas ASCII y `snake_case`;
- owner del registry, no nombre de persona;
- verbo/objeto descriptivos;
- prefijo único;
- orden lexicográfico estricto;
- archivo aplicado inmutable.

## Semántica

- `up`: lleva exactamente del estado anterior al siguiente.
- `down`: sólo revierte sin pérdida la unidad inmediata y sólo cuando existe
  prueba.
- no hay `down` ficticio para borrado de datos;
- no hay imports a modelos/repositorios actuales;
- no hay queries ad hoc fuera del archivo;
- no hay migraciones fuera del runner.

## Transacción y lock

- transacciones de Kysely habilitadas;
- DDL no transaccional prohibido en la primera fundación;
- advisory lock del dialecto PostgreSQL;
- un solo job mutante por ambiente;
- timeout externo menor que el lock timeout interno;
- fallo de lock no cambia estado;
- el runner inspecciona todo `MigrationResultSet`.

## Journal y checksum

- journal default de Kysely;
- strict order;
- status antes/después;
- manifest externo con SHA-256 de archivos y artefacto;
- Git commit exacto como fuente de contenido;
- mutación de archivo aplicado falla el gate de drift.

No se afirma que Kysely almacene checksum de contenido.

## Idempotencia

Una migración se aplica una vez según journal. El segundo `latest` no hace
trabajo. Los backfills futuros deben tener su propia idempotencia/checkpoint;
esa decisión no entra en PBI-023.

## Fallos

- detener secuencia;
- hacer rollback de la unidad transaccional;
- cerrar conexión;
- conservar journal coherente;
- traducir y sanitizar error;
- no reintentar statement;
- diagnosticar antes de reiniciar la operación completa;
- comprobar status y datos antes de reejecutar.

## Recuperación

| Ambiente/caso | Estrategia |
|---|---|
| local/test, `down` seguro | revertir y volver a aplicar |
| CI | descartar base efímera y reconstruir desde cero |
| shared/staging | roll-forward; rollback de app si es compatible |
| production futura | runbook, backup validado, roll-forward preferido |
| destructivo/no transaccional | fuera de PBI-023; autorización reforzada |

## Promoción

La migración nunca ocurre durante build/start. El mismo commit y hashes pasan
local → CI → staging → production futura. Cada ambiente usa su identidad y
configuración, no un archivo regenerado.

## Reviews

| Tema | Revisor |
|---|---|
| objeto e invariantes | owner de módulo + Arquitectura |
| query/transaction | Ingeniería |
| tenant/branch/secretos | Seguridad |
| lock, promoción y recovery | Operaciones |
| pruebas y manifest | Calidad |
| destructivo/no transaccional | Responsable del Proyecto + disciplinas |

## Gate de la primera migración

SPIKE-002 está cerrado. La primera migración todavía no se crea hasta que
DEC050-C01/C02/C09, DEC063-C02/C05/C06 y los triggers DEC-051 aplicables
tengan mecanismo y evidencia productivos.
