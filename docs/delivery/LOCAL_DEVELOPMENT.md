# Desarrollo local de SR Taller 2.0

## Estado del documento

- **Estado:** Contrato operativo vigente para `Local development`.
- **Datos:** únicamente sintéticos y desechables; no se conecta a Preview.
- **Toolchain:** Node.js `24.18.0`, pnpm `11.15.1`, Docker Desktop y
  PostgreSQL `18.4`.
- **Próxima revisión:** al cambiar el contrato `SR_DB_*`, el esquema inicial o
  los puertos locales.

Este documento materializa el ciclo local sin crear una segunda arquitectura
de aplicación. La base se reconstruye desde PostgreSQL vacío, las migraciones
integradas y un seed mínimo. Docker CLI se usa directamente para conservar una
topología pequeña y portable; no se añade Docker Compose ni una dependencia de
multiplexación.

## Límites y seguridad

- Local, Preview, Staging y Production tienen bases, volúmenes y credenciales
  distintas.
- No se copian bases, dumps ni secretos de Preview.
- No se ejecuta ninguna migración, seed o reset contra Dokploy.
- No se crean tablas de clientes, usuarios, roles o pagos. Las slices locales
  materializan Reparaciones, intake, timeline, evidencia, asignación técnica y
  el historial acotado D6.1; no materializan Location, writes de Custody ni el
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
pnpm run local:db:seed
pnpm run local:dev
```

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
`.env.local` y sólo contiene claves `SR_LOCAL_*`. Los scripts derivan todas las
variables del contrato `SR_DB_*` en memoria para la operación concreta; no se
introduce `DATABASE_URL` ni se pasan valores de conexión por URI.

El guard fail-closed rechaza hosts remotos, ambientes distintos de `local`,
puertos alternos, nombres de base distintos, variables `SR_DB_*` persistidas en
`.env.local` y cualquier alias de `libpq`.

## Migraciones

```sh
pnpm run local:db:migrate
```

El comando compila el artefacto si falta `dist/db-migrate.js`, ejecuta
exclusivamente las migraciones integradas con el rol `migration`, verifica el
manifest/journal mediante el runner existente y concede al rol `application`
los permisos mínimos sobre las tablas creadas. No se ejecuta en bootstrap HTTP.

La baseline crea `tenants` y `branches`. La cadena local de Reparaciones añade
`repairs` para Worklist, `repair_intakes` para D1,
`repair_timeline_entries` para D2/D3 y `repair_attachments` para D4, más la
restricción de idempotencia de notas operativas, las tablas D5 de técnicos y
asignación, y `repair_workflow_transitions` para D6.1. Esta última conserva un
historial append-only y sólo admite `pending → diagnosing`. No se inventan
tablas de clientes, pagos ni otros módulos funcionales.

## Seed sintético V1

```sh
pnpm run local:db:seed
```

El seed usa el rol `application`, una transacción y upserts idempotentes. Crea
un tenant técnico sintético, dos sucursales sintéticas y 15 reparaciones
sintéticas mediante UUIDs fijos y fechas deterministas. También materializa
intakes, timeline y referencias de evidencia sintéticas para D1, D2 y D4, el
catálogo/asignaciones D5 y transiciones D6.1 deterministas para fixtures que ya
se muestran en diagnóstico. Los datos de cliente son snapshots dentro de
`repairs`; no existe una tabla de clientes ni se agregan importes o pagos.

## Reset y parada

```sh
pnpm run local:db:down
pnpm run local:db:reset
```

`local:db:down` detiene el container y conserva el volumen. `local:db:reset`
es **DESTRUCTIVE — LOCAL ONLY**: elimina únicamente el container etiquetado y
el volumen `srtaller-postgres-local-data`, lo recrea y ejecuta en orden
`up → migrate → seed`. Se niega antes de tocar cualquier target que no cumpla
el contrato local.

## Backend y frontend

El backend local arranca con `SR_DB_ROLE=application` y expone:

- `GET http://127.0.0.1:3000/livez` — 200 mientras el proceso está vivo;
- `GET http://127.0.0.1:3000/readyz` — 200 con DB, journal y schema listos;
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
- al apagar PostgreSQL, `/livez` puede seguir 200 y `/readyz` debe fallar
  conforme al contrato de health.

Vite conserva HMR y sirve el frontend en
`http://127.0.0.1:4173`. Sólo el servidor Vite en modo `local` añade proxy
para `/api`, `/livez` y `/readyz` hacia el backend local. El build de Preview y
el runtime OCI no cambian.

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
CI ni autoriza merge/deploy.
