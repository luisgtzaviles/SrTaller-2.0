# Transición del diagnóstico a la cotización

## Propósito

La frontera comercial comienza cuando existe información técnica suficiente para que recepción prepare una propuesta. Este documento separa la entrada técnica de la oferta, la decisión y el alcance ejecutable.

## Decisiones validadas

### DTR-DEC-025 — Recepción transforma la recomendación

El técnico produce la recomendación. Recepción la convierte en propuesta comercial para el cliente.

### DTR-DEC-026 — Precio pertenece al proceso comercial

El diagnóstico no fija precio. Importes, promociones, descuentos y políticas pertenecen al proceso comercial y no modifican la conclusión.

### DTR-DEC-027 — Varias cotizaciones posibles

Una misma recomendación técnica puede originar distintas cotizaciones según las promociones o políticas comerciales aplicables.

### DTR-DEC-028 — Decisión total, parcial o negativa

El cliente puede autorizar todo, autorizar una parte o no autorizar nada. La decisión debe conservar el alcance concreto presentado.

### DTR-DEC-029 — Sólo trabajo autorizado

Únicamente se ejecutan trabajos autorizados. Una conclusión o recomendación no constituye autorización.

### DTR-DEC-030 — Reentrada comercial por descubrimiento

Cuando aparece una recomendación nueva durante la reparación, recepción vuelve a contactar al cliente y se obtiene otra decisión antes de ampliar el trabajo.

## Cadena de responsabilidad

| Momento | Productor | Resultado | Autoridad que no adquiere |
|---|---|---|---|
| conclusión | técnico | explicación técnica | fijar precio |
| recomendación | técnico | trabajo o componente sugerido | comprometer oferta |
| cotización | recepción/comercial | alcance, importes y condiciones | autorizar por cliente |
| decisión | cliente o persona autorizada; recepción registra | aceptación total, parcial o rechazo | probar ejecución |
| alcance autorizado | operación comercial | trabajos que pueden realizarse | ampliar por nuevos hallazgos |
| ejecución | técnico | trabajo efectivamente realizado | reescribir la decisión previa |

## Ejemplo de propuesta comercial

**Conclusión técnica:** pantalla dañada y centro de carga dañado.

**Recomendaciones:** reemplazar pantalla y reemplazar centro de carga.

**Posible cotización de recepción:** pantalla por $1,000 y centro de carga por $600, o una promoción distinta.

El contenido técnico permanece igual aunque la política comercial modifique importes. Si el cliente sólo acepta pantalla, el centro de carga permanece recomendado y rechazado o pendiente según la decisión real, pero no forma parte del alcance ejecutable.

## Propuestas de trazabilidad

### DTR-PROP-010 — Vínculo entre recomendación y propuesta comercial

Mantener una relación explícita entre la recomendación técnica y la cotización que la interpreta es una propuesta. Su finalidad es explicar el origen técnico de cada concepto sin obligar a que ambos tengan la misma estructura.

### DTR-PROP-011 — Vínculo con alcance autorizado

Relacionar el alcance autorizado con la cotización y recomendaciones aplicables es una propuesta. La obligación de ejecutar sólo lo autorizado está validada; el mecanismo y la granularidad permanecen abiertos.

## Precondiciones conceptuales para cotizar

Sin diseñar campos, recepción necesita comprender:

- la conclusión técnica vigente para ese momento;
- las recomendaciones que desea convertir en oferta;
- el alcance y las condiciones de cada concepto;
- las políticas comerciales aplicables;
- qué decisiones anteriores siguen vigentes o fueron sustituidas.

La recomendación puede estar incompleta para cotizar si requiere aclaración técnica. No se decide aquí quién resuelve esa aclaración ni cómo se registra.

## Casos inválidos

- Insertar precio dentro del diagnóstico y cambiarlo cada vez que cambia una promoción.
- Considerar cotizada una recomendación sólo porque el técnico la escribió.
- Tratar una cotización como autorización.
- Ejecutar todas las recomendaciones cuando el cliente autorizó sólo algunas.
- Ocultar una recomendación rechazada al preparar una versión posterior.
- Ampliar una autorización previa tras descubrir otra falla.

## Relación con autorización comercial validada

Las decisiones por concepto, la autorización parcial, el rechazo preservado y el total explicable siguen regidos por [Cotizaciones y decisiones por concepto](../reception-minimum-and-commercial-authorization/COTIZACIONES_Y_DECISIONES_POR_CONCEPTO.md). Este paquete sólo documenta la entrada técnica y su evolución.
