# SPRINT-02 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active; PBI-025 Done; PBI-034 Done candidate; WIP 0/1.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| PIN de baja entropía | Critical conocido | Argon2id, pepper externo, lock y rate limiting | Integrated; PBI-025 Done; riesgo preservado |
| Enumeración/lockout DoS | High | respuesta genérica, dummy path y scopes acotados | Integrated; PBI-025 Done |
| Desviación histórica de integración PR #30 | Critical delivery governance | preservar primer rojo y ratificación Owner acotada; ningún waiver general | Ratificada sólo para cierre PBI-025; PR #31 y CI main `34100056690` GREEN |
| Session/identity bajo autoridad del frontend | Critical | contexto y Session server-side; bearer opaco HttpOnly, CSRF/origin y revalidación | Integrated; exact candidate/main CI and review PASS; closure pending |
| Bypass por composición modular | High | DEC-005 Option A policy v4 sólo por aristas explícitas y contratos públicos; checker/mutations fail-closed | Integrated; checker/fixtures/mutations and exact CI PASS |
| Grant usado sin contexto | High | PBI-026 deny-by-default compone todos los predicados | Pending PBI-026 |
| Actor sintético persiste | High | PBI-028 + retrofit de una Operational Note | Pending |
| WIP paralelo | Medium | WIP=1 | Controlled |

Un Critical nuevo no previsto, criptografía custom, secreto remoto o cambio
destructivo obliga a detenerse. El Critical conocido de PBI-025 no se rebaja.

## Próxima revisión

- **Fecha:** al integrar el cierre PBI-034 o cambiar su threat model.
- **Disparador:** nuevo riesgo material, cambio de controles, evidencia final o
  focused review.
