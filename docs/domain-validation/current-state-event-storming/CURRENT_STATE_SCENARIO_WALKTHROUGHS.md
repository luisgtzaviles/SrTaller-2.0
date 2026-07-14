# Recorridos de escenarios del Current State

**Estado:** Borrador para walkthrough con Product Owner y áreas revisoras.
**Propósito:** Someter el mapa actual a casos concretos, indicando qué ocurre, qué se registra y dónde falla la trazabilidad.
**Alcance:** Quince recorridos obligatorios desde consulta hasta entrega, reapertura, garantía y reimpresión.
**Fuente:** Escenarios aportados por Product Owner; capacidades y límites de las auditorías legacy; preguntas canónicas relacionadas.
**Audiencia:** Product Owner, recepción, técnicos, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Criterio

Las secuencias combinan hechos confirmados con ramas técnicamente posibles. Cada paso conserva su estado; “posible” no significa permitido por negocio. Los gaps no son diseño futuro.

## `CSE-SCENARIO-001` — Pantalla cotizada y aceptada

| Campo | Recorrido |
|---|---|
| Objetivo | Seguir una consulta por pantalla de iPhone 11 en la que se ofrecen Incell y OLED y la persona deja el equipo. |
| Precondiciones | Persona llega/contacta; recepción puede consultar precios/calidades. |
| Participantes | `CSE-ACTOR-001`, `002`, `003`, `005`. |
| Secuencia | 1) Pregunta precio. 2) Recepción pregunta marca/modelo/falla/cómo ocurrió. 3) Presenta Incell y OLED. 4) Persona elige una opción. 5) Decide dejar el equipo. 6) Empieza recepción y se crea la orden. |
| Comandos | `CSE-COMMAND-001`, `002`, `003`, `004/005`, `006`, `009`. |
| Eventos | `CSE-EVENT-001`, `002`, `004`, `005`, `006/007`, `009`, `012`. |
| Políticas | `CSE-POLICY-001`, `002`, `003`, `006`. |
| Datos registrados | Cliente/snapshot, teléfono, equipo, falla, valores de recepción y presupuesto inicial que finalmente se capture. |
| Datos no registrados | Momento de consulta, alternativas Incell/OLED, precio de cada una, quién consultó y evidencia de elección previa al alta. |
| Puntos de fallo | Fuente de precio desactualizada; opción comunicada distinta de valor guardado; alta fallida no crea orden. |
| Evidencia | Secuencia/alternativas `Confirmed by Product Owner`; alta `Confirmed by legacy code`. |
| Gaps | Oferta y aceptación comercial no están versionadas ni vinculadas al registro. |
| Preguntas | ¿Elegir una calidad autoriza trabajo/precio o sólo acepta recepción? ¿Cuál es la vigencia del precio? |

## `CSE-SCENARIO-002` — Cliente existente

| Campo | Recorrido |
|---|---|
| Objetivo | Localizar a una persona por nombre o teléfono y conservar su snapshot en la orden. |
| Precondiciones | Existe al menos una coincidencia legacy. |
| Participantes | `CSE-ACTOR-003`, `004`, `005`, `014`, `015`. |
| Secuencia | 1) Recepción busca. 2) Navegador muestra coincidencias. 3) Recepción selecciona. 4) Al guardar, nombre/teléfono se copian a la reparación. |
| Comandos | `CSE-COMMAND-004`, `006`, `009`. |
| Eventos | `CSE-EVENT-006`, `008`, `009`, `012`. |
| Políticas | `CSE-POLICY-004`, `005`, `006`. |
| Datos registrados | Identificador usado por alta, nombre y teléfono snapshot. |
| Datos no registrados | Razón de selección, prueba de identidad, propietario, entregador y resolución de coincidencias múltiples. |
| Puntos de fallo | Teléfono compartido/antiguo, duplicado, selección equivocada o cambios posteriores no reflejados. |
| Evidencia | `LEGACY-NR-FINDING-002/003`. `Confirmed by legacy code`. |
| Gaps | Dedupe, identidad, contacto y snapshot tienen semánticas distintas. |
| Preguntas | `DQ-004`; `LEGACY-NR-Q-003/004`. |

## `CSE-SCENARIO-003` — Persona distinta entrega el equipo

| Campo | Recorrido |
|---|---|
| Objetivo | Mostrar que Juan entrega un equipo que queda a nombre de Luis y Juan no se registra. |
| Precondiciones | Juan indica “déjalo a nombre de Luis” y proporciona el contacto usado. |
| Participantes | `CSE-ACTOR-002` Juan, `CSE-ACTOR-003` Luis, `CSE-ACTOR-004`, `005`. |
| Secuencia | 1) Juan deja físicamente el equipo. 2) Recepción pregunta a nombre de quién. 3) Selecciona/crea a Luis. 4) Guarda la orden. 5) La nota muestra a Luis. |
| Comandos | `CSE-COMMAND-003`, `004/005`, `009`, `011`. |
| Eventos | `CSE-EVENT-005`, `006/007`, `008`, `012`, `015`. |
| Políticas | `CSE-POLICY-003`, `005`. |
| Datos registrados | Luis y teléfono de contacto en snapshot; datos del equipo/orden. |
| Datos no registrados | Juan, relación Juan-Luis, propietario real, declaración de custodia o autoridad de Juan. |
| Puntos de fallo | Luis desconoce ingreso; teléfono corresponde a Juan/tercero; disputa de propiedad. |
| Evidencia | Práctica `Confirmed by Product Owner`; snapshot `Confirmed by legacy code`; conjunto `Confirmed by both`. |
| Gaps | `CSE-HOTSPOT-001/002`. |
| Preguntas | ¿Quién puede autorizar trabajo y retiro en esta combinación? ¿Qué relación debe probarse? |

## `CSE-SCENARIO-004` — Equipo sin IMEI disponible

| Campo | Recorrido |
|---|---|
| Objetivo | Rastrear un equipo identificado por descripción física y sticker con folio. |
| Precondiciones | IMEI no está disponible o no puede leerse. |
| Participantes | Persona que entrega, recepción, sistema. |
| Secuencia | 1) Recepción captura marca/modelo/color/características. 2) Guarda la orden. 3) Sistema asigna folio. 4) Recepción pega sticker al dispositivo. 5) Puede añadir fotos después de imprimir. |
| Comandos | `CSE-COMMAND-006`, `007`, `009`, `011`, `012`. |
| Eventos | `CSE-EVENT-009`, `010`, `012`, `013`, `015`, `016`. |
| Políticas | `CSE-POLICY-007`, `008`, `009`. |
| Datos registrados | Descripción disponible, folio y evidencia posterior opcional. |
| Datos no registrados | Acto de pegar sticker, certeza de identidad física y vínculo reutilizable del dispositivo. |
| Puntos de fallo | Folio predicho/impreso difiere; sticker se despega/intercambia; fotos tardías. |
| Evidencia | Sticker `Confirmed by Product Owner`; folio/dispositivo `Confirmed by legacy code`. |
| Gaps | `CSE-HOTSPOT-003/004/008`. |
| Preguntas | `DQ-005`; ¿qué combinación identifica suficientemente un equipo sin IMEI? |

## `CSE-SCENARIO-005` — Anticipo inicial falla después de crear la orden

| Campo | Recorrido |
|---|---|
| Objetivo | Mostrar el resultado parcial cuando el alta funciona y el anticipo no. |
| Precondiciones | Formulario válido; se intenta registrar anticipo inicial. |
| Participantes | Recepción, usuario de pago, navegador, sistema. |
| Secuencia | 1) `INSERT` principal tiene éxito. 2) Nacen orden/folio. 3) Navegador envía petición de anticipo. 4) Petición falla. 5) La orden permanece; no existe fila de pago. 6) Impresión/evidencia pueden seguir o quedar interrumpidas según flujo. |
| Comandos | `CSE-COMMAND-009`, `010`, `011`, `012`. |
| Eventos | `CSE-EVENT-012`, `013`; `CSE-EVENT-014` no ocurrió. |
| Políticas | `CSE-POLICY-006`, `010`, `019`. |
| Datos registrados | Orden completa y folio; quizá sin anticipo. |
| Datos no registrados | Intención fallida, motivo conciliable y compensación. |
| Puntos de fallo | Usuario asume que cobró; nota puede no reflejar pago; reintento puede duplicar si el primero fue incierto. |
| Evidencia | `LEGACY-NR-FINDING-009/010`. `Confirmed by legacy code`. |
| Gaps | Atomicidad y caja; `CSE-HOTSPOT-014/015`. |
| Preguntas | ¿Qué debe ocurrir operacionalmente ante cada resultado parcial? `DQ-012`. |

## `CSE-SCENARIO-006` — Pantalla más batería

| Campo | Recorrido |
|---|---|
| Objetivo | Recorrer hallazgo adicional, llamada, autorización verbal, seguimiento libre y cambio de total. |
| Precondiciones | Orden ingresó por pantalla; técnico descubre falla de batería. |
| Participantes | Técnico, cliente/contacto, recepción o usuario de seguimiento/estado. |
| Secuencia | 1) Falla original permanece. 2) Técnico descubre batería. 3) Se llama al contacto. 4) Persona autoriza verbalmente. 5) Usuario narra autorización en seguimiento. 6) Usuario sobrescribe presupuesto final. 7) Trabajo continúa. |
| Comandos | `CSE-COMMAND-014` a `020`. |
| Eventos | `CSE-EVENT-018` a `024`. |
| Políticas | `CSE-POLICY-013`, `014`, `015`, `017`. |
| Datos registrados | Falla original, nota transformada, colaborador/fecha de captura y total final actual. |
| Datos no registrados | Diagnóstico tipificado, número contactado, hora real, identidad decisora, alcance/monto autorizado, versión, batería, inventario y aplicación del pago. |
| Puntos de fallo | Nota sin cambio; cambio sin nota; evidencia fallida; trabajo continúa sin prueba; total posterior borra el autorizado. |
| Evidencia | Secuencia `Confirmed by Product Owner`; representación `Confirmed by legacy code`; causalidad técnica `Inferred from combined evidence`. |
| Gaps | `CSE-HOTSPOT-005`, `012`, `013`, `023`, `028`. |
| Preguntas | `DQ-008/009/011/023`; `LEGACY-RD-Q-007` a `015`, `034/035`. |

## `CSE-SCENARIO-007` — Equipo listo y todavía en tienda

| Campo | Recorrido |
|---|---|
| Objetivo | Confirmar separación entre resultado técnico y custodia. |
| Precondiciones | Reparación tiene custodia `En Tienda`; usuario selecciona literal de listo. |
| Participantes | Técnico, usuario que cambia estado, sistema, quizá cliente. |
| Secuencia | 1) Se intenta webhook. 2) Se guarda estado listo. 3) Se fija primera `fecha_listo`. 4) Custodia permanece `En Tienda`. 5) Puede prepararse aviso. |
| Comandos | `CSE-COMMAND-021`, `022`. |
| Eventos | `CSE-EVENT-025`, `026`, `027/028`; no `031/032`. |
| Políticas | `CSE-POLICY-012`, `016`, `018`. |
| Datos registrados | Estado, primera fecha, custodia vigente y posible `revisor`. |
| Datos no registrados | QC, fin real, notificación entregada y disponibilidad física confirmada. |
| Puntos de fallo | Webhook antes de guardado; estado similar sin fecha; aviso sin cambio o cambio sin aviso. |
| Evidencia | `LEGACY-RD-FINDING-002/004/006`. `Confirmed by legacy code`. |
| Gaps | “Listo” no equivale a QC, aviso ni entrega. |
| Preguntas | `DQ-016/020`; `LEGACY-RD-Q-001/037`. |

## `CSE-SCENARIO-008` — Entrega con nota

| Campo | Recorrido |
|---|---|
| Objetivo | Mostrar la nota como vía humana de legitimación. |
| Precondiciones | Persona presenta la nota asociada al equipo. |
| Participantes | Persona que recoge, recepción, usuario que marca entrega. |
| Secuencia | 1) Receptor presenta nota. 2) Recepción la acepta. 3) Entrega físicamente. 4) Usuario marca `Entregado` antes o después; orden exacto no está estructurado. |
| Comandos | `CSE-COMMAND-024`, `025`. |
| Eventos | `CSE-EVENT-030`, `032`, `031` en orden desconocido. |
| Políticas | `CSE-POLICY-021`, `024`. |
| Datos registrados | Custodia, primera fecha y actor interno que guarda. |
| Datos no registrados | Nota presentada, receptor, decisión, hora física y vínculo entre actos. |
| Puntos de fallo | Nota prestada/duplicada; marca sin entrega; entrega sin marca; estado/saldo inválidos. |
| Evidencia | Vía de nota `Confirmed by Product Owner`; marca `Confirmed by legacy code`. |
| Gaps | `CSE-HOTSPOT-016`, `022`. |
| Preguntas | `DQ-014/019`; `LEGACY-RD-Q-028/030`. |

## `CSE-SCENARIO-009` — Entrega sin nota con INE

| Campo | Recorrido |
|---|---|
| Objetivo | Recorrer legitimación mediante INE y carga de evidencia no vinculada. |
| Precondiciones | Receptor no presenta nota; recepción solicita INE. |
| Participantes | Receptor, recepción, usuario de evidencia/entrega, R2. |
| Secuencia | 1) Se presenta INE. 2) Recepción decide aceptarla. 3) Puede fotografiar/subirla como evidencia genérica. 4) Entrega equipo. 5) Marca custodia. |
| Comandos | `CSE-COMMAND-012`, `024`, `025`. |
| Eventos | `CSE-EVENT-016`, `030`, `032`, `031`. |
| Políticas | `CSE-POLICY-022`, `024`. |
| Datos registrados | Imagen/metadatos genéricos, custodia, fecha y actor interno; no necesariamente todos. |
| Datos no registrados | Tipo INE, identidad extraída, finalidad, decisión, receptor y relación explícita con entrega. |
| Puntos de fallo | R2/tablas parciales; exposición excesiva; entrega sin carga; imagen ilegible/no pertinente. |
| Evidencia | Práctica `Confirmed by Product Owner`; almacenamiento `Confirmed by legacy code`; vínculo `Unknown`. |
| Gaps | `CSE-HOTSPOT-017/024`. |
| Preguntas | ¿Qué datos deben capturarse/ocultarse y por cuánto tiempo? `Pending security review`. |

## `CSE-SCENARIO-010` — Entrega mediante llamada al contacto

| Campo | Recorrido |
|---|---|
| Objetivo | Mostrar autorización cuando recepción no reconoce a quien recoge. |
| Precondiciones | Sin nota o reconocimiento suficiente; existe teléfono registrado. |
| Participantes | Receptor, recepción, contacto registrado, usuario que marca entrega. |
| Secuencia | 1) Recepción no reconoce al receptor. 2) Llama al número snapshot. 3) Contacto autoriza. 4) Recepción entrega. 5) Sistema sólo conserva marca técnica, salvo nota narrativa opcional. |
| Comandos | `CSE-COMMAND-016`, `017` opcional, `024`, `025`. |
| Eventos | `CSE-EVENT-020`, `021`, quizá `024`, `030`, `032`, `031`. |
| Políticas | `CSE-POLICY-004`, `014`, `022`, `024`. |
| Datos registrados | Teléfono snapshot; quizá seguimiento; custodia/fecha/actor interno. |
| Datos no registrados | Número realmente marcado, quién contestó, palabras/alcance, receptor y vínculo con entrega. |
| Puntos de fallo | Teléfono antiguo/compartido; suplantación; llamada no contestada; marca sin autorización. |
| Evidencia | Regla `Confirmed by Product Owner`; limitación `Confirmed by legacy code`. |
| Gaps | `CSE-HOTSPOT-001/002/013/016`. |
| Preguntas | ¿Quién puede autorizar retiro y cómo se prueba sin conservar datos excesivos? |

## `CSE-SCENARIO-011` — Entrega sin nota ni INE

| Campo | Recorrido |
|---|---|
| Objetivo | Probar rechazo normal y excepción de dueño/gerente. |
| Precondiciones | Persona no presenta nota ni INE. |
| Participantes | Receptor, recepción, dueño o gerente. |
| Secuencia | Rama normal: 1) recepción evalúa; 2) rechaza; 3) equipo permanece. Rama excepcional: 1) dueño/gerente autoriza; 2) recepción entrega; 3) puede marcar custodia sin registrar excepción. |
| Comandos | `CSE-COMMAND-024`, y `025` sólo en excepción. |
| Eventos | `CSE-EVENT-030` rechazado o aceptado; en excepción `032/031`. |
| Políticas | `CSE-POLICY-023`, `024`. |
| Datos registrados | Si no se entrega, ningún rechazo estructurado; si se entrega, sólo marca técnica. |
| Datos no registrados | Solicitud, rechazo, identidad, autoridad, razón y excepción. |
| Puntos de fallo | Usuario marca entregado pese al rechazo; excepción verbal no verificable. |
| Evidencia | Regla/excepción `Confirmed by Product Owner`; permisividad `Confirmed by legacy code`. |
| Gaps | `CSE-HOTSPOT-018/019/030`. |
| Preguntas | ¿Qué autoridad, motivo y evidencia hacen válida una excepción? |

## `CSE-SCENARIO-012` — Entrega técnicamente inválida posible

| Campo | Recorrido |
|---|---|
| Objetivo | Demostrar que el backend permite marcar entregado estando pendiente o con saldo. |
| Precondiciones | Reparación en cualquier estado; presupuesto/pagos producen saldo no cero o anómalo. |
| Participantes | Usuario que marca entrega, navegador, sistema. |
| Secuencia | 1) Modal muestra estado/custodia/saldo. 2) Usuario elige `Entregado`. 3) Guardado envía estado, técnico, total y custodia. 4) Backend no consulta saldo ni valida estado/legitimación. 5) Fija/conserva fecha. |
| Comandos | `CSE-COMMAND-025`. |
| Eventos | `CSE-EVENT-031`; entrega física `CSE-EVENT-032` no está demostrada. |
| Políticas | `CSE-POLICY-016`, `020`, `024`. |
| Datos registrados | Custodia, primera fecha, actor interno y demás valores combinados. |
| Datos no registrados | Excepción, crédito/cortesía, legitimación, receptor y razón. |
| Puntos de fallo | Entrega indebida, deuda no explicada, estado pendiente entregado, llamada directa que elude UI. |
| Evidencia | `LEGACY-RD-FINDING-002/014/015`. `Confirmed by legacy code`. |
| Gaps | Posibilidad técnica no es política humana aprobada. |
| Preguntas | `DQ-019`; `LEGACY-RD-Q-026/030`; `Pending finance review`. |

## `CSE-SCENARIO-013` — Reapertura

| Campo | Recorrido |
|---|---|
| Objetivo | Mostrar cambio desde estado terminal conservando fechas anteriores. |
| Precondiciones | Existe `fecha_listo` y/o `fecha_entregado`; usuario selecciona otro estado/custodia. |
| Participantes | Recepción, técnico, usuario que cambia estado. |
| Secuencia | 1) Se abre detalle. 2) Se sustituye estado terminal. 3) Puede volver custodia a `En Tienda`. 4) Guardado conserva primeras fechas y actor de entrega anterior. 5) Un cierre posterior no renueva primera fecha. |
| Comandos | `CSE-COMMAND-027`, quizá `021/025`. |
| Eventos | `CSE-EVENT-033`, `025`; una futura marca lista reutiliza `026`. |
| Políticas | `CSE-POLICY-012`, `016`, `025`. |
| Datos registrados | Estado/custodia vigentes y fechas/actores antiguos mezclados. |
| Datos no registrados | Motivo, ciclo, devolución física, responsable, antes/después y nueva fecha. |
| Puntos de fallo | Reportes interpretan primera entrega/listo como vigente; `entregado_por` cambia en reentrega. |
| Evidencia | `LEGACY-RD-FINDING-003/016/022`. `Confirmed by legacy code`. |
| Gaps | Reapertura, retrabajo, devolución y nuevo ingreso no se distinguen. |
| Preguntas | `DQ-029`; `LEGACY-RD-Q-003/027/045`. |

## `CSE-SCENARIO-014` — Posible garantía

| Campo | Recorrido |
|---|---|
| Objetivo | Mostrar orden/estado con referencia previa sin validación estructurada. |
| Precondiciones | Usuario indica posible garantía y/o escribe folio anterior. |
| Participantes | Cliente, recepción, técnico, usuario que cambia estado. |
| Secuencia | 1) Se captura bandera/folio textual durante ingreso o se usa estado con “Garantia”. 2) Sistema guarda valor sin validar existencia/relación. 3) Trabajo, pagos y estado siguen flujo general. |
| Comandos | `CSE-COMMAND-028`, además comandos generales de alta/detalle. |
| Eventos | `CSE-EVENT-034`; no demuestra activación canónica de garantía. |
| Políticas | `CSE-POLICY-026`. |
| Datos registrados | Bandera, texto de folio anterior o etiqueta actual. |
| Datos no registrados | Caso origen validado, dispositivo, vigencia, cobertura, decisión, costo, resolución y ciclos. |
| Puntos de fallo | Folio inexistente/ajeno; etiqueta interpretada como garantía aprobada; cobros inconsistentes. |
| Evidencia | `LEGACY-NR-FINDING-006`, `LEGACY-RD-FINDING-022`. `Confirmed by legacy code`. |
| Gaps | `CSE-HOTSPOT-025/028`. |
| Preguntas | `DQ-021/022`; `LEGACY-RD-Q-031/033`; `Pending Product Owner validation`. |

## `CSE-SCENARIO-015` — Reimpresión posterior

| Campo | Recorrido |
|---|---|
| Objetivo | Mostrar que una reimpresión refleja el presente, no necesariamente el original. |
| Precondiciones | Orden fue impresa antes; después cambiaron datos, pagos, presupuesto, custodia o plantilla. |
| Participantes | Usuario, navegador/impresora, sistema. |
| Secuencia | 1) Usuario solicita ticket por folio. 2) Endpoint consulta reparación/plantilla actuales. 3) Consulta sólo pago más reciente. 4) Sustituye tokens. 5) Navegador muestra contenido; no se registra acto ni snapshot. |
| Comandos | `CSE-COMMAND-026`. |
| Eventos | `CSE-EVENT-015` vuelve a ocurrir como solicitud; no existe evento persistido de reimpresión. |
| Políticas | Limitación descrita por `CSE-HOTSPOT-022`; no se infiere una política de documento histórico. |
| Datos registrados | Ninguna bitácora nueva demostrada; se leen datos actuales. |
| Datos no registrados | HTML original, versión de plantilla, usuario/hora, motivo, número de copia y total histórico. |
| Puntos de fallo | Documento difiere, último pago se interpreta como total, secreto aparece por plantilla, conflicto de auditoría sobre consultas. |
| Evidencia | `LEGACY-RD-FINDING-024`. Una consulta en auditoría actual: `Confirmed by legacy code`; afirmación previa de doble consulta: `Conflict`. |
| Gaps | Reproducibilidad, valor probatorio, privacidad y trazabilidad de impresión. |
| Preguntas | `LEGACY-RD-Q-044`; `Pending finance review` y `Pending security review`. |

## Resultado del recorrido

Los escenarios muestran tres cadenas distintas que hoy sólo se aproximan narrativamente:

1. consulta → aceptación → alta;
2. hallazgo → contacto → decisión → cambio de total → trabajo;
3. legitimación → acto físico → marca de custodia.

Ninguna cadena autoriza por sí misma una solución futura. Su valor es señalar qué debe observarse o decidirse en el taller de validación.
