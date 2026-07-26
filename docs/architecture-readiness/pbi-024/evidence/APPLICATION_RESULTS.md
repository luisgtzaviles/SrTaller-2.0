# Resultados de aplicación

Las pruebas de aplicación verifican:

- composición completa e inmutable;
- resolución sólo desde reconocimiento server-side;
- categorías deterministas y colapso externo anti-enumeración;
- branch inexistente y cross-tenant rechazadas;
- integridad referencial fail-closed;
- link, unlink, relink y revoke;
- guard de revisión vigente dentro de transacción;
- rollback del efecto fallido;
- rechazo de contexto forjado.

Resultado focal: 8/8 casos de aplicación `PASS`.
