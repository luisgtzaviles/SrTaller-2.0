# Escenarios end-to-end

## Convención

Los escenarios validan el modelo conceptual, no describen UI ni pruebas técnicas. Cada uno conserva explícitamente contextos, actores, dimensiones operativas, decisiones, reglas y preguntas.

## IDM-ESC-001 — Equipo mojado que queda únicamente con servicio

- **Clasificación:** HOV/DDV; política de cobro RCA.
- **Contextos:** Recepción/Custodia, Técnico, Workflow, Calidad, Comercial, Pagos y Entrega.
- **Actores:** cliente, recepción, técnico, revisor y actor de cobro/entrega.
- **Estado:** Pendiente → trabajo/servicio → segunda revisión → Listo → entregado.
- **Ubicación:** pendientes → Taller → segunda revisión → caja de listos → salida.
- **Custodia:** activa desde creación hasta entrega.
- **Comandos:** crear orden, evaluar, completar servicio, solicitar/aprobar QC, marcar Listo, completar entrega.
- **Eventos:** orden/custodia creadas, evaluación concluida, servicio ejecutado, QC aprobado, equipo entregado.
- **Decisiones:** el servicio resolvió; no se requiere pieza.
- **Invariantes:** conclusión separada del problema; Listo no termina custodia; entrega única.
- **Políticas:** servicio inicial y cobro aplicable.
- **Proyecciones:** estado, ubicación, trabajo ejecutado, saldo y timeline.
- **Inconsistencias posibles:** cobrar pieza inexistente, omitir QC o terminar custodia al marcar Listo.
- **Preguntas abiertas:** evidencia mínima del servicio y criterios QC.

## IDM-ESC-002 — Humedad, pantalla requerida y servicio absorbido

- **Clasificación:** RCA/DDV.
- **Contextos:** Técnico, Comercial, Comunicación, Pagos, Calidad y Entrega.
- **Actores:** técnico, recepción, decisor, revisor y caja.
- **Estado:** diagnóstico → espera de autorización → trabajo → QC → Listo → entregado.
- **Ubicación:** Taller → resguardo/espera → Taller → segunda revisión → caja de listos.
- **Custodia:** activa todo el recorrido hasta entrega.
- **Comandos:** emitir recomendación, cotizar pantalla, registrar autorización, ejecutar, cobrar y entregar.
- **Eventos:** recomendación emitida, concepto autorizado, trabajo terminado, cobro completado, custodia terminada.
- **Decisiones:** pantalla $1,000 autorizada; servicio de $350 absorbido.
- **Invariantes:** precio no altera diagnóstico; total autorizado deriva de política y conceptos.
- **Políticas:** absorción contextual de Avicell.
- **Proyecciones:** total autorizado/cobrado e historial comercial.
- **Inconsistencias posibles:** cobrar $1,350 o reescribir la recomendación.
- **Preguntas abiertas:** alcance exacto y versión de la política por tenant.

## IDM-ESC-003 — Pantalla necesaria y centro de carga recomendado; autorización parcial

- **Clasificación:** DDV.
- **Contextos:** Técnico, Comercial, Comunicación y Ejecución.
- **Actores:** técnico, recepción y decisor.
- **Estado:** diagnóstico → espera de autorización → reparación parcial autorizada.
- **Ubicación:** Taller/resguardo conforme al flujo local.
- **Custodia:** activa.
- **Comandos:** recomendar dos conceptos, cotizar, autorizar pantalla, rechazar centro de carga, autorizar trabajo.
- **Eventos:** cotización emitida, concepto autorizado, concepto rechazado, cotización parcialmente autorizada.
- **Decisiones:** ejecutar sólo pantalla.
- **Invariantes:** rechazo preservado; ejecución no excede autorización.
- **Políticas:** autorización por concepto.
- **Proyecciones:** trabajos autorizados, rechazados y total autorizado.
- **Inconsistencias posibles:** ejecutar el centro de carga o ocultar el rechazo.
- **Preguntas abiertas:** cómo comunicar riesgos de rechazar una recomendación.

## IDM-ESC-004 — Dos flex de $500 ofrecidos juntos por $800

- **Clasificación:** RCA/PC.
- **Contextos:** Comercial, Técnico y Pagos.
- **Actores:** recepción/comercial, gerente si aplica y decisor.
- **Estado:** espera de decisión → autorizado/rechazado.
- **Ubicación:** no cambia por aplicar promoción.
- **Custodia:** activa.
- **Comandos:** crear cotización, aplicar promoción, registrar decisión.
- **Eventos:** cotización emitida y conceptos autorizados/rechazados.
- **Decisiones:** precio combinado sin modificar necesidad técnica.
- **Invariantes:** total explicable; diagnóstico independiente del precio.
- **Políticas:** promoción por paquete, elegibilidad y vigencia.
- **Proyecciones:** precio base, ajuste/promoción y total autorizado.
- **Inconsistencias posibles:** perder precios originales o aplicar $800 a un solo flex.
- **Preguntas abiertas:** decisión conjunta o individual y efecto de autorización parcial.

## IDM-ESC-005 — Gerente modifica manualmente un precio

- **Clasificación:** RCA/PC/PA.
- **Contextos:** Comercial, Identidad/Atribución y Comunicación.
- **Actores:** gerente, recepción y decisor.
- **Estado:** espera de autorización; no debe cambiar sólo por el ajuste.
- **Ubicación:** sin cambio.
- **Custodia:** activa.
- **Comandos:** ajustar precio, emitir nueva versión, registrar decisión.
- **Eventos:** precio ajustado trazablemente, cotización emitida.
- **Decisiones:** autoridad, motivo, alcance y vigencia del ajuste.
- **Invariantes:** no alterar silenciosamente una versión ya autorizada.
- **Políticas:** rango de ajuste manual y autenticación reforzada.
- **Proyecciones:** historial de precios y responsable del ajuste.
- **Inconsistencias posibles:** autorización sobre precio anterior o ajuste sin motivo.
- **Preguntas abiertas:** umbrales y aprobación dual.

## IDM-ESC-006 — Cliente rechaza todo y pasa a No quedó

- **Clasificación:** HOV/DDV.
- **Contextos:** Comercial, Workflow, Comunicación, Pagos y Entrega.
- **Actores:** decisor, recepción y actor de entrega.
- **Estado:** espera de autorización → No quedó → entregado.
- **Ubicación:** resguardo → punto/caja correspondiente → salida.
- **Custodia:** activa en No quedó; termina al entregar.
- **Comandos:** rechazar conceptos, marcar No quedó, notificar, completar entrega.
- **Eventos:** conceptos rechazados, No quedó, equipo entregado, custodia terminada.
- **Decisiones:** ningún trabajo autorizado; cobro de servicio según política.
- **Invariantes:** rechazo preservado; No quedó no termina custodia.
- **Políticas:** cobro al rechazo y entrega.
- **Proyecciones:** razón de No quedó, saldo, pendientes de entrega.
- **Inconsistencias posibles:** cerrar custodia antes de salida o cobrar política equivocada.
- **Preguntas abiertas:** cobro de diagnóstico/servicio y observación de entrega.

## IDM-ESC-007 — Pantalla reparada y micrófono detectado después

- **Clasificación:** DDV.
- **Contextos:** Técnico, Comercial, Workflow y Calidad.
- **Actores:** técnico, recepción y decisor.
- **Estado:** reparación → nueva evaluación → espera de autorización.
- **Ubicación:** Taller/resguardo; no se infiere movimiento.
- **Custodia:** activa.
- **Comandos:** registrar nuevo problema, concluir nueva evaluación, recomendar, cotizar.
- **Eventos:** trabajo de pantalla terminado, nuevo problema detectado, nueva evaluación concluida.
- **Decisiones:** no ejecutar micrófono sin nueva autorización.
- **Invariantes:** misma orden; historia anterior intacta; alcance vigente respetado.
- **Políticas:** autorización adicional.
- **Proyecciones:** iteraciones, trabajos realizados y nueva acción sugerida.
- **Inconsistencias posibles:** sobrescribir diagnóstico inicial o incluir micrófono en autorización previa.
- **Preguntas abiertas:** cuándo un hallazgo requiere detener trabajo o sólo informar.

## IDM-ESC-008 — Segundo diagnóstico autorizado y reparación adicional

- **Clasificación:** DDV.
- **Contextos:** Técnico, Comercial, Calidad y Pagos.
- **Actores:** técnico, recepción, decisor y revisor.
- **Estado:** espera de autorización → reparación → QC.
- **Ubicación:** resguardo → Taller → segunda revisión.
- **Custodia:** activa.
- **Comandos:** autorizar nuevo concepto, iniciar/completar trabajo, solicitar QC.
- **Eventos:** concepto autorizado, trabajo adicional terminado, QC aprobado/rechazado.
- **Decisiones:** nueva versión/alcance explícitos.
- **Invariantes:** autorización refiere propuesta vigente; trabajos separados y atribuibles.
- **Políticas:** precio y pago adicional.
- **Proyecciones:** total autorizado actualizado, historial técnico/comercial.
- **Inconsistencias posibles:** usar autorización antigua o revisar trabajo anterior.
- **Preguntas abiertas:** QC total frente a sólo trabajo adicional.

## IDM-ESC-009 — Segundo diagnóstico rechazado y entrega con observación

- **Clasificación:** DDV/PA.
- **Contextos:** Técnico, Comercial, Trazabilidad y Entrega.
- **Actores:** técnico, recepción, decisor y receptor.
- **Estado:** espera de autorización → No quedó/parcial → entregado.
- **Ubicación:** resguardo → punto de entrega → salida.
- **Custodia:** activa hasta entrega.
- **Comandos:** rechazar concepto, registrar observación, iniciar/completar entrega.
- **Eventos:** concepto rechazado, entrega completada, custodia terminada.
- **Decisiones:** entregar con problema conocido no autorizado.
- **Invariantes:** rechazo e historial técnico permanecen; nota no sustituye decisión.
- **Políticas:** evidencia/aceptación de entrega con observación.
- **Proyecciones:** trabajos ejecutados y recomendaciones pendientes/rechazadas.
- **Inconsistencias posibles:** mostrar “reparado totalmente” o perder la advertencia.
- **Preguntas abiertas:** evidencia y texto requerido al entregar con riesgo conocido.

## IDM-ESC-010 — Segunda revisión rechaza y devuelve a Taller

- **Clasificación:** HOV/DDV.
- **Contextos:** Calidad, Workflow y Técnico.
- **Actores:** revisor, técnico y recepción.
- **Estado:** segunda revisión → trabajo activo; no Listo.
- **Ubicación:** segunda revisión → Taller.
- **Custodia:** activa.
- **Comandos:** rechazar QC, mover equipo, reasignar/completar retrabajo.
- **Eventos:** QC rechazado, equipo devuelto, nuevo trabajo terminado.
- **Decisiones:** motivo y alcance de corrección.
- **Invariantes:** resultado QC estructurado; aprobación anterior no vigente.
- **Políticas:** criterios QC e independencia.
- **Proyecciones:** estado, ubicación, responsable y ciclos QC.
- **Inconsistencias posibles:** conservar Listo o no registrar movimiento.
- **Preguntas abiertas:** intentos máximos y escalamiento.

## IDM-ESC-011 — Múltiples técnicos participan

- **Clasificación:** DDV.
- **Contextos:** Técnico, Workflow e Identidad/Atribución.
- **Actores:** técnicos A/B, responsable operativo y revisor.
- **Estado:** puede permanecer en diagnóstico/reparación.
- **Ubicación:** puede permanecer en Taller.
- **Custodia:** activa.
- **Comandos:** asignar, reasignar, registrar participación y trabajo.
- **Eventos:** técnico asignado, participación registrada, trabajo terminado.
- **Decisiones:** técnico principal/responsable actual según política.
- **Invariantes:** historial no se pierde; asignación no prueba ejecución.
- **Políticas:** simultaneidad y handoff.
- **Proyecciones:** técnico principal y participantes.
- **Inconsistencias posibles:** último nombre sobrescribe autores previos.
- **Preguntas abiertas:** contribución mínima y técnicos simultáneos.

## IDM-ESC-012 — Equipo Listo falla frente al cliente y vuelve a Taller

- **Clasificación:** HOV/DDV.
- **Contextos:** Entrega, Workflow, Técnico y Calidad.
- **Actores:** cliente/receptor, recepción, técnico y revisor.
- **Estado:** Listo → trabajo/diagnóstico → QC → Listo o No quedó.
- **Ubicación:** caja/punto de entrega → Taller.
- **Custodia:** nunca terminó porque no hubo entrega válida.
- **Comandos:** detener entrega, mover, registrar problema, evaluar, volver a QC.
- **Eventos:** nuevo problema detectado, equipo devuelto a Taller, nueva revisión.
- **Decisiones:** si es retrabajo o nueva necesidad comercial.
- **Invariantes:** Listo reversible antes de entrega; historia preservada.
- **Políticas:** cobro/ajuste y QC repetido.
- **Proyecciones:** custodia activa y ubicación Taller.
- **Inconsistencias posibles:** marcar entregado por intento o mantener ubicación caja.
- **Preguntas abiertas:** tratamiento de cobro ya completado sin entrega.

## IDM-ESC-013 — Anticipo recibido por persona distinta a quien creó la orden

- **Clasificación:** DDV/HOV.
- **Contextos:** Pagos, Identidad y Órdenes.
- **Actores:** receptor original, cajero/usuario de pago y pagador.
- **Estado:** puede pasar a espera de pieza/trabajo según política; no por actor original.
- **Ubicación:** sin cambio necesario.
- **Custodia:** activa.
- **Comandos:** registrar anticipo.
- **Eventos:** anticipo recibido.
- **Decisiones:** propósito y aplicación del movimiento.
- **Invariantes:** actor de pago individual, monto/moneda/fecha/sucursal preservados.
- **Políticas:** medios y autoridad de cobro.
- **Proyecciones:** total cobrado, saldo e historial financiero.
- **Inconsistencias posibles:** atribuir pago al creador o sobrescribir anticipo previo.
- **Preguntas abiertas:** identidad del pagador y relación con caja.

## IDM-ESC-014 — Cliente paga y otra persona entrega

- **Clasificación:** DDV/HOV.
- **Contextos:** Pagos, Entrega, Custodia e Identidad.
- **Actores:** pagador/cliente, actor de cobro, actor de entrega y receptor físico.
- **Estado:** Listo → entregado.
- **Ubicación:** caja de listos → salida.
- **Custodia:** termina sólo con entrega, no con pago.
- **Comandos:** registrar pago, iniciar/completar entrega.
- **Eventos:** pago recibido, equipo entregado, custodia terminada.
- **Decisiones:** legitimación del receptor y condición financiera.
- **Invariantes:** cobrar y entregar son hechos/actores distintos.
- **Políticas:** entrega a tercero.
- **Proyecciones:** quién cobró, quién entregó y quién recibió.
- **Inconsistencias posibles:** inferir entrega del pago o atribuirla al cajero.
- **Preguntas abiertas:** evidencia de legitimación de tercero.

## IDM-ESC-015 — Falla de impresora y folio manual

- **Clasificación:** DDV.
- **Contextos:** Recepción/Custodia y Órdenes.
- **Actores:** recepción.
- **Estado:** recepción completada/Pendiente.
- **Ubicación:** recepción → pendientes.
- **Custodia:** activa tras creación.
- **Comandos:** crear orden, identificar por contingencia.
- **Eventos:** orden creada, folio escrito/adherido, equipo identificado.
- **Decisiones:** activar método manual sin crear otra identidad.
- **Invariantes:** impresora no es invariante; equipo siempre identificado.
- **Políticas:** medio alterno y posterior reimpresión.
- **Proyecciones:** identificación vigente/pendiente.
- **Inconsistencias posibles:** dejar equipo sin folio o duplicar orden.
- **Preguntas abiertas:** materiales y verificación de contingencia.

## IDM-ESC-016 — Etiqueta dañada y reimpresión

- **Clasificación:** DDV.
- **Contextos:** Custodia, Workflow y Trazabilidad.
- **Actores:** persona que detecta y recepción/actor autorizado.
- **Estado:** no cambia necesariamente.
- **Ubicación:** no cambia necesariamente.
- **Custodia:** activa.
- **Comandos:** reimprimir etiqueta y confirmar identificación.
- **Eventos:** etiqueta reimpresa.
- **Decisiones:** validar correspondencia equipo–orden.
- **Invariantes:** identidad de orden permanece.
- **Políticas:** autoridad y evidencia de reimpresión.
- **Proyecciones:** última identificación y responsable.
- **Inconsistencias posibles:** adherir folio equivocado o crear nuevo ciclo.
- **Preguntas abiertas:** tratamiento de etiqueta anterior perdida.

## IDM-ESC-017 — Estado y ubicación divergen

- **Clasificación:** DDV/PM.
- **Contextos:** Workflow, Custodia y Reportes.
- **Actores:** personal operativo y responsable de reconciliación.
- **Estado:** por ejemplo Listo.
- **Ubicación:** por ejemplo Taller, distinta de caja de listos.
- **Custodia:** activa.
- **Comandos:** verificar equipo, registrar movimiento/corrección.
- **Eventos:** discrepancia detectada, equipo movido o corrección registrada.
- **Decisiones:** cuál dimensión estaba incorrecta y por qué.
- **Invariantes:** no inferir ubicación desde estado.
- **Políticas:** autoridad y SLA de reconciliación.
- **Proyecciones:** alerta de divergencia y ubicación actual.
- **Inconsistencias posibles:** corrección silenciosa o entrega desde ubicación falsa.
- **Preguntas abiertas:** responsable y frecuencia de inventario físico de equipos.

## IDM-ESC-018 — Equipo se mueve sin registrar movimiento

- **Clasificación:** RCL/PM.
- **Contextos:** Workflow y Custodia.
- **Actores:** persona que movió, quien detecta y responsable operativo.
- **Estado:** sin cambio probado.
- **Ubicación:** real y registrada divergen.
- **Custodia:** activa.
- **Comandos:** reconciliar ubicación y registrar corrección con motivo.
- **Eventos:** discrepancia detectada, movimiento reconstruido/corrección.
- **Decisiones:** aceptar evidencia del movimiento y nueva ubicación.
- **Invariantes:** no inventar actor/momento original; preservar corrección.
- **Políticas:** manejo de movimientos omitidos.
- **Proyecciones:** ubicación con indicador de confianza/frescura.
- **Inconsistencias posibles:** fingir movimiento en tiempo real o culpar actor incorrecto.
- **Preguntas abiertas:** evidencia suficiente y escalamiento.

## IDM-ESC-019 — Intento de entregar dos veces

- **Clasificación:** PM basada en DDV.
- **Contextos:** Entrega, Custodia, Pagos e Identidad.
- **Actores:** dos operadores/receptores posibles.
- **Estado:** entregado tras el primer éxito.
- **Ubicación:** fuera del taller.
- **Custodia:** terminada.
- **Comandos:** completar entrega repetido.
- **Eventos:** una entrega válida; segundo intento rechazado/auditado.
- **Decisiones:** negar repetición y revisar si es corrección legítima.
- **Invariantes:** una sola entrega válida y una terminación de custodia.
- **Políticas:** acción sensible y corrección.
- **Proyecciones:** entregado por/quién recibió.
- **Inconsistencias posibles:** doble salida, doble cobro o ocultar intento.
- **Preguntas abiertas:** autoridad para revertir una entrega errónea.

## IDM-ESC-020 — Mismo dispositivo regresa meses después

- **Clasificación:** DDV.
- **Contextos:** Órdenes, Clientes, Recepción, Garantías.
- **Actores:** cliente y recepción.
- **Estado:** nueva orden en recepción/Pendiente.
- **Ubicación:** nuevo ingreso.
- **Custodia:** nuevo ciclo; la anterior terminó.
- **Comandos:** crear nueva orden y relacionar antecedente si corresponde.
- **Eventos:** nueva orden creada, nueva custodia iniciada.
- **Decisiones:** si es garantía, nueva necesidad o sólo relación histórica.
- **Invariantes:** no reabrir identidad de orden entregada.
- **Políticas:** garantía/posventa.
- **Proyecciones:** historial del dispositivo y órdenes relacionadas.
- **Inconsistencias posibles:** sobrescribir orden vieja o asumir cobertura.
- **Preguntas abiertas:** identidad persistente del dispositivo y cobertura.

## IDM-ESC-021 — Cliente sin teléfono bajo política flexible

- **Clasificación:** PC/DDV.
- **Contextos:** Recepción, Configuración, Clientes y Comunicación.
- **Actores:** cliente y recepción.
- **Estado:** orden puede crearse si mínimos universales están completos.
- **Ubicación:** recepción → pendientes.
- **Custodia:** activa después de creación.
- **Comandos:** crear orden con excepción/no requisito de teléfono.
- **Eventos:** orden creada, contacto no disponible registrado si aplica.
- **Decisiones:** política vigente no exige teléfono.
- **Invariantes:** nombre y problema sí son obligatorios.
- **Políticas:** contacto configurable y canal alterno.
- **Proyecciones:** orden sin canal de contacto y pendiente operativo.
- **Inconsistencias posibles:** bloquear por validación legacy fija o fingir teléfono.
- **Preguntas abiertas:** cómo notificar y entregar sin teléfono.

## IDM-ESC-022 — Tenant exige teléfono, marca e IMEI

- **Clasificación:** PC.
- **Contextos:** Configuración, Recepción y Clientes.
- **Actores:** recepción y administrador de política.
- **Estado:** creación pendiente hasta cumplir o autorizar excepción.
- **Ubicación:** equipo aún no está formalmente bajo custodia antes del éxito.
- **Custodia:** no inicia hasta crear orden.
- **Comandos:** completar recepción o registrar excepción.
- **Eventos:** recepción completada/pendiente; orden creada tras cumplimiento.
- **Decisiones:** versión de política y tratamiento si IMEI no existe.
- **Invariantes:** política no puede fabricar un IMEI ni aceptar custodia parcial silenciosa.
- **Políticas:** campos obligatorios por tenant/sucursal.
- **Proyecciones:** campos pendientes y excepción vigente.
- **Inconsistencias posibles:** orden parcial, valor falso o policy mismatch.
- **Preguntas abiertas:** excepción para equipos sin IMEI.

## IDM-ESC-023 — Equipo irreparable

- **Clasificación:** DDV.
- **Contextos:** Técnico, Comercial, Comunicación, Workflow y Entrega.
- **Actores:** técnico, recepción, cliente y actor de entrega.
- **Estado:** diagnóstico → No quedó → entregado.
- **Ubicación:** Taller → resguardo/punto de entrega → salida.
- **Custodia:** activa hasta entrega.
- **Comandos:** concluir diagnóstico, comunicar, marcar No quedó, entregar.
- **Eventos:** evaluación concluida irreparable, No quedó, equipo entregado.
- **Decisiones:** cobro y tratamiento de piezas/servicio según política.
- **Invariantes:** irreparable no finge reparación; No quedó no termina custodia.
- **Políticas:** cobro de diagnóstico y evidencia.
- **Proyecciones:** resultado técnico, saldo y pendiente de entrega.
- **Inconsistencias posibles:** cerrar sin entrega o borrar recomendaciones previas.
- **Preguntas abiertas:** criterios y segunda opinión.

## IDM-ESC-024 — Diagnóstico no concluyente

- **Clasificación:** DDV/PA.
- **Contextos:** Técnico, Comunicación, Comercial y Workflow.
- **Actores:** técnico, recepción, cliente y posible especialista.
- **Estado:** diagnóstico → espera/decisión → nueva evaluación o devolución.
- **Ubicación:** Taller/resguardo/proveedor externo pendiente.
- **Custodia:** activa; salida externa necesita regla.
- **Comandos:** concluir como no concluyente, recomendar siguiente acción, registrar decisión.
- **Eventos:** evaluación no concluyente, recomendación emitida, decisión registrada.
- **Decisiones:** continuar, enviar a especialista o devolver.
- **Invariantes:** incertidumbre explícita; no presentar certeza falsa.
- **Políticas:** costo, plazo, proveedor externo y autorización.
- **Proyecciones:** resultado y siguiente acción.
- **Inconsistencias posibles:** dejar diagnóstico vacío o marcar irreparable sin evidencia.
- **Preguntas abiertas:** plazos, costos y custodia externa.

## IDM-ESC-025 — Devolución o corrección de anticipo

- **Clasificación:** DDV/PA.
- **Contextos:** Pagos, Comercial, Identidad y Entrega.
- **Actores:** cajero/recepción, gerente si aplica y cliente.
- **Estado:** puede permanecer sin cambio; impacto comercial según caso.
- **Ubicación:** sin cambio necesario.
- **Custodia:** activa hasta entrega.
- **Comandos:** registrar corrección/devolución compensatoria.
- **Eventos:** movimiento compensatorio registrado.
- **Decisiones:** motivo, autoridad, importe y aplicación.
- **Invariantes:** movimiento original no se borra; saldo explicable.
- **Políticas:** devolución, anulación, caja y aprobación.
- **Proyecciones:** total cobrado neto, saldo e historial financiero.
- **Inconsistencias posibles:** editar el anticipo original, saldo negativo inexplicable o doble devolución.
- **Preguntas abiertas:** conciliación, medio de devolución y vínculo contable.

## Cobertura

Los escenarios cubren los 25 recorridos obligatorios. Su validación futura debe usar ejemplos reales y conservar cualquier contradicción nueva en [Contradicciones y tensiones](CONTRADICCIONES_Y_TENSIONES.md) y [Preguntas abiertas](PREGUNTAS_ABIERTAS_PRIORIZADAS.md).
