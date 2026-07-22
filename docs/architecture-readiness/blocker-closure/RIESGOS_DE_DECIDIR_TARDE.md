# Riesgos de decidir tarde

## Criterio

Decidir tarde no siempre es malo. Es peligroso cuando el trabajo previo cristaliza una respuesta implícita en datos, seguridad, identidad, invariantes u operación. Esta matriz señala el último momento seguro; no adelanta decisiones H5 sin evidencia.

| Decisiones | Riesgo si se cierran tarde | Efecto probable | Severidad | Último momento seguro | Mitigación mientras siguen abiertas |
| --- | --- | --- | --- | --- | --- |
| DEC-002, DEC-062 | Cerradas el 2026-07-21; el riesgo pasa a incumplir el alcance aprobado | R0 incorpora R1, se acepta sólo visualmente o se omiten denegaciones | Crítica | Durante diseño, implementación y aceptación de R0 | Trazar PBI, pruebas y demostración a los criterios aprobados |
| DEC-063 | “Terminado” queda sujeto a interpretación | Evidencia incompleta aunque los escenarios de Producto estén definidos | Crítica | Antes del primer cambio de implementación de R0 | Cerrar Definition of Done contra DEC-062 |
| DEC-004, DEC-005, DEC-049, DEC-051 | Herramientas y estructura se vuelven arquitectura accidental | Repositorio difícil de cambiar, dependencias no verificables | Alta | Antes del primer cambio de implementación de R0 | No instalar tooling ni crear aplicaciones |
| DEC-006 a DEC-009 | El tenant se vuelve parámetro opcional | Fugas de datos y reescritura de persistencia | Crítica | Antes de persistir el primer dato de R0 | No diseñar tablas/repositorios finales; preparar threat model y spike |
| DEC-010 a DEC-012 | ADR-010 no se aplica y la sucursal se infiere o muta silenciosamente | Atribución, visibilidad y políticas aplicadas al lugar equivocado | Crítica | Antes del primer caso de uso con sucursal | Probar estación, ausencia, conflicto, desvinculación y nueva vinculación |
| DEC-013 a DEC-020 | UI, sesión y autorización se mezclan | Suplantación, privilegios excesivos y auditoría falsa | Crítica | Antes del primer login o comando protegido | No implementar PIN ni roles nominales sin matriz de autoridad |
| DEC-037, DEC-038 | Fechas locales se almacenan como hechos absolutos | Historia y cortes irreconciliables | Alta | Antes del primer timestamp persistido | Mantener zona/instante como decisiones explícitas del diseño |
| DEC-044 a DEC-048, DEC-055 | Operabilidad se agrega después | Errores opacos, secretos en logs y trazas incompletas | Alta | Antes del primer recorrido ejecutable | Definir campos permitidos y señales mínimas en R0 |
| DEC-050, DEC-052 | El esquema y datos de prueba no son reproducibles | Migraciones frágiles y pruebas con datos reales | Crítica | Antes de la primera migración | Prohibir cambios manuales y snapshots productivos no autorizados |
| DEC-021 a DEC-025 | Folio visible se confunde con ID o se asigna sin concurrencia | Colisiones, órdenes duplicadas y etiquetas cruzadas | Crítica | Antes de implementar creación de R1 | Separar identidad técnica; autorizar spike concurrente |
| DEC-027 a DEC-031 | Estado, ubicación y custodia se usan como sinónimos | Equipo ilocalizable o entrega duplicada | Crítica | Antes de modelar la orden de R1 | Conservar conceptos separados y cerrar transiciones con Operaciones |
| DEC-032 a DEC-035 | Configuración mutable reescribe la historia | Recepciones válidas dejan de ser explicables | Crítica | Antes de validar una recepción | Preparar precedencia y snapshot; no crear motor genérico |
| DEC-039, DEC-040, DEC-057 | Archivos se tratan como URLs sin dueño | Fuga cross-tenant, abuso, pérdida e imposibilidad de borrar | Crítica | Antes de la primera carga | Mantener puerto abstracto y clasificar evidencia/datos |
| DEC-041, DEC-042, DEC-058 | Impresión o proveedor entra en la transacción central | Reintentos duplican órdenes o fallos físicos revierten custodia válida | Alta | Antes de integrar impresora/proveedor | Definir efecto lateral, pendiente y fallback manual |
| DEC-053, DEC-054, DEC-061 | Backup/restore se valida durante un incidente | Pérdida irrecuperable o restauración cruzada | Crítica | Antes de datos reales de piloto | No abrir piloto sin restore aislado ejecutado |
| DEC-059, DEC-060 | Legado y nuevo sistema operan sin fuente de verdad | Doble captura y saldos/órdenes divergentes | Crítica | Antes de seleccionar piloto | Prohibir convivencia espontánea; definir unidad de corte |
| DEC-056, DEC-064, DEC-066, DEC-069, DEC-070 | Producción descubre obligaciones y capacidad | Incumplimiento, indisponibilidad o cierre destructivo | Crítica | Antes de go/no-go productivo | Mantener H4 cerrado a producción hasta evidencia completa |

## Riesgo opuesto: decidir demasiado pronto

Microservicios, CQRS completo, Event Sourcing, BI avanzado, IA, RFID/NFC, offline, multi-región y módulos comerciales completos permanecen en H5. Aceptarlos sin señales reales agregaría coordinación y superficie operativa sin cerrar ningún riesgo del MVP.
