# Conclusión técnica

## Propósito

La conclusión técnica expresa qué determinó el técnico después de revisar el equipo. Debe conservarse separada del síntoma relatado, de las observaciones complementarias, de la recomendación y de cualquier precio comercial.

## Decisiones validadas

### DTR-DEC-009 — Conclusión diagnóstica

El negocio necesita conocer la conclusión del técnico, no una transcripción exhaustiva de todas las pruebas ejecutadas. La conclusión explica el resultado de la evaluación en lenguaje operativo suficiente.

### DTR-DEC-010 — Observaciones complementarias

El diagnóstico puede incluir observaciones relevantes. Una observación aporta contexto, límites, evidencia o precauciones, pero no sustituye la conclusión técnica.

### DTR-DEC-011 — Resultado con certeza limitada

Una conclusión válida puede reconocer que no fue posible determinar la causa con certeza. “Inconcluso” no debe transformarse en una certeza inventada ni presentarse como reparación terminada.

### DTR-DEC-012 — Independencia frente al precio

El diagnóstico permanece igual aunque recepción cambie importes, aplique promociones o emita otra propuesta comercial. Una variación de precio no corrige ni reemplaza el contenido técnico.

### DTR-DEC-013 — La conclusión no fija precio

El diagnóstico no determina el precio. El técnico aporta información técnica; el proceso comercial decide importes, promociones, condiciones y forma de presentar la oferta.

## Distinciones obligatorias

| Concepto | Responde | Ejemplo | No equivale a |
|---|---|---|---|
| problema reportado | ¿qué dijo la persona al ingresar? | “no carga” | causa confirmada |
| observación | ¿qué contexto adicional importa? | humedad o acceso limitado | conclusión completa |
| prueba | ¿qué comprobación se realizó? | probar centro de carga temporal | instalación o venta |
| conclusión técnica | ¿qué determinó el técnico? | pantalla y centro de carga dañados | cotización |
| recomendación | ¿qué conviene hacer según la conclusión? | reemplazar ambos componentes | precio o autorización |
| cotización | ¿qué se ofrece comercialmente y bajo qué condiciones? | pantalla $1,000 y centro de carga $600 | diagnóstico |

## Contenido operativo suficiente

Sin definir campos ni persistencia, una conclusión necesita permitir comprender:

- la orden y el equipo a los que corresponde;
- quién la emitió y cuándo;
- qué se determinó;
- el nivel de certeza o limitación relevante;
- observaciones indispensables;
- si existe una recomendación asociada.

La cantidad exacta de evidencia, mediciones o pruebas que deben conservarse sigue abierta.

## Propuesta de separación formal

### DTR-PROP-002 — Conclusión y recomendación distinguibles

Representar conclusión técnica y recomendación como elementos distinguibles es una propuesta. La diferencia de significado está validada, pero no se prescribe si se materializan juntas, separadas o mediante otro mecanismo.

## Casos inválidos

- Copiar la falla reportada y presentarla como conclusión.
- Usar una lista de pruebas sin explicar qué se determinó.
- Presentar observaciones libres como único resultado diagnóstico.
- Cambiar la conclusión porque cambió una promoción.
- Incluir un precio como si fuera evidencia técnica.
- Ocultar la incertidumbre con una causa no comprobada.
