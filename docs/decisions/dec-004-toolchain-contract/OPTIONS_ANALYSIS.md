# DEC-004 — Análisis de opciones de toolchain

## Propósito

Este análisis compara alternativas reales para la propuesta de DEC-004. Ninguna opción queda aceptada por aparecer aquí. Las recomendaciones se consolidan en [DECISION_PROPOSAL.md](DECISION_PROPOSAL.md).

## Criterios

- compatibilidad con Node.js `24.x`, TypeScript y NestJS `11.x`;
- instalación y build verificables;
- mínima dependencia de estado global;
- supply chain y lockfile controlables;
- simplicidad para una aplicación y artefacto iniciales;
- ejecución Linux autoritativa y desarrollo macOS;
- reversibilidad sin invadir DEC-005, DEC-049, DEC-050 o DEC-051.

## Package managers

### Comparación

| Opción | Ventajas | Desventajas | Riesgos | Reproducibilidad | CI/producción | Recomendación |
| --- | --- | --- | --- | --- | --- | --- |
| npm | Incluido con Node.js; menor bootstrap; `package-lock.json` y `npm ci` conocidos | `engines` suele ser advisory; scripts de dependencias requieren endurecimiento adicional; resolución permite dependencias fantasma con más facilidad | Acoplar npm al minor de Node, lifecycle scripts y divergencia si se usa `npm install` | Buena con versión exacta y `npm ci` | Muy amplia; no requiere herramienta adicional | Alternativa de fallback si se prioriza bootstrap mínimo |
| pnpm | Lockfile determinista; aislamiento de dependencias no declaradas; instalación eficiente; scripts transitivos bloqueados por defecto desde v10; pin exacto mediante `packageManager` | Requiere bootstrap explícito; Corepack no debe asumirse confiable/actualizado; settings avanzados pueden usar un archivo llamado `pnpm-workspace.yaml` | Confundir el gestor con adopción de workspaces; binario global incorrecto; incompatibilidades de paquetes que dependen de hoisting | Alta con versión exacta, frozen lockfile y store no usado como autoridad | Compatible con Node.js 24 y Linux; CI debe fijar el binario | **Recomendada: `pnpm@11.15.1`** |
| Yarn moderno | `packageManager`/Corepack, lockfile y controles avanzados; Plug'n'Play puede detectar dependencias implícitas | Añade elección entre PnP y `node_modules`; no hay historial ni necesidad documentada; más configuración para una sola app | Incompatibilidad PnP con tooling/plugins; adoptar `node_modules` reduce su diferenciación; bootstrap Corepack | Alta si se fija versión/configuración | Viable, pero requiere matriz propia | No recomendada para R0 |

### Motivo de la recomendación

pnpm no está previamente aceptado, pero tampoco contradice ADR-009 si se usa para una sola raíz sin crear packages o proyectos. Sus controles ante scripts de dependencias y dependencias fantasma aportan valor directo al riesgo de supply chain registrado en la [baseline de seguridad](../../architecture/SECURITY_BASELINE.md). El costo adicional de bootstrap queda controlado mediante versión exacta y verificación fail-fast.

La elección requiere aprobación explícita porque ADR-009 difirió deliberadamente pnpm/npm/Yarn. Si el equipo rechaza el bootstrap adicional o considera que cualquier archivo `pnpm-workspace.yaml` infringe ADR-009, la alternativa coherente es npm emparejado exactamente con Node.js y `npm ci`; no corresponde adoptar Yarn sin evidencia nueva.

### Política común cualquiera que sea el gestor

- un solo lockfile rastreado;
- instalación congelada en onboarding y CI;
- versión exacta del gestor;
- cero herramientas globales implícitas;
- diff de manifiesto y lockfile en toda actualización;
- scripts transitivos bloqueados o expresamente autorizados;
- registries, credenciales y excepciones gobernados;
- ningún dist-tag mutable en la baseline.

## Sistema de módulos

### ESM nativo

**Ventajas**

- estándar nativo de JavaScript y soporte estable en Node.js 24;
- semántica explícita mediante `type: module`;
- alineación con dependencias modernas y pnpm 11, distribuido como ESM;
- facilita una dirección futura sin conversión del código fuente.

**Desventajas**

- imports relativos con extensiones de salida bajo NodeNext;
- diferencias respecto a `require`, `__dirname` y carga de JSON;
- algunos paquetes CommonJS requieren interoperabilidad explícita;
- herramientas de test todavía no elegidas deben demostrar compatibilidad.

**Riesgos**

- incompatibilidad de decorators/metadata o tooling de NestJS;
- resolver imports de forma distinta entre TypeScript y Node;
- introducir loaders o flags experimentales para ocultar errores.

**Reproducibilidad y compatibilidad**

Alta si `type`, `module` y `moduleResolution` son explícitos y producción ejecuta el JavaScript emitido. Requiere prueba real con NestJS `11.1.28`, Express, startup/shutdown y el runner futuro.

**Recomendación:** adoptar ESM con NodeNext, condicionado a la matriz de verificación.

### CommonJS

**Ventajas**

- amplio historial en NestJS y tooling Node;
- resolución tradicional tolera más paquetes/configuraciones heredadas;
- menor fricción inicial con ejemplos antiguos.

**Desventajas**

- dirección menos alineada con el ecosistema moderno;
- interoperabilidad inversa con dependencias ESM-only;
- riesgo de postergar indefinidamente una migración de módulos.

**Riesgos**

- dependencia nueva ESM-only puede forzar wrappers o imports dinámicos;
- ambigüedad si se omite `type` en el manifiesto.

**Reproducibilidad y compatibilidad**

Alta si `type: commonjs` y compiler options son explícitos. Es el fallback si ESM falla por evidencia, no por preferencia o comodidad.

**Recomendación:** no adoptar como baseline; conservar como alternativa documentada.

## Ejecución de TypeScript

### Compilación previa con `tsc`

| Aspecto | Evaluación |
| --- | --- |
| Ventajas | Mismo compilador para typecheck/emit; artefacto JavaScript inspeccionable; sin loader productivo; compatible con hashes |
| Desventajas | Paso de compilación y watch; menor velocidad que transpilers nativos en proyectos grandes |
| Riesgos | Config distinta entre typecheck y build; output previo contaminante; rutas/source maps no deterministas |
| Reproducibilidad | Alta con TypeScript exacto, clean build y configuración versionada |
| CI | Directa y no interactiva |
| Producción | Recomendada; ejecuta sólo `dist/` |

**Recomendación:** baseline obligatoria para build y producción.

### Runtime directo de TypeScript en desarrollo

Incluye herramientas como `tsx`, `ts-node`, loaders o type stripping nativo.

| Aspecto | Evaluación |
| --- | --- |
| Ventajas | Feedback rápido y un solo proceso visible |
| Desventajas | Agrega loader/transpiler; puede no ejecutar el mismo emit que producción |
| Riesgos | Diferencias en decorators/metadata, ESM, source maps y type checking; falsa paridad |
| Reproducibilidad | Media; depende de otra herramienta fijada |
| CI | No necesario para el build autoritativo |
| Producción | No aplicable |

**Recomendación:** no incluir inicialmente. Desarrollo compila en watch y Node ejecuta el JavaScript emitido. Puede reconsiderarse con evidencia de latencia y compatibilidad, sin cambiar el build productivo.

### Runtime directo de TypeScript en producción

**Ventajas:** elimina un paso visible de build.

**Desventajas y riesgos:** introduce loader/transformación en startup, amplía superficie productiva, dificulta promoción de un artefacto compilado y puede omitir typecheck. El type stripping nativo de Node no equivale al compilador ni satisface automáticamente decorators/metadata de NestJS.

**Reproducibilidad:** inferior al artefacto JavaScript precompilado.

**Recomendación:** **rechazar** para la baseline de producción.

## Versión de TypeScript

| Opción | Ventajas | Desventajas/riesgos | Recomendación |
| --- | --- | --- | --- |
| `6.0.3` exacta | Stable conocida al momento, transición previa al cambio mayor de implementación de TS 7, pin reproducible | TypeScript 6 contiene cambios/deprecations; necesita prueba con NestJS 11 | **Recomendada inicialmente** |
| `7.0.2` exacta | Latest stable y dirección futura | Major reciente con nueva implementación; mayor incertidumbre para plugins/tooling y condiciones de ADR-005 | Evaluar después de obtener compatibilidad explícita |
| Rango `^6`/`latest` | Actualizaciones automáticas | Build deja de ser gobernado; lockfile update puede introducir cambio de compilador sin decisión | Rechazado |

TypeScript no es una dependencia global. La recomendación no declara compatibilidad: ésta debe demostrarse en Linux antes de cerrar DEC-004.

## Pinning de Node.js

### `engines`

- **Ventaja:** contrato visible para herramientas y consumidores.
- **Desventaja:** puede ser advisory según el gestor/configuración.
- **Uso recomendado:** exacto, obligatorio pero insuficiente por sí solo.

### `.nvmrc`

- **Ventaja:** onboarding directo para nvm y formato simple.
- **Desventaja:** sólo actúa si el colaborador usa nvm.
- **Uso recomendado:** exacto y coherente con los demás pins.

### `.node-version`

- **Ventaja:** interoperable con varias herramientas de versionado.
- **Desventaja:** tampoco impone por sí mismo la versión.
- **Uso recomendado:** exacto como segunda interfaz local; no añadir archivos específicos de otra herramienta sin necesidad.

### Contenedor

- **Ventaja:** fija sistema operativo, runtime y librerías.
- **Desventaja:** ADR-007 sigue `Proposed`; requiere imagen, registry y supply chain no decididos.
- **Uso recomendado:** no forma parte de DEC-004. Puede aportar evidencia futura si se acepta separadamente.

### Combinación recomendada

1. `engines.node` exacto;
2. `.nvmrc` exacto;
3. `.node-version` exacto;
4. comprobación fail-fast ejecutada por comandos canónicos;
5. Node.js exacto declarado en el runner Linux futuro;
6. auditoría automática que compare todos los pins.

Esta redundancia es intencional: los archivos atienden herramientas diferentes y la comprobación ejecutable impide que el pin quede sólo informativo.

## Directorios y source maps

| Alternativa | Evaluación |
| --- | --- |
| `src/` → `dist/` con `tsc` | Simple, estándar y suficiente para una aplicación |
| Bundler a un archivo | Añade resolución/tree-shaking y riesgo de incompatibilidad sin necesidad demostrada |
| Ejecutar desde `src/` | Contradice artefacto compilado y no separa fuente de producción |
| Maps inline | Diagnóstico fácil, pero agranda artefacto y embebe fuente |
| Maps externos sin inline sources | Balance entre stack traces y menor exposición; requiere proteger el artefacto |
| Sin source maps | Menor exposición, peor diagnóstico y operación |

**Recomendación:** `src/` → `dist/`, sin bundler, source maps externos y no públicos, sin código fuente inline.

## Plataformas

| Plataforma | Papel propuesto | Límite |
| --- | --- | --- |
| Linux x86_64/glibc | Verificación autoritativa inicial | No selecciona proveedor, distro, contenedor ni plataforma de producción |
| macOS arm64/x64 | Desarrollo y feedback local | No cierra reproducibilidad |
| Linux arm64/musl | Candidato futuro | Requiere matriz antes de soporte |
| Windows | No incluido inicialmente | Puede evaluarse ante necesidad del equipo |

## Recomendación consolidada

Aceptar como propuesta sometida a aprobación:

- Node.js `24.18.0` con pinning combinado;
- pnpm `11.15.1` y `pnpm-lock.yaml` congelado;
- ESM/NodeNext;
- TypeScript `6.0.3` strict;
- compilación previa con `tsc` para desarrollo autoritativo, CI y producción;
- JavaScript compilado como único runtime productivo;
- Linux x86_64/glibc como evidencia final;
- macOS como entorno de desarrollo no concluyente.

La alternativa coherente si pnpm no se aprueba es npm exacto emparejado con Node.js y `npm ci`. CommonJS sólo debe reemplazar ESM si la verificación demuestra una incompatibilidad relevante con NestJS; no por falta de disciplina en imports.

## Fuentes oficiales consultadas

- [Node.js 24.x](https://nodejs.org/en/download/archive/v24).
- [Módulos ESM en Node.js 24](https://nodejs.org/download/release/latest-v24.x/docs/api/esm.html).
- [Instalación y matriz Node/pnpm](https://pnpm.io/installation).
- [Supply chain de pnpm](https://pnpm.io/supply-chain-security).
- [TypeScript por proyecto y lockfiles](https://www.typescriptlang.org/download/).
- [Notas de TypeScript 6.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).
