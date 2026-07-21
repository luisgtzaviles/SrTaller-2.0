# Validación futura del diagnóstico y las recomendaciones técnicas

## Estado documental

- **Estado:** Hechos operativos validados; organización futura propuesta
- **Autoridad:** Decisiones explícitas del Product Owner incluidas en la solicitud de validación
- **Alcance:** Diagnóstico técnico, conclusión, recomendaciones, descubrimientos posteriores y frontera con cotización comercial
- **Contexto:** Operación descrita para SR Taller y continuidad del flujo validado de Avicell
- **Fuera de alcance:** Código, persistencia, tablas, clases, APIs, interfaces, arquitectura, precios, Caja, inventario y Event Sourcing
- **Última actualización:** 2026-07-21

## Propósito

Este paquete formaliza qué produce el trabajo diagnóstico, cómo se distingue de la propuesta comercial y cómo se conserva la continuidad cuando aparecen problemas nuevos durante una reparación. El objetivo es mantener rapidez operativa sin perder la conclusión, la recomendación, la decisión del cliente ni la historia de lo ocurrido.

El paquete no convierte cada prueba interna en un registro obligatorio. Tampoco decide que una conclusión, recomendación, iteración o relación deba convertirse en una tabla, clase, punto de integración o evento técnico.

## Resultados principales

1. El técnico revisa el equipo y produce una conclusión diagnóstica cuando considera suficiente la información disponible.
2. Las pruebas, desmontaje, limpieza y piezas temporales apoyan el diagnóstico; no se registran necesariamente como hallazgos individuales.
3. La conclusión técnica explica el resultado de la evaluación y puede incluir observaciones, pero las observaciones no la sustituyen.
4. Una recomendación técnica expresa componentes o trabajos que, según el técnico, conviene realizar; todavía no es una cotización.
5. Recepción transforma la recomendación en una propuesta comercial con precios y políticas aplicables.
6. El precio puede cambiar sin alterar el diagnóstico ni la recomendación técnica que le da origen.
7. El cliente puede aceptar todo, una parte o nada; sólo se ejecuta el alcance autorizado.
8. Un hallazgo durante la reparación puede abrir una nueva evaluación, conclusión, recomendación y decisión dentro de la misma orden.
9. Las conclusiones y decisiones anteriores no se borran ni se reescriben para simular que el último resultado fue el único.
10. La granularidad debe sostener operación y trazabilidad sin obligar al técnico a capturar decenas de pruebas de escaso valor.

## Convención de conocimiento

| Etiqueta | Significado |
|---|---|
| Hecho validado por Product Owner | Práctica, distinción o resultado explícitamente confirmado. |
| Evidencia del sistema anterior | Comportamiento o limitación de SR Taller 1.0; no define el futuro. |
| Propuesta | Organización conceptual candidata que necesita validación adicional. |
| Pregunta abierta | Decisión que no debe cerrarse mediante inferencia. |
| Fuera de alcance | Tema deliberadamente no diseñado. |

## Identificadores documentales

| Prefijo | Uso |
|---|---|
| DTR-DEC | Decisión o hecho operativo validado |
| DTR-PROP | Propuesta de organización futura |
| DTR-INV | Invariante validada, contextual o propuesta |
| DTR-ESC | Escenario de diagnóstico y transición comercial |
| DTR-PREG | Pregunta abierta |

Los identificadores sólo sirven para trazabilidad documental. No nombran contratos, componentes, mensajes, campos ni mecanismos de almacenamiento.

## Índice

1. [Estado futuro del diagnóstico](FUTURE_STATE_DIAGNOSTICO.md)
2. [Conclusión técnica](CONCLUSION_TECNICA.md)
3. [Recomendaciones técnicas](RECOMENDACIONES_TECNICAS.md)
4. [Iteraciones diagnósticas](ITERACIONES_DIAGNOSTICAS.md)
5. [Transición a cotización](TRANSICION_A_COTIZACION.md)
6. [Responsabilidades del técnico](RESPONSABILIDADES_DEL_TECNICO.md)
7. [Resultados del diagnóstico](RESULTADOS_DEL_DIAGNOSTICO.md)
8. [Escenarios](ESCENARIOS.md)
9. [Reglas e invariantes](REGLAS_E_INVARIANTES.md)
10. [Preguntas abiertas](PREGUNTAS_ABIERTAS.md)
11. [Trazabilidad](TRAZABILIDAD.md)

## Fronteras con paquetes existentes

- El [estado futuro de recepción](../future-state-reception/README.md) termina cuando el equipo queda disponible para diagnóstico. Ese hito no significa diagnóstico iniciado.
- [Flujo operativo y trazabilidad](../operational-workflow-and-traceability/README.md) conserva el recorrido real, los roles, la segunda revisión y la necesidad de historia. Este paquete profundiza únicamente la fase técnica y su salida comercial.
- [Recepción mínima y autorización comercial](../reception-minimum-and-commercial-authorization/README.md) sigue siendo la autoridad sobre conceptos cotizados, aceptación total o parcial y preservación del rechazo.
- El [mapa de eventos del estado actual](../current-state-event-storming/README.md) demuestra que el sistema anterior mezcla diagnóstico, hallazgos, seguimiento y presupuesto. Esa evidencia no se adopta como diseño.
- El [dominio general](../../domain/README.md) permanece en descubrimiento. La reconciliación de términos, estados y eventos canónicos necesita una acción posterior.

## Regla de uso

Las separaciones semánticas validadas pueden orientar trabajos futuros. Las propuestas de iteración, versión, relación e historial no deben presentarse como implementación aprobada. Una recomendación técnica nunca debe adquirir precio por inferencia, y una cotización nunca debe reescribir la conclusión que la originó.
