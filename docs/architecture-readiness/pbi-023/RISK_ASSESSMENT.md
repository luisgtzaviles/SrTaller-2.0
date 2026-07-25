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
| Runtime | contrato puro agregado; bootstrap y composición sin cambios |
| Persistencia | configuración tipada; cero conexión/DB/SQL |
| Dependencias | tres directas exactas + trece transitivas revisadas |
| DB/SQL/migraciones | sin ejecución ni cambios |
| Reversibilidad | revertir el commit; no existe estado externo |
| Seguridad | fail-closed, roles, namespaces, TLS y redaction; cero credenciales |
| Evidencia | tests unitarios/arquitectura, manifest, hashes y doble run |

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

Ninguna condición que requiera runtime productivo se marca satisfecha.
SPIKE-002 aporta evidencia del patrón; el Paso 4 materializa selección/lock y
aporta evidencia parcial de C01.

| Condición | Aplicabilidad | Estado | Evidencia actual | Evidencia de cierre | Gate |
|---|---|---|---|---|---|
| DEC049-C01 — versiones exactas | directa | `Partial — package and typed config materialized` | paquetes/lock exactos, configuración, frozen installs y gates | conexión runtime + PostgreSQL CI cuando se activen | antes de integrar persistencia |
| DEC049-C02 — owner/scope/invariantes | directa | `Partial — registry enforced` | registry machine-readable + D5-R041/R044/R047 | constraints/adapters materializados + review | antes de tabla/migración/repo |
| DEC049-C03 — constraints/aislamiento PG18 | directa | `Pending — implementation` | SPIKE-002 E6–E10 PASS en PG18 | suite productiva PG18 | antes de aceptar persistencia |
| DEC049-C04 — pool/transacción/retry | directa | `Pending` | patrón de pool/rollback/concurrencia verificado | misma conexión, commit/rollback/lifecycle productivo | antes del merge persistente |
| DEC049-C05 — acceso excepcional separado | preventiva | `Partial — preventive enforcement` | D5-R038/D5-R039 rechazan API global/genérica; no registry admin | runtime conserva ausencia de bypass | antes de cualquier bypass |
| DEC049-C06 — errores/logs | directa | `Partial — config errors/redaction PASS` | errores de config y vista segura probados | traducción pg/operaciones runtime | antes del merge persistente |
| DEC049-C07 — enforcement | directa | `Partial — checker PASS` | D5-R037–D5-R047, config pura registrada, fixtures y 11 mutaciones | suite PostgreSQL/product runtime | antes del merge persistente |
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

- revisar y versionar configuración/evidencia;
- mantener el PR como Draft;
- preparar autorización estricta del Paso 6.

Este cierre no autoriza conexión, migraciones productivas, tablas productivas
ni cambios de workflow.
