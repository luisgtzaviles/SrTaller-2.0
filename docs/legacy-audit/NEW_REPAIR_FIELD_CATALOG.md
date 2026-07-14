# Catálogo de campos de “Nueva Reparación”

- **Estado:** Confirmed by legacy code
- **Propósito:** Responder campo por campo las 20 preguntas de auditoría funcional y semántica.
- **Alcance:** Controles visibles, valores ocultos/derivados y metadatos escritos por el alta o su anticipo inmediato.
- **Fuente:** SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
- **Audiencia:** Product Owner, Domain Experts, Arquitectura, Seguridad, QA y desarrollo.
- **Última actualización:** 2026-07-14

> Evidencia de legado. Las clasificaciones y conceptos candidatos no son decisiones aprobadas para SR Taller 2.0.

## Cómo leer las tablas

Las 20 preguntas se dividen en dos tablas para conservar legibilidad. Cada fila mantiene el mismo número de campo (`C01`–`C39`).

- `Sí (config.)`: requerido en la configuración por defecto o cuando la configuración efectiva lo activa.
- `Cond.`: requerido sólo bajo una condición.
- `NF`: no encontrado tras búsqueda en el repositorio.
- Rutas abreviadas como `crear_reparacion.js` pertenecen a `public_html/sistema/funciones/reparaciones/js_css/`; los endpoints PHP, salvo indicación, a `public_html/sistema/funciones/reparaciones/`.

## Preguntas 1–10: identidad, validación y persistencia

| ID | 1. Nombre visible | 2. Nombre técnico | 3. Archivo donde aparece | 4. Dónde se valida | 5. Dónde se guarda | 6. Tabla.columna | 7. Obligatorio FE | 8. Obligatorio BE | 9. Default | 10. Quién captura |
|---|---|---|---|---|---|---|---|---|---|---|
| C01 | Folio | `folio` / `folio-generado` | `crear_reparacion.php:524-526` | Refresco en `crear_reparacion.js:1499-1506`; sin validación de no vacío | `guardar_reparacion.php:435-455` | `reparaciones.folio` | No; control deshabilitado | No explícito | `F0001` o último + 1 | Sistema |
| C02 | — (cliente seleccionado) | `cliente_reparacion_id` | Oculto en `crear_reparacion.php:535` | ID se verifica en helper | Upsert + insert de reparación | `reparaciones.cliente_reparacion_id` | No | No | vacío/`null` | Sistema al seleccionar/deduplicar |
| C03 | Nombre | `nombre` | `crear_reparacion.php:538-540` | Requeridos/config y normalización FE/BE | Cliente maestro y snapshot compuesto | `reparaciones_clientes.nombre`; parte de `reparaciones.nombre_cliente` | Sí (config.; default sí) | Sí (config.; default sí) | vacío | Usuario o selección |
| C04 | Apellido | `apellido` | `crear_reparacion.php:542-544` | Requeridos/config y normalización | Cliente maestro y snapshot compuesto | `reparaciones_clientes.apellido`; parte de `reparaciones.nombre_cliente` | Sí (config.; default no) | Sí (config.; default no) | vacío | Usuario o selección |
| C05 | País/código | `codigo_pais` | `crear_reparacion.php:549-552` | `crear_reparacion.js:222-295`; backend normaliza teléfono | Cliente maestro | `reparaciones_clientes.codigo_pais` | Cond. al teléfono | Cond. al teléfono | `52` México | Usuario; catálogo SaaS |
| C06 | Teléfono | `telefono_nacional` / `numero_cliente` | `crear_reparacion.php:554-555` | FE E.164/MX; BE `normalizeRepairPhonePayload` | Maestro y snapshot | `reparaciones_clientes.telefono_nacional`; `reparaciones.numero_cliente` | Sí (config.; default sí) | Sí (config.; default sí) | vacío | Usuario o selección |
| C07 | — (teléfono internacional) | `telefono_e164` | Derivado en `crear_reparacion.js:298-309` | FE ≤15 dígitos; BE normaliza | Cliente maestro | `reparaciones_clientes.telefono_e164` | Derivado | Derivado | `+52...` si aplica | Sistema |
| C08 | — (nombre completo) | `nombre_cliente` | Derivado en `crear_reparacion.js:320-337` | Helper recompone desde maestro | Snapshot de reparación | `reparaciones.nombre_cliente` | Derivado | Derivado | nombre + apellido | Sistema |
| C09 | Marca | `marca` | `crear_reparacion.php:568-572` | Requeridos/config; catálogo | Reparación; opción en configuración | `reparaciones.marca`; `configuracion_reparaciones.valor` | Sí (config.; default sí) | Sí (config.; default sí) | vacío | Usuario/catálogo |
| C10 | Modelo | `modelo` | `crear_reparacion.php:575-579` | Requeridos/config; catálogo | Reparación; opción en configuración | `reparaciones.modelo`; `configuracion_reparaciones.valor` | Sí (config.; default sí) | Sí (config.; default sí) | vacío | Usuario/catálogo |
| C11 | IMEI / Serie | `imei` | `crear_reparacion.php:582-584` | FE alfanumérico; BE sólo requerido configurable | Reparación | `reparaciones.imei` | Sí (config.; default no) | Sí (config.; default no); no formato | vacío | Usuario |
| C12 | Color | `color` | `crear_reparacion.php:588-590` | Requeridos/config; title case | Reparación | `reparaciones.color` | Sí (config.; default no) | Sí (config.; default no) | vacío | Usuario |
| C13 | Características | `caracteristicas` | `crear_reparacion.php:592-594` | Requeridos/config; sentence case | Reparación | `reparaciones.caracteristicas` | Sí (config.; default no) | Sí (config.; default no) | vacío | Usuario |
| C14 | ¿Dejó chip? | `chip` | `crear_reparacion.php:596-602` | Select `si/no`; requeridos/config | Reparación | `reparaciones.chip` | Sí (config.; default no) | Sí (config.; default no) | vacío permitido | Usuario |
| C15 | ¿Dejó memoria? | `memoria` | `crear_reparacion.php:604-610` | Select `si/no`; requeridos/config | Reparación | `reparaciones.memoria` | Sí (config.; default no) | Sí (config.; default no) | vacío permitido | Usuario |
| C16 | Falla | `falla` | `crear_reparacion.php:618-622` | Requeridos/config; catálogo/title case | Reparación; opción en configuración | `reparaciones.falla`; `configuracion_reparaciones.valor` | Sí (config.; default sí) | Sí (config.; default sí) | vacío | Usuario/catálogo |
| C17 | Testimonio | `testimonio` | `crear_reparacion.php:625-627` | Requeridos/config; sentence case | Reparación | `reparaciones.testimonio` | Sí (config.; default no) | Sí (config.; default no) | vacío | Usuario |
| C18 | ¿Posible garantía? | `posible_garantia` | `crear_reparacion.php:631-637` | Select `si/no`; requeridos/config | Reparación | `reparaciones.posible_garantia` | Sí (config.; default no) | Sí (config.; default no) | vacío permitido | Usuario |
| C19 | Folio anterior | `folio_anterior` | `crear_reparacion.php:639-641` | Sólo limpieza de texto | Reparación | `reparaciones.folio_anterior` | No; no está en registry config | No | vacío | Usuario |
| C20 | Recibí el equipo | `recibido` | `crear_reparacion.php:643-649` | UI Encendido/Apagado → `si/no`; config | Reparación | `reparaciones.recibido` | Sí (config.; default no) | Sí (config.; default no) | vacío permitido | Usuario |
| C21 | Aceptó riesgo de | `riesgo` | `crear_reparacion.php:651-659` | Canonización + catálogo efectivo en BE | Reparación | `reparaciones.riesgo` | Sí (config.; default resuelto) | Valor siempre normalizado/validado | `no_aplica` | Usuario/configuración |
| C22 | Tipo de bloqueo | `tipo_seguridad` | `crear_reparacion.php:661-669` | Canonización FE/BE | Reparación | `reparaciones.tipo_seguridad` | Sí (config.; default sí) | Sí por default/canonización | `no_tiene` | Usuario |
| C23 | PIN/contraseña o patrón | `codigo_seguridad` / `patron_seguridad` | `crear_reparacion.php:671-676` | Condicional FE y BE | Reparación, mismo campo | `reparaciones.codigo_seguridad` | Cond. | Cond. | vacío si `no_tiene` | Usuario |
| C24 | — (SVG del patrón) | `patron_svg` | Oculto en `crear_reparacion.php:677`; `patron.js:125-128` | NF | NF | NF | No | No | vacío | Sistema en navegador |
| C25 | Promesa de entrega | `promesa_entrega` | `crear_reparacion.php:697-702` | Requeridos/config; sin validación temporal | Reparación | `reparaciones.promesa_entrega` | Sí (config.; default no) | Sí (config.; default no) | vacío | Usuario |
| C26 | Presupuesto inicial | `presupuesto_inicial` | `crear_reparacion.php:704-710` | Entero no negativo FE; requerido config BE | Reparación | `reparaciones.presupuesto_inicial` | Sí (config.; default no) | Sí (config.; default no) | vacío/visual `0` | Usuario |
| C27 | Anticipo | `anticipo` → `monto` | `crear_reparacion.php:712-718` | Entero no negativo FE; BE pago sólo truthy/numeric | Endpoint separado | `reparacion_pagos.monto` | Sí (config.; default no) | Si se llama, numérico y no cero; negativo técnicamente aceptable directo | vacío/`0` | Usuario |
| C28 | — | `origen_cliente` | Hardcode en `crear_reparacion.js:1491` | `marketingDefault` BE | Reparación | `reparaciones.origen_cliente` | No visible | No | `no_capturado` | Sistema |
| C29 | — | `genero` | Hardcode en `crear_reparacion.js:1492` | `marketingDefault` BE | Reparación | `reparaciones.genero` | No visible | No | `no_info` | Sistema |
| C30 | — | `rango_edad` | Hardcode en `crear_reparacion.js:1493` | `marketingDefault` BE | Reparación | `reparaciones.rango_edad` | No visible | No | `no_capturado` | Sistema |
| C31 | — | `estado` | Payload y override BE | BE ignora valor de entrada | Reparación | `reparaciones.estado` | No visible | Fijado | `Pendiente` | Sistema |
| C32 | — | `entregado` | Sólo backend de alta | Fijado | Reparación | `reparaciones.entregado` | No visible | Fijado | `En Tienda` | Sistema |
| C33 | — | `recibido_por` | Sesión en `guardar_reparacion.php:387` | Nombre de sesión, fallback | Reparación | `reparaciones.recibido_por` | No visible | Fijado | sesión / `Sin usuario` | Sistema |
| C34 | — | `fecha_recibido` | SQL en `guardar_reparacion.php:445` | Reloj/zone de conexión SQL | Reparación | `reparaciones.fecha_recibido` | No visible | Fijado | `NOW()` | Sistema |
| C35 | — | `tenant_id` | Contexto guard | Guard de endpoint | Maestro, reparación y pago | columnas `tenant_id` | No visible | Sí | sesión/contexto | Sistema |
| C36 | — | `sucursal_id` | Contexto guard | Guard de endpoint | Maestro, reparación y pago | columnas `sucursal_id` | No visible | Sí | sesión/contexto | Sistema |
| C37 | — | `metodo_pago` | Default en `guardar_anticipo.php:52` | No catálogo/validación encontrada | Pago | `reparacion_pagos.metodo_pago` | No visible | No | `Anticipo` | Sistema o caller directo |
| C38 | — | `fecha` de pago | `guardar_anticipo.php:26-43,62` | Timezone PHP validada | Pago | `reparacion_pagos.fecha` | No visible | Fijado | hora actual | Sistema |
| C39 | — | `usuario` de pago | Sesión en `guardar_anticipo.php:22` | Sesión, fallback | Pago | `reparacion_pagos.usuario` | No visible | Fijado | sesión / `admin` | Sistema |

## Preguntas 11–20: ciclo de vida, uso y significado

| ID | 11. Momento de captura | 12. Uso posterior | 13. Consumidores | 14. Participación | 15. Si queda vacío | 16. ¿Modificable después? | 17. Quién | 18. Clasificación observada | 19. Concepto candidato | 20. Revisión 2.0 |
|---|---|---|---|---|---|---|---|---|---|---|
| C01 | Al abrir y antes de guardar | Localizar y relacionar todo el expediente | Lista, detalle, pagos, seguimiento, evidencia, ticket | Identificador/filtros/integración | BE puede intentar insertarlo vacío; resultado depende del esquema real | NF en UI | NF | Identificador | Número de orden | Sí: concurrencia/alcance |
| C02 | Selección/upsert previo al insert | Vincular snapshot con maestro | Detalle vía `SELECT *`; helper | Identidad | Se crea/deduplica cliente si hay datos | No desde alta | NF | Dato maestro + vínculo | Cliente/parte | Sí: identidad histórica |
| C03 | Recepción | Mostrar, buscar, imprimir/contactar indirectamente | Lista, detalle, ticket genérico, búsqueda | Filtro/impresión | Falla si requerido; si config permite, puede quedar vacío | Maestro no se actualiza al seleccionar; recepción NF | NF | Maestro + histórico duplicado | Nombre de parte/contacto | Sí |
| C04 | Recepción | Completar nombre | Maestro, snapshot/ticket | Identidad | Se omite | Igual C03 | NF | Maestro + histórico | Nombre de persona | Sí |
| C05 | Recepción/selección | Construir E.164 | Maestro, búsqueda | Contacto | Si teléfono opcional puede quedar vacío | NF en este flujo | NF | Maestro/config derivada | Prefijo telefónico | Sí |
| C06 | Recepción/selección | Búsqueda, WhatsApp y ticket | Lista, detalle, búsqueda, WhatsApp | Filtro/mensaje/impresión | Falla por default; config puede permitir vacío | No se edita después; cambiarlo antes desvincula selección | Usuario antes de alta | Maestro + snapshot duplicado | Punto de contacto | Sí: compartición/cambio |
| C07 | Antes del alta | Dedupe/búsqueda internacional | Helper de clientes | Identidad/contacto | Se guarda vacío | NF | NF | Maestro derivado | Teléfono normalizado | Sí |
| C08 | Antes del alta/upsert | Snapshot visible histórico | Lista, detalle, ticket | Filtro/impresión | Puede quedar vacío si config lo permite | NF | NF | Histórico duplicado | Nombre al recibir | Sí |
| C09 | Recepción | Identificar equipo, listar, imprimir | Lista, detalle, ticket, catálogos | Filtro/descripción | Falla por default | NF | NF | Operativo/config | Fabricante del equipo recibido | Conservar concepto; validar catálogo |
| C10 | Recepción | Identificar equipo | Lista, detalle, ticket, catálogos | Filtro/descripción | Falla por default | NF | NF | Operativo/config | Modelo del equipo | Conservar concepto; validar catálogo |
| C11 | Recepción | Mostrar/posible identificación | Detalle y ticket genérico | Identificador descriptivo | Permitido por default; equipo queda identificado por orden/descripción | NF | NF | Operativo/identificador | Identificador de dispositivo | Sí: tipos y duplicados |
| C12 | Recepción | Describir equipo | Detalle/ticket | Descripción | Permitido | NF | NF | Histórico operativo | Atributo observable | Sí |
| C13 | Recepción | Mostrar condición/descripción libre | Detalle; token posible en ticket | Evidencia textual | Permitido | NF | NF | Texto libre/histórico | Condición/accesorios/daños, ambiguo | Pending Product Owner validation |
| C14 | Recepción | Mostrar accesorio recibido | Detalle/ticket | Custodia/evidencia | Queda desconocido, no “No” | NF | NF | Histórico operativo | Accesorio en custodia | Sí: estructurar evidencia |
| C15 | Recepción | Mostrar accesorio recibido | Detalle/ticket | Custodia/evidencia | Queda desconocido | NF | NF | Histórico operativo | Accesorio en custodia | Sí |
| C16 | Recepción | Lista, búsqueda y detalle | Lista, detalle, ticket, catálogo | Filtro/impresión | Falla por default | NF; diagnóstico posterior es seguimiento libre | NF | Operativo/config/texto | Problema reportado o síntoma | Renombrar/separar diagnóstico |
| C17 | Recepción | Mostrar relato | Detalle/ticket genérico | Evidencia textual/impresión | Permitido | NF | NF | Texto libre/histórico | Declaración del cliente | Sí: propósito/consentimiento |
| C18 | Recepción | Mostrar clasificación tentativa | Detalle/ticket | Garantía | Vacío = desconocido | NF | NF | Operativo ambiguo | Solicitud/elegibilidad de garantía | Separar y validar |
| C19 | Recepción si aplica | Referencia visual | Detalle/ticket | Garantía/trazabilidad textual | Garantía puede seguir en `si` | NF | NF | Identificador textual | Orden antecedente | Sí: relación explícita |
| C20 | Recepción | Mostrar estado de encendido | Detalle/ticket | Evidencia | Vacío = desconocido; no cambia reglas | NF | NF | Histórico/evidencia | Estado observable al recibir | Estructurar |
| C21 | Recepción | Mostrar riesgo seleccionado | Detalle/ticket | Riesgo/consentimiento aparente | Se vuelve `no_aplica` por default | NF | NF | Histórico/config | Riesgo comunicado/aceptado | Seguridad jurídica/PO |
| C22 | Recepción | Interpretar/mostrar código | Detalle/ticket engine | Seguridad | Default `no_tiene` | NF | NF | Operativo sensible | Mecanismo de acceso temporal | Pending security review |
| C23 | Recepción | Permitir acceso técnico; mostrar en detalle | Detalle y motor de ticket por token | Seguridad | Falla si tipo exige valor | NF; tampoco se elimina al cerrar | Cualquier actor con detalle puede verlo; modificación NF | Secreto reversible | Credencial temporal de custodia | Pending security review |
| C24 | Al guardar patrón en modal | Sólo miniatura local | `patron.js` | Ninguna posterior | Sin efecto | Se regenera antes de alta | Usuario | Dato derivado no usado | Representación visual de patrón | Probablemente obsoleto; validar |
| C25 | Recepción | Mostrar fecha estimada | Detalle/ticket | Tiempo/compromiso | Permitido por default | NF | NF | Histórico/operativo ambiguo | Compromiso o estimación | Separar semántica/zona |
| C26 | Recepción | Mostrar estimación inicial | Detalle/ticket | Dinero | Vacío permitido | No; sólo existe presupuesto final editable | NF | Financiero/histórico | Estimación inicial | Validar naturaleza monetaria |
| C27 | Después del insert | Sumar pagos y calcular saldo contra presupuesto final | Detalle, anticipos, ticket | Pago/saldo/impresión | No se crea pago | Sí, se agregan más pagos | Usuario con acceso al detalle | Financiero | Pago recibido | Sí: caja, reversos, moneda |
| C28 | Antes del alta, fijo | Mostrar opcional en detalle | Detalle | Analítica aparente | Nunca vacío por este flujo | NF | NF | Dato capturado artificialmente | Canal de adquisición | Revisar; no capturar default falso |
| C29 | Antes del alta, fijo | NF | NF fuera de persistencia | Ninguna encontrada | `no_info` | NF | NF | Dato duplicado/posible obsoleto | NF | Pending Product Owner validation |
| C30 | Antes del alta, fijo | NF | NF fuera de persistencia | Ninguna encontrada | `no_capturado` | NF | NF | Dato duplicado/posible obsoleto | NF | Pending Product Owner validation |
| C31 | Inserción | Lista/filtros y transición posterior | Lista, detalle, webhook, update | Estado | Nunca vacío en alta | Sí | Usuario con detalle | Estado operativo almacenado | Estado de orden | Sí: máquina de estados |
| C32 | Inserción | Saber custodia/entrega | Lista, detalle, update | Estado/entrega | Nunca vacío | Sí | Usuario con detalle | Estado derivado almacenado | Estado de custodia/entrega | Separar de estado reparación |
| C33 | Inserción | Mostrar quién recibió | Detalle/ticket | Auditoría | Fallback no identificable | NF | NF | Histórico/auditoría débil | Actor receptor | Sí: ID estable |
| C34 | Inserción | Lista, filtros, detalle, ticket | Lista/detalle/ticket | Tiempo/auditoría | Sistema la fija | NF | NF | Histórico | Momento de recepción | Sí: instante/zona |
| C35 | Cada endpoint | Aislamiento y propiedad | Todos los endpoints/queries | Seguridad/multitenancy | Guard rechaza petición | No por formulario | Sesión | Contexto/identificador | Organización | Conservar concepto |
| C36 | Cada endpoint | Aislamiento, folio, catálogos y operación | Todos los endpoints/queries | Sucursal/auditoría | Guard rechaza petición | No por formulario | Sesión | Contexto/identificador | Sucursal operativa | Validar transferencia/ownership |
| C37 | Escritura de anticipo | Etiquetar pago | Detalle/ticket | Pago | Endpoint lo fuerza a `Anticipo` | Caller puede enviar otro texto; UI NF | Caller/endpoint | Financiero/texto libre | Tipo/medio de pago, ambiguo | Separar propósito de medio |
| C38 | Escritura de anticipo | Ordenar/mostrar pago | Detalle/ticket | Pago/auditoría | Sistema la fija | NF | NF | Histórico | Momento del pago | Sí: timezone consistente |
| C39 | Escritura de anticipo | Atribuir cobro | Detalle/ticket | Pago/auditoría | Fallback `admin` | NF | NF | Histórico/auditoría débil | Cajero/actor del pago | Sí: ID y caja |

## Observaciones transversales

- “Puede modificarse” significa que se encontró una ruta activa en el módulo de reparaciones. La ausencia de una ruta no demuestra que nadie modifique directamente la base.
- El impresor sustituye cualquier `{{columna}}` de la reparación; que un campo *pueda* imprimirse no confirma que esté en la plantilla activa de producción.
- El anticipo no forma parte del `INSERT` de reparación, aunque se capture en el mismo formulario.
- No se encontró uso posterior funcional para `patron_svg`, `genero` o `rango_edad`; `origen_cliente` sólo tiene visualización opcional.
- Los campos vacíos configurables pueden cambiar por tenant/sucursal, de modo que “opcional” no es una política global estable.
