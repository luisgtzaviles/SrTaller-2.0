# PBI-030 — Acuerdo técnico de estimación

## Estado y autoridad

- **Estado:** Acordada por Frontend/Ingeniería.
- **Fecha de propuesta:** 2026-08-18.
- **Fecha de revisión formal:** 2026-08-18.
- **Decisión:** `AGREED — XL` mediante T-shirt sizing.
- **Confianza:** Media.
- **Riesgo:** Alto.
- **Partición:** `KEEP AS SINGLE PBI`, con checkpoints internos A–D y un solo
  candidato integrable.
- **Autoridad ejercida:** revisión técnica funcional de Frontend/Ingeniería
  solicitada expresamente por el Owner. El proceso canónico asigna al equipo la
  validación de esfuerzo, riesgo y dependencias; no exige una persona nombrada,
  votación, ceremonia o unidad distinta de estimación.
- **Límite de la decisión:** registra el acuerdo técnico requerido por
  Definition of Ready. No atribuye consenso a participantes no observados y no
  sustituye la autoridad del Owner sobre alcance, prioridad, inicio, merge o
  deploy.
- **No autoriza:** implementación, instalación de dependencias, asignación a
  sprint, merge o deploy.

## Interpretación de Definition of Ready

La [Definition of Ready](../delivery/DEFINITION_OF_READY.md) exige una
“estimación acordada por el equipo” y prohíbe inventar Story Points. El
[modelo de priorización](../backlog/PRIORITIZATION_MODEL.md) separa la
aprobación del orden por el Product Owner de la validación de esfuerzo, riesgo
y dependencias por el equipo. La revisión Owner autorizada pide precisamente
esa evaluación desde Frontend/Engineering y permite registrar `AGREED — XL` o
una alternativa razonada.

En este contexto, la revisión formal constituye la validación técnica de la
función Frontend/Ingeniería requerida por el proceso. No se afirma un acuerdo
social más amplio ni autorización de implementación.

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

## Evidencia de la baseline frontend

La evaluación se realizó contra el código materializado, no sólo contra el
documento de alcance:

- `apps/dev-preview-web/src/App.tsx` es un consumidor monolítico de 383 líneas
  que concentra shell, navegación y cuatro superficies de Preview;
- `apps/dev-preview-web/src/styles.css` tiene 200 líneas globales con colores,
  radios, sombras, tipografías, pesos, breakpoints y dimensiones legacy;
- `main.tsx` importa esa hoja global y no existen todavía tokens, themes,
  CSS Modules, catálogo ni tests frontend dedicados;
- la UI contiene SVG inline y caracteres usados como iconografía funcional;
- React `19.2.8`, Vite `8.2.0` y React Router `7.18.2` ya son baseline; CSS
  Modules está disponible sin introducir otro framework;
- las rutas actuales dependen de APIs ausentes, por lo que la migración debe
  conservar estados honestos y fixtures sintéticos, no inventar producto.

## Complexity Assessment

| Bloque | Complejidad | Incertidumbre | Acoplamiento | Riesgo de regresión | Carga de pruebas | Carga de migración |
|---|---|---|---|---|---|---|
| Tokens, themes y tenant accent | Alta | Media | Alta | Alta | Alta | Media |
| Foundation CSS, CSS Modules y checker | Alta | Media | Alta | Alta | Alta | Alta |
| Shared UI materializada bajo demanda | Alta | Media | Alta | Media/Alta | Alta | Alta |
| Application Shell responsive | Alta | Media | Alta | Alta | Alta | Alta |
| Catálogo y política por ambiente | Media | Media | Media | Media | Media/Alta | Baja |
| Accesibilidad, compatibilidad y evidencia | Alta | Media | Alta | Alta | Alta | Media |
| Lucide y control de bundle | Baja | Baja | Baja | Baja/Media | Media | Media |
| Migración Preview y retiro legacy | Alta | Media | Alta | Alta | Alta | Alta |

La complejidad agregada no viene de un archivo aislado. Varios bloques
transversales deben converger en el mismo SHA, preservar las rutas actuales y
probar que no quedan dos foundations activas. Ese acoplamiento y la carga de
evidencia justifican `XL` aunque el frontend actual sea pequeño.

## Supuestos

- PBI-030 conserva exactamente el alcance actual.
- Sólo se materializan componentes con consumidor real dentro del shell o
  catálogo; el inventario V1 completo no se construye por anticipado.
- React/Vite y CSS Modules permanecen vigentes.
- PBI-024 continúa como dependencia blanda y se usan fixtures honestos.
- No se agrega Storybook, framework CSS paralelo o segundo package compartido.
- Browser/AT evidence puede ejecutarse conforme a la matriz aprobada.
- La baseline CI permanece verde antes de iniciar implementación.

## Riesgo y confianza

**Riesgo High:** la migración atraviesa estilos globales, shell, navegación,
responsive, accesibilidad, estados, iconografía, catálogo y todos los
consumidores actuales. Una integración parcial produciría deriva visual o dos
fuentes de verdad; el checker y el retiro legacy son gates, no trabajo
opcional.

**Confidence Medium:** alcance, arquitectura, exclusions, gates, toolchain y
baseline CI están definidos. No es High porque la evidencia manual
cross-browser/AT, el comportamiento exacto de drawer/focus/reflow, los casos
del tenant accent y el inventario mínimo descubierto al migrar consumidores
conservan incertidumbre razonable. No hay incertidumbre suficiente para bajar
la talla o bloquear la estimación.

## Dependency Assessment

- **PBI-024:** dependencia blanda. Bloquea contexto real de tenant/sucursal/
  estación u operador, pero no tokens, shell, fixtures sintéticos ni estados
  honestos.
- **ADR-006:** `Proposed`; no contradice materializar V1 en React/Vite y no es
  un hard dependency.
- **Lucide:** selección y contrato resueltos; la instalación permanece
  prohibida hasta implementación autorizada.
- **CI:** baseline verde en `main`; no existe bloqueo técnico base conocido.
- **APIs de producto:** fuera de alcance; su ausencia debe seguir visible y no
  impide la foundation.

**Conclusión:** no se descubrió un hard dependency que invalide `XL` o impida
`Ready`.

## Partición de ejecución

**Decisión: `KEEP AS SINGLE PBI`.** El resultado aceptable es atómico: una sola
foundation y un shell V1 sin `styles.css` legacy. Dividirlo ahora en PBIs
integrables independientes dejaría temporalmente dos foundations o convertiría
la eliminación legacy en una dependencia artificial fácil de diferir.

Se conservan checkpoints internos, todos dentro de la misma rama/candidato:

1. **A — Foundation:** tokens, themes, accent y checker.
2. **B — Shell:** primitives consumidas, Application Shell y navegación.
3. **C — Consumers:** rutas actuales, estados y catálogo.
4. **D — Convergence:** retiro legacy, bundle, accesibilidad y evidencia final.

Los checkpoints permiten revisión y diagnóstico, pero no merges ni deploys
parciales. Si D no termina, PBI-030 no pasa Definition of Done.

## Condiciones de reestimación

Requieren nuevo acuerdo de Frontend/Ingeniería:

- ampliar el inventario a componentes sin consumidor real;
- mantener legacy más allá del candidato o permitir integración por fases;
- agregar Storybook, Tailwind, CSS-in-JS o package compartido;
- incluir producto funcional, API, auth o contexto de estación real;
- cambiar React/Vite, estrategia web o librería de iconos;
- no disponer de los ambientes AT/browser comprometidos;
- agregar deploy, migración de datos o infraestructura al PBI.

## Decisión final

**ESTIMATION: XL — AGREED.**

**CONFIDENCE: MEDIUM.**

**RISK: HIGH.**

**PARTITION: KEEP AS SINGLE PBI.**

La estimación cierra `OPEN-PBI030-06`. La autorización de implementación sigue
siendo un gate Owner separado.
