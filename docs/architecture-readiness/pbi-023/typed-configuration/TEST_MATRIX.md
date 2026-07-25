# Matriz de pruebas

| Suite | Cobertura |
|---|---|
| `persistence-config.test.mjs` | ambientes, roles, límites, faltantes, formatos, combinaciones y aislamiento test |
| sanitización | JSON, inspect, escapes/newline/control, errores sin secreto |
| inmutabilidad | freeze raíz/anidados, input intacto, referencias independientes |
| TypeScript | mutaciones marcadas `@ts-expect-error` y compilación estricta |
| no red | intercepta net connect/createConnection y DNS lookup/resolve |
| `architecture-persistence-config.test.mjs` | pureza, API, owner, process.env y ausencia de imports |
| fixtures D5-R045 | excepción positiva estrecha + facility ordinaria sin consumer FAIL |
| mutaciones D5-R037–R047 | detección y restauración existentes |

## Casos property-like

Las listas deterministas cubren enteros parciales, exponentes, signos, leading
zero, espacios, NaN, Infinity, Unicode full-width, infinito Unicode, negativos,
máximos y overflow de safe integer. No existe aleatoriedad ni seed oculta.

## Determinismo

El parser y sanitizer se ejecutan repetidamente. Los fixtures y checker se
ejecutan dos veces y comparan diagnósticos. Los gates completos se ejecutan en
dos ciclos antes del cierre.
