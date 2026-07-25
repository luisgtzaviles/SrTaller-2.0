# Enforcement de arquitectura

## D5-R045

La policy registra:

- config como `materialized-configuration`, consumida por connection;
- connection como `materialized-connection-facility`;
- owner `database`;
- cuatro exports exactos;
- consumer diferido únicamente hasta el transaction step.

La transición evita inventar un consumidor en `AppModule` o en un módulo de
negocio. Cualquier otro archivo, API o facility sin consumer continúa fallando
cerrado.

## D5-R046

Todo `query()` sobre un executor tipado se considera raw SQL. La única
excepción fuera de migraciones exige simultáneamente:

1. path exacto `database-connection.ts`;
2. función exacta `runConnectionVerification`;
3. receiver tipado `PoolClient`;
4. un solo argumento;
5. string literal exacto `select 1`.

Cambiarlo a `select 2`, moverlo, usar SQL dinámico o ejecutar otra query produce
D5-R046. El fixture negativo del probe alimenta la mutación aislada; el caso
positivo y la cobertura semántica también están registrados.

## Preservación

No cambiaron `AppModule`, bootstrap, módulos productivos, package graph,
workflow, Dockerfile de producto ni paths de migración. No existe import de
DB desde dominio/aplicación ni export de driver.
