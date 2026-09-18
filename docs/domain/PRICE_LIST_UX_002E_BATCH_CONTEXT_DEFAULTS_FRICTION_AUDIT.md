# UX-002E — Batch Context Defaults Friction Audit

## Estado del documento

- **Estado:** Audit complete — Owner decisions ready; not implemented.
- **Alcance:** PBI-041, `Contexto del lote` en el Composer FULL.
- **Método:** trazabilidad estática y consultas PostgreSQL locales de sólo
  lectura; no se modificaron producto, fixtures, Versiones ni Catalog.
- **Próxima revisión:** decisión Owner sobre `UX2E-001..009` antes de cambiar
  defaults, perfil de SupplierSource o matching.

## Hallazgo ejecutivo

El bloque actual es una **ayuda local de captura**, no una configuración
durable de proveedor ni una declaración de intención del Owner. Sus valores se
guardan solamente en `sessionStorage` del navegador bajo
`srtaller:bulk-composer:batch-context:v1`; no existen columnas, tablas, API ni
metadatos de `SupplierSource` para preferencias de captura. Cuando se aplica un
valor, el Listing conserva sólo el valor final de la fila. No queda evidencia
de si fue escrito por proveedor, Owner, default o futura sugerencia.

Por eso los defaults no pueden convertirse en automatización silenciosa. Tipo,
Categoría y Marca entran en la firma histórica cuando no hay código de
proveedor; además Tipo y las referencias Category/Brand participan en las
guards de compatibilidad y reconciliación. Un valor incorrecto puede cambiar
una identidad reconocida en `NEW`, `CONFLICT` o una candidate pool equivocada.

La recomendación es **G — híbrido progresivo**: sacar el bloque del happy path
primario y conservarlo como contexto secundario explícito, con una acción que
sólo llena vacíos. Cualquier sugerencia futura debe mostrar su procedencia y
requerir aceptación. El modelo exception-first para recuperar contexto de filas
conocidas es atractivo, pero requiere una estrategia de identidad por etapas;
no es seguro con la firma actual.

## Traza del comportamiento actual

| Control | Estado inicial y alcance | Cuándo se aplica | Persistencia / reload | Procedencia disponible |
| --- | --- | --- | --- | --- |
| Tipo por defecto | vacío; `sessionStorage` por browsing session, no por Source | al pegar sobre una fila sin contenido material o mediante la acción explícita | sólo el `kind` final de la fila se guarda en Draft/Listing; no existe default de Version | no |
| Categoría por defecto | vacío; filtrada por Tipo y compatibilidad | mismo flujo empty-only | sólo `category` final queda en proposal, raw y Listing | no |
| Marca por defecto | vacía; filtrada por Tipo/Categoría | mismo flujo empty-only | sólo `brand` final queda en proposal, raw y Listing | no |
| Aplicar sólo a vacíos | no es checkbox ni toggle; es una acción | recorre las filas presentes inmediatamente | los valores resultantes persisten al guardar; la acción no | no |

`applyBatchDefaults` usa `row.kind || default`, `row.category.trim() ||
default` y `row.brand.trim() || default`. Por tanto, **no existe estado
unchecked que pueda sobrescribir Samsung con Apple**: el control siempre sólo
llena campos vacíos. El botón puede afectar filas existentes de inmediato, pero
no altera datos explícitos no vacíos. Si llena un vacío, sí puede modificar la
firma, candidate pool y resultado de Analyze.

Al pegar, los defaults se preparan antes de escribir las celdas de una fila sin
contenido material; las celdas incluidas en el paste ganan después. Un cambio
posterior de defaults no reescribe filas capturadas. El UI rechaza combinaciones
Tipo/Categoría/Marca incompatibles, pero esa validación no convierte un default
semánticamente equivocado en identidad segura.

## Identidad y proveniencia

La firma sin `supplierItemCode` incluye Tipo, título observado/normalizado,
descripción, Categoría y Marca. Las claves de memoria confiable usan esa misma
estructura; Category y Brand se resuelven también como identidades canónicas o
pending durante Analyze. Un identifier SKU/barcode puede localizar un target,
pero una referencia explícita incompatible sigue produciendo contradicción.

| Campo | FULL | Sensibilidad de identidad | Clasificación UX-002E |
| --- | --- | --- | --- |
| Tipo | obligatorio | firma, compatibilidad y contradicción de target | MAKE_SECONDARY / NEEDS_DOMAIN_CHANGE para recuperación automática |
| Categoría | obligatoria | firma, candidate blocking y referencia gobernada | MAKE_SECONDARY / EXCEPTION_ONLY futuro |
| Marca | opcional | firma y contradicción de referencia cuando se suministra | MAKE_SECONDARY; nunca auto-apply silencioso |
| Aplicar sólo a vacíos | acción local segura sólo sintácticamente | puede hacer que un valor vacío entre a la firma | KEEP como acción explícita secundaria |

El sistema actual **no distingue**: (A) Brand explícita del proveedor, (B)
Brand aplicada manualmente como default, (C) sugerencia futura aceptada ni (D)
una preferencia recordada. Todas terminan como `brand` en `proposal`,
`source_observation`, `brand_label` y, al aplicar, la referencia Catalog. Crear
provenance requeriría contrato de fila/Listing y reglas de lectura; no se crea
en este audit.

El normalizador de títulos sólo preserva/normaliza casing y espacios. No extrae
Apple, Samsung, iPhone ni otra marca; tampoco se propone title parsing como
autoridad de identidad.

## Evidencia material v52 / v53

La inspección local read-only de AG confirma el mismo título y contexto salvo
Marca:

| Version | Tipo / Categoría / Marca | Resultado | Interpretación |
| --- | --- | --- | --- |
| `v52` | `PART` / `Pantallas` / vacío | `NEW`, sin target | el lookup exacto no recuperó historia sin Brand |
| `v53` | `PART` / `Pantallas` / `Apple` | `REACTIVATE`, `TRUSTED_HISTORY`, mismo item histórico | Brand completa la firma necesaria para reconocer la identidad |

No se mutaron `v52` ni `v53`. La consecuencia es directa: prellenar Apple sin
confirmación no es cosmético; puede convertir una observación incompleta o de
otra marca en una decisión de identidad incorrecta.

## Listas mixtas y contexto recuperable

Una lista Apple/Samsung/Motorola hace inseguro un default global de Apple. El
empty-only actual protege una fila que trae explícitamente Samsung, pero no una
fila Samsung que llega sin Brand: esa fila heredaría Apple y su firma dejaría de
representar la observación original. Que 39 filas sean Apple y una Samsung no
cambia esa conclusión.

Las últimas cinco Versiones APPLIED locales de AG observadas son homogéneas
(`PART / Pantallas / Apple`, 6 de 6 filas), por lo que esa distribución es
**derivable** read-only desde Listings. No demuestra que AG sea homogéneo en el
futuro ni que Apple sea seguro de aplicar; además es evidencia local sintética
y no una preferencia durable.

| Caso | Qué debe hacer el Owner hoy | Automatización segura ahora |
| --- | --- | --- |
| A. AG Apple sin columna Brand | aplicar Apple explícitamente sólo a vacíos antes de Review | ninguna silenciosa |
| B. Apple + Samsung sin Brand | completar/revisar por fila; un Apple global es peligroso | atención o sugerencia explícita, no apply |
| C. cinco cambios de precio conocidos | si identifiers/history completos, no necesita contexto global | Analyze puede resolver identidad existente |
| D. 100 conocidos + 2 nuevos | contexto sólo para las filas que realmente lo necesiten | exception-first requiere cambio de dominio |
| E. Brand explícita en cada fila | preservar valores del proveedor | empty-only no debe tocarla |
| F. una Brand incorrecta | conservar discrepancia y dejar que Analyze la contradiga | nunca reemplazarla en silencio |
| G. sólo título/precio/costo | FULL requiere Tipo/Categoría; Brand puede ser crítica para historia | pedir contexto explícito o atención; no inferir título |

Para filas conocidas con código de proveedor/SKU/barcode, defaults normalmente
no aportan identidad. Para filas sin código, la memoria actual necesita ya la
firma completa; por eso no puede analizar primero y “recuperar Brand después”
en el caso v52. Una futura UX exception-first exigiría una búsqueda de identidad
por etapas, reglas para señales incompletas, provenance y guards contra match
silencioso. Es un cambio de dominio, no sólo de layout.

## Supplier-specific memory y opciones de diseño

No hay metadata, settings, profile ni preference de `SupplierSource` para
captura. El historial de Listings permite derivar distribuciones de Tipo,
Categoría y Marca; derivable no equivale a seguro para aplicar.

| Opción | Evaluación |
| --- | --- |
| A — mantener visible | disponible, pero impone una decisión técnica repetitiva y parece autoridad de proveedor; fricción alta. |
| B — colapsar como Contexto/avanzado | conserva la ayuda explícita sin bloquear el happy path; seguro con semántica actual. |
| C — recordar último uso por proveedor | útil, pero stale/mixed y sin provenance; requiere nueva política y persistencia. |
| D — sugerir, nunca aplicar | viable sólo como lectura con explicación de ventana, muestra y procedencia; Owner acepta aplicar a vacíos. |
| E — confianza histórica | puede calcular distribución/homogeneidad, pero no prueba identidad futura; nunca debe auto-apply. |
| F — exception-first | deseable, pero bloqueado por firma actual completa cuando faltan señales; requiere cambio de dominio. |
| G — híbrido | B ahora; D/E sólo como sugerencia opt-in posterior; F después de rediseño de identidad por etapas. |

## Decisiones Owner requeridas

| ID | Pregunta / comportamiento actual | Riesgo y opciones | Recomendación | Cambio esperado |
| --- | --- | --- | --- | --- |
| UX2E-001 | ¿Contexto permanece visible en happy path? Hoy siempre aparece en FULL. | A visible, B colapsado, F remover. | B ahora. | UI independiente; sin migración. |
| UX2E-002 | ¿Permanece Aplicar sólo a vacíos? Hoy es acción, no toggle, y nunca sobreescribe. | quitar elimina ayuda segura; hacerlo overwrite es riesgoso. | conservar como acción secundaria explícita. | UI independiente. |
| UX2E-003 | ¿Historia puede generar sugerencias? Hoy no hay sugerencias. | derivable no equivale a seguro. | sí, sólo advisory con fuente/ventana/muestra visible. | read model/UI; no persistence inicial probada. |
| UX2E-004 | ¿Una sugerencia puede auto-aplicar? | v52/v53 y listas mixtas pueden corromper identidad. | no. Owner confirma aplicación a vacíos. | ninguna para prohibición; aplicar automático requeriría política. |
| UX2E-005 | ¿Cómo recuperar contexto de conocidas? Hoy una firma completa es necesaria sin identifier. | Analyze-first puede perder memoria por ausencia de Brand. | mantener identidad actual; investigar matching por etapas separado. | cambio de dominio y tests. |
| UX2E-006 | ¿Cómo tratar NEW incompleto? Hoy FULL exige Tipo/Categoría y Brand puede ser crítica. | global default equivocado crea firma falsa. | atención por fila/contexto explícito; no inferir desde título. | UI/domain para exception-first. |
| UX2E-007 | ¿Se necesita provenance de default/sugerencia? Hoy no existe. | no se puede auditar ni diferenciar A/B/C/D. | exigirla antes de perfiles o auto-sugerencias aplicables. | persistence contractual; migration UNKNOWN. |
| UX2E-008 | ¿Persistir preferencias por proveedor o derivar? Hoy no existe ninguno. | último uso puede ser stale/mixed; derivación no es intención. | derivación advisory primero; perfil sólo con decisión/policy/provenance. | perfil: persistence + migration probable. |
| UX2E-009 | ¿Cómo proteger listas mixtas? Hoy empty-only protege sólo valores presentes. | blanco hereda default incorrecto. | no auto-apply; mostrar contexto como explícito y resolver vacíos excepcionales. | UI ahora; dominio para detección/atención robusta. |

## Target recomendado y efecto en happy path

```text
Actual:   proveedor + intención -> contexto visible -> pegar -> revisar
Objetivo: proveedor + intención -> pegar -> revisar
                                      -> contexto avanzado explícito sólo si hace falta
                                      -> futuras sugerencias aceptadas, nunca silenciosas
```

No se recomienda eliminar el contexto físico todavía: FULL sigue requiriendo
Tipo y Categoría para filas nuevas, y Brand puede ser indispensable para
historia sin identifier. Sí se recomienda retirar su protagonismo del happy
path como próximo slice UI separado. El target exception-first completo es
**PARCIALMENTE factible**, pero necesita cambio de dominio, nueva cobertura y
posiblemente persistence/migración para provenance; no está autorizado aquí.

## Resultado de auditoría

- **DB writes:** `0`.
- **Product changes:** none.
- **Fixtures:** AG `v52`/`v53` preservadas read-only.
- **Supplier memory:** no capture profile/persistence exists.
- **Migration:** no change made; future provenance/profile is `UNKNOWN` until
  its model is decided.
