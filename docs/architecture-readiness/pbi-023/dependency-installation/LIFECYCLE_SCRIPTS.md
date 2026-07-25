# Revisión de lifecycle scripts

## Decisión de instalación

No se usó `--ignore-scripts` porque el repositorio tiene un `preinstall`
propio que verifica Node.js, pnpm, contexto y política de lockfile. Saltarlo
habría debilitado un control aceptado. La inspección previa y posterior
confirmó que ninguno de los dieciséis paquetes nuevos del cierre declara:

- `preinstall`;
- `install`;
- `postinstall`;
- `prepare`;
- `bin`;
- `gypfile`;
- metadata de binario nativo.

Por ello no era necesaria una allowlist ni una aprobación de build de
terceros. No se ejecutó `pnpm approve-builds`.

## Resultado por paquete

| Paquete(s) | Lifecycle | Binario/nativo | Estado |
|---|---|---|---|
| `kysely@0.29.4` | ninguno | ninguno | permitido; sin ejecución de terceros |
| `pg@8.22.0` | ninguno | ninguno | permitido; sin ejecución de terceros |
| `@types/pg@8.20.0` | ninguno | ninguno | permitido; sin ejecución de terceros |
| trece transitivas nuevas | ninguno | ninguno | permitido; sin ejecución de terceros |
| `pg-native` | no instalado | no aplica | peer opcional ausente |

El único lifecycle visible fue el `preinstall` propio del repositorio:
`node ./scripts/verify-install-context.mjs`. Terminó con
`DEC-004 install context verified` en ambas instalaciones frozen.

`pnpm ignored-builds` emitió un diagnóstico no concluyente que no identificó
ningún paquete. No se usó como prueba positiva; el dictamen se apoya en los
manifests publicados y en los `package.json` efectivamente resueltos.

## Dictamen

**PASS.** No hubo script de tercero permitido, bloqueado, pendiente o aprobado
silenciosamente. La política de instalación permaneció fail-closed.
