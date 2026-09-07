# PBI-034 — Operational Session Threat Model

## Boundary y clasificación

PBI-034 transforma una autenticación PIN válida y de un solo consumo en una
Session operacional stateful, limitada al Trusted Station Context. La Session
atribuye un User; no concede capabilities ni autoriza efectos de negocio.

**Riesgo:** `Critical`, preservado. Combina bearer secrets, cookies, CSRF,
multitenancy, revocación y concurrencia. Es el riesgo conocido previsto por el
Identity Master Goal; criptografía/protocolo custom, almacenamiento cliente de
tokens o autoridad de contexto proveniente del frontend obligan a detenerse.

## Contrato del bearer

- 32 bytes de `randomBytes`, codificados base64url de forma canónica.
- Cookie `sr_session` host-only, `HttpOnly`, `SameSite=Strict`, `Path=/`,
  `Max-Age=43200`; `Secure` salvo HTTP local explícito.
- PostgreSQL conserva sólo SHA-256 del bearer, con unicidad; una Session
  stateful no requiere firma ni JWT. `SR_SESSION_SIGNING_KEY` sigue reservado.
- El token nunca aparece en body, URL, log, error, evidence, localStorage ni
  sessionStorage. Cookies duplicadas/malformadas fallan cerradas.

## Predicados revalidados

Cada resolución válida verifica nuevamente: credencial y estado de Station,
binding activo, Branch/Tenant, User activo, assignment aplicable y PIN
credential activa con la misma versión autenticada. Cualquier divergencia
invalida la Session.

## Threats and controls

| Amenaza | Control | Evidencia requerida |
|---|---|---|
| Robo/exposición de bearer | 256 bits, cookie HttpOnly/Strict/host-only/Secure y digest en DB | contract + DB/log/secret scans |
| Session fixation | servidor siempre genera token nuevo; switch exitoso reemplaza y rota | application/material tests |
| Replay de token terminado | estados closed/replaced/expired/invalidated y lookup por digest | negativos PostgreSQL |
| CSRF/login CSRF | double-submit CSRF, Origin exacto, Fetch Metadata same-origin, JSON-only, no CORS | HTTP contract negatives |
| Manipulación Tenant/Branch/Station | contexto sólo desde Station verifier; payload no acepta IDs de contexto | isolation/contract tests |
| User no elegible/revocado | Users reader + assignments + PIN version revalidados | lifecycle negatives |
| Station/binding revocados | Trusted Station resolver en cada request autenticado | context negatives |
| Expiración eludida | idle 60m y absolute 12h server-side con reloj controlado | boundary tests |
| Touch infinito | actividad sólo tras todos los predicados; absolute expiry inmutable | material tests |
| Carrera de login/switch | guard por Station + unique partial active; reemplazo atómico | concurrent tests |
| Switch fallido cierra actor vigente | autenticar y validar primero; reemplazar sólo dentro del commit exitoso | negative/material tests |
| Carrera logout/touch | versión/estado atómicos; closed nunca revive | concurrent tests |
| Enumeración | errores genéricos, PIN dummy path heredado y `no-store` | contract/timing-seam tests |
| Proof reutilizable | `PinAuthenticationProof` se consume una sola vez en proceso y nunca se serializa | unit tests |
| Bootstrap local en producción | endpoint/fixture exige entorno development/test y contrato local explícito | production exclusion tests |
| Bypass modular | sólo aristas DEC-005 autorizadas y contratos públicos inyectados | checker/mutation tests |

## Cookies, CSRF y cache

- `GET /api/access/session` puede emitir/rotar un nonce CSRF legible sin
  autenticar al actor.
- `POST` y `DELETE` exigen coincidencia exacta cookie/header, `Origin`
  same-origin, Fetch Metadata same-origin y content type JSON.
- No se habilita CORS. Toda respuesta de Session/User usa
  `Cache-Control: no-store`.
- Logout expira sólo `sr_session`; la credencial `sr_station` permanece.

## Tiempo y lifecycle

- `lastActivityAt + 60m` define idle expiry; `issuedAt + 12h` define absolute
  expiry. La menor frontera prevalece.
- Igualdad con la frontera ya está expirada.
- Logout cierra; login/switch exitoso reemplaza; fallo de predicados invalida.
- No hay refresh token, grace period, recovery remoto ni extensión del
  absolute lifetime.

## Riesgos residuales

- XSS same-origin podría iniciar requests en nombre del actor aun sin leer la
  cookie; CSP/hardening extendido queda fuera, y PBI-026 mantiene autorización
  por acción.
- SHA-256 no protege un token de baja entropía, pero el bearer usa 256 bits
  CSPRNG. Cambiar a material débil reabre la decisión.
- La tabla conserva metadata operacional de sesión; acceso a DB sigue siendo
  sensible aunque no revele bearers.
- No existe enrollment productivo, secret manager, reautenticación reforzada o
  invalidación distribuida multi-región. Ninguno se afirma en este checkpoint
  local.
