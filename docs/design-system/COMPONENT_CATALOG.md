# Catálogo de componentes UI

## Estado y propósito

- **Estado:** inventario operativo de la implementación actual.
- **Fuente ejecutable:** `apps/dev-preview-web/src/`.
- **Contrato visual:**
  [`DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md`](./DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md).
- **Propósito:** permitir que una persona o agente encuentre y reutilice la
  foundation existente antes de crear UI nueva.

Este catálogo describe lo que existe; no introduce un framework paralelo ni
convierte un patrón de dominio en una primitiva genérica.

## Regla de creación

Antes de crear un control, layout o patrón visual:

1. buscar el concepto y sus consumidores en `src/components/ui/`,
   `src/components/`, `src/pages/` y el catálogo interno;
2. comprobar si una primitiva existente admite composición o una extensión
   compatible;
3. usar tokens de `src/styles/tokens.css` y CSS Modules;
4. crear una API compartida sólo cuando la misma semántica se repita y la
   abstracción reduzca divergencia real;
5. añadir contrato, accesibilidad y regresión visual proporcional.

Una página puede conservar un elemento HTML nativo cuando implementa semántica
especializada —por ejemplo grid editable, listbox o selección de dominio— que
una primitiva general no cubre. Debe justificarlo, consumir tokens y mantener
teclado, foco y nombres accesibles. Un `<button>`, `<input>`, `<select>` o
`<textarea>` ordinario no se duplica por conveniencia local.

## Foundation

| Superficie | Ubicación | Responsabilidad |
|---|---|---|
| Tokens | `src/styles/tokens.css` | Color semántico, spacing, radios, tipografía, motion, z-index, tamaños y breakpoints. |
| Base global | `src/styles/base.css` | Reset, tema, foco visible y reduced motion; se importa una sola vez desde `main.tsx`. |
| Tema | `src/foundation/theme.tsx` | `ThemeProvider`, `useTheme`, light/dark y acento normalizado. |
| Acento | `src/foundation/accent.mjs` | Derivación determinista de roles semánticos del color Tenant. |
| Estilos UI | `src/components/ui/ui.module.css` | Estilos compartidos de las primitivas de este catálogo. |
| Clases | `src/components/ui/class-names.ts` | Composición pequeña de class names. |

Los breakpoints canónicos son `640`, `768`, `1024` y `1280` px. Los iconos
funcionales usan únicamente imports estáticos nombrados de `lucide-react`.

## Primitivas y composición

Archivo: `src/components/ui/primitives.tsx`.

| Export | Uso |
|---|---|
| `Stack` | Flujo vertical con gaps gobernados. |
| `Inline` | Flujo horizontal/flexible con gaps gobernados. |
| `Text` | Texto semántico con elemento, tono y tamaño limitados. |
| `VisuallyHidden` | Contenido accesible sin presencia visual. |

## Controles y formularios

Archivo: `src/components/ui/controls.tsx`.

| Export | Uso y variantes relevantes |
|---|---|
| `Button` | Acción; tonos `primary`, `secondary`, `quiet`, `danger`; tamaños `default`, `compact`. |
| `ButtonLink` | Navegación con apariencia de botón y las mismas variantes. |
| `IconButton` | Acción sólo-icono; exige `label`, Lucide y tamaño `16/20/24`. |
| `Input` | Input visual estándar con `ref` y atributos nativos. |
| `Select` | Select nativo gobernado. |
| `Textarea` | Captura multilínea gobernada. |
| `Field` | Label, hint/error, requerido y asociación por `id`. |
| `FormSection` | Sección numerada de formulario con descripción, estado e icono opcional. |

## Datos y filtros

Archivo: `src/components/ui/data-display.tsx`.

| Export | Uso |
|---|---|
| `StatusBadge` | Estado `info`, `warning`, `success`, `danger` o `neutral`. |
| `DataColumn` | Contrato tipado de columna para `ResponsiveDataList`. |
| `ResponsiveDataList` | Tabla desktop y cards móviles desde la misma colección. |
| `FilterBar` | Controles de filtro con resumen `aria-live`. |

El grid especializado del Bulk Catalog Composer no es un reemplazo de
`ResponsiveDataList`; conserva contratos propios de edición, selección y
resize.

## Feedback y estados

Archivo: `src/components/ui/feedback.tsx`.

| Export | Uso |
|---|---|
| `Alert` | Mensaje inline semántico; danger usa `role="alert"`. |
| `Spinner` | Progreso compacto con label accesible. |
| `Toast` | Confirmación no bloqueante con live region. |
| `Skeleton` | Placeholder de carga por filas. |
| `EmptyState` | Estado vacío con título, descripción y acción opcional. |
| `ErrorState` | Error recuperable con título, descripción y acción opcional. |

## Navegación y encabezados

Archivo: `src/components/ui/navigation.tsx`.

| Export | Uso |
|---|---|
| `BreadcrumbItem` | Contrato de item para breadcrumb. |
| `Breadcrumb` | Ruta accesible con página actual. |
| `BackLink` | Regreso explícito con icono. |
| `PageHeader` | Eyebrow, título, descripción, breadcrumb, estado y acciones. |

## Overlays y búsqueda

| Export | Ubicación | Uso |
|---|---|---|
| `Dialog` | `src/components/ui/overlays.tsx` | Dialog estándar/wide/workspace con inert, foco atrapado, Escape y restauración. |
| `useFocusTrap` | `src/components/ui/overlays.tsx` | Infraestructura compartida; preferir `Dialog` salvo overlay compuesto justificado. |
| `SearchAutocomplete` | `src/components/ui/SearchAutocomplete.tsx` | Combobox/listbox flotante, incluso dentro de Dialog. |
| `autocompleteInputProps` | mismo archivo | ARIA y atributos coherentes del input consumidor. |
| `SearchAutocompleteOption` | mismo archivo | Opción rica y seleccionable. |
| `SearchAutocompleteStatus` | mismo archivo | Idle/loading/empty/error y retry opcional. |
| `SearchAutocompleteWidth` | mismo archivo | Ancho `narrow/default/wide`. |
| `SearchAutocompleteInputKind` | mismo archivo | Input `search` o `telephone`. |

## Shell

| Export | Ubicación | Uso |
|---|---|---|
| `ApplicationShell` | `src/components/shell/ApplicationShell.tsx` | Topbar, navegación, contexto, tema, sesión y drawer responsive. |
| `ThemeProvider` / `useTheme` | `src/foundation/theme.tsx` | Contexto visual global. |

La composición de rutas permanece en `src/App.tsx`. El catálogo visual de
desarrollo está en `/__internal/ui-catalog`, lazy-loaded y protegido por
`__UI_CATALOG_ENABLED__`; no es una ruta de producto.

## Cómo buscar antes de crear

Ejemplos desde la raíz del repositorio:

```bash
rg "export (function|const|interface|type)" apps/dev-preview-web/src/components/ui
rg "<Dialog|<PageHeader|<ResponsiveDataList|<SearchAutocomplete" apps/dev-preview-web/src
rg "--color-|--space-|--radius-|--control-" apps/dev-preview-web/src/styles/tokens.css
rg "<button|<input|<select|<textarea" apps/dev-preview-web/src
```

La última búsqueda identifica candidatos de revisión, no defectos automáticos:
los controles especializados necesitan inspección semántica.

## Enforcement actual

`pnpm run verify:ui` y `test/ui-foundation-contract.test.mjs` comprueban, entre
otros límites:

- una sola foundation global y una sola librería de iconos;
- colores, radios, pesos, motion y breakpoints gobernados;
- ausencia de SVG inline, estilos inline y mutación de estilo no autorizada;
- CSS Modules para componentes;
- carga lazy y guard de build del catálogo interno.

La semántica correcta de reutilización, HTML especializado, copy y composición
continúa requiriendo revisión humana y pruebas focalizadas. No se introduce un
checker textual que fuerce falsos positivos sobre grids o listboxes válidos.

## Mantenimiento

Actualizar este archivo en el mismo cambio que agregue, retire o renombre un
export compartido. El test de contrato de descubrimiento compara los exports
de `src/components/ui/` con este catálogo para evitar drift silencioso.
