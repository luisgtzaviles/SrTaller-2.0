# Criterios de inicio de implementación

## Gates consolidados

Los criterios de este documento se concretan, sin reemplazarlos, en los gates de [salida de R0](../blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md), [entrada de R1](../blocker-closure/CRITERIOS_DE_ENTRADA_DE_R1.md), [piloto](../blocker-closure/CRITERIOS_DE_PILOTO.md) y [producción](../blocker-closure/CRITERIOS_DE_PRODUCCION.md).

## Listo para diseñar

- [x] **[RDD]** Lenguaje, flujo e invariantes candidatos trazables.
- [x] **[DAP]** Fronteras, agregados, transacciones y rebanadas propuestos.
- [ ] **[PB]** Responsable de Producto valida alcance, términos y preguntas pendientes.

**[DAR]** El proyecto está listo para continuar decisiones arquitectónicas, no para programar.

## Listo para programar

Todos los criterios deben cumplirse:

- [ ] **[RP]** El Responsable de Producto autoriza explícitamente el alcance y la rebanada.
- [ ] **[RP]** Sprint 00 o el criterio de paso sucesor queda cerrado por su autoridad.
- [ ] **[ADR]** Las decisiones técnicas necesarias están aceptadas, no sólo propuestas.
- [x] **[RDD]** Tenant, sucursal, sesión, actor y aislamiento mínimo están definidos conceptualmente por ADR-004/010/011.
- [x] **[RDD]** Roles, capacidades, combinación, alcance y autorización negativa están definidos conceptualmente por ADR-012.
- [ ] **[PB]** Existe composición preliminar de roles/capacidades y catálogo de acciones sensibles para la rebanada incluida.
- [ ] **[RP]** El modelo de amenazas inicial y la estrategia de secretos/ambientes están revisados.
- [ ] **[RP]** El PBI cumple Definition of Ready, aceptación y trazabilidad.
- [ ] **[DAR]** Frontera propietaria, agregado, transacción e idempotencia están explícitos.
- [ ] **[DAR]** Existen escenarios felices, negativos, concurrentes y entre tenants.
- [ ] **[DAR]** No se introduce capacidad fuera del MVP sin cambio de alcance aprobado.

## Listo para la primera rebanada

Además:

- [ ] **[PB]** Datos mínimos de recepción y alcance de folio acordados.
- [ ] **[PB]** Política/configuración mínima y su precedencia acordadas.
- [ ] **[DAR]** Creación de orden e inicio de custodia forman una operación coherente.
- [ ] **[DAR]** Consulta y línea temporal no se vuelven fuentes autoritativas.
- [ ] **[RP]** Evidencia de QA y seguridad requerida está definida antes de implementar.

## Listo para implementación completa del MVP

**[PB]** Deben estar cerrados estados/transiciones, autorización versionada, ejecución, QC, movimientos/reversos, condición de entrega y evidencia de tercero, además de los criterios de paso a producción.

## Listo para pilotear

- [ ] **[RP]** R1 a R5 integradas con variantes esenciales y datos controlados.
- [ ] **[RP]** Aislamiento, permisos, concurrencia, archivos y auditoría probados.
- [ ] **[RP]** Operación, soporte, recuperación y criterios de salida del piloto definidos.
- [ ] **[RP]** Riesgos del piloto aceptados por autoridad competente.

## Listo para producción

- [ ] **[RP]** Seguridad, privacidad, copias/restauración y revocación cerradas.
- [ ] **[RP]** SLOs, carga, límites de archivos, observabilidad, alertas y procedimientos validados.
- [ ] **[RP]** Migración, despliegue y reversión aprobados fuera de este paquete.
- [ ] **[RP]** Riesgos críticos/altos mitigados o aceptados explícitamente.

## Resultado actual

**[PB]** El estado sigue siendo **Preparado con bloqueantes**: existen ADRs aceptados, pero faltan autorización organizacional, plataforma, mecanismos, composición por rebanada, acciones sensibles, modelos de amenazas, pruebas y decisiones propias de la rebanada. Una casilla conceptual cerrada no autoriza programación.
