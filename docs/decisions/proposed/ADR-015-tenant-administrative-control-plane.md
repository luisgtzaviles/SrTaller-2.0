# ADR-015 — Tenant Administrative Control Plane and Lifecycle

**Status: Proposed**
**Fecha:** 2026-09-20

## Estado del documento

Propuesta arquitectónica de TL-01 basada en las decisiones Owner TL-001 a
TL-016 ya aprobadas. Este ADR no autoriza implementación. Requiere Owner Review
y resolución de las decisiones residuales identificadas en el
[contrato Tenant Lifecycle MVP](../../architecture/TENANT_LIFECYCLE_MVP.md).

## Contexto

ADR-010/011/012/014 protegen la operación cotidiana mediante Station confiable,
Operational Session PIN y autorización contextual. Sin embargo, el primer
Tenant todavía no tiene Branch, Station ni PIN operativo, y alguien debe poder
completar onboarding, crear la primera Branch y autorizar el enrollment del
primer equipo.

ADR-010 ya reconoce que reportes y funciones administrativas necesitan
contextos separados. ADR-012, en cambio, expresa Station + Operational Session
como requisito universal de toda operación protegida. Aplicarlo literalmente
al bootstrap crea un ciclo imposible; ignorarlo mediante un bypass `isAdmin`
debilita las decisiones aceptadas.

El Owner aprobó registro público con email verificado, password administrativo,
Tenant User inicial con starter Tenant Admin Role, Branch obligatoria y
administración lógica en `admin.srtaller.com`. Password/admin session y
PIN/operational session deben permanecer separados.

## Fuerzas de decisión

- El onboarding debe existir antes de la primera Station.
- Tenant continúa siendo la frontera máxima de autoridad y aislamiento.
- Un contexto administrativo no puede convertirse en contexto operativo.
- Roles/capabilities y deny-by-default deben aplicar también al control plane.
- Bootstrap y enrollment no pueden aceptar elevación o scope desde el cliente.
- Recovery, revocación, reauth y último Admin deben fallar cerrados.
- Super Admin, billing y suspensión comercial permanecen fuera del MVP.
- La solución debe caber en el monolito/despliegue actual sin fusionar límites
  lógicos ni exigir un microservicio.

## Opciones consideradas

### Opción A — Exigir Station + PIN también para onboarding

Rechazada. No existe una Station autorizada antes de que un Admin cree una
Branch y emita enrollment; obliga a un bootstrap local/productivo implícito.

### Opción B — Usar bypass `isAdmin` o Tenant/Branch aportados por frontend

Rechazada. Evade ADR-004/012, habilita escalada cross-tenant y convierte UI,
host o payload en autoridad.

### Opción C — Identidad de plataforma/Super Admin crea cada Tenant

Rechazada para este MVP. Contradice autoservicio aprobado e introduce la
capacidad global expresamente fuera de alcance.

### Opción D — Control plane tenant-scoped separado del contexto operativo

Propuesta. Una Admin Session autenticada por email/password deriva Tenant y
User server-side, evalúa capabilities tenant-wide y sólo puede ejecutar casos
administrativos. La operación diaria conserva Station + PIN.

## Decisión propuesta

Adoptar la opción D con tres contextos explícitos:

1. **Registration Context:** pre-tenant, público, limitado a intento,
   verificación y bootstrap idempotente.
2. **Tenant Admin Context:** Admin Session + Tenant User + Tenant + capabilities
   derivadas server-side; no requiere Station/Branch ambiental.
3. **Operational Context:** ADR-010/011/014 sin cambios, compuesto por Tenant +
   Branch + Station + Operational Session/User y autorización ADR-012.

### Relación con ADR-012

Cuando este ADR sea `Accepted`, calificará parcialmente a ADR-012:

- su modelo de Roles, unión de capabilities, scope tenant, deny-by-default,
  autoridad server-side y revocación continúa vigente;
- para una operación de Tenant Administration, la precondición de
  Station/Operational Session se sustituye exclusivamente por Tenant Admin
  Context válido;
- para toda operación de Branch cotidiana sigue siendo obligatorio el contexto
  completo de ADR-010/011/014;
- ninguna Admin Session concede capacidades operativas por sí sola.

### Registration y bootstrap

- El Registration Attempt no es Tenant ni autoridad.
- Tras verificar email, un comando idempotente/atómico crea Tenant
  `ONBOARDING`, primer Tenant User, credencial administrativa, starter Tenant
  Admin Role/assignment, journal y audit.
- Roles/capabilities/IDs/estado/tiempo se derivan server-side.
- El Tenant pasa a `ACTIVE` sólo al existir autoridad Tenant Admin efectiva y
  primera Branch `ACTIVE`; Station no forma parte del predicado.

### Identidad y sesiones

- La persona inicial usa el mismo Tenant User como identidad estable.
- Password y PIN son credenciales separadas.
- Admin Session y Operational Session son audiencias separadas y no se
  intercambian.
- Recovery administrativo usa email verificado y no cambia roles, scope ni
  lifecycle del User.

### Branch y Station

- Branch V1 pertenece al Tenant y tiene nombre, timezone IANA, estado,
  versión y timestamps.
- Branch/Station administration exige capabilities explícitas, nunca
  `isAdmin`.
- Enrollment usa challenge de alta entropía, un uso y TTL 10 minutos, con
  scope exacto Tenant/Branch y consume atómico.
- El equipo nuevo nunca elige Tenant/Branch ni convierte el challenge en
  credencial permanente.

### Auditoría

Cambios de lifecycle y autoridad conservan evidencia durable proporcional.
Passwords, PINs, verifiers, challenges, tokens, cookies y headers completos no
se registran.

## Compatibilidad con decisiones aceptadas

- **ADR-004:** preservada; no aparece otro límite organizacional ni
  “supertenant”.
- **ADR-010:** preservada para operación y completada en su contexto
  administrativo explícitamente diferido.
- **ADR-011/014:** preservadas; sólo gobiernan autenticación/sesión operativa.
- **ADR-012:** requiere la calificación parcial descrita; su modelo de
  autorización no se sustituye.
- **ADR-013:** aplica a acciones administrativas sensibles; niveles/factores
  concretos se deciden por Work Unit.
- **ADR-008:** no se acepta por efecto de este ADR; un slug/host continúa sin
  ser autoridad.

## Consecuencias positivas

- Rompe el ciclo primera Station ↔ primer Admin sin bypass local.
- Mantiene un único Tenant User y dos credenciales/sesiones con audiencias
  explícitas.
- Reutiliza Roles/capabilities y autorización negativa en ambos planos.
- Permite `admin.srtaller.com` en el despliegue actual sin hacer al host
  autoridad.
- Conserva intacto el login PIN y los módulos operativos existentes.

## Consecuencias negativas

- Añade otro tipo de credencial, Session, guard y superficie de ataque.
- Exige definir email cardinality, recovery, session policy y last-admin guard.
- La UI compartida debe impedir confundir navegación administrativa y
  operacional.
- Auditoría y revocación deben distinguir dos tipos de sesión.
- Los casos actuales que asumen contexto Station universal necesitan contratos
  separados, no parámetros opcionales ambiguos.

## Riesgos

| Riesgo | Respuesta propuesta |
|---|---|
| Admin Session reutilizada contra API operacional | audiencias/guards/cookies separados y pruebas negativas |
| Email resuelve Tenant incorrecto o enumera cuentas | regla de cardinalidad explícita, lookup server-side y respuestas uniformes |
| Autoelevación en bootstrap | bundle starter server-owned/versionado y transacción atómica |
| Último Admin perdido | invariant en commit y recovery aprobado antes de revocar |
| Challenge filtrado o replay | verifier, TTL 10 minutos, single-use y consume atómico |
| Branch/Station de otro Tenant | repositorios scoped, constraints y pruebas con dos Tenants |
| Auditoría filtra credenciales | allowlists y pruebas de redacción |

## Criterios para reconsiderar

- Una identidad necesita administrar varios Tenants.
- Se aprueba SSO, passkeys o MFA general.
- Administración se separa en otro despliegue/servicio.
- Se introduce Super Admin o soporte privilegiado.
- Billing/suspensión comercial modifica el Tenant lifecycle.
- Se aprueba operación offline o administración móvil con otro threat model.

## Preguntas abiertas

Las decisiones `TLD-001` a `TLD-009` del contrato relacionado permanecen
abiertas. ADR-015 no puede pasar a `Accepted` ni autorizar TL-02 mientras sean
materiales para su alcance.

## Referencias

- [Tenant Lifecycle MVP contract](../../architecture/TENANT_LIFECYCLE_MVP.md)
- [Tenant Lifecycle discovery](../../product/TENANT_LIFECYCLE_MVP_DISCOVERY.md)
- [ADR-004](ADR-004-shared-schema-multitenancy.md)
- [ADR-010](ADR-010-station-bound-operational-context.md)
- [ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md)
- [ADR-012](ADR-012-tenant-roles-capabilities-and-contextual-authorization.md)
- [ADR-013](ADR-013-sensitive-actions-and-reinforced-authorization.md)
- [ADR-014](ADR-014-concurrent-operational-sessions.md)
- [PBI-031](../../backlog/pbis/PBI-031.md)

## Próxima revisión

Owner Review de TL-01, después de decidir `TLD-001` a `TLD-009` o aceptar
explícitamente cuáles pueden resolverse dentro del Work Unit de implementación
correspondiente.
