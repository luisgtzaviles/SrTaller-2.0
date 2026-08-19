# SR Taller 2.0

SR Taller 2.0 es una plataforma SaaS multitenant para talleres de reparación
de celulares. El repositorio ya no está en una etapa exclusivamente documental:
contiene una baseline ejecutable con frontend de Preview, backend NestJS,
PostgreSQL, controles arquitectónicos, CI y despliegue OCI en Dokploy.

## Estado actual

- **Baseline integrada:** `main`.
- **Runtime:** Node.js `24.18.0`, pnpm `11.15.1` y TypeScript `6.0.3`.
- **Frontend:** React `19.2.8` + Vite `8.2.0`; Visual Slice 0 navegable.
- **Backend:** NestJS `11.1.28` sobre Express; actualmente sólo expone health.
- **Persistencia:** PostgreSQL `18.4` en Preview; Kysely + `pg`; foundation de
  tenants y sucursales materializada.
- **Preview:** <https://preview.srtaller.dev>, desplegado manualmente desde
  `main` mediante el `Dockerfile` en Dokploy.
- **Producto funcional:** todavía no existe un flujo de negocio end-to-end.
  Las llamadas `/api/preview/*` del frontend no tienen controllers en `main`.
- **Gate conocido:** el CI de `main` en el commit auditado
  `18dab5a017e5db308b5d34f3a3fbd8f86351c818` está rojo porque
  `smoke:start` no recibe la configuración PostgreSQL obligatoria. La PR #5
  publica el arreglo mínimo y pasa CI autoritativo con PostgreSQL real; todavía
  necesita merge explícitamente autorizado y CI verde sobre `main`. Debe
  restaurarse la baseline verde antes de integrar producto.

La fotografía verificable completa, sus límites y el punto de partida están en
[Current Repository State](docs/CURRENT_STATE.md).

## Cómo empezar

1. Leer [CONTRIBUTING.md](CONTRIBUTING.md).
2. Leer el [estado actual auditado](docs/CURRENT_STATE.md).
3. Seguir el
   [workflow canónico de desarrollo y delivery](docs/delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md).
4. Confirmar Git real, el estado de CI y el PBI/tarea autorizado antes de
   modificar código.
5. Crear una rama temporal desde `main`; los ambientes no son ramas.

## Navegación canónica

- [Índice de documentación](docs/README.md)
- [Visión del producto](docs/product/PRODUCT_VISION.md)
- [Alcance del producto](docs/product/PRODUCT_SCOPE.md)
- [Design System & Application Shell V1](docs/design-system/DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md)
- [PBI-030 Readiness Review](docs/design-system/PBI_030_READINESS_REVIEW.md)
- [Arquitectura de aplicaciones](docs/architecture/APPLICATION_ARCHITECTURE.md)
- [Modelo multitenant](docs/architecture/MULTITENANCY_MODEL.md)
- [Product backlog](docs/backlog/PRODUCT_BACKLOG.md)
- [Registro de decisiones](docs/decisions/README.md)
- [Estrategia de calidad](docs/quality/QUALITY_STRATEGY.md)
- [Estrategia de despliegue](docs/architecture/DEPLOYMENT_STRATEGY.md)

## Regla de autoridad

Para el estado actual mandan, en este orden: runtime e infraestructura
observables, Git/código actual, documentación canónica vigente, decisiones y
evidencia específica. Los documentos históricos, ramas no integradas y
conversaciones no sustituyen a `main`.

## Estado del documento

**Estado:** Entrada operativa vigente, reconciliada el 2026-08-18 contra
`main` en `18dab5a017e5db308b5d34f3a3fbd8f86351c818`.

**Próxima revisión:** cuando cambie la baseline integrada, el gate de CI, la
superficie funcional o el punto de entrada del backlog.
