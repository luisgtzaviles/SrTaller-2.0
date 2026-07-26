# Resultados PostgreSQL

## Entorno

- PostgreSQL: `18.4`;
- imagen: `sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf`;
- Node.js: `24.18.0`;
- bases y credenciales: sintéticas, efímeras y no registradas.

## Resultado

Dos ejecuciones preparatorias del runner oficial pasaron con 6 suites, 11
tests, 0 fallos y 0 skips críticos cada una. Cubrieron:

- connection, transaction, migration y schema;
- adapters owner-scoped;
- lifecycle e historia de Station;
- aislamiento tenant/branch;
- `up/down/reapply`;
- ambos órdenes efecto/revoke;
- relink concurrente y revisión stale;
- estaciones distintas sin bloqueo global;
- rollback y atomicidad del efecto;
- cleanup completo.

La evidencia autoritativa Linux se añadirá desde GitHub Actions sobre el SHA
publicado.
