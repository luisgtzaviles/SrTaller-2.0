# Evidencia de materialización DEC-005

## Entorno

| Hecho | Valor |
| --- | --- |
| Rama | `main` |
| Commit base | `be1fe5a774b3437063b86e6ff16920131e502079` |
| Divergencia inicial | `HEAD...origin/main = 0 0` |
| Node.js | `24.18.0` |
| pnpm | `11.15.1` |
| TypeScript | `6.0.3` |
| Entorno objetivo | Local únicamente |

El working tree ya contenía el expediente documental de DEC-005/PBI-022 y la
primera verificación formal había registrado siete copias no versionadas de
SPIKE-009. Cinco copias exactas fueron retiradas durante esa revisión. En esta
remediación se compararon hash, diff, referencias, metadata y contenido de las
dos divergentes; se confirmaron como versiones locales obsoletas y se
eliminaron. Los originales canónicos no se modificaron.

## Ejecución histórica de primera remediación

Los siguientes conteos son evidencia histórica de la primera remediación. No
representan la suite vigente después de FV2/FV3. Todos se ejecutaron con la
toolchain exacta declarada por DEC-004.

| Comando | Exit | Resultado |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | `0` | Lockfile vigente; sin dependencias nuevas |
| `pnpm run typecheck` | `0` | Sin errores TypeScript |
| `pnpm run build` | `0` | JavaScript ESM y source maps generados |
| `pnpm run test:architecture` | `0` | 82/82 pruebas arquitectónicas |
| `node scripts/check-architecture.mjs --root . --fixture` | `0` | Grafo real conforme antes de exigir el expediente |
| `pnpm test` | `0` | 87/87 pruebas: 82 arquitectura y 5 baseline |
| `pnpm run verify:architecture` | `0` | Policy 1 y tres edges exactos |
| Coordinador de smoke | `0` | 10/10 órdenes, chunks, stderr, terminación, timeout y cleanup |
| `pnpm run smoke:start`, 25 corridas consecutivas | `0` | 25/25; marker, listener y shutdown verificados sin reintentos |
| `pnpm run verify` | `0` | Toolchain, clean, typecheck, build, 87 tests, estructura y arquitectura |
| Segunda corrida `pnpm run verify` | `0` | Mismo conjunto de gates y resultado PASS |
| Validador local de Markdown cambiado | `0` | 34 documentos; links relativos, anchors y fences válidos |
| `git diff --check` | `0` | Sin errores de whitespace |

## Ejecución histórica después de FV3

Estos conteos quedaron superseded por la remediación FV4, pero se preservan
como evidencia de la corrida que FORMAL4 auditó.

| Comando | Exit | Resultado |
| --- | --- | --- |
| `node --version` | `0` | `v24.18.0` |
| `pnpm --version` | `0` | `11.15.1` |
| `pnpm exec tsc --version` | `0` | `Version 6.0.3` |
| `pnpm install --frozen-lockfile` | `0` | Lockfile vigente; sin cambios |
| `pnpm run typecheck` | `0` | Sin errores TypeScript |
| `pnpm run build` | `0` | JavaScript ESM y source maps generados |
| `pnpm run test:architecture` | `0` | 113/113 pruebas arquitectónicas |
| `pnpm test` | `0` | 118/118 pruebas: 113 arquitectura y 5 baseline |
| `pnpm run verify:architecture` | `0` | Policy 1 y tres edges exactos |
| 12 adversariales temporales | `0` | 12/12; directos, aliases, namespaces, controles negativos y cleanup |
| Checker real, 20 corridas | `0` | 20/20; salida determinista |
| `pnpm run smoke:start`, 20 corridas | `0` | 20/20; marker, listener y shutdown sin reintentos |
| `pnpm run verify` | `0` | 118/118 y gates completos |
| Segunda corrida `pnpm run verify` | `0` | Mismo conjunto de gates y resultado PASS |
| `git diff --check` | `0` | Sin errores de whitespace |

## Ejecución canónica vigente después de FV4

| Comando | Exit | Resultado |
| --- | --- | --- |
| `node --version` con PATH de baseline | `0` | `v24.18.0` |
| `pnpm --version` | `0` | `11.15.1` |
| `pnpm exec tsc --version` | `0` | `Version 6.0.3` |
| `pnpm install --frozen-lockfile` | `0` | Lockfile vigente; sin dependencias nuevas |
| `pnpm run architecture` | `0` | Alias canónico a `verify:architecture` |
| `pnpm run typecheck` | `0` | Sin errores TypeScript |
| `pnpm run build` | `0` | JavaScript ESM y source maps generados |
| `pnpm run test:architecture` | `0` | 141/141 pruebas arquitectónicas |
| `pnpm test` | `0` | 146/146 pruebas: 141 arquitectura y 5 baseline |
| `pnpm run verify:architecture` | `0` | Policy 1 y tres edges exactos |
| Matriz parentetizada/wrappers | `0` | 50/50 focalizadas; directo, alias, namespace y controles positivos |
| Controles `global: true` ordinarios | `0` | Cuatro formas sin D5-R027 |
| AppModule/composición focalizada | `0` | 11/11 |
| Estructura focalizada | `0` | 19/19 |
| Paths y dos roots | `0` | 6/6; diagnósticos checkout-independent |
| Checker real, 20 corridas | `0` | Una salida; SHA-256 `f511df85afa559942b1e957536643e1927b7a9bacd08f7f81072850b155e2b89` |
| Smoke unitario | `0` | 10/10 |
| Smoke compilado | `0` | 20/20 |
| Inspección `dist/` | `0` | 10 JS, 10 maps, 0 extras, sin source embebido ni paths absolutos |
| `pnpm run verify` | `0` | 146/146 y gates completos |
| Segunda corrida `pnpm run verify` | `0` | Mismo conjunto de gates y resultado PASS |
| Links Markdown y whitespace | `0` | 333 documentos, 2733 enlaces relativos, fences y trailing whitespace conformes |
| `git diff --check` | `0` | Sin errores de whitespace |

## Ejecución canónica histórica después de FV5

| Comando | Exit | Resultado |
| --- | --- | --- |
| Reproducción previa en sandbox | `0` | El D5-R033 anterior aceptó 2/2 con un contrato D5-R025 duplicado y otro ID |
| Reproducción adversarial posterior | `1` esperado | D5-R033 identificó ambos IDs, regla, polaridad, path, hash de source/ejecución y causa |
| `pnpm install --frozen-lockfile` | `0` | Lockfile vigente; sin dependencias nuevas |
| `pnpm run architecture` | `0` | Policy 1, evidencia FV5 y tres edges exactos |
| `pnpm run typecheck` | `0` | Sin errores TypeScript |
| `pnpm run build` | `0` | JavaScript ESM y source maps generados |
| `pnpm run test:architecture` | `0` | 159/159 pruebas arquitectónicas |
| `pnpm test` | `0` | 164/164 pruebas: 159 arquitectura y 5 baseline |
| D5-R033 focalizado | `0` | 20/20: contrato/policy, normalizador, 6 mutaciones, 10 rechazos y 8 distinciones |
| Contratos semánticos | `0` | 26 IDs = 26 identidades canónicas |
| Fixtures | `0` | 98/98: 12 positivos y 86 negativos |
| Mutaciones de producto | `0` | 23/23 en 12 familias normativas |
| Mutaciones semánticas | `0` | 6/6 con rechazo y restauración SHA-256 |
| Checker real, 20 corridas | `0` | 20/20; una salida; SHA-256 `64bd1fb7391712d1c849354bbcfcec19c6d36e2861568d2464fe06d9afad19c1` |
| Smoke unitario | `0` | 10/10 |
| Smoke compilado | `0` | 20/20; una salida; SHA-256 `dc2b1ddf9f1c708514fdb1c8c2d6e6d3e7600dc1aa4bf977aaaeffa6ede24716` |
| Inspección `dist/` | `0` | 10 JS, 10 maps, sin extras, source embebido ni paths locales |
| `pnpm run verify` | `0` | 164/164 y gates completos |
| Segunda corrida `pnpm run verify` | `0` | Mismo conjunto de gates y resultado PASS |
| Links Markdown, whitespace y `git diff --check` | `0` | 342 archivos, 2756 enlaces relativos, 11 externos, 0 targets/fences inválidos y whitespace conforme |

## Incidencias corregidas

La primera ejecución de `test:architecture` obtuvo 38/39: la mutación de
`src/utils/value.ts` retiraba el archivo pero dejaba el directorio temporal
`src/utils/`, por lo que el checker seguía rechazándolo correctamente. Se
corrigió el teardown para retirar también ese root temporal. La repetición
obtuvo 39/39. No se relajó ninguna regla.

La verificación formal independiente posterior detectó falsos PASS para
archivos/directorios vacíos y composición ficticia de `AppModule`, ausencia de
cobertura D5-R029/D5-R036 y una carrera del smoke. El dictamen histórico se
preserva en [FORMAL_VERIFICATION.md](FORMAL_VERIFICATION.md). La remediación
añadió 22 fixtures (57 totales), cinco mutaciones (13 totales), validación AST
estructural/composición, separación de diagnósticos y un coordinador de smoke
probado. Las 14 regresiones manuales y sus restauraciones están en
[REMEDIATION.md](REMEDIATION.md).

La tercera verificación formal detectó que D5-R027/R029/R035/R036 reconocían
nombres textuales directos, pero no la identidad del símbolo cuando se
importaba con alias o namespace. La auditoría del mismo patrón extendió la
corrección compartida a D5-R025/R026. La evidencia, clasificación histórica de
conteos y alcance exacto están en
[FV3_REMEDIATION.md](FV3_REMEDIATION.md); el FAIL de
[FORMAL_VERIFICATION_3.md](FORMAL_VERIFICATION_3.md) se conserva sin cambios.

La cuarta verificación formal encontró wrappers AST transparentes que el
resolvedor compartido no desenvolvía, un detector D5-R027 demasiado amplio y
una brecha de cobertura D5-R033. La corrección central, las matrices, los
conteos y el alcance están en
[FV4_REMEDIATION.md](FV4_REMEDIATION.md). El FAIL de
[FORMAL_VERIFICATION_4.md](FORMAL_VERIFICATION_4.md) se conserva sin cambios.

La quinta verificación formal demostró que IDs distintos podían ocultar dos
contratos D5-R033 con la misma ejecución efectiva. La identidad canónica, su
reproducción previa/posterior, las mutaciones y los controles de no regresión
están en [FV5_REMEDIATION.md](FV5_REMEDIATION.md). El dictamen de
[FORMAL_VERIFICATION_5.md](FORMAL_VERIFICATION_5.md) se conserva byte-idéntico.

## Dictamen formal autoritativo

La [sexta reverificación formal independiente](FORMAL_VERIFICATION_6.md),
ejecutada el 2026-07-23, registró:

| Control | Resultado |
| --- | --- |
| Dictamen | `PASS — DEC-005 FORMALLY VERIFIED` |
| DEC005-C01 a DEC005-C05 | `PASS` |
| FV4-001, FV4-002, FV4-003 y FV5-001 | `CLOSED` |
| Nuevos hallazgos materiales | Ninguno |
| Observaciones bloqueantes | Ninguna |
| Suite arquitectónica | 159/159 |
| Suite total | 164/164 |

El dictamen es la autoridad para promover DEC-005 y cerrar PBI-022. No
autoriza R0, Sprint 00, persistencia, CI ni deploy.

## Diagnóstico conforme

```text
DEC-005 architecture verified (policy 1; edges access->stations, access->tenancy, stations->tenancy)
```

## Sanitización

La evidencia conserva comandos, versiones, resultados y paths relativos. No
contiene secretos, tokens, passwords, connection strings, datos productivos ni
rutas personales.

## Autoridad del resultado

La evidencia técnica acredita la materialización y la remediación FV5-001. La
[sexta reverificación formal independiente](FORMAL_VERIFICATION_6.md) acredita
el `PASS` formal vigente. DEC-005 queda `Accepted — Materialized / Formally
Verified` y PBI-022 queda `Done`; los gates posteriores conservan su autoridad.
