# Epics iniciales

## Estado del documento

**Estado:** Borrador. Ningún epic representa compromiso de fecha, versión o implementación.
**Criterio común:** sólo se descompone cuando el problema, actores, límites y dependencias son suficientemente conocidos.

## EPIC-000 — Product Discovery and Architecture

- **Objetivo:** establecer visión, lenguaje, límites, decisiones propuestas y gates antes de construir.
- **Valor:** reduce decisiones implícitas y alinea producto, arquitectura, calidad y entrega.
- **Capacidades:** visión, alcance, actores, glosario, mapa modular, arquitectura, ADRs, backlog.
- **Dependencias:** participación del Product Owner y aprendizaje del sistema anterior.
- **Riesgos:** convertir hipótesis en requisitos o extender indefinidamente el descubrimiento.
- **Exclusiones:** código funcional, scaffolding e infraestructura.
- **Estado:** Sprint 00 `Closed`.
- **Puede descomponerse cuando:** el resultado documental y su autoridad de aprobación estén definidos; PBI-001 a PBI-020 constituyen la descomposición inicial.

## EPIC-001 — Engineering Foundation

- **Objetivo:** preparar, en una fase futura aprobada, la base repetible de desarrollo, pruebas, CI/CD y observabilidad.
- **Valor:** permite cambios pequeños, verificables y desplegables de forma segura.
- **Capacidades:** repositorio único evolutivo conforme a ADR-009, contratos, pipelines, configuración, ambientes y estándares; workspaces sólo bajo demanda.
- **Dependencias:** EPIC-000 y ADRs técnicos aceptados.
- **Riesgos:** crear plataforma interna antes de validar necesidades o fijar tooling prematuramente.
- **Exclusiones:** funcionalidades de taller y microservicios.
- **Estado:** PBI-023 `Closed`; Identity & Context Foundation cerrada en
  Sprint 01. SPRINT-02 está `Active` con PBI-025 `In progress` y WIP `1/1`.
- **Puede descomponerse cuando:** arquitectura, stack, ambientes y quality gates estén aprobados.
- **Actualización:** [PBI-021](pbis/PBI-021.md) y
  [PBI-022](pbis/PBI-022.md) están `Done`. [PBI-023](pbis/PBI-023.md) está
  `Closed`. [PBI-024](pbis/PBI-024.md) fue acotado a Trusted Station Runtime
  Context con recuperación histórica selectiva. PBI-025–PBI-029 y
  PBI-031–PBI-036 separan PIN, sesión, autorización, auditoría y observabilidad.
  [PBI-030](pbis/PBI-030.md) tiene cierre `Done`; PBI-027/PBI-029/PBI-024/
  PBI-032/PBI-033 están `Done`; PBI-025 está `In progress` en SPRINT-02 y
  PBI-034 es candidato no iniciado.

## EPIC-002 — Tenant and Platform Administration

- **Objetivo:** administrar ciclo de vida de tenants y operación central sin cruzar fronteras de datos.
- **Valor:** habilita el modelo SaaS y soporte controlado de la plataforma.
- **Capacidades:** alta/suspensión de tenant, configuración base, administración central y operaciones auditadas.
- **Dependencias:** EPIC-001, modelo multitenant, identidad de plataforma y planes.
- **Riesgos:** privilegios cross-tenant excesivos y procesos de soporte sin auditoría.
- **Exclusiones:** personalización ilimitada y base independiente por tenant.
- **Estado:** Discovery required.
- **Puede descomponerse cuando:** ciclo de vida, autoridades, controles y requisitos de datos estén validados.

## EPIC-003 — Identity and Access

- **Objetivo:** autenticar identidades y autorizar acciones por membresía, rol, permiso, sucursal y contexto operativo.
- **Valor:** protege datos y permite responsabilidades diferenciadas en el taller.
- **Capacidades:** identidad global, membresías, roles, permisos, sesiones, revocación y step-up.
- **Dependencias:** EPIC-000, Tenant Management y políticas de seguridad.
- **Riesgos:** escalamiento de privilegios, reglas inmanejables y recuperación de cuenta débil.
- **Exclusiones:** algoritmos criptográficos finales antes de threat modeling.
- **Estado:** User Directory y Roles/Capabilities/Assignments `Done`; G2
  `PASS`. Operational Authentication está en ejecución mediante PBI-025 bajo
  sus gates Critical y WIP=1; PBI-034 no está iniciado.
- **Puede descomponerse cuando:** actores, matriz de acciones sensibles y lifecycle de acceso estén aprobados.

## EPIC-004 — Branch and Device Management

- **Objetivo:** modelar sucursales, asignaciones y dispositivos autorizados para operación con PIN.
- **Valor:** ofrece acceso operativo controlado y trazable en cada ubicación.
- **Capacidades:** sucursal, asignación, vinculación, activación, revocación, sesiones y cambio de turno.
- **Dependencias:** EPIC-003, Tenant Management y preguntas de operación.
- **Riesgos:** dispositivo perdido, PIN compartido o acceso fuera de sucursal.
- **Exclusiones:** operación offline hasta validarla.
- **Estado:** PBI-024 runtime `Done`; PBI-031 administración reconciliada y no
  iniciada.
- **Puede descomponerse cuando:** flujo de vinculación, supervisión, revocación y asignación estén decididos.

## EPIC-005 — Customer Management

- **Objetivo:** mantener información útil de clientes del taller con calidad, privacidad y ownership definidos.
- **Valor:** reduce duplicados y conecta atención, reparaciones, ventas y comunicaciones.
- **Capacidades:** perfil, contactos, búsqueda, consentimiento y relación con operaciones.
- **Dependencias:** EPIC-001, multitenancy, sucursales y política de datos.
- **Riesgos:** duplicados, exposición de PII y ownership ambiguo entre sucursales.
- **Exclusiones:** CRM avanzado e identidad de cliente final no validada.
- **Estado:** Discovery required.
- **Puede descomponerse cuando:** campos mínimos, deduplicación, privacidad y alcance por sucursal estén acordados.

## EPIC-006 — Repair Operations

- **Objetivo:** acompañar la recepción, diagnóstico, ejecución y entrega de reparaciones.
- **Valor:** hace visible el trabajo y mejora trazabilidad y comunicación con el cliente.
- **Capacidades:** orden de trabajo, estados, asignación técnica, evidencia, costos y entrega.
- **Dependencias:** Customers, Branches, Identity, Inventory, Payments y Files.
- **Riesgos:** workflow demasiado rígido, estados ambiguos y cambios sin auditoría.
- **Exclusiones:** automatizar procesos no confirmados para todos los talleres.
- **Estado:** Discovery required.
- **Puede descomponerse cuando:** lifecycle, excepciones, autoridades y datos mínimos se validen con usuarios.

## EPIC-007 — Inventory

- **Objetivo:** controlar existencias y movimientos de artículos por alcance operativo definido.
- **Valor:** reduce pérdidas y mejora disponibilidad para reparaciones y ventas.
- **Capacidades:** catálogo, existencias, movimientos, transferencias, ajustes y alertas futuras.
- **Dependencias:** Branches, Identity, Repairs, Sales y Audit.
- **Riesgos:** unidades/costos ambiguos, concurrencia y ajustes sin autorización.
- **Exclusiones:** logística avanzada y contabilidad completa.
- **Estado:** Discovery required.
- **Puede descomponerse cuando:** ownership, unidades, valoración, movimientos y aprobaciones estén definidos.

## EPIC-008 — CRM and Messaging

- **Objetivo:** unificar conversaciones y seguimiento de clientes, con backend como fuente de verdad.
- **Valor:** mejora continuidad de atención en canales presentes y futuros.
- **Capacidades:** conversaciones, mensajes, canales, estados, webhooks, tiempo real y seguimiento CRM.
- **Dependencias:** Customers, Identity, Integrations, Notifications, queues y consentimiento.
- **Riesgos:** duplicados, orden incorrecto, límites de proveedores y fuga entre rooms tenant.
- **Exclusiones:** todos los canales desde la primera versión y extracción prematura a microservicio.
- **Estado:** Discovery required.
- **Puede descomponerse cuando:** canal inicial, ownership, retención, estados e idempotencia estén validados.

## EPIC-009 — Payments and Cash Management

- **Objetivo:** registrar pagos y controlar cajas/turnos conforme a operación confirmada.
- **Valor:** concilia movimientos financieros con reparaciones y ventas.
- **Capacidades:** pagos, métodos, caja, apertura/cierre, ajustes, reembolsos y evidencia.
- **Dependencias:** Repairs, Sales, Branches, Identity, Audit e integraciones de pago.
- **Riesgos:** diferencias de caja, permisos insuficientes y requisitos fiscales variables.
- **Exclusiones:** contabilidad completa y facturación de todos los países.
- **Estado:** Discovery required.
- **Puede descomponerse cuando:** workflows, monedas, autoridades y obligaciones regionales estén delimitados.

## EPIC-010 — Subscription and Billing

- **Objetivo:** gestionar planes y suscripciones de tenants sin confundir billing SaaS con cobros del taller.
- **Valor:** sostiene comercialmente la plataforma y aplica capacidades de planes de forma auditable.
- **Capacidades:** catálogo de planes, suscripción, entitlements, estados y facturación SaaS futura.
- **Dependencias:** Tenant Management, Integrations para un proveedor de cobro SaaS y decisiones comerciales; no depende de Payments/Cash Register del taller salvo decisión explícita futura.
- **Riesgos:** reglas comerciales no definidas, bloqueo incorrecto y diferencias regionales.
- **Exclusiones:** facturación global completa y marketplace.
- **Estado:** Discovery required.
- **Puede descomponerse cuando:** modelo comercial, trials, lifecycle y proveedor/región estén aprobados.

## EPIC-011 — Reporting and Audit

- **Objetivo:** ofrecer evidencia de acciones y lecturas operativas confiables sin comprometer aislamiento.
- **Valor:** apoya control, soporte, investigación y decisiones del taller.
- **Capacidades:** auditoría inmutable lógica, consultas, exportaciones y reportes autorizados.
- **Dependencias:** todos los módulos fuente, modelo de permisos, datos y retención.
- **Riesgos:** reportes cross-tenant, información stale y volumen de eventos.
- **Exclusiones:** data warehouse o BI avanzado desde el inicio.
- **Estado:** Discovery required.
- **Puede descomponerse cuando:** eventos auditables, consumidores, frescura y retención se acuerden.

## EPIC-012 — Integrations

- **Objetivo:** conectar servicios externos mediante límites resilientes, seguros y observables.
- **Valor:** extiende canales y automatiza flujos sin contaminar el dominio con APIs de proveedores.
- **Capacidades:** adapters, webhooks, credenciales, retries, idempotencia y health.
- **Dependencias:** módulos consumidores, Security, Messaging y Operations.
- **Riesgos:** rate limits, cambios externos, secretos y acciones duplicadas.
- **Exclusiones:** integrar todos los proveedores conocidos.
- **Estado:** Discovery required.
- **Puede descomponerse cuando:** caso de uso, proveedor, SLA, datos y degradación estén definidos.

## EPIC-013 — Mobile Clients

- **Objetivo:** ofrecer clientes iOS/Android futuros sobre la misma API central cuando exista valor validado.
- **Valor:** amplía acceso operativo sin duplicar reglas de negocio.
- **Capacidades:** autenticación móvil, flujos seleccionados, notificaciones y sincronización futura.
- **Dependencias:** API estable, Identity, Devices, design system y estrategia de distribución.
- **Riesgos:** construir paridad innecesaria, offline ambiguo y ciclos de stores.
- **Exclusiones:** aplicaciones móviles completas durante fundación.
- **Estado:** Later.
- **Puede descomponerse cuando:** usuarios, journeys, offline, seguridad y distribución estén validados.

## EPIC-014 — Migration from Legacy SR Taller

- **Objetivo:** evaluar una transición controlada que preserve sólo datos y prácticas con valor comprobado.
- **Valor:** reduce interrupción sin trasladar automáticamente deuda o complejidad.
- **Capacidades:** inventario de datos, mapping, calidad, reconciliación, ensayo y rollback.
- **Dependencias:** modelos destino aprobados, políticas de migración, clientes piloto y acceso al origen.
- **Riesgos:** datos incompletos, semántica distinta, PII y cutover irreversible.
- **Exclusiones:** migración automática completa asumida desde el inicio y copia de código legacy.
- **Estado:** Later / Discovery required.
- **Puede descomponerse cuando:** alcance, calidad, obligaciones, cohortes y criterios de aceptación se conozcan.

## Preguntas abiertas

- ¿Qué epics componen el primer release de valor y cuáles quedan explícitamente después?
- ¿Quién aprueba que un epic está listo para descomponerse?
- ¿Qué capacidades requieren investigación con talleres antes de priorizarse?

## Próxima revisión

Después de la revisión de visión, alcance y preguntas críticas; fecha: TBD.
