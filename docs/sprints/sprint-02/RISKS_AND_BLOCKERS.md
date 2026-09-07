# SPRINT-02 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active; PBI-025 In progress; WIP 1/1.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| PIN de baja entropía | Critical conocido | Argon2id, pepper externo, lock y rate limiting | In mitigation |
| Enumeración/lockout DoS | High | respuesta genérica, dummy path y scopes acotados | In mitigation |
| Session/identity bajo autoridad del frontend | Critical | contexto y Session server-side; cookies HttpOnly | Pending PBI-034 |
| Grant usado sin contexto | High | PBI-026 deny-by-default compone todos los predicados | Pending PBI-026 |
| Actor sintético persiste | High | PBI-028 + retrofit de una Operational Note | Pending |
| WIP paralelo | Medium | WIP=1 | Controlled |

Un Critical nuevo no previsto, criptografía custom, secreto remoto o cambio
destructivo obliga a detenerse. El Critical conocido de PBI-025 no se rebaja.

## Próxima revisión

- **Fecha:** al cambiar el threat model o alcanzar Owner Review de PBI-025.
- **Disparador:** nuevo riesgo material, cambio de controles o focused
  Critical-risk review del candidate exacto.
