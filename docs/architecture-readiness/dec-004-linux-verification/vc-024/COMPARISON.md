# VC-024 — Comparación de ejecuciones

## Estado

`Pending — no comparable manifests`.

## Campos comparables

- commit y contrato;
- Linux, arquitectura y libc;
- toolchain exacto;
- hashes de inputs gobernados;
- comandos y exit codes;
- inventario, tamaño y SHA-256 de cada archivo de `dist/`;
- estado Git inicial/final;
- veredicto semántico.

IDs de job, duración, intento, ref y trigger son evidencia de ejecución, pero
no forman parte de la igualdad semántica.

## Resultado

- **Equivalentes:** No determinado.
- **Hash comparable run-1:** `TBD`.
- **Hash comparable run-2:** `TBD`.
- **Diferencias:** `TBD`.
