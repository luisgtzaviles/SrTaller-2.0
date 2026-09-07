# PBI-033 — Roles, Assignments and Capability Catalog Threat Model

## Estado del documento

- **Estado:** Threat model High completo para el candidate PBI-033.
- **Autoridad:** ADR-012, DEC-063 y Master Goal Owner de Identity.
- **Entorno:** local/test y candidate; sin deploy o infraestructura remota.

## Boundary

PBI-033 materializa grants persistentes; no emite un veredicto final de
autorización. La autoridad del modelo reside en capability codes y assignments
resueltos server-side para un Tenant/User/Branch explícitamente scoped. Labels
de rol, payloads del cliente, visibilidad de UI, fixtures y una sesión futura
no pueden conceder capabilities.

**Clasificación:** High por afectar auth, tenant/branch isolation,
persistencia y migraciones. El Master Goal autoriza High dentro de este stack.
No se identificó un riesgo CRITICAL nuevo ni criptografía, secretos o
infraestructura remota necesarios para el slice.

## Threats and controls

| Threat | Control | Required evidence |
|---|---|---|
| Escalamiento cross-tenant | Tenant en roles/assignments y referencias compuestas; queries siempre tenant-scoped | PostgreSQL negativos con al menos dos Tenants |
| Restricción de Branch omitida | Scope discriminado; Branch del mismo Tenant; resolver sólo incluye la Branch efectiva | pruebas de otra Branch y movilidad tenant-wide |
| Nombre de rol usado como autoridad | Sólo capability codes componen grants; labels permanecen metadata | pruebas con nombres mutados/homónimos |
| Cliente inventa roles/capabilities | No hay controller/editor productivo; inputs internos estrictos y resolver server-side | architecture/contract tests y revisión de superficie |
| User, Role o Branch cross-tenant/inexistente | FKs compuestas impiden referencias fuera del Tenant; el rol debe estar activo para aportar grants | PostgreSQL de referencias, aislamiento y estados de rol |
| Grant de un User no activo se confunde con autorización | Access sólo proyecta grants; PBI-026 debe componerlos con el estado vigente del User y denegar antes de efectos | integración negativa de User inactivo/revocado en PBI-026 |
| Branch inactiva o no confiable se usa como contexto | Access no establece contexto; PBI-024 entrega únicamente `TrustedStationContext` activo y PBI-026 exige ese contexto | integración negativa de Station/Branch en PBI-026 |
| Rol deshabilitado/archivado aporta acceso | Resolver filtra roles no activos | pruebas negativas de estado |
| Revocación stale o perdida | `expectedVersion`, update CAS, historial durable y revalidación en cada resolución | concurrencia y stale-write tests |
| Replay divergente | journal por `tenantId + clientRequestId` con comparación de intent | idempotencia same-intent y conflict tests |
| Asignación duplicada | constraints de unicidad por scope y traducción de conflicto | race de assignments equivalentes |
| Efecto parcial | comando y journal dentro de transacción gobernada | rollback/error integration tests |
| Catálogo sobredimensionado | allowlist cerrada de cuatro capabilities | contrato exacto y migration manifest |
| Fixture se convierte en bootstrap productivo | seed sólo local/test, determinista y secret-free; sin endpoint | local-development contract y production exclusion |
| PBI-033 se interpreta como enforcement | resolver publica grants; PBI-026 conserva decisión deny-by-default sobre operación/recurso/sesión | revisión de límites y ausencia de guard productivo prematuro |

## Starter-role boundary

`Administrador`, `Atención al cliente` y `Técnico` son configuración inicial
del Tenant. No son enums ni shortcuts de autorización. Pueden tener nombres
homónimos entre Tenants sin compartir IDs, assignments o autoridad. La
composición inicial sólo utiliza capabilities ya necesarias para el checkpoint
y no promete un catálogo futuro.

## Residual risks

- La administración productiva de roles/assignments puede ser sensible; queda
  sin superficie hasta clasificar control reforzado en PBI-035.
- PBI-026 debe combinar estos grants con Station, Branch, Session, estado de
  User y pertenencia del recurso antes de permitir una operación. Por diseño,
  el projection de grants no consulta tablas ajenas de Users o Stations y no
  debe exponerse como veredicto de elegibilidad/autorización.
- PBI-028 decidirá la auditoría/correlación de negocio completa. El journal de
  comandos de este PBI sólo conserva idempotencia e historia de assignment.
- No existe cache de capabilities; la lectura directa preserva el efecto de
  revocación para la siguiente resolución dentro de este alcance.

Estos límites son explícitos y no bloquean el candidate local. No autorizan
release, deploy ni exposición de administración antes de los PBIs posteriores.

## Próxima revisión

Focused high-risk review PASS sobre el candidate exacto
`bb5a1efde19171703d0b3ce84567ff14538b32b7`. Reabrir el modelo si se agrega
superficie HTTP/UI, un nuevo capability, cache, secreto, control reforzado o
riesgo CRITICAL.
