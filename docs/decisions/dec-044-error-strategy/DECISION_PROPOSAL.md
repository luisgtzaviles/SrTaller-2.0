# DEC-044 — Estrategia de errores

## 1. Identidad y estado

| Campo | Valor |
| --- | --- |
| Identificador | `DEC-044` |
| Título | Estrategia de errores |
| Tipo | Decisión técnica complementaria |
| Estado | **Accepted** |
| Estado anterior | `Ready for formal decision — Proposal Complete / Approval Pending` |
| Fecha de consolidación | 2026-07-24 |
| Fecha de aceptación | 2026-07-24 |
| Autoridad | Responsable del Proyecto |
| Resultado de revisión | Arquitectura, Ingeniería, Seguridad, Operaciones y Calidad: `PASS WITH CONDITIONS` |
| Condiciones | DEC044-C01 a DEC044-C08 aceptadas, vigentes y pendientes |
| Revisión formal | [FORMAL_REVIEW.md](FORMAL_REVIEW.md) |
| Participación de Producto | Sólo si la revisión cambia semántica visible, alcance o resultados de negocio |
| Hito | H0, antes del primer recorrido funcional de R0 |

El Responsable del Proyecto aceptó DEC-044 el 2026-07-24 después de cinco
revisiones `PASS WITH CONDITIONS`. La aceptación es arquitectónica: no
autoriza implementación, no acredita materialización de DEC044-C01 a C08 y no
cierra R0 ni Sprint 00.

## 2. Contexto

Las decisiones aceptadas ya fijan las fronteras que debe respetar el manejo de
errores:

- [ADR-001](../proposed/ADR-001-typescript-as-primary-language.md) exige
  TypeScript, Node.js `24.x` y validación en runtime de toda entrada no
  confiable;
- [ADR-002](../proposed/ADR-002-modular-monolith-first.md) separa dominio,
  aplicación e infraestructura dentro del monolito modular;
- [ADR-003](../proposed/ADR-003-postgresql-primary-database.md) acepta
  PostgreSQL como autoridad de integridad estructural;
- [ADR-004](../proposed/ADR-004-shared-schema-multitenancy.md) exige aislamiento
  por tenant/sucursal, denegación cerrada y ausencia de enumeración;
- [ADR-005](../proposed/ADR-005-nestjs-backend.md) acepta NestJS como shell
  exterior, REST/HTTP JSON como interfaz inicial y adaptación segura en el
  transporte;
- [ADR-010](../proposed/ADR-010-station-bound-operational-context.md),
  [ADR-011](../proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md),
  [ADR-012](../proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md)
  y
  [ADR-013](../proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md)
  fijan contexto, autenticación, autorización y control reforzado;
- [DEC-005](../dec-005-modular-monolith-organization/DECISION_PROPOSAL.md)
  ubica los errores de dominio/aplicación en su capa propietaria, el mapeo HTTP
  en presentación y el logging técnico transversal en infraestructura;
- [DEC-049](../dec-049-persistence-ownership/DECISION_PROPOSAL.md) acepta
  Kysely + `pg`, prohíbe que errores del driver salgan del adaptador y condiciona
  su materialización a traducción y observabilidad sanitizadas.

La [arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
ya exige respuestas externas estables. La
[línea base de seguridad](../../architecture/SECURITY_BASELINE.md) prohíbe
filtrar stack traces, SQL, secretos o existencia ajena. La
[estrategia de observabilidad](../../architecture/OBSERVABILITY_STRATEGY.md)
distingue logs técnicos de auditoría autoritativa.

DEC-044 convierte esas obligaciones en un contrato único y verificable. No
selecciona librerías ni materializa filtros, excepciones, middleware o
endpoints.

## 3. Problema

Sin una estrategia transversal:

- el dominio puede terminar expresando HTTP o excepciones NestJS;
- los controllers pueden interpretar mensajes libres;
- los adapters pueden filtrar errores de PostgreSQL, Kysely, `pg` o SDKs;
- una misma causa puede recibir códigos incompatibles según el endpoint;
- los reintentos pueden duplicar efectos o agravar una falla;
- una denegación puede revelar que existe un recurso de otro tenant;
- logs repetidos por cada capa pueden perder correlación o exponer secretos;
- las pruebas pueden validar sólo casos felices sin comprobar sanitización,
  retryability y ausencia de enumeración.

La decisión debe preservar semántica útil entre capas sin convertir el catálogo
en un objeto global con conocimiento de dominio, transporte y proveedores.

## 4. Drivers

1. Dominio y aplicación independientes de NestJS, HTTP y PostgreSQL.
2. Respuestas REST/JSON estables, útiles y seguras.
3. Aislamiento multitenant y anti-enumeración por defecto.
4. Causas técnicas preservadas internamente para diagnóstico.
5. Reintentos explícitos, acotados e idempotentes.
6. Consistencia entre validación, autenticación, autorización y reglas de
   negocio.
7. Compatibilidad con Kysely + `pg` y constraints PostgreSQL.
8. Logging estructurado sin secretos ni payloads innecesarios.
9. Pruebas deterministas por capa y contra PostgreSQL real cuando aplique.
10. Simplicidad para un equipo pequeño y extensibilidad sin un `Error` genérico
    universal.

## 5. Alcance y límites

DEC-044 decide:

- categorías, ownership, origen y fronteras de traducción;
- representación conceptual de fallas esperadas y fallas inesperadas;
- catálogo mínimo de códigos estables;
- contrato público REST/JSON;
- mapeo HTTP;
- sanitización y anti-enumeración;
- campos mínimos y prohibidos de logging;
- clasificación de retryability;
- traducción de persistencia y servicios externos;
- representación de reglas e invariantes de dominio;
- matriz mínima de pruebas;
- evolución compatible del catálogo.

DEC-044 no decide ni autoriza:

- clases, excepciones, middleware, filtros, interceptores o endpoints;
- una librería de resultados, validación o logging;
- OpenTelemetry, Sentry, Datadog, tracing distribuido o métricas;
- sinks, acceso, retención o alertas de logs;
- auditoría de negocio o su atomicidad;
- valores concretos de timeout, backoff, jitter o circuit breaker;
- SQL, tablas, migraciones, constraints o dependencias;
- localización definitiva de mensajes;
- implementación funcional o un PBI.

## 6. Opciones consideradas

### Opción A — Errores tipados por capa

Cada capa posee sus fallas semánticas, traduce únicamente al cruzar una frontera
y comparte un vocabulario transversal mínimo. Dominio no conoce transporte;
infraestructura encapsula proveedores; presentación publica un contrato
allowlisted.

Beneficios:

- conserva ownership y dirección de dependencias;
- permite que una misma causa técnica tenga significado distinto por operación;
- evita dependencias de NestJS/PostgreSQL en dominio y aplicación;
- hace explícitas traducción, sanitización y retryability.

Costos:

- requiere mappers y contract tests;
- puede proliferar tipos si no se gobiernan códigos y responsabilidades;
- exige distinguir fallas esperadas de defectos inesperados.

### Opción B — Errores tipados únicamente por dominio

El dominio define todos los errores y las demás capas los reutilizan.

Beneficios:

- vocabulario aparentemente uniforme;
- pocas traducciones para reglas puramente funcionales.

Costos y riesgos:

- fuerza al dominio a representar timeouts, drivers, HTTP y configuración;
- confunde fallas técnicas con invariantes;
- dificulta que infraestructura preserve causas sin contaminar el núcleo;
- contradice el ownership por capa de DEC-005.

### Opción C — Catálogo central de errores

Un catálogo o jerarquía global contiene todos los códigos y mapeos.

Beneficios:

- descubrimiento y consistencia inicial sencillos;
- un único lugar para códigos públicos.

Costos y riesgos:

- crea un `common/core` transversal con conocimiento de todos los módulos;
- puede convertirse en dependencia obligatoria de dominio, infraestructura y
  transporte;
- concentra cambios no relacionados y favorece un error genérico con metadata
  libre;
- contradice el shared kernel mínimo de DEC-005 si se materializa como
  implementación global.

## 7. Comparativa

Escala: 1 desfavorable, 3 suficiente, 5 favorable para R0.

| Criterio | A — por capa | B — sólo dominio | C — central |
| --- | ---: | ---: | ---: |
| Independencia dominio/transporte | 5 | 2 | 2 |
| Encapsulación de proveedores | 5 | 1 | 3 |
| Ownership modular | 5 | 3 | 1 |
| Consistencia pública | 4 | 3 | 5 |
| Traducción contextual por operación | 5 | 2 | 3 |
| Compatibilidad DEC-005 | 5 | 2 | 1 |
| Compatibilidad DEC-049 | 5 | 1 | 3 |
| Testabilidad | 5 | 3 | 4 |
| Riesgo de acoplamiento global | 4 | 3 | 1 |
| Simplicidad inicial | 3 | 4 | 4 |
| **Total** | **46/50** | **24/50** | **27/50** |

## 8. Decisión recomendada

Se recomienda la **Opción A — errores tipados por capa**, con estas precisiones
normativas:

1. Toda falla esperada DEBE tener categoría y código estable; no se identifica
   por texto libre.
2. Las fallas esperadas de dominio/aplicación DEBEN cruzar el límite del caso
   de uso como resultados tipados, no como `HttpException`, error de driver ni
   mensaje interpretado.
3. Una excepción inesperada representa un defecto o una condición no
   clasificada. El borde exterior DEBE normalizarla como `Unexpected`.
4. Cada adapter DEBE capturar y traducir errores de su proveedor antes de
   devolver el control hacia aplicación.
5. Cada capa traduce sólo cuando cambia ownership o semántica. NO DEBE volver a
   envolver una falla sin aportar categoría, código o contexto permitido.
6. La causa técnica PUEDE preservarse internamente para diagnóstico, pero NO
   forma parte de contratos de dominio, aplicación o cliente.
7. El catálogo de este documento es un registro normativo, no autoriza una
   clase, paquete o módulo global.
8. Los códigos públicos son una allowlist. Un código interno no se vuelve
   público por existir.
9. La futura materialización DEBE usar `exhaustive matching` en toda frontera
   que traduzca resultados tipados, de modo que una variante nueva no pueda
   omitirse silenciosamente.

Esta estrategia es única: ownership local, traducción en fronteras y
publicación allowlisted. No combina una jerarquía global de runtime con tipos
locales.

## 9. Contratos normativos

Las palabras DEBE, NO DEBE y PUEDE son normativas.

### 9.1 Representación conceptual interna

Una falla esperada debe poder expresar conceptualmente:

| Campo | Regla |
| --- | --- |
| Categoría | Una de las categorías de la sección 10 |
| Código | Estable, machine-readable y propiedad de la capa/módulo |
| Retryability | `never`, `conditional` o `transient` |
| Mensaje interno | Diagnóstico sanitizado; nunca es contrato público |
| Metadata | Allowlist tipada; sin payloads, secretos o valores arbitrarios |
| Causa | Sólo interna, no serializable hacia el cliente |

El mecanismo concreto puede definirse durante una implementación autorizada,
pero debe conservar esta semántica y las fronteras de DEC-005.

### 9.2 Flujo entre capas

```text
Proveedor / driver / infraestructura
                ↓ traducción en adapter
Resultado técnico estable del puerto
                ↓ traducción por caso de uso cuando cambia la semántica
Resultado de aplicación
                ↓ allowlist y mapeo en presentación
Respuesta API REST/JSON
                ↓
Cliente
```

Reglas:

- dominio NO DEBE importar NestJS, HTTP, Kysely, `pg`, PostgreSQL, logger o
  SDKs;
- aplicación NO DEBE importar excepciones NestJS, driver, SQL o SDKs;
- infraestructura NO DEBE devolver errores crudos de proveedor;
- presentación NO DEBE interpretar mensajes del driver ni consultar
  persistencia para decidir el error;
- controllers sólo adaptan un resultado ya clasificado;
- ninguna respuesta pública incluye causa, stack, SQLSTATE o metadata interna;
- una falla desconocida en cualquier frontera se normaliza como `Unexpected`;
- la traducción conserva `correlationId` sin usarlo como identidad o permiso.

### 9.3 Expected frente a unexpected

| Clase | Ejemplos | Tratamiento |
| --- | --- | --- |
| Falla esperada | validación, denegación, regla, ausencia, conflicto, timeout clasificado | Resultado tipado, mapeo determinista y prueba contractual |
| Falla inesperada | defecto, estado imposible no clasificado, excepción de librería no reconocida | Captura exterior, `Unexpected`, `500`, log `error` y correlación |

No se permite convertir todo en `Unexpected` para evitar modelar casos
esperados, ni convertir una excepción desconocida en `Validation` o
`BusinessRule` por comparación de texto.

## 10. Catálogo mínimo

| Categoría | Propósito | Owner | Capa donde nace | Dónde puede traducirse | Exposición al cliente | Logging |
| --- | --- | --- | --- | --- | --- | --- |
| `Validation` | Entrada estructural o semánticamente inválida antes de evaluar una regla dependiente de estado | Owner del contrato de entrada y del caso de uso | Presentación para forma; aplicación para input confiable | Presentación → código público de validación | Sí; campos/códigos allowlisted, nunca valores recibidos | `info`; `warn` sólo ante abuso/patrón, con sampling |
| `Authentication` | No existe una identidad/sesión válida para continuar | Módulo `access` | Borde técnico y aplicación conforme a ADR-011 | Aplicación puede normalizar causas; presentación publica resultado genérico | Sí, sin distinguir PIN, usuario, sesión o estación inexistente | `warn`; evento de seguridad según política, sin credencial |
| `Authorization` | Actor autenticado carece de capacidad, alcance o control requerido | Módulo/caso de uso owner con política de `access` | Aplicación | Presentación puede normalizar a `NotFound` por anti-enumeración | Sí, genérica; nunca revela capacidades internas ni recurso ajeno | `warn`; operación, alcance y resultado permitidos, no contenido |
| `BusinessRule` | Una regla o invariante funcional rechaza una intención válida | Módulo de dominio owner | Dominio o aplicación | Aplicación estabiliza el código; presentación asigna HTTP | Sí cuando la regla puede comunicarse de forma segura | `info`; código estable y operación, sin estado completo |
| `NotFound` | Un recurso visible dentro del scope permitido no existe, o debe parecer inexistente por seguridad | Caso de uso owner | Aplicación; repositorio devuelve ausencia como resultado, no error crudo | Presentación aplica anti-enumeración | Sí, mensaje uniforme | `info` o `debug`; `warn` si hay patrón de enumeración |
| `Conflict` | La intención choca con estado vigente, unique funcional o idempotencia | Caso de uso owner | Dominio/aplicación; infraestructura sólo detecta señal | Adapter → aplicación → presentación | Sí, mediante código de negocio estable | `info`/`warn` según impacto; no constraint físico |
| `Concurrency` | Versión stale, serialización o deadlock impiden completar de forma segura | Aplicación posee política; infraestructura detecta causa | Dominio para versión; adapter para señal transitoria | Adapter clasifica; aplicación decide retry o resultado | Sí como conflicto o indisponibilidad, nunca como detalle DB | `warn`; intento, duración y outcome, sin SQL |
| `Persistence` | Falla técnica de acceso, mapping o integridad no traducida aún a semántica superior | Infraestructura del módulo owner conforme a DEC-049 | Adapter Kysely/`pg` | Adapter DEBE traducir causas conocidas; aplicación no recibe driver | No como categoría técnica; se normaliza a categoría pública segura | `error`; operación estable, clase técnica allowlisted y correlación |
| `ExternalService` | Timeout, indisponibilidad o respuesta inválida de una dependencia externa | Adapter de integración del módulo owner | Infraestructura/integración | Adapter → aplicación; presentación publica dependencia genérica | Sí, sin proveedor, URL, payload o credencial | `warn`/`error`; dependencia por alias, duración, intento y outcome |
| `Infrastructure` | Recurso técnico interno no disponible o degradado fuera de persistencia | Infraestructura de aplicación | Infraestructura | Aplicación recibe resultado estable; presentación normaliza | Sólo como indisponibilidad o error interno genérico | `error`; componente por alias y estado permitido |
| `Configuration` | Configuración ausente, inválida o incoherente impide operar con seguridad | Infraestructura de configuración + Operaciones | Startup/readiness; excepcionalmente runtime | Debe fallar startup/readiness; borde normaliza si ya atiende tráfico | No revela claves/valores; `500/503` genérico si existe request | `fatal` en startup o `error` en runtime, con nombre lógico allowlisted |
| `Unexpected` | Defecto o causa no clasificada de forma segura | Owner del componente que falla; gobierno transversal de Arquitectura | Cualquier capa | Sólo el borde exterior publica; no se recategoriza por mensaje | Sí únicamente como `INTERNAL_ERROR` genérico | `error`/`fatal`; stack interno controlado y correlación, nunca al cliente |

### 10.1 Fronteras entre categorías

- `Validation` no depende del estado actual del negocio; `BusinessRule` sí.
- `Authentication` responde quién puede establecer/continuar sesión;
  `Authorization` responde si el actor puede ejecutar una operación.
- `NotFound` es ausencia dentro de un scope o normalización anti-enumeración;
  no prueba que el recurso exista fuera del scope.
- `Conflict` describe una colisión estable de estado; `Concurrency` distingue
  versión stale o contención técnica.
- `Persistence`, `Infrastructure` y `Configuration` son categorías internas.
  El cliente recibe una representación pública normalizada.
- `Unexpected` no es un catch-all permitido para casos conocidos.

### 10.2 Códigos estables mínimos

| Categoría | Código público mínimo | Uso |
| --- | --- | --- |
| `Validation` | `VALIDATION_FAILED` | Entrada no aceptable |
| `Authentication` | `AUTHENTICATION_REQUIRED` | Falta autenticación/sesión válida |
| `Authorization` | `ACCESS_DENIED` | Denegación segura cuando revelar existencia no es un riesgo |
| `BusinessRule` | `BUSINESS_RULE_VIOLATION` | Regla comunicable sin filtrar internals |
| `NotFound` | `RESOURCE_NOT_FOUND` | Ausencia o normalización anti-enumeración |
| `Conflict` | `RESOURCE_CONFLICT` | Estado vigente incompatible |
| `Concurrency` | `CONCURRENCY_CONFLICT` | Versión stale o conflicto no transitorio |
| `Concurrency` | `TRANSIENT_CONCURRENCY_FAILURE` | Reintentos internos agotados |
| `ExternalService` | `DEPENDENCY_BAD_RESPONSE` | Respuesta inválida |
| `ExternalService` | `DEPENDENCY_UNAVAILABLE` | Dependencia no disponible |
| `ExternalService` | `DEPENDENCY_TIMEOUT` | Dependencia excedió presupuesto |
| `Infrastructure` | `SERVICE_UNAVAILABLE` | Infraestructura temporalmente no disponible |
| `Unexpected` | `INTERNAL_ERROR` | Falla no revelable |

`Persistence` y `Configuration` no tienen código público propio. Sus códigos
internos deben traducirse a un resultado de negocio, conflicto, disponibilidad
o `INTERNAL_ERROR`.

Un módulo puede añadir códigos específicos sólo si:

- conserva una categoría existente;
- el código es estable y no contiene nombres físicos;
- existe mensaje seguro y mapeo HTTP;
- tiene pruebas de sanitización;
- el cambio se registra antes de publicarlo.

Cambiar el significado o retirar un código público es incompatible. Agregar un
código dentro de una categoría existente es compatible si los consumidores
tratan la categoría y el HTTP conforme a este contrato.

## 11. Contrato público REST/JSON

Toda respuesta de error usa:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "category": "Validation",
    "message": "La solicitud no es válida.",
    "correlationId": "01J...",
    "details": [
      {
        "field": "publicField",
        "code": "REQUIRED"
      }
    ]
  }
}
```

Campos:

| Campo | Obligatorio | Regla |
| --- | --- | --- |
| `error` | Sí | Objeto raíz único |
| `code` | Sí | Código público estable y allowlisted |
| `category` | Sí | Categoría pública segura |
| `message` | Sí | Mensaje humano seguro; los clientes no toman lógica por su texto |
| `correlationId` | Sí | Generado/validado por servidor conforme a ADR-005 |
| `details` | No | Sólo estructura allowlisted por código; nunca valores recibidos |

No se exponen:

- SQL, SQLSTATE, constraint, tabla, columna o query;
- stack trace, nombre de clase, paquete, función o ruta local;
- nombre interno de módulo, servicio, host, proveedor o conexión;
- PIN, contraseña, token, cookie, authorization header o credencial;
- tenant, sucursal, usuario, estación, sesión o recurso ajeno;
- payload, body, datos persistidos, PII o metadata arbitraria;
- mensaje crudo de PostgreSQL, Kysely, `pg`, NestJS o SDK.

`details` se permite por defecto sólo para validación y contiene paths del
contrato público y códigos seguros. Extenderla a otra categoría requiere una
allowlist documentada y contract tests.

### 11.1 Anti-enumeración

- Una consulta de un recurso fuera del tenant/sucursal autorizados DEBE ser
  indistinguible de un recurso inexistente cuando revelar existencia aumente
  riesgo.
- En ese caso la respuesta es `RESOURCE_NOT_FOUND`/`404`; el log interno puede
  conservar `Authorization` como causa semántica segura.
- Los mensajes y forma de respuesta DEBEN ser iguales para ID inexistente e ID
  ajeno.
- No se exige ocultar una denegación `403` cuando el recurso y la acción ya son
  legítimamente visibles para el actor.
- Diferencias de tiempo evitables, headers, detalles y códigos no deben actuar
  como canal de enumeración.

## 12. Mapeo HTTP

| Categoría interna | Código público | HTTP | Justificación |
| --- | --- | ---: | --- |
| `Validation` | `VALIDATION_FAILED` | 400 | El cliente puede corregir la estructura/semántica de entrada |
| `Authentication` | `AUTHENTICATION_REQUIRED` | 401 | Falta o no es válida la autenticación necesaria; no distingue la causa |
| `Authorization` | `ACCESS_DENIED` | 403 | El actor autenticado no puede ejecutar una operación visible |
| `Authorization` normalizada | `RESOURCE_NOT_FOUND` | 404 | Evita enumerar recursos fuera del scope |
| `BusinessRule` | `BUSINESS_RULE_VIOLATION` | 422 | La solicitud es interpretable, pero una regla vigente la rechaza |
| `NotFound` | `RESOURCE_NOT_FOUND` | 404 | El recurso no es visible/existente dentro del scope |
| `Conflict` | `RESOURCE_CONFLICT` | 409 | Existe una colisión estable con el estado actual |
| `Concurrency` no transitoria | `CONCURRENCY_CONFLICT` | 409 | El cliente debe releer o presentar una nueva intención |
| `Concurrency` transitoria agotada | `TRANSIENT_CONCURRENCY_FAILURE` | 503 | El servidor agotó reintentos seguros; una solicitud posterior puede funcionar |
| `Persistence` conocida | Código semántico traducido | Según categoría destino | PostgreSQL no es contrato HTTP |
| `Persistence` desconocida | `INTERNAL_ERROR` | 500 | No se puede exponer ni afirmar una causa corregible |
| `ExternalService` respuesta inválida | `DEPENDENCY_BAD_RESPONSE` | 502 | El sistema recibió una respuesta no utilizable de una dependencia |
| `ExternalService` no disponible | `DEPENDENCY_UNAVAILABLE` | 503 | Dependencia temporalmente indisponible |
| `ExternalService` timeout | `DEPENDENCY_TIMEOUT` | 504 | La dependencia no respondió dentro del presupuesto |
| `Infrastructure` transitoria | `SERVICE_UNAVAILABLE` | 503 | El servicio no puede completar temporalmente |
| `Infrastructure` no clasificada | `INTERNAL_ERROR` | 500 | No existe una recuperación pública segura |
| `Configuration` en startup/readiness | Sin respuesta de negocio | No aplica | El proceso no debe declararse listo |
| `Configuration` detectada en request | `SERVICE_UNAVAILABLE` o `INTERNAL_ERROR` | 503 o 500 | 503 sólo si la condición es temporal y clasificada |
| `Unexpected` | `INTERNAL_ERROR` | 500 | Defecto o causa desconocida, siempre sanitizada |

El status HTTP expresa el resultado del request; el código público aporta la
semántica estable. No se usa `200` con error embebido. `Retry-After` puede
publicarse en `503` sólo cuando existe un tiempo seguro y autoritativo; no se
inventa.

## 13. Logging

### 13.1 Evento autoritativo

Cada falla que cruza el límite exterior produce como máximo un evento de error
autoritativo. Las capas inferiores agregan contexto tipado o registran una
recuperación local, pero NO duplican el mismo incidente en cada frontera.

El evento contiene, cuando el dato ya fue resuelto, es necesario y su acceso
está permitido:

- `correlationId`;
- ambiente y versión;
- módulo owner;
- operación estable;
- tenant;
- sucursal;
- usuario;
- estación;
- sesión, sólo si es necesaria;
- duración;
- categoría y código interno estable;
- severidad;
- resultado;
- intento/retry count;
- alias de dependencia o componente;
- causa técnica allowlisted.

Tenant, sucursal, usuario, estación y sesión se registran como identificadores
opacos; no como nombres, teléfonos, PIN u otros atributos. Si una identidad aún
no fue autenticada, no se registra una identidad adivinada desde el request.

Nunca se registran:

- PIN, contraseña, token, cookie, API key o secreto;
- authorization header o credencial de estación;
- connection string;
- SQL, valores SQL, mensaje crudo del driver o nombre físico de constraint;
- body/payload completo;
- datos personales o contenido de tenant innecesarios;
- respuesta completa de un proveedor;
- stack en campos de libre acceso.

Un stack puede conservarse sólo para `Unexpected` en diagnóstico técnico
restringido y sanitizado. Nunca se devuelve al cliente.

### 13.2 Severidad por categoría

| Categoría | Severidad ordinaria | Elevación |
| --- | --- | --- |
| `Validation` | `info` | `warn` ante abuso o volumen anómalo |
| `Authentication` | `warn` | `error` sólo ante falla del mecanismo, no por PIN incorrecto |
| `Authorization` | `warn` | Según política de evento de seguridad |
| `BusinessRule` | `info` | `warn` si indica drift o recurrencia anómala |
| `NotFound` | `debug`/`info` | `warn` ante enumeración |
| `Conflict` | `info` | `warn` por recurrencia o impacto |
| `Concurrency` | `warn` | `error` al agotar política interna |
| `Persistence` | `error` | `fatal` si impide startup/consistencia |
| `ExternalService` | `warn` | `error` al agotar recuperación o afectar operación |
| `Infrastructure` | `error` | `fatal` si el proceso no puede operar seguro |
| `Configuration` | `fatal` en startup; `error` en runtime | Siempre afecta readiness si impide operar |
| `Unexpected` | `error` | `fatal` sólo si compromete proceso o consistencia |

Logs técnicos no sustituyen auditoría de negocio. Una denegación, una regla
rechazada y un hecho de negocio tienen owners, integridad y retención
distintos. DEC-045 a DEC-048 deberán consumir este contrato sin redefinirlo.

## 14. Retry

### 14.1 Reglas generales

Un retry automático sólo se permite cuando:

1. la categoría y causa están clasificadas como `transient`;
2. la operación completa es idempotente o tiene idempotency key efectiva;
3. no existe resultado de commit desconocido;
4. la aplicación es owner de la política;
5. el retry reinicia la unidad completa desde un estado limpio;
6. la cantidad y tiempo son acotados por el deadline;
7. cada intento conserva correlación y registra su número;
8. al agotarse se devuelve una falla estable.

Un adapter puede clasificar retryability, pero NO inicia loops invisibles por
defecto. No se reintenta una sentencia aislada dentro de una transacción
abortada; se reinicia la transacción completa bajo control de aplicación.

### 14.2 Matriz

| Categoría | Retry automático | Justificación |
| --- | --- | --- |
| `Validation` | No | Repetir la misma entrada no cambia el resultado |
| `Authentication` | No | Requiere credencial/sesión nueva; repetir puede facilitar abuso |
| `Authorization` | No | Requiere cambio autoritativo de capacidad/alcance |
| `BusinessRule` | No | Requiere nueva intención o estado de negocio |
| `NotFound` | No | Repetir no crea el recurso; polling debe ser contrato explícito |
| `Conflict` | No por defecto | Idempotencia puede reconocer éxito previo; otro intento exige nueva intención |
| `Concurrency` stale | No transparente | Cliente/caso de uso debe releer y reevaluar intención |
| `Concurrency` serialización/deadlock | Sí, condicional | Sólo operación idempotente, transacción completa y política acotada |
| `Persistence` | Según causa | Unique/FK no; serialización/deadlock sí condicional; desconocida no |
| `ExternalService` timeout/unavailable | Sí, condicional | Backoff acotado sólo con idempotencia y deadline |
| `ExternalService` respuesta inválida | No | Repetir sin evidencia puede prolongar un contrato roto |
| `Infrastructure` | Sólo clase transitoria explícita | No toda falla técnica es recuperable |
| `Configuration` | No | Requiere corregir configuración y readiness |
| `Unexpected` | No | Repetir una causa desconocida puede duplicar efectos |

## 15. Persistencia y DEC-049

DEC-049 conserva ownership de adapters, transacciones y contexto. DEC-044
define la traducción:

| Señal PostgreSQL/driver | Traducción dentro del adapter | Retry | Resultado público posible |
| --- | --- | --- | --- |
| Unique violation (`23505`) | Constraint + operación conocidas → `Conflict`, `BusinessRule` o idempotencia ya satisfecha según semántica; desconocida → `Persistence` | No; sólo resolución idempotente demostrada | `409`, `422` o resultado previo verificado; nunca constraint |
| Foreign key (`23503`) | Referencia conocida → `Validation`, `NotFound` o `BusinessRule` según semántica; desconocida → `Persistence` | No | `400`, `404`, `422` o `500` sanitizado |
| Serialization failure (`40001`) | `Concurrency` transitoria | Condicional, transacción completa e idempotente | `503` si se agota |
| Deadlock (`40P01`) | `Concurrency` transitoria | Condicional, transacción completa e idempotente | `503` si se agota |
| Timeout/cancelación | Distinguir adquisición, statement, transacción y outcome desconocido; `Persistence`/`Infrastructure` estable | Sólo si no hay commit desconocido y la operación es idempotente | `503` o `500`; sin detalle técnico |
| Check/not-null conocido | `BusinessRule` o defecto de mapping según owner | No | `422` sólo si es regla comunicable; en otro caso `500` |
| Error desconocido | `Persistence` → `Unexpected` en el borde | No | `500 INTERNAL_ERROR` |

Reglas:

- el adapter usa códigos/metadata estructurados del driver, no parsing del
  mensaje;
- el mapping es por constraint lógico y operación conocida;
- nombres físicos, SQLSTATE y mensajes no cruzan el puerto;
- aplicación y dominio no importan tipos Kysely/`pg`;
- una unique violation no se declara éxito hasta verificar la misma
  idempotency key y el resultado autoritativo;
- un timeout con resultado de commit desconocido no se reintenta ciegamente;
- los retries de `40001`/`40P01` reinician el callback transaccional completo
  definido por DEC-049;
- una causa desconocida falla cerrada y se investiga por correlación.

DEC049-C06 queda especificada por este contrato, pero continúa **no cumplida**
hasta existir implementación y evidencia autorizadas.

## 16. Servicios externos

| Falla | Clasificación | Tratamiento | HTTP |
| --- | --- | --- | ---: |
| Timeout | `ExternalService`/`DEPENDENCY_TIMEOUT` | Cancelar al vencer presupuesto; retry sólo idempotente y acotado | 504 |
| Respuesta inválida | `ExternalService`/`DEPENDENCY_BAD_RESPONSE` | Validar en adapter; no filtrar payload; no retry por defecto | 502 |
| Indisponibilidad | `ExternalService`/`DEPENDENCY_UNAVAILABLE` | Fallar estable; retry condicional con backoff/deadline | 503 |
| Credencial/configuración inválida | `Configuration` interna | No retry; afectar readiness cuando impide operar | 500/503 genérico |
| Circuito abierto futuro | Mismo contrato que indisponibilidad | No revelar proveedor; no hacer llamada hasta política futura | 503 |

El circuit breaker queda diferido. Una adopción futura no crea una categoría
pública nueva por sí misma: consume `DEPENDENCY_UNAVAILABLE`, correlación y la
política de retry vigente.

Una operación con efecto externo no se ejecuta dentro de una transacción
PostgreSQL que espere I/O remoto. Idempotencia, compensación y recuperación se
definen por caso de uso.

## 17. Dominio

Las fallas de dominio representan:

- invariante incumplida;
- transición de estado inválida;
- regla de negocio no satisfecha;
- conflicto de versión del agregado;
- intención duplicada cuando el dominio puede reconocerla.

Reglas:

1. El código pertenece al módulo owner y expresa lenguaje de dominio.
2. No contiene status HTTP, texto de UI, SQLSTATE o proveedor.
3. No conoce logger, correlation ID ni metadata de request.
4. No incluye entidades completas ni valores sensibles.
5. Una invariante imposible causada por defecto no se presenta como regla de
   negocio; se trata como `Unexpected`.
6. Aplicación decide si un error local se expone, se normaliza o se combina con
   contexto de autorización.
7. El error no muta el agregado ni produce efectos parciales.

Ejemplos conceptuales:

| Situación | Categoría |
| --- | --- |
| Campo externo con formato inválido | `Validation` |
| Transición conocida pero no permitida desde el estado vigente | `BusinessRule` |
| Versión esperada distinta de la vigente | `Concurrency` |
| Recurso no visible en el scope | `NotFound` público; causa interna puede ser `Authorization` |
| Estado imposible no modelado | `Unexpected` |

## 18. Ejemplos públicos

### Validación

HTTP `400`:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "category": "Validation",
    "message": "La solicitud no es válida.",
    "correlationId": "01J...",
    "details": [
      {
        "field": "name",
        "code": "REQUIRED"
      }
    ]
  }
}
```

### Recurso inexistente o ajeno

Ambos casos producen la misma respuesta HTTP `404`:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "category": "NotFound",
    "message": "El recurso no está disponible.",
    "correlationId": "01J..."
  }
}
```

El log interno distingue una ausencia ordinaria de una denegación
anti-enumeración, sin registrar contenido ajeno.

### Conflicto funcional

HTTP `409`:

```json
{
  "error": {
    "code": "RESOURCE_CONFLICT",
    "category": "Conflict",
    "message": "La operación entra en conflicto con el estado actual.",
    "correlationId": "01J..."
  }
}
```

### Falla inesperada

HTTP `500`:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "category": "Unexpected",
    "message": "No fue posible completar la operación.",
    "correlationId": "01J..."
  }
}
```

## 19. Testing

DEC-051 deberá convertir esta matriz en gates y herramientas. DEC-044 exige los
casos, no selecciona runner.

| Nivel | Pruebas mínimas |
| --- | --- |
| Dominio | regla, estado inválido, invariante, versión stale; código estable; ausencia de HTTP/NestJS/PostgreSQL |
| Aplicación | traducción de dominio, autorización, anti-enumeración, conflicto, efectos parciales ausentes |
| Infraestructura | mapping de errores estructurados; causa desconocida; timeout; respuesta externa inválida; ningún error de librería cruza el puerto |
| PostgreSQL real | unique, FK, serialization failure, deadlock, timeout, rollback y commit desconocido según escenario autorizado |
| API contract | envelope exacto, códigos HTTP, allowlist de campos, correlation ID y ausencia de internals |
| Seguridad | mismo contrato para recurso inexistente/ajeno; sin SQL, stack, nombres internos, secretos o datos cross-tenant |
| Logging | campos obligatorios cuando existan; campos prohibidos ausentes; un evento autoritativo; severidad y correlación correctas |
| Retry | no retry para clases definitivas; retry acotado sólo idempotente; transacción completa; exhaustion estable; sin efectos duplicados |
| External service | timeout, invalid response, unavailable y futuro circuito abierto conservan contrato |
| Arquitectura | dominio/aplicación sin NestJS/Kysely/`pg`; presentation sin driver; adapters sin errores crudos |

Casos negativos obligatorios:

- PIN incorrecto, usuario inexistente y sesión inválida no revelan qué
  precondición falló;
- falta de capacidad y recurso ajeno no producen efectos parciales;
- ID inexistente e ID de otro tenant son indistinguibles cuando aplica;
- unique/FK desconocidas no filtran constraint;
- stack, SQLSTATE, SQL, paths, tokens y payloads nunca aparecen en response;
- un retry agotado no duplica efectos;
- `Unexpected` siempre incluye correlación pública y causa sólo interna;
- un log de error no contiene los campos prohibidos.

## 20. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Proliferación de códigos | Owner por módulo, categoría fija, registro y contract tests |
| Catálogo convertido en módulo global | El catálogo es normativo; implementación local por capa conforme a DEC-005 |
| Todo termina en `500` | Matriz obligatoria de fallas esperadas y cobertura por caso de uso |
| Detalles públicos filtran información | Allowlist por código; `details` restringido; pruebas negativas |
| Anti-enumeración oculta incidentes | Respuesta uniforme y causa interna correlacionada |
| Logs duplicados o ruidosos | Un evento autoritativo por falla exterior; sampling sólo en clases de bajo riesgo |
| Reintentos duplican efectos | Idempotencia, deadline, transacción completa y prohibición ante outcome desconocido |
| Mapping PostgreSQL por texto | Usar código/metadata estructurados y operación/constraint registrada |
| Mensajes se vuelven contrato | Clientes dependen de `code`/HTTP, no de `message` |
| `Unexpected` usado para reglas conocidas | Review y pruebas exigen código estable para cada falla esperada |
| Código público revela proveedor | Normalización a dependencia/servicio genérico |
| Confusión log/auditoría | Owners y señales separados; DEC-045/046 conservan su alcance |

## 21. Consecuencias

### Positivas

- dominio y aplicación permanecen independientes de NestJS/PostgreSQL;
- drivers y SDKs quedan encapsulados;
- API ofrece un contrato uniforme y seguro;
- retryability deja de depender de mensajes o intuición;
- anti-enumeración y sanitización son probables;
- DEC-051 recibe una matriz concreta de casos;
- DEC049-C06 obtiene un contrato normativo sin adelantar implementación.

### Negativas

- cada módulo debe mantener mappers y códigos propios;
- los adapters necesitan mapping por operación/constraint conocida;
- contract tests aumentan el costo de cada endpoint;
- algunas respuestas públicas serán deliberadamente menos específicas que el
  diagnóstico interno;
- los retries exigen idempotencia y pruebas, no sólo configuración.

## 22. Decisiones diferidas

- mecanismo concreto de resultados/excepciones tipadas;
- nombres de clases, interfaces y ubicación física exacta;
- filtro/interceptor/middleware NestJS;
- librería de validación y formato de localización;
- valores de timeout, número de intentos, backoff y jitter;
- circuit breaker y librería;
- sink, acceso, retención, alertas y redacción de logs (`DEC-045`);
- atomicidad, integridad y retención de auditoría (`DEC-046`);
- propagación completa de correlación (`DEC-047`);
- plataforma y señales de observabilidad (`DEC-048`);
- runner, CI, cobertura y gates (`DEC-051`);
- DoD y evidencia (`DEC-063`);
- rate limiting y su posible código `429`;
- códigos de módulos funcionales que aún no existen.

Ninguna decisión diferida puede cambiar las categorías, fronteras,
sanitización, anti-enumeración o reglas de retry de este documento sin revisión
formal.

## 23. Dependencias

| Relación | Estado |
| --- | --- |
| ADR-001 | Satisfecha: TypeScript, Node.js `24.x` y runtime validation |
| ADR-002 | Satisfecha: capas y puertos hacia adentro |
| ADR-003 | Satisfecha: PostgreSQL e integridad |
| ADR-004/010 | Satisfecha: scope confiable, fail closed y anti-enumeración |
| ADR-005 | Satisfecha: NestJS/REST como shell y adaptación exterior |
| ADR-011 | Satisfecha: autenticación/sesión separadas |
| ADR-012/013 | Satisfecha: autorización ordinaria/reforzada y denegación sin efectos |
| DEC-004 | Selección satisfecha; evidencia final no bloquea decidir DEC-044 |
| DEC-005/PBI-022 | Satisfecha: ubicación y fronteras materializadas/verificadas |
| DEC-049 | Satisfecha: frontera de persistencia; C06 recibe este contrato |
| DEC-045 a DEC-048 | Posteriores; consumen categorías/correlación sin redefinirlas |
| DEC-051 | Posterior; debe materializar la matriz de pruebas |
| DEC-063 | Posterior; debe exigir el contrato cuando aplique |

No se encontró contradicción material. La propuesta concreta obligaciones
preexistentes sin reabrir decisiones aceptadas.

## 24. Compatibilidad técnica

| Baseline | Compatibilidad |
| --- | --- |
| Node.js `24.x` | Categorías/resultados TypeScript sin API de runtime alternativa |
| TypeScript `6.0.3` | Tipos discriminados y narrowing conceptual; sin `any` requerido |
| NestJS `11.x` | Sólo presentación/shell adapta HTTP; dominio/aplicación quedan libres del framework |
| REST/HTTP JSON | Envelope y mapeo definidos |
| PostgreSQL `18.x` | SQLSTATE se interpreta sólo dentro del adapter |
| Kysely + `pg` | Errores capturados y traducidos antes de cruzar el puerto |
| ESM/NodeNext | No introduce paquetes, aliases ni patrón incompatible |
| DEC-005 | Ownership local; no crea `common/core` ni shared kernel amplio |
| DEC-049 | Contexto, transacciones, retry y sanitización preservados |

## 25. Criterios de aceptación

Contenido de la propuesta:

- [x] categorías, propósito, owner, origen, traducción, exposición y logging;
- [x] flujo infraestructura → aplicación → API → cliente;
- [x] errores de proveedor prohibidos en el contrato público;
- [x] contrato JSON seguro y estable;
- [x] mapeo HTTP justificado;
- [x] logging permitido/prohibido;
- [x] retryability por categoría;
- [x] traducción PostgreSQL/Kysely/`pg`;
- [x] servicios externos y circuit breaker futuro;
- [x] reglas e invariantes de dominio;
- [x] matriz de testing;
- [x] opciones comparadas y una estrategia seleccionada;
- [x] riesgos, mitigaciones, consecuencias y diferidos;
- [x] compatibilidad con decisiones aceptadas;
- [x] impacto y dependencias de R0.

Revisión y resolución:

- [x] revisión explícita de Seguridad: `PASS WITH CONDITIONS`;
- [x] revisión explícita de Operaciones: `PASS WITH CONDITIONS`;
- [x] revisión explícita de Calidad: `PASS WITH CONDITIONS`;
- [x] aprobación explícita de Arquitectura: `PASS WITH CONDITIONS`;
- [x] aprobación explícita de Ingeniería: `PASS WITH CONDITIONS`;
- [x] autoridad, fecha, condiciones y resolución registradas en
  [FORMAL_REVIEW.md](FORMAL_REVIEW.md).

## 26. Preguntas de revisión formal

### Arquitectura

1. ¿La Opción A conserva ownership por capa sin crear un shared global?
2. ¿Las fronteras de traducción respetan DEC-005?
3. ¿El catálogo es suficiente para R0 sin absorber errores de módulos futuros?

### Ingeniería

1. ¿Cada mapping es implementable sin parsing de mensajes?
2. ¿Expected como resultado tipado y unexpected como excepción exterior es
   viable con NestJS, Kysely y `pg`?
3. ¿La política de retry evita outcomes ambiguos y transacciones parciales?

### Seguridad

1. ¿El envelope, los detalles y el mapeo anti-enumeración evitan divulgación?
2. ¿Los campos prohibidos cubren credenciales, SQL y datos cross-tenant?
3. ¿Authentication/Authorization preservan fail closed sin revelar causas?

### Operaciones

1. ¿Severidad, correlación y campos mínimos permiten diagnóstico seguro?
2. ¿Timeouts, retries y dependencia no disponible tienen outcomes operables?
3. ¿Configuration/Infrastructure afectan readiness de forma correcta?

### Calidad

1. ¿La matriz cubre traducción, sanitización, retry, HTTP y dominio?
2. ¿Los casos negativos pueden convertirse en gates deterministas de DEC-051?
3. ¿La evolución del catálogo conserva compatibilidad verificable?

## 27. Condiciones de materialización

DEC044-C01 a DEC044-C08 quedan aceptadas, vigentes y **pendientes**. Su owner,
momento, evidencia, dependencia y estado se registran en la
[revisión formal](FORMAL_REVIEW.md#19-condiciones-dec044-c01c08). Ninguna
condición se considera cumplida por esta decisión.

## 28. Impacto en R0

- DEC-044 queda **Accepted** y cerrada como decisión para H0.
- H0 pasa a **seis decisiones cerradas y tres abiertas**.
- Los tres H0 abiertos son: evidencia final de DEC-004, DEC-051 y DEC-063.
- R0 continúa **no autorizado**.
- Sprint 00 continúa abierto.
- No se autoriza código funcional, materialización, PBI, merge o deploy.
- El siguiente gate H0 es DEC-051; DEC-063 sigue después y VC-024 continúa
  dependiendo de DEC-051.

## 29. Resolución final

Las cinco revisiones concluyeron `PASS WITH CONDITIONS`. El Responsable del
Proyecto emitió el 2026-07-24 estas resoluciones:

- Seguridad: **Conforme con el contrato y las condiciones verificables.**
- Operaciones: **Conforme con el contrato y las condiciones verificables.**
- Calidad: **Conforme con el contrato y las condiciones verificables.**
- Arquitectura: **Aprueba la estrategia y acepta sus condiciones.**
- Ingeniería: **Aprueba la estrategia y acepta sus condiciones.**

La resolución canónica es:

**Accepted**.

La aceptación no materializa clases, adapters, filters, logging, retries,
pruebas, SQL ni infraestructura. DEC044-C01 a DEC044-C08 siguen pendientes.
