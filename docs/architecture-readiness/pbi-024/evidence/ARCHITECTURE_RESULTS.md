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
`ed253a9e561c37396012f84eacb4c3ee8a2812b35d303e4c047cb6764f67d729`.
