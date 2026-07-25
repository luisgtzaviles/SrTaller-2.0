# Sanitización

`DatabaseMigrationError.toJSON()` y `util.inspect` exponen únicamente campos
allowlisted. La causa queda en un private field y nunca se serializa.

Se prohíbe exponer:

- connection string, host, database, user o password;
- variables de ambiente;
- SQL o parámetros;
- path absoluto o personal;
- source completo;
- stack o mensaje crudo de driver/migración.

Las pruebas inyectan mensajes sintéticos con password y path privado tanto en
`up` como `down`, además de error anidado con connection string. JSON e inspect
no contienen esos valores.

Status usa root normalizado sólo dentro del manifest interno y su respuesta
pública no incluye roots. Los hashes son del artefacto y no son secretos.
Nombre de migración y environment/role son metadata administrativa permitida.

El harness imprime sólo versión Node/PostgreSQL, digest de imagen, número de
runs, hash de comparación y estados PASS.
