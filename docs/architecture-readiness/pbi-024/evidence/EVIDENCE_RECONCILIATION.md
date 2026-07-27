# Reconciliación de evidencia de PBI-024

## Alcance y autoridad

Este registro remedia exclusivamente la integridad documental y las
autoprotecciones pendientes de la tercera verificación formal independiente.
No modifica `src/`, dominio, persistencia, migraciones, concurrencia,
lifecycle, las 25 mutaciones semánticas, workflow, dependencias ni alcance
funcional.

La evidencia distingue cuatro identidades:

| Identidad | SHA |
| --- | --- |
| implementación técnica causal | `2988bcdf362505776f7bc111e3d590aee358d2ce` |
| HEAD documental previo | `1587c328e18b9c177da45307409fc36f8551c26c` |
| remediación técnica de evidencia | `4e64e9729819bae930160f2c18443ddb70646bf0` |
| HEAD documental reconciliado | registrado por el envelope post-CI |

El HEAD documental reconciliado no puede declarar artifacts derivados de su
propio commit. Por eso el expediente usa un commit de material documental,
espera su CI y genera después un envelope documental que referencia el commit,
runs y artifacts ya inmutables.

## Hallazgo y causa del hash

El HEAD documental previo publicó:

`30f5728e70fd74ac1b1fed10d457c6c2d385356055578262671fb1735647d8c6`.

Los artifacts autoritativos registran:

`6e62a2b318e1b0c3067e6dea2715e1767e86f81ba422bc080ce65279de12c589`.

El generador `comparableStationMutationManifest` crea un objeto material con
baseline, contrato causal y resultados, retirando sólo `durationMs`, y calcula
SHA-256 sobre `JSON.stringify(material)`. El valor correcto se devuelve como
`materialSha256`.

La causa fue aplicar SHA-256 una segunda vez a
`JSON.stringify(comparableStationMutationManifest(manifest))`. La reproducción
sobre el mismo artifact produce exactamente el valor incorrecto al hashear el
objeto-resumen. No hubo divergencia entre artifacts.

El valor correcto se obtuvo dos veces mediante el generador versionado, sobre
bytes JSON parseados del `MUTATION_MANIFEST.json` autoritativo, con idéntico
resultado. Newline, pretty-print, timestamps y duración no participan en esa
identidad material.

El valor previo queda separado en
[history/INCORRECT_MATERIAL_HASH.md](history/INCORRECT_MATERIAL_HASH.md).

## Manifest schema 3

El manifest de reconciliación usa el contrato
`PBI-024/EVIDENCE-RECONCILIATION`, schema 3, y valida de forma fail-closed:

- branch y PR exactos;
- estado OPEN, Draft y bloqueo por DEC-051 C02;
- SHA técnico causal, HEAD documental previo y HEAD documental reconciliado;
- SHAs Git completos de 40 caracteres;
- timestamp UTC ISO-8601;
- Node.js, pnpm y PostgreSQL exactos;
- derivación y SHA-256 material de 64 caracteres;
- conteos causales y sus invariantes;
- runs push/pull_request y semántica del SHA probado;
- exactamente run-1, run-2 y comparison por run;
- IDs positivos, únicos y asignados al run correcto;
- digest de archive, hash material y hash de comparación;
- estado del PBI, C02, merge y dictamen.

No admite campos decorativos fuera del schema. Las pruebas negativas cubren
hash incorrecto o corto, SHAs ausentes, run o artifact ausente, ID duplicado,
asignación incorrecta, timestamp inválido, conteos inconsistentes, fallo
ajeno, versión desconocida y campo no validado. El validador separado acepta
un índice de artifacts reales y un `MUTATION_MANIFEST.json` real para
contrastar metadata y material.

## Autoprotecciones del harness

La ruta oficial ahora prueba dos fallos reales:

1. un `cleanupProbe` agrega un archivo al workspace temporal después de la
   ejecución; el inventario pre/post detecta contaminación, produce
   `CLEANUP_FAILURE`, `killed: false`, `causalMatch: false`, campaña rechazada
   y eliminación final del workspace;
2. un `cleanupProbe` inicia un proceso inocuo cuyo comando referencia el
   workspace; el runner lo detecta, intenta `SIGTERM`, escala a `SIGKILL` si
   fuese necesario, confirma cero procesos no-zombie y produce
   `CLEANUP_FAILURE`, `killed: false`, `causalMatch: false`.

Las pruebas atraviesan creación de workspace, mutación controlada, build/test,
cleanup y clasificación global. La contaminación se crea dentro del workspace
aislado para evitar interferir con campañas concurrentes del mismo checkout.

## Identidad anidada

El reporter ya no asigna `fullName: data.name`. Usa el `testId` emitido por
Node.js 24 para conservar ancestry, emite `suitePath` y construye:

`fullName = suitePath + test name`.

Los casos planos mantienen su nombre previo y los 35 targets existentes no
cambian. Fixtures separados cubren suite simple, suites anidadas, nombres
iguales en suites distintas, nombre igual en otro archivo, hook failure, suite
failure, test failure, estabilidad y orden determinista. Reporter, parser y
matcher comparten la identidad archivo + `fullName`.

## Nota de discovery

El archivo de prueba inexistente conserva `RESULT_PARSE_FAILURE`. La ruta
falla cerrada, nunca produce `killed: true` ni `causalMatch: true`, y cambiarla
no aporta seguridad causal suficiente para ampliar el alcance.

## Evidencia remota anterior preservada

| Fase | Evento | Run | Artifacts |
| --- | --- | ---: | --- |
| técnica causal | push | `30239752229` | `8643151064`, `8643166960`, `8643171055` |
| técnica causal | pull_request | `30239754842` | `8643162500`, `8643158764`, `8643166424` |
| documentación previa | push | `30283783382` | `8660539972`, `8660568536`, `8660578754` |
| documentación previa | pull_request | `30283783866` | `8660559451`, `8660566747`, `8660574400` |

Los 12 artifacts permanecían disponibles, fueron descargados, parseados y
revalidados. Todos declaran el material `6e62a2b3…`, 25/25 mutaciones
causalmente killed, PostgreSQL PASS, cleanup PASS y comparación equivalente.
El merge ref de cada evento pull request es sintético, no un merge real.

## CI de la remediación técnica

| Evento | Run | SHA head | Artifacts |
| --- | ---: | --- | --- |
| push | `30293577625` | `4e64e9729819bae930160f2c18443ddb70646bf0` | `8664367429`, `8664350627`, `8664376424` |
| pull_request | `30293579426` | `4e64e9729819bae930160f2c18443ddb70646bf0` | `8664365832`, `8664168156`, `8664373519` |

Ambos runs completaron run-1, run-2 y comparison en `SUCCESS`. Los seis
artifacts fueron descargados y sus validators confirmaron:

- SHA probado push:
  `4e64e9729819bae930160f2c18443ddb70646bf0`;
- merge ref sintético probado por pull_request:
  `fea78b8cb76889f71ad57081fd5b83d13210eeb7`;
- material:
  `6e62a2b318e1b0c3067e6dea2715e1767e86f81ba422bc080ce65279de12c589`;
- mutaciones: 25/25 causalmente killed;
- PostgreSQL: PASS;
- checkout final limpio;
- comparison: equivalente y sin diferencias;
- secretos y rutas personales: ausentes.

## Validación local

Con Node.js 24.18.0, pnpm 11.15.1 y PostgreSQL 18.4:

- instalación frozen: PASS;
- typecheck y build: PASS;
- suite completa: 431 total, 420 PASS, 11 skips ordinarios, 0 fallos;
- arquitectura: 265/265 PASS;
- `verify`: PASS;
- `smoke:start`: PASS;
- schema 3: 17/17 PASS;
- reporter/parser enfocados: 12/12 PASS;
- negativos A–J + contaminación + child residual: 14/14 PASS;
- campaña causal: 25/25, material
  `6e62a2b318e1b0c3067e6dea2715e1767e86f81ba422bc080ce65279de12c589`;
- PostgreSQL local run-1/run-2: 6 suites, 11 pruebas por corrida, 0 skips
  críticos, cleanup PASS;
- material PostgreSQL run-1/run-2: equivalente;
- whitespace: PASS.

## Secuencia sin referencia circular

1. Los commits técnicos agregan schema/validador, autoprotecciones e identidad
   anidada.
2. Su push produce CI y artifacts de remediación técnica.
3. Un commit de material documental corrige hashes, preserva historia y
   registra esa CI.
4. Su push produce CI y artifacts documentales finales.
5. Un envelope posterior regenera el manifest schema 3 y PBI-024 con el SHA,
   runs y artifacts del material documental ya inmutable.
6. La CI del envelope se verifica en vivo y se registra en el PR sin intentar
   autorreferenciarla dentro de su propio contenido.

## Gobierno

PBI-024 permanece en revisión y requiere nueva verificación formal
independiente. PR #3 permanece OPEN y Draft, sin aprobación ni merge.
DEC-051 C02 permanece
`Pending — external platform enforcement unavailable`; el merge funcional
continúa bloqueado. No se autoriza PBI-025–029, R1 ni despliegue.
