# SPRINT-02 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active; PBI-025 In review; WIP 1/1.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| PIN de baja entropía | Critical conocido | Argon2id, pepper externo, lock y rate limiting | Functional controls integrated; closure pending |
| Enumeración/lockout DoS | High | respuesta genérica, dummy path y scopes acotados | Functional controls integrated; closure pending |
| Gate PostgreSQL Critical no reproducible en CI candidato | Critical delivery gate | preservar primer rojo, runner diagnóstico fail-closed, `--no-maglev` acotado, Linux 5x y CI first-attempt | Linux 5x / focused technical review PASS; final-candidate review and CI pending in PR #31 |
| Session/identity bajo autoridad del frontend | Critical | contexto y Session server-side; cookies HttpOnly | Pending PBI-034 |
| Grant usado sin contexto | High | PBI-026 deny-by-default compone todos los predicados | Pending PBI-026 |
| Actor sintético persiste | High | PBI-028 + retrofit de una Operational Note | Pending |
| WIP paralelo | Medium | WIP=1 | Controlled |

Un Critical nuevo no previsto, criptografía custom, secreto remoto o cambio
destructivo obliga a detenerse. El Critical conocido de PBI-025 no se rebaja.

## Próxima revisión

- **Fecha:** al cambiar el threat model o completar PR #31.
- **Disparador:** nuevo riesgo material, cambio de controles o focused review
  y CI first-attempt exacto de la remediación.
