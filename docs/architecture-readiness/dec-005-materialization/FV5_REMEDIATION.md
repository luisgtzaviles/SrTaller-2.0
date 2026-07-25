# Remediación técnica de FV5-001

## 1. Hallazgo original

FV5-001 demostró que D5-R033 aceptaba dos contratos de cobertura con ejecución
idéntica cuando sus IDs eran distintos. El conteo, la unicidad textual de IDs,
los fragments de source, la regla y el path seguían conformes, de modo que un
duplicado podía sustituir cobertura útil sin reducir el total.

## 2. Reproducción previa

En un sandbox temporal se duplicó
`fixture:D5-R025:parenthesized:direct` como
`fixture:D5-R025:parenthesized:direct-duplicate`. Ambos conservaron
D5-R025, polaridad negativa, `src/modules/access/access.module.ts`, source,
diagnóstico y configuración. Sólo cambió el ID requerido por policy.

```text
node --test test/architecture-coverage.test.mjs
tests 2; pass 2; fail 0
```

El arnés anterior aceptó el duplicado. El árbol compartido no se modificó:
`test/architecture-fixtures.mjs` permaneció en
`1a518aaa20d82cbfb016972b5c201e51d24127be33bb15bb7a726146916725b5`
y `architecture/dec-005-policy.json` en
`0a792f7afdf4587a573b6cf6436270e5582aa4208200ecf8aee2003962cff28d`
hasta iniciar la implementación.

## 3. Causa raíz

`test/architecture-coverage.test.mjs` comparaba el conjunto de IDs declarado
con `requiredSemanticCoverage` y validaba evidencia textual, regla, polaridad y
path por entrada. No comparaba dos entradas entre sí mediante sus condiciones
efectivas de ejecución. Por ello, “ID único” se interpretaba erróneamente como
“cobertura única”.

## 4. Definición de identidad semántica

La identidad real de un contrato es la combinación canónica de:

- tipo de caso (`fixture` o `mutation`);
- polaridad y conjunto de reglas esperadas;
- paths y diagnóstico esperados;
- snapshot efectivo de archivos, source y directorios;
- configuración de ejecución material, incluida cualquier propiedad futura no
  clasificada como descriptiva.

Un duplicado exacto comparte representación material. Un duplicado semántico
puede cambiar ID o metadata descriptiva, pero conserva esa ejecución. Dos
contratos son legítimamente distintos cuando cambia una dimensión ejecutable:
directo/alias/namespace, polaridad, identidad de package/shadowing, wrappers
AST, regla, root, path efectivo, diagnóstico o source.

## 5. Diferencia entre ID e identidad real

El ID vincula policy, catálogo y reporte; sigue siendo obligatorio y único,
pero no aporta entropía a la clave semántica. Nombre, descripción, evidencia,
posición y orden de declaración tienen el mismo tratamiento. Cambiarlos no
crea una prueba nueva ni compensa la eliminación de otra cobertura.

## 6. Algoritmo de canonicalización

1. Se materializa el snapshot efectivo aplicando base, overrides, archivos
   retirados, directorios retirados y directorios realmente vacíos.
2. Los paths pasan a separador portable y normalización POSIX.
3. El source se tokeniza con TypeScript `6.0.3`; whitespace y comentarios se
   omiten, pero tipos de token y valores se conservan.
4. Reglas y conjuntos de paths se ordenan y deduplican; el orden de arrays que
   modifica ejecución se conserva.
5. Una serialización tipada ordena claves y distingue string, array, objeto,
   boolean, número, `undefined`, `null`, ausencia y vacío.
6. La representación completa es la clave comparada. SHA-256 sólo resume la
   ejecución en el diagnóstico y no decide unicidad.
7. Un segundo contrato con la misma clave falla antes de aceptar D5-R033.

## 7. Campos incluidos y excluidos

| Incluidos | Excluidos por ser descriptivos |
| --- | --- |
| Tipo, polaridad, reglas | ID |
| Paths y texto diagnóstico | Nombre y descripción |
| Archivos efectivos y tokens | Fragments de evidencia |
| Directorios efectivos | Posición en el arreglo |
| Path/content/support/cleanup de mutación | Orden de propiedades |
| Propiedades materiales futuras | Whitespace y comentarios de source |

Una propiedad opcional sólo se normaliza cuando la ejecución vigente establece
equivalencia. La serialización base conserva ausencia, `undefined`, `null` y
cadena vacía como valores distintos.

## 8. Riesgos de colisión

El detector indexa la serialización completa, no su digest; una colisión
SHA-256 no colapsaría contratos. La normalización se limita a equivalencias
demostradas. Source generado con tokens distintos, wrappers, aliases,
namespaces, roots, polaridades y reglas permanece separado. Una configuración
desconocida se incluye como material y falla de forma conservadora.

## 9. Implementación

`test/architecture-semantic-coverage.mjs` centraliza serialización, paths,
tokens, snapshot, colección, clave, diagnóstico y validación. El test canónico
D5-R033 consume esa API después de validar por separado cantidad exacta, IDs,
policy, source evidence, reglas, paths y polaridad. El diagnóstico de
duplicación incluye ambos IDs, reglas, polaridad, paths, SHA-256 de
source/ejecución y razón de equivalencia.

La reproducción posterior con 27 IDs declarados falló con exit `1`, por lo que
el conteo adicional no ocultó el duplicado:

```text
ids=fixture:D5-R025:parenthesized:direct,
fixture:D5-R025:parenthesized:direct-duplicate
rules=D5-R025; polarity=negative
paths=src/modules/access/access.module.ts
reason=same effective execution and diagnostic contract
```

## 10. Pruebas agregadas

Se agregaron 18 pruebas especializadas: seis mutaciones semánticas, cuatro
controles adicionales de rechazo y ocho distinciones permitidas. Junto con el
contrato policy y el normalizador, el foco D5-R033 ejecuta 20/20.

## 11. Mutaciones agregadas

| Mutación | Propiedad protegida | Detección | Restauración |
| --- | --- | --- | --- |
| Duplicar cambiando ID | ID no define semántica | PASS | SHA original |
| Cambiar ID y descripción | Metadata no evade | PASS | SHA original |
| Sustituir caso útil por duplicado | Conteo no compensa | PASS | SHA original |
| Reordenar propiedades | Orden no evade | PASS | SHA original |
| Cambiar evidencia descriptiva | Detector no se neutraliza | PASS | SHA original |
| Retirar diferencia diagnóstica material | Campo material participa | PASS | SHA original |

Estas seis guardas operan en memoria y restauran la estructura en la propia
prueba. Las 23 mutaciones del checker real permanecen intactas.

## 12. Controles positivos

Pasan como identidades distintas: directo/alias, alias/namespace, polaridad
positiva/negativa, shadowing/package incorrecto, paréntesis/wrapper tipado,
D5-R035/D5-R036, roots distintos y sources ejecutables distintos.

`Get` continúa siendo canónicamente D5-R035. D5-R036 sólo aparece cuando un
controller intenta decidir autoridad o contexto; no se cambió esta semántica.

## 13. Controles negativos

Fallan: ID distinto, ID+descripción, nombre visible, orden de propiedades,
compensación de conteo, posición de arreglo, paths equivalentes y source con
formato no semántico. Todos exigen diagnóstico accionable. La neutralización
del validador haría fallar estos `assert.throws`.

## 14. Conteos finales

| Superficie | Conteo |
| --- | --- |
| Fixtures | 98 = 12 positivos + 86 negativos |
| Contratos semánticos | 26 IDs = 26 identidades únicas |
| Mutaciones de producto | 23 en 12 familias normativas |
| Mutaciones semánticas D5-R033 | 6 |
| Rechazos/permitidos especializados | 10 / 8 |
| Suite arquitectónica | 159 |
| Suite total | 164 |

Las familias normativas permanecen en 12 porque las seis mutaciones nuevas
protegen el metacontrato D5-R033; no representan otra regla del checker de
producto.

## 15. Gates

| Gate | Exit | Duración | Resultado |
| --- | --- | --- | --- |
| `pnpm install --frozen-lockfile` | `0` | 0.46 s | Already up to date |
| `pnpm run architecture` | `0` | 2.07 s | Policy 1 y tres edges |
| `pnpm run typecheck` | `0` | 2.68 s | Sin errores |
| `pnpm run build` | `0` | 3.16 s | Build ESM limpio |
| `pnpm test` | `0` | 46.45 s | 164/164 |
| `pnpm run test:architecture` | `0` | 43.44 s | 159/159 |
| `pnpm run verify` #1 | `0` | 48.01 s | 164/164, estructura y arquitectura |
| `pnpm run verify` #2 | `0` | 43.76 s | 164/164, estructura y arquitectura |

Validaciones ampliadas:

- D5-R033 focalizado: 20/20;
- doce falsos PASS FV4-001: 12/12;
- D5-R026: 4/4;
- D5-R035/D5-R036 focalizado: 5/5;
- `@Global()`/alias/namespace y objetos `global: true`: 4/4;
- checker: 20/20, una salida, SHA-256
  `64bd1fb7391712d1c849354bbcfcec19c6d36e2861568d2464fe06d9afad19c1`;
- smoke unitario: 10/10;
- smoke compilado: 20/20, una salida, SHA-256
  `dc2b1ddf9f1c708514fdb1c8c2d6e6d3e7600dc1aa4bf977aaaeffa6ede24716`;
- `dist/`: 10 JS, 10 maps, 0 extras, 0 `sourcesContent`, 0 paths locales o
  `file:`, 0 imports ESM relativos sin `.js`;
- Markdown: 342 archivos, 2756 enlaces relativos, 11 externos, 0 targets
  faltantes y 0 fences desbalanceados;
- whitespace y `git diff --check`: PASS.

## 16. Preservación

No cambiaron fixtures, mutaciones ni normalizador AST de FV4. Los hashes de
`FORMAL_VERIFICATION_4.md` y `FORMAL_VERIFICATION_5.md` permanecen,
respectivamente,
`e2603b6842bad4f99dafe620a838bbf1383222a8ea5cd3906b82411d9b0595d7`
y
`882e39836a39e39d52c654bf221c990fe565f56dbdb11fcbb889ff6e385c478e`.
Las rutas dirty ajenas se validan contra el inventario SHA-256 del preflight.
Los sandboxes previo y posterior devolvieron fixture y policy a los SHA-256
base `1a518a…725b5` y `0a792f…f28d`; ninguna reproducción quedó en el working
tree.

## 17. Estado Git

- Rama: `main`.
- HEAD/origin: `be1fe5a774b3437063b86e6ff16920131e502079`.
- Divergencia: `0 0`.
- Índice: vacío.
- Working tree: dirty preexistente más tres rutas nuevas de FV5.

## 18. Acciones no realizadas

No hubo código funcional, negocio, persistencia, SQL, migraciones,
autenticación/autorización funcional, PIN, sesiones, endpoints, CI, deploy,
SSH, DB, workspaces, microservicios, commit, push, PR, merge, rebase ni cambio
de estado. No se creó ni simuló `FORMAL_VERIFICATION_6.md`.

## 19. Estados preservados

- DEC-005: `Accepted — Materialized / Formal Verification Pending`.
- PBI-022: `In review`.
- DEC-049: abierta y bloqueada.
- R0: no autorizado.
- Sprint 00: abierto.
- FV-001–FV-007, FV2-001/FV2-002, FV3-002: `CLOSED`.
- FV3-001, FV4-001 y FV4-002: corregidos técnicamente.
- FV4-003/FV5-001: remediados técnicamente, pendientes del dictamen global.

## 20. Recomendación

Solicitar una **sexta reverificación formal independiente desde cero**. Esta
remediación aporta evidencia técnica, pero no promociona DEC-005, no cierra
PBI-022 y no desbloquea DEC-049.
