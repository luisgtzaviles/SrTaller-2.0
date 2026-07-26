# Tabla `tenants`

- Owner: `tenancy`.
- Rol: raíz global de cada tenant.
- PK: `tenants_pk (tenant_id)`.
- `tenant_id`: UUID no nulo, generado fuera de PostgreSQL.
- `created_at`: instante UTC `timestamptz`, no nulo y sin default.
- UK adicionales: ninguno.
- FK: ninguna.
- Checks adicionales: ninguno.
- Índice adicional: ninguno; la PK cubre identidad.

La tabla no expone delete funcional. La FK de `branches` usa `RESTRICT`, por
lo que un tenant con sucursales no se elimina accidentalmente.
