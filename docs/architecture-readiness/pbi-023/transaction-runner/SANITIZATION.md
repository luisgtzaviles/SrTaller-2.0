# Sanitización

`DatabaseTransactionError.toJSON()` y `util.inspect` exponen únicamente:

- nombre, código, categoría y mensaje fijo;
- retryability;
- fase;
- isolation y read-only;
- attempt fijo `1`;
- duración;
- `primaryCode` seguro cuando aplica.

No exponen SQL, parámetros, stack/cause del driver, host, database, user,
password, connection string, config ni tablas.

Las causas primaria/secundaria se guardan en campos privados ECMAScript y no en
`Error.cause`. Las pruebas inyectan connection strings y secretos sintéticos en
errores de callback, commit y rollback, y verifican ausencia en JSON e inspect.

El runner sanitiza sólo su error propio; no promete limpiar objetos arbitrarios
que un consumidor registre por separado.
