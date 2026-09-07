# SPRINT-02 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active; PBI-025 Done candidate; WIP 0/1.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| PIN de baja entropía | Critical conocido | Argon2id, pepper externo, lock y rate limiting | Functional controls integrated; closure pending |
| Enumeración/lockout DoS | High | respuesta genérica, dummy path y scopes acotados | Functional controls integrated; closure pending |
| Desviación histórica de integración PR #30 | Critical delivery governance | preservar primer rojo y ratificación Owner acotada; ningún waiver general | Ratificada sólo para cierre PBI-025; PR #31 y CI main `34100056690` GREEN |
| Session/identity bajo autoridad del frontend | Critical | contexto y Session server-side; cookies HttpOnly | Pending PBI-034 |
| Grant usado sin contexto | High | PBI-026 deny-by-default compone todos los predicados | Pending PBI-026 |
| Actor sintético persiste | High | PBI-028 + retrofit de una Operational Note | Pending |
| WIP paralelo | Medium | WIP=1 | Controlled |

Un Critical nuevo no previsto, criptografía custom, secreto remoto o cambio
destructivo obliga a detenerse. El Critical conocido de PBI-025 no se rebaja.

## Próxima revisión

- **Fecha:** al cambiar el threat model o resolver el cierre documental.
- **Disparador:** nuevo riesgo material, cambio de controles o merge autorizado
  y CI exacto de `main` del cierre documental.
