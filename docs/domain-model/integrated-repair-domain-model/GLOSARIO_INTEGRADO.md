# Glosario integrado

## Regla terminológica

Los términos preferidos separan relato, conocimiento técnico, propuesta comercial, decisión y ejecución. No se usa “falla” como sustantivo genérico sin aclarar si significa síntoma reportado, conclusión, necesidad o resultado.

## Orden, recepción y personas

| Término preferido | Definición integrada | No confundir con | Clasificación/madurez |
|---|---|---|---|
| Orden de Servicio | identidad de un ciclo de servicio y custodia | dispositivo o reparación individual | DDV; preferido |
| Orden de Reparación | nombre operativo alterno de la Orden de Servicio | reparación ejecutada | IDO; tensión terminológica |
| Ciclo de servicio | periodo desde creación exitosa hasta entrega | garantía o regreso posterior | DDV |
| Folio | referencia legible de la orden en un alcance | identidad interna o etiqueta | DDV; alcance PA |
| Recepción | acto de reunir mínimos y crear exitosamente la orden | consulta previa | DDV |
| Custodia | responsabilidad física aceptada por el taller | estado, ubicación o asignación | DDV |
| Identificación física | folio adherido al equipo durante custodia | identidad del dispositivo | DDV |
| Cliente operativo | persona a cuyo nombre se deja la orden | propietario legal | DDV/HOV |
| Contacto | persona/medio para comunicación con propósito | cliente o decisor autorizado | DDV |
| Persona entregante | quien entrega físicamente al inicio | cliente/propietario | DDV |
| Receptor de entrega | quien recibe físicamente al final | cliente/decisor | DDV |
| Propietario legal | titularidad que el taller no verifica necesariamente | cliente operativo | HOV/PA |
| Dispositivo recibido | equipo físico bajo el ciclo de custodia | estación operativa del sistema | DDV |

## Técnico

| Término preferido | Definición integrada | No confundir con | Clasificación/madurez |
|---|---|---|---|
| Problema reportado | relato del cliente sobre lo que ocurre | diagnóstico | DDV |
| Evaluación diagnóstica | proceso técnico de revisión y pruebas | resultado o precio | DDV/PM en su unidad explícita |
| Iteración diagnóstica | evaluación identificable dentro de una orden | nueva orden | PM fuerte |
| Conclusión técnica | resultado suficiente de una evaluación, incluso no concluyente | recomendación | DDV |
| Observación técnica | dato complementario atribuible | conclusión completa | DDV/IDO |
| Recomendación técnica | trabajo, pieza o atención sugeridos por necesidad técnica | cotización | DDV |
| Trabajo propuesto | alcance ofrecido comercialmente | recomendación pura | DDV |
| Trabajo autorizado | alcance que una decisión válida permite ejecutar | pago o trabajo realizado | DDV |
| Trabajo ejecutado | intervención realmente realizada y documentada | lo cotizado/autorizado | DDV |
| Servicio | acción técnica/comercial que puede resolver o aportar valor | pieza o diagnóstico universal | DDV/contextual |
| Pieza temporal de prueba | componente usado para comprobar una hipótesis | pieza vendida/consumida | DDV |
| Control de calidad | revisión del resultado técnico antes de Listo | prueba aislada o reparación | DDV |
| Segunda revisión | nombre operativo del control de calidad en Avicell | segundo diagnóstico | RCA/DDV |
| Participación técnica | contribución atribuible de una persona | asignación | DDV/PM |
| Asignación técnica | responsabilidad temporal sobre trabajo | posesión física | DDV/PM |

## Comercial y financiero

| Término preferido | Definición integrada | No confundir con | Clasificación/madurez |
|---|---|---|---|
| Cotización | propuesta comercial identificable con conceptos, precios y condiciones | recomendación o autorización | DDV/PM versionable |
| Concepto de cotización | elemento ofrecido y decidible individualmente | trabajo ejecutado | DDV |
| Decisión por concepto | autorización o rechazo atribuible sobre concepto/versión | comentario | DDV |
| Autorización | decisión que permite un alcance concreto | permiso del sistema o pago | DDV |
| Rechazo | decisión negativa preservada | cancelación/borrado | DDV |
| Autorización comercial inicial | interpretación del “presupuesto inicial” legacy | cotización final | IDO/RCA; nombre PA |
| Promoción | regla comercial para combinación/elegibilidad | diagnóstico o descuento manual | PC/RCA |
| Ajuste manual | cambio de precio por actor autorizado y motivo | edición silenciosa | PC/RCA |
| Total autorizado | importe derivado de conceptos autorizados y política | presupuesto final mutable | DDV |
| Anticipo | movimiento recibido antes de completar obligación/entrega | autorización | DDV |
| Pago | movimiento financiero con propósito, monto y medio | caja/contabilidad completa | IDO; alcance abierto |
| Saldo | proyección entre obligaciones y movimientos aplicados | fuente de verdad aislada | PM |

## Workflow, trazabilidad y organización

| Término preferido | Definición integrada | No confundir con | Clasificación/madurez |
|---|---|---|---|
| Estado de negocio | fase o condición operativa | ubicación/custodia | DDV; catálogo PA |
| Ubicación física | lugar actual del equipo | estado | DDV; catálogo PC |
| Responsabilidad actual | actor/área que debe realizar siguiente acción | técnico asignado | PM |
| Listo | equipo habilitado para entrega tras controles aplicables | entregado | DDV/HOV |
| No quedó | resultado no resuelto bajo alcance actual | entregado o sin custodia | DDV/HOV |
| Entrega | acto válido de salida física que termina custodia | marca, nota o pago | DDV |
| Evento estructurado | hecho de negocio con semántica específica | todo log o comentario | DDV |
| Nota narrativa | contexto humano libre y atribuible | autorización/QC/pago/entrega | DDV |
| Actividad automática | registro de acción del sistema | hecho físico o decisión humana | DDV |
| Evidencia | registro que sustenta condición/acción por propósito | el hecho sustentado | IDO |
| Proyección | vista derivada de hechos | fuente de verdad | PM |
| Timeline | lectura cronológica tipada | un único agregado/event store | PM |
| Tenant | organización aislada que usa la plataforma | sucursal | PM arquitectónica; restricción conocida |
| Sucursal | unidad operativa dentro de tenant | ubicación interna | PM/IDO |
| Política | regla variable con alcance y vigencia | invariante universal | PC |
| Regla contextual de Avicell | práctica validada sólo para Avicell | universal | RCA |
| PIN operativo | mecanismo de baja fricción para atribución | identidad absoluta/código del cliente | HOV/RCA |
| Sesión operativa | contexto temporal de atribución | persona o sesión de dispositivo | PM |

## Términos a retirar o aclarar

| Término ambiguo | Sustitución recomendada | Clasificación |
|---|---|---|
| falla | problema reportado, conclusión, necesidad o trabajo según intención | DDV/PM |
| presupuesto final | cotización/version, total autorizado o total cobrado según caso | PM |
| técnico | técnico asignado, participante o principal derivado | PM |
| revisor | revisión de calidad + actor atribuido | PM |
| entregado como ubicación | entrega válida / fuera de custodia | DDV |
| seguimiento | nota, evento o actividad según semántica | DDV |
