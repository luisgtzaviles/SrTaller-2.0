# Cierre y priorización de bloqueantes arquitectónicos

## Propósito

Este paquete convierte los bloqueantes de preparación arquitectónica en una secuencia verificable de decisiones. No sustituye las fuentes de dominio, no acepta ADRs, no autoriza prototipos y no habilita implementación por sí mismo.

## Veredicto actual

**R0 está listo para diseño dirigido, pero no para programación. No debe comenzar todavía ningún código ejecutable del producto, incluido scaffolding de framework.**

La documentación permite preparar ADRs, criterios, escenarios y spikes para autorización. El primer commit de código continúa bloqueado por alcance/autorización de R0, selección de plataforma, organización ejecutable mínima, estrategia de pruebas y contratos transversales. R1 añade decisiones de folio, recepción, custodia, política, tiempo, evidencia e identificación física.

| Declaración | Estado actual | Evidencia faltante principal |
| --- | --- | --- |
| R0 listo para diseñar | Sí, con decisiones abiertas visibles | Mantener trazabilidad y no convertir propuestas en implementación |
| R0 listo para programar | No | H0 y H1 cerrados, ADRs aceptados y autorización explícita |
| R1 listo para diseñar | Parcialmente | Cerrar preguntas de producto de recepción y folio |
| R1 listo para programar | No | R0 demostrado y H2 cerrado |
| MVP listo para piloto | No | R1–R5 integradas y H3 cerrado |
| MVP listo para producción | No | H4 cerrado y riesgos residuales aceptados |

## Respuestas rectoras

1. **Primer commit:** lo bloquean únicamente decisiones estructurales difíciles de revertir; se excluyen proveedores y capacidades futuras.
2. **R0:** lo bloquean contexto tenant/sucursal/actor, identidad, sesión, permisos, aislamiento, configuración técnica, tiempo, auditoría y persistencia segura.
3. **R1:** lo bloquean folio, recepción mínima, custodia, estados/ubicación inicial, política efectiva, archivos e identificación física.
4. **Durante implementación:** pueden cerrarse detalles locales que no cambien invariantes, ownership, seguridad ni contratos públicos.
5. **Piloto:** exige operación recuperable, soporte, copias, restauración, monitoreo, rollback y convivencia decidida.
6. **Producción:** exige seguridad endurecida, retención, cumplimiento, capacidad, alertas, recuperación y gobierno SaaS.
7. **ADRs:** sólo las decisiones durables, transversales o costosas de revertir se promueven a ADR.
8. **Orden:** producto y contexto preceden identidad; identidad precede persistencia; la fundación precede recepción; operación recuperable precede piloto.
9. **Evidencia:** cada promoción requiere decisión registrada, autoridad, escenarios, pruebas y trazabilidad; una implementación no cierra una decisión por sí sola.

## Hitos

| Hito | Significado |
| --- | --- |
| H0 | Antes del primer commit de código ejecutable |
| H1 | Antes de programar R0 — Fundación Ejecutable |
| H2 | Antes de programar R1 — Recepción |
| H3 | Antes del piloto controlado |
| H4 | Antes de producción general |
| H5 | Diferible después del MVP |

## Inventario consolidado

Se evaluaron **82 decisiones**: las 70 del inventario base y 12 decisiones diferibles explícitas. La [matriz maestra](INVENTARIO_DE_BLOQUEANTES.md) es la fuente de IDs `DEC-001` a `DEC-082`; los demás documentos agrupan esas filas sin crear estados paralelos.

## Ruta de lectura

1. [Inventario de bloqueantes](INVENTARIO_DE_BLOQUEANTES.md)
2. [Clasificación por hito](CLASIFICACION_POR_HITO.md)
3. [Bloqueantes del primer commit](BLOQUEANTES_DEL_PRIMER_COMMIT.md)
4. [Bloqueantes de R0](BLOQUEANTES_DE_R0.md)
5. [Bloqueantes de R1](BLOQUEANTES_DE_R1.md)
6. [Bloqueantes del piloto](BLOQUEANTES_DEL_PILOTO.md)
7. [Bloqueantes de producción](BLOQUEANTES_DE_PRODUCCION.md)
8. [Decisiones diferibles](DECISIONES_DIFERIBLES.md)
9. [Secuencia de decisiones](SECUENCIA_DE_DECISIONES.md)
10. [Mapa de ADRs requeridos](MAPA_DE_ADRS_REQUERIDOS.md)
11. [Dependencias entre decisiones](DEPENDENCIAS_ENTRE_DECISIONES.md)
12. [Criterios de salida de R0](CRITERIOS_DE_SALIDA_DE_R0.md)
13. [Criterios de entrada de R1](CRITERIOS_DE_ENTRADA_DE_R1.md)
14. [Criterios de piloto](CRITERIOS_DE_PILOTO.md)
15. [Criterios de producción](CRITERIOS_DE_PRODUCCION.md)
16. [Plan de cierre](PLAN_DE_CIERRE.md)
17. [Riesgos de decidir tarde](RIESGOS_DE_DECIDIR_TARDE.md)
18. [Preguntas para el Responsable de Producto](PREGUNTAS_PARA_PRODUCT_OWNER.md)
19. [Preguntas para spikes técnicos](PREGUNTAS_PARA_SPIKES_TECNICOS.md)
20. [Trazabilidad](TRAZABILIDAD.md)

## Autoridad y reglas

- [ADR-002](../../decisions/proposed/ADR-002-modular-monolith-first.md) está `Accepted`; ningún otro ADR cambia de estado aquí.
- Las decisiones de dominio validadas conservan autoridad sobre propuestas arquitectónicas.
- `Requiere Responsable de Producto` nunca se cierra por preferencia técnica.
- `Requiere spike` produce evidencia, no aceptación automática.
- El cierre exige actualizar la matriz, la fuente autoritativa y la evidencia enlazada.
- No se diseñan carpetas definitivas, tablas, migraciones, APIs, interfaces, runtime ni despliegues.

## Próxima promoción posible

La siguiente promoción válida es **R0 listo para programar**. Requiere cerrar H0 y H1; no requiere resolver H2–H5 ni diseñar R2–R5 por anticipación.
