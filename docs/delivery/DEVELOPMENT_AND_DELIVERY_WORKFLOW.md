# Workflow canónico de desarrollo, delivery y operación

## Estado del documento

- **Estado:** Manual operativo canónico vigente.
- **Alcance:** Desarrollo, integración, despliegue y operación de SR Taller 2.0.
- **Autoridad:** Define el flujo end-to-end. Los contratos especializados
  enlazados mandan sobre su materia y no pueden ampliar autoridad por sí solos.
- **Fuente de verdad:** la
  [matriz de autoridad](SOURCE_OF_TRUTH.md) asigna cada hecho a su sistema de
  registro. El chat, la memoria humana y el contexto de un agente no son
  autoridad.
- **Próxima revisión:** cuando cambie `main`, la plataforma de despliegue, un
  ambiente, la estrategia de promoción o un gate de datos/seguridad.

## Propósito y producto

SR Taller 2.0 es una plataforma SaaS multitenant para talleres de reparación de
celulares. Busca coordinar de forma trazable clientes, reparaciones y otras
capacidades operativas sin copiar el acoplamiento del sistema anterior. La
dirección de producto se conserva en la [visión](../product/PRODUCT_VISION.md)
y el [alcance](../product/PRODUCT_SCOPE.md).

El estado funcional, el PBI vigente y los hechos de integración no se copian
en este manual. Se consultan en roadmap/backlog, Git/GitHub/CI, runtime y
`ACTIVE_CHECKLIST` conforme a la matriz. La
[reconciliación de workflow de 2026-09](WORKFLOW_RECONCILIATION_2026-09.md)
es historia de la transición, no política operacional vigente.

## Jerarquía de autoridad documental

| Documento | Autoridad |
|---|---|
| [CONTRIBUTING.md](../../CONTRIBUTING.md) | Entrada obligatoria y lecturas mínimas antes de cambiar el proyecto. |
| Este documento | Workflow end-to-end y clasificación `CURRENT` / `PLANNED` / `REQUIRED BEFORE PRODUCTION`. |
| [Source-of-Truth Contract](SOURCE_OF_TRUTH.md) | Autoridad única para cada hecho operativo y política de evidencia derivable. |
| [Workflow Efficiency Decisions](DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md) | WF-001–WF-010: Fase 1, DOCS_ONLY, preflights, shadow classifier y attestation. |
| [MVP Operating Roadmap](../product/MVP_OPERATING_ROADMAP.md) | Fases aprobadas, Sprint/PBI actual, secuencia y gates del MVP. |
| [BRANCH_POLICY.md](./BRANCH_POLICY.md) | Contrato de `main`, ramas temporales e integración. |
| [WORK_UNIT_LIFECYCLE.md](./WORK_UNIT_LIFECYCLE.md) | Memoria operacional de un objetivo/rama y lifecycle de promoción. |
| [DEPLOYMENT_STRATEGY.md](../architecture/DEPLOYMENT_STRATEGY.md) | Arquitectura OCI, runtime, routing y promoción. |
| [ENVIRONMENTS.md](./ENVIRONMENTS.md) | Semántica y aislamiento de ambientes. |
| [Migration Policy](../operations/MIGRATION_POLICY.md) | Diseño, ejecución y verificación de migraciones. |
| [Backup and Recovery](../operations/BACKUP_AND_RECOVERY.md) | Protección y restauración de datos. |
| ADRs aceptados | Decisiones arquitectónicas dentro de su alcance exacto. |
| PBI y evidencia no derivable | Requisito/historia de producto y observaciones o decisiones que los sistemas técnicos no conservan. |

Si dos documentos parecen contradecirse, primero se distingue si uno es
evidencia histórica o propuesta. Para el estado operativo manda la evidencia
actual; para arquitectura manda el ADR aceptado aplicable; para una decisión de
producto o una mutación sensible manda la autorización Owner correspondiente.

## Source-of-truth rule

Cada pregunta se verifica en la autoridad que le corresponde según
[`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md); no existe un snapshot documental
universal. Si una persona o IA recuerda algo distinto, debe verificarlo antes
de actuar. La información derivable no necesita una copia Markdown para ser
válida.

## Autoridad de delivery y review

Iniciar una Work Unit exige autorización explícita de objetivo y alcance. Una
vez autorizada, el agente puede realizar la implementación local ordinaria,
pruebas focalizadas y commits lógicos dentro de ese límite sin pedir permiso
por cada paso. La autorización debe ampliarse ante cambio material de alcance,
acción destructiva/irreversible, decisión sensible de datos o seguridad,
decisión arquitectónica, escritura remota no incluida en el workflow de
promoción autorizado, merge o deploy/ambiente cuando su política los reserve.

El review es proporcional al riesgo y se basa en alcance, HEAD exacto,
criterios y findings. En cambios `NORMAL` puede realizarlo otra persona, agente
o contexto competente sin fingir independencia organizacional. Cambios
`SENSITIVE` o `ARCHITECTURAL` exigen una segunda revisión deliberada conforme a
DoD. Ninguna cuenta GitHub concreta es requisito permanente.

**SR Taller 2.0 must not depend operationally on a specific AI model or
agent.** Codex, otra IA, un desarrollador humano o un operador autorizado deben
poder ejecutar el workflow mediante Git, shell, Docker/OCI, Dokploy, PostgreSQL
y HTTP.

## If you are new to this repository

1. Leer [CONTRIBUTING.md](../../CONTRIBUTING.md) y su `MANDATORY FIRST READ`.
2. Leer este workflow, la [política de ramas](./BRANCH_POLICY.md), la
   [estrategia de despliegue](../architecture/DEPLOYMENT_STRATEGY.md) y
   [ambientes](./ENVIRONMENTS.md).
3. Confirmar con Git la rama, `HEAD`, `origin/main`, divergencia y working tree.
4. Identificar la tarea/PBI, el resultado esperado, exclusiones y autoridad.
5. Identificar el ambiente objetivo y si existen datos reales involucrados.
6. Crear desde `main` actualizado una rama temporal `feature/*`, `fix/*`,
   `ops/*` o `chore/*`: una meta activa usa una rama y una rama integrada nunca
   se reutiliza. Inicializar su Work Unit y `ACTIVE_CHECKLIST` conforme al
   [lifecycle](./WORK_UNIT_LIFECYCLE.md).
7. Implementar el cambio mínimo y actualizar sus contratos/documentación.
8. Ejecutar verificaciones proporcionales y conservar evidencia útil.
9. Crear un commit lógico; demostrar ancestry/baseline y provenance del runtime,
   y verificar nuevamente la integración candidata.
10. Integrar explícitamente a `main` sólo con la autoridad aplicable.
11. Publicar `origin/main` sin force push.
12. Para Preview, ejecutar deployment manual en Dokploy y verificar remoto.
13. Registrar resultado, riesgos residuales y siguiente tarea. Tras merge y
   validación Preview, eliminar las ramas absorbidas y ejecutar `fetch --prune`
   cuando se haya confirmado que no contienen trabajo exclusivo.

Para la iteración funcional local, el ciclo operativo es
`local:db:up → local:db:migrate → local:db:seed → local:dev`, conforme al
[contrato de desarrollo local](./LOCAL_DEVELOPMENT.md). Este camino no usa
Preview, no modifica Dokploy y no sustituye el CI autoritativo.

Nada de esta lista autoriza por inferencia Production, datos reales, una
migración destructiva ni una expansión material de alcance.

Antes del loop de desarrollo se ejecuta el preflight unificado y no
destructivo:

```sh
./scripts/pnpm-governed run preflight:development
```

El preflight observa Git, toolchain, procesos/puertos, provenance, manifest y
journal local y disponibilidad de fixtures. No inicia ni detiene procesos y no
migra, siembra o resetea la base. Un reset sigue necesitando autorización
explícita.

## Current, planned and required before Production

| Classification | Meaning | Items |
|---|---|---|
| `CURRENT` | Existe y puede verificarse ahora. | `main`, Dockerfile OCI, Dokploy Preview, health, React/Vite, PostgreSQL 18.4, migraciones y Repair Workstream local integrado. |
| `PLANNED` | Dirección futura, no infraestructura existente ni autorización de creación. | Staging, Production, promoción por digest, Redis, workers, WAHA y R2 según necesidad. |
| `REQUIRED BEFORE PRODUCTION` | Gate que debe resolverse antes de almacenar/operar datos reales. | Staging, artefacto inmutable promovible, backup/restore probado, RPO/RTO/retención, autenticación y autorización contextual, observabilidad, rollback, autoridad Owner y seguridad operativa. |

## Golden path

Este es el flujo normal. Un agente no inventa otro sin una decisión explícita.

```text
roadmap/backlog/PBI cuando sea trabajo de producto
        ↓
autorización explícita de objetivo y alcance
        ↓
Work Unit / rama temporal / ACTIVE_CHECKLIST
        ↓
implementation
        ↓
local verification
        ↓
commit
        ↓
integration verification
        ↓
explicit merge to main
        ↓
push origin/main
        ↓
CI autoritativo de main GREEN
        ↓
validación de ambiente o aceptación de producto cuando el alcance la requiere
        ↓
Definition of Done aplicable / cierre derivado
        ↓
siguiente PBI sólo si Owner lo selecciona, no iniciado
```

La validación técnica, el merge, el deployment, la validación de producto y el
cierre son estados distintos. Un resultado verde no autoriza automáticamente
el paso siguiente.

### WIP y documentación canónica

- Existe como máximo un PBI de producto operativo en ejecución o cierre.
- Existe como máximo una Work Unit operativa activa, salvo autorización
  explícita contraria. Ésta puede corresponder a un PBI o a un bug, recovery o
  cambio de governance autorizado; no altera el lifecycle del PBI.
- El PBI siguiente puede estar ordenado o preparado, pero no se inicia por
  efecto del cierre anterior.
- El cierre de producto exige los criterios y aceptación aplicables; la
  aceptación ocurre en review o validación del ambiente cuando allí puede
  evaluarse el comportamiento. No requiere repetirla en Markdown.
- La documentación canónica afectada viaja con el cambio. Evidencia narrativa
  separada se conserva sólo si aporta observación, decisión o riesgo no
  derivable.
- Si falta evidencia, aceptación o siguiente prioridad, el flujo falla cerrado
  y no salta silenciosamente a otro PBI.
- Merge ordinario autorizado y CI exact-main GREEN satisfacen sus predicados;
  el cierre se deriva cuando también se cumplen DoD y validaciones aplicables.
  No se crea otro PR sólo para reescribir estado derivable.

`Done` y `Released` permanecen separados. Un deploy sólo aparece dentro del
golden path de un PBI cuando su alcance o un release posterior lo autoriza.

### Procedimiento mínimo de promoción de una Work Unit

Cuando el Owner solicita conceptualmente «promueve esta Work Unit», el agente:

1. valida metadata, alcance, predicado de cierre y estado de la Work Unit;
2. verifica rama, base, divergencia y archivos Owner no relacionados;
3. selecciona la verificación de promoción exigida por la clasificación vigente
   y completa los checks focalizados del delta, sin sustituir gates con el
   shadow model;
4. reconcilia documentación afectada, fija `READY_FOR_PROMOTION`, crea el commit
   lógico final y exige un árbol tracked limpio;
5. ejecuta `work-unit:check --mode PROMOTION` y la verificación completa exigida
   sobre ese candidato exacto;
6. con autorización explícita, publica la rama sin reescribir historia;
7. abre un PR contra `main` y registra el riesgo aplicable;
8. espera `Authoritative promotion gate` y sus gates subyacentes;
9. ejecuta el review proporcional: NORMAL técnico; SENSITIVE o ARCHITECTURAL
   con la aprobación Owner y segunda revisión deliberada aplicables;
10. entrega un resultado breve con HEAD exacto, CI, hallazgos y pendientes;
11. sólo después de autorización Owner explícita, hace merge ordinario;
12. actualiza `main` local y verifica igualdad/divergencia/limpieza;
13. espera la verificación autoritativa exact-main;
14. despliega o valida un ambiente sólo bajo autorización separada;
15. cuando el predicado completo esté satisfecho, ejecuta el cierre gobernado
    para publicar el ref Git determinista; y
16. deriva `CLOSED`/`IDLE` sin crear un PR adicional para cambiar wording.

El Owner no necesita traducir esta secuencia a términos internos: la orden de
promover autoriza únicamente los pasos que indique expresamente y cada frontera
irreversible conserva su gate.

### Frontera actual post-merge y Preview

La realidad vigente es:

```text
merge autorizado a main
        ↓
CI autoritativo sobre el SHA exacto de main
        ↓
deploy manual a Preview sólo si fue autorizado
        ↓
health, rutas, migraciones/provenance y walkthrough aplicables
        ↓
ref Git de cierre publicado cuando el predicado completo se cumple
        ↓
cierre derivado e IDLE efectivo
```

Preview no es Staging, no replica necesariamente datos Owner/locales y no se
despliega automáticamente por el simple hecho de hacer merge. Staging,
Production y promoción por artefacto inmutable permanecen futuros.

## Phase 1 verification selection — CURRENT

Durante una iteración se usan el preflight y las pruebas focalizadas del delta.
Al congelar un candidato ejecutable se corre una vez el full local aplicable.
El pipeline Linux completo conserva run-1, run-2 y comparison exacta, pero
cada leg ejecuta el gate base y cada suite material una sola vez.

`DOCS_ONLY` es la única selección reducida activa. Sólo acepta Markdown regular,
no ejecutable y no symlink bajo la allowlist versionada de estado, roadmap,
backlog, Sprint, checklist, review y evidencia narrativa. Un delta mixto,
desconocido o que toque tests, workflow, scripts, configuración, assets/runtime,
policies o evidencia ejecutable selecciona full. El gate especializado valida
diff, links, consistencia documental, patrones de secretos y fingerprint.

El clasificador general registra riesgo en `SHADOW` durante al menos los
siguientes tres PBIs implementados y hasta cubrir los perfiles aprobados. No
omite gates. La verified-tree attestation también es shadow-only; no reduce
exact-main durante el piloto. Sólo `DOCS_ONLY` usa el gate especializado
independiente; un hotfix de migración siempre conserva full exact-main. Los
comandos y el contrato completo están en
[WF-001–WF-010](DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md).
El avance y los falsos negativos del piloto se registran en
[Workflow Shadow Pilot](WORKFLOW_SHADOW_PILOT.md).

El snapshot de migration state de Preview dura 24 horas. Pre-merge es advisory
si falta o está stale y bloquea sólo un conflicto conocido/material. Antes de
deploy, el journal real de Preview es autoritativo y la comprobación es
bloqueante. Un snapshot stale nunca permite afirmar compatibilidad.

## Contrato de `main` y ramas

`main` es la única baseline integrada y válida del desarrollo actual. Si un
cambio terminado no está en `main`, aún no forma parte de la baseline.

- `feature/*`: funcionalidad o capacidad acotada.
- `fix/*`: corrección o remediación acotada.
- `ops/*`: documentación operativa, delivery o cambio operacional acotado.
- `chore/*`: mantenimiento o governance acotado sin cambio de producto.

Son ramas temporales. No se crean ramas permanentes `preview`, `staging` o
`production`. Las ramas históricas que ya existen no constituyen otra baseline
y no se borran como efecto colateral de una tarea. Una meta activa conserva una
sola rama; iteraciones del mismo objetivo permanecen allí hasta integración.
Una rama integrada nunca se reutiliza: el siguiente objetivo nace del `main`
actualizado. Antes de Owner Review o gates se verifican ancestry y runtime
provenance. Después de merge y Preview PASS se limpian ramas absorbidas y se
ejecuta `fetch --prune`, tras confirmar que no guardan trabajo exclusivo.

Un WIP no integrado que deba esperar una remediación precedente se conserva
congelado, sin recibir cambios, y después se reconcilia desde el nuevo `main`.
PBI-040 siguió este tratamiento durante PBI-043, fue reconciliado, integrado y
validado en Preview. Su cierre documental/exact-main CI también pasó y las
ramas absorbidas se limpiaron conforme al inventario gobernado. PBI-041
permanece Ready sin selección ni autorización. El detalle normativo está en
[BRANCH_POLICY.md](./BRANCH_POLICY.md).

La protección técnica de `main` no está configurada en el repositorio público
observado: la API reporta `Branch not protected` y no existen rulesets. Por
ello el merge debe seguir siendo explícito, autorizado y verificado; nunca se
usa force push ni se afirma que checks equivalen a autoridad. El contrato
detallado está en [BRANCH_POLICY.md](./BRANCH_POLICY.md).

## Ambientes no son ramas

Git administra cambios y linaje. Dokploy administra ambientes y runtime.

```text
main
  ↓
Preview (CURRENT)

release candidate / immutable artifact
  ↓
Staging (PLANNED)

approved immutable artifact
  ↓
Production (PLANNED)
```

## Preview contract — CURRENT

Preview existe para iteración rápida, integración, pruebas funcionales y
observación del Owner. Puede reconstruirse y sólo contiene datos sintéticos,
de desarrollo o desechables. Nunca usa datos reales de Production.

Los datos de Preview son locales al ambiente y pueden limitarse a un seed mínimo
o de QA. Los datos de negocio Owner/Production no se replican implícitamente a
Preview. La verificación de deployment prueba la integridad de runtime, schema,
provenance y rutas del ambiente desplegado; no puede exigir identidad de datos
de negocio entre ambientes salvo que una replicación esté autorizada y forme
parte explícita de su contrato.

Inventario operativo:

- Dokploy: `SR Taller / Preview / srtaller-app`.
- Server: `srtaller-app-01`.
- Domain: `https://preview.srtaller.dev`.
- Source: `main`; build: `Dockerfile`; autodeploy: disabled.
- PostgreSQL: `srtaller-postgres`, versión 18.4, volumen persistente, red
  interna y sin puerto público.
- Routing/TLS: Traefik administrado por Dokploy; DNS de Cloudflare resuelve el
  dominio de desarrollo al servidor.

No se reintroduce EGTP como dependencia operativa. EGTP es una iniciativa
histórica/congelada y no forma parte del runtime ni del delivery actual.

## Staging contract — PLANNED

Staging no existe todavía y esta documentación no autoriza crearlo. Su propósito
será validar un release candidate cercano a Production con:

- aplicación, base y credenciales propias;
- datos sintéticos o un dataset explícitamente sanitizado y autorizado;
- pruebas de migración, regresión y smoke completo;
- verificación de backup/restore cuando corresponda;
- evidencia suficiente para decidir promoción.

## Production contract — PLANNED

Production no existe y no es ambiente de iteración. Contendrá datos reales;
por tanto no se infiere ningún deploy, migración, prueba destructiva, acceso o
reutilización de bases/volúmenes/secretos desde Preview o Staging.

Production requiere una decisión Owner separada y todos los gates
`REQUIRED BEFORE PRODUCTION`. Un deployment exitoso en Preview nunca la
autoriza.

## Build once / promote the same artifact

Cuando Staging y Production existan, el flujo preferido será:

```text
exact commit → OCI image → immutable digest → Staging → approved same digest → Production
```

No se reconstruye para Production si el rebuild puede producir bits distintos
de los validados. Tags legibles no sustituyen el digest.

## Docker / OCI contract

El [Dockerfile](../../Dockerfile) productivo es multi-stage y usa:

- Node.js `24.18.0` y pnpm `11.15.1`;
- Linux/glibc;
- runtime non-root;
- aplicación stateless salvo dependencias externas;
- puerto interno `3000`;
- TLS fuera del container;
- routing mediante Dokploy/Traefik;
- `GET /livez` y `GET /readyz`.

SR Taller usa contratos portables OCI, HTTP y variables de entorno; no consume
APIs propietarias de Dokploy para ejecutar.

## Health contract

- `/livez`: responde si el proceso está vivo. No depende de PostgreSQL.
- `/readyz`: responde 200 sólo cuando bootstrap, PostgreSQL, journal de
  migraciones y esquema mínimo son compatibles.

Con DB caída, `/livez` puede permanecer 200 y `/readyz` debe responder 503.

## Database contract

- Motor: PostgreSQL 18.x; Preview efectivo: 18.4.
- Acceso: Kysely sobre `pg`.
- Configuración: campos gobernados `SR_DB_*`; `DATABASE_URL` permanece
  prohibida.
- Cada ambiente usa una DB, credenciales y volumen distintos.
- Preview DB ≠ Staging DB ≠ Production DB.

El contrato técnico de Preview está en
[preview-postgresql-foundation.md](../architecture-readiness/preview-postgresql-foundation.md).

## Migration contract

Las migraciones son explícitas, one-shot, verificadas y separadas del arranque
HTTP. No se ejecutan automáticamente en cada réplica.

```sh
pnpm run db:migrate
```

En Preview pueden ejecutarse dentro de una tarea autorizada mediante un
override temporal del comando del mismo artefacto; después se restaura el
comando normal y `SR_DB_ROLE=application` con migraciones desactivadas.

Production futuro requiere, en orden: backup/restaurabilidad verificados,
plan de migración, consideración de rollback/recuperación, autorización Owner,
ejecución, verificación del esquema y verificación de health.

## Data safety contract

> CODE IS REDEPLOYABLE. CUSTOMER DATA IS NOT.

Antes de cualquier cambio que pueda afectar datos reales se confirma:

1. backup reciente y destino;
2. integridad y restaurabilidad, no sólo existencia del archivo;
3. migraciones e impacto exactos;
4. compatibilidad, rollback o recuperación;
5. ambiente y autoridad Owner.

Si hay datos persistentes y la remediación propuesta es destructiva, se detiene
el flujo antes de ejecutar.

## Backup policy status

- Preview `CURRENT`: backups best-effort según necesidad; sus datos no son
  Production y deben poder reconstruirse.
- Staging `PLANNED`: backups/restore se usarán para ensayar migración y
  recuperación cuando corresponda.
- Production `REQUIRED BEFORE PRODUCTION`: backups obligatorios y estrategia
  de restore probada.

Frecuencia, retención, almacenamiento off-server, cifrado, restore tests, RPO y
RTO están `TO BE DECIDED BEFORE PRODUCTION`.

## Secrets contract

Secretos no viven en Git, imágenes, documentación, logs ni evidencia. Dokploy
administra actualmente los secretos de runtime. `.env` y `.env.*` permanecen
ignorados; configuración no secreta y secretos son conceptos distintos.

Una credencial de Preview observada durante inspección administrativa fue
tratada como comprometida y rotada. La regla permanente es rotar cualquier
credencial expuesta y nunca registrar su valor.

## Infrastructure responsibility map

| Component | Current responsibility |
|---|---|
| GitHub | Source control público, historial y `main`; sin branch protection configurada. |
| Dokploy | Ambientes, deployments, containers, routing/TLS, PostgreSQL, logs/monitoring y operaciones de aplicación. |
| Hetzner | Infraestructura de cómputo/servidor. |
| Cloudflare | DNS actual; R2 sólo será futuro si el producto lo necesita. |
| Traefik | Reverse proxy y routing administrados mediante Dokploy. |
| PostgreSQL | Datos relacionales persistentes por ambiente. |
| Docker/OCI | Artefacto portable de aplicación. |

## AI / agent operating contract

### Before any technical task

Todo agente debe:

1. leer [CONTRIBUTING.md](../../CONTRIBUTING.md);
2. leer este workflow;
3. leer [BRANCH_POLICY.md](./BRANCH_POLICY.md);
4. leer [DEPLOYMENT_STRATEGY.md](../architecture/DEPLOYMENT_STRATEGY.md);
5. inspeccionar Git real;
6. identificar el ambiente objetivo;
7. determinar si existen datos reales involucrados;
8. identificar autoridad y gates;
9. ejecutar sólo dentro del alcance autorizado.

El orden de confianza es `repo + Git + runtime evidence`. Chat, memoria previa
y supuestos sólo orientan dónde verificar.

### Autonomía dentro de una tarea autorizada

Un agente puede iterar `diagnose → fix → test → commit → deploy Preview →
verify` sin detenerse ante cada bug menor, siempre que esas acciones estén
dentro del alcance autorizado.

Debe detenerse y pedir decisión Owner ante:

- Production deployment o acceso a datos reales;
- migración destructiva, borrado de datos o restore;
- eliminación/recreación de servidor o infraestructura material;
- aumento de costo/plan;
- cambio estratégico de DNS/dominio;
- secreto requerido no disponible de forma autorizada;
- expansión material de alcance;
- relajación de un límite de seguridad;
- operación irreversible o cuya recuperación no está demostrada.

## Preview deployment procedure — CURRENT

1. Confirmar `main`, working tree y sincronización con `origin/main`.
2. Confirmar que el candidato ya pasó verificaciones locales/integración.
3. Push de `main` sin force push.
4. En Dokploy seleccionar `SR Taller / Preview / srtaller-app`.
5. Ejecutar deployment manual desde `main` con `Dockerfile`.
6. Esperar build y servicio `running/healthy` sin crash loop.
7. Verificar remoto y registrar commit/resultado.

Autodeploy está deshabilitado. Habilitarlo requerirá una mutación separada con
webhook/integración gobernada, branch matching, observabilidad y recuperación.

## Minimum Preview verification

- application/service: running y healthy;
- `https://preview.srtaller.dev/`: UI esperada;
- `/livez`: 200;
- `/readyz`: 200;
- `/api/unknown`: 404;
- logs: sin crash loop ni bootstrap failure;
- smoke específico adicional si cambió una superficie.

## Failure and hotfix loop

Si Preview falla:

```text
observe → identify root cause → source/config fix → tests → commit → push → redeploy → verify
```

No se cambian cosas al azar ni se oculta el fallo con una afirmación de éxito.
Si intervienen datos persistentes, se detiene antes de cualquier operación
destructiva y se aplica la política de migración/backup/rollback.

## Safe Dokploy access

Puede documentarse el proyecto, ambiente, servicios, dominio, source branch,
configuración esperada y mecanismo de migración. Nunca se documentan cookies,
passwords, tokens, webhooks secretos ni private keys.

## Machine/agent-friendly checklist

- [ ] Read canonical docs.
- [ ] Confirm Git clean and compare `main` with `origin/main`.
- [ ] Confirm task/PBI, scope and authority.
- [ ] Confirm target environment and data sensitivity.
- [ ] Create a temporary `feature/*`, `fix/*` or `ops/*` branch.
- [ ] Implement the minimum scoped change.
- [ ] Run proportional verification.
- [ ] Review diff and secret exposure.
- [ ] Commit logically.
- [ ] Run integration verification.
- [ ] Merge explicitly to `main` only when authorized.
- [ ] Push without force.
- [ ] Deploy Preview only when in scope.
- [ ] Verify remote health and feature smoke.
- [ ] Record evidence, residual risks and next action.
- [ ] Clean temporary branches only in a separately authorized cleanup.

## Handoff contract

Toda tarea técnica importante termina con un handoff que registre, según
aplique:

- resultado global y scope ejecutado;
- branch, commits y `main` HEAD;
- tests y verificaciones;
- resultado de deployment y ambiente afectado;
- migraciones, mutaciones de infraestructura y mutaciones de datos;
- estado de exposición de secretos;
- blockers y siguiente acción.

Los campos no aplicables se reportan como tales; no se omiten para aparentar
que una acción ocurrió.

## Maintenance rule

Toda tarea que cambie branch policy, delivery flow, un ambiente Dokploy, nombre
de aplicación, servidor, dominio, base de datos, migraciones, health, secretos,
backups, Staging, Production o promoción de artefactos debe evaluar si este
workflow también necesita actualización. No se modifica mecánicamente cuando
el contrato no cambió.

Cuando cambie una regla permanente, se actualiza su contrato dueño. Los hechos
derivables se consultan en Git/GitHub/CI/runtime y no se copian aquí. Las
propuestas e historias no se reescriben para fingir que siempre describieron
la realidad actual; se marcan como históricas o se enlaza su sucesor canónico.
