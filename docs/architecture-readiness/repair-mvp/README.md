# Preparación arquitectónica del MVP de Reparaciones

## Propósito

Este paquete traduce el modelo integrado del dominio de reparación a una preparación arquitectónica verificable. No autoriza implementación ni define tablas, contratos HTTP o clases definitivas. Fue evidencia para la aceptación posterior de ADR-002; no aprueba por sí mismo otros ADRs.

## Estado

**Preparado con bloqueantes.** Existe suficiente definición del dominio para delimitar el MVP, proponer fronteras y ordenar rebanadas verticales. Todavía no existe autorización explícita del Responsable de Producto para implementar y permanecen decisiones mínimas abiertas sobre plataforma, aislamiento, identidad, permisos, estados, folios, configuración, autorización comercial, calidad y entrega.

La siguiente promoción posible es **Preparado para una primera rebanada vertical**, una vez satisfechos los criterios indicados en [Criterios de inicio](CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md). No se declara preparación para la implementación completa del MVP.

El [paquete de cierre de bloqueantes](../blocker-closure/README.md) consolida estas preguntas con IDs, hitos H0–H5, responsables, evidencia y gates verificables. Prioriza el trabajo de decisión sin cambiar la autoridad ni el estado de las fuentes de este paquete.

## Las dos respuestas rectoras

### ¿Qué necesitamos decidir antes de programar?

**[PB]** Autorización para implementar; ADRs técnicos restantes; contexto y aislamiento multitenant; sucursal activa; identidad/PIN, sesión y permisos; término oficial; límites de Orden; alcance/concurrencia del folio; estados iniciales; política efectiva; archivos, zona horaria y criterios de aceptación. ADR-002 ya no es bloqueante. Véase [Decisiones bloqueantes](DECISIONES_BLOQUEANTES.md).

### ¿Cuál es la primera rebanada vertical que no traiciona el dominio?

**[DAR]** Después de una fundación ejecutable mínima, R1 — Recepción: entrar con contexto verificable, crear Orden de Servicio con cliente/problema, reservar folio, iniciar custodia en la misma operación, identificar el equipo, consultar detalle/notas/línea temporal y tolerar falla de impresora mediante folio manual. No incluye diagnóstico, cotización ni pagos prematuros y no convierte la Orden en agregado gigante. Véase [Plan de rebanadas](PLAN_DE_REBANADAS_VERTICALES.md).

## Convención de clasificación

Cada conclusión relevante se etiqueta con una de estas clases:

| Etiqueta | Clasificación |
| --- | --- |
| DAP | Decisión arquitectónica propuesta. |
| DAR | Decisión arquitectónica recomendada. |
| RDD | Restricción derivada del dominio. |
| RP | Restricción de producto. |
| ST | Supuesto técnico. |
| R | Riesgo. |
| PB | Pregunta bloqueante. |
| DD | Decisión diferible. |
| FMVP | Fuera del MVP. |
| ADR | Requiere ADR posterior. |

`DAP` y `DAR` expresan opciones pendientes de aprobación; nunca equivalen a una decisión aceptada.

## Ruta de lectura

1. [Estado de preparación](ESTADO_DE_PREPARACION_ARQUITECTONICA.md)
2. [Alcance del MVP](ALCANCE_DEL_MVP.md)
3. [Flujo vertical mínimo vendible](FLUJO_VERTICAL_MINIMO_VENDIBLE.md)
4. [Capacidades incluidas y diferidas](CAPACIDADES_INCLUIDAS_Y_DIFERIDAS.md)
5. [Fronteras modulares propuestas](FRONTERAS_MODULARES_PROPUESTAS.md)
6. [Mapa de dependencias](MAPA_DE_DEPENDENCIAS.md)
7. [Decisiones de agregados](DECISIONES_DE_AGREGADOS.md)
8. [Límites transaccionales](LIMITES_TRANSACCIONALES.md)
9. [Consistencia y procesos multipaso](CONSISTENCIA_Y_PROCESOS_MULTIPASO.md)
10. [Monolito modular](MONOLITO_MODULAR.md)
11. [Reglas de dependencia](REGLAS_DE_DEPENDENCIA.md)
12. [Capa de aplicación](CAPA_DE_APLICACION.md)
13. [Servicios de dominio candidatos](SERVICIOS_DE_DOMINIO_CANDIDATOS.md)
14. [Puertos y repositorios candidatos](PUERTOS_Y_REPOSITORIOS_CANDIDATOS.md)
15. [Uso de eventos](USO_DE_EVENTOS.md)
16. [Proyecciones y modelos de lectura](PROYECCIONES_Y_MODELOS_DE_LECTURA.md)
17. [Modelo multitenant](MODELO_MULTITENANT.md)
18. [Identidad y atribución](MODELO_DE_IDENTIDAD_Y_ATRIBUCION.md)
19. [Configuración](MODELO_DE_CONFIGURACION.md)
20. [Integraciones y adaptadores](INTEGRACIONES_Y_ADAPTADORES.md)
21. [Concurrencia e idempotencia](CONCURRENCIA_E_IDEMPOTENCIA.md)
22. [Seguridad y acciones sensibles](SEGURIDAD_Y_ACCIONES_SENSIBLES.md)
23. [Observabilidad y auditoría](OBSERVABILIDAD_Y_AUDITORIA.md)
24. [Supuestos de rendimiento](SUPUESTOS_DE_RENDIMIENTO.md)
25. [Estrategia de evolución](ESTRATEGIA_DE_EVOLUCION.md)
26. [Riesgos arquitectónicos](RIESGOS_ARQUITECTONICOS.md)
27. [Decisiones bloqueantes](DECISIONES_BLOQUEANTES.md)
28. [Decisiones diferibles](DECISIONES_DIFERIBLES.md)
29. [Criterios de inicio](CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md)
30. [Plan de rebanadas verticales](PLAN_DE_REBANADAS_VERTICALES.md)
31. [Trazabilidad](TRAZABILIDAD.md)
32. [Cierre y priorización de bloqueantes](../blocker-closure/README.md)

## Autoridad documental

- El modelo de dominio consolidado es la fuente de invariantes y lenguaje: [modelo integrado](../../domain-model/integrated-repair-domain-model/README.md).
- [ADR-002](../../decisions/proposed/ADR-002-modular-monolith-first.md) está `Accepted`; los demás ADRs permanecen propuestos en el [registro](../../decisions/README.md).
- Las políticas de Sprint 00 y entrega conservan su autoridad sobre el inicio de implementación.
- Cuando una propuesta de este paquete contradiga una decisión posteriormente aceptada, prevalece la decisión aceptada y este paquete debe revisarse.

## Alcance documental

**[RP]** El paquete se limita al MVP de Reparaciones. Inventario completo, compras, facturación electrónica, CRM omnicanal y demás capacidades diferidas sólo aparecen como interfaces o dependencias futuras.

**[RDD]** El flujo preserva identidad de orden, custodia, trazabilidad de actores, autorización por concepto, ejecución autorizada, control de calidad, cobro y entrega.

**[ADR]** La topología concreta, el lenguaje, los marcos tecnológicos, la persistencia y el modelo multitenant definitivo sólo podrán fijarse mediante ADRs aceptados.
