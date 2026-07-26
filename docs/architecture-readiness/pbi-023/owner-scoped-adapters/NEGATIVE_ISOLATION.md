# Aislamiento negativo

| ID | Prueba material | Resultado |
|---|---|---|
| ISO-001/002 | tenant ausente, vacío o inválido | rechazo pre-query |
| ISO-003 | list con A y B | cada lista contiene sólo su tenant |
| ISO-004 | branch A consultada con B | `null`, sin enumeración |
| ISO-005 | payload tenant distinto del scope | rechazo pre-query |
| ISO-009/011 | tenant inexistente o scope incoherente | error tipado/FK |
| ISO-010 | mismo branch ID bajo A y B | ambas filas aisladas |
| ISO-012 | context repository reutilizado | rechazo tras release |
| ISO-013/014 | duplicate concurrente | resultado determinista, sin mezcla |
| ISO-015 | pool reutilizado | scope viaja en cada predicado |
| ISO-016 | list global | API ausente |
| ISO-017 | raw SQL | D5-R046 vigente |
| ISO-018 | tabla ajena | D5-R047 vigente |
| ISO-019 | FK/unique | salida sanitizada |
| ISO-020 | rollback | cero fila parcial |

ISO-006/007 (update/delete) no se ejecutan porque esas mutaciones no están
autorizadas ni expuestas. Su ausencia es verificada estáticamente. Un futuro
update/delete deberá agregarse con predicados tenant + branch y casos
negativos antes de autorizarse.

La anti-enumeración técnica usa el mismo resultado `null`/`false` para branch
inexistente y branch de otro tenant. No se realiza una query adicional por
`branchId`, no se expone otro tenant y no se afirma equivalencia criptográfica
de timing.
