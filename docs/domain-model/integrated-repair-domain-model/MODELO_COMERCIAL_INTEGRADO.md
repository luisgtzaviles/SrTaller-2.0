# Modelo comercial integrado

## Separación del proceso técnico

**DDV:** el técnico determina necesidad técnica; recepción o atención comercial transforma recomendaciones en propuestas con precio. Recomendación, cotización, autorización, pago y ejecución son hechos distintos.

## Cadena conceptual

```mermaid
flowchart LR
    R[Recomendación técnica] --> Q[Cotización versionada]
    Q --> L[Conceptos ofrecidos]
    L --> D[Decisiones por concepto]
    D --> A[Trabajos autorizados]
    D --> T[Total autorizado derivado]
    A --> E[Trabajos ejecutados]
    T --> P[Pagos aplicables]
```

**Clasificación:** DDV para la separación y decisiones por concepto; PM para versionado y enlaces explícitos.

## Cotización y conceptos

| Elemento | Responsabilidad | Regla | Clasificación |
|---|---|---|---|
| Cotización | agrupar una propuesta comercial identificable | puede tener múltiples versiones | DDV/PM |
| Concepto | describir trabajo/pieza/precio ofrecido | recibe decisión individual | DDV |
| Precio | expresar importe del concepto bajo política | no altera diagnóstico | DDV |
| Promoción | ajustar combinación elegible | conserva explicación y vigencia | RCA/PC |
| Ajuste manual | modificar precio con autoridad y motivo | nunca silencioso | RCA/PC |
| Decisión | autorizar/rechazar concepto y versión | atribuible y preservada | DDV |
| Total autorizado | sumar/derivar lo autorizado bajo política | no es campo arbitrario | DDV |

## Autorización parcial

**DDV:** una cotización puede quedar parcialmente autorizada. Por ejemplo, si pantalla es necesaria y centro de carga recomendado, el cliente puede autorizar sólo pantalla. El concepto rechazado permanece visible y el trabajo ejecutable se limita al autorizado.

## Servicio inicial y absorción

**RCA:** el campo legacy “presupuesto inicial” puede representar en Avicell una autorización comercial inicial, no una cotización final.

**RCA:** en humedad, $350 por servicio se cobra sólo si el equipo queda funcionando únicamente con ese servicio; si requiere pantalla de $1,000 y se autoriza, se cobran $1,000. **PC:** otras políticas válidas pueden acumular, cobrar al rechazo, no cobrar o usar variantes extensibles.

## Promociones y ajustes

| Caso | Tratamiento | Clasificación |
|---|---|---|
| Dos flex de $500 ofrecidos por $800 | promoción/paquete explícito | RCA |
| Gerente cambia un precio | ajuste manual con actor, motivo y alcance | RCA/PC |
| Precio cambia después de autorización | requiere nueva versión/decisión o regla validada | PM/PA |
| Recomendación cambia | puede generar nueva propuesta; no reescribe anterior | DDV/PM |

## Anticipos y pagos básicos

- **DDV:** un anticipo es un hecho financiero relacionado con la orden.
- **DDV:** conserva monto, moneda, actor, fecha, hora, sucursal y medio de pago cuando se conozca.
- **DDV:** puede haber varios anticipos y sus correcciones no borran el original.
- **IDO:** saldo, total cobrado y aplicación son proyecciones financieras candidatas.
- **PA:** integración completa con Caja, cierres, contabilidad, impuestos, crédito, devoluciones y conciliación queda fuera de este paquete.

## Riesgos comerciales

- **RCL:** presupuesto inicial/final no soporta versiones ni varios conceptos.
- **RCL:** autorización narrativa no vincula decisor, concepto o versión.
- **RCL:** ajustes manuales sin política no explican el total.
- **RCL:** saldo negativo puede representar sobrepago, devolución pendiente o error.
- **RCL:** anticipo legacy está desconectado de caja y aplicación contable.

## Decisiones abiertas

- **PA:** vigencia, revisión y cancelación de cotizaciones.
- **PA:** evidencia aceptable y autoridad del decisor.
- **PA:** umbrales de trabajo sin llamada y excepciones urgentes.
- **PA:** impuestos, descuentos, crédito, cobro parcial y entrega con adeudo.
- **PA:** relación entre anticipo, obligación, caja y devolución.
