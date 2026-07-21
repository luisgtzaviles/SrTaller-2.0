# Iteraciones diagnósticas

## Propósito

Durante una reparación autorizada pueden aparecer problemas que no eran conocidos al emitir la conclusión anterior. Este documento conserva ese comportamiento dentro de la misma orden y separa el hecho operativo validado de la propuesta de organizarlo como iteraciones.

## Hechos validados

### DTR-DEC-019 — Descubrimiento durante reparación

Durante el trabajo autorizado pueden descubrirse fallas nuevas. Que un problema aparezca después no lo convierte automáticamente en parte del alcance ya aprobado.

### DTR-DEC-020 — Continuidad de la orden

La nueva evaluación ocurre dentro de la misma orden mientras continúe el mismo ciclo de servicio y custodia. No se crea otra orden sólo porque apareció una falla adicional.

### DTR-DEC-021 — Nueva conclusión y recomendaciones

Cuando el descubrimiento cambia lo que se conoce o lo que conviene hacer, el técnico genera una nueva conclusión y nuevas recomendaciones.

### DTR-DEC-022 — Nueva decisión comercial

Recepción vuelve a contactar al cliente y registra una nueva decisión sobre el alcance adicional. La autorización anterior conserva su alcance y no se extiende por inferencia.

### DTR-DEC-023 — Historia preservada

Los diagnósticos, conclusiones, recomendaciones y decisiones anteriores no se borran ni se sobrescriben. Debe poder entenderse qué se sabía, qué se propuso y qué se autorizó en cada momento.

### DTR-DEC-024 — Diagnóstico no único e inmutable

El diagnóstico no debe considerarse un acto único e inmutable de toda la orden. Puede haber varias evaluaciones concluidas a medida que se obtiene nueva información.

## Ejemplo validado

1. El técnico concluye que la pantalla está dañada.
2. Recepción cotiza la pantalla.
3. El cliente autoriza la pantalla.
4. Durante el trabajo, el técnico detecta que el micrófono también falla.
5. La conclusión anterior permanece en la historia.
6. El técnico emite una nueva conclusión y recomienda atender el micrófono.
7. Recepción presenta una nueva propuesta comercial.
8. El cliente acepta o rechaza el nuevo alcance.
9. Sólo se ejecuta lo que corresponda a decisiones vigentes y atribuibles.

## Propuestas de organización

### DTR-PROP-006 — Iteración diagnóstica explícita

Agrupar cada ciclo de evaluación, conclusión y recomendaciones como una iteración diagnóstica es una propuesta. El comportamiento repetible está validado; el nombre, los límites y la representación de cada iteración no lo están.

### DTR-PROP-007 — Historia completa ordenada

Conservar una secuencia completa que permita reconstruir la evolución es una propuesta de organización. No prescribe almacenamiento inmutable, Event Sourcing ni una tecnología de auditoría.

### DTR-PROP-008 — Relación entre iteración y decisiones

Relacionar cada recomendación posterior con las cotizaciones y autorizaciones que produjo es una propuesta. La necesidad de no ampliar autorizaciones anteriores está validada; la cardinalidad y el mecanismo quedan abiertos.

### DTR-PROP-009 — Corrección sin reescritura silenciosa

Representar una corrección mediante una nueva declaración vinculada a la anterior es una propuesta. Debe definirse qué errores son corregibles, quién puede corregirlos y cómo se distingue corrección de nueva información.

## Distinción entre repetición, corrección y retrabajo

| Situación | Significado | Efecto sobre historia |
|---|---|---|
| nueva información | apareció un problema antes desconocido | conserva conclusión anterior y añade otra |
| corrección | se detectó un error en lo registrado | no borra sin dejar explicación |
| diagnóstico inconcluso retomado | nueva evidencia permite continuar | conserva límites anteriores |
| retrabajo | control de calidad rechazó un trabajo realizado | vuelve al trabajo sin fingir nueva falla inicial |
| cambio de precio | cambió la oferta comercial | no crea ni modifica conclusión técnica |

La forma exacta de representar estas diferencias permanece abierta.

## Consistencia dentro de la orden

Una evolución válida debe permitir responder:

- qué se sabía antes de cada decisión;
- quién emitió cada conclusión;
- qué se recomendó;
- qué cotizó recepción;
- qué aceptó o rechazó el cliente;
- qué se ejecutó después;
- qué descubrimiento motivó la siguiente evaluación.

## Casos inválidos

- Sobrescribir “pantalla” por “pantalla y micrófono” y perder el primer alcance.
- Usar la autorización de pantalla para reparar el micrófono.
- Cambiar una cotización y presentar el cambio como nueva conclusión técnica.
- Crear otra orden durante la misma custodia sólo para registrar el nuevo problema.
- Tratar una corrección de captura como si el técnico hubiera descubierto otra falla.
