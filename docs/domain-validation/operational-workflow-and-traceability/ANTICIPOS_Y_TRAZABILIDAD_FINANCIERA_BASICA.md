# Anticipos y trazabilidad financiera básica

## Alcance

Este documento formaliza únicamente el hecho operativo del anticipo relacionado con una orden. No diseña Caja, contabilidad, cuentas por cobrar, conciliación, impuestos, cierres ni métodos de pago.

## Hechos validados

### FOT-DEC-029 — Anticipo histórico

Un anticipo es un hecho financiero relacionado con la orden. No debe representarse como un campo mutable aislado.

### FOT-DEC-030 — Datos básicos

Cada anticipo debe conservar:

- monto;
- moneda;
- usuario que lo recibió;
- fecha y hora;
- sucursal;
- medio de pago, si se conoce;
- referencia o nota, cuando aplica.

### FOT-DEC-031 — Varios anticipos

La orden puede tener múltiples anticipos. Cada uno conserva su identidad histórica; un total acumulado puede ser una proyección, no el único registro.

### FOT-DEC-032 — Corrección sin borrado

Una corrección, devolución o anulación no debe borrar el movimiento original. El mecanismo y autoridad permanecen abiertos.

## Evento básico

FOT-EVT-010 Anticipo recibido expresa que una persona recibió valor asociado con la orden. Actor, importe, moneda, sucursal y momento son obligatorios para la trazabilidad operativa.

El evento no demuestra por sí solo:

- ingreso conciliado en Caja;
- liquidación de saldo;
- método real si no se registró;
- autorización comercial;
- obligación contable;
- disponibilidad de efectivo;
- recibo fiscal.

## Evidencia legacy

SR Taller 1.0 conserva usuario, monto y fecha/hora en filas de anticipos. El método queda como rótulo genérico y no existe integración demostrada con Caja o turno.

El saldo visible se calcula como presupuesto final actual menos la suma de anticipos. El legacy permite inconsistencias, incluido saldo negativo cuando:

- el presupuesto queda debajo de lo recibido;
- existe un anticipo frente a presupuesto cero;
- se acepta un monto negativo por una ruta directa;
- cambian importes sin compensación coordinada.

El saldo negativo es evidencia de una inconsistencia posible, no comportamiento deseable del futuro.

## Proyección de totales

### FOT-PROP-019 — Total derivado

Mostrar suma de anticipos y saldo como valores derivados es una propuesta consistente con preservar movimientos. La fórmula financiera definitiva depende de obligaciones, conceptos autorizados, devoluciones y políticas aún no validadas.

## Correcciones y devoluciones

### FOT-PROP-020 — Movimiento compensatorio

Registrar correcciones, anulaciones o devoluciones como movimientos relacionados, sin borrar el original, es una propuesta. No se define:

- quién autoriza;
- tipos de movimiento;
- signo o fórmula;
- impacto en Caja;
- comprobantes;
- contabilidad;
- relación con cancelación o entrega.

## Precondiciones mínimas

Para registrar un anticipo:

1. existe una orden identificable;
2. existe un usuario autenticado;
3. el monto y la moneda son conocidos;
4. la sucursal y el momento son atribuibles;
5. el movimiento no se confunde con autorización del trabajo.

## Estados inválidos

- Anticipo sin actor, monto o momento.
- Sobrescribir un único monto y perder pagos anteriores.
- Borrar un anticipo incorrecto sin rastro.
- Usar una cantidad negativa como devolución sin relación con el original.
- Afirmar saldo liquidado sólo porque existe un anticipo.
- Considerar que un comentario “recibí 500” reemplaza el movimiento.
- Afirmar conciliación de Caja por la fila legacy.

## Relación con autorización comercial

Un anticipo es un pago, no una autorización. Las decisiones comerciales por concepto se rigen por [Cotizaciones y decisiones por concepto](../reception-minimum-and-commercial-authorization/COTIZACIONES_Y_DECISIONES_POR_CONCEPTO.md).

## Preguntas financieras conservadas

Devoluciones, Caja, métodos, cierres, entrega con saldo, crédito, cortesía, recibos y contabilidad se mantienen en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
