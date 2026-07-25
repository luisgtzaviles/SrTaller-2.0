# Matriz de mutaciones PBI-023

| Regla | Cambio único | Diagnóstico esperado | Neutralizada | Restaurada |
| --- | --- | --- | --- | --- |
| D5-R037 | import Kysely en application | sólo D5-R037/path exacto | cero | PASS |
| D5-R038 | export global `db` | sólo D5-R038/path exacto | cero | PASS |
| D5-R039 | generic repository renombrado | sólo D5-R039/path exacto | cero | PASS |
| D5-R040 | import local de facility | sólo D5-R040/path exacto | cero | PASS |
| D5-R041 | adapter no registrado | sólo D5-R041/path exacto | cero | PASS |
| D5-R042 | migration dispersa | sólo D5-R042/path exacto | cero | PASS |
| D5-R043 | alias de driver en port | sólo D5-R043/path exacto | cero | PASS |
| D5-R044 | método sin scope estructural | sólo D5-R044/path exacto | cero | PASS |
| D5-R045 | infra no registrada | sólo D5-R045/path exacto | cero | PASS |
| D5-R046 | `sql` tagged por alias | sólo D5-R046/path exacto | cero | PASS |
| D5-R047 | tabla de otro owner | sólo D5-R047/path exacto | cero | PASS |

El runner ejecuta el árbol permitido, dos veces el mutado, el mutado con una
sola regla neutralizada y el restaurado. `disabledRules` falla si
`fixture !== true` y no está expuesto por el CLI; no constituye bypass de
producto.

Conteos vigentes: 23 mutaciones históricas + 11 PBI-023 = **34 mutaciones de
producto**. Las seis mutaciones del metacontrato D5-R033 permanecen separadas.
