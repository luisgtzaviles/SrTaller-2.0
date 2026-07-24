# Revisión formal de DEC-051

## 1. Estado inicial

- **Decisión revisada:** [DEC-051 — Estrategia de pruebas, CI y gates
  ejecutables](DECISION_PROPOSAL.md).
- **Estado recibido:** `Ready for formal decision — Proposal Complete /
  Approval Pending`.
- **Fecha de revisión:** 2026-07-24.
- **Autoridad:** Responsable del Proyecto.
- **DEC-005:** `Accepted — Materialized / Formally Verified`.
- **DEC-044:** `Accepted`; DEC044-C01 a DEC044-C08 vigentes y pendientes.
- **DEC-049:** `Accepted`; DEC049-C01 a DEC049-C08 vigentes y pendientes.
- **H0 recibido:** seis decisiones cerradas y tres abiertas.
- **R0:** no autorizado.
- **Sprint 00:** abierto.
- **VC-024:** `Pending`; sin dos ejecuciones CI equivalentes ni dictamen de
  cumplimiento.
- **DEC-063:** pendiente y dependiente de DEC-051.

El expediente se recibió con cambios locales preexistentes. La revisión los
preserva mediante un inventario y huellas SHA-256; no los toma como evidencia
de materialización de DEC-051.

## 2. Metodología

La revisión:

1. leyó la propuesta completa y comprobó cada criterio de aceptación;
2. contrastó el contrato con DEC-004, DEC-005, DEC-044, DEC-049, ADR-004 y
   ADR-009 a ADR-013;
3. revisó readiness de R0, Sprint 00, blocker closure, governance unblocking,
   Repair MVP, mapas de dependencias, PBI-021 y el contrato de VC-024;
4. evaluó por separado Arquitectura, Ingeniería, Seguridad, Operaciones y
   Calidad;
5. distinguió aceptación documental, materialización técnica y evidencia
   ejecutada;
6. verificó trazabilidad de DEC051-C01 a DEC051-C10 sin considerar cumplida
   ninguna;
7. trató toda ambigüedad de riesgo como fail-closed y no infirió aprobación a
   partir de scripts, tests o cambios locales;
8. reservó DEC-063, DEC-050, proveedor CI, workflows y protección de rama a sus
   autoridades y trabajos posteriores.

Cada disciplina usa únicamente `PASS`, `PASS WITH CONDITIONS` o `FAIL`. Una
condición indica trabajo verificable posterior; no reduce el alcance normativo
aceptado ni autoriza su implementación.

## 3. Revisión de Arquitectura

**Resultado: PASS WITH CONDITIONS.**

La Opción B ofrece una estrategia única por capas y riesgo. Separa:

- el gate local canónico, `pnpm run verify`;
- la autoridad Linux y los checks de CI;
- las suites siempre obligatorias;
- las suites especializadas activadas de forma fail-closed por riesgo;
- la aceptación del contrato y su materialización posterior.

La decisión conserva la organización y el enforcement de DEC-005. El checker
arquitectónico nunca depende de paths para decidir si corre; una modificación
del checker, policy, fixtures, mutaciones o mapa de triggers es riesgo alto. La
exigencia de fixture negativo, mutación controlada, diagnóstico determinista,
restauración y contrato semántico preserva D5-R033 y evita reglas decorativas.

DEC-044 y DEC-049 permanecen dueñas de sus contratos. DEC-051 sólo especifica
qué evidencia ejecutable debe demostrarlos. La reproducibilidad y la doble
ejecución comparan resultados semánticos e inventarios normalizados, no datos
incidentales como PID, duración o puertos.

No existe conflicto con DEC-004/005/044/049 ni con ADR-004/009–013. La
aceptación queda condicionada a DEC051-C01, C02, C06, C07, C09 y C10 durante su
materialización; ninguna está cumplida hoy.

## 4. Revisión de Ingeniería

**Resultado: PASS WITH CONDITIONS.**

El contrato es implementable con la baseline aceptada: Node.js `24.18.0`, pnpm
`11.15.1`, TypeScript `6.0.3`, NestJS `11.x`, Kysely, `pg` y PostgreSQL
`18.4`. No obliga a introducir un runner, framework o proveedor nuevo:
`node:test`, los comandos pnpm canónicos, el checker AST y el smoke compilado
son suficientes como baseline.

La composición es mantenible:

- `pnpm install --frozen-lockfile` permanece fuera de `verify`;
- `verify` conserva el contrato local estable;
- arquitectura, typecheck, build, pruebas rápidas y smoke bloquean todo PR;
- integración, PostgreSQL real, seguridad negativa y mutación crítica se
  añaden cuando el riesgo las activa;
- E2E de navegador se difiere hasta existir superficie web autorizada.

Los comandos deben ser no interactivos, propagar exit code, fallar ante
precondiciones ausentes y no mutar el repositorio. El costo se controla por
capas sin degradar cambios de riesgo alto. No hay retry automático para
convertir rojo en verde.

La aceptación queda condicionada a DEC051-C01, C03, C05, C06, C07 y C09.
Implementar pipeline, PostgreSQL, tests o protección de rama requiere una
autorización posterior.

## 5. Revisión de Seguridad

**Resultado: PASS WITH CONDITIONS.**

La estrategia hace obligatorias pruebas positivas y negativas de aislamiento:
tenant A puede operar dentro de su alcance; tenant B no puede leer, inferir,
mutar ni referenciar el dato de A. Cuando aplique sucursal, dos sucursales del
mismo tenant prueban el alcance. Contexto ausente, inválido, inactivo o
inconsistente falla cerrado.

Las operaciones administrativas usan una superficie separada y no convierten
un repositorio ordinario en acceso global. Las pruebas cubren lectura,
escritura, foreign keys, rollback, retry y ausencia de efectos cross-tenant.
Los controles descendientes de contexto, autenticación, autorización y
acciones sensibles se trazan a ADR-004 y ADR-010 a ADR-013.

Los datos son sintéticos. El CI futuro usa credenciales efímeras y de mínimo
privilegio, no expone secretos a cambios no confiables y sanitiza logs y
artefactos. PIN, contraseñas, tokens, cookies, connection strings y datos
reales están prohibidos en evidencia.

DEC-044 conserva anti-enumeración, sanitización y `Unexpected`; DEC-051 exige
probarlos. La aceptación queda condicionada a DEC051-C02, C04, C05, C07 y C10.
No existe evidencia actual de aislamiento automatizado, secretos seguros o
branch protection.

## 6. Revisión de Operaciones

**Resultado: PASS WITH CONDITIONS.**

Linux `x86_64` con GNU glibc es la autoridad para CI, merge y VC-024. La
evidencia registra toolchain, commit, comando, exit code, hashes, logs
sanitizados, reportes, artefactos, smoke, versión PostgreSQL y lifecycle. Los
outputs incidentales se normalizan sin ocultar diferencias materiales.

PostgreSQL real debe ser aislado, reproducible y gobernado en versión. Cada
suite posee datos y schema/base aislados, limpia incluso después de fallar,
termina sesiones y demuestra ausencia de contaminación. Pool, agotamiento,
timeouts, deadlocks, serialización, rollback y misma conexión transaccional
son observables.

La política de flakiness preserva el primer fallo. La cuarentena es excepcional,
con owner, expiración, riesgo, evidencia alternativa y criterio de
restauración. No se permite retry para obtener verde ni cuarentena de la única
prueba crítica.

La aceptación queda condicionada a DEC051-C01, C02, C03, C07, C08 y C10. No
se selecciona proveedor CI, contenedor, servicio PostgreSQL ni retención final.

## 7. Revisión de Calidad

**Resultado: PASS WITH CONDITIONS.**

El portafolio cubre unitarias, integración, arquitectura, contratos,
PostgreSQL real, smoke, negativas de seguridad, mutación, reproducibilidad y
E2E futuro. Cada tipo declara propósito, owner, trigger, entorno, detección y
límite; ninguno reemplaza otro.

La suficiencia se decide por riesgo y contrato. Una métrica global de líneas
es secundaria y no sustituye branches, mutaciones críticas, estados del
contrato ni pruebas negativas. Para riesgo alto se exigen casos positivos,
negativos, frontera y fallo.

La matriz de DEC-044 cubre traducción, sanitización, HTTP, retry, logging,
anti-enumeración y `Unexpected`. La de DEC-049 cubre ownership, repositorios,
scope, restricciones, transacciones, misma conexión, raw SQL gobernado y
errores. El checker conserva fixtures, mutaciones, determinismo y D5-R033.

VC-024 tiene evidencia exacta, pero continúa `Pending`: el documento no
contiene runs CI. La aceptación queda condicionada a DEC051-C01 y C03 a C09.

## 8. Estrategia seleccionada

Se acepta la **Opción B — pipeline por capas y riesgo**.

El contrato normativo es:

1. `pnpm run verify` es el gate local canónico previo a someter cambios.
2. Linux y CI son autoridad para merge y evidencia gobernada.
3. Arquitectura se ejecuta siempre.
4. La clasificación de riesgo es fail-closed.
5. Riesgo alto activa todas las suites pertinentes.
6. No hay bypass informal ni PASS con evidencia crítica flaky.
7. La aceptación documental no materializa pipeline, tests o protección.

La Opción A aumenta costo y presión para evadir suites; la C carece de
repetibilidad y no protege `main`. B logra feedback rápido sin rebajar
contratos críticos.

## 9. Pipeline

El pipeline normativo, aún no materializado, conserva este orden:

1. checkout limpio del commit exacto;
2. validación de Linux, Node.js y pnpm;
3. instalación congelada;
4. arquitectura;
5. typecheck;
6. build limpio;
7. unitarias y contratos rápidos;
8. pruebas dedicadas de arquitectura;
9. integración y PostgreSQL real según riesgo;
10. negativas de seguridad y aislamiento;
11. mutaciones críticas;
12. smoke sobre `dist/`;
13. recolección sanitizada de evidencia;
14. decisión bloqueante de PASS/FAIL.

Arquitectura y CI son responsabilidades separadas: DEC-005 define las reglas;
DEC-051 define cuándo y con qué evidencia bloquear. Un trigger incompleto no
autoriza omitir una suite: ante duda se eleva el riesgo.

## 10. Riesgo

| Nivel | Regla confirmada | Suites mínimas |
| --- | --- | --- |
| Bajo | Documentación o refactor sin cambio observable, frontera o persistencia | Gates rápidos, documentación aplicable y arquitectura |
| Medio | API no sensible, adapter acotado o comportamiento sin persistencia crítica | Base, contratos, integración focalizada, smoke y negativos aplicables |
| Alto | Acceso, tenant/sucursal, persistencia, transacciones, migraciones, datos sensibles, raw SQL, checker, concurrencia o escape hatch | Todas las suites aplicables, PostgreSQL real, negativos, mutación crítica, smoke y evidencia reforzada |

El nivel mayor prevalece. Modificar gates, paths o el checker es riesgo alto
por su capacidad de suprimir evidencia transversal.

## 11. PostgreSQL real

La suite de persistencia usa la versión gobernada, PostgreSQL `18.4`, no un
mock ni una sustitución. Debe demostrar:

- constraints, `UNIQUE` y foreign keys compuestas;
- rollback completo y ausencia de commits parciales;
- toda la transacción sobre la misma conexión;
- aislamiento y cleanup por suite/worker;
- timeout, agotamiento y lifecycle del pool;
- deadlock y serialization failure;
- SQLSTATE conocido y desconocido;
- concurrencia, idempotencia y outcome desconocido cuando apliquen;
- ausencia de contaminación entre tenants, sucursales o ejecuciones.

DEC-050 conserva herramienta y lifecycle de migraciones. Esta revisión no los
decide. DEC051-C03 y C06 permanecen pendientes.

## 12. Multitenancy

El contrato mínimo exige:

1. contexto confiable y obligatorio;
2. tenant A puede leer y cambiar sólo su recurso autorizado;
3. tenant B no puede leer, inferir, cambiar ni referenciar el recurso de A;
4. el scope de sucursal se prueba cuando forme parte del contrato;
5. contexto ausente o inconsistente niega;
6. FK, escrituras, rollback y retry no cruzan scopes;
7. jobs y administración no reutilizan el acceso ordinario;
8. errores de denegación no enumeran recursos.

Una prueba positiva aislada no demuestra aislamiento. DEC051-C04 permanece
pendiente y requiere al menos dos tenants sintéticos y las sucursales
aplicables.

## 13. Contratos de DEC-044

DEC-051 hace ejecutables, sin redefinir, los contratos aceptados de DEC-044:

- resultados tipados y exhaustivos entre dominio, aplicación, infraestructura
  y API;
- catálogo completo y categoría `Unexpected`;
- respuesta pública sanitizada y mapeo HTTP;
- traducción de PostgreSQL conocida y fallback seguro;
- retry sólo para señales clasificadas, acotado e idempotente;
- logging estructurado sin secretos;
- anti-enumeración;
- pruebas de fallos esperados e inesperados.

DEC044-C08 se materializará mediante estas suites, pero continúa pendiente
junto con DEC051-C05.

## 14. Contratos de DEC-049

DEC-051 verifica:

- ownership único de tablas y acceso mediante repositorios explícitos;
- ausencia de un `BaseRepository` genérico;
- queries cross-module mediante contratos/query services permitidos;
- scope `tenantId` y `tenantId + branchId`;
- transacciones dirigidas por aplicación y misma conexión;
- rollback, constraints y concurrencia en PostgreSQL real;
- raw SQL restringido y trazable;
- administración separada del acceso ordinario;
- traducción de errores conforme a DEC-044.

DEC051-C06 y las ocho condiciones DEC049-C01 a C08 permanecen pendientes.

## 15. Arquitectura ejecutable

El checker DEC-005 es bloqueante en todo cambio. Cada nueva regla automatizable
requiere norma, owner, caso válido cuando aplique, fixture negativo, mutación
controlada, diagnóstico estable, contrato semántico no duplicado, trazabilidad
y restauración.

D5-R033 se conserva como evidencia negativa mínima. Un checker verde sin que
la mutación correspondiente falle no demuestra la regla. DEC051-C09 permanece
pendiente para toda modificación futura de policy, roots, aliases,
canonicalización, fixtures o checker.

## 16. Mutación

La mutación es obligatoria para:

- nuevas reglas automatizadas de arquitectura;
- aislamiento tenant/sucursal;
- autenticación y autorización;
- errores y sanitización;
- transacciones, idempotencia y constraints;
- acciones sensibles.

Se ejecuta sobre copia temporal, representa un defecto realista, debe ser
detectada por la suite correcta, restaura estado y retorna a PASS. No se exige
un score global ni una plataforma general. Una mutación crítica sobreviviente
es `FAIL` aunque el porcentaje agregado sea alto.

## 17. Cobertura

La cobertura de líneas es señal secundaria, nunca gate primario. La
suficiencia combina:

1. lines como diagnóstico;
2. branches;
3. mutación de contratos críticos;
4. estados y resultados de contrato;
5. negativos de seguridad y aislamiento.

No se acepta elevar un porcentaje mientras faltan casos de contrato, fallo o
denegación. Umbrales futuros requieren baseline, owner y revisión de Calidad.

## 18. Determinismo

Son deterministas los exit codes, diagnósticos, orden semántico, checker,
fixtures, mutaciones, restauración, builders, IDs/tiempo controlados, build,
inventario, hashes y evidencia.

PID, duración, puertos, timestamps o paths temporales se normalizan o marcan
como no comparables. No pueden ocultarse diferencias materiales. Las suites no
dependen del orden global, red externa, reloj real, locale personal o home.

## 19. Flakiness

- El primer fallo se preserva.
- Una repetición diagnóstica no reemplaza el resultado rojo.
- No hay retry automático para “poner verde”.
- La cuarentena requiere owner, riesgo, fecha, expiración, evidencia
  alternativa y restauración.
- La única prueba crítica de acceso, transacción, migración o seguridad no
  puede ponerse en cuarentena.
- Al expirar, la suite vuelve a bloquear o el cambio se detiene.

DEC051-C08 permanece pendiente. Hoy no existe proceso materializado de
cuarentena.

## 20. Evidencia

La evidencia mínima comprende commit, rama, trigger, entorno Linux,
toolchain, hashes de manifests/configuración, comandos, exit codes, logs
sanitizados, reportes, resultados de mutación, inventario y SHA-256 de `dist/`,
PostgreSQL/migraciones aplicables, smoke, checker/policy, fixtures sintéticos e
IDs de ejecución.

No incluye PIN, passwords, tokens, cookies, connection strings, secretos,
datos reales, paths locales innecesarios ni dumps completos. La retención
exacta queda diferida, pero la evidencia de merge debe durar toda su revisión
y la de hito/VC/release debe vincularse a su aceptación.

## 21. VC-024

VC-024 permanece **Pending**. Su cumplimiento exige exactamente:

- Linux gobernado `x86_64` con GNU glibc;
- Node.js `24.18.0` y pnpm `11.15.1`;
- mismo commit y checkout limpio;
- instalación congelada;
- typecheck, build, pruebas, arquitectura y smoke;
- inventario e hashes del artefacto;
- exit codes y logs sanitizados;
- dos entornos limpios;
- equivalencia semántica e inventarios/hashes;
- IDs vinculados al commit;
- repositorio sin mutaciones;
- revisión de las autoridades de DEC-004.

Aceptar DEC-051 sólo fija el mecanismo. Faltan pipeline, dos runs, evidencia,
revisión y actualización formal de DEC-004/PBI-021. No se marca total ni
parcialmente cumplida.

## 22. Condiciones

Las condiciones se aceptan con DEC-051, pero las diez permanecen **Pending**.
Ninguna se cumple por la propuesta o por esta revisión.

| ID | Owner | Evidencia exigida | Dependencia | Criterio de cumplimiento | Estado |
| --- | --- | --- | --- | --- | --- |
| DEC051-C01 | Ingeniería + Operaciones + Calidad | Workflow, runs, comandos y artefactos | DEC-004/005/044/049 | Stages Linux y triggers fail-closed materializados y revisados | Pending |
| DEC051-C02 | Operaciones + Arquitectura | Configuración exportable/capturas seguras y prueba de rechazo | Plataforma del repositorio | `main` rechaza integración sin checks requeridos | Pending |
| DEC051-C03 | Ingeniería + Operaciones | Versión, lifecycle, cleanup y suite real | DEC-049; DEC-050 para migraciones | PostgreSQL `18.4` aislado y reproducible ejecuta la suite | Pending |
| DEC051-C04 | Seguridad + Calidad + owner | Matriz de dos tenants, resultados y mutaciones | ADR-004/010/011/012/013 | Casos positivos/negativos prueban tenant y sucursal aplicable | Pending |
| DEC051-C05 | Ingeniería + Seguridad + Calidad | Contratos, negativos, logs y PostgreSQL real | DEC044-C01 a C08 | Catálogo, sanitización, HTTP, retry, logging y anti-enumeración pasan | Pending |
| DEC051-C06 | Arquitectura + Ingeniería + Calidad | Static gates, integración, rollback y misma conexión | DEC049-C01 a C08 | Ownership, scopes, constraints y transacciones pasan | Pending |
| DEC051-C07 | Arquitectura + Ingeniería + Seguridad + Operaciones + Calidad | Dos runs Linux limpios equivalentes | DEC051-C01 y pipeline materializado | VC-024 recibe evidencia y dictamen formal | Pending |
| DEC051-C08 | Calidad + Operaciones | Registro, owner, expiración y restauración | DEC051-C01 | Política de flakiness/cuarentena demostrada sin ocultar rojo | Pending |
| DEC051-C09 | Arquitectura + Ingeniería + Calidad | Caso válido, negativo, mutación, doble run y trazabilidad | DEC-005/D5-R032/R033 | Cambio de checker demuestra detección, restauración y determinismo | Pending |
| DEC051-C10 | Operaciones + Seguridad + Arquitectura | Política, prueba controlada y registro de restauración | DEC051-C02 | Escape hatch expira, se audita y restaura checks | Pending |

Cumplimiento requiere ejecución y revisión por el owner. La mera existencia de
un archivo, test o configuración no cambia el estado.

## 23. Riesgos

| Riesgo residual | Tratamiento |
| --- | --- |
| Trigger omite suite crítica | Clasificación fail-closed, revisión de paths y riesgo alto para el pipeline |
| Costo incentiva bypass | Gates rápidos base y suites profundas por riesgo, sin excepción informal |
| PostgreSQL diverge | Versión gobernada, lifecycle y evidencia |
| Mocks crean confianza falsa | PostgreSQL real y contratos/negativos |
| Retry oculta flakiness | Preservar primer fallo; cuarentena excepcional |
| Evidencia filtra datos | Datos sintéticos, mínimo privilegio y sanitización |
| Coverage desplaza contratos | Mutaciones, branches, estados y negativos prevalecen |
| Checker decorativo | D5-R033, fixtures y mutaciones |
| VC-024 se anticipa | Checklist exacto y dictamen separado |
| Estado compartido contamina | Aislamiento por suite/worker y cleanup comprobado |

Los riesgos son aceptables para una decisión documental porque las condiciones
los convierten en gates previos a la materialización o al primer merge
funcional.

## 24. Decisiones diferidas

Permanecen fuera de DEC-051:

- proveedor y sintaxis de CI;
- implementación de workflows y protección de rama;
- herramienta de E2E/navegador;
- reporter o plataforma de coverage/mutación;
- migrador y lifecycle de DEC-050;
- catálogo general de fixtures de DEC-052;
- umbrales cuantitativos;
- retención final, cache y matrices multi-OS;
- performance general y observabilidad distribuida;
- proveedor de secretos y PostgreSQL.

La deferencia no permite debilitar los contratos aceptados.

## 25. Resultado global

**PASS — DEC-051 ACCEPTED WITH CONDITIONS.**

Las cinco revisiones son `PASS WITH CONDITIONS`. La propuesta:

- define una estrategia única;
- es consistente con la baseline y decisiones aceptadas;
- hace verificables DEC-005/044/049 y aislamiento;
- distingue aceptación, materialización y evidencia;
- conserva todos los riesgos críticos como gates;
- no afirma VC-024 ni condición alguna como cumplida.

No existe contradicción material que impida aceptar el contrato. Las
condiciones no son objeciones abiertas de diseño; son obligaciones de
materialización con owner, evidencia, dependencia y criterio de cumplimiento.

## 26. Autoridad

El **Responsable del Proyecto** emite separadamente las cinco conformidades:

| Función | Resolución |
| --- | --- |
| Arquitectura | Conforme con la estrategia por riesgo, fronteras, checker, mutaciones y condiciones |
| Ingeniería | Conforme con la factibilidad, comandos, suites, costo y condiciones |
| Seguridad | Conforme con aislamiento, negativos, secretos, sanitización y condiciones |
| Operaciones | Conforme con Linux, PostgreSQL, evidencia, flakiness y condiciones |
| Calidad | Conforme con portafolio, trazabilidad, cobertura, VC-024 y condiciones |

No se registran revisores externos, firmas externas ni aprobación inferida del
historial Git. La autoridad corresponde únicamente al Responsable del
Proyecto en las funciones indicadas.

## 27. Estado final

- **DEC-051:** `Accepted`.
- **Fecha:** 2026-07-24.
- **Autoridad:** Responsable del Proyecto.
- **Estrategia:** Opción B — pipeline por capas y riesgo.
- **Revisión:** `PASS — DEC-051 ACCEPTED WITH CONDITIONS`.
- **Condiciones:** DEC051-C01 a DEC051-C10 aceptadas, vigentes y `Pending`.
- **Materialización:** no iniciada ni autorizada por esta revisión.
- **CI/protección de `main`:** no materializados.
- **VC-024:** `Pending`.
- **DEC-063:** siguiente gate de gobierno.

## 28. Impacto en H0

- Estado anterior: **seis H0 cerrados y tres abiertos**.
- Estado final: **siete H0 cerrados y dos abiertos**.
- DEC-051 deja de bloquear H0 por estado documental.
- Los dos remanentes H0 son la evidencia pendiente de DEC-004 y DEC-063.
- DEC051-C01 a C10 siguen condicionando materialización y merges aplicables.

## 29. Impacto en R0

R0 permanece **no autorizado**. La aceptación:

- no habilita implementación funcional;
- no materializa CI, PostgreSQL, tests o branch protection;
- no cierra evidencia de DEC-004;
- no satisface VC-024;
- no sustituye DEC-063 ni los contratos H1 aplicables;
- no concede autorización organizacional para iniciar R0.

## 30. Impacto en Sprint 00

Sprint 00 permanece **abierto**. Este dictamen registra un gate documental H0,
pero no cierra PBIs, criterios históricos, evidencia de ejecución ni revisión
de Producto. Sus matrices deben reflejar DEC-051 `Accepted`, C01 a C10
`Pending`, VC-024 `Pending`, R0 no autorizado y DEC-063 como siguiente gate.

## 31. Siguiente acción

El siguiente gate de gobierno es **DEC-063 — Definition of Done**. Debe usar la
estrategia, portafolio, gates, evidencia, flakiness y excepciones aceptadas en
DEC-051 sin declararlas materializadas.

En paralelo sólo puede prepararse, con autorización separada, la
materialización de DEC051-C01 a C10 y la evidencia futura de VC-024. La acción
inmediata recomendada es **preparar y someter DEC-063 a decisión formal**.
