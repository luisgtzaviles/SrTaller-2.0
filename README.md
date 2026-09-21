# SR Taller 2.0

SR Taller 2.0 es una plataforma SaaS multitenant para talleres de reparación
de celulares. El repositorio ya no está en una etapa exclusivamente documental:
contiene una baseline ejecutable con frontend de Preview, backend NestJS,
PostgreSQL, controles arquitectónicos, CI y despliegue OCI en Dokploy.

## Estado actual

- **Baseline integrada:** `main`; Git y la CI del SHA exacto son autoridad sobre
  cualquier snapshot documental.
- **Runtime:** Node.js `24.18.0`, pnpm `11.15.1` y TypeScript `6.0.3`.
- **Frontend:** React `19.2.8` + Vite `8.2.0`; Design System y Application
  Shell V1 integrados en `main`.
- **Backend:** NestJS `11.1.28` sobre Express; health y Repair Workstream local
  integrado con límites tenant/branch, Operational Session y Contextual
  Authorization HTTP server-side.
- **Persistencia:** PostgreSQL `18.4` local; Kysely + `pg`; tenants, sucursales,
  Trusted Station Context, User Directory, Roles/Capabilities/Assignments,
  credencial PIN y persistencia append-only de los slices integrados de
  Repairs y Session.
- **Preview:** <https://preview.srtaller.dev>, desplegado manualmente desde
  `main` mediante el `Dockerfile` en Dokploy.
- **Producto funcional:** Identity/Access, Repairs, Customer/Intake,
  Branch timezone y Catalog/Pricing con Bulk Catalog Composer están integrados;
  PBI-040 y PBI-041 están `Done`, `Released: NO`.
- **Roadmap:** SPRINT-02 y SPRINT-03 están `Closed`; no existe PBI actual ni
  siguiente candidato y el WIP de producto es `0/1`.
- **Trabajo operacional:** una Work Unit autorizada se descubre en
  [ACTIVE_CHECKLIST.md](docs/work/ACTIVE_CHECKLIST.md); no se infiere del chat.

La fotografía verificable completa, sus límites y el punto de partida están en
[Current Repository State](docs/CURRENT_STATE.md).

## Cómo empezar

1. Leer [AGENTS.md](AGENTS.md).
2. Verificar Git y leer la
   [Work Unit activa](docs/work/ACTIVE_CHECKLIST.md).
3. Leer [CONTRIBUTING.md](CONTRIBUTING.md) y seguir el
   [workflow canónico de desarrollo y delivery](docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md).
4. Consultar el [Work Unit Lifecycle](docs/delivery/WORK_UNIT_LIFECYCLE.md) y el
   [MVP Operating Roadmap](docs/product/MVP_OPERATING_ROADMAP.md) aplicable.
5. Confirmar CI, ambiente, datos y autoridad antes de
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

**Estado:** Entrada operativa estable. El estado volátil se deriva de Git,
GitHub, runtime, roadmap y `ACTIVE_CHECKLIST`; no se fija aquí como snapshot.

**Próxima revisión:** cuando cambie la baseline integrada, el gate de CI, la
superficie funcional o el punto de entrada del backlog.
