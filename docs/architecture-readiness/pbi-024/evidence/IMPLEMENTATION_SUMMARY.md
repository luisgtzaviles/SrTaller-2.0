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

## Remediación posterior a revisión

- harness real de mutación semántica sobre workspace temporal aislado;
- relink concurrente con dos conexiones/transacciones y ambos órdenes;
- errores PostgreSQL por código/operación/constraint con retryability
  preservada;
- diagnóstico técnico interno y salida pública sanitizada;
- validación fail-closed de `bindingRevision` antes de emitir confianza;
- defensa transaccional posterior conservada.

## Remediación causal posterior a segunda revisión

- reporter JSON determinista sobre `node:test`;
- parser estricto sin heurística de substring;
- identidad objetivo archivo + nombre completo;
- huella causal por código/tipo de fallo;
- clasificación exclusiva y muerte sólo por `EXPECTED_TEST_FAILURE`;
- baseline de inventario y targets;
- tests del parser y casos negativos reales A–J;
- regresión material del falso positivo;
- campaña 25/25 y artifacts autoritativos regenerados.

## Límites preservados

No se implementaron usuarios, PIN, sesiones, roles, capacidades, frontend,
Reparaciones, RLS, cache, offline, secretos, deploy ni producción.
