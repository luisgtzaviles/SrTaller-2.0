# SPIKE-002 — Run 2

## Identidad

| Campo | Valor |
|---|---|
| timestamp UTC | `2026-07-25T03:30:50.136Z` |
| commit base | `2275416c92b5cb06d8182df50c3d121384ccc4db` |
| resultado | `PASS` |
| duración del harness | `2969 ms` |
| contenedor PostgreSQL efímero | `c1017a01f719` |
| exit code global | `0` |

Run-2 empezó después del cleanup completo de run-1. Las versiones, plataforma
y digests están en [ENVIRONMENT.md](ENVIRONMENT.md); E1–E12 pasaron según
[EXPERIMENT_MATRIX.md](EXPERIMENT_MATRIX.md).

## Métricas variables

| Prueba | Observado |
|---|---:|
| conexión inalcanzable | `601 ms` |
| migradores concurrentes | `873 ms` |
| waiter de lock | `508 ms` |
| agotamiento de pool | `402 ms` |

## Hashes

| Artefacto temporal | SHA-256 |
|---|---|
| resultado crudo sanitizado | `bae2bff4b442a5d38ce13ecd32727c0d4ebe5536c8f89543adb122f4b3cfd1f1` |
| resultado normalizado | `4363eaabb0dc994d33061f2abf2f6a861e94b2176c35eb50880e2ad01f246685` |
| ambiente | `60819f490191b0a891645599772929cfe0306772bb1e858e665b0c6406463232` |
| cleanup | `24de21c4328e27d60af72add5e5a2cc6e121c7023ae8df4fa50131713f8f1003` |
| estado de instalación | `f62e82d882d6a2ccbf1982592afa7681a0f18e3b0f7893e6db1d38a94e60464f` |

## Cleanup

Se verificaron cero contenedores, volúmenes y redes con label del run, cero
puertos publicados, archivo de credenciales ausente y directorio de ejecución
ausente.
