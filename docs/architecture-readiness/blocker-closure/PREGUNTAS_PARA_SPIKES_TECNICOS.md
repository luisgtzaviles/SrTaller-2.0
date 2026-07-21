# Preguntas para spikes técnicos

## Regla

Esta lista no autoriza prototipos, código, infraestructura ni acceso a datos reales. Un spike necesita PBI propio, ambiente aislado, timebox cualitativo, criterio de salida y destrucción o archivo explícito del resultado. Su objetivo es producir evidencia, no elegir una tecnología por demostración.

| Spike candidato | Pregunta empírica | Prerrequisitos | Evidencia de salida | Decisiones | Hito |
| --- | --- | --- | --- | --- | --- |
| SPIKE-BC-001 | ¿La opción shared-schema candidata garantiza aislamiento bajo consultas ordinarias, joins, jobs y fallos de contexto? | Matriz de datos y alternativas multitenant | Pruebas positivas/negativas, modos de fallo y costo de enforcement | DEC-006 a DEC-009 | H1 |
| SPIKE-BC-002 | ¿RLS añade una defensa útil y operable sin ocultar errores ni impedir migraciones/soporte? | SPIKE-BC-001 y RLS aún candidato | Matriz con/sin RLS, bypasses, conexiones y operación | DEC-006, DEC-050 | H1 |
| SPIKE-BC-003 | ¿Puede resolverse tenant/sucursal desde fuentes confiables y rechazarse toda ausencia, conflicto o manipulación? | Reglas PO-003 a PO-010 | Casos de acceso, cambio, job y mensaje interno | DEC-009 a DEC-012 | H1 |
| SPIKE-BC-004 | ¿El modelo de PIN/estación compartida mantiene atribución, revocación e inactividad bajo concurrencia realista? | Propósito y límites de PIN aprobados | Threat scenarios, prototipo desechable y resultados de revocación | DEC-014 a DEC-016, DEC-020 | H1 |
| SPIKE-BC-005 | ¿La estrategia de pruebas detecta una consulta sin tenant o una autorización aplicada sólo en UI? | Stack y ownership propuestos | Mutaciones/fallos sembrados capturados por gates | DEC-018, DEC-051, DEC-052 | H0/H1 |
| SPIKE-BC-006 | ¿La reserva de folio resiste concurrencia, reintento, rollback y múltiples instancias en el alcance elegido? | Alcance/unicidad aprobados | Prueba concurrente, colisiones, huecos y recuperación | DEC-021 a DEC-025 | H2 |
| SPIKE-BC-007 | ¿El modelo temporal conserva el instante y presenta correctamente cambios de zona y horario aplicables? | Autoridad de zona aprobada | Casos límite reproducibles y estrategia de almacenamiento | DEC-037, DEC-038 | H1 |
| SPIKE-BC-008 | ¿El puerto de archivos mantiene aislamiento, integridad, límites y eliminación con la opción candidata? | Clasificación y evidencias mínimas aprobadas | Carga/lectura no autorizada, checksum, límites y borrado | DEC-039, DEC-040, DEC-057 | H2/H3 |
| SPIKE-BC-009 | ¿Una sesión compartida entre superficies conserva revocación, alcance y seguridad sin acoplar clientes? | Modelo de identidad/sesión aprobado | Flujos de inicio, revocación, expiración y contexto | DEC-013 a DEC-015 | H1 |
| SPIKE-BC-010 | ¿Las reglas automáticas de arquitectura detectan ciclos, imports prohibidos y acceso transversal? | Estructura inicial acordada | Ejemplos inválidos rechazados en pipeline | DEC-005, DEC-049, DEC-051 | H0 |
| SPIKE-BC-011 | ¿Backup y restore recuperan un tenant/sucursal sin mezclar datos ni perder archivos? | Persistencia/archivos definidos y ambiente autorizado | Restore aislado, tiempos observados y reconciliación | DEC-053, DEC-054 | H3 |
| SPIKE-BC-012 | ¿Correlation ID, logs, auditoría y métricas reconstruyen un recorrido sin filtrar secretos? | Campos permitidos y recorrido elegido | Trazado end-to-end, redacción y alertas | DEC-045 a DEC-048, DEC-055 | H1 |
| SPIKE-BC-013 | ¿Los mecanismos de idempotencia evitan efectos dobles tras timeout/reintento en creación y entrega? | Contratos de casos de uso definidos | Pruebas de repetición, carrera y respuesta consistente | DEC-025, DEC-031 | H2/H3 |
| SPIKE-BC-014 | ¿Los datos heredados necesarios pueden mapearse y reconciliarse sin dos fuentes de verdad? | Estrategia de coexistencia propuesta y acceso autorizado | Perfil agregado/sanitizado, anomalías y criterio de corte | DEC-059, DEC-060 | H3 |

## Criterios para no ejecutar un spike

- la pregunta puede resolverse con una decisión de Producto;
- no se han reducido las alternativas;
- no existe criterio binario o evidencia observable;
- requiere datos productivos o cambios remotos sin autorización;
- produciría código que el equipo pretende conservar por inercia;
- sólo compara preferencias de herramientas sin riesgo arquitectónico.
