# PBI-026 — Contextual Authorization Threat Model

## Boundary y clasificación

PBI-026 convierte contexto, identidad, Session y grants persistentes en una
decisión server-side por operación. La frontera protegida empieza en el HTTP
de Repairs y termina después de resolver el recurso/effect dentro del
Tenant/Branch efectivo.

**Riesgo:** `Critical`, preservado. Un bypass puede exponer o mutar datos entre
actores, Branches o Tenants. Es un riesgo ya anticipado por el `Identity Master
Goal`; un catálogo ampliado, ABAC, criptografía custom, persistencia nueva o
autoridad del cliente obligan a detenerse.

## Invariantes de autoridad

1. Station credential opaca -> verificación server-side -> Tenant/Branch.
2. Session bearer -> Session vigente para esa Station -> User activo.
3. Assignments/roles/capabilities se leen frescos y se intersectan con Branch.
4. El endpoint fija una capability exacta; el request no puede elegirla.
5. Repairs resuelve el recurso dentro del scope autorizado.
6. Cualquier ausencia, ambigüedad o dependencia fallida deniega antes de
   validación de negocio, idempotency recovery o efectos.

## Amenazas y controles

| Amenaza | Control | Evidencia requerida |
|---|---|---|
| Tenant/Branch/Station/User/role/capability/action falsificados | authority sólo desde Station/Session/Access y policy fija | direct HTTP/client-spoof negatives |
| Session tratada como autoridad universal | capability fresca y específica en cada operación | missing/wrong capability tests |
| nombre del role concede permisos | sólo catálogo/role-capability activo | role-name ignored test |
| grant stale tras revocación | consulta fresca, sin cache autoritativa | role/assignment/capability/User revocation |
| Station/PIN/Session revocados | revalidación del Session lifecycle existente | independent predicate negatives |
| assignment Branch de otro scope | filtro tenant/Branch y tenant-wide explícito | multi-tenant/multi-branch PostgreSQL |
| IDOR de Repair/evidence | lookup Repairs-owned dentro del scope; 404 uniforme | foreign/missing equivalence |
| `repairs.read` escala a write | matriz exacta y capability `repairs.add_note` | wrong-capability + zero-effect tests |
| D5/D6 sin capability quedan expuestos | `DENY_UNSUPPORTED` antes del use case y UI suprimida | direct-call/spies/database unchanged |
| ruta nueva sin enforcement | registro cerrado de endpoints + arquitectura/contract tests | omitted/unregistered route mutation |
| UI oculta como única defensa | servidor reevalúa todo; snapshot advisory estricto | tampered/malformed snapshot tests |
| actor anterior sobrevive logout/switch | snapshot se limpia y Session nueva se resuelve | logout/switch/reload UI contract |
| note CSRF/login-CSRF | same-origin, Fetch Metadata, JSON y double-submit | HTTP transport negatives |
| idempotency devuelve éxito tras revocación | autorización ocurre antes del replay lookup | revoke-then-replay test |
| outage deja pasar grant stale | no cache/fallback; error sanitizado y cero efectos | dependency-failure test |
| race authorize/revoke | commits previos se observan en la siguiente decisión; no se promete cancelar efecto ya linearizado | controlled concurrency evidence |
| tokens/contexto filtran por error o log | errores genéricos y no-store; nunca incluir cookie/bearer | contract/log scan |
| composición modular se elude | única arista `repairs -> access` pública y checker fail-closed | reverse/deep/private/ModuleRef/global mutations |
| actor sintético se confunde con audit real | PBI-026 no cambia persistencia de actor; límite explícito PBI-028 | documentation/source assertions |

## Semántica temporal y concurrencia

No existe cache de capabilities. Una revocación comprometida antes de comenzar
la siguiente decisión debe denegarla. Si un efecto autorizado lineariza antes
de que una revocación concurrente sea comprometida, ese efecto puede terminar;
PBI-026 no afirma cancelación transaccional retroactiva. Los writes conservan
expectedVersion/idempotency de Repairs y la autorización los precede.

## Error y anti-enumeración

- `401 AUTHENTICATION_REQUIRED`: Station/Session/User/PIN/admission inválida o
  ausente, sin detallar el predicado.
- `403 ACCESS_DENIED`: actor autenticado sin capability o proof de mutación
  inválida, sin exponer roles/grants.
- `404 REPAIR_NOT_FOUND`: Repair missing/foreign una vez autorizado.
- `404 REPAIR_EVIDENCE_NOT_FOUND`: evidence missing/foreign/unavailable una
  vez autorizado. En ambos endpoints, el código existente es uniforme dentro
  de su superficie y no confirma existencia fuera del scope.
- dependencia no disponible: fail-closed y respuesta sanitizada; nunca usar
  `LocalRepairContext` ni un snapshot cliente como fallback.

## Riesgos residuales

- Las capabilities proyectadas al navegador pueden quedar visualmente stale
  entre requests; son advisory y el enforcement fresh server-side limita el
  impacto.
- Las mutaciones D5/D6 quedan temporalmente inaccesibles desde producto hasta
  definir capabilities específicas; es una reducción intencional fail-closed.
- Operational Note conserva actor sintético persistido hasta PBI-028. PBI-026
  transporta contexto real internamente pero no declara G5/G8.
- No existe reautenticación reforzada, segundo aprobador, administración
  productiva, distributed invalidation o deploy.
