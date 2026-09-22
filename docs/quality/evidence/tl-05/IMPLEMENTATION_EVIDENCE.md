# TL-05 — Implementation Evidence

## Resultado

Los bloques funcionales autorizados están materializados y el candidato local
pasó el gate completo. No existe autorización remota y TL-06 permanece sin
iniciar.

## Implementación

| Frontera | Resultado |
|---|---|
| Branch V1 | Extiende `branches` con nombre, versión y `updated_at`; conserva ID compuesto, timezone IANA, `active`, `admission_revision` y UTC. |
| Legacy mapping | Sólo `...0101` y `...0102` reciben los nombres Owner aprobados; cualquier fila extra sin nombre falla cerrado. |
| Comandos | Create/update/deactivate/reactivate son server-scoped, optimistas, idempotentes y atómicos con journal/audit. |
| Tenant lifecycle | Tenancy conserva el lock y la transición monotónica; Branch activa + Tenant Admin efectivo activa un Tenant `ONBOARDING`. |
| Última Branch | Mutex sobre Tenant + aislamiento serializable dejan exactamente una Branch activa frente a deactivations concurrentes. |
| Authority | `branches.read`, `branches.manage` y `branches.deactivate`; lifecycle exige Admin Session y reauth Level 2 vigente. |
| HTTP | `/api/admin/branches`; cuerpos allowlisted, scope derivado server-side, errores sanitizados y CSRF administrativo separado. |
| UI | Admin login/session shell, onboarding, lista, crear, editar, desactivar/reactivar y prompt de reauth. |

El path operacional `/api/access/administration/branch` conserva sólo lectura
de timezone para presentación. Toda mutación Branch se realiza por Admin
Context; Station/PIN no concede autoridad administrativa.

## Persistencia

Tres migraciones elevan el manifest a 84:

- `20260921160000_stations_materialize_branch_management`;
- `20260921161000_tenancy_create_lifecycle_events`;
- `20260921162000_stations_extend_branch_command_snapshots`.

La aplicación local y el PostgreSQL disposable probaron segunda ejecución con
`0 pending`. Los eventos Branch/Tenant son append-only y no almacenan password,
PIN, token, cookie, headers, payload libre ni secretos de reauth.

## Proof material

- nombres duplicados producen Branch IDs diferentes;
- timezone inválida/fixed offset se rechaza y una IANA válida persiste tras
  reload sin reescribir timestamps históricos;
- Tenant sin Admin efectivo permanece `ONBOARDING`;
- primera Branch válida con Admin efectivo activa Tenant atómicamente;
- dos deactivations concurrentes dejan una Branch activa y una denegación
  `LAST_ACTIVE_BRANCH_REQUIRED`;
- Alpha no lista, lee, actualiza, desactiva ni reactiva una Branch Beta;
- edit/reload, deactivate/reauth/reactivate pasaron en el runtime local.

## UI y accesibilidad

Chrome material PASS en desktop, 768 y 640, temas claro/oscuro, Tab/Shift+Tab y
controles nativos, sin clipping, superposición ni overflow horizontal de
página. El login administrativo opera sin Station/PIN y no reutiliza la
Operational Session.

## Verificación local

- typecheck y build: PASS;
- arquitectura DEC-005 policy 10: PASS;
- tests focalizados de Admin/Branch/verification topology: `65/65` PASS;
- TL-05 PostgreSQL 18.4: `3/3` PASS;
- migraciones: 84; segunda ejecución: `0 pending`;
- `/livez`, `/readyz` y frontend local: `200`;
- `git diff --check`: PASS;
- `verify:full`: stages `0–17` PASS;
- compuesto PostgreSQL: `5` suites, `17` tests, `0` skips críticos;
- PBI-039/PBI-040/PBI-041 y TL-02/TL-03/TL-04/TL-05 materiales: PASS;
- TL-05 PostgreSQL: `3/3`, migraciones `84`, rerun `0 pending`;
- Preview-like PostgreSQL, backend compilado y UI compilada: PASS;
- cleanup/fingerprint final: PASS;
- warning aceptado: chunk principal Vite mayor a 500 kB; no es una regresión TL-05.

Estos resultados no sustituyen CI remota, review independiente, merge,
exact-main CI ni deploy.
