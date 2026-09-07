# SPRINT-02 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active; PBI-025 Done; PBI-034 In review candidate; WIP 1/1.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| PIN de baja entropía | Critical conocido | Argon2id, pepper externo, lock y rate limiting | Integrated; PBI-025 Done; riesgo preservado |
| Enumeración/lockout DoS | High | respuesta genérica, dummy path y scopes acotados | Integrated; PBI-025 Done |
| Desviación histórica de integración PR #30 | Critical delivery governance | preservar primer rojo y ratificación Owner acotada; ningún waiver general | Ratificada sólo para cierre PBI-025; PR #31 y CI main `34100056690` GREEN |
| Session/identity bajo autoridad del frontend | Critical | contexto y Session server-side; bearer opaco HttpOnly, CSRF/origin y revalidación | Materialized; local verification PASS; exact SHA/CI/review pending |
| Bypass por composición modular | High | DEC-005 Option A policy v4 sólo por aristas explícitas y contratos públicos; checker/mutations fail-closed | Materialized; checker/fixtures/mutations PASS local; exact SHA/CI/review pending |
| Grant usado sin contexto | High | PBI-026 deny-by-default compone todos los predicados | Pending PBI-026 |
| Actor sintético persiste | High | PBI-028 + retrofit de una Operational Note | Pending |
| WIP paralelo | Medium | WIP=1 | Controlled |

Un Critical nuevo no previsto, criptografía custom, secreto remoto o cambio
destructivo obliga a detenerse. El Critical conocido de PBI-025 no se rebaja.

## Próxima revisión

- **Fecha:** al cambiar el threat model o fijar el SHA/CI del candidato PBI-034.
- **Disparador:** nuevo riesgo material, cambio de controles, evidencia final o
  focused review.
