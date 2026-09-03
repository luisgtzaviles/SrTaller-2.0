# Changelog

Todos los cambios relevantes del proyecto se registrarán aquí. El formato y la estrategia de versiones se detallan en [Versioning Strategy](docs/delivery/VERSIONING_STRATEGY.md).

## [Unreleased]

### Desarrollo local

- Materializado el contrato de desarrollo local con PostgreSQL 18.4 aislado,
  roles `migration`/`application`, migración real, seed sintético determinista,
  reset fail-closed y proxy Vite local. No cambia Preview ni Dokploy.

### Documentación

- Creación de la fundación documental de producto, arquitectura, decisiones, entrega, backlog, Sprint 00, calidad y operaciones.
- Registro inicial de las decisiones técnicas como propuestas; ADR-002 fue aceptado posteriormente.
- Creación de los PBIs documentales PBI-001 a PBI-020.
- Aceptación de ADR-001: TypeScript como lenguaje obligatorio por defecto del código nuevo de producto autorizado y Node.js `24.x` como runtime oficial inicial, con política LTS/EOL, validación en runtime y excepciones gobernadas.
- Aceptación de ADR-002: monolito modular orientado al dominio como arquitectura inicial.
- Aceptación de ADR-003: PostgreSQL como motor relacional transaccional primario, PostgreSQL 18.x como baseline de R0 y PostgreSQL 18.4 como versión efectiva inicial, sin seleccionar proveedor, ORM, migrador, pooler, extensiones ni RLS.
- Aceptación de ADR-004: multitenancy con base y esquema compartidos, propiedad SaaS/tenant/sucursal y aislamiento obligatorio desde R0.
- Aceptación de ADR-009: repositorio único evolutivo, una sola aplicación y artefacto backend para R0, con workspaces bajo demanda y tooling deliberadamente diferido.
- Aceptación de ADR-010: contexto operativo resuelto por estación vinculada, sucursal derivada y usuario atribuible sin selección manual de sucursal.
- Aceptación de ADR-011: identidad ordinaria por tenant, autenticación cotidiana por PIN y una sesión operativa activa por estación con atribución histórica.
- Aceptación de ADR-012: roles de tenant, capacidades por acción, alcance tenant/sucursal, unión de roles y autorización negativa server-side.
- Aceptación de ADR-013: acciones sensibles, reautenticación de un solo uso, segundo aprobador, segregación e invalidación de autorizaciones reforzadas.
- Cierre de DEC-002 y DEC-062 por el Responsable de Producto: R0 queda definido como fundación ejecutable multi-tenant, con inclusiones, exclusiones, escenarios y autoridad de aceptación verificables; implementación y aceptación permanecen pendientes.

### Implementación

- Materializado localmente D6.2 como command focal
  `Área de pendientes → Taller`, con catálogo por sucursal, historial
  append-only, versión e idempotencia independientes, transacción atómica con
  Timeline y UI en Repair Detail. La validación Owner local pasó sin hallazgos
  abiertos; el cambio permanece como candidato sin integración ni deploy.

- La revisión independiente del candidato Repair Workstream corrigió la
  ambigüedad de idempotencia de D3 (retry idéntico frente a conflicto `409`),
  periodos relativos de Worklist, búsqueda literal de `%`/`_` y rollback seguro
  de la cadena de migraciones; también se corrigió el mensaje obsoleto del
  Dashboard sobre la disponibilidad local de Repairs. Se añadieron regresiones
  materiales sobre PostgreSQL 18.4; el candidato sigue sin integración ni
  deploy.

- Reconciliada la superficie HTTP local de Repairs con DEC-005: policy
  fail-closed por path/owner/presentation/composición, enforcement AST sin
  excepción específica de Repairs y mutaciones negativas para placement,
  acceso DB/adapter y cruces intermodulares. No agrega rutas ni cambia producto.

- Baseline ejecutable Node.js/NestJS con health `/livez` y `/readyz`.
- Monolito modular con checker de arquitectura, ownership de persistencia y
  límites `tenancy`, `stations` y `access`.
- Visual Slice 0 React/Vite servida desde el mismo artefacto OCI.
- PostgreSQL 18.4 de Preview, migrador Kysely one-shot, tablas `tenants` y
  `branches`, repositories tenant-scoped y transaction runner.
- Dockerfile OCI multi-stage y Preview materializado en Dokploy sobre `main`.
- Workflow canónico y CI autoritativo con PostgreSQL real y evidencia dual.
- Integración de PR #5 para que `smoke:start` y `smoke:ui` usen PostgreSQL
  aislado ya migrado sin relajar el arranque fail-closed; `main` recuperó CI
  autoritativo verde en el run `32199570584` sobre `efd9ec05`.
- Colector de evidencia actualizado para inventariar assets controlados de la
  Preview sin confundir URLs `https://` con rutas Windows y conservando rechazo
  de artefactos no permitidos.
- Candidato PBI-030 materializado sobre React/Vite: tokens semánticos,
  light/dark/system, accent gobernado, `lucide-react`, componentes con
  consumidores, Application Shell responsive y catálogo interno lazy.
- Contratos automáticos agregados para impedir doble foundation, iconografía no
  canónica, valores visuales arbitrarios y exposición del catálogo en
  Production; la surface Preview conserva smoke positivo y `noindex`.
- Lucide fijado en `1.31.0` después de que el primer CI del candidato rechazara
  `1.32.0` por la edad mínima de publicación; no se añadió waiver ni excepción
  de supply chain.
- Revisión independiente de PBI-030 completada: contraste y límites de control,
  breakpoint mobile `<1024px`, foco/touch, overlays, estado de tema, headings,
  honestidad ante fallo de API y evasiones del checker fueron remediados con
  pruebas de regresión. La revisión cerró con `PASS` sobre el candidate final.
- PR #8 integrada con autorización Owner mediante merge commit `c8628fb`; CI
  autoritativo de `main` `32217905296` pasó run-1, run-2 y comparison. PBI-030
  permanece `In review`; no hubo deploy ni se infiere Owner Acceptance o `Done`.

### Estado conocido no resuelto

- La UI llama `/api/preview/*`, pero `main` no contiene endpoints de producto.
- PBI-024 tiene implementación sólo en una PR draft divergente y conflictiva;
  no está integrado ni cerrado.

### Documentación reconciliada

- Se agregó `docs/CURRENT_STATE.md` como fotografía auditada de la baseline y
  frontera foundation/producto.
- Se corrigió el README raíz y el tracking de PBI-024 para dejar de afirmar que
  la implementación no había iniciado.
- Se convirtió la dirección Owner aprobada de Design System & Application
  Shell V1 en contrato canónico, se reconcilió con ADR-006/PBI-013 sin aceptar
  Next.js o Tailwind y se preparó PBI-030 como `Draft` no autorizado para
  implementación.
- Se completó el readiness técnico de accent, catálogo, compatibilidad y
  partición de PBI-030. El Owner aprobó `lucide-react` como única familia
  funcional V1, incorporable sólo durante la implementación. Frontend/
  Ingeniería acordó `XL` con Confidence Medium y Risk High, manteniendo un solo
  PBI con checkpoints A–D. La revisión DoR pasó y PBI-030 quedó `Ready`; PR #5
  está integrada y `main` verde. El Owner autorizó después la implementación;
  la implementación está integrada en `main` y permanece `In review`, con CI e
  independent review aprobados; todavía no está desplegada ni `Done` y conserva
  evidencia AT parcial más Owner Acceptance pendiente.

## Estado del documento

**Estado:** Registro vigente; las entradas antiguas conservan historia y el
estado actual se resume en `docs/CURRENT_STATE.md`.
**Próxima versión y fecha:** TBD.

## Próxima revisión

Al aprobar una estrategia de versionado o preparar el primer release; fecha: TBD.
