# DEC-004 — Propuesta de contrato de toolchain reproducible

## Identificación

- **Identificador:** DEC-004.
- **Título:** Contrato de toolchain reproducible para la aplicación backend inicial.
- **Estado propuesto:** `Proposed — pendiente de aprobación`.
- **Fecha de propuesta:** 2026-07-22.
- **Autoridad requerida:** Arquitectura + Ingeniería.
- **Revisiones obligatorias:** Seguridad, Operaciones y Calidad en los componentes que les corresponden.
- **Efecto actual:** propuesta decisoria; no acepta DEC-004, no autoriza implementación y no demuestra reproducibilidad.

## Contexto

[ADR-001](../proposed/ADR-001-typescript-as-primary-language.md), [ADR-003](../proposed/ADR-003-postgresql-primary-database.md), [ADR-005](../proposed/ADR-005-nestjs-backend.md) y [ADR-009](../proposed/ADR-009-monorepo-strategy.md) ya resolvieron, respectivamente, TypeScript/Node.js `24.x`, PostgreSQL `18.x`, NestJS `11.x` con Express y REST/HTTP JSON mínima, y un repositorio único con una aplicación y artefacto iniciales. El [registro vigente de DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md) conserva abiertos package manager, lockfile, scripts, pinning ejecutable, módulos, compilación, instalación, CI Linux y evidencia de reproducibilidad.

El intento anterior de baseline ejecutable terminó bloqueado sin crear scaffold. La [auditoría de dependencias](../../architecture-readiness/dec-004-governance-unblocking/DEPENDENCY_MAP.md) determinó que el remanente de DEC-004 debe resolverse antes de estructura, persistencia y gates completos. La máquina local observada usa Node.js `v25.9.0`, fuera de la major aceptada; PostgreSQL `18.4` sí coincide con la baseline vigente.

Las versiones propuestas se verificaron contra fuentes oficiales vigentes al 2026-07-22. Ese contraste de metadatos no sustituye una instalación ni una prueba de compatibilidad.

## Problema

Sin un contrato explícito, cada colaborador o pipeline podría:

- ejecutar una major distinta de Node.js;
- resolver dependencias con gestores o versiones diferentes;
- modificar el grafo sin detectar un lockfile desactualizado;
- ejecutar TypeScript de forma distinta en local y producción;
- producir artefactos incompatibles o no comparables;
- depender de herramientas globales, del IDE o de un contenedor todavía no aceptado;
- convertir decisiones de DEC-005, DEC-049, DEC-050 o DEC-051 en hechos accidentales.

## Alcance

Esta propuesta decide únicamente:

- versión efectiva y pinning de Node.js dentro de `24.x`;
- package manager, versión y lockfile autoritativo;
- instalación congelada y política mínima de scripts/supply chain;
- ESM/CommonJS;
- versión y configuración conceptual de TypeScript;
- ejecución de desarrollo y compilación/ejecución de producción;
- entradas/salidas técnicas, source maps y type checking;
- nombres y semántica de scripts canónicos;
- variables mínimas del shell y archivo de ejemplo;
- macOS como entorno de desarrollo y Linux como plataforma autoritativa de verificación;
- definiciones y evidencia futuras de instalación/build reproducibles.

## Fuera de alcance

Permanecen fuera de DEC-004:

- estructura modular, nombres de módulos, aliases e imports permitidos: `DEC-005`;
- taxonomía y representación HTTP de errores: `DEC-044`;
- driver, ORM/query builder, repositorios, transacciones y pool: `DEC-049`;
- herramienta y lifecycle de migraciones: `DEC-050`;
- test runner, cobertura, suites, gates y proveedor de CI: `DEC-051`;
- Definition of Done general, excepciones y aprobaciones por cambio: `DEC-063`;
- frontend y Next.js: ADR-006 continúa `Proposed`;
- contenedores, registry, proveedor de CI/CD y despliegue: ADR-007 continúa `Proposed`;
- configuración de PostgreSQL, proveedor, secretos reales, PIN, sesiones, estaciones, roles y capacidades;
- scaffold, código, endpoints, SQL, migraciones o infraestructura.

## Decisión propuesta

### Matriz ejecutiva

| Punto | Propuesta |
| --- | --- |
| Node.js | `24.18.0`, sin prereleases |
| Rango gobernado | Una sola versión efectiva dentro de `24.x`; actualizar minor/patch atómicamente con evidencia |
| Pinning de Node | `.nvmrc`, `.node-version`, `engines.node` exacto, verificación fail-fast y versión explícita en Linux/CI |
| Package manager | pnpm |
| Versión de pnpm | `11.15.1` exacta |
| Pinning de pnpm | `packageManager: pnpm@11.15.1`, `engines.pnpm` exacto y verificación fail-fast |
| Lockfile | `pnpm-lock.yaml`, único y obligatorio |
| Instalación canónica | `pnpm install --frozen-lockfile` |
| Sistema de módulos | ESM nativo, `type: module`, TypeScript `NodeNext` |
| TypeScript | `6.0.3` exacta como dependencia de desarrollo local al proyecto |
| Desarrollo | Compilar en watch y ejecutar el JavaScript emitido con Node.js watch; no runtime directo de TypeScript en la baseline |
| Producción | Compilación previa con `tsc`; ejecutar sólo JavaScript de `dist/` |
| Código fuente/salida | `src/` → `dist/`; pruebas y scripts no forman parte del artefacto productivo |
| Source maps | Externos, sin sources inline, dentro del artefacto interno y nunca servidos públicamente |
| Plataforma autoritativa | Linux x86_64 con glibc y Node.js oficial fijado; macOS sólo desarrollo |

### Node.js y pinning

1. La versión efectiva propuesta es **Node.js `24.18.0`**, última versión LTS `24.x` observada en la fuente oficial al preparar esta propuesta.
2. La versión debe aparecer idéntica en `.nvmrc`, `.node-version`, `engines.node` y el entorno Linux de validación.
3. `engines` no se considera suficiente por sí solo: todos los comandos canónicos deben ejecutar primero una comprobación fail-fast de `process.version` y rechazar cualquier valor distinto.
4. La configuración local observada `v25.9.0` debe fallar con un mensaje sanitizado que indique versión esperada y observada.
5. Una actualización dentro de `24.x` modifica atómicamente todos los pins, revalida NestJS, pnpm, TypeScript, build, pruebas y Linux, y conserva el historial en Git.
6. `.nvmrc` atiende usuarios de nvm; `.node-version` permite herramientas compatibles. Ninguno descarga o confía automáticamente en código remoto.
7. Un contenedor no es parte del pinning de DEC-004 mientras ADR-007 permanezca propuesto.

### Package manager, lockfile e instalación

1. Se propone **pnpm `11.15.1`** por su lockfile determinista, aislamiento de dependencias no declaradas, soporte de Node.js `24.x` y controles de scripts/supply chain.
2. `packageManager` y `engines.pnpm` fijarán exactamente `11.15.1`. No se aceptará `latest`, `latest-11`, `^11` ni una instalación global no comprobada como evidencia.
3. La forma de obtener localmente el binario puede variar, pero debe ser explícita, verificar `pnpm --version` y no usar un instalador remoto sin fijar versión. Corepack puede ser un mecanismo de bootstrap sólo si su propia procedencia/versión es controlada; no es autoridad de la versión del proyecto.
4. `pnpm-lock.yaml` será el único lockfile. `package-lock.json`, `yarn.lock` u otro lockfile concurrente deben hacer fallar la revisión/gate.
5. La instalación ordinaria y de CI será `pnpm install --frozen-lockfile`. Un manifiesto y lockfile inconsistentes deben fallar, nunca regenerarse silenciosamente.
6. Sólo un cambio explícito de dependencias puede actualizar el lockfile. Debe revisar diff de manifiesto y lockfile, procedencia, licencias, vulnerabilidades, scripts y necesidad.
7. No se permiten dependencias Git/tarball/URL salvo excepción registrada; los transitive exotic sources quedan bloqueados.
8. Los scripts de build de dependencias permanecen bloqueados por defecto. Cada excepción requiere allowlist exacta, motivo, owner, revisión de Seguridad y diff visible.
9. El proyecto no depende de pnpm, TypeScript, Nest CLI ni otra herramienta instalada globalmente.
10. Elegir pnpm no adopta workspaces, múltiples proyectos, packages ni `pnpm-workspace.yaml` como organización. Si pnpm exige ese archivo para controles root futuros, se documentará como configuración de una única raíz y no podrá listar otro proyecto sin cumplir ADR-009.

### Política de versiones de dependencias

- Node.js, pnpm, TypeScript y herramientas de build se fijan exactamente.
- Las dependencias directas del producto se declaran con versiones exactas por defecto; una excepción de rango requiere justificación.
- El lockfile conserva la resolución transitiva exacta y debe estar versionado.
- No se aceptan prereleases como baseline.
- Cambiar una major requiere decisión/revisión aplicable; minor/patch requiere changelog, lockfile, suite y evidencia proporcional.
- La configuración de registry y credenciales no se guarda en archivos rastreados; el registry público por defecto no implica aceptar registries privados.

### Sistema de módulos

Se propone **ESM nativo**:

- `package.json` declara `type: module`;
- TypeScript usa `module: NodeNext` y `moduleResolution: NodeNext`;
- imports relativos incluyen la extensión de salida `.js` cuando Node.js lo requiera;
- no se introduce Babel, SWC ni bundler;
- una dependencia CommonJS se consume sólo mediante la interoperabilidad explícita probada de Node.js;
- archivos CommonJS excepcionales usan `.cjs` y justificación localizada.

La aceptación queda condicionada a que el gate futuro demuestre NestJS `11.1.28`, decorators, metadata, Express, startup y shutdown bajo ESM. Si falla, debe volver a decisión; no se cambia silenciosamente a CommonJS.

### TypeScript y compilación

Se propone **TypeScript `6.0.3` exacta** como baseline conservadora frente al salto reciente a TypeScript `7.x`. Debe revalidarse al aprobar y al implementar; no se infiere compatibilidad por ausencia de peer dependency.

La configuración conceptual mínima es:

- `target: ES2024`;
- `module: NodeNext`;
- `moduleResolution: NodeNext`;
- `strict: true`;
- `noImplicitAny: true`;
- `useUnknownInCatchVariables: true`;
- `noImplicitOverride: true`;
- `noUncheckedIndexedAccess: true`;
- `exactOptionalPropertyTypes: true`;
- `forceConsistentCasingInFileNames: true`;
- `verbatimModuleSyntax: true`;
- `noEmitOnError: true`;
- decorators y metadata sólo en el shell NestJS que los necesita;
- `rootDir: src` y `outDir: dist`;
- source maps externos, sin `inlineSourceMap` ni `inlineSources`;
- sin declarations para el artefacto de aplicación inicial;
- sin incremental cache como parte del artefacto reproducible inicial.

`tsconfig.json` gobernará type checking. Un `tsconfig.build.json` acotará el emit productivo y excluirá pruebas, fixtures y scripts. Su creación ocurre sólo después de aceptar DEC-004 y autorizar implementación.

### Desarrollo y producción

- Desarrollo usa el mismo compilador: un proceso observa/compila TypeScript y otro ejecuta con `node --watch --enable-source-maps` el JavaScript de `dist/`.
- El comando `dev` deberá orquestar ambos procesos de forma portable y terminar ambos ante señal o fallo. La implementación puede usar un script Node local; no dependerá de sintaxis shell específica ni de binarios globales.
- No se adopta `tsx`, `ts-node`, loader experimental ni type stripping de Node como runtime baseline.
- Producción ejecuta exclusivamente el resultado de `tsc` mediante Node.js `24.18.0` y nunca compila al arrancar.
- `start` no instala, no compila y no modifica archivos; falla si falta el artefacto o la configuración obligatoria.

### Scripts y comandos canónicos

| Nombre/acción | Contrato |
| --- | --- |
| Verificar toolchain | Comprueba Node.js y pnpm exactos antes de cualquier mutación |
| Instalar | `pnpm install --frozen-lockfile`; es comando, no script lifecycle llamado `install` |
| `clean` | Elimina sólo salidas generadas registradas, inicialmente `dist/`; nunca fuente, docs ni archivos desconocidos |
| `typecheck` | Ejecuta TypeScript local con `--noEmit` y falla ante cualquier error |
| `build` | Parte de salida limpia, ejecuta `tsc` local y produce sólo `dist/` |
| `test` | Nombre estable; runner, capas y cobertura se deciden en DEC-051 |
| `start` | Ejecuta el entrypoint JavaScript compilado con source maps habilitados |
| `dev` | Compila en watch y reinicia el JavaScript emitido, sin runtime TS directo |
| `verify` | Compone verificación de toolchain, clean, typecheck, build y test sin instalar ni corregir archivos |

Todos los scripts deben:

- ser no interactivos salvo un comando explícitamente administrativo;
- propagar código de salida no cero;
- funcionar fuera del IDE;
- no descargar herramientas durante su ejecución;
- no modificar el lockfile salvo el flujo autorizado de dependencias;
- no usar secretos ni imprimir configuración sensible;
- evitar shellisms innecesarios para conservar portabilidad macOS/Linux.

### Variables de entorno y archivo de ejemplo

El shell mínimo documentará, sin valores secretos:

| Variable | Contrato inicial |
| --- | --- |
| `NODE_ENV` | Obligatoria; `development`, `test` o `production` |
| `HOST` | Dirección de escucha; default local seguro permitido, valor explícito en producción |
| `PORT` | Puerto entero válido; default local permitido, valor explícito en producción |

`DATABASE_URL`, secretos, sesión, observabilidad y proveedores se añadirán únicamente cuando sus decisiones sean autorizadas. Un `.env.example` rastreado contendrá nombres, comentarios y placeholders seguros. `.env` y variantes con valores quedan ignorados; el archivo de ejemplo no selecciona `dotenv`, `ConfigModule` ni proveedor de secretos. En producción la configuración se inyecta externamente y una ausencia o valor inválido impide iniciar.

### Plataformas

- **Autoritativa:** Linux x86_64 con glibc, filesystem sensible a mayúsculas, locale y timezone explícitos, Node.js `24.18.0` y pnpm `11.15.1`.
- **Desarrollo permitido:** macOS arm64/x64 con los mismos pins y comandos.
- **No concluyente:** un PASS exclusivo en macOS.
- **Cambio de plataforma:** musl/Alpine, Linux arm64, Windows o un runtime contenerizado requieren revalidación antes de convertirse en plataforma soportada; no necesariamente reabren DEC-004 si conservan el contrato y pasan la evidencia.
- **CI:** DEC-004 exige la ejecución Linux, pero DEC-051 seleccionará proveedor, runner, suites y gates. No se decide GitHub Actions ni Docker aquí.

## Definiciones verificables

### Instalación reproducible

Una instalación es reproducible cuando dos checkouts limpios del mismo commit, con versiones exactas de Node.js/pnpm y sin herramientas globales implícitas:

1. ejecutan la instalación congelada sin modificar manifiesto o lockfile;
2. resuelven el mismo grafo e integridades del lockfile;
3. rechazan versión o lockfile incompatibles;
4. no ejecutan scripts de dependencias no aprobados;
5. dejan `git status --short` sin cambios atribuibles a la instalación.

### Build reproducible

Un build es reproducible cuando dos directorios limpios e independientes del mismo commit, sobre la plataforma Linux autoritativa:

1. instalan de forma reproducible;
2. ejecutan `clean`, `typecheck`, `build` y el test mínimo autorizado;
3. generan el mismo inventario y hashes SHA-256 de archivos bajo `dist/`, excluyendo metadatos del filesystem;
4. arrancan el artefacto compilado y responden al smoke técnico futuro;
5. no dependen de rutas absolutas, timestamp embebido, caché previa ni herramienta global.

## Consecuencias

### Positivas

- El runtime local equivocado falla temprano.
- Un único lockfile y gestor eliminan resoluciones accidentales.
- Local y producción ejecutan JavaScript emitido por el mismo compilador.
- ESM y NodeNext hacen explícita la semántica de módulos.
- El contrato reserva interfaces estables sin seleccionar prematuramente runner, ORM o CI.
- La comparación de hashes convierte reproducibilidad en evidencia, no en declaración.

### Negativas

- La exactitud exige actualizaciones coordinadas de varios pins.
- pnpm añade un bootstrap frente a npm incluido con Node.js.
- ESM requiere extensiones y cuidado con dependencias CommonJS.
- El desarrollo compile-watch tiene más latencia que un runtime TS directo.
- TypeScript `6.0.3` y ESM deben demostrar compatibilidad con NestJS antes del cierre.
- Linux x86_64 no demuestra automáticamente compatibilidad con musl o arm64.

## Riesgos y mitigaciones

| Riesgo | Mitigación propuesta |
| --- | --- |
| `engines` se ignora | Verificación fail-fast y pins múltiples coherentes |
| Corepack o global resuelve otro pnpm | `packageManager` exacto, comprobación de versión y bootstrap documentado |
| Lockfile regenerado accidentalmente | Instalación congelada por defecto y diff obligatorio |
| Script de dependencia comprometido | Bloqueo por defecto y allowlist revisada |
| ESM/NestJS incompatible | Gate de compatibilidad antes de aceptar/cerrar; fallback sólo mediante nueva revisión |
| TypeScript 6 rompe tooling | Pin exacto, compilación directa y matriz contra NestJS 11.1.28 |
| Source maps filtran fuente | Maps externos no públicos, sin sources inline y acceso operativo restringido |
| Build depende del path o timestamp | Dos directorios limpios y comparación SHA-256 normalizada |
| macOS oculta fallo de case-sensitivity | Linux autoritativo con filesystem sensible a mayúsculas |
| DEC-004 invade decisiones posteriores | Matriz explícita de fuera de alcance e impacto |

## Dependencias y decisiones relacionadas

- [ADR-001](../proposed/ADR-001-typescript-as-primary-language.md): lenguaje, runtime major, strictness y soporte.
- [ADR-002](../proposed/ADR-002-modular-monolith-first.md): una aplicación/artefacto y límites modulares.
- [ADR-003](../proposed/ADR-003-postgresql-primary-database.md): PostgreSQL `18.x`/`18.4`.
- [ADR-005](../proposed/ADR-005-nestjs-backend.md): NestJS `11.x`, referencia `11.1.28`, Express y REST mínima.
- [ADR-009](../proposed/ADR-009-monorepo-strategy.md): repositorio único, sin workspaces/packages anticipatorios.
- [Estrategia de despliegue](../../architecture/DEPLOYMENT_STRATEGY.md): Linux, artefacto y promoción permanecen conceptuales.
- [Estrategia de pruebas](../../quality/TESTING_STRATEGY.md): DEC-051 todavía debe seleccionar tooling y gates.
- [Orden de resolución](../../architecture-readiness/dec-004-governance-unblocking/RESOLUTION_ORDER.md): separa selección de evidencia final.

## Criterios de aceptación de la propuesta

La autoridad puede aceptar el contrato sólo cuando:

- apruebe explícitamente cada elección listada abajo;
- confirme que no adopta workspaces, contenedores, CI provider, ORM, migrador ni test runner;
- revalide que Node.js, pnpm, TypeScript y NestJS siguen siendo versiones estables compatibles al momento de aceptación;
- acepte el contrato de scripts, entorno, source maps y supply chain;
- acepte Linux como evidencia autoritativa y macOS como desarrollo no concluyente;
- apruebe [VERIFICATION_CONTRACT.md](VERIFICATION_CONTRACT.md) como evidencia futura obligatoria;
- registre aprobadores, fecha y cualquier condición;
- mantenga DEC-004 abierta hasta obtener evidencia ejecutada, o documente explícitamente una separación entre “selección aceptada” y “cumplimiento verificado”.

## Autoridad requerida para aprobar

- **Decisión:** Arquitectura + Ingeniería, conjuntamente.
- **Supply chain, scripts y dependencias:** revisión obligatoria de Seguridad.
- **Linux, operación y lifecycle:** revisión obligatoria de Operaciones.
- **Verificación, scripts y evidencia:** revisión obligatoria de Calidad.
- **Producto:** participa sólo si una elección cambia alcance, coste, compromiso operativo o fecha; no sustituye la autoridad técnica registrada.

## Preguntas antes de aceptación

1. ¿Se aprueba pnpm `11.15.1` frente a la alternativa más simple npm?
2. ¿Se aprueban los pins exactos Node.js `24.18.0` y TypeScript `6.0.3` después de revalidar su vigencia?
3. ¿Se aprueba ESM/NodeNext y la disciplina de imports explícitos?
4. ¿Se aprueba compile-watch en desarrollo en lugar de runtime TS directo?
5. ¿Se aprueba bloquear scripts de dependencias salvo allowlist revisada?
6. ¿Se acepta que un eventual `pnpm-workspace.yaml` usado sólo para settings no autoriza múltiples proyectos?
7. ¿Linux x86_64/glibc es suficiente como plataforma autoritativa inicial de CI o existe una restricción productiva distinta ya conocida?
8. ¿Se acepta TypeScript `6.0.3` como baseline inicial conservadora o se exige evaluar TypeScript `7.x` antes de aprobar?
9. ¿DEC-004 permanecerá abierta hasta ejecutar toda la evidencia Linux o se registrará un subestado formal de selección aceptada/validación pendiente?

## Fuentes externas de versión

- [Archivo oficial de Node.js 24.x](https://nodejs.org/en/download/archive/v24).
- [Instalación y compatibilidad oficial de pnpm](https://pnpm.io/installation).
- [Controles oficiales de supply chain de pnpm](https://pnpm.io/supply-chain-security).
- [Descarga oficial de TypeScript](https://www.typescriptlang.org/download/).
