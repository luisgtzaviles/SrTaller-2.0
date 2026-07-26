# Comparación run-1 / run-2

## Resultado

**PASS — equivalencia material confirmada automáticamente.**

El comparador eliminó únicamente campos declarados variables y exigió
igualdad byte a byte para el resultado normalizado, el manifest de artefactos
y el cleanup normalizado.

| Comparación | Resultado | SHA-256 común |
|---|---|---|
| resultados normalizados | idénticos | `4363eaabb0dc994d33061f2abf2f6a861e94b2176c35eb50880e2ad01f246685` |
| fuente y build experimentales | idénticos | `3db9881017d66fd9139b2d69a5cdd4c24fd13abe8980d9dd9595b684375abab9` |
| cleanup normalizado | idéntico | `a29dc59f5a095b6892d4e23485db3ca80fbe2cb33742f1bebb0eed4be8cb0660` |

## Campos comparables

- commit base;
- versiones y digests;
- OS, arquitectura, libc, timezone y encoding;
- E1–E12 ejecutados y `PASS`;
- assertions y códigos de error esperados;
- orden de migraciones;
- constraints;
- semántica de transacción, lock, CRUD, aislamiento y pool;
- hashes de fuente, lockfile, configuración y build;
- cleanup sin residuos.

## Variables permitidas

- nombre del run;
- timestamp;
- duración global;
- ID del contenedor efímero;
- duraciones de timeout, lock, concurrencia y pool.

Las diferencias observadas se limitaron a esa lista.

## Secretos excluidos

Credencial, URL de conexión, variables completas y paths personales no
participan del artefacto preservado. Ambos resultados registraron cero
ocurrencias de la credencial real y de paths personales.

## Hash del comparador

El JSON de comparación generado tuvo SHA-256
`89e707faf28bc9b548d19a09f5fbfc8167012df2bd9f415c0156f9143ccb482c`.
