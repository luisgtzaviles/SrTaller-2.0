# DEC-005 — Organización inicial del monolito modular

## 1. Identidad

| Campo | Valor |
| --- | --- |
| Identificador | `DEC-005` |
| Título | Organización inicial del monolito modular |
| Estado | **Accepted — Materialized / Formally Verified** |
| Fecha de propuesta | 2026-07-22 |
| Fecha de dictamen | 2026-07-22 |
| Fecha de verificación formal | 2026-07-23 |
| Autoridad de decisión | Arquitectura |
| Autoridad registrada | Luis Antonio Gutiérrez Avilés desde Arquitectura y, separadamente, Ingeniería |
| Mecanismo de verificación | [Sexta reverificación formal independiente](../../architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_6.md), resultado `PASS — DEC-005 FORMALLY VERIFIED` |
| Revisiones adicionales | No se registran vistos buenos adicionales; Calidad, Seguridad, Operaciones y Producto conservan sus revisiones en los gates que les correspondan |
| Decisiones de entrada | [ADR-002](../proposed/ADR-002-modular-monolith-first.md), [ADR-005](../proposed/ADR-005-nestjs-backend.md), [ADR-009](../proposed/ADR-009-monorepo-strategy.md), [DEC-002 y DEC-062](../../architecture-readiness/blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md), [DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md) |
| Decisiones posteriores | `DEC-049`, `DEC-044`, `DEC-050`, `DEC-051`, `DEC-063` |
| Hito | H0, antes del primer cambio funcional de R0 |

El [dictamen formal](FORMAL_REVIEW.md) registró `ACCEPT WITH CONDITIONS`.
PBI-022 produjo la materialización técnica local y la
[sexta reverificación formal independiente](../../architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_6.md)
confirmó `PASS`, DEC005-C01 a DEC005-C05 en `PASS`, FV4-001/FV4-002/FV4-003
y FV5-001 cerrados, sin hallazgos materiales nuevos ni observaciones
bloqueantes. Este avance no autoriza código funcional: R0 continúa no
autorizado y Sprint 00 continúa abierto. El [resultado](RESULTS.md) resume sus
efectos y límites.

**Actualización 2026-07-24:** los estados “sigue abierta” de la tabla de gates
en la sección 18 conservan el momento del dictamen de DEC-005. El
[registro vigente](../README.md) confirma que DEC-044/049/050/051/063 fueron
decididas después y que sus condiciones de materialización no quedan
satisfechas por DEC-005.

### Alcance

DEC-005 decide, para la aplicación backend inicial:

- la topología física de código dentro de `src/`;
- la unidad de modularidad y los módulos mínimos de fundación de R0;
- ownership arquitectónico y funcional;
- superficies públicas, dirección de dependencias e imports;
- ubicación y límites de código compartido e infraestructura;
- integración de NestJS sin contaminar dominio ni aplicación;
- capacidades mínimas de enforcement y gobierno de excepciones;
- secuencia y criterio de salida para materializar la decisión.

### Fuera de alcance

DEC-005 no decide ni autoriza:

- implementación de carpetas, módulos, casos de uso o lógica funcional;
- driver, ORM, query builder, repositorios concretos, transacciones, pooling o
  ownership físico de tablas, reservados a `DEC-049`;
- herramienta o lifecycle de migraciones, reservado a `DEC-050`;
- runner de pruebas, plataforma CI, umbrales de cobertura o gates de merge,
  reservados a `DEC-051`;
- taxonomía transversal o adaptación segura de errores, reservada a `DEC-044`;
- Definition of Done y evidencia final, reservadas a `DEC-063`;
- algoritmo de PIN, mecanismo de sesión, vinculación técnica de estación o
  composición concreta de capacidades;
- módulos de Reparaciones, Inventario, Clientes, Ventas u otros alcances de R1
  o posteriores;
- monorepo multiaplicación, workspaces, microservicios o desplegables nuevos;
- autorización de R0, cierre de Sprint 00, commit, merge o deploy.

## 2. Contexto

[ADR-002](../proposed/ADR-002-modular-monolith-first.md) acepta un monolito
modular orientado al dominio: una aplicación, un artefacto y una base física,
con ownership lógico, contratos explícitos y un grafo acíclico. La unidad de
deploy no elimina las fronteras internas. Sin una estructura física acordada,
las primeras clases funcionales convertirían convenciones accidentales en una
arquitectura difícil de corregir.

[ADR-005](../proposed/ADR-005-nestjs-backend.md) acepta NestJS como shell
técnico exterior, no como modelo de dominio. Los módulos Nest no equivalen por
sí mismos a bounded contexts, módulos de negocio, paquetes o desplegables.
Controllers, decoradores, scopes y el contenedor de DI deben permanecer en los
bordes.

[ADR-009](../proposed/ADR-009-monorepo-strategy.md) fija un repositorio único,
una aplicación y un artefacto para R0. No hay evidencia para workspaces,
paquetes internos ni servicios separados. DEC-005 organiza el código dentro de
esa aplicación; no reabre la topología del repositorio.

La baseline de [DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md)
ya seleccionó ESM/NodeNext, TypeScript, NestJS y scripts canónicos. El shell
actual de `src/` es una base técnica acotada, no una estructura funcional
implícita. Esta propuesta lo conserva conceptualmente y no reutiliza
SPIKE-009 como scaffold.

Fijar la estructura antes del código funcional evita:

- un `AppModule` que concentre reglas y acceso a datos;
- controllers conectados directamente a repositorios o SQL;
- carpetas `common`, `utils` o `shared` sin owner;
- ciclos encubiertos con `forwardRef`;
- entidades mutables y modelos de persistencia compartidos;
- un módulo por entidad o, en el extremo opuesto, un agregado universal;
- imports profundos que vuelvan privada sólo de nombre una implementación;
- crear módulos futuros vacíos para capacidades todavía fuera de R0.

### Diagnóstico previo

#### Ya resuelto por autoridad aceptada

- forma inicial: monolito modular, una app y un artefacto;
- repositorio único sin workspaces anticipatorios;
- dependencias explícitas y acíclicas;
- ownership lógico por módulo y prohibición de modificar datos ajenos;
- dominio y aplicación independientes de NestJS;
- controllers como adaptadores delgados y puertos hacia adentro;
- shared kernel pequeño, estable y sin reglas funcionales específicas;
- alcance de fundación de R0 sin Reparaciones.

#### Abierto hasta esta propuesta

- nombres y agrupaciones físicas mínimas de R0;
- árbol de carpetas y superficies públicas;
- matriz concreta de imports por capa;
- colocación de puertos, adaptadores, DTOs, eventos, errores y utilidades;
- ownership de contratos y revisión de cambios transversales;
- capacidades locales de enforcement y registro de excepciones;
- política concreta de módulos Nest, `forwardRef`, módulos globales y módulos
  dinámicos.

#### No inferible y deliberadamente diferido

- mecanismo de persistencia, tablas, transacciones y repositorios concretos;
- herramienta de migración y estrategia de rollback;
- runner, proveedor CI y política de pruebas;
- taxonomía transversal de errores;
- límites físicos de capacidades futuras de R1 o posteriores.

#### Tensiones documentales, no contradicciones materiales

- los mapas de bounded contexts son hipótesis de dominio, no una orden para
  crear un directorio por cada contexto;
- documentos tempranos desaconsejan un shared kernel y ADR-002 permite uno
  mínimo; ambas posiciones son compatibles si la admisión es excepcional;
- el shell técnico plano existente responde a DEC-004 y no concede ownership
  funcional a `AppModule` ni a `TechnicalShellService`;
- los mapas conceptuales separan Identity, Access Control, Branch y Device,
  mientras que ADR-002 permite agrupar capacidades cercanas. La agrupación
  física propuesta conserva ownership interno documentado y un grafo simple.

No se encontró una contradicción que impida someter DEC-005 a revisión.

## 3. Fuerzas y criterios

| Fuerza | Criterio aplicado |
| --- | --- |
| Simplicidad inicial | Una app, un artefacto, tres módulos de fundación y sin paquetes internos |
| Claridad de ownership | Cada concepto tiene un único módulo que autoriza escritura y publica contratos |
| Aislamiento de dominio | Dominio y aplicación no importan NestJS, transporte ni infraestructura |
| Testabilidad | Casos de uso y dominio son TypeScript plano, instanciables sin iniciar Nest |
| Enforcement | Las reglas se expresan como relaciones de paths e imports verificables |
| Velocidad | No se exige infraestructura distribuida ni una capa por archivo; sólo fronteras con valor |
| Evolución | La superficie pública permite reorganizar internals sin romper consumidores |
| Shared indiscriminado | Admisión excepcional, owner arquitectónico y revisión obligatoria |
| Ciclos | Grafo explícito, imports públicos unidireccionales y `forwardRef` prohibido |
| Acoplamiento a NestJS | Framework limitado a bootstrap, composición, transporte y adapters exteriores |
| Sobrearquitectura | No se crean módulos vacíos, abstracciones sin consumidor ni infraestructura futura |

## 4. Alternativas reales

| Alternativa | Descripción | Beneficios | Costos y riesgos | Compatibilidad | Enforcement | Dictamen propuesto |
| --- | --- | --- | --- | --- | --- | --- |
| Por capa técnica | `domain/`, `application/`, `infrastructure/` y `controllers/` globales | Árbol corto y familiar | Diluir ownership, facilitar imports laterales y hacer difícil extraer una capacidad | Parcial; respeta capas pero debilita ADR-002 | Difícil distinguir dependencias entre módulos | Rechazar como organización principal |
| Por feature/módulo | Cada capacidad física contiene todo su recorrido | Ownership visible y cambios localizados | Puede producir un módulo por pantalla, endpoint o entidad si “feature” no se gobierna | Alta si la unidad se define por responsabilidad durable | Paths y APIs públicas verificables | Aceptar como base, con unidad gobernada |
| Híbrida | Módulos funcionales con capas internas, más infraestructura técnica de composición | Combina ownership, independencia del framework y pragmatismo | Dos ejes de organización que requieren reglas claras | Muy alta con ADR-002/005/009 | Reglas de capa y módulo son comprobables | **Recomendada** |
| Bounded contexts con módulos internos | Un directorio físico por cada contexto candidato y submódulos internos | Refleja el mapa estratégico y permite crecimiento | Los contextos actuales son candidatos; materializarlos todos sobrediseña R0 | Alta a futuro, prematura hoy | Buena si el mapa estuviera aceptado | No adoptar como topología inicial; usarla como guía de ownership |
| Shared kernel amplio | Tipos, helpers, DTOs, repositorios y servicios comunes centralizados | Reutilización inmediata y pocos imports entre módulos | Owner ambiguo, evolución coordinada, reglas filtradas y agregado universal técnico | Incompatible con ADR-002/009 | Muy difícil impedir crecimiento accidental | Rechazar |
| Shared kernel mínimo | Sólo conceptos realmente transversales, estables y sin owner funcional | Reduce duplicación esencial sin borrar límites | Revisión adicional y posible duplicación local intencional | Compatible con ADR-002/009 | Allowlist y ownership verificables | Aceptar de forma excepcional |

La alternativa seleccionada es una **estructura híbrida, module-first, con
capas internas y shared kernel mínimo**.

## 5. Propuesta recomendada

### Estructura objetivo

La estructura siguiente es normativa como destino, no una autorización para
crearla en esta tarea. Los directorios se materializan sólo cuando contienen
trabajo autorizado; no se crean esqueletos vacíos.

```text
src/
  main.ts
  app.module.ts
  startup-config.ts
  modules/
    tenancy/
      index.ts
      tenancy.module.ts
      domain/
      application/
        contracts/
        ports/
        use-cases/
      infrastructure/
      presentation/
        http/
    stations/
      index.ts
      stations.module.ts
      domain/
      application/
        contracts/
        ports/
        use-cases/
      infrastructure/
      presentation/
        http/
    access/
      index.ts
      access.module.ts
      domain/
      application/
        contracts/
        ports/
        use-cases/
      infrastructure/
      presentation/
        http/
  shared/
    domain/
    application/
    technical/
  infrastructure/
    config/
    logging/
    observability/
    persistence/
    transport/
    integrations/
    security/
    time/
    ids/
    transactions/
```

El árbol enumera ubicaciones permitidas, no obliga a crear cada subdirectorio.
`shared/` comienza conceptualmente vacío y sólo se materializa tras admitir un
elemento con los criterios de la sección 9. Los subdirectorios de
`infrastructure/` tampoco se crean antes de seleccionar e implementar su
capacidad bajo la decisión correspondiente.

### Responsabilidad de cada raíz

| Ubicación | Responsabilidad | Prohibiciones principales |
| --- | --- | --- |
| `src/modules/` | Código funcional con owner, límites y superficie pública | Módulos vacíos, acceso lateral a internals, repositorios globales |
| `src/shared/` | Primitivas excepcionalmente transversales y estables | Reglas de un módulo, entidades mutables, DTOs de transporte, persistencia, helpers genéricos |
| `src/infrastructure/` | Composición técnica de alcance aplicación, no perteneciente a un módulo funcional | Reglas de dominio, casos de uso, repositorios de otro owner, fachada funcional global |
| raíz de `src/` | Bootstrap, `AppModule` y configuración mínima de arranque aceptada | Casos de uso, queries, reglas de negocio o acceso directo a datos |

La infraestructura específica de un módulo vive en
`src/modules/<module>/infrastructure/`. La raíz `src/infrastructure/` sólo aloja
capacidades técnicas de proceso o composición realmente transversales. Un pool
o connection factory futuro podría vivir allí; un repositorio de `access`
seguiría perteneciendo a `modules/access/infrastructure`. La selección concreta
queda en DEC-049.

### Colocación por tipo

| Elemento | Ubicación |
| --- | --- |
| Entidad, value object, política o evento interno de dominio | `<module>/domain/` |
| Caso de uso y contrato de entrada/salida de aplicación | `<module>/application/` |
| Puerto requerido por un caso de uso, incluido repositorio abstracto | `<module>/application/ports/` |
| Adapter que satisface un puerto del módulo | `<module>/infrastructure/` |
| Controller y DTO HTTP | `<module>/presentation/http/` |
| Contrato público framework-free | exports explícitos de `<module>/index.ts` |
| Evento publicado a otro módulo | definido por el owner y exportado por `<module>/index.ts` |
| Error de dominio o aplicación | capa propietaria dentro del módulo |
| Mapeo de error a HTTP | `<module>/presentation/http/`; taxonomía general diferida a DEC-044 |
| Utilidad local | junto al código que la usa, privada a esa capa o módulo |
| Utilidad verdaderamente transversal | `shared/` sólo después de admisión formal |

No se permite crear `common/`, `utils/`, `helpers/`, `base/` o `core/` como
depósitos globales alternativos a estas reglas.

## 6. Unidad inicial de modularidad

Un módulo físico representa una **combinación gobernada de responsabilidades
durables y altamente cohesivas**, informada por subdominios y bounded contexts.
No equivale automáticamente a un bounded context candidato, agregado, entidad,
controller, endpoint, pantalla, tabla o caso de uso.

Para R0 se proponen únicamente estos módulos funcionales:

| Módulo | Ownership funcional inicial | Motivo de agrupación |
| --- | --- | --- |
| `tenancy` | identidad y ciclo del tenant; identidad y ciclo de sucursal | Tenant y sucursal forman el contexto organizacional padre de R0; su separación física hoy agregaría coordinación sin evidencia |
| `stations` | estación, vínculo/revocación con sucursal y contexto operativo derivado | Tiene ciclo, riesgo técnico y reglas de confianza propios según ADR-010 |
| `access` | usuario de tenant, credencial/PIN conceptual, sesión operativa, roles, capacidades, asignaciones y decisión de autorización | Identity y Access Control están separados conceptualmente, pero en R0 su cambio y consistencia son cercanos; agruparlos evita un ciclo prematuro sin borrar ownership interno |

El grafo inicial permitido es:

```text
access ─────> stations ─────> tenancy
   └────────────────────────> tenancy
```

`tenancy` no depende de otro módulo funcional. `stations` sólo consume la
superficie pública de `tenancy`. `access` sólo consume las superficies públicas
de `stations` y `tenancy`. Una necesidad de dependencia inversa exige rediseño,
evento, puerto o revisión; no autoriza un ciclo.

No se crean módulos de Reparaciones, Clientes, Inventario, Ventas, Pagos,
Auditoría o Configuración funcional bajo DEC-005. Sus fronteras se decidirán
cuando exista alcance autorizado. Configuración técnica de arranque no es un
módulo funcional; la configuración de políticas de tenant conserva su decisión
propia.

## 7. Ownership

| Rol | Responsabilidad |
| --- | --- |
| Owner arquitectónico | Arquitectura gobierna fronteras, grafo, excepciones y cambios de topología |
| Owner funcional | La autoridad de dominio/producto asignada a la capacidad gobierna semántica e invariantes; no se inventa una persona en esta decisión |
| Ingeniería mantenedora | Implementa y verifica sin cambiar silenciosamente el contrato público ni el ownership |
| Consumidor | Puede usar el contrato publicado; no obtiene autoridad para modificar internals ni datos del productor |

Cada módulo materializado debe documentar, antes de recibir código funcional:

- responsabilidad y conceptos poseídos;
- autoridad funcional aplicable;
- maintainers de Ingeniería por rol, aunque una misma persona cubra varios;
- superficie pública y consumidores conocidos;
- dependencias permitidas;
- datos propios y proyecciones consumidas, después de DEC-049;
- decisiones y excepciones vigentes.

Mientras el equipo sea pequeño, una persona puede ejercer varios roles, pero
las revisiones deben registrar desde qué rol actúa. La ausencia de personas
adicionales no convierte cambios transversales en cambios locales.

Un cambio compatible dentro de internals corresponde al maintainer del módulo.
Un cambio en contrato público requiere revisión del owner funcional, de los
consumidores afectados y de Ingeniería. Si cambia fronteras, ownership, grafo o
una regla de DEC-005, requiere además decisión de Arquitectura. Un cambio
incompatible debe versionar o coordinar la migración dentro del mismo artefacto;
no puede romper consumidores por sorpresa.

## 8. Contratos internos

### Superficie pública

`src/modules/<module>/index.ts` es el único barrel permitido para consumo entre
módulos. Exporta sólo lo que otro módulo necesita:

- contratos framework-free de comandos, consultas o capacidades;
- identificadores y snapshots inmutables necesarios para colaboración;
- resultados explícitos;
- hechos/eventos publicados y estables.

No exporta entidades mutables, agregados, repositorios, modelos de persistencia,
controllers, adapters, providers Nest ni utilidades internas. Los barrels
internos no se usan para ocultar dependencias o resolver ciclos.

El archivo `<module>.module.ts` es una superficie exclusiva de composición. Lo
puede importar `AppModule` y, bajo la composición dirigida de Option A, un
módulo consumidor registrado de forma exacta. No forma parte de la API
funcional entre módulos y no autoriza acceso a internals del productor.

### Imports

| Origen | Puede importar | No puede importar |
| --- | --- | --- |
| `domain` | propio `domain`; elemento admitido de `shared/domain` | aplicación, presentación, infraestructura, NestJS, otro módulo, transporte o persistencia |
| `application` | propio dominio/aplicación; contratos públicos framework-free de una dependencia aprobada; shared admitido | presentación, adapters, NestJS, SQL, ORM, framework HTTP |
| `presentation` | propia aplicación y contratos de transporte | repositorios, SQL, adapter concreto, internals de otro módulo, regla de dominio implementada en controller |
| infraestructura del módulo | puertos y dominio propios; API pública de dependencia aprobada; librería externa autorizada | internals o persistencia de otro módulo; definir reglas funcionales |
| infraestructura raíz | contratos técnicos y puertos que compone | dominio interno de módulos, tablas o repositorios funcionales ajenos |
| `AppModule` | módulos Nest de composición e infraestructura raíz | lógica de negocio, SQL, decisiones de autorización o contexto |
| `shared` | sólo su propia capa inferior y librería estándar aprobada | cualquier módulo funcional, NestJS, ORM o transporte |

En ESM/NodeNext se conservan los specifiers compatibles definidos por DEC-004.
DEC-005 no introduce aliases que requieran transformación adicional. Los
imports profundos entre módulos están prohibidos. Un módulo puede depender de
otro sólo si:

1. la relación aparece en el grafo aprobado;
2. el productor conserva ownership;
3. el consumidor usa `index.ts` para contratos funcionales; el único import
   adicional admisible es el `<module>.module.ts` productor registrado para
   composición dirigida;
4. el contrato no filtra framework, entidad mutable ni persistencia;
5. no se forma un ciclo directo o transitivo;
6. la necesidad no puede resolverse de forma local sin duplicar autoridad.

### Colaboración

- Una llamada síncrona usa una capacidad pública framework-free y DI explícita;
  no llama controllers ni resuelve servicios con service locator.
- Un evento lo define y publica el módulo dueño como hecho ocurrido. Los
  consumidores mantienen su propia reacción; no se selecciona event bus aquí.
- Un puerto requerido por un caso de uso vive en la aplicación que expresa esa
  necesidad. El adapter exterior satisface el puerto.
- Ningún módulo accede a tablas, repositorios, queries, entidades o adapters de
  otro módulo. Una lectura transversal futura usa contrato, evento o proyección
  con owner y frescura explícitos; DEC-049 define el mecanismo de datos.
- Los datos compartidos son identificadores, snapshots o hechos inmutables con
  procedencia. Una copia no se convierte en fuente de verdad.

### Composición dirigida registrada — Option A

Cuando un caso de uso autorizado necesita dos capacidades runtime de módulos
productores, el módulo consumidor puede componerlas sólo si se cumplen todas
estas condiciones:

1. el edge consumidor→productor ya existe en el grafo aprobado y no introduce
   dirección inversa ni ciclo;
2. `architecture/dec-005-policy.json` registra consumidor, productor, archivos
   y clases de ambos módulos, specifier exacto, token público, interfaz pública
   y bindings;
3. el consumidor importa la clase del módulo productor con un import nombrado,
   estático, exacto y sin alias, y la declara directamente en el arreglo
   literal `@Module({ imports: [...] })`;
4. token e interfaz se importan únicamente desde `index.ts`; el token es un
   valor público y la interfaz permanece framework-free;
5. el productor vincula y exporta el token una sola vez; el consumidor lo
   inyecta explícitamente una sola vez;
6. quedan prohibidos `forwardRef`, `ModuleRef`, `@Global`, imports dinámicos o
   namespace, aliases, deep imports, repositories/adapters ajenos y cualquier
   dependencia implícita no registrada.

La primera materialización autorizada registra exactamente
`access->stations` mediante
`TRUSTED_STATION_CONTEXT_RESOLVER`/`TrustedStationContextResolver` más
`TRUSTED_STATION_ADMISSION_VALIDATOR`/`TrustedStationAdmissionValidator`, y
`access->users` mediante
`AUTHENTICATION_USER_READER`/`AuthenticationUserReader` más
`AUTHENTICATION_USER_ADMISSION_VALIDATOR`/`AuthenticationUserAdmissionValidator`.
Los validadores se unen a la transacción técnica por un contexto opaco y cada
owner bloquea y valida exclusivamente sus filas, incluyendo su autoridad
monotónica de admisión. Los productores
conservan ownership; `access` sólo recibe capacidades estrechas para componer
la sesión operacional. `AppModule` conserva su composición exterior y no se
convierte en service locator ni en puente de capacidades funcionales.

La extensión autorizada por PBI-026 agrega exactamente `repairs->access`
mediante `CONTEXTUAL_AUTHORIZATION_EXECUTOR`/
`ContextualAuthorizationExecutor`. `AccessModule` conserva la decisión de
autorización contextual y exporta sólo el token público; `RepairsModule`
selecciona una operación/capability fija del lado servidor e inyecta el
contrato framework-free. La extensión no autoriza arista inversa, acceso a
internals de Access, capability suministrada por el cliente ni un service
locator.

El contrato y la evidencia exacta de PBI-034 se separan en la
[verificación acotada de Option A para PBI-034](../../architecture-readiness/dec-005-materialization/PBI_034_OPTION_A_VERIFICATION.md).
La extensión `repairs->access` se registra por separado en la
[verificación acotada de Option A para PBI-026](../../architecture-readiness/dec-005-materialization/PBI_026_OPTION_A_VERIFICATION.md).
La materialización no equivale por sí sola a autorización de negocio; el
estado de cierre y el gate aplicable se derivan de la evidencia canónica de
cada PBI.

## 9. Shared kernel mínimo

Un elemento sólo puede entrar en `shared/` si cumple **todos** estos criterios:

1. su semántica es estable y ya está respaldada por una decisión aceptada;
2. es realmente transversal a más de un módulo materializado;
3. no tiene un owner funcional natural;
4. ubicarlo en un módulo produciría una dependencia artificial demostrable;
5. su evolución divergente entre consumidores es improbable y de bajo riesgo;
6. no contiene reglas de negocio específicas, estado mutable ni detalle de
   framework o persistencia;
7. tiene owner arquitectónico, consumidores y pruebas identificados.

La reutilización prevista, la similitud de nombres o “evitar duplicación” no
bastan. Se prefiere duplicación local pequeña antes que una abstracción común
prematura.

Quedan prohibidos en `shared/`: entidades o agregados mutables, repositorios,
casos de uso, servicios funcionales, DTOs HTTP, modelos ORM, tablas, excepciones
Nest, autorización específica, constantes de un módulo, clientes externos y
helpers sin propósito acotado.

Toda admisión o ampliación se registra como revisión transversal. Si aparece un
owner funcional claro, el elemento debe migrar a su módulo mediante cambio
revisado.

## 10. Infraestructura

| Capacidad | Ubicación y límite propuesto |
| --- | --- |
| Configuración | `src/infrastructure/config/` para carga/adaptación técnica de proceso; las políticas funcionales pertenecen a su módulo |
| Logging | `src/infrastructure/logging/`; recibe datos ya clasificados y no decide auditoría ni reglas de negocio |
| Observabilidad | `src/infrastructure/observability/`; métricas/traces técnicos, sin convertirse en fuente de verdad funcional |
| Persistencia | raíz para conexión/composición técnica; adapters y mapeos en el módulo owner; mecanismo diferido a DEC-049 |
| Transporte | bootstrap, filtros o interceptores técnicos en raíz; controllers y DTOs dentro del módulo propietario |
| Integración externa | adapter en el módulo que posee la intención; clientes técnicos reutilizables en raíz sólo con contrato y owner |
| Clock | puerto en la aplicación que lo necesita; provider técnico en `time/`; semántica temporal queda en decisiones propias |
| IDs | generación técnica en `ids/`; tipo y reglas del identificador pertenecen al módulo dueño o a shared si supera sus criterios |
| Transacciones | composición técnica futura en `transactions/`; límites y mecanismo quedan en DEC-049 |
| Seguridad técnica | hashing, criptografía o adapters técnicos en `security/`; políticas y decisiones de autorización permanecen en `access` o en el módulo dueño |

La raíz de infraestructura no es una capa desde la que los módulos consumen
implementaciones concretas. El wiring exterior inyecta adapters a puertos. Esta
sección asigna lugares y dirección, no selecciona tecnología.

## 11. NestJS

### Papel y ubicación

- `main.ts` realiza bootstrap técnico y delega la composición a `AppModule`.
- `AppModule` es composition root: importa módulos Nest e infraestructura de
  proceso, pero no contiene reglas, queries ni autorización.
- `<module>.module.ts` conecta controllers, casos de uso TypeScript planos,
  puertos y adapters del mismo módulo. Un módulo Nest es un adapter de
  composición, no la frontera de dominio por sí solo.
- Controllers viven en `presentation/http`, validan/mapean transporte y llaman
  un caso de uso; no acceden a SQL, repositorios o adapters, ni son la autoridad
  final de contexto o autorización.
- Casos de uso y dominio usan constructor injection en TypeScript plano. El
  módulo Nest puede usar factories para construirlos sin decorarlos.

### Regla de framework

`@nestjs/*` se permite únicamente en:

- `main.ts` y `app.module.ts`;
- `<module>.module.ts`;
- `presentation/`;
- adapters técnicos exteriores que requieran explícitamente una API Nest.

Se prohíbe en `domain/`, `application/`, contratos públicos framework-free y
`shared/domain` o `shared/application`. También se prohíben allí decoradores,
excepciones, DTOs, scopes y tokens dependientes de NestJS.

### Reglas de composición

- `forwardRef` está prohibido como solución normal y no se admite en R0. Una
  necesidad de `forwardRef` evidencia un ciclo que debe rediseñarse.
- `@Global` y módulos globales funcionales están prohibidos. Un servicio
  técnico de proceso sólo puede ser global mediante excepción explícita y
  acotada; preferentemente se importa de forma visible.
- Un dynamic module sólo puede configurar una capacidad técnica exterior con
  contrato estable y revisión de Arquitectura; no crea módulos funcionales ni
  oculta dependencias.
- `ModuleRef`, service locator y resolución dinámica de dependencias están
  prohibidos para flujos funcionales.
- Request scope no es autoridad de tenant, sucursal, estación, actor o sesión.
  El contexto confiable debe viajar explícitamente conforme a ADR-010/011.
- Los providers Nest son wiring exterior. No vuelven pública una clase interna
  ni autorizan que otro módulo importe su implementación.

## 12. Enforcement

DEC-005 define capacidades obligatorias; no selecciona una herramienta no
aprobada.

### Mínimo local antes de CI

El primer cambio que materialice la estructura debe incluir un check local,
determinista y no interactivo capaz de fallar ante:

- imports profundos entre módulos;
- dependencia no registrada en el grafo;
- ciclos directos o transitivos;
- imports NestJS, transporte, SQL u ORM desde dominio/aplicación;
- dominio importando aplicación o infraestructura;
- controllers importando repositorios, SQL o adapters;
- uso de `forwardRef`, `ModuleRef` o módulos globales no autorizados;
- código funcional en `shared` o roots genéricos prohibidos;
- módulo sin owner/contrato o módulo futuro vacío;
- acceso de un módulo a persistencia de otro, cuando DEC-049 defina esa
  superficie.

El check debe poder ejecutarse localmente por un comando canónico y entrar en
la cadena `verify` de DEC-004 cuando su implementación sea autorizada. La
selección del parser, grafo o herramienta queda para el trabajo técnico
revisado; un checker textual puede servir como transición sólo si documenta sus
límites y posee casos positivos y negativos.

### Integración futura con CI

DEC-051 decide runner, comandos de PR/merge, plataforma CI, política de fallos y
evidencia. Al resolverla, las mismas reglas locales deben ejecutarse en CI sin
tener una segunda definición divergente. DEC-005 no cierra VC-024 ni autoriza
un proveedor de CI.

### Evidencia mínima

- fixtures válidos aceptados por el checker;
- una mutación controlada por cada familia de prohibición;
- detección explícita de al menos un ciclo;
- salida no ambigua y código de proceso distinto de cero al fallar;
- inventario de excepciones leído por el checker o contrastado por revisión;
- documento de ownership y grafo comparables con la estructura real.

## 13. Reglas iniciales

Severidades: **Blocker** impide `verify` y revisión; **Major** requiere corrección
o excepción vigente; **Advisory** exige justificación visible.

| ID | Norma | Motivo | Verificación | Severidad | Excepción |
| --- | --- | --- | --- | --- | --- |
| D5-R001 | El backend MUST permanecer una app y un artefacto en R0 | Cumplir ADR-002/009 | estructura y manifest | Blocker | No; requiere nueva decisión |
| D5-R002 | Un módulo MUST representar responsabilidad durable con owner | Evitar módulos por archivo o pantalla | registro de ownership | Blocker | No |
| D5-R003 | No se MUST crear un módulo vacío o futuro | Evitar sobrearquitectura | paths y contenido | Blocker | No |
| D5-R004 | Todo módulo MUST exponer su API funcional sólo por `index.ts` | Proteger internals | análisis de imports | Blocker | No |
| D5-R005 | Un módulo MUST NOT importar profundamente otro módulo | Preservar encapsulación | análisis de specifiers | Blocker | No |
| D5-R006 | Toda dependencia entre módulos MUST existir en el grafo aprobado | Hacer visible el acoplamiento | comparación con grafo | Blocker | No; el grafo se actualiza antes del import |
| D5-R007 | El grafo MUST ser acíclico | Evitar coordinación recíproca | detección de ciclos | Blocker | No |
| D5-R008 | Dominio MUST depender sólo de sí mismo y shared admitido | Aislar reglas | análisis de imports | Blocker | No |
| D5-R009 | Aplicación MUST NOT importar presentación o infraestructura | Inversión de dependencias | análisis de imports | Blocker | No |
| D5-R010 | Dominio y aplicación MUST NOT importar `@nestjs/*` | Cumplir ADR-005 | análisis de imports | Blocker | No; requiere nueva decisión |
| D5-R011 | Controllers MUST delegar y MUST NOT acceder a SQL, repositorios o adapters | Mantener transporte delgado | imports y revisión | Blocker | No |
| D5-R012 | Los puertos MUST vivir hacia adentro, en la aplicación que los necesita | Mantener adapters reemplazables | paths e imports | Major | No; cambiar la dirección requiere revisar la decisión |
| D5-R013 | Los adapters MUST vivir fuera de dominio/aplicación | Evitar inversión incorrecta | paths e imports | Blocker | No |
| D5-R014 | Un módulo MUST NOT acceder a tabla, repositorio o adapter de otro | Preservar ownership | reglas DEC-049 + imports | Blocker | No |
| D5-R015 | Los DTOs HTTP MUST permanecer en presentación | Evitar filtración de transporte | paths e imports | Major | No |
| D5-R016 | Los contratos públicos MUST ser framework-free | Mantener módulos independientes | análisis de imports/exports | Blocker | No |
| D5-R017 | Los eventos públicos MUST representar hechos del owner | Evitar comandos encubiertos | revisión de contrato | Major | Sí, sólo para renombrar antes de publicar |
| D5-R018 | Entidades y agregados mutables MUST NOT exportarse | Evitar autoridad compartida | análisis de exports | Blocker | No |
| D5-R019 | `shared/` MUST cumplir todos los criterios de admisión | Evitar depósito común | allowlist y revisión | Blocker | No |
| D5-R020 | Roots globales `common`, `utils`, `helpers`, `base` o `core` MUST NOT crearse | Evitar bypass de shared | paths | Blocker | No |
| D5-R021 | Una utilidad SHOULD permanecer local hasta demostrar transversalidad | Reducir abstracción prematura | revisión | Advisory | Sí, documentada |
| D5-R022 | Infraestructura de un módulo MUST permanecer con ese owner | Evitar adapters globales | paths | Major | Sí para facility técnica de proceso |
| D5-R023 | `AppModule` MUST ser sólo composition root | Evitar agregado técnico universal | revisión e imports | Blocker | No |
| D5-R024 | `AppModule` conserva la composición exterior; otro módulo sólo MAY importar `<module>.module.ts` mediante una arista dirigida registrada, estática y exacta | Separar API funcional de wiring sin impedir DI explícita entre capacidades aprobadas | policy v5 + análisis AST de módulo, metadata, imports, tokens, bindings, exports e inyección | Blocker | Sólo registro previo aprobado por Arquitectura; no hay excepción implícita |
| D5-R025 | `forwardRef` MUST NOT usarse en R0 | Exponer y eliminar ciclos | búsqueda estructural | Blocker | No |
| D5-R026 | `ModuleRef` o service locator MUST NOT resolver flujos funcionales | Dependencias explícitas | búsqueda y revisión | Blocker | No |
| D5-R027 | Módulos Nest funcionales MUST NOT ser globales | Evitar dependencias invisibles | búsqueda de `@Global` | Blocker | No |
| D5-R028 | Un dynamic module MAY configurar sólo infraestructura técnica revisada | Limitar magia de composición | revisión | Major | Sí, por registro explícito |
| D5-R029 | Request scope MUST NOT ser la autoridad del contexto operativo | Cumplir ADR-010/011 | análisis de providers | Blocker | No |
| D5-R030 | Casos de uso SHOULD ser TypeScript plano y construibles sin Nest | Testabilidad | prueba/revisión | Major | Sí, con justificación técnica |
| D5-R031 | Los imports ESM MUST respetar NodeNext de DEC-004 | Reproducibilidad | typecheck futuro/check | Blocker | No |
| D5-R032 | El enforcement local MUST ser determinista y no interactivo | Repetibilidad | ejecución repetida | Blocker | No |
| D5-R033 | Toda regla automatizable MUST tener al menos un caso inválido demostrado | Evitar checks decorativos | prueba de mutación | Major | Sí mientras conste límite y fecha |
| D5-R034 | Una excepción MUST estar registrada antes de fusionar | Evitar deuda silenciosa | registro y revisión | Blocker | No |
| D5-R035 | Código funcional MUST NOT iniciar sólo porque DEC-005 sea aceptada | Respetar gates H0/H1 y autoridad | revisión de gates | Blocker | No |
| D5-R036 | Controllers MUST NOT decidir por sí solos el contexto confiable ni la autorización final | Cumplir ADR-005/010/012 | imports, casos negativos y revisión | Blocker | No |

## 14. Excepciones

Arquitectura autoriza excepciones a fronteras o estructura; el owner funcional
y consumidores participan si cambia semántica o contrato. Ingeniería confirma
factibilidad y enforcement. Ninguna excepción es válida por comentario de
código, urgencia implícita o aprobación verbal no registrada.

El registro mínimo contiene:

- identificador y regla afectada;
- paths, módulos y contrato exactos;
- necesidad, alternativas consideradas y riesgo;
- owner responsable y autoridades revisoras;
- fecha de inicio, vencimiento y próxima revisión;
- deuda técnica y condición concreta de retiro;
- prueba o check que evita ampliar el alcance accidentalmente.

Las excepciones son temporales. Al vencer, el código debe corregirse o la
autoridad debe renovar el registro con evidencia nueva. No se permiten
excepciones silenciosas ni excepciones a aislamiento tenant, ownership de datos,
ciclos, imports NestJS en dominio/aplicación o acceso a persistencia ajena; una
necesidad de ese tipo exige revisar la decisión arquitectónica correspondiente.

## 15. Secuencia futura de materialización

Esta secuencia no se ejecuta ni se autoriza mediante esta propuesta:

1. registrar el dictamen formal de DEC-005;
2. resolver DEC-049 con base en las fronteras aceptadas;
3. autorizar un PBI técnico acotado;
4. crear sólo los directorios con contenido necesario para la primera rebanada;
5. crear el check local y su catálogo de reglas;
6. crear fixtures válidos y mutaciones mínimas de arquitectura;
7. verificar imports, ciclos, límites NestJS y ausencia de módulos vacíos;
8. documentar ownership y grafo reales de cada módulo materializado;
9. someter estructura, reglas y evidencia a revisión de Arquitectura e
   Ingeniería;
10. incorporar el check a CI cuando DEC-051 lo autorice;
11. obtener los demás cierres H0/H1, cierre de gate organizacional y
   autorización explícita antes de código funcional.

## 16. Criterios de aceptación de DEC-005

DEC-005 sólo puede pasar a `Accepted` si la revisión formal confirma que:

- estructura y unidad de modularidad son concretas;
- los tres módulos iniciales, su ownership y su grafo son suficientes para R0;
- imports, API pública, puertos, adapters y colaboración están definidos;
- shared kernel e infraestructura tienen límites verificables;
- NestJS permanece fuera de dominio/aplicación;
- enforcement local, evidencia y relación con DEC-051 están claros;
- excepciones tienen autoridad, vigencia y retiro;
- la secuencia no materializa módulos futuros ni reutiliza SPIKE-009;
- DEC-049/044/050/051/063 conservan su alcance;
- R0 y Sprint 00 continúan bloqueados hasta sus gates propios;
- la trazabilidad enlaza propuesta, registro y dictamen.

Una aceptación documental no demuestra enforcement. La materialización y su
evidencia requieren un PBI posterior y autorización separada.

## 17. Consecuencias

### Positivas

- ownership y dependencias son visibles desde el árbol;
- dominio y aplicación permanecen comprobables sin NestJS;
- un módulo puede cambiar internals sin romper consumidores;
- el checker puede razonar sobre paths y superficies públicas;
- DEC-049 recibe límites concretos para ubicar puertos y adapters;
- el equipo evita módulos vacíos y microservicios prematuros.

### Negativas

- algunos cambios simples requieren contrato y revisión transversal;
- habrá duplicación local intencional antes de admitir código en shared;
- los factories de composición pueden ser más explícitos que decorar todos los
  casos de uso con NestJS;
- reagrupar un módulo futuro tendrá coste documental y de imports.

### Riesgos residuales

- los bounded contexts de R0 todavía pueden revelar una frontera distinta al
  implementar casos reales;
- un checker textual puede no detectar imports dinámicos, aliases o reexports;
- el módulo `access` puede crecer y necesitar división si Identity y Access
  Control adquieren ritmos o owners diferentes;
- la infraestructura raíz puede convertirse en depósito si no se aplica la
  distinción entre facility técnica y adapter funcional;
- ownership lógico de código no sustituye ownership de tablas de DEC-049.

### Decisiones diferidas y coste de cambio

| Decisión | Diferimiento | Coste esperado si cambia |
| --- | --- | --- |
| DEC-049 | Persistencia, repositorios, transacciones y ownership de tablas | Medio; puede cambiar adapters, no contratos de dominio |
| DEC-044 | Taxonomía y mapping transversal de errores | Bajo a medio si los errores se mantienen locales |
| DEC-050 | Herramienta y lifecycle de migraciones | Medio, limitado a infraestructura |
| DEC-051 | Runner, CI y gates | Bajo para reglas si el check local es no interactivo |
| DEC-063 | DoD, evidencia y excepciones de entrega | Bajo en estructura; medio en proceso |
| Fronteras R1+ | Módulos funcionales posteriores | Intencional; se pagan sólo al autorizar cada rebanada |

## 18. Relación con gates posteriores

| Gate | Efecto de DEC-005 propuesta/aceptada | Estado que permanece |
| --- | --- | --- |
| DEC-049 | Recibe módulos, ownership lógico, ports/adapters y grafo contra los cuales decidir datos | Sigue bloqueando persistencia y código funcional |
| DEC-044 | Recibe ubicaciones locales y límite de mapping HTTP | Sigue abierta; taxonomía no resuelta |
| DEC-050 | Recibe separación entre infraestructura raíz y adapters por módulo | Sigue abierta; migrador/lifecycle no resueltos |
| DEC-051 | Recibe catálogo de capacidades de enforcement y fixtures esperados | Sigue abierta; runner, CI y gates no resueltos |
| DEC-063 | Recibe reglas y evidencia que una futura DoD deberá exigir | Sigue abierta |
| DEC-004 | No se reabre ni amplía; se respetan ESM/NodeNext, scripts y shell | Ratificación nativa y VC-024 conservan su estado |
| R0 | Gana una frontera implementable sólo después de aceptación y materialización autorizada | **No autorizado**; demás H0/H1, Sprint 00 y autoridad explícita siguen pendientes |

DEC-005 desbloquea la preparación y revisión de DEC-049 y, una vez aceptada,
permite diseñar la materialización técnica de las fronteras. No autoriza por sí
sola crear estructura, código funcional, persistencia, merge o deploy.

## 19. Preguntas de revisión formal

### Arquitectura

1. ¿La combinación `tenancy`/`stations`/`access` preserva las autoridades de
   ADR-004/010/011/012 sin crear módulos prematuros?
2. ¿El grafo `access -> stations -> tenancy` y `access -> tenancy` cubre R0 sin
   una dependencia inversa oculta?
3. ¿La distinción entre infraestructura raíz y adapters de módulo impide un
   segundo shared kernel?
4. ¿La superficie `index.ts` es suficiente y mantiene framework-free los
   contratos públicos?
5. ¿Alguna regla propuesta invade DEC-049, DEC-044, DEC-050, DEC-051 o DEC-063?
6. ¿Las excepciones no permitidas son las correctas para el riesgo de R0?

### Ingeniería

1. ¿Todas las reglas Blocker son verificables localmente de forma determinista
   sin seleccionar todavía el stack definitivo de DEC-051?
2. ¿El patrón de factories permite construir casos de uso TypeScript planos sin
   `@Injectable` ni `@Inject` dentro de aplicación?
3. ¿Puede detectarse de forma confiable el único barrel público, los imports
   profundos y los ciclos con la baseline ESM/NodeNext?
4. ¿La separación entre API funcional y `<module>.module.ts` evita filtrar NestJS
   a consumidores?
5. ¿Qué límites de un checker transitorio deben registrarse antes de aceptar la
   evidencia de materialización?

El dictamen debe responder cada pregunta o registrar explícitamente una
condición. La ausencia de objeciones no equivale a aprobación.

## 20. Recomendación y dictamen

**Recomendación original: aceptar con condiciones.**

Condiciones propuestas para el dictamen formal:

1. Arquitectura confirma expresamente la agrupación inicial, el grafo y las
   reglas sin excepción de la tabla normativa.
2. Ingeniería confirma que las capacidades Blocker pueden verificarse con la
   baseline aceptada y registra las limitaciones de cualquier checker
   transitorio.
3. El dictamen conserva DEC-049/044/050/051/063 y los remanentes de DEC-004 como
   gates independientes.
4. La aceptación no autoriza materialización ni código funcional; ambos exigen
   PBI y autoridad separados.
5. R0 y Sprint 00 permanecen abiertos hasta cumplir sus criterios canónicos.

El [dictamen registrado](FORMAL_REVIEW.md) es `ACCEPT WITH CONDITIONS`. Las
condiciones anteriores fueron clasificadas como confirmaciones satisfechas,
límites del alcance u obligaciones verificables de materialización. PBI-022
produjo [evidencia técnica local](../../architecture-readiness/dec-005-materialization/RESULTS.md)
y la
[sexta reverificación formal independiente](../../architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_6.md)
confirmó DEC005-C01 a DEC005-C05 en `PASS`, cerró FV4-001/FV4-002/FV4-003 y
FV5-001, y no registró hallazgos materiales nuevos ni observaciones
bloqueantes. Por ello DEC-005 queda **Accepted — Materialized / Formally
Verified**. Esta promoción no equivale a `Complete` o `Closed`, no resuelve
DEC-049/044/050/051/063 y no autoriza R0.
