# Verificación formal de DEC-005 y PBI-022

## Dictamen

**FAIL — DEC-005 FORMAL VERIFICATION BLOCKED**

Fecha de revisión: 2026-07-22.

La estructura materializada es mínima, compila y satisface el grafo aprobado,
pero el expediente no puede promoverse. Dos copias divergentes de SPIKE-009
siguen sin una resolución de procedencia, el checker acepta silenciosamente
casos que el contrato declara rechazables y la documentación contiene estados
y conteos incompatibles. El smoke compilado también produjo un fallo
intermitente durante la reproducción independiente.

Por este dictamen:

- DEC-005 conserva `Accepted — Materialized / Formal Verification Pending`;
- PBI-022 conserva `In review`;
- no se registra `Verified`, `Done`, `Complete`, `Closed` ni autorización de R0;
- Sprint 00 continúa abierto;
- DEC-049 continúa abierta y no se trabajó en esta revisión.

## Precondiciones y estado Git

| Hecho | Resultado reproducido |
| --- | --- |
| Rama | `main` |
| HEAD | `be1fe5a774b3437063b86e6ff16920131e502079` |
| `origin/main` | `be1fe5a774b3437063b86e6ff16920131e502079` |
| Divergencia | `HEAD...origin/main = 0 0` |
| Índice | Vacío |
| Working tree | Cambios no versionados de PBI-022 y copias de SPIKE-009 inventariadas |
| Entorno | Local únicamente |

La clasificación del working tree fue:

1. materialización técnica: `src/modules/` y `src/app.module.ts`;
2. checker y política: `architecture/`, `scripts/check-architecture.mjs`,
   `scripts/lib/architecture-checker.mjs` y scripts de `package.json`;
3. pruebas: los cinco archivos `test/architecture-*`;
4. evidencia: `docs/architecture-readiness/dec-005-materialization/`;
5. estado canónico: DEC-005, PBI-022, backlog y gates de
   `architecture-readiness`;
6. archivos ajenos: siete copias no versionadas de SPIKE-009, cinco exactas y
   dos divergentes.

No había contenido staged. El lockfile y los archivos originales protegidos
no presentan diff.

## Hallazgos

| ID | Severidad | Regla/criterio | Evidencia | Remediación exacta |
| --- | --- | --- | --- | --- |
| FV-001 | Blocker | Procedimiento de duplicados | `postgres 2.sh` y `static-check 2.mjs` no son idénticos a sus originales. Permanecen no versionados y no referenciados, pero el procedimiento prohíbe eliminarlos como duplicados exactos. | Determinar su procedencia; decidir explícitamente si son basura local o evidencia histórica; eliminarlos, renombrarlos o incorporarlos mediante una tarea separada; repetir hashes, búsqueda de referencias y status. |
| FV-002 | Blocker | D5-R003, D5-R032, D5-R033, DEC005-C01 | El checker sólo cuenta source files dentro del módulo en `scripts/lib/architecture-checker.mjs:241-257`. Un `access.module.ts` vacío y un directorio interno vacío recibieron exit `0`. | Rechazar archivos source vacíos y directorios vacíos/anticipatorios en el árbol inspeccionado; agregar fixtures separados y al menos una mutación con rechazo y restauración. |
| FV-003 | Blocker | D5-R023, D5-R033, DEC005-C01 | `scripts/lib/architecture-checker.mjs:496-503` verifica declaraciones de import, no el arreglo `imports` de `@Module`. El fixture positivo de `test/architecture-fixtures.mjs:1-12` ni siquiera contiene `@Module`, pero recibe exit `0`. | Inspeccionar por AST el decorador `@Module` de `AppModule` y exigir exactamente la composición autorizada; agregar fixture negativo y mutación que conserven imports estáticos pero retiren un módulo del arreglo. |
| FV-004 | Major | D5-R029, D5-R033, DEC005-C01 | Existe detector para `Scope.REQUEST` en `scripts/lib/architecture-checker.mjs:309-310`, pero no existe fixture ni mutación que demuestre su rechazo. | Añadir caso negativo aislado que exija D5-R029 y una cobertura de restauración o justificar expresamente por qué la regla deja de declararse automatizada. |
| FV-005 | Major | D5-R036, D5-R033, DEC005-C01 | Controllers y endpoints se diagnostican como D5-R035 en `scripts/lib/architecture-checker.mjs:312-316`; no existe diagnóstico ni caso específico D5-R036, aunque el catálogo presenta detección actual para esa regla. | Separar el diagnóstico de decisión de contexto/autorización o clasificar D5-R036 como revisión semántica/no aplicable durante PBI-022; alinear catálogo, checker y prueba. |
| FV-006 | Blocker | Consistencia documental | `dec-005-materialization/RESULTS.md:40` dice 31 fixtures; hay 35. `decisions/.../RESULTS.md:26-32` declara implementación/enforcement no ejecutados y que no se usa `Materialized`, aunque el mismo documento declara el estado materializado. `PBI-022.md:523` dice que evidencia y pruebas están pendientes, mientras `PBI-022.md:528-530` afirma que ya se ejecutaron. `repair-mvp/CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md:66` y `repair-mvp/TRAZABILIDAD.md:33` vuelven a presentar la materialización de DEC-005 como pendiente. | Reconciliar estado vigente e histórico sin reescribir el dictamen de selección; corregir conteos; distinguir materialización ejecutada de verificación formal pendiente; repetir validación de links y consistencia. |
| FV-007 | Major | Reproducción técnica / evidencia | La primera corrida formal de `pnpm run smoke:start` falló con `The startup marker was not emitted`; una repetición y diez intentos posteriores pasaron. `scripts/smoke-start.mjs:72-75` comprueba stdout inmediatamente después de detectar el listener, lo que permite una carrera con el evento `data`. `EVIDENCE.md:33` sólo registra PASS. | Esperar de forma acotada tanto el listener como el marker, capturar stdout/stderr antes de decidir y agregar una prueba repetida determinista; actualizar la evidencia con la incidencia real. |

Los hallazgos FV-001, FV-002, FV-003 y FV-006 impiden el dictamen formal. No
se corrigieron dentro de esta revisión porque hacerlo mezclaría verificación
independiente con remediación.

## Resolución de las siete copias de SPIKE-009

Se comparó cada par con `cmp -s` y SHA-256, y se buscó su nombre literal en el
repositorio. Ninguna copia está referenciada ni participa en PBI-022, en el
checker, en las pruebas o en el empaquetado.

| Copia | SHA-256 original/copia | Resultado | Acción |
| --- | --- | --- | --- |
| `architecture-rules 2.mjs` | `e54a57fda9b79726fa5cc90ab71da5b19b4cddf0e4e35ccb100038d12073449d` | Idéntica | Eliminada del working tree |
| `architecture-rules.d 2.mts` | `dd88def42508d4624eb06bc44adb6a64b948199c7d59003720125937aa926131` | Idéntica | Eliminada del working tree |
| `ci 2.sh` | `b65d205672d993a62b9e2c821e95c00b120c54be2adb089356123355b4778e90` | Idéntica | Eliminada del working tree |
| `with-postgres 2.sh` | `ada4a17d49d4893b92ad2fe518614cd2d51644100090281b7fee2bd41cdc8fad` | Idéntica | Eliminada del working tree |
| `support 2.ts` | `5bd40265eb339f2c34af6d85da3b9eee84b1176ae4f9b52033ffce1f2fa535c8` | Idéntica | Eliminada del working tree |
| `postgres 2.sh` | original `84f73d8afcfb5045b1af1af911597b8329180913563eeafd9fafe604e9915b47`; copia `6554b6ad6ed775c1ccce8855a4a5599d448aab3f3441dbe9d842c42ede0c8a59` | Divergente | Conservada; bloquea resolución completa |
| `static-check 2.mjs` | original `372b3f4842549f89de6640b4576711b3dc5297fcafbb9686d524c508e14909ef`; copia `b2730ab7da7cdfd38118e14266936969e63e03c9f399b16273a5edef1acdeb62` | Divergente | Conservada; bloquea resolución completa |

`postgres 2.sh` es una versión más corta con path Homebrew fijo, puerto fijo y
runtime persistente; el original descubre PostgreSQL 18, usa puerto y runtime
aislados, registra ownership y soporta cleanup. `static-check 2.mjs` omite la
integración con `architecture-rules.mjs` y sólo conserva un check de
`ModuleRef`; el original inspecciona las reglas arquitectónicas del source.

Los siete originales permanecen intactos.

## Revisión de alcance y estructura

El árbol real de producto contiene exclusivamente:

```text
src/modules/access/access.module.ts
src/modules/access/index.ts
src/modules/stations/index.ts
src/modules/stations/stations.module.ts
src/modules/tenancy/index.ts
src/modules/tenancy/tenancy.module.ts
```

La inspección reproducible confirmó:

- ningún archivo o directorio vacío real bajo `src/`;
- ausencia de `src/shared/`, `src/infrastructure/` y roots globales
  `common`, `utils`, `helpers`, `base` o `core`;
- módulos Nest mínimos sin controllers ni providers funcionales;
- `AppModule` real compone `TenancyModule`, `StationsModule` y `AccessModule`;
- grafo observado exacto `access->stations`, `access->tenancy` y
  `stations->tenancy`;
- ningún ciclo, edge inverso o deep import real;
- ninguna autenticación, autorización funcional, PIN, sesión, persistencia,
  SQL, migración, multitenancy funcional, sucursal funcional, endpoint, CI,
  deploy, workspace o microservicio;
- `main.ts`, `startup-config.ts`, `pnpm-lock.yaml` y todos los originales de
  SPIKE-009 sin diff.

Por inspección directa, el árbol materializado satisface DEC005-C02, C04 y el
aspecto de ausencia funcional de C05. El fallo está en el enforcement y su
evidencia, no en una violación funcional observada del árbol actual.

## Superficies, ownership y grafo

| Módulo | Superficie pública | Consumidores observados | Dependencias observadas | Resultado |
| --- | --- | --- | --- | --- |
| `tenancy` | `TenancyModuleContract` | `stations`, `access` | Ninguna | PASS |
| `stations` | `StationsModuleContract` | `access` | `tenancy` | PASS |
| `access` | `AccessModuleContract` | `AppModule`, sólo para comprobación type-only | `stations`, `tenancy` | PASS |

Los tres contratos son interfaces type-only, no importan NestJS, no exportan
internals y sólo expresan marcadores de frontera. No anticipan tenant IDs,
credenciales, sesiones, capacidades ni comportamiento. Los módulos Nest están
separados de las APIs intermodulares.

`OWNERSHIP.md` asigna Arquitectura a las fronteras e Ingeniería al checker,
mantiene personas funcionales/mantenedoras como pendientes y conserva datos,
repositorios y tablas en DEC-049. No se encontró una persona, firma o excepción
inventada. El grafo documental coincide con imports reales.

## Revisión del checker

Aspectos conformes:

- política JSON válida y estable;
- parser TypeScript real para imports, exports y declaraciones;
- resolución local NodeNext acotada y paths de diagnóstico relativos;
- diagnósticos ordenados por regla, path y mensaje;
- exit `0`/`1` determinista para los casos cubiertos;
- rechazo efectivo de módulos no autorizados, roots prohibidos, deep imports,
  internals, edges fuera del grafo, ciclos, NestJS en capas prohibidas,
  `forwardRef`, `ModuleRef`, módulo global, DTO/port/adapter mal ubicado,
  `shared` con contenido y superficies HTTP;
- límites sobre imports calculados, reflexión, aliases/loaders y semántica de
  negocio documentados.

Aspectos no conformes:

- archivos source vacíos y directorios internos vacíos pasan;
- composición Nest se confunde con mera presencia de imports;
- no hay caso inválido D5-R029;
- D5-R036 no está trazada a un diagnóstico propio;
- las pruebas de consistencia documental sólo buscan strings y no detectan
  contradicciones de estado o conteos.

Los tests usan `process.cwd()` para localizar checker y producto. Es compatible
con los scripts de package ejecutados desde la raíz, pero esa precondición debe
permanecer explícita al portar el checker.

## Matriz D5-R001 a D5-R036

`Policy` nombra la fuente ejecutable o documental; `—` significa que la regla
es semántica/manual o no tiene artefacto en esa columna.

| Regla | Policy | Checker | Fixture | Mutación | Resultado |
| --- | --- | --- | --- | --- | --- |
| D5-R001 | Manifest/DEC-004 | `verify:structure` | — | — | PASS manual/producto |
| D5-R002 | `allowedModules` + ownership | Sí | módulo no autorizado | — | PASS |
| D5-R003 | allowlist/paths | Parcial | módulo vacío | — | **FAIL: archivo y ruta interna vacíos pasan** |
| D5-R004 | `publicSurfaces` | Sí | superficie ausente; reexport | — | PASS |
| D5-R005 | grafo/superficie | Sí | deep import | frontera | PASS |
| D5-R006 | `dependencies` | Sí | inversión; edge externo | — | PASS |
| D5-R007 | `dependencies` | Sí | ciclo | grafo | PASS |
| D5-R008 | capas DEC-005 | Sí | dominio→aplicación | — | PASS |
| D5-R009 | capas DEC-005 | Sí | aplicación→infra | — | PASS |
| D5-R010 | capas DEC-005 | Sí | Nest en dominio/aplicación | framework | PASS |
| D5-R011 | capas DEC-005 | Sí | presentación→repository | — | PASS |
| D5-R012 | paths | Sí | port fuera de aplicación | — | PASS |
| D5-R013 | paths | Sí | adapter en dominio | — | PASS |
| D5-R014 | superficie/ownership | Sí | internal ajeno | — | PASS |
| D5-R015 | paths | Sí | DTO fuera de presentación | — | PASS |
| D5-R016 | `publicSurfaces` | Sí | Nest en `index.ts` | — | PASS |
| D5-R017 | ownership semántico | Revisión | No hay eventos | — | PASS, no aplicable |
| D5-R018 | superficie | Sí | entidad pública | — | PASS |
| D5-R019 | shared vacío | Sí | contenido shared | shared | PASS |
| D5-R020 | `forbiddenGlobalRoots` | Sí | cinco roots | roots | PASS |
| D5-R021 | regla documental | Revisión | No hay utilidades | — | PASS, no aplicable |
| D5-R022 | ownership/path | Revisión | No hay infra | — | PASS, no aplicable |
| D5-R023 | composición | Parcial | No | No | **FAIL: imports sin composición pasan** |
| D5-R024 | composición | Sí | import externo | — | PASS |
| D5-R025 | prohibición | Sí | `forwardRef` | composición | PASS |
| D5-R026 | prohibición | Sí | `ModuleRef` | — | PASS |
| D5-R027 | prohibición | Sí | módulo global | — | PASS |
| D5-R028 | regla documental | Revisión | No hay dynamic modules | — | PASS, no aplicable |
| D5-R029 | prohibición | Sí | No | No | **PARTIAL: detector sin prueba inválida** |
| D5-R030 | regla futura | Revisión | No hay casos de uso | — | PASS, no aplicable |
| D5-R031 | NodeNext | Sí + typecheck | extensión ausente | — | PASS |
| D5-R032 | determinismo | Orden/salidas | doble corrida por fixture | repetición gate | PASS para casos cubiertos |
| D5-R033 | catálogo | Suite | Cobertura incompleta | ocho familias | **FAIL: R003/R023/R029 sin caso suficiente** |
| D5-R034 | fail-closed | Sin excepciones | — | — | PASS en alcance actual |
| D5-R035 | `productModuleFiles` | Sí | controller, endpoint, negocio | HTTP/negocio | PASS en árbol actual |
| D5-R036 | regla semántica | Reporta R035 | No específico | No específico | **PARTIAL: trazabilidad declarada incorrecta** |

Los 36 identificadores son únicos y cada fila documental incluye nivel,
motivo, mecanismo, severidad y autoridad de excepción. La matriz demuestra,
sin embargo, que el mecanismo declarado no está implementado o probado de
forma suficiente en D5-R003, D5-R023, D5-R029, D5-R033 y D5-R036.

## Fixtures, mutaciones y pruebas

Conteos reproducidos directamente del source y del runner:

| Evidencia | Resultado |
| --- | --- |
| Fixtures | 35: 2 positivos y 33 negativos |
| Mutaciones | 8 familias; todas rechazan y la restauración vuelve a PASS |
| `test:architecture` | 45/45 PASS |
| `pnpm test` | 50/50 PASS: 45 arquitectura + 5 baseline |

Cada fixture usa un temporal independiente bajo el directorio temporal del
sistema, corre dos veces y compara código, stdout, stderr, regla y fragmento
diagnóstico. Cada mutación copia `src/`, exige el rechazo, restaura el archivo y
exige exit `0`. No quedan temporales versionados.

Las aserciones no son tautológicas respecto del checker, pero la selección de
casos deja sin activar los falsos PASS FV-002/FV-003 y el detector D5-R029. La
prueba documental de `architecture-policy.test.mjs` valida presencia textual,
no coherencia semántica; por ello no detecta los estados contradictorios.

## Reproducción técnica

### Toolchain

| Herramienta | Versión usada | Resultado |
| --- | --- | --- |
| Node.js canónico | `v24.18.0` | PASS |
| pnpm | `11.15.1` | PASS |
| TypeScript | `6.0.3` | PASS |
| Node.js ambient por defecto | `v25.9.0` | Fuera de baseline; no usado para gates |

La revisión seleccionó explícitamente `/opt/homebrew/opt/node@24/bin` para
ejecutar el contrato aceptado.

### Secuencia requerida

| Comando | Resultado real |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS; lockfile sin cambios |
| `git status --short` | Working tree esperado; índice vacío |
| `pnpm run verify:architecture` | PASS; policy 1 y tres edges |
| `pnpm run test:architecture` | PASS; 45/45 |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS; 50/50 |
| primera `pnpm run verify` | PASS |
| segunda `pnpm run verify` | PASS |
| `pnpm run smoke:start` | FAIL en primera corrida formal; PASS al repetir y 10/10 posteriores |
| probes de archivo/directorio vacío y composición sólo por imports | **FAIL del checker: tres casos inválidos recibieron exit 0** |
| `git diff --check` | PASS antes del dictamen |

No se usaron `|| true`, filtros ni redirecciones para ocultar fallos. Un primer
intento del bucle de smoke falló antes de ejecutar por usar el nombre reservado
`status` de zsh; se corrigió únicamente el nombre de la variable del harness y
se ejecutaron los diez intentos con propagación de fallo.

## DEC005-C01 a DEC005-C05

| Criterio | Dictamen | Evidencia |
| --- | --- | --- |
| DEC005-C01 | **FAIL** | Checker compilable y determinista para sus casos, pero falsos PASS de vacío/composición, cobertura D5 incompleta, documentos contradictorios y smoke intermitente |
| DEC005-C02 | **PASS** | Árbol real con seis archivos no vacíos; ningún path genérico, anticipatorio o sin artefacto observado |
| DEC005-C03 | **PASS** | Ownership, APIs, consumidores y grafo coinciden con código y policy; personas pendientes no fueron inventadas |
| DEC005-C04 | **PASS** | `src/shared/` ausente; sin admisiones ni excepciones silenciosas |
| DEC005-C05 | **PASS** | Sin funcionalidad; DEC-004/044/049/050/051/063 independientes; R0 no autorizado; Sprint 00 abierto |

Al menos una condición está en FAIL. Por tanto no se cumplen los requisitos
para `PASS — DEC-005 FORMALLY VERIFIED`.

## Limitaciones conservadas

Continúan explícitamente fuera de la capacidad automática:

- imports dinámicos calculados;
- dependencias por reflexión, generación, alias o loader personalizado;
- semántica de hechos públicos y reglas de negocio;
- mutabilidad efectiva de un contrato más allá de convenciones detectables;
- acceso físico a tablas antes de DEC-049.

Estas limitaciones no habilitan excepciones y no fueron presentadas como
cobertura efectiva en este dictamen.

## Siguiente acción exacta

Ejecutar una remediación acotada de PBI-022 que:

1. resuelva por procedencia las dos copias divergentes de SPIKE-009;
2. corrija D5-R003 y D5-R023 y agregue sus casos negativos/mutaciones;
3. agregue cobertura D5-R029 y alinee D5-R036;
4. elimine la carrera del smoke sin cambiar comportamiento funcional;
5. reconcilie conteos, evidencia y estados documentales;
6. repita íntegramente esta verificación formal desde el mismo HEAD base o
   explique cualquier cambio de base.

No avanzar a DEC-049 dentro de esa remediación ni antes de un nuevo dictamen.
