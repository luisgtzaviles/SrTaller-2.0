# Modelo integrado del dominio de reparaciones

## Propósito

Este paquete consolida el conocimiento validado y las hipótesis vigentes sobre el ciclo de reparación de SR Taller 2.0. Es una referencia conceptual para Product Owner, operación, análisis y arquitectura; no es un diseño de software, base de datos, API, interfaz ni despliegue.

**Clasificación:** Interpretación de dominio. La integración organiza fuentes existentes sin sustituirlas ni elevar propuestas a decisiones.

## Autoridad y alcance

La autoridad se resuelve en este orden:

1. decisiones explícitamente validadas por Product Owner en los paquetes RMCA, FOT y DTR;
2. hechos operativos declarados por Product Owner y delimitados a su alcance;
3. evidencia del código legacy, que describe comportamiento y riesgos, no intención futura;
4. documentos preliminares de `docs/domain/` y `docs/architecture/`, que conservan su estado de borrador o propuesta;
5. propuestas de modelado de este paquete, que requieren decisión posterior antes de orientar implementación.

**Clasificación:** Decisión de dominio validada para los puntos 1 y 2; Riesgo o contradicción heredada del legacy para el punto 3; Propuesta de modelado para los puntos 4 y 5.

## Leyenda obligatoria

| Código | Clasificación | Uso |
|---|---|---|
| HOV | Hecho operativo validado por el Product Owner | Describe una práctica confirmada dentro del alcance declarado. |
| DDV | Decisión de dominio validada | Define significado, separación conceptual o regla aprobada. |
| IDO | Interpretación de dominio | Organiza consecuencias razonables sin cerrarlas como verdad. |
| PM | Propuesta de modelado | Sugiere una forma conceptual que aún debe validarse. |
| PC | Política configurable | Regla cuyo valor puede variar por tenant o sucursal. |
| RCA | Regla contextual de Avicell | Práctica confirmada localmente que no se universaliza. |
| PA | Pregunta abierta | Decisión sin respuesta suficiente. |
| RCL | Riesgo o contradicción heredada del legacy | Comportamiento, ambigüedad o deuda observada en SR Taller 1.0. |

Una fila con más de un código contiene afirmaciones separables; la explicación indica qué parte corresponde a cada clasificación.

## Término preferido

**DDV:** se usa **Orden de Servicio** como término conceptual preferido porque representa el ciclo completo de recepción, custodia, diagnóstico, decisión, trabajo, control, cobro y entrega. **IDO:** “Orden de Reparación” puede conservarse como nombre operativo o de interfaz mientras se resuelve la decisión terminológica. Ninguno de los dos términos representa permanentemente al dispositivo ni un único trabajo.

## Índice

### Visión y diseño estratégico

- [Visión integrada del dominio](VISION_INTEGRADA_DEL_DOMINIO.md)
- [Mapa de contextos delimitados](MAPA_DE_CONTEXTOS_DELIMITADOS.md)
- [Relaciones entre contextos](RELACIONES_ENTRE_CONTEXTOS.md)
- [Modelo conceptual de la orden](MODELO_CONCEPTUAL_DE_LA_ORDEN.md)

### Catálogos de modelado

- [Agregados candidatos](AGREGADOS_CANDIDATOS.md)
- [Entidades candidatas](ENTIDADES_CANDIDATAS.md)
- [Objetos de valor candidatos](OBJETOS_DE_VALOR_CANDIDATOS.md)
- [Eventos de dominio integrados](EVENTOS_DE_DOMINIO_INTEGRADOS.md)
- [Comandos y decisiones de dominio](COMANDOS_Y_DECISIONES_DE_DOMINIO.md)
- [Políticas de dominio](POLITICAS_DE_DOMINIO.md)
- [Invariantes integradas](INVARIANTES_INTEGRADAS.md)

### Flujo, actores y modelos especializados

- [Estados, ubicaciones, custodia y responsabilidad](ESTADOS_UBICACIONES_CUSTODIA_Y_RESPONSABILIDAD.md)
- [Actores, roles y capacidades](ACTORES_ROLES_Y_CAPACIDADES.md)
- [Ciclo de vida integrado de la orden](CICLO_DE_VIDA_INTEGRADO_DE_LA_ORDEN.md)
- [Modelo comercial integrado](MODELO_COMERCIAL_INTEGRADO.md)
- [Modelo técnico integrado](MODELO_TECNICO_INTEGRADO.md)
- [Modelo de trazabilidad](MODELO_DE_TRAZABILIDAD.md)

### Consistencia y lectura operacional

- [Límites transaccionales candidatos](LIMITES_TRANSACCIONALES_CANDIDATOS.md)
- [Consistencia y concurrencia](CONSISTENCIA_Y_CONCURRENCIA.md)
- [Proyecciones y vistas derivadas](PROYECCIONES_Y_VISTAS_DERIVADAS.md)
- [Matriz de responsabilidades](MATRIZ_DE_RESPONSABILIDADES.md)
- [Escenarios end-to-end](ESCENARIOS_END_TO_END.md)

### Gobierno del conocimiento

- [Decisiones consolidadas](DECISIONES_CONSOLIDADAS.md)
- [Contradicciones y tensiones](CONTRADICCIONES_Y_TENSIONES.md)
- [Preguntas abiertas priorizadas](PREGUNTAS_ABIERTAS_PRIORIZADAS.md)
- [Glosario integrado](GLOSARIO_INTEGRADO.md)
- [Trazabilidad de fuentes](TRAZABILIDAD.md)

## Reglas de uso

- **DDV:** una decisión validada no se reabre sin evidencia contradictoria y autoridad suficiente.
- **PM:** un agregado, entidad, objeto de valor, contexto o límite transaccional candidato no prescribe clases ni almacenamiento.
- **IDO:** un evento conceptual expresa algo relevante que ocurrió; no obliga a Event Sourcing ni a publicación externa.
- **RCL:** una estructura del legacy no se adopta como modelo futuro sólo por existir.
- **PA:** las preguntas priorizadas son gates de decisión, no respuestas implícitas.

## Estado del paquete

**Estado:** consolidación conceptual para revisión. Las decisiones fuente conservan su autoridad; las propuestas nuevas permanecen abiertas.
