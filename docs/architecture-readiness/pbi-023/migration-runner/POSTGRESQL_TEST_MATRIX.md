# Matriz PostgreSQL 18.4

| Caso | Evidencia |
| --- | --- |
| status vacío | lista vacía, inmutable, sin journal |
| mutación vacía | journal estándar, cero resultados |
| latest A/B | orden lexicográfico, tablas probe y dos filas |
| re-run | cero resultados adicionales |
| up | A, luego B, luego no-op |
| fallo up | DDL rollback, cero fila, runner reutilizable |
| down inválido | ausente/hash incorrecto rechazados |
| down válido | sólo B revertida y journal coherente |
| production | down rechazado por default |
| sin down | schema/journal preservados |
| fallo down | transacción preserva schema/journal |
| drift | contenido cambiado rechazado antes de ejecución |
| lock | A ejecuta, B timeout, C continúa |
| release tras error | otra sesión obtiene/libera el lock |
| close durante ejecución | runner y connection drenan y cierran |
| ESM/NodeNext/dist | fixtures `.js` importadas por FileMigrationProvider desde build |
| cleanup | cero probes, journal, container o puerto |

El harness usa Node.js `24.18.0`, imagen oficial PostgreSQL `18.4` fijada por
digest, UTC, UTF8 default de la imagen, credenciales sintéticas, tmpfs y puerto
loopback dinámico. Ejecuta dos bases/containers limpios y compara un resultado
material sin IDs aleatorios.

Los tests permanecen gated skip en el suite ordinario porque el workflow actual
no autoriza PostgreSQL. Por ello DEC051-C03 continúa `Partial/Pending`; la
evidencia local real no se presenta como CI autoritativa.
