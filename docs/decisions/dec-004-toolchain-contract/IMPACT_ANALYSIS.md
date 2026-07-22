# DEC-004 — Análisis de impacto del contrato de toolchain

## Resumen

Aceptar la selección propuesta elimina incertidumbre de runtime, dependencias, módulos y compilación. No desbloquea por sí sola el baseline funcional ni autoriza código. Produce una plataforma sobre la que las decisiones posteriores pueden elegir estructura, persistencia y pruebas sin adoptar herramientas por accidente.

## Frontera de responsabilidades

| Decisión | Lo que DEC-004 entrega | Lo que sigue perteneciendo a esa decisión |
| --- | --- | --- |
| DEC-005 | Runtime, gestor, compilador, ESM y scripts sobre los que puede aplicar enforcement | Carpetas, módulos, ownership, APIs internas, aliases, imports y checker concreto |
| DEC-044 | Exit codes técnicos y source maps seguros como infraestructura | Taxonomía de errores, resultados de aplicación, mapping HTTP, retryability y payload público |
| DEC-049 | Node/TS/Nest/PostgreSQL compatibles como precondición | Driver/ORM/query builder, puertos, repositorios, transacciones, pool y acceso tenant-aware |
| DEC-050 | Un script namespace estable y un runtime reproducible | Migrador, nombres, locking, orden, rollback/roll-forward y comandos de migración |
| DEC-051 | `typecheck`, `build`, `test` y `verify` como interfaces canónicas | Runner, suites, cobertura, arquitectura, integración, CI provider y gates |
| DEC-063 | Evidencia específica para DEC-004 | Perfiles de DoD, aprobadores, excepciones, N/A, retención y criterio global de terminado |

## Impacto sobre DEC-005

### Habilita

- elegir una organización física que compile bajo ESM/NodeNext;
- diseñar enforcement ejecutable mediante scripts locales;
- mantener una sola raíz y aplicación sin workspaces anticipatorios;
- exigir que el grafo no dependa de hoisting o globals.

### No decide

- `src/modules`, nombres de bounded contexts o shared kernel;
- aliases TypeScript, barrel files o paths;
- mapping entre Nest modules y módulos de dominio;
- herramienta AST/textual de enforcement;
- ownership y excepciones de imports.

### Riesgo transferido

ESM exige imports explícitos. DEC-005 deberá decidir si permite aliases y cómo demuestra que Node.js resuelve exactamente lo que TypeScript valida, sin introducir un loader productivo.

## Impacto sobre DEC-044

DEC-004 define comportamiento de comandos y startup: errores de toolchain/configuración producen exit no cero, no corrigen archivos y no revelan secretos. También permite source maps internos.

DEC-044 conserva:

- categorías de error de dominio/aplicación/infraestructura;
- adaptación segura a REST;
- anti-enumeración cross-tenant;
- correlation ID, retryability y contrato público;
- separación entre error, log y auditoría.

No se debe usar una excepción de Node/Nest como modelo de error del dominio.

## Impacto sobre DEC-049

### Habilita

- evaluar sólo herramientas compatibles con Node.js `24.18.0`, ESM, TypeScript `6.0.3`, NestJS `11.x` y PostgreSQL `18.x`;
- fijar cualquier driver/adaptador en el mismo lockfile;
- ejecutar pruebas de compatibilidad sobre Linux.

### Sigue bloqueado

- selección de driver/ORM/query builder;
- firma tenant-aware de repositorios;
- ownership de tablas;
- límites transaccionales;
- pool, timeouts y administración separada.

DEC-004 no incluirá `DATABASE_URL` como requisito del shell hasta que DEC-049 autorice el primer adaptador real.

## Impacto sobre DEC-050

DEC-050 recibe:

- package manager y scripts no interactivos;
- Node/TypeScript exactos;
- Linux autoritativo;
- política de lockfile y dependencias.

DEC-050 todavía debe elegir herramienta y versión de migración, definir comandos (`migrate:*` u otros), locking, permisos, compatibilidad y evidencia. El script `build` o `start` no puede ejecutar migraciones implícitamente.

## Impacto sobre DEC-051

### Contratos disponibles

- `verify:toolchain`, `typecheck`, `build`, `test` y `verify`;
- output y exit codes no interactivos;
- plataforma Linux autoritativa;
- casos negativos de versión/lockfile/globals;
- comparación de dos builds limpios.

### Sigue abierto

- Vitest/Jest/Node test runner u otra herramienta;
- cobertura y thresholds;
- prueba arquitectónica AST/textual;
- servicio PostgreSQL de integración;
- frecuencia local/PR/merge;
- proveedor y definición del workflow CI;
- flakiness, cuarentena y retención.

DEC-051 debe consumir los scripts canónicos, no crear una segunda ruta de build.

## Impacto sobre DEC-063

El [contrato de verificación](VERIFICATION_CONTRACT.md) aporta evidencia específica y estados PASS/CONDITIONAL PASS/FAIL para DEC-004. DEC-063 deberá definir:

- quién revisa esa evidencia por tipo de cambio;
- qué partes son obligatorias en actualización de runtime/dependencias;
- cuándo aplica N/A;
- retención, excepción y vencimiento;
- relación entre candidato local, CI, staging y release.

DEC-004 no declara una DoD general ni convierte un PASS documental en elemento terminado.

## Impacto sobre la baseline ejecutable de DEC-004

Después de aprobar la propuesta será posible, con autorización separada:

1. crear pins, manifest, lockfile y configuración TypeScript;
2. generar un shell NestJS nuevo, sin copiar SPIKE-009;
3. ejecutar instalación, typecheck, build y start;
4. producir evidencia Linux y hashes repetidos;
5. recomendar el cierre técnico de DEC-004.

Todavía no será posible afirmar que:

- migraciones funcionan;
- autenticación o tenant isolation funcionan;
- pruebas funcionales pasan;
- R0 está listo para implementación completa;
- existe un artefacto promovible a producción.

## Impacto sobre la estructura futura del repositorio

- Continúa un único repositorio y una sola raíz ejecutable.
- `src/` y `dist/` son únicamente límites de compilación, no un mapa de módulos.
- No se crean `apps/`, `packages/`, workspaces, Turborepo, Nx o caché remota.
- Scripts técnicos controlados podrán existir en una ubicación que DEC-005 defina.
- `dist/`, caches, `.env` y dependencias instaladas deberán ignorarse; el lockfile y `.env.example` deberán rastrearse cuando se autorice su creación.
- No se introduce frontend ni proyecto adicional.

## Impacto sobre CI

### Queda fijado

- versión exacta de Node/pnpm;
- frozen install;
- comandos canónicos y no interactivos;
- Linux x86_64/glibc como evidencia inicial;
- hashes de build y ausencia de mutación;
- no depender de un contenedor.

### Queda pendiente

- GitHub Actions u otro proveedor;
- imágenes, runners administrados/self-hosted y permisos;
- cache de pnpm y política de confianza;
- secrets/identity federation;
- matrices adicionales;
- artefactos, firma, SBOM y retention.

Un cache puede acelerar descargas; nunca reemplaza lockfile ni puede reutilizar `dist/` como si fuera build limpio.

## Impacto sobre desarrollo local

- La máquina actual con Node.js `25.9.0` será rechazada hasta activar `24.18.0`.
- macOS seguirá soportado como desarrollo con los mismos comandos.
- El IDE no instala, compila ni valida por autoridad propia.
- El flujo compile-watch puede ser algo más lento, pero conserva paridad con producción.
- Onboarding deberá explicar cómo obtener Node/pnpm exactos sin imprimir secretos ni depender de aliases personales.
- No se requiere PostgreSQL para validar únicamente toolchain; se añadirá cuando DEC-049/050 lo exijan.

## Impacto sobre producción

- Producción recibirá JavaScript compilado; no TypeScript ni watcher.
- `start` no instalará, compilará o migrará.
- Node.js deberá coincidir con el pin del artefacto.
- Source maps serán internos y no se expondrán por HTTP.
- Configuración se inyectará externamente y fallará cerrada si es inválida.
- No se decide todavía si producción usa OCI, VM, PaaS, glibc/musl o arm64; cualquier diferencia debe pasar la matriz antes del primer despliegue.

## Impacto sobre onboarding

El futuro onboarding podrá tener un camino único:

1. confirmar commit y árbol limpio;
2. activar Node.js exacto usando uno de los archivos de versión;
3. obtener/verificar pnpm exacto;
4. ejecutar frozen install;
5. copiar sólo nombres desde `.env.example` a una configuración local ignorada;
6. ejecutar `verify`;
7. iniciar `dev`.

Un nuevo desarrollador no deberá adivinar package manager, usar comandos del IDE, instalar TypeScript globalmente ni copiar configuración de otro ambiente.

## Decisiones que continúan bloqueadas

| Bloqueante posterior | Motivo |
| --- | --- |
| DEC-005 | Falta estructura, ownership e imports |
| DEC-044 | Falta contrato de errores seguro |
| DEC-049 | Falta acceso real a PostgreSQL y repositorios tenant-aware |
| DEC-050 | Falta migrador y ejecución reproducible |
| DEC-051 | Falta estrategia de pruebas y CI canónico |
| DEC-063 | Falta Definition of Done aprobada |
| DEC-006/007/008 y mecanismos H1 | Falta aplicación/prueba de multitenancy, identidad y propiedad |
| DEC-010 a DEC-020 — aplicación técnica | Faltan estación, PIN, sesión, roles/capacidades y acciones concretas |
| DEC-045 a DEC-048/055 | Faltan logs, auditoría, observabilidad y secretos |
| Autorización organizacional | La propuesta no autoriza el primer cambio ejecutable |

## Riesgo de cierre prematuro

Aceptar la **selección** no equivale a demostrar su cumplimiento. Si el estado oficial de DEC-004 se cambia a `Cerrada` antes de ejecutar Linux, la documentación debe distinguir explícitamente selección aceptada de verificación pendiente; de otro modo se repetirá el error de declarar reproducibilidad sólo por describirla.

## Conclusión

El contrato reduce la incertidumbre de plataforma sin absorber decisiones posteriores. Su mayor impacto inmediato es permitir que DEC-005/049 y el núcleo de DEC-051 se diseñen contra herramientas explícitas. El baseline funcional continúa bloqueado hasta resolver esas decisiones, los mecanismos H1 y la autorización organizacional.
