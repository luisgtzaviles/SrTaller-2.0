# DEC-004 — Evidencia de materialización

## Alcance y sanitización

Esta evidencia corresponde a [PBI-021](../../backlog/pbis/PBI-021.md). Los resultados locales se presentan como diagnóstico macOS y no sustituyen la plataforma Linux x86_64/glibc exigida por el [contrato VC-001 a VC-024](../../decisions/dec-004-toolchain-contract/VERIFICATION_CONTRACT.md).

Se omitieron rutas personales, homes, caches, variables completas, tokens, credenciales y payloads. No se leyó `.env` ni configuración de secretos. Los nombres `NODE_ENV`, `HOST` y `PORT` son los únicos datos de entorno registrados.

## Timestamp

- **Captura UTC:** `2026-07-22T19:54:33Z`.
- **Plataforma:** macOS `26.5.1`, build `25F80`, arm64.
- **Kernel/plataforma reportada:** Darwin/arm64.
- **libc:** no aplica; no se obtuvo glibc porque el host no es Linux.

## Estado Git inicial

| Campo | Resultado |
| --- | --- |
| Rama | `main` |
| HEAD | `6bd9289e31fd382d6c35303f669c2c00ea7ff89f` |
| `origin/main` | `6bd9289e31fd382d6c35303f669c2c00ea7ff89f` |
| Divergencia | `0 0` |
| Working tree | No limpio antes de materializar |
| Diff rastreado inicial | 30 archivos Markdown, 352 inserciones y 130 eliminaciones |
| Documentos no rastreados | 13: 12 del expediente previo más `PBI-021.md` |
| Duplicados no rastreados de SPIKE-009 | 5, preservados sin modificación |

La ejecución no partió de un checkout limpio ni de un commit que contuviera PBI-021 y el expediente de DEC-004. Esa precondición no podía corregirse sin commit, operación prohibida en esta tarea.

## Clasificación de cambios

### Preexistentes preservados

- los 30 Markdown rastreados que ya estaban modificados;
- `docs/architecture-readiness/dec-004-executable-baseline/`;
- `docs/architecture-readiness/dec-004-governance-unblocking/`;
- `docs/decisions/dec-004-toolchain-contract/`;
- `docs/backlog/pbis/PBI-021.md`;
- cinco duplicados no rastreados dentro de SPIKE-009.

### Propios de PBI-021

- pins, manifiesto, lockfile y configuración raíz;
- `src/`, `scripts/` y `test/` del shell técnico;
- `supply-chain-policy.json`;
- este paquete `dec-004-materialization/`.

No se modificó ningún archivo bajo `spikes/spike-009-nestjs-shell/`.

## Toolchain inicial y efectivo

| Elemento | Inicial del host | Efectivo para la ejecución |
| --- | --- | --- |
| Node.js | `v25.9.0` | `v24.18.0` |
| Corepack | `0.35.0` | `0.35.0` |
| pnpm | `11.15.1` | `11.15.1` |
| TypeScript | No existía en la raíz | `6.0.3` local |
| NestJS | No existía en la raíz | `11.1.28` local y alineado |

Node.js `24.18.0` para macOS arm64 se descargó desde la distribución oficial a un directorio temporal aislado, sin reemplazar la versión global. El archivo se comparó contra `SHASUMS256.txt` oficial:

```text
e1a97e14c99c803e96c7339403282ea05a499c32f8d83defe9ef5ec66f979ed1
```

pnpm `11.15.1` ya estaba disponible mediante el shim de Corepack y fue comprobado antes de usarlo. También se confirmó que `corepack pnpm --version` resolvía `11.15.1`. No se activó ni sustituyó globalmente Node.js, Corepack o pnpm.

## Instalaciones ejecutadas

| Acción | Resultado | Observación |
| --- | --- | --- |
| `pnpm install --lockfile-only` | Exit `0` | Generación inicial del único lockfile de producto |
| `pnpm install --frozen-lockfile` | Exit `0` | 105 paquetes; guard `preinstall` pasó |
| Repetición frozen | Exit `0` | Hashes de ocho entradas técnicas sin cambios |
| Dos installs aislados macOS | Exit `0`, `0` | Directorios y `node_modules` independientes |
| Install de artefacto `--prod --frozen-lockfile` | Exit `0` | Sin fuente y sin TypeScript instalado |

La generación inicial del lockfile no se presenta como instalación reproducible. La evidencia de reproducibilidad usa únicamente instalaciones frozen posteriores.

## Versiones instaladas

```text
Node.js v24.18.0
Corepack 0.35.0
pnpm 11.15.1
TypeScript 6.0.3
@nestjs/common 11.1.28
@nestjs/core 11.1.28
@nestjs/platform-express 11.1.28
reflect-metadata 0.2.2
rxjs 7.8.2
```

## Comandos canónicos locales

| Comando | Exit | Resultado |
| --- | ---: | --- |
| `pnpm run verify:toolchain` | 0 | Pins, gestor, lockfile, workspace y policy válidos |
| `pnpm run clean` | 0 | Sólo `dist/` eliminado |
| `pnpm run typecheck` | 0 | Cero errores; cero archivos emitidos |
| `pnpm run build` | 0 | Ocho archivos bajo `dist/` |
| `pnpm run test` | 0 | Cinco pruebas, cinco pass |
| `pnpm run verify:structure` | 0 | ESM/NodeNext, scripts, scope y source maps válidos |
| `pnpm run smoke:start` | 0 | Listener y cierre desde JavaScript compilado |
| `pnpm run verify` | 0 | Gate local completo |
| `pnpm run dev` | 0 al detener con `SIGINT` | `tsc --watch`, cero errores y Node watch sobre `dist/main.js` |
| `pnpm run diagnose:local` | 0 | Casos negativos y dos builds locales completados |

Los comandos se ejecutaron sin TTY en el gate canónico. El smoke de `dev` se detuvo de forma controlada después del mensaje de watch y startup.

## Typecheck y build

Después de `clean`, `typecheck` dejó `dist_files_before_typecheck=0` y `dist_files_after_typecheck=0`. El build posterior emitió únicamente:

```text
dist/app.module.js
dist/app.module.js.map
dist/main.js
dist/main.js.map
dist/startup-config.js
dist/startup-config.js.map
dist/technical-shell.service.js
dist/technical-shell.service.js.map
```

Los `.map` son externos, no contienen `sourcesContent` y no se exponen por ninguna ruta HTTP porque el shell no registra controllers ni static serving.

## Pruebas técnicas

Las cinco pruebas acotadas verificaron:

1. aceptación de versiones correctas y rechazo de facts incompatibles;
2. pins exactos y policy de lifecycle;
3. aceptación/rechazo fail closed de variables técnicas;
4. ESM emitido y source maps externos sin fuente inline;
5. provider mínimo y ausencia de controller, rutas y `/health`.

Resultado: `5 pass`, `0 fail`, exit `0`.

## Casos negativos locales

| Caso | Exit | Evidencia sanitizada |
| --- | ---: | --- |
| Node.js `25.9.0` | 1 | Rechazado antes del comando canónico |
| User-agent npm con Node correcto | 1 | Gestor rechazado por guard |
| Manifest desalineado del lockfile | 1 | Frozen rechazó; SHA-256 del lockfile no cambió |
| Dependencia fixture con `postinstall` | 1 | Payload no ejecutado |
| Error de tipos controlado | 2 | Typecheck falló; `dist/` ausente |
| Import con casing incorrecto | 2 | Typecheck falló en copia aislada |
| `NODE_ENV` ausente | 1 | Falló antes de abrir listener |

El fixture de lifecycle provocó que pnpm 11 generara `pnpm-workspace.yaml` únicamente dentro de la copia temporal para registrar el build no revisado. La copia se destruyó y el producto no contiene ese archivo. Esto demuestra tanto el bloqueo efectivo como la incompatibilidad entre una futura allowlist no vacía y la prohibición actual de workspace.

## Ejecución desde `dist/`

- `start` referencia exclusivamente `dist/main.js`.
- no hay `tsx`, `ts-node`, Nest CLI, loader TypeScript o compilación dentro de `start`;
- el smoke abrió un socket TCP local, emitió el marcador sanitizado y cerró mediante `SIGTERM`;
- un paquete temporal de producción sin `src/`, sin `test/` y sin TypeScript instalado abrió el listener correctamente;
- `NODE_ENV`, `HOST` y `PORT` válidos fueron aceptados;
- la ausencia de `NODE_ENV` produjo exit `1` antes del listener.

## Source maps

Un error técnico controlado por variable ausente produjo exit `1`. El stack sanitizado apuntó tres veces a `src/startup-config.ts`. La búsqueda de `sourcesContent` en los cuatro maps produjo `0` coincidencias.

## Supply chain

- default documentado: `blocked`;
- allowlist gobernada: `[]`;
- `dangerouslyAllowAllBuilds` no está habilitado;
- el campo obsoleto `package.json#pnpm.onlyBuiltDependencies` no existe;
- el fixture no aprobado no ejecutó su lifecycle;
- ninguna dependencia actual requirió una excepción;
- no se guardaron credenciales de registry.

La configuración efectiva depende del deny-by-default de pnpm 11. Una allowlist no vacía no está autorizada mientras requiera `pnpm-workspace.yaml`.

## Lockfiles y workspace

En la raíz del producto:

```text
root_lockfiles=1
root_workspace_files=0
```

El único lockfile raíz es `pnpm-lock.yaml`. Una búsqueda repo-wide también encuentra `spikes/spike-009-nestjs-shell/package-lock.json`, archivo rastreado del experimento histórico y fuera del producto materializado. Se preservó sin cambios. Esta distinción debe ser ratificada al revisar VC-007 en Linux.

## Dos builds diagnósticos macOS

Se crearon dos directorios temporales independientes desde la misma entrada materializada. Cada uno ejecutó:

```text
pnpm install --frozen-lockfile
pnpm run verify
```

Ambos installs y gates terminaron con exit `0`. Los inventarios contenían los mismos ocho archivos y sus SHA-256 fueron idénticos:

- [Build macOS 1](macos-diagnostic-build-1.sha256)
- [Build macOS 2](macos-diagnostic-build-2.sha256)

Esta comparación es diagnóstico local. No satisface VC-020 porque no se ejecutó en Linux ni desde un commit candidato limpio.

## Hashes de entradas

El manifiesto normalizado de pins, configuración, código técnico, scripts y pruebas está en [technical-inputs.sha256](technical-inputs.sha256). El lockfile tiene SHA-256:

```text
23e1b39512d68743799bb4a8cc061d61d8b23ae714c238897b1046edc6543552  pnpm-lock.yaml
```

## Evidencia Linux

**No ejecutada.** No se encontró ni se autorizó un entorno Linux x86_64/glibc dentro del alcance. PBI-021 prohíbe seleccionar contenedores o un proveedor por conveniencia. No se usó SSH, Docker, VM, hosting ni infraestructura remota.

## Evidencia CI

**Pending.** DEC-051 sigue sin autorizar runner/proveedor/gate CI. VC-024 no se ejecutó y no se inventaron IDs, logs o hashes de CI.

## Matriz VC-001 a VC-024

Un VC que exige Linux no se marca `Pass` sólo por haber pasado localmente.

| VC | Estado | Plataforma ejecutada | Evidencia y motivo |
| --- | --- | --- | --- |
| VC-001 | Blocked | macOS arm64 | Pin exacto y preflight pasan; falta Linux |
| VC-002 | Blocked | macOS arm64 | Node `25.9.0` rechazado, exit `1`; falta caso Linux aislado |
| VC-003 | Blocked | macOS arm64 | pnpm/Corepack resuelven `11.15.1`; falta Linux |
| VC-004 | Blocked | macOS arm64 | User-agent npm rechazado, exit `1`; falta gestor real en Linux aislado |
| VC-005 | Blocked | macOS arm64 | Frozen exit `0` e inputs sin cambios; no es clon limpio ni Linux |
| VC-006 | Blocked | macOS arm64 | Desalineación rechazada y lock intacto; falta Linux |
| VC-007 | Blocked | macOS arm64 | Raíz tiene un lockfile; falta Linux y ratificar exclusión del lockfile del spike |
| VC-008 | Blocked | No | No se ejecutó PATH/home controlado en Linux |
| VC-009 | Blocked | macOS arm64 | Lifecycle no ejecutado; falta Linux y revisión de supply chain |
| VC-010 | Blocked | macOS arm64 | Typecheck exit `0`, cero emit; falta Linux |
| VC-011 | Blocked | macOS arm64 | Error controlado exit `2`, sin `dist/`; falta Linux |
| VC-012 | Blocked | macOS arm64 | Build limpio con ocho artefactos; falta Linux |
| VC-013 | Blocked | macOS arm64 | NestJS/ESM/provider inicia; falta Linux |
| VC-014 | Blocked | macOS arm64 | JavaScript de `dist/` inicia y cierra; falta Linux |
| VC-015 | Blocked | macOS arm64 | Artefacto sin fuente/devtools inicia; falta Linux |
| VC-016 | Blocked | macOS arm64 | Stack mapeado y sin inline sources; falta Linux |
| VC-017 | Blocked | macOS arm64 | Variables técnicas válidas permiten startup; falta Linux |
| VC-018 | Blocked | macOS arm64 | Variable ausente falla antes de escuchar; falta Linux |
| VC-019 | Blocked | No | Entorno Linux autoritativo no disponible/autorizado |
| VC-020 | Blocked | macOS arm64 | Dos builds locales idénticos; faltan dos builds Linux limpios |
| VC-021 | Blocked | macOS arm64 | Casing incorrecto rechazado, exit `2`; falta Linux |
| VC-022 | Blocked | macOS arm64 | Inputs técnicos no mutaron; árbol inicial no limpio y falta Linux |
| VC-023 | Blocked | macOS arm64 sin TTY | Gate terminó y propagó exits; falta Linux |
| VC-024 | Pending | No | DEC-051 no ha autorizado CI Linux |

## Conclusión de evidencia

La combinación seleccionada funciona localmente y los casos positivos/negativos ejecutados son coherentes. La evidencia requerida permanece incompleta por la ausencia de Linux, dos builds Linux desde un commit limpio, CI autorizado y revisiones obligatorias.
