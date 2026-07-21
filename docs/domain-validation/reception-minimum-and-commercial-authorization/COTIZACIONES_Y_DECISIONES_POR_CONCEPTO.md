# Cotizaciones y decisiones por concepto

## Decisiones validadas

### RMCA-DEC-019 — Varios conceptos

Una cotización puede contener múltiples conceptos de trabajo durante una misma orden. La existencia de varios conceptos no crea por sí sola varias órdenes.

### RMCA-DEC-020 — Decisión por concepto

El cliente puede aceptar o rechazar cada concepto individualmente. La decisión comercial no se limita a aprobar o rechazar la cotización completa.

### RMCA-DEC-021 — Autorización parcial

Una cotización queda parcialmente autorizada cuando sólo una parte de sus conceptos fue aceptada. El ejemplo validado es:

- reemplazo de pantalla: aceptado;
- reemplazo de batería inflada: rechazado.

Sólo el trabajo aceptado forma parte del alcance autorizado.

### RMCA-DEC-022 — Historia de lo rechazado

Los hallazgos y trabajos propuestos que el cliente rechaza permanecen en la historia y evidencia. El rechazo impide tratarlos como autorizados, pero no elimina que fueron encontrados, propuestos y decididos.

### RMCA-DEC-023 — Estructura y narrativa

El legacy conserva decisiones principalmente mediante comentarios libres. El futuro debe distinguir estructuradamente cada concepto y su decisión. Una nota narrativa puede aportar contexto, pero no ser la única prueba de aceptación o rechazo.

### RMCA-DEC-024 — Total derivado

El total autorizado se deriva de los conceptos autorizados y de las políticas comerciales aplicables. No debe capturarse como un número aislado imposible de reconciliar con las decisiones.

## Cadena semántica

| Etapa | Contenido | Puede cambiar la etapa anterior |
|---|---|---:|
| Problema reportado | relato del cliente | No |
| Hallazgo técnico | observación o conclusión del taller | No |
| Trabajo propuesto | concepto, alcance y condición económica ofrecidos | No |
| Decisión del cliente | aceptación o rechazo de un concepto concreto | No |
| Trabajo autorizado | alcance resultante de decisiones válidas | No |
| Trabajo ejecutado | intervención realizada | No; debe compararse con lo autorizado |

La separación permite demostrar que se trabajó únicamente sobre lo autorizado y que un hallazgo rechazado no fue ocultado.

## Ejemplo de decisión parcial

| Concepto | Hallazgo relacionado | Decisión | Forma parte del alcance autorizado | Forma parte del total autorizado |
|---|---|---|---:|---:|
| Reemplazo de pantalla | pantalla dañada | aceptado | Sí | Sí |
| Reemplazo de batería | batería inflada | rechazado | No | No |

El importe de la batería no fue aportado en la decisión validada y no se inventa. El total exacto sólo puede calcularse con los importes y reglas aplicables.

## Estados de decisión

“Aceptado” y “rechazado” están validados como resultados por concepto. Cualquier estado adicional —por ejemplo, pendiente, vencido, sustituido o revocado— es una propuesta que necesita definición independiente.

## Precondiciones para decidir

Antes de registrar una decisión válida debe poder identificarse:

- el concepto concreto;
- su alcance;
- su importe o regla económica;
- la persona con autoridad para decidir;
- la decisión atribuible;
- la versión o contenido ofrecido.

La evidencia, canal, vigencia, cambios y revocaciones siguen abiertos.

## Resultados esperados

- Es posible saber qué se propuso, aceptó, rechazó, autorizó y ejecutó.
- Un rechazo no desaparece de la historia.
- Una aceptación no se extiende a conceptos no presentados.
- El alcance ejecutable es el conjunto de conceptos autorizados.
- El total autorizado puede explicarse a partir de líneas y políticas.
- Una narración complementa, pero no reemplaza, la decisión por línea.

## Ejemplos inválidos

- Un solo checkbox “cotización aprobada” cuando unas líneas se aceptaron y otras se rechazaron.
- Borrar la batería inflada porque el cliente no autorizó su reemplazo.
- Ejecutar el reemplazo rechazado.
- Considerar autorizado un hallazgo que todavía no se presentó como trabajo.
- Cambiar el total sin conservar qué conceptos o políticas lo explican.
- Usar “cliente acepta” en una nota libre sin vincularlo a pantalla, batería u otro concepto.

## Temas relacionados

Las reglas de absorción o suma se detallan en [Políticas comerciales de precio](POLITICAS_COMERCIALES_DE_PRECIO.md); evidencia, autoridad, vigencia y cambios permanecen en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
