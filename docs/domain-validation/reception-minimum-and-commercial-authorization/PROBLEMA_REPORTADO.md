# Problema reportado

## Definición validada

### RMCA-DEC-014 — Declaración del cliente

El problema reportado es la descripción del síntoma, necesidad o comportamiento que el cliente comunica al recibir el dispositivo. Expresa por qué solicita atención; no afirma la causa técnica.

### RMCA-DEC-015 — Requisito universal

Toda orden debe registrar un problema reportado. No puede volverlo opcional una política de tenant, sucursal o interfaz.

En este paquete, “problema reportado” es el término preferido. La promoción o el tratamiento como alias del término legacy “falla reportada” permanece como decisión terminológica separada.

## Distinciones obligatorias

| Concepto | Pregunta que responde | Fuente normal | Puede existir sin el siguiente concepto |
|---|---|---|---:|
| Problema reportado | ¿Qué dice el cliente que ocurre o necesita? | cliente o persona que entrega | Sí |
| Hallazgo técnico | ¿Qué observó el taller al revisar? | técnico | Sí |
| Trabajo propuesto | ¿Qué acción se ofrece y bajo qué concepto? | taller | Sí |
| Decisión del cliente | ¿Qué concepto acepta o rechaza? | persona con autoridad comercial | Sí |
| Trabajo autorizado | ¿Qué alcance puede ejecutarse? | resultado de una decisión válida | Sí |
| Trabajo ejecutado | ¿Qué se hizo realmente? | operación técnica | N/A |

El diagnóstico puede explicar una causa o conclusión técnica y no debe reescribir la declaración original como si el cliente la hubiera formulado.

## Ejemplos

| Entrada | Clasificación correcta | Motivo |
|---|---|---|
| “No enciende desde que se mojó” | problema reportado | describe relato y contexto del cliente |
| “Pantalla quebrada y batería inflada” dicho por el cliente | problema reportado | sigue siendo declaración, aunque use nombres de componentes |
| “Se detectó sulfato en la tarjeta” | hallazgo técnico | surge de una observación del taller |
| “Reemplazo de pantalla por 1,000” | trabajo propuesto | contiene una oferta concreta |
| “Acepta pantalla, no acepta batería” | decisión por concepto | expresa alcance comercial |
| “Se instaló pantalla nueva” | trabajo ejecutado | registra una intervención real |

## Reglas de calidad semántica

- Debe conservarse el sentido de lo expresado por el cliente.
- No debe completarse con un diagnóstico no confirmado.
- Puede incluir más de un síntoma sin convertirse en varios ciclos de custodia.
- Un hallazgo posterior no reemplaza el problema reportado.
- Una propuesta comercial no debe registrarse como problema reportado.
- El texto narrativo puede complementar hechos estructurados, pero no sustituye la decisión comercial por concepto.

## Trazabilidad temporal

Conservar el relato inicial y distinguirlo de información posterior es una necesidad validada. El mecanismo exacto para corregir errores, ampliar el relato o atribuir cambios es una propuesta pendiente; este documento no diseña versiones ni almacenamiento.

## Ejemplos inválidos

- Crear la orden con el problema vacío.
- Registrar “cambio de pantalla autorizado” como problema reportado.
- Sustituir “no enciende” por “tarjeta dañada” después del diagnóstico y perder el relato original.
- Interpretar una suposición del receptor como afirmación del cliente.
- Considerar que aceptar un presupuesto prueba cuál fue el síntoma inicial.

## Preguntas relacionadas

La terminología canónica, la atribución cuando la persona que entrega no es el cliente, la corrección del relato y los requisitos de detalle permanecen en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
