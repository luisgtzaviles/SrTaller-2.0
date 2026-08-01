# VS0 — Visual Slice 0 Development Preview

## Dictamen

**PASS — VISUAL SLICE 0 DEFINED AND IMPLEMENTATION AUTHORIZED**

- **Identificador:** `VS0`.
- **Nombre:** `Vertical Slice Visual 0 — SR Taller 2.0 Development Preview`.
- **Estado:** `Authorized — implementation may begin; main merge, release and
  production remain prohibited`.
- **Fecha:** 2026-08-01.
- **Owner:** Producto + Ingeniería.
- **Revisión proporcional:** Producto + Arquitectura + Ingeniería, con controles
  de Seguridad y Operaciones limitados al entorno DEV_ONLY.
- **Estimación:** `L`, cuatro bloques de implementación y primer deploy temprano.

VS0 es una iniciativa temporal de aprendizaje, no un PBI de R0 o R1. No cambia
el estado de PBI-024, no inicia PBI-025–PBI-029 y no acepta ADR-006 o ADR-007.

## Estado de implementación

La vertical local está implementada y validada en los commits `35bdc47` y
`328dc58`. El deploy permanece bloqueado exclusivamente por la falta de un VPS
preview dedicado y un canal de acceso autorizado; no se reutilizarán entornos
de SR Taller 1.0. El detalle técnico y el handoff están en
[RESULTS.md](RESULTS.md).

## Objetivo

Entregar una URL HTTPS privada y navegable para iterar diariamente con el
Responsable de Producto sobre el shell visual y el recorrido mínimo de
recepción: crear una orden de preview, verla en listado, abrir su detalle y
cambiar un estado básico, con datos sintéticos persistidos en PostgreSQL.

La iniciativa separa dos carriles:

- **visual:** velocidad, UX, demostración y aprendizaje en desarrollo;
- **endurecimiento:** identidad, PIN, sesión, roles, capacidades,
  observabilidad, secretos y gates definitivos permanecen en sus PBIs.

## Decisión de base Git

| Opción | Evaluación | Resultado |
| --- | --- | --- |
| A. Esperar C02 y merge de PR #3 | Protege el flujo de `main`, pero impide obtener feedback visual temprano | Rechazada |
| B. Rama visual desde el HEAD verificado de PR #3 | Reutiliza PBI-024 sin afirmar integración a `main`; mantiene trazabilidad y aislamiento | **Seleccionada** |
| C. Rama de integración adicional | Aporta otra rama y coordinación sin valor adicional para una sola preview | Rechazada |
| D. Frontend desacoplado de PBI-024 | Permite maqueta rápida, pero retrasa la validación de contexto y persistencia reales | Rechazada |

La base funcional verificada es
`81b655f7d43363f5c1e459bd945ab3013da8733a`, descendiente del SHA técnico
causal `2988bcdf362505776f7bc111e3d590aee358d2ce`. La implementación vivirá en
`preview/visual-slice-0`, creada desde el commit documental de autorización que
desciende de esa base.

PR #3 permanece OPEN y Draft. VS0 no modifica, aprueba ni mergea el PR. Ningún
commit de la preview puede integrarse a `main` mientras DEC-051 C02 siga
`Pending — external platform enforcement unavailable`.

## Frontend seleccionado

Se autoriza para VS0 **React + Vite + TypeScript**, con React Router y estilos
CSS locales basados en variables/tokens mínimos. No se adopta Tailwind ni un
design system definitivo.

La selección es acotada y reversible:

- ADR-006 continúa `Proposed`; Next.js no queda aceptado ni rechazado;
- PBI-013 continúa `Deferred` para la estrategia web definitiva;
- no habrá SSR, BFF, server actions ni caché tenant-scoped en la preview;
- las reglas de negocio y autoridad de datos permanecen en la API;
- las versiones estables compatibles con Node.js `24.18.0` se fijarán
  exactamente en `package.json` y `pnpm-lock.yaml` durante el primer bloque.

El cliente será un segundo proyecto expresamente autorizado dentro del mismo
repositorio, bajo `apps/dev-preview-web`. Se permite adoptar un workspace pnpm
mínimo, con un único lockfile y sin orquestador, caché, publicación de packages
o package compartido. Su build estático se incorporará al artefacto backend y
será servido por NestJS/Express; VS0 conserva un proceso y un artefacto
desplegable.

## Arquitectura de preview

```text
Browser
  -> HTTPS + Basic Auth en reverse proxy
  -> React/Vite estático servido por NestJS
  -> /api/preview/*
  -> casos de uso framework-free
  -> puertos owner-scoped
  -> Kysely/pg
  -> PostgreSQL 18.4 exclusivo de desarrollo
```

- El navegador nunca envía `tenantId`, `branchId` o `stationId` como autoridad.
- El backend obtiene `SR_PREVIEW_STATION_ID` desde configuración del servidor
  y usa la capacidad real de PBI-024 para producir `TrustedStationContext`.
- Un actor fijo `SR_PREVIEW_ACTOR_LABEL` sólo aporta atribución visual
  temporal; no simula autenticación, PIN, sesión, rol o capacidad productivos.
- La preview está deshabilitada por defecto y falla al arrancar si se habilita
  sin el contexto sintético completo y la configuración server-side requerida.
- Todas las lecturas y escrituras reciben el contexto confiable y aplican
  alcance compuesto de tenant y sucursal. No se introduce RLS.
- Errores públicos siguen el contrato sanitizado de DEC-044; no exponen SQL,
  stack, rutas, credenciales ni detalles de driver.

## API mínima

| Método y ruta | Propósito | Reglas |
| --- | --- | --- |
| `GET /api/preview/context` | Mostrar tenant, sucursal, estación y badge | Sólo etiquetas públicas resueltas server-side |
| `POST /api/preview/repairs` | Crear registro de preview | Ignora scope del cliente; transacción única |
| `GET /api/preview/repairs` | Listar para búsqueda local | Scope obligatorio; orden determinista; máximo 200 |
| `GET /api/preview/repairs/:id` | Abrir detalle e historial | `404` genérico para id fuera del scope |
| `PATCH /api/preview/repairs/:id/status` | Cambiar estado básico | CAS mediante `revision`; transición preview permitida |

No se autorizan endpoints de login, PIN, sesiones, usuarios, roles, pagos,
inventario, archivos, WhatsApp o administración. El frontend consume sólo este
contrato público y no importa internals del backend.

## Modelo mínimo

El modelo se denomina `PreviewRepairRecord`: es una proyección transitoria para
aprendizaje y no declara resueltas las preguntas de `WorkOrder`, `Repair`,
cliente, equipo, pagos o lifecycle definitivo.

| Clasificación | Elementos |
| --- | --- |
| **Preview required** | `id`, folio `PRE-*` server-side, `tenantId`, `branchId`, `stationId`, nombre y teléfono del cliente, marca y modelo del equipo, IMEI/serie opcional, color opcional, problema reportado, condición física, observaciones, precio estimado y anticipo opcionales en MXN, estado preview, `revision`, `createdAt`, `updatedAt` |
| **Deferred** | identidad/deduplicación de cliente, entidad durable de equipo, propietario/contacto/decisor, moneda configurable, cotización, anticipo/pago, autorización comercial, evidencia/fotos, diagnóstico, técnico, piezas, entrega, garantía, auditoría completa y folio definitivo |
| **Prohibited** | datos reales, credenciales/PIN de equipo, pagos reales, caja, inventario, mensajes reales, secretos, efectos productivos y cualquier inferencia de autorización definitiva |

Se autorizan sólo dos tablas nuevas y owner-scoped:

1. `preview_repairs`, con scope compuesto, snapshots del formulario,
   estado, versión y timestamps;
2. `preview_repair_status_history`, con scope compuesto, estado anterior/nuevo,
   actor DEV_ONLY y timestamp.

Las constraints incluyen pertenencia a tenant/sucursal/estación, unicidad del
folio dentro del tenant y foreign keys compuestas. Toda consulta filtra por el
scope del `TrustedStationContext`. Estas tablas y contratos requieren una
migración deliberada antes de cualquier dominio o release definitivo.

El estado inicial es `received`. Sólo se permiten en preview las transiciones
`received -> diagnosing/cancelled`, `diagnosing -> ready/cancelled` y
`ready -> delivered/cancelled`; son provisionales y no producen pagos,
notificaciones ni otros efectos.

## Seguridad DEV_ONLY

- hostname exclusivo de desarrollo con HTTPS;
- Basic Auth en el reverse proxy, con hash fuera del repositorio;
- firewall con sólo `22`, `80` y `443`; allowlist adicional cuando exista IP
  estable del equipo;
- `DEV PREVIEW` visible en todas las pantallas y `noindex`;
- PostgreSQL no expuesto a Internet;
- variables y secretos separados, mínimo privilegio y permisos de archivo;
- sólo fixtures y datos sintéticos desechables;
- logs básicos sanitizados con correlación, sin payloads sensibles;
- actor fijo claramente rotulado `DEV_ONLY`, sin formulario de login falso.

## VPS y despliegue de desarrollo

Se autoriza un VPS dedicado exclusivamente a preview, separado de staging y
producción, con esta baseline:

- Ubuntu Server 24.04 LTS;
- Node.js `24.18.0` y pnpm `11.15.1`;
- PostgreSQL `18.4` local o en red privada exclusiva de preview;
- Caddy como reverse proxy para HTTPS y Basic Auth;
- systemd para el único proceso Node;
- hostname suministrado mediante `DEV_PREVIEW_HOST`, nunca un dominio de
  producción sin autorización operativa separada.

El deploy parte únicamente de `preview/visual-slice-0` y de un SHA explícito:

1. preparar un release limpio por SHA;
2. instalar con `pnpm install --frozen-lockfile`;
3. ejecutar gates proporcionales y build;
4. respaldar la base de preview y ejecutar migraciones separadamente;
5. activar el release mediante symlink y reiniciar systemd;
6. ejecutar smoke HTTPS y rollback al release anterior si falla.

No se edita código vivo, no se conecta a production, no se reutilizan datos o
credenciales reales y no se declara promoción. ADR-007 continúa `Proposed`;
este despliegue directo y reproducible es una excepción DEV_ONLY, no un patrón
de release productivo.

## Criterios binarios de aceptación

1. Existe una URL HTTPS de desarrollo.
2. El acceso está restringido en el proxy.
3. La aplicación muestra un layout navegable.
4. Tenant, sucursal y estación resueltos son visibles.
5. Nueva reparación puede abrirse.
6. El formulario valida los datos mínimos.
7. Una reparación sintética puede guardarse.
8. El registro queda en PostgreSQL de preview.
9. El listado muestra el registro.
10. El detalle y el historial pueden abrirse.
11. El estado básico puede cambiarse con control de versión.
12. Recargar conserva los datos.
13. Pruebas negativas impiden lectura/escritura cross-tenant y cross-branch.
14. Scope enviado por navegador se rechaza o ignora como autoridad.
15. El badge `DEV PREVIEW` permanece visible.
16. No existen datos reales.
17. No existe merge a `main`.
18. PBI-025–PBI-029 conservan su estado.
19. El deploy por SHA es repetible y tiene rollback.
20. El Responsable de Producto puede iterar visualmente con nuevos pushes.

El checklist operativo está en
[PREVIEW_DEPLOY_CHECKLIST.md](PREVIEW_DEPLOY_CHECKLIST.md).

## Exclusiones

Producción, release, merge a `main`, datos reales, pagos, caja, inventario,
impresión definitiva, WhatsApp, roles/PIN/sesiones/autorización definitivos,
auditoría u observabilidad completas, offline, RLS, migración de datos reales,
aceptación de R1 y cierre del MVP.

## Revisión proporcional y autorización

La revisión única confirma:

- base Git, alcance, stack, API, modelo, DEV_ONLY, VPS y deploy cerrados;
- compatibilidad con ADR-001/002/004/005/009/010 y PBI-024;
- ADR-006/007 permanecen `Proposed` y no se sustituyen;
- DEC-051 C02 permanece `Pending` y bloquea sólo integración funcional a
  `main`, no el trabajo aislado ni el VPS no productivo aquí autorizado;
- PBI-025–PBI-029, R1, release y producción permanecen fuera de alcance.

No se requiere otra revisión documental previa a implementar mientras no
cambien estas decisiones. Un cambio de scope, datos reales, exposición pública,
otro desplegable, identidad definitiva o producción exige nueva autorización.

## Siguiente acción

**Provisionar o autorizar el VPS preview dedicado, ejecutar el deploy exacto
por SHA con `ops/preview/` y completar smoke HTTPS y revisión visual sin datos
reales.**

## Referencias

- [PBI-024](../../backlog/pbis/PBI-024.md)
- [Verificación formal de PBI-024](../pbi-024/FORMAL_IMPLEMENTATION_VERIFICATION.md)
- [ADR-005](../../decisions/proposed/ADR-005-nestjs-backend.md)
- [ADR-006](../../decisions/proposed/ADR-006-nextjs-web-clients.md)
- [ADR-007](../../decisions/proposed/ADR-007-containerized-deployments.md)
- [ADR-009](../../decisions/proposed/ADR-009-monorepo-strategy.md)
- [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md)
- [DEC-044](../../decisions/dec-044-error-strategy/DECISION_PROPOSAL.md)
- [DEC-051](../../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md)
- [Plan de implementación](IMPLEMENTATION_PLAN.md)
- [Resultados y handoff](RESULTS.md)
