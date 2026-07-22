# DEC-004 — Materialización del contrato de toolchain

## Estado

- **PBI ejecutado:** [PBI-021](../../backlog/pbis/PBI-021.md).
- **Fecha de ejecución local:** 2026-07-22.
- **Resultado técnico local:** materialización funcional en macOS arm64.
- **Resultado global:** `CONDITIONAL PASS`; Linux x86_64/glibc y CI autorizado siguen pendientes.
- **Estado de DEC-004:** `Accepted — Selection Approved / Evidence Pending`; no se modificó.

## Objetivo

Materializar el mínimo ejecutable autorizado por [DEC-004](../blocker-closure/DEC-004_BASELINE_TECNICA.md) sin incorporar funcionalidad de producto y producir evidencia diagnóstica local para el contrato VC-001 a VC-024.

## Alcance materializado

- una aplicación técnica única en la raíz;
- Node.js `24.18.0` fijado en `.nvmrc`, `.node-version` y `package.json`;
- pnpm `11.15.1` fijado en `packageManager`, `engines` y preflight;
- un único lockfile de producto en la raíz: `pnpm-lock.yaml`;
- ESM nativo, TypeScript `6.0.3`, `NodeNext` y strictness completa;
- fuente bajo `src/` y JavaScript emitido exclusivamente bajo `dist/`;
- shell NestJS `11.1.28` con Express, sin rutas HTTP ni `/health`;
- un provider técnico mínimo para demostrar carga de metadata y DI;
- variables técnicas `NODE_ENV`, `HOST` y `PORT` validadas fail closed;
- scripts canónicos de instalación, verificación, typecheck, build, test, start y desarrollo;
- desarrollo con `tsc --watch` y `node --watch` sobre JavaScript emitido;
- producción de prueba con `node --enable-source-maps dist/main.js`;
- pruebas técnicas acotadas con `node:test`, sin seleccionar un runner general de DEC-051;
- bloqueo de lifecycle de dependencias por defecto y allowlist gobernada vacía;
- fixtures locales aislados para casos negativos y dos builds diagnósticos.

No se creó API funcional, controller, endpoint, base de datos, SQL, migración, autenticación, autorización, multitenancy, módulo de negocio, workspace, contenedor, CI o despliegue.

## Arquitectura implementada

```text
package.json / pins / lockfile
          |
          v
scripts de preflight, build y evidencia
          |
          v
src/main.ts -> AppModule -> TechnicalShellService
          |
          v
       dist/*.js + dist/*.js.map
```

NestJS funciona únicamente como shell exterior. El provider no contiene comportamiento de negocio. La aplicación abre un listener técnico sólo después de validar sus tres variables obligatorias y no expone rutas.

## Componentes creados

| Componente | Responsabilidad |
| --- | --- |
| `.node-version`, `.nvmrc` | Pin exacto de Node.js |
| `.npmrc` | Protección para gestores alternos y guardado exacto cuando aplique |
| `package.json` | Manifiesto raíz, pins, scripts y dependencias exactas |
| `pnpm-lock.yaml` | Único lockfile autoritativo de la aplicación raíz |
| `supply-chain-policy.json` | Política gobernada y allowlist explícita vacía |
| `tsconfig.json` | Typecheck estricto ESM/NodeNext sin emit |
| `tsconfig.build.json` | Emit limpio a `dist/` y source maps externos |
| `src/app.module.ts` | Composition root mínimo |
| `src/technical-shell.service.ts` | Provider técnico sin lógica funcional |
| `src/startup-config.ts` | Validación técnica de entorno |
| `src/main.ts` | Bootstrap y listener técnico |
| `scripts/verify-install-context.mjs` | Rechazo temprano de runtime, gestor y artefactos incompatibles |
| `scripts/verify-toolchain.mjs` | Validación integral de pins, lockfile y supply chain |
| `scripts/clean.mjs` | Eliminación acotada de `dist/` |
| `scripts/dev.mjs` | `tsc --watch` más Node watch sobre el emit |
| `scripts/verify-structure.mjs` | Verificación de estructura y prohibiciones |
| `scripts/smoke-start.mjs` | Smoke del listener desde `dist/` |
| `scripts/local-diagnostics.mjs` | Casos negativos y builds locales aislados |
| `test/toolchain-contract.test.mjs` | Cinco pruebas técnicas acotadas |

## Dependencias exactas

| Dependencia | Versión | Uso |
| --- | --- | --- |
| `@nestjs/common` | `11.1.28` | Módulo y provider |
| `@nestjs/core` | `11.1.28` | Bootstrap NestJS |
| `@nestjs/platform-express` | `11.1.28` | Adaptador aceptado por ADR-005 |
| `reflect-metadata` | `0.2.2` | Metadata de decorators |
| `rxjs` | `7.8.2` | Peer runtime de NestJS |
| `@types/node` | `24.13.3` | Tipos de Node.js para compilación |
| `typescript` | `6.0.3` | Compilador local exacto |

No se usaron rangos, prereleases, Git URLs ni tarballs como dependencias del producto.

## Scripts canónicos

| Script | Implementación |
| --- | --- |
| `verify:toolchain` | valida Node, pnpm, pins, lockfile, workspace y política |
| `clean` | elimina sólo `dist/` con comprobación de ruta |
| `typecheck` | TypeScript local con `--noEmit` |
| `build` | preflight, clean y `tsc -p tsconfig.build.json` |
| `test` | comprobaciones técnicas con `node:test` |
| `start` | preflight y JavaScript compilado desde `dist/main.js` |
| `dev` | `tsc --watch` y Node watch sobre `dist/main.js` |
| `verify` | compone preflight, clean, typecheck, build, test y estructura |

La instalación canónica permanece fuera del lifecycle:

```text
pnpm install --frozen-lockfile
```

El script `preinstall` es sólo un guard fail-fast y no instala, descarga, compila ni modifica archivos.

## Supply chain y allowlist

pnpm `11.15.1` bloquea por defecto builds de dependencias no incluidos en `allowBuilds` y trata los builds no revisados como error. En pnpm 11, la configuración consumida por el gestor vive en `pnpm-workspace.yaml`; ese archivo está prohibido expresamente por PBI-021 porque introduciría un workspace anticipatorio. La configuración heredada `package.json#pnpm.onlyBuiltDependencies` fue descartada porque pnpm 11 la ignora.

La materialización actual resuelve este límite sin contradecir el PBI:

- `supply-chain-policy.json` registra `dependencyLifecycleDefault: blocked`;
- la allowlist gobernada es explícita y vacía;
- no existe `pnpm-workspace.yaml` en la raíz;
- ningún paquete actual requiere lifecycle aprobado;
- un fixture aislado con `postinstall` fue rechazado y su payload no se ejecutó;
- una allowlist futura no vacía requerirá una decisión que reconcilie la configuración de pnpm 11 con la prohibición de workspace.

Referencia técnica: [pnpm 11 — `allowBuilds`](https://pnpm.io/settings#allowbuilds).

## Diferencias respecto al contrato ideal

1. La evidencia se ejecutó sobre macOS arm64, no sobre Linux x86_64/glibc.
2. El árbol inicial no estaba limpio y PBI-021/DEC-004 aún no pertenecían al commit candidato; no pudo demostrarse instalación desde un clon limpio del mismo commit sin violar la prohibición de commit.
3. Los dos builds independientes fueron diagnósticos macOS, no evidencia autoritativa Linux.
4. DEC-051 no ha autorizado proveedor/runner de CI; VC-024 no se ejecutó.
5. La allowlist efectiva actual debe permanecer vacía mientras no se autorice el archivo de configuración exigido por pnpm 11.
6. El repositorio conserva `spikes/spike-009-nestjs-shell/package-lock.json` como evidencia experimental rastreada. No es lockfile de la aplicación raíz, no se copió y no se modificó; una lectura estrictamente repo-wide de VC-007 requiere aclaración de autoridad.

## Limitaciones actuales

- No existe evidencia Linux autoritativa.
- No existe comparación de dos builds Linux.
- No existe ejecución CI ni IDs de runs.
- No existen revisiones posteriores de la evidencia por Arquitectura, Ingeniería, Seguridad, Operaciones y Calidad.
- PBI-021 no puede pasar a `Done`.
- DEC-004 no puede avanzar fuera de `Evidence Pending`.
- SPRINT-00 continúa abierto y PBI-021 sigue `Unassigned` en su registro.

## Ejecución para desarrollo

Con Node.js `24.18.0` y pnpm `11.15.1` obtenidos desde una procedencia aprobada:

```text
pnpm install --frozen-lockfile
pnpm run verify
NODE_ENV=development HOST=127.0.0.1 PORT=3000 pnpm run dev
```

La ejecución de producción de prueba requiere un build previo:

```text
pnpm run build
NODE_ENV=production HOST=127.0.0.1 PORT=3000 pnpm run start
```

`start` no compila, instala, migra ni ejecuta TypeScript.

## Siguientes pasos

1. Versionar el expediente y la materialización en un commit candidato mediante una tarea autorizada.
2. Ejecutar VC-001 a VC-023 desde dos checkouts limpios sobre Linux x86_64/glibc autorizado.
3. Comparar inventarios y SHA-256 de ambos `dist/` Linux.
4. Resolver DEC-051 y ejecutar VC-024 dos veces en CI Linux autorizado.
5. Obtener las revisiones obligatorias y emitir un dictamen separado sobre DEC-004.
