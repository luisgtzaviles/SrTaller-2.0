# ADR-005 — NestJS como shell técnico del backend

**Status: Accepted**
**Fecha:** 2026-07-22
**Autoridad de aceptación:** Arquitectura + Ingeniería
**Revisión obligatoria completada:** Seguridad + Operaciones + Calidad

## Estado del documento

Decisión aceptada con condiciones normativas para el backend inicial de SR Taller 2.0. La ruta histórica bajo `proposed/` se conserva para no romper referencias; el estado dentro de este ADR y el [registro de decisiones](../README.md) son autoritativos.

[SPIKE-009](../../reviews/sprint-00/PROTOTYPE_CANDIDATES.md#spike-009), clasificado históricamente como `Mandatory before acceptance`, demostró la viabilidad de NestJS como shell desacoplado. El resultado inicial fue `CONDITIONAL PASS`; la revisión inicial eligió la Opción B (`APPROVED FOR ADR REVIEW WITH REQUIRED REMEDIATIONS`); las remediaciones alcanzaron 48/48 pruebas en dos gates completos y la revisión enfocada concluyó `REMEDIATIONS APPROVED WITH NON-BLOCKING CONDITIONS — ADR-005 READY FOR DECISION`.

La aceptación selecciona el shell, su major, el adaptador HTTP y la interfaz mínima. No autoriza implementación funcional, scaffolding de dominio, endpoints reales, SQL, migraciones, infraestructura, despliegues ni la reutilización del código experimental. Posteriormente, el 2026-07-22, [DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md) aceptó la selección del toolchain con evidencia pendiente y autorizó únicamente su PBI técnico de materialización y verificación.

## Contexto

El backend debe servir los recorridos autorizados y aplicar políticas transversales sin mezclar transporte, aplicación, dominio y persistencia. [ADR-001](ADR-001-typescript-as-primary-language.md) acepta TypeScript y Node.js `24.x`; [ADR-002](ADR-002-modular-monolith-first.md) acepta un monolito modular inicial; [ADR-003](ADR-003-postgresql-primary-database.md) acepta PostgreSQL; [ADR-004](ADR-004-shared-schema-multitenancy.md) gobierna la topología multitenant; [ADR-009](ADR-009-monorepo-strategy.md) conserva una aplicación y un artefacto iniciales; ADR-010 a ADR-013 gobiernan contexto, identidad, autorización y acciones sensibles.

Se necesita un shell técnico que haga explícitos bootstrap, composición, transporte, lifecycle y controles técnicos, pero que no se convierta en la arquitectura del negocio ni en la autoridad de sus políticas.

## Fuerzas de decisión

- Encaje con TypeScript y Node.js `24.x`.
- Composición explícita de una aplicación backend y un artefacto inicial.
- Independencia verificable de dominio y aplicación.
- Contexto tenant y autorización imposibles de omitir al invocar casos de uso.
- Adaptación uniforme y segura de errores.
- Observabilidad, lifecycle y cierre comprobables.
- Testabilidad sin arrancar framework o servidor cuando no corresponda.
- Supply chain, rendimiento y complejidad gobernados de forma proporcional.

## Opciones consideradas

1. **NestJS como shell exterior:** aporta convenciones, DI, lifecycle e integración HTTP; exige enforcement para evitar que el framework absorba dominio y aplicación.
2. **Express directo con composición propia:** reduce abstracciones y mostró menor coste en el recorrido sintético, pero obliga a construir y gobernar más convenciones transversales.
3. **Fastify directo o como adaptador:** alternativa ligera y futura; cambiar el adaptador requiere revisar compatibilidad y operación.
4. **Otro framework TypeScript:** viable sólo con una evaluación equivalente de límites, seguridad, lifecycle y coste.
5. **Backend en otro lenguaje:** contradice la baseline de ADR-001 salvo una revisión arquitectónica que la reemplace.

## Decisión

NestJS será el **shell técnico oficial del backend inicial** de SR Taller 2.0 bajo las reglas y condiciones de este ADR.

La baseline aceptada para R0 es:

| Elemento | Decisión aceptada |
| --- | --- |
| Framework | NestJS `11.x` |
| Versión efectiva inicial de referencia | `11.1.28` |
| Adaptador HTTP inicial | Express mediante `@nestjs/platform-express` |
| Interfaz inicial | REST sobre HTTP con JSON, mínima |
| Unidad ejecutable | Una aplicación backend y un artefacto, conforme a ADR-002 y ADR-009 |

La versión efectiva deberá revalidarse al cerrar la baseline ejecutable de DEC-004. No se permiten prereleases como baseline. Los paquetes runtime `@nestjs/*` deben permanecer alineados. Un cambio de major requiere revisión arquitectónica expresa.

### Adaptador HTTP

Express mediante `@nestjs/platform-express` es el adaptador inicial. Fastify queda como alternativa futura, no aceptada implícitamente.

Cambiar de Express a Fastify requiere una decisión o revisión explícita que cubra:

- middleware y plugins;
- validación y adaptación de errores;
- observabilidad y seguridad;
- uploads;
- pruebas;
- lifecycle y cierre.

### Interfaz inicial

R0 utilizará REST/HTTP JSON como interfaz mínima. Esta elección no constituye una API pública eterna y no fija todavía:

- rutas o payloads definitivos;
- versionado o prefijo;
- OpenAPI;
- política de compatibilidad externa.

GraphQL, WebSockets y la adopción simultánea de varios estilos de interfaz quedan fuera de R0 salvo decisión posterior.

## NestJS es shell, no arquitectura

NestJS pertenece a la capa exterior. No define dominio, bounded contexts, ownership, autorización, contexto tenant, transacciones de negocio, auditoría autoritativa ni nuevos desplegables.

Son reglas obligatorias:

- un módulo Nest no equivale automáticamente a módulo de dominio;
- un módulo Nest no equivale automáticamente a bounded context;
- un módulo Nest no equivale automáticamente a package, workspace o desplegable;
- un provider Nest no equivale a servicio de dominio;
- un DTO no equivale a entidad, agregado, comando o value object;
- un controller no contiene reglas de negocio;
- un decorator no constituye por sí mismo una invariante;
- el contenedor DI no define la arquitectura;
- el framework no puede convertirse en service locator.

### Fronteras de dominio y aplicación

Dominio y aplicación no pueden importar `@nestjs/*`. También quedan prohibidos en esas capas:

- decorators o excepciones Nest;
- DTOs HTTP y metadata de transporte;
- acceso al container o `ModuleRef`;
- tipos Express;
- tipos de PostgreSQL;
- ORM.

El dominio debe poder probarse sin iniciar NestJS. La aplicación debe poder probarse sin servidor HTTP.

## Responsabilidades del shell

NestJS puede asumir:

- bootstrap y composition root;
- wiring y DI del shell;
- adaptación HTTP;
- lifecycle, shutdown y middleware técnico;
- autenticación técnica temprana;
- validación estructural de transporte;
- adaptación segura de errores;
- correlation, métricas, trazas y logs técnicos;
- health;
- pruebas de integración del shell.

NestJS no puede ser autoridad de:

- invariantes ni reglas de negocio;
- tenant, sucursal, estación, actor, sesión o contexto efectivo;
- autorización contextual final ni acciones sensibles;
- transacciones;
- propiedad de repositorios u ownership de datos;
- auditoría autoritativa;
- acceso a tablas de otro módulo;
- separación de desplegables.

## Controllers, DTOs y transporte

Los controllers sólo pueden:

- recibir entrada;
- validar estructura;
- mapear un DTO a comando o consulta;
- delegar al caso de uso;
- adaptar la salida;
- usar el mapper de errores del transporte.

Los controllers no pueden:

- contener reglas de negocio;
- consultar ORM o repositorios;
- ejecutar SQL;
- abrir o confirmar transacciones;
- evaluar autorización contextual final;
- construir contexto autoritativo desde headers;
- decidir sensibilidad;
- emitir auditoría autoritativa.

Los DTOs pertenecen al transporte, no pasan al dominio como entidades, no sustituyen invariantes y deben transformarse a inputs confiables. La librería concreta de validación continúa diferida. Este ADR no acepta automáticamente `class-validator`, `class-transformer`, un `ValidationPipe` global, Swagger ni OpenAPI.

## Contexto y autorización

La secuencia normativa es:

```text
transporte
→ autenticación técnica
→ resolución server-side de contexto
→ autorización contextual en aplicación
→ ejecución del caso de uso
→ transacción y persistencia
→ auditoría
→ adaptación del resultado
```

### Contexto

- Host, header, token, cookie o parámetro sólo aportan candidatos.
- Tenant, sucursal, estación, usuario y sesión se resuelven desde fuentes server-side confiables.
- El contexto efectivo debe ser validado e inmutable.
- El contexto se pasa explícitamente al caso de uso.
- Los puertos tenant-scoped reciben contexto explícito.
- `AsyncLocalStorage` sólo puede facilitar propagación técnica después de validar el contexto; no puede ser su autoridad.
- Request scope no es baseline.
- Request/transient scope requiere justificación, medición y pruebas de no contaminación.
- Los jobs reconstruyen y revalidan contexto desde un envelope autorizado.
- HTTP y jobs aplican las mismas políticas.

### Autorización

- Los guards pueden autenticar y rechazar precondiciones técnicas.
- Los guards no constituyen la autorización contextual final.
- La autorización final ocurre dentro de la capa de aplicación.
- Invocar un caso de uso directamente no puede omitir autorización.
- Metadata y decorators sólo pueden declarar intención auxiliar.
- Metadata no es la fuente única de una acción sensible.
- La revocación debe surtir efecto en la operación siguiente sin reiniciar el proceso.

## Correlation ID y observabilidad

El servidor genera siempre el correlation ID autoritativo. Un valor aportado por el cliente es sólo candidato: puede conservarse como referencia secundaria, nunca sustituye el ID server-side y se descarta si es inválido. El correlation ID no representa identidad, autorización ni contexto tenant.

La observabilidad mínima debe emitir señales sanitizadas de:

- startup y readiness;
- dependencia caída y fallo operativo;
- shutdown y drenaje;
- cierre de listener y pool.

Logs técnicos y auditoría autoritativa permanecen separados. No se registrarán secretos, PIN, tokens, credenciales, connection strings, SQL completo, payloads completos ni datos sensibles innecesarios. La librería o plataforma de observabilidad continúa diferida.

## Persistencia y lifecycle

Este ADR no selecciona ORM, query builder, driver o pool definitivo, migrador, RLS, repositorios concretos ni esquema SQL. ADR-003, ADR-004, `DEC-049` y `DEC-050` gobiernan esas decisiones.

NestJS puede componer adaptadores, pero:

- los puertos pertenecen a aplicación;
- los adapters implementan esos puertos;
- los repositories reciben contexto explícito;
- los controllers no acceden a persistencia;
- ninguna capa técnica accede a tablas de otro módulo sin un contrato autorizado.

La implementación debe habilitar y probar startup, readiness, liveness, shutdown hooks, cierre de listener, cierre de pool, drenaje o rechazo controlado de jobs y ausencia de handles residuales. Health debe ser seguro y mínimo.

Los timeouts PostgreSQL probados en SPIKE-009 son valores experimentales, no valores productivos aceptados.

## Pruebas arquitectónicas obligatorias

Las pruebas de fronteras arquitectónicas son obligatorias, deben ejecutarse en el gate canónico de calidad y CI y deben hacer fallar el gate ante violaciones. Como mínimo impedirán:

- NestJS en dominio o aplicación;
- infraestructura importada desde dominio;
- `ModuleRef` como service locator;
- request scope no autorizado;
- controllers accediendo a SQL o adapters;
- ciclos de dependencias.

La implementación inicial puede comenzar con un checker textual si documenta sus límites y no lo presenta como solución definitiva. Debe evolucionar a análisis AST o equivalente cuando la estructura real lo requiera. `DEC-051` gobernará runner, cobertura, thresholds, tooling y gates definitivos.

## Condiciones de aceptación

ADR-005 se acepta con condiciones normativas. Estas condiciones no impiden seleccionar NestJS, pero sí bloquean implementación o cierre de otros gates cuando corresponda.

### Previas al primer recorrido productivo de R0

Antes de implementar el primer recorrido productivo deben resolverse:

1. política de atomicidad y fallo de auditoría autoritativa;
2. `DEC-044`, taxonomía y contrato seguro de errores;
3. `DEC-049`, puertos, repositories y ownership de persistencia;
4. `DEC-050`, migraciones;
5. `DEC-051`, estrategia de pruebas y gates productivos;
6. materialización del package manager y lockfile seleccionados en DEC-004;
7. primera ejecución real del gate CI sobre Linux;
8. materialización y verificación de la política de scripts de instalación y supply chain seleccionada en DEC-004;
9. política productiva de timeouts y pool;
10. no reutilizar el código de SPIKE-009 como scaffold productivo.

### Condiciones de evolución

- Mejorar el checker arquitectónico cuando la estructura real lo requiera.
- Definir cobertura cuantitativa.
- Gobernar actualizaciones minor/patch.
- Revisar dependencias nuevas.
- Medir cualquier uso de request scope.
- Conservar dominio y aplicación desacoplados.

### No bloquean esta aceptación

No bloquearon la selección de NestJS: la política definitiva de auditoría, `DEC-044`, `DEC-049`, `DEC-050`, `DEC-051`, el package manager y lockfile entonces pendientes, la primera ejecución CI Linux, el checker textual y la cobertura todavía no configurada. DEC-004 seleccionó después pnpm/lockfile y la política de scripts, pero su materialización y evidencia conservan el gate de implementación correspondiente; los demás temas mantienen sus propios gates y cierres.

## Tooling no aceptado implícitamente

La aceptación no selecciona automáticamente:

- Nest CLI ni schematics;
- npm, pnpm, Yarn ni workspaces;
- Jest, Vitest ni Supertest;
- Swagger ni OpenAPI;
- Passport;
- `class-validator`, `class-transformer` ni `ValidationPipe` global;
- CQRS, EventEmitter ni `@nestjs/microservices`;
- GraphQL ni WebSockets;
- Terminus ni ConfigModule;
- ORM, query builder, driver PostgreSQL definitivo ni migrador;
- Redis, BullMQ ni broker;
- proveedor cloud ni Docker;
- ESM, CommonJS, compilador ni bundler.

La presencia de cualquiera de estas herramientas en SPIKE-009 sólo constituye evidencia experimental.

## Política de versiones

- Major baseline: NestJS `11.x`.
- Versión efectiva inicial de referencia: `11.1.28`.
- Prereleases prohibidos como baseline.
- Los paquetes runtime `@nestjs/*` permanecen alineados.
- Minor/patch sólo pueden actualizarse con lockfile, changelog revisado, suite completa, pruebas arquitectónicas, build, auditoría de dependencias, lifecycle y revisión de regresiones.
- Un cambio de major exige revisión formal de este ADR.

## Autoridad

| Acción | Autoridad decisora | Revisiones obligatorias |
| --- | --- | --- |
| Aceptar ADR-005 | Arquitectura + Ingeniería | Seguridad + Operaciones + Calidad |
| Cambiar major | Arquitectura + Ingeniería | Seguridad + Operaciones + Calidad |
| Actualizar minor/patch | Ingeniería | Calidad + Operaciones; Seguridad si aplica |
| Cambiar Express por Fastify | Arquitectura + Ingeniería | Seguridad + Operaciones + Calidad |
| Adoptar módulo Nest transversal | Arquitectura + Ingeniería | Revisión proporcional |
| Adoptar plugin de terceros | Ingeniería + Seguridad | Arquitectura si es transversal |
| Introducir GraphQL | Producto + Arquitectura + Ingeniería | Seguridad + Calidad + Operaciones |
| Introducir `@nestjs/microservices` | Arquitectura + Ingeniería | Operaciones + Seguridad + Calidad |
| Crear nuevo desplegable | Producto + Arquitectura + Ingeniería + Operaciones | Seguridad + Calidad |
| Cambiar política de scopes | Arquitectura + Ingeniería | Seguridad + Operaciones + Calidad |
| Aprobar excepción de acoplamiento | Arquitectura + Ingeniería | Seguridad y Calidad según impacto |

## Evidencia de SPIKE-009

La evidencia aceptada para decidir este ADR está preservada en:

- [README de SPIKE-009](../../../spikes/spike-009-nestjs-shell/README.md);
- [evidencia reproducible](../../../spikes/spike-009-nestjs-shell/EVIDENCE.md);
- [resultados y riesgos](../../../spikes/spike-009-nestjs-shell/RESULTS.md).

Historial de evaluación:

1. resultado inicial `CONDITIONAL PASS` con 31/31 pruebas;
2. revisión inicial Opción B: `APPROVED FOR ADR REVIEW WITH REQUIRED REMEDIATIONS`;
3. remediaciones de contexto, autorización, correlation, observabilidad, lifecycle, PostgreSQL y enforcement;
4. dos gates completos con 48/48 pruebas, typecheck, reglas arquitectónicas, build, cero vulnerabilidades y firmas verificadas;
5. revisión enfocada de Seguridad, Operaciones y Calidad;
6. dictamen `REMEDIATIONS APPROVED WITH NON-BLOCKING CONDITIONS — ADR-005 READY FOR DECISION`.

SPIKE-009 demuestra viabilidad y queda `Completed — evidence accepted with non-blocking conditions`. Es un experimento desechable: no es scaffold, no es código productivo, no decide todas las herramientas usadas y no debe copiarse automáticamente a R0.

Riesgos residuales aceptados como condiciones no bloqueantes:

- el checker arquitectónico actual es textual y deberá evolucionar cuando la estructura lo exija;
- la cobertura cuantitativa y el gate CI real sobre Linux siguen pendientes;
- package manager, lockfile y política de scripts de instalación no se deciden aquí;
- atomicidad de auditoría, errores, persistencia, migraciones, pool y timeouts productivos pertenecen a decisiones separadas.

## Impacto en DEC-004

Este ADR cierra dentro de DEC-004 únicamente:

- framework backend: NestJS `11.x`;
- versión efectiva inicial de referencia: `11.1.28`;
- adaptador HTTP inicial: `@nestjs/platform-express`;
- interfaz inicial: REST/HTTP JSON mínima.

Posteriormente, el 2026-07-22, DEC-004 aceptó package manager, versión, lockfile, política de scripts de instalación, pinning, ESM/NodeNext, compilación TypeScript, baseline integrada y plataforma autoritativa como `Accepted — Selection Approved / Evidence Pending`. Su materialización, la primera ejecución real sobre Linux, VC-001 a VC-024 y la validación final de reproducibilidad siguen pendientes.

La aceptación de ADR-005 no desbloquea por sí sola R0. La autorización posterior de DEC-004 se limita al PBI técnico de materialización y verificación; no autoriza implementación funcional.

## Consecuencias positivas

- Shell común para composición, HTTP, lifecycle y políticas técnicas.
- Integración consistente con TypeScript y Node.js aceptados.
- Fronteras explícitas y verificables para dominio y aplicación.
- Evidencia reproducible sobre controles transversales y operación.
- Ruta de evolución gobernada para adaptador, versiones y módulos del ecosistema.

## Consecuencias negativas y riesgos

- Dependencias y abstracciones adicionales frente a un servidor HTTP directo.
- Disciplina y pruebas permanentes para impedir acoplamiento al framework.
- Riesgo de confundir módulos, providers, DTOs o decorators con conceptos de dominio.
- Riesgo de adoptar módulos Nest o tooling experimental por inercia.
- Coste de revisar lifecycle, scopes y plugins en cada evolución relevante.

## Criterios para reconsiderar

- Evidencia productiva de que el framework impide preservar las fronteras aceptadas.
- Coste operativo, rendimiento o complejidad incompatibles con objetivos medidos.
- Incapacidad sostenida del equipo para cumplir los gates arquitectónicos.
- Fin de soporte de la major o vulnerabilidad sin mitigación razonable.
- Necesidad demostrada de otro adaptador o shell con una relación coste/beneficio superior.

## Referencias

- [Registro oficial de ADRs](../README.md)
- [ADR-001 — TypeScript y Node.js](ADR-001-typescript-as-primary-language.md)
- [ADR-002 — Monolito modular](ADR-002-modular-monolith-first.md)
- [ADR-003 — PostgreSQL](ADR-003-postgresql-primary-database.md)
- [ADR-004 — Multitenancy shared-schema](ADR-004-shared-schema-multitenancy.md)
- [ADR-009 — Repositorio único](ADR-009-monorepo-strategy.md)
- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [PBI-012](../../backlog/pbis/PBI-012.md)
- [SPIKE-009 — Mandato](../../reviews/sprint-00/PROTOTYPE_CANDIDATES.md#spike-009)
- [SPIKE-009 — README](../../../spikes/spike-009-nestjs-shell/README.md)
- [SPIKE-009 — Evidencia](../../../spikes/spike-009-nestjs-shell/EVIDENCE.md)
- [SPIKE-009 — Resultados](../../../spikes/spike-009-nestjs-shell/RESULTS.md)
- [Baseline técnica de DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md)

## Próxima revisión

Al cambiar la major, proponer Fastify, cambiar la política de scopes, introducir un módulo transversal, aprobar una excepción de acoplamiento, crear otro desplegable o cuando evidencia productiva cuestione las fronteras o la operabilidad aceptadas.
