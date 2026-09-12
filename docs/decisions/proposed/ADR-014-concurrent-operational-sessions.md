# ADR-014 — Sesiones operativas concurrentes por estación confiable

**Status: Accepted**

**Fecha:** 2026-09-12
**Autoridad de aceptación:** Product Owner mediante ASC-001 a ASC-008.

## Estado del documento

Decisión arquitectónica aceptada para sustituir parcialmente a
[ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md).
No autoriza implementación, merge, deployment ni release. Su materialización
pertenece a [PBI-043](../../backlog/pbis/PBI-043.md).

## Contexto

ADR-011 y PBI-034 establecieron una sola Operational Session activa por
Station. La restricción permitió representar un único usuario activo y un
cambio de turno station-wide, pero una prueba local posterior demostró una
fricción material: un perfil de navegador con PIN válido era rechazado cuando
otro perfil ya sostenía la sesión de esa Station.

La persistencia y autorización actuales ya resuelven cada request mediante un
bearer opaco y conservan Tenant, Branch, Station, StationCredential, User y
SessionId. Por ello la atribución inequívoca puede preservarse sin convertir la
Station completa en una sesión única.

## Fuerzas de decisión

- Un Owner o empleado necesita operar legítimamente desde varios dispositivos
  o perfiles simultáneos.
- Owner Review y QA no deben apropiarse ni terminar la sesión de otra persona.
- Tenant, Branch y Station continúan derivados server-side.
- El PIN sigue siendo credencial de autenticación, no autorización.
- Cada operación debe conservar un actor y SessionId inequívocos.
- Revocación, expiración, CSRF, anti-enumeración y autorización no se relajan.
- El primer cambio debe ser mínimo y no anticipar Device/Session Admin.

## Opciones consideradas

### A — Conservar una sesión activa por Station

Mantiene el modelo de turno original, pero reproduce el 401 legítimo entre
perfiles y obliga a cerrar o reemplazar sesiones ajenas. Rechazada.

### B — Permitir concurrencia sólo para el mismo User

Reduce una parte de la fricción, pero introduce una regla especial que no
mejora la atribución: dos Users distintos siguen siendo inequívocos cuando
cada request está ligado a su propia Session. Rechazada.

### C — Sesiones independientes por perfil y contexto confiable

Cada login independiente crea una Session distinta; switch y logout afectan
sólo la Session solicitante. Station/User/credential revocation conservan
efecto sobre el conjunto correspondiente. **Aceptada.**

## Decisión

1. Una Station confiable mantiene cero o más Operational Sessions activas.
2. Users iguales o distintos pueden mantener Sessions concurrentes en una
   Station cuando cada uno sea elegible y esté autorizado en la Branch
   derivada.
3. Una Operational Session queda ligada inequívocamente a:

   `Tenant + Branch + Station + StationCredential + User + SessionId`.

4. Station es el dispositivo/contexto confiable vinculado; Session es el
   periodo en que un actor autenticado opera desde ese contexto.
5. Ya no existe conceptualmente “el usuario activo de la Station”. Existen
   “las sesiones activas de la Station” y cada request tiene una sola Session
   solicitante.
6. `expectedSessionId = null` significa login independiente y no reemplaza
   otras Sessions.
7. `expectedSessionId = X` significa switch del perfil solicitante: X debe ser
   la Session autenticada por su bearer y CSRF y sólo X puede pasar a
   `replaced` si la nueva autenticación completa correctamente.
8. Un login independiente no requiere exclusividad ni lock station-wide. Un
   switch conserva compare-and-set y bloqueo sobre la Session exacta.
9. Dos logins independientes concurrentes pueden confirmar dos SessionIds
   distintos. No se introduce un límite pequeño fijo en el primer PBI.
10. Logout normal termina únicamente la Session solicitante.
11. Station unlink/revoke vuelve inválidas todas las Sessions de esa Station;
    User disable/revoke vuelve inválidas todas las Sessions de ese User; PIN
    credential revoke/replace invalida las Sessions dependientes.
12. La revocación es efectiva antes de aceptar otra operación. La
    materialización física de cada fila puede ser posterior cuando los epochs
    monotónicos garanticen fail-closed y una restauración no reviva Sessions.
13. El PIN lockout impide autenticaciones nuevas durante el cooldown y no
    termina Sessions ya autenticadas.
14. Idle timeout continúa en 60 minutos y absolute lifetime en 12 horas.
15. No cambian cookies, CSRF, Origin, Fetch Metadata, JSON-only, bearer,
    digest, no-store, rate limits, autorización contextual ni anti-enumeración.
16. Las acciones administrativas futuras de revocar Sessions o logout-all son
    sensibles, requieren capabilities explícitas y controles ADR-013.
17. PBI-043 no crea un audit global de Access ni una UI Device/Session Admin.
    Los hechos de negocio existentes conservan Tenant, Branch, Station, User y
    SessionId.

## Sustitución parcial de ADR-011

Quedan sustituidas exclusivamente las afirmaciones de ADR-011 que establecen:

- máximo una Operational Session o un usuario operativo activo por Station;
- creación de una Session como única Session activa de la Station;
- cambio de turno que reemplaza station-wide la Session anterior;
- rechazo general de varias Sessions activas simultáneas en una Station;
- política de concurrencia de un mismo User entre Stations como diferida.

El concepto `replaced` permanece, pero sólo para la Session del perfil que
ejecuta switch.

Permanecen vigentes las demás decisiones de ADR-011: identidad User
Tenant-scoped; PIN contextual y no reversible; Station/Branch/Tenant
server-side; separación de autenticación y autorización; sesión stateful;
estados de lifecycle; fail-closed; atribución histórica; logout/expiry sin
unlink; y prohibición de autoridad aportada por el cliente.

## Persistencia objetivo

- Remover el índice parcial único sobre `(tenant_id, station_id)` para
  `status = 'active'`.
- Conservar PK `(tenant_id, session_id)`, unicidad de `token_verifier`, columnas
  de contexto, revisiones, lifecycle, timestamps y versionado.
- Agregar índices parciales no únicos para Sessions activas por Station y por
  User, y por StationCredential cuando el plan de consulta/revocación lo
  justifique materialmente.
- El rollback nunca elige silenciosamente una Session. Si existen múltiples
  activas por Station, la contracción al índice único debe abortar hasta que
  una operación explícita y autorizada deje una sola.

## Consecuencias positivas

- Owner, empleados y QA pueden operar en perfiles/dispositivos independientes.
- Switch/logout dejan de interferir con Sessions ajenas.
- La atribución permanece por request y SessionId.
- El cambio se concentra en Access y no exige rediseñar módulos consumidores.

## Consecuencias negativas

- Puede haber más bearers vigentes y más filas activas.
- Revocación y pruebas de lifecycle deben considerar conjuntos de Sessions.
- Rollback a código que asume unicidad requiere drenaje explícito.
- La ausencia de Session Admin limita observabilidad y revocación self-service
  hasta un PBI posterior.

## Criterios para reconsiderar

- Evidencia operativa de crecimiento o abuso que justifique límites
  configurables.
- Necesidad aprobada de Device/Session Admin, logout-all o lifecycle events.
- Cambio del modelo de StationCredential, operación offline o multi-región.
- Cambio autorizado de idle/absolute expiry o del factor de autenticación.

## Preguntas abiertas

Ninguna bloqueante para PBI-043. Los límites configurables, nombres de
dispositivo, panel administrativo y auditoría lifecycle pertenecen a trabajo
posterior.

## Referencias

- [PBI-043](../../backlog/pbis/PBI-043.md)
- [Arquitectura de Concurrent Operational Sessions](../../architecture/CONCURRENT_OPERATIONAL_SESSIONS.md)
- [ADR-010](ADR-010-station-bound-operational-context.md)
- [ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md)
- [ADR-012](ADR-012-tenant-roles-capabilities-and-contextual-authorization.md)
- [ADR-013](ADR-013-sensitive-actions-and-reinforced-authorization.md)

## Próxima revisión

Antes de autorizar implementación de PBI-043 o cuando aparezca una condición de
reconsideración.
