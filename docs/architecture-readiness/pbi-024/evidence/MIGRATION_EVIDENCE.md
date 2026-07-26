# Evidencia de migración

## Manifest

| Migración | SHA-256 |
| --- | --- |
| `20260725183832_database_create_tenants_and_branches.ts` | `fe90675625ea189387e5bcdb888ee6a38107a6395931b20e2873b0a83bd105e8` |
| `20260726160000_stations_create_stations_and_bindings.ts` | `3ea3fc0d3712e2b5911275c2a6752040d4216da58278e0daefdbfd8b03a17018` |

El provider descubre exactamente ambas migraciones en orden. PostgreSQL 18.4
verificó base vacía, `up`, `down` de la segunda migración y `reapply`, sin
drift y con cleanup.

`down` elimina primero `station_bindings` y después `stations`. No usa cascade
ni modifica Tenant/Branch.
