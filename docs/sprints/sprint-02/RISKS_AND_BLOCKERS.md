# SPRINT-02 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active; PBI-025/PBI-034/PBI-026 Done; PBI-028 In progress; WIP 1/1.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| PIN de baja entropía | Critical conocido | Argon2id, pepper externo, lock y rate limiting | Integrated; PBI-025 Done; riesgo preservado |
| Enumeración/lockout DoS | High | respuesta genérica, dummy path y scopes acotados | Integrated; PBI-025 Done |
| Desviación histórica de integración PR #30 | Critical delivery governance | preservar primer rojo y ratificación Owner acotada; ningún waiver general | Ratificada sólo para cierre PBI-025; PR #31 y CI main `34100056690` GREEN |
| Session/identity bajo autoridad del frontend | Critical | contexto y Session server-side; bearer opaco HttpOnly, CSRF/origin y revalidación | PBI-034 Done; G3 PASS |
| Bypass por composición modular | High | DEC-005 Option A sólo por aristas explícitas y contratos públicos; checker/mutations fail-closed | Control verificado; PBI-026 agrega sólo `repairs -> access` |
| Grant usado sin contexto | Critical | PBI-026 deny-by-default compone todos los predicados y resource scope | Control verificado; PBI-026 Done; G4 PASS |
| D5/D6 expuestos sin capability específica | High | matriz cerrada `DENY_UNSUPPORTED` y UI suprimida | Control verificado; PBI-026 Done |
| Actor sintético persiste | High | PBI-028 + retrofit exclusivo de una Operational Note | In progress; riesgo preservado |
| Auditoría diverge del efecto | High | misma transacción; fallo obligatorio revierte la nota | Control requerido por PBI-028 |
| Secretos o body en el store de auditoría de Repairs | High | esquema/allowlist fija y pruebas negativas | Control requerido por PBI-028 |
| WIP paralelo | Medium | WIP=1 | Controlled |

Un Critical nuevo no previsto, criptografía custom, secreto remoto o cambio
destructivo obliga a detenerse. El Critical conocido de PBI-025 no se rebaja.

## Próxima revisión

- **Fecha:** al completar el candidato PBI-028 o cambiar su threat model.
- **Disparador:** nuevo riesgo material, cambio de controles, focused review o
  CI del candidato.
