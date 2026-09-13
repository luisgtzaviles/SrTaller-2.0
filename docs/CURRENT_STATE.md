# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** PBI-043 integrado y validado en Preview; cierre documental en
  curso.
- **Baseline Git verificada:** `main == origin/main` en
  `aab27d98db94d850c580f0cac594c1a62c00cc51`.
- **CI exacta de baseline:**
  [`34730090448`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34730090448),
  `SUCCESS` sobre `aab27d9` con run-1, run-2 y comparison PASS.
- **Sprint:** SPRINT-02 — `Closed candidate`; su cierre efectivo depende de
  integrar este PR documental y obtener CI exacta verde.
- **PBI actual:** `NONE`; [PBI-043](backlog/pbis/PBI-043.md) es
  `Done candidate` bajo la misma condición documental.
- **WIP:** `0/1` funcional; sólo cierre documental activo.
- **PBI-040:** Owner Review congelado en
  `feature/pbi-040-catalog-pricing-core`; no integrado ni modificado por este
  Goal.
- **Preview:** `aab27d9` desplegado y validado; concurrencia de Sessions PASS.
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
logout por Session exacta. Una primera revisión Critical detectó debilidad en
los oráculos de concurrencia y sobredeclaración de evidencia; el candidato fue
remediado con locks PostgreSQL observables, revocación N-session, cruces
lockout/CSRF/atribución materiales y un runner Chrome endurecido. La revisión
independiente final de `65cf2da` cerró PASS sin hallazgos Critical/High/Medium;
`verify:full` de 12 etapas y PostgreSQL owner-scoped 2× MATCH también pasaron.
PR #47 integró el candidato `65cf2da` como `aab27d9`; CI candidata
`34729684465` y exact-main `34730090448` pasaron ambas piernas y comparación.
El mismo SHA quedó desplegado en Preview con health PASS y prueba real de dos
perfiles/Users sobre una Station compartida. Logout, relogin y switch del
perfil QA no afectaron la Session Owner. El fixture User sintético quedó
inactivo, las Sessions QA revocadas y sólo la Session Owner previa permaneció
activa. Production no cambió.

## Capacidades integradas relevantes

- Trusted Station Context, Users, Roles/capabilities, PIN y Operational Session
  con autorización contextual server-side.
- PBI-043 permite Sessions concurrentes por Station en `main` y Preview.
- Customer mínimo, New Repair y Repair Detail PBI-039 integrados y validados.
- Auditoría de negocio acotada conserva Tenant, Branch, Station, User,
  SessionId y correlation en los writes cubiertos.

## Estado del delta PBI-043

| Área | Estado |
|---|---|
| ADR-014 | Accepted y materializada en `main`/Preview |
| Admission concurrente | PASS Application/HTTP/PostgreSQL/Chrome/Preview |
| Switch session-local | PASS; reemplazo exacto local y Preview |
| Drop unique parcial / índices | migración fresh/existing/down/reapply PASS; sin índice StationCredential injustificado |
| Revocación efectiva N-session | contratos internos y PostgreSQL PASS |
| Cookies/CSRF/PIN/timeout | Sin cambio aprobado |
| Browser Owner + QA | PASS local y Preview; misma Station, perfiles y Users distintos; DOM/Console/Network gated |
| Device/Session Admin | Fuera de alcance |
| Global Access lifecycle audit | Fuera de alcance |

## Roadmap y WIP

| Elemento | Estado vigente |
|---|---|
| Sprint | SPRINT-02 — Closed candidate |
| Current PBI | NONE; PBI-043 Done candidate |
| WIP | 0/1 funcional |
| PBI-040 | congelado; no integrado |
| G3 Authentication | PASS; policy delta PBI-043 integrada y validada |
| Preview | `aab27d9` PASS |
| Production / release | NO / NO |

## Próxima acción

Integrar este cierre documental y obtener CI exacta sobre su merge. Entonces
PBI-043 y SPRINT-02 quedan `Done`/`Closed` efectivos sin otro PR. PBI-040
permanece congelado: podrá reconciliarse después como candidato, pero no queda
iniciado ni autorizado por este cierre.
