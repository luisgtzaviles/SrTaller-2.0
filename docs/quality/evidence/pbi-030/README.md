# Evidencia QA — PBI-030 — UI Foundation y Application Shell V1

## Identificación

| Campo | Valor |
|---|---|
| Elemento validado | `PBI-030` |
| Estado | `In review` |
| Rama | `feature/pbi-030-design-system-shell` |
| Pull request | [PR draft #8](https://github.com/luisgtzaviles/SrTaller-2.0/pull/8) |
| Baseline | `f802feecbf1fb7b1c167b8d24f41f4e28db637d9` |
| SHA de implementación observado | `7f15126e90295464994d15d662bdb6b1cf6a5062` |
| Ejecución local | 2026-08-18 (`2026-08-19T01:34:45Z`) |
| Toolchain | Node.js `24.18.0`; pnpm `11.15.1` |
| Navegador manual | Google Chrome `151.0.7922.138` en macOS `26.5.1` |
| Datos | Fixtures exclusivamente sintéticos |
| Manifest | [EVIDENCE_MANIFEST.json](EVIDENCE_MANIFEST.json) |

El SHA anterior identifica los commits de implementación y gobierno sobre
los que se generaron las capturas y mediciones. El commit documental posterior
no altera el artefacto observado. La evidencia no contiene datos personales,
credenciales, secretos ni contexto operativo presentado como real.

## Resultado ejecutivo

**IMPLEMENTATION EVIDENCE: CONDITIONAL PASS.** La implementación, los gates
locales y la revisión manual disponible pasan. PBI-030 no se declara `Done`:
faltan revisión independiente, CI autoritativo del PR y la matriz manual Primary
completa de navegadores y tecnologías de asistencia.

| Área | Resultado |
|---|---|
| Tokens, temas y accent | PASS |
| Application Shell y responsive | PASS en Chrome/macOS y viewports definidos |
| Catálogo Local/Preview | PASS |
| Exclusión del catálogo en Production | PASS automática |
| Teclado, foco, Escape y reduced motion | PASS en revisión manual Chrome/macOS |
| VoiceOver/NVDA y navegadores/dispositivos Primary restantes | NOT RUN |
| Gate local canónico | PASS |
| PostgreSQL material y smokes compilados | PASS |
| CI autoritativo del SHA de PR | PENDING |
| Aprobación de Producto/Diseño/QA | PENDING |

## Alcance materializado

- Fuente única de tokens semánticos en `tokens.css`, estilos base globales
  acotados y ownership de componentes mediante CSS Modules.
- Temas `light`, `dark` y `system`, persistencia local, sincronización con la
  preferencia del sistema y script inicial para reducir flash.
- Accent sintético normalizado y derivado en OKLCH, contraste mínimo, límite de
  pérdida de chroma, fallback gobernado y vectores automatizados.
- `lucide-react` `1.31.0` como única familia funcional, con imports estáticos y
  nombrados, `currentColor` y tamaños canónicos.
- Primitives, controles, feedback, navegación, data display y overlay que ya
  tienen consumidor en shell, páginas demostrativas o estados exigidos del
  catálogo.
- Application Shell desktop `256px`/`72px`, drawer móvil máximo `320px`, header,
  navegación real limitada a Inicio/Reparaciones, tema y contexto sintético
  explícito.
- Catálogo lazy en `/__internal/ui-catalog` sólo para Local/Preview, con
  `X-Robots-Tag: noindex, nofollow, noarchive`; Production no contiene ruta,
  marker ni chunk.
- Conservación honesta de la ausencia de APIs de producto: Reparaciones muestra
  error/empty y el formulario no afirma persistencia.

No se modificaron APIs de producto, casos de uso, modelo de dominio, migraciones,
infraestructura, Dokploy, DNS ni runtime desplegado.

## Componentes y consumidores

| Grupo | Componentes materializados | Consumidor observable |
|---|---|---|
| Primitives | `Stack`, `Inline`, `Text`, `VisuallyHidden` | Shell, páginas y catálogo |
| Controls | `Button`, `ButtonLink`, `IconButton`, `Input`, `Textarea`, `Field`, `FormSection` | Header/drawer, Nueva reparación y catálogo |
| Feedback | `Alert`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState` | Dashboard, Reparaciones y catálogo |
| Navigation | `Breadcrumb`, `PageHeader` | Inicio, Reparaciones, Nueva reparación y detalle |
| Data display | `StatusBadge`, `ResponsiveDataList`, `FilterBar` | Lista responsive de Reparaciones y catálogo |
| Overlay | `Dialog`, `useFocusTrap` | Diálogo de catálogo; drawer del shell |

No se creó un package compartido, Storybook ni inventario especulativo.

## Pruebas automáticas

| Comando/caso | Resultado observado |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm run verify:ui` | PASS |
| `pnpm run verify:ui:production` | PASS; exclusión verificada en 3 archivos |
| `pnpm run verify` | PASS; 372 tests, 362 pass, 0 fail, 10 PostgreSQL skips esperados en gate unitario |
| PostgreSQL CI local gobernado | PASS; 5 suites, 10 tests, 0 fallos, 0 skips críticos |
| `pnpm run smoke:start` | PASS sobre PostgreSQL 18.4 efímero migrado |
| `pnpm run smoke:ui` | PASS; `/`, SPA, catálogo, assets y health `200`; rutas no autorizadas `404` |
| `git diff --check` | PASS |

La ejecución PostgreSQL local usó la imagen gobernada por digest y eliminó sus
contenedores. Los dos runs Linux reproducibles y la comparación pertenecen al
CI autoritativo del PR y quedan pendientes hasta publicar el candidato.

## Revisión manual ejecutada

| Comprobación | Resultado | Límite |
|---|---|---|
| Viewports `320`, `390`, `640`, `768`, `1024`, `1280` CSS px | PASS; sin overflow horizontal | Chrome/macOS |
| Breakpoint del shell | PASS; drawer bajo `768`, sidebar desde `768` | Chrome/macOS |
| Light/dark/system | PASS visual; persistencia y cambio observados | Chrome/macOS |
| Drawer | PASS; trap de foco, `Escape`, restore de foco y body scroll lock | Chrome/macOS |
| Dialog | PASS; trap de foco, `Escape` y restore al disparador | Chrome/macOS |
| Keyboard-only | PASS en flujo crítico; skip link y orden lógico observados | Chrome/macOS |
| Accessible names | PASS en controles icon-only inspeccionados | Revisión DOM/manual |
| Reduced motion | PASS; media query activa y transiciones reducidas | Emulación Chrome |
| Accent inseguro | PASS; fallback visible y estados semánticos intactos | Catálogo sintético |
| Consola | PASS; 0 errores y 0 warnings | Chrome/macOS |
| Reparaciones/formulario | PASS visual; error honesto, labels y requeridos; una columna móvil | Sin persistencia/API |

No se ejecutaron Safari macOS, iOS Safari, Android Chrome, Edge Windows,
VoiceOver ni NVDA. Tampoco se afirma certificación WCAG. Conforme a la estrategia
canónica, esos `NOT RUN` impiden cerrar Definition of Done, aunque no invalidan
el candidato técnico para revisión y CI.

## Evidencia visual

| Archivo | Qué demuestra |
|---|---|
| [desktop-light.png](desktop-light.png) | Shell expandido, dashboard y tema light a `1280px` |
| [desktop-dark.png](desktop-dark.png) | Tema dark, jerarquía y contraste visual a `1280px` |
| [mobile-light.png](mobile-light.png) | Reflow móvil del dashboard a `390px` |
| [mobile-drawer.png](mobile-drawer.png) | Drawer móvil, navegación y contexto honesto |
| [mobile-repairs-error.png](mobile-repairs-error.png) | Error de API ausente y data display responsive |
| [mobile-form.png](mobile-form.png) | Formulario visual, labels y una columna móvil |
| [catalog-light.png](catalog-light.png) | Catálogo, estados, accent seguro/inseguro y fixtures sintéticos |

Los hashes SHA-256 y dimensiones están registrados en el manifest.

## Impacto de bundle

Medición reproducible con gzip nivel 9 sobre JS/CSS compilados desde la baseline
exacta y el SHA de implementación:

| Artefacto | Baseline | Candidato | Delta |
|---|---:|---:|---:|
| Core JS+CSS raw | 262,501 B | 302,768 B | +40,267 B (+15.3 %) |
| Core JS+CSS gzip | 81,215 B | 91,795 B | +10,580 B (+13.0 %) |
| Preview total con catálogo lazy raw | 262,501 B | 312,321 B | +49,820 B (+19.0 %) |
| Preview total con catálogo lazy gzip | 81,215 B | 95,135 B | +13,920 B (+17.1 %) |
| Chunk lazy de catálogo JS+CSS gzip | 0 B | 3,340 B | +3,340 B |

Lucide se importa estática y nominalmente. El checker impide `DynamicIcon`, una
segunda dependencia de iconos y SVG inline; el catálogo queda en chunk lazy y
ausente de Production.

## Definition of Done y riesgos residuales

| Gate DoD aplicable | Estado |
|---|---|
| Criterios funcionales/técnicos implementados | PASS local |
| Scope y arquitectura | PASS local |
| Tests y smokes | PASS local; CI PR pendiente |
| Evidencia responsive/visual | PASS parcial y conservada |
| Accesibilidad según matriz completa | NOT RUN completa; falta AT/cross-browser |
| Revisión independiente | PENDING |
| Aprobación Product Owner | PENDING |
| Merge | NOT AUTHORIZED |
| Deploy/Release | No aplica al alcance; no ejecutado |

Riesgos residuales:

- incompatibilidad o defecto específico no observado en Safari/iOS/Android,
  Edge/Windows, VoiceOver o NVDA;
- incremento core gzip de `13.0 %`, medido y visible para revisión;
- el catálogo Preview es una superficie interna no autenticada en esta
  foundation; sólo contiene fixtures sintéticos, está marcado `noindex` y queda
  ausente de Production;
- la UI continúa sin APIs de producto y no debe confundirse con un workflow de
  Reparaciones funcional.

No se registra waiver. La recomendación es publicar el PR, exigir CI verde y
completar la matriz manual/revisión antes de declarar `Done` o solicitar una
decisión de merge.

### Remediación de CI de supply chain

El primer run del PR rechazó `lucide-react@1.32.0` porque había sido publicado
menos de 24 horas antes del cutoff canónico. No se relajó la política ni se
agregó una excepción: se fijó `1.31.0`, versión más reciente anterior al cutoff,
y se regeneró el lockfile. El build resultante conservó exactamente los mismos
nombres y tamaños de assets medidos; el resultado autoritativo posterior queda
referenciado en el handoff del PR.

## Próxima revisión

- **Disparador:** CI autoritativo del PR y revisión independiente del candidato.
- **Autoridades:** Frontend/Ingeniería, Calidad/Accesibilidad, Producto/Diseño y
  Owner para cualquier decisión posterior de merge.
los que se generaron las capturas y mediciones. El commit documental posterior
