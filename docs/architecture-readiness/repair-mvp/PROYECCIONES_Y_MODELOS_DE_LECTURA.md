# Proyecciones y modelos de lectura

## Necesidades del MVP

| Modelo de lectura | Contenido mínimo | Fuente autoritativa | Clasificación |
| --- | --- | --- | --- |
| Lista de órdenes | Folio, cliente, equipo, estado, ubicación y responsable | Módulos propietarios | DAP |
| Detalle de orden | Vista compuesta por secciones y versiones | Módulos propietarios | DAP |
| Timeline | Hechos relevantes ordenados | Eventos/hechos confirmados | DAP |
| Equipos pendientes/Taller | Folio, ubicación, etapa y próxima acción | Custodia/flujo | DAP |
| Segunda revisión | Trabajo, responsable, antigüedad y revisión pendiente | Trabajo/calidad | DAP |
| Listos/No quedó | Resolución, saldo, custodia y próxima acción | Flujo/pagos/custodia | DAP |
| En espera de autorización | Versión, total, antigüedad y contacto | Comercial/cliente | DAP |
| Posición financiera | Movimientos, pagado y saldo derivado | Pagos | DAP |
| Total autorizado | Conceptos decididos y suma histórica | Comercial | DAP |
| Trabajo pendiente | Asignación, autorización y etapa | Trabajo/flujo | DAP |
| Entregas pendientes | Resolución, saldo y custodia | Flujo/pagos/custodia | DAP |
| Atribución operativa | Técnico principal, participantes, receptor, revisor y entregador | Módulos propietarios | DAP |
| Alertas/próxima acción | Bloqueo, vencimiento cualitativo y acción permitida | Políticas y proyecciones | DAP |

## Principios

- **[DAR]** Una proyección optimiza lectura pero no decide reglas.
- **[DAR]** Puede ser reconstruible a partir de fuentes autoritativas.
- **[DAR]** Declara frescura y estado de actualización si no es inmediata.
- **[RDD]** Siempre filtra por tenant y alcance autorizado.
- **[DAR]** Una acción posterior usa identidades/versiones y revalida contra el dueño, no confía en datos viejos de la vista.

## Primera implementación

**[DAP]** Se recomienda combinación híbrida: consultas directas publicadas para detalle y búsquedas simples; proyecciones persistidas sólo para listas o alertas que crucen módulos y demuestren necesidad. No se prescribe CQRS completo ni infraestructura asíncrona. La optimización se decide con medición.

## Riesgos

- **[R]** Usar la proyección como autoridad puede permitir trabajo o entrega con datos obsoletos.
- **[R]** Una consulta que une almacenamiento privado de todos los módulos erosiona fronteras.
- **[R]** Incluir evidencia o datos personales sin necesidad aumenta exposición.

## Diferido

**[FMVP]** Data warehouse, cubos, BI avanzado y predicción no pertenecen al MVP.
