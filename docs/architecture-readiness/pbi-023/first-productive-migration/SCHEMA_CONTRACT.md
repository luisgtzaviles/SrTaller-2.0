# Contrato de schema

## Migración

| Propiedad | Valor |
| --- | --- |
| Root | `src/infrastructure/database/migrations/` |
| Archivo | `20260725183832_database_create_tenants_and_branches.ts` |
| Timestamp | UTC, `2026-07-25 18:38:32` |
| Owner operacional | `database` |
| Tablas | `tenants`, `branches` |
| DML/seed | ninguno |
| Extensiones PostgreSQL | ninguna |

## Contrato exacto

| Tabla | Columna | Tipo PostgreSQL | Null | Default | Mutable por tipo |
| --- | --- | --- | --- | --- | --- |
| `tenants` | `tenant_id` | `uuid` | no | ninguno | no |
| `tenants` | `created_at` | `timestamptz` | no | ninguno | no |
| `branches` | `tenant_id` | `uuid` | no | ninguno | no |
| `branches` | `branch_id` | `uuid` | no | ninguno | no |
| `branches` | `created_at` | `timestamptz` | no | ninguno | no |

Los UUID y timestamps se suministran desde la futura operación owner-scoped.
No se introduce generación implícita, reloj de base de datos ni extensión.

## Exclusiones deliberadas

No existen `name`, `slug`, `status`, `updated_at`, soft delete, usuarios,
credenciales, reparaciones, roles ni configuración comercial.
