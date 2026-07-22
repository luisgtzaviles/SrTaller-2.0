# DEC-004 — Contrato de toolchain reproducible

## Identificación y estado

- **Identificador:** DEC-004.
- **Título:** Contrato de toolchain reproducible para la aplicación backend inicial.
- **Estado anterior:** `Abierta — Formal Review Complete / Approval Pending`.
- **Estado actual:** `Accepted — Selection Approved / Evidence Pending`.
- **Fecha de decisión:** 2026-07-22.
- **Autoridad decisora:** Luis Antonio Gutiérrez Avilés, responsable del proyecto, mediante aprobación conjunta desde las funciones de Arquitectura e Ingeniería.
- **Vistos buenos:** Seguridad, Operaciones y Calidad, otorgados por la misma autoridad efectiva desde esas perspectivas.
- **Evidencia de aprobación:** dictamen explícito del responsable del proyecto, registrado en la [revisión formal](../../decisions/dec-004-toolchain-contract/FORMAL_REVIEW.md).
- **Efecto:** acepta exclusivamente la selección arquitectónica y autoriza el PBI de materialización/verificación; no declara implementación ni reproducibilidad demostrada.

`Accepted` se limita a la selección. El sufijo `Selection Approved / Evidence Pending` registra que la implementación, ejecución y evidencia autoritativa siguen abiertas. La aprobación cumple la regla del [registro de ADR](../../decisions/README.md) porque identifica autoridad, fecha y alcance; no permite usar `Implemented`, `Verified`, `Complete`, `Closed` ni `Reproducibility Proven` antes de ejecutar satisfactoriamente el contrato.

## Contexto

Las decisiones aceptadas ya fijan los límites durables de la plataforma:

| Componente | Fuente autoritativa | Baseline vigente |
| --- | --- | --- |
| Lenguaje y runtime | [ADR-001](../../decisions/proposed/ADR-001-typescript-as-primary-language.md) | TypeScript y Node.js `24.x` |
| Forma de aplicación | [ADR-002](../../decisions/proposed/ADR-002-modular-monolith-first.md) | Monolito modular, una aplicación y un artefacto iniciales |
| Persistencia primaria | [ADR-003](../../decisions/proposed/ADR-003-postgresql-primary-database.md) | PostgreSQL `18.x`; referencia inicial `18.4` |
| Multitenancy | [ADR-004](../../decisions/proposed/ADR-004-shared-schema-multitenancy.md) | Base y esquema compartidos con aislamiento obligatorio |
| Shell backend | [ADR-005](../../decisions/proposed/ADR-005-nestjs-backend.md) | NestJS `11.x`; referencia `11.1.28`; Express y REST/HTTP JSON mínima |
| Repositorio | [ADR-009](../../decisions/proposed/ADR-009-monorepo-strategy.md) | Repositorio único; workspaces sólo bajo demanda |

Esas decisiones no eligieron package manager, lockfile, versión efectiva de Node.js, sistema de módulos, compilador, forma de ejecución o evidencia de reproducibilidad. [SPIKE-009](../../../spikes/spike-009-nestjs-shell/RESULTS.md) demuestra viabilidad del shell, pero es desechable y no decide el toolchain de producto.

## Problema

Sin un contrato único, colaboradores y pipelines podrían usar versiones, gestores, lockfiles o rutas de compilación diferentes. Eso permitiría builds no comparables, dependencias globales implícitas, scripts de instalación no revisados, ejecución directa de TypeScript en producción o evidencia local presentada erróneamente como reproducibilidad.

## Alcance

DEC-004 debe decidir:

- versión efectiva, pinning y política de actualización de Node.js `24.x`;
- package manager, versión, lockfile e instalación congelada;
- política de scripts de dependencias y supply chain;
- ESM/CommonJS;
- versión y configuración conceptual de TypeScript;
- estrategia de desarrollo y de producción;
- directorios de fuente y salida, source maps y scripts canónicos;
- plataforma autoritativa y evidencia específica de reproducibilidad.

## Fuera de alcance

DEC-004 no decide ni cierra:

- `DEC-005`: estructura física, ownership, imports y enforcement modular;
- `DEC-044`: taxonomía y adaptación segura de errores;
- `DEC-049`: driver/ORM/query builder, repositories, transacciones y pool;
- `DEC-050`: herramienta y lifecycle de migraciones;
- `DEC-051`: test runner, suites, cobertura, proveedor y gates generales de CI;
- `DEC-063`: Definition of Done, excepciones y aprobaciones por cambio;
- ADR-007: contenedores, empaquetado, promoción o plataforma de despliegue;
- PIN, sesiones, estación, roles, capacidades, datos, SQL o funcionalidad de R0;
- scaffold, código, infraestructura o autorización del primer cambio ejecutable.

## Autoridad y vistos buenos

| Perspectiva | Responsabilidad en DEC-004 | Estado de esta revisión |
| --- | --- | --- |
| Arquitectura | Coherencia normativa, módulos, runtime y autoridad conjunta final | Aprobado por Luis Antonio Gutiérrez Avilés desde la función de Arquitectura |
| Ingeniería | Compatibilidad, mantenibilidad, versiones y autoridad conjunta final | Aprobado por Luis Antonio Gutiérrez Avilés desde la función de Ingeniería |
| Seguridad | Dependencias, lifecycle scripts, procedencia y secretos | Visto bueno otorgado por la autoridad efectiva desde la perspectiva de Seguridad |
| Operaciones | Linux, lifecycle, artefacto y actualización | Visto bueno otorgado por la autoridad efectiva desde la perspectiva de Operaciones |
| Calidad | Verificabilidad, casos negativos y evidencia | Visto bueno otorgado por la autoridad efectiva desde la perspectiva de Calidad |

La autoridad efectiva es **Luis Antonio Gutiérrez Avilés**, responsable del proyecto, quien aprobó conjuntamente desde Arquitectura e Ingeniería y otorgó los tres vistos buenos. Seguridad, Operaciones y Calidad siguen siendo perspectivas de revisión, no autoridades decisorias equivalentes ni identidades adicionales.

## Alternativas consideradas y resolución aprobada

| Elección | Alternativas | Resolución aprobada | Motivo principal |
| --- | --- | --- | --- |
| Package manager | pnpm / npm | pnpm `11.15.1` | Lockfile determinista, aislamiento de dependencias y controles de scripts; bootstrap fijado mitiga el coste adicional |
| Node.js | Pin exacto / sólo rango `24.x` | `24.18.0` exacto | Convierte la major aceptada en ejecución comparable y permite fail-fast |
| TypeScript | `6.x` / adoptar o esperar `7.x` | `6.0.3` exacta | Baseline conservadora; TypeScript 7 requiere evaluación futura de compatibilidad |
| Módulos | ESM / CommonJS | ESM nativo con NodeNext | Semántica nativa y explícita para Node.js 24; compatibilidad pendiente de prueba |
| Desarrollo | `tsc --watch` / runtime TS directo / otra | `tsc --watch` y Node.js watch sobre salida compilada | Mantiene el mismo emit conceptual que producción y evita otro loader |
| Producción | JavaScript compilado / TypeScript directo | Sólo JavaScript compilado desde `dist/` | Artefacto inspeccionable y sin loader/transpilación en startup |
| Scripts de dependencias | Bloqueo total / allowlist / ejecución por defecto | Bloqueo por defecto con allowlist explícita | Reduce supply-chain risk sin impedir dependencias justificadas |
| Plataforma autoritativa | Linux glibc / macOS / otra | Linux x86_64 con glibc | Filesystem y runtime comparables; macOS no prueba el destino autoritativo |
| Estado | Accepted / Accepted con evidencia pendiente / abierto | `Accepted — Selection Approved / Evidence Pending` | La autoridad aprobó la selección y separó expresamente la evidencia técnica pendiente |

Estas resoluciones quedaron aceptadas el 2026-07-22 por la autoridad registrada. La aceptación es normativa para el PBI autorizado, pero no constituye evidencia de que los mecanismos funcionen.

## Contrato técnico aprobado

### Node.js

- Versión inicial exacta: `24.18.0`, sin prereleases.
- Pins futuros obligatorios y coherentes: `.nvmrc`, `.node-version`, `package.json#engines.node` exacto y versión explícita del runner Linux.
- Todos los comandos canónicos deberán ejecutar una comprobación fail-fast y rechazar cualquier versión distinta antes de instalar, compilar o iniciar.
- Un cambio patch dentro de Node.js `24.x` requerirá revisión técnica documentada de Ingeniería, actualización atómica de pins y evidencia de compatibilidad.
- Un cambio minor dentro de `24.x` requerirá revisión formal de baseline por Arquitectura + Ingeniería, además de la validación permitida por ADR-001.
- Cambiar major o runtime requerirá el gobierno de ADR-001 y una decisión arquitectónica que reemplace o revise este contrato.
- Seguridad y Operaciones participarán ante EOL, vulnerabilidad o riesgo operativo.

### Package manager, lockfile e instalación

- Package manager: pnpm `11.15.1` exacto.
- Pins futuros: `packageManager: pnpm@11.15.1`, `engines.pnpm` exacto y comprobación fail-fast.
- `pnpm-lock.yaml` será el único lockfile autoritativo.
- `package-lock.json`, `yarn.lock` u otro lockfile concurrente harán fallar el gate.
- Instalación canónica: `pnpm install --frozen-lockfile`.
- Una inconsistencia entre manifiesto y lockfile deberá fallar sin regeneración silenciosa.
- Ningún comando dependerá de pnpm, TypeScript, Nest CLI u otra herramienta global no comprobada.
- Elegir pnpm no autoriza workspaces, múltiples proyectos ni `pnpm-workspace.yaml` como estructura de repositorio.

### Política de dependencias y scripts

- Node.js, pnpm, TypeScript y herramientas de build se fijarán exactamente.
- Las dependencias directas usarán versiones exactas por defecto; cualquier rango requerirá justificación.
- No se aceptarán prereleases ni fuentes Git, tarball o URL sin excepción registrada.
- Los scripts de instalación de dependencias quedarán bloqueados por defecto.
- Cada excepción exigirá allowlist exacta, necesidad, owner, revisión de Seguridad y diff visible.
- Registry credentials y secretos nunca se guardarán en archivos rastreados ni en evidencia.

### ESM y TypeScript

- `package.json` declarará `type: module`.
- TypeScript será `6.0.3` exacta y local al proyecto.
- `module` y `moduleResolution` serán `NodeNext`.
- La configuración conceptual exigirá `strict`, `noImplicitAny`, `useUnknownInCatchVariables`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`, `verbatimModuleSyntax` y `noEmitOnError`.
- El target inicial será `ES2024`; los imports relativos usarán extensión de salida `.js` cuando Node.js la exija.
- Decorators y metadata se habilitarán sólo donde el shell NestJS los necesite.
- No se añadirá Babel, SWC, bundler, loader experimental ni type stripping como ruta autoritativa.
- Si la evidencia demuestra incompatibilidad material entre ESM, TypeScript y NestJS, se reabrirá DEC-004; no se cambiará silenciosamente a CommonJS.

### Desarrollo, build y producción

- Fuente: `src/`; salida: `dist/`.
- Desarrollo: `tsc --watch` y `node --watch --enable-source-maps` sobre JavaScript emitido.
- Type checking y emit se mantendrán separados; `typecheck` no emitirá.
- Build: salida limpia y compilación previa mediante el TypeScript local.
- Producción ejecutará exclusivamente JavaScript compilado desde `dist/` con Node.js `24.18.0`.
- Producción nunca ejecutará TypeScript directamente ni compilará al arrancar.
- `start` no instalará, compilará, migrará ni modificará archivos.
- Source maps serán externos, sin fuentes inline y no se servirán públicamente.

### Scripts canónicos futuros

| Script o acción | Contrato |
| --- | --- |
| `verify:toolchain` | Verifica Node.js y pnpm exactos antes de mutar |
| instalación | `pnpm install --frozen-lockfile`; no es lifecycle `install` |
| `clean` | Elimina sólo salidas generadas conocidas, inicialmente `dist/` |
| `typecheck` | Ejecuta TypeScript local con `--noEmit` |
| `build` | Limpia y compila únicamente a `dist/` |
| `test` | Nombre reservado; DEC-051 decidirá runner, suites y cobertura |
| `start` | Ejecuta el entrypoint JavaScript compilado |
| `dev` | Compila en watch y reinicia JavaScript emitido |
| `verify` | Compone toolchain, clean, typecheck, build y test sin instalar ni corregir archivos |

Los comandos deberán ser no interactivos, propagar exit codes, funcionar fuera del IDE, no descargar herramientas durante su ejecución, no revelar secretos y evitar dependencias accidentales de shell.

### Plataforma autoritativa

- Evidencia autoritativa inicial: Linux x86_64 con glibc, filesystem sensible a mayúsculas, Node.js `24.18.0` y pnpm `11.15.1`.
- macOS arm64/x64 estará permitido para desarrollo con los mismos pins, pero un PASS sólo en macOS será no concluyente.
- musl/Alpine, Linux arm64, Windows o un contenedor requerirán revalidación antes de declararse soportados.
- DEC-004 exige Linux y la evidencia; DEC-051 elegirá proveedor, runner, suites y gate general. Esto no acepta GitHub Actions, Docker ni ADR-007.

## Consecuencias positivas

- Versiones y herramientas incorrectas fallarán antes de mutar el repositorio.
- Un único gestor y lockfile eliminan rutas accidentales de resolución.
- Desarrollo y producción comparten el emit del compilador oficial.
- Producción recibe un artefacto JavaScript inspeccionable.
- La evidencia Linux y dos builds independientes convierten reproducibilidad en un hecho verificable.

## Consecuencias negativas

- Los pins múltiples requieren mantenimiento atómico.
- pnpm añade un bootstrap frente a npm incluido con Node.js.
- ESM/NodeNext exige disciplina en imports e interoperabilidad CommonJS.
- Compile-watch puede ofrecer mayor latencia que ejecutar TypeScript directamente.
- TypeScript `6.0.3` y la combinación NestJS/ESM siguen necesitando prueba real.

## Riesgos aceptados y mitigaciones obligatorias

| Riesgo | Mitigación |
| --- | --- |
| `engines` tratado como advisory | Pins múltiples y verificación fail-fast |
| pnpm global o bootstrap incorrecto | Versión exacta, procedencia documentada y comprobación previa |
| Regeneración accidental del lockfile | Instalación frozen, lockfile único y diff obligatorio |
| Script de dependencia comprometido | Bloqueo por defecto y allowlist revisada por Seguridad |
| Incompatibilidad ESM/NestJS/TypeScript | Gate real; reabrir decisión antes de usar CommonJS |
| Source maps exponen fuente | Maps externos, sin inline sources y acceso restringido |
| macOS oculta diferencias de casing/libc | Linux x86_64/glibc como autoridad |
| Build depende de ruta, caché o timestamp | Dos directorios limpios, inventario y SHA-256 de `dist/` |

La autoridad acepta estos riesgos exclusivamente para avanzar a materialización, condicionados a sus mitigaciones y al contrato de verificación. Una incompatibilidad material, vulnerabilidad o diferencia reproducible no queda dispensada: obliga a remediar, reabrir o sustituir la decisión según corresponda.

## Relación con otras decisiones

- ADR-001 gobierna TypeScript, Node.js `24.x`, soporte y excepciones de runtime.
- ADR-002 y ADR-009 conservan una sola aplicación/artefacto y prohíben estructura anticipatoria.
- ADR-003 conserva PostgreSQL `18.x`; DEC-004 no elige acceso a datos ni migrador.
- ADR-005 conserva NestJS `11.x`, Express, REST mínima y fronteras; el spike no es scaffold.
- ADR-007 permanece `Proposed`; Linux autoritativo no implica contenedores.
- DEC-005/044/049/050/051/063 conservan íntegramente sus alcances y estados.

## Obligaciones posteriores

Mediante [PBI-021](../../backlog/pbis/PBI-021.md), ahora creado y autorizado, deberá:

1. materializar pins, manifiesto, lockfile, configuración TypeScript y scripts sin copiar SPIKE-009;
2. revalidar versiones efectivas de Node.js, pnpm, TypeScript y NestJS;
3. ejecutar el [contrato de verificación](../../decisions/dec-004-toolchain-contract/VERIFICATION_CONTRACT.md);
4. registrar evidencia local y Linux sanitizada;
5. obtener revisión de Seguridad, Operaciones y Calidad en sus componentes;
6. evaluar por separado el cumplimiento técnico de DEC-004.

Esta aceptación no autoriza por sí sola el primer cambio funcional de R0 ni cierra los demás gates H0/H1.

## Autorización del PBI de materialización

[PBI-021](../../backlog/pbis/PBI-021.md) es el PBI canónico autorizado para:

- materializar únicamente los archivos mínimos del contrato;
- ejecutar el contrato `VC-001` a `VC-024` aplicable;
- obtener evidencia autoritativa en Linux x86_64/glibc;
- documentar resultados, riesgos residuales y recomendación de verificación.

La autorización no incluye funcionalidad de dominio, autenticación, multitenancy, persistencia, módulos de negocio, SQL, migraciones, contenedores, proveedor de CI ni despliegue. Tampoco autoriza reutilizar SPIKE-009 como scaffold.

## Evidencia pendiente

No se ha:

- creado ningún archivo ejecutable de toolchain;
- instalado o cambiado Node.js, pnpm o dependencias;
- ejecutado instalación, typecheck, build, start, tests o CI;
- demostrado compatibilidad NestJS `11.1.28` + ESM + TypeScript `6.0.3`;
- ejecutado Linux x86_64/glibc;
- comparado dos builds limpios ni hashes de `dist/`;
- demostrado instalación o build reproducibles.

## Criterios para declarar la implementación cumplida

La materialización sólo podrá declararse cumplida cuando:

- el registro de esta aprobación permanezca trazable;
- todos los pins y versiones coincidan y los casos incompatibles fallen antes de mutar;
- la instalación frozen desde checkout limpio no cambie manifest, lockfile ni Git;
- ESM/NestJS/TypeScript compile, inicie y cierre correctamente;
- producción de prueba ejecute sólo JavaScript de `dist/`;
- scripts no aprobados permanezcan bloqueados;
- los casos `VC-001` a `VC-024` aplicables pasen según el contrato de verificación;
- dos directorios Linux limpios produzcan el mismo inventario y SHA-256 de `dist/`;
- Seguridad, Operaciones y Calidad revisen la evidencia aplicable;
- el resultado no se confunda con cierre de R0, migraciones, aislamiento o DoD general.

## Condiciones para reabrir o sustituir

- incompatibilidad material entre Node.js, pnpm, TypeScript y NestJS;
- vulnerabilidad o EOL que impida mantener una versión fijada;
- necesidad productiva demostrada de otra plataforma, runtime o sistema de módulos;
- adopción autorizada de varios proyectos/workspaces que cambie el contrato raíz;
- evidencia de que compile-watch o ESM impiden objetivos medidos;
- requisitos de artefacto, supply chain o despliegue incompatibles con esta baseline.

Un cambio incompatible requerirá revisión por la autoridad aplicable; no se resolverá mediante configuración silenciosa.

## Dictamen de la revisión formal

**PASS — ACCEPTED, SELECTION APPROVED / EVIDENCE PENDING.** Arquitectura + Ingeniería aprobaron conjuntamente la selección y se registraron los vistos buenos de Seguridad, Operaciones y Calidad. El PBI de materialización/verificación queda autorizado. La implementación no existe todavía y la reproducibilidad no ha sido demostrada.

## Trazabilidad

- [Propuesta](../../decisions/dec-004-toolchain-contract/DECISION_PROPOSAL.md)
- [Análisis de opciones](../../decisions/dec-004-toolchain-contract/OPTIONS_ANALYSIS.md)
- [Revisión formal](../../decisions/dec-004-toolchain-contract/FORMAL_REVIEW.md)
- [Contrato de verificación futura](../../decisions/dec-004-toolchain-contract/VERIFICATION_CONTRACT.md)
- [Análisis de impacto](../../decisions/dec-004-toolchain-contract/IMPACT_ANALYSIS.md)
- [Resultado](../../decisions/dec-004-toolchain-contract/RESULTS.md)
- [PBI-021 — Materialización y verificación](../../backlog/pbis/PBI-021.md)
- [Inventario de bloqueantes](INVENTARIO_DE_BLOQUEANTES.md)
- [Orden de resolución](../dec-004-governance-unblocking/RESOLUTION_ORDER.md)

## Próxima revisión

Ejecutar PBI-021 en una tarea separada, limitado al contrato aprobado, y conservar DEC-004 en `Evidence Pending` hasta ejecutar y revisar satisfactoriamente VC-001 a VC-024 y la evidencia Linux.
