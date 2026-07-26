# Enforcement arquitectónico

## D5-R048

Exige frontera transaccional explícita, owner-internal y sin control manual.
Detecta:

- `async_hooks`/`node:async_hooks` por import directo, alias, namespace,
  reexport, type import e import dinámico;
- consumo de capability interna fuera de connection/runner;
- consumo del runner desde startup, controller, dominio o aplicación;
- `startTransaction`, commit, rollback y savepoints manuales dentro de database.

Cobertura:

- fixture PASS de topology registrada;
- control positivo de shadowing local;
- fixtures FAIL para todas las formas anteriores;
- mutación aislada D5-R048;
- doble ejecución determinista;
- neutralización prohibida en producción.

D5-R037–D5-R047 permanecen activos sin relajación. D5-R045 registra API y
consumidores exactos; D5-R038 evita capability global; D5-R046 conserva SQL
fuera de runtime excepto probe y migraciones futuras autorizadas.

El estado vigente es 144 fixtures, 35 mutaciones de producto y 54 contratos
semánticos críticos. No existe excepción arquitectónica.
