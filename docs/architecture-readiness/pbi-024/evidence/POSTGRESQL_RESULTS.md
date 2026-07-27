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
- relink concurrente real con dos conexiones/transacciones, ambos órdenes y
  revisión stale;
- traducción end-to-end de un `40001` real;
- estaciones distintas sin bloqueo global;
- rollback y atomicidad del efecto;
- cleanup completo.

Las ejecuciones Linux autoritativas push `30239752229` y pull_request
`30239754842` pasaron para el head
`2988bcdf362505776f7bc111e3d590aee358d2ce`: run-1 y run-2 ejecutaron el
mismo inventario, y los cuatro manifests PostgreSQL comparten
`16cfb89dd2b603a95f53683e9314c0fa4de835ff20330d6eef23f85c93ecfaa6`.

El evento pull_request validó el merge ref sintético
`dc93f154642f04ce6caebc3d6d12f1c8907147fa`; no hubo merge real.
