# Entrevista de dominio para el Product Owner

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Uso

Éste es el entregable principal del discovery. Propone seis sesiones cortas en lenguaje del taller. Conviene responder con un caso real, una excepción y quién tomó la decisión. Las opciones son ejemplos comunes, no recomendaciones. Toda respuesta y decisión derivada permanece TBD.

## Sesión 1 — Cliente y recepción

**Objetivo:** entender desde la llegada hasta el comprobante de custodia.

| ID y pregunta | Por qué importa | Ejemplo práctico | Opciones comunes | Respuesta del Product Owner | Decisión derivada | Documentos a actualizar |
|---|---|---|---|---|---|---|
| POI-1.1 ¿Cómo llega una persona y en qué momento pasa a considerarse cliente? | define inicio e identidad comercial | consulta precio y luego deja equipo | al consultar; al dar datos; al abrir orden; al pagar | TBD | TBD | Language, Concepts, Workflow |
| POI-1.2 ¿Qué datos mínimos se piden y qué hacen si parece duplicado? | evita mínimos falsos y perfiles partidos | mismo nombre y teléfono distinto | teléfono obligatorio; nombre+referencia; registro temporal; revisión manual | TBD | TBD | Rules, Questions, Scenarios |
| POI-1.3 ¿Cómo distinguen cliente, propietario, contacto y quien entrega? | cada relación puede tener autoridad distinta | madre paga, hijo usa, padre entrega | una sola persona; relaciones separadas; autorizado por acción | TBD | TBD | Actors, Language, RULE-003 |
| POI-1.4 ¿Un cliente puede tener varios dispositivos y cómo reconocen uno que vuelve? | define continuidad sin depender de IMEI | teléfono sin serie vuelve meses después | IMEI/serie; rasgos+historial; nueva identidad; revisión manual | TBD | TBD | CustomerDevice, Values, DQ-005 |
| POI-1.5 ¿Qué condición, daño, fotografías y accesorios se registran al entrar? | establece custodia y evidencia | equipo mojado con cargador y funda | checklist fijo; según servicio; fotos siempre; fotos por riesgo | TBD | TBD | Intake, RULE-004, Events |
| POI-1.6 ¿Cuándo piden código de acceso y qué ocurre si el cliente no lo da? | protege secreto y define pruebas posibles | teléfono bloqueado para probar cámara | nunca; sólo con permiso; temporal; pruebas limitadas | TBD | TBD | RULE-005, DevicePasscode, DQ-006 |
| POI-1.7 ¿Se necesita firma o autorización inicial y qué permite exactamente? | no debe confundirse recepción con autorización de reparación | firma acepta diagnóstico, no cambio de pantalla | custodia; diagnóstico; monto preautorizado; trabajo completo | TBD | TBD | Authorization, Rules, Interview decisions |
| POI-1.8 ¿Cómo se asigna folio y qué contiene el comprobante de recepción? | permite localizar y devolver sin filtrar datos | cliente presenta ticket para seguimiento | folio tenant; por sucursal; secuencia; referencia no secuencial | TBD | TBD | Folio, Delivery, Traceability |

**Cierre de sesión:** narrar un ingreso normal y uno con propietario distinto, daño previo y sin código.

## Sesión 2 — Diagnóstico y cotización

**Objetivo:** delimitar la evaluación, la oferta y la decisión del cliente.

| ID y pregunta | Por qué importa | Ejemplo práctico | Opciones comunes | Respuesta del Product Owner | Decisión derivada | Documentos a actualizar |
|---|---|---|---|---|---|---|
| POI-2.1 ¿Cuándo se diagnostica y quién puede hacerlo? | define autoridades y rutas abreviadas | recepción reconoce una mica rota; técnico revisa placa | técnico siempre; recepción para casos simples; externo; según servicio | TBD | TBD | Actors, Diagnosis, States |
| POI-2.2 ¿El diagnóstico es gratuito, pagado o depende del resultado? | cambia obligación y cancelación | cliente rechaza después de revisión profunda | gratis; tarifa fija; descontable; por complejidad | TBD | TBD | Quote, Payment, RULE-006 |
| POI-2.3 ¿Puede haber varios diagnósticos y cómo se conserva una conclusión inconclusa? | evita sobrescribir conocimiento | segundo técnico contradice al primero | uno revisable; evaluaciones separadas; supervisor decide | TBD | TBD | Diagnosis aggregate, DQ-026 |
| POI-2.4 ¿Cómo distinguen falla reportada de hallazgo técnico? | impide prometer una causa no comprobada | cliente dice batería; hallazgo es conector | texto separado; categorías; resultado por falla | TBD | TBD | Language, EVENT-011, Scenarios |
| POI-2.5 ¿Cuándo se cotiza de inmediato sin diagnóstico formal? | determina si el paso es obligatorio | cambio visible de cristal con precio conocido | nunca; servicios estándar; bajo monto; con reserva de cambio | TBD | TBD | Workflow, States, DQ-008 |
| POI-2.6 ¿Qué partidas y alternativas puede contener una cotización y cuánto dura? | define versiones y aprobación parcial | parte original o compatible con precios distintos | una oferta; opciones excluyentes; servicio+parte; vigencia fija/variable | TBD | TBD | Quote, QuoteLine, RULE-007 |
| POI-2.7 ¿Qué cambio obliga a revisar la cotización? | preserva lo aceptado y efecto del anticipo | al abrir aparece corrosión y otra parte | cualquier cambio; cambio de total; cambio de alcance; umbral | TBD | TBD | Quote states, EVENT-015, Payments |
| POI-2.8 ¿Quién puede aprobar o rechazar, total o parcialmente, y qué evidencia vale? | fija consentimiento atribuible | contacto responde por WhatsApp “sólo pantalla” | firma; mensaje; llamada registrada; código; propietario sólo | TBD | TBD | Authorization, RULE-008, DQ-011 |

**Cierre de sesión:** narrar una cotización inmediata, una con diagnóstico inconcluso y otra modificada después de un anticipo.

## Sesión 3 — Reparación y técnicos

**Objetivo:** comprender responsabilidad, trabajo real, partes y calidad.

| ID y pregunta | Por qué importa | Ejemplo práctico | Opciones comunes | Respuesta del Product Owner | Decisión derivada | Documentos a actualizar |
|---|---|---|---|---|---|---|
| POI-3.1 ¿Qué se asigna a un técnico: orden, falla, reparación o intervención? | determina ownership y granularidad | hardware y software van con personas distintas | orden completa; por falla; por etapa; cola común | TBD | TBD | Assignment, Aggregates, DQ-013 |
| POI-3.2 ¿Cómo se define prioridad y quién puede cambiarla? | evita cola implícita y favoritismo no trazado | equipo urgente desplaza trabajo normal | llegada; promesa; tipo; supervisor; SLA comercial | TBD | TBD | Rules, Actors, Contexts |
| POI-3.3 ¿Cómo se reasigna y qué debe dejar el técnico anterior? | conserva responsabilidad y continuidad | técnico se ausenta con equipo abierto | nota de handoff; revisión; supervisor; reasignación automática | TBD | TBD | RULE-010, EVENT-021, INV-016 |
| POI-3.4 ¿Qué estados usan realmente y qué significa esperar refacción? | valida la máquina operativa | parte pedida sin fecha | pausada; esperando parte; externa; esperando cliente | TBD | TBD | State Machines, Workflow |
| POI-3.5 ¿Cómo funciona una reparación externa? | custodia y responsabilidad salen del taller | placa se envía a laboratorio | proveedor por orden; técnico externo; subcontrato; cliente gestiona | TBD | TBD | External Repair, DQ-017 |
| POI-3.6 ¿Cuándo se reserva y consume una refacción, incluida una aportada por cliente? | afecta stock, costo y garantía | última pantalla se aparta y luego no se usa | al autorizar; al asignar; al instalar; sin reservas | TBD | TBD | InventoryReservation, RULE-011 |
| POI-3.7 ¿Cómo registran reparación fallida, retrabajo o daño causado durante trabajo? | evita ocultar resultados y responsabilidad | conector se daña al desmontar | mismo caso; incidente; nueva autorización; compensación | TBD | TBD | Interventions, Exceptions, Audit |
| POI-3.8 ¿Qué incluye control de calidad y quién puede declarar el equipo listo? | separa terminado de listo | técnico termina; supervisor prueba cámaras y carga | mismo técnico; otro técnico; checklist por servicio; supervisor | TBD | TBD | QC, RULE-012, DQ-016/028 |

**Cierre de sesión:** narrar un trabajo con espera, reasignación, parte del cliente, fallo de QC y retrabajo.

## Sesión 4 — Pagos y entrega

**Objetivo:** entender flujo de valor, custodia y final de la orden.

| ID y pregunta | Por qué importa | Ejemplo práctico | Opciones comunes | Respuesta del Product Owner | Decisión derivada | Documentos a actualizar |
|---|---|---|---|---|---|---|
| POI-4.1 ¿Cuándo se pide anticipo y qué autoriza o reserva? | un pago no debe implicar consentimiento ambiguo | 30% para pedir pantalla | sólo pago; reserva parte; confirma oferta; política por monto | TBD | TBD | RULE-009, Payment, Authorization |
| POI-4.2 ¿Se permiten múltiples pagos y qué métodos usan? | define saldo, caja y reconciliación | anticipo efectivo y resto en terminal | efectivo; referencia externa; transferencia; mezcla | TBD | TBD | Payment states, Cash context |
| POI-4.3 ¿Cómo se calcula saldo cuando cambian cotización, descuento o devolución? | evita cifras irreconciliables | v2 baja total tras anticipo | obligación vigente; créditos; reembolso; aplicación manual | TBD | TBD | INV-011, RULE-013, Quote |
| POI-4.4 ¿Quién autoriza descuentos, devoluciones y condonaciones? | son acciones financieras sensibles | gerente perdona mano de obra por demora | umbral; supervisor; doble aprobación; no permitir | TBD | TBD | Actors, RULE-020, IAM inputs |
| POI-4.5 ¿Puede entregarse con adeudo y cómo se sigue? | cambia regla de custodia y cierre | cliente empresarial paga después | nunca; crédito; excepción por gerente; convenio | TBD | TBD | RULE-014, DQ-019, States |
| POI-4.6 ¿Quién puede recoger y qué evidencia se verifica/conserva? | evita entregar a persona equivocada | tercero trae folio pero no identificación | autorización previa; código; identificación; confirmación al propietario | TBD | TBD | Delivery, RULE-015, RecipientEvidence |
| POI-4.7 ¿Qué hacen con equipos no recogidos o abandonados? | define custodia, avisos y revisión legal | pasan meses después de estar listo | avisos; almacenamiento; cargo; disposición; nunca disponer | TBD | TBD | RULE-019, DQ-030, Exceptions |
| POI-4.8 ¿Cuándo termina la orden: al quedar lista, entregar, pagar o resolver pendientes? | distingue hitos y métricas | equipo entregado con reembolso pendiente | entrega; pago; ambos; cierre manual; periodo posterior | TBD | TBD | WorkOrder states, DQ-018/020 |

**Cierre de sesión:** narrar entrega por tercero, pago mixto, saldo pendiente, devolución y equipo no recogido.

## Sesión 5 — Garantía

**Objetivo:** delimitar cobertura, evaluación y relación con el historial.

| ID y pregunta | Por qué importa | Ejemplo práctico | Opciones comunes | Respuesta del Product Owner | Decisión derivada | Documentos a actualizar |
|---|---|---|---|---|---|---|
| POI-5.1 ¿Cuándo inicia garantía y cuánto dura? | listo, entrega y cierre dan fechas distintas | equipo listo lunes y recogido viernes | al reparar; al entregar; al pagar; por servicio/parte | TBD | TBD | WarrantyPeriod, EVENT-040 |
| POI-5.2 ¿Qué cubre: mano de obra, parte, falla o toda la orden? | evita cobertura total implícita | parte del cliente falla después | por partida; por intervención; por falla; orden completa | TBD | TBD | Warranty, RULE-016 |
| POI-5.3 ¿Qué exclusiones existen y quién puede aplicarlas? | una exclusión necesita evidencia y autoridad | golpe nuevo después de entrega | daño nuevo; humedad; parte del cliente; uso indebido | TBD | TBD | Rules, Actors, Evidence |
| POI-5.4 ¿Todo regreso es reingreso y cuándo abre reclamación de garantía? | solicitud no equivale a cobertura aceptada | vuelve por cámara tras reparar carga | misma falla; cualquier falla; evaluación inicial; nueva orden | TBD | TBD | Reentry, RULE-017, DQ-022 |
| POI-5.5 ¿Cómo se diagnostica una reclamación y quién decide aceptarla? | separa técnico de autoridad comercial | técnico encuentra golpe no registrado | técnico; supervisor; gerente; proveedor de parte | TBD | TBD | Warranty states, EVENT-042/043 |
| POI-5.6 ¿Qué ocurre al rechazar garantía? | puede requerir nueva oferta sin borrar reclamo | falla no relacionada necesita cotización | cerrar; nueva orden; cotizar en mismo caso; apelación | TBD | TBD | Exceptions, Quote relationship |
| POI-5.7 ¿Cómo se trata trabajo o refacción adicional durante garantía? | cobertura puede ser parcial | parte cubierta exige otra no cubierta | cubrir todo; cotizar diferencia; autorización nueva; proveedor responde | TBD | TBD | Inventory, Quote, Warranty |
| POI-5.8 ¿Cuándo se cierra la reclamación y qué historial debe conservarse? | define resultado y auditoría | reclamo aceptado termina tras prueba y entrega | al reparar; QC; entrega; conformidad; plazo | TBD | TBD | WarrantyClaim, EVENT-044, Traceability |

**Cierre de sesión:** narrar una garantía aceptada, una rechazada y una parcialmente cubierta.

## Sesión 6 — Sucursales y excepciones

**Objetivo:** probar límites con operación distribuida y casos vividos.

| ID y pregunta | Por qué importa | Ejemplo práctico | Opciones comunes | Respuesta del Product Owner | Decisión derivada | Documentos a actualizar |
|---|---|---|---|---|---|---|
| POI-6.1 ¿Puede recibirse en una sucursal y repararse en otra? | origen, custodia y técnico pueden divergir | Centro recibe y Norte tiene especialista | no; transferencia; encargo interno; proveedor | TBD | TBD | Branch, Workflow, DQ-031 |
| POI-6.2 ¿Qué se transfiere con la orden y quién aprueba/recibe el traspaso? | mover referencia no mueve equipo ni obligaciones | traslado con accesorios y anticipo | equipo+orden; sólo trabajo; recepción doble; cadena de custodia | TBD | TBD | RULE-021, Events, Invariants |
| POI-6.3 ¿El inventario es compartido o sólo visible entre sucursales? | disponibilidad y ownership no son iguales | Norte presta pantalla a Centro | stock local; reserva remota; transferencia; catálogo común | TBD | TBD | Inventory context, DQ-023 |
| POI-6.4 ¿Un técnico trabaja en varias sucursales y desde cuál consume/asume trabajo? | evita operar en contexto equivocado | técnico itinerante cubre dos tiendas | una asignación; varias con sucursal activa; tenant-wide | TBD | TBD | Actors, IAM inputs, RULE-021 |
| POI-6.5 ¿Puede pagarse una orden en otra sucursal? | caja y obligación podrían tener alcances distintos | cliente paga saldo en la tienda cercana | no; cualquier sucursal; sólo métodos no efectivo; transferencia interna | TBD | TBD | Payments, Cash, DQ-031 |
| POI-6.6 ¿Puede entregarse en otra sucursal y cómo se conserva custodia? | la salida física necesita evidencia local | equipo se traslada para recogida | no; traslado previo; entrega programada; tercero | TBD | TBD | Delivery, Branch, INV-005 |
| POI-6.7 ¿Qué permisos y auditoría exige cada excepción multisucursal? | acceso amplio no debe surgir por traslado | gerente autoriza entrega fuera de origen | permiso por acción; supervisor; doble confirmación; tenant-wide | TBD | TBD | RULE-020/021, Audit, Actors |
| POI-6.8 ¿Qué excepciones reales han ocurrido en SR Taller y cuál fue el peor resultado? | descubre casos ausentes sin canonizar el legado | parte equivocada, entrega errónea o pago duplicado | narrar frecuencia, impacto, respuesta y evidencia | TBD | TBD | Status findings, Exceptions, Scenarios |

**Cierre de sesión:** escoger dos incidentes reales, reconstruir actores, decisiones y hechos, y marcar qué práctica anterior debe conservarse, cambiarse o investigarse.

## Registro posterior a cada sesión

| Sesión | Participantes | Casos aportados | Respuestas documentadas | Decisiones pendientes creadas/actualizadas | Follow-up especializado | Fecha |
|---|---|---|---|---|---|---|
| 1 | TBD | TBD | TBD | TBD | TBD | TBD |
| 2 | TBD | TBD | TBD | TBD | TBD | TBD |
| 3 | TBD | TBD | TBD | TBD | TBD | TBD |
| 4 | TBD | TBD | TBD | TBD | TBD | TBD |
| 5 | TBD | TBD | TBD | TBD | TBD | TBD |
| 6 | TBD | TBD | TBD | TBD | TBD | TBD |

## Condición de validación

Una respuesta no se convierte automáticamente en decisión aprobada. Debe registrar autoridad, ejemplo, excepción, efecto en preguntas/reglas/estados y documentos actualizados.
