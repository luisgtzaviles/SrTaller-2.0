# Ownership

| Objeto/superficie | Owner | Writer futuro | Readers futuros | Scope | Creador |
| --- | --- | --- | --- | --- | --- |
| `tenants` | `tenancy` | adapter específico de tenancy | sólo consumidores autorizados por port | `tenant_id` | migración central Paso 9 |
| `branches` | `stations` | adapter específico de stations | sólo consumidores autorizados por port | `tenant_id`, `branch_id` | migración central Paso 9 |
| migración | `database` operacional | migration runner | status/manifest del runner | global técnico | PBI-023 |
| `kysely_migration*` | `database` | Kysely Migrator | migration runner | global técnico | Kysely |

Los adapters y readers son futuros; este paso sólo registra autoridad y
schema. Ningún módulo obtiene escritura sobre la tabla de otro.
