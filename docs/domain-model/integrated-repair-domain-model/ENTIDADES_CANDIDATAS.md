# Entidades candidatas

## Criterio

**PM:** una entidad candidata tiene continuidad e identidad relevante dentro del dominio. Esta lista no prescribe clases ni persistencia y puede cambiar al validar límites de agregados.

## Catálogo

| Entidad candidata | Identidad o continuidad | Contexto propietario candidato | Razón de identidad | Estado |
|---|---|---|---|---|
| Orden de Servicio | identidad estable durante el ciclo | Órdenes | coordina múltiples hechos sin cambiar | Validada como concepto; entidad candidata fuerte |
| Cliente operativo | identidad de persona/cuenta del taller | Clientes | aparece en varias órdenes y puede corregirse | Candidata fuerte; deduplicación abierta |
| Contacto | identidad o relación de contacto | Clientes | puede diferir del cliente y cambiar por propósito | Candidata media |
| Persona entregante | participación en una recepción | Recepción | debe distinguirse del cliente/propietario supuesto | Candidata media; puede ser rol histórico |
| Dispositivo recibido | continuidad dentro de la orden | Recepción/Custodia | objeto físico bajo custodia | Candidata fuerte en el ciclo |
| Iteración diagnóstica | secuencia e identidad dentro de la orden | Técnico | no debe sobrescribirse al descubrir algo nuevo | Propuesta fuerte |
| Conclusión técnica | pertenencia a una evaluación | Técnico | resultado atribuible con certeza y momento | Candidata media; posible parte inmutable |
| Recomendación técnica | identidad/versión y origen | Técnico | varias recomendaciones pueden derivar de una conclusión | Candidata media |
| Concepto de cotización | identidad dentro de una versión | Comercial | recibe precio y decisión individual | Candidata fuerte |
| Decisión por concepto | identidad de decisión | Comercial | conserva autor, momento, alcance y resultado | Candidata fuerte |
| Trabajo autorizado | referencia entre decisión y ejecución | Comercial/Técnico | delimita lo permitido | Candidata fuerte |
| Trabajo ejecutado | identidad de intervención/resultados | Técnico | varios trabajos por orden y por autorización | Candidata fuerte |
| Participación técnica | contribución atribuible | Técnico | preserva múltiples técnicos sin campo resumen | Candidata fuerte |
| Asignación | periodo de responsabilidad | Técnico/Workflow | puede comenzar, cambiar y terminar | Candidata fuerte |
| Revisión de calidad | identidad de revisión/intentona | Calidad | varios ciclos y resultados sin sobrescribir | Candidata fuerte |
| Nota narrativa | identidad de anotación | Trazabilidad/Órdenes | conserva autor y texto sin ser hecho estructurado | Candidata fuerte |
| Evidencia | identidad y propósito del registro | Evidencias | archivo/registro puede acompañar varios hechos por referencia | Candidata media |
| Pago o anticipo | identidad de movimiento | Pagos | correcciones no borran el original | Candidata fuerte |
| Entrega | identidad del acto válido y sus intentos | Entrega | debe impedir doble entrega y terminar custodia | Candidata fuerte |
| Ubicación física | identidad en catálogo por sucursal | Workflow | puede renombrarse/desactivarse conservando historia | Candidata media |
| Movimiento físico | identidad secuencial | Workflow | prueba cambio de lugar y actor | Candidata fuerte |
| Sesión operativa/contexto de atribución | continuidad temporal acotada | Identidad | atribuye acciones sin ser prueba absoluta | Candidata conceptual; diseño abierto |

## Entidades que no deben confundirse

| Distinción | Clasificación | Consecuencia |
|---|---|---|
| Cliente operativo / contacto / entregante / receptor de entrega | DDV | una persona puede desempeñar uno o varios roles, pero no se infieren equivalencias |
| Dispositivo recibido / Orden de Servicio | DDV | el dispositivo puede regresar bajo otra orden |
| Iteración / conclusión / recomendación | DDV / PM | una iteración produce conclusión y puede producir recomendaciones, sin convertirlas en un texto único |
| Trabajo autorizado / trabajo ejecutado | DDV | autorización no prueba ejecución y ejecución no puede excederla |
| Asignación / participación | DDV / PM | estar asignado no demuestra haber ejecutado cada acción |
| Ubicación / movimiento físico | DDV / PM | ubicación actual es proyección; movimiento es hecho histórico candidato |
| Nota / evento estructurado | DDV | narrativa no reemplaza autorización, pago, QC o entrega |
| Sesión / persona | HOV / IDO | PIN y sesión aportan atribución operativa, no identidad absoluta |

## Identidad pendiente

- **PA:** estrategia para reconocer al mismo cliente sin fusionar homónimos.
- **PA:** identidad persistente del dispositivo cuando IMEI/serie faltan o cambian.
- **PA:** si Contacto es entidad reutilizable o una relación histórica por orden.
- **PA:** si Persona entregante y Persona receptora de entrega son roles sobre persona o snapshots atribuibles.
- **PA:** granularidad de trabajo autorizado frente a concepto comercial.
- **PA:** lifecycle de sesión operativa y seguridad de PIN.
