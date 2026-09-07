# PBI-026 — Definition of Ready

## Resultado

**PASS — READY (2026-09-07).** PBI-026 puede ejecutarse localmente bajo el
`Identity Master Goal`, con tamaño `Large` y riesgo `Critical` preservado. El
riesgo es el trust boundary de autorización ya previsto por el Goal; no se
identificó un Critical nuevo inesperado.

Este PASS no autoriza release, deploy, PBI-028 ni infraestructura remota.

## Revisión

| Campo | Resultado |
|---|---|
| Objetivo | PASS — autorización server-side deny-by-default de acciones Repairs explícitamente mapeadas. |
| Alcance | PASS — Station + Session + User + grants frescos + scope Tenant/Branch + resource ownership. |
| Catálogo | PASS — `repairs.read` y `repairs.add_note`; D5/D6/New Repair se deniegan sin inventar capabilities. |
| Exclusiones | PASS — sin PBI-028, actor/audit/correlation, ABAC, administración, reinforced auth, release o deploy. |
| Dependencias | PASS — PBI-024/032/033/025/034 `Done`; cierre PBI-034 merge `54ddc251cda8ec7465b7913786c647f8d3ccbeac`, exact-main CI `34153470560` GREEN. |
| Context authority | PASS — Tenant/Branch/Station exclusivamente desde la credencial Station verificada server-side. |
| Actor authority | PASS — Session vigente, User activo y assignments/capabilities actuales. |
| Resource authority | PASS — Repairs resuelve membership dentro del scope autorizado. |
| Transporte | PASS — notes requieren Session, same-origin, JSON y double-submit CSRF; respuestas no-store. |
| Revocación | PASS — fresh evaluation en cada operación, sin grant cache; próxima decisión observa commits previos. |
| Error público | PASS — 401/403 genéricos y 404 scoped indistinguible, sin revelar predicados. |
| UI | PASS — proyección advisory; navegación/acciones se ocultan sin sustituir enforcement. |
| Persistencia | PASS — consume persistencia existente; no se requiere migración. |
| Composición | PASS — Option A agrega sólo `repairs -> access` por token/contrato público, sin ciclo. |
| Estimación | PASS — `Large`. |
| Riesgo | PASS — `Critical`, sin downgrade; focused Critical-risk review obligatorio. |
| Sprint/WIP | PASS — SPRINT-02 activo; PBI-026 único PBI actual; WIP `1/1`. |
| Pregunta Owner nueva | Ninguna dentro del alcance mínimo aprobado. |

## Evidencia requerida antes de Owner Review

- allow/deny para cada predicado y capability exacta;
- tenant-wide, Branch-restricted, multiple-role union, role name ignored y
  revocaciones frescas;
- Station/User/PIN/Session/recurso inválidos, expirados, foreign o manipulados;
- CSRF/origin/content-type/cookies y error/cache contracts;
- D5/D6/New Repair direct-call/UI tampering con cero efectos;
- PostgreSQL 18.4 material con múltiples Tenants/Branches/Stations/Users;
- DEC-005 policy y mutaciones negativas de composición/enforcement;
- login/reload/logout/switch y capability projection en Light/Dark,
  390/768/1024/1280+ y keyboard/focus;
- typecheck, build, `pnpm run verify`, secret scan y `git diff --check`;
- Draft PR CLEAN/MERGEABLE y CI run-1/run-2/comparison GREEN en HEAD exacto.

## Límite de autoridad

Si la implementación necesita una capability nueva, migración, actor/audit de
PBI-028, policy general, dependencia inversa, secreto productivo o
infraestructura remota, DoR se reabre y se solicita decisión Owner.
