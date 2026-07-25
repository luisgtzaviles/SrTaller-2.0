# Vacíos de gobierno para desbloquear DEC-004

## Hallazgo principal

No existe una contradicción material entre los ADR/DEC aceptados que impida
ordenar el trabajo. DEC-004, DEC-005, DEC-044, DEC-049, DEC-051 y DEC-063 ya
tienen registros autoritativos. El vacío H0 activo es VC-024; DEC-050 y la
materialización condicionada de DEC-051/063 permanecen como trabajo posterior
según su hito y autorización.

## Vacíos por decisión

### DEC-004 — Baseline técnica de plataforma

**Ya resuelto:**

- ADR-001: TypeScript y Node.js `24.x`;
- ADR-003: PostgreSQL `18.x`, versión efectiva inicial `18.4`;
- ADR-005: NestJS `11.x`, referencia `11.1.28`, Express y REST/HTTP JSON mínima;
- ADR-009: repositorio único, una aplicación/artefacto y workspaces bajo demanda.

**Preguntas respondidas por la decisión aceptada:**

- ¿Qué package manager y versión se fijan?
- ¿Cuál es la política de lockfile, instalación congelada y actualizaciones?
- ¿Qué scripts de lifecycle se permiten, rechazan o revisan?
- ¿Qué versión efectiva de Node.js `24.x` se fija y cómo se impide usar `25.x` accidentalmente?
- ¿ESM o CommonJS?
- ¿Qué compilador o estrategia de ejecución TypeScript se usa?
- ¿Qué configuración mínima de strictness y validación de ambiente se exige?
- ¿Cómo se prueba la combinación Node/NestJS/PostgreSQL sin adoptar tooling del spike por inercia?
- ¿Qué constituye el gate Linux y qué evidencia demuestra reproducibilidad?

**Acción propuesta:** conservar DEC-004 y consolidar su remanente en un registro de decisión de toolchain reproducible. Proponer cierre sólo después de selección, pinning, instalación limpia, build/test mínimo y ejecución Linux. No sustituirla ni declararla superseded.

### DEC-005 — Organización inicial del monolito

**Ya resuelto:** ADR-002 fija monolito modular, una aplicación/artefacto, dominio independiente, ownership y dependencias acíclicas; ADR-005 fija NestJS como shell; ADR-009 prohíbe workspaces/packages/apps anticipatorios.

**Estado actual:** estas preguntas quedaron resueltas por la decisión aceptada,
su materialización y la
[sexta verificación formal](../dec-005-materialization/FORMAL_VERIFICATION_6.md),
que concluyó `PASS` para DEC005-C01 a C05. PBI-022 está `Done`.

**Acción actual:** aplicar DEC-005 como entrada satisfecha de DEC-049. No
reabrirla, fusionarla con persistencia ni crear fronteras futuras de
Reparaciones como módulos vacíos.

### DEC-044 — Estrategia de errores

**Ya resuelto:** ADR-005 exige adaptación segura y separación transporte/aplicación; ADR-004 y DEC-062 prohíben revelar existencia o contenido cross-tenant; la arquitectura de aplicación ya distingue validación, autenticación, autorización, conflicto, límite y dependencia.

**Preguntas resueltas por la propuesta de DEC-044:**

- ¿Cuál es la taxonomía mínima de errores de dominio, aplicación e infraestructura?
- ¿Qué información estable cruza a REST/JSON y cuál queda sólo en observabilidad?
- ¿Qué errores son reintentables, conflictivos o definitivos?
- ¿Cómo se mapean autenticación, autorización, contexto inválido y recurso ajeno sin enumeración?
- ¿Qué identificador de error y correlation ID se devuelve?
- ¿Cómo se preserva causa técnica sin acoplar dominio a NestJS ni filtrar SQL/stacks?
- ¿Qué relación existe entre error, log técnico, auditoría de negocio y evento de seguridad?

**Resolución registrada:** la
[revisión formal de DEC-044](../../decisions/dec-044-error-strategy/FORMAL_REVIEW.md)
confirmó errores tipados por capa, catálogo, contrato REST/JSON, HTTP, logging,
retry, persistencia, servicios externos, dominio y pruebas. El Responsable del
Proyecto emitió las cinco resoluciones el 2026-07-24 y DEC-044 queda
`Accepted`; DEC044-C01 a C08 permanecen vigentes y pendientes.

**Acción actual:** trasladar DEC044-C08 y la matriz normativa a DEC-051, sin
materializar clases, adapters, logging o retry por inferencia. DEC-044 no
absorbe auditoría ni observabilidad como si fueran la misma señal.

### DEC-049 — Repositorios y propiedad lógica

**Ya resuelto:** ADR-002 fija ownership y prohíbe acceso transversal; ADR-003 fija PostgreSQL y principios de transacción; ADR-004 fija discriminadores y contexto; ADR-005 fija puertos hacia adentro; ADR-009 prohíbe un package ORM compartido entre módulos.

**Preguntas respondidas por la propuesta, pendientes de aprobación:**

- ¿Driver directo, query builder u ORM, y por qué?
- ¿Qué contrato explícito reciben todos los repositorios tenant/sucursal-scoped?
- ¿Quién abre y confirma la transacción: caso de uso, unidad de trabajo o adaptador?
- ¿Cómo se impide un método global ordinario o un `findById` sin contexto?
- ¿Cómo se asigna ownership de tablas y constraints a los módulos físicos de R0?
- ¿Cómo se publican lecturas cross-module sin exponer internals?
- ¿Qué interfaz separada permite administración SaaS sin convertirse en bypass?
- ¿Qué constraints compuestos refuerzan coherencia tenant–sucursal?

**Resolución registrada:** ADR-004 fijó invariantes y DEC-005 aportó la organización modular. [DEC-049](../../decisions/dec-049-persistence-ownership/DECISION_PROPOSAL.md) resolvió el mecanismo y fue aceptada el 2026-07-24 por el Responsable del Proyecto después de cinco `PASS WITH CONDITIONS`. DEC049-C01 a C08 permanecen vigentes y no cumplidas para la futura materialización.

### DEC-050 — Migraciones y versionado de esquema

**Ya resuelto:** ADR-003 obliga migraciones versionadas, inmutables y reproducibles, backfills reiniciables, compatibilidad y estrategia explícita para irreversibles. La [política propuesta](../../operations/MIGRATION_POLICY.md) desarrolla expandir–migrar–contraer y evidencia por tenant.

**Preguntas abiertas reales:**

- ¿Qué herramienta de migración se adopta y cómo convive con DEC-049?
- ¿Naming, orden, checksum e inmutabilidad de archivos?
- ¿Quién genera, revisa, aprueba y ejecuta?
- ¿Qué lock evita carreras de ejecución y qué cuenta/permisos usa?
- ¿Qué cambios son transaccionales en PostgreSQL y cómo se manejan los que no lo son?
- ¿Cómo se prueba desde cero y desde una versión anterior?
- ¿Cuándo se usa rollback y cuándo roll-forward?
- ¿Qué compatibilidad entre aplicación y esquema se retiene?
- ¿Qué evidencia por tenant y qué criterio de pausa/aborto se exige?

**Acción propuesta:** convertir la política existente en entrada de una decisión explícita, después de DEC-049. No declararla superseded; ADR-003 sólo resolvió principios.

### DEC-051 — Estrategia de pruebas

**Ya resuelto:** ADR-004 exige pruebas negativas con dos tenants; ADR-005 exige pruebas arquitectónicas; DEC-062 fija escenarios obligatorios; ADR-010/011/012/013 fijan matrices conceptuales de contexto, sesión, autorización y refuerzo.

**Preguntas respondidas por la propuesta, pendientes de aprobación:**

- ¿Qué runner y herramientas se adoptan por capa?
- ¿Cuál es el gate canónico local/PR/merge y cómo se ejecuta en Linux?
- ¿Qué cobertura o criterios por riesgo se exigen sin optimizar una métrica vacía?
- ¿Cómo se levanta PostgreSQL 18.x reproduciblemente para integración?
- ¿Qué suite de aislamiento es obligatoria en cada cambio de persistencia/contexto?
- ¿Qué checker arquitectónico se usa inicialmente y cuándo debe evolucionar a AST?
- ¿Cómo se manejan flakiness, cuarentena y fallos del gate?
- ¿Qué pruebas de migración y rollback/roll-forward forman parte del gate?

**Resolución registrada:** la
[revisión formal](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md)
confirmó cinco `PASS WITH CONDITIONS` y el Responsable del Proyecto aceptó
DEC-051 el 2026-07-24. La Opción B define pipeline por capas/riesgo,
`pnpm run verify`, Linux,
PostgreSQL `18.4`, aislamiento negativo, DEC-044/049, checker, flakiness,
evidencia, VC-024 y protección de `main`. DEC051-C01 a C10 siguen pendientes;
no se debe inferir materialización, cumplimiento de VC-024 ni tooling de
SPIKE-009.

### DEC-063 — Definition of Done

**Resolución registrada:** la
[revisión formal](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md)
confirmó cinco `PASS WITH CONDITIONS` y el Responsable del Proyecto aceptó
DEC-063 el 2026-07-24. Se adoptó base común más checklist por tipo y riesgo,
con estados separados, evidencia, defectos, flakiness, excepciones y
`Done`/`Released` diferenciados.

DEC063-C01 a C08 continúan `Pending`. No se debe inferir que existen templates,
matriz ejecutable de riesgo, manifest, CI, protección, checklists
materializados o waivers operativos.

**Frontera preservada:** DEC-062 define el producto observable; DEC-063 define
cuándo un trabajo puede declararse terminado. No se fusionan.

## Solapamientos y fronteras recomendadas

| Solapamiento | Frontera recomendada |
| --- | --- |
| DEC-004 ↔ DEC-051 | DEC-004 decide toolchain y reproducibilidad; DEC-051 decide suites/gates. Un gate mínimo de DEC-051 produce evidencia para DEC-004 |
| DEC-005 ↔ DEC-049 | DEC-005 ya gobierna y verifica estructura/imports; DEC-049 consume esa entrada y decide puertos/tablas/transacciones |
| DEC-044 ↔ ADR-005 | ADR-005 fija responsabilidad y no divulgación; DEC-044 fija taxonomía y contrato concreto |
| DEC-049 ↔ ADR-002/003/004/009 | Los ADR fijan invariantes y prohibiciones; DEC-049 elige mecanismo ejecutable compatible |
| DEC-050 ↔ ADR-003 | ADR-003 fija principios; DEC-050 selecciona herramienta, lifecycle y evidencia |
| DEC-051 ↔ ADR-004/005/DEC-062 | Las autoridades previas fijan qué debe probarse; DEC-051 define cómo, cuándo y con qué gate |
| DEC-063 ↔ DEC-062 | DEC-062 fija aceptación observable de R0; DEC-063 fija cuándo un cambio puede declararse terminado |

## Contradicciones y drift documental

### Contradicciones materiales

No se encontró una contradicción material entre ADR aceptados. ADR-001/002/003/004/005/009/010/011/012/013 son compatibles y separan deliberadamente sus autoridades.

### Ambigüedades que deben corregirse al resolver, no ahora

1. DEC-004 enumera driver/repositorios y migraciones entre sus componentes pendientes, mientras la secuencia oficial coloca DEC-049 y DEC-050 después de DEC-004. Debe aclararse que son bloqueantes de la fundación ejecutable R0, pero no necesariamente del cierre estricto de la selección de plataforma.
2. DEC-004 exige una primera ejecución del gate CI Linux y DEC-051 ya define ese gate. Se conserva la secuencia en dos fases: toolchain DEC-004 → contrato DEC-051 aceptado → materialización/evidencia final DEC-004.
3. El grafo vigente dibuja `DEC-049 → DEC-050`; DEC-049 ya está aceptada y DEC-050 conserva la selección y operación de migraciones.
4. `DEC-050` está clasificada H1, pero el resultado observable de R0 exige migraciones base. No es una contradicción: sí significa que cerrar H0 permite iniciar código, no completar el baseline R0.

### Drift histórico no autoritativo

- El README raíz aún describe ADR-005 como propuesto, mientras el registro oficial y el ADR lo marcan `Accepted` desde 2026-07-22.
- El checklist de salida de R0 mantiene sin marcar una fila que combina “ADR-005 aceptado” con “package manager/lockfile/baseline final”; sólo la segunda parte continúa pendiente.

Este audit registra el drift y no modifica esos archivos por la restricción del trabajo.

## Vacíos fuera de las siete DEC que aún bloquean R0

Aunque las siete decisiones se resuelvan, el baseline funcional pedido anteriormente todavía necesita:

- threat model de multitenancy, PIN, sesión y estación;
- mecanismo de reconocimiento/vinculación y revocación de estación compatible con ADR-010;
- protección de PIN, intentos, recuperación e invalidación de sesión compatible con ADR-011;
- composición concreta de roles/capacidades para R0 compatible con ADR-012;
- clasificación nivel 1–4 de cada operación compatible con ADR-013;
- auditoría mínima, secretos y modelo temporal;
- fixtures reproducibles con dos tenants;
- autorización organizacional explícita para iniciar implementación.

Estos vacíos no deben introducirse silenciosamente dentro de DEC-004.

## Vacíos por autoridad

| Tema | Autoridad necesaria |
| --- | --- |
| Toolchain y baseline | Arquitectura + Ingeniería; Calidad/Operaciones/Seguridad según evidencia |
| Organización modular | Arquitectura, con Ingeniería para enforcement |
| Acceso a datos | Arquitectura + Ingeniería; Seguridad para aislamiento |
| Migraciones | Arquitectura + Ingeniería + Operaciones |
| Pruebas, CI y gates | Arquitectura + Ingeniería + Seguridad + Operaciones + Calidad |
| Definition of Done | Calidad + Arquitectura + Producto |
| Roles/capacidades concretos | Producto + Seguridad |
| PIN/sesión/estación técnicos | Seguridad + Arquitectura + Operaciones; Producto para experiencia/política |
| Autorización de implementación | Responsable de Producto según el gate vigente |
