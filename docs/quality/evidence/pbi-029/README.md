# PBI-029 — Evidence

## Estado

**PBI-029 `Done`: PR funcional, Owner Acceptance, cierre documental integrado
y CI post-cierre de `main` GREEN. `Released: NO`.**

## Alcance verificable

- catálogo de configuración server-only, sin valores sensibles versionados;
- carga explícita de secretos requeridos desde variables de proceso;
- fallo cerrado por ausencia, vacío, formato inválido o requisito duplicado;
- redacción en JSON e inspección; diagnósticos sin valores;
- frontera de bundle/repo para impedir secretos `VITE_*` o archivos `.env`
  utilizables versionados;
- compatibilidad con el contrato de persistencia y desarrollo local existente.

## Evidencia prevista del candidato

| Comprobación | Estado |
|---|---|
| Threat model y DoR | PASS — [Threat model](./THREAT_MODEL.md) y PBI-029. |
| Typecheck / build | PASS local — Node 24.18.0 / pnpm 11.15.1. |
| Negative tests / redaction / client boundary | PASS local — requisitos ausentes/malformados, redacción y policy de bundle/repo. |
| Local PostgreSQL / compatibility | PASS local — PostgreSQL 18.4, migración, seed y runtime Preview DB. |
| `pnpm run verify` | PASS local — 442 PASS, 0 FAIL, 11 skips gobernados. |
| OCI runtime / artifact boundary | PASS local — root read-only, usuario no-root, sin `.env`, migración y readiness GREEN. |
| Focused security review | PASS — findings abiertos BLOCKER/HIGH/MEDIUM/LOW: 0. |
| Merge funcional | PASS — PR #21 integrado mediante `36d93736d46b69acadadd95ef66809332fbb5bd4`. |
| CI autoritativo de `main` | PASS — run `33974100385`; `run-1`, `run-2` y `comparison` GREEN sobre el merge SHA exacto. |
| Critical Risk Owner Authorization | ACCEPTED — la clasificación `CRITICAL` se conserva. |
| Owner Acceptance | APPROVED — PBI-029 aceptado funcionalmente; `Released: NO`. |
| Cierre documental | PASS — PR #22 merge `41914c78724303d66136989937cf8f38e4ea8a88`; CI post-cierre `33988752597` GREEN. |

## Límites

No contiene secretos reales, credenciales productivas, secret manager,
rotación automatizada, cambios de deploy, infraestructura, PIN, sesión,
autenticación, Station Runtime ni distribución remota de secretos.

## Próxima revisión

PBI-024 requiere DoR y autorización Owner independientes. El
[cierre canónico](./CLOSURE_CANDIDATE.md) conserva la evidencia completa de
PBI-029 `Done`.
