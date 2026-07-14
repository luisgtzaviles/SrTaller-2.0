# Recomendaciones de alcance inicial

## Estado del documento

- **Estado:** Propuesta para decisión del Product Owner.
- **Naturaleza:** Comparación de alternativas; no modifica el [alcance vigente](../../product/PRODUCT_SCOPE.md).
- **Supuesto:** Ninguna alternativa queda comprometida hasta resolver segmento, problema y recorrido prioritario.

## Principio de reducción

La primera entrega debe ser la menor porción que permita aprender sobre una operación real sin comprometer aislamiento, autorización ni auditoría. “Menor” no significa omitir integridad; significa postergar capacidades cuya utilidad no esté demostrada.

## Comparación

| Alternativa | Valor buscado | Complejidad relativa | Condición para elegirla | Recomendación |
|---|---|---|---|---|
| A — Foundation only | Validar base organizacional y una reparación básica | Menor | El aprendizaje principal está en acceso seguro y trazabilidad del caso | **Hipótesis inicial recomendada** |
| B — Taller operativo | Completar una operación comercial esencial de punta a punta | Media/alta | Cobro, inventario, entrega y garantía son indispensables para validar el recorrido | Elegir sólo si Gate 1 lo demuestra |
| C — Taller + CRM | Operar y comunicarse por canales conversacionales | Alta | CRM/mensajería es diferenciador validado y existe capacidad para privacidad/integración | No usar por defecto |

## Opción A — Foundation only

### Objetivo

Validar que un tenant y sus sucursales pueden operar una reparación básica con actores atribuibles, acceso controlado y evidencia mínima, sin intentar resolver todavía toda la operación comercial.

### Módulos propuestos

Tenant Management, Branch Management, Identity y Access Control para usuarios/membresías, roles y permisos; Device Management con el acceso operativo por PIN que se apruebe; Customers, Repairs, Audit y la configuración mínima necesaria. El contenido concreto de “reparación básica” debe decidirse en Gate 4; como frontera de discusión puede abarcar recepción, identificación del equipo, seguimiento mínimo y cierre, sin asumir cotización, inventario, pago o garantía completa.

### Valor

- prueba temprana del modelo tenant/sucursal/usuario/dispositivo;
- valida el recorrido y vocabulario central con menor superficie;
- expone riesgos de autorización y trazabilidad antes de añadir dominios financieros o canales externos.

### Complejidad

Es la menor de las tres opciones, pero no es trivial: identidad, PIN y aislamiento son riesgos de alta consecuencia.

### Dependencias

Gates 1 a 4, especialmente [QUESTION-003](../../product/OPEN_QUESTIONS.md#question-003), [QUESTION-006](../../product/OPEN_QUESTIONS.md#question-006), [QUESTION-009](../../product/OPEN_QUESTIONS.md#question-009), [QUESTION-012](../../product/OPEN_QUESTIONS.md#question-012) y [QUESTION-013](../../product/OPEN_QUESTIONS.md#question-013); revisión de ADR-004 y validaciones SPIKE-002/SPIKE-005 si la dirección se conserva.

### Principales riesgos

- una reparación demasiado básica podría no generar valor operativo completo;
- la complejidad de identidad/dispositivo podría consumir el aprendizaje del dominio;
- postergar pago e inventario puede ocultar dependencias del recorrido real.

### Fuera de alcance propuesto

Inventario operativo completo, ventas, pagos/cajas, garantía completa, CRM, mensajería externa, tiempo real no esencial, planes/facturación automatizada, aplicación móvil y migración productiva.

### Recomendación

Usarla como hipótesis inicial por ser la menor superficie coherente. Confirmarla o descartarla con el recorrido de Gate 1; no tratarla como decisión ya tomada.

## Opción B — Taller operativo

### Objetivo

Permitir que un taller ejecute el recorrido completo aprobado desde recepción hasta entrega, incluyendo las transacciones mínimas para operar y controlar existencias.

### Módulos propuestos

Todo lo de Opción A más Inventory, Payments, Cash Register y Reporting esencial; Sales sólo si el recorrido aprobado lo requiere. Reparaciones añade diagnóstico, cotización/autorización, ejecución, entrega y garantía con las reglas que el Product Owner apruebe.

### Valor

- valida una operación de taller de punta a punta;
- permite observar cobro, consumo de partes, diferencias y cierre;
- produce aprendizaje comercial y operativo más completo.

### Complejidad

Media/alta. Agrega consistencia financiera, concurrencia de inventario, aprobaciones, devoluciones, caja, garantía y reportes.

### Dependencias

Todo Gate 4; [QUESTION-014](../../product/OPEN_QUESTIONS.md#question-014), [QUESTION-015](../../product/OPEN_QUESTIONS.md#question-015), [QUESTION-016](../../product/OPEN_QUESTIONS.md#question-016), [QUESTION-021](../../product/OPEN_QUESTIONS.md#question-021) y [QUESTION-022](../../product/OPEN_QUESTIONS.md#question-022); catálogo de acciones sensibles y política de auditoría.

### Principales riesgos

- multiplicar reglas de dominio antes de observar el recorrido base;
- confundir pagos del taller con facturación de la suscripción SaaS;
- introducir costos, negativos, reservas, devoluciones o garantías sin política aprobada.

### Fuera de alcance propuesto

CRM, campañas, WhatsApp, historial multicanal, tiempo real conversacional, aplicación móvil, personalización arbitraria e integraciones no esenciales.

### Recomendación

Elegirla sólo si el Product Owner confirma que una entrega sin cobro, inventario y garantía no permite validar el problema prioritario. Si se elige, reducir dentro de cada dominio los medios, estados y excepciones iniciales.

## Opción C — Taller + CRM

### Objetivo

Combinar la operación completa del taller con seguimiento de clientes y conversaciones por canales autorizados.

### Módulos propuestos

Todo lo de Opción B más CRM, Messaging, Notifications, Integrations y capacidades de tiempo real necesarias. El corte a decidir incluye conversaciones, ownership y asignación, historial de mensajes y actualizaciones en tiempo real; WhatsApp y WAHA permanecen alternativas de integración, no requisitos.

### Valor

- prueba continuidad entre reparación, cliente y comunicación;
- puede reducir pérdida de seguimiento si ése es el problema validado;
- habilita asignación e historial cuando sean parte explícita del recorrido.

### Complejidad

Alta. Añade consentimiento, retención, webhooks, estados de entrega, deduplicación, asignación, aislamiento de rooms, soporte de proveedor y costos externos.

### Dependencias

Gates 1 a 5; [QUESTION-017](../../product/OPEN_QUESTIONS.md#question-017) a [QUESTION-020](../../product/OPEN_QUESTIONS.md#question-020); política de datos y mercado; ADRs futuros de mensajería/tiempo real cuando corresponda; SPIKE-004 sólo si realtime entra al alcance.

### Principales riesgos

- construir una categoría CRM sin problema u owner claros;
- acoplar el primer release a WAHA u otro proveedor no evaluado;
- aumentar superficie de privacidad, soporte y fallos antes de estabilizar el dominio central.

### Fuera de alcance propuesto

Campañas avanzadas, automatización comercial abierta, múltiples proveedores/canales simultáneos, analítica avanzada, personalización ilimitada y móvil, salvo decisión posterior explícita.

### Recomendación

No seleccionarla por defecto. Sólo promoverla si la evidencia de Gate 5 muestra que comunicación/CRM es parte inseparable del problema inicial y se acepta conscientemente su costo operativo.

## Decisión a registrar

| Campo | Resultado |
|---|---|
| Alternativa elegida | TBD |
| Ajustes o combinación autorizada | TBD |
| Evidencia de producto | TBD |
| Capacidades explícitamente posteriores | TBD |
| Documentos por actualizar | [PRODUCT_SCOPE](../../product/PRODUCT_SCOPE.md), [OUT_OF_SCOPE](../../product/OUT_OF_SCOPE.md), [MODULE_MAP](../../product/MODULE_MAP.md), backlog y ADRs afectados |
| Autoridad y fecha | TBD |

## Próxima revisión

Después de resolver Gate 1 y antes de aceptar decisiones de framework o iniciar prototipos de superficie. **Fecha: TBD.**
