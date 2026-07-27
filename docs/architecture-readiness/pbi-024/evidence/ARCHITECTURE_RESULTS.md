# Resultados de arquitectura

`pnpm run test:architecture` pasó 265/265.

El checker confirma:

- grafo `access → stations`, `access → tenancy`, `stations → tenancy`;
- Branch propiedad exclusiva de `tenancy`;
- Station y Binding propiedad exclusiva de `stations`;
- reexports públicos exactos y allowlisted;
- adapters registrados y consumidos por composición;
- scopes tenant/branch/station estructurales;
- ausencia de deep imports, driver leakage, HTTP y autoridad global;
- exactamente dos migraciones productivas gobernadas.

Policy SHA-256:
`ec578d6e3c4260a5fa31cd4010bce421b7315531268503148e6117595ec5b1fa`.
