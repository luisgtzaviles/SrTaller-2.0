# Materialización local de DEC-005

## Objetivo

Materializar la estructura mínima seleccionada por DEC-005 y un enforcement
local reproducible, sin introducir comportamiento funcional ni resolver gates
posteriores.

## Autoridad y baseline

- PBI ejecutado: [PBI-022](../../backlog/pbis/PBI-022.md).
- Selección: [DEC-005](../../decisions/dec-005-modular-monolith-organization/DECISION_PROPOSAL.md).
- Dictamen: `ACCEPT WITH CONDITIONS`, con DEC005-C01 a DEC005-C05.
- Baseline preservada: Node.js `24.18.0`, pnpm `11.15.1`, TypeScript `6.0.3`,
  ESM y `NodeNext`.
- Alcance operativo: exclusivamente local; sin CI, red de aplicación, base de
  datos, staging, producción ni deploy.

La implementación se hizo desde las decisiones y el PBI aprobados. No se usó
SPIKE-009 como scaffold ni como fuente de código.

## Alcance implementado

Se añadieron los tres únicos módulos autorizados:

```text
src/modules/
├── access/
│   ├── access.module.ts
│   └── index.ts
├── stations/
│   ├── index.ts
│   └── stations.module.ts
└── tenancy/
    ├── index.ts
    └── tenancy.module.ts
```

Cada `index.ts` contiene exclusivamente un contrato de tipos para hacer
observable la frontera y el grafo sin generar comportamiento runtime. Cada
`<module>.module.ts` es composición NestJS mínima y no registra controllers,
providers funcionales, exports funcionales ni rutas.

`AppModule` importa los tres módulos Nest y consume el contrato público de
`access` sólo en compile time. `main.ts`, `startup-config.ts` y el servicio
técnico existente no cambiaron.

## Componentes creados

| Componente | Responsabilidad técnica |
| --- | --- |
| `architecture/dec-005-policy.json` | Catálogo ejecutable de módulos, grafo, superficies, roots gobernados/prohibidos, archivos estructurales, composición, clasificación de reglas, allowlist, registry futuro de persistencia y evidencia requerida |
| `scripts/lib/architecture-checker.mjs` | Análisis AST, normalización iterativa, identidad de imports directos/default/alias/namespace/import-equals/require, shadowing, contenido estructural, NodeNext, grafo, capas, composición, persistencia tenant-scoped y ownership |
| `scripts/check-architecture.mjs` | CLI no interactiva con exit code y diagnóstico estable |
| `scripts/smoke-start.mjs` | Coordinador comprobable e independiente del orden para marker, listener, timeout, salida y cleanup del smoke compilado |
| `test/architecture-fixtures.mjs` | 98 casos aislados: 12 positivos y 86 negativos |
| `test/architecture-persistence-fixtures.mjs` | 36 fixtures PBI-023: cinco positivos y 31 negativos para D5-R037–D5-R047 |
| `test/architecture-fixtures.test.mjs` | Ejecución duplicada, comparación determinista y conjunto completo de reglas/paths por fixture |
| `test/architecture-remediation-mutations.mjs` | Cinco mutaciones FV4 con wrappers, source contractual y una familia por regla afectada |
| `test/architecture-mutations.test.mjs` | 23 mutaciones controladas en 12 familias normativas con reglas/paths exactos, rechazo y restauración |
| `test/architecture-persistence-mutations.mjs` | Once mutaciones owner/tenant/DB, una por regla nueva |
| `test/architecture-persistence-mutations.test.mjs` | Mutación, neutralización fixture-only, restauración y determinismo por regla |
| `test/architecture-semantic-coverage.mjs` | Identidad canónica D5-R033 central: snapshot efectivo, tokens de source, paths, serialización tipada, detección y diagnóstico |
| `test/architecture-semantic-coverage.test.mjs` | Seis mutaciones semánticas con restauración, diez rechazos de equivalencia y ocho controles de distinción legítima |
| `test/architecture-coverage.test.mjs` | Contrato D5-R033 de 49 coberturas críticas únicas, correspondencia exacta con policy y unitarias del normalizador AST |
| `test/architecture-policy.test.mjs` | Consistencia policy/documentos y diez órdenes/fallos/cleanup del coordinador de smoke |
| `test/architecture-support.mjs` | Creación y eliminación segura de árboles temporales |
| `architecture` / `verify:architecture` | Alias solicitado y verificación del árbol real con toolchain exacta |
| `test:architecture` | Pruebas focalizadas del checker |
| `verify` | Gate local existente ampliado con pruebas y arquitectura |

## Decisiones técnicas

1. El checker es JavaScript ESM y usa la API de TypeScript `6.0.3`, ya fijada
   por DEC-004, sólo como parser. No ejecuta TypeScript ni agrega dependencias.
2. La política está separada del código para que módulos, edges, superficies y
   evidencia tengan una fuente legible por máquina.
3. Los contratos son `interface` type-only. No contienen tenant IDs, PIN,
   sesiones, capacidades ni reglas de autorización.
4. La dirección observada se expresa con imports `type` desde el `index.ts`
   productor; no hay imports profundos ni dependencias runtime entre módulos.
5. El checker del producto inspecciona `src/`; los fixtures viven en `test/` y
   sólo se materializan en directorios temporales del sistema.
6. La allowlist de archivos de módulo hace fallar cualquier artefacto de
   negocio agregado durante este PBI.
7. Los diagnósticos se ordenan por regla, path y mensaje para asegurar salida
   determinista.
8. Los archivos obligatorios se validan por contenido efectivo y AST; un
   archivo vacío, whitespace-only, comment-only, inválido o sin la declaración
   exacta ya no puede producir un falso PASS.
9. `AppModule` exige clase exportada, `@Module`, metadata estática, un arreglo
   literal `imports` y los tres símbolos/imports exactos, sin extras ni
   duplicados.
10. Un resolvedor AST compartido identifica símbolos por package de origen,
    nombre importado y nombre local; acepta import directo, alias y namespace,
    y descarta imports ajenos, homónimos, texto inerte y usos ocultos por
    parámetros/declaraciones locales.
11. D5-R025/R026/R027/R029/R035/R036 consumen ese resolvedor. D5-R035 conserva
    el gate de alcance funcional y D5-R036 mantiene un diagnóstico propio para
    decisiones de contexto/autorización dentro de controllers.
12. El smoke espera de forma independiente marker y listener, conserva
    stdout/stderr y limpia listeners, probe, proceso hijo y handles tanto en
    PASS como en FAIL.
13. La identidad importada se normaliza de forma central e iterativa para
    paréntesis, aserciones `as`/angulares, non-null, `satisfies` y el wrapper
    interno `PartiallyEmittedExpression`. Calls, acceso calculado,
    condicionales y binarios conservan su frontera semántica.
14. D5-R027 reconoce el decorador `Global` ligado a `@nestjs/common`; se
    eliminó la búsqueda global de propiedades `global: true`, que confundía
    objetos ordinarios con composición Nest.
15. D5-R033 conserva una lista machine-readable de casos semánticos críticos;
    sus pruebas separan conteo/IDs/policy de la identidad ejecutable y exigen
    26 contratos únicos por tipo, polaridad, reglas, diagnóstico, path,
    snapshot efectivo de source/directorios y configuración material.
16. La clave canónica no incluye ID, nombre, descripción, evidencia textual,
    posición ni orden de propiedades. Normaliza paths y trivia del source;
    conserva tokens, tipos y cualquier propiedad futura no reconocida como
    material, por lo que falla de forma conservadora.
17. PBI-023 registra paths futuros aprobados sin materializarlos. Un archivo
    DB futuro sólo pasa si su path, owner, API, consumidor, port, adapter,
    composición y objeto físico coinciden exactamente con policy.
18. La neutralización de reglas existe sólo como prueba adversarial
    in-process sobre fixtures; el checker rechaza ese parámetro en producto y
    el CLI no ofrece flag para desactivar reglas.

## Paths no materializados

- `src/shared/` permanece ausente: equivale al shared kernel vacío exigido y
  evita un placeholder.
- `src/infrastructure/` permanece ausente: el shell actual no necesita una
  facility técnica adicional y mover configuración aceptada ampliaría el diff
  sin beneficio.
- No se crearon capas internas. Aparecerán sólo cuando exista un artefacto
  autorizado con responsabilidad real.

## Diferencias respecto al árbol ilustrativo

El árbol de DEC-005 era normativo respecto de roots y límites, pero no obligaba
a crear paths vacíos. Por DEC005-C02 se omitieron físicamente `shared/`,
`infrastructure/` y todas las capas internas. No hay otra diferencia.

## Ausencias confirmadas

- lógica funcional o flujos de negocio;
- controllers, endpoints, DTOs o eventos de negocio;
- autenticación, autorización, PIN, sesiones o multitenancy funcional;
- persistencia, repositories, SQL, migraciones, conexión o datos;
- CI, workflow, proveedor o policy de merge;
- dependencias nuevas, workspaces, packages o servicios adicionales;
- cambios en SPIKE-009.

## Limitaciones actuales

El checker es enforcement local transitorio. Sus límites precisos están en
[ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md) y su correspondencia completa
está en [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md). Las reglas semánticas
que no pueden probarse por AST/path siguen exigiendo revisión humana. DEC-051
debe decidir la estrategia general de pruebas e integración futura sin
duplicar esta política.

## Siguientes pasos

1. La sexta verificación formal independiente quedó ejecutada con
   [resultado PASS](FORMAL_VERIFICATION_6.md).
2. DEC-005 queda `Accepted — Materialized / Formally Verified` y PBI-022
   queda `Done`.
3. Continuar el gate documental DEC-049 sin introducir persistencia por
   inferencia y sin resolver automáticamente DEC-050/051/063.
