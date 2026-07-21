# Criterios de entrada de R1

## Propósito

R1 es la primera rebanada de recepción y custodia. No puede utilizarse para completar silenciosamente la fundación de R0 ni para inventar políticas operativas mientras se programa.

## Gate de fundación

- [ ] R0 cumple todos los [criterios de salida](CRITERIOS_DE_SALIDA_DE_R0.md);
- [ ] aislamiento de tenant y alcance de sucursal están probados;
- [ ] identidad, autorización y atribución están activas;
- [ ] persistencia, migraciones, tiempo, errores y observabilidad tienen contrato aceptado;
- [ ] fixtures permiten probar dos tenants y, si aplica, múltiples sucursales;
- [ ] no hay decisiones H0/H1 críticas abiertas.

## Gate de Producto y Operaciones

- [ ] alcance exacto de R1, demostración y exclusiones aprobados (`DEC-003`);
- [ ] término visible de la orden acordado (`DEC-026`);
- [ ] alcance, formato y unicidad del folio decididos (`DEC-021` a `DEC-023`);
- [ ] estados y transiciones mínimas acordados (`DEC-027`);
- [ ] ubicación inicial y movimientos mínimos acordados (`DEC-028`);
- [ ] inicio y vigencia de custodia acordados (`DEC-029`);
- [ ] precedencia de políticas, vigencia y campos configurables acordados (`DEC-032` a `DEC-035`);
- [ ] fuente de marcas/modelos y fallback libre decididos (`DEC-036`);
- [ ] evidencias obligatorias y su propósito decididos (`DEC-040`);
- [ ] contenido conceptual de ticket/etiqueta y operación manual confirmados (`DEC-041`, `DEC-042`);
- [ ] criterios de aceptación incluyen servicio sin piezas, piezas/consumibles, no reparable y equipo descartado.

## Gate técnico

- [ ] ADR de folio acepta el resultado del spike de concurrencia;
- [ ] creación idempotente y doble envío tienen comportamiento verificable;
- [ ] orden, condición inicial y custodia comienzan dentro del límite transaccional acordado;
- [ ] política aplicada queda reproducible por versión o snapshot;
- [ ] archivos/evidencias tienen puerto, autorización, metadatos e integridad definidos;
- [ ] impresión es efecto lateral y su fallo no revierte una recepción válida;
- [ ] errores parciales, timeout y reintento tienen estados observables;
- [ ] casos negativos de permiso, tenant, sucursal, política y duplicidad están especificados.

## Exclusiones protegidas

La entrada de R1 no autoriza agregar inventario completo, compras, CRM, pagos en línea, offline, QR, microservicios, BI o automatización omnicanal. Cualquier reapertura necesita caso de uso, autoridad y revisión del hito.

## Declaración de entrada

R1 sólo entra a programación cuando Producto, Arquitectura, Seguridad y Calidad puedan señalar evidencia para cada criterio aplicable. Una propuesta de ADR, un mockup o una decisión “por defecto” no cuentan como cierre.
