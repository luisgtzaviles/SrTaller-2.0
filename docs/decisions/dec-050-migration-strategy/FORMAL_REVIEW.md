# Revisión formal de DEC-050

## Estado de la revisión

- **Fecha:** 2026-07-24.
- **Alcance:** contrato documental de migraciones para PBI-023.
- **Decisión revisada:** [DEC-050](DECISION_PROPOSAL.md).
- **Resultado:** `PASS WITH CONDITIONS`.
- **Estado autorizado:** `Accepted with conditions`.
- **Materialización verificada:** no.
- **Cambio técnico:** ninguno.

## 1. Método

La revisión contrastó la propuesta con:

- ADR-003/004 y DEC-004/005/044/049/051/063;
- la política de migraciones y el ownership vigente;
- metadata autoritativa de paquetes consultada el 2026-07-24;
- documentación y código fuente oficial de Kysely `0.29.4`;
- documentación oficial de node-postgres;
- documentación oficial de PostgreSQL 18 sobre locks y retries.

No se instalaron dependencias, no se inició PostgreSQL y no se ejecutó una
migración. Por ello la revisión decide el contrato, no acredita su
materialización.

## 2. Fuentes primarias

| Fuente | Versión/fecha observada | Conclusión |
|---|---|---|
| [Kysely migrations](https://www.kysely.dev/docs/migrations) | consulta 2026-07-24 | `Migrator`, `FileMigrationProvider`, orden e inmutabilidad |
| [Kysely v0.29.4](https://github.com/kysely-org/kysely/tree/v0.29.4) | tag `v0.29.4` | ESM, Node `>=22`, transacción y advisory lock PostgreSQL |
| [node-postgres](https://node-postgres.com/) | `pg` `8.22.0`, consulta 2026-07-24 | ESM, pool y misma conexión por transacción |
| [PostgreSQL advisory locks](https://www.postgresql.org/docs/18/explicit-locking.html#ADVISORY-LOCKS) | PostgreSQL 18 | semántica de locks de sesión/transacción |
| [PostgreSQL transaction retry](https://www.postgresql.org/docs/18/mvcc-serialization-failure-handling.html) | PostgreSQL 18 | `40001`/`40P01` requieren reintentar transacción completa |
| metadata npm autoritativa | 2026-07-24 | `kysely@0.29.4`, `pg@8.22.0`, `@types/pg@8.20.0` candidatos |

## 3. Comparativa

| Criterio | Core Kysely | CLI adicional | Runner SQL propio |
|---|---|---|---|
| Encaje con DEC-049 | alto | medio | bajo |
| Dependencias nuevas | sólo las ya previstas | agrega CLI | agrega código/contrato propio |
| Orden y journal | incluido | incluido/indirecto | por construir |
| Lock PostgreSQL | incluido por dialecto | depende del wrapper | por construir |
| ESM/NodeNext | directo | por verificar aparte | depende de implementación |
| Drift de contenido | requiere manifest | depende de herramienta | podría incluirse, con más costo |
| Simplicidad R0 | alta | media | baja |

## 4. Dictámenes por disciplina

### Arquitectura

`PASS WITH CONDITIONS`. El migrador core respeta la separación de
infraestructura raíz y ownership por módulo. La futura materialización debe
extender el checker con fixtures y mutaciones; no puede abrir imports globales
ni un repositorio genérico.

### Ingeniería

`PASS WITH CONDITIONS`. Las versiones candidatas son coherentes por metadata y
fuente oficial. DEC050-C01/C03/C04/C07 exigen confirmación ejecutable antes del
primer merge persistente.

### Seguridad

`PASS WITH CONDITIONS`. El contrato separa identidades, evita logs sensibles y
exige constraints tenant-scoped. La evidencia negativa de SPIKE-002 y
DEC063-C06 sigue pendiente.

### Operaciones

`PASS WITH CONDITIONS`. La migración no ocurre al arrancar, usa exclusión
mutua y se promueve por commit. Backup, recovery, ambiente compartido y cambios
no transaccionales permanecen fuera del primer slice.

### Calidad

`PASS WITH CONDITIONS`. Se definieron pruebas desde vacío/anterior,
concurrencia, fallo, cleanup y doble run Linux. Ninguna ha sido ejecutada en
este expediente.

## 5. Compatibilidad

| Decisión | Resultado |
|---|---|
| DEC-004 | compatible con Node `24.18.0`, TS `6.0.3`, ESM/NodeNext y scripts explícitos |
| DEC-005 | migrador en infraestructura raíz; owners de objetos permanecen modulares |
| DEC-044 | errores de driver se traducen y evidencia se sanitiza |
| DEC-049 | Kysely/`pg`, ownership, scope y transacción de misma conexión preservados |
| DEC-051 | PostgreSQL real, gates por riesgo y evidencia Linux definidos |
| DEC-063 | riesgo, checklist persistente y seguridad quedan trazados por condición |
| ADR-003 | PostgreSQL `18.4`, migraciones incrementales y recuperación |
| ADR-004 | `tenant_id`, claves compuestas y pruebas negativas; sin afirmar RLS |

No se encontró contradicción normativa.

## 6. Condiciones bloqueantes

- **Antes de instalar:** DEC050-C01.
- **Antes de crear la primera migración:** DEC050-C02/C09 y SPIKE-002 cerrado.
- **Antes del primer merge persistente:** DEC050-C03/C04/C07,
  DEC051-C02/C03/C04/C06 y DEC063-C02/C05/C06.
- **Antes de ambiente compartido:** DEC050-C05/C06/C08.
- **Antes de cambio destructivo o no transaccional:** DEC050-C10 y nueva
  autorización.

## 7. Autoridad y dictamen

El Responsable del Proyecto acepta el contrato con las condiciones enumeradas.
La evidencia primaria es suficiente para seleccionar la estrategia; no es
suficiente para declarar sus condiciones materializadas.

**Dictamen final:** `PASS WITH CONDITIONS — DEC-050 ACCEPTED; MATERIALIZATION
PENDING`.
