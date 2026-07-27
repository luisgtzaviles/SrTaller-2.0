# Resultados de aplicación

Las pruebas de aplicación verifican:

- composición completa e inmutable;
- resolución sólo desde reconocimiento server-side;
- categorías deterministas y colapso externo anti-enumeración;
- branch inexistente y cross-tenant rechazadas;
- integridad referencial fail-closed;
- `bindingRevision` menor o mayor que `station.revision` rechazada antes de
  emitir contexto;
- integridad persistida imposible separada de contexto previamente emitido
  stale;
- retryability de persistencia preservada hasta aplicación y contrato público;
- link, unlink, relink y revoke;
- guard de revisión vigente dentro de transacción;
- rollback del efecto fallido;
- rechazo de contexto forjado.

La factory no se invoca ante mismatch y no existe contexto parcial. El guard
posterior conserva revalidación independiente de Station, status, revisión,
binding, branch y elegibilidad.

Resultado: suite completa `PASS`.
