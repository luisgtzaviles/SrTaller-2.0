# DEC-050 — Estrategia de migraciones y versionado de persistencia

## Estado

- **Decisión:** `Accepted with conditions`.
- **Fecha:** 2026-07-24.
- **Autoridad:** Responsable del Proyecto, mediante el mandato documental de
  preparación de PBI-023.
- **Materialización:** no iniciada.
- **Implementación autorizada por esta decisión:** ninguna.
- **Condiciones:** DEC050-C01 a DEC050-C10 permanecen `Pending`.
- **PBI:** [PBI-023](../../backlog/pbis/PBI-023.md).
- **Expediente:** [PBI-023 / DEC-050](../../architecture-readiness/pbi-023/DEC_050_REVIEW.md).

## 1. Contexto

ADR-003 seleccionó PostgreSQL `18.x`; DEC-004 fijó Node.js `24.18.0`,
TypeScript `6.0.3`, ESM/NodeNext y pnpm `11.15.1`; DEC-049 seleccionó Kysely
con el driver oficial `pg` y reservó a DEC-050 el lifecycle de migraciones.
DEC-051 exige PostgreSQL real y gates reproducibles. DEC-063 exige un
checklist de persistencia y recuperación antes del primer cambio persistente.

PBI-023 necesita una estrategia única antes de instalar paquetes, crear
migraciones o alterar una base. Esta decisión define el contrato; no crea
runtime, SQL, tablas ni credenciales.

## 2. Problema

Sin un contrato común, dos implementaciones válidas individualmente podrían:

- ordenar o ejecutar migraciones de manera distinta;
- correr en paralelo y competir por el mismo esquema;
- modificar archivos ya aplicados sin detectar drift;
- mezclar credenciales de aplicación y migración;
- ejecutar cambios implícitos al iniciar la aplicación;
- presentar un `down` como recuperación segura aunque destruya datos;
- exponer SQL, URLs o secretos en evidencia;
- crear constraints que no preserven tenant y sucursal.

## 3. Drivers

1. PostgreSQL `18.4` real y comportamiento transaccional real.
2. Compatibilidad con Kysely, `pg`, Node.js 24, TypeScript 6 y ESM/NodeNext.
3. Orden determinista, exclusión mutua y estado inspeccionable.
4. Cambios pequeños, revisables, promovibles y recuperables.
5. Separación entre runtime de aplicación y operación de migración.
6. Mínimo privilegio y evidencia sanitizada.
7. Ownership único de cada objeto conforme DEC-049.
8. Aislamiento shared-schema sin afirmar RLS.

## 4. Opciones evaluadas

### Opción A — Migrador core de Kysely

Usar `Migrator` y `FileMigrationProvider` del paquete `kysely`, con un runner
propio mínimo que sólo componga configuración, conexión, provider, resultado y
salida de proceso.

Ventajas:

- no agrega un segundo framework ni una CLI adicional;
- comparte tipos, dialecto y conexión con la persistencia aceptada;
- ordena migraciones por nombre;
- registra estado y usa locking específico del dialecto;
- conserva control explícito sobre configuración y sanitización.

Costos:

- el proyecto debe materializar comandos, estado, evidencia y lifecycle;
- Kysely no conserva un checksum del contenido en su journal por defecto;
- la recuperación operativa debe gobernarse fuera de un `down` automático.

### Opción B — CLI adicional sobre Kysely

Adoptar una CLI de terceros para generar y ejecutar migraciones.

Ventajas:

- comandos listos y experiencia de desarrollo más directa.

Costos:

- nueva dependencia, lifecycle y superficie de compatibilidad;
- puede duplicar o esconder decisiones de conexión, logging y permisos;
- no aporta evidencia material necesaria para PBI-023 que el core no pueda
  producir.

### Opción C — Runner SQL propio o herramienta externa

Crear un journal, locking y ejecutor propios, o incorporar una herramienta no
basada en Kysely.

Ventajas:

- libertad total de formato y checksums.

Costos:

- duplica mecanismos delicados de orden, lock y transacción;
- amplía la superficie de seguridad y mantenimiento;
- rompe la simplicidad esperada para la primera fundación persistente.

## 5. Decisión

Se acepta la **Opción A: migrador core de Kysely**.

Las versiones candidatas exactas para la primera materialización son:

| Paquete | Versión candidata | Motivo |
|---|---:|---|
| `kysely` | `0.29.4` | versión estable consultada; declara Node `>=22`, ESM y API de migración core |
| `pg` | `8.22.0` | driver oficial consultado; ESM y Node `>=16` |
| `@types/pg` | `8.20.0` | publicación con tag para TypeScript 6 |

No quedan instaladas por esta decisión. DEC050-C01 obliga a reconfirmar
metadata, integridad del lockfile y ejecución real antes de aceptarlas como
materializadas.

No se selecciona `kysely-ctl`, ORM, generador de schema, SQLite, Testcontainers
ni Docker Compose. Una futura herramienta sólo podrá entrar mediante decisión
o cambio explícito con evidencia.

## 6. Contrato normativo

### 6.1 Fuente, formato y orden

- Cada migración es un módulo TypeScript ESM con `up`; `down` sólo se incluye
  cuando su reversión es real, segura y probada.
- El nombre sigue
  `YYYYMMDDHHMMSS_<owner>_<verbo>_<objeto>.ts`, con timestamp UTC,
  minúsculas ASCII y `snake_case`.
- El orden es lexicográfico y coincide con el timestamp. Dos archivos no pueden
  compartir prefijo.
- `allowUnorderedMigrations` permanece `false`.
- Una migración aplicada es inmutable. Toda corrección crea una migración
  posterior.
- El módulo usa el tipo de conexión de migración y permanece congelado en el
  tiempo: no importa repositorios, servicios ni modelos actuales de negocio.

### 6.2 Journal y drift

- Se mantienen los nombres estables por defecto de Kysely:
  `kysely_migration` y `kysely_migration_lock`.
- El journal autoritativo de ejecución es el estado de migraciones aplicado por
  el migrador; Git y el commit revisado son la fuente del contenido.
- El manifest de evidencia registra SHA-256 de cada archivo de migración y del
  artefacto promovido.
- CI compara orden, conjunto, status y hashes. Un archivo aplicado modificado,
  una migración faltante o una migración fuera de orden falla cerrado.
- El journal por defecto no almacena checksum de contenido. Esa limitación no
  se oculta ni se sustituye con metadata paralela sin una decisión posterior.

### 6.3 Ejecución y locking

- La aplicación nunca migra durante `build`, `start` o bootstrap.
- Sólo scripts explícitos `migrate:*` pueden ejecutar o inspeccionar
  migraciones.
- Existe una sola ejecución promovida por ambiente.
- Se usa el advisory lock del adaptador PostgreSQL de Kysely y se mantiene
  además exclusión operativa del job.
- El job tiene timeout menor que el timeout interno del lock y falla sin
  ejecutar cambios si no obtiene exclusión.
- El resultado `MigrationResultSet` se inspecciona por completo; cualquier
  `error` produce salida no cero y evidencia sanitizada.

### 6.4 Transacciones y fallos

- Las migraciones transaccionales usan el comportamiento transaccional por
  defecto del migrador.
- En R0 inicial se prohíben migraciones que necesiten desactivar transacciones.
- Un fallo revierte la unidad transaccional aplicable, detiene la secuencia y no
  habilita reejecución ciega.
- Se registra qué migración inició, cuál terminó y el error traducido, sin SQL,
  parámetros, stack público, URL ni credenciales.
- PostgreSQL `40001` o `40P01` no se reintenta automáticamente en el runner de
  migraciones. La operación se detiene, diagnostica y reinicia completa bajo
  control explícito.

### 6.5 Recuperación

- `down` es una herramienta local/test y sólo se usa cuando el archivo declara
  una reversión segura y la prueba correspondiente pasa.
- En ambientes compartidos y producción, la estrategia primaria es
  roll-forward compatible y, cuando corresponda, rollback de aplicación.
- Eliminar o transformar datos con pérdida exige expandir–migrar–contraer,
  backup/punto de recuperación probado, aprobación reforzada y una ventana
  posterior; no entra en la primera migración de PBI-023.
- Una migración irreversible no puede etiquetarse reversible por tener una
  función `down`.

### 6.6 Seguridad y privilegios

- La identidad de migración y la identidad de aplicación son distintas en
  ambientes compartidos.
- La identidad de migración recibe sólo el DDL/DML requerido durante la
  ventana; la aplicación no recibe privilegios de alteración de esquema.
- Las credenciales entran por configuración externa validada y nunca se
  versionan ni se imprimen.
- Logs y manifests excluyen password, URL completa, SQL, parámetros, tokens,
  PIN, PII, rutas personales y variables de entorno.
- Una base efímera aislada puede usar una identidad temporal con privilegios de
  lifecycle; esa simplificación no prueba mínimo privilegio productivo.

### 6.7 Ownership y multitenancy

- Antes de crear un objeto se registra owner único, scope, escrituras, lecturas,
  invariantes y evolución conforme DEC049-C02.
- Toda tabla tenant-scoped contiene `tenant_id` no nulo.
- La pertenencia de sucursal se representa y referencia con una clave que
  incluya `tenant_id`; un identificador conocido no autoriza acceso.
- FKs, UKs e índices incluyen el namespace tenant cuando la identidad o
  integridad sea tenant-scoped.
- Los repositorios ordinarios no ofrecen consulta global ni hacen opcional el
  scope.
- Operaciones administrativas o cross-tenant quedan fuera de PBI-023 y
  requieren ruta, autorización y composición separadas.
- Esta decisión no adopta RLS.

### 6.8 Pruebas y promoción

Antes de integrar una migración:

1. aplicar desde base vacía PostgreSQL `18.4`;
2. aplicar desde el estado inmediatamente anterior;
3. volver a ejecutar y comprobar que no hay trabajo pendiente;
4. probar fallo intermedio y estado posterior;
5. probar dos ejecutores concurrentes;
6. probar `down` sólo si se declara reversible;
7. ejecutar constraints y aislamiento negativos aplicables;
8. cerrar pools y limpiar la base efímera aun ante fallo;
9. producir manifest y dos runs Linux comparables.

La misma revisión de migraciones y el mismo commit se promueven entre
ambientes. No se reconstruyen archivos ni se copian cambios ad hoc.

## 7. Comandos públicos previstos

Los nombres quedan reservados; no se materializan ahora:

| Comando | Propósito | Cambia estado |
|---|---|---|
| `migrate:status` | listar migraciones aplicadas y pendientes | no |
| `migrate:latest` | aplicar la secuencia pendiente autorizada | sí |
| `migrate:down` | revertir una migración explícitamente reversible en local/test | sí |
| `migrate:verify` | validar orden, hashes, estado y evidencia | no |
| `test:persistence` | ejecutar suite PostgreSQL real y cleanup | sólo DB efímera |

Los comandos mutantes exigen ambiente explícito. Ninguno puede ejecutarse por
importación accidental.

## 8. PostgreSQL real en desarrollo y CI

La estrategia inicial propuesta es un endpoint PostgreSQL `18.4` externo al
proceso de pruebas:

- local: instancia `18.4` aislada administrada por el desarrollador;
- CI Linux: servicio efímero fijado a PostgreSQL `18.4`;
- pruebas: una base única por run/worker, credenciales sintéticas, creación y
  eliminación controladas en `finally`;
- entrada: configuración de test explícita, sin fallback a una base compartida;
- salida: pool cerrado, base eliminada y evidencia sin secretos.

Testcontainers queda como alternativa futura si la divergencia de lifecycle
local/CI es material. No se adopta ahora porque agrega dependencias y un
runtime de contenedores sin evidencia ejecutada dentro de este gate.

## 9. Consecuencias

### Positivas

- un solo mecanismo de migración y conexión;
- secuencia visible y reproducible;
- ninguna migración accidental al arrancar;
- menor superficie de dependencias;
- recuperación y privilegios se tratan como contratos, no como defaults.

### Negativas

- el proyecto debe crear un runner, manifest y comandos explícitos;
- el journal core no detecta por sí solo cambios de contenido;
- PostgreSQL real requiere lifecycle externo y credenciales efímeras;
- el built-in advisory lock necesita un timeout operativo adicional.

## 10. Condiciones de materialización

| Condición | Owner | Trigger | Evidencia | Estado |
|---|---|---|---|---|
| DEC050-C01 | Ingeniería + Calidad | antes de instalar | versiones revalidadas, lockfile y compatibilidad ejecutada | `Pending` |
| DEC050-C02 | Arquitectura + Ingeniería | antes de la primera migración | naming, orden, inmutabilidad y mutación negativa | `Pending` |
| DEC050-C03 | Ingeniería + Operaciones | antes de ejecutar | lock core, exclusión del job, timeout y concurrencia probada | `Pending` |
| DEC050-C04 | Ingeniería + Calidad | antes de integrar | transacción, fallo parcial, `down` seguro y roll-forward probados | `Pending` |
| DEC050-C05 | Operaciones + Calidad | antes de promover | status, manifest SHA-256, drift y artefacto exacto | `Pending` |
| DEC050-C06 | Seguridad + Operaciones | antes de ambiente compartido | roles separados, privilegios mínimos y logs sanitizados | `Pending` |
| DEC050-C07 | Calidad + Ingeniería | antes del primer merge persistente | vacío/anterior/re-run/cleanup en PostgreSQL `18.4` | `Pending` |
| DEC050-C08 | Operaciones + Ingeniería | antes de despliegue | migración separada de build/start y promoción por commit | `Pending` |
| DEC050-C09 | Arquitectura + Seguridad | antes de crear objetos tenant-scoped | registry, constraints/índices/FK y negativos | `Pending` |
| DEC050-C10 | Responsable del Proyecto + Operaciones | antes de cambio destructivo/no transaccional | aprobación, backup, ensayo de recuperación y ventana | `Pending` |

Aceptar la decisión no satisface estas condiciones.

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| falsa compatibilidad por metadata solamente | DEC050-C01 exige ejecución en la baseline exacta |
| drift no detectado por journal core | inmutabilidad, manifest SHA-256 y comparación del commit |
| bloqueo prolongado | exclusión de job y timeout externo fail-closed |
| `down` destructivo | uso restringido; roll-forward y expandir–migrar–contraer |
| mezcla tenant/sucursal | owner registry, claves compuestas y negativos en PG real |
| credencial sobredimensionada | separación migrador/aplicación y mínimo privilegio |
| dependencia de entorno local | servicio Linux efímero y comandos idénticos |

## 12. Decisiones diferidas

- proveedor administrado y topología productiva;
- backup/restore y objetivos RPO/RTO;
- adopción de RLS;
- migraciones no transaccionales;
- Testcontainers o Docker Compose;
- herramienta de generación de tipos;
- backfills de alto volumen;
- observabilidad distribuida.

## 13. Dependencias

- [DEC-004](../dec-004-toolchain-contract/DECISION_PROPOSAL.md)
- [DEC-005](../dec-005-modular-monolith-organization/DECISION_PROPOSAL.md)
- [DEC-044](../dec-044-error-strategy/DECISION_PROPOSAL.md)
- [DEC-049](../dec-049-persistence-ownership/DECISION_PROPOSAL.md)
- [DEC-051](../dec-051-testing-ci-strategy/DECISION_PROPOSAL.md)
- [DEC-063](../dec-063-definition-of-done/DECISION_PROPOSAL.md)
- [ADR-003](../proposed/ADR-003-postgresql-primary-database.md)
- [ADR-004](../proposed/ADR-004-shared-schema-multitenancy.md)
- [Política de migraciones](../../operations/MIGRATION_POLICY.md)

## 14. Criterios de reconsideración

Revisar esta decisión si:

- Kysely core pierde compatibilidad con la baseline;
- el lock del dialecto no serializa dos procesos reales;
- el journal no permite gobernar drift con evidencia suficiente;
- una migración inicial necesita DDL no transaccional;
- el servicio PostgreSQL de CI no es reproducible;
- aparecen operaciones globales o RLS;
- el volumen exige un runner de backfill separado.

## 15. Impacto en R0

DEC-050 deja una estrategia única definida y permite preparar la
materialización de migraciones. No autoriza instalar dependencias ni iniciar
persistencia. PBI-023 permanece bloqueado hasta cerrar SPIKE-002 con evidencia
ejecutable y satisfacer las condiciones por trigger.
