# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** readiness de PBI-043 preparado sobre la última baseline integrada.
- **Baseline Git verificada:** `main == origin/main` en
  `40684d7554cdf02551f941e5e3f0beabbe563125` al iniciar el Goal.
- **CI exacta de baseline:**
  [`34623060504`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34623060504),
  `SUCCESS` sobre `40684d7`.
- **Sprint activo:** SPRINT-02 — Operational Authentication & Authorization,
  extendido sólo para la remediación Access.
- **PBI actual:** [PBI-043](backlog/pbis/PBI-043.md) — `Ready`; start Owner no
  autorizado.
- **WIP:** `0/1`; no existe implementación PBI-043 en curso.
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
| Current PBI | PBI-043 — Ready, no iniciado |
| WIP | 0/1 |
| PBI-040 | congelado; no integrado |
| G3 Authentication | PASS histórico; policy delta PBI-043 pendiente |
| Preview | sin cambios de este Goal |
| Production / release | NO / NO |

## Próxima acción

Owner decide si autoriza implementar PBI-043. Si autoriza, debe partir de un
`main` actualizado en una rama `fix/*` nueva; la rama documental no se
reutiliza. Merge, CI exacta, Preview y Owner Acceptance conservan gates
separados. Sólo después se reconcilia PBI-040 desde el nuevo `main`.
