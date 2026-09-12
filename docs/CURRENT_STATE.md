# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** implementación PBI-043 autorizada y en curso.
- **Baseline Git verificada:** `main == origin/main` en
  `9ed688566430d12fc52b6d48cdffdea3aba8ef62` al iniciar la implementación.
- **CI exacta de baseline:**
  [`34725827409`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34725827409),
  `SUCCESS` sobre `9ed6885`.
- **Sprint activo:** SPRINT-02 — Operational Authentication & Authorization,
  extendido sólo para la remediación Access.
- **PBI actual:** [PBI-043](backlog/pbis/PBI-043.md) — `In progress`; start Owner
  autorizado.
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

[PBI-043](backlog/pbis/PBI-043.md) materializará la decisión como un objetivo
Access independiente. Tiene [DoR PASS](quality/evidence/pbi-043/DEFINITION_OF_READY.md),
[Threat Model Critical](quality/evidence/pbi-043/THREAT_MODEL.md) y una
[matriz de 24 pruebas](quality/evidence/pbi-043/TEST_STRATEGY.md). `Ready` no
autoriza su implementación.

## Capacidades integradas relevantes

- Trusted Station Context, Users, Roles/capabilities, PIN y Operational Session
  con autorización contextual server-side.
- Runtime actual todavía limitado a una Session activa por Station hasta que
  PBI-043 sea implementado, integrado y validado.
- Customer mínimo, New Repair y Repair Detail PBI-039 integrados y validados.
- Auditoría de negocio acotada conserva Tenant, Branch, Station, User,
  SessionId y correlation en los writes cubiertos.

## Decisión y delta pendientes de materialización

| Área | Estado |
|---|---|
| ADR-014 | Accepted; no implementación |
| Admission concurrente | Diseñada; pendiente |
| Switch session-local | Diseñado; pendiente |
| Drop unique parcial / índices | Diseñados; no existe migration |
| Revocación efectiva N-session | Contrato definido; pendiente |
| Cookies/CSRF/PIN/timeout | Sin cambio aprobado |
| Browser Owner + QA | Caso de aceptación definido; no ejecutado |
| Device/Session Admin | Fuera de alcance |
| Global Access lifecycle audit | Fuera de alcance |

## Roadmap y WIP

| Elemento | Estado vigente |
|---|---|
| Sprint activo | SPRINT-02 — remediation Access |
| Current PBI | PBI-043 — In progress |
| WIP | 1/1 |
| PBI-040 | congelado; no integrado |
| G3 Authentication | PASS histórico; policy delta PBI-043 pendiente |
| Preview | sin cambios de este Goal |
| Production / release | NO / NO |

## Próxima acción

Implementar y verificar PBI-043 en la única rama `fix/*` creada desde
`9ed6885`. Merge, CI exacta y Preview conservan evidencia separada. Sólo
después del cierre se deja el handoff de PBI-040 congelado desde el nuevo
`main`.
