# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** PBI-043 `Done`; PBI-040 reconciliado con la nueva baseline y listo
  para reanudar Owner Review local.
- **Baseline Git verificada:** `main == origin/main` en
  `5be5cd60acb0865da57aff76740a1330896b1cd1` como padre integrado de la rama
  PBI-040.
- **CI exacta de baseline:**
  [`34732201476`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34732201476),
  `SUCCESS` sobre `5be5cd6` con run-1, run-2 y comparison PASS.
- **Sprint:** SPRINT-02 `Closed`; SPRINT-03 `Active`.
- **PBI actual:** [PBI-040](backlog/pbis/PBI-040.md) — `Owner Review`;
  aceptación pendiente.
- **WIP:** `1/1` en `feature/pbi-040-catalog-pricing-core`.
- **PBI-040:** el WIP congelado `68843ba` fue preservado y reconciliado por
  merge explícito `28320b3` con `main` `5be5cd6`; no se añadió funcionalidad.
- **Preview:** `aab27d9` desplegado y validado; concurrencia de Sessions PASS.
- **Production:** no desplegada ni autorizada.

## Resumen ejecutivo

PBI-039 está `Done` efectivo: PR #45 integró el cierre documental como
`40684d7` y la CI exacta `34623060504` pasó run-1, run-2 y comparison. El ciclo
Price List comenzó después en una rama no integrada. Ese WIP permaneció
congelado durante PBI-043 y ahora se reanuda exclusivamente para continuar su
Owner Review.

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

El cierre PR #48 quedó integrado como `5be5cd6` y la CI exacta
`34732201476` pasó run-1, run-2 y comparison. Conforme al workflow, PBI-043
es `Done` y SPRINT-02 está `Closed`. La rama PBI-040 conserva como padre su
HEAD congelado `68843ba` y como nuevo padre integrado `5be5cd6`; los conflictos
se resolvieron por ownership, manteniendo Access/PBI-039/main autoritativos y
Catalog/Pricing desde el WIP.

La reconciliación pasó `verify:full` en sus 13 etapas sobre `28320b3`:
836 pruebas base sin fallas, PostgreSQL compuesto 17/17, PBI-039 material 2/2,
PBI-040 material con 57 migraciones y benchmark p95 7.19 ms, smokes y cleanup
PASS. El runtime local declaró el mismo SHA limpio en frontend/backend/worktree;
Repair Detail parity y la prueba Chrome de dos perfiles concurrentes también
pasaron. La sesión personal Owner quedó preparada en `/listas/precios` con los
cuatro fixtures sintéticos previos. Esto no constituye Owner Acceptance.

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
| Sprint | SPRINT-03 — Active |
| Current PBI | PBI-040 — Owner Review |
| WIP | 1/1 |
| PBI-040 | reconciliado localmente; aceptación pendiente |
| G3 Authentication | PASS; policy delta PBI-043 integrada y validada |
| Preview | `aab27d9` PASS |
| Production / release | NO / NO |

## Próxima acción

Continuar Owner Review local de PBI-040 desde la rama reconciliada. No inferir
Owner Acceptance, push, PR, merge, deploy ni inicio de PBI-041/PBI-042.
