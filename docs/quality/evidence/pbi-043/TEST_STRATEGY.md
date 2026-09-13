# PBI-043 — Test Strategy

## Estado

- **Estado:** COS-01…COS-24 ejecutados localmente; CI/Preview pendientes.
- **Riesgo:** Critical.
- **Motor material:** PostgreSQL 18.x real.
- **Autoridad:** ADR-014, DEC-051 y threat model PBI-043.

## Matriz mínima

| ID | Escenario | Nivel obligatorio | Predicado material |
|---|---|---|---|
| COS-01 | mismo User + misma Station + A/B | PostgreSQL + HTTP | dos filas activas, SessionIds/verifiers distintos |
| COS-02 | mismo User + Stations distintas | PostgreSQL | ambas resuelven sólo en su contexto |
| COS-03 | Users distintos + misma Station | PostgreSQL + HTTP | ambos activos y actor correcto por bearer |
| COS-04 | logout A no revoca B | Application + PostgreSQL + HTTP | A `logged_out`; B activa y usable |
| COS-05 | switch A reemplaza sólo A | Application + PostgreSQL + HTTP | A `replaced`; B sin cambios; nueva C activa |
| COS-06 | unlink/revoke Station | PostgreSQL | todas fallan antes del efecto; restore no revive |
| COS-07 | disable/revoke User | PostgreSQL | todas las Sessions del User fallan; otras continúan |
| COS-08 | credential revoke/replace | PostgreSQL | sólo dependientes quedan inválidas; restore no revive |
| COS-09 | login independiente concurrente | PostgreSQL con barrera | dos commits y dos SessionIds; cero reemplazo |
| COS-10 | switch/logout race | PostgreSQL con barrera | un ganador sobre X, sin Session parcial ni efecto en B |
| COS-11 | revoke/login race | PostgreSQL con barrera | login no confirma con revision stale; si confirma antes, siguiente acción falla |
| COS-12 | PIN lockout concurrente | PostgreSQL | contador/cooldown exactos; Sessions existentes siguen válidas |
| COS-13 | CSRF A contra bearer B | HTTP contract | denegación genérica, cero mutación/cookie autoritativa |
| COS-14 | Tenant isolation | PostgreSQL + HTTP | bearer/ID de Tenant A no observa o muta B |
| COS-15 | Branch derivation | PostgreSQL + HTTP | Branch sólo de StationCredential vigente |
| COS-16 | idle expiration 60m | Unit boundary + PostgreSQL | igualdad con frontera expira sólo esa Session |
| COS-17 | absolute expiration 12h | Unit boundary + PostgreSQL | touch no extiende absolute lifetime |
| COS-18 | business attribution | Application + PostgreSQL | hecho cubierto conserva Tenant/Branch/Station/User/SessionId correctos |
| COS-19 | restore User/Station | PostgreSQL | epochs impiden revivir Sessions anteriores |
| COS-20 | migración fresh | PostgreSQL migration | schema/índices destino exactos; runner/journal PASS |
| COS-21 | migración existing | PostgreSQL migration | Session previa permanece válida sin backfill/rotación |
| COS-22 | rollback guard | PostgreSQL migration | down con N>1 aborta; con <=1 recrea unique |
| COS-23 | dos perfiles Chrome | Browser/E2E | cookie jars independientes conservan A/B tras reload |
| COS-24 | Owner + Codex/QA | Browser/E2E Owner | logout/switch QA nunca expulsa Owner |

## Cobertura complementaria

- Unit: parsing, estados, temporalidad, mapeo de errores y semántica de
  `expectedSessionId`.
- Contract: puertos de create/switch/invalidate, cookies, no-store, JSON-only,
  same-origin y respuestas sanitizadas.
- PostgreSQL: constraints, índices, aislamiento, revisions, exact updates,
  serialización y migración up/down/reapply.
- HTTP: login sin Session previa, switch con bearer/CSRF exactos, logout exacto,
  cookies duplicadas/malformadas y spoofing de contexto.
- Browser: mismo perfil/múltiples tabs continúan compartiendo una Session;
  perfiles distintos conservan Sessions independientes.
- Architecture: Access conserva ownership, no raw SQL fuera de migración, no
  imports internos cross-owner y policy DEC-005 exacta.

## Oráculos de concurrencia

Las pruebas materiales usan clientes PostgreSQL independientes y barreras
deterministas. No usan sleeps como único mecanismo ni aceptan “uno o dos” como
resultado. Cada carrera declara outcomes permitidos y comprueba filas,
versiones y estados después del commit.

## Migración y rollback

Se verifican al menos:

1. fresh `up`;
2. `up` sobre una Session activa anterior;
3. múltiples Sessions después del cambio;
4. `down` bloqueado con duplicados;
5. reconciliación explícita en fixture sintético;
6. `down` válido con máximo una activa;
7. `up` repetido/journal íntegro;
8. código compatible antes/después del cambio de constraint.

## Browser proof

- Dos perfiles reales, no sólo dos tabs.
- Misma origin y misma Station sintética reconocida.
- SessionIds observables sólo como IDs no secretos en snapshots permitidos.
- Network/console sin PIN, bearer o CSRF capturados en evidencia.
- Owner permanece autenticado mientras QA inicia, recarga, cambia User y hace
  logout en su propio perfil.
- Repetir con Users distintos.

## Gates Critical

1. focused suites y PostgreSQL material GREEN;
2. architecture, typecheck y build GREEN;
3. `pnpm run verify` y campaña full aplicable GREEN;
4. ejecución autoritativa run-1;
5. ejecución autoritativa run-2;
6. comparison MATCH/GREEN sobre el mismo SHA;
7. focused Critical-risk review sin hallazgos abiertos;
8. Owner Review de dos perfiles;
9. merge, exact-main CI y Preview validation sólo con autoridades separadas.

Ningún resultado local autoriza merge, deploy, Owner Acceptance o `Done`.
