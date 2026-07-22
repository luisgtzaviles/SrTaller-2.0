# Alcance de producto

## Estado del documento

- **Estado:** Borrador inicial.
- **Naturaleza:** Clasificación propuesta de capacidades; no es un roadmap ni un compromiso de primera versión.
- **Aprobación:** R0 aprobado por el Responsable de Producto el 2026-07-21; el resto del alcance conserva su estado propuesto o abierto.
- **Estimaciones y fechas:** No definidas.

## Propósito

Este documento organiza el universo inicial de capacidades de SR Taller 2.0 para facilitar descubrimiento, arquitectura y priorización. No define historias, reglas de negocio, tablas ni orden de entrega.

## Significado de las clasificaciones

| Clasificación | Significado en este documento | Lo que no significa |
|---|---|---|
| **Foundation** | Capacidad o límite que debe comprenderse para construir y operar el producto con seguridad. | Que deba tener una interfaz completa en la primera versión. |
| **Core** | Capacidad candidata a formar el recorrido operativo principal del taller. | Que esté aprobada para la primera versión o que todas sus variantes estén incluidas. |
| **Later** | Capacidad contemplada en la dirección del producto, cuya implementación se pospone hasta validar dependencias y valor. | Que sea descartada o que ya tenga fecha. |
| **Discovery required** | Capacidad con incertidumbre suficiente para impedir un compromiso responsable. | Que carezca de valor o que deba implementarse después de todas las demás. |

Todas las clasificaciones son **propuestas**. Un cambio de clasificación requiere actualizar el backlog y las dependencias relacionadas.

## Alcance aprobado de R0

El Responsable de Producto cerró `DEC-002` y `DEC-062` el 2026-07-21. R0 será una fundación ejecutable y demostrable del SaaS multi-tenant, sin recepción ni órdenes de reparación.

Incluye la capacidad mínima para demostrar dos tenants aislados, sucursales, usuarios y pertenencias, roles/capacidades y sus alcances, contexto operativo, autenticación base, autorización server-side, denegación por defecto, revocación, trazabilidad, errores seguros, persistencia/migraciones base y pruebas integradas. Puede usar una interfaz mínima que no representa el diseño final.

Excluye los módulos funcionales de Reparaciones, Clientes, Inventario, Caja, Ventas, CRM, mensajería, finanzas, planes/suscripciones y administración completa. La lista normativa y los escenarios están en [Criterios de salida de R0](../architecture-readiness/blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md).

Esta aprobación define alcance y aceptación esperada; implementación, diseño técnico, pruebas ejecutadas y aceptación formal permanecen pendientes.

## Mapa inicial de capacidades

| Capacidad | Clasificación propuesta | Resultado que podría habilitar | Límite o incertidumbre actual |
|---|---|---|---|
| Plataforma SaaS | Foundation | Operación de múltiples organizaciones sobre una plataforma administrada | Faltan modelo operativo, niveles de servicio y límites comerciales. |
| Tenants | Foundation | Aislamiento, configuración y ciclo de vida por organización cliente | Deben definirse alta, suspensión, cierre, exportación y eliminación. |
| Planes | Discovery required | Ofertas comerciales y límites de servicio diferenciados | No existen catálogo, precios, entitlements ni países aprobados. |
| Suscripciones | Discovery required | Relación vigente entre un tenant y una oferta comercial | Faltan altas, renovaciones, cobro SaaS, tolerancias y cancelaciones. |
| Sucursales | Foundation | Alcance operativo de estaciones y datos dentro de un tenant | ADR-004/010 fijan propiedad y contexto; faltan ciclo de vida e implementación. |
| Usuarios | Foundation | Identidad y acceso trazable de personas | Identidad y autenticación contextual aceptadas en ADR-011; faltan mecanismos técnicos, recuperación, administración de bloqueo y correlación de persona. |
| Roles | Foundation | Agrupación administrable de capacidades dentro del tenant | Modelo y múltiples roles aceptados en ADR-012; falta composición concreta por rebanada. |
| Capacidades | Foundation | Control explícito y negativo por defecto de operaciones y recursos | Unión, alcance y revocación aceptados en ADR-012; faltan catálogo por rebanada, aplicación y pruebas. |
| Autorización reforzada | Foundation | Controles proporcionales para acciones sensibles sin reemplazar identidad, contexto ni capacidades ordinarias | Niveles, reautenticación, segundo aprobador, uso único e invalidación aceptados en ADR-013; faltan clasificación por rebanada, mecanismos y pruebas. |
| Estaciones operativas | Foundation | Contexto de tenant/sucursal desde equipos vinculados | Vinculación y reubicación conceptual aceptadas; faltan mecanismo, pérdida y revocación técnica. |
| PIN | Foundation | Credencial ágil del usuario dentro del tenant de la estación y sesión operativa | Semántica aceptada en ADR-011; faltan protección técnica, recuperación, política de bloqueo y refuerzo. |
| Clientes | Core | Registro y consulta del cliente del taller dentro de su contexto permitido | Faltan identidad, duplicados, consentimiento, sucursal y retención. |
| Reparaciones | Core | Seguimiento del trabajo desde recepción hasta cierre | El flujo, estados, autorizaciones, garantías y excepciones están por validar. |
| Inventario | Core | Disponibilidad y trazabilidad de artículos o partes para la operación | Faltan catálogo, ubicación, reservas, costos, lotes y transferencias. |
| CRM | Later | Seguimiento organizado de relaciones y oportunidades con clientes | El problema específico y su límite frente a Customers no están definidos. |
| Mensajería | Later | Conversaciones vinculadas al contexto operativo | Canales iniciales, consentimiento, plantillas, costos y SLAs están abiertos. |
| Pagos del taller | Discovery required | Registro y aplicación de cobros asociados a operaciones del taller | Faltan medios, devoluciones, conciliación, país y requisitos fiscales. |
| Cajas | Discovery required | Control de sesiones y movimientos de efectivo u otros medios | Faltan apertura, cierre, arqueo, permisos y relación con sucursal. |
| Archivos | Foundation | Adjuntar y recuperar evidencia o documentos con aislamiento | Faltan tipos, límites, antivirus, retención, permisos y residencia. |
| Notificaciones | Later | Alertar a actores sobre eventos relevantes por canales permitidos | Faltan destinatarios, canales, preferencias, prioridad y política de reintento. |
| Auditoría | Foundation | Evidencia consultable de acciones y cambios relevantes | Faltan catálogo de eventos, retención, acceso, exportación y privacidad. |
| Configuraciones | Foundation | Variación controlada por plataforma, tenant o sucursal | Debe evitarse personalización ilimitada y reglas opacas. |
| Reportes | Later | Lectura agregada para operación y supervisión | Faltan audiencias, métricas, latencia, exportación y alcance de datos. |
| Administración central | Foundation | Gestión controlada de la plataforma y soporte a tenants | Faltan separación de funciones, acceso excepcional y auditoría reforzada. |
| Integraciones | Later | Intercambio controlado con servicios externos | Deben priorizarse casos, contratos, credenciales, errores y ownership. |

## Alcance de la etapa de fundación

**Hecho conocido:** la etapa actual es exclusivamente documental y de planificación.

Incluye:

- visión, principios, actores, lenguaje y límites de producto;
- mapa conceptual de módulos y ownership;
- preguntas abiertas y gates de decisión;
- modelos preliminares de arquitectura, multitenancy, identidad, sucursales y dispositivos;
- alternativas técnicas registradas como ADRs con estado `Proposed`;
- estrategia documental de entrega, calidad, seguridad, observabilidad y operación;
- epics, PBIs documentales y Sprint 00;
- lecciones del sistema anterior sin copiar su código ni asumir migración completa.

No incluye implementación funcional. Los límites explícitos están en [Fuera de alcance](./OUT_OF_SCOPE.md).

## Capacidad no equivale a módulo ni a entrega

- Una **capacidad** expresa algo que el producto podría permitir.
- Un **módulo** propone un límite de responsabilidad y ownership; véase el [mapa de módulos](./MODULE_MAP.md).
- Un **epic** organiza una inversión o resultado de gran tamaño.
- Un **PBI** describe un resultado verificable y priorizable.
- Una **entrega** sólo existe después de aprobación, implementación, pruebas y evidencia.

Esta separación evita asumir que una fila de la tabla ya tiene diseño o fecha.

## Dependencias de producto que requieren descubrimiento

1. El recorrido inicial de reparaciones condiciona Customers, Inventory, Payments, Cash Register, Files y Messaging.
2. Tenant, Branch, Identity, Access Control, autorización reforzada y Device Management condicionan el alcance seguro de todas las capacidades operativas.
3. Planes y suscripciones condicionan límites comerciales, pero sus entitlements no deben incrustarse prematuramente en módulos de dominio.
4. País, fiscalidad, privacidad y canales disponibles condicionan pagos, facturación, mensajería y retención.
5. La estrategia de migración condiciona identificadores, calidad de datos, coexistencia y soporte, pero no debe dictar sin validación el nuevo modelo.

Estas relaciones son **hipótesis arquitectónicas y de producto**, no secuencia aprobada.

## Criterios propuestos para comprometer una capacidad

Antes de comprometer una capacidad a una versión debe existir, como mínimo:

- problema y público afectados validados;
- resultado esperado y evidencia de éxito definidos;
- recorrido principal, excepciones críticas y exclusiones acordados;
- impacto en tenant, sucursal, identidad, permisos, datos y auditoría analizado;
- dependencias y decisiones bloqueantes visibles;
- riesgos de seguridad, privacidad, operación y migración evaluados;
- criterios de aceptación verificables;
- prioridad aprobada por el propietario del producto.

## Preguntas abiertas

- [QUESTION-001](./OPEN_QUESTIONS.md#question-001): segmento inicial de talleres.
- [QUESTION-003](./OPEN_QUESTIONS.md#question-003): recorrido operativo prioritario.
- [QUESTION-006](./OPEN_QUESTIONS.md#question-006): entidades compartidas o aisladas por sucursal.
- [QUESTION-013](./OPEN_QUESTIONS.md#question-013): flujo y estados de reparación.
- [QUESTION-015](./OPEN_QUESTIONS.md#question-015): modelo de existencias y ubicaciones.
- [QUESTION-019](./OPEN_QUESTIONS.md#question-019): canales de mensajería iniciales.
- [QUESTION-021](./OPEN_QUESTIONS.md#question-021): medios y reglas de pago.
- [QUESTION-024](./OPEN_QUESTIONS.md#question-024): modelo comercial de planes y suscripciones.

## Documentos relacionados

- [Visión de producto](./PRODUCT_VISION.md)
- [Principios de producto](./PRODUCT_PRINCIPLES.md)
- [Fuera de alcance](./OUT_OF_SCOPE.md)
- [Actores y personas](./ACTORS_AND_PERSONAS.md)
- [Epics](../backlog/EPICS.md)
- [Backlog de producto](../backlog/PRODUCT_BACKLOG.md)

## Próxima revisión

Revisar después de responder las preguntas de segmento, recorrido operativo, alcance por sucursal y modelo comercial, y antes de seleccionar capacidades para una primera versión. **Fecha: TBD.**
