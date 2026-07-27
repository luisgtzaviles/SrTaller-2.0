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

Las ejecuciones Linux autoritativas push `30232400104` y pull_request
`30232401232` pasaron para el head
`e02f4acb84bf67cfa8683c0dfb0fffc202bdcd66`: run-1 y run-2 ejecutaron el
mismo inventario, y los cuatro manifests PostgreSQL comparten
`16cfb89dd2b603a95f53683e9314c0fa4de835ff20330d6eef23f85c93ecfaa6`.

El evento pull_request validó el merge ref sintético
`c63120cdd07aa88565cd05b42c389379ee29015c`; no hubo merge real.
