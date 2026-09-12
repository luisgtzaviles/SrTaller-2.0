# PBI-043 — Concurrent Operational Sessions Threat Model

## Boundary y riesgo

PBI-043 cambia admisión y lifecycle de Operational Session para permitir cero o
más Sessions activas por Station sin modificar cómo se deriva contexto, se
autentica PIN o se autoriza una acción.

**Riesgo: Critical.** Intervienen bearer secrets, multitenancy, cookies, CSRF,
concurrencia, revocación y rollback de una restricción de seguridad. No se
reduce la clasificación porque el delta sea pequeño.

## Invariantes no negociables

- El servidor deriva Tenant, Branch, Station, User y SessionId.
- Cada bearer resuelve una sola Session y un solo actor.
- No se almacena o expone bearer/PIN/CSRF en body, URL, logs o evidencia.
- Revoke/unlink/disable impide la siguiente operación afectada.
- Restore no revive una Session anterior.
- Cookies, CSRF, same-origin, JSON-only, no-store y anti-enumeración permanecen.
- La autorización y su confirmación al commit operan sobre la Session
  solicitante.

## Threat matrix

| Amenaza | Severidad | Mitigación actual conservada | Mitigación nueva | Criterio de aceptación |
|---|---|---|---|---|
| Mayor blast radius por robo de Session | High | bearer 256-bit, HttpOnly/Strict/Secure, digest DB, 60m/12h | revocación exacta y por conjunto; no loguear secretos | A robada no autentica como B; revocar A no toca B |
| Sessions desatendidas | High | idle y absolute expiry server-side | índices activos, reaping por Session y futura administración explícita | cada Session expira independientemente en fronteras exactas |
| Station comprometida | Critical | StationCredential y admission revisions | todas las Sessions quedan efectivamente inválidas al revoke/unlink | ningún bearer de esa Station autoriza después del cambio |
| PIN compartido | High | Argon2id, lookup opaco, rate limit y lockout | concurrencia no evita límites; señal futura fuera de alcance | intentos multi-perfil acumulan como hoy |
| Replay de bearer cerrado | High | digest, estados terminales y lookup scoped | multi-row queries nunca seleccionan otra Session | replay de logged_out/replaced/invalidated falla genérico |
| CSRF entre Sessions | High | double-submit, Origin, Fetch Metadata, JSON-only | bearer A sólo acepta CSRF A; cookie jars aislados | CSRF A no autoriza bearer B |
| Session fixation | High | IDs/tokens server-side y rotación en login | switch exige posesión de X y emite tokens nuevos | cliente no elige tokens; X no se transfiere |
| Privilegios stale | Critical | User/role/assignment/credential revalidation y epochs | aplicar a cada Session; pruebas con N activas | revocación impide siguiente operación de todas |
| Authorization drift por carrera | Critical | confirm-at-commit y optimistic version | switch lock exacto; admission revalida antes de commit | revoke/login y switch/logout tienen outcome único seguro |
| Tenant/Branch confusion | Critical | Station-derived context y lookup scoped | índices nunca reemplazan predicados de scope | Tenant/Branch ajenos no leen, cierran o invalidan Sessions |
| Crecimiento de filas activas | Medium | expiración y estados terminales | índices parciales; sin límite pequeño inicial; medir después | plan con volumen y EXPLAIN cumple presupuesto acordado |
| Gap de lifecycle audit | Medium | fila Session + business audit con SessionId | conservar atribución; dejar deuda explícita a Admin futuro | ningún hecho cubierto pierde Tenant/Branch/Station/User/SessionId |
| Rollback con duplicados | Critical | unique actual | preflight bloquea down; drenaje sólo explícito/autorizado | down falla sin elegir ganadora cuando count > 1 |
| Lock station-wide residual | High | guard serializa hoy | login independiente no adquiere exclusividad global | barrera concurrente confirma dos SessionIds |
| Logout/switch de otra Session | Critical | bearer+CSRF y CAS | update exacto por scope/ID/version, nunca station-wide | A no cambia status/version de B |
| DoS mediante PIN lockout | High | respuestas genéricas y cooldown | lockout no termina Sessions existentes | fallos bloquean login y A/B activas continúan |

## Stop conditions

Detener implementación si aparece cualquiera de estos hechos:

- necesidad de aceptar contexto o SessionId del cliente como autoridad;
- relajación de cookies, CSRF, Origin, Fetch Metadata o rate limiting;
- raw bearer/PIN/CSRF persistido o registrado;
- rollback que cierre Sessions sin autoridad explícita;
- incapacidad de demostrar revocación efectiva para N Sessions;
- dependencia directa entre owners que contradiga DEC-005/DEC-049;
- flaky concurrency test o PostgreSQL simulado como única evidencia.

## Riesgos residuales aceptados

- No existe límite pequeño fijo inicial (ASC-004).
- No existe Device/Session Admin ni logout-all UI en PBI-043.
- No existe audit global de lifecycle Access (ASC-005).
- Una fila puede conservar `active` físicamente tras un cambio de epoch hasta
  su siguiente resolución, siempre que no pueda autorizar.

## Evidencia obligatoria

- [Test Strategy](./TEST_STRATEGY.md) completa.
- PostgreSQL 18.x material para constraints, races, lifecycle y rollback.
- HTTP negatives para cookie/CSRF/origin/anti-enumeration.
- Browser proof con dos perfiles reales y sesión Owner preservada.
- Focused Critical-risk review sin BLOCKER/HIGH/MEDIUM abierto.
- `verify`, campaña de riesgo aplicable, CI run-1/run-2/comparison y evidencia
  sobre el SHA exacto.
