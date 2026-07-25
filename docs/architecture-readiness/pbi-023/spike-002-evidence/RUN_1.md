# SPIKE-002 — Run 1

## Identidad

| Campo | Valor |
|---|---|
| timestamp UTC | `2026-07-25T03:30:16.658Z` |
| commit base | `2275416c92b5cb06d8182df50c3d121384ccc4db` |
| resultado | `PASS` |
| duración del harness | `3009 ms` |
| contenedor PostgreSQL efímero | `6b293c52e75c` |
| exit code global | `0` |

Las versiones, plataforma y digests están en
[ENVIRONMENT.md](ENVIRONMENT.md). E1–E12 pasaron según
[EXPERIMENT_MATRIX.md](EXPERIMENT_MATRIX.md).

## Métricas variables

| Prueba | Observado |
|---|---:|
| conexión inalcanzable | `606 ms` |
| migradores concurrentes | `831 ms` |
| waiter de lock | `510 ms` |
| agotamiento de pool | `402 ms` |

## Hashes

| Artefacto temporal | SHA-256 |
|---|---|
| resultado crudo sanitizado | `75c4dd48232a0b5ff1c1a548d0bfcf871289e85319fdc931bb4f68a19874cbc6` |
| resultado normalizado | `4363eaabb0dc994d33061f2abf2f6a861e94b2176c35eb50880e2ad01f246685` |
| ambiente | `6381fd23a3c3ef511698a3428f9b1cfe9685f8a73c6a61cdcab9840f366b2c16` |
| cleanup | `df0aa068f404bbb3babcb14fef12fec6c4abf0791dda0c4c9f3ecda06c705c18` |
| estado de instalación | `f62e82d882d6a2ccbf1982592afa7681a0f18e3b0f7893e6db1d38a94e60464f` |

## Cleanup

Se verificaron cero contenedores, volúmenes y redes con label del run, cero
puertos publicados, archivo de credenciales ausente y directorio de ejecución
ausente antes de iniciar run-2.
