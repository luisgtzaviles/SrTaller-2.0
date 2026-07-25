# Concurrencia

## Contratos

- Dos `verify()` simultáneos reciben el mismo promise y ejecutan un solo
  `pool.connect`/`select 1`.
- Un segundo verify después de `ready` es explícito y válido.
- `close()` durante verify cambia a `closing`, espera el verify aunque falle y
  después cierra.
- Dos `close()` simultáneos reciben el mismo promise.
- `close()` posterior a `closed` resuelve sin repetir trabajo.
- `verify()` en `closing` o `closed` falla con código estable.
- Un cliente adquirido siempre se libera en `finally`.

## Evidencia

Las pruebas unitarias usan barreras deterministas para observar exactamente un
connect/query/release. La suite PostgreSQL confirma pool max, cero waiters,
cliente idle tras verify y conteos cero tras close. No se usan sleeps para
ordenar la lógica productiva.
