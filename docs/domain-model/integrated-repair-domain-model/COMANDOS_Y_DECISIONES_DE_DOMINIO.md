# Comandos y decisiones de dominio

## Criterio

**PM:** un comando expresa intención; puede rechazarse por reglas del negocio y, si prospera, produce un resultado observable. No define endpoint, formulario, método ni transacción técnica.

## Catálogo de intención y resultado

| Comando candidato | Actor principal | Contexto propietario | Intención y decisión | Resultado/evento candidato |
|---|---|---|---|---|
| Crear orden | Recepción | Órdenes/Recepción | aceptar mínimos y abrir ciclo o rechazar | Orden creada; custodia iniciada |
| Completar recepción | Recepción | Recepción | confirmar políticas/pendientes aplicables | Recepción completada |
| Identificar equipo | Recepción | Custodia | vincular folio físico o activar contingencia | Equipo identificado |
| Mover equipo | Personal autorizado | Workflow | registrar origen, destino y motivo | Equipo movido |
| Asignar técnico | Responsable operativo | Técnico/Workflow | establecer responsabilidad temporal | Técnico asignado |
| Registrar evaluación diagnóstica | Técnico | Técnico | concluir con suficiente información o no concluyente | Evaluación concluida |
| Emitir recomendación | Técnico | Técnico | proponer necesidad/mejora sin precio | Recomendación emitida |
| Crear cotización | Recepción/comercial | Comercial | construir versión con conceptos y precios | Cotización emitida |
| Aplicar promoción | Actor autorizado | Comercial | aplicar regla comercial vigente | Cotización recalculada/emitida |
| Ajustar precio | Responsable autorizado | Comercial | aceptar o rechazar ajuste con motivo | Precio ajustado de forma trazable |
| Registrar decisión del cliente | Recepción/comercial | Comercial | validar autoridad, versión y concepto | Concepto autorizado/rechazado |
| Autorizar trabajo | Comercial/operación | Comercial/Técnico | derivar alcance ejecutable de decisiones válidas | Trabajo autorizado |
| Iniciar trabajo | Técnico | Técnico | validar alcance y condiciones | Trabajo iniciado |
| Completar trabajo | Técnico | Técnico | registrar ejecución y resultado | Trabajo terminado |
| Solicitar segunda revisión | Técnico/operación | Calidad | entregar trabajo vigente para QC | Equipo enviado a segunda revisión |
| Aprobar control de calidad | Revisor | Calidad | validar criterios y trabajo vigente | QC aprobado |
| Rechazar control de calidad | Revisor | Calidad | registrar fallo y devolución | QC rechazado; equipo devuelto |
| Marcar Listo | Actor autorizado | Workflow | verificar QC aplicable | Equipo marcado Listo |
| Marcar No quedó | Actor autorizado | Workflow | registrar resultado y motivo sin entregar | Equipo marcado No quedó |
| Registrar anticipo | Recepción/caja | Pagos | aceptar movimiento atribuible | Anticipo recibido |
| Notificar cliente | Recepción/atención | Comunicación | comunicar información y registrar resultado | Cliente notificado |
| Iniciar entrega | Recepción | Entrega | validar custodia, receptor y condición financiera | Entrega iniciada |
| Completar entrega | Recepción | Entrega/Custodia | verificar equipo, cobro y legitimación | Equipo entregado; custodia terminada |
| Reimprimir etiqueta | Recepción | Custodia | reponer identificación con el mismo folio | Etiqueta reimpresa |
| Agregar nota | Actor operativo | Trazabilidad | conservar narrativa atribuible | Nota agregada |
| Agregar evidencia | Actor autorizado | Evidencias | vincular evidencia a propósito y contexto | Evidencia agregada |
| Registrar corrección compensatoria | Responsable autorizado | Contexto del hecho | corregir sin borrar original | Corrección registrada |

## Precondiciones, información y errores

| Comando | Precondiciones e información requerida | Error o rechazo de negocio |
|---|---|---|
| Crear orden | nombre, problema reportado, tenant, sucursal, receptor y folio válido | mínimo faltante, contexto inválido o folio duplicado |
| Completar recepción | orden creada, políticas vigentes, excepciones atribuibles | pendiente bloqueante o excepción inválida |
| Identificar equipo | orden existente y medio físico disponible/contingencia | folio ajeno, equipo no correlacionable |
| Mover equipo | custodia vigente, origen/destino válidos, actor y momento | destino inválido, doble movimiento o equipo no localizado |
| Asignar técnico | técnico elegible, orden vigente, alcance | asignación incompatible o contexto de sucursal inválido |
| Registrar evaluación | orden bajo custodia, actor técnico, observaciones/conclusión | conclusión vacía, actor no habilitado o edición de historia |
| Emitir recomendación | evaluación referenciada y necesidad explicada | recomendación sin base técnica o duplicada sin motivo |
| Crear cotización | recomendaciones/alcance, conceptos, precios, política y vigencia | precio sin autoridad, concepto inválido o versión incoherente |
| Aplicar promoción | promoción vigente y conceptos elegibles | combinación no elegible o política fuera de alcance |
| Ajustar precio | actor, motivo, rango y versión | autoridad insuficiente o cambio de versión autorizada |
| Registrar decisión | decisor/contacto, evidencia, concepto y versión vigentes | decisor no autorizado, versión obsoleta o decisión duplicada |
| Autorizar trabajo | decisiones válidas y política de excepción | trabajo no ofrecido/rechazado o condición comercial incompleta |
| Iniciar trabajo | autorización vigente, orden y custodia activas | alcance revocado, pieza/condición faltante |
| Completar trabajo | trabajo iniciado, resultado y participante | ejecución no atribuible o fuera de alcance |
| Solicitar QC | trabajo vigente terminado | trabajo inconcluso u obsoleto |
| Aprobar/rechazar QC | revisión activa, actor, criterios y observaciones | revisión duplicada o trabajo cambiado desde la solicitud |
| Marcar Listo | QC aprobado vigente | QC ausente/rechazado o trabajo posterior |
| Marcar No quedó | motivo y decisión aplicable | inferir entrega o borrar propuestas previas |
| Registrar anticipo | monto, moneda, actor, fecha, sucursal y medio si se conoce | importe inválido, duplicado o contexto ajeno |
| Notificar cliente | destinatario, propósito, canal y contenido autorizado | contacto/consentimiento insuficiente o dato sensible excesivo |
| Iniciar/completar entrega | custodia vigente, equipo, receptor, cobro y actor | doble entrega, saldo no permitido o legitimación insuficiente |
| Reimprimir etiqueta | orden vigente y razón | generar nueva identidad por error |
| Agregar nota | actor, momento, texto y contexto | usar nota para suplantar hecho estructurado |
| Agregar evidencia | propósito, actor, momento, archivo/registro permitido | evidencia sin vínculo, prohibida o fuera de retención |
| Registrar corrección | hecho original, motivo, autoridad y efecto compensatorio | borrado silencioso o corrección sin trazabilidad |

## Decisiones derivadas

- **DDV:** una orden sólo nace al completarse exitosamente su creación; antes no hay custodia formal.
- **DDV:** una decisión comercial se toma por concepto y versión; puede resultar parcial.
- **DDV:** sólo se ejecuta trabajo autorizado, salvo excepción de negocio aún no definida.
- **DDV:** QC y entrega requieren resultados estructurados, no comentarios libres.
- **PM:** los comandos deben ser idempotentes conceptualmente cuando una repetición pueda causar doble pago, doble entrega o duplicidad.
