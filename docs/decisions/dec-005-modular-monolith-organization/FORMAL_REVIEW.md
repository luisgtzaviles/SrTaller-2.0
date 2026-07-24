# DEC-005 — Revisión formal de la organización inicial del monolito modular

## Resultado

**PASS — DEC-005 ACCEPTED / MATERIALIZATION PENDING**

## Dictamen explícito

**ACCEPT WITH CONDITIONS**

| Campo | Resultado |
| --- | --- |
| Decisión revisada | `DEC-005 — Organización inicial del monolito modular` |
| Propuesta | [DECISION_PROPOSAL.md](DECISION_PROPOSAL.md) |
| Fecha | 2026-07-22 |
| Estado anterior | `Proposed — Formal Review Pending` |
| Estado resultante | `Accepted — Selection Approved / Materialization Pending` |
| Autoridad | Luis Antonio Gutiérrez Avilés |
| Función de Arquitectura | Autoridad sobre estructura, fronteras, grafo, ownership y excepciones |
| Función de Ingeniería | Responsable de evaluar factibilidad y enforcement |
| Revisión adicional registrada | Ninguna |
| Materialización | Pendiente y no ejecutada |
| R0 | No autorizado |
| Sprint 00 | Abierto |

La misma persona ejerce las dos funciones declaradas, pero las observaciones y
responsabilidades se registran por separado. No se inventan firmas,
participantes, vistos buenos ni consenso de Calidad, Seguridad, Operaciones o
Producto. Sus revisiones continúan pendientes donde DEC-049, DEC-051, DEC-063,
el gate de R0 u otra autoridad aceptada las exijan.

## Alcance del dictamen

El dictamen aprueba exclusivamente la selección de:

- estructura híbrida `module-first` con capas internas;
- módulos iniciales `tenancy`, `stations` y `access`;
- ownership inicial y grafo de dependencias;
- superficie pública e imports permitidos/prohibidos;
- shared kernel mínimo e infraestructura exterior;
- límites de NestJS;
- capacidades requeridas de enforcement local;
- gobierno de excepciones;
- secuencia futura de materialización.

No aprueba implementación, evidencia de enforcement, código funcional,
persistencia, migraciones, endpoints, autenticación, autorización,
multitenancy funcional, CI, deploy, cierre de Sprint 00 o inicio general de R0.

## Documentos revisados

### Decisión y estado

- [Propuesta DEC-005](DECISION_PROPOSAL.md).
- [Evaluación del siguiente gate](../../architecture-readiness/NEXT_R0_GATE_ASSESSMENT.md).
- [Inventario canónico de bloqueantes](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md).
- [Trazabilidad](../../architecture-readiness/blocker-closure/TRAZABILIDAD.md).
- [Dependencias](../../architecture-readiness/blocker-closure/DEPENDENCIAS_ENTRE_DECISIONES.md).
- [Secuencia](../../architecture-readiness/blocker-closure/SECUENCIA_DE_DECISIONES.md).

### Autoridad arquitectónica

- [ADR-002 — Monolito modular](../proposed/ADR-002-modular-monolith-first.md).
- [ADR-005 — NestJS como shell](../proposed/ADR-005-nestjs-backend.md).
- [ADR-009 — Repositorio único](../proposed/ADR-009-monorepo-strategy.md).
- [DEC-002 y DEC-062](../../architecture-readiness/blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md).
- [DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md).

### Dominio, ownership y Repair MVP

- [Bounded contexts](../../domain/BOUNDED_CONTEXT_CANDIDATES.md).
- [Relaciones entre contextos](../../domain/CONTEXT_RELATIONSHIPS.md).
- [Matriz de ownership](../../domain/OWNERSHIP_MATRIX.md).
- [Mapa integrado de contextos](../../domain-model/integrated-repair-domain-model/MAPA_DE_CONTEXTOS_DELIMITADOS.md).
- [Matriz integrada de responsabilidades](../../domain-model/integrated-repair-domain-model/MATRIZ_DE_RESPONSABILIDADES.md).
- [Monolito modular](../../architecture-readiness/repair-mvp/MONOLITO_MODULAR.md).
- [Fronteras propuestas](../../architecture-readiness/repair-mvp/FRONTERAS_MODULARES_PROPUESTAS.md).
- [Reglas de dependencia](../../architecture-readiness/repair-mvp/REGLAS_DE_DEPENDENCIA.md).
- [Mapa de dependencias](../../architecture-readiness/repair-mvp/MAPA_DE_DEPENDENCIAS.md).
- [Capa de aplicación](../../architecture-readiness/repair-mvp/CAPA_DE_APLICACION.md).
- [Puertos y repositorios](../../architecture-readiness/repair-mvp/PUERTOS_Y_REPOSITORIOS_CANDIDATOS.md).
- [Integraciones y adaptadores](../../architecture-readiness/repair-mvp/INTEGRACIONES_Y_ADAPTADORES.md).
- [Uso de eventos](../../architecture-readiness/repair-mvp/USO_DE_EVENTOS.md).

### Convención de revisión

- [Revisión formal de DEC-004](../dec-004-toolchain-contract/FORMAL_REVIEW.md).
- [Resultados de DEC-004](../dec-004-toolchain-contract/RESULTS.md).
- [Registro de ADR](../README.md).

## Criterios de revisión

| ID | Criterio | Evidencia en la propuesta | Resultado |
| --- | --- | --- | --- |
| REV-001 | Estructura física inicial | Árbol `src/`, roots y colocación por tipo | PASS |
| REV-002 | Unidad de modularidad | Combinación gobernada de responsabilidades durables | PASS |
| REV-003 | Módulos iniciales | `tenancy`, `stations`, `access` | PASS |
| REV-004 | Dirección de dependencias | Grafo explícito y acíclico | PASS |
| REV-005 | Superficie pública | Único barrel funcional `index.ts` | PASS |
| REV-006 | Imports profundos | Prohibidos entre módulos | PASS |
| REV-007 | Ownership | Roles, autoridad y revisión transversal | PASS |
| REV-008 | Shared kernel | Criterios acumulativos y contenido prohibido | PASS |
| REV-009 | Infraestructura | Raíz técnica frente a adapters del owner | PASS |
| REV-010 | NestJS | Shell exterior y paths permitidos/prohibidos | PASS |
| REV-011 | Enforcement local | Determinista, no interactivo e independiente de CI | PASS |
| REV-012 | Enforcement CI | Diferido correctamente a DEC-051 | PASS |
| REV-013 | Excepciones | Autoridad, vigencia, evidencia y retiro | PASS |
| REV-014 | Materialización | Secuencia separada y sin autorización implícita | PASS |
| REV-015 | Criterios de aceptación | Estructura, límites, enforcement y trazabilidad cubiertos | PASS |
| REV-016 | Decisiones diferidas | DEC-049/044/050/051/063 preservadas | PASS |
| REV-017 | Compatibilidad | ADR-002/005/009, DEC-002/062 y DEC-004 preservadas | PASS |

## Cambios requeridos durante la revisión

| ID | Observación | Cambio aplicado | Estado |
| --- | --- | --- | --- |
| CHG-001 | Una dependencia no puede existir temporalmente fuera del grafo aprobado | D5-R006 ya no admite excepción; el grafo se actualiza antes del import | Resuelto |
| CHG-002 | ADR-005 exige que los puertos pertenezcan hacia adentro | D5-R012 ya no admite excepción ordinaria | Resuelto |
| CHG-003 | La propuesta nombraba revisiones adicionales sin evidencia de participación en este dictamen | Se registran sólo Arquitectura e Ingeniería; las demás perspectivas permanecen en sus gates | Resuelto |
| CHG-004 | El estado debía separar selección de materialización | Se adopta `Accepted — Selection Approved / Materialization Pending` | Resuelto |

No queda un cambio material pendiente para aceptar la selección.

## Observaciones y respuestas de Arquitectura

| Pregunta | Observación | Respuesta | Resultado | Cambio requerido |
| --- | --- | --- | --- | --- |
| ¿La combinación `tenancy`/`stations`/`access` preserva las autoridades aceptadas? | Los contextos conceptuales no obligan un módulo por contexto; Identity y Access tienen alta cohesión inicial | Sí. La agrupación conserva ownership interno, limita R0 y evita módulos vacíos | Conforme | No |
| ¿El grafo cubre R0 sin dependencia inversa oculta? | `tenancy` es raíz; `stations` publica contexto; `access` consume contexto y organización | Sí. `access -> stations -> tenancy` más `access -> tenancy` es suficiente; cualquier inversa exige rediseño previo | Conforme | CHG-001 ya aplicado |
| ¿Infraestructura raíz puede convertirse en segundo shared kernel? | El riesgo existe si aloja adapters funcionales | La regla de facilities de proceso en raíz y adapters con el owner es suficiente, condicionada a enforcement | Conforme con condición | DEC005-C01/C03 |
| ¿`index.ts` mantiene contratos framework-free? | El contrato excluye Nest, entidades, repositorios y adapters | Sí. `<module>.module.ts` es una superficie separada y exclusiva de `AppModule` | Conforme | No |
| ¿La propuesta invade decisiones posteriores? | Sólo asigna ubicaciones y capacidades; no elige mecanismo | No. DEC-049/044/050/051/063 conservan preguntas, autoridad y evidencia | Conforme | No |
| ¿Las excepciones no permitidas son adecuadas? | Ciclos, aislamiento, persistencia ajena y Nest en capas internas no toleran bypass | Sí. D5-R006 y D5-R012 se endurecieron para evitar excepciones estructurales ambiguas | Conforme | Cambios aplicados |

### Dictamen desde Arquitectura

**APROBADO CON CONDICIONES DE MATERIALIZACIÓN.** La estructura y las fronteras
son suficientemente concretas para convertirse en selección normativa. La
aprobación no demuestra que existan ni que el checker funcione.

## Observaciones y respuestas de Ingeniería

| Pregunta | Observación | Respuesta | Resultado | Cambio requerido |
| --- | --- | --- | --- | --- |
| ¿Las reglas Blocker son verificables antes de DEC-051? | Paths, specifiers, exports, símbolos prohibidos y ciclos admiten un check local no interactivo | Sí. El checker local no requiere runner o proveedor CI; su herramienta se selecciona en el PBI sin ampliar DEC-051 | Factible con condición | DEC005-C01 |
| ¿Los casos de uso pueden permanecer TypeScript planos? | Nest factories pueden construir clases con constructor injection | Sí. `@Injectable` y `@Inject` no son necesarios en aplicación | Factible | No |
| ¿Puede verificarse barrel, deep imports y ciclos bajo NodeNext? | Los imports estáticos ESM son analizables; reexports, imports dinámicos y aliases necesitan casos negativos | Sí, con inventario de límites y mutaciones; aliases no forman parte de la selección | Factible con condición | DEC005-C01 |
| ¿API funcional y módulo Nest quedan separados? | `index.ts` no exporta el módulo Nest y sólo `AppModule` importa `<module>.module.ts` | Sí. La regla es comprobable por path/specifier | Factible | No |
| ¿Qué límites debe registrar un checker transitorio? | Parser, imports dinámicos, reexports, resolución NodeNext, falsos positivos/negativos y paths ignorados | Deben constar junto a fixtures válidos, mutaciones, versión y criterio de sustitución | Obligación verificable | DEC005-C01 |

### Dictamen desde Ingeniería

**FACTIBLE CON CONDICIONES DE MATERIALIZACIÓN.** Las capacidades requeridas
pueden implementarse localmente sin depender de CI. La selección de herramienta
y su evidencia no se aprueban en este dictamen.

## Compatibilidad y contradicciones

No se identifican contradicciones materiales restantes:

- ADR-002 conserva una app/artefacto, ownership, contratos, grafo acíclico,
  dominio independiente y ausencia de módulos vacíos;
- ADR-005 conserva NestJS como shell y prohíbe framework en dominio/aplicación;
- ADR-009 conserva un repositorio sin workspaces, packages o servicios
  anticipatorios;
- DEC-002/062 conservan R0 como fundación sin Reparaciones;
- DEC-004 conserva ESM/NodeNext, scripts y shell sin definir estructura;
- las decisiones de dominio informan ownership, pero no se elevan
  automáticamente a módulos físicos.

Las cuatro ambigüedades detectadas se corrigieron antes de emitir el dictamen.

## Condiciones obligatorias

Las condiciones no posponen la selección: gobiernan su materialización. Cada
una es verificable y bloquea código funcional si se incumple.

| ID | Obligación | Responsable | Momento | Evidencia | Consecuencia del incumplimiento |
| --- | --- | --- | --- | --- | --- |
| DEC005-C01 | Implementar un check local determinista para las familias Blocker, con fixtures válidos, mutaciones negativas, detección de ciclos y límites del checker documentados | Ingeniería; revisión de Arquitectura | Dentro del PBI de materialización y antes de cualquier código funcional | Comando no interactivo, exit codes, matriz regla/caso, mutaciones y documento de limitaciones | La materialización no pasa revisión; `verify` y todo código funcional permanecen bloqueados |
| DEC005-C02 | Materializar sólo paths con contenido autorizado; no crear módulos o subdirectorios futuros vacíos | Ingeniería; revisión de Arquitectura | En cada cambio de estructura, comenzando por el PBI de materialización | Árbol y diff; checker de paths; justificación de cada directorio | El path se elimina o el cambio se devuelve; no puede recibir código funcional |
| DEC005-C03 | Registrar ownership, superficie pública, consumidores y grafo real de cada módulo antes de que reciba código funcional | Arquitectura para fronteras; Ingeniería para registro y verificación | En el PBI de materialización y ante cada cambio transversal | Registro de ownership, exports públicos y grafo comparado con imports | El módulo no puede aceptar código funcional ni dependencias nuevas |
| DEC005-C04 | Mantener `shared/` vacío hasta que cada elemento cumpla los siete criterios y registrar toda excepción con vencimiento y retiro | Arquitectura; Ingeniería aplica el gate | Antes de admitir un elemento shared o una excepción | Allowlist/revisión del elemento o registro de excepción completo | El elemento o excepción se rechaza y el gate falla |
| DEC005-C05 | Mantener DEC-049/044/050/051/063 y los remanentes de DEC-004 como gates independientes; el PBI no incluirá funcionalidad | Arquitectura delimita; Ingeniería ejecuta | Al crear y revisar el PBI de materialización | Alcance del PBI, diff sólo estructural/enforcement y trazabilidad a decisiones pendientes | Detención por expansión de alcance; no se autoriza merge funcional ni R0 |

## Riesgos aceptados y residuales

| Riesgo | Tratamiento | Estado |
| --- | --- | --- |
| `access` crece por agrupar Identity y Access Control | Medir cohesión y cambiar frontera sólo por revisión explícita | Aceptado para la selección |
| `src/infrastructure/` se vuelve depósito global | D5-R019/020/022 y DEC005-C03/C04 | Condicionado |
| Checker transitorio omite sintaxis compleja | Mutaciones, limitaciones registradas y criterio de evolución | Condicionado |
| Una persona ejerce Arquitectura e Ingeniería | Registrar decisiones separadamente por función | Aceptado y visible |
| La estructura real revele otra frontera | Revisión previa del grafo; no usar `forwardRef` o deep import como parche | Residual |
| Ownership lógico se confunda con tablas | DEC-049 conserva la decisión y bloquea persistencia | No aceptado por DEC-005 |

## Efectos del dictamen

Quedan aprobados como selección:

- el árbol objetivo y las tres agrupaciones iniciales;
- el grafo, APIs internas y reglas D5-R001 a D5-R036;
- shared kernel mínimo e infraestructura separada;
- restricciones NestJS;
- capacidades de enforcement y gobierno de excepciones;
- creación posterior de un PBI separado de materialización.

Permanecen pendientes:

- materialización y evidencia de DEC-005;
- selección de herramienta del checker dentro del PBI autorizado;
- DEC-049, DEC-044, DEC-050, DEC-051 y DEC-063;
- ratificación/evidencia restante de DEC-004;
- mecanismos H1, Sprint 00, autorización de Producto y R0.

## Asuntos no aprobados

- código funcional o módulos de Reparaciones;
- persistencia, SQL, repositorios concretos, migraciones o datos;
- autenticación, PIN, sesiones o autorización ejecutable;
- controllers o endpoints funcionales;
- CI, proveedor, thresholds o Definition of Done;
- workspaces, packages, microservicios o nuevos desplegables;
- merge funcional, inicio general de R0 o deploy.

## Siguiente gate y siguiente acción

El siguiente gate de gobierno es **DEC-049 — Repositorios y propiedad lógica**.
Su resolución debe usar los módulos y la dirección aceptados, sin reinterpretar
ownership físico por inferencia.

La siguiente acción exacta es **crear un PBI separado para materializar la
estructura y el enforcement local aprobado, sin código funcional**. Crear el
PBI no equivale a ejecutarlo ni a cerrar DEC-049.

## Trazabilidad

- [Propuesta aceptada](DECISION_PROPOSAL.md).
- [Resultado del dictamen](RESULTS.md).
- [Inventario canónico](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md).
- [Dependencias](../../architecture-readiness/blocker-closure/DEPENDENCIAS_ENTRE_DECISIONES.md).
- [Secuencia](../../architecture-readiness/blocker-closure/SECUENCIA_DE_DECISIONES.md).
- [Criterios de inicio](../../architecture-readiness/repair-mvp/CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md).

Este documento registra el dictamen aportado por la autoridad declarada. No es
una firma digital ni evidencia de materialización.
