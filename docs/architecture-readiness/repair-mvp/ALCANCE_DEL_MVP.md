# Alcance del MVP

## Resultado de producto

**[RP]** El MVP permite operar una reparación de punta a punta dentro de un tenant y una sucursal: recibir el equipo, conservar su custodia, diagnosticar, proponer, autorizar, ejecutar, controlar calidad, cobrar y entregar con trazabilidad básica.

**[RP]** El MVP no pretende completar la suite de gestión del taller. Su unidad de valor es una orden de servicio cerrable y auditable.

## R0 aprobado como fundación

**[RP]** El Responsable de Producto aprobó el 2026-07-21 que R0 sea una fundación ejecutable, integrada, demostrable y verificable del SaaS multi-tenant. R0 antecede al recorrido operativo del MVP y no constituye por sí solo una versión vendible.

R0 incluye únicamente la base necesaria para demostrar tenants aislados, sucursales mínimas, identidad, roles/capacidades, contexto, autorización server-side, denegación, revocación, trazabilidad, errores seguros, persistencia/migraciones base, pruebas y un mecanismo mínimo de demostración.

R0 excluye recepción, órdenes de reparación, diagnóstico, cotización, pagos, inventario, caja, clientes como módulo completo y las demás capacidades operativas o comerciales. El contrato completo está en [Criterios de salida de R0](../blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md).

La aprobación cierra `DEC-002` y `DEC-062` para R0. No autoriza implementación, no cierra el diseño técnico ni las pruebas y no acepta una demostración todavía inexistente.

## Esencial para la primera venta

| Capacidad | Resultado mínimo | Clasificación |
| --- | --- | --- |
| Acceso tenant/sucursal | Toda operación ocurre bajo contexto inequívoco | RDD |
| Sesión operativa | Actor y alcance verificables | RDD |
| Crear orden | Identidad estable, nombre y problema inicial | RDD |
| Custodia | Inicio al crear; fin sólo con entrega válida | RDD |
| Folio e identificación física | Folio único en alcance acordado y vínculo con equipo | RDD |
| Consulta y notas | Detalle útil y observaciones trazables | RP |
| Diagnóstico y conclusión | Resultado técnico distinguible de recomendación | RDD |
| Propuesta y autorización | Conceptos decidibles y versión preservada | RDD |
| Trabajo autorizado | Ejecución limitada a lo autorizado | RDD |
| Control de calidad | Resultado previo a disponibilidad | RDD |
| Listo o No quedó | Cierre técnico sin terminar custodia | RDD |
| Anticipos y pago final básicos | Movimientos históricos, no sólo saldo mutable | RDD |
| Entrega | Evidencia mínima y término de custodia | RDD |
| Timeline | Actor, tiempo y hechos relevantes | RDD |

## Esencial antes de producción

| Capacidad | Motivo | Clasificación |
| --- | --- | --- |
| Aislamiento multitenant probado | Evitar exposición cruzada | R |
| Autorización ordinaria y reforzada | Aplicar y probar ADR-012/013 en autorización comercial, cobro y entrega | R |
| Gestión segura de evidencia | Evitar exposición o pérdida | R |
| Idempotencia de operaciones críticas | Evitar duplicados financieros u operativos | R |
| Backups, restauración y auditoría | Recuperabilidad y responsabilidad | RP |
| Observabilidad mínima | Diagnóstico sin filtrar datos sensibles | RP |
| Criterios de rendimiento validados | Evitar degradación del flujo de mostrador | ST |

## Valioso pero diferible

- **[DD]** Automatización de notificaciones no esencial para completar la orden.
- **[DD]** Impresión avanzada; el MVP sólo necesita un adaptador opcional para identificación física.
- **[DD]** Proyecciones analíticas adicionales al detalle y listas operativas.
- **[DD]** Identidad global persistente del dispositivo si la sesión segura cubre el primer flujo.
- **[DD]** Reglas configurables avanzadas fuera del catálogo mínimo aprobado.

## Fuera del MVP

**[FMVP]** Inventario completo, compras, proveedores, contabilidad, conciliación bancaria, nómina, BI avanzado, predicción de demanda, CRM omnicanal, WhatsApp en tiempo real, automatización de marketing, facturación electrónica, garantías avanzadas, transferencias entre sucursales, outsourcing, portal de cliente, pagos en línea, promociones avanzadas, motor general de reglas, identidad global persistente de dispositivos, RFID/NFC, microservicios, Event Sourcing y data warehouse.

## Interfaces mínimas con lo diferido

- **[DAR]** Un concepto comercial puede describir pieza o servicio sin reservar ni descontar inventario.
- **[DAR]** Un movimiento de pago conserva referencias suficientes sin construir contabilidad.
- **[DAR]** Los hechos notificables se registran sin depender de WhatsApp u otro proveedor.
- **[DAR]** La evidencia usa un puerto de archivos sin fijar almacenamiento.
- **[DAR]** Los eventos del dominio pueden alimentar proyecciones futuras sin adoptar Event Sourcing.

## Criterio de exclusión

**[RP]** Una capacidad sólo entra al MVP si es necesaria para completar el flujo vendible, cumplir una invariante o operar con seguridad. Conveniencia, automatización futura o cobertura de suite no bastan.
