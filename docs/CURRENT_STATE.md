# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** candidato PBI-043 completo y verificado localmente; integración en
  curso.
- **Baseline Git verificada:** `main == origin/main` en
  `9ed688566430d12fc52b6d48cdffdea3aba8ef62` al iniciar la implementación.
- **CI exacta de baseline:**
  [`34725827409`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34725827409),
  `SUCCESS` sobre `9ed6885`.
- **Sprint activo:** SPRINT-02 — Operational Authentication & Authorization,
  extendido sólo para la remediación Access.
- **PBI actual:** [PBI-043](backlog/pbis/PBI-043.md) — `In review`; revisión,
  CI, merge y Preview pendientes.
- **WIP:** `1/1` en `fix/pbi-043-concurrent-operational-sessions`.
- **PBI-040:** Owner Review congelado en
  `feature/pbi-040-catalog-pricing-core`; no integrado ni modificado por este
  Goal.
- **Preview:** continúa en la baseline PBI-039 previamente validada; no se
  desplegó este trabajo documental.
- **Production:** no desplegada ni autorizada.

## Resumen ejecutivo

PBI-039 está `Done` efectivo: PR #45 integró el cierre documental como
`40684d7` y la CI exacta `34623060504` pasó run-1, run-2 y comparison. El ciclo
Price List comenzó después en una rama no integrada y permanece congelado.

Durante su Owner Review se confirmó una fricción preexistente de Access: la
regla PBI-034 de una Session activa por Station rechaza otro perfil con PIN
válido. La auditoría ubicó la causa en ADR-011, el unique parcial
`(tenant_id, station_id) WHERE active`, el guard station-wide y
`createReplacingActive`.

El Product Owner aprobó ASC-001 a ASC-008. [ADR-014](decisions/proposed/ADR-014-concurrent-operational-sessions.md)
sustituye sólo la exclusividad y reemplazo station-wide de ADR-011. La nueva
política permite cero o más Sessions por Station; cada request conserva una
Session solicitante ligada a Tenant, Branch, Station, StationCredential, User
y SessionId. Cookies, CSRF, autorización, rate limit, idle 60 minutos y
absolute 12 horas permanecen.

[PBI-043](backlog/pbis/PBI-043.md) materializa la decisión como un objetivo
Access independiente. Tiene [DoR PASS](quality/evidence/pbi-043/DEFINITION_OF_READY.md),
[Threat Model Critical](quality/evidence/pbi-043/THREAT_MODEL.md) y una
[matriz de 24 pruebas](quality/evidence/pbi-043/TEST_STRATEGY.md) ejecutada
localmente. El candidato permite N Sessions por Station y conserva switch/
logout por Session exacta; todavía no está integrado ni desplegado.

## Capacidades integradas relevantes

- Trusted Station Context, Users, Roles/capabilities, PIN y Operational Session
  con autorización contextual server-side.
- El candidato local PBI-043 permite Sessions concurrentes por Station; `main`
  y Preview conservan la exclusividad histórica hasta la integración.
- Customer mínimo, New Repair y Repair Detail PBI-039 integrados y validados.
- Auditoría de negocio acotada conserva Tenant, Branch, Station, User,
  SessionId y correlation en los writes cubiertos.

## Estado del delta PBI-043

| Área | Estado |
|---|---|
| ADR-014 | Accepted; materializada en candidato |
| Admission concurrente | PASS local Application/HTTP/PostgreSQL/Chrome |
| Switch session-local | PASS local; reemplazo exacto |
| Drop unique parcial / índices | migración fresh/existing/down/reapply PASS |
| Revocación efectiva N-session | contratos internos y PostgreSQL PASS |
| Cookies/CSRF/PIN/timeout | Sin cambio aprobado |
| Browser Owner + QA | PASS local; misma Station, perfiles y Users distintos |
| Device/Session Admin | Fuera de alcance |
| Global Access lifecycle audit | Fuera de alcance |

## Roadmap y WIP

| Elemento | Estado vigente |
|---|---|
| Sprint activo | SPRINT-02 — remediation Access |
| Current PBI | PBI-043 — In review |
| WIP | 1/1 |
| PBI-040 | congelado; no integrado |
| G3 Authentication | PASS histórico; policy delta PBI-043 pendiente |
| Preview | sin cambios de este Goal |
| Production / release | NO / NO |

## Próxima acción

Completar `verify:full`, revisión independiente y CI del candidato PBI-043.
Sólo con merge, exact-main y Preview validados se prepara su cierre documental;
PBI-040 permanece congelado y se reconciliará después desde el nuevo `main`.
