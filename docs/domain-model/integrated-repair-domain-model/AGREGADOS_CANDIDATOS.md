# Agregados candidatos

## Criterio de evaluación

**PM:** un agregado candidato representa una frontera posible de consistencia e invariantes; no equivale a tabla, clase, endpoint, servicio o documento. El objetivo es evitar tanto la fragmentación arbitraria como una Orden de Servicio monolítica.

## Responsabilidad, identidad y consistencia

| Candidato | Responsabilidad | Identidad candidata | Consistencia e invariantes que protegería | Estado |
|---|---|---|---|---|
| Orden de Servicio | identidad y ciclo global | identidad interna + folio en alcance | una identidad por ciclo; no reusar tras entrega | Candidato fuerte |
| Recepción | mínimos y aceptación del ingreso | identidad ligada a la orden | datos universales y contexto de recepción completos | Candidato fuerte |
| Ciclo de Custodia | inicio, vigencia y terminación | orden + número de ciclo | una custodia vigente; entrega válida la termina | Candidato fuerte |
| Evaluación Diagnóstica | una evaluación con conclusión | orden + iteración | conclusión atribuible y no sobrescrita | Candidato fuerte |
| Recomendación Técnica | necesidades derivadas de evaluación | recomendación/versión | conservar origen técnico y componentes | Candidato débil; posible parte de evaluación |
| Cotización | versión comercial y conceptos | cotización + versión | precios y conceptos de una versión coherentes | Candidato fuerte |
| Decisión del Cliente | decisión atribuible por concepto | decisión | referir concepto y versión vigentes | Candidato débil; posible parte de cotización |
| Ejecución de Trabajo | alcance autorizado y resultado | trabajo | no exceder autorización; preservar resultado | Candidato fuerte |
| Control de Calidad | revisión independiente del trabajo | revisión | resultado, actor y trabajo vigente coherentes | Candidato fuerte |
| Entrega | legitimación, cobro y salida | intento/entrega | una sola entrega válida; terminar custodia | Candidato fuerte |
| Movimiento de Pago | hecho financiero y correcciones | movimiento | monto, moneda, actor y orden atribuibles | Candidato fuerte |
| Cliente | identidad operativa y contactos | cliente operativo | correcciones y deduplicación controladas | Candidato fuerte, pendiente de identidad |
| Dispositivo | continuidad descriptiva del equipo | identidad de dispositivo candidata | no confundir IMEI ausente con falta de identidad | Candidato débil |
| Política de Recepción | requisitos vigentes por alcance | política + versión | no desactivar invariantes universales | Candidato fuerte |
| Política Comercial | absorción, promoción y ajustes | política + versión | explicar cálculo aplicable en un momento | Candidato fuerte |
| Ubicación Operativa | catálogo y vigencia de ubicación | ubicación por sucursal | pertenencia a sucursal y estado de uso | Candidato débil; posible catálogo |
| Asignación Técnica | responsabilidad temporal e historial | asignación | periodos y participantes no se pisan | Candidato fuerte |
| Evidencia | archivo, propósito y metadatos | evidencia | vinculación y autoría sin alterar el hecho sustentado | Candidato débil |

**Clasificación de las filas:** PM. Las invariantes referidas provienen de DDV cuando están validadas.

## Comandos, eventos e información externa

| Candidato | Comandos principales | Eventos relevantes | Información externa requerida |
|---|---|---|---|
| Orden de Servicio | Crear orden, registrar hito, cerrar ciclo | Orden creada, ciclo concluido | tenant, sucursal, receptor, recepción válida |
| Recepción | Completar recepción, corregir dato atribuible | Recepción completada | política vigente, cliente y equipo |
| Ciclo de Custodia | Iniciar/terminar custodia | Custodia iniciada/terminada | creación de orden, entrega válida |
| Evaluación Diagnóstica | Iniciar/concluir evaluación | Evaluación iniciada/concluida | orden activa, actor técnico |
| Recomendación | Emitir/revisar recomendación | Recomendación emitida | conclusión técnica vigente |
| Cotización | Crear/revisar cotización, aplicar promoción | Cotización emitida/reemplazada | recomendación, política y autoridad de precio |
| Decisión del Cliente | Autorizar/rechazar concepto | Concepto autorizado/rechazado | decisor, evidencia y cotización vigente |
| Ejecución de Trabajo | Autorizar, iniciar, completar trabajo | Trabajo autorizado/iniciado/terminado | conceptos autorizados y piezas |
| Control de Calidad | Solicitar, aprobar, rechazar | QC aprobado/rechazado | trabajo vigente y criterios |
| Entrega | Iniciar/completar entrega | Entrega iniciada/equipo entregado | receptor, condición financiera y custodia |
| Movimiento de Pago | Registrar, corregir, devolver | Anticipo/pago/compensación registrado | medio, actor, sucursal y obligación |
| Cliente | Registrar/corregir cliente o contacto | Cliente/contacto registrado | política de identificación y comunicación |
| Dispositivo | Registrar rasgos/identificadores | Dispositivo descrito | observaciones e identificadores disponibles |
| Política de Recepción | Publicar/reemplazar política | Política de recepción vigente | autoridad y alcance |
| Política Comercial | Publicar política/promoción | Política comercial vigente | autoridad y alcance |
| Ubicación Operativa | Crear/desactivar ubicación | Ubicación disponible/no disponible | sucursal y autoridad |
| Asignación Técnica | Asignar/reasignar/finalizar | Técnico asignado/participación registrada | técnico elegible y orden |
| Evidencia | Agregar/corregir clasificación | Evidencia agregada | archivo, propósito, actor y retención |

**Clasificación:** PM. “Evento” es conceptual y no implica publicación externa.

## Riesgo de tamaño y alternativas

| Candidato | Riesgo de ser demasiado grande o pequeño | Alternativa de separación |
|---|---|---|
| Orden | absorber todo el ciclo y bloquear colaboración | conservar sólo identidad/hitos y delegar detalles |
| Recepción/Custodia | duplicar identidad y tiempos | separar acto de recepción de ciclo de custodia o mantenerlos coordinados |
| Evaluación/Recomendación | forzar recomendación aun sin conclusión suficiente | recomendación como entidad opcional de la evaluación |
| Cotización/Decisión | reescribir versión al decidir | decisión inmutable referida a una versión |
| Trabajo | mezclar autorización, ejecución y QC | trabajo autorizado y ejecución bajo una frontera; QC separado |
| Entrega | incluir toda cobranza | validar condición financiera mediante información externa, no poseer pagos |
| Cliente/Dispositivo | construir un maestro prematuro de propiedad | equipo recibido como snapshot de orden y enlace opcional a dispositivo reconocido |
| Políticas | una política universal con cientos de flags | políticas temáticas versionadas por alcance |
| Asignación | confundir responsable actual con historial de participación | asignaciones temporales + participaciones por contribución |
| Evidencia | convertir cada archivo en agregado aislado sin regla propia | entidad bajo catálogo/documento, con referencias estables |

**Clasificación:** PM. **RCL:** los riesgos responden a campos mutables y mezcla de responsabilidades observados en legacy.

## Invariantes que no deben concentrarse en una sola frontera

- **DDV:** creación de orden e inicio de custodia deben coordinarse, pero no obligan a que todo el ciclo sea un agregado único.
- **DDV:** autorización por concepto pertenece a la decisión comercial; el trabajo sólo valida su alcance.
- **DDV:** QC gobierna su resultado; Workflow refleja el hito sin fabricar la aprobación.
- **DDV:** entrega termina custodia; Pagos conserva sus movimientos y no “entrega” el equipo.
- **PM:** las fronteras finales deben probarse con concurrencia y escenarios, no deducirse de nombres.
