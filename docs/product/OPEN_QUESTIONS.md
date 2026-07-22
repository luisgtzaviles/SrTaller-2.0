# Preguntas abiertas

## Estado del documento

- **Estado:** Activo; registro de preguntas abiertas, en investigación y cerradas.
- **Naturaleza:** Fuente central de incertidumbres de producto. Una opción listada no constituye decisión.
- **Aprobación de respuestas:** Corresponde al propietario del producto, con consulta técnica, operativa, legal o de seguridad cuando aplique.
- **Estados permitidos en esta versión:** `Abierta`, `En investigación`, `Respondida pendiente de documentar`, `Cerrada con decisión`.
- **Estado actual:** 26 preguntas abiertas, 4 en investigación y 4 cerradas con decisión.

## Uso del registro

Al responder una pregunta se debe registrar la evidencia, actualizar los documentos afectados y, si la respuesta fija una dirección durable o costosa de revertir, crear o actualizar el ADR correspondiente. No se debe cambiar una pregunta a cerrada sólo porque exista una opción preferida en conversación.

## Decisión de fundación registrada

El Responsable de Producto cerró `DEC-002` y `DEC-062` el 2026-07-21: R0 será una fundación ejecutable multi-tenant, sin Reparaciones ni recepción, con escenarios y autoridad de aceptación verificables. La fuente consolidada es [Criterios de salida de R0](../architecture-readiness/blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md).

La decisión no resuelve por sí sola ninguna de las 34 preguntas numeradas de este registro. En particular, `QUESTION-003` permanece abierta porque definir R0 y declarar R1 como primera rebanada operativa no termina de aprobar el recorrido completo, sus variantes o sus métricas. Por tanto, los conteos permanecen en 26 abiertas, 4 en investigación y 4 cerradas con decisión.

## Producto

<a id="question-001"></a>
### QUESTION-001 — Segmento inicial de talleres

- **Contexto:** SR Taller 2.0 está dirigido principalmente a talleres de reparación de celulares, pero no se han definido tamaño, madurez operativa, número de sucursales ni mercado inicial.
- **Impacto:** Determina recorridos, complejidad, soporte, propuesta comercial y prioridades.
- **Opciones conocidas:** talleres de una sucursal; talleres multisucursal; un segmento escalonado que comience con uno de ellos; segmentación distinta sustentada por investigación.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada.

<a id="question-002"></a>
### QUESTION-002 — Resultados y métricas de éxito

- **Contexto:** Existen resultados deseados, pero no hay métricas, líneas base ni metas numéricas aprobadas.
- **Impacto:** Sin criterios de éxito no puede evaluarse prioridad, adopción ni resultado de una entrega.
- **Opciones conocidas:** resultados operativos; seguridad y control; experiencia del cliente; resultado comercial; combinación priorizada con definiciones observables.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; actualizar [Visión de producto](./PRODUCT_VISION.md) al responder.

## Operación del taller

<a id="question-003"></a>
### QUESTION-003 — Recorrido operativo prioritario

- **Contexto:** R0 fue aprobado como fundación sin Reparaciones y R1 será la primera rebanada operativa de Reparaciones. Aún no se ha aprobado el primer recorrido completo con todas sus variantes y métricas.
- **Impacto:** Define el núcleo de una primera versión, vocabulario, dependencias y criterios de salida.
- **Opciones conocidas:** recepción a entrega de una reparación; reparación más cobro; venta de mostrador; una secuencia incremental de estos recorridos.
- **Estado:** Abierta.
- **Decisión relacionada:** `DEC-002` delimita R0 y su relación con R1, pero no cierra esta pregunta.

<a id="question-004"></a>
### QUESTION-004 — Acciones sensibles y autoridad de aprobación

- **Contexto:** ADR-013 fija definición, niveles, reautenticación, segundo aprobador, segregación, un solo uso e invalidación; cada rebanada aún debe clasificar sus operaciones.
- **Impacto:** Afecta permisos, experiencia, auditoría, Definition of Ready y gobierno de decisiones.
- **Opciones conocidas:** nivel 1 ordinario; nivel 2 con reautenticación; nivel 3 con aprobador diferente; nivel 4 no permitido en R0.
- **Estado:** Cerrada con decisión.
- **Alcance del cierre:** Modelo conceptual resuelto; no cierra matriz por rebanada, umbrales, factores, auditoría técnica o acceso privilegiado.
- **Decisión relacionada:** [ADR-013](../decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md), `Accepted`.

## Tenants

<a id="question-005"></a>
### QUESTION-005 — Ciclo de vida del tenant

- **Contexto:** El tenant es el límite organizacional, pero alta, activación, suspensión, recuperación, cierre y eliminación no están definidos.
- **Impacto:** Afecta acceso, suscripción, retención, soporte, automatización y obligaciones sobre datos.
- **Opciones conocidas:** alta asistida; autoservicio; alta por plataforma; suspensión reversible; cierre con exportación y periodo de retención; combinaciones por plan.
- **Estado:** Abierta.
- **Decisión relacionada:** [ADR-004 — multitenancy con esquema compartido](../decisions/proposed/ADR-004-shared-schema-multitenancy.md), `Accepted`; no resuelve el ciclo de vida del tenant.

<a id="question-006"></a>
### QUESTION-006 — Datos tenant-wide frente a datos de sucursal

- **Contexto:** ADR-004 clasifica datos SaaS, tenant y sucursal y fija sus discriminadores conceptuales.
- **Impacto:** Condiciona modelo de datos, permisos, transferencias, búsqueda, reportes y experiencia.
- **Opciones conocidas:** entidades principalmente tenant-wide con contexto de sucursal; entidades principalmente propiedad de sucursal; modelo híbrido explícito por entidad.
- **Estado:** Cerrada con decisión.
- **Alcance del cierre:** Propiedad inicial resuelta; cualquier concepto nuevo debe clasificarse explícitamente.
- **Decisión relacionada:** [ADR-004 — multitenancy con esquema compartido](../decisions/proposed/ADR-004-shared-schema-multitenancy.md), `Accepted`.

## Sucursales

<a id="question-007"></a>
### QUESTION-007 — Rotación de personas y operación entre sucursales

- **Contexto:** ADR-010 establece usuario por tenant sin pertenencia permanente a sucursal; la estación vinculada determina la sucursal efectiva.
- **Impacto:** Afecta autorización, navegación, turnos, reportes y soporte a personal itinerante.
- **Opciones conocidas:** se acepta rotación con el mismo usuario/PIN entre estaciones autorizadas del tenant; no existe selección manual ni cuenta duplicada por sucursal.
- **Estado:** Cerrada con decisión.
- **Alcance del cierre:** Contexto resuelto por ADR-010 y cálculo de asignaciones tenant-wide/restringidas por ADR-012; transferencias de negocio siguen separadas.
- **Decisión relacionada:** [ADR-010 — contexto operativo por estación](../decisions/proposed/ADR-010-station-bound-operational-context.md) y [ADR-012 — autorización contextual](../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md), `Accepted`.

<a id="question-008"></a>
### QUESTION-008 — Cambio de sucursal y transferencia de contexto

- **Contexto:** Una estación que cambia físicamente debe desvincularse y volver a vincularse; transferir operaciones o existencias es una decisión distinta por módulo.
- **Impacto:** Afecta continuidad, auditoría, inventario, reparaciones abiertas y revocación de sesiones.
- **Opciones conocidas:** revocar y volver a vincular; reasignación aprobada con cierre de sesiones; transferencia programada; prohibir cambios mientras existan operaciones pendientes.
- **Estado:** En investigación.
- **Alcance resuelto:** Contexto de estación aceptado; operaciones abiertas y transferencias de negocio pendientes.
- **Decisión relacionada:** [ADR-010 — contexto operativo por estación](../decisions/proposed/ADR-010-station-bound-operational-context.md), `Accepted`.

## Identidad

<a id="question-009"></a>
### QUESTION-009 — Identidad global y pertenencia a varios tenants

- **Contexto:** ADR-004/010/011 fijan que un usuario ordinario pertenece exactamente a un tenant y que su identidad no depende de PIN, sesión, estación o sucursal. La correlación de una misma persona entre tenants y la recuperación permanecen abiertas.
- **Impacto:** Afecta autenticación, recuperación, privacidad, cambio de contexto y duplicados.
- **Opciones conocidas:** identidad global con varias membresías; identidad separada por tenant; identidad global con alias o proveedores vinculados; federación futura.
- **Estado:** En investigación.
- **Alcance resuelto:** Pertenencia, identidad ordinaria y autenticación contextual aceptadas; recuperación y correlación global pendientes.
- **Decisión relacionada:** [ADR-004](../decisions/proposed/ADR-004-shared-schema-multitenancy.md), [ADR-010](../decisions/proposed/ADR-010-station-bound-operational-context.md) y [ADR-011](../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md), `Accepted`.

<a id="question-010"></a>
### QUESTION-010 — Modelo de roles, capacidades y excepciones

- **Contexto:** ADR-012 acepta roles del tenant, múltiples roles, unión de capacidades, asignaciones tenant-wide/restringidas, ausencia de permisos directos y autorización negativa server-side.
- **Impacto:** Es un gate para cualquier flujo funcional y para aislamiento dentro del tenant.
- **Opciones conocidas:** modelo ordinario cerrado; composición concreta de roles/capacidades por rebanada y controles reforzados permanecen separados.
- **Estado:** Cerrada con decisión.
- **Alcance del cierre:** Modelo ordinario resuelto; no cierra catálogo completo, roles de plataforma, acciones sensibles ni separación reforzada de funciones.
- **Decisión relacionada:** [ADR-012](../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md), `Accepted`; véase [Identity, Access and Permissions](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md).

## PIN y dispositivos

<a id="question-011"></a>
### QUESTION-011 — Vinculación y confianza de dispositivos

- **Contexto:** ADR-010 exige vinculación previa, única y mantenida del lado del servidor a una sucursal; quedan abiertos tipos de equipo, autoridad detallada y prueba técnica.
- **Impacto:** Afecta seguridad, onboarding, soporte, pérdida, revocación y experiencia en sucursal.
- **Opciones conocidas:** código temporal aprobado por administrador; enrolamiento iniciado en consola; invitación o enlace de activación; gestión externa de dispositivos en una etapa futura.
- **Estado:** En investigación.
- **Alcance resuelto:** Invariantes aceptadas; mecanismo y controles pendientes.
- **Decisión relacionada:** [ADR-010](../decisions/proposed/ADR-010-station-bound-operational-context.md), `Accepted`; mecanismo sujeto a ADR posterior.

<a id="question-012"></a>
### QUESTION-012 — Alcance del PIN y autenticación reforzada

- **Contexto:** ADR-011 fija PIN/sesión, ADR-012 autorización ordinaria y ADR-013 reautenticación/segundo aprobador; duración, factor y protección técnica siguen abiertos.
- **Impacto:** Afecta velocidad operativa, suplantación, bloqueo, cambio de turno y acciones sensibles.
- **Opciones conocidas:** PIN sólo para seleccionar operador; PIN para sesión operativa acotada; PIN más factor reforzado para acciones sensibles; reautenticación por riesgo.
- **Estado:** En investigación.
- **Alcance resuelto:** Propósito, sesión, turno e inactividad aceptados; ADR-013 fija semántica de reautenticación, un solo uso e invalidación; factores y límites técnicos pendientes.
- **Decisión relacionada:** [ADR-011](../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md), [ADR-012](../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) y [ADR-013](../decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md), `Accepted`.

## Reparaciones

<a id="question-013"></a>
### QUESTION-013 — Flujo, estados y cierre de una reparación

- **Contexto:** Reparaciones es una capacidad central propuesta, pero no están definidos inicio, estados, pausas, cancelación, entrega ni reapertura.
- **Impacto:** Condiciona el núcleo del dominio, permisos, eventos, métricas y experiencia del cliente.
- **Opciones conocidas:** flujo único configurable de forma acotada; flujo base con excepciones; estados derivados de hitos; variantes por tipo de trabajo, aún no validadas.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada.

<a id="question-014"></a>
### QUESTION-014 — Diagnóstico, presupuesto, autorización y garantía

- **Contexto:** No se conoce cuándo se cotiza, quién autoriza, cómo se registran cambios ni cómo se relaciona una garantía con el caso original.
- **Impacto:** Afecta responsabilidad, comunicación, precios, pagos, inventario, evidencia y reaperturas.
- **Opciones conocidas:** autorización por etapa; autorización por monto o cambio; evidencia digital; garantía como reapertura o caso relacionado; reglas distintas por tenant, sujetas a límites.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada.

## Inventario

<a id="question-015"></a>
### QUESTION-015 — Catálogo, existencias y ubicaciones

- **Contexto:** Inventario está contemplado como capacidad central, pero no se ha definido si catálogo y existencias son tenant-wide, por sucursal o por ubicación interna.
- **Impacto:** Afecta modelo de datos, búsqueda, transferencias, reservas y reportes.
- **Opciones conocidas:** catálogo por tenant con existencias por sucursal; catálogo y existencias por sucursal; catálogo compartido con múltiples ubicaciones; modelo gradual.
- **Estado:** Abierta.
- **Decisión relacionada:** [ADR-004 — multitenancy con esquema compartido](../decisions/proposed/ADR-004-shared-schema-multitenancy.md), `Accepted` respecto al aislamiento; no resuelve el dominio de inventario.

<a id="question-016"></a>
### QUESTION-016 — Movimientos, reservas, costos y excepciones

- **Contexto:** No están definidos tipos de movimiento, reserva para reparación o venta, transferencias, existencias negativas ni método de costo.
- **Impacto:** Afecta exactitud, concurrencia, correcciones, ventas, reparaciones y auditoría financiera.
- **Opciones conocidas:** ledger de movimientos con saldo derivado; saldo más movimientos; reservas explícitas; costo promedio u otros métodos sujetos a país y negocio; prohibir o autorizar negativos.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; la opción de persistencia no debe decidir la regla de negocio.

## CRM

<a id="question-017"></a>
### QUESTION-017 — Problema y límite inicial de CRM

- **Contexto:** CRM forma parte de la dirección del producto, pero no se sabe qué problema adicional a Customers, Repairs y Messaging debe resolver.
- **Impacto:** Evita construir una categoría amplia sin resultado ni ownership claros.
- **Opciones conocidas:** seguimiento posreparación; recordatorios; oportunidades; segmentos; campañas; aplazar hasta validar una necesidad concreta.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada.

<a id="question-018"></a>
### QUESTION-018 — Consentimiento, preferencias y uso de datos de clientes

- **Contexto:** CRM, Messaging y Notifications podrían usar datos de contacto, pero no están definidos propósito, consentimiento ni preferencias.
- **Impacto:** Afecta privacidad, entregabilidad, reputación, cumplimiento y experiencia del cliente.
- **Opciones conocidas:** consentimiento por propósito; preferencia por canal; interés legítimo donde aplique; exclusión global o por tenant; conservación de evidencia.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; requiere revisión legal según mercado.

## Mensajería

<a id="question-019"></a>
### QUESTION-019 — Canales y proveedor inicial de mensajería

- **Contexto:** Se prevé WhatsApp y otros canales en el futuro, con WAHA como integración futura posible, pero ninguno está comprometido.
- **Impacto:** Condiciona contratos, consentimiento, costos, webhooks, soporte y experiencia.
- **Opciones conocidas:** mensajería interna primero; WhatsApp mediante proveedor aprobado; WAHA sujeto a evaluación; correo/SMS/notificaciones por etapas; arquitectura de adaptadores sin activar canales aún.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; documentar alternativas en una decisión de integración antes de comprometer proveedor.

<a id="question-020"></a>
### QUESTION-020 — Semántica, retención y entrega de mensajes

- **Contexto:** Se requieren normalización, deduplicación, persistencia, reintentos y tiempo real, pero faltan reglas de estados, orden, edición y retención.
- **Impacto:** Afecta idempotencia, experiencia, almacenamiento, auditoría y recuperación ante fallos.
- **Opciones conocidas:** estados normalizados con extensión por proveedor; orden por conversación con secuencia interna; entrega al menos una vez con deduplicación; retención por propósito/canal.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; relacionar con [Realtime and Messaging](../architecture/REALTIME_AND_MESSAGING.md).

## Pagos

<a id="question-021"></a>
### QUESTION-021 — Medios, aplicación y devolución de pagos del taller

- **Contexto:** Se contemplan pagos, pero no están definidos medios, parcialidades, anticipos, aplicación a venta/reparación ni devoluciones.
- **Impacto:** Afecta flujo operativo, cajas, conciliación, permisos, proveedores y cumplimiento.
- **Opciones conocidas:** efectivo y registro manual; terminal externa referenciada; procesador integrado; pagos parciales; devolución total/parcial con aprobación.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; mantener separado de Subscription and Billing.

<a id="question-022"></a>
### QUESTION-022 — Modelo operativo de cajas

- **Contexto:** “Caja” puede significar ubicación, terminal, cuenta de control o sesión de operador; apertura, cierre y arqueo no están definidos.
- **Impacto:** Afecta responsabilidad, turnos, diferencias, reportes y autorización.
- **Opciones conocidas:** caja por sucursal; caja por terminal; sesión por operador; caja compartida con turnos; modelo híbrido con controles de supervisión.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada.

## Suscripciones

<a id="question-023"></a>
### QUESTION-023 — Ciclo de suscripción y efecto sobre el acceso

- **Contexto:** La plataforma tendrá suscripciones y planes, pero no se han definido trial, renovación, gracia, mora, suspensión ni cancelación.
- **Impacto:** Afecta acceso del tenant, datos, soporte, notificaciones y recuperación.
- **Opciones conocidas:** prepago; renovación automática; periodo de gracia; acceso de sólo lectura; suspensión reversible; cancelación con exportación.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; requiere decisiones comerciales y técnicas coordinadas.

<a id="question-024"></a>
### QUESTION-024 — Modelo comercial de planes y límites

- **Contexto:** No existen planes, precios, moneda, límites ni entitlements aprobados.
- **Impacto:** Condiciona empaquetado, medición, administración, facturación y expectativas del cliente.
- **Opciones conocidas:** por tenant; por sucursal; por usuario; por volumen; niveles por capacidades; combinación simple por validar.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada.

## Datos

<a id="question-025"></a>
### QUESTION-025 — Retención, exportación, corrección y eliminación

- **Contexto:** Clientes, mensajes, archivos, auditoría y operación pueden requerir ciclos de vida distintos, aún no definidos.
- **Impacto:** Afecta privacidad, soporte, costo, migración, cierre de tenant y cumplimiento.
- **Opciones conocidas:** políticas por categoría; retención configurable dentro de límites; anonimización; eliminación lógica seguida de purga; excepciones por obligación legal.
- **Estado:** Abierta.
- **Decisión relacionada:** [ADR-003 — PostgreSQL](../decisions/proposed/ADR-003-postgresql-primary-database.md) y [ADR-004](../decisions/proposed/ADR-004-shared-schema-multitenancy.md) están `Accepted`. Ninguno resuelve retención.

<a id="question-026"></a>
### QUESTION-026 — Jurisdicción, residencia y clasificación de datos

- **Contexto:** No se han definido país inicial, categorías sensibles, residencia ni transferencias internacionales.
- **Impacto:** Puede cambiar proveedores, topología, cifrado, retención, contratos y controles de acceso.
- **Opciones conocidas:** región única aprobada; residencia por mercado; restricciones por categoría; no ofrecer un mercado hasta cumplir sus requisitos.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; necesita revisión legal y de seguridad antes de decisiones de hosting.

## Infraestructura

<a id="question-027"></a>
### QUESTION-027 — Perfil de carga y criterio de escala

- **Contexto:** La arquitectura debe prepararse para 1,000 o más tenants, pero no existen perfiles de uso, concurrencia, volumen, tamaño de archivos ni distribución temporal.
- **Impacto:** Afecta capacidad, pruebas, índices, caché, colas, costos y criterios para separar componentes.
- **Opciones conocidas:** supuestos conservadores validados con pilotos; rangos por tenant; pruebas por recorridos críticos; crecimiento gradual con señales de extracción.
- **Estado:** Abierta.
- **Decisión relacionada:** [ADR-002](../decisions/proposed/ADR-002-modular-monolith-first.md), [ADR-003](../decisions/proposed/ADR-003-postgresql-primary-database.md) y [ADR-004](../decisions/proposed/ADR-004-shared-schema-multitenancy.md) están `Accepted`; el perfil de carga sigue abierto y no se infiere de elegir motor.

<a id="question-028"></a>
### QUESTION-028 — Restricciones de hosting, disponibilidad y ambientes

- **Contexto:** Se proponen contenedores, ambientes separados e imágenes versionadas, pero no hay proveedor, región, presupuesto, SLO ni capacidades operativas confirmadas.
- **Impacto:** Afecta despliegue, recuperación, observabilidad, secretos, integraciones y costo.
- **Opciones conocidas:** plataforma administrada de contenedores; servicio de aplicaciones; infraestructura cloud propia; servicios administrados para datos; selección posterior mediante criterios.
- **Estado:** Abierta.
- **Decisión relacionada:** [ADR-007 — despliegues con contenedores](../decisions/proposed/ADR-007-containerized-deployments.md), estado `Proposed`.

## Seguridad

<a id="question-029"></a>
### QUESTION-029 — Modelo de amenazas y acceso administrativo excepcional

- **Contexto:** Se requiere seguridad por defecto, pero no se han priorizado amenazas ni definido cómo soporte o plataforma intervienen en un tenant.
- **Impacto:** Afecta autenticación, autorización, auditoría, alertas, soporte e investigación de incidentes.
- **Opciones conocidas:** acceso sin contenido por defecto; acceso temporal just-in-time; consentimiento del tenant; doble aprobación; impersonación prohibida o fuertemente controlada; cuentas de emergencia.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; debe alimentar [Security Baseline](../architecture/SECURITY_BASELINE.md).

<a id="question-030"></a>
### QUESTION-030 — Obligaciones regulatorias y de seguridad del mercado inicial

- **Contexto:** País, privacidad, fiscalidad, pagos, notificación de incidentes y estándares contractuales no están definidos.
- **Impacto:** Puede bloquear mercados y cambiar datos, controles, proveedores, contratos y evidencia de calidad.
- **Opciones conocidas:** identificar un país inicial y sus obligaciones; adoptar una línea base común más extensiones por mercado; limitar capacidades hasta completar revisión especializada.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; requiere asesoría competente, no una inferencia documental.

## Experiencia visual

<a id="question-031"></a>
### QUESTION-031 — Identidad visual y gobierno del design system

- **Contexto:** Se propone Tailwind CSS con design system propio y se quieren evitar inconsistencias, pero no existen marca, tokens, componentes ni ownership aprobados.
- **Impacto:** Afecta coherencia, velocidad, accesibilidad y mantenimiento entre clientes.
- **Opciones conocidas:** sistema propio incremental; base accesible de componentes con capa de marca; tokens compartidos; ownership de producto/diseño/ingeniería por definir.
- **Estado:** Abierta.
- **Decisión relacionada:** [ADR-006 — clientes web con Next.js](../decisions/proposed/ADR-006-nextjs-web-clients.md), estado `Proposed`, no decide el design system.

<a id="question-032"></a>
### QUESTION-032 — Base de accesibilidad y evidencia visual

- **Contexto:** Accesibilidad, responsive y estados de interfaz forman parte de calidad, pero no hay estándar, navegadores/dispositivos ni evidencia mínima definidos.
- **Impacto:** Afecta Definition of Done, componentes, pruebas y capacidad de uso en el taller.
- **Opciones conocidas:** WCAG en nivel por definir; matriz de dispositivos/navegadores; pruebas automáticas y manuales; revisión visual documentada por flujo.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; debe alimentar [Accessibility Strategy](../quality/ACCESSIBILITY_STRATEGY.md).

## Migración desde SR Taller

<a id="question-033"></a>
### QUESTION-033 — Datos y conocimiento que deben preservarse

- **Contexto:** No se copiará código ni se migrará automáticamente toda la complejidad, pero puede existir información con valor u obligación de conservación.
- **Impacto:** Afecta nuevo modelo, identificadores, calidad, retención, soporte y aceptación del cambio.
- **Opciones conocidas:** migrar sólo maestros y casos abiertos; incluir historial seleccionado; conservar legado como consulta; exportación/importación controlada; no migrar una categoría con justificación.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; véanse [Lecciones de SR Taller](./LEGACY_SR_TALLER_LESSONS.md) y [Migration Policy](../operations/MIGRATION_POLICY.md).

<a id="question-034"></a>
### QUESTION-034 — Coexistencia, corte y reconciliación con el sistema anterior

- **Contexto:** No se ha decidido si ambos sistemas coexistirán, cómo se detendrá escritura, cómo se validará una migración ni cómo se volverá atrás.
- **Impacto:** Afecta continuidad operativa, alcance de integraciones temporales, soporte, pruebas y riesgo de pérdida o duplicación.
- **Opciones conocidas:** corte por tenant; piloto por sucursal; periodo de sólo lectura del legado; ejecución paralela controlada; migraciones por oleadas con reconciliación y rollback.
- **Estado:** Abierta.
- **Decisión relacionada:** Ninguna registrada; una estrategia aprobada requerirá decisiones de migración y operación.

## Gates de decisión derivados

Antes de comprometer una primera versión deben estar respondidas, como mínimo, las preguntas sobre segmento, recorrido, alcance tenant/sucursal, identidad/permisos, flujo de reparación, mercado y obligaciones aplicables.

Antes de implementar acceso operativo deben aplicarse ADR-010/011/012/013 y cerrarse composición/clasificación por rebanada, mecanismos de dispositivo, protección del PIN y evidencia requerida.

Antes de integrar mensajería, pagos o suscripciones deben estar respondidas las preguntas de proveedor, consentimiento, estados, errores, jurisdicción y modelo comercial correspondientes.

Antes de migrar datos debe existir una respuesta aprobada para QUESTION-033 y QUESTION-034, inventario de fuentes, evidencia de calidad y rollback probado.

## Documentos relacionados

- [Visión de producto](./PRODUCT_VISION.md)
- [Alcance de producto](./PRODUCT_SCOPE.md)
- [Actores y personas](./ACTORS_AND_PERSONAS.md)
- [Mapa de módulos](./MODULE_MAP.md)
- [Registro de decisiones](../decisions/README.md)
- [Riesgos y bloqueadores del Sprint 00](../sprints/sprint-00/RISKS_AND_BLOCKERS.md)

## Próxima revisión

Revisar en cada sesión de descubrimiento y en cada cierre de PBI documental. Registrar fecha, evidencia y documentos actualizados cuando una pregunta cambie de estado. **Próxima fecha: TBD.**
