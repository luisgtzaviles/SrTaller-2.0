# PBI-030 — Propuesta técnica de estimación

## Estado y autoridad

- **Estado:** Propuesta técnica para acuerdo del equipo.
- **Fecha:** 2026-08-18.
- **Estimación propuesta:** `XL` mediante T-shirt sizing.
- **Confianza:** Media.
- **Riesgo:** Alto por migración visual transversal y evidencia multi-viewport.
- **Acuerdo del equipo:** Pendiente.
- **Autoridad:** Frontend/Ingeniería debe acordar la estimación. El Owner
  conserva autoridad sobre alcance, prioridad y autorización de implementación,
  pero no sustituye el acuerdo del equipo exigido por Definition of Ready.
- **No autoriza:** Implementación, instalación de dependencias, asignación a
  sprint, merge o deploy.

## Interpretación de Definition of Ready

La [Definition of Ready](../delivery/DEFINITION_OF_READY.md) exige una
“estimación acordada por el equipo” y prohíbe inventar Story Points. No fija
método, escala ni unidad. Por tanto, T-shirt sizing es un formato válido si el
equipo lo adopta; esta propuesta no cierra el gate hasta que ese acuerdo quede
registrado.

## Alcance estimado

La talla cubre el resultado completo de PBI-030, no sólo la creación de tokens:

- tokens semánticos, escalas y aliases de shell;
- temas light/dark/system, persistencia y prevención razonable de flash;
- algoritmo, fallbacks y tests del tenant accent;
- foundation CSS única y ownership mediante CSS Modules;
- catálogo visual interno, fixtures y política por ambiente;
- primitives, controls y patterns exclusivamente consumidos por el shell y el
  catálogo dentro del alcance;
- Application Shell, sidebar `256/72`, header y drawer móvil;
- responsive en `390/640/768/1024/1280`;
- incorporación gobernada de `lucide-react` y medición de bundle/tree-shaking;
- migración de consumidores actuales de Preview;
- retiro completo de `styles.css`, su import y bridges legacy;
- tests automáticos, arquitectura/checker, smokes y evidencia visual;
- teclado, focus, reduced motion, reflow y baseline AT proporcional.

No incluye APIs, Reparaciones funcionales, identidad, station context real,
PostgreSQL de producto, deploy ni cambios de infraestructura.

## Desglose relativo

El desglose explica complejidad; no son horas, fechas, mini-PBIs ni compromiso
de sprint.

| Bloque | Tamaño relativo | Incertidumbre principal |
|---|---|---|
| Tokens, escalas, themes y tenant accent | `M` | derivaciones, flash y contratos light/dark |
| Foundation CSS, CSS Modules y checker | `M` | enforcement sin falsos positivos ni bridges |
| Application Shell y navegación responsive | `L` | drawer, foco, scroll, persistencia y breakpoints |
| Catálogo, fixtures y estados | `M` | exclusión efectiva de Production y cobertura útil |
| Migración Preview y retiro legacy | `L` | conservar rutas honestas sin dos foundations |
| Tests, accesibilidad y evidencia | `L` | matriz manual/automática y múltiples viewports |
| Lucide y control de bundle | `S` | imports, accessible names y tree-shaking |

**Resultado agregado propuesto: `XL`.** No se suman tallas como unidades
numéricas; la clasificación refleja que varios bloques `L/M` deben converger
en un solo candidato sin foundation legacy activa.

## Supuestos

- PBI-030 conserva exactamente el alcance actual.
- Sólo se materializan componentes con consumidor real dentro del shell o
  catálogo; el inventario V1 completo no se construye por anticipado.
- React/Vite y CSS Modules permanecen vigentes.
- PBI-024 continúa como dependencia blanda y se usan fixtures honestos.
- No se agrega Storybook, framework CSS paralelo o segundo package compartido.
- Browser/AT evidence puede ejecutarse conforme a la matriz aprobada.
- El arreglo CI queda integrado y verde antes de iniciar implementación.

## Condiciones de reestimación

Requieren nuevo acuerdo del equipo:

- ampliar el inventario a componentes sin consumidor real;
- mantener legacy más allá del candidato o permitir integración por fases;
- agregar Storybook, Tailwind, CSS-in-JS o package compartido;
- incluir producto funcional, API, auth o contexto de estación real;
- cambiar React/Vite, estrategia web o librería de iconos;
- no disponer de los ambientes AT/browser comprometidos;
- agregar deploy, migración de datos o infraestructura al PBI.

## Partición de ejecución

La talla `XL` aconseja checkpoints A–D ya definidos en la readiness review,
pero no cuatro resultados integrables. El PBI conserva un solo resultado:
foundation y shell V1 sin `styles.css` legacy. Si el equipo no acepta trabajar
una talla `XL` bajo ese modelo, debe proponer una partición que mantenga el gate
de una sola foundation antes de acordar la estimación.

## Gate

**ESTIMATION GATE: TEAM AGREEMENT REQUIRED.**

Para cerrarlo, Frontend/Ingeniería debe registrar una de estas decisiones:

1. `AGREED — XL`, confirmando esta propuesta; o
2. otra talla/método con alcance, supuestos y razón de cambio explícitos.

Hasta entonces PBI-030 permanece `Draft — readiness blocked`.
