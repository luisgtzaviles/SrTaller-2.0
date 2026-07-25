# Mapa de dependencias para desbloquear DEC-004

## Propósito y autoridad

Este documento analiza dependencias; no acepta, cierra ni cambia el estado de ninguna decisión. La fuente central de IDs y estados sigue siendo el [inventario consolidado](../blocker-closure/INVENTARIO_DE_BLOQUEANTES.md), y los ADR aceptados prevalecen sobre propuestas anteriores.

## Decisiones analizadas

| Decisión | Estado oficial | Alcance pendiente | Dependencias entrantes | Qué bloquea | ¿Resolución independiente? |
| --- | --- | --- | --- | --- | --- |
| `DEC-004` | `Accepted — Selection Approved / Evidence Pending` | Ratificación Linux nativa, VC-024 y revisión de evidencia final | `DEC-001`, `DEC-002`; ADR-001/003/005/009 aceptados | Cierre de evidencia de toolchain y primer cambio ejecutable junto con los demás H0 | La selección está satisfecha; la evidencia final necesita `DEC-051` para VC-024 |
| `DEC-005` | `Accepted — Materialized / Formally Verified` | Ninguno dentro de DEC005-C01 a C05; PBI-022 está `Done` | `DEC-001`, `DEC-002`; ADR-002/005/009; selección DEC-004: satisfechas | Ya no bloquea `DEC-049`; sus reglas alimentan persistencia y pruebas | Sí; cerrada por la sexta verificación formal `PASS` |
| [`DEC-044`](../../decisions/dec-044-error-strategy/FORMAL_REVIEW.md) | `Accepted` — 2026-07-24; Responsable del Proyecto | DEC044-C01 a C08 vigentes y pendientes para futura materialización | Stack, ADR-004/005, DEC-005/049/062: satisfechas | Ya no bloquea H0; sus contratos alimentan DEC-051/063, logs/correlación y la futura materialización | Sí; decisión cerrada, materialización no autorizada |
| [`DEC-049`](../../decisions/dec-049-persistence-ownership/FORMAL_REVIEW.md) | `Accepted` — 2026-07-24; Responsable del Proyecto | DEC049-C01 a C08 vigentes y no cumplidas para futura materialización | ADR-002/003/004/005/009; selección `DEC-004`; `DEC-005` verificada; `DEC-007` materialmente respondida por ADR-004: satisfechas | Ya no bloquea H0; alimenta `DEC-050`, aislamiento integrado y pruebas de repositorio | Sí; decisión cerrada, materialización no autorizada |
| `DEC-050` | Abierta; principios parciales aceptados | Migrador, naming, locking, ejecución, compatibilidad, rollback/roll-forward y evidencia | ADR-003/004; `DEC-004`, `DEC-049`; estrategia de pruebas aplicable | Migraciones reproducibles, fixtures e integración PostgreSQL | No; debe seguir a `DEC-049` y coordinarse con `DEC-051` |
| [`DEC-051`](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md) | `Accepted` — 2026-07-24; C01 a C10 vigentes y pendientes | Pipeline por riesgo, gates, portafolio, PostgreSQL, aislamiento, errores, CI, evidencia, flakiness y protección de `main` aceptados; falta materialización | `DEC-002`, `DEC-062`, riesgos; ADR-004/005; toolchain de `DEC-004`; contratos aceptados `DEC-005/044/049`: satisfechas | Evidencia de CI para DEC-004, pruebas de R0, `DEC-052` y `DEC-063` | Decisión cerrada; materialización y VC-024 requieren autorización/evidencia |
| [`DEC-063`](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) | `Accepted with conditions` — 2026-07-24; C01 a C08 `Pending` | Contrato definido; faltan templates, riesgo, manifest, CI y checklists especializados | `DEC-004/005/044/049/051`; ADR-004/010–013: satisfechas para la decisión | DoD verificable y prerrequisitos de VC-024 | Decisión cerrada; materialización requiere autorización |

## Dependencias aceptadas que ya no deben reabrirse

| Autoridad aceptada | Contenido que aporta |
| --- | --- |
| [ADR-001](../../decisions/proposed/ADR-001-typescript-as-primary-language.md) — secciones “Decisión”, “Runtime oficial inicial” y “Seguridad de tipos” | TypeScript, Node.js `24.x`, validación runtime y gobierno de excepciones |
| [ADR-002](../../decisions/proposed/ADR-002-modular-monolith-first.md) — “Decisión”, “Reglas arquitectónicas obligatorias” y “Propiedad de datos” | Monolito modular, un artefacto, dominio independiente, dependencias acíclicas y ownership lógico |
| [ADR-003](../../decisions/proposed/ADR-003-postgresql-primary-database.md) — “Baseline técnica de R0”, “Principios de persistencia”, “Migraciones” y “ORM, query builder, driver y repositorios” | PostgreSQL `18.x`/`18.4`, principios de persistencia y migración; tooling explícitamente pendiente |
| [ADR-004](../../decisions/proposed/ADR-004-shared-schema-multitenancy.md) — “Decisión”, “Matriz de propiedad lógica”, “Contexto confiable”, “Módulos y repositorios” y “Controles y pruebas requeridos” | Base/esquema compartidos, discriminación tenant/sucursal, contexto server-side y pruebas negativas |
| [ADR-005](../../decisions/proposed/ADR-005-nestjs-backend.md) — “Decisión”, “NestJS es shell”, “Persistencia y lifecycle”, “Pruebas arquitectónicas obligatorias” y “Condiciones de aceptación” | NestJS `11.x`, Express, REST/JSON, límites de capas y precondiciones para el primer recorrido |
| [ADR-009](../../decisions/proposed/ADR-009-monorepo-strategy.md) — “Decisión”, “Dependencias”, “Tooling deliberadamente diferido” y relaciones con DEC-005/049 | Repositorio único, una app/artefacto, sin workspaces ni packages anticipatorios |
| [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md) — “Decisión”, “Resolución del contexto” y “Reglas obligatorias” | Tenant/sucursal derivados de estación vinculada; contexto inmutable y fail closed |
| [ADR-011](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) — “Contrato conceptual del PIN”, “Sesión operativa” y “Decisiones diferidas” | PIN tenant-scoped, una sesión activa por estación y mecanismos técnicos aún abiertos |
| [ADR-012](../../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) — “Modelo de roles”, “Modelo de capacidades”, “Asignaciones y alcance” y “Evaluación de autorización” | Roles tenant-scoped, unión de capacidades, alcance y denegación server-side |
| [ADR-013](../../decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md) — “Clasificación conceptual mínima”, “Reautenticación”, “Segundo usuario” y “Decisiones diferidas” | Niveles 1–4, un solo uso, segregación y política concreta pendiente por acción |

## Tabla de dependencias entre las siete decisiones

Las relaciones distinguen una dependencia normativa de una dependencia de evidencia. Esta distinción evita un ciclo falso entre `DEC-004` y `DEC-051`.

| Desde | Hacia | Tipo | Razón |
| --- | --- | --- | --- |
| `DEC-004` — selección | `DEC-005` | Técnica | La organización física y su enforcement necesitan módulos, compilación y scripts conocidos |
| `DEC-004` — selección | `DEC-049` | Técnica | Driver/ORM/query builder deben ser compatibles con Node.js, TypeScript y PostgreSQL aceptados |
| `DEC-004` — selección | `DEC-044` | Técnica menor | El contrato es agnóstico, pero la adaptación exterior usa NestJS/REST aceptados |
| `DEC-004` — selección | `DEC-051` | Técnica | Runner, scripts y CI dependen del package manager, módulos y compilación |
| `DEC-005` | `DEC-049` | Arquitectónica | Ownership de módulos y datos determina dónde viven puertos y adaptadores |
| `DEC-005` | `DEC-051` | Evidencia | Las reglas de imports, ciclos y capas deben convertirse en gates |
| `DEC-049` | `DEC-050` | Técnica | El migrador debe convivir con la estrategia y propiedad de acceso a datos |
| `DEC-049` | `DEC-051` | Evidencia | Las pruebas de integración necesitan contratos de repositorio y persistencia real |
| `DEC-044` | `DEC-051` | Evidencia | La taxonomía y no divulgación deben probarse |
| `DEC-044` | `DEC-063` | Calidad | La DoD debe exigir errores seguros cuando apliquen |
| `DEC-050` | `DEC-051` | Evidencia bidireccional acotada | `DEC-050` define qué probar; `DEC-051` define el gate que ejecuta migraciones |
| `DEC-051` | `DEC-004` — evidencia final | Evidencia | El cierre de DEC-004 exige primera ejecución real del gate CI en Linux |
| `DEC-051` | `DEC-063` | Gobierno de calidad | La DoD consume gates y evidencia aprobados, no inventa otra suite |

## Grafo

`DEC-004: selección` y `DEC-004: evidencia` son fases analíticas de la misma decisión, no IDs ni decisiones nuevas.

```mermaid
flowchart TD
    A1[ADR-001/003/005/009 Accepted] --> D4S[DEC-004: selección de toolchain]
    D4S --> D5[DEC-005: formalmente verificada]
    D4S --> D44[DEC-044: Accepted; C01-C08 pendientes]
    D4S --> D49[DEC-049: repositorios Accepted]
    D5 --> D49
    D5 --> D51[DEC-051: Accepted; C01-C10 pendientes]
    D49 --> D50[DEC-050: migraciones]
    D49 --> D51
    D44 --> D51
    D50 --> D51
    R0[DEC-062 cerrada: contrato R0] --> D44
    R0 --> D51
    D44 --> D63[DEC-063: Accepted; C01-C08 Pending]
    D51 --> D63
    D51 --> D4E[DEC-004: CI Linux y reproducibilidad]
    D4S --> D4E
```

## Bloqueantes directos e indirectos de DEC-004

### Para cerrar estrictamente la decisión de plataforma

Son directos:

- escoger y fijar package manager y versión;
- decidir política de lockfile y scripts de instalación;
- fijar Node.js `24.x` a una versión efectiva reproducible;
- decidir ESM/CommonJS y compilación/ejecución TypeScript;
- revalidar versiones alineadas de NestJS `11.x`;
- definir instalación reproducible y supply chain mínima;
- ejecutar compatibilidad integrada y el gate real sobre Linux.

`DEC-051` es una dependencia de evidencia para el último punto. No debe absorber el resto de DEC-004.

### Para construir la fundación ejecutable R0 que motivó el intento anterior

Además son o fueron dependencias de la fundación:

- `DEC-005` y `DEC-049`, ya satisfechas para estructura y contrato de persistencia tenant-aware; las ocho condiciones de DEC-049 siguen pendientes;
- `DEC-044`, ya aceptada, para resultados seguros; DEC044-C01 a C08 siguen
  pendientes;
- `DEC-050`, para migraciones reproducibles;
- `DEC-051` y `DEC-063`, aceptadas pero no materializadas, para evidencia y
  criterio de terminado;
- mecanismos H1 de estación, PIN, sesión y revocación;
- composición concreta de roles/capacidades y clasificación de acciones;
- threat model, secretos, auditoría mínima y autorización organizacional.

Por tanto, **cerrar DEC-004 no equivale a declarar R0 programable o completo**.

## Lectura de la ruta crítica

La selección de `DEC-004`, la organización de `DEC-005`,
[DEC-044](../../decisions/dec-044-error-strategy/FORMAL_REVIEW.md) y
[DEC-049](../../decisions/dec-049-persistence-ownership/FORMAL_REVIEW.md) y
[DEC-051](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md) y
[DEC-063](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) ya
están satisfechas como decisiones. La sexta verificación formal cerró también
PBI-022; DEC-044, DEC-049, DEC-051 y DEC-063 fueron aceptadas el 2026-07-24
con sus condiciones pendientes. La ruta crítica H0 activa es VC-024, que
consume prerrequisitos materializados de DEC-051/063. `DEC-050` puede
prepararse como H1 y
coordinar su evidencia con DEC-051. La evidencia Linux y de reproducibilidad
vuelve finalmente a DEC-004 para recomendar el cierre de su evidencia.
