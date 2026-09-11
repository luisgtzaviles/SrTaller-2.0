# SPRINT-02 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active; PBI-025/PBI-034/PBI-026/PBI-028/PBI-038 Done; PBI-039
  `Done candidate`; WIP 0/1; revisión, integración, CI exacta de `main` y
  validación Preview PASS; cierre documental pendiente.

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
| Integración de slice local grande | High delivery | freeze explícito, fingerprint pre/post y secuencia UI Verification -> hardening -> full verify -> CI -> review | Cerrado; PR #42 integrado y CI exacta verde |
| Orquestación local incompleta | High test infrastructure | `verify:full` fail-fast combina base, PostgreSQL, Preview, smoke, cleanup y evidencia | Cerrado; Full Verification PASS |
| CI omite dos tests PostgreSQL PBI-039 | High delivery | Customer phone y User preferences en ambos legs y comparison | Cerrado; run `34564110272` PASS |
| Create Repair omite identidad canónica del tipo en idempotencia | High persistence | incluir `canonicalDeviceTypeId`; replay exacto, incompatibilidad y concurrencia PostgreSQL; full reverify + CI exacta | Remediado; Full Verification de riesgo alto y run `34567516069` attempt 3 PASS |
| Documentación viva contradice gate PBI-039 | Medium governance | reconciliar Roadmap, workflow, Sprint, PBI, checklist y current state | Cerrado; cierre canónico reconciliado |
| Entrypoint SPA obsoleto tras deploy | High runtime | `no-store`, ETag por contenido y recuperación de navegador con asset actual | Cerrado en PR #43; Preview validado |
| Repairs sin repositorios en imagen Production-mode | High runtime | conexión compartida `APPLICATION_DATABASE_CONNECTION` y contrato de composición | Cerrado en PR #44; Full Verification, exact-main CI y create/detail/reload PASS |

Un Critical nuevo no previsto, criptografía custom, secreto remoto o cambio
destructivo obliga a detenerse. El Critical conocido de PBI-025 no se rebaja.

## Próxima revisión

- **Fecha:** al integrar el cierre documental de PBI-039.
- **Disparador:** nuevo riesgo material, fallo de CI exacta o cambio de controles.
