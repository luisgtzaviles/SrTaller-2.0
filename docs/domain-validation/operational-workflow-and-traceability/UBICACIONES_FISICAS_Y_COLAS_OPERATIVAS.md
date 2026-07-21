# Ubicaciones físicas y colas operativas

## Hechos validados

### FOT-DEC-024 — Áreas operativas conocidas

El flujo de Avicell utiliza al menos:

- área de pendientes;
- taller;
- segunda revisión;
- caja o área de listos;
- caja o área de No quedó.

### FOT-DEC-025 — Ubicación distinta de estado

Estas áreas indican dónde se encuentra físicamente el dispositivo o en qué cola material espera. No son estados de negocio.

Un dispositivo puede:

- cambiar de ubicación sin cambiar de estado;
- cambiar de estado sin moverse todavía;
- estar Listo y continuar En tienda;
- estar No quedó y continuar bajo custodia.

## Catálogo operativo

| Ubicación | Propósito observado | Entradas típicas | Salidas típicas | No significa |
|---|---|---|---|---|
| Pendientes | espera de toma técnica | recepción completada | técnico toma equipo | diagnóstico iniciado |
| Taller | diagnóstico, pruebas o reparación | pendientes, autorización, revisión fallida | segunda revisión | técnico asignado permanente |
| Segunda revisión | filtro antes de Listo o decisión comercial | servicio/trabajo terminado | listos, taller, no quedó/espera | estado aprobado |
| Listos | espera de recogida | segunda revisión aprobada | entrega o retorno a taller | custodia terminada |
| No quedó | espera de recogida tras resultado/rechazo | rechazo o resultado no reparado | entrega | equipo fuera de tienda |

## Cola y responsabilidad

Una ubicación puede implicar una cola de trabajo, pero no determina por sí sola quién responde. Por ejemplo:

- en pendientes, taller puede ser el próximo responsable;
- en segunda revisión, recepción puede ser responsable de probar o contactar;
- en listos, recepción puede ser responsable de notificar o entregar.

Estas asociaciones describen Avicell; su formalización futura y transferencia por turno permanecen abiertas.

## Movimientos físicos

### FOT-PROP-013 — Movimiento explícito

Representar un movimiento relevante con origen, destino, actor y momento es una propuesta. No se decide si todos requieren escaneo, si algunos se derivan o si se agrupan.

La trazabilidad candidata de un movimiento incluye:

- orden y dispositivo;
- ubicación de origen;
- ubicación destino;
- usuario que mueve o registra;
- fecha y hora;
- motivo cuando hay excepción;
- sucursal;
- corrección relacionada si se capturó por error.

## Ubicaciones configurables

### FOT-PROP-014 — Catálogo por sucursal

Permitir que cada sucursal configure áreas, cajas, estantes o mesas es una propuesta. Antes de aprobarla deben resolverse:

- catálogo mínimo universal;
- nombres duplicados;
- ubicaciones activas/inactivas;
- movimientos durante cambios de configuración;
- ubicación desconocida;
- transferencias entre sucursales;
- proveedores externos y salidas temporales.

## Escaneo

### FOT-PROP-015 — Escaneo como acceso a contexto

Modelar el escaneo como acción que localiza la orden y abre su contexto, sin cambiar automáticamente estado, asignación o cronometraje, es una propuesta consistente con el flujo validado.

El hecho confirmado es que el técnico escanea para localizar y consultar. Queda abierto si el escaneo:

- registra movimiento;
- acepta asignación;
- inicia diagnóstico;
- inicia medición de tiempo;
- exige confirmar la ubicación destino.

## “Entregado” no es estante

Entregado representa que ocurrió la salida y terminó la custodia. Si el futuro conserva un campo de ubicación, no debería tratar Entregado como un área interna equiparable a Taller o Listos. La representación definitiva sigue abierta.

## Inconsistencias detectables

| Situación | Lectura |
|---|---|
| dispositivo marcado en Listos pero encontrado en Taller | divergencia ubicación física/registrada |
| estado En espera de autorización sin ubicación | estado conocido, ubicación desconocida |
| Entregado con ubicación interna activa | custodia/ubicación incompatibles |
| movimiento a Segunda revisión sin trabajo terminado | posible traslado prematuro; requiere contexto |
| retorno a Taller sin registro de revisión fallida | falta hecho explicativo |
| ubicación cambiada por configuración, sin movimiento real | no debe fingirse traslado |

## Estados inválidos

- Usar “Pendientes” como estado universal.
- Inferir Listo por estar en caja de listos.
- Inferir No quedó por estar en esa caja sin decisión/resultado.
- Registrar Entregado y seguir contando el equipo en una cola interna.
- Perder la última ubicación conocida durante una reasignación.
- Trasladar el identificador a la caja y dejar el equipo sin folio.

La identificación física permanece unida al equipo conforme a [Custodia e identificación física](../reception-minimum-and-commercial-authorization/CUSTODIA_E_IDENTIFICACION_FISICA.md).
