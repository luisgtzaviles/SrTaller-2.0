# Orden mínimo recomendado de resolución

## Principio

El orden se deriva de dependencias reales, no de la numeración. Distingue decisión de selección, evidencia de cierre y programación. Ningún paso cambia estados automáticamente.

## Orden recomendado

### Prerrequisitos satisfechos — DEC-004 y DEC-005

DEC-004 ya seleccionó:

- package manager y versión;
- lockfile e instalación congelada;
- política de scripts y supply chain;
- pinning de Node.js `24.x`;
- ESM/CommonJS;
- compilador/ejecución TypeScript;
- versiones alineadas de NestJS `11.x`;
- contrato de build/start y matriz de compatibilidad con PostgreSQL `18.x`.

DEC-005 ya materializó agrupación, ownership, APIs internas, imports,
excepciones y enforcement. La sexta verificación formal concluyó `PASS` y
PBI-022 está `Done`.

La ratificación Linux nativa y VC-024 de DEC-004 siguen pendientes. DEC-049
fue aceptada el 2026-07-24 y sus ocho condiciones de materialización continúan
vigentes.

### Prerrequisito satisfecho — DEC-049

La [revisión formal](../../decisions/dec-049-persistence-ownership/FORMAL_REVIEW.md)
de puertos/repositories, ownership de tablas, transacciones, contexto
tenant/sucursal y acceso Kysely + `pg` completó cinco `PASS WITH CONDITIONS`.
El Responsable del Proyecto emitió las cinco resoluciones y aceptó DEC-049 el
2026-07-24. DEC049-C01 a C08 no están cumplidas ni autorizan materialización.

**Criterio preservado:** los puertos propietarios, firmas tenant-aware,
transacciones, consultas administrativas y ownership aceptados son normativos.

### Prerrequisito satisfecho — DEC-044

La [revisión formal](../../decisions/dec-044-error-strategy/FORMAL_REVIEW.md)
confirmó categorías, mapeo seguro, no divulgación, persistencia, retry,
logging y testing. El Responsable del Proyecto emitió las cinco resoluciones y
aceptó DEC-044 el 2026-07-24. DEC044-C01 a C08 permanecen pendientes.

**Criterio preservado:** los errores deben probarse mediante el mismo gate que
protege arquitectura y aislamiento. La aceptación no materializa el contrato.

### Prerrequisito satisfecho — DEC-051

La [revisión formal](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md)
confirmó runner base, comandos canónicos, typecheck/build/arquitectura,
integración PostgreSQL, aislamiento, traducción y sanitización de errores,
reglas de fallo, CI Linux y política de flakiness. El Responsable del Proyecto
aceptó DEC-051 el 2026-07-24 con C01 a C10 vigentes y pendientes.

**Justificación:** DEC-005, DEC-044 y DEC-049 ya aportan los contratos que el
gate debe hacer ejecutables. DEC044-C08 asigna expresamente esta obligación a
DEC-051.

**Criterio preservado:** C01 a C10 no se consideran cumplidas por la
aceptación. La materialización, branch protection, PostgreSQL real y VC-024
requieren evidencia posterior.

**Impacto sobre DEC-004:** define el gate que permitirá ejecutar VC-024 sin
convertir la evidencia de SPIKE-009 en scaffold.

### Prerrequisito satisfecho — DEC-063

La
[revisión formal](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md)
aceptó base común más checklist por tipo y riesgo, evidencia, excepciones y
separación `Done`/`Released`. DEC063-C01 a C08 continúan `Pending`.

**Criterio preservado:** la aceptación no materializa templates, riesgo,
manifest, CI ni checklists especializados.

**Impacto sobre DEC-004:** establece la evidencia objetiva para recomendar el cierre de reproducibilidad y evita que “compila” equivalga a “terminado”.

### 1. Evidencia final de DEC-004

Materializar bajo autorización separada los prerrequisitos mínimos de
DEC-051/063, ejecutar dos corridas CI equivalentes de VC-024 y someter la
evidencia a dictamen.

**Criterio de salida:** compatibilidad y reproducibilidad demostradas, VC-024
cerrada por autoridad y ninguna condición marcada por inferencia.

### 2. DEC-050 — Migraciones reproducibles y ampliación de DEC-051

Resolver después de DEC-049 y dentro de la toolchain de DEC-004; puede
prepararse en paralelo sin desplazar el siguiente gate H0, VC-024.

**Justificación:** la herramienta de migración debe coexistir con el acceso a datos, ownership y transacciones elegidos. Su evidencia se incorpora al contrato aceptado de DEC-051.

**Criterio de salida:** herramienta/versiones, naming/checksum, ejecución única y concurrente segura, permisos, migración desde cero y desde versión previa, estrategia de irreversibles, rollback/roll-forward, pruebas y evidencia por tenant.

**Impacto sobre DEC-004:** completa la integración PostgreSQL que necesita la fundación R0; no cambia el motor aceptado.

## Trabajo posterior necesario para programar/completar R0

Después de los cierres pendientes siguen los paquetes H1:

1. mecanismos de estación/vinculación/revocación y threat model;
2. protección de PIN, intentos, sesión, inactividad e invalidación;
3. composición de roles/capacidades y clasificación de operaciones de R0;
4. auditoría mínima, secretos, tiempo y fixtures;
5. autorización organizacional y PBI trazado;
6. implementación y demostración según DEC-062.

## Decisiones que pueden resolverse conjuntamente

| Paquete | Motivo | Límite que se conserva |
| --- | --- | --- |
| DEC-005 → DEC-049 | Estructura y ownership son inseparables para evitar fronteras nominales | Es una dependencia satisfecha, no un paquete pendiente conjunto |
| DEC-044 aceptada → DEC-051 | El contrato de errores necesita gates desde su materialización | Error no se fusiona con log, auditoría u observabilidad |
| DEC-050 + ampliación DEC-051 | Toda política de migración necesita ejecución automatizada | DEC-050 decide migración; DEC-051 decide el gate |
| DEC-051 + DEC-063 | La DoD consume suites y evidencia | DEC-062 continúa siendo el contrato de aceptación de producto |

## Decisiones que no deben fusionarse

- DEC-004 no debe absorber DEC-049/050: plataforma, acceso a datos y migraciones tienen autoridades y ciclos distintos.
- DEC-005 no debe absorber módulos futuros de Reparaciones: R0 no los implementa.
- DEC-044 no debe absorber auditoría de negocio.
- DEC-051 no debe redefinir los escenarios de DEC-062.
- DEC-063 no debe convertirse en autorización de release ni en aceptación de R0.

## Primer trabajo concreto recomendado

**Preparar y ejecutar VC-024 con autorización separada.**

El trabajo debe materializar sólo los prerrequisitos mínimos de DEC-051/063,
producir dos corridas Linux equivalentes, conservar evidencia sanitizada y
obtener dictamen. No debe reabrir DEC-044/049/051/063, sustituir DEC-062,
autorizar R0 o cerrar Sprint 00.

## Resultado esperado del camino

La selección DEC-004, DEC-005/PBI-022 y DEC-044/049/051/063 ya aportan
entradas suficientes. Para construir el baseline funcional completo aún
deberán cerrarse VC-024, la materialización aplicable de DEC-051/063 y los
mecanismos H1 señalados.
