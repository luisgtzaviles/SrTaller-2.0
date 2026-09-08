# SPRINT-02 — Operational Authentication & Authorization

## Estado del documento

- **Sprint:** SPRINT-02.
- **Estado:** Active.
- **Periodo:** TBD.
- **PBI actual:** `NONE`.
- **WIP:** 0/1.
- **Autoridad:** PBI-038 cerró por PR #40 y CI exacta de `main`; un PBI nuevo
  requiere selección, readiness y autorización Owner. No existe autorización
  de release o deploy.

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
- [x] G5 Audit PASS — PR #39 merge `2b712fc3a3842f197324e8870011bf170846ddb8`
  y CI exacta `34249869167` GREEN.
- [x] Login/logout/User switching visible y persistente en localhost; lógica
  funcional y walkthrough endurecido final probados con identidades sintéticas.
- [x] Operational Note usa actor, Station, Session, Tenant, Branch y correlation
  reales en el candidato local; no “Operador sintético”.
- [x] PostgreSQL 18.4, arquitectura, Light/Dark, responsive, full verify, OCI,
  browser proof, focused review y CI de PR #37/PR #38 GREEN.
- [x] PBI-038 — Timezone Foundation Integration and Hardening: PR #40 merge
  `5973f355a5e9dfc7ae562a688ded04e7eba8bc34` y CI exacta `34280510716` GREEN;
  `Done`, sin release ni deploy.
- [x] Current PBI `NONE`, WIP `0/1` y Next candidate `NONE`.
- [ ] Released: NO; deploy: NO.

## Próxima revisión

- **Fecha:** al seleccionarse un nuevo PBI.
- **Disparador:** nueva autorización Owner o contradicción material.
