# Validación del flujo operativo y la trazabilidad

## Estado documental

- **Estado:** Validado por Product Owner en el alcance indicado
- **Autoridad:** Hechos operativos y decisiones explícitas incluidos en la solicitud de validación
- **Alcance:** Operación desde recepción hasta entrega, estado, ubicación, custodia, participación, control de calidad, actividad, atribución y anticipos básicos
- **Contexto validado:** Flujo real de Avicell y capacidades observadas de SR Taller 1.0
- **Fuera de alcance:** Diseño técnico, almacenamiento, tablas, APIs, interfaces, Event Sourcing, seguridad criptográfica, Caja completa y contabilidad
- **Última actualización:** 2026-07-21

## Propósito

Este paquete formaliza cómo trabajan hoy las personas alrededor de una orden y qué trazabilidad necesita preservar SR Taller 2.0. Separa hechos confirmados de Avicell, limitaciones del legacy, propuestas de modelado y preguntas todavía abiertas.

Una práctica validada en Avicell no se vuelve automáticamente una invariante universal para todos los tenants. Cuando la generalización no fue confirmada, el documento conserva el hecho local y clasifica la regla futura como propuesta o política configurable.

## Resultados principales

1. Una orden atraviesa recepción, área de pendientes, taller, segunda revisión, listos o no quedó y entrega, con ciclos de retorno a taller cuando sea necesario.
2. Estado de negocio, ubicación física, condición de custodia, responsabilidad actual y participación histórica responden preguntas diferentes.
3. Listo no significa Entregado; No quedó tampoco significa que el dispositivo salió de la tienda.
4. El técnico produce información y trabajo técnico. Recepción conduce comunicación, cotización, autorización, notificación, cobro y entrega en el flujo validado.
5. La segunda revisión es un filtro independiente del trabajo técnico. En Avicell normalmente la realiza recepción.
6. Una orden puede involucrar varias personas y varios técnicos sin perder quién recibió, diagnosticó, reparó, revisó, notificó, cobró o entregó.
7. Un evento estructurado, una nota narrativa y una actividad automática no son equivalentes.
8. La atribución por PIN es un mecanismo operativo de baja fricción; no constituye prueba absoluta de identidad.
9. Los anticipos son movimientos históricos relacionados con la orden y no un importe mutable aislado.
10. La entrega válida termina la custodia; ningún cambio de estado por sí solo prueba que ocurrió la entrega física.

## Convención de conocimiento

| Etiqueta | Significado |
|---|---|
| Hecho validado por Product Owner | Práctica, distinción o resultado confirmado para el contexto indicado. |
| Evidencia legacy | Comportamiento encontrado en SR Taller 1.0; no determina el diseño futuro. |
| Propuesta | Interpretación o regla candidata que necesita validación adicional. |
| Política candidata | Regla que podría variar por tenant o sucursal. |
| Pregunta abierta | Decisión que no debe cerrarse sin nueva evidencia. |
| Fuera de alcance | Tema deliberadamente no diseñado en este paquete. |

## Identificadores documentales

| Prefijo | Uso |
|---|---|
| FOT-DEC | Decisión o hecho operativo validado |
| FOT-PROP | Propuesta de modelado de dominio |
| FOT-EVT | Evento estructurado de negocio documentado conceptualmente |
| FOT-INV | Invariante validada o propuesta, con clasificación explícita |
| FOT-ESC | Escenario operativo |
| FOT-PREG | Pregunta abierta |

Los identificadores no prescriben clases, tablas, endpoints, mensajes publicados ni contratos técnicos.

## Índice

1. [Flujo operativo actual validado](FLUJO_OPERATIVO_ACTUAL_VALIDADO.md)
2. [Estado, ubicación y responsabilidad](ESTADO_UBICACION_Y_RESPONSABILIDAD.md)
3. [Roles y responsabilidades operativas](ROLES_Y_RESPONSABILIDADES_OPERATIVAS.md)
4. [Eventos, notas y actividad](EVENTOS_NOTAS_Y_ACTIVIDAD.md)
5. [Trazabilidad por usuario](TRAZABILIDAD_POR_USUARIO.md)
6. [Transiciones y precondiciones](TRANSICIONES_Y_PRECONDICIONES.md)
7. [Control de calidad y segunda revisión](CONTROL_DE_CALIDAD_SEGUNDA_REVISION.md)
8. [Ubicaciones físicas y colas operativas](UBICACIONES_FISICAS_Y_COLAS_OPERATIVAS.md)
9. [Modelo de asignación técnica](MODELO_DE_ASIGNACION_TECNICA.md)
10. [Anticipos y trazabilidad financiera básica](ANTICIPOS_Y_TRAZABILIDAD_FINANCIERA_BASICA.md)
11. [Escenarios](ESCENARIOS.md)
12. [Reglas e invariantes](REGLAS_E_INVARIANTES.md)
13. [Preguntas abiertas](PREGUNTAS_ABIERTAS.md)
14. [Trazabilidad](TRAZABILIDAD.md)
15. [D6.1 — transición local a diagnóstico](D6_1_LOCAL_WORKFLOW_TRANSITION.md)

## Relación con documentación existente

- [Recepción mínima y autorización comercial](../reception-minimum-and-commercial-authorization/README.md) continúa siendo la autoridad validada sobre nacimiento de orden/custodia, identificación física y decisiones comerciales por concepto.
- [Future State Reception](../future-state-reception/README.md) termina al habilitar el equipo para diagnóstico; este paquete continúa el recorrido operativo sin aprobar todo aquel Future State.
- [Diagnóstico y recomendaciones técnicas](../future-state-diagnosis-and-technical-recommendations/README.md) profundiza el trabajo técnico, sus resultados repetibles y la frontera con cotización sin cambiar el flujo real aquí validado.
- [Auditoría legacy del detalle](../../legacy-audit/repair-detail/README.md) aporta evidencia sobre campos mutables, seguimientos, anticipos, estado, custodia y responsables.
- [Auditoría legacy de configuración de recepción](../../legacy-audit/reception-policy-config/README.md) aporta el contexto de sesión, creación, actor receptor y valores iniciales.
- El [dominio general](../../domain/README.md) permanece en discovery. La promoción de estas decisiones a lenguaje, estados y eventos canónicos requiere un trabajo separado.

## Regla de uso

Los documentos pueden orientar criterios futuros sólo si conservan el nivel de autoridad de cada afirmación. No debe confundirse el flujo real de Avicell con una regla universal, una proyección con el registro fuente, una nota con un evento obligatorio ni un evento conceptual con Event Sourcing técnico.
