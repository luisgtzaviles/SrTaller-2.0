# Design System & Application Shell V1

## Estado y autoridad

- **Estado:** dirección aprobada por el Owner para documentación y preparación
  de PBI.
- **Autoridad:** `APPROVED — DESIGN SYSTEM & APPLICATION SHELL V1 DIRECTION`.
- **Alcance de la aprobación:** identidad, foundation visual, gobierno de
  estilos, patrones responsive, Application Shell y orden inicial de
  consumidores.
- **No autoriza:** implementación, instalación de dependencias, commit, push,
  pull request, deploy ni cambios de infraestructura.
- **Baseline a la que aplica:** el cliente React/Vite actual. Este documento no
  acepta Next.js ni cambia el estado `Proposed` de ADR-006.

Este es el contrato canónico V1. Una pantalla no puede contradecirlo por
conveniencia local. Un cambio durable a sus tokens, breakpoints, límites o
patrones requiere trazabilidad, revisión de Producto/Diseño/Ingeniería y, si
afecta arquitectura, el proceso de decisión correspondiente.

## Principios

SR Taller conserva conceptualmente el ADN visual maduro de SR Taller 1.0, no su
implementación técnica. La interfaz será sobria, operativa, profesional, densa
pero legible, cómoda durante jornadas largas y trabajo de mostrador, usable con
teclado y móvil, consistente entre módulos y sin decoración innecesaria.

> Las páginas no inventan diseño.

> El producto nace consumiendo el Design System; el Design System no se agrega
> después.

> El tenant personaliza SR Taller; no redefine SR Taller.

## Foundation visual

### Color y tokens semánticos

La paleta se apoya en navy profundo, superficies blancas o neutras en modo
claro, canvas gris claro, superficies casi negras en modo oscuro y un acento
cálido. El coral actual de Preview no es el color principal definitivo.

| Token de referencia | Light | Dark | Regla |
|---|---:|---:|---|
| Accent base | `#B45309` | `#F59E0B` | Debe conservar contraste suficiente |

Hover, active, subtle y contraste derivan del contrato semántico y deben pasar
contraste. El formato, algoritmo OKLCH, límites, fallbacks, vectores y evidencia
obligatoria quedaron fijados en la
[revisión de readiness de PBI-030](PBI_030_READINESS_REVIEW.md#3-gate-del-tenant-accent);
no pueden introducirse como colores arbitrarios en componentes.

Debe existir una sola fuente de verdad basada en CSS custom properties para:

- brand/accent;
- surfaces;
- text;
- borders;
- semantic states;
- aliases del shell.

Success, warning, danger e info son tokens semánticos propios y nunca derivan
del acento del tenant. Los componentes y módulos no usan colores hardcoded.

### Acento del tenant

Cada tenant puede configurar un solo color de marca. El valor normalizado se
conserva exactamente como `brand.base` para identidad y chrome (topbar, logo,
avatar y acentos de navegación). `brand.onBase` elige el foreground legible
para contenido que se renderiza directamente sobre ese valor.

Las acciones que necesitan contraste contra la superficie de página consumen
`brand.action` y sus estados `hover`/`active`. Cuando el valor seleccionado ya
es seguro, `brand.action` coincide con `brand.base`; cuando no lo es, sólo la
acción recibe una variante gobernada en OKLCH. `subtle`, `muted`, `surface`,
`border` y `focus` se derivan de la misma entrada, mientras que `success`,
`warning`, `danger` e `info` permanecen semánticamente independientes.

La adaptación de `onBase` conserva la intención de SR Taller 1.0 —el texto
cambia según la tonalidad— pero en 2.0 se elige el foreground con mayor
contraste medido, en lugar de aplicar únicamente el umbral histórico de
luminancia. Así, un azul oscuro puede usar blanco y un cyan claro puede usar
`#111827` sin forzar texto blanco de bajo contraste.

El acento no puede controlar danger, success, warning, info, estados de
reparación, saldos, acciones destructivas, fondo global, tipografía, radios,
sombras ni layout. Si el color recibido no cumple contraste, el sistema debe
derivar una variante segura sólo para la superficie que lo necesita o usar el
fallback V1. La única excepción de estilo dinámico permitida es su inyección
controlada como custom property raíz.

### Temas

V1 contempla `light`, `dark` y `system` cuando este último pueda resolverse
correctamente. La preferencia debe persistirse, evitar razonablemente el flash
de tema e integrarse con el acento del tenant. Light y dark consumen el mismo
contrato semántico; no se permiten overrides oscuros por módulo.

### Tipografía y datos

La familia V1 es:

```css
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

No se introduce Inter. Los únicos pesos son `400`, `500`, `600` y `700`.
Dinero, folios, cantidades y fechas deben evaluar numeración tabular.

### Densidad, tamaño y spacing

Existen densidades `default` y `compact`, sin selector global en V1. Compact se
reserva para toolbars, tablas y controles secundarios donde produzca eficiencia
real.

| Medida | Valor |
|---|---:|
| Control default | `40px` |
| Control compact | `32px` |
| Touch target mínimo | `44px × 44px` |

La escala de espacio es `0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`, con
unidad conceptual de `4px`. Los módulos no inventan valores cuando existe un
token adecuado.

### Radios, cards y elevación

| Radio | Valor | Uso principal |
|---|---:|---|
| `sm` | `4px` | elementos compactos |
| `md` | `8px` | controles |
| `lg` | `12px` | cards y panels |
| `full` | `999px` | pills y formas circulares |

No se usan radios muy grandes como apariencia general. Cards y panels se
jerarquizan con surface, border y spacing:

> Borde para estructura. Sombra para elevación.

La elevación tiene `none`, `sm`, `md` y `lg`: `none` para page/panel ordinario,
`sm` para una card elevada excepcional, `md` para dropdown/popover/tooltip y
`lg` para drawer/dialog. Dark privilegia surface y border sobre sombras negras.

### Movimiento e iconografía

El movimiento es funcional, sin rebotes ni decoración, y respeta
`prefers-reduced-motion`:

| Token | Duración |
|---|---:|
| `fast` | `120ms` |
| `normal` | `180ms` |
| `slow` | `240ms` |

Debe usarse `lucide-react` como única familia estándar de iconografía funcional
stroke, conforme a la decisión Owner del 2026-08-18 y su
[evaluación técnica](PBI_030_READINESS_REVIEW.md#2-gate-de-iconografía). Usa
imports estáticos nombrados, nunca `DynamicIcon`, `currentColor` y tamaños
canónicos `16/20/24`. Los controles sólo-icono necesitan accessible name. No se
admiten emojis, una segunda librería ni caracteres improvisados como
iconografía estándar. Logo/branding e iconos funcionales son sistemas
independientes. La dependencia sólo puede incorporarse durante la
implementación autorizada de PBI-030, no durante su preparación.

### Breakpoints

| Token | Ancho mínimo |
|---|---:|
| `sm` | `640px` |
| `md` | `768px` |
| `lg` | `1024px` |
| `xl` | `1280px` |

Un módulo no crea breakpoints particulares sin cambiar formalmente este
contrato.

## Application Shell

### Estructura responsive

- Desktop amplio (`>=1280px`): sidebar expandido de `256px`.
- Laptop o desktop restringido (`1024–1279px`): sidebar colapsable de `72px`.
- Mobile (`<1024px`): header y drawer off-canvas de hasta aproximadamente `320px`, siempre
  limitado por el viewport.

El sidebar debe soportar estados expandido, colapsado y drawer; navegación con
scroll independiente; active, hover, focus-visible y disabled; badges cuando
exista un caso real; tooltip al estar colapsado; y persistencia de preferencia
cuando resulte conveniente. No duplica identidad ya visible en el header.

El header global concentra hamburger/collapse, sucursal, estación cuando
exista, theme toggle y menú del operador con logout. No contiene título o
descripción de página, acciones del módulo, métricas ni identidad duplicada.

El `PageHeader` puede contener breadcrumb, eyebrow opcional, título,
descripción breve, una acción primaria dominante, acciones secundarias y estado
de entidad. Tenant, sucursal y operador son visibles principalmente en el
shell/header sin repetición. Cuando el contexto operativo esté realmente
bloqueado se muestra un único blocking banner, no mensajes técnicos repetidos
por pantalla.

Una superficie hija usa `BackLink` para volver a su colección o workspace
padre. El patrón presenta flecha, nombre del destino y foco visible; no se
reimplementa como texto o CSS particular de cada página.

El feedback transitorio y exitoso usa `Toast` con anuncio no intrusivo. Un error
accionable permanece junto al campo/celda y ofrece navegación cuando hay más de
uno; un error global o desconocido permanece en `Alert`. El banner de ambiente
pertenece al shell y no se duplica dentro de una Page.

En móvil se descarta la barra superior de iconos de la Preview actual: la
dirección V1 es header + drawer.

### Arquitectura de información

La IA aprobada no concede visibilidad inmediata:

| Grupo | Capacidades candidatas |
|---|---|
| Operación | Inicio, Reparaciones |
| Listas | Lista de precios |
| Caja | Caja, Cortes |
| Configuración | General, Catálogos, Roles, Usuarios |

Una capacidad sólo aparece si está implementada, autorizada y realmente
disponible en runtime. `Listas` aparece inicialmente sólo cuando Lista de
precios esté disponible. Pedidos y Solicitudes de clientes no aparecen hasta
tener contrato y funcionalidad propios; no se muestran como placeholders o “en
mantenimiento”. Nueva reparación es una acción contextual de Reparaciones, no
un módulo principal.

Inicio es un espacio posible, no un centro operativo obligatorio. Reparaciones
puede ser la superficie diaria principal; el valor de un dashboard debe
validarse mediante necesidades reales.

## Patrones de interacción y responsive

Los patrones se resuelven transversalmente, no de nuevo en cada pantalla:

- sidebar → rail → drawer;
- table → entity cards;
- formulario de dos columnas → una columna;
- panel secundario grande → drawer o full screen;
- acciones de formulario largo → sticky footer móvil.

Desktop usa `DataTable`; móvil usa `MobileEntityCard`. Ambos consumen el mismo
recurso, filtros, sorting, pagination y view model. Una tabla horizontal no es
la solución móvil ordinaria.

Los formularios se agrupan por intención, usan labels visibles, asocian
validación al campo, conservan input tras errores recuperables, tienen máximo
dos columnas en desktop y una en móvil, y aplican acciones sticky sólo cuando
aportan valor. Placeholder nunca sustituye label.

`Dialog` sirve para una decisión breve; `Drawer`, para contexto secundario o
tarea corta; `Page`, para trabajo complejo, largo, profundo o enlazable. Nueva
Reparación es una Page y Detalle de Reparación es una Page/workspace; no se
repite el modal gigante de 1.0.

## Inventario V1 y límites

El inventario aprobado es una dirección, no permiso para construir componentes
sin consumidor real:

| Capa | Elementos |
|---|---|
| Foundation/primitives | Stack, Inline, Text, VisuallyHidden |
| Controls | Button, IconButton, Input, Textarea, Checkbox, Switch, Select |
| Patterns | Field, FormSection, Lookup/Combobox, MoneyInput, Date/DateTime |
| Feedback | Alert, Toast, Spinner, Skeleton, EmptyState, ErrorState |
| Surfaces | Card, Panel, Dialog, Drawer, Dropdown/Menu, Tooltip |
| Navigation | NavItem, Breadcrumb, PageHeader |
| Data | StatusBadge, Table, DataTable, Pagination, FilterBar, MobileEntityCard |
| Application | ApplicationShell |

El Design System no conoce Repair, Customer, Payment, Tenant, backend ni API.
`RepairIntake`, `RepairTimeline`, `RepairDetail`, `PaymentSummary` y
`RepairStateTransition` son Domain UI; `RepairsPage`, `NewRepairPage` y
`RepairDetailPage` son Pages.

Las dependencias siempre descienden:

```text
Foundation → Tokens → Primitives → Components → Patterns → Domain UI → Pages
```

## Estrategia CSS y gobierno

V1 usa CSS custom properties para tokens/temas, CSS Modules para ownership de
componentes, React para estado/clases y CSS para presentación. No adopta
Tailwind, CSS-in-JS ni otro framework CSS paralelo. Una alternativa exige nueva
decisión explícita.

No se permiten colores, radios, sombras o breakpoints arbitrarios por módulo;
estilos inline ordinarios; `!important` como solución habitual; CSS global
genérico; variantes duplicadas; dark overrides por módulo; ni frameworks CSS
paralelos.

Todo token, componente, variante, breakpoint o interacción nuevo necesita un
caso real. El Design System crece desde sus consumidores, no “por si acaso”.

PBI-030 debe reemplazar, dentro de un único candidato no integrable por fases,
el CSS temporal actual. La
[partición A–D y sus checks de retiro](PBI_030_READINESS_REVIEW.md#6-gate-de-partición-una-sola-foundation)
son parte del contrato: `styles.css`, su import y los bridges legacy deben
desaparecer antes del review del SHA; dos foundations activas hacen fallar el
PBI.

## Catálogo visual

V1 utilizará un catálogo interno en `/__internal/ui-catalog`. Estará disponible
en Local y Preview con fixtures sintéticos; Staging futuro lo deshabilita por
defecto y Production futuro debe excluir ruta y chunks del build. La política
completa de flags, indexación, exposición pública y datos permitidos está en la
[revisión de readiness](PBI_030_READINESS_REVIEW.md#4-gate-del-catálogo-visual).
Debe permitir revisar
componentes, variantes, loading, error, disabled, focus, light, dark, acento de
tenant y comportamiento responsive.

Storybook queda fuera de V1. Se reconsidera con 15–20 o más componentes
compartidos, varias aplicaciones consumidoras, varios contribuidores
concurrentes o necesidad de tooling especializado.

## Accesibilidad y privacidad visual

WCAG 2.2 AA es la referencia de diseño, no una declaración de certificación.
El trabajo debe cubrir semántica, teclado, focus-visible, contraste, labels,
asociación de errores, reduced motion, touch targets, reflow y overlays
accesibles. La matriz Primary/Secondary/Best effort y la evidencia manual
mínima están fijadas en la
[revisión de readiness](PBI_030_READINESS_REVIEW.md#5-matriz-de-navegadores-y-tecnologías-de-asistencia).

PIN, contraseña, patrón de dispositivo, datos personales e información
financiera permanecen ocultos por defecto. Un reveal es temporal, explícito,
sujeto a permisos y potencialmente auditable. Secretos y datos sensibles no
deben exponerse indiscriminadamente en tablas, dashboards, DOM, logs visuales,
URLs ni mensajes globales.

## Consumidores y secuencia

Los consumidores aprobados como dirección son:

1. Application Shell.
2. Repairs Worklist.
3. New Repair Page.
4. Repair Detail Page.
5. Configuration / Tenant Appearance.
6. Roles / Users.
7. Lista de precios.
8. Caja / Cortes.

El orden puede cambiar según dependencias de producto. Shell + Reparaciones
será la primera prueba real del sistema visual, pero cada rebanada necesita su
propio alcance y autorización. Se permite un monograma/logo provisional; el
branding final queda fuera del primer PBI.

## Reconciliación arquitectónica

| Fuente | Estado | Reconciliación V1 |
|---|---|---|
| Baseline `apps/dev-preview-web` | React/Vite materializado | Es el cliente al que aplica esta dirección. |
| ADR-006 | `Proposed` | Next.js no queda aceptado. Su pregunta amplia de estrategia de clientes web permanece abierta. |
| PBI-013 | `Deferred` | La dirección visual/CSS del cliente actual queda resuelta; rendering, número de clientes y estrategia web futura permanecen diferidos. |
| ADR-009 | `Accepted` | La foundation comienza dentro del workspace frontend actual; no se crea un paquete compartido sin un segundo consumidor real y una decisión posterior. |
| DEC-005 | Materializada | El Design System no introduce `shared`, `common` o `core` backend ni cambia límites de módulos. |
| DEC-051/DEC-063 | Gates vigentes | La aprobación documental no salta CI, Definition of Ready, evidencia ni autorización de implementación. |

No se identificó conflicto con una decisión arquitectónica aceptada. Sí existe
una tensión documental con la propuesta de Next.js/Tailwind de ADR-006 y
PBI-013; se resuelve manteniendo ADR-006 `Proposed`, descartando Tailwind para
V1 y limitando esta decisión al cliente React/Vite actual.

## Gate de implementación

- El Owner concedió autorización explícita y binaria para implementar PBI-030
  el 2026-08-18 desde `main`
  `f802feecbf1fb7b1c167b8d24f41f4e28db637d9`.
- El candidate final `5ca8866` fue integrado desde
  `feature/pbi-030-design-system-shell` mediante PR #8 y merge commit
  `c8628fb`; el lifecycle vigente de PBI-030 se mantiene en su
  [registro canónico](../backlog/pbis/PBI-030.md), con Owner Acceptance, `Done`
  y deploy tratados como gates separados. La
  [revisión independiente formal](../quality/evidence/pbi-030/INDEPENDENT_REVIEW.md)
  aprobó la implementación después de remediar los defectos encontrados.

Iconografía, accent, catálogo, matriz de compatibilidad y partición técnica
quedaron resueltos documentalmente en la
[revisión de readiness de PBI-030](PBI_030_READINESS_REVIEW.md). La
[evidencia de implementación](../quality/evidence/pbi-030/README.md) registra lo
ejecutado y mantiene `NOT EXECUTED` la matriz de AT/cross-browser no observada;
no afirma `Done`.

## Trazabilidad

- [PBI-013 — estrategia web y design system](../backlog/pbis/PBI-013.md)
- [PBI-030 — materializar UI Foundation y Application Shell V1](../backlog/pbis/PBI-030.md)
- [Revisión de readiness de PBI-030](PBI_030_READINESS_REVIEW.md)
- [Acuerdo técnico de estimación de PBI-030](PBI_030_ESTIMATION_PROPOSAL.md)
- [ADR-006 — clientes web](../decisions/proposed/ADR-006-nextjs-web-clients.md)
- [ADR-009 — repositorio único evolutivo](../decisions/proposed/ADR-009-monorepo-strategy.md)
- [Estrategia de accesibilidad](../quality/ACCESSIBILITY_STRATEGY.md)
- [Estado actual](../CURRENT_STATE.md)

## Próxima revisión

Ante un hallazgo que requiera cambiar el contrato o una decisión Owner
posterior. La integración ya ocurrió; esta dirección no autoriza Owner
Acceptance, `Done` ni deploy.
