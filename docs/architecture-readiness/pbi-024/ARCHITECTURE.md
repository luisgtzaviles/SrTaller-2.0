# Arquitectura propuesta de PBI-024

## Objetivo y nomenclatura

PBI-024 entrega la fundación confiable de `tenant + branch + station`.
ADR-010 reserva el contexto operativo completo para
`tenant + branch + station + usuario`. Para evitar una afirmación falsa, el
tipo público de este PBI será conceptualmente:

```ts
type TrustedStationContext = Readonly<{
  tenantId: TenantId;
  branchId: BranchId;
  stationId: StationId;
  stationRevision: number;
  source: 'server-verified-station';
}>;
```

`resolvedAt`, `correlationId`, `actorId` y `sessionId` no pertenecen a este
contrato: tiempo queda en PBI-027, correlación en PBI-028 y actor/sesión en
PBI-025. La revisión vigente, no un timestamp, demuestra frescura.

## Modelo conceptual

### Tenant

| Elemento | Decisión |
| --- | --- |
| Identificador | `TenantId` UUID canónico existente; **Required** |
| Estado para resolver | existencia autoritativa; **Required** |
| Lifecycle comercial/suspensión | **Deferred** a DEC-069; no se inventa |
| Fuente | `TenantRepositoryPort`, nunca request/payload |
| Invariantes | un scope ordinario siempre tiene tenant; ID conocido no autoriza |

### Branch

| Elemento | Decisión |
| --- | --- |
| Identificador | `BranchId` UUID canónico existente; **Required** |
| Tenant propietario | `tenant_id` + PK/FK existente; **Required** |
| Estado mínimo | existencia y pertenencia autoritativas; **Required** |
| Lifecycle comercial completo | **Deferred**; no es necesario para esta slice |
| Relación con station | una única vinculación abierta por station |
| Invariantes | se carga por `(tenantId, branchId)`; nunca por branch aislada |

ADR-010 usa “branch activa”. PBI-024 interpreta de forma mínima que una branch
existente y no retirada por un contrato posterior es elegible. Añadir estados
comerciales o de suspensión sin DEC propia queda rechazado para esta slice.

### Station

| Campo/concepto | Clasificación | Ubicación y razón |
| --- | --- | --- |
| `stationId` | **Required** | `stations`; identidad opaca server-issued |
| `tenantId` | **Required** | `stations`; propietario inmutable |
| `branchId` | **Required cuando Active** | vínculo abierto en `station_bindings`, no copia mutable |
| `status` | **Required** | `Unlinked`, `Active`, `Revoked` |
| `revision` | **Required** | control optimista y contexto stale |
| `createdAt`/`updatedAt` | **Required** | lifecycle técnico |
| `linkedAt`/`unlinkedAt` | **Required** | historial en `station_bindings` |
| `revokedAt` | **Required cuando Revoked** | `stations` |
| fingerprint | **Rejected como autoridad** | clonable/inestable; señal futura sólo con privacy review |
| installation ID adicional | **Rejected** | duplica `stationId` sin consumidor |
| metadata genérica | **Rejected** | no existe consumidor autorizado |
| motivo de revocación | **Deferred** | auditoría/política PBI-028; no payload libre |
| actor de lifecycle | **Deferred** | PBI-026/PBI-028; no se falsifica en PBI-024 |

## Persistencia propuesta

### Tabla `stations`

- owner lógico: `stations`;
- PK compuesta: `(tenant_id, station_id)`;
- columnas: `tenant_id`, `station_id`, `status`, `revision`, `created_at`,
  `updated_at`, `revoked_at`;
- `tenant_id` referencia `tenants` con `RESTRICT`;
- `status` usa allowlist cerrada;
- `revision` es entero positivo y aumenta en toda transición;
- `revoked_at` es obligatorio sólo para `Revoked`;
- no delete funcional, soft delete, secreto, fingerprint ni metadata.

### Tabla `station_bindings`

- owner lógico: `stations`;
- PK: `(tenant_id, station_id, binding_revision)`;
- FK compuesta a `stations`;
- FK compuesta `(tenant_id, branch_id)` a `branches`;
- columnas: `tenant_id`, `station_id`, `binding_revision`, `branch_id`,
  `linked_at`, `unlinked_at`;
- un índice unique parcial permite como máximo una fila con
  `unlinked_at IS NULL` por station;
- una vinculación cerrada es inmutable;
- no contiene actor, motivo o secreto hasta tener owner y consumidor.

Dos tablas son imprescindibles: sobrescribir `branch_id` en `stations` perdería
la historia que ADR-010 exige al reubicar.

La migración futura será owner `stations`, tendrá `up`/`down`, manifest y
cleanup gobernados por DEC-050. No se escribió SQL en este refinamiento.

## Capas y contratos

```text
trusted ingress adapter
        │ verified evidence
        ▼
stations/application/resolve-trusted-station-context
        │ ports
        ├── StationRecognitionPort
        ├── StationRepositoryPort
        ├── BranchRepositoryPort (interno existente)
        └── TransactionRunner
        ▼
stations/infrastructure/persistence
        ├── KyselyStationRepository
        └── KyselyStationBindingRepository
```

Paths previstos:

- `src/modules/stations/domain/station.ts`;
- `src/modules/stations/application/contracts/trusted-station-context.ts`;
- `src/modules/stations/application/ports/station-recognition.port.ts`;
- `src/modules/stations/application/ports/station-repository.port.ts`;
- `src/modules/stations/application/use-cases/resolve-trusted-station-context.ts`;
- `src/modules/stations/infrastructure/persistence/kysely-station.repository.ts`;
- migración owner `stations` bajo el root gobernado existente.

No se crean `BaseRepository`, `RequestContext`, `AsyncLocalStorage`, módulo
global, deep import, Nest en dominio/aplicación ni controller.

## Superficie pública

`src/modules/stations/index.ts` podrá exportar solamente:

- `StationId` y parser;
- `TrustedStationContext`;
- capacidad `ResolveTrustedStationContext`;
- capacidad `AssertTrustedStationContextCurrent`.

No exportará entidades, repositorios, records Kysely, adapters, estados
mutables o transaction handles. `access` consume sólo ese barrel; el grafo
`access → stations → tenancy` no cambia.

Link, unlink y revoke permanecen internos y sin wiring productivo hasta que
PBI-026 aporte autorización administrativa. PBI-024 materializa sus invariantes
y persistencia para probar lifecycle y revocación, no una vía pública de
administración.

## Fuente confiable

El resolver no acepta `stationId`, `tenantId` o `branchId` crudos. Recibe una
evidencia opaca producida por `StationRecognitionPort`, cuyo adapter futuro:

1. valida una credencial server-issued;
2. resuelve `tenantId + stationId` desde estado server-side;
3. no devuelve secreto, hash o input original;
4. falla cerrado ante ausencia, revocación técnica o configuración inválida.

PBI-029 decide fuente, protección, rotación y revocación de esa credencial. En
PBI-024 sólo existen el puerto, fake sintético y pruebas; no hay fallback a
header, hostname, body, query o local storage.

## Construcción y vigencia

1. El borde verifica evidencia técnica.
2. Aplicación inicia la unidad transaccional.
3. El repository carga station por `(tenantId, stationId)`.
4. Exige status `Active`.
5. Carga exactamente un binding abierto.
6. Carga branch por `(tenantId, branchId)`.
7. Construye y congela `TrustedStationContext`.
8. El consumidor revalida `stationRevision` dentro de la misma transacción
   antes del efecto.
9. El contexto expira al finalizar la unidad de trabajo; no se cachea.

Las capas de dominio/aplicación pueden leerlo. Presentación no lo construye;
infraestructura sólo aporta evidencia traducida. Repositorios de otros módulos
reciben scope derivado, nunca payload.

## Concurrencia y revocación

Se selecciona optimistic concurrency:

- link/unlink/revoke usan `expectedRevision`;
- el update condiciona tenant, station, estado y revision;
- éxito incrementa revision una vez;
- cero filas produce `Concurrency`;
- el resolver devuelve la revision leída;
- `AssertTrustedStationContextCurrent` revalida status, vínculo y revision en
  la transacción del caso de uso;
- no hay cache en PBI-024;
- serialización/deadlock sólo admite retry de unidad completa idempotente.

Si revoke confirma antes de revalidar, la operación falla. Si una operación
revalida y confirma antes de revoke, conserva el contexto histórico anterior y
revoke gobierna operaciones posteriores. No se promete cancelar efectos ya
confirmados.

## Jobs y ejecución sin HTTP

Un job no sintetiza contexto global. Conserva un envelope de origen
`tenantId/branchId/stationId/stationRevision`, lo trata como candidato y vuelve
a validarlo por la capacidad pública. El formato del envelope, actor,
correlación e idempotencia pertenecen a PBIs posteriores. PBI-024 sólo prueba
que ausencia o revision stale deniegan.

## Wiring

La implementación futura puede componer repositories y resolver dentro de
`StationsModule`, con factories Nest en el borde. `AppModule` seguirá siendo
sólo composition root. No habrá endpoint ni consumer de negocio en este PBI;
las pruebas de aplicación y PostgreSQL serán el consumidor autorizado inicial.
