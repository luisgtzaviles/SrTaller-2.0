# PBI-029 — Evidence

## Estado

**Candidato local en revisión; no integrado, no `Done`, no `Released`.**

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
| CI autoritativo | Pendiente de Draft PR y SHA final. |
| Merge / Owner Acceptance / release | No autorizado. |

## Límites

No contiene secretos reales, credenciales productivas, Vault/KMS, cambios de
deploy, infraestructura, PIN, sesión, Station Runtime ni un consumidor futuro
de los secretos reservados.

## Próxima revisión

Owner Review del PR Draft después de CI autoritativo GREEN sobre el SHA exacto.
