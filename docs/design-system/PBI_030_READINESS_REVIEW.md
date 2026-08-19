# PBI-030 — Readiness Review

## Estado y alcance

- **Fecha de revisión:** 2026-08-18.
- **Baseline inicial revisada:** `main` en
  `18dab5a017e5db308b5d34f3a3fbd8f86351c818`.
- **Baseline técnica posterior:** `main` en
  `efd9ec05d02af604c2d9ea18d4636c1539f8dc54`, con CI autoritativo verde.
- **Baseline final evaluada:** `main` en
  `a8f230214b592389894e25545583988c2c2edc3e`, con CI autoritativo verde.
- **Resultado:** `Ready`.
- **Estado PBI:** `Ready`.
- **Implementación:** no iniciada y no autorizada.
- **Alcance de esta revisión:** cerrar el refinamiento técnico y documental,
  evaluar la Definition of Ready y preparar una decisión Owner sin materializar
  UI Foundation ni Application Shell.

Los contratos de iconografía, acento, catálogo, compatibilidad y partición
quedan definidos por esta revisión. No equivalen a implementación ni a
evidencia de Done. El Owner aprobó `lucide-react` el 2026-08-18 exclusivamente
para su incorporación durante la implementación de PBI-030. Existe una
[estimación técnica `XL` acordada](PBI_030_ESTIMATION_PROPOSAL.md) por la
función Frontend/Ingeniería dentro de la autoridad expresamente solicitada para
esta revisión. El Owner autorizó la integración de PR #5; el merge
`efd9ec05` quedó en `main` y su run autoritativo `32199570584` terminó verde.
La reconciliación documental posterior quedó en `a8f2302` y su run
`32201164615` terminó verde. No quedan bloqueos de readiness.

**Implementation authorization pending Owner approval.**

## 1. Precheck

| Campo | Resultado observado al iniciar |
|---|---|
| Rama | `main` |
| HEAD | `18dab5a017e5db308b5d34f3a3fbd8f86351c818` |
| Upstream | `origin/main` |
| Divergencia | `0 ahead / 0 behind` |
| Staged | ninguno |
| Working tree | ya contenía cambios documentales locales y archivos nuevos; se preservaron |
| Node del host | `v25.9.0`; no se usó como runtime gobernado |
| pnpm del host | `11.15.1` |
| Runtime requerido | Node `24.18.0`, pnpm `11.15.1` |
| Runtime de validación técnica | imagen Node gobernada `node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d` |

Los archivos de entrada, la política de contribución, Definition of Ready,
Definition of Done, estrategia de ambientes/despliegue y estado Git fueron
leídos antes de modificar el candidato. Ningún cambio preexistente se borró,
normalizó o descartó.

## 2. Gate de iconografía

### Inventario y comparación

El repositorio no contiene una librería de iconos instalada. La Preview usa
SVG inline escritos a mano y caracteres como `◎`, `⌕`, `!`, `▤` y `···`;
por tanto, no existe una opción ya adoptada que sea preferible conservar.

`lucide-react@1.32.0` es técnicamente adecuado como propuesta:

- declara compatibilidad peer con React hasta `19`, incluida la versión de la
  baseline;
- ofrece imports ESM/CJS, `sideEffects: false` e imports nombrados que permiten
  tree-shaking;
- cada icono es SVG stroke configurable mediante `size`, `color`,
  `strokeWidth` y props SVG;
- los tamaños `16`, `20` y `24` no requieren otro set de assets;
- los iconos son `aria-hidden="true"` por defecto; el nombre accesible de un
  botón sólo-icono debe pertenecer al `button`, no al SVG;
- la licencia es ISC y los iconos de marca están deliberadamente fuera de la
  familia;
- no depende de SSR y sus componentes SVG son compatibles con Vite; SSR no es
  un requisito de PBI-030;
- el paquete publicado observado contiene 4,094 archivos y aproximadamente
  31.3 MB desempaquetados, por lo que el tamaño instalado no debe confundirse
  con el bundle servido: la prueba obligatoria será medir el bundle candidato
  y demostrar que iconos no usados no se incluyen.

Fuentes de evaluación: [guía React de Lucide](https://lucide.dev/guide/react),
[accesibilidad](https://lucide.dev/guide/react/advanced/accessibility),
[sizing](https://lucide.dev/guide/react/basics/sizing),
[advertencia sobre DynamicIcon](https://lucide.dev/guide/react/advanced/dynamic-icon-component),
[manifest del package](https://github.com/lucide-icons/lucide/blob/main/packages/lucide-react/package.json)
y [licencia](https://github.com/lucide-icons/lucide/blob/main/LICENSE).

### Decisión Owner registrada

**APPROVED — ICONOGRAPHY OWNER DECISION**, 2026-08-18.

`lucide-react` es la única familia estándar de iconografía funcional de Design
System V1, con estas condiciones:

1. incorporarla únicamente durante la implementación autorizada de PBI-030,
   fijar la versión exacta y actualizar el lockfile; no instalarla antes;
2. usar imports estáticos nombrados; prohibir `DynamicIcon`, import del
   namespace completo y catálogos de nombres dinámicos;
3. exponer `Icon`/`IconButton` sólo cuando exista un consumidor real, con
   `currentColor` y tamaños `16px` inline/tablas, `20px` controles/navegación y
   `24px` estados destacados;
4. mantener branding/logo fuera de Lucide;
5. marcar decorativos como ocultos para AT y dar al `button` un accessible name
   mediante `aria-label` o `aria-labelledby` en controles sólo-icono; tooltip
   es apoyo, no nombre;
6. no usar emojis como iconografía funcional ni introducir otra librería sin
   decisión explícita;
7. registrar delta de bundle y prueba de tree-shaking en la evidencia del SHA.

La evaluación se realizó sobre `lucide-react@1.32.0`; la versión efectivamente
incorporada deberá volver a verificarse y quedar fijada durante la
implementación. Esta aprobación no autoriza instalarla ahora ni iniciar el PBI.

**ICONOGRAPHY GATE: RESOLVED.**

## 3. Gate del tenant accent

### Contrato de entrada y salida

- La única entrada V1 aceptada es `#RRGGBB` sRGB opaco.
- Se normaliza a mayúsculas. Cualquier otro formato, valor fuera de rango,
  parseo o conversión fallidos usa fallback; nunca lanza ni bloquea render.
- La salida por tema contiene `accent`, `accent-hover`, `accent-active`,
  `accent-subtle` y `accent-contrast`.
- Los tokens semantic `success`, `warning`, `danger` e `info` no participan en
  el algoritmo.

### Algoritmo reproducible

1. Convertir cada canal sRGB normalizado a luminancia lineal según WCAG:
   `c/12.92` cuando `c <= 0.04045`; en otro caso
   `((c + 0.055) / 1.055)^2.4`.
2. Calcular `L = 0.2126R + 0.7152G + 0.0722B` y contraste
   `(Lmax + 0.05) / (Lmin + 0.05)`.
3. Convertir el color válido a OKLCH usando las matrices sRGB lineal → OKLab
   definidas por CSS Color 4. Mantener hue; reducir croma mediante búsqueda
   binaria sólo cuando sea necesario para volver al gamut sRGB.
4. En light, usar surface `#FFFFFF`, `accent-contrast: #FFFFFF` y mover
   luminosidad OKLCH hacia abajo en pasos de `0.005`. En dark, usar surface
   `#0B0F14`, `accent-contrast: #111827` y mover luminosidad hacia arriba.
5. El `accent` aceptado debe lograr `>= 4.5:1` tanto contra surface como contra
   `accent-contrast`; esto supera también el mínimo `3:1` para UI/focus.
6. El ajuste máximo es `|delta L| <= 0.35`. Si el color original tiene
   `C >= 0.05` y la conversión exige perder más de 60 % del croma, o el ciclo
   acotado no encuentra solución, usar fallback.
7. Derivar hover/active conservando hue: light resta `0.04/0.08` a L; dark
   suma `0.04/0.08`. Volver a gamut y revalidar; si una variante no pasa, usar
   el estado seguro inmediatamente anterior.
8. Derivar subtle mezclando en sRGB lineal 8 % de accent con surface en light
   y 16 % en dark. Su contenido usa `text-primary`, no el accent; verificar
   contraste de texto normal `>= 4.5:1`.

Fallbacks V1: light `#B45309` con texto `#FFFFFF`; dark `#F59E0B` con texto
`#111827`. La referencia normativa es
[WCAG 2.2](https://www.w3.org/TR/WCAG22/), incluido
[Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast),
y la conversión de color sigue [CSS Color 4](https://www.w3.org/TR/css-color-4/).

### Vectores calculados de referencia

| Caso | Tema | accent | hover | active | subtle | contrast | Ratio surface | Ratio contrast |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Owner | Light | `#B45309` | `#A44900` | `#934100` | `#FAF7F6` | `#FFFFFF` | 5.02 | 5.02 |
| Owner | Dark | `#F59E0B` | `#FFAD3C` | `#FFBF73` | `#6C4513` | `#111827` | 8.95 | 8.26 |
| Muy claro `#FFF3B0` | Light | fallback `#B45309` | `#A44900` | `#934100` | `#FAF7F6` | `#FFFFFF` | 5.02 | 5.02 |
| Muy claro `#FFF3B0` | Dark | `#FFF3B0` | `#FFFFFB` | `#FFFFFF` | `#706B4E` | `#111827` | 17.11 | 15.80 |
| Muy oscuro `#050505` | Light | `#050505` | `#010101` | `#000000` | `#F6F6F6` | `#FFFFFF` | 20.38 | 20.38 |
| Muy oscuro `#050505` | Dark | fallback `#F59E0B` | `#FFAD3C` | `#FFBF73` | `#6C4513` | `#111827` | 8.95 | 8.26 |
| Saturado `#FF00FF` | Light | `#D000D0` | `#BE00BE` | `#AC00AC` | `#FCF6FC` | `#FFFFFF` | 4.57 | 4.57 |
| Saturado `#FF00FF` | Dark | `#FF00FF` | `#FF58FD` | `#FF7DFC` | `#700D71` | `#111827` | 6.13 | 5.66 |
| Inválido | Light/Dark | fallback del tema | derivado fallback | derivado fallback | subtle fallback | contraste fallback | >= 4.5 | >= 4.5 |

El catálogo deberá conservar entrada, tema, valores resultantes, razón de
fallback y ratios contra surface/contrast; además mostrará primary action,
link, focus ring, selección y subtle con texto. Los vectores se convertirán en
tests automatizados durante la implementación; estos cálculos no son evidencia
de UI implementada.

**TENANT ACCENT GATE: RESOLVED.**

## 4. Gate del catálogo visual

| Ambiente | Política V1 |
|---|---|
| Local | Disponible en `/__internal/ui-catalog`; sólo desarrollo y loopback |
| Preview | Disponible en la misma ruta, con banner `Preview / Internal catalog` y fixtures sintéticos |
| Staging futuro | Deshabilitado por defecto; sólo con flag explícito de QA y datos sintéticos/sanitizados |
| Production futuro | Ausente del build; la ruta responde `404` y sus chunks no se incluyen |

La habilitación se resuelve mediante flag no secreto de build, import dinámico
y guard de ruta. Ocultar con CSS, `robots.txt` o conocer una URL no es control
de acceso. Preview no tiene autenticación hoy, por lo que la ruta debe tratarse
honestamente como pública. Se agrega `noindex,nofollow,noarchive` y
`X-Robots-Tag` sólo para indexación, no como barrera de seguridad.

Sólo se permiten fixtures deterministas versionados y estados mock. Se prohíben
secretos, credenciales, PII, datos reales, tokens, endpoints administrativos y
llamadas por defecto a APIs de producto. Production debe verificar ausencia de
ruta, código/chunk y enlace de navegación.

**VISUAL CATALOG GATE: RESOLVED.**

## 5. Matriz de navegadores y tecnologías de asistencia

Las versiones `latest` se fijan en la evidencia del SHA al probar; no se afirma
compatibilidad sin ejecución.

| Nivel | Combinación | Evidencia mínima antes de Done |
|---|---|---|
| Primary | Chrome latest en Windows y macOS | catálogo y shell; teclado; viewports; light/dark/system |
| Primary | Safari latest en macOS | catálogo y shell; teclado; VoiceOver en shell/drawer/theme |
| Primary | iOS Safari latest | navegación, drawer, touch, reflow y VoiceOver del recorrido crítico |
| Primary | Android Chrome latest | navegación, drawer, touch y reflow |
| Secondary | Edge latest en Windows | smoke visual/funcional y teclado del shell |
| Secondary | NVDA + Chrome latest en Windows | navegación crítica, nombres, estados y drawer |
| Best effort | Firefox latest | smoke; defecto se evalúa, no soporte comprometido V1 |
| Not targeted | IE, browsers obsoletos, WebViews embebidos no gobernados | ninguna afirmación de soporte |

Baseline manual transversal: keyboard-only completo; focus order/restore y
Escape; reduced motion; zoom 200 %; reflow a 320 CSS px o equivalente 400 %;
touch targets; y viewports `390/640/768/1024/1280`. La automatización cubrirá
semántica/contraste y regresiones posibles, pero no sustituye VoiceOver/NVDA ni
revisión visual ligada al SHA.

**COMPATIBILITY GATE: RESOLVED.**

## 6. Gate de partición: una sola foundation

### Clasificación de `styles.css`

Intención rescatable, no implementación reutilizable: reset/box sizing,
herencia de controles, visually-hidden, focus-visible, reduced-motion,
currentColor/stroke para iconos, estados loading/error/empty y primitivas de
layout.

Implementación temporal a reemplazar: seis variables y colores hardcoded,
coral, Inter, pesos `650/750/850`, sidebar `218/204`, breakpoints `820/560`,
barra móvil de iconos, tabla horizontal móvil, sombras/radios del slice,
selectores globales de componentes/dominio, caracteres usados como iconos y
todas las clases actuales.

### Partición dentro de un solo candidato de implementación

| Fase | Resultado obligatorio |
|---|---|
| A | Introducir archivos únicos de tokens/temas/base y checker de contrato; sólo puede coexistir mientras el candidato no se integre |
| B | Migrar ApplicationShell, header, sidebar/rail/drawer y navegación a Modules/tokens |
| C | Migrar los consumidores y estados existentes de Preview necesarios para preservar sus rutas honestas, sin agregar comportamiento de producto |
| D | Eliminar `styles.css`, su import desde `main.tsx`, clases/bridges legacy y ejecutar todos los gates finales |

Las fases son unidades de revisión del mismo PBI, no merges/deploys parciales.
La coexistencia expira antes de presentar el SHA candidato a review/PR. Si D no
termina, PBI-030 falla y no se integra.

El checker deberá probar: ausencia de `styles.css` y su import; colores fuera
de archivos de tokens; breakpoints distintos de `640/768/1024/1280`; pesos,
radios y motion fuera de escalas; inline styles salvo el custom property raíz
de accent; `!important` ordinario; denylist de clases legacy; tokens
duplicados; styles globales de dominio/componentes; y presencia del CSS viejo
en sources/bundle. Una excepción debe ser explícita, acotada y revisada; no se
crean adapters o bridges permanentes.

**FOUNDATION PARTITION GATE: RESOLVED.**

## 7. Recuperación de CI base

### Causa y corrección mínima

El fallo se reprodujo bajo Node `24.18.0`: después de build,
`pnpm run smoke:start` inicia el artefacto real sin `SR_DB_*`; el bootstrap
fail-closed termina con `PERSISTENCE_CONFIG_REQUIRED`. La suite PostgreSQL del
workflow tenía su propia base aislada, pero el smoke compilado ocurría fuera de
ese contexto.

El candidato agrega un servicio PostgreSQL 18.4 aislado por job del workflow,
aplica el schema con rol `migration` y ejecuta el artefacto con rol
`application`, `SR_DB_MIGRATIONS_ENABLED=false` y configuración sintética. No
relaja bootstrap, readiness ni el contrato `SR_DB_*`; tampoco usa mock de DB.
Un test de workflow impide perder digest, orden migrate→smoke o separación de
roles y rechaza aliases genéricos. El workflow ejecuta además `smoke:ui` contra
la misma base migrada. La remediación derivada del primer run autoritativo
permite sólo assets `.css/.html/.js/.map` bajo `dist/public/`, conserva el
rechazo fuera de ese root y evita interpretar `https://` como una ruta Windows.

### Evidencia local

- tests focales de workflow/evidencia: `17/17 PASS`;
- `pnpm run verify`: `PASS` bajo Node `24.18.0`/pnpm `11.15.1`;
  typecheck, build, estructura y arquitectura verdes; suite final con 364
  tests, 354 pass, 0 fail y 10 skips PostgreSQL esperados en el gate unitario;
- runner PostgreSQL autoritativo separado: 5 suites, 10 tests reales,
  0 fallos y 0 critical skips;
- PostgreSQL gobernado:
  `postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf`;
- migración aislada: una pendiente aplicada, cero pendientes al terminar;
- `smoke:start`: `PASS` con artefacto compilado y DB real;
- `smoke:ui`: `PASS`; root, rutas SPA, assets, `/livez` y `/readyz` en `200`,
  rutas desconocidas en `404`.
- colector sobre el bundle real: `61` artefactos inventariados sin rutas
  personales; URL ordinaria aceptada y ruta Windows real rechazada.

El runner PostgreSQL se ejecutó en el host con un Node `24.18.0` temporal vía
pnpm, sin cambiar el toolchain instalado. Un primer intento desde un contenedor
Node fue descartado porque los scripts publican PostgreSQL en loopback del host
y el proceso anidado tenía otro namespace de red; la repetición válida en host
pasó las cinco suites y dejó cero containers/networks/volumes gobernados.

La [PR #5](https://github.com/luisgtzaviles/SrTaller-2.0/pull/5) publica el
candidato y obtuvo CI autoritativo verde en su SHA más reciente: los dos jobs,
PostgreSQL real, arquitectura, typecheck, build, tests, `smoke:start`,
`smoke:ui`, inmutabilidad, evidencia y comparación pasaron. El primer run
publicado falló honestamente en el colector y fue corregido; un run intermedio
supersedido se canceló antes de considerarlo evidencia.

El Owner autorizó la integración el 2026-08-18. Inmediatamente antes del merge,
PR #5 seguía OPEN, `MERGEABLE/CLEAN`, con HEAD `334f502`, los cinco commits
esperados y sus tres checks verdes. Se integró sin cambios adicionales mediante
el merge commit `efd9ec05d02af604c2d9ea18d4636c1539f8dc54`.

El [run de `main` `32199570584`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/32199570584)
terminó `SUCCESS`: `VC-024 run-1`, `VC-024 run-2` y `VC-024 comparison`
pasaron, incluidos PostgreSQL, arquitectura, typecheck, build, tests, smokes,
inmutabilidad y comparación semántica/hash.

El commit documental posterior
`a8f230214b592389894e25545583988c2c2edc3e` conservó la baseline. Su
[run de `main` `32201164615`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/32201164615)
terminó `SUCCESS`: `VC-024 run-1`, `VC-024 run-2` y `VC-024 comparison`
pasaron completos bajo Node `24.18.0` y pnpm `11.15.1`.

**AUTHORITATIVE CI CANDIDATE: GREEN.**

**CI BASELINE: GREEN.**

## 8. Relación con PBI-024

**Clasificación: SOFT DEPENDENCY.** PBI-030 puede construir Design System,
shell, contrato de contexto, placeholder/bloqueo honesto y fixtures sintéticos
sin station runtime. Ningún criterio exige una estación real. PBI-024 sí es
dependencia de integrar y afirmar sucursal/estación confiable u operador real;
PBI-030 no puede simular esa autoridad como si existiera.

La PR #3 continúa draft, abierta, conflictiva y fuera de `main`. No se modificó
ni se intentó resolver en esta revisión.

## 9. Definition of Ready completa

| Criterio | Evaluación | Evidencia/razón |
|---|---|---|
| Problema y fuente | PASS | PBI y contrato canónico identifican doble deuda visual/shell |
| Objetivo y epic | PASS | valor explícito; EPIC-001 |
| Scope y exclusions | PASS | límites UI, backend, producto, infra y publicación explícitos |
| Acceptance criteria/casos límite | PASS | tokens, tema, shell, catálogo, responsive y fallos observables |
| Dependencias | PASS | PBI-024 clasificada soft; planes explícitos |
| Arquitectura | PASS | React/Vite, CSS properties + Modules, sin package/framework paralelo |
| UX contract | PASS | shell, navegación, responsive y states canónicos |
| Accesibilidad | PASS | WCAG 2.2 AA objetivo + matriz/evidencia exigible |
| Privacidad/seguridad | PASS | catálogo sintético; sensitive reveal fuera; no autoridad inventada |
| Tests/evidencia QA | PASS | estrategia automatizada/manual y evidencia ligada a SHA definida |
| Migración/partición | PASS | fases A–D, retiro antes de review, checker anti-doble-foundation |
| Datos/persistencia | N/A | PBI no cambia modelo ni datos; accent/fixtures son presentación sintética |
| Integraciones/realtime/jobs | N/A | no existen en alcance |
| Deployment implications | PASS | artefacto único; catálogo ausente en Production; no deploy en PBI de preparación |
| Rollout/rollback | PASS | no integración parcial; revert del candidato completo antes de deploy; runtime actual permanece hasta aceptación |
| Ownership/review | PASS | Producto/Diseño, Frontend/Ingeniería, Calidad/Accesibilidad y catálogo con Operaciones/Seguridad |
| Autoridad de implementación | PASS para Ready | debe permanecer separada; Ready no equivale a autorización |
| Iconografía | PASS | `lucide-react` aprobado por Owner con contrato y límite temporal explícitos |
| Estimación | PASS | `ESTIMATION: XL — AGREED` por revisión formal Frontend/Ingeniería; Confidence Medium; Risk High |
| CI base | PASS | `main` `a8f2302`; run `32201164615` verde en ambos jobs y comparación |
| Preguntas bloqueantes | PASS | OPEN-PBI030-06 y OPEN-PBI030-08 cerradas con evidencia |

**Resultado DoR: PASS — READY.** Los puntos N/A responden a exclusiones reales,
no a una dispensa.

| Campo de evaluación | Resultado |
|---|---|
| PBI | `PBI-030` |
| Resultado | `Ready` |
| N/A justificados | Datos/persistencia e integraciones/realtime/jobs; fuera del alcance UI Foundation/Shell |
| Bloqueos | Ninguno de readiness |
| Riesgo | High; migración visual transversal, responsive, accesibilidad y convergencia sin legacy |
| Estimación | `XL — agreed`; Confidence Medium |
| Partición | `KEEP AS SINGLE PBI`; checkpoints internos A–D |
| Autoridad de inicio | No concedida al momento de esta revisión; concedida posteriormente según el seguimiento de la sección 13 |

## 10. Riesgos residuales y decisión requerida al cerrar readiness

- Instalar Lucide antes de iniciar una implementación autorizada excedería la
  decisión Owner; la aprobación sólo cerró selección y contrato.
- Tratar `Ready` como autorización de inicio ocultaría el gate Owner separado.
- Los valores de accent son vectores de especificación y todavía necesitan
  tests/UI durante implementación.
- La matriz define compromiso; no afirma pruebas ejecutadas.
- Una migración parcial dejaría dos foundations; el gate de integración debe
  fallar si no se retira legacy.

## 11. Próxima acción acotada

1. Integrar esta promoción documental sólo mediante autoridad de merge
   explícita y con CI verde sobre el SHA candidato.
2. Solicitar una decisión Owner binaria separada para iniciar PBI-030.
3. Si se autoriza, abrir la implementación desde `main` sin ampliar alcance y
   respetando checkpoints A–D; no instalar Lucide antes de ese inicio.

## 12. Veredicto

**PASS — PBI-030 READY FOR OWNER AUTHORIZATION.**

**Implementation authorization pending Owner approval.**

## 13. Seguimiento posterior a readiness

El Owner autorizó explícitamente la implementación el 2026-08-18 desde la
baseline `f802feecbf1fb7b1c167b8d24f41f4e28db637d9`. El candidato está `In review`
en `feature/pbi-030-design-system-shell`; véase la
[evidencia QA](../quality/evidence/pbi-030/README.md). Esta actualización no
reescribe el veredicto histórico: CI del PR, revisión independiente, matriz
Primary/AT, aceptación, merge y deploy siguen siendo estados posteriores y
separados.
