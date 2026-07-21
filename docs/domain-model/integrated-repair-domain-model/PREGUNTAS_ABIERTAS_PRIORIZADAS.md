# Preguntas abiertas priorizadas

## Regla

Todas las filas son **PA**. Se consolidaron duplicados semánticos de `docs/domain`, RMCA, FOT, DTR y auditorías legacy; ninguna pregunta incluye una respuesta implícita.

## Bloqueantes para arquitectura

| ID | Pregunta | Decisión que desbloquea | Fuentes relacionadas |
|---|---|---|---|
| IDM-Q-001 | ¿Cuál es el catálogo definitivo de estados y sus transiciones válidas? | fronteras de workflow y consistencia | FOT-PREG; DQ-018 |
| IDM-Q-002 | ¿Cuál es el catálogo de ubicaciones por sucursal y qué movimientos deben registrarse? | ownership de ubicación y reconciliación | FOT-PREG |
| IDM-Q-003 | ¿Cuál es el catálogo de excepciones, autoridades, vigencia y compensación? | invariantes y autorización transversal | RMCA/FOT/DTR |
| IDM-Q-004 | ¿Cuál es el alcance de unicidad del folio y cómo se resuelve concurrencia? | identidad de Orden | legacy + arquitectura |
| IDM-Q-005 | ¿Cómo se identifica persistentemente un dispositivo sin depender de IMEI/serie? | relación dispositivo–órdenes | DQ-005 |
| IDM-Q-006 | ¿Qué frontera exacta conservan Orden, Workflow y Custodia? | agregados y ownership | PM de este paquete |
| IDM-Q-007 | ¿Qué hechos necesitan consistencia inmediata y cuáles aceptan proceso pendiente? | límites transaccionales | escenarios integrados |
| IDM-Q-008 | ¿Cómo se versionan políticas y cuál aplica a una orden en curso? | configuración multi-tenant | auditoría RPC |

## Bloqueantes para MVP

| ID | Pregunta | Decisión que desbloquea | Fuentes relacionadas |
|---|---|---|---|
| IDM-Q-009 | ¿Qué evidencia y qué personas pueden autorizar cada concepto? | autorización comercial | RMCA-PREG/DTR-PREG |
| IDM-Q-010 | ¿Hay trabajos de bajo costo que pueden ejecutarse sin llamada y bajo qué excepción? | límite de trabajo autorizado | DTR-PREG |
| IDM-Q-011 | ¿Qué campos adicionales son obligatorios por tenant/sucursal y cuándo procede excepción? | recepción configurable | RMCA-PREG |
| IDM-Q-012 | ¿El apellido es obligatorio, configurable u opcional? | mínimo de persona | RMCA-PREG |
| IDM-Q-013 | ¿Qué evidencia inicial es obligatoria y cuándo bloquea diagnóstico? | recepción/evidencia | FSR/RMCA |
| IDM-Q-014 | ¿Qué significa técnico principal y se permiten varios simultáneos? | asignación/proyección | FOT-PREG |
| IDM-Q-015 | ¿QC exige una persona distinta y qué criterios mínimos registra? | segunda revisión | FOT-PREG |
| IDM-Q-016 | ¿Qué condición financiera exige la entrega y cuándo se admite excepción? | entrega/pagos | DQ-019; FOT |
| IDM-Q-017 | ¿Quién puede recoger y qué evidencia legitima a un tercero? | entrega y custodia | DQ-014; legacy RD |
| IDM-Q-018 | ¿Cómo se corrige una entrega, autorización o pago registrado erróneamente? | compensación y auditoría | FOT-PREG |
| IDM-Q-019 | ¿Qué alcance mínimo registra una iteración diagnóstica sin añadir fricción? | modelo técnico MVP | DTR-PREG |
| IDM-Q-020 | ¿Cómo se representa una pieza temporal de prueba frente a inventario? | técnico/inventario | DTR-PREG |

## Importantes antes de producción

| ID | Pregunta | Riesgo | Fuentes relacionadas |
|---|---|---|---|
| IDM-Q-021 | ¿Qué controles protegen PIN, sesiones y acciones sensibles? | suplantación | IAM/FOT |
| IDM-Q-022 | ¿Se capturan códigos de acceso del equipo; con qué consentimiento, acceso y eliminación? | secreto/privacidad | auditorías legacy |
| IDM-Q-023 | ¿Qué retención y permisos aplican a actividad, notas, fotos e identificaciones? | privacidad/auditoría | FSR/FOT/legacy |
| IDM-Q-024 | ¿Qué cambio de precio/alcance obliga nueva cotización y autorización? | trabajo no autorizado | RMCA/DTR |
| IDM-Q-025 | ¿Qué permisos rigen promociones, ajustes, devoluciones y anulaciones? | fraude/error | RMCA/FOT |
| IDM-Q-026 | ¿Cómo se detectan y resuelven doble cobro, doble entrega y reintentos? | integridad operacional | escenarios 19/25 |
| IDM-Q-027 | ¿Cómo se reconcilia ubicación física desactualizada o movimiento omitido? | pérdida de equipo | FOT |
| IDM-Q-028 | ¿Qué pruebas y evidencia exige una entrega frente al cliente? | disputa de custodia | FOT/legacy RD |
| IDM-Q-029 | ¿Cómo se conserva precio histórico, moneda, promoción y política aplicable? | explicación financiera | RMCA |
| IDM-Q-030 | ¿Qué tiempos/SLA requieren pendientes, autorización, QC y entrega? | abandono/operación | preguntas canónicas |

## Posteriores al MVP

| ID | Pregunta | Capacidad futura | Fuentes relacionadas |
|---|---|---|---|
| IDM-Q-031 | ¿Cómo funcionan garantía, cobertura, reclamo y relación con una nueva orden? | Garantías/posventa | DQ-021/022 |
| IDM-Q-032 | ¿Cómo se manejan cancelaciones, devoluciones y equipo abandonado? | posventa/legal | DQ-029/030 |
| IDM-Q-033 | ¿Cómo opera la salida temporal a proveedor externo y su cadena de custodia? | proveedores | DQ-017 |
| IDM-Q-034 | ¿Cómo se transfieren equipos, pagos y responsabilidad entre sucursales? | multisucursal | DQ-031 |
| IDM-Q-035 | ¿Cuándo se reserva, consume, devuelve o transfiere una refacción? | inventario | DQ-023 |
| IDM-Q-036 | ¿Cómo se tratan piezas aportadas por cliente y su garantía? | inventario/garantía | DQ-010/021 |
| IDM-Q-037 | ¿Cómo se integran impuestos, crédito, pagos parciales, caja y contabilidad? | finanzas | MONEY_MODEL |
| IDM-Q-038 | ¿Puede entregarse sin ticket, con INE o mediante otro comprobante? | entrega/legal | legacy RD |
| IDM-Q-039 | ¿Qué métricas, BI y retención histórica necesita cada rol? | Reportes/BI | arquitectura/observabilidad |
| IDM-Q-040 | ¿Qué canales, consentimiento y evidencia de notificación se requieren? | comunicación | Current State/FSR |

## Experimentales

| ID | Pregunta | Hipótesis a explorar |
|---|---|---|
| IDM-Q-041 | ¿Aporta valor clasificar necesidad obligatoria, recomendación y riesgo sin fricción? | prioridad técnica futura |
| IDM-Q-042 | ¿Una siguiente acción sugerida mejora operación sin convertirse en decisión automática? | proyección de workflow |
| IDM-Q-043 | ¿Qué señales permiten reconocer el mismo dispositivo entre órdenes sin afirmar propiedad? | identidad persistente |
| IDM-Q-044 | ¿Qué nivel de estructura de pruebas técnicas aporta valor frente a texto libre? | balance trazabilidad/fricción |

## Regla de cierre

Cerrar una pregunta requiere respuesta, autoridad, ejemplo, excepciones, impacto en decisiones/invariantes/políticas y actualización de trazabilidad. Una suposición técnica o comportamiento legacy no constituye respuesta.
