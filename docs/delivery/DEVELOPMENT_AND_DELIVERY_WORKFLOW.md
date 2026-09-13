# Workflow canónico de desarrollo, delivery y operación

## Estado del documento

- **Estado:** Manual operativo canónico vigente.
- **Alcance:** Desarrollo, integración, despliegue y operación de SR Taller 2.0.
- **Autoridad:** Define el flujo end-to-end. Los contratos especializados
  enlazados mandan sobre su materia y no pueden ampliar autoridad por sí solos.
- **Fuente de verdad:** repositorio, Git y evidencia actual del runtime. El chat,
  la memoria humana y el contexto de un agente no son autoridad.
- **Próxima revisión:** cuando cambie `main`, la plataforma de despliegue, un
  ambiente, la estrategia de promoción o un gate de datos/seguridad.

## Propósito y producto

SR Taller 2.0 es una plataforma SaaS multitenant para talleres de reparación de
celulares. Busca coordinar de forma trazable clientes, reparaciones y otras
capacidades operativas sin copiar el acoplamiento del sistema anterior. La
dirección de producto se conserva en la [visión](../product/PRODUCT_VISION.md)
y el [alcance](../product/PRODUCT_SCOPE.md).

La baseline actual contiene Trusted Station Context, Users, roles/capabilities,
PIN, Operational Session, autorización contextual, atribución de negocio y el
Repair Workstream PBI-039 y Concurrent Operational Sessions PBI-043. Este
último está integrado en `aab27d9` con CI exacta `34730090448` y Preview PASS;
es `Done candidate` durante su cierre documental. No existe Current PBI y el
WIP funcional es `0/1`. PBI-040 permanece congelado fuera de `main`.

## Jerarquía de autoridad documental

| Documento | Autoridad |
|---|---|
| [CONTRIBUTING.md](../../CONTRIBUTING.md) | Entrada obligatoria y lecturas mínimas antes de cambiar el proyecto. |
| Este documento | Workflow end-to-end y clasificación `CURRENT` / `PLANNED` / `REQUIRED BEFORE PRODUCTION`. |
| [MVP Operating Roadmap](../product/MVP_OPERATING_ROADMAP.md) | Fases aprobadas, Sprint/PBI actual, secuencia y gates del MVP. |
| [BRANCH_POLICY.md](./BRANCH_POLICY.md) | Contrato de `main`, ramas temporales e integración. |
| [DEPLOYMENT_STRATEGY.md](../architecture/DEPLOYMENT_STRATEGY.md) | Arquitectura OCI, runtime, routing y promoción. |
| [ENVIRONMENTS.md](./ENVIRONMENTS.md) | Semántica y aislamiento de ambientes. |
| [Migration Policy](../operations/MIGRATION_POLICY.md) | Diseño, ejecución y verificación de migraciones. |
| [Backup and Recovery](../operations/BACKUP_AND_RECOVERY.md) | Protección y restauración de datos. |
| ADRs aceptados | Decisiones arquitectónicas dentro de su alcance exacto. |
| PBI, manifests y evidencia | Historia y prueba de una implementación concreta; no sustituyen el estado actual. |

Si dos documentos parecen contradecirse, primero se distingue si uno es
evidencia histórica o propuesta. Para el estado operativo manda la evidencia
actual; para arquitectura manda el ADR aceptado aplicable; para una decisión de
producto o una mutación sensible manda la autorización Owner correspondiente.

## Source of truth rule

El orden de evidencia es:

1. runtime e infraestructura reales para el estado operativo actual;
2. Git actual para código, baseline e historia;
3. documentación canónica aceptada para contratos y proceso;
4. ADRs, PBI y evidencia para decisiones específicas e historia;
5. chat, memoria humana o contexto de IA sólo como ayuda no autoritativa.

Si una persona o IA recuerda algo distinto, debe verificar y reconciliar contra
estas fuentes antes de actuar.

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
6. Crear desde `main` actualizado una rama temporal `feature/*`, `fix/*` u
   `ops/*`: una meta activa usa una rama y una rama integrada nunca se reutiliza.
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

## Current state snapshot

Actualizar esta sección cuando cambie cualquiera de estos hechos.

| Fact | Current state |
|---|---|
| Repository baseline | `main` |
| Audited repository state | [`docs/CURRENT_STATE.md`](../CURRENT_STATE.md) |
| Authoritative CI for current integrated baseline | Green: exact-main run `34730090448` on `aab27d98db94d850c580f0cac594c1a62c00cc51` |
| Program / phase | MVP Operating Roadmap / Operational Authentication & Authorization |
| Sprint | SPRINT-02 `Closed candidate`; WIP `0/1` functional |
| Current / next PBI | Current: NONE; PBI-043 Done candidate; PBI-040 frozen outside `main` |
| Current blocking gate | Documentary closure merge/exact-main CI; Production remains unauthorized |
| GitHub repository visibility | Public; changed externally to remove the Actions billing blocker |
| Preview | Materialized |
| Preview URL | `https://preview.srtaller.dev` |
| Preview deployment platform | Dokploy |
| Dokploy project / environment | `SR Taller` / `Preview` |
| Preview application | `srtaller-app` |
| Preview server | `srtaller-app-01` |
| Preview server IP | `204.168.203.127` |
| Preview source / build | `main` / `Dockerfile` |
| Application internal port | `3000` |
| Preview database | `srtaller-postgres` |
| PostgreSQL | `18.4` |
| PostgreSQL exposure | Internal Dokploy network; no public port |
| Autodeploy | Disabled; deployments are manual |
| Staging | Not materialized |
| Production | Not materialized |
| Redis | Not materialized |
| Workers | Not materialized |
| WAHA | Not materialized |
| R2 application storage | Not materialized |
| Production customer data | Not present |
| Product API | Repair endpoints, Trusted Station Context, User Directory, Roles/Capabilities/Assignments, PIN, Session, contextual authorization, PBI-028 business audit/real actor and PBI-038 Branch timezone foundation are integrated |

## Current, planned and required before Production

| Classification | Meaning | Items |
|---|---|---|
| `CURRENT` | Existe y puede verificarse ahora. | `main`, Dockerfile OCI, Dokploy Preview, health, React/Vite, PostgreSQL 18.4, migraciones y Repair Workstream local integrado. |
| `PLANNED` | Dirección futura, no infraestructura existente ni autorización de creación. | Staging, Production, promoción por digest, Redis, workers, WAHA y R2 según necesidad. |
| `REQUIRED BEFORE PRODUCTION` | Gate que debe resolverse antes de almacenar/operar datos reales. | Staging, artefacto inmutable promovible, backup/restore probado, RPO/RTO/retención, autenticación y autorización contextual, observabilidad, rollback, autoridad Owner y seguridad operativa. |

## Golden path

Este es el flujo normal. Un agente no inventa otro sin una decisión explícita.

```text
Roadmap
        ↓
Sprint activo
        ↓
PBI actual
        ↓
Discovery / decisiones Owner si aplican
        ↓
autorización Owner de implementación
        ↓
temporary branch
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
Owner Acceptance
        ↓
Definition of Done y evidencia completas
        ↓
PBI Done
        ↓
PR documental de avance
        ↓
siguiente PBI seleccionado, no iniciado
```

La validación técnica, el merge, el deployment, la validación de producto y el
cierre son estados distintos. Un resultado verde no autoriza automáticamente
el paso siguiente.

### WIP y avance documental

- Existe como máximo un PBI operativo en ejecución o cierre.
- El PBI siguiente puede estar ordenado o preparado, pero no se inicia por
  efecto del cierre anterior.
- El merge funcional conserva el PBI `In review` hasta que el CI del nuevo
  `main`, la Owner Acceptance y la DoD aplicable pasen.
- Después del cierre se prepara una rama `ops/pbi-###-roadmap-advance` desde el
  nuevo `main`. Su PR actualiza PBI, backlog, Sprint, Roadmap y Current State y
  selecciona el siguiente PBI sin autorizarlo.
- Mientras `DEC051-C02` siga abierta, el PR documental requiere preflight,
  revisión, CI y autorización Owner explícita de merge.
- Si falta evidencia, aceptación o siguiente prioridad, el flujo falla cerrado
  y no salta silenciosamente a otro PBI.
- El PR documental no genera otro PR para cerrarse a sí mismo: su integración
  y el CI autoritativo GREEN sobre su SHA de merge materializan el estado
  documental reconciliado. El texto pre-merge `Done candidate` se interpreta
  como `Done` efectivo al satisfacer esos hechos; no exige otro PR sólo para
  reescribirlo.

`Done` y `Released` permanecen separados. Un deploy sólo aparece dentro del
golden path de un PBI cuando su alcance o un release posterior lo autoriza.

## Contrato de `main` y ramas

`main` es la única baseline integrada y válida del desarrollo actual. Si un
cambio terminado no está en `main`, aún no forma parte de la baseline.

- `feature/*`: funcionalidad o capacidad acotada.
- `fix/*`: corrección o remediación acotada.
- `ops/*`: documentación operativa, delivery o cambio operacional acotado.

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
Este es el tratamiento vigente para PBI-040 mientras PBI-043 completa su
cierre documental. El detalle normativo está en [BRANCH_POLICY.md](./BRANCH_POLICY.md).

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

Cuando cambie un hecho del `CURRENT STATE SNAPSHOT`, el mismo cambio actualiza
esta sección y los contratos especializados afectados. Las propuestas e
historias no se reescriben para fingir que siempre describieron la realidad
actual; se marcan como históricas o se enlaza su sucesor canónico.
