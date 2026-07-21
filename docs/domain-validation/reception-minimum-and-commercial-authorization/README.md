# Validación de recepción mínima y autorización comercial

## Estado documental

- **Estado:** Validado por Product Owner
- **Autoridad:** Decisiones explícitas del Product Owner incluidas en la solicitud de validación
- **Alcance:** Recepción mínima, inicio de custodia, identificación física, problema reportado, autorización comercial inicial, cotizaciones y decisiones por concepto
- **Fuera de alcance:** Diseño técnico, tablas, APIs, clases, pantallas, migraciones y plan de implementación
- **Última actualización:** 2026-07-21

## Propósito

Este paquete conserva decisiones de dominio confirmadas para SR Taller 2.0 y separa lo universal de lo configurable. Su objetivo es evitar que la conducta del sistema legacy, una propuesta de Future State o una preferencia de interfaz se interpreten como política aprobada.

Las decisiones aquí registradas son fuente validada para trabajos posteriores, pero no actualizan por sí solas todos los documentos canónicos de discovery. La promoción al lenguaje ubicuo, reglas generales y registros de decisiones requiere una acción documental separada.

## Resultados principales

1. Una orden representa un ciclo de servicio y custodia. La custodia formal comienza únicamente cuando la orden se crea correctamente y termina con la entrega.
2. La recepción mínima universal exige nombre y problema reportado. El contexto tenant, sucursal, usuario receptor, fecha/hora, folio y ubicación inicial de custodia lo aporta el sistema.
3. La información de contacto y varios datos del dispositivo son configurables; el alcance exacto de la configuración entre tenant y sucursal sigue abierto.
4. El dispositivo debe permanecer físicamente identificado con el folio durante toda la custodia. Una falla de impresora no suspende esta obligación.
5. Las fotografías se capturan después de que la orden existe; no forman parte del formulario mínimo de Nueva Reparación. Su obligatoriedad y alcance siguen abiertos.
6. “Problema reportado” conserva la declaración del cliente y no equivale a hallazgo ni diagnóstico.
7. Una orden puede contener varios trabajos o conceptos. Las decisiones comerciales se registran por concepto y una cotización puede quedar parcialmente autorizada.
8. El total autorizado se deriva de los conceptos autorizados y de las políticas comerciales aplicables.
9. En la práctica Avicell validada, el servicio inicial para un equipo mojado cuesta $350 MXN sólo si ese servicio por sí solo deja funcionando el equipo. Si después se autoriza una reparación de pantalla por $1,000 MXN, se cobran $1,000 MXN, no $1,350 MXN.
10. La absorción del servicio inicial es una política configurable, no una regla universal.

## Convención de conocimiento

| Etiqueta | Significado |
|---|---|
| Hecho validado por Product Owner | Decisión explícita que este paquete conserva como autoridad de dominio. |
| Evidencia legacy | Comportamiento o limitación documentada del sistema anterior; no define por sí misma el futuro. |
| Propuesta | Opción útil para una validación posterior; no está aprobada. |
| Pregunta abierta | Punto que la evidencia y las decisiones actuales no resuelven. |
| Fuera de alcance | Tema deliberadamente no diseñado en este paquete. |

## Identificadores

| Prefijo | Uso |
|---|---|
| RMCA-DEC | Decisión validada de dominio |
| RMCA-INV | Invariante validada |
| RMCA-POL | Variante de política comercial validada como configurable |
| RMCA-ESC | Escenario de aceptación de dominio |
| RMCA-PREG | Pregunta que permanece abierta |

Los identificadores son documentales. No prescriben entidades, eventos técnicos ni contratos de software.

## Índice

1. [Recepción mínima](RECEPCION_MINIMA.md)
2. [Clasificación de la política de recepción](CLASIFICACION_POLITICA_RECEPCION.md)
3. [Custodia e identificación física](CUSTODIA_E_IDENTIFICACION_FISICA.md)
4. [Problema reportado](PROBLEMA_REPORTADO.md)
5. [Autorización comercial inicial](AUTORIZACION_COMERCIAL_INICIAL.md)
6. [Cotizaciones y decisiones por concepto](COTIZACIONES_Y_DECISIONES_POR_CONCEPTO.md)
7. [Políticas comerciales de precio](POLITICAS_COMERCIALES_DE_PRECIO.md)
8. [Reglas e invariantes de dominio](REGLAS_E_INVARIANTES_DE_DOMINIO.md)
9. [Escenarios](ESCENARIOS.md)
10. [Preguntas abiertas](PREGUNTAS_ABIERTAS.md)
11. [Trazabilidad](TRAZABILIDAD.md)

## Relación con documentación existente

- El [Future State Event Storming de recepción](../future-state-reception/README.md) sigue siendo una propuesta. Este paquete resuelve el inicio formal de orden/custodia y algunos mínimos, pero no aprueba todo su recorrido.
- La [auditoría legacy de configuración de recepción](../../legacy-audit/reception-policy-config/README.md) prueba que los checkboxes existentes no constituyen una política completa. Este paquete establece la clasificación objetivo validada.
- La [auditoría legacy del detalle](../../legacy-audit/repair-detail/README.md) demuestra las limitaciones actuales de presupuesto y autorización. Este paquete fija las distinciones de dominio que el futuro deberá preservar.
- La validación de [flujo operativo y trazabilidad](../operational-workflow-and-traceability/README.md) continúa después de la recepción y aplica estas decisiones a ubicaciones, segunda revisión, participación, actividad y entrega.
- La validación de [diagnóstico y recomendaciones técnicas](../future-state-diagnosis-and-technical-recommendations/README.md) documenta cómo una conclusión y sus recomendaciones alimentan cotizaciones y decisiones por concepto sin fijar precios ni ampliar autorizaciones.
- El [dominio general](../../domain/README.md) contiene conceptos y preguntas todavía en discovery. La relación exacta, incluidos los puntos aclarados o parcialmente resueltos, se detalla en [Trazabilidad](TRAZABILIDAD.md).

## Regla de uso

Un trabajo posterior puede derivar criterios de producto de estas decisiones, pero debe conservar su autoridad y sus límites. No debe convertir una pregunta abierta en una respuesta implícita, una variante comercial en una regla universal ni una regla de dominio en un mecanismo técnico prematuro.
