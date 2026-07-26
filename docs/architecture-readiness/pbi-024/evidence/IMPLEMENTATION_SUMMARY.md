# Resumen de implementación

## Ownership y superficies

- `tenancy` es owner de Tenant, Branch, su port/adapter Kysely y
  `BranchEligibilityCapability`.
- `stations` es owner de Station, `stations`, `station_bindings`, lifecycle,
  recognition port y `TrustedStationContext`.
- la única dependencia funcional nueva es `stations → tenancy` por
  `tenancy/index.ts`;
- Kysely permanece en infraestructura y no se filtra por los ports;
- no se creó superficie HTTP.

## Materialización

- estados `Unlinked`, `Active` y `Revoked`;
- revisión monotónica y revocación terminal;
- link, unlink, relink explícito y cierre histórico del binding;
- reconocimiento consumido por puerto server-side;
- contexto congelado y emitido sólo por factory interna;
- resolver, guard transaccional y use cases de lifecycle;
- scopes compuestos por tenant en todos los adapters;
- composición Nest mínima sin endpoint funcional.

## Límites preservados

No se implementaron usuarios, PIN, sesiones, roles, capacidades, frontend,
Reparaciones, RLS, cache, offline, secretos, deploy ni producción.
