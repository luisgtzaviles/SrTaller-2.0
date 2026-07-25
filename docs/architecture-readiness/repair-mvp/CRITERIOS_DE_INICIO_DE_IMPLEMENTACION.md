# Criterios de inicio de implementación

## Gates consolidados

Los criterios de este documento se concretan, sin reemplazarlos, en los gates de [salida de R0](../blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md), [entrada de R1](../blocker-closure/CRITERIOS_DE_ENTRADA_DE_R1.md), [piloto](../blocker-closure/CRITERIOS_DE_PILOTO.md) y [producción](../blocker-closure/CRITERIOS_DE_PRODUCCION.md).

## Listo para diseñar

- [x] **[RDD]** Lenguaje, flujo e invariantes candidatos trazables.
- [x] **[DAP]** Fronteras, agregados, transacciones y rebanadas propuestos.
- [x] **[RP]** Responsable de Producto aprobó alcance, exclusiones y contrato de salida de R0 (`DEC-002`, `DEC-062`) el 2026-07-21.
- [ ] **[PB]** Alcances y preguntas de las rebanadas posteriores se validan antes de cruzar su gate.

**[DAR]** El proyecto está listo para continuar decisiones arquitectónicas, no para programar.

## Listo para programar

Todos los criterios deben cumplirse:

- [x] **[RP]** El alcance y contrato de salida de R0 están aprobados.
- [ ] **[RP]** El Responsable de Producto autoriza explícitamente el primer cambio de implementación de R0.
- [ ] **[RP]** Sprint 00 o el criterio de paso sucesor queda cerrado por su autoridad.
- [ ] **[ADR]** Las decisiones técnicas necesarias están aceptadas, no sólo propuestas.
- [x] **[ADR]** [DEC-051](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md)
  está `Accepted` desde el 2026-07-24 con cinco `PASS WITH CONDITIONS`.
  VC-024 cerró C01/C07/C09; C02–C06/C08/C10 permanecen `Pending`.
- [x] **[ADR]** [DEC-063](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md)
  está `Accepted with conditions` desde el 2026-07-24 con cinco
  `PASS WITH CONDITIONS`; C01/C03/C04 están `Satisfied` y C02/C05–C08
  permanecen `Pending`.
- [x] **[ADR]** [VC-024](../dec-004-linux-verification/vc-024/FORMAL_VERIFICATION.md)
  está `Closed / PASS`; H0 queda completo en 9/0.
- [x] **[ADR]** DEC-005 seleccionó y materializó estructura, ownership, imports y enforcement; la [sexta verificación formal](../dec-005-materialization/FORMAL_VERIFICATION_6.md) concluyó `PASS`, DEC-005 está `Accepted — Materialized / Formally Verified` y [PBI-022](../../backlog/pbis/PBI-022.md) está `Done`.
- [x] **[ADR]** DEC-049 está `Accepted`; Kysely + `pg`, repositorios
  explícitos, ownership, scopes y transacciones quedan aceptados, con
  DEC049-C01 a C08 pendientes para una materialización futura autorizada.
- [x] **[RDD]** Tenant, sucursal, sesión, actor y aislamiento mínimo están definidos conceptualmente por ADR-004/010/011.
- [x] **[RDD]** Roles, capacidades, combinación, alcance y autorización negativa están definidos conceptualmente por ADR-012.
- [x] **[RDD]** Sensibilidad, niveles, reautenticación, segundo aprobador, segregación e invalidación están definidos conceptualmente por ADR-013.
- [ ] **[PB]** Existe composición de roles/capacidades y clasificación nivel 1–4 para cada operación de la rebanada incluida.
- [ ] **[RP]** El modelo de amenazas inicial y la estrategia de secretos/ambientes están revisados.
- [ ] **[RP]** El PBI cumple Definition of Ready, aceptación y trazabilidad.
- [ ] **[DAR]** Frontera propietaria, agregado, transacción e idempotencia están explícitos.
- [x] **[RP]** Escenarios felices, negativos, de denegación y cross-tenant de R0 están aprobados.
- [ ] **[DAR]** Los escenarios aprobados están especificados como pruebas ejecutables; concurrencia se añade donde la invariante lo exija.
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

**[PB]** El estado sigue siendo **Preparado con bloqueantes**: alcance,
aceptación esperada de R0, plataforma y organización modular están
seleccionados, y la materialización de DEC-005 quedó formalmente verificada.
Faltan la evidencia final de DEC-004, autorización funcional, la
materialización aplicable de DEC-051/063 y los demás mecanismos,
composición/clasificación, modelos de amenazas, materialización y ejecución de
pruebas y gates H0/H1. Las aceptaciones de
[DEC-044](../../decisions/dec-044-error-strategy/FORMAL_REVIEW.md),
[DEC-049](../../decisions/dec-049-persistence-ownership/FORMAL_REVIEW.md) y
[DEC-063](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) no
autorizan programación funcional, materialización ni declaran R0 aceptado.
