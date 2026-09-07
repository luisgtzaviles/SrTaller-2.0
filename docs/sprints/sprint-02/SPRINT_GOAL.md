# SPRINT-02 — Operational Authentication & Authorization

## Estado del documento

- **Sprint:** SPRINT-02.
- **Estado:** Active.
- **Periodo:** TBD.
- **PBI actual:** PBI-025 — PIN Credential Authentication; In review.
- **WIP:** 1/1.
- **Autoridad:** Identity Master Goal para la secuencia; Part D autoriza el
  slice actual PBI-025. Cada PBI posterior conserva DoR y Owner Start
  Authorization propios; no se autoriza deploy o release.

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

- [ ] G3 Authentication PASS.
- [ ] G4 Authorization PASS.
- [ ] G5 Audit PASS.
- [ ] Login/logout/User switching visible y persistente en localhost.
- [ ] Operational Note usa actor, Station, Session, Tenant, Branch y correlation
  reales; no “Operador sintético”.
- [ ] PostgreSQL, CI, arquitectura, Light/Dark y responsive básicos GREEN.
- [ ] Released: NO; deploy: NO.

## Próxima revisión

- **Fecha:** al completar la remediación Critical de CI de PBI-025.
- **Disparador:** focused review del candidate final y CI autoritativo
  first-attempt GREEN del HEAD exacto de PR #31; Linux x64 5x ya está PASS, o
  una contradicción material anterior.
