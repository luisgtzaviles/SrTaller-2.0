# Price List Candidate Matching and Trusted History Audit

## Estado del documento

- **Estado:** auditoría focalizada completa; recomendaciones `CM-001..CM-009`
  aprobadas por el Owner y autorizadas para implementación acotada en PBI-041.
- **Fecha:** 2026-09-15.
- **PBI:** PBI-041 — Owner Acceptance pendiente.
- **Naturaleza:** diagnóstico y diseño. No implementa matching, no cambia datos,
  endpoints, UI, migraciones ni autoridad.
- **Evidencia controlada:** `AG / v11`, Source
  `77621768-4b52-434a-9111-feddfdb0c9cc`, Version
  `9c2be91d-ba3d-4314-8dab-d256bcd1fd2a`, Batch
  `7c708a6e-4e15-4510-bd98-db2e37831601`.
- **Documentos relacionados:** [PBI-041](../backlog/pbis/PBI-041.md),
  [Price List Architecture](../architecture/PRICE_LIST_ARCHITECTURE.md),
  [Bulk Import Domain Design](PRICE_LIST_BULK_IMPORT_AUDIT_AND_DOMAIN_DESIGN.md),
  [Persistence Design](../quality/evidence/pbi-041/PERSISTENCE_DESIGN.md),
  [Threat Model](../quality/evidence/pbi-041/THREAT_MODEL.md) y
  [Test Strategy](../quality/evidence/pbi-041/TEST_STRATEGY.md).

## 1. Executive summary

El resultado observado no es una falla de la memoria histórica: es la ejecución
literal de una decisión conservadora vigente. El motor encuentra una identidad
histórica exacta, única y consistente para 34 filas, calcula correctamente
`UNCHANGED`, pero asigna `UNRESOLVED` siempre que el target proviene de memoria.
La UI traduce ese estado como “Coincidencia histórica única; requiere
confirmación explícita” y ofrece después una confirmación masiva.

Las dos filas modificadas no encuentran la memoria anterior porque, sin código
de proveedor, SKU o barcode, la única key disponible es un hash que incluye el
título observado. Agregar `(liquidacion)` o sustituir `PANTALLA` por `DISPLAY`
produce otra firma. El reconciliador vigente no tiene etapa de candidatos: por
eso ambas filas se clasifican `NEW` y, además, quedan `APPLY` por defecto.

La recomendación es separar tres conceptos:

1. **Identidad histórica confiable:** un mapping publicado, exacto, único,
   consistente y todavía compatible puede resolver la identidad sin otra
   decisión por fila. Esto no publica: `Aplicar lote` sigue siendo obligatorio.
2. **Candidate matching:** una etapa read-only y explicable encuentra posibles
   targets para observaciones nuevas; nunca crea mapping ni muta Catalog.
3. **Aprendizaje:** sólo una resolución publicada por el Owner convierte la
   observación exacta de esa Source en memoria reutilizable. Una transformación
   grupal confirmada ayuda a sugerir, pero no se vuelve alias global ni regla de
   escritura.

Para AG v11, el objetivo resultante es `34 resueltas / 2 requieren atención`,
no `34 pendientes / 2 NEW silenciosos`.

## 2. Current behavior

### Estado material preservado

La lectura PostgreSQL dentro de `BEGIN TRANSACTION READ ONLY` confirmó:

| Evidencia | Valor |
|---|---|
| Source / Version | `AG / v11` |
| Version lifecycle | `INGESTED` |
| Batch lifecycle | `RECONCILING` |
| Conteos | `2 NEW`, `34 UNCHANGED`, resto `0` |
| Decisiones | `2 APPLY`, `34 UNRESOLVED` |
| `content_sha256` | `58d7203d6b48ffe8c94f98e13b4c4bc563a3d5de50a395975d73820032ec6b13` |
| `analysis_sha256` | `9285fc78e157b5ac3718378483208bcb075d65d4d72d45cf08eb6d1212ad3df1` |
| Publicación | `NULL`; el lote no fue aplicado |

La firma vigente usa `kind + title normalizado + description + category +
brand`. Si existe `supplierItemCode`, la memoria usa únicamente esa key; si no,
usa `SIGNATURE:<sha256>`. Costo, precio, orden de fila y filename no participan
en identidad.

El análisis carga en bloque identifiers internos, memorias de la misma
`Tenant + Source + column_signature`, categorías, marcas, precios y costos.
Después exige que todas las señales fuertes disponibles apunten al mismo item.
No existe hoy una consulta de similitud ni una fase `CANDIDATE_MATCH`.

### Contrato deliberado vigente

La arquitectura y `OD-BI-009` permiten **preseleccionar** mappings exactos,
únicos y consistentes, pero mantienen preview y confirmación de batch. El test
PostgreSQL materializa exactamente esa intención: la segunda versión espera que
todas las filas preseleccionadas queden `UNRESOLVED` y después llama una decisión
masiva. Por tanto, no es una consecuencia accidental de la UI: repository,
test, threat model y copy están alineados con el contrato actual.

## 3. Trace de los 34 NO_CHANGE

La fila 3 de AG v11 es representativa:

| Etapa | Evidencia exacta |
|---|---|
| `SupplierListing` | `PANTALLA IPHONE 11 PRO CALIDAD RJ >>` |
| firma | `82e06971124fa6bdb02b2a1b3162283f85d0bfb8dfc9bc71f51b47b7a9ec1bd8` |
| lookup | mismo Tenant, Source AG, `column_signature`, scheme `SIGNATURE` |
| memoria | un solo `itemId` `36b1c923-908e-4e0d-9e09-0c50e11533e6` |
| consistencia | `CONSISTENT`, `correction_count=0`, memory version `3` |
| evidencia temporal | primera confirmación `2026-09-15 04:56:54.791Z`; última `2026-09-15 20:15:35.028Z` |
| historial | Resolution publicada en tres rondas: una `CREATED` y dos `MATCHED`, siempre al mismo item |
| target actual | item `ACTIVE`, `PART`, version `4`; Category Pantallas y Brand Apple compatibles |
| diff | ningún cambio efectivo en los campos publicables |
| clasificación | `UNCHANGED` |
| decisión | `UNRESOLVED` porque `remembered=true` |
| UI | preseleccionada, warning `HISTORICAL_MATCH_REQUIRES_CONFIRMATION` y contador pendiente |

El flujo completo es:

```text
SupplierListing exacto
  -> supplierMemoryKeys: SIGNATURE
  -> una ReconciliationMemory CONSISTENT
  -> CatalogItem existente y Type compatible
  -> target recordado
  -> diff efectivo vacío
  -> RowDecision UNCHANGED + preselectedByMemory=true
  -> decision UNRESOLVED
  -> UI: pendiente de confirmación
```

La parte determinista llega hasta `UNCHANGED`: misma key exacta, un solo target,
historia sin correcciones, target disponible y estructura compatible. La parte
conservadora es la línea de política `remembered ? UNRESOLVED : APPLY`.

El control evita que una memoria envenenada, stale o semánticamente incorrecta
se aplique sin una segunda mirada. Sin embargo, la memoria ya conserva
consistencia y correcciones y las Resolution sólo se escriben al publicar. El
riesgo puede controlarse mejor con un estado explícito de confianza y
revalidación; repetir una decisión manual sobre miles de exact matches no agrega
la misma señal que revisar excepciones.

## 4. Root cause

### Por qué hay 34 pendientes

No falta evidencia de matching. El repository convierte de forma intencional
todo target obtenido de memoria en `UNRESOLVED`, incluso si el resultado es
`UNCHANGED`. `decideMany` es el mecanismo previsto para confirmar en bloque y
el test `BI-Q08` exige que no haya click por fila, pero sigue existiendo un click
extra de reconciliación antes de `Aplicar lote`.

### Por qué los dos cambios son `NEW`

| Observación | Firma anterior | Firma v11 | Resultado |
|---|---|---|---|
| `PANTALLA IPHONE 11 CALIDAD RJ >>` → `... (liquidacion)` | `7e453691...205a93` | `74872df6...12b04` | key distinta; no target |
| `PANTALLA IPHONE 11 ORIGINAL >>I` → `DISPLAY IPHONE 11 ORIGINAL >>I` | `391f4b38...d67d56` | `34e92f0b...1e7370` | key distinta; no target |

Las firmas anteriores tienen tres Resolution cada una, memoria `CONSISTENT`,
`correction_count=0` y targets `ACTIVE` version `4`. Pero las filas v11 no traen
`supplierItemCode`, SKU ni barcode y el motor no consulta firmas cercanas. Al no
hallar target y sí hallar Category/Brand activas, aplica la regla vigente:
`NEW + APPLY`. Precio y costo iguales no se usan como identidad, correctamente.

El defecto operativo no es que el hash sea exacto: es que, después del miss
exacto, no existe una fase segura de candidatos y el default `NEW/APPLY` no
advierte el posible duplicado.

## 5. Trusted historical match

`TRUSTED_HISTORICAL_MATCH` debe ser una conclusión server-side, no una bandera
enviada por la UI. Requiere simultáneamente:

1. mismo Tenant y `SupplierSource`;
2. key exacta versionada (`supplierItemCode`, firma de observación o identifier
   interno legítimo), nunca sólo fuzzy text;
3. Resolution origen perteneciente a un batch `APPLIED`;
4. un único `CatalogItem.itemId` vigente en toda la evidencia aplicable;
5. memory `CONSISTENT`, `correction_count=0` y sin supersession/revocation;
6. Type idéntico;
7. Category y Brand compatibles después de resolver sus identidades canónicas
   y merges, no sólo comparar labels;
8. identifiers fuertes presentes sin contradicción;
9. target existente y versionado, `ACTIVE` o `INACTIVE` con lifecycle explícito;
10. algoritmo/firma conocido y provenance reconstruible hasta Listing,
    Resolution, Batch y actor;
11. cero candidato fuerte alternativo y cero duplicado dentro del lote;
12. revalidación con el estado actual justo antes de publish.

Una memoria producida automáticamente durante el análisis nunca es trusted. Una
memoria materializada al **publicar** un `CREATED` o `MATCHED` sí puede llegar a
trusted porque el Owner confirmó el lote y existe Resolution append-only. Una
corrección posterior degrada la key a `CONFLICTED`; no se recupera por conteo o
recencia sin una nueva política explícita.

| Target / diff | Auto-resolución propuesta | Publicación |
|---|---|---|
| `ACTIVE`, diff vacío | `UNCHANGED + APPLY`, marcado `AUTO_RESOLVED_TRUSTED_HISTORY` | todavía exige `Aplicar lote` |
| `ACTIVE`, diff permitido | `UPDATE + APPLY`; mostrar before/after y capacidades requeridas | todavía exige `Aplicar lote` |
| `INACTIVE`, identidad exacta | `REACTIVATE + APPLY`; resaltar lifecycle | todavía exige `Aplicar lote` |

El rename canónico no rompe el mapping porque la memoria apunta a `itemId`; el
título de proveedor continúa como observación y cualquier intento de renombrar
Catalog sigue siendo opt-in. Un merge de Category/Brand es compatible sólo si
se resuelve al survivor canónico. Un item ausente o reemplazado sin lineage
autoritativo produce `CONFLICT`, nunca redirect inferido.

## 6. Candidate matching

`CANDIDATE_MATCH` entra únicamente después de agotar identifiers y trusted
history exactos. Es read-only y devuelve como máximo un conjunto pequeño,
ordenado y explicable:

```text
CandidateMatch {
  itemId
  confidenceBand: HIGH | MEDIUM | LOW
  evidence[]
  contradictions[]
  observedDifferences[]
  sourceHistory[]
  candidateSnapshotVersion
}
```

Un contraste textual descartado por policy se conserva separadamente como
evidencia bounded (`evidence`, `differences`, `contrasts`), pero no es un
`CandidateMatch` persistible ni una autoridad para `CONFLICT`. La diferencia
`iPhone 16` frente a `iPhone 14/15` sigue siendo importante para filtrar o
explicar la propuesta; sólo identifiers, memoria durable, tipo/referencia o
invariantes incompatibles pueden escalarla a conflicto.

Pipeline propuesto:

1. formar un pool Tenant-scoped; priorizar items vistos por la misma Source;
2. bloquear por Type y por rasgos identity-bearing incompatibles;
3. resolver Category/Brand canónicas y usarlas como filtro o evidencia;
4. comparar tokens normalizados preservando modelo, generación, calidad,
   tecnología, capacidad, tamaño y color;
5. rankear candidatos sin mutar estado;
6. devolver top `K` acotado con explicación y contradicciones;
7. si existe uno útil, clasificar `CANDIDATE`; si hay varios razonables,
   `AMBIGUOUS`; si señales fuertes divergen, `CONFLICT`.

Un score o threshold nunca crea mapping. El margen entre primer y segundo
candidato sólo decide presentación. Las acciones son explícitas: `Mismo
artículo`, `Artículo nuevo`, `Excluir` o `Revisar`, según capabilities y estado.

## 7. Signal taxonomy

| Fuerza | Señal | Filtra | Rankea | Explica | Puede resolver identidad |
|---|---|:---:|:---:|:---:|:---:|
| Strong | itemId de export SR Taller firmado/confiable | sí | sí | sí | sí, con revalidación |
| Strong | SKU/barcode interno exacto legítimo | sí | sí | sí | sí, si ambos concuerdan |
| Strong | Source + supplier code confirmado exacto | sí | sí | sí | sí |
| Strong | trusted historical signature exacta | sí | sí | sí | sí |
| Structural | Type | sí | sí | sí | no; contradicción bloquea |
| Structural | Category canónica | sí/según caso | sí | sí | no |
| Structural | Brand canónica | sí/según caso | sí | sí | no |
| Structural | status/lifecycle | sí | sí | sí | no; define reactivate/conflict |
| Structural | misma SupplierSource | prioriza pool | sí | sí | no |
| Textual | whitespace/case/punctuation | no | sí | sí | nunca sola |
| Textual | tokens y orden | no | sí | sí | nunca sola |
| Textual | inserción/eliminación/reemplazo localizado | no | sí | sí | nunca sola |
| Contextual | precio/costo anterior | no | sólo desempate visual | sí | nunca |
| Contextual | posición/vecinos/reorder | no | sólo explicación | sí | nunca |

Modelo, `Pro/Plus/Max`, OLED/INCELL, Original/Calidad, capacidad, tamaño y color
se tratan como posibles rasgos identity-bearing: una diferencia reduce o bloquea
el candidato según la governance de esa Source. No se eliminan como stopwords.

## 8. Supplier observation metadata

`(liquidacion)`, `OFERTA`, `AGOTADO`, `ULTIMAS PIEZAS` y `NUEVO` pueden describir
la observación comercial de una Source sin pertenecer a la identidad canónica.
Pero su semántica depende del proveedor: `nuevo` puede significar ronda nueva,
condición del artículo o parte del nombre.

La política recomendada es:

- conservar siempre el raw exacto en `SupplierListing`;
- proponer una anotación `SOURCE_METADATA` sólo como evidencia;
- la primera ocurrencia permanece `CANDIDATE`;
- si el Owner mapea `Pantalla X (liquidación)` al item X y publica, se aprende
  **esa observación exacta de esa Source**;
- si luego llega exactamente el mismo texto, la memoria puede ser trusted;
- `Pantalla X (oferta)` vuelve a Candidate mientras no tenga evidencia propia;
- no hay lista mágica global ni eliminación previa al matching.

## 9. Group transformation suggestions

Una `SUPPLIER_TRANSFORMATION_SUGGESTION` se deriva de pares ancla ya conocidos,
no de comparar cartesianamente todo el catálogo. Debe mostrar:

- Source y Version exactas;
- patrón observado, por ejemplo `PANTALLA → DISPLAY`;
- población, cobertura, contradicciones y excepciones;
- muestra representativa antes/después;
- los candidatos afectados y sus razones;
- versión del detector y fingerprint del conjunto.

La recomendación es **C: resolver el lote actual y conservar aprendizaje
Source-scoped**, con una restricción: la transformación persistida sólo vuelve a
ser sugerencia para observaciones no vistas. Cada fila confirmada escribe su
mapping exacto individual; la transformación nunca se convierte en alias
universal, normalizador oculto o permiso de auto-write.

Una aceptación grupal aplica sólo a las filas todavía compatibles del mismo
snapshot. Excepciones, contradicciones o filas que cambiaron quedan fuera y
requieren decisión propia.

## 10. Learning model

```text
UNKNOWN OBSERVATION
  -> read-only CANDIDATE
  -> Owner elige item / nuevo / excluir
  -> Batch READY
  -> Owner ejecuta Aplicar lote
  -> append-only Resolution + provenance
  -> ReconciliationMemory CONSISTENT
  -> futura key exacta
  -> TRUSTED_HISTORICAL_MATCH
```

La decisión antes de publish todavía puede cambiar y no es conocimiento
durable. El aprendizaje nace con el resultado transaccional `APPLIED`. Una
corrección crea otra Resolution, incrementa corrección y degrada la proyección;
nunca reescribe la historia anterior. Reanalizar el mismo draft no aprende ni
incrementa evidencia.

Para AG:

- confirmar y publicar `... (liquidacion) → itemId 7e0de2f0...` enseña sólo esa
  observación exacta;
- confirmar y publicar `DISPLAY ... → itemId a8a49950...` hace lo mismo;
- una futura repetición exacta puede auto-resolverse;
- otro tag o reemplazo textual vuelve a Candidate salvo evidencia exacta nueva.

## 11. UX model

La pantalla debe priorizar excepciones y mantener inspección completa:

```text
36 filas
34 resueltas automáticamente
2 requieren tu atención

Nuevo confirmado 0 | Actualiza 0 | Reactiva 0 | Sin cambio 34
Sugerencias 2 | Ambiguo 0 | Conflicto 0 | Inválido 0
```

Vistas recomendadas:

- `Requieren atención` como default cuando existe alguna;
- `Resueltas` colapsada, inspeccionable y con razón “historia confiable”;
- `Todas` para auditoría;
- Candidate card con observación, candidato, evidencia positiva, diferencias y
  contradicciones;
- acciones explícitas `Mismo artículo` y `Artículo nuevo`;
- group suggestion con muestra, excepciones y alcance antes de confirmar;
- `Aplicar lote` separado y siempre explícito.

Estados internos/UI:

| Estado | Significado |
|---|---|
| `AUTO_RESOLVED` | identidad exacta trusted; no requiere decisión de reconciliación |
| `CANDIDATE` | uno o más targets explicables; requiere Owner |
| `AMBIGUOUS` | múltiples targets razonables; ninguno preseleccionado |
| `CONFLICT` | señales fuertes o invariantes durables se contradicen |
| `INVALID` | el listing no satisface el contrato de datos |

`AUTO_RESOLVED` describe la decisión de identidad, no la publicación.

## 12. Threat model

| Caso | Resultado fail-closed |
|---|---|
| iPhone 11 vs 11 Pro; 14 vs 14 Plus | Candidate separado o contraste descartado; `CONFLICT` sólo si una señal fuerte apunta distinto |
| OLED vs INCELL; Original vs Calidad | nunca equivalencia textual automática; candidate o contraste, nunca conflicto por texto solo |
| color, capacidad, tamaño o modelo distinto | Candidate separado o contraste descartado; conflicto sólo según evidencia durable |
| proveedor reutiliza exactamente un título para otro producto | memoria corregida pasa `CONFLICTED`; no auto-resolve |
| mismo texto histórico apunta a dos itemId | `AMBIGUOUS` |
| Category/Brand cambia | resolver canon/merge; incompatible queda `CONFLICT` |
| Type cambia | `CONFLICT` |
| item retirado | trusted exact puede `REACTIVATE`; candidate aproximado no |
| item borrado/reemplazado sin lineage | `CONFLICT` |
| mapping viejo corregido | `CONFLICTED`; nueva decisión explícita |
| transformación parcialmente válida | sólo filas compatibles; excepciones `CANDIDATE/AMBIGUOUS` |
| reorder masivo | el orden sólo explica; no cambia identidad |
| 1,500 cambios simultáneos | análisis acotado; ningún last-row-wins |
| dos versiones concurrentes | locks/versiones; la segunda reanaliza ante stale |
| reanálisis después de decisión | fingerprint nuevo invalida candidate snapshot/decisión stale |
| replay de decisión | mismo request+hash devuelve resultado; hash distinto conflictúa |

### Remediación local AG v17 — 2026-09-16

La fila `Pantalla iPhone 16 Original` no tenía supplier code, SKU, barcode,
Resolution, ReconciliationMemory ni CatalogItem exacto. La historia publicada
de la misma Source aportaba `Pantalla iPhone 14 Original` y `Pantalla iPhone 15
Original` con score 0.60 y contraste numérico protegido. El matcher conserva
ese contraste y descarta esos candidates débiles, pero el análisis ya no lo
promueve a `CONFLICT`. Reanálisis normal local: `36 UNCHANGED`, `1 NEW`, `0
CONFLICT`; el batch queda `READY` y sin publicar.

El campo de UUID para corregir mapping sigue apareciendo exclusivamente en
conflictos fuertes reales. Reemplazarlo por selector Catalog es deuda UX
delimitada para una iteración posterior: no existe un selector reutilizable
verificado dentro de este alcance y no se introdujo uno ad hoc.

El cambio debe extender BI-T09, BI-T10, BI-T19 y BI-T31: un threshold alto no
convierte similitud en señal fuerte; candidate tampering se recomputa
server-side; toda decisión utiliza target y expected version vigentes.

## 13. Persistence implications

El modelo actual basta para demostrar exact history, pero no expresa de forma
directa todo el contrato de confianza propuesto. `Resolution` guarda outcome,
scheme, key, actor y batch; `Memory` guarda first/last confirmation,
consistency/correction y última Resolution. Faltan provenance semántica y el
snapshot explicable de candidatos.

Diseño propuesto, sujeto a CM decisions:

- en Resolution: `match_method`, `decision_origin` (`OWNER_ROW`,
  `OWNER_GROUP`, `PUBLISHED_CREATE`, `TRUSTED_EXACT`) y `algorithm_version`;
- en Memory: `trust_state`, `evidence_count` derivable/materializable y última
  Resolution confiable; nunca autoridad independiente;
- en RowDecision o tabla hija bounded: top candidates, evidence,
  contradictions, score band, algorithm version y Catalog snapshot version;
- transformación: registro Source+Version-scoped append-only de la sugerencia y
  decisión Owner; su reutilización futura es sugerencia, no mapping;
- cada mapping confirmado sigue produciendo Resolution individual.

Toda lectura y FK permanece Tenant-scoped. Costo sólo aparece en evidencia si
el actor tiene las capabilities vigentes.

## 14. Concurrency and idempotency

- El análisis bloquea/versiona Version y Batch y persiste un fingerprint de
  contenido, algoritmo, referencias y candidate snapshot.
- Dos análisis contra el mismo estado deben producir el mismo resultado.
- Publicar bloquea Batch/rows/targets en orden estable y revalida trusted memory,
  target version, lifecycle, Category/Brand canónicas y capabilities.
- Si otro batch cambia un target, el segundo queda stale y vuelve a
  reconciliación; no elige otro candidato silenciosamente.
- Decisiones por fila y grupales usan client request ID + payload hash; replay
  idéntico devuelve el mismo outcome y replay incompatible falla.
- Una confirmación grupal es idempotente por suggestion fingerprint y registra
  una decisión individual por row; filas cambiadas no quedan incluidas.
- Reanálisis no duplica Resolution ni incrementa `evidence_count`; sólo publish
  exitoso aprende.

## 15. Inventory, Caja and Repairs compatibility

Inventory, Caja y Repairs continúan consumiendo exclusivamente
`CatalogItem.itemId` más los snapshots que su propio contexto requiera. Nunca
consumen `SupplierListing` text, score, transformación o memoria como identidad.

Confirmar un nuevo mapping no fusiona ni reescribe operaciones históricas. Un
rename canónico conserva itemId. Corregir el mapping de una observación afecta
sólo reconciliaciones futuras; no cambia líneas de venta, stock, conceptos de
Repair ni movimientos existentes.

## 16. Migration implications

Hay dos niveles posibles:

1. **Trusted exact mínimo:** puede inferirse conservadoramente con tablas
   actuales (`APPLIED` Resolution + memory consistente + target vigente), sin
   migración. Es implementable, pero la provenance queda implícita y las
   consultas son más complejas.
2. **Arquitectura recomendada completa:** candidate snapshots, origen de la
   decisión, versión del algoritmo y transform suggestions requieren expansión
   de schema. Debe ser forward-only, backfill conservador y sin declarar trusted
   una memoria cuyo origen no pueda probarse.

Un backfill seguro marca trusted sólo keys actuales con Resolution trazable a
batch aplicado, un target único, cero correcciones y algoritmo conocido. Todo
caso dudoso permanece `UNTRUSTED/CONFLICTED`. No se reanalizan ni publican lotes
existentes durante la migración. AG v11 permanece evidencia intacta hasta una
acción Owner posterior.

## 17. Test strategy implications

Añadir, si se autoriza implementación:

- exact trusted `UNCHANGED/UPDATE/REACTIVATE` queda `APPLY` sin segundo click y
  todavía requiere publish explícito;
- memoria de análisis no publicado nunca es trusted;
- Resolution aplicada de `CREATED/MATCHED` puede construir trust; corrección lo
  revoca;
- Category/Brand merge compatible y cambios incompatibles;
- canonical rename conserva identity sin renombrar por supplier title;
- candidate `(liquidacion)` y `DISPLAY/PANTALLA` explica diferencias, no escribe;
- Pro/Plus/Max, OLED/INCELL, Original/Calidad, color/capacidad/modelo negativos;
- candidate tampering, cross-Tenant, hidden cost y target stale;
- group suggestion muestra cobertura/excepciones y sólo confirma snapshot
  compatible;
- replay, dos Owners/dos Versions, reanalysis y rollback;
- contrato UX `34 auto-resolved + 2 candidate`, con las 34 inspeccionables;
- property tests: orden de filas no cambia candidatos ni decisiones;
- PostgreSQL material con 1,500 y 10,000 filas, sin N+1 ni partial writes.

Los tests existentes que exigen `preselectedByMemory && UNRESOLVED` deberán
cambiar únicamente después de CM approval; hoy documentan correctamente la
arquitectura vigente.

## 18. Performance implications for 1,500+ rows

No debe existir un producto cartesiano filas×Catalog:

- exact matching se resuelve por maps/indexes en `O(N + M)`;
- candidate pool usa blocking keys Tenant/Source/Type/Category/Brand y un índice
  de features/tokens normalizados;
- top `K` se limita, por ejemplo, a cinco candidatos por fila;
- features de Catalog se precomputan por versión de algoritmo;
- group transformations se derivan de pares ancla y conteos de tokens, no de
  todas las combinaciones;
- preview pagina candidatos/evidencia y entrega aggregates server-side;
- budgets de CPU, memoria, query count y p95 se miden en 1,500 y 10,000;
- si un bloque no reduce el pool de forma segura, la fila queda sin candidato o
  `AMBIGUOUS`: no se degrada a scan ilimitado ni match débil.

## 19. Alternatives rejected

| Alternativa | Rechazo |
|---|---|
| mantener confirmación extra para cada exact match | conserva seguridad, pero obliga al Owner a reconfirmar historia ya determinista y oculta excepciones |
| auto-publicar trusted matches | mezcla resolución con autoridad financiera; contradice `Aplicar lote` explícito |
| fuzzy threshold que crea mappings | un score no prueba identidad; riesgo crítico de duplicar/actualizar artículo incorrecto |
| usar precio/costo/posición como identidad | son atributos volátiles y producen falsos positivos |
| eliminar palabras globales (`liquidación`, `nuevo`) | su significado depende de Source/contexto y puede borrar identidad real |
| alias global `DISPLAY=PANTALLA` | contamina Tenants/Sources y convierte lenguaje probable en identidad |
| aprender al guardar una decisión no publicada | un draft/cancel/reanalysis no es hecho de negocio confirmado |
| resolver por “última fila gana” | no determinista, oculta conflicto y depende del orden |
| meter todo como Advanced Reconciliation sin límite | reabre alcance XL y mezcla trusted exact, candidates y transform learning |

## 20. Recommended architecture

```text
Exact strong signals
  -> conflict reconciliation
  -> TRUSTED_HISTORICAL_MATCH
       -> AUTO_RESOLVED UNCHANGED/UPDATE/REACTIVATE
  -> otherwise CANDIDATE_MATCH read-only
       -> CANDIDATE / AMBIGUOUS / CONFLICT / INVALID
       -> Owner decision
  -> Batch READY
  -> explicit Aplicar lote
  -> atomic Catalog writes + append-only Resolution
  -> trusted Source-scoped exact memory for future versions
```

Recomendación de alcance:

- **PBI-041:** incorporar trusted exact auto-resolution y un candidate matcher
  read-only, bounded y sin group-rule persistence. Es el mínimo cohesivo para
  corregir el riesgo real `34 pendientes + 2 NEW/APPLY` antes de Acceptance.
- **PBI posterior:** aprendizaje/reuso de transformaciones grupales y metadata
  rules Source-scoped, con readiness, schema, budgets y UX propios.

Así PBI-041 entrega excepciones seguras para el caso material sin activar todo
el outcome previamente diferido de Advanced Supplier Reconciliation.

## 21. Owner decisions approved

El Product Owner aprobó el 2026-09-15 las recomendaciones exactas de esta
auditoría: `CM-001=C`, `CM-002=B`, `CM-003=B`, `CM-004=B`, `CM-005=B`,
`CM-006=B`, `CM-007=C` sólo como diseño diferido, `CM-008=B` y `CM-009=B`.

### CM-001 — Auto-resolve de trusted history

**Problema.** Los matches exactos confiables se reconfirman en cada versión.

- **A.** Mantener `UNRESOLVED` y confirmación masiva actual.
- **B.** Auto-resolver `UNCHANGED` solamente.
- **C.** Auto-resolver identidad trusted para `UNCHANGED`, `UPDATE` y
  `REACTIVATE`, conservando preview y `Aplicar lote`.

**Resolución Owner:** C.

**Consecuencia:** el Owner revisa excepciones; cambios de fields/lifecycle siguen
visibles, capability-checked y sujetos al publish explícito.

### CM-002 — Provenance suficiente para trust

**Problema.** `CONSISTENT` por sí solo no expresa todo el origen de la memoria.

- **A.** Confiar cualquier memory consistente.
- **B.** Exigir Resolution trazable a batch aplicado, key exacta, target único,
  cero correcciones, algoritmo conocido y compatibilidad vigente.
- **C.** Exigir además dos publicaciones históricas del mismo mapping.

**Resolución Owner:** B.

**Consecuencia:** un único publish Owner válido puede enseñar; análisis/drafts no.

### CM-003 — Candidate matching

**Problema.** Un miss exacto válido se vuelve `NEW/APPLY` sin advertir duplicado.

- **A.** No agregar candidates; todo miss exacto queda NEW.
- **B.** Agregar `CANDIDATE_MATCH` read-only y explicable, siempre con decisión
  humana antes de mapping.
- **C.** Permitir que un threshold alto mapee automáticamente.

**Resolución Owner:** B.

**Consecuencia:** las dos excepciones AG se muestran como sugerencias; ninguna
similitud escribe.

### CM-004 — Threshold and ambiguity policy

**Problema.** Se necesita ordenar sin convertir score en identidad.

- **A.** Threshold decide automáticamente.
- **B.** Threshold sólo filtra/rankea; strong exact signals son los únicos que
  auto-resuelven; empate o margen insuficiente es `AMBIGUOUS`.
- **C.** Mostrar todos los items sin threshold.

**Resolución Owner:** B.

**Consecuencia:** fail-closed, top K acotado y explicación reproducible.

### CM-005 — Supplier observation metadata

**Problema.** Palabras circunstanciales pueden no ser identidad.

- **A.** Lista global de stopwords eliminadas.
- **B.** Aprender únicamente el mapping exacto Source-scoped de cada observación
  confirmada; nuevos tags vuelven a Candidate.
- **C.** Regla reusable Source-scoped desde la primera confirmación.

**Resolución Owner:** B en PBI-041; C sólo mediante transformación gobernada futura.

**Consecuencia:** no se pierde raw ni se generaliza prematuramente.

### CM-006 — Persistencia del aprendizaje

**Problema.** Una decisión debe sobrevivir sin envenenar historia.

- **A.** Aprender al seleccionar en UI.
- **B.** Aprender sólo al publicar, mediante Resolution append-only y Memory
  reconstruible con provenance/algorithm version.
- **C.** No persistir aprendizaje de candidates.

**Resolución Owner:** B.

**Consecuencia:** cancel/reanalysis no aprende; correcciones quedan auditables y
degradan trust.

### CM-007 — Group transformation scope

**Problema.** Cambios repetidos necesitan ayuda sin aliases universales.

- **A.** Resolver sólo el lote actual.
- **B.** Crear regla reusable automática.
- **C.** Resolver el snapshot actual y guardar Source-scoped suggestion con
  provenance; cada mapping sigue siendo individual y el reuso nunca auto-write.

**Resolución Owner:** C como diseño aceptado, con implementación diferida a un
PBI posterior.

**Consecuencia:** escala para 1,500 filas, conserva excepciones y no contamina
otros proveedores/Tenants.

### CM-008 — UX exception-first

**Problema.** Hoy las filas conocidas dominan el contador y las nuevas avanzan
silenciosamente.

- **A.** Mantener una lista plana.
- **B.** Default `Requieren atención`, resumen separado y resueltas colapsadas
  pero inspeccionables.
- **C.** Ocultar por completo auto-resueltas.

**Resolución Owner:** B.

**Consecuencia:** `34 resueltas / 2 atención`; se conserva auditabilidad.

### CM-009 — Scope de implementación

**Problema.** Trusted exact corrige fricción; candidates corrigen un riesgo real;
group learning es el outcome avanzado previamente diferido.

- **A.** Todo, incluidas transformaciones persistentes, dentro de PBI-041.
- **B.** PBI-041 contiene trusted exact + candidate read-only bounded; group
  transformation learning queda en PBI posterior con DoR propio.
- **C.** Todo queda para un PBI posterior; PBI-041 conserva comportamiento actual.

**Resolución Owner:** B.

**Consecuencia:** corrige AG v11 antes de Acceptance sin absorber todo Advanced
Supplier Reconciliation. Requiere Owner authorization explícita antes de código.

## Próxima revisión

Después de materializar y validar el alcance acotado aprobado. PBI-041 sigue en
Owner Review, AG v11 permanece sin aplicar hasta la reanálisis controlada y no
se inicia el outcome diferido de transformaciones grupales.
