# Uso transaccional

## Operación ordinaria

La factory ordinaria recibe `DatabaseConnection`. La capability central:

1. verifica lazy si corresponde;
2. exige estado `ready`;
3. entrega al callback un executor tipado sólo con la tabla del owner;
4. contabiliza la operación para que close espere su finalización;
5. rechaza solapamiento con migración o transacción.

Queries ordinarias concurrentes sí pueden compartir el pool.

## Operación transaccional

Dentro de `runInTransaction`, la factory transaction-bound recibe el
`DatabaseTransactionContext`. La capability usa el executor ya ligado por el
runner; no abre otra transacción, no ofrece commit/rollback y no usa
`PoolClient`.

La suite prueba:

- create tenant con commit;
- create tenant y branch con rollback;
- lecturas de A/B en una misma transacción con scope explícito;
- cross-tenant retorna no encontrado;
- nesting rechazado por el runner;
- repository ligado a un contexto finalizado no puede reutilizarse.

El contexto técnico sólo aparece en la factory de infraestructura. No cruza
el puerto de aplicación ni el barrel público.
