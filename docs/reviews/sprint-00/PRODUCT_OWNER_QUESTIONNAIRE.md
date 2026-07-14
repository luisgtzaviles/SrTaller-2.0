# Cuestionario dirigido para el Product Owner

## Estado del documento

- **Estado:** Borrador para sesión de decisión.
- **Naturaleza:** Instrumento de revisión; no sustituye el registro canónico ni constituye aprobación.
- **Cobertura:** QUESTION-001 a QUESTION-034, cada una ubicada en un gate primario.
- **Respuestas y decisiones:** Todas permanecen `TBD`.

## Cómo usar este cuestionario

Este documento transforma las preguntas del [registro canónico](../../product/OPEN_QUESTIONS.md) en decisiones pequeñas y operativas. Los identificadores con sufijo `.a`, `.b` y posteriores son **subidentificadores de revisión**: ayudan a contestar una pregunta compuesta, pero no crean ni reemplazan IDs canónicos. El estado sólo cambia en el registro original después de documentar respuesta, evidencia y decisión.

Una recomendación preliminar es una **propuesta**, no una regla aprobada. Cuando una respuesta dependa de investigación de usuarios, asesoría legal, threat modeling o un prototipo, el Product Owner debe decidir dirección y prioridad, no inventar la evidencia especializada.

Las preguntas transversales aparecen una sola vez:

- QUESTION-005 se decide primariamente en Gate 2 y condiciona Gate 6.
- QUESTION-008 se decide en Gate 2 y condiciona Gates 3 y 4.
- QUESTION-025 se decide en Gate 6 y condiciona Gates 1 y 7.
- QUESTION-026 se decide en Gate 7, usando el mercado seleccionado en Gate 1.
- QUESTION-029 se decide en Gate 3 y alimenta Gate 7.
- QUESTION-030 se decide en Gate 1 y restringe Gate 7.
- QUESTION-033 y QUESTION-034 se deciden en Gate 4 y condicionan la arquitectura de datos de Gate 7.

## Gate 1 — Producto inicial

### [QUESTION-001](../../product/OPEN_QUESTIONS.md#question-001) — Segmento inicial

- **Subpreguntas de revisión:**
  - `QUESTION-001.a`: ¿qué tipo de taller atenderemos primero?
  - `QUESTION-001.b`: ¿qué tamaño, número de sucursales y madurez operativa lo caracterizan?
  - `QUESTION-001.c`: ¿quién compra, quién decide y quién usa el producto en ese segmento?
  - `QUESTION-001.d`: ¿qué segmentos quedan explícitamente para después?
- **Por qué importa:** evita diseñar simultáneamente para operaciones con necesidades, presupuesto y complejidad incompatibles.
- **Ejemplo operativo:** un taller de una sucursal donde una persona recibe, repara y cobra necesita una experiencia distinta de una cadena con recepción, técnicos y caja separados.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Una sucursal | Reduce coordinación inicial, pero no valida operación multisucursal. |
| Multisucursal | Valida alcance y supervisión, con mayor complejidad de acceso y datos. |
| Segmento escalonado | Conserva una dirección amplia, pero exige fijar con precisión la primera cohorte. |
| Otro segmento sustentado por investigación | Puede ofrecer mejor encaje, pero requiere evidencia antes de priorizar. |

- **Recomendación preliminar — propuesta:** elegir una sola cohorte inicial y documentar exclusiones; no asumir todavía si debe ser mono o multisucursal sin evidencia comercial y operativa.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Visión](../../product/PRODUCT_VISION.md), [actores](../../product/ACTORS_AND_PERSONAS.md), [alcance](../../product/PRODUCT_SCOPE.md), [epics](../../backlog/EPICS.md).

### [QUESTION-002](../../product/OPEN_QUESTIONS.md#question-002) — Resultado y evidencia de éxito

- **Subpreguntas de revisión:**
  - `QUESTION-002.a`: ¿qué resultado de negocio u operación debe mejorar primero?
  - `QUESTION-002.b`: ¿qué comportamiento observable mostrará que mejoró?
  - `QUESTION-002.c`: ¿qué línea base, población y periodo se necesitan?
  - `QUESTION-002.d`: ¿qué señales de seguridad y calidad son guardrails, no métricas de vanidad?
- **Por qué importa:** sin resultado observable no se puede comparar alcance, priorizar excepciones ni evaluar una entrega.
- **Ejemplo operativo:** “tener módulo de reparaciones” no demuestra valor; “el personal autorizado puede ubicar estado y responsable sin reconstrucción manual” sí puede observarse.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Resultado operativo | Orienta el flujo diario; necesita línea base del taller. |
| Seguridad y control | Reduce riesgo; por sí solo no demuestra adopción o valor comercial. |
| Experiencia del cliente | Puede diferenciar el servicio; exige interacción o comunicación medible. |
| Resultado comercial | Valida sostenibilidad; depende de planes, precio y cohortes. |
| Combinación priorizada | Equilibra valor y riesgo, siempre que tenga una señal principal. |

- **Recomendación preliminar — propuesta:** elegir un resultado principal del recorrido, acompañado de guardrails de aislamiento, autorización y confiabilidad; dejar metas numéricas `TBD` hasta obtener línea base.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Visión](../../product/PRODUCT_VISION.md), [principios](../../product/PRODUCT_PRINCIPLES.md), [alcance](../../product/PRODUCT_SCOPE.md), [Product Backlog](../../backlog/PRODUCT_BACKLOG.md).

### [QUESTION-003](../../product/OPEN_QUESTIONS.md#question-003) — Problema, recorrido y primer release

- **Subpreguntas de revisión:**
  - `QUESTION-003.a`: ¿qué problema operativo concreto resolveremos primero?
  - `QUESTION-003.b`: ¿qué actor inicia el recorrido y qué resultado lo termina?
  - `QUESTION-003.c`: ¿el recorrido incluye cliente, equipo recibido, reparación, cobro, inventario y entrega, o sólo una parte explícita?
  - `QUESTION-003.d`: ¿qué excepciones son imprescindibles para que sea utilizable?
  - `QUESTION-003.e`: ¿qué capacidades quedan fuera del primer release?
- **Por qué importa:** define el corte vertical que condiciona dominio, permisos, datos, pruebas y arquitectura.
- **Ejemplo operativo:** recepción de un teléfono, diagnóstico, autorización, trabajo y entrega puede ser un recorrido; agregar venta de mostrador y CRM crea recorridos distintos.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Recepción a entrega | Valida el núcleo de taller; pagos e inventario pueden mantenerse mínimos. |
| Reparación más cobro | Ofrece cierre comercial, pero añade reglas financieras y de caja. |
| Venta de mostrador | Valida inventario/venta, pero no el problema diferencial de reparación. |
| Secuencia incremental | Reduce lotes si cada incremento termina en un resultado utilizable. |

- **Recomendación preliminar — propuesta:** evaluar primero recepción–entrega de reparación y añadir sólo el registro de pago o consumo de partes indispensable; excluir venta independiente, CRM y automatización comercial salvo evidencia contraria.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Alcance](../../product/PRODUCT_SCOPE.md), [fuera de alcance](../../product/OUT_OF_SCOPE.md), [glosario](../../product/DOMAIN_GLOSSARY.md), [mapa de módulos](../../product/MODULE_MAP.md), [backlog](../../backlog/PRODUCT_BACKLOG.md).

### [QUESTION-030](../../product/OPEN_QUESTIONS.md#question-030) — Mercado y obligaciones aplicables

- **Subpreguntas de revisión:**
  - `QUESTION-030.a`: ¿cuál es el país o mercado inicial?
  - `QUESTION-030.b`: ¿qué obligaciones de privacidad, consumo, fiscalidad y pagos deben investigarse?
  - `QUESTION-030.c`: ¿qué requisitos de incidentes, contratos o seguridad exige ese mercado?
  - `QUESTION-030.d`: ¿qué capacidades deben limitarse hasta obtener revisión competente?
- **Por qué importa:** una obligación de mercado puede cambiar datos, consentimiento, documentos, proveedores y despliegue antes de escribir código.
- **Ejemplo operativo:** habilitar mensajes o comprobantes en un país sin definir consentimiento, retención o responsabilidad fiscal puede bloquear el lanzamiento.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Un país inicial | Acota revisión y proveedores; pospone cobertura internacional. |
| Base común con extensiones | Facilita expansión, pero requiere separar claramente lo común de lo local. |
| Limitar capacidades pendientes | Reduce exposición; puede disminuir valor del primer release. |
| Varios mercados desde inicio | Amplía oportunidad, con costo legal y operativo mucho mayor. |

- **Recomendación preliminar — propuesta:** seleccionar un mercado inicial y solicitar revisión especializada; el Product Owner no debe cerrar obligaciones legales por inferencia documental.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Visión](../../product/PRODUCT_VISION.md), [alcance](../../product/PRODUCT_SCOPE.md), [seguridad](../../architecture/SECURITY_BASELINE.md), [datos](../../architecture/DATA_ARCHITECTURE.md), [despliegue](../../architecture/DEPLOYMENT_STRATEGY.md).

## Gate 2 — Modelo organizacional

### [QUESTION-005](../../product/OPEN_QUESTIONS.md#question-005) — Tenant y ciclo de vida

- **Subpreguntas de revisión:**
  - `QUESTION-005.a`: ¿qué organización o relación comercial representa un tenant?
  - `QUESTION-005.b`: ¿quién lo crea y cómo se establece el primer administrador?
  - `QUESTION-005.c`: ¿qué estados operativos existen y quién los cambia?
  - `QUESTION-005.d`: ¿qué permiten suspensión, reactivación, cierre y recuperación?
  - `QUESTION-005.e`: ¿qué ocurre con exportación, retención y eliminación al cerrar?
- **Por qué importa:** el tenant es frontera de aislamiento y también sujeto de operación, soporte y suscripción.
- **Ejemplo operativo:** suspender por mora no debería borrar datos ni conceder a soporte acceso irrestricto; debe existir una conducta conocida.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Alta asistida | Reduce abuso y complejidad inicial; requiere operación manual. |
| Autoservicio | Escala onboarding; exige verificación, antifraude y recuperación robustas. |
| Alta por plataforma | Conserva control; crea dependencia del equipo operador. |
| Cierre con exportación y retención | Facilita salida responsable; necesita política y jobs específicos. |

- **Recomendación preliminar — propuesta:** para un piloto, alta asistida o por plataforma, estados explícitos y suspensión reversible; no decidir eliminación sin QUESTION-025 y revisión legal.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [mapa de módulos](../../product/MODULE_MAP.md), [multitenancy](../../architecture/MULTITENANCY_MODEL.md), [datos](../../architecture/DATA_ARCHITECTURE.md).

### [QUESTION-006](../../product/OPEN_QUESTIONS.md#question-006) — Datos y configuración por tenant o sucursal

- **Subpreguntas de revisión:**
  - `QUESTION-006.a`: ¿qué entidades son tenant-wide y cuáles pertenecen a sucursal?
  - `QUESTION-006.b`: ¿la sucursal es owner, procedencia, ubicación o filtro para cada entidad?
  - `QUESTION-006.c`: ¿qué puede consultar o modificar otra sucursal?
  - `QUESTION-006.d`: ¿qué configuración es global, de tenant o de sucursal y qué precedencia tiene?
- **Por qué importa:** evita duplicados, filtrado incorrecto y permisos ambiguos en todos los módulos.
- **Ejemplo operativo:** un cliente puede ser compartido en el tenant, mientras una existencia física y una caja pertenecen a una ubicación concreta.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Principalmente tenant-wide | Facilita vista unificada; exige scopes de sucursal explícitos. |
| Principalmente por sucursal | Simplifica operación local; genera duplicados y transferencias. |
| Híbrido por entidad | Modela mejor el negocio; requiere una matriz mantenida como decisión. |

- **Recomendación preliminar — propuesta:** modelo híbrido explícito por entidad; no usar `branch_id` de forma uniforme ni como sustituto de `tenant_id`.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [mapa de módulos](../../product/MODULE_MAP.md), [multitenancy](../../architecture/MULTITENANCY_MODEL.md), [datos](../../architecture/DATA_ARCHITECTURE.md), [configuración conceptual](../../product/MODULE_MAP.md#configuration).

### [QUESTION-007](../../product/OPEN_QUESTIONS.md#question-007) — Personas y operación multisucursal

- **Subpreguntas de revisión:**
  - `QUESTION-007.a`: ¿una membresía puede pertenecer a una o varias sucursales?
  - `QUESTION-007.b`: ¿existe una sola sucursal activa por sesión?
  - `QUESTION-007.c`: ¿qué permisos permiten visión tenant-wide?
  - `QUESTION-007.d`: ¿cómo trabaja personal itinerante o un gerente multisucursal?
- **Por qué importa:** determina navegación, autorización, reportes y prevención de operaciones en la sucursal equivocada.
- **Ejemplo operativo:** un técnico que cubre dos sucursales puede consultarlas, pero debe quedar claro dónde registra una reparación o consume una parte.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Una sucursal por membresía | Es simple; duplica o limita a personal itinerante. |
| Varias asignadas con selección activa | Equilibra flexibilidad y contexto; exige cambio visible y auditado. |
| Acceso a todas por permiso | Facilita supervisión; eleva riesgo de consultas o mutaciones amplias. |
| Combinación explícita | Atiende roles distintos; requiere permisos y UX coherentes. |

- **Recomendación preliminar — propuesta:** varias asignaciones cuando el segmento lo necesite, una sucursal activa para mutaciones branch-scoped y permiso separado para agregación tenant-wide.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Actores](../../product/ACTORS_AND_PERSONAS.md), [identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [sucursales y dispositivos](../../architecture/BRANCH_AND_DEVICE_MODEL.md), [multitenancy](../../architecture/MULTITENANCY_MODEL.md).

### [QUESTION-008](../../product/OPEN_QUESTIONS.md#question-008) — Cambio de sucursal y transferencias

- **Subpreguntas de revisión:**
  - `QUESTION-008.a`: ¿cómo se reasigna un dispositivo entre sucursales?
  - `QUESTION-008.b`: ¿qué sesiones se cierran y qué aprobación se exige?
  - `QUESTION-008.c`: ¿qué ocurre con reparación, caja o trabajo abierto?
  - `QUESTION-008.d`: ¿cómo se transfieren inventario o casos, independientemente del dispositivo?
  - `QUESTION-008.e`: ¿se permite transferir un dispositivo entre tenants?
- **Por qué importa:** la pregunta actual mezcla confianza del equipo con reglas de transferencia de datos de negocio.
- **Ejemplo operativo:** mover una tablet de recepción no debe mover automáticamente reparaciones ni existencias de su sucursal anterior.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Revocar y vincular de nuevo | Es segura y simple; añade fricción operativa. |
| Reasignación aprobada | Conserva historial; exige cierre de sesiones y controles. |
| Transferencia programada | Permite preparar el cambio; requiere estados y manejo de pendientes. |
| Prohibir con operaciones abiertas | Reduce inconsistencia; puede bloquear una necesidad urgente. |

- **Recomendación preliminar — propuesta:** reasignación controlada sólo dentro del mismo tenant, cerrando sesiones; entre tenants, revocación y nueva vinculación. Tratar transferencias de dominio por separado.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Sucursales y dispositivos](../../architecture/BRANCH_AND_DEVICE_MODEL.md), [identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [mapa de módulos](../../product/MODULE_MAP.md), [auditoría conceptual](../../product/MODULE_MAP.md#audit).

## Gate 3 — Identidad y operación

### [QUESTION-004](../../product/OPEN_QUESTIONS.md#question-004) — Acciones sensibles y autoridad

- **Subpreguntas de revisión:**
  - `QUESTION-004.a`: ¿qué acciones del primer recorrido son sensibles?
  - `QUESTION-004.b`: ¿quién puede ejecutarlas y quién puede aprobar una excepción?
  - `QUESTION-004.c`: ¿qué control corresponde: permiso, umbral, reautenticación o doble aprobación?
  - `QUESTION-004.d`: ¿quién aprueba excepciones a principios de producto y arquitectura?
- **Por qué importa:** mezcla gobierno documental con supervisión operativa; ambos necesitan autoridades distintas y trazables.
- **Ejemplo operativo:** anular un pago y aprobar una excepción al principio de aislamiento no son la misma clase de decisión.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Permiso específico | Es explicable; puede producir un catálogo amplio. |
| Umbral y supervisor | Ajusta control al riesgo; exige ownership y evidencia. |
| Doble aprobación | Protege acciones extremas; aumenta demora y complejidad. |
| Reserva tenant/plataforma | Simplifica delegación; concentra privilegios. |

- **Recomendación preliminar — propuesta:** matriz por riesgo con permiso explícito y reautenticación; usar aprobación dual sólo donde el daño justifique la fricción. Separar gobierno de principios del catálogo operativo.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Principios](../../product/PRODUCT_PRINCIPLES.md), [actores](../../product/ACTORS_AND_PERSONAS.md), [identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [seguridad](../../architecture/SECURITY_BASELINE.md).

### [QUESTION-009](../../product/OPEN_QUESTIONS.md#question-009) — Identidad global y varios tenants

- **Subpreguntas de revisión:**
  - `QUESTION-009.a`: ¿una persona tiene identidad global o una identidad por tenant?
  - `QUESTION-009.b`: ¿qué identificadores son únicos y en qué alcance?
  - `QUESTION-009.c`: ¿cómo se selecciona o cambia el tenant?
  - `QUESTION-009.d`: ¿qué perfil, recuperación y privacidad se comparten entre tenants?
- **Por qué importa:** cambia autenticación, modelo de datos, recuperación, enumeración y experiencia de cambio de contexto.
- **Ejemplo operativo:** la misma persona puede administrar dos negocios sin que uno descubra su pertenencia al otro.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Identidad global con membresías | Simplifica acceso múltiple; requiere privacidad y selector de contexto robustos. |
| Identidad por tenant | Aísla experiencia; duplica credenciales y recuperación. |
| Global con alias/proveedores vinculados | Ofrece flexibilidad; aumenta resolución y fusión de identidades. |
| Federación futura | Posibilita empresas; no resuelve el modelo inicial por sí sola. |

- **Recomendación preliminar — propuesta:** conservar la separación conceptual identidad–membresía; evaluar identidad global con membresías, sin aceptarla hasta revisar privacidad, recuperación y experiencia multi-tenant.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [multitenancy](../../architecture/MULTITENANCY_MODEL.md), [contexto del sistema](../../architecture/SYSTEM_CONTEXT.md).

### [QUESTION-010](../../product/OPEN_QUESTIONS.md#question-010) — Roles, permisos y excepciones

- **Subpreguntas de revisión:**
  - `QUESTION-010.a`: ¿qué roles base necesita el primer recorrido?
  - `QUESTION-010.b`: ¿se permiten roles personalizados?
  - `QUESTION-010.c`: ¿se permiten permisos directos a una membresía?
  - `QUESTION-010.d`: ¿cómo funcionan denegaciones, overrides y alcance tenant/sucursal?
  - `QUESTION-010.e`: ¿qué combinaciones están prohibidas por separación de funciones?
- **Por qué importa:** toda capacidad funcional depende de una autorización comprensible y administrable.
- **Ejemplo operativo:** un técnico puede actualizar diagnóstico sin poder cambiar costos, anular pagos ni administrarse permisos.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Roles predefinidos | Facilitan soporte; pueden no representar talleres diversos. |
| Roles personalizados | Mejoran ajuste; elevan complejidad y riesgo. |
| Permisos directos | Resuelven excepciones; son difíciles de auditar a escala. |
| Condiciones/atributos | Expresan contexto; hacen más compleja la explicación y prueba. |

- **Recomendación preliminar — propuesta:** plantillas de roles y roles personalizados acotados; posponer grants directos y denegaciones complejas salvo caso validado. Todo permiso declara alcance.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Actores](../../product/ACTORS_AND_PERSONAS.md), [identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [mapa de módulos](../../product/MODULE_MAP.md), [pruebas de seguridad](../../quality/SECURITY_TESTING.md).

### [QUESTION-011](../../product/OPEN_QUESTIONS.md#question-011) — Vinculación y confianza de dispositivos

- **Subpreguntas de revisión:**
  - `QUESTION-011.a`: ¿qué tipos de equipo pueden o deben vincularse?
  - `QUESTION-011.b`: ¿qué flujos exigen dispositivo autorizado y cuáles no?
  - `QUESTION-011.c`: ¿quién inicia y aprueba la vinculación?
  - `QUESTION-011.d`: ¿qué evidencia demuestra posesión y pertenencia?
  - `QUESTION-011.e`: ¿cómo se bloquea, pierde, revoca o retira un equipo?
- **Por qué importa:** la confianza del dispositivo afecta onboarding, soporte, riesgo y velocidad de trabajo en estaciones compartidas.
- **Ejemplo operativo:** una computadora de recepción compartida puede usar PIN; la administración remota quizá no deba exigir esa estación.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Código temporal | Es simple; debe protegerse contra reutilización y phishing. |
| Enrolamiento desde consola | Da control administrativo; requiere otro dispositivo ya autenticado. |
| Enlace o invitación | Facilita remoto; aumenta exposición del canal de entrega. |
| Gestión externa futura | Aporta control empresarial; no sirve como dependencia inicial general. |

- **Recomendación preliminar — propuesta:** desafío de uso único aprobado por una membresía autorizada; exigir dispositivo sólo en flujos operativos seleccionados y validar el modelo mediante threat modeling.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Sucursales y dispositivos](../../architecture/BRANCH_AND_DEVICE_MODEL.md), [identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [seguridad](../../architecture/SECURITY_BASELINE.md), [alcance](../../product/PRODUCT_SCOPE.md).

### [QUESTION-012](../../product/OPEN_QUESTIONS.md#question-012) — PIN y autenticación reforzada

- **Subpreguntas de revisión:**
  - `QUESTION-012.a`: ¿el PIN identifica, autentica o revalida al operador?
  - `QUESTION-012.b`: ¿qué sesión crea y cuánto dura?
  - `QUESTION-012.c`: ¿qué acciones nunca permite por sí solo?
  - `QUESTION-012.d`: ¿cómo funcionan intentos, bloqueo, cambio y recuperación?
  - `QUESTION-012.e`: ¿cómo se cambia de operador sin heredar datos o permisos?
- **Por qué importa:** un PIN ágil puede mejorar operación, pero también facilitar suplantación si se convierte en credencial universal.
- **Ejemplo operativo:** un cajero entra por PIN en una terminal vinculada, pero una devolución exige reautenticación reforzada.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Sólo seleccionar operador | Reduce autoridad del PIN; necesita otro factor vigente. |
| Sesión operativa acotada | Agiliza turnos; exige expiración, bloqueo y revocación server-side. |
| PIN más step-up | Equilibra velocidad y riesgo; añade flujo de autenticación sensible. |
| Reautenticación por riesgo | Es flexible; requiere catálogo y señales confiables. |

- **Recomendación preliminar — propuesta:** PIN membership-scoped sólo en dispositivo autorizado, creando una sesión breve y sin autorizar acciones sensibles; validar mediante [SPIKE-005](./PROTOTYPE_CANDIDATES.md#spike-005) si el flujo entra al release.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [sucursales y dispositivos](../../architecture/BRANCH_AND_DEVICE_MODEL.md), [seguridad](../../architecture/SECURITY_BASELINE.md).

### [QUESTION-029](../../product/OPEN_QUESTIONS.md#question-029) — Amenazas y acceso administrativo excepcional

- **Subpreguntas de revisión:**
  - `QUESTION-029.a`: ¿qué amenazas del primer recorrido se priorizan?
  - `QUESTION-029.b`: ¿qué puede observar soporte sin contenido del tenant?
  - `QUESTION-029.c`: ¿cuándo puede acceder a un tenant y con qué consentimiento o aprobación?
  - `QUESTION-029.d`: ¿se permite impersonación, acceso de emergencia o ambos?
  - `QUESTION-029.e`: ¿qué evidencia y revisión posterior son obligatorias?
- **Por qué importa:** soporte necesita resolver incidentes sin convertirse en una vía rutinaria de acceso transversal.
- **Ejemplo operativo:** soporte consulta salud y correlación sin leer mensajes; una intervención con contenido requiere motivo, alcance, tiempo y auditoría.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Sin contenido por defecto | Minimiza exposición; puede alargar diagnóstico. |
| Acceso just-in-time | Permite resolver casos; requiere elevación, caducidad y revisión. |
| Consentimiento del tenant | Mejora control; puede no estar disponible en emergencia. |
| Doble aprobación | Reduce abuso; aumenta tiempo de respuesta. |
| Impersonación prohibida | Evita ambigüedad; requiere herramientas de soporte específicas. |

- **Recomendación preliminar — propuesta:** metadatos sin contenido por defecto, elevación just-in-time limitada y auditada; no permitir impersonación silenciosa.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Actores](../../product/ACTORS_AND_PERSONAS.md), [identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [multitenancy](../../architecture/MULTITENANCY_MODEL.md), [seguridad](../../architecture/SECURITY_BASELINE.md), [incidentes](../../operations/INCIDENT_MANAGEMENT.md).

## Gate 4 — Dominio central

### [QUESTION-013](../../product/OPEN_QUESTIONS.md#question-013) — Cliente, equipo y flujo de reparación

- **Subpreguntas de revisión:**
  - `QUESTION-013.a`: ¿qué representa un cliente y cómo se manejan contactos o duplicados?
  - `QUESTION-013.b`: ¿qué datos y evidencia se capturan del equipo recibido?
  - `QUESTION-013.c`: ¿reparación y orden de trabajo son el mismo concepto o tienen cardinalidad propia?
  - `QUESTION-013.d`: ¿cuándo inicia y termina el caso?
  - `QUESTION-013.e`: ¿qué estados, pausas, cancelación, entrega y reapertura existen?
  - `QUESTION-013.f`: ¿cómo se asigna y transfiere el trabajo?
- **Por qué importa:** define el lenguaje e invariantes del recorrido central antes de diseñar tablas, endpoints o pantallas.
- **Ejemplo operativo:** un cliente entrega un teléfono con accesorios; el taller registra recepción, asigna diagnóstico y posteriormente entrega o cancela el caso.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Flujo único acotadamente configurable | Facilita soporte; puede no cubrir variantes reales. |
| Flujo base con excepciones | Equilibra consistencia y operación; exige excepciones explícitas. |
| Estados derivados de hitos | Reduce transiciones arbitrarias; necesita reglas claras de derivación. |
| Variantes por trabajo | Modela diversidad; aumenta prueba y configuración. |

- **Recomendación preliminar — propuesta:** flujo base con pocas excepciones explícitas; decidir primero reparación frente a orden y usar ejemplos reales antes de permitir configuración por tenant.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [actores](../../product/ACTORS_AND_PERSONAS.md), [mapa de módulos](../../product/MODULE_MAP.md), [datos](../../architecture/DATA_ARCHITECTURE.md), PBIs del [índice](../../backlog/pbis/README.md).

### [QUESTION-014](../../product/OPEN_QUESTIONS.md#question-014) — Diagnóstico, cotización, aprobación y garantía

- **Subpreguntas de revisión:**
  - `QUESTION-014.a`: ¿qué contiene y quién puede cerrar un diagnóstico?
  - `QUESTION-014.b`: ¿cómo se versiona una cotización o presupuesto?
  - `QUESTION-014.c`: ¿quién aprueba y cómo se conserva evidencia?
  - `QUESTION-014.d`: ¿qué ocurre cuando cambian costo, alcance o partes?
  - `QUESTION-014.e`: ¿qué representa la garantía y cómo se vincula al caso original?
- **Por qué importa:** afecta responsabilidad, comunicación, importes, partes, pagos y reaperturas.
- **Ejemplo operativo:** después de abrir el equipo aparece una parte adicional; el cliente debe aprobar el cambio antes de continuar y la evidencia debe conservarse.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Aprobación por etapa | Es explícita; puede añadir fricción frecuente. |
| Aprobación por monto/cambio | Reduce interrupciones; exige umbrales y consentimiento. |
| Evidencia digital | Mejora trazabilidad; requiere canal, identidad y retención. |
| Garantía como reapertura | Conserva un caso; puede ocultar una nueva intervención. |
| Garantía como caso relacionado | Separa trabajo y métricas; necesita vínculo y reglas de cobertura. |

- **Recomendación preliminar — propuesta:** cotización versionada y aprobación trazable para cambios materiales; evaluar garantía como caso relacionado para no alterar silenciosamente el historial original.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [mapa de módulos](../../product/MODULE_MAP.md), [actores](../../product/ACTORS_AND_PERSONAS.md), [alcance](../../product/PRODUCT_SCOPE.md).

### [QUESTION-015](../../product/OPEN_QUESTIONS.md#question-015) — Catálogo, existencias y ubicaciones

- **Subpreguntas de revisión:**
  - `QUESTION-015.a`: ¿el catálogo es de tenant o de sucursal?
  - `QUESTION-015.b`: ¿dónde se mantienen existencias: sucursal o ubicación interna?
  - `QUESTION-015.c`: ¿se requieren lotes, series y transferencias en el primer release?
  - `QUESTION-015.d`: ¿qué visibilidad tiene otra sucursal?
- **Por qué importa:** condiciona búsqueda, referencias, transferencias y relación de partes con reparaciones.
- **Ejemplo operativo:** dos sucursales comparten la descripción de una pantalla, pero cada una tiene cantidades y ubicaciones físicas distintas.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Catálogo tenant, stock sucursal | Reduce duplicación; exige existencias y permisos por ubicación. |
| Todo por sucursal | Simplifica autonomía; duplica catálogo y dificulta consolidación. |
| Catálogo compartido, múltiples ubicaciones | Es flexible; aumenta modelo y transferencias. |
| Modelo gradual | Reduce alcance; requiere dejar explícitas las capacidades diferidas. |

- **Recomendación preliminar — propuesta:** catálogo tenant-wide y existencias por sucursal o ubicación; posponer lotes, series y transferencias si el recorrido no los necesita.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [alcance](../../product/PRODUCT_SCOPE.md), [mapa de módulos](../../product/MODULE_MAP.md), [datos](../../architecture/DATA_ARCHITECTURE.md).

### [QUESTION-016](../../product/OPEN_QUESTIONS.md#question-016) — Movimientos, reservas, costos y excepciones

- **Subpreguntas de revisión:**
  - `QUESTION-016.a`: ¿qué tipos de movimiento existen y quién los autoriza?
  - `QUESTION-016.b`: ¿se reservan partes para reparación o venta?
  - `QUESTION-016.c`: ¿se permiten existencias negativas y bajo qué excepción?
  - `QUESTION-016.d`: ¿qué método de costo es necesario y para qué resultado?
  - `QUESTION-016.e`: ¿cómo se corrige o revierte un movimiento?
- **Por qué importa:** estas reglas determinan exactitud, concurrencia, auditoría y responsabilidades financieras.
- **Ejemplo operativo:** dos técnicos intentan usar la última parte; la reserva y el movimiento deben evitar doble consumo y dejar corrección trazable.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Ledger con saldo derivado | Maximiza trazabilidad; puede requerir proyecciones eficientes. |
| Saldo más movimientos | Facilita consulta; exige consistencia entre ambos. |
| Reservas explícitas | Reduce sobreasignación; añade expiración y liberación. |
| Negativos autorizados | Evitan bloqueo operativo; reducen confiabilidad si se vuelven normales. |
| Métodos de costo | Habilitan valoración; agregan reglas contables y regionales. |

- **Recomendación preliminar — propuesta:** movimientos trazables y reservas sólo si el recorrido las requiere; negar negativos por defecto y diferir valoración avanzada hasta validar necesidad y mercado.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [mapa de módulos](../../product/MODULE_MAP.md), [datos](../../architecture/DATA_ARCHITECTURE.md), [pruebas](../../quality/TESTING_STRATEGY.md).

### [QUESTION-021](../../product/OPEN_QUESTIONS.md#question-021) — Pagos del taller

- **Subpreguntas de revisión:**
  - `QUESTION-021.a`: ¿qué medios se registran inicialmente?
  - `QUESTION-021.b`: ¿se permiten anticipos, parcialidades y aplicación a varias obligaciones?
  - `QUESTION-021.c`: ¿cómo se autorizan cancelaciones y devoluciones?
  - `QUESTION-021.d`: ¿se integra un procesador o sólo se referencia una terminal externa?
  - `QUESTION-021.e`: ¿qué evidencia o documento se entrega?
- **Por qué importa:** define cierre del recorrido, caja, conciliación, permisos y posibles obligaciones fiscales.
- **Ejemplo operativo:** el cliente deja anticipo en efectivo y paga el resto con una terminal externa al recoger el equipo.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Efectivo/registro manual | Reduce integración; requiere caja y controles internos. |
| Terminal externa referenciada | Conserva evidencia sin procesar pago; reconciliación es manual. |
| Procesador integrado | Automatiza estados; añade proveedor, webhooks y cumplimiento. |
| Parcialidades/devolución | Modela casos reales; incrementa estados, autorización y pruebas. |

- **Recomendación preliminar — propuesta:** si pagos entran al primer release, registrar efectivo y referencia externa; posponer procesamiento integrado y casos avanzados no validados.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Alcance](../../product/PRODUCT_SCOPE.md), [glosario](../../product/DOMAIN_GLOSSARY.md), [mapa de módulos](../../product/MODULE_MAP.md), [integraciones](../../architecture/INTEGRATION_ARCHITECTURE.md).

### [QUESTION-022](../../product/OPEN_QUESTIONS.md#question-022) — Caja y sesión de caja

- **Subpreguntas de revisión:**
  - `QUESTION-022.a`: ¿caja significa ubicación, terminal, cuenta de control o combinación?
  - `QUESTION-022.b`: ¿quién abre una sesión y puede compartirla?
  - `QUESTION-022.c`: ¿qué movimientos, conteos y diferencias se registran?
  - `QUESTION-022.d`: ¿cómo se cierra, reabre o supervisa?
  - `QUESTION-022.e`: ¿se requieren varias monedas?
- **Por qué importa:** sin definición no puede atribuirse responsabilidad ni conciliar pagos en efectivo.
- **Ejemplo operativo:** dos turnos usan el mismo mostrador; cada operador necesita distinguir su sesión y la diferencia al cierre.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Caja por sucursal | Es simple; atribuye menos al terminal u operador. |
| Caja por terminal | Identifica punto físico; necesita turnos y responsables. |
| Sesión por operador | Mejora atribución; puede ser incómoda en cajas compartidas. |
| Modelo híbrido | Representa mejor la operación; requiere más entidades y reglas. |

- **Recomendación preliminar — propuesta:** no fijar el modelo sin observar el taller inicial; como hipótesis, caja o terminal dentro de sucursal con sesiones por operador y cierre supervisable.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [actores](../../product/ACTORS_AND_PERSONAS.md), [mapa de módulos](../../product/MODULE_MAP.md), [identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md).

### [QUESTION-033](../../product/OPEN_QUESTIONS.md#question-033) — Datos y conocimiento legacy

- **Subpreguntas de revisión:**
  - `QUESTION-033.a`: ¿qué fuentes, versiones y propietarios existen?
  - `QUESTION-033.b`: ¿qué datos deben preservarse por valor u obligación?
  - `QUESTION-033.c`: ¿qué calidad, duplicados e identificadores tienen?
  - `QUESTION-033.d`: ¿qué reglas o recorridos siguen vigentes con evidencia?
  - `QUESTION-033.e`: ¿qué se migra, archiva, transforma o descarta?
- **Por qué importa:** el nuevo modelo puede perder continuidad o heredar deuda si se decide sin inventario.
- **Ejemplo operativo:** garantías abiertas podrían necesitar historial del caso anterior, mientras registros obsoletos quizá sólo requieran archivo consultable.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Maestros y casos abiertos | Reduce migración; limita consulta histórica. |
| Historial seleccionado | Mejora continuidad; exige reglas y calidad por categoría. |
| Legado de sólo lectura | Evita migración masiva; mantiene operación y soporte del sistema anterior. |
| Importación controlada | Permite oleadas; requiere mapping, reconciliación y errores operables. |
| No migrar una categoría | Reduce riesgo técnico; necesita justificación y comunicación. |

- **Recomendación preliminar — propuesta:** inventariar antes de elegir; migrar sólo datos requeridos por el recorrido, obligaciones y casos abiertos, conservando legado consultable cuando sea viable.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Lecciones legacy](../../product/LEGACY_SR_TALLER_LESSONS.md), [glosario](../../product/DOMAIN_GLOSSARY.md), [datos](../../architecture/DATA_ARCHITECTURE.md), [política de migración](../../operations/MIGRATION_POLICY.md).

### [QUESTION-034](../../product/OPEN_QUESTIONS.md#question-034) — Coexistencia, corte y reconciliación

- **Subpreguntas de revisión:**
  - `QUESTION-034.a`: ¿cuál es la unidad de piloto o corte: tenant, sucursal u oleada?
  - `QUESTION-034.b`: ¿los sistemas coexistirán y cuál puede recibir escrituras?
  - `QUESTION-034.c`: ¿cómo se reconcilian conteos, saldos, estados y archivos?
  - `QUESTION-034.d`: ¿qué condición permite avanzar o volver atrás?
  - `QUESTION-034.e`: ¿cómo se comunica y soporta el cambio?
- **Por qué importa:** una migración correcta técnicamente puede fallar si produce escrituras divergentes o no tiene corte operativo.
- **Ejemplo operativo:** una sucursal piloto inicia en 2.0 mientras el legado queda de consulta; antes de ampliar se comparan casos abiertos y saldos.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Corte por tenant | Aísla impacto; exige preparación completa por cliente. |
| Piloto por sucursal | Reduce alcance; complica datos tenant-wide y coexistencia. |
| Legado de sólo lectura | Evita divergencia nueva; requiere una fecha clara de corte. |
| Ejecución paralela | Permite comparar; genera doble captura y reconciliación compleja. |
| Oleadas con rollback | Facilita aprendizaje; exige automatización y criterios repetibles. |

- **Recomendación preliminar — propuesta:** piloto acotado, legado de sólo lectura después del corte y reconciliación ensayada; evitar dual-write salvo necesidad demostrada.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Lecciones legacy](../../product/LEGACY_SR_TALLER_LESSONS.md), [datos](../../architecture/DATA_ARCHITECTURE.md), [política de migración](../../operations/MIGRATION_POLICY.md), [rollback](../../operations/ROLLBACK_POLICY.md).

## Gate 5 — CRM y mensajería

### [QUESTION-017](../../product/OPEN_QUESTIONS.md#question-017) — Problema y límite de CRM

- **Subpreguntas de revisión:**
  - `QUESTION-017.a`: ¿qué problema no resuelven Customers, Repairs o Messaging?
  - `QUESTION-017.b`: ¿qué actor y momento del recorrido necesitan CRM?
  - `QUESTION-017.c`: ¿qué capacidad mínima lo demostraría?
  - `QUESTION-017.d`: ¿CRM entra al primer release o se difiere?
- **Por qué importa:** “CRM” es una categoría amplia que puede absorber seguimiento, campañas y oportunidades sin objetivo común.
- **Ejemplo operativo:** un recordatorio posreparación es distinto de gestionar oportunidades comerciales y no requiere necesariamente un módulo CRM completo.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Seguimiento posreparación | Se vincula al núcleo; necesita propósito y preferencias. |
| Recordatorios | Es acotado; puede pertenecer a Notifications. |
| Oportunidades/segmentos/campañas | Amplía valor comercial; eleva datos, consentimiento y alcance. |
| Aplazar CRM | Protege foco; conserva el problema para discovery posterior. |

- **Recomendación preliminar — propuesta:** aplazar CRM salvo que el Product Owner identifique un problema concreto imprescindible para el recorrido inicial.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Visión](../../product/PRODUCT_VISION.md), [alcance](../../product/PRODUCT_SCOPE.md), [mapa de módulos](../../product/MODULE_MAP.md), [backlog](../../backlog/PRODUCT_BACKLOG.md).

### [QUESTION-018](../../product/OPEN_QUESTIONS.md#question-018) — Consentimiento, preferencias y datos de clientes

- **Subpreguntas de revisión:**
  - `QUESTION-018.a`: ¿para qué propósitos se usan datos de contacto?
  - `QUESTION-018.b`: ¿qué base autorizada aplica en el mercado inicial?
  - `QUESTION-018.c`: ¿las preferencias son por propósito, canal, tenant o contacto?
  - `QUESTION-018.d`: ¿quién conserva evidencia y atiende correcciones o exclusiones?
  - `QUESTION-018.e`: ¿el cliente interactúa directamente con la plataforma?
- **Por qué importa:** Customers, CRM, Messaging y Notifications pueden usar el mismo contacto con propósitos y obligaciones distintos.
- **Ejemplo operativo:** un teléfono proporcionado para avisar que la reparación terminó no autoriza automáticamente campañas futuras.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Consentimiento por propósito | Es claro; necesita captura y revocación granular. |
| Preferencia por canal | Mejora experiencia; no sustituye una base autorizada. |
| Interés legítimo donde aplique | Puede reducir fricción; requiere evaluación competente. |
| Exclusión global o por tenant | Facilita control; puede bloquear comunicaciones operativas si no se separan. |

- **Recomendación preliminar — propuesta:** separar comunicaciones operativas de marketing, registrar propósito y preferencia por canal, y validar la base legal con asesoría del mercado inicial.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [mapa de módulos](../../product/MODULE_MAP.md), [mensajería](../../architecture/REALTIME_AND_MESSAGING.md), [datos](../../architecture/DATA_ARCHITECTURE.md).

### [QUESTION-019](../../product/OPEN_QUESTIONS.md#question-019) — Canal, cuenta y proveedor inicial

- **Subpreguntas de revisión:**
  - `QUESTION-019.a`: ¿Messaging forma parte del primer release?
  - `QUESTION-019.b`: ¿qué canal y recorrido se habilitan primero?
  - `QUESTION-019.c`: ¿quién posee la cuenta o número y en qué alcance de sucursal?
  - `QUESTION-019.d`: ¿qué criterio selecciona proveedor?
  - `QUESTION-019.e`: ¿WAHA se evalúa, se descarta o permanece prematuro?
- **Por qué importa:** canal y proveedor cambian consentimiento, identidad externa, costos, webhooks, soporte y continuidad.
- **Ejemplo operativo:** un número de WhatsApp por sucursal requiere ownership y routing distintos de una bandeja tenant-wide.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Mensajería interna primero | Valida conversaciones; no prueba un canal usado por clientes. |
| WhatsApp con proveedor aprobado | Ofrece valor conocido; añade dependencia legal y operativa. |
| WAHA sujeto a evaluación | Puede reducir barrera técnica; necesita validar términos, soporte y aislamiento. |
| Email/SMS/notificaciones por etapas | Diversifica canales; cada uno necesita semántica propia. |
| Sólo arquitectura de adaptadores | Conserva límites; no entrega valor de mensajería todavía. |

- **Recomendación preliminar — propuesta:** si Messaging no es parte del primer recorrido, diferir proveedor. Si lo es, seleccionar un solo canal por criterios aprobados y no asumir WAHA.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Alcance](../../product/PRODUCT_SCOPE.md), [mapa de módulos](../../product/MODULE_MAP.md), [mensajería](../../architecture/REALTIME_AND_MESSAGING.md), [integraciones](../../architecture/INTEGRATION_ARCHITECTURE.md).

### [QUESTION-020](../../product/OPEN_QUESTIONS.md#question-020) — Conversación, entrega y tiempo real

- **Subpreguntas de revisión:**
  - `QUESTION-020.a`: ¿una conversación pertenece a un canal o continúa entre canales?
  - `QUESTION-020.b`: ¿quién puede iniciar, ver, asignar, reasignar y cerrar?
  - `QUESTION-020.c`: ¿qué historial, edición y estados canónicos existen?
  - `QUESTION-020.d`: ¿qué garantía de orden, deduplicación y entrega necesita el usuario?
  - `QUESTION-020.e`: ¿qué retención aplica a mensajes, adjuntos y payloads crudos?
  - `QUESTION-020.f`: ¿qué eventos son durables y cuáles efímeros?
- **Por qué importa:** evita que WebSocket, proveedor y persistencia expresen certezas incompatibles o filtren conversaciones.
- **Ejemplo operativo:** un webhook duplicado no debe crear dos mensajes; un indicador “escribiendo” puede expirar sin persistirse.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Estados normalizados extensibles | Da UX coherente; debe conservar evidencia específica del proveedor. |
| Secuencia por conversación | Permite orden local; no crea orden global. |
| Al menos una vez con deduplicación | Tolera reintentos; exige claves y consumidores idempotentes. |
| Retención por propósito/canal | Minimiza datos; requiere políticas y purga comprobables. |
| Durable + efímero separados | Aclara garantías; obliga a contratos y pruebas distintas. |

- **Recomendación preliminar — propuesta:** conversación y ownership primero; para tecnología, estado durable persistido antes de notificar y señales efímeras autorizadas con TTL. Ejecutar [SPIKE-004](./PROTOTYPE_CANDIDATES.md#spike-004) sólo si tiempo real entra al alcance.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Glosario](../../product/DOMAIN_GLOSSARY.md), [mapa de módulos](../../product/MODULE_MAP.md), [mensajería](../../architecture/REALTIME_AND_MESSAGING.md), [datos](../../architecture/DATA_ARCHITECTURE.md).

## Gate 6 — Comercialización del SaaS

### [QUESTION-023](../../product/OPEN_QUESTIONS.md#question-023) — Suscripción y efecto en acceso

- **Subpreguntas de revisión:**
  - `QUESTION-023.a`: ¿existen trial, renovación automática o provisión manual?
  - `QUESTION-023.b`: ¿qué estados de gracia, mora, suspensión y cancelación existen?
  - `QUESTION-023.c`: ¿qué puede hacer un tenant en cada estado?
  - `QUESTION-023.d`: ¿qué ocurre con jobs, integraciones y sesiones activas?
  - `QUESTION-023.e`: ¿cómo se reactiva o exporta?
- **Por qué importa:** un estado comercial no puede producir pérdida, exposición ni bloqueo irrecuperable de datos.
- **Ejemplo operativo:** al vencer un trial, el tenant podría pasar a sólo lectura y exportar antes de suspensión, sin seguir enviando mensajes externos.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Prepago/provisión manual | Reduce automatización; requiere operación interna. |
| Renovación automática | Escala cobro; necesita proveedor y fallos reconciliables. |
| Periodo de gracia | Evita interrupción abrupta; crea política de deuda y notificación. |
| Sólo lectura | Preserva consulta/exportación; cada módulo debe definir mutaciones bloqueadas. |
| Suspensión reversible | Facilita recuperación; requiere retención y seguridad durante inactividad. |

- **Recomendación preliminar — propuesta:** para piloto, provisión manual con estados simples `activo`, `sólo lectura` y `suspendido`; no automatizar cobro antes de validar oferta y proveedor.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Alcance](../../product/PRODUCT_SCOPE.md), [mapa de módulos](../../product/MODULE_MAP.md), [multitenancy](../../architecture/MULTITENANCY_MODEL.md), [datos](../../architecture/DATA_ARCHITECTURE.md).

### [QUESTION-024](../../product/OPEN_QUESTIONS.md#question-024) — Planes, límites y administración central

- **Subpreguntas de revisión:**
  - `QUESTION-024.a`: ¿qué oferta inicial se venderá o pilotará?
  - `QUESTION-024.b`: ¿el precio o límite depende de tenant, sucursal, usuario, volumen o capacidad?
  - `QUESTION-024.c`: ¿qué entitlements deben aplicarse técnicamente?
  - `QUESTION-024.d`: ¿qué se mide y quién puede corregirlo?
  - `QUESTION-024.e`: ¿qué moneda, impuestos y administración central se requieren?
- **Por qué importa:** el modelo comercial condiciona onboarding y acceso, pero no debe contaminar prematuramente el dominio.
- **Ejemplo operativo:** limitar sucursales es distinto de ocultar módulos o cobrar por mensajes, y cada opción necesita medición y soporte propios.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Por tenant | Es simple; puede no reflejar costo de operaciones grandes. |
| Por sucursal | Alinea expansión; exige control de altas y cierres. |
| Por usuario | Es familiar; incentiva cuentas compartidas si no se gobierna. |
| Por volumen | Alinea uso; necesita medición confiable y explicable. |
| Niveles por capacidades | Facilita empaquetado; propaga entitlements por producto. |

- **Recomendación preliminar — propuesta:** empezar con una oferta simple o provisión de piloto; no construir un motor general de entitlements hasta aprobar límites reales.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Visión](../../product/PRODUCT_VISION.md), [alcance](../../product/PRODUCT_SCOPE.md), [mapa de módulos](../../product/MODULE_MAP.md), [Product Backlog](../../backlog/PRODUCT_BACKLOG.md).

### [QUESTION-025](../../product/OPEN_QUESTIONS.md#question-025) — Retención, exportación, corrección y eliminación

- **Subpreguntas de revisión:**
  - `QUESTION-025.a`: ¿qué categorías de datos requieren políticas distintas?
  - `QUESTION-025.b`: ¿quién puede exportar, corregir, anonimizar o eliminar?
  - `QUESTION-025.c`: ¿qué retención mínima/máxima aplica por propósito y mercado?
  - `QUESTION-025.d`: ¿cómo se propaga eliminación a archivos, búsquedas, backups e integraciones?
  - `QUESTION-025.e`: ¿qué excepciones legales o de auditoría prevalecen?
- **Por qué importa:** una política uniforme no sirve para mensajes, pagos, auditoría, archivos y datos de clientes.
- **Ejemplo operativo:** eliminar un contacto puede requerir anonimizarlo en operación activa y conservar una referencia mínima en auditoría o una obligación financiera.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Políticas por categoría | Ajustan propósito; requieren inventario y ownership. |
| Configuración dentro de límites | Da flexibilidad; aumenta soporte y validación. |
| Anonimización | Conserva agregados; debe ser irreversible y verificable. |
| Borrado lógico y purga | Facilita recuperación temporal; complica unicidad y privacidad. |
| Excepción legal | Cumple obligación; necesita fundamento, alcance y vencimiento. |

- **Recomendación preliminar — propuesta:** matriz por clase de dato y propósito, con periodos `TBD` hasta revisión legal; no adoptar soft delete universal.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Principios](../../product/PRODUCT_PRINCIPLES.md), [datos](../../architecture/DATA_ARCHITECTURE.md), [backup](../../operations/BACKUP_AND_RECOVERY.md), [migración](../../operations/MIGRATION_POLICY.md), [seguridad](../../architecture/SECURITY_BASELINE.md).

## Gate 7 — Arquitectura técnica

### [QUESTION-026](../../product/OPEN_QUESTIONS.md#question-026) — Clasificación, residencia y transferencias de datos

- **Subpreguntas de revisión:**
  - `QUESTION-026.a`: ¿qué datos son personales, sensibles, financieros o de auditoría?
  - `QUESTION-026.b`: ¿en qué región deben almacenarse y procesarse?
  - `QUESTION-026.c`: ¿qué transferencias a proveedores o países se permiten?
  - `QUESTION-026.d`: ¿se requiere aislamiento o clave por mercado/categoría?
  - `QUESTION-026.e`: ¿qué evidencia de cumplimiento se conservará?
- **Por qué importa:** puede cambiar hosting, objetos, backups, telemetría, soporte y estrategia multitenant.
- **Ejemplo operativo:** adjuntos o mensajes podrían no poder salir de una región aunque métricas agregadas sí.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Región única aprobada | Simplifica operación; limita mercados. |
| Residencia por mercado | Facilita expansión regulada; multiplica topologías y migraciones. |
| Restricción por categoría | Minimiza complejidad selectivamente; exige clasificación confiable. |
| No ofrecer mercado | Evita incumplimiento; reduce alcance comercial. |

- **Recomendación preliminar — propuesta:** una región aprobada para el mercado inicial y clasificación por categoría; obtener validación legal y de seguridad antes de seleccionar hosting.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Datos](../../architecture/DATA_ARCHITECTURE.md), [multitenancy](../../architecture/MULTITENANCY_MODEL.md), [seguridad](../../architecture/SECURITY_BASELINE.md), [despliegue](../../architecture/DEPLOYMENT_STRATEGY.md), [backup](../../operations/BACKUP_AND_RECOVERY.md).

### [QUESTION-027](../../product/OPEN_QUESTIONS.md#question-027) — Perfil de carga y criterio de escala

- **Subpreguntas de revisión:**
  - `QUESTION-027.a`: ¿qué rango de tenants, sucursales y usuarios debe probarse inicialmente?
  - `QUESTION-027.b`: ¿qué concurrencia y frecuencia tiene cada recorrido crítico?
  - `QUESTION-027.c`: ¿qué volumen de mensajes, archivos y datos crece por periodo?
  - `QUESTION-027.d`: ¿qué latencia o capacidad afecta realmente la operación?
  - `QUESTION-027.e`: ¿qué señal justificaría partición o extracción?
- **Por qué importa:** “1,000 tenants” no define carga, picos, almacenamiento ni criterio de éxito.
- **Ejemplo operativo:** 1,000 tenants pequeños sin concurrencia pueden exigir menos que 20 sucursales con mensajes y archivos continuos.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Supuestos conservadores con pilotos | Permite empezar; requiere actualizar evidencia. |
| Rangos por tenant | Modela diversidad; aumenta escenarios de prueba. |
| Pruebas por recorrido | Se vincula a valor; puede omitir cargas de fondo. |
| Señales de extracción | Evita microservicios prematuros; necesita observabilidad desde el inicio. |

- **Recomendación preliminar — propuesta:** definir rangos por recorrido y validarlos con piloto; no derivar capacidad de la cifra nominal de tenants.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Visión](../../product/PRODUCT_VISION.md), [arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md), [datos](../../architecture/DATA_ARCHITECTURE.md), [observabilidad](../../architecture/OBSERVABILITY_STRATEGY.md), [pruebas](../../quality/TESTING_STRATEGY.md).

### [QUESTION-028](../../product/OPEN_QUESTIONS.md#question-028) — Hosting, disponibilidad y ambientes

- **Subpreguntas de revisión:**
  - `QUESTION-028.a`: ¿qué presupuesto, región y capacidad operativa existen?
  - `QUESTION-028.b`: ¿qué SLO, RPO, RTO y ventanas necesita el primer recorrido?
  - `QUESTION-028.c`: ¿qué servicios deben ser administrados?
  - `QUESTION-028.d`: ¿qué unidades se despliegan separadas?
  - `QUESTION-028.e`: ¿qué gate promueve staging a producción y quién lo aprueba?
- **Por qué importa:** contenedores no seleccionan proveedor, disponibilidad, recuperación ni responsabilidades de operación.
- **Ejemplo operativo:** API y worker pueden usar la misma imagen o código, pero necesitar escalado, shutdown y rollback diferentes.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Plataforma administrada de contenedores | Reduce operación de host; mantiene decisiones de datos y red. |
| Servicio de aplicaciones | Simplifica despliegue; puede limitar topología y portabilidad. |
| Infraestructura cloud propia | Da control; exige mayor competencia y guardias. |
| Servicios administrados de datos | Mejoran operación; condicionan costo, región y restore. |
| Selección posterior por criterios | Evita prematuridad; bloquea detalles ejecutables hasta resolverla. |

- **Recomendación preliminar — propuesta:** definir criterios y capacidades del equipo antes de proveedor; favorecer servicios administrados si satisfacen aislamiento, región, recuperación y costo, sin aceptarlos por defecto.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Despliegue](../../architecture/DEPLOYMENT_STRATEGY.md), [ambientes](../../delivery/ENVIRONMENTS.md), [operaciones](../../operations/OPERATIONS_OVERVIEW.md), [backup](../../operations/BACKUP_AND_RECOVERY.md), [observabilidad](../../architecture/OBSERVABILITY_STRATEGY.md).

### [QUESTION-031](../../product/OPEN_QUESTIONS.md#question-031) — Identidad visual y design system

- **Subpreguntas de revisión:**
  - `QUESTION-031.a`: ¿qué identidad de marca y tono necesita el primer cliente web?
  - `QUESTION-031.b`: ¿qué tokens y componentes compartidos son imprescindibles?
  - `QUESTION-031.c`: ¿se parte de primitivas accesibles o se construye todo propio?
  - `QUESTION-031.d`: ¿quién aprueba y mantiene el sistema?
  - `QUESTION-031.e`: ¿Tailwind es una opción técnica o una decisión necesaria?
- **Por qué importa:** consistencia sin ownership puede convertirse en una biblioteca duplicada o inaccesible.
- **Ejemplo operativo:** un diálogo de confirmación de entrega debe comportarse igual en reparación y pagos, con foco, errores y acciones sensibles coherentes.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| Sistema propio incremental | Ajusta marca y dominio; requiere disciplina y mantenimiento. |
| Base accesible con capa de marca | Acelera calidad; introduce dependencia y restricciones. |
| Tokens compartidos | Mejora coherencia entre apps; necesita versionado y gobierno. |
| Ownership compartido producto/diseño/ingeniería | Equilibra perspectivas; exige autoridad final clara. |

- **Recomendación preliminar — propuesta:** sistema incremental apoyado en primitivas accesibles y tokens propios; decidir Tailwind después de confirmar aplicaciones y estrategia frontend.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Principios](../../product/PRODUCT_PRINCIPLES.md), [arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md), [arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md), [accesibilidad](../../quality/ACCESSIBILITY_STRATEGY.md).

### [QUESTION-032](../../product/OPEN_QUESTIONS.md#question-032) — Accesibilidad y evidencia visual

- **Subpreguntas de revisión:**
  - `QUESTION-032.a`: ¿qué estándar y nivel se adoptan como base?
  - `QUESTION-032.b`: ¿qué navegadores, tamaños y dispositivos representan el taller inicial?
  - `QUESTION-032.c`: ¿qué pruebas automáticas y manuales exige cada flujo?
  - `QUESTION-032.d`: ¿qué evidencia visual y de teclado debe aprobarse?
  - `QUESTION-032.e`: ¿cómo se registran y autorizan excepciones?
- **Por qué importa:** afecta Definition of Done, componentes, dispositivos compartidos y capacidad real de operar el taller.
- **Ejemplo operativo:** recepción debe poder completar un formulario con teclado, errores comprensibles y contraste suficiente en la pantalla usada realmente.
- **Opciones conocidas y consecuencias:**

| Opción | Consecuencia principal |
|---|---|
| WCAG y nivel por definir | Da referencia verificable; requiere precisar versión, alcance y excepciones. |
| Matriz de dispositivos/navegadores | Enfoca pruebas; necesita evidencia del segmento. |
| Automática más manual | Encuentra más barreras; añade esfuerzo planificado. |
| Evidencia por flujo | Facilita aprobación; requiere plantilla y conservación. |

- **Recomendación preliminar — propuesta:** adoptar una base WCAG de nivel `TBD`, matriz pequeña basada en el segmento y evidencia automática más revisión manual de teclado y lector/semántica según riesgo.
- **Respuesta del Product Owner:** TBD.
- **Decisión resultante:** TBD.
- **Documentos a actualizar:** [Accesibilidad](../../quality/ACCESSIBILITY_STRATEGY.md), [Definition of Done](../../delivery/DEFINITION_OF_DONE.md), [estrategia de pruebas](../../quality/TESTING_STRATEGY.md), [principios](../../product/PRODUCT_PRINCIPLES.md).

## Confirmación de la sesión

| Gate | Preguntas revisadas | Decisiones registradas | Bloqueos/follow-up | Responsable | Fecha |
|---|---|---|---|---|---|
| Gate 1 | TBD | TBD | TBD | TBD | TBD |
| Gate 2 | TBD | TBD | TBD | TBD | TBD |
| Gate 3 | TBD | TBD | TBD | TBD | TBD |
| Gate 4 | TBD | TBD | TBD | TBD | TBD |
| Gate 5 | TBD | TBD | TBD | TBD | TBD |
| Gate 6 | TBD | TBD | TBD | TBD | TBD |
| Gate 7 | TBD | TBD | TBD | TBD | TBD |

## Próxima revisión

Revisar durante la sesión con el Product Owner y después de que cada respuesta tenga evidencia y documentos afectados identificados. No cambiar el estado de la pregunta canónica desde este archivo. **Fecha: TBD.**
