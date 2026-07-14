# Modelo candidato de información de recepción

**Estado:** `Proposed`.
**Propósito:** Definir información de negocio, propósito y ownership candidato sin diseñar tablas, contratos ni persistencia.
**Alcance:** Cliente, contacto, entregante, propietario, dispositivo, custodia, riesgos, acceso, evidencia y comprobante.
**Fuente:** Future State, ownership canónico no aprobado, Current State y auditorías legacy.
**Audiencia:** Product Owner, Operaciones, Seguridad, Legal y Arquitectura.
**Última actualización:** 2026-07-14.

## Criterios

- Owner candidato significa autoridad semántica por validar, no servicio, equipo o base de datos.
- Histórico preserva qué se conocía al recibir; vivo expresa dato corregible vigente.
- “Sensible” exige propósito y revisión, no implica que deba almacenarse.
- Cada bloque busca el mínimo útil para mostrador; los detalles opcionales se activan por riesgo o excepción.

## `FSR-INFO-001` — Cliente de la orden

| Aspecto | Propuesta candidata |
|---|---|
| Información | Nombre mostrado; vínculo opcional a cliente maestro; representación histórica mínima; tenant/sucursal de contexto; procedencia y correcciones. |
| Owner candidato | Autoridad de cliente para dato vivo; recepción/orden para snapshot histórico. `Pending architecture review`. |
| Productor | Recepción selecciona o registra; cliente/persona aporta datos. |
| Consumidores | Recepción, comprobante, comunicación, fases posteriores y auditoría proporcional. |
| Histórico o vivo | Vínculo y dato maestro vivos; nombre usado al recibir, histórico. Corrección no borra lo originalmente emitido. |
| Sensibilidad | Dato personal. Minimización `Pending security review`. |
| Reglas de corrección | Corregir dato vivo no reescribe comprobantes previos; error de captura puede requerir nueva versión/anexo. |
| Estado | `Recommended`. |
| Preguntas | `FSR-QUESTION-001/002`. |

## `FSR-INFO-002` — Contacto de la orden

| Aspecto | Propuesta candidata |
|---|---|
| Información | Número, canal, propósito, destinatario declarado, recepción de notificaciones, autoridad por decisión y posibilidad de múltiples contactos. |
| Owner candidato | Orden para propósito y snapshot; autoridad de cliente/contacto para dato vivo, por validar. |
| Productor | Persona que entrega/cliente y recepción. |
| Consumidores | Comunicaciones de la orden, riesgos y futuras autorizaciones según autoridad. |
| Histórico o vivo | Contacto usado al recibir, histórico; contacto vigente puede cambiar con procedencia. |
| Sensibilidad | Dato personal y potencial factor de autoridad. `Pending security review`. |
| Regla mínima | Teléfono sirve para encontrar coincidencias; no identifica por sí solo ni concede toda autorización. |
| Estado | `Recommended`. |
| Preguntas | `FSR-QUESTION-003/004`. |

## `FSR-INFO-003` — Persona que entrega

| Aspecto | Propuesta candidata |
|---|---|
| Información | Nombre/referencia mínima cuando aplique, relación declarada, motivo de captura y evidencia sólo si es proporcional. |
| Owner candidato | Recepción/orden como hecho de custodia. |
| Productor | Persona que entrega; recepción registra. |
| Consumidores | Custodia, aclaraciones, entrega futura y auditoría de disputa. |
| Histórico o vivo | Histórico del acto de recepción. |
| Sensibilidad | Dato personal; no capturar documento por defecto. |
| Política abierta | Siempre, opcional, sólo si difiere del cliente o sólo en excepciones. Se recomienda captura condicionada para evitar sobrecarga. |
| Estado | `Pending Product Owner validation`. |
| Preguntas | `FSR-QUESTION-005`. |

## `FSR-INFO-004` — Propietario declarado/no verificado

| Aspecto | Propuesta candidata |
|---|---|
| Información | Declaración opcional de relación con el equipo y nivel “no verificado”; nunca afirmación legal automática. |
| Owner candidato | `Unknown`; podría ser declaración ligada a orden, no identidad maestra. |
| Productor | Persona que entrega/cliente; recepción sólo conserva procedencia. |
| Consumidores | Riesgos, autorizaciones, entrega y garantía cuando la autoridad importe. |
| Histórico o vivo | Declaración histórica; verificación posterior sería otro hecho. |
| Sensibilidad | Relación personal/legal potencial. `Pending legal review`. |
| Regla mínima | Ausencia de verificación no debe bloquear toda recepción ni convertirse en “propietario confirmado”. |
| Estado | `Pending legal review`. |
| Preguntas | `FSR-QUESTION-006`. |

## `FSR-INFO-005` — Dispositivo recibido

| Aspecto | Propuesta candidata |
|---|---|
| Información | Tipo, marca, modelo, IMEI/serie disponibles, identificadores alternos, color, rasgos, fotografía opcional, etiqueta física y relación histórica opcional. |
| Owner candidato | Recepción/orden para objeto físico recibido; dispositivo histórico queda `Pending architecture review`. |
| Productor | Recepción observa; persona aporta; una fuente técnica puede complementar después sin borrar origen. |
| Consumidores | Custodia, condición, diagnóstico, comprobante, entrega y garantía. |
| Histórico o vivo | Descripción al recibir, histórica; asociación con dispositivo recurrente, viva/corregible con evidencia. |
| Sensibilidad | Identificadores del dispositivo pueden ser datos sensibles. |
| Regla mínima | Sin IMEI/serie se usan rasgos y etiqueta; no se inventa un valor. Dispositivo recibido no equivale necesariamente a entidad histórica. |
| Estado | `Recommended`; continuidad `Pending architecture review`. |
| Preguntas | `FSR-QUESTION-007/008`. |

## `FSR-INFO-006` — Custodia, condición y accesorios

| Aspecto | Propuesta candidata |
|---|---|
| Información | Momento de recepción física, sucursal, actor receptor, condición observable, límites de prueba, accesorios tri-valuados, evidencia y estado inicial de custodia. |
| Owner candidato | Operación de recepción/custodia. |
| Productor | Recepción, con declaración de persona que entrega. |
| Consumidores | Diagnóstico, entrega, garantía, comprobante y auditoría. |
| Histórico o vivo | Snapshot histórico; correcciones se anexan con motivo/actor. Custodia vigente es dato vivo derivado de hechos. |
| Sensibilidad | Condición puede revelar información; imágenes son sensibles. |
| Regla mínima | Vacío no equivale a ausencia; “no comprobable” no equivale a “funciona”. |
| Estado | `Recommended`. |
| Preguntas | `FSR-QUESTION-009/010/011`. |

## `FSR-INFO-007` — Riesgos y consentimiento

| Aspecto | Propuesta candidata |
|---|---|
| Información | Riesgo identificado, fuente, comunicación, decisor, decisión, momento, alcance, evidencia y posible revocación/cambio. |
| Owner candidato | Recepción para riesgo observado; persona decisora para decisión; autoridad total `Pending Product Owner validation`. |
| Productor | Recepción identifica/comunica; decisor acepta/rechaza. |
| Consumidores | Recepción completa, diagnóstico futuro, comprobante, Legal y auditoría proporcional. |
| Histórico o vivo | Cada comunicación/decisión es histórica; vigencia/revocación se representa con otro hecho. |
| Sensibilidad | Identidad, consentimiento y evidencia. `Pending legal review` y `Pending security review`. |
| Regla mínima | Selección interna no es aceptación. Varios riesgos conservan decisiones separadas cuando su alcance difiere. |
| Estado | `Pending legal review`. |
| Preguntas | `FSR-QUESTION-013/014`. |

## `FSR-INFO-008` — Acceso al dispositivo

| Alternativa candidata | Ventaja | Riesgo/límite | Estado |
|---|---|---|---|
| No registrar secreto | Minimiza exposición. | Algunas pruebas no podrán realizarse. | `Recommended` como preferencia inicial |
| Acceso asistido por cliente | Permite validar sin revelar credencial. | Requiere presencia/coordinación. | `Recommended` para casos compatibles |
| Credencial temporal protegida | Puede permitir trabajo posterior. | Retención, acceso y eliminación son críticos. | `Pending security review` |
| Token/código de un solo uso | Reduce reutilización si el dispositivo lo permite. | No siempre existe; no se decide tecnología. | `Proposed` |
| Patrón representado de forma segura | Podría soportar dispositivos legacy. | Riesgo alto de reconstrucción/exposición. | `Pending security review` |
| Acceso no proporcionado | Respeta decisión y realidad operativa. | Limita diagnóstico/pruebas; debe quedar visible. | `Recommended` |

| Aspecto | Propuesta candidata |
|---|---|
| Información | Método, propósito, alcance, vigencia, quién puede usarlo, estado “no proporcionado” y límites resultantes. |
| Owner candidato | Seguridad/autoridad de acceso por definir; recepción sólo registra método/propósito mínimo. |
| Productor | Cliente/contacto autorizado y recepción. |
| Consumidores | Diagnóstico y prueba, bajo propósito. |
| Histórico o vivo | Decisión histórica; cualquier secreto, si existiera, tendría ciclo temporal distinto. |
| Sensibilidad | Máxima dentro del segmento. No aparecer en comprobante general. |
| Estado | `Pending security review`. |
| Preguntas | `FSR-QUESTION-015/016`. |

## `FSR-INFO-009` — Evidencia

| Aspecto | Propuesta candidata |
|---|---|
| Información | Propósito, categoría, autor, momento, archivo/referencia, integridad, retención, privacidad, obligatoriedad, estado pendiente y relación con recepción. |
| Owner candidato | Recepción para significado; gobierno de evidencia/seguridad para conservación, por validar. |
| Productor | Recepción o capturista identificado. |
| Consumidores | Custodia, diagnóstico, garantía, entrega, Legal y auditoría con acceso proporcional. |
| Histórico o vivo | Evidencia histórica; corrección/anotación no sobrescribe original. Estado pendiente es vivo hasta resolución. |
| Sensibilidad | Imágenes pueden contener PII, documentos, entorno o secretos. |
| Regla mínima | La categoría determina propósito y acceso; no toda foto sirve para toda fase. |
| Estado | `Pending security review`; obligatoriedad `Pending operations validation`. |
| Preguntas | `FSR-QUESTION-012/017`. |

## `FSR-INFO-010` — Comprobante de recepción

| Aspecto | Propuesta candidata |
|---|---|
| Información | Folio, versión, datos incluidos, términos, riesgos/decisiones aplicables, emisor, momento, entrega al cliente, canal y reimpresión. |
| Owner candidato | Operación de recepción para contenido; valor legal `Pending legal review`. |
| Productor | Recepción/sistema tras orden numerada. |
| Consumidores | Cliente, recepción, entrega futura, soporte y Legal. |
| Histórico o vivo | Cada versión emitida es histórica; datos vivos no deben reescribirla. |
| Sensibilidad | Minimizar contacto, identificadores y nunca incluir credencial ordinaria. |
| Regla mínima | Reimpresión reproduce versión emitida; corrección genera nueva versión/anexo según decisión. |
| Estado | `Pending legal review`. |
| Preguntas | `FSR-QUESTION-018/019`. |

## Registro de preguntas

| ID | Pregunta | Área principal | Estado |
|---|---|---|---|
| `FSR-QUESTION-001` | ¿Cuál es el mínimo de cliente operativo necesario para crear orden? | Product Owner / Operaciones | `Pending Product Owner validation` |
| `FSR-QUESTION-002` | ¿Quién corrige dato vivo y quién corrige una recepción ya emitida? | Product Owner / Arquitectura | `Pending architecture review` |
| `FSR-QUESTION-003` | ¿Se permiten varios contactos y se separan por propósito/canal? | Product Owner | `Pending Product Owner validation` |
| `FSR-QUESTION-004` | ¿Qué autoridad concede cada contacto para riesgos, trabajo y retiro? | Product Owner / Legal | `Pending legal review` |
| `FSR-QUESTION-005` | ¿Cuándo registrar entregante aporta valor suficiente para justificar captura? | Operaciones | `Pending operations validation` |
| `FSR-QUESTION-006` | ¿Debe conservarse una declaración de propietario y con qué redacción no legalizante? | Legal | `Pending legal review` |
| `FSR-QUESTION-007` | ¿Cuándo se relaciona el recibido con un dispositivo histórico? | Product Owner / Arquitectura | `Pending architecture review` |
| `FSR-QUESTION-008` | ¿Qué rasgos mínimos y etiqueta reducen confusión sin IMEI/serie? | Operaciones | `Pending operations validation` |
| `FSR-QUESTION-009` | ¿Cuándo empieza custodia si la orden aún no nació? | Product Owner / Operaciones | `Pending Product Owner validation` |
| `FSR-QUESTION-010` | ¿Qué accesorios ameritan catálogo y cuáles narrativa? | Operaciones | `Pending operations validation` |
| `FSR-QUESTION-011` | ¿Qué inspección mínima aplica por tipo de equipo y condición encendido/apagado? | Operaciones | `Pending operations validation` |
| `FSR-QUESTION-012` | ¿Qué evidencia inicial es obligatoria, opcional o condicionada? | Operaciones / Legal | `Pending operations validation` |
| `FSR-QUESTION-013` | ¿Qué riesgos son materiales y qué evidencia exige cada uno? | Product Owner / Legal | `Pending legal review` |
| `FSR-QUESTION-014` | ¿Cómo se cambia o revoca una decisión de riesgo? | Legal / Product Owner | `Pending legal review` |
| `FSR-QUESTION-015` | ¿Qué alternativas de acceso son aceptables por tipo de servicio? | Seguridad / Operaciones | `Pending security review` |
| `FSR-QUESTION-016` | ¿Puede conservarse algún secreto, con qué propósito, acceso y vencimiento? | Seguridad | `Pending security review` |
| `FSR-QUESTION-017` | ¿Qué retención, acceso, borrado e integridad requieren las evidencias? | Seguridad / Legal | `Pending security review` |
| `FSR-QUESTION-018` | ¿El comprobante es operativo, contractual o ambos? | Legal / Product Owner | `Pending legal review` |
| `FSR-QUESTION-019` | ¿Qué prueba emisión/entrega y cómo funciona reimpresión/corrección? | Legal / Operaciones | `Pending legal review` |
| `FSR-QUESTION-020` | ¿Quién puede exceptuar recepción incompleta y qué limita el avance? | Product Owner / Operaciones | `Pending Product Owner validation` |
