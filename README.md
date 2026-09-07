# SR Taller 2.0

SR Taller 2.0 es una plataforma SaaS multitenant para talleres de reparación
de celulares. El repositorio ya no está en una etapa exclusivamente documental:
contiene una baseline ejecutable con frontend de Preview, backend NestJS,
PostgreSQL, controles arquitectónicos, CI y despliegue OCI en Dokploy.

## Estado actual

- **Baseline integrada:** `main`.
- **Runtime:** Node.js `24.18.0`, pnpm `11.15.1` y TypeScript `6.0.3`.
- **Frontend:** React `19.2.8` + Vite `8.2.0`; Design System y Application
  Shell V1 integrados en `main`.
- **Backend:** NestJS `11.1.28` sobre Express; health y Repair Workstream local
  integrado con límites tenant/branch. El candidato PBI-034 agrega Operational
  Session HTTP server-side, todavía sin integrarse a `main`.
- **Persistencia:** PostgreSQL `18.4` local; Kysely + `pg`; tenants, sucursales,
  Trusted Station Context, User Directory, Roles/Capabilities/Assignments,
  credencial PIN y persistencia append-only de los slices integrados de
  Repairs. Las tablas de Session existen sólo en el candidato PBI-034.
- **Preview:** <https://preview.srtaller.dev>, desplegado manualmente desde
  `main` mediante el `Dockerfile` en Dokploy.
- **Producto funcional:** Worklist, Repair Detail, notas operativas, asignación
  de técnico, inicio de diagnóstico y movimiento interno están integrados en
  contexto local sintético; el candidato local agrega login, reload, logout y
  cambio de User visibles, pero no constituye todavía un flujo productivo E2E.
- **CI:** la baseline auditada
  `ccdd7e243265c0f4d19e9798b8ddfa90d97e8c9e` pasó el run autoritativo
  `34124746317` con run-1, run-2 y comparison verdes. No es CI del candidato
  PBI-034.
- **PBI-030:** `Done`; implementación integrada, Owner Acceptance
  aprobada y riesgo AT/cross-browser residual LOW aceptado. `Released: NO`.
- **Roadmap:** Sprint 01 está `Closed`; PBI-033 Roles, Assignments and
  Capability Catalog está `Done` y G2 `PASS`. SPRINT-02 está `Active` con
  PBI-025 `Done` y PBI-034 como PBI actual `In review`, candidato no integrado;
  WIP `1/1`. G3 permanece `Pending` y PBI-026 no ha iniciado.

La fotografía verificable completa, sus límites y el punto de partida están en
[Current Repository State](docs/CURRENT_STATE.md).

## Cómo empezar

1. Leer [CONTRIBUTING.md](CONTRIBUTING.md).
2. Leer el [estado actual auditado](docs/CURRENT_STATE.md).
3. Seguir el
   [workflow canónico de desarrollo y delivery](docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md).
4. Consultar el [MVP Operating Roadmap](docs/product/MVP_OPERATING_ROADMAP.md).
5. Confirmar Git real, el estado de CI y el PBI/tarea autorizado antes de
   modificar código.
6. Crear una rama temporal desde `main`; los ambientes no son ramas.

Para el ciclo local completo, seguir el [contrato de desarrollo local](docs/delivery/LOCAL_DEVELOPMENT.md):
`local:db:up` → `local:db:migrate` → `local:db:seed` → `local:dev`.

## Navegación canónica

- [Índice de documentación](docs/README.md)
- [Visión del producto](docs/product/PRODUCT_VISION.md)
- [Alcance del producto](docs/product/PRODUCT_SCOPE.md)
- [MVP Operating Roadmap](docs/product/MVP_OPERATING_ROADMAP.md)
- [Design System & Application Shell V1](docs/design-system/DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md)
- [PBI-030 Readiness Review](docs/design-system/PBI_030_READINESS_REVIEW.md)
- [Arquitectura de aplicaciones](docs/architecture/APPLICATION_ARCHITECTURE.md)
- [Modelo multitenant](docs/architecture/MULTITENANCY_MODEL.md)
- [Product backlog](docs/backlog/PRODUCT_BACKLOG.md)
- [Registro de decisiones](docs/decisions/README.md)
- [Estrategia de calidad](docs/quality/QUALITY_STRATEGY.md)
- [Estrategia de despliegue](docs/architecture/DEPLOYMENT_STRATEGY.md)
- [Desarrollo local](docs/delivery/LOCAL_DEVELOPMENT.md)

## Regla de autoridad

Para el estado actual mandan, en este orden: runtime e infraestructura
observables, Git/código actual, documentación canónica vigente, decisiones y
evidencia específica. Los documentos históricos, ramas no integradas y
conversaciones no sustituyen a `main`.

## Estado del documento

**Estado:** Entrada operativa reconciliada con la baseline y el candidato
PBI-034 auditados documentalmente el 2026-09-07.

**Próxima revisión:** cuando cambie la baseline integrada, el gate de CI, la
superficie funcional o el punto de entrada del backlog.
