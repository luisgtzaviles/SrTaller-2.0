# SPRINT-02 — Operational Authentication & Authorization

## Estado del documento

- **Sprint:** SPRINT-02.
- **Estado:** Active.
- **Periodo:** TBD.
- **PBI actual:** PBI-028 — Minimum Business Audit and Correlation.
- **WIP:** 1/1.
- **Autoridad:** Identity Master Goal para la secuencia y decisión Owner de
  reanudación; PBI-028 tiene DoR PASS, riesgo High preservado y Owner Start
  propio. No se autoriza deploy o release.

## Objetivo

Convertir contexto e identidad persistentes en un flujo local visible de
autenticación, sesión, autorización contextual y atribución real de una
Operational Note, manteniendo límites tenant/Branch/Station y deny-by-default.

## Committed sequence

1. PBI-025 — PIN Credential Authentication.
2. PBI-034 — Operational Session y login/logout visible.
3. PBI-026 — Contextual Authorization.
4. PBI-028 — Minimum Business Audit and Correlation.
5. Operational Note como primera prueba integral con actor real.

Sólo un PBI puede estar en ejecución/cierre. El orden no inicia el siguiente
PBI antes de cerrar canónicamente el anterior.

## Criterios de salida

- [x] G3 Authentication PASS efectivo; cierre PBI-034 PR #34 + CI exacto GREEN.
- [x] G4 Authorization PASS efectivo; cierre PBI-026 PR #36 + CI exacto
  `34161029937` GREEN.
- [ ] G5 Audit PASS.
- [~] Login/logout/User switching visible y persistente en localhost; lógica
  funcional probada y walkthrough endurecido final pendiente de confirmación
  inmediata antes de introducir PIN.
- [x] Operational Note usa actor, Station, Session, Tenant, Branch y correlation
  reales en el candidato local; no “Operador sintético”.
- [~] PostgreSQL 18.4, arquitectura, Light/Dark, responsive, full verify y OCI
  local GREEN; CI autoritativo del candidate pendiente.
- [ ] Released: NO; deploy: NO.

## Próxima revisión

- **Fecha:** al completar el candidato PBI-028.
- **Disparador:** focused High-risk review, CI exacto o contradicción material.
