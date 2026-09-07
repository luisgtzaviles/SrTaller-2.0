# Changelog

Todos los cambios relevantes del proyecto se registrarán aquí. El formato y la estrategia de versiones se detallan en [Versioning Strategy](docs/delivery/VERSIONING_STRATEGY.md).

## [Unreleased]

### Desarrollo local

- Extendido el candidato local con bootstrap de Station restringido a
  loopback/same-origin, Session Access-owned, login/logout/cambio de User y
  gate del Application Shell. Full verify, PostgreSQL 18.4 material, lifecycle
  HTTP y validación visual responsive Light/Dark pasan localmente; SHA/CI
  exactos del candidato permanecen pendientes. No cambia Preview ni Dokploy.

- Materializado el contrato de desarrollo local con PostgreSQL 18.4 aislado,
  roles `migration`/`application`, migración real, seed sintético determinista,
  reset fail-closed y proxy Vite local. No cambia Preview ni Dokploy.

### Documentación

- Preparado PBI-034 como candidato de integración `In review`, PBI actual de
  SPRINT-02 con WIP `1/1`. Se reconciliaron su alcance stateful, el hecho de que
  `SR_SESSION_SIGNING_KEY` permanece sin consumidor y la materialización
  DEC-005 Option A policy v4. Verificaciones locales pasan; SHA final, focused
  Critical-risk review, PR y CI exactos permanecen pendientes. PBI-034 no está
  `Done`, G3 sigue `Pending` y PBI-026 no ha iniciado.

- Iniciado PBI-034 Operational Session como único PBI actual de SPRINT-02,
  con tamaño `Large`, riesgo `Critical` preservado, threat model, DoR `PASS`,
  Owner Start Authorization y DEC-005 Option A dirigida autorizada. PBI-025
  quedó `Done` mediante PR #32, merge
  `ccdd7e243265c0f4d19e9798b8ddfa90d97e8c9e` y CI exacto `34124746317`
  GREEN. No autoriza PBI-026, release ni deploy.

- Preparado el cierre canónico candidato de PBI-025: PR #30 funcional
  `328bdf541be88b21a2e7dbea28f4a2a6f32f6986`, CI `34094803024`, PR #31
  remediación `a51ddcca13cfc43fccb77378643b6874dfb772da`, CI `34100056690`
  first-attempt GREEN, focused review PASS y Owner Acceptance condicional
  APPROVED. La ratificación Owner de PR #30 es exclusiva de este cierre,
  conserva el primer rojo y no constituye waiver general. PBI-034 queda
  seleccionado, no iniciado; G3 permanece Pending.

- Reconciliado el estado histórico posterior a PR #30: PBI-025 tenía alcance funcional
  integrado en `main` por merge `328bdf541be88b21a2e7dbea28f4a2a6f32f6986`
  y CI exacto `34094803024` GREEN, pero permanecía `In review`, WIP `1/1`,
  sin Owner Acceptance ni `Done`, por el incidente Critical de flakiness.
- Registrado el primer intento rojo de CI candidato `34092781952` como
  evidencia material y la integración posterior como desviación de
  DEC-051/DEC-063, no como waiver. PR #31 restauró el gate mediante
  diagnóstico seguro, `--no-maglev` acotado al proceso Critical, Linux x64 5x
  y CI first-attempt exacto; PBI-034 permanece seleccionado, no iniciado.

- Iniciado PBI-025 PIN Credential Authentication como único PBI actual de
  SPRINT-02, con estimación `Large`, riesgo `Critical` preservado, threat model
  y DoR `PASS` bajo el Identity Master Goal. El slice no incluye Session,
  login, autorización, release ni deploy.

- Reconciliado PBI-033 como `Done` y G2 como `PASS`: PR #29 merge
  `d1a98c6d158cf53e1718a75c82f8eafbc3aafaf1` y CI exacto post-cierre
  `34084930812` GREEN completaron la semántica post-merge. Sprint 01 está
  `Closed`; ninguno de sus PBIs está `Released`.

- Preparado el cierre canónico candidato de PBI-033: candidate funcional
  `bb5a1efde19171703d0b3ce84567ff14538b32b7`, CI candidato `34081637692`
  GREEN, focused high-risk review PASS sin hallazgos BLOCKER/HIGH/MEDIUM,
  merge funcional PR #28 `065b859e3db64f82f033ce75ce5fb33df9b3ade1`,
  CI exacto de `main` `34082394514` GREEN y Owner Acceptance condicional
  satisfecha. PBI-033 y G2 quedan `Done candidate` / `PASS candidate`;
  `Released: NO`. No existe PBI actual; PBI-025 queda seleccionado, no
  iniciado, con riesgo `Critical`, estimación `TBD` y DoR pendiente.

- Iniciado PBI-033 Roles, Assignments and Capability Catalog bajo DoR PASS,
  riesgo High, tamaño Large y autorización del Identity Master Goal. El
  catálogo se limita a `users.read`, `access_matrix.read`, `repairs.read` y
  `repairs.add_note`; durante la ejecución el candidate ocupó WIP `1/1`, sin
  PIN, Session, enforcement PBI-026, merge, release ni deploy.

- Reconciliado PBI-032 como `Done` efectivo: cierre PR #27 merge
  `db6637ee6902b9b0e4a40ba39d7f203cb6889352` y CI post-cierre
  `34074457695` GREEN completaron la semántica post-merge. `Released: NO`.

- Preparado el cierre canónico candidato de PBI-032: candidate funcional
  `326a11802a4be32970d4e0634a61841b6bcb9b86`, CI candidato `34072027504`
  GREEN, focused high-risk review PASS, merge funcional
  `66aebdbb45f368755107db315772654bee5399a3`, CI de `main` `34072709330`
  GREEN y Owner Acceptance condicional satisfecha. PBI-032 queda `Done
  candidate`, `Released: NO`; no existe PBI actual y PBI-033 permanece
  seleccionado, no iniciado.

- Reconciliado PBI-024 como `Done` canónico mediante PR #25, merge
  `2b0ab85bb19b795c71332b5f2ef36ee26a75cdfe` y CI `34044488745` GREEN;
  `Released` y deploy permanecen NO. PBI-032 pasa a candidato en revisión y
  PBI-033 permanece seleccionado, no iniciado.

- Preparado el cierre canónico candidato de PBI-024: merge funcional
  `5966d2f20fcf29aedf91a841a4fe331cb9bae410`, CI de `main` `34019773228`
  GREEN, focused high-risk review PASS y Owner Acceptance condicional
  satisfecha. El estado `Done` requiere integrar este PR documental; `Released`
  y deploy permanecen NO. PBI-032 queda únicamente seleccionado, no iniciado.

- Cerrado canónicamente PBI-029: threat model y DoR PASS, riesgo `CRITICAL`
  aceptado, focused security review PASS, merge funcional
  `36d93736d46b69acadadd95ef66809332fbb5bd4`, CI funcional `33974100385`
  GREEN, Owner Acceptance APPROVED, cierre documental merge
  `41914c78724303d66136989937cf8f38e4ea8a88` y CI post-cierre `33988752597`
  GREEN. `Released` y deploy permanecen NO; PBI-024 queda únicamente como
  siguiente candidato.

- Iniciado PBI-029 bajo autorización Owner de riesgo `CRITICAL`: threat model
  local-first, DoR PASS, inventario de secretos sin valores y evidencia de
  candidato. No introduce secretos reales, proveedor externo, deploy ni
  consumidores de identidad.

- Preparado el cierre canónico candidato de PBI-027: merge funcional
  `4d54f84e8ad4b16b2889a555f7fc75975c6ddc68`, CI de `main` `33944664589`
  GREEN y Owner Acceptance APPROVED. El estado `Done` requiere integrar este
  PR documental; `Released` y deploy permanecen NO. PBI-029 queda únicamente
  seleccionado como siguiente candidato.

- Preparado el avance documental canónico de PBI-030: `Done` basado
  en merge de gobernanza `117ada7f70494b2cb35ed7adf78c3529dd271391` y CI
  `33821753091` GREEN. Sprint 01 permanece `Planned`, no existe PBI actual y
  PBI-027 sólo queda seleccionado, pendiente de DoR, estimación y autorización
  Owner; no se autoriza implementación, release ni deploy.

- Aprobado y materializado el MVP Operating Roadmap con workflow WIP=1,
  Owner Acceptance obligatoria antes de `Done`, avance mediante PR documental
  y separación estricta entre selección, implementación, release y deploy.
- Reconciliada Identity & Context Foundation: PBI-024–PBI-029 fueron acotados y
  PBI-031–PBI-036 materializan Station Administration, Users, Roles,
  Operational Session, Reinforced Authorization y Extended Observability.
- Preparado Sprint 01 como `Planned — ready for activation`, sin PBI actual;
  PBI-027 queda como siguiente candidato pendiente de DoR/estimación.
- Owner Acceptance de PBI-030 aprobada y cobertura AT/cross-browser pendiente
  dispuesta como `Bajo (LOW) — ACCEPTED RESIDUAL QUALITY RISK`. El PBI
  permanece `In review` hasta integrar esta reconciliación documental; no se
  activa Sprint 01 ni se autoriza implementación o deploy.

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

- Materializado localmente el candidato PBI-034: Session stateful con una
  activa por Station, bearer/CSRF aleatorios con sólo verificadores
  persistidos, start/resolve/touch/logout/switch, invalidación de lifecycle,
  HTTP same-origin/no-store, PostgreSQL 18.4, gate de login y composición
  dirigida DEC-005 Option A policy v4. `SR_SESSION_SIGNING_KEY` no tiene
  consumidor; contextual authorization, release y deploy quedan fuera.

- Integrado funcionalmente el candidate PBI-033: catálogo mínimo de
  capabilities, roles tenant-scoped, assignments
  tenant-wide/branch-restricted, read models, commands server-only, migraciones
  aditivas y fixtures sintéticos. No expone administración HTTP/UI ni concede
  autorización contextual final.

- Materializado el candidato PBI-032 User Directory and Lifecycle: identidad
  tenant-scoped, bootstrap server-only de primer User, lecturas list/get,
  lifecycle optimista con journal durable de idempotencia y pruebas materiales
  PostgreSQL de aislamiento y concurrencia. No agrega HTTP/UI de Users, roles,
  PIN, sesión, autorización, deploy ni secretos productivos.

- Materializada la foundation mínima de configuración externa server-only:
  catálogo de secretos activos/reservados, requisitos fail-closed, diagnósticos
  redactados y guardas contra exposición en archivos versionados o bundle Vite.
  Los valores futuros de PIN, sesión y Station siguen sin consumidor.

- Corregidas las aserciones de compatibilidad Preview DB y OCI para reconocer
  la cadena completa de migraciones gobernadas ya presente; no cambia el
  esquema ni ejecuta una migración adicional.

- Materializada localmente la timezone mínima por Branch: migración aditiva,
  fallback IANA histórico `America/Hermosillo`, validación que rechaza offsets
  fijos, actualización tenant/branch-scoped y presentación de instantes sin
  reescritura histórica. Incluye pruebas unitarias y PostgreSQL 18.4; no
  agrega API, UI ni nuevas features de negocio.

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

- El Repair Workstream local está integrado, pero sigue usando contexto y actor
  sintéticos. Trusted Station Context, Users, Roles/Capabilities/Assignments y
  PIN están integrados server-side. Operational Session existe sólo en el
  candidato PBI-034 no integrado; contextual authorization sigue sin
  materializar y PBI-026 no ha iniciado.
- La PR draft histórica de PBI-024 no se integra completa. Sólo puede aportar
  piezas recuperadas selectivamente y revalidadas bajo el nuevo alcance.

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
