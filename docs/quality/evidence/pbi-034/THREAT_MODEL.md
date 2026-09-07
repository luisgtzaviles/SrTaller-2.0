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
| User no elegible/revocado | Users owner validator + epoch monotónico, assignments y PIN version revalidados en la transacción | lifecycle/race negatives |
| Station/binding/Branch/credential revocados | Trusted Station owner validator + epochs monotónicos exactos; restore no revive | context/race negatives |
| Expiración eludida | idle 60m y absolute 12h server-side con reloj controlado | boundary tests |
| Touch infinito | actividad sólo tras todos los predicados; absolute expiry inmutable | material tests |
| Carrera de login/switch | guard por Station + unique partial active; reemplazo atómico | concurrent tests |
| Switch fallido cierra actor vigente | autenticar y validar primero; reemplazar sólo dentro del commit exitoso | negative/material tests |
| Switch con bearer obsoleto/forjado | resolver bearer + CSRF contra la Session esperada antes del PIN y repetir CAS bajo guard | HTTP/material negatives |
| Tabs comparten cookies pero muestran actores distintos | Web Lock exclusivo por origen; invalidación `session-changing` antes de mutar; cada peer oculta actor y reconcilia tras el lock | coordinator/UI adversarial tests |
| Response obsoleto sobrescribe cookies nuevas | `GET` nunca muta cookies autoritativas; DELETE denegado tampoco; login challenge disjunto | cookie-jar completion-order tests |
| Pérdida de cookies deja una Session activa huérfana | login reap sólo de filas con deadline idle/absolute ya vencido, bajo guard de Station | PostgreSQL expiry/recovery tests |
| Carrera logout/touch/create | logout autentica y cierra bearer + CSRF exactos bajo guard; create usa CAS contra la activa; closed nunca revive | concurrent PostgreSQL tests |
| Configuración PIN inválida deja un listener inútil | `SR_PIN_PEPPER` se materializa durante composición; startup aborta antes de escuchar | startup/configuration tests |
| Lectura o espera browser bloqueada | límite finito y cancelación antes de admisión; read abortable libera el lock | coordinator deadline tests |
| Mutación browser abandonada tras commit | una vez adquirido el lock se desarman deadline/cancelación cliente y se espera el outcome/`Set-Cookie` | coordinator mutation tests |
| Contención del runtime compartido | persistencias concurrentes; transacciones FIFO exclusivas; cola máxima 256 y espera máxima 25s fail-closed; shutdown drena sólo trabajo ya admitido | scheduler unit tests + same-runtime PostgreSQL test |
| Enumeración | errores genéricos, PIN dummy path heredado y `no-store` | contract/timing-seam tests |
| Proof reutilizable | `PinAuthenticationProof` se consume una sola vez en proceso y nunca se serializa | unit tests |
| Bootstrap local en producción | endpoint/fixture exige entorno development/test y contrato local explícito | production exclusion tests |
| Bypass modular | sólo aristas DEC-005 autorizadas y contratos públicos inyectados | checker/mutation tests |

## Cookies, CSRF y cache

- `GET /api/access/session` puede emitir/reutilizar únicamente el challenge
  `sr_session_login_csrf`, legible, `SameSite=Strict`, `Path` acotado y máximo
  15 minutos. Nunca crea, rota ni elimina `sr_session` o `sr_session_csrf`.
- `POST` y `DELETE` exigen coincidencia exacta cookie/header, `Origin`
  same-origin, Fetch Metadata same-origin y content type JSON.
- No se habilita CORS. Toda respuesta de Session/User usa
  `Cache-Control: no-store`.
- Logout exitoso expira `sr_session` y `sr_session_csrf`; una denegación/replay
  no emite `Set-Cookie` y no puede borrar el par de una Session más nueva. La
  credencial `sr_station` permanece.

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
