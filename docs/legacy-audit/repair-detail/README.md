# Auditoría legacy — Detalle de reparación

**Estado:** Borrador para validación.
**Propósito:** Organizar la evidencia funcional y semántica del detalle de reparación de SR Taller 1.0.
**Alcance:** Modal activo, endpoints relacionados y dependencias laterales estrictamente necesarias para explicar su comportamiento.
**Fuente:** Código local de SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
**Audiencia:** Product Owner, operaciones, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Propósito y límites

Este paquete registra lo que el sistema legacy hace, aparenta hacer o no permite demostrar en el flujo de detalle de una reparación. Es evidencia de descubrimiento: no prescribe la solución de SR Taller 2.0, no define un modelo objetivo y no reemplaza la validación operativa.

La vista histórica `views/reparaciones/detalle_modal.php` ya no contiene el modal funcional: redirige al panel. La interfaz activa se construye en `funciones/reparaciones/js_css/detalle_modal.js` desde `views/reparaciones/panel.php` y coordina varios endpoints PHP.

## Relación con la auditoría de “Nueva Reparación”

La auditoría anterior documenta el ingreso y la creación inicial; este paquete comienza cuando una reparación ya existe y se consulta o modifica desde el detalle. Ambos usan el mismo corte fuente, pero mantienen IDs, conclusiones y archivos separados. Ninguno de los siete documentos previos fue modificado y sus hallazgos no se convierten aquí en reglas aprobadas.

La validación posterior de [recepción mínima y autorización comercial](../../domain-validation/reception-minimum-and-commercial-authorization/README.md) usa los límites aquí observados para establecer decisiones de dominio sobre autorización inicial, cotizaciones con varios conceptos, aceptación parcial, preservación de rechazos y políticas configurables de precio. No reescribe esta evidencia legacy ni convierte sus mecanismos actuales en diseño futuro.

La validación posterior de [flujo operativo y trazabilidad](../../domain-validation/operational-workflow-and-traceability/README.md) formaliza el recorrido de Avicell y separa estado, ubicación, custodia, responsabilidad, participación, eventos, notas y actividad. Conserva como contradicciones explícitas el técnico textual sin historial, el revisor ambiguo, los seguimientos libres, los anticipos aislados y las transiciones sin precondiciones documentadas aquí.

La validación posterior de [diagnóstico y recomendaciones técnicas](../../domain-validation/future-state-diagnosis-and-technical-recommendations/README.md) separa conclusión, recomendación, cotización, decisión y ejecución. Usa como evidencia histórica el técnico mutable, el seguimiento libre y el presupuesto sobrescrito, pero no los adopta como solución futura.

## Documentos

| Documento | Contenido |
|---|---|
| [REPAIR_DETAIL_AUDIT.md](REPAIR_DETAIL_AUDIT.md) | Reconstrucción integral, superficies técnicas, secuencia, reglas implícitas y límites de evidencia. |
| [REPAIR_DETAIL_ACTION_CATALOG.md](REPAIR_DETAIL_ACTION_CATALOG.md) | Catálogo de acciones visibles, automáticas e implícitas, con efectos y controles. |
| [REPAIR_DETAIL_STATE_AND_CUSTODY_MAP.md](REPAIR_DETAIL_STATE_AND_CUSTODY_MAP.md) | Estados de reparación, custodia/entrega, transiciones observables y marcas temporales. |
| [REPAIR_DETAIL_MONEY_AND_AUTHORIZATION_MAP.md](REPAIR_DETAIL_MONEY_AND_AUTHORIZATION_MAP.md) | Presupuestos, anticipos, saldo, autorización, impresión y relación con caja. |
| [REPAIR_DETAIL_DOMAIN_FINDINGS.md](REPAIR_DETAIL_DOMAIN_FINDINGS.md) | Hallazgos de dominio trazables a código legacy. |
| [REPAIR_DETAIL_OPEN_QUESTIONS.md](REPAIR_DETAIL_OPEN_QUESTIONS.md) | Preguntas pendientes agrupadas por decisión y responsable de validación. |

## Convención de conocimiento

Cada afirmación relevante usa uno de estos estados:

| Estado | Significado en este paquete |
|---|---|
| `Confirmed by legacy code` | Existe evidencia directa y localizable en el código inspeccionado. |
| `Inferred from legacy behavior` | Es una consecuencia razonable del flujo, pero no una regla declarada. |
| `Not found` | Se buscó en el alcance revisado y no se encontró implementación. |
| `Unknown` | El repositorio no permite resolver el dato sin ejecución, base de datos o contexto externo. |
| `Pending Product Owner validation` | Requiere confirmar intención o práctica operativa. |
| `Pending finance review` | Requiere decisión o validación contable/financiera. |
| `Pending security review` | Requiere evaluar acceso, secreto, evidencia o exposición de datos. |
| `Pending architecture review` | Requiere decidir límites, consistencia, integración o persistencia futura. |

`Not found` no equivale a “no existe en producción”; significa que no apareció en el código versionado y las rutas inspeccionadas. Los valores activos de catálogos y plantillas residen en base de datos y, por restricción de esta auditoría, no fueron consultados.

## Corte cuantitativo

| Elemento inventariado | Cantidad | Referencia |
|---|---:|---|
| Acciones de usuario, automáticas o implícitas | 19 | `LEGACY-RD-ACTION-001` a `LEGACY-RD-ACTION-019` |
| Reglas legacy implícitas | 30 | `LEGACY-RD-RULE-001` a `LEGACY-RD-RULE-030` |
| Literales de estado/custodia con efecto funcional | 7 | 5 de reparación y 2 de custodia |
| Patrones de transición observables | 6 | `LEGACY-RD-TRANSITION-001` a `LEGACY-RD-TRANSITION-006` |
| Endpoints inspeccionados | 17 | 15 del flujo/configuración y 2 laterales de compras |
| Tablas referenciadas en el mapa técnico | 12 | Incluye tablas laterales de permisos, impresión y compras |
| Hallazgos | 24 | `LEGACY-RD-FINDING-001` a `LEGACY-RD-FINDING-024` |
| Preguntas abiertas | 51 | `LEGACY-RD-Q-001` a `LEGACY-RD-Q-051` |

## Exclusiones expresas

- No se ejecutó la aplicación ni se consultó una base de datos.
- No se modificó SR Taller 1.0.
- No se diseñaron estados, permisos, contabilidad, eventos ni entidades para SR Taller 2.0.
- No se auditó exhaustivamente el alta de reparación; su paquete documental previo permanece separado.
- No se alteraron `docs/domain/`, ADR, backlog, sprints, roadmap, código, SQL, configuración, dependencias ni migraciones.

## Lectura recomendada

Comenzar por la [auditoría integral](REPAIR_DETAIL_AUDIT.md), contrastar acciones con el [catálogo](REPAIR_DETAIL_ACTION_CATALOG.md), revisar por separado [estado y custodia](REPAIR_DETAIL_STATE_AND_CUSTODY_MAP.md) y [dinero y autorización](REPAIR_DETAIL_MONEY_AND_AUTHORIZATION_MAP.md), y cerrar con [hallazgos](REPAIR_DETAIL_DOMAIN_FINDINGS.md) y [preguntas](REPAIR_DETAIL_OPEN_QUESTIONS.md).
