# TL-02 — Implementation Evidence

## Resultado

Los ocho bloques autorizados están materializados. El candidato local queda
`BLOCKED` para promoción porque la campaña `verify:full` no cerró en verde;
no existe autorización remota. No se implementó registro público, Tenant
bootstrap, transporte de email, Branch/Station management, shell
administrativo ni TL-03.

## Implementación

| Frontera | Resultado |
|---|---|
| Identidad | Email normalizado y verificado-ready ligado a un User/Tenant; un email pertenece a un Tenant en MVP. |
| Password | Argon2id profile V1, salt y pepper administrativo separados, dummy verification y work limiter acotado. |
| Session | Stateful y concurrente; idle 30 minutos, absoluto 12 horas, sin remember-me, bearer/CSRF sólo como digests. |
| Revocación | Logout, Session individual y revocación global con revisiones monotónicas. |
| Reauth | Password del mismo actor; evidencia reciente máxima de 10 minutos y commit guard para Level 2 futuro. |
| Recovery | Foundation interna con challenge de 30 minutos, single-use, rotación de credencial y revocación global; sin endpoint público. |
| Abuse | Cinco fallos en ventana de 15 minutos, cooldown de 15 minutos y actualización atómica resistente a concurrencia. |
| Audit | Eventos append-only con campos allowlisted; sin email, password, PIN, bearer, CSRF, cookie, challenge, headers ni payload libre. |
| Scope | Tenant/User se derivan server-side desde Admin Session; body/query/path/host no pueden seleccionar autoridad. |
| Separación | Cookies, tipos, rutas y guards administrativos son distintos de Station/PIN/Operational Session. |

## Persistencia

Una migración forward-only owner `access` añade seis tablas:

- `access_admin_identities`;
- `access_admin_password_credentials`;
- `access_admin_sessions`;
- `access_admin_auth_attempt_limits`;
- `access_admin_recovery_challenges`;
- `access_admin_security_events`.

El manifest material queda en 76 migraciones. PostgreSQL 18.4 probó primera
aplicación, segunda corrida con cero pendientes, constraints tenant/User,
sesiones concurrentes, expiración, revocación, reauth, recovery replay,
rate-limit concurrente, audit sin secretos y ausencia de Operational Session.

## Superficie y autoridad

La API mínima `/api/admin` expone snapshot/login, logout, reauth y gestión de
Sessions propias. Usa same-origin, Fetch Metadata, JSON-only, CSRF separado,
`SameSite=Strict`, `HttpOnly`, `Secure` fuera de localhost y `no-store`.

`AdminAuthorizationExecutor` resuelve identidad/scope exclusivamente desde la
Admin Session y recalcula capabilities tenant-wide. Su binding público se
exportará cuando un módulo consumidor autorizado aparezca; TL-02 no crea una
dependencia arquitectónica sin consumidor sólo para exponerlo.

## Proof local

- El provisioner `local:admin:provision` exige runtime/DB de desarrollo en
  localhost, User/Tenant existentes y password oculto confirmado por TTY.
- El password no viaja por argv ni se imprime.
- `/livez` responde `200`.
- `GET /api/admin/session` sin Station responde snapshot no autenticado,
  challenge login-CSRF separado y `Cache-Control: no-store`.

## Verificación del candidato

- tests focalizados de dominio, seguridad, application, HTTP, autorización y
  provisioner: PASS;
- PostgreSQL TL-02 material: 2 PASS, 76 migraciones y rerun `0 pending`;
- regresiones Station/PIN/Operational Session: cubiertas por la verificación
  completa vigente;
- typecheck, build, architecture, Work Unit, links, secret scan y
  `git diff --check`: PASS;
- `verify`: PASS, con 975 pruebas en verde, 32 skips PostgreSQL gobernados y
  cero fallos;
- `verify:full`: FAIL exclusivamente en Stage 7 porque el benchmark histórico
  PBI-041 publicó 10k filas en 35.4 segundos después del composite, sobre su
  presupuesto de 30 segundos. La misma suite aislada fue 10/10 PASS y publicó
  en 2.18 segundos. El umbral no se relajó y el stage no se omitió ni reordenó.

Los resultados locales no sustituyen CI remota, review independiente, merge o
exact-main CI.

## Riesgos residuales aceptados por alcance

- rate limiting distribuido/edge depende de la topología futura;
- provider y entrega de verification/recovery pertenecen a TL-04;
- starter Tenant Admin, bootstrap e invariante del último Admin pertenecen a
  TL-03/TL-06;
- lifecycle ONBOARDING/ACTIVE se materializa en TL-03;
- no existe todavía UI administrativa final.

Ninguno de estos límites abre un bypass en TL-02: las rutas ausentes permanecen
ausentes y la autorización falla cerrada.
