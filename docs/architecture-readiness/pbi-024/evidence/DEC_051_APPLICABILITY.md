# Aplicabilidad material de DEC-051

| Condición | Evidencia PBI-024 | Estado |
| --- | --- | --- |
| C02 | no existe protección efectiva de `main` ni prueba de rechazo | `Pending`, bloquea merge |
| C03 | PostgreSQL 18.4, lifecycle y cleanup | PASS material |
| C04 | aislamiento, negativas, concurrencia y mutaciones | PASS material |
| C05 | mapping interno sin API | parcial; no se declara satisfecha |
| C06 | ownership, constraints, transacción y rollback | PASS material |
| C09 | reglas, fixtures y mutaciones del checker | PASS material |

Un PR verde no satisface C02. No hay waiver, bypass ni autorización de merge.
