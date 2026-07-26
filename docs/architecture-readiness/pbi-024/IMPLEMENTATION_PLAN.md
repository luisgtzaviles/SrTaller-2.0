# Plan futuro de implementación

## Regla de ejecución

Este plan no autoriza ejecución. Cada paso requiere autorización formal de
PBI-024, diff limitado, pruebas, evidencia y revisión. Un gate rojo detiene los
pasos siguientes. DEC051-C02 debe revisarse antes de rama/PR y sigue bloqueando
el primer merge funcional.

## Paso 0 — Autoridad y preflight

- confirmar dictamen independiente y autorización separada;
- confirmar `main` limpio y SHA autorizado;
- volver a evaluar DEC051-C02 y tratamiento vigente;
- ratificar riesgo alto, estimación y reviewers;
- prohibir endpoints, auth, roles, negocio y deploy.

**Salida:** permiso explícito para comenzar, no permiso de merge.

## Paso 1 — Checker y contratos de frontera

- ampliar policy sólo para paths, exports, objetos y consumers exactos;
- proteger owner `stations`, no deep imports, no Kysely fuera de
  infraestructura;
- prohibir raw station IDs como autoridad, global context, ALS, wildcard y
  repositories globales;
- agregar fixture válido, negativos y mutaciones.

**Rollback:** revert Git del paso.

**Gate:** architecture y mutation PASS dos veces.

## Paso 2 — Dominio y lifecycle

- materializar `StationId`, estados e invariantes;
- modelar create/link/unlink/relink/revoke con expected revision;
- congelar snapshots;
- no exportar entidad mutable ni agregar NestJS.

**Gate:** unitarias positivas, negativas y de transición.

## Paso 3 — Migración y schema

- crear una migración owner `stations`;
- añadir `stations` y `station_bindings`;
- registrar schema types y policy;
- probar `up`, `down`, reapply, atomicidad, constraints, unique binding,
  drift y cleanup en PostgreSQL `18.4`.

**Recovery:** down sólo en base aislada; tras exposición compartida se usa
roll-forward conforme DEC-050.

**Gate:** DEC063-C05/C06 aplicables y PostgreSQL PASS.

## Paso 4 — Ports y adapters owner-scoped

- crear `StationRepositoryPort` y adapter Kysely;
- cargar siempre por tenant + station;
- mantener binding en la misma transacción;
- mapear errores estructurados conforme DEC-044;
- evitar métodos globales y records públicos.

**Gate:** aislamiento, lifecycle, rollback y errores en PostgreSQL.

## Paso 5 — Recognition boundary

- crear `StationRecognitionPort`;
- fake determinista para tests;
- rechazar evidencia ausente/manipulada y datos cliente;
- no crear credential provider real, secreto, header parser o endpoint.

**Gate:** contract, anti-enumeración y architecture PASS.

## Paso 6 — Resolver y guard

- resolver station, binding y branch server-side;
- producir `TrustedStationContext` congelado;
- materializar `AssertTrustedStationContextCurrent`;
- revalidar status/binding/revision antes de efectos;
- no cache ni contexto global.

**Gate:** matriz AD-01–AD-20, concurrencia y stale revision.

## Paso 7 — Composición mínima

- factories en `StationsModule`;
- exportar sólo capacidades públicas por `index.ts`;
- ningún controller, CLI administrativo o consumer de negocio;
- AppModule no gana lógica.

**Gate:** build, smoke, module graph y public-surface tests.

## Paso 8 — Suites especializadas y mutaciones

- ejecutar unit/application/PostgreSQL/architecture;
- matar todas las mutaciones de [MUTATION_PLAN.md](MUTATION_PLAN.md);
- confirmar dos tenants/dos branches/relink/revoke/race;
- confirmar cero skips críticos.

**Gate:** DEC051-C04/C06 y DEC063-C02/C05/C06 con evidencia.

## Paso 9 — Evidencia y revisión

- producir manifest sanitizado;
- ejecutar `verify`, PostgreSQL, smoke y cleanup;
- correr `run-1`, `run-2`, `comparison`;
- revisar Seguridad, Producto, Arquitectura, Ingeniería, Operaciones y Calidad;
- documentar condiciones sin marcar canónicas por inferencia.

**Gate:** dictamen formal del PBI.

## Paso 10 — Integración controlada

No se puede ejecutar mientras DEC051-C02 siga `Pending`. Antes del primer
merge funcional debe existir una de estas dos evidencias:

1. C02 `Satisfied` mediante protección efectiva y prueba de rechazo; o
2. modificación formal separada de DEC-051.

Sin ella, el resultado puede permanecer revisado en rama pero no integrarse.

## Camino crítico y estimación

| Bloque | Tamaño | Dependencia |
| --- | --- | --- |
| dominio/lifecycle | M | contrato cerrado |
| persistencia/migración | L | checker + dominio |
| aplicación/resolver/guard | L | ports + schema |
| wiring | S | resolver |
| pruebas | L | todos los anteriores |
| mutaciones | M | pruebas |
| evidencia/CI | M | suites verdes |
| revisión | M | expediente completo |

Estimación global: **L**. El camino crítico es
`schema/lifecycle → resolver/guard → PostgreSQL/concurrency → mutations →
evidence/review`.

Reestimar si se requiere credential adapter real, estado tenant/branch nuevo,
endpoint, RLS, cache, offline, audit store, cancelación de operaciones in-flight
o cambio del grafo modular.
