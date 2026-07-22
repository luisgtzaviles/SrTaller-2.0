# Lenguaje ubicuo preliminar

## Estado documental

- **Estado:** Draft / Discovery con términos delimitados por ADR-004/010
- **Autoridad:** Responsable de Producto sólo para entradas marcadas `D`; las demás no están aprobadas
- **Propietario de decisión:** Product Owner
- **Última revisión:** 2026-07-21
- **Próxima revisión:** Después de la entrevista de dominio

## Uso

Las definiciones con estado I son hipótesis iniciales, P significa comprensión parcial y D identifica un término delimitado por una decisión aceptada. Las preguntas DOMAIN-QUESTION se detallan en [preguntas de dominio](DOMAIN_OPEN_QUESTIONS.md); Q refiere al [registro de producto](../product/OPEN_QUESTIONS.md).

## Organización y acceso

| Término | Definición preliminar | Sinónimos usados | No confundir con | Ejemplo operativo | Validación | Preguntas |
|---|---|---|---|---|---|---|
| Plataforma | Producto SaaS que soporta a varios talleres aislados. | sistema, SR Taller | un tenant o taller | La plataforma suspende una suscripción. | P | Q005, Q023 |
| Tenant | Frontera organizacional y de aislamiento candidata para un negocio cliente. | cuenta, negocio, taller | sucursal o cliente del taller | Un negocio tiene dos sucursales. | P | Q005–Q006 |
| Sucursal | Unidad operativa física o administrativa dentro de un tenant. | tienda, local | ubicación interna de inventario | Una orden se recibe en Centro. | P | DQ-002 |
| Usuario | Identidad operativa ordinaria que pertenece exactamente a un tenant y no se duplica por sucursal. | cuenta, operador | empleado, cliente, PIN, sesión o actor | Una persona se identifica en una estación de su tenant. | D | ADR-004/011 |
| Empleado | Persona que trabaja para el negocio, use o no el sistema. | colaborador, personal | usuario o membresía | Un técnico externo no necesariamente es empleado. | I | Q007, Q010 |
| Membresía | Término histórico ambiguo; no representa un usuario ordinario multi-tenant. | acceso, alta de usuario | usuario, rol o membresía comercial SaaS | El uso debe aclarar si habla de suscripción comercial o acceso. | I | ADR-004/011 |
| Rol | Agrupación administrable de capacidades perteneciente a un tenant. | perfil, puesto | actor, empleo, sesión o responsabilidad | Un rol agrupa capacidades validadas para una función. | D | ADR-012 |
| Asignación de rol | Concesión vigente de un rol a un usuario del mismo tenant, tenant-wide o restringida por sucursal. | membresía, perfil | identidad o sucursal efectiva | Una asignación local sólo aporta capacidades en la sucursal efectiva correspondiente. | D | ADR-012 |
| Capacidad | Facultad concreta para solicitar una operación protegida dentro de un alcance. | permiso | módulo, pantalla o autorización comercial | Capacidad para registrar un pago en la sucursal efectiva. | D | ADR-012 |
| Autorización del sistema | Decisión server-side sobre capacidad, alcance, contexto y recurso. | permiso, control de acceso | autenticación o autorización comercial | El servidor deniega una entrega sin capacidad suficiente. | D | ADR-012 |
| Acción sensible | Operación que puede requerir control reforzado además de una capacidad ordinaria. | acción crítica | toda operación protegida | Una devolución puede requerir reautenticación futura. | D/PA | ADR-012 |
| Estación operativa | Equipo con identidad técnica y vinculación vigente a una única sucursal para aportar contexto. | terminal vinculada, equipo registrado | dispositivo del cliente o usuario | Una tablet de recepción está vinculada a Centro. | D | ADR-010 |
| Terminal | Punto físico o equipo usado para operar o cobrar; cuando aporta contexto se denomina estación operativa. | caja, estación | estación operativa o caja | La terminal del mostrador registra un cobro. | I | Q011, Q022 |
| Sesión de estación | Evidencia técnica vigente de una vinculación de estación. | sesión de terminal | sesión de usuario o contexto operativo | La tablet conserva vínculo tras cambiar operador. | P | ADR-010/Q011 |
| Sesión operativa | Periodo durante el cual un usuario autenticado es el actor activo de una estación dentro del contexto resuelto. | turno, sesión por PIN | identidad, vinculación persistente de estación o caja | Un recepcionista inicia turno en una estación vinculada. | D | ADR-011 |
| PIN | Credencial operativa que identifica al usuario únicamente dentro del tenant ya resuelto por la estación. | clave corta | identidad, permiso o código de acceso del teléfono | El cajero usa PIN en una terminal vinculada. | D | ADR-011 |

## Personas, cliente y dispositivo recibido

| Término | Definición preliminar | Sinónimos usados | No confundir con | Ejemplo operativo | Validación | Preguntas |
|---|---|---|---|---|---|---|
| Cliente | Persona u organización que mantiene relación comercial con el taller. | consumidor, cuenta | contacto, propietario o usuario | El cliente solicita reparar un teléfono ajeno. | I | DQ-004 |
| Contacto | Persona o medio autorizado para una comunicación con propósito definido. | teléfono de contacto, responsable | cliente o propietario | Se avisa al contacto que el equipo está listo. | I | Q018, DQ-004 |
| Propietario del dispositivo | Persona u organización que declara titularidad sobre el equipo. | dueño | cliente o quien recoge | La madre es propietaria y el hijo es contacto. | I | DQ-004 |
| Persona autorizada para recoger | Persona habilitada para recibir físicamente el equipo. | tercero autorizado | propietario o persona que recibe de hecho | El cliente autoriza a su hermana. | I | DQ-014 |
| Dispositivo del cliente | Equipo físico entregado o referido en una operación de servicio. | equipo, teléfono, aparato | estación operativa del sistema | Un teléfono entra con pantalla rota. | I | DQ-005 |
| Tipo de dispositivo | Categoría operativa del equipo. | clase, familia | marca o modelo | Teléfono, tablet o laptop. | I | Q013 |
| Marca | Identidad comercial declarada del fabricante. | fabricante | modelo | Samsung. | I | Q013 |
| Modelo | Denominación de producto declarada o identificada. | referencia | tipo o serie | Galaxy A54. | I | Q013 |
| IMEI | Identificador de red móvil que puede tener cero, uno o varios valores visibles. | número de equipo | serie o folio | Un teléfono dual SIM muestra dos IMEI. | I | DQ-005 |
| Número de serie | Identificador asignado al equipo o componente por fabricante. | serial | IMEI, folio | El serial de una laptop está parcialmente legible. | I | DQ-005 |
| Código de acceso | Secreto que el cliente puede proporcionar para pruebas autorizadas. | patrón, contraseña, clave | PIN del operador | El cliente entrega un patrón temporal. | I | DQ-006 |
| Accesorio recibido | Objeto que acompaña al dispositivo y queda bajo custodia. | cargador, funda, SIM | refacción | Se recibe cargador y funda. | I | Q013 |
| Condición de entrada | Descripción puntual y evidencia del estado al recibir. | estado físico, check-in | diagnóstico o falla reportada | Se registra golpe previo en esquina. | I | DQ-007 |
| Daño físico | Alteración observable de integridad externa o interna. | golpe, quebradura | falla funcional o hallazgo | Cristal quebrado antes de abrir la orden. | I | DQ-007 |
| Falla reportada | Síntoma o problema expresado por cliente/contacto, no confirmado aún. | motivo, queja | diagnóstico o hallazgo | “No enciende desde ayer”. | I | DQ-008 |

## Trabajo técnico y decisión comercial

| Término | Definición preliminar | Sinónimos usados | No confundir con | Ejemplo operativo | Validación | Preguntas |
|---|---|---|---|---|---|---|
| Orden de trabajo | Caso operativo que coordina recepción, evaluación, decisión, intervención y salida. | orden, servicio, ticket | reparación o dispositivo | La orden OT-123 sigue esperando autorización. | I | DQ-001 |
| Folio | Referencia legible para localizar una operación en un alcance. | número de orden, ticket | identidad conceptual interna | El cliente presenta el folio de recepción. | I | Q013 |
| Recepción | Acto y registro de aceptar custodia o iniciar atención. | ingreso, check-in | orden completa | Recepción documenta equipo y accesorios. | I | DQ-007 |
| Diagnóstico | Evaluación técnica que busca explicar falla y trabajo posible. | revisión, valoración | falla reportada o prueba final | El técnico concluye que falla el conector. | I | DQ-008 |
| Hallazgo | Hecho observado durante diagnóstico o intervención. | observación, resultado | opinión o falla reportada | Se detecta corrosión interna. | I | Q014 |
| Evidencia | Registro verificable que sustenta una condición, decisión o acción. | foto, firma, nota | log técnico por sí solo | Foto de daño de entrada. | I | DQ-007 |
| Cotización | Propuesta versionable de alcance, importes y condiciones. | presupuesto | autorización o pago | Cotización v2 añade una pantalla. | I | DQ-009 |
| Partida de cotización | Elemento ofrecido dentro de una versión de cotización. | concepto, línea | servicio completo o refacción física | Cambio de pantalla como una partida. | I | DQ-009 |
| Servicio | Trabajo comercializable descrito para el cliente. | labor, reparación | partida concreta o mano de obra | Servicio de cambio de centro de carga. | I | Q014 |
| Refacción | Componente usado o propuesto para intervenir un equipo. | repuesto, pieza | producto genérico de inventario | Pantalla compatible para el modelo. | I | DQ-010 |
| Mano de obra | Valor o esfuerzo comercial asociado al trabajo humano. | labor | servicio completo | Importe por instalación. | I | Q014 |
| Autorización comercial | Decisión atribuible que permite un alcance y versión concretos de una cotización. | aprobación, visto bueno | autorización del sistema o pago | El propietario aprueba la cotización v2. | I | DQ-011 |
| Rechazo | Decisión de no aceptar una propuesta o reclamación. | declinación | cancelación automática | Cliente rechaza la cotización. | I | Q014 |
| Anticipo | Pago aplicado antes de completar la obligación o entrega. | depósito, apartado | autorización o saldo | El cliente deja 30% para pedir la parte. | I | DQ-012 |
| Asignación técnica | Responsabilidad temporal de una persona o proveedor sobre trabajo. | turnado, responsable | autorización de reparación | La orden se asigna a un técnico. | I | DQ-013 |
| Técnico | Actor que evalúa, interviene o prueba conforme a su alcance. | reparador | vendedor o proveedor | Un técnico completa el diagnóstico. | I | Q013 |
| Intervención | Unidad de actividad técnica trazable sobre el dispositivo. | trabajo, actuación | orden o reparación completa | Se sustituye conector y se prueba carga. | I | DQ-015 |
| Reparación | Resultado o conjunto de intervenciones orientadas a corregir fallas autorizadas. | arreglo, servicio | orden de trabajo | La reparación resuelve una falla, no necesariamente toda la orden. | I | DQ-001 |
| Prueba | Comprobación técnica con objetivo y resultado. | test, verificación | control de calidad completo | Se prueba carga durante 20 minutos. | I | DQ-016 |
| Control de calidad | Evaluación previa a declarar listo el trabajo, con criterios por validar. | QC, revisión final | reparación o prueba aislada | Otro técnico valida funciones acordadas. | I | DQ-016 |
| Retrabajo | Trabajo adicional solicitado por un control fallido sobre la misma intervención. | corrección, repetir | garantía o nueva falla | El equipo vuelve al técnico tras fallar QC. | I | DQ-016 |
| Reparación externa | Trabajo realizado total o parcialmente fuera del taller por tercero. | subcontrato, maquila | transferencia de sucursal | Se envía una placa a microsoldadura. | I | DQ-017 |
| Proveedor externo | Organización o persona ajena que suministra parte o trabajo. | proveedor, especialista | técnico empleado | Laboratorio externo repara placa. | I | Q013, Q015 |

## Estados, cobro, entrega y garantía

| Término | Definición preliminar | Sinónimos usados | No confundir con | Ejemplo operativo | Validación | Preguntas |
|---|---|---|---|---|---|---|
| Estado operativo | Situación del flujo de la orden. | estatus | estado financiero, entrega o garantía | WaitingForPart. | I | DQ-018 |
| Estado financiero | Situación de lo cobrado frente a la obligación. | pago, saldo | estado operativo | PartiallyPaid. | I | DQ-019 |
| Estado de entrega | Situación de preparación, programación y entrega física. | salida | cierre operativo | Listo, programado o entregado. | I | DQ-020 |
| Estado de garantía | Situación de elegibilidad, vigencia o reclamación. | cobertura | estado de orden original | ClaimOpened. | I | DQ-021 |
| Pago | Hecho de recibir o reconocer valor aplicado a una obligación. | abono, cobro | anticipo o facturación SaaS | Se registra pago con tarjeta externa. | I | DQ-012 |
| Método de pago | Forma declarada de entregar valor. | forma de pago | proveedor procesador | Efectivo o terminal externa. | I | Q021 |
| Saldo | Diferencia vigente entre obligación y aplicaciones reconocidas. | adeudo, restante | efectivo en caja | Restan 500 antes de entrega. | I | DQ-019 |
| Devolución | Reversión o retorno de valor previamente recibido. | reembolso | devolución de parte o equipo | Se devuelve un anticipo autorizado. | I | Q021 |
| Caja | Unidad de control de efectivo o cobros cuya naturaleza está pendiente. | terminal, registro | sesión operativa o pago | Se abre caja del mostrador. | I | Q022 |
| Movimiento de caja | Entrada o salida atribuible dentro del control de caja. | movimiento, retiro | pago de orden | Retiro de efectivo con motivo. | I | Q022 |
| Entrega | Transferencia física documentada del dispositivo al receptor. | salida, devolución | ReadyForDelivery o cierre | Tercero autorizado recibe el equipo. | I | DQ-014 |
| Persona que recibe | Persona que efectivamente acepta el equipo en la entrega. | receptor | autorizado previo o propietario | El hermano presenta evidencia y recibe. | I | DQ-014 |
| Evidencia de entrega | Evidencia de persona, momento, condición y acto de entrega. | firma, comprobante | conformidad total | Firma y folio al recoger. | I | DQ-014 |
| Conformidad | Declaración sobre recepción o resultado, cuyo alcance debe ser explícito. | aceptación | renuncia universal de derechos | Cliente confirma recibir el equipo. | I | Q013, Q030 |
| Garantía | Compromiso de cobertura limitado sobre trabajo o parte. | garantía de servicio | reingreso o devolución | Mano de obra cubierta 30 días, hipótesis. | I | DQ-021 |
| Reingreso | Nueva recepción de un dispositivo previamente atendido. | retorno, regreso | reclamación de garantía | El equipo vuelve por una falla distinta. | I | DQ-022 |
| Reclamación de garantía | Solicitud de evaluar si una condición está cubierta. | garantía, reclamo | garantía aceptada | Cliente reporta la misma falla en vigencia. | I | DQ-021 |

## Inventario, comunicación y modelado

| Término | Definición preliminar | Sinónimos usados | No confundir con | Ejemplo operativo | Validación | Preguntas |
|---|---|---|---|---|---|---|
| Inventario | Capacidad de controlar catálogo, disponibilidad y movimientos. | stock, almacén | catálogo por sí solo | La sucursal consulta disponibilidad. | I | Q015–Q016 |
| Producto | Elemento catalogado que puede comprarse, venderse o consumirse. | artículo, SKU | refacción concreta o existencia | Catálogo de pantallas compatibles. | I | DQ-010 |
| Existencia | Cantidad reconocida en un alcance y ubicación. | stock, disponible | reserva o producto | Hay una pantalla disponible en Centro. | I | Q015 |
| Reserva | Compromiso temporal de cantidad para un propósito. | apartado | consumo | Se aparta una pantalla para OT-123. | I | DQ-023 |
| Consumo | Hecho de aplicar una cantidad de refacción al trabajo. | salida, uso | reserva o merma | La pantalla se instala en la orden. | I | DQ-023 |
| Devolución a inventario | Retorno reconocido de una cantidad no consumida. | reintegro | devolución de pago | Parte reservada vuelve a disponible. | I | Q016 |
| Merma | Reducción por pérdida, daño o inutilidad documentada. | desperdicio, baja | consumo productivo | Adhesivo vencido se registra como merma. | I | Q016 |
| Movimiento de inventario | Hecho que explica un cambio de cantidad o ubicación. | entrada, salida, ajuste | saldo aislado | Transferencia o consumo con motivo. | I | Q016 |
| Conversación | Continuidad de interacción con participantes y ownership por definir. | chat, hilo | mensaje o notificación | Recepción conversa sobre la orden. | I | Q020 |
| Canal | Medio o configuración por la que se intercambian comunicaciones. | WhatsApp, SMS, email | proveedor | Un número de WhatsApp de sucursal. | I | Q019 |
| Mensaje | Comunicación durable entrante o saliente. | texto, chat | notificación o evento de dominio | Cliente aprueba mediante un mensaje. | I | Q020 |
| Asignación de conversación | Responsabilidad de atender una conversación. | responsable, bandeja | asignación técnica | Recepción toma la conversación. | I | Q020 |
| Notificación | Aviso derivado dirigido a una audiencia, no necesariamente conversación. | alerta, recordatorio | evento de dominio o mensaje | Aviso interno de equipo listo. | I | Q017–Q020 |
| Evento de dominio | Hecho de negocio relevante expresado en pasado. | hecho, suceso | comando, estado, log o clic | QuoteApproved. | P | DQ-024 |
| Comando | Intención atribuible de producir un cambio. | solicitud, acción | evento ocurrido | ApproveQuote. | P | DQ-024 |
| Regla de negocio | Política candidata que condiciona una decisión o resultado. | política, condición | invariante absoluta | Entrega con adeudo requiere excepción. | I | DQ-025 |
| Invariante | Condición que debe conservarse dentro de un límite definido. | restricción esencial | preferencia o instrucción visual | Una autorización apunta a una versión. | I | DQ-025 |

## Ambigüedades que deben resolverse antes de diseño

| Contraste | Riesgo | Pregunta |
|---|---|---|
| Reparación vs. orden de trabajo | Confundir resultado técnico con caso coordinador | DQ-001 |
| Equipo vs. dispositivo | Mezclar aparato del cliente con terminal del sistema | DQ-005 |
| Cliente vs. propietario | Atribuir derechos o consentimiento incorrectos | DQ-004 |
| Diagnóstico vs. falla reportada | Presentar un síntoma como conclusión técnica | DQ-008 |
| Servicio vs. partida | Mezclar oferta reutilizable y línea de una versión | DQ-009 |
| Refacción vs. producto de inventario | Suponer que toda pieza ofrecida tiene stock propio | DQ-010 |
| Listo vs. terminado | Mezclar trabajo técnico concluido con disponibilidad de entrega | DQ-020 |
| Entregado vs. cerrado | Omitir pagos, evidencia o follow-up posterior | DQ-018 |
| Garantía vs. reingreso | Presuponer cobertura antes de evaluarla | DQ-021–DQ-022 |
| Anticipo vs. pago | Ocultar que todo anticipo es pago, pero no todo pago es anticipo | DQ-012 |
| Sucursal vs. ubicación | Usar frontera organizacional como sitio de stock | DQ-002 |
| Dispositivo del cliente vs. estación operativa | Cruzar dominio de reparación con identidad/acceso | DQ-003 y DQ-005 |

## Regla de evolución

Un término sólo cambia a Validated by Product Owner o Approved cuando exista respuesta, ejemplo, autoridad y documentos afectados. Hasta entonces, toda definición de esta página continúa siendo provisional.
