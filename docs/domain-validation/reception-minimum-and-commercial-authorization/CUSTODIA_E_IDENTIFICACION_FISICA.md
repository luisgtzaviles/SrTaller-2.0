# Custodia e identificación física

## Definición validada del ciclo

### RMCA-DEC-007 — Inicio de custodia

La custodia formal comienza exactamente cuando la orden se crea correctamente. Tener el dispositivo sobre el mostrador, capturar datos o intentar crear la orden no constituye por sí solo custodia formal dentro del sistema.

### RMCA-DEC-008 — Fin de custodia

El ciclo documentado termina con la entrega del dispositivo. Las reglas de quién puede recibirlo, pago, abandono o cierre posterior permanecen fuera de esta validación.

### RMCA-DEC-009 — Una orden por ciclo

Una orden puede incluir múltiples trabajos o conceptos mientras el dispositivo permanece en el mismo ciclo de custodia. Si el mismo dispositivo regresa después de haber sido entregado, se crea una nueva orden y un nuevo ciclo, aunque exista relación histórica o de garantía pendiente de definir.

## Identificación física

### RMCA-DEC-010 — Identificación obligatoria

Todo dispositivo bajo custodia debe permanecer físicamente identificado con el número de orden o folio durante todo el ciclo.

### RMCA-DEC-011 — Método normal y contingencia

El método normal es una etiqueta impresa. Si la impresora falla, se escribe manualmente el folio y se fija al dispositivo. La disponibilidad de impresión no modifica la obligación.

### RMCA-DEC-012 — Identificador unido al dispositivo

El identificador permanece unido al dispositivo. No se considera equivalente trasladarlo a una charola, bolsa, caja, estación de trabajo u otro contenedor.

### RMCA-DEC-013 — Reposición sin nueva identidad

Reimprimir o reemplazar una etiqueta dañada no crea una orden nueva ni cambia la identidad del ciclo. El folio reemplazado debe ser el mismo.

## Secuencia de negocio

1. Se cumplen los mínimos de creación.
2. La orden se crea correctamente y recibe folio.
3. Comienza la custodia formal.
4. El dispositivo se identifica físicamente con ese folio.
5. Si falla la impresora, se usa identificación manual.
6. Durante movimientos y trabajos, el identificador permanece unido al dispositivo.
7. Si se deteriora, se reemplaza conservando el folio.
8. La entrega termina el ciclo de custodia.
9. Un regreso posterior inicia otra orden.

La secuencia expresa hechos de negocio y no prescribe transacciones, colas, impresoras, formatos ni pantallas.

## Invariantes relacionadas

- No existe custodia formal sin una orden creada.
- No existe un dispositivo válidamente bajo custodia sin identificación física.
- La falla de una herramienta no elimina la identificación.
- Un contenedor identificado no sustituye al dispositivo identificado.
- La reposición no cambia la identidad de la orden.
- Dos ciclos de custodia distintos no comparten la misma orden.

## Casos válidos

| Situación | Resultado válido |
|---|---|
| Orden creada e impresora disponible | etiqueta impresa con el folio unida al dispositivo |
| Orden creada e impresora caída | folio escrito manualmente y unido al dispositivo |
| Etiqueta ilegible durante reparación | reemplazo con el mismo folio |
| Equipo con varios trabajos durante la estancia | una orden, varios conceptos/trabajos |
| Equipo entregado que vuelve días después | orden y ciclo nuevos, con posible referencia histórica por definir |

## Casos inválidos

- Considerar que la custodia comenzó mientras la creación todavía podía fallar.
- Dejar un dispositivo sin identificación porque no se imprimió la etiqueta.
- Identificar solamente la bolsa o charola.
- Usar el folio de otro dispositivo como reemplazo.
- Reutilizar la orden anterior para un nuevo ciclo después de la entrega.
- Crear una orden nueva por cada concepto dentro de la misma estancia sólo por existir varios trabajos.

## Evidencia fotográfica

Las fotografías se obtienen después de que el dispositivo fue recibido y la orden existe. Esta decisión no convierte las fotografías en sustituto de la identificación física ni define si son obligatorias en todos los casos.

## Preguntas conservadas

El método seguro de fijación para distintos materiales, la evidencia de una reposición, la relación entre órdenes sucesivas, las excepciones de entrega y las métricas operativas permanecen en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
