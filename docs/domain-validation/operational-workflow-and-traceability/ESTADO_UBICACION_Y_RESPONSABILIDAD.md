# Estado, ubicación y responsabilidad

## Separación conceptual validada

### FOT-DEC-011 — Dimensiones distintas

Estado de negocio, ubicación física, condición de custodia, responsabilidad actual, asignación técnica y participación histórica no son sinónimos. Un valor de una dimensión no prueba automáticamente otro.

| Dimensión | Pregunta | Ejemplo | No prueba |
|---|---|---|---|
| Estado de negocio | ¿En qué situación operativa está la orden? | Pendiente, En espera de autorización, Listo | dónde está el equipo o quién lo tiene |
| Ubicación física | ¿En qué área interna se encuentra? | pendientes, taller, segunda revisión, listos | estado, autorización o trabajo realizado |
| Condición de custodia | ¿El taller todavía responde por el dispositivo? | bajo custodia, custodia terminada | ubicación interna concreta |
| Responsabilidad actual | ¿Quién debe actuar o responder ahora? | recepción debe contactar | posesión física o autoría técnica |
| Asignación técnica | ¿A quién se encomendó trabajo técnico? | técnico asignado | quién diagnosticó, reparó o tiene el equipo |
| Participación histórica | ¿Quién realizó una acción? | reparó, revisó, notificó, entregó | responsabilidad vigente |

## Estados observados

El Product Owner confirmó que SR Taller 1.0 maneja al menos:

- Pendiente;
- Listo;
- No quedó;
- En espera de refacción;
- En espera de anticipo;
- En espera de autorización.

El catálogo activo por sucursal no se verificó en ejecución y el legacy permite valores configurables. Por ello, esta lista es evidencia operativa, no catálogo futuro definitivo.

## Estados candidatos para clarificar fases

Los siguientes nombres aparecen en la separación solicitada, pero se conservan como **propuesta terminológica** hasta validar el catálogo:

- En diagnóstico;
- En reparación;
- En segunda revisión.

Añadirlos, derivarlos o reemplazarlos no se decide aquí.

## Ubicaciones físicas validadas

Las áreas operativas conocidas incluyen:

- pendientes;
- taller;
- segunda revisión;
- listos;
- no quedó.

Son lugares o colas físicas, no estados. “En espera de autorización” no identifica un estante; “Listo” tampoco identifica por sí solo la caja de listos.

## Custodia

La condición En tienda del legacy indica que la custodia continúa, pero no localiza el equipo dentro de la sucursal. Entregado expresa el fin de custodia y salida física, no una ubicación interna ordinaria.

Combinaciones válidas:

| Estado | Ubicación | Custodia | Lectura |
|---|---|---|---|
| Pendiente | pendientes | bajo custodia | espera toma técnica |
| En espera de autorización | segunda revisión u otra área conocida | bajo custodia | espera decisión, no lugar inferido |
| Listo | listos | bajo custodia | disponible, todavía no entregado |
| No quedó | no quedó | bajo custodia | resultado técnico, todavía en tienda |
| Listo | taller | bajo custodia | posible retorno por falla antes de entrega; estado debe reconciliarse |
| cualquier resultado entregable | salida | terminada | entrega válida realizada |

## Propuestas de modelado

### FOT-PROP-001 — Dimensiones explícitas

Representar estado, ubicación y responsabilidad como dimensiones separadas es una propuesta arquitectónica de dominio. La distinción semántica sí está validada; el mecanismo no.

### FOT-PROP-002 — Divergencia visible

Permitir detectar diferencias entre estado, ubicación y custodia es una propuesta. No se define si se bloquearán, alertarán, reconciliarán o auditarán.

### FOT-PROP-003 — Entregado como salida

Tratar Entregado como fin de custodia y salida, no como ubicación interna, es la interpretación preferida. La forma futura del campo En tienda/Entregado permanece abierta.

## Reglas negativas validadas

- Listo no implica Entregado.
- No quedó no implica Entregado.
- En espera de autorización no implica una ubicación.
- El técnico asignado no implica posesión física continua.
- Una nota no cambia el estado por sí sola.
- Cambiar estado no prueba un movimiento físico.
- Mover físicamente no cambia necesariamente el estado.
- La responsabilidad actual no se deduce sólo del último actor.

## Ejemplos inválidos

- Mostrar “Taller” como estado de negocio sin aclarar que es una ubicación.
- Marcar Entregado y conservar “caja de listos” como ubicación activa.
- Concluir que recepción hizo control de calidad sólo porque cambió a Listo.
- Reemplazar al técnico resumen y perder quién diagnosticó o reparó.
- Suponer que un equipo en espera de refacción está físicamente en taller.
- Considerar terminada la custodia cuando se notifica al cliente.

## Decisiones pendientes

Catálogos, jerarquías, correcciones, ubicación desconocida, traslados entre sucursales y responsabilidad de turno permanecen en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
