# Revisión formal de DEC-044 — Estrategia de errores

## 1. Título

Revisión formal multidisciplinaria de
[DEC-044 — Estrategia de errores](DECISION_PROPOSAL.md).

## 2. Fecha

2026-07-24.

## 3. Estado inicial

- **Estado canónico recibido:** `Ready for formal decision — Proposal Complete /
  Approval Pending`.
- **H0 recibido:** cinco decisiones cerradas y cuatro abiertas.
- **R0:** no autorizado.
- **Sprint 00:** abierto.
- **Materialización:** no iniciada ni autorizada.

## 4. Alcance

La revisión determina si DEC-044:

- establece una estrategia única de errores tipados por capa;
- conserva las fronteras de dominio, aplicación, infraestructura y API;
- ofrece un catálogo suficiente para R0 sin crear un módulo global omnisciente;
- define traducciones, contrato público, HTTP, logging y retry seguros;
- es compatible con DEC-005 y DEC-049;
- puede convertirse en gates ejecutables bajo DEC-051;
- puede aceptarse sin autorizar implementación.

No forman parte de esta revisión clases, resultados TypeScript, middleware,
filters, interceptors, endpoints, logging real, retries, dependencias, SQL,
base de datos, migraciones, checker, fixtures, CI, PBI técnico o despliegue.

## 5. Metodología

1. Se registraron rama, HEAD, `origin/main`, divergencia, índice y working tree.
2. Se preservó por SHA-256 el estado previo de todas las rutas modificadas o
   nuevas ajenas a esta tarea.
3. Se leyó DEC-044 y se contrastó con DEC-004, DEC-005, DEC-049, ADR-004,
   ADR-010 a ADR-013 y los contratos vigentes de persistencia, autorización,
   contexto, seguridad, observabilidad, calidad y operaciones.
4. Se revisaron los gates activos de H0, R0, Sprint 00, Repair MVP y los mapas
   de dependencias de DEC-051, DEC-063 y VC-024.
5. Se ejecutaron cinco perspectivas: Arquitectura, Ingeniería, Seguridad,
   Operaciones y Calidad.
6. Sólo se ajustaron dos precisiones normativas antes de resolver: la
   traducción semántica de `unique violation` a `BusinessRule` cuando
   corresponda y la exigencia de `exhaustive matching`.
7. Las condiciones se clasificaron como obligaciones futuras verificables, no
   como evidencia ya cumplida.

La escala de revisión es `PASS`, `PASS WITH CONDITIONS` o `FAIL`. Una
condición de materialización no bloquea la aceptación cuando el contrato ya es
coherente, seguro, implementable y comprobable.

## 6. Revisión de Arquitectura

**Resultado: PASS WITH CONDITIONS.**

- La Opción A conserva ownership local: dominio y aplicación poseen sus fallas
  semánticas; infraestructura traduce proveedores; presentación adapta al
  contrato HTTP.
- Dominio no conoce NestJS, HTTP, PostgreSQL, Kysely, `pg` ni logging.
- Aplicación no interpreta mensajes de drivers ni produce excepciones HTTP.
- Infraestructura captura fallas de proveedor y devuelve resultados estables
  a través de puertos.
- La API publica únicamente códigos allowlisted.
- El catálogo es normativo, no un paquete ejecutable transversal ni un
  `common/core` con conocimiento de todos los módulos.
- Los códigos específicos futuros pertenecen al módulo owner y conservan una
  categoría transversal estable.
- La traducción ocurre sólo cuando cambia ownership o significado; no se
  envuelven errores sin aportar semántica.
- La estrategia es compatible con las fronteras materializadas y verificadas
  de DEC-005.
- La traducción de persistencia conserva los adapters, puertos, transacciones y
  ownership definidos por DEC-049.
- Los módulos futuros pueden ampliar códigos bajo gobernanza sin ampliar de
  forma implícita las categorías ni el shared kernel.

Condiciones aplicables: DEC044-C01, DEC044-C02 y DEC044-C08.

No se encontró contradicción material de arquitectura.

## 7. Revisión de Ingeniería

**Resultado: PASS WITH CONDITIONS.**

- La estrategia es viable con Node.js `24.x`, TypeScript `6.0.3`, ESM/NodeNext,
  NestJS `11.x`, Kysely y `pg`.
- Las fallas esperadas cruzan casos de uso como resultados tipados.
- Las excepciones quedan reservadas para defectos, condiciones inesperadas o
  fallas de infraestructura capturadas en su frontera.
- Una falla inesperada se normaliza como `Unexpected` sólo en el borde
  exterior.
- El `exhaustive matching` debe hacer visible en compilación o pruebas toda
  categoría o variante no manejada.
- El `correlationId` se conserva al traducir, sin convertirse en identidad,
  autorización o dato sensible.
- Los mappings se basan en tipos, códigos y metadata estructurada, no en textos
  libres.
- Los retries son acotados, gobernados por aplicación y reinician la unidad
  transaccional completa cuando corresponde.
- La proliferación de clases/códigos se contiene con owner por módulo,
  categorías fijas, códigos registrados y contract tests.
- El contrato puede probarse por capa sin acoplar dominio a framework o
  persistencia.

Condiciones aplicables: DEC044-C01, DEC044-C02, DEC044-C03, DEC044-C04,
DEC044-C07 y DEC044-C08.

No se encontró una imposibilidad técnica ni una contradicción material.

## 8. Revisión de Seguridad

**Resultado: PASS WITH CONDITIONS.**

- Toda respuesta pública se construye desde una allowlist.
- Una denegación puede representarse como `404` cuando un `403` revelaría un
  recurso de otro tenant o sucursal.
- Recurso inexistente y recurso ajeno deben tener la misma forma, código,
  mensaje y ausencia de detalles cuando aplica anti-enumeración.
- El contrato nunca publica SQL, SQLSTATE, constraints, tablas, columnas,
  stacks, clases, paquetes, funciones o rutas locales.
- PIN, contraseñas, tokens, cookies, headers de autorización, API keys y
  secretos quedan prohibidos en responses y logs.
- `details` es opcional y allowlisted; por defecto sólo se permite para campos
  del contrato público de validación y nunca incluye valores recibidos.
- Identificadores de tenant, sucursal, usuario, estación o sesión sólo pueden
  aparecer en logging interno cuando ya fueron resueltos, son necesarios y
  están permitidos; nunca exponen contenido cross-tenant.
- Los flujos administrativos mantienen contexto, autorización, interfaz y
  auditoría separados; no obtienen un contrato público más revelador.
- `correlationId` facilita diagnóstico, pero no acredita identidad, scope o
  permiso.
- `Unexpected` publica únicamente `INTERNAL_ERROR`, mensaje genérico y
  correlación.

Condiciones aplicables: DEC044-C04, DEC044-C05, DEC044-C06 y DEC044-C08.

No se encontró filtración normativa ni mapeo materialmente inseguro.

## 9. Revisión de Operaciones

**Resultado: PASS WITH CONDITIONS.**

- La severidad ordinaria está definida por categoría y puede elevarse por
  impacto, agotamiento o patrón anómalo.
- El evento autoritativo de borde evita duplicar el mismo incidente en cada
  capa.
- Los logs conservan correlación, operación, duración, categoría, severidad,
  outcome e intento cuando esos datos existen.
- Deadlocks y fallas de serialización sólo admiten retry clasificado,
  idempotente, acotado y sobre la transacción completa.
- Un timeout con resultado de commit desconocido no admite retry ciego.
- `Configuration` que impide operar debe fallar startup/readiness; si ya hay
  request, se normaliza sin exponer configuración.
- Timeouts, indisponibilidad y respuestas inválidas de servicios externos
  conservan outcomes públicos estables.
- Soporte y administración usan contratos separados y correlacionables.
- La información es suficiente para diagnóstico sin SQL, credenciales,
  payloads completos ni PII innecesaria.

Condiciones aplicables: DEC044-C03, DEC044-C04, DEC044-C06, DEC044-C07 y
DEC044-C08.

No se encontró una política de retry que autorice efectos duplicados.

## 10. Revisión de Calidad

**Resultado: PASS WITH CONDITIONS.**

- La matriz cubre dominio, aplicación, infraestructura, PostgreSQL real, API,
  seguridad, logging, retry, servicios externos y arquitectura.
- Las traducciones entre capas y los mappings HTTP son deterministas y
  comprobables.
- La sanitización tiene casos negativos explícitos.
- Anti-enumeración exige comparar recurso inexistente y recurso ajeno.
- Persistencia real cubre unique, foreign key, `40001`, `40P01`, timeout,
  rollback y outcome desconocido.
- Retry e idempotencia incluyen agotamiento y ausencia de efectos duplicados.
- Logging prueba campos requeridos, allowlist, redacción, correlación y un solo
  evento autoritativo.
- Servicios externos cubren timeout, respuesta inválida e indisponibilidad.
- `Unexpected` siempre se sanitiza y conserva causa únicamente interna.
- Los límites arquitectónicos comprueban que dominio/aplicación no importen
  NestJS, Kysely, `pg` o PostgreSQL.
- Los criterios son suficientemente concretos para que DEC-051 defina runner,
  comandos, niveles y gates sin reinterpretar DEC-044.

Condiciones aplicables: DEC044-C02 a DEC044-C08.

El contrato es comprobable; la automatización permanece correctamente
pendiente de DEC-051.

## 11. Confirmación de estrategia

Queda confirmada la **Opción A — errores tipados por capa**:

1. Las fallas esperadas se representan mediante resultados tipados.
2. Las excepciones se reservan para fallas inesperadas o de infraestructura
   donde corresponda y se capturan en su frontera propietaria.
3. `Unexpected` se normaliza únicamente en el borde exterior.
4. Cada capa traduce sólo al cambiar ownership o semántica.
5. Los códigos públicos forman una allowlist.
6. No se autoriza un catálogo global ejecutable que concentre dominio,
   infraestructura y transporte.
7. La futura materialización debe usar `exhaustive matching`.

## 12. Catálogo

| Categoría | Confirmación para R0 |
| --- | --- |
| `Validation` | Entrada inválida antes de una regla dependiente de estado |
| `Authentication` | Identidad o sesión no válida |
| `Authorization` | Actor sin capacidad o alcance |
| `BusinessRule` | Regla o invariante funcional rechazada |
| `NotFound` | Recurso no visible o inexistente dentro del scope |
| `Conflict` | Colisión estable con estado o intención vigente |
| `Concurrency` | Versión stale o contención transitoria |
| `Persistence` | Falla técnica interna de persistencia |
| `ExternalService` | Timeout, indisponibilidad o respuesta inválida externa |
| `Infrastructure` | Recurso técnico interno no disponible |
| `Configuration` | Configuración ausente o incoherente |
| `Unexpected` | Defecto o causa no clasificada de forma segura |

Las doce categorías son suficientes para R0. Una ampliación requiere owner,
justificación, compatibilidad, exposición segura, mapeo y pruebas. Añadir
códigos específicos dentro de una categoría tampoco elimina la obligación de
registro y gobierno de DEC044-C01.

## 13. Contrato público

El contrato aprobado conserva:

```json
{
  "error": {
    "code": "RESOURCE_CONFLICT",
    "category": "Conflict",
    "message": "La operación entra en conflicto con el estado actual.",
    "correlationId": "01J...",
    "details": [
      {
        "field": "publicField",
        "code": "INVALID"
      }
    ]
  }
}
```

- `code`, `category`, `message` y `correlationId` son obligatorios.
- `details` es opcional y allowlisted.
- Los clientes dependen de `code`, categoría y HTTP, no del texto.
- Quedan prohibidos SQL, SQLSTATE, constraints, stack traces, clases internas,
  rutas locales, secretos, PIN, tokens, payloads completos e información
  cross-tenant.

## 14. HTTP

Los status pertenecen únicamente al borde API:

| Categoría | HTTP aprobado |
| --- | --- |
| `Validation` | `400` |
| `Authentication` | `401` |
| `Authorization` | `403`, o `404` por anti-enumeración |
| `BusinessRule` | `422` |
| `NotFound` | `404` |
| `Conflict` | `409` |
| `Concurrency` | `409`, o `503` al agotarse una falla transitoria |
| `Persistence` | Traducción semántica; fallback `500` |
| `ExternalService` | `502`, `503` o `504` según causa |
| `Infrastructure` | `500` o `503` |
| `Configuration` | Falla de readiness; `500/503` si ya existe request |
| `Unexpected` | `500` |

Dominio y aplicación no conocen códigos HTTP.

## 15. Persistencia

La traducción aprobada es coherente con DEC-049:

| Señal | Traducción |
| --- | --- |
| Unique violation (`23505`) | `Conflict`, `BusinessRule` o idempotencia verificada según operación y semántica conocidas |
| Foreign key (`23503`) | `Validation`, `NotFound` o `BusinessRule` según operación |
| Serialization failure (`40001`) | `Concurrency` transitoria |
| Deadlock (`40P01`) | `Concurrency` transitoria |
| Timeout/cancelación | `Persistence` o `Infrastructure` estable, distinguiendo outcome conocido/desconocido |
| Causa desconocida | Código interno sanitizado y `Unexpected` en el borde |

El adapter usa código y metadata estructurada. PostgreSQL, Kysely y `pg` nunca
cruzan el puerto ni aparecen en la respuesta. Una unique violation sólo puede
resolverse como idempotencia satisfecha después de verificar la misma clave y
el resultado autoritativo.

## 16. Retry

- Sólo aplica a fallas transitorias clasificadas.
- La política debe ser acotada por intentos, tiempo y deadline.
- La operación debe ser idempotente o estar protegida por una clave efectiva.
- Serialización y deadlock pueden reintentar la transacción completa.
- No se reintenta ciegamente un timeout con outcome desconocido.
- No se reintentan validación, autenticación, autorización ni reglas de
  negocio.
- Se registra intento, límite y outcome sin duplicar efectos.
- Al agotarse, se devuelve una falla estable y sanitizada.

## 17. Logging

Puede incluir, cuando ya estén resueltos y sean necesarios:

- tenant, sucursal, usuario, estación y sesión como identificadores opacos;
- operación, correlación, duración, categoría, severidad y outcome;
- intento y alias allowlisted de dependencia o componente.

Debe excluir:

- PIN, contraseñas, tokens, cookies, API keys y secretos;
- SQL con o sin valores, SQLSTATE y nombres físicos;
- payloads completos y respuestas completas de proveedores;
- PII innecesaria e información cross-tenant.

Un stack sólo puede conservarse internamente para diagnóstico restringido de
`Unexpected`; nunca se publica al cliente.

## 18. Testing

La cobertura futura obligatoria incluye:

- dominio: reglas, invariantes, transiciones y versión stale;
- aplicación: traducción, autorización, anti-enumeración y efectos parciales;
- infraestructura: mappings conocidos/desconocidos y errores externos;
- PostgreSQL real: unique, FK, `40001`, `40P01`, timeout y rollback;
- API: envelope, HTTP, allowlist, correlación y ausencia de internals;
- seguridad: sanitización, aislamiento y equivalencia inexistente/ajeno;
- logging: allowlist, redacción, severidad y evento autoritativo;
- retry/idempotencia: límites, agotamiento, outcome y ausencia de duplicados;
- servicios externos: timeout, invalid response e indisponibilidad;
- `Unexpected`: respuesta genérica y causa sólo interna;
- arquitectura: imports y fronteras de DEC-005/049.

DEC-051 debe convertir estos contratos en suites y gates ejecutables.

## 19. Condiciones DEC044-C01–C08

Las condiciones son aceptadas junto con DEC-044, pero permanecen
**pendientes**. Ninguna constituye evidencia ya producida.

| ID | Condición verificable | Owner | Momento de cumplimiento | Evidencia esperada | Dependencia | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| DEC044-C01 | Definir códigos públicos iniciales y ownership sin crear catálogo global omnisciente | Arquitectura + owners de módulo; revisión Seguridad/Calidad | Antes de publicar el primer código funcional | Registro de código, categoría, owner, exposición, HTTP, compatibilidad y contract tests | Futura materialización autorizada | Pendiente |
| DEC044-C02 | Materializar resultados tipados para fallas esperadas y `exhaustive matching` | Ingeniería + Arquitectura + Calidad | Antes del primer caso de uso funcional | Typecheck y tests que fallen ante variantes no manejadas; dominio/aplicación sin errores HTTP/driver | DEC-051 y futura materialización | Pendiente |
| DEC044-C03 | Implementar y probar traducciones PostgreSQL/Kysely conforme a DEC-049 | Ingeniería + Calidad + Seguridad | Antes del primer endpoint o job persistente | PostgreSQL real; unique, FK, `40001`, `40P01`, timeout, causa desconocida y ausencia de internals | DEC-049, DEC049-C03/C06 y DEC-051 | Pendiente |
| DEC044-C04 | Implementar un único adaptador o filter de borde con sanitización y mapeo normativo | Ingeniería + Seguridad + Calidad | Antes del primer endpoint funcional | Contract tests del envelope, allowlists, HTTP, correlación y fallback `Unexpected` | NestJS/REST aceptados y DEC-051 | Pendiente |
| DEC044-C05 | Probar explícitamente los casos donde `Authorization` se representa como `404` | Seguridad + Calidad + owner de módulo | Antes de exponer recursos tenant/sucursal | Pruebas equivalentes de ID inexistente/ajeno, forma y ausencia de efectos o canales de enumeración | ADR-004/010/012/013 y DEC-051 | Pendiente |
| DEC044-C06 | Probar allowlist, redacción y ausencia de secretos o PII innecesaria en logging | Seguridad + Operaciones + Calidad | Antes del primer recorrido funcional observable | Casos positivos/negativos de campos, un evento autoritativo y correlación sin PIN/token/SQL/payload | DEC-045 a DEC-048 y DEC-051 | Pendiente |
| DEC044-C07 | Implementar políticas acotadas y probar idempotencia y outcome conocido/desconocido | Ingeniería + Operaciones + Calidad | Antes de habilitar cualquier retry automático | Límites, deadline, backoff, transacción completa, agotamiento y ausencia de efectos duplicados | DEC-049, DEC-051 y caso de uso owner | Pendiente |
| DEC044-C08 | Convertir contratos críticos de DEC-044 en gates ejecutables | Calidad + Arquitectura + Seguridad | Durante DEC-051 y antes del primer cambio funcional de R0 | Suites/gates para catálogo, capas, API, sanitización, persistencia, logging, retry y anti-enumeración | DEC-051 | Pendiente |

## 20. Riesgos residuales

| Riesgo | Estado |
| --- | --- |
| Proliferación de códigos o clases | Gobernado por C01/C02; no demostrado hasta materialización |
| Catálogo convertido en módulo global | Prohibido por estrategia; requiere enforcement C08 |
| Mapping incompleto o por texto de driver | Gobernado por C03; evidencia pendiente |
| Filtración en envelope o `details` | Gobernada por C04/C05; evidencia pendiente |
| Enumeración por status, forma o timing | Gobernada por C05; evidencia pendiente |
| Secretos o PII en logs | Gobernado por C06; evidencia pendiente |
| Retry duplica efectos | Gobernado por C07; evidencia pendiente |
| Contratos no ejecutados como gates | Gobernado por C08/DEC-051 |
| `Unexpected` usado para fallas conocidas | Review y registro de códigos; evidencia futura |

Los riesgos no invalidan la decisión. Bloquean el hito de materialización
indicado por cada condición.

## 21. Decisiones diferidas

- clases, interfaces, nombres y ubicación física;
- librería concreta de resultados y validación;
- filter, interceptor o adapter NestJS;
- librería, sink, retención y acceso de logging;
- OpenTelemetry, Sentry, Datadog, métricas y tracing distribuido;
- timeouts, intentos, backoff y jitter concretos;
- circuit breaker y su librería;
- catálogo funcional específico de módulos aún no implementados;
- runner, CI, comandos y umbrales de DEC-051;
- Definition of Done de DEC-063.

Estas decisiones no pueden redefinir categorías, sanitización,
anti-enumeración o retry sin una revisión formal de DEC-044.

## 22. Autoridad

La autoridad de esta tarea atribuye las cinco resoluciones al **Responsable del
Proyecto**, con fecha **2026-07-24**. No se registran nombres de terceros,
firmas, cargos externos ni aprobaciones históricas.

| Función | Resolución explícita |
| --- | --- |
| Seguridad | **Conforme con el contrato y las condiciones verificables.** |
| Operaciones | **Conforme con el contrato y las condiciones verificables.** |
| Calidad | **Conforme con el contrato y las condiciones verificables.** |
| Arquitectura | **Aprueba la estrategia y acepta sus condiciones.** |
| Ingeniería | **Aprueba la estrategia y acepta sus condiciones.** |

Las resoluciones aceptan DEC044-C01 a DEC044-C08 como obligaciones pendientes.
No autorizan su materialización ni afirman que alguna esté cumplida.

## 23. Resultado global

**PASS WITH CONDITIONS.**

Las cinco disciplinas obtienen `PASS WITH CONDITIONS`. No existe contradicción
material con DEC-005 o DEC-049, filtración normativa, mapeo HTTP inseguro,
retry que autorice duplicación, acoplamiento del dominio a infraestructura ni
ambigüedad que impida a DEC-051 convertir el contrato en gates.

Con la autoridad explícita de la sección 22, la resolución final es:

**Accepted.**

La aceptación es arquitectónica. No constituye implementación, evidencia de
materialización, autorización de R0 ni cierre de Sprint 00.

## 24. Estado final

- **Estado anterior:** `Ready for formal decision — Proposal Complete /
  Approval Pending`.
- **Estado final:** `Accepted`.
- **Fecha de aceptación:** 2026-07-24.
- **Autoridad:** Responsable del Proyecto.
- **Revisiones:** Arquitectura, Ingeniería, Seguridad, Operaciones y Calidad:
  `PASS WITH CONDITIONS`.
- **Condiciones:** DEC044-C01 a DEC044-C08 aceptadas, vigentes y pendientes.
- **Referencia autoritativa:** [DECISION_PROPOSAL.md](DECISION_PROPOSAL.md).

## 25. Impacto en H0

- Estado anterior: cinco decisiones H0 cerradas y cuatro abiertas.
- Estado final: **seis decisiones H0 cerradas y tres abiertas**.
- Los tres remanentes son la evidencia final de DEC-004, DEC-051 y DEC-063.
- DEC-044 queda cerrada como decisión para H0; sus condiciones siguen
  bloqueando únicamente los hitos de materialización que indican.

## 26. Impacto en R0

R0 permanece **no autorizado**. La aceptación de DEC-044 no autoriza código
funcional, PBI técnico, merge, release ni despliegue.

VC-024 de DEC-004 continúa esperando la evidencia de CI gobernada por DEC-051.

## 27. Impacto en Sprint 00

Sprint 00 permanece **abierto**. La aceptación registra avance de gobierno,
pero no satisface por inferencia sus aprobaciones, revisión o demás criterios
de cierre.

## 28. Siguiente acción

El siguiente gate concreto de R0 es **DEC-051 — Estrategia de pruebas**:

- debe convertir DEC044-C08 y los contratos críticos de DEC-044/049 en gates;
- debe definir runner, suites, niveles, integración PostgreSQL, aislamiento,
  seguridad, arquitectura, CI y política de flakiness;
- no queda resuelta ni aceptada por esta revisión.

Después de DEC-051 continúa DEC-063. VC-024 de DEC-004 mantiene su dependencia
de evidencia sobre el gate de CI. No se crea PBI técnico en esta tarea.
