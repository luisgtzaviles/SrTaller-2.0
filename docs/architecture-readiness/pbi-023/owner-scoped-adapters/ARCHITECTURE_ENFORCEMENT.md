# Enforcement arquitectónico

## Reglas reutilizadas

| Regla | Control |
|---|---|
| D5-R037 | Kysely/pg sólo en roots autorizados |
| D5-R039 | prohíbe repositorio genérico/arbitrary table |
| D5-R040 | aplicación no importa infraestructura DB |
| D5-R041 | adapter coincide con owner, port y composición |
| D5-R043 | port no filtra driver/query builder |
| D5-R044 | cada operación del port exige scope estructural no opcional |
| D5-R045 | capability central tiene API/owner/consumers exactos |
| D5-R046 | no raw SQL ejecutable |
| D5-R047 | adapter sólo usa objetos de su owner |
| D5-R048 | transacción sólo mediante runner/capability |

No se creó D5-R054–R060: ownership, scope del port, driver leakage,
repositorio genérico, tabla ajena y barrel ya tienen enforcement equivalente.
La semántica tenant+branch se cubre además con firmas exactas, tests de fuente
y PostgreSQL negativo.

## Gap corregido en D5-R044

La regla ahora:

- inspecciona únicamente el contrato registrado del port, evitando que métodos
  de la clase de error sean confundidos con operaciones de persistencia;
- reconoce IDs nominales que son intersecciones de `string`.

No se deshabilitó ni relajó ninguna regla. Los scopes siguen requiriendo
propiedades readonly, no opcionales y nominalmente string-backed.

## Controles de producto

`architecture-owner-scoped-persistence.test.mjs` verifica registry exacto,
capability interna, scopes nominales, tablas literales y ausencia de API
global/dinámica/cross-owner. Las fixtures y mutaciones D5 anteriores siguen
verdes.
