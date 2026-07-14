# Hotspots del Future State de recepción

**Estado:** `Proposed`.
**Propósito:** Registrar decisiones tensas y riesgos que deben probarse antes de canonizar el Future State.
**Alcance:** Identidad, dispositivo, custodia, condición, evidencia, consentimiento, acceso, número, comprobante, excepciones, auditoría y tiempo.
**Fuente:** Decisiones FSR, Current State, auditorías legacy y preguntas canónicas.
**Audiencia:** Product Owner, Operaciones, Seguridad, Legal y Arquitectura.
**Última actualización:** 2026-07-14.

## Inventario priorizado

| ID | Hotspot / impacto | Opciones | Recomendación candidata | Riesgo residual | Estado | Revisión |
|---|---|---|---|---|---|---|
| `FSR-HOTSPOT-001` | Identidad de cliente: selección incorrecta atribuye orden/contacto a otra persona. | Identidad única fuerte; búsqueda+contraste; registro nuevo. | Búsqueda y contraste, sin fusión automática. | Duplicados o fricción. | `Recommended` | Product Owner / Arquitectura |
| `FSR-HOTSPOT-002` | Teléfonos compartidos: una familia/empresa puede usar el mismo número. | Clave única; criterio de búsqueda; múltiples relaciones. | Criterio de búsqueda con procedencia y propósito. | Contactar persona incorrecta. | `Recommended` | Seguridad / Product Owner |
| `FSR-HOTSPOT-003` | Cambio de contacto: dato vivo puede diferir del usado al recibir. | Sobrescribir; congelar; histórico + vigente. | Preservar snapshot y cambio trazable. | Mensaje posterior al número obsoleto. | `Recommended` | Product Owner / Arquitectura |
| `FSR-HOTSPOT-004` | Propietario no verificado: afirmar propiedad crea certeza falsa. | Exigir prueba; declaración; omitir. | Declaración no verificada sólo cuando aporte valor. | Disputa legal/autoridad. | `Pending legal review` | Legal / Product Owner |
| `FSR-HOTSPOT-005` | Persona que entrega: capturar siempre puede sobrecargar; omitir pierde custodia. | Siempre; nunca; si difiere; por riesgo. | Condicionada por diferencia/riesgo. | PII innecesaria o evidencia insuficiente. | `Pending operations validation` | Operaciones / Legal |
| `FSR-HOTSPOT-006` | Dispositivo repetido: asociación histórica errónea mezcla reparaciones. | Siempre nuevo; dedupe automático; vínculo opcional validado. | Recibido independiente; vínculo histórico no bloqueante. | Duplicados o asociación incorrecta. | `Pending architecture review` | Product Owner / Arquitectura |
| `FSR-HOTSPOT-007` | Equipo sin IMEI: equipos parecidos pueden confundirse. | Bloquear; provisional; rasgos+etiqueta+evidencia. | Admitir ausencia explícita y reforzar identificación proporcional. | Sticker perdido/intercambiado. | `Recommended` | Operaciones |
| `FSR-HOTSPOT-008` | Condición física: checklist universal puede ser lento o falso. | Texto; checklist; híbrido adaptable. | Estructura mínima + narrativa/no comprobable. | Inspección insuficiente o captura excesiva. | `Pending operations validation` | Operaciones / Legal |
| `FSR-HOTSPOT-009` | Accesorios: vacío no distingue ausencia/incertidumbre. | Booleano; texto; tri-valuado. | `sí/no/desconocido` con catálogo corto. | Catálogo enorme o disputa persistente. | `Recommended` | Operaciones |
| `FSR-HOTSPOT-010` | Evidencia obligatoria: una regla universal puede frenar mostrador. | Siempre; nunca; condicionada. | Condicionada por equipo, riesgo y estado. | Variación injustificada por sucursal. | `Pending operations validation` | Operaciones / Legal |
| `FSR-HOTSPOT-011` | Evidencia posterior: captura tardía puede no representar recepción. | Bloquear orden; permitir pendiente; ignorar. | Pendiente visible y bloqueo de avance según riesgo. | Fotos posteriores a manipulación. | `Recommended` | Operaciones / Arquitectura |
| `FSR-HOTSPOT-012` | Privacidad de imágenes: fotos pueden contener PII/entorno/documentos. | Captura libre; guía/minimización; no fotos. | Propósito/categoría, acceso y retención proporcionales. | Exposición o evidencia inutilizable. | `Pending security review` | Seguridad / Legal |
| `FSR-HOTSPOT-013` | Consentimiento: firma universal puede ser pesada; selección interna insuficiente. | Selección; firma siempre; evidencia proporcional. | Actor/momento/alcance/evidencia por materialidad. | Validez insuficiente o fricción. | `Pending legal review` | Legal / Product Owner |
| `FSR-HOTSPOT-014` | Múltiples riesgos: una aceptación global oculta decisiones distintas. | Uno global; lista; narrativa. | Riesgos separados cuando alcance/decisión difieran. | Demasiados pasos. | `Pending operations validation` | Operaciones / Legal |
| `FSR-HOTSPOT-015` | Credencial: utilidad técnica frente a secreto de alto riesgo. | No guardar; asistido; temporal; token; patrón; sin acceso. | Preferir no guardar/asistido/sin acceso; evaluar demás. | Diagnóstico limitado o fuga. | `Pending security review` | Seguridad / Operaciones |
| `FSR-HOTSPOT-016` | Folio concurrente: predicción produce colisión/sticker divergente. | Predecir; reservar; asignar al crear; provisional. | Asignar al crear; provisional sólo si operación lo necesita. | Implementación concreta aún no evaluada. | `Recommended` | Arquitectura |
| `FSR-HOTSPOT-017` | Comprobante: valor operativo vs contractual no decidido. | Dinámico; snapshot; versión/anexo. | Versión reproducible, contenido mínimo; valor por Legal. | Complejidad o falsa apariencia contractual. | `Pending legal review` | Legal / Operaciones |
| `FSR-HOTSPOT-018` | Snapshot: preserva historia pero puede confundirse con dato vigente. | Sólo vivo; sólo histórico; ambos con propósito. | Vínculo vivo + representación histórica mínima. | Comunicación usando copia obsoleta. | `Recommended` | Product Owner / Arquitectura |
| `FSR-HOTSPOT-019` | Excepción de recepción: necesaria para continuidad, susceptible de abuso. | Ninguna; informal; atribuible/limitada. | Autoridad, motivo, pendientes, vigencia y límites. | Bypass habitual. | `Pending Product Owner validation` | Product Owner / Operaciones |
| `FSR-HOTSPOT-020` | Recepción incompleta: orden existente puede parecer lista. | Un solo estado; pendiente visible; bloquear creación. | Separar orden creada, recepción completa y pendientes. | Cola confusa o demasiados estados. | `Recommended` | Operaciones / Arquitectura |
| `FSR-HOTSPOT-021` | Avance prematuro a diagnóstico: manipulación sin evidencia/riesgo resuelto. | Crear habilita; comprobante habilita; completitud/excepción habilita. | Completitud o excepción vigente. | Pendiente menor detiene trabajo urgente. | `Recommended` | Product Owner / Operaciones |
| `FSR-HOTSPOT-022` | Sucursal de custodia: recepción debe atribuir ubicación física. | Sucursal de usuario; origen explícito; transferencia. | Origen y receptor explícitos; transferencias quedan fuera de este segmento. | Equipo buscado en ubicación incorrecta. | `Pending Product Owner validation` | Operaciones / Arquitectura |
| `FSR-HOTSPOT-023` | Correcciones posteriores: sobrescribir destruye qué se recibió/emitió. | Sobrescribir; bloquear; corrección/anexo versionado. | Corrección trazable proporcional al dato. | Historial complejo o error permanente. | `Recommended` | Product Owner / Legal / Arquitectura |
| `FSR-HOTSPOT-024` | Auditoría: registrar todo crea vigilancia/ruido; registrar poco impide disputa. | Log total; hechos críticos; sólo estado actual. | Actor, momento, motivo y secuencia de decisiones/correcciones críticas. | PII excesiva o trazabilidad incompleta. | `Pending security review` | Seguridad / Legal / Operaciones |
| `FSR-HOTSPOT-025` | Tiempo/zona: llegada, captura, orden, evidencia y emisión pueden diferir. | Hora local implícita; zona única; instante+contexto. | Semántica por hito y zona explícita, mecanismo posterior. | Orden causal o comprobantes ambiguos. | `Pending architecture review` | Operaciones / Arquitectura |

## Riesgo de sobrecarga operativa

Los hotspots `005`, `008`, `010`, `013`, `014`, `015`, `017`, `019` y `024` pueden convertir una recepción rápida en trámite excesivo. En el taller deben medirse tiempo, errores y número de decisiones del caso estándar. La recomendación transversal es capturar detalle por diferencia, riesgo o excepción; no imponer máxima evidencia a todos los casos.
