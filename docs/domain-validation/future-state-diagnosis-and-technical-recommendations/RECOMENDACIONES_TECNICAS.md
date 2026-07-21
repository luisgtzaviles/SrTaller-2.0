# Recomendaciones técnicas

## Propósito

La recomendación traduce la conclusión técnica en trabajo o componentes que el técnico considera apropiados. Sirve como entrada al proceso comercial, pero no contiene por sí sola precio, promoción, aceptación ni autorización.

## Decisiones validadas

### DTR-DEC-014 — Recomendación producida por técnico

Cuando el resultado requiere trabajo adicional, el técnico produce una recomendación técnica basada en su conclusión.

### DTR-DEC-015 — Recomendación no es cotización

La recomendación técnica no representa todavía una cotización. Recepción la transforma en una propuesta comercial conforme a precios, promociones y políticas aplicables.

### DTR-DEC-016 — Varios componentes

Una recomendación puede incluir varias piezas o trabajos. Por ejemplo, una misma conclusión puede recomendar reemplazar pantalla y centro de carga.

### DTR-DEC-017 — Necesidad frente a mejora

Algunas recomendaciones representan necesidades para resolver el problema; otras pueden representar mejoras o trabajo conveniente. Actualmente esta diferencia suele comunicarse mediante conversación y seguimiento libre.

### DTR-DEC-018 — Sin prioridad obligatoria todavía

No se impone por ahora una clasificación obligatoria de prioridades. La realidad operativa debe documentarse sin inventar categorías que el Product Owner todavía no ha aprobado.

## Cadena semántica

| Paso | Ejemplo | Autor principal | Contenido que no añade por sí solo |
|---|---|---|---|
| conclusión | pantalla y centro de carga dañados | técnico | precio |
| recomendación | reemplazar pantalla y centro de carga | técnico | promoción o impuesto |
| cotización | pantalla $1,000; centro de carga $600 | recepción/comercial | autorización |
| decisión | cliente acepta pantalla y rechaza centro de carga | cliente, registrada por recepción | ejecución |
| alcance autorizado | reemplazo de pantalla | proceso comercial/operativo | trabajo ya realizado |

## Ejemplo validado

La conclusión “pantalla dañada y centro de carga dañado” permanece estable. Recepción puede ofrecer:

- pantalla por $1,000;
- centro de carga por $600;
- otra combinación o promoción conforme a una política comercial válida.

El cambio de importes no cambia la conclusión ni permite que el técnico ejecute trabajo no autorizado.

## Propuestas

### DTR-PROP-003 — Recomendación distinguible de cotización

Tratar recomendación y cotización como elementos formalmente distinguibles es una propuesta. Su separación semántica está validada; no se define su representación técnica.

### DTR-PROP-004 — Versionado de recomendaciones

Conservar versiones o secuencias distinguibles de recomendaciones es una propuesta para evitar sobrescrituras cuando cambie la conclusión. El identificador, numeración y mecanismo permanecen abiertos.

### DTR-PROP-005 — Clasificación futura de prioridad

Clasificar recomendaciones como necesaria, opcional, mejora, seguridad u otra categoría es una evolución posible. Las categorías, efectos y obligatoriedad deben validarse con técnicos, recepción y Product Owner.

## Reglas de interpretación

- Recomendar no autoriza.
- Recomendar una pieza no prueba disponibilidad ni reserva.
- Probar una pieza no significa recomendarla definitivamente.
- Añadir precio transforma la conversación en materia comercial, no en una conclusión técnica más precisa.
- Rechazar una recomendación comercializada no borra la razón técnica que la originó.

## Preguntas remitidas

Prioridad, alternativas, compatibilidad, relación con inventario, evidencia y vigencia se conservan en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
