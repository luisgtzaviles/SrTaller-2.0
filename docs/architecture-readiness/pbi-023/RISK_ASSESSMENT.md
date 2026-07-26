# Evaluación de riesgo y checklist DEC-049

## Clasificación

- **Riesgo inherente:** alto.
- **Regla:** fail-closed; ambigüedad no reduce la clasificación.
- **Radio de impacto futuro:** toda persistencia tenant-scoped de R0.
- **Datos del spike:** exclusivamente sintéticos y destruidos.
- **Datos de la implementación futura:** dos tenants/sucursales sintéticos;
  ninguna PII ni dato real.
- **Irreversibilidad ejecutada:** ninguna.

La clasificación es alta porque un defecto puede producir acceso cross-tenant,
drift de schema, bloqueo de migración o corrupción transversal aun cuando el
schema inicial sea pequeño.

## Cambio actual

| Dimensión | Resultado |
|---|---|
| Runtime | migration runner/provider/capability internos; bootstrap y composición sin cambios |
| Persistencia | fixtures experimentales ejecutadas sólo en PostgreSQL efímero |
| Dependencias | tres directas exactas + trece transitivas revisadas |
| DB/SQL/migraciones | probes/journal técnicos destruidos; cero migración productiva |
| Reversibilidad | revertir el commit; cero estado externo residual |
| Seguridad | fail-closed, roles, namespaces, TLS y redaction; cero credenciales |
| Evidencia | unit/arquitectura, manifest, hashes y doble run PG 18.4 |

## Cambio futuro autorizado sólo tras gates

### Reversible

- instalar versiones exactas y revertir lockfile/manifest;
- agregar configuración tipada sin conectar;
- crear facility y adapters detrás de puertos;
- crear base efímera de test y descartarla;
- migración inicial sólo en base efímera;
- fixtures sintéticos;
- reglas de checker con mutaciones.

### Persistente o de alto impacto

- crear objetos en base compartida;
- aplicar una migración promovida;
- asignar privilegios a usuarios de aplicación/migración;
- aceptar un contrato de repositorio como base de otros módulos.

### Fuera de alcance por irreversibilidad

- datos reales o backfill;
- eliminación/transformación con pérdida;
- DDL no transaccional;
- RLS;
- proveedor productivo;
- operación cross-tenant;
- deploy/release.

## Riesgos

| ID | Riesgo | Probabilidad antes de evidencia | Impacto | Mitigación/gate |
|---|---|---:|---:|---|
| R23-01 | filtro tenant omitido | media | crítico | SPIKE-002, API obligatoria, negativos |
| R23-02 | branch de otro tenant | media | crítico | FK compuesta y contexto dual |
| R23-03 | query global reutilizable | media | crítico | no API ordinaria + checker |
| R23-04 | contexto contaminado por pool/concurrencia | media | crítico | objeto inmutable y tests concurrentes |
| R23-05 | migraciones concurrentes | baja/media | alto | advisory lock + job mutex + timeout |
| R23-06 | fallo parcial/drift | media | alto | transacción, journal, manifest y re-run |
| R23-07 | `down` destruye datos | media | alto | no asumir rollback; roll-forward |
| R23-08 | credencial app con DDL | media | alto | roles separados y mínimo privilegio |
| R23-09 | SQL/secretos en logs | baja/media | alto | DEC-044, redaction y pruebas |
| R23-10 | incompatibilidad de paquetes | baja/media | medio/alto | DEC050-C01 y baseline exacta |
| R23-11 | checker permite bypass | media | alto | fixture, mutación, doble run |
| R23-12 | cleanup borra base no test | baja | crítico | prefijo/marker/allowlist fail-closed |
| R23-13 | lifecycle local/CI diverge | media | medio | mismo PG 18.4, comandos y manifest |
| R23-14 | schema mínimo invade PBI-024 | baja/media | alto | sólo pertenencia; no runtime context |

## Checklist DEC-049

Los Pasos 4–10 materializaron el runtime acotado y el Paso 11 lo ejecutó en
PostgreSQL autoritativo. C01–C07 tienen evidencia material para el alcance
PBI-023 y pasan a ratificación de cierre; esto no afirma operación productiva,
deploy, provider de secretos ni privilegios compartidos.

| Condición | Aplicabilidad | Estado | Evidencia actual | Evidencia de cierre | Gate |
|---|---|---|---|---|---|
| DEC049-C01 — versiones exactas | directa | `Materially satisfied for PBI-023 scope` | paquetes/lock/config/runtime y CI PostgreSQL 18.4 exactos | ratificación formal | cierre PBI-023 |
| DEC049-C02 — owner/scope/invariantes | directa | `Materially satisfied for PBI-023 scope` | registry, constraints y adapters owner-scoped | ratificación formal | cierre PBI-023 |
| DEC049-C03 — constraints/aislamiento PG18 | directa | `Materially satisfied for PBI-023 scope` | schema + adapters + negativos en PG18 CI | ratificación formal | cierre PBI-023 |
| DEC049-C04 — pool/transacción/retry | directa | `Materially satisfied for PBI-023 scope` | misma conexión, commit/rollback/isolation/nesting y no retry implícito | ratificación formal | cierre PBI-023 |
| DEC049-C05 — acceso excepcional separado | preventiva | `Materially satisfied for PBI-023 scope` | checker impide API global/genérica y runtime no incorpora bypass | ratificación formal | cierre PBI-023 |
| DEC049-C06 — errores/logs | directa | `Materially satisfied for PBI-023 scope` | mappings, redacción, adapters y artifacts sanitizados | operación productiva futura | cierre PBI-023 |
| DEC049-C07 — enforcement | directa | `Materially satisfied for PBI-023 scope` | D5-R037–D5-R053, schema, adapters, CI doble y comparación | ratificación formal | cierre PBI-023 |
| DEC049-C08 — no RLS prematuro | trigger no activado | `Compliant by exclusion` | RLS excluido | nueva decisión + SPIKE-003 si se propone | antes de adoptar RLS |

## Tenant isolation

La defensa prevista combina:

1. contexto explícito e inmutable;
2. puertos que no aceptan scope opcional;
3. queries con tenant/branch en cada read/write;
4. constraints compuestas;
5. pool/transaction lifecycle;
6. static gates;
7. PostgreSQL real y casos negativos.

No se presenta ninguna barrera aislada como suficiente.

## Rollback y recuperación

- planificación: revertir el commit documental;
- dependencias: restaurar manifest/lock mediante Git y regenerar install;
- config futura: revertir el commit antes de consumidores;
- base efímera: cerrar pool y eliminar la base identificada;
- migración inicial test: reconstruir desde vacío;
- shared futuro: roll-forward y rollback de aplicación compatible;
- destructivo: bloqueado hasta backup/recovery y aprobación reforzada.

## Observabilidad futura

Registrar:

- commit, migration ID, ambiente alias y PostgreSQL version;
- operación estable, correlación, duración, categoría y severidad;
- tenant/branch sólo minimizados y necesarios;
- status/resultado y hash.

No registrar SQL, parámetros, URLs completas, secretos, stack público, PIN,
tokens, PII ni paths personales.

## Aprobaciones

| Momento | Aprobación |
|---|---|
| cerrar SPIKE-002 | Arquitectura + Seguridad + Calidad — evidencia PASS |
| instalar dependencias | Ingeniería + Arquitectura — Paso 4 PASS |
| crear facility/checker | Arquitectura + Ingeniería + Calidad |
| crear migración/objetos | owners de módulos + Arquitectura + Seguridad |
| PostgreSQL real/CI | Operaciones + Calidad |
| primer merge persistente | Arquitectura + Ingeniería + Seguridad + Operaciones + Calidad |
| cambio destructivo/no transaccional | Responsable del Proyecto + disciplinas afectadas |

## Acciones permitidas antes del siguiente gate

- revisar y versionar la evidencia del Paso 11;
- mantener el PR como Draft;
- preparar la revisión formal de cierre.

Este dictamen no autoriza PR Ready, merge, PBI-024, deploy ni operación
productiva.
