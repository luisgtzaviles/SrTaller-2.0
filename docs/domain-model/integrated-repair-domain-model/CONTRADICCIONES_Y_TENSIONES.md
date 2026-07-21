# Contradicciones y tensiones

## Criterio

Cada tensión se conserva como **RCL**. “Decisión actual” indica qué separación validada ya evita canonizar el problema; “propuesta” es **PM** y “pregunta” permanece **PA**.

| ID / tensión | Evidencia | Impacto | Decisión actual | Propuesta | Pregunta pendiente | Riesgo si no se resuelve |
|---|---|---|---|---|---|---|
| IDM-TEN-001 “falla” polisémica | lenguaje y campos legacy mezclan síntoma, diagnóstico y trabajo | comunicación y métricas ambiguas | problema, conclusión, recomendación y trabajo son distintos | retirar “falla” genérica de contratos conceptuales | ¿qué términos visibles adopta operación? | autorización o trabajo equivocados |
| IDM-TEN-002 presupuesto inicial/final | auditoría de detalle muestra campos mutables | no soporta versiones ni parcialidad | cotización con conceptos y decisiones por concepto | historial de propuestas/versiones | ¿qué nombre conserva la autorización inicial? | precio autorizado inexplicable |
| IDM-TEN-003 técnico mutable | una sola columna resumen | borra participaciones y reasignaciones | historia de asignaciones/participaciones | técnico principal como proyección | ¿regla para técnico principal? | atribución incorrecta |
| IDM-TEN-004 autorización narrativa | seguimientos/comentarios describen aprobación | no demuestra decisor, versión ni alcance | decisión estructurada por concepto | enlazar evidencia complementaria | ¿qué evidencia y autoridad son válidas? | trabajo no autorizado |
| IDM-TEN-005 seguimientos como hechos | texto libre registra eventos heterogéneos | no permite reglas ni auditoría confiable | evento, nota y actividad son distintos | timeline tipado | ¿qué hechos requieren estructura MVP? | entrega/pago/QC ficticios |
| IDM-TEN-006 estado mezclado con ubicación/entrega | campos y etiquetas legacy | tableros y custodia incoherentes | dimensiones separadas | movimientos y transiciones explícitos | ¿catálogos definitivos? | equipo perdido o entrega indebida |
| IDM-TEN-007 saldo negativo | cálculo legacy permite valores ambiguos | puede ocultar sobrepago/error/devolución | pagos como movimientos, saldo derivado | política de aplicación/compensación | ¿cómo tratar sobrepago? | pérdida financiera |
| IDM-TEN-008 anticipo desconectado de caja | pagos por folio sin caja demostrada | conciliación incompleta | anticipo es hecho financiero básico | integración posterior con Caja | ¿ownership y aplicación contable? | cobros no conciliados |
| IDM-TEN-009 webhook antes de persistencia | auditoría de detalle | notifica cambio que pudo fallar | actividad externa no prueba hecho | notificar sólo hechos confirmados conceptualmente | ¿qué eventos se notifican? | cliente recibe información falsa |
| IDM-TEN-010 folio sin reserva segura | “siguiente folio” legacy | carrera y duplicidad física | folio debe identificar unívocamente en alcance | reserva/confirmación conceptual | ¿alcance de unicidad? | equipos cruzados |
| IDM-TEN-011 cliente como propietario | operación presume equivalencia | entrega/consentimiento sin autoridad | no modelar propiedad como universal | roles cliente/contacto/entregante/receptor | ¿se verifica propiedad en algún caso? | disputa de custodia |
| IDM-TEN-012 PIN/credencial sensible | PIN operativo y códigos del dispositivo | suplantación/exposición | PIN no prueba identidad absoluta | controles y autenticación reforzada | ¿qué secretos pueden capturarse? | acceso no autorizado |
| IDM-TEN-013 evidencia posterior no garantizada | fotos se toman después de creación | condición de ingreso puede quedar sin prueba | custodia no depende de foto | pendiente visible y política de evidencia | ¿cuándo bloquea avance? | disputa sobre daños |
| IDM-TEN-014 segunda revisión ambigua | “revisor” textual no demuestra QC | Listo sin control verificable | QC estructurado e independiente del trabajo | revisiones identificadas | ¿revisor distinto obligatorio? | fallas entregadas |
| IDM-TEN-015 una columna para reparó | técnico resumen legacy | no responde quién hizo qué | participaciones atribuibles | proyección de resumen | ¿granularidad mínima? | responsabilidad laboral incorrecta |
| IDM-TEN-016 diagnóstico sobrescribible | seguimiento/presupuesto mutable | pierde evolución técnica | preservar iteraciones anteriores | iteración diagnóstica candidata | ¿estructura mínima sin fricción? | decisiones sin evidencia histórica |
| IDM-TEN-017 precios manuales sin política | operación permite ajustes | fraude/error y total inexplicable | ajuste debe ser autorizado y trazable | rangos, motivo y vigencia | ¿umbrales y doble aprobación? | pérdida/margen inconsistente |
| IDM-TEN-018 presupuesto sin autorización vinculada | cambios de monto separados de narrativa | aprobación queda obsoleta | decisión refiere versión/concepto | control de vigencia | ¿qué cambio obliga reautorizar? | ejecutar alcance incorrecto |
| IDM-TEN-019 entrega por campo mutable | marca `entregado` y comentario | no demuestra acto físico ni receptor | entrega válida estructurada termina custodia | intento/entrega con legitimación | ¿cómo corregir entrega errónea? | doble entrega o pérdida |
| IDM-TEN-020 WorkOrderAssigned amplio | evento canónico preliminar ambiguo | asignación se confunde con posesión/trabajo | asignación, participación y ubicación distintas | eventos más precisos | ¿qué se asigna exactamente? | responsabilidad falsa |
| IDM-TEN-021 modelo orientado a campos | fila central acumula estado/técnico/dinero | acoplamiento y pérdida de causalidad | hechos y conceptos separados | agregados pequeños y proyecciones | ¿qué límites mínimos son viables? | recrear deuda legacy |

## Tensiones entre decisiones validadas

| Tensión | Lectura compatible | Clasificación |
|---|---|---|
| Orden como ciclo único y múltiples iteraciones | las iteraciones ocurren dentro del mismo ciclo, no crean otra orden | DDV |
| Custodia nace al crear y fotos son posteriores | la evidencia puede quedar pendiente sin negar la custodia existente | DDV; política de avance PA |
| Técnico normalmente diagnostica/repara y QC es independiente | independencia es del acto de control; persona distinta aún es política abierta | DDV/PA |
| Listo puede volver a Taller | Listo es estado reversible antes de la entrega, no cierre de custodia | DDV/HOV |
| Precio manual y total explicable | ajuste sólo es válido si política, actor y motivo lo explican | RCA/PC |

## Criterio de resolución

Una tensión se considera resuelta sólo cuando existe evidencia, autoridad, decisión explícita, impacto actualizado en invariantes/políticas y trazabilidad hacia sus fuentes. Una solución técnica no resuelve por sí sola una contradicción de dominio.
