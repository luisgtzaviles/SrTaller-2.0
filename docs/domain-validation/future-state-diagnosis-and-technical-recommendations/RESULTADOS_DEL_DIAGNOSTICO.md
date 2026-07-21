# Resultados del diagnóstico

## Propósito

Los resultados siguientes describen conclusiones operativas posibles confirmadas por el Product Owner. No son estados definitivos de una máquina, códigos técnicos ni opciones obligatorias de interfaz.

## Resultados validados

### DTR-DEC-037 — Quedó únicamente con servicio

El servicio realizado durante la evaluación deja funcionando el equipo sin requerir reemplazo definitivo de piezas. El técnico concluye, arma, registra seguimiento y envía a segunda revisión.

### DTR-DEC-038 — Requiere piezas

El técnico determina que se necesitan uno o más componentes o trabajos adicionales. Emite conclusión y recomendaciones; recepción prepara la propuesta comercial.

### DTR-DEC-039 — Reparación no recomendable

El técnico puede concluir que realizar una reparación no es recomendable. La razón, el efecto comercial y las excepciones deben conservarse sin convertir la recomendación en decisión del cliente.

### DTR-DEC-040 — Irreparable

El técnico puede concluir que el equipo no es reparable bajo la información y alcance disponibles. El significado exacto, la certeza requerida y la diferencia frente a no recomendable permanecen abiertos.

### DTR-DEC-041 — No se pudo determinar con certeza

El diagnóstico puede terminar sin una conclusión causal suficiente. Deben quedar visibles los límites y la posible siguiente acción, sin fingir certeza.

## Matriz de interpretación

| Resultado | Significado mínimo | Siguiente paso validado o pendiente | No implica |
|---|---|---|---|
| quedó con servicio | funcionamiento recuperado sin pieza definitiva | armar, seguimiento y segunda revisión | Listo o Entregado |
| requiere piezas | existe recomendación de trabajo/componentes | recepción cotiza y solicita decisión | autorización automática |
| no recomendable | el técnico desaconseja reparar | respuesta comercial/operativa por definir | imposibilidad física absoluta |
| irreparable | no se identifica reparación viable en el alcance | custodia, comunicación y cierre por definir | entrega automática |
| inconcluso | falta certeza o información suficiente | retomar, pedir acceso/evidencia o comunicar límite, por definir | ausencia de trabajo técnico |

## Resultado, recomendación y estado

Un resultado diagnóstico no determina por sí solo:

- el estado operativo exacto de la orden;
- la ubicación física;
- la condición de custodia;
- el precio;
- la autorización;
- la entrega;
- el cierre.

Esas dimensiones conservan sus propias reglas y autoridades documentadas en [Estado, ubicación y responsabilidad](../operational-workflow-and-traceability/ESTADO_UBICACION_Y_RESPONSABILIDAD.md).

## Observaciones

Las observaciones pueden explicar humedad, limitaciones de acceso, pruebas no concluyentes, riesgos o condiciones externas. Deben complementar el resultado, no sustituirlo con texto ambiguo.

## Reingreso a diagnóstico

Un resultado inconcluso puede retomarse si aparece nueva evidencia. Una reparación en curso también puede generar una evaluación posterior. Organizar esos momentos como iteraciones es DTR-PROP-006; el comportamiento repetible está validado.

## Casos inválidos

- Marcar “requiere piezas” como cotización aceptada.
- Tratar “quedó con servicio” como control de calidad aprobado.
- Usar “irreparable” y “no recomendable” como sinónimos sin decisión explícita.
- Ocultar límites de un resultado inconcluso.
- Derivar entrega o fin de custodia desde cualquier resultado.
- Cambiar el resultado porque cambió el precio ofrecido.
