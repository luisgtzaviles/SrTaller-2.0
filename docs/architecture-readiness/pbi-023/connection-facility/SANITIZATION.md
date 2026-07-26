# Sanitización

## Datos permitidos

La vista sanitizada contiene:

- estado;
- environment, role y access mode;
- SSL mode y application name;
- presencia booleana de host/database/user/password;
- min/max y conteos agregados del pool;
- timestamps de creación/verificación/cierre;
- código, categoría y retryable del último error.

## Datos prohibidos

No contiene host, database, user, password, connection string, certificados,
configuración cruda, query, parámetros, SQLSTATE, mensaje/stack/cause del
driver ni rutas locales.

## Evidencia

Las pruebas serializan con `JSON.stringify` y `util.inspect`:

- configuración con valores sintéticos identificables;
- errores de driver que incluyen host/user/password;
- `cause` anidada con una connection string;
- fallas de cierre con credenciales embebidas.

Las cadenas sensibles no aparecen y `DatabaseConnectionError` no conserva
`cause`. El harness Docker tampoco imprime variables ni comandos con password.
