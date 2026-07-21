# Políticas de dominio

## Distinción

**DDV:** una invariante universal no se vuelve opcional mediante configuración. **PC:** una política determina variaciones permitidas por tenant o sucursal. **RCA:** una práctica de Avicell sólo se aplica universalmente si existe una decisión posterior explícita.

## Catálogo consolidado

| Política | Alcance candidato | Contenido | Clasificación | Estado/pregunta |
|---|---|---|---|---|
| Recepción | tenant/sucursal | requisitos adicionales y excepciones de ingreso | PC | precedencia y versionado abiertos |
| Campos obligatorios | universal + configurable | nombre y problema universales; otros datos variables | DDV / PC | apellido pendiente/configurable |
| Identificación física | universal con contingencia | todo equipo bajo custodia conserva folio adherido | DDV | método alterno permitido |
| Evidencia | tenant/sucursal/riesgo | tipos, momento, obligatoriedad, pendiente y retención | PC | fotografías son posteriores; bloqueos abiertos |
| Servicio inicial | tenant | significado de autorización inicial | PC / RCA | nombre canónico pendiente |
| Absorción de servicio | tenant | absorbido, acumulado, cobrado al rechazo, nunca cobrado u otra variante | PC / RCA | Avicell usa absorción contextual |
| Promociones | tenant/sucursal | combinaciones preestablecidas y elegibilidad | PC | autoridad y vigencia abiertas |
| Ajuste manual | tenant/sucursal | rangos, responsables, motivo y trazabilidad | PC | permisos y doble aprobación abiertos |
| Autorización | universal + configurable | decisor, evidencia, vigencia, parcialidad y excepción | DDV / PC | trabajos de bajo costo abiertos |
| Control de calidad | tenant/sucursal | criterios, independencia y actor revisor | PC / RCA | Avicell usa recepción; independencia obligatoria abierta |
| Entrega | universal + configurable | legitimación, cobro, verificación y excepciones | DDV / PC | tercero, crédito e identificación abiertos |
| Sesiones e inactividad | tenant/seguridad | PIN, expiración y revalidación | RCA / PC | controles de seguridad pendientes |
| Ubicaciones por sucursal | sucursal | catálogo, transiciones y lugares permitidos | PC | catálogo definitivo abierto |
| Asignación técnica | tenant/sucursal | elegibilidad, técnico principal y reasignación | PC | simultaneidad abierta |
| Retención de actividad | tenant/legal | conservación de eventos, notas, evidencias y correcciones | PC | plazos y derecho de acceso abiertos |
| Excepciones | universal + alcance autorizado | motivo, actor, vigencia, impacto y cierre | PC / PA | catálogo y autoridades bloqueantes |

## Reglas por alcance

| Alcance | Puede definir | No puede invalidar |
|---|---|---|
| Universal | identidad, custodia, atribución mínima y preservación histórica | no aplica; es el piso del dominio |
| Tenant | operación comercial, recepción adicional, QC y autorización | mínimos universales, aislamiento y trazabilidad |
| Sucursal | ubicaciones, capacidades locales y requisitos adicionales permitidos | reglas universales ni política tenant más restrictiva sin autorización |
| Avicell | práctica actual documentada | no se presume aplicable a otros tenants |
| Pendiente | punto aún no decidido | no debe implementarse como default silencioso |

**Clasificación:** PM para la precedencia exacta; DDV para no desactivar invariantes; PC/RCA para variaciones.

## Versionado y aplicabilidad

- **PM:** cada decisión sensible debería poder explicar qué política y versión se aplicó.
- **PM:** cambiar una política no debe reescribir decisiones históricas.
- **PA:** definir fecha de vigencia, herencia, precedencia y tratamiento de órdenes en curso.
- **RCL:** el legacy mezcla defaults, configuración JSON, validaciones fijas y efectos posteriores; no es una política completa.

## Política contextual de Avicell

**RCA:** en el ejemplo de humedad, un servicio inicial de $350 sólo se cobra si resuelve por sí mismo; si se autoriza una pantalla de $1,000, el cliente paga $1,000, no $1,350. Esta absorción no altera el diagnóstico y no es universal.

**RCA:** Avicell permite ofrecer dos flex de $500 cada uno por $800 en conjunto y realizar ajustes manuales. **PC:** una evolución profesional debería distinguir promociones preestablecidas de ajustes manuales autorizados y trazables.
