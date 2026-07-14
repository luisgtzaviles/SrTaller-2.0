# Auditoría de legado — Nueva Reparación

- **Estado:** Confirmed by legacy code
- **Propósito:** Presentar la evidencia funcional y semántica del flujo “Nueva Reparación” de SR Taller 1.0.
- **Alcance:** Alta de una reparación y efectos inmediatos o directamente relacionados: cliente, equipo, folio, dinero, impresión, evidencia, mensajes y auditoría.
- **Fuente:** Repositorio local `srtaller`, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
- **Audiencia:** Product Owner, Domain Experts, Product, Arquitectura, Seguridad, QA y equipo de SR Taller 2.0.
- **Última actualización:** 2026-07-14

> Este directorio contiene evidencia de legado. No es un modelo aprobado de SR Taller 2.0 y no autoriza copiar su UI, esquema de datos, arquitectura ni reglas implícitas.

## Propósito y alcance

La auditoría reconstruye qué hace el flujo actual, dónde lo hace y qué significado parece tener. Se inspeccionó código versionado de SR Taller 1.0 sin ejecutar migraciones ni consultar datos productivos. Por eso se distingue entre lo confirmado por código, lo inferido, lo no encontrado y lo que sólo puede resolverse con personas o datos de operación.

Raíz de evidencia: `/Users/luisantoniogutierrez/Documents/GitHub/srtaller`.

## Índice

- [Auditoría del formulario](NEW_REPAIR_FORM_AUDIT.md)
- [Catálogo de campos](NEW_REPAIR_FIELD_CATALOG.md)
- [Mapa del flujo](NEW_REPAIR_FLOW_MAP.md)
- [Hallazgos de dominio](NEW_REPAIR_DOMAIN_FINDINGS.md)
- [Preguntas abiertas](NEW_REPAIR_OPEN_QUESTIONS.md)
- [Trazabilidad](NEW_REPAIR_TRACEABILITY.md)

## Estados usados

| Estado | Uso en esta auditoría |
|---|---|
| `Confirmed by legacy code` | Hay evidencia directa en código o SQL versionado. |
| `Inferred from legacy behavior` | La interpretación se desprende del flujo, pero no expresa una política de negocio. |
| `Not found` | Se realizó búsqueda amplia y no apareció el mecanismo o uso indicado. |
| `Unknown` | No puede determinarse con el repositorio disponible. |
| `Pending Product Owner validation` | Requiere decisión o confirmación de negocio. |
| `Pending security review` | Involucra privacidad, secretos, consentimiento o acceso. |
| `Pending architecture review` | Expone una condición heredada que debe considerarse, sin diseñar todavía una solución. |

## Cómo usarlo en Domain Validation

1. Partir de las preguntas abiertas, no de los nombres de tablas o controles de la UI heredada.
2. Contrastar cada hallazgo con Product Owner y personas que reciben, diagnostican, cobran y entregan equipos.
3. Usar la trazabilidad para volver a la evidencia cuando una regla sea discutida.
4. Promover a documentos canónicos sólo conceptos y reglas validados; conservar aquí el historial de procedencia.
5. Registrar por separado las decisiones de seguridad, dinero, tiempo, identidad y consentimiento.

## Límites de la evidencia

- No se inspeccionó la base de datos de producción ni el contenido activo de plantillas de ticket.
- El repositorio no contiene un `CREATE TABLE reparaciones` completo ni una restricción versionada de unicidad para su folio.
- No se observó la operación presencial; etiquetas físicas, firma y entrega de la nota requieren validación humana.
- Las rutas y líneas citadas son relativas a la raíz de SR Taller 1.0 indicada arriba.
- “No encontrado” significa “no encontrado tras búsqueda en el repositorio auditado”, no inexistencia absoluta en producción o en procesos manuales.
