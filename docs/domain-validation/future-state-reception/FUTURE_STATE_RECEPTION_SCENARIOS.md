# Escenarios de validación del Future State de recepción

**Estado:** `Proposed`.
**Propósito:** Probar la propuesta con recorridos normales, inciertos, fallidos y excepcionales antes de promover decisiones.
**Alcance:** Quince escenarios desde consulta sin ingreso hasta recepción incompleta autorizada.
**Fuente:** Evidencia del Product Owner, escenarios Current State, políticas y decisiones FSR.
**Audiencia:** Product Owner, Operaciones, Recepción, Seguridad, Legal y Arquitectura.
**Última actualización:** 2026-07-14.

## `FSR-SCENARIO-001` — Consulta sin recepción

| Campo | Contenido |
|---|---|
| Participantes | `FSR-ACTOR-001` Persona que consulta; `FSR-ACTOR-005` Recepción. |
| Precondiciones | Persona pregunta precio por un equipo/problema. |
| Flujo | Inicia consulta; se identifican básicos; se presenta alternativa; persona decide retirarse. |
| Comandos | `FSR-COMMAND-001/002`. |
| Eventos | `FSR-EVENT-001/002/003/004`. |
| Políticas | `FSR-POLICY-001`. |
| Información | Básicos conocidos y alternativa comunicada sólo en nivel que operación valide. |
| Excepciones | Si la persona acepta dejar equipo, cambia a `FSR-EVENT-005` y recepción formal. |
| Resultado | No nace orden ni custodia. `Recommended`. |
| Gaps | Definir si una consulta abandonada necesita algún rastro comercial. |
| Decisiones relacionadas | `FSR-DECISION-001`. |

## `FSR-SCENARIO-002` — Recepción estándar

| Campo | Contenido |
|---|---|
| Participantes | Cliente/entregante, contacto y recepción. |
| Precondiciones | Equipo con IMEI; sin accesorios; sin riesgo especial; persona decide dejarlo. |
| Flujo | Inicia recepción; selecciona cliente/contacto; describe/identifica; inspecciona; registra accesorios `no`; crea/numerar orden; emite comprobante; captura evidencia aplicable; completa recepción. |
| Comandos | `FSR-COMMAND-003` a `005`, `007` a `010`, `015` a `018`, `020`. |
| Eventos | `FSR-EVENT-006` a `008`, `010` a `013`, `019` a `022`, `024/025`. |
| Políticas | `FSR-POLICY-002/003/005/007/009/010/016/017`. |
| Información | `FSR-INFO-001/002/005/006/009/010`. |
| Excepciones | No se invoca excepción; datos no aplicables no generan pasos artificiales. |
| Resultado | Equipo disponible para diagnóstico; esto no inicia diagnóstico. `Recommended`. |
| Gaps | Tiempo objetivo de mostrador y evidencia mínima por tipo de equipo. |
| Decisiones relacionadas | `FSR-DECISION-002/003/009/011/012/013/018/019`. |

## `FSR-SCENARIO-003` — Cliente existente con teléfono nuevo

| Campo | Contenido |
|---|---|
| Participantes | Cliente, contacto y recepción. |
| Precondiciones | Nombre u otro dato coincide; teléfono aportado es distinto. |
| Flujo | Se muestran coincidencia y procedencia; recepción contrasta; selecciona cliente sin fusionar automáticamente; registra teléfono para esta orden; corrección de maestro queda como decisión separada. |
| Comandos | `FSR-COMMAND-004/005`. |
| Eventos | `FSR-EVENT-007/008`. |
| Políticas | `FSR-POLICY-005/006`. |
| Información | Vínculo candidato, snapshot, número nuevo, propósito y procedencia. |
| Excepciones | Si no hay evidencia suficiente, crear/seleccionar queda pendiente sin mezclar personas. |
| Resultado | Orden usa contacto declarado; maestro no se sobreescribe silenciosamente. `Recommended`. |
| Gaps | Autoridad para actualizar dato vivo y resolver duplicados. |
| Decisiones relacionadas | `FSR-DECISION-004/005/008`; `FSR-QUESTION-002/003`. |

## `FSR-SCENARIO-004` — Persona distinta entrega el equipo

| Campo | Contenido |
|---|---|
| Participantes | Juan (`FSR-ACTOR-002`), Luis (`003`), contacto y recepción. |
| Precondiciones | Juan entrega; pide que la orden quede a nombre de Luis. |
| Flujo | Se selecciona/registra Luis como cliente operativo; se define contacto; según política se registra Juan y relación declarada; propietario queda no verificado; continúa recepción. |
| Comandos | `FSR-COMMAND-004/005/006`. |
| Eventos | `FSR-EVENT-007/008/009`. |
| Políticas | `FSR-POLICY-004/005/006`. |
| Información | `FSR-INFO-001` a `004`, con procedencia y no verificación. |
| Excepciones | Captura de Juan puede omitirse sólo si política validada lo permite y el riesgo es bajo. |
| Resultado | Roles quedan claros sin afirmar propiedad legal. `Pending Product Owner validation`. |
| Gaps | Cuándo entregante debe registrarse y qué autoridad tiene Luis/contacto. |
| Decisiones relacionadas | `FSR-DECISION-005/006/007/008`. |

## `FSR-SCENARIO-005` — Equipo sin IMEI o serie

| Campo | Contenido |
|---|---|
| Participantes | Persona que entrega y recepción. |
| Precondiciones | IMEI/serie no está disponible. |
| Flujo | Se describe tipo/marca/modelo/color/rasgos; se registra identificador “no disponible”; se captura evidencia condicionada; al crear orden se asigna número y etiqueta física. |
| Comandos | `FSR-COMMAND-007/008/009/015/016/018`. |
| Eventos | `FSR-EVENT-010/011/012/019/020/022`. |
| Políticas | `FSR-POLICY-003/007/010`. |
| Información | Descripción física, ausencia explícita, condición y etiqueta. |
| Excepciones | Equipos indistinguibles pueden requerir evidencia adicional antes de completar. |
| Resultado | Recepción válida sin dato inventado. `Recommended`. |
| Gaps | Rasgos mínimos y relación con dispositivo histórico. |
| Decisiones relacionadas | `FSR-DECISION-003/009/010/013`. |

## `FSR-SCENARIO-006` — Equipo apagado

| Campo | Contenido |
|---|---|
| Participantes | Persona que entrega, recepción y quizá supervisor. |
| Precondiciones | Equipo no enciende; no se prueban pantalla, cámaras, conectividad u otros. |
| Flujo | Se registra falla relatada; condición observable; pruebas como “no comprobables”; riesgos aplicables; acceso “no proporcionado/no utilizable”; evidencia según política; se decide si mínimos bastan o requiere excepción. |
| Comandos | `FSR-COMMAND-009`, `011` a `015`, `018/019`, `020`. |
| Eventos | `FSR-EVENT-012`, `014` a `019`, `022/023`, `024/025`. |
| Políticas | `FSR-POLICY-010` a `015`, `018`. |
| Información | Límites de inspección, riesgo, acceso y pendiente. |
| Excepciones | Avance sólo con límites visibles y autoridad si la evidencia/condición mínima falta. |
| Resultado | No se declara que el equipo funciona; disponibilidad para diagnóstico es condicionada. `Pending operations validation`. |
| Gaps | Inspección mínima por tipo y autoridad de excepción. |
| Decisiones relacionadas | `FSR-DECISION-011/013/014/015/017/020`. |

## `FSR-SCENARIO-007` — Accesorios inciertos

| Campo | Contenido |
|---|---|
| Participantes | Persona que entrega y recepción. |
| Precondiciones | No se sabe si memoria o chip quedó dentro/acompaña al equipo. |
| Flujo | Cada accesorio relevante se registra `desconocido` con observación; no se convierte vacío en “no”; comprobante refleja versión de custodia. |
| Comandos | `FSR-COMMAND-010/017`. |
| Eventos | `FSR-EVENT-013/021`. |
| Políticas | `FSR-POLICY-009/016`. |
| Información | Tipo, estado tri-valuado, observación y versión emitida. |
| Excepciones | Si el equipo permite inspección segura, puede corregirse mediante nuevo hecho/anexo. |
| Resultado | Incertidumbre explícita y disputable, no certeza falsa. `Recommended`. |
| Gaps | Catálogo corto de accesorios y corrección posterior. |
| Decisiones relacionadas | `FSR-DECISION-012/018`. |

## `FSR-SCENARIO-008` — Riesgo aceptado

| Campo | Contenido |
|---|---|
| Participantes | Recepción y persona decisora de riesgo. |
| Precondiciones | Se detecta riesgo material antes de intervenir. |
| Flujo | Se identifica; se explica alcance; se contrasta autoridad; persona acepta; se registra actor/momento/evidencia; continúa recepción. |
| Comandos | `FSR-COMMAND-011/012/013`. |
| Eventos | `FSR-EVENT-014/015/016`. |
| Políticas | `FSR-POLICY-011/012`. |
| Información | `FSR-INFO-007`, separando riesgo, comunicación y decisión. |
| Excepciones | Riesgo no material podría requerir sólo comunicación; clasificación pendiente. |
| Resultado | Aceptación atribuible sin asumir firma compleja universal. `Pending legal review`. |
| Gaps | Evidencia suficiente por riesgo/canal y revocación. |
| Decisiones relacionadas | `FSR-DECISION-015/016`; `FSR-QUESTION-013/014`. |

## `FSR-SCENARIO-009` — Riesgo rechazado

| Campo | Contenido |
|---|---|
| Participantes | Persona decisora y recepción. |
| Precondiciones | Riesgo material fue comunicado. |
| Flujo | Persona rechaza; se registra decisión y alcance. Rama A: no deja equipo y no se crea orden. Rama B: limita trabajo/recepción y la restricción queda visible. |
| Comandos | `FSR-COMMAND-012/013`; quizá termina antes de `015`. |
| Eventos | `FSR-EVENT-015/017`; quizá `004` o recepción limitada. |
| Políticas | `FSR-POLICY-011/012/017`. |
| Información | Rechazo, actor, momento, evidencia y límite. |
| Excepciones | No puede convertirse automáticamente en aceptación de otro riesgo. |
| Resultado | Sin orden o recepción con restricción explícita. `Pending Product Owner validation`. |
| Gaps | Qué rechazos terminan recepción y cuáles sólo limitan próxima fase. |
| Decisiones relacionadas | `FSR-DECISION-015/016/019`. |

## `FSR-SCENARIO-010` — Sin credencial

| Campo | Contenido |
|---|---|
| Participantes | Cliente/contacto y recepción. |
| Precondiciones | Persona no proporciona PIN, contraseña o patrón. |
| Flujo | Se define método “acceso no proporcionado”; se registran propósito y pruebas limitadas; no se captura secreto; se evalúa si recepción puede completarse. |
| Comandos | `FSR-COMMAND-014/020`. |
| Eventos | `FSR-EVENT-018/024/025` si mínimos se cumplen. |
| Políticas | `FSR-POLICY-013/017/018`. |
| Información | Método, límites y pendientes; nunca secreto vacío interpretado como acceso autorizado. |
| Excepciones | Diagnóstico futuro puede requerir contacto o acceso asistido. |
| Resultado | Recepción puede completarse sin credencial si política lo permite. `Pending security review`. |
| Gaps | Servicios que realmente requieren acceso y comunicación posterior. |
| Decisiones relacionadas | `FSR-DECISION-017/019/020`. |

## `FSR-SCENARIO-011` — Acceso asistido

| Campo | Contenido |
|---|---|
| Participantes | Cliente/contacto, recepción y quizá técnico futuro. |
| Precondiciones | Una prueba puede hacerse con persona presente, sin revelar secreto. |
| Flujo | Se define acceso asistido y propósito; persona desbloquea; se documenta resultado necesario, no credencial; se registran límites posteriores. |
| Comandos | `FSR-COMMAND-014`, además condición/evidencia si aplica. |
| Eventos | `FSR-EVENT-018`, quizá `012/022`. |
| Políticas | `FSR-POLICY-010/013`. |
| Información | Método asistido, propósito, momento, prueba y límites. |
| Excepciones | Persona no disponible después; recepción no promete acceso futuro. |
| Resultado | Se minimiza secreto y se conserva utilidad operativa. `Recommended` como opción. |
| Gaps | Qué pruebas pertenecen a recepción y cuáles a diagnóstico. |
| Decisiones relacionadas | `FSR-DECISION-011/017`. |

## `FSR-SCENARIO-012` — Evidencia inicial pendiente

| Campo | Contenido |
|---|---|
| Participantes | Recepción y supervisor según política. |
| Precondiciones | Orden puede crearse; fotografías aplicables no se toman todavía. |
| Flujo | Nace/numerar orden; se marca evidencia pendiente con motivo/responsable; se emite comprobante si su contenido es válido; recepción no se completa o no habilita diagnóstico hasta resolver/excepción. |
| Comandos | `FSR-COMMAND-015/016/017/019/020`. |
| Eventos | `FSR-EVENT-019/020/021/023`; `024/025` sólo al cumplir regla. |
| Políticas | `FSR-POLICY-014/015/016/018`. |
| Información | Pendiente, responsable, condición de resolución y bloqueo. |
| Excepciones | Evidencia no aplicable puede cerrarse con motivo; no simular captura. |
| Resultado | Orden existente y recepción explícitamente incompleta. `Recommended`. |
| Gaps | SLA/vencimiento y quién resuelve. |
| Decisiones relacionadas | `FSR-DECISION-013/014/018/019/020`. |

## `FSR-SCENARIO-013` — Falla al capturar evidencia

| Campo | Contenido |
|---|---|
| Participantes | Recepción, sistema y quizá supervisor. |
| Precondiciones | Cámara, archivo o relación de evidencia falla después de crear orden. |
| Flujo | La captura no produce `FSR-EVENT-022`; se registra `FSR-EVENT-023`; orden permanece; UI/proceso muestra recepción incompleta; se reintenta o autoriza excepción. |
| Comandos | `FSR-COMMAND-018` rechazado; `019`; luego `018` o `020` con excepción. |
| Eventos | `FSR-EVENT-019/020/023`; después `022/024/025` según resultado. |
| Políticas | `FSR-POLICY-014/015/018`. |
| Información | Motivo técnico comprensible, responsable y bloqueo; no bytes huérfanos como evidencia válida. |
| Excepciones | Evidencia alternativa o excepción autorizada. |
| Resultado | Falla visible sin perder orden ni afirmar evidencia. `Recommended`. |
| Gaps | Compensación técnica se difiere a Arquitectura. |
| Decisiones relacionadas | `FSR-DECISION-014/019/020`. |

## `FSR-SCENARIO-014` — Nota no impresa

| Campo | Contenido |
|---|---|
| Participantes | Recepción, sistema y canal del comprobante. |
| Precondiciones | Orden/número existen; impresora o canal falla. |
| Flujo | Se intenta emitir; contenido/versionado permanece distinguible; falla de materialización no borra orden; se usa canal alterno o queda emisión pendiente; recepción completa depende de política, no de papel por sí solo. |
| Comandos | `FSR-COMMAND-017/020`. |
| Eventos | `FSR-EVENT-021` sólo si emisión se confirma; `024` según mínimos. |
| Políticas | `FSR-POLICY-016/017`. |
| Información | Versión, intento/resultado de canal y entrega al cliente. |
| Excepciones | Comprobante digital/verbal provisional por validar legalmente. |
| Resultado | Orden existe; no se inventa impresión exitosa. `Pending legal review`. |
| Gaps | Qué constituye emisión/entrega y legitimación futura. |
| Decisiones relacionadas | `FSR-DECISION-018/019`; `FSR-QUESTION-018/019`. |

## `FSR-SCENARIO-015` — Recepción excepcional autorizada

| Campo | Contenido |
|---|---|
| Participantes | Recepción, supervisor y persona que entrega/cliente. |
| Precondiciones | Falta información/evidencia normalmente bloqueante; existe razón operativa válida. |
| Flujo | Se identifican faltantes; supervisor autorizado evalúa; registra motivo, autoridad, vigencia, responsable y límites; completa recepción bajo excepción; disponibilidad para diagnóstico expone restricciones. |
| Comandos | `FSR-COMMAND-019/020`; autorización de excepción sigue como decisión de política, no comando técnico aprobado. |
| Eventos | `FSR-EVENT-023/024/025` con excepción referenciada. |
| Políticas | `FSR-POLICY-014/015/018`. |
| Información | Pendientes, autoridad, motivo, momento, límite y condición de resolución. |
| Excepciones | La excepción no puede ocultar identidad/custodia esencial ni secreto inseguro. |
| Resultado | Avance controlado, no recepción fingidamente completa. `Pending Product Owner validation`. |
| Gaps | Autoridad, frecuencia aceptable, mínimos no exceptuables y revisión posterior. |
| Decisiones relacionadas | `FSR-DECISION-019/020`; `FSR-QUESTION-020`. |

## Riesgo de sobrecarga a medir

Los walkthroughs deben cronometrarse con recepción. Si el caso estándar exige capturar entregante, propietario, múltiples riesgos, varias fotos, firma y comprobante complejo sin que el riesgo lo justifique, la propuesta falla su criterio central. La recomendación es activar detalle por diferencia, incertidumbre o riesgo, no por formularios universales.
