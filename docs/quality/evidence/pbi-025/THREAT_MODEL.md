# PBI-025 — PIN Credential Authentication Threat Model

## Boundary y clasificación

PBI-025 verifica que un User seleccionado conoce un PIN de seis dígitos dentro
del Tenant ya resuelto por `TrustedStationContext`. No busca Users globalmente,
no crea Session y no concede capabilities.

**Riesgo:** `Critical`, preservado. La superficie combina secretos cortos,
autenticación, multitenancy, configuración externa y persistencia concurrente.
Es el Critical conocido previsto por el Identity Master Goal; cualquier nuevo
Critical, protocolo custom, Vault/KMS obligatorio o distribución remota exige
detenerse.

## Contrato criptográfico

- Node.js `24.18.0` `crypto.argon2` asíncrono, variante `argon2id`.
- Perfil `argon2id-v1`: `memory=65,536 KiB`, `passes=3`, `parallelism=4`, tag
  de 32 bytes y salt aleatorio individual de 16 bytes.
- `SR_PIN_PEPPER`: 32 bytes codificados canónicamente en base64url, server-only,
  requerido por Access. Argon2 lo recibe como `secret`.
- Associated data liga Tenant, User y versión; la base no puede trasplantarse
  entre principals.
- Algoritmo, parámetros, profile/pepper version y credential version están
  allowlisted; metadata distinta o corrupta falla cerrada.
- Comparación sólo entre tags de 32 bytes mediante `timingSafeEqual`.
- Un limiter en proceso acota trabajos Argon2 simultáneos. PostgreSQL conserva
  el control durable por Station/User y User credential.
- Argon2 de Node 24 es experimental y no FIPS; el toolchain exacto lo soporta.
  Cambiar toolchain/FIPS reabre la decisión. No se rebajan parámetros
  automáticamente.

## Threats and controls

| Amenaza | Control | Evidencia requerida |
|---|---|---|
| Fuerza bruta online sobre 10^6 valores | Cinco fallos consecutivos, lock 5 min, ventana Station/User de cinco inicios por 60 s y Argon2 acotado | tests secuenciales/concurrentes y PostgreSQL |
| Compromiso sólo de DB | salt individual + Argon2id + pepper externo ausente de DB | inspección schema/fixtures/secret scan |
| DB + pepper | no se promete resistencia absoluta; Argon2 aumenta costo y rotación queda fuera sin mentir | riesgo residual documentado |
| PIN/salt/verifier/pepper en logs o UI | errores sanitizados, ningún controller PBI-025, catálogo server-only, evidencia sin material | contract tests y scan |
| Enumeración de User/credencial/estado | misma denegación para inexistente, inactivo, revocado, missing y wrong; dummy KDF cuando procede | spy de KDF y errores idénticos |
| Tenant/Station/User substitution | contexto branded creado server-side; queries tenant-scoped y Station/User limiter compuesto | negativos multi-tenant/Station |
| Metadata downgrade o trasplante | perfil cerrado y associated data Tenant/User | tests de metadata/tenant/user distintos |
| Salt débil/reutilizado | `randomBytes(16)` por provisioning | salts distintos en unit/material |
| Carrera en umbral de lock | reserva durable y actualización atómica/serializada del contador | cinco intentos concurrentes terminan exactly locked |
| Replay de provisioning | journal tenant/request + fingerprint HMAC domain-separated; intento divergente conflict | same/different intent tests |
| Replay de authentication | no se journaliza éxito; cada llamada reserva y cuenta un intento nuevo | tests de retry |
| Lockout DoS | lock sólo User credential; rate adicional sólo Station/User; no tenant-global collateral lock | aislamiento entre Users/Stations |
| Exhaustión de memoria | limiter Argon2 local y rate durable antes de KDF | capacity test y error temporal genérico |
| User inactivo/revocado | read contract Users antes de verify; resultado nunca concede Session | negative tests |
| Credential revocada/corrupta | status/perfil validados, dummy path y fail closed | negative tests |
| Efecto parcial | provisioning/journal transaccionales; attempt reservation/finalization durable | rollback and restart tests |
| Fixture local usado en Production | secreto/PIN demo sólo en `.env.local` ignorado y seed local; sin endpoint productivo | production exclusion tests |

## Lock y rate-limit exactos

- `consecutive_failures` pertenece a la credencial Tenant/User.
- El quinto PIN erróneo establece `locked_until = occurredAt + 5 minutos`.
- Mientras el lock está vigente no se ejecuta Argon2 y se devuelve error
  genérico; al expirar, el siguiente intento comienza una secuencia nueva.
- Autenticación correcta limpia contador y lock sin cambiar credential version.
- Cada `(tenantId, stationId, userId)` admite cinco verificaciones iniciadas en
  una ventana fija de 60 segundos, éxitos incluidos. La sexta falla antes del
  KDF con resultado temporal genérico.
- La reserva del intento ocurre antes del KDF; falla de capacidad no muta el
  contador de credential, pero conserva la reserva anti-abuso.

## Lifecycle boundary

Conforme al `Identity Master Goal — Part D`, este slice materializa
provisioning inicial server-only, columnas/versiones para lifecycle futuro y
fallo cerrado cuando una credencial ya está revocada. No implementa ni expone
un comando operacional de reset/revocación. Si ese lifecycle se aprueba en un
slice posterior, PBI-034 debe invalidar Sessions activas; PBI-026 autoriza la
acción por capability y PBI-028 aporta auditoría de negocio. Preparar esos
consumidores no afirma que el reset ya exista; anticiparlos aquí crearía un
bypass.

## Residuales

- Una persona con DB y pepper puede probar el espacio de PIN offline.
- El perfil Argon2 debe recalibrarse si cambia el hardware/toolchain, mediante
  decisión explícita y migración versionada.
- La igualdad temporal perfecta no se promete: lock/rate evitan KDF por diseño.
  La interfaz no revela causa, User, contador ni tiempo.
- No existe recovery productivo, keyring/rotation ni FIPS. Ninguno es necesario
  para el checkpoint local y todos permanecen fuera de alcance.
