# Política de skips PostgreSQL

## Regla

Los diez tests gated pueden seguir omitidos dentro de `pnpm test` cuando no
existe PostgreSQL real. En los jobs autoritativos, el orquestador ejecuta las
cinco suites explícitamente y valida:

- inventario exacto de cinco suites;
- al menos un test por suite;
- `pass === tests`;
- `fail`, `cancelled`, `skipped` y `todo` iguales a cero;
- total mínimo de diez tests;
- cleanup PASS por suite y global.

Por tanto, un comando que termina con código cero pero omite una suite no
puede producir manifest válido ni permitir la comparación.

## Resultado

| Métrica | Antes | Gate PostgreSQL |
|---|---:|---:|
| gated skips observables en test ordinario | 10 | permitidos fuera del gate |
| suites PostgreSQL críticas ejecutadas | 0 en CI | 5 por job |
| tests PostgreSQL ejecutados | 0 en CI | 10 por job |
| skips críticos | 10 | 0 |

## Failure injection

Los tests del workflow prueban contrato de imagen exacta, integración en ambos
runs, cleanup `always`, schema compatible y rechazo de manifests con suite
omitida, skip, cleanup fallido o material distinto. No se rompió la rama
remota para demostrar estas negativas.
