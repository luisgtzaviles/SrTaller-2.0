# TL-04 — Implementation Evidence

## Resultado

Los ocho bloques autorizados están materializados. El único gate pendiente al
registrar esta evidencia es `verify:full` sobre el candidato documental final.
No existe autorización remota y TL-05 permanece sin iniciar.

## Implementación

| Frontera | Resultado |
|---|---|
| Attempt | Lifecycle server-owned `PENDING_VERIFICATION -> VERIFIED -> CONSUMED`, con terminal `EXPIRED`, IDs/revisión/digest autoritativos y email normalizado. |
| Password | Reutiliza el hasher Argon2id TL-02; plaintext sólo cruza request/KDF; verifier temporal se elimina al consumir o expirar. |
| Challenge | Token aleatorio de 32 bytes, sólo digest durable, TTL 60 minutos, single-use, CAS, replay convergente y supersession por resend. |
| Abuse | Registro/verify acotados por HMAC efímero; resend 60 segundos y 5/hora por email normalizado; no se persiste IP raw ni user-agent. |
| Delivery | `EmailDeliveryPort` con adapters local/test y Resend; secreto externo, sender configurado y errores sanitizados sin corromper Attempt. |
| Bootstrap | Sólo un Attempt verificado construye el grant interno TL-03; retry, pérdida de respuesta y concurrencia convergen al mismo Tenant. |
| HTTP | Policy/register/resend/verify públicos, JSON estricto de 16 KiB, same-origin, `no-store`, DTOs exactos y correlation server-owned. |
| UI | `/registro` y `/verificar` viven fuera del gate Station/PIN; registro, pending, resend, confirmación explícita, invalid/retry/success y handoff admin. |

La verificación no se ejecuta automáticamente al abrir el enlace: requiere la
acción explícita `Confirmar correo`, evitando que scanners de enlaces consuman
el challenge.

## Persistencia y retención

Dos migraciones owner `registration` elevan el manifest a 81 migraciones:

- `20260921150000_registration_create_public_verification`;
- `20260921151000_registration_enable_retention_cleanup`.

La retención expira y limpia verifier/salt/KDF; purga en lotes acotados Attempt,
challenge, dispatch y límites vencidos después de 30 días. La evidencia de
Terms/Privacy queda durable, conserva Tenant/User cuando existen y se separa
del Attempt antes de su purga. Audit permanece append-only y sin secretos.

## Proof material

- Alfa/Beta con el mismo nombre de taller crean Tenants aislados;
- el mismo email normalizado no puede bootstrappear dos Tenants;
- resend invalida el token anterior y aplica cooldown/window;
- verify concurrente/replay produce un único bootstrap durable;
- fallo y respuesta perdida permiten retry idempotente;
- TL-03 deja Tenant `ONBOARDING`; TL-02 Admin login funciona sin Station;
- no se crea PIN ni Operational Session;
- provider failure conserva Attempt y sólo persiste reason/reference sanitizados;
- PostgreSQL prueba constraints, evidencia inmutable, cleanup y segunda
  migración con `0 pending`.

## UI y accesibilidad

Chrome material PASS en desktop, 768 y 640, temas claro/oscuro, sin overflow
horizontal. El orden de foco es nombre, taller, email, password, aceptación,
Terms, Privacy y CTA; `Shift+Tab` regresa correctamente. El formulario usa los
primitivos/tokens existentes y no duplica el Design System.

## Verificación local

- focused unit/HTTP/provider/UI/architecture: PASS;
- typecheck y build: PASS;
- TL-04 PostgreSQL 18.4: `3/3` PASS;
- migraciones: 81; segunda ejecución: `0 pending`;
- `/livez`, `/readyz` y frontend local: `200`;
- `git diff --check`: PASS;
- `verify:full`: pendiente sobre el candidato final.

Estos resultados no sustituyen CI remota, review independiente, merge,
exact-main CI ni deploy.
