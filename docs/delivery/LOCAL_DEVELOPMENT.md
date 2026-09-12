# Desarrollo local de SR Taller 2.0

## Estado del documento

- **Estado:** Contrato operativo vigente para `Local development`.
- **Datos:** únicamente sintéticos y desechables; no se conecta a Preview.
- **Toolchain:** Node.js `24.18.0`, pnpm `11.15.1`, Docker Desktop y
  PostgreSQL `18.4`.
- **Próxima revisión:** al cambiar el contrato `SR_DB_*`, Operational Session,
  el esquema local o los puertos locales.

Este documento materializa el ciclo local sin crear una segunda arquitectura
de aplicación. La base se reconstruye desde PostgreSQL vacío, las migraciones
presentes en el checkout y un seed mínimo; la migración PBI-034 está integrada.
Docker CLI se usa directamente para
conservar una topología pequeña y portable; no se añade Docker Compose ni una
dependencia de multiplexación.

Antes de ejecutar scripts del repositorio, comprobar qué resolvería el shell y
usar el launcher gobernado del repositorio:

```sh
node --version
pnpm --version
./scripts/pnpm-governed run verify:toolchain
```

El launcher toma los pins de `.node-version` y `package.json`, acepta el runtime
ambiental cuando ya coincide y, en macOS con Homebrew, descubre el prefijo
versionado sin fijar una ruta de instalación. Si no encuentra exactamente
Node.js `24.18.0` y pnpm `11.15.1`, falla antes de ejecutar el comando. También
puede activarse `.nvmrc` o `.node-version` con el gestor ya instalado y usar
`pnpm` normalmente; no se introduce ni exige un segundo gestor de versiones.
Todos los scripts de backend, frontend y verificación vuelven a ejecutar
`verify:toolchain`; el launcher no sustituye ni relaja ese guard. CI es la
plataforma autoritativa de entrega y conserva los mismos pins exactos sobre
Linux; el launcher es la entrada determinista para desarrollo y Codex local.

## Gates de verificación local

`verify` permanece como gate base canónico y rápido. `verify:full` es la campaña
local de alto riesgo para PBI-039: primero ejecuta `verify` y después materializa
PostgreSQL composite, los dos tests PostgreSQL PBI-039, runtime Preview-like y
smoke compilado backend/UI sobre una base PostgreSQL 18.4 exclusiva. También
verifica la identidad dirty del candidato, contabiliza skips, limpia recursos y
escribe evidencia JSON fuera del repositorio.

```sh
./scripts/pnpm-governed run verify:full -- --dry-run
# Gate posterior con autorización explícita:
./scripts/pnpm-governed run verify:full
```

`--dry-run` sólo resuelve scripts, toolchain, Docker, digest disponible,
fingerprint y clasificación de untracked; no inicia la campaña. La ejecución
real es fail-fast, usa credenciales sintéticas y puertos loopback efímeros, no
lee `.env.local`, y deja el warning Vite de tamaño como `ACCEPTED WARNING`. La
evidencia se escribe en un directorio temporal del sistema o en
`SR_FULL_VERIFICATION_EVIDENCE_DIR`; esa ruta debe permanecer fuera del
candidato. Este gate local no sustituye CI ni autoriza PR/merge/deploy.

## Límites y seguridad

- Local, Preview, Staging y Production tienen bases, volúmenes y credenciales
  distintas.
- No se copian bases, dumps ni secretos de Preview.
- No se ejecuta ninguna migración, seed o reset contra Dokploy.
- No se crean tablas de clientes, pagos ni autorización contextual. El
  PBI-034 agrega exclusivamente las tablas Access-owned de
  Operational Session. Las migraciones locales también materializan Trusted
  Station, Users, catálogo de roles/capabilities, credencial PIN server-only,
  Reparaciones, intake, timeline, evidencia, asignación técnica y los
  historiales acotados D6.1 y D6.2; no materializan writes de Custody ni el
  resto de D6.
- `DATABASE_URL` y las variables de fallback `PG*` continúan prohibidas.
- El archivo `.env.local` es ignorado, se crea con permisos `0600` y contiene
  credenciales generadas para esta máquina. No se imprimen.
- Los comandos mutantes comprueban el marcador `local`, el host loopback, el
  puerto `55432`, el nombre `srtaller_local`, el container etiquetado y el
  volumen exacto antes de operar.

## Primera vez

```sh
pnpm install --frozen-lockfile
pnpm run local:config
pnpm run local:db:up
pnpm run local:db:migrate
read -r -s 'SR_LOCAL_PIN_JORGE?PIN sintético para Jorge: '
echo
read -r -s 'SR_LOCAL_PIN_MARIA?PIN sintético para María: '
echo
read -r -s 'SR_LOCAL_PIN_CARLOS?PIN sintético para Carlos: '
echo
read -r -s 'SR_LOCAL_PIN_LUIS?PIN local estable para Luis: '
echo
printf '\nSR_LOCAL_PIN_LUIS=%s\n' "$SR_LOCAL_PIN_LUIS" >> .env.local
chmod 600 .env.local
export SR_LOCAL_PIN_JORGE SR_LOCAL_PIN_MARIA SR_LOCAL_PIN_CARLOS
pnpm run local:db:seed
unset SR_LOCAL_PIN_JORGE SR_LOCAL_PIN_MARIA SR_LOCAL_PIN_CARLOS SR_LOCAL_PIN_LUIS
pnpm run local:dev
```

Los PIN de Jorge, María y Carlos se presentan una sola vez al proceso de seed.
El PIN sintético de Luis se conserva únicamente en `.env.local` —archivo
ignorado y `0600`— para que `local:db:reset` pueda recrear la misma identidad
Owner en volúmenes nuevos. Ningún PIN se imprime, se versiona o se copia a
Preview. Todos deben ser distintos y de cuatro dígitos.

`local:dev` mantiene dos procesos en la misma terminal: NestJS en
`http://127.0.0.1:3000` y Vite en `http://127.0.0.1:4173`. Para depurar por
separado se pueden usar `pnpm run local:backend` y el comando Vite indicado
abajo. Ambos comandos de backend rehidratan de forma idempotente los fixtures
sintéticos de evidencia local antes de arrancar HTTP; no sustituyen el seed ni
crean metadata en PostgreSQL.

## Uso diario

```sh
pnpm run local:db:up
pnpm run local:dev
```

Si la configuración no existe, `local:config` la genera de forma explícita.
`local:db:up` no aplica migraciones ni seed automáticamente.

## PostgreSQL local

| Propiedad | Valor |
|---|---|
| Imagen | `postgres:18.4` |
| Container | `srtaller-postgres-local` |
| Volume | `srtaller-postgres-local-data` |
| Database | `srtaller_local` |
| Binding | `127.0.0.1:55432 -> 5432` |
| Healthcheck | `pg_isready` |
| Admin local | sólo para crear roles y grants |
| Migration role | `srtaller_local_migration` |
| Application role | `srtaller_local_application` |

El comando `local:db:up` verifica además que el servidor reporta versión
`18.4`. La aplicación nunca usa el rol admin; sólo consume la configuración
canónica derivada como `SR_DB_*` con `SR_DB_ROLE=application` y
`SR_DB_MIGRATIONS_ENABLED=false`.

## Configuración

`.env.local.example` documenta las claves. El archivo operativo se genera como
`.env.local` y contiene claves `SR_LOCAL_*` más los secretos bootstrap
server-only `SR_STATION_BOOTSTRAP_SECRET` y `SR_USER_BOOTSTRAP_SECRET`. Sus
valores locales aleatorios nunca se versionan ni se imprimen. Los scripts
derivan todas las variables del contrato `SR_DB_*` en memoria para la operación
concreta; no se introduce `DATABASE_URL` ni se pasan valores de conexión por
URI.

El guard fail-closed rechaza hosts remotos, ambientes distintos de `local`,
puertos alternos, nombres de base distintos, variables `SR_DB_*` persistidas en
`.env.local` y cualquier alias de `libpq`.

PBI-029 añade la clasificación server-only de secretos y configuración
técnica. `SR_DB_PASSWORD` se exige al iniciar el backend, pero los scripts
locales lo derivan sólo en memoria desde `.env.local`; ningún comando lo
imprime. `SR_PIN_PEPPER` tiene un consumidor server-only en Access/PBI-025 y
se genera localmente sin imprimirse. `SR_SESSION_SIGNING_KEY` permanece
reservado y sin consumidor también en PBI-034: la Session es
stateful, usa bearer/CSRF aleatorios y conserva sólo verificadores SHA-256. Los
secretos bootstrap de Station y User tienen consumidores exclusivamente
locales y no constituyen enrollment o provisioning productivo. Nunca se usa
`VITE_*` para un secreto.

El primer User se provisiona sólo después de crear y migrar la base local. La
autoridad se presenta desde el archivo local ignorado sin imprimir su valor:

```sh
set -a
. ./.env.local
set +a
pnpm users:provision-first -- \
  00000000-0000-4000-8000-000000000001 \
  "Nombre sintético" \
  00000000-0000-4000-8000-000000000901 \
  OPERADOR-LOCAL
```

El comando falla cerrado ante archivo ausente, target no local o secreto
ausente/distinto; valida la autoridad antes de abrir una conexión. Es
server-only, único por Tenant e idempotente por el `clientRequestId` UUID. No
registrar ni copiar el valor de `SR_USER_BOOTSTRAP_SECRET` en terminal,
documentación o evidencia.

## Migraciones

```sh
pnpm run local:db:migrate
```

El comando compila el artefacto si falta `dist/db-migrate.js`, ejecuta
exclusivamente las migraciones integradas con el rol `migration`, verifica el
manifest/journal mediante el runner existente y concede al rol `application`
los permisos mínimos sobre las tablas creadas. No se ejecuta en bootstrap HTTP.

La baseline crea `tenants` y `branches`. Trusted Station añade Stations,
bindings y credenciales técnicas; Identity añade Users, bootstrap/lifecycle,
catálogo Access, asignaciones y credenciales PIN protegidas. PBI-034 agrega
`access_operational_session_station_guards` y `access_operational_sessions`,
con una Session activa por Station, verificadores y estados de cierre
explícitos. La cadena local de Reparaciones añade
`repairs` para Worklist, `repair_intakes` para D1,
`repair_timeline_entries` para D2/D3 y `repair_attachments` para D4, más la
restricción de idempotencia de notas operativas, las tablas D5 de técnicos y
asignación, `repair_workflow_transitions` para D6.1, y
`repair_locations`/`repair_location_movements` para D6.2. D6.1 conserva un
historial append-only y sólo admite `pending → diagnosing`; D6.2 conserva un
historial/versionado independiente y sólo admite `Área de pendientes → Taller`.
No se inventan tablas de clientes, pagos, autorización contextual ni otros
módulos funcionales.

La frase “una Session activa por Station” describe el schema integrado actual,
no la arquitectura objetivo. [ADR-014](../decisions/proposed/ADR-014-concurrent-operational-sessions.md)
la sustituye por `0..N` Sessions independientes; PBI-043 materializará el delta
cuando exista autorización. Hasta entonces no se altera la migración local ni
se afirma que el runtime ya soporte concurrencia.

## Seed sintético V1

```sh
pnpm run local:db:seed
```

El seed usa el rol `application`, una transacción y upserts idempotentes. Crea
un tenant técnico sintético, dos sucursales, Stations/bindings, cuatro Users
—incluido Luis con rol Administrador—, roles/capabilities/asignaciones, cuatro
credenciales PIN y 15 reparaciones
sintéticas mediante UUIDs fijos y fechas deterministas. Cada PIN se entrega
como variable de entorno efímera únicamente al proceso de seed y se elimina
del shell al terminar; `.env.local` lo excluye y limpia claves heredadas.
PostgreSQL recibe salt, verifier Argon2id, lookup digest y fingerprint,
nunca plaintext. También materializa intakes, timeline y referencias de
evidencia para D1, D2 y D4, catálogo/asignaciones D5, transiciones D6.1 y
colocaciones/movimientos D6.2 deterministas. Una reparación conserva ubicación
no registrada para probar la proyección honesta. Los datos de cliente son
snapshots dentro de `repairs`; no existe una tabla de clientes ni se agregan
importes o pagos. Los PIN de los otros usuarios son efímeros; sólo el PIN
sintético de Luis permanece en `.env.local` para sobrevivir a la recreación
del volumen. El seed no crea Sessions activas: se inician mediante el
login local con contexto de Station verificado y PIN sintético.

## Reset y parada

```sh
pnpm run local:db:down
pnpm run local:db:reset
```

`local:db:down` detiene el container y conserva el volumen. `local:db:reset`
es **DESTRUCTIVE — LOCAL ONLY**: elimina únicamente el container etiquetado y
el volumen `srtaller-postgres-local-data`, lo recrea y ejecuta en orden
`up → migrate → seed`. Se niega antes de tocar cualquier target que no cumpla
el contrato local. Antes de invocarlo presenta y exporta los tres PIN
sintéticos con el mismo bloque de lectura silenciosa usado para el seed, y
elimínalos del shell al finalizar.

## Backend y frontend

El backend local arranca con `SR_DB_ROLE=application` y expone:

- `GET http://127.0.0.1:3000/livez` — 200 mientras el proceso está vivo;
- `GET http://127.0.0.1:3000/readyz` — 200 con DB, journal y schema listos;
- `POST http://127.0.0.1:3000/api/stations/local-bootstrap` — instala la cookie
  de Station sintética sólo en runtime `local`, loopback y same-origin; fuera de
  ese contrato falla cerrado;
- `GET http://127.0.0.1:3000/api/access/session` — resuelve Station server-side,
  lista Users elegibles y devuelve el snapshot de Session con `no-store`;
- `POST http://127.0.0.1:3000/api/access/session` — inicia o cambia User con PIN
  nuevo, JSON, same-origin y coincidencia cookie/header CSRF; un fallo de switch
  conserva la Session vigente;
- `DELETE http://127.0.0.1:3000/api/access/session` — termina la Session con el
  mismo contrato same-origin/JSON/CSRF y no revoca el binding de Station;
- `GET http://127.0.0.1:3000/api/repairs` — Worklist V1 read-only con búsqueda,
  periodos relativos evaluados contra la fecha actual del backend, filtros
  avanzados y paginación server-side; `%` y `_` se buscan literalmente;
- `GET http://127.0.0.1:3000/api/repairs/:id` — detalle read-only con intake,
  timeline y metadatos de evidencia;
- `GET http://127.0.0.1:3000/api/repairs/:id/evidence/:evidenceId/content` —
  contenido de evidencia limitado al provider local sintético;
- `POST http://127.0.0.1:3000/api/repairs/:id/notes` — nota operativa local
  idempotente; repetir `clientRequestId` con el mismo contenido devuelve la
  nota original, mientras reutilizarlo con contenido diferente responde `409`;
  no implica transiciones, asignación ni otros writes;
- `POST http://127.0.0.1:3000/api/repairs/:id/workflow/start-diagnosis` — command
  local D6.1 con payload exacto `{ clientRequestId, expectedVersion }`; crea una
  transición estructurada `Pendiente → En diagnóstico`, incrementa sólo
  `workflowVersion` y deja Technician, Location y Custody sin cambios;
- `POST http://127.0.0.1:3000/api/repairs/:id/location/move-to-workshop` —
  command local D6.2 con payload exacto
  `{ clientRequestId, expectedVersion, reason? }`; mueve únicamente
  `Área de pendientes → Taller`, incrementa sólo `locationVersion` y registra
  Timeline atómicamente;
- al apagar PostgreSQL, `/livez` puede seguir 200 y `/readyz` debe fallar
  conforme al contrato de health.

Vite conserva HMR y sirve el frontend en
`http://127.0.0.1:4173`. Sólo el servidor Vite en modo `local` añade proxy
para `/api`, `/livez` y `/readyz` hacia el backend local. El build de Preview y
el runtime OCI no cambian. PBI-034 bloquea el Application Shell
hasta resolver una Station y una Session válidas; presenta login, cambio de
User y logout sin guardar PIN o bearer en `localStorage`/`sessionStorage`.

Comando Vite independiente:

```sh
SRT_DEPLOY_ENV=local pnpm --filter @srtaller/dev-preview-web exec vite \
  --host 127.0.0.1 --port 4173
```

## Troubleshooting

- **Docker unavailable:** inicia Docker Desktop y repite `local:db:up`.
- **Port already in use:** detén el proceso que ocupa `55432`, `3000` o
  `4173`; no cambies el binding local sin actualizar este contrato.
- **`/readyz` 503:** confirma `local:db:up`, vuelve a ejecutar migrate y revisa
  que el journal coincida con el artefacto compilado.
- **Migrations pending:** no edites el journal; ejecuta `local:db:migrate`.
- **Seed refusal:** revisa que `.env.local` sea generado por
  `local:config`; nunca pegues credenciales de Preview.

## Verificación local esperada

```text
container inexistente/vacío
  → local:db:up
  → local:db:migrate
  → local:db:seed
  → local:backend / local:dev
  → /livez 200, /readyz 200, Vite 200
  → db down: /livez 200, /readyz no-ready
  → db up: /readyz 200
```

Las suites PostgreSQL autoritativas de CI siguen siendo la evidencia Linux;
esta ruta local aporta feedback rápido y reproducible en macOS, no reemplaza
CI ni autoriza merge/deploy. Los resultados exactos de PBI-034 están
vinculados en su
[expediente de evidencia](../quality/evidence/pbi-034/README.md).
