# Cuarta reverificación formal independiente de DEC-005 y PBI-022

## 1. Título y fecha

- **Título:** Cuarta reverificación formal independiente de DEC-005 y PBI-022.
- **Fecha:** 2026-07-23.
- **Objeto:** materialización local de DEC-005 después de
  [FV3_REMEDIATION.md](FV3_REMEDIATION.md).

## 2. Rol independiente

La actividad se ejecutó como revisión independiente de Arquitectura e
Ingeniería. Se inspeccionaron directamente la decisión, el PBI, el código del
checker, la policy, los fixtures, las mutaciones, el producto, el build y el
expediente documental.

Los documentos de implementación y remediación se trataron como afirmaciones
por refutar, no como aprobación. No se corrigió ningún hallazgo dentro de esta
revisión.

## 3. Alcance

La revisión cubrió:

- DEC005-C01 a DEC005-C05;
- FV-001 a FV-007, FV2-001/FV2-002 y FV3-001/FV3-002;
- D5-R001 a D5-R036;
- resolución AST de imports directos, aliases y namespaces;
- shadowing, homónimos, paquetes ajenos y sintaxis equivalente;
- fixtures, mutaciones, paths, dos roots, determinismo y smoke;
- ownership, APIs, grafo, toolchain, gates, fuente y `dist/`;
- consistencia de los conteos históricos y vigentes.

Quedaron fuera commit, push, PR, merge, rebase, tag, stash, reset, clean de
Git, checkout, CI, deploy, SSH, base de datos, SQL y migraciones.

## 4. Rama, HEAD, origin y divergencia

| Control | Resultado |
| --- | --- |
| Rama | `main` |
| HEAD | `be1fe5a774b3437063b86e6ff16920131e502079` |
| `origin/main` | `be1fe5a774b3437063b86e6ff16920131e502079` |
| Divergencia `HEAD...origin/main` | `0 0` |
| Entorno | Local únicamente |

## 5. Estado inicial del working tree

El árbol estaba dirty antes de esta revisión. Se inventariaron **56 rutas**
preexistentes y se calculó SHA-256 individual para cada una. La huella agregada
ordenada fue:

```text
238cf2d3a25398bb2ac891bbff0354628439c75fce4353002805e6c123ee2d15
```

El índice estaba vacío,
`docs/architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_4.md`
no existía y `git diff --check` pasó. No había temporales DEC-005 dentro del
repositorio ni procesos atribuibles a esta revisión.

## 6. Dictamen

**FAIL — DEC-005 FORMAL REVERIFICATION**

Los gates canónicos, los conteos vigentes, los paths, los dos roots, el build,
el smoke y las variantes directas de aliases/namespaces pasan. Sin embargo, la
matriz adversarial independiente encontró:

1. doce falsos PASS al envolver símbolos Nest válidos en
   `ParenthesizedExpression`;
2. dos falsos positivos D5-R027 para objetos ordinarios con
   `global: true`;
3. cobertura insuficiente para detectar ambos defectos.

Existe un Blocker y dos Major nuevos. DEC005-C01 y D5-R033 fallan; por contrato
no procede un dictamen PASS.

## 7. DEC005-C01 a DEC005-C05

| Condición | Resultado | Evidencia |
| --- | --- | --- |
| DEC005-C01 | **FAIL** | FV4-001 demuestra falsos PASS en D5-R025/R027/R029/R035/R036; FV4-002 demuestra falsos positivos D5-R027; FV4-003 demuestra que la cobertura vigente no los activa |
| DEC005-C02 | **PASS** | Seis artefactos de módulo exactos; matriz estructural independiente 15/15 rechazos y 1/1 control permitido |
| DEC005-C03 | **PASS** | Ownership, consumidores, APIs y grafo coinciden con source y policy; evidencia portable entre dos roots |
| DEC005-C04 | **PASS** | `src/shared/` ausente, sin admisiones o excepciones |
| DEC005-C05 | **PASS** | Sin funcionalidad, persistencia, CI o deploy; gates posteriores y estados preservados |

## 8. Estado de FV-001 a FV3-002

| Hallazgo histórico | Estado | Evidencia de esta revisión |
| --- | --- | --- |
| FV-001 — copias accidentales de SPIKE-009 | **CLOSED** | No existen copias `* 2.*`; los originales no tienen diff |
| FV-002 — vacíos aceptados | **CLOSED** | 15/15 estructuras inválidas rechazadas; 16/16 sandboxes eliminados |
| FV-003 — composición ficticia de AppModule | **CLOSED** | 12/12 variantes adversariales rechazadas; reordenamiento exacto aceptado |
| FV-004 — D5-R029 sin prueba | **CLOSED** | Directo, alias y namespace nominales se rechazan; la evasión parentetizada es FV4-001 |
| FV-005 — D5-R036 no distinguible | **CLOSED** | Casos nominales separan D5-R035 y D5-R036; la evasión parentetizada es FV4-001 |
| FV-006 — estados/conteos contradictorios | **CLOSED** | Canónicos vigentes usan 77/113/118; históricos conservan 57/82/87 y 58/89/94 con contexto |
| FV-007 — carrera de smoke | **CLOSED** | Unitarias 10/10 y smoke compilado 20/20 con una única evidencia |
| FV2-001 — paths no relativos/sanitizados | **CLOSED** | Cuatro ramas críticas equivalentes en `<temp-root-a>` y `<temp-root-b>` |
| FV2-002 — cobertura insuficiente de paths | **CLOSED** para la fuga original | 69/69 negativos declaran path y todos los diagnósticos pasan validación portable; FV4-003 registra una brecha distinta de exactitud completa |
| FV3-001 — aliases/namespaces evaden reglas Nest | **REGRESSED** | Las formas directas remediadas pasan, pero aliases/namespaces parentetizados vuelven a evadir cinco reglas |
| FV3-002 — conteos canónicos obsoletos | **CLOSED** | 77 fixtures, 113 pruebas arquitectónicas y 118 totales reproducidos |

FV3-001 se marca `REGRESSED` en el sentido contractual: la resolución de
identidad importada funciona para los nodos directos, pero no para la misma
identidad cuando el AST incluye paréntesis. No se reabre ni se reescribe el
FAIL histórico.

## 9. Hallazgos nuevos

### FV4-001 — Blocker — paréntesis evaden identidad importada

El resolvedor no desenvuelve `ParenthesizedExpression`. Doce casos TypeScript
estáticos y válidos recibieron exit `0`:

- `@(Controller)()`, `@((alias))()` y `@(Namespace.Controller)()`;
- `(ScopeAlias).REQUEST` y `(Namespace.Scope).REQUEST`;
- `(forwardRef)(...)` y `(Namespace.forwardRef)(...)`;
- `@(Global)()` y `@(Namespace.Global)()`;
- `@(Get)()` y `@(Namespace.Get)()`;
- controller parentetizado con `decideAuthorization`.

Reglas afectadas: D5-R025, D5-R027, D5-R029, D5-R035, D5-R036 y, por
cobertura, D5-R033. D5-R026 no falla porque su traversal alcanza el identifier
o qualified name interior.

**Remediación requerida:** normalizar recursivamente expresiones
parentetizadas antes de resolver identidad en calls, members y decoradores;
agregar casos directos, alias y namespace con regla/path/evidencia exactos y
mutaciones con restauración. No se implementó.

### FV4-002 — Major — `global: true` produce falsos positivos

`containsTrueProperty()` recorre cualquier `PropertyAssignment` del archivo,
sin comprobar que pertenezca a metadata Nest autorizada. Estos objetos
ordinarios produjeron D5-R027 y exit `1`:

```ts
export const settings = { global: true, label: 'local' };
export const settings = { transport: { global: true } };
```

La metadata Nest `@Module({ global: true })` también fue rechazada, como
corresponde. El defecto es la ausencia de contexto, no la falta de detección.

**Remediación requerida:** acotar `global: true` a la estructura Nest que la
regla declara gobernar y agregar controles positivos para objetos ordinarios.
No se implementó.

### FV4-003 — Major — cobertura declarada no activa las evasiones

Las suites pasan 113/113 y 118/118, pero:

- no existe fixture o mutación para expresiones parentetizadas;
- no existe control positivo para un objeto ordinario con `global: true`;
- el test de fixtures exige el conjunto exacto de reglas y al menos un path
  esperado, pero no exige que todos los diagnósticos pertenezcan al conjunto
  completo de paths esperados;
- `expectedText` es un regex parcial, no stdout/stderr completo esperado.

Esto incumple la suficiencia de D5-R033 y permitió que FV4-001/FV4-002
coexistieran con todos los gates verdes.

**Remediación requerida:** incorporar matrices negativas y positivas
independientes del resolvedor, y validar el conjunto completo de diagnósticos,
paths y evidencia por fixture. No se implementó.

## 10. Revisión D5-R001 a D5-R036

| Regla | Propósito | Implementación observada | Fixture/control | Mutación | Path esperado | Resultado | Observación |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D5-R001 | Una app/artefacto | `verify:structure` | Árbol real | — | Root | PASS | Gate externo a checker D5 |
| D5-R002 | Allowlist de módulos | Directorios directos/policy | `unauthorized module` | — | `src/modules/inventory` | PASS | Tres módulos exactos |
| D5-R003 | Sin estructura vacía | Filesystem, contenido y AST | 14 negativos + controles | 2 | Archivo/directorio exacto | PASS | Matriz externa 15/15 |
| D5-R004 | API sólo por `index.ts` | AST exports/superficie | 3 negativos | — | `index.ts`/módulo | PASS | Tres interfaces type-only |
| D5-R005 | Sin deep imports | Resolución local | `deep inter-module import` | 1 | Consumidor | PASS | Boundary restaurado |
| D5-R006 | Grafo autorizado | Edge vs policy | 2 negativos | — | Consumidor/`src/modules` | PASS | Dos roots equivalentes |
| D5-R007 | Grafo acíclico | DFS de imports | `inter-module cycle` | 1 | `stations/index.ts` | PASS | Path portable |
| D5-R008 | Dominio aislado | Capa origen/target | `domain imports application` | — | `domain/rule.ts` | PASS | No funcionalidad real |
| D5-R009 | Aplicación no depende de outer layers | Target/package | `application imports infrastructure` | — | `application/handler.ts` | PASS | DEC-049 preservada |
| D5-R010 | Nest fuera de dominio/aplicación | Specifier `@nestjs/*` | 2 negativos | 1 | Archivo de capa | PASS | Parser AST |
| D5-R011 | Presentación sin persistence | Target/path/package | `presentation imports repository` | — | `handler.ts` | PASS | No controller real |
| D5-R012 | Ports hacia adentro | Convención de path | `port outside application` | — | `ports/token.ts` | PASS | Heurística documentada |
| D5-R013 | Adapters en outer layer | Path/nombre | `adapter in domain` | — | `token.adapter.ts` | PASS | Heurística documentada |
| D5-R014 | Sin internals ajenos | Target intermodular | `internal access across modules` | — | Consumidor | PASS | Datos siguen en DEC-049 |
| D5-R015 | DTO en presentation | Sufijo/path | `HTTP DTO outside presentation` | — | DTO | PASS | Convención nominal |
| D5-R016 | Contrato framework-free | Imports Nest en `index.ts` | `NestJS in public contract` | — | `access/index.ts` | PASS | APIs actuales sin Nest |
| D5-R017 | Hecho público del owner | Revisión semántica | No aplicable | — | — | PASS N/A | No hay eventos |
| D5-R018 | No exponer entidad mutable | Nombre/export AST | `entity exported...` | — | `access/index.ts` | PASS | Mutabilidad real es manual |
| D5-R019 | Shared vacío | Contenido de root | `shared content` | 1 | `src/shared` | PASS | Root ausente |
| D5-R020 | Sin roots genéricos | Allowlist de roots | 5 negativos | 1 | Root exacto | PASS | Cinco nombres cubiertos |
| D5-R021 | Utilidad local | Revisión semántica | No aplicable | — | — | PASS N/A | No hay utilidades |
| D5-R022 | Infra con owner | Revisión de ownership | No aplicable | — | — | PASS N/A | Sin infra funcional |
| D5-R023 | AppModule composition root | AST clase/decorador/metadata/imports | 7 negativos | 1 | `src/app.module.ts` | PASS | Matriz externa 12/12 |
| D5-R024 | Sólo AppModule importa módulos Nest | Source/target | 1 negativo | — | Consumidor | PASS | Regla separada |
| D5-R025 | Prohibir `forwardRef` | Identidad importada | 3 negativos | 2 | `access.module.ts` | **FAIL** | Paréntesis directo/namespace reciben exit `0` |
| D5-R026 | Prohibir `ModuleRef` | Identidad/referencia traversal | 3 negativos | — | `access.module.ts` | PASS | Alias, namespace, type-only y paréntesis pasan |
| D5-R027 | Sin global funcional | Decorador importado + cualquier `global: true` | 3 negativos | 1 | `access.module.ts` | **FAIL** | Paréntesis evade; objetos ordinarios son falsos positivos |
| D5-R028 | Dynamic module restringido | Revisión humana | No aplicable | — | — | PASS N/A | Sin dynamic modules |
| D5-R029 | Request scope no es autoridad | Member importado | 3 negativos | 2 | Context file | **FAIL** | Base parentetizada evade |
| D5-R030 | Use cases planos | Revisión futura | No aplicable | — | — | PASS N/A | Sin funcionalidad |
| D5-R031 | NodeNext ESM | Specifier + typecheck | 1 negativo | — | Consumidor | PASS | `.js` relativo |
| D5-R032 | Determinismo | Doble fixture/gates/runners | Todos | Restauraciones | Portable | PASS acotado | Determinismo no corrige falsos resultados |
| D5-R033 | Caso inválido por regla | Policy→fixture + mutaciones | 27 reglas | 18 | Declarado | **FAIL** | No cubre paréntesis ni falso positivo `global` |
| D5-R034 | Excepción fail-closed | Policy/revisión | No aplicable | — | — | PASS N/A | Sin excepciones |
| D5-R035 | Sin controllers/endpoints/funcionalidad | Nombre, identidad y allowlist | 10 negativos | 4 | Archivo HTTP/funcional | **FAIL** | Decoradores parentetizados evaden |
| D5-R036 | Controller no decide autoridad | Controller importado + vocabulario | 3 negativos | 2 | Controller | **FAIL** | Controller parentetizado omite D5-R036 |

## 11. Análisis del resolvedor AST

[`createImportIdentityResolver()`](../../../scripts/lib/architecture-checker.mjs)
registra imports nombrados y namespace con package, nombre importado y nombre
local. `matches()` reconoce:

- `Identifier`;
- `PropertyAccessExpression` cuya base es un `Identifier`;
- `QualifiedName` cuya izquierda es un `Identifier`.

También consulta shadowing de parámetros, bloques, `catch` y `for`.

La causa raíz de FV4-001 es que `matches()` no elimina uno o más
`ParenthesizedExpression`. Los helpers de calls, members y decoradores le
entregan directamente el nodo parentetizado y reciben `false`. D5-R026 difiere:
`containsImportedReference()` recorre los hijos y finalmente visita el
identifier o qualified name interior.

Múltiples imports del mismo package, orden distinto y el mismo símbolo en
imports separados funcionaron. Reexports locales no se declaran cubiertos.
Computed property access, default imports e `import =` permanecen excluidos y
la exclusión está documentada en [FV3_REMEDIATION.md](FV3_REMEDIATION.md);
se confirmaron con exit `0` sin exigir soporte.

## 12. D5-R025

| Caso | Resultado |
| --- | --- |
| Directo, alias y namespace nominales | PASS |
| Alias desde otro package/local | Sin falso positivo |
| Comentario/string | Sin falso positivo |
| Import alias shadowed por parámetro | Sin falso positivo |
| `(forwardRef)(...)` | **FAIL: falso PASS** |
| `(Namespace.forwardRef)(...)` | **FAIL: falso PASS** |

Suite focalizada: 5/5 PASS. La suite no contiene las dos formas que fallan.

## 13. D5-R026

| Caso | Resultado |
| --- | --- |
| Directo, alias y namespace/qualified type | PASS |
| `import type` alias referenciado | D5-R026, PASS |
| Alias y qualified type parentetizados | D5-R026, PASS |
| Otro package/local/comentario | Sin falso positivo |
| Import shadowed por parámetro | Sin falso positivo |

La corrida focalizada reportó cuatro TAP PASS: tres fixtures sustantivos y el
contenedor del archivo de mutaciones sin caso coincidente. No existe mutación
D5-R026; el contrato vigente permite fixture aislado, pero una remediación de
FV4 debería añadir simetría para el resolvedor compartido.

## 14. D5-R027

Directo, alias y namespace nominales pasan, y la metadata
`@Module({ global: true })` se rechaza. Fallan ambos lados del contrato:

- `@(Global)()` y `@(Namespace.Global)()` producen falsos PASS;
- objetos ordinarios, incluso nested, con `global: true` producen falsos
  positivos.

Suite focalizada: 4/4 PASS, insuficiente frente a FV4-001/FV4-002.

## 15. D5-R029

| Caso | Resultado |
| --- | --- |
| Directo, alias, namespace/chained access | PASS |
| Comentario, string y template | Sin falso positivo |
| Objeto local y otro package | Sin falso positivo |
| Shadowing por parámetro y `catch` | Sin falso positivo |
| `(ScopeAlias).REQUEST` | **FAIL: falso PASS** |
| `(Namespace.Scope).REQUEST` | **FAIL: falso PASS** |

Suite focalizada: 5/5 PASS; paths nominales exactos. Las formas parentetizadas
no están representadas.

## 16. D5-R035

Controllers y endpoints directos, aliased y namespace nominales activan
D5-R035. Un controller ordinario no activa D5-R036. Objetos locales y otro
package no activan reglas Nest.

Fallan `@(Controller)()`, `@((alias))()`,
`@(Namespace.Controller)()`, `@(Get)()` y `@(Namespace.Get)()`: todos reciben
exit `0`.

Suite focalizada amplia: 14/14 PASS.

## 17. D5-R036

Los casos nominales conservan la separación:

- controller ordinario: D5-R035;
- controller con `decideAuthorization`: D5-R035 + D5-R036;
- alias y namespace: mismo resultado;
- objeto local u otro package con método homónimo: ninguna regla Nest.

Un controller alias parentetizado con `decideAuthorization` recibió exit `0`,
sin D5-R035 ni D5-R036. Suite focalizada: 5/5 PASS.

## 18. Aliases

El source contiene siete fixtures cuyo nombre incluye `alias`; con las cuatro
mutaciones coincidentes, la suite focalizada pasó 11/11. Aliases arbitrarios
`C`, `S`, `f`, `MR` y `Q`, imports separados y orden distinto también
funcionaron en la matriz externa.

La cobertura no es cerrada: envolver el alias en paréntesis reproduce
FV4-001.

## 19. Namespaces

Ocho fixtures nombrados y una mutación cubren namespace; la corrida focalizada
pasó 9/9. Nombres arbitrarios `NC`, `N` y `Core`, chained member y qualified
type funcionaron.

Las bases o miembros parentetizados evaden calls/decorators/members, salvo
D5-R026 por su traversal interno.

## 20. Shadowing

Los dos fixtures declarados pasaron 2/2. La matriz externa añadió:

- variable de bloque;
- parámetro para `forwardRef`;
- parámetro para `ModuleRef`;
- variable de `catch` para `Scope`.

Los cuatro controles adicionales recibieron exit `0`. No se observó falso
positivo por shadowing en las formas probadas.

## 21. Falsos positivos

Cinco fixtures focalizados de paquete ajeno, homónimos locales,
comentarios/strings y shadowing pasaron 5/5. Templates y objetos locales de
Controller también pasaron.

El control adicional de `global: true` refuta la ausencia general de falsos
positivos: 2/2 objetos ordinarios fueron diagnosticados como D5-R027. Es un
Major porque el enforcement bloquearía source no relacionado con metadata
Nest.

## 22. Fixtures y cobertura

Conteo derivado de `fixtureCases`:

| Métrica | Resultado |
| --- | ---: |
| Fixtures | 77 |
| Positivos | 8 |
| Negativos | 69 |
| Negativos con `expectedPath` | 69/69 |
| Negativos con `expectedText` | 69/69 |
| Alias por nombre | 7 |
| Namespace por nombre | 8 |
| Shadowing por nombre | 2 |
| Reglas directas cubiertas | 27/27 |

Fixtures negativos por regla:

```text
D5-R002=1 D5-R003=14 D5-R004=3 D5-R005=1 D5-R006=2
D5-R007=1 D5-R008=1 D5-R009=1 D5-R010=2 D5-R011=1
D5-R012=1 D5-R013=1 D5-R014=1 D5-R015=1 D5-R016=1
D5-R018=1 D5-R019=1 D5-R020=5 D5-R023=7 D5-R024=1
D5-R025=3 D5-R026=3 D5-R027=3 D5-R029=3 D5-R031=1
D5-R035=10 D5-R036=3
```

Cada negativo valida exit, conjunto exacto de reglas, presencia de un path
exacto y evidencia parcial. Todos los diagnósticos pasan el contrato portable.
No se valida el conjunto completo exacto de paths/mensajes por fixture; por
ello la cobertura no satisface por sí sola el rigor requerido y participa en
FV4-003.

## 23. Mutaciones y familias

Conteo derivado del arreglo `mutations`:

- **18 mutaciones**;
- **12 familias normativas**:
  D5-R003, D5-R005, D5-R007, D5-R010, D5-R019, D5-R020, D5-R023,
  D5-R025, D5-R027, D5-R029, D5-R035 y D5-R036;
- 18/18 rechazos;
- 18/18 conjuntos exactos de reglas;
- 18/18 paths dentro del allowlist exacto;
- 18/18 restauraciones a exit `0`;
- cleanup 18/18.

La suite completa de mutaciones pasó 18/18. No hay mutaciones parentetizadas ni
control positivo de `global: true`, por lo que las mutaciones son sustantivas
para sus casos, pero no suficientes frente a los hallazgos nuevos.

## 24. AppModule

La suite focalizada exacta contiene **8** casos: siete fixtures D5-R023 y una
mutación. Todos pasaron. Un patrón más amplio por la palabra `AppModule`
reporta nueve porque incluye incidentalmente el fixture D5-R024 “outside
AppModule”.

La matriz independiente de **12** variantes cubrió:

1. sin decorador;
2. metadata vacía;
3. imports vacío;
4. módulo faltante;
5. módulo extra;
6. duplicado;
7. metadata en variable;
8. arreglo en variable;
9. clase incorrecta;
10. clase no exportada;
11. decorador en otra clase;
12. alias de módulo.

Las 12 recibieron D5-R023 en `src/app.module.ts`; se eliminaron 12/12
sandboxes. Un reordenamiento del conjunto estático exacto fue aceptado. Por
eso 8/8 y 12/12 son matrices distintas y no deben presentarse como el mismo
conteo.

## 25. Estructurales

La matriz independiente reprodujo **16** casos:

- 15 inválidos: archivo ausente, vacío, whitespace, comentario de una línea,
  comentario multilínea, shebang/comentario, TypeScript válido sin símbolo,
  nombre incorrecto, TypeScript inválido, directorio vacío, hidden-only,
  temporary-only, leaf nested, chain vacía y módulo anticipatorio;
- 1 control permitido: directorio vacío fuera del root gobernado.

Resultado: 15/15 inválidos rechazados, 1/1 control aceptado y 16/16 cleanups.
El conteo histórico **15** se refiere sólo a inválidos; **16** incluye el
control positivo. El regex focalizado actual también puede reportar 17 si
selecciona accidentalmente el fixture de “comments and strings” añadido en
FV3; con exclusión explícita de ese control ajeno, la suite estructural exacta
pasó 16/16.

## 26. Paths

La suite de paths pasó 6/6. La revisión confirmó:

- relativización de absolutos exactamente una vez;
- preservación de relativos sin resolverlos contra cwd;
- `/` como separador;
- rechazo de `..`, roots externos, unidad Windows y `file:`;
- preservación de identidad para paths completos;
- ausencia de root físico en diagnósticos;
- 69/69 negativos con `expectedPath`;
- 18/18 mutaciones con paths permitidos exactos.

La limitación de FV4-003 es de exactitud del conjunto completo esperado por
fixture, no una reaparición de la fuga de path de FV2-001.

## 27. Dos roots

Se construyeron `<temp-root-a>` y `<temp-root-b>` fuera del repositorio, con
espacios y Unicode, y se ejecutó desde `<temp-cwd>` distinto.

| Rama | Resultado | SHA-256 de `status/stdout/stderr` |
| --- | --- | --- |
| D5-R003 — módulo faltante | Idéntico | `d726ad5a8e8a2247d502e8a7b39039e5d35190ab5bbebce19b2fc7aead222987` |
| D5-R007 — ciclo | Idéntico | `ec0e4d56b9a78d4615065f689c439c479a54f748ff21bcff8ec35c569263a92f` |
| D5-R006 — grafo divergente | Idéntico | `44f68bdf5b0e32fc0102b00d64a9a7cb53d585551c89bee342784826a3d918d1` |
| DEC005-C03 — evidencia faltante | Idéntico | `540d752fa94313735270edbca67d7cf07fae043abb9e0e3293362f50f17f0388` |

No hubo filtración de roots; espacios, Unicode y cwd distinto pasaron. Cleanup:
PASS.

## 28. Ownership, API y grafo

El producto contiene exactamente seis archivos bajo `src/modules/`: tres
`index.ts` y tres módulos Nest mínimos.

| Módulo | API pública | Consumidores | Dependencias |
| --- | --- | --- | --- |
| `tenancy` | `TenancyModuleContract` | `stations`, `access` | Ninguna |
| `stations` | `StationsModuleContract` | `access` | `tenancy` |
| `access` | `AccessModuleContract` | `AppModule` compile-time | `stations`, `tenancy` |

Las APIs son interfaces type-only, sin NestJS. Ownership se expresa por
funciones y no anticipa ownership físico de datos.

Grafo declarado y observado:

```text
access -> stations
access -> tenancy
stations -> tenancy
```

No hay ciclos, deep imports, edges inversos o divergencias.

## 29. Conteos documentales

| Conteo | Clasificación | Documentos |
| --- | --- | --- |
| 57 / 82 / 87 | Histórico correcto | Primera remediación y segunda verificación; `EVIDENCE.md` lo etiqueta histórico |
| 58 / 89 / 94 | Histórico correcto | Remediación FV2 y tercera verificación |
| 77 / 113 / 118 | Vigente correcto | Reglas, fixtures, implementación, resultados, evidencia, trazabilidad y remediación FV3 |

La ejecución real derivó:

```text
fixtures=77 positive=8 negative=69
mutations=18 rule-families=12
architecture-tests=113
total-tests=118
```

No se encontró un documento canónico que presente un conteo anterior como
vigente. FV3-002 permanece CLOSED.

## 30. Toolchain

| Herramienta | Esperado | Observado | Resultado |
| --- | --- | --- | --- |
| Node.js | `24.18.0` | `v24.18.0` | PASS |
| pnpm | `11.15.1` | `11.15.1` | PASS |
| TypeScript | `6.0.3` | `Version 6.0.3` | PASS |

Se usó `PATH="/opt/homebrew/opt/node@24/bin:$PATH"`. No cambiaron versiones ni
`pnpm-lock.yaml`.

## 31. Gates

| Comando | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS — already up to date |
| `pnpm run verify:architecture` | PASS — policy 1 y tres edges |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm run test:architecture` | PASS — 113/113 |
| `pnpm test` | PASS — 118/118 |
| `pnpm run verify` — corrida 1 | PASS |
| `pnpm run verify` — corrida 2 | PASS |
| `git diff --check` previo al dictamen | PASS |

Suites focalizadas, cada una en proceso separado con
`node --test --test-reporter=tap --test-name-pattern=...`:

| Foco | PASS |
| --- | ---: |
| D5-R025 | 5/5 |
| D5-R026 | 4/4 TAP; 3 fixtures sustantivos |
| D5-R027 | 4/4 |
| D5-R029 | 5/5 |
| D5-R035 | 14/14 |
| D5-R036 | 5/5 |
| Aliases | 11/11 |
| Namespaces | 9/9 |
| Shadowing | 2/2 |
| Falsos positivos nominales | 5/5 |
| AppModule exacto | 8/8 |
| Estructurales exactos | 16/16 |
| Paths | 6/6 |
| Mutaciones | 18/18 |
| Smoke unitario | 10/10 |

Un primer agregador intentó parsear métricas TAP usando el reporter
predeterminado de Node 24 y se marcó a sí mismo como fallido por métricas
ausentes. No hubo fallo de tests. Se repitió con `--test-reporter=tap` y todos
los resultados anteriores fueron reproducidos.

## 32. Determinismo

- Checker real: 20/20, una salida, SHA-256
  `49aee1c02e063df205ed28252cbdd6e9d74334943ca931bc3b07a607c586e604`.
- Smoke compilado: 20/20, una salida, SHA-256
  `46c0678e0dc2afaac400226dbb4eb09a8c161976bdcf9c5aaf94bcf0dceb9267`.
- `pnpm run verify`: PASS/PASS.
- Fixtures nominales: dos ejecuciones idénticas por caso.
- Dos roots: cuatro fallos byte-idénticos.

Los falsos PASS y falsos positivos nuevos también fueron reproducibles; el
determinismo no implica corrección.

## 33. Smoke

- Unitario: 10/10 PASS para orden de marker/listener, mismo turno, chunks,
  stderr, exit prematuro, timeout y cleanup.
- Compilado: 20/20 PASS, detención al primer fallo y sin reintento silencioso.
- Runtime directo desde cwd temporal con espacios/Unicode: marker, listener,
  shutdown y cleanup PASS.
- Procesos residuales atribuibles: ninguno.

## 34. Build y dist

`dist/` contiene:

- 10 archivos `.js`;
- 10 archivos `.js.map`;
- 0 artefactos adicionales;
- 0 `sourcesContent`;
- 0 paths absolutos/personales;
- imports ESM relativos con extensión `.js`.

La metadata runtime de `AppModule` contiene, en este orden:
`TenancyModule`, `StationsModule`, `AccessModule`. Los tres `index.js` son
coherentes con APIs TypeScript type-only. El arranque compilado desde cwd
distinto pasó.

El checker es JavaScript ESM ejecutado directamente y no forma parte de
`tsconfig.build`; todas las pruebas adversariales ejecutaron ese runtime real.

## 35. Cleanup

Antes de crear este dictamen:

- las 56 rutas preexistentes conservaron exactamente sus 56 hashes;
- no hubo rutas agregadas, eliminadas o modificadas;
- 18/18 mutaciones restauraron;
- 12/12 sandboxes AppModule se eliminaron;
- 16/16 sandboxes estructurales se eliminaron;
- los dos roots y demás temporales externos se eliminaron;
- no quedaron listeners o procesos de checker/smoke/verify;
- el índice permaneció vacío.

Después de crear el dictamen se repitieron status, índice, temporales,
procesos, hashes y `git diff --check`:

- las 56 rutas iniciales siguen byte-idénticas;
- la ruta 57 es únicamente este dictamen;
- no hay rutas iniciales eliminadas o modificadas;
- `git diff --cached --name-only` permanece vacío;
- `find` no encontró directorios `*tmp*` o `*temp*` en el repositorio;
- no existen procesos `check-architecture`, `smoke-start`, `dist/main.js`,
  `tsx`, `tsc` o `pnpm run verify` atribuibles a la revisión;
- los procesos Node restantes son los mismos procesos preexistentes de VS
  Code, ChatGPT/MCP, Adobe y Trezor clasificados en el preflight;
- `git diff --check`, trailing whitespace y 19 documentos con enlaces
  relativos pasaron.

El único delta propio es este archivo.

## 36. Consistencia documental

Consistente:

- los tres FAIL previos permanecen históricos;
- cada remediación se presenta como PASS técnico, no aprobación;
- conteos históricos y vigentes están separados;
- DEC-005 sigue Formal Verification Pending;
- PBI-022 sigue `In review`;
- DEC-049 sigue abierta/bloqueada;
- R0 y Sprint 00 siguen abiertos;
- no hay paths personales activos; `/Users/<local-user>/` sólo aparece como
  ejemplo sanitizado histórico;
- las formas Windows y `file:` son inputs negativos deliberados.

Inconsistente con la conducta real descubierta:

- los documentos vigentes describen aliases/namespaces Nest como cubiertos,
  pero no declaran la evasión parentetizada;
- D5-R027 se presenta como identidad AST/metadata, aunque el detector
  `global: true` no está acotado a metadata Nest;
- la suficiencia técnica PASS de D5-R033 no resiste las matrices externas.

No se modificaron documentos canónicos para reconciliar estos hallazgos.

## 37. Limitaciones

Se conservan las limitaciones declaradas:

- imports calculados;
- computed property access;
- default imports e `import =`;
- reflexión, generación y loaders no autorizados;
- reexports locales no resueltos como identidad;
- semántica de hechos y mutabilidad efectiva;
- vocabulario de autoridad fuera de policy;
- enforcement local transitorio hasta DEC-051;
- persistencia y ownership físico bajo DEC-049.

Las expresiones parentetizadas no pueden reclasificarse como limitación
aceptada: son sintaxis estática ordinaria, analizable por AST y equivalente a
formas presentadas como cubiertas. El falso positivo `global: true` tampoco es
una limitación segura.

## 38. Estados preservados

- DEC-005: `Accepted — Materialized / Formal Verification Pending`.
- PBI-022: `In review`.
- DEC-049: abierta y bloqueada.
- R0: no autorizado.
- Sprint 00: abierto.

No se registra `Verified`, `Done`, `Complete` o `Closed`. No se autoriza
promoción documental, cierre de PBI-022 ni avance a DEC-049.

## 39. Siguiente acción

Ejecutar una remediación acotada de PBI-022 que:

1. cierre FV4-001 desenvolviendo expresiones parentetizadas en la frontera
   compartida de identidad importada;
2. cierre FV4-002 acotando `global: true` a metadata Nest relevante;
3. cierre FV4-003 con fixtures y mutaciones directos/alias/namespace,
   positivos y negativos, que exijan diagnósticos, paths y evidencia completos;
4. preserve D5-R026, shadowing, homónimos, paths, determinismo y estados;
5. repita una quinta reverificación formal independiente completa.

No avanzar DEC-049 ni promover/cerrar DEC-005/PBI-022 antes de un nuevo
dictamen PASS.
