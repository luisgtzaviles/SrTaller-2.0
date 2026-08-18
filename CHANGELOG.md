# Changelog

Todos los cambios relevantes del proyecto se registrarán aquí. El formato y la estrategia de versiones se detallan en [Versioning Strategy](docs/delivery/VERSIONING_STRATEGY.md).

## [Unreleased]

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

- Baseline ejecutable Node.js/NestJS con health `/livez` y `/readyz`.
- Monolito modular con checker de arquitectura, ownership de persistencia y
  límites `tenancy`, `stations` y `access`.
- Visual Slice 0 React/Vite servida desde el mismo artefacto OCI.
- PostgreSQL 18.4 de Preview, migrador Kysely one-shot, tablas `tenants` y
  `branches`, repositories tenant-scoped y transaction runner.
- Dockerfile OCI multi-stage y Preview materializado en Dokploy sobre `main`.
- Workflow canónico y CI autoritativo con PostgreSQL real y evidencia dual.
- Candidato mínimo de CI para que `smoke:start` use PostgreSQL aislado ya
  migrado sin relajar el arranque fail-closed; verificado localmente, todavía
  sin run autoritativo sobre un SHA publicado.

### Estado conocido no resuelto

- El CI de `main` en `18dab5a` falla en `smoke:start` porque el proceso
  compilado no recibe la configuración PostgreSQL obligatoria. El arreglo está
  en una rama candidata y el gate de la baseline continúa abierto hasta CI e
  integración verificados.
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
  funcional V1, incorporable sólo durante la implementación. El PBI permanece
  `Draft — readiness blocked` por estimación del equipo y CI autoritativo
  pendientes.

## Estado del documento

**Estado:** Registro vigente; las entradas antiguas conservan historia y el
estado actual se resume en `docs/CURRENT_STATE.md`.
**Próxima versión y fecha:** TBD.

## Próxima revisión

Al aprobar una estrategia de versionado o preparar el primer release; fecha: TBD.
