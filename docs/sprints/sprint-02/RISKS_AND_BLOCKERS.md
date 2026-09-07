# SPRINT-02 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active; PBI-025/PBI-034 Done; PBI-026 In progress; WIP 1/1.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| PIN de baja entropía | Critical conocido | Argon2id, pepper externo, lock y rate limiting | Integrated; PBI-025 Done; riesgo preservado |
| Enumeración/lockout DoS | High | respuesta genérica, dummy path y scopes acotados | Integrated; PBI-025 Done |
| Desviación histórica de integración PR #30 | Critical delivery governance | preservar primer rojo y ratificación Owner acotada; ningún waiver general | Ratificada sólo para cierre PBI-025; PR #31 y CI main `34100056690` GREEN |
| Session/identity bajo autoridad del frontend | Critical | contexto y Session server-side; bearer opaco HttpOnly, CSRF/origin y revalidación | PBI-034 Done; G3 PASS |
| Bypass por composición modular | High | DEC-005 Option A sólo por aristas explícitas y contratos públicos; checker/mutations fail-closed | PBI-026 extiende sólo `repairs -> access` |
| Grant usado sin contexto | Critical | PBI-026 deny-by-default compone todos los predicados y resource scope | In progress PBI-026 |
| D5/D6 expuestos sin capability específica | High | matriz cerrada `DENY_UNSUPPORTED` y UI suprimida | In progress PBI-026 |
| Actor sintético persiste | High | PBI-028 + retrofit de una Operational Note | Pending |
| WIP paralelo | Medium | WIP=1 | Controlled |

Un Critical nuevo no previsto, criptografía custom, secreto remoto o cambio
destructivo obliga a detenerse. El Critical conocido de PBI-025 no se rebaja.

## Próxima revisión

- **Fecha:** al completar el candidato PBI-026 o cambiar su threat model.
- **Disparador:** nuevo riesgo material, cambio de controles, evidencia final o
  focused Critical-risk review.
