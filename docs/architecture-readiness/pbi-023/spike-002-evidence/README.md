# SPIKE-002 — Evidencia material PostgreSQL

## Dictamen

**PASS — SPIKE-002 MATERIAL VERIFICATION COMPLETE**

El 2026-07-25 UTC se ejecutaron dos corridas independientes desde cero contra
PostgreSQL real. E1–E12 pasaron mediante assertions automatizadas, la
comparación material pasó y cada corrida eliminó su contenedor, volumen, red,
credencial y directorio de ejecución.

Esta evidencia acredita el commit base
`2275416c92b5cb06d8182df50c3d121384ccc4db`. No es implementación productiva,
no instala dependencias en el repositorio y no satisface por sí sola
condiciones que exigen código productivo, CI, operación o release.

## Alcance

- laboratorio desechable fuera del repositorio;
- PostgreSQL `18.4` real en Linux `amd64`;
- Node.js `24.18.0`, pnpm `11.15.1` y TypeScript `6.0.3`;
- Kysely `0.29.4`, `pg` `8.22.0` y `@types/pg` `8.20.0`;
- ESM y resolución `NodeNext`;
- migraciones, transacciones, lock, CRUD, constraints, aislamiento,
  concurrencia, pool, reproducibilidad y cleanup;
- datos, nombres de base, usuario y credencial exclusivamente sintéticos.

## Mecanismo

Se usó Docker con imágenes oficiales fijadas por digest y plataforma
`linux/amd64`. Cada corrida creó una red, un volumen y un contenedor
PostgreSQL nuevos, sin publicar puertos al host. Un contenedor Node separado
instaló con lockfile experimental congelado y scripts deshabilitados, compiló
y ejecutó el harness.

Los scripts y el proyecto experimental vivieron sólo en un directorio
temporal. No se conservan como código importable: este expediente conserva
sus hashes, parámetros sanitizados, assertions y resultados.

## Índice

| Documento | Contenido |
|---|---|
| [ENVIRONMENT.md](ENVIRONMENT.md) | plataforma, versiones, imágenes y configuración |
| [EXPERIMENT_MATRIX.md](EXPERIMENT_MATRIX.md) | E1–E12 y assertions observadas |
| [RUN_1.md](RUN_1.md) | primera corrida limpia |
| [RUN_2.md](RUN_2.md) | segunda corrida limpia |
| [COMPARISON.md](COMPARISON.md) | equivalencia material |
| [CLEANUP.md](CLEANUP.md) | destrucción y ausencia de residuos |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | requisito a evidencia |
| [EVIDENCE_MANIFEST.json](EVIDENCE_MANIFEST.json) | manifest verificable y hashes |
| [RESULTS.md](RESULTS.md) | dictamen formal |

## Límites

- no se probó kill abrupto del daemon o del host;
- no se configuró un job CI persistente;
- no se probaron roles productivos separados;
- no se creó schema, migración ni adapter productivo;
- no se adoptó RLS ni un proveedor de despliegue.

## Lifecycle

El laboratorio se destruyó al finalizar. Las imágenes descargadas para la
ejecución también se eliminaron después de preservar esta evidencia. Sólo
estos documentos sanitizados tienen lifecycle versionado.
