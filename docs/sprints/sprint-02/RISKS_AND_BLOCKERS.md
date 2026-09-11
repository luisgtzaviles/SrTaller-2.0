# SPRINT-02 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active; PBI-025/PBI-034/PBI-026/PBI-028/PBI-038 Done; Current
  PBI PBI-039; WIP 1/1; Functional Slice Frozen / Owner Accepted; UI
  Verification, Hardening, Full Verification, CI / PR Readiness y PR CI PASS;
  independent review CHANGES REQUIRED; remediation in progress.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| PIN de baja entropía | Critical conocido | Argon2id, pepper externo, lock y rate limiting | Integrated; PBI-025 Done; riesgo preservado |
| Enumeración/lockout DoS | High | respuesta genérica, dummy path y scopes acotados | Integrated; PBI-025 Done |
| Desviación histórica de integración PR #30 | Critical delivery governance | preservar primer rojo y ratificación Owner acotada; ningún waiver general | Ratificada sólo para cierre PBI-025; PR #31 y CI main `34100056690` GREEN |
| Session/identity bajo autoridad del frontend | Critical | contexto y Session server-side; bearer opaco HttpOnly, CSRF/origin y revalidación | PBI-034 Done; G3 PASS |
| Bypass por composición modular | High | DEC-005 Option A sólo por aristas explícitas y contratos públicos; checker/mutations fail-closed | Control verificado; PBI-026 agrega sólo `repairs -> access` |
| Grant usado sin contexto | Critical | PBI-026 deny-by-default compone todos los predicados y resource scope | Control verificado; PBI-026 Done; G4 PASS |
| D5/D6 expuestos sin capability específica | High | matriz cerrada `DENY_UNSUPPORTED` y UI suprimida | Control verificado; PBI-026 Done |
| Actor sintético persiste fuera de la primera prueba | High | PBI-028 entrega Operational Note; retrofit restante continúa diferido | Control PBI-028 PASS; no ampliar este alcance |
| Auditoría diverge del efecto | High | misma transacción; fallo obligatorio revierte la nota | Control PBI-028 PASS |
| Secretos o body en el store de auditoría de Repairs | High | esquema/allowlist fija y pruebas negativas | Control PBI-028 PASS |
| Fronteras de fecha local incorrectas | Medium | IANA Branch, rangos `[start, next)` y PostgreSQL material | Control PBI-038 PASS; `Branch.timeZone` final `America/Hermosillo` |
| WIP paralelo | Medium | WIP=1 | Controlled |
| Integración de slice local grande | High delivery | freeze explícito, fingerprint pre/post y secuencia UI Verification -> hardening -> full verify -> CI -> review | Control ejecutado; PR #42 sigue sin merge |
| Orquestación local incompleta | High test infrastructure | `verify:full` fail-fast combina base, PostgreSQL, Preview, smoke, cleanup y evidencia | Cerrado; Full Verification PASS |
| CI omite dos tests PostgreSQL PBI-039 | High delivery | Customer phone y User preferences en ambos legs y comparison | Cerrado; run `34564110272` PASS |
| Create Repair omite identidad canónica del tipo en idempotencia | High persistence | incluir `canonicalDeviceTypeId`; replay exacto, incompatibilidad y concurrencia PostgreSQL; full reverify + CI exacta | Finding de review en remediación; bloquea re-review |
| Documentación viva contradice gate PBI-039 | Medium governance | reconciliar Roadmap, workflow, Sprint, PBI, checklist y current state | Finding de review en remediación |

Un Critical nuevo no previsto, criptografía custom, secreto remoto o cambio
destructivo obliga a detenerse. El Critical conocido de PBI-025 no se rebaja.

## Próxima revisión

- **Fecha:** al concluir la remediación y re-review de PBI-039.
- **Disparador:** nuevo riesgo material, fallo de reverificación/CI o cambio de controles.
