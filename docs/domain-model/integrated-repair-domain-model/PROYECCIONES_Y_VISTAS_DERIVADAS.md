# Proyecciones y vistas derivadas

## Principio

**PM:** una proyección resume hechos para una tarea de lectura. Puede reconstruirse o actualizarse después y no es necesariamente fuente de verdad. La interfaz futura no queda definida aquí.

## Catálogo de proyecciones

| Proyección | Deriva de | Uso | Riesgo si se trata como verdad |
|---|---|---|---|
| Cabecera de orden | orden, cliente, equipo y recepción | identificación rápida | perder versiones o roles de persona |
| Quién recibió | creación/recepción | atribución | confundir actor con responsable actual |
| Técnico principal | asignaciones/participaciones + regla | lectura rápida | borrar varios técnicos |
| Técnicos participantes | participaciones | historial técnico | inferir responsabilidad por presencia |
| Quién revisó | última revisión vigente | QC | usar campo “revisor” sin acto de QC |
| Quién entregó | entrega válida | custodia | inferir desde usuario que editó estado |
| Estado actual | transiciones válidas | tablero operativo | mezclar ubicación o custodia |
| Ubicación actual | último movimiento confirmado | localizar equipo | ocultar movimiento faltante |
| Custodia actual | creación/entrega | responsabilidad física | derivar sólo de Listo/No quedó |
| Saldo | obligaciones y movimientos | cobro/entrega | ignorar devoluciones o aplicación |
| Total autorizado | decisiones por concepto + política | alcance comercial | usar precio final mutable |
| Total cobrado | movimientos financieros válidos | conciliación básica | asumir caja/contabilidad completa |
| Trabajos autorizados | decisiones y versiones | habilitar ejecución | incluir concepto rechazado/obsoleto |
| Trabajos ejecutados | ejecuciones atribuibles | resultado técnico | equiparar con lo cotizado |
| Pendientes | workflow, decisiones y políticas | siguiente acción | ocultar causa o responsable |
| Última interacción | comunicaciones | atención al cliente | confundir intento con contacto exitoso |
| Siguiente acción sugerida | estado + política + pendientes | coordinación | automatizar una decisión no validada |
| Timeline completo | eventos, notas y actividad tipados | explicación integral | mezclar semánticas |
| Historial comercial | cotizaciones, decisiones, promociones | explicar oferta/autorización | perder versiones |
| Historial técnico | evaluaciones, recomendaciones, trabajos, QC | continuidad técnica | sobrescribir conclusión anterior |
| Historial financiero | movimientos y compensaciones | explicar cobros | tratar saldo como contabilidad |

**Clasificación de todas las filas:** PM; los riesgos RCL reflejan límites legacy.

## Reglas de derivación

- **PM:** toda proyección declara fuentes y regla de selección.
- **PM:** “actual” incluye momento de cálculo o frescura observable.
- **DDV:** el técnico resumen no borra participaciones.
- **DDV:** una nota no alimenta por sí sola autorización, QC, pago o entrega.
- **PM:** ante discrepancia, se conserva la alerta y se corrige la fuente mediante acción atribuible.

## Proyecciones críticas frente a informativas

| Nivel | Ejemplos | Exigencia conceptual |
|---|---|---|
| Crítica para decisión | custodia, total autorizado, trabajos autorizados, saldo, QC vigente | debe confirmar fuentes vigentes antes de ejecutar acción sensible |
| Operativa | estado, ubicación, pendientes, responsable | puede requerir reconciliación visible |
| Informativa | cabecera, técnicos participantes, timeline | puede actualizarse después sin cambiar hechos |
| Analítica | BI e indicadores | nunca gobierna directamente una transición |

**Clasificación:** PM.
