# Trazabilidad de “Nueva Reparación”

- **Estado:** Confirmed by legacy code
- **Propósito:** Relacionar cada dato heredado con archivos, endpoints, persistencia, usos, hallazgos, preguntas y conceptos candidatos.
- **Alcance:** Los 39 datos del catálogo y 18 endpoints/rutas inspeccionados.
- **Fuente:** SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
- **Audiencia:** Product Owner, Domain Experts, Arquitectura, Seguridad, QA y desarrollo.
- **Última actualización:** 2026-07-14

> Los conceptos de la última columna son candidatos para conversación; no forman parte del modelo canónico de SR Taller 2.0.

## Convenciones

- Las rutas son relativas a la raíz de SR Taller 1.0.
- `—` significa que no existe persistencia/endpoint específico o no se encontró uso.
- Los IDs enlazan lógicamente con [hallazgos](NEW_REPAIR_DOMAIN_FINDINGS.md) y [preguntas](NEW_REPAIR_OPEN_QUESTIONS.md).

## Matriz de trazabilidad

| Campo legado | Archivo/bloque principal | Endpoint de escritura/lectura | Tabla.columna | Uso posterior confirmado | Finding | Pregunta | Concepto candidato 2.0 |
|---|---|---|---|---|---|---|---|
| C01 Folio | `crear_reparacion.js:1321-1334,1465,1499-1506` | `obtener_siguiente_folio.php`; `guardar_reparacion.php` | `reparaciones.folio` | Lista, detalle, pagos, evidencia, ticket, webhook | `LEGACY-NR-FINDING-001` | `LEGACY-NR-Q-040` | Número de orden/ámbito de numeración |
| C02 ID cliente | `crear_reparacion.php:535`; `reparaciones_clientes.php:75-205` | `clientes_buscar.php`; alta interna; `cliente_upsert.php` alterno no invocado | `reparaciones_clientes.id`; `reparaciones.cliente_reparacion_id` | Vínculo maestro; snapshot se usa para UI | `LEGACY-NR-FINDING-003` | `LEGACY-NR-Q-001` | Parte referenciada |
| C03 Nombre | `crear_reparacion.php:538-540`; `guardar_reparacion.php:389,410-429` | `guardar_reparacion.php` | `reparaciones_clientes.nombre`; `reparaciones.nombre_cliente` | Búsqueda, lista, detalle, ticket | `LEGACY-NR-FINDING-002`, `003` | `LEGACY-NR-Q-001`, `004` | Nombre maestro + representación histórica |
| C04 Apellido | `crear_reparacion.php:542-544`; `guardar_reparacion.php:390,410-429` | `guardar_reparacion.php` | `reparaciones_clientes.apellido`; snapshot compuesto | Búsqueda y nombre completo | `LEGACY-NR-FINDING-003` | `LEGACY-NR-Q-004` | Nombre de persona |
| C05 Código país | `crear_reparacion.js:222-309,1170-1191` | `paises_activos.php`; `guardar_reparacion.php` | `reparaciones_clientes.codigo_pais` | Normalización telefónica | `LEGACY-NR-FINDING-002`, `023` | `LEGACY-NR-Q-002`, `046` | Prefijo telefónico |
| C06 Teléfono nacional | `crear_reparacion.js:222-337,962-1027` | `clientes_buscar.php`; `guardar_reparacion.php` | `reparaciones_clientes.telefono_nacional`; `reparaciones.numero_cliente` | Dedupe, búsqueda, WhatsApp, ticket | `LEGACY-NR-FINDING-002`, `003` | `LEGACY-NR-Q-002`, `003`, `005` | Punto de contacto + snapshot |
| C07 Teléfono E.164 | `crear_reparacion.js:269-309` | `guardar_reparacion.php` | `reparaciones_clientes.telefono_e164` | Búsqueda/dedupe de cliente | `LEGACY-NR-FINDING-002` | `LEGACY-NR-Q-002` | Teléfono normalizado |
| C08 Nombre completo | `crear_reparacion.js:320-337`; `guardar_reparacion.php:421-429` | `guardar_reparacion.php` | `reparaciones.nombre_cliente` | Lista, filtros, detalle, impresión | `LEGACY-NR-FINDING-003` | `LEGACY-NR-Q-004` | Representación histórica de parte |
| C09 Marca | `crear_reparacion.php:568-572`; `crear_reparacion.js:709-783` | `catalogos_buscar.php`; `catalogos_upsert.php`; `guardar_reparacion.php` | `reparaciones.marca`; `configuracion_reparaciones.valor` | Lista, detalle, ticket | `LEGACY-NR-FINDING-004` | `LEGACY-NR-Q-006` | Fabricante del equipo recibido |
| C10 Modelo | `crear_reparacion.php:575-579`; `crear_reparacion.js:709-783` | mismos catálogos; `guardar_reparacion.php` | `reparaciones.modelo`; `configuracion_reparaciones.valor` | Lista, detalle, ticket | `LEGACY-NR-FINDING-004` | `LEGACY-NR-Q-006` | Modelo del equipo recibido |
| C11 IMEI/Serie | `crear_reparacion.php:582-584`; `crear_reparacion.js:1449-1459` | `guardar_reparacion.php` | `reparaciones.imei` | Detalle y token de ticket | `LEGACY-NR-FINDING-004` | `LEGACY-NR-Q-006`, `007` | Identificador de dispositivo |
| C12 Color | `crear_reparacion.php:588-590` | `guardar_reparacion.php` | `reparaciones.color` | Detalle/ticket | `LEGACY-NR-FINDING-004` | `LEGACY-NR-Q-006` | Atributo observable |
| C13 Características | `crear_reparacion.php:592-594`; `guardar_reparacion.php:352,397` | `guardar_reparacion.php` | `reparaciones.caracteristicas` | Detalle/ticket posible | `LEGACY-NR-FINDING-004` | `LEGACY-NR-Q-008` | Condición/accesorios/rasgos, por validar |
| C14 Chip | `crear_reparacion.php:596-602` | `guardar_reparacion.php` | `reparaciones.chip` | Detalle/ticket | `LEGACY-NR-FINDING-012` | `LEGACY-NR-Q-011` | Accesorio recibido/custodia |
| C15 Memoria | `crear_reparacion.php:604-610` | `guardar_reparacion.php` | `reparaciones.memoria` | Detalle/ticket | `LEGACY-NR-FINDING-012` | `LEGACY-NR-Q-011` | Accesorio recibido/custodia |
| C16 Falla | `crear_reparacion.php:618-622`; `crear_reparacion.js:709-783` | catálogos; `guardar_reparacion.php` | `reparaciones.falla`; `configuracion_reparaciones.valor` | Lista/filtro/detalle/ticket | `LEGACY-NR-FINDING-005` | `LEGACY-NR-Q-014`, `017` | Problema reportado/categoría |
| C17 Testimonio | `crear_reparacion.php:625-627`; `guardar_reparacion.php:351,396` | `guardar_reparacion.php` | `reparaciones.testimonio` | Detalle/ticket posible | `LEGACY-NR-FINDING-005` | `LEGACY-NR-Q-015`, `017` | Declaración del cliente |
| C18 Posible garantía | `crear_reparacion.php:631-637`; `guardar_reparacion.php:354` | `guardar_reparacion.php` | `reparaciones.posible_garantia` | Detalle/ticket; sin regla encontrada | `LEGACY-NR-FINDING-006` | `LEGACY-NR-Q-023`, `024` | Intención/solicitud de garantía |
| C19 Folio anterior | `crear_reparacion.php:639-641`; `guardar_reparacion.php:355` | `guardar_reparacion.php` | `reparaciones.folio_anterior` | Detalle/ticket; relación sólo textual | `LEGACY-NR-FINDING-006` | `LEGACY-NR-Q-025`, `026` | Relación con orden antecedente |
| C20 Recibido encendido/apagado | `crear_reparacion.php:643-649`; normalizadores FE/BE | `guardar_reparacion.php` | `reparaciones.recibido` | Detalle/ticket; sin efecto posterior encontrado | `LEGACY-NR-FINDING-012` | `LEGACY-NR-Q-010` | Observación al recibir |
| C21 Riesgo | `crear_reparacion.php:651-659`; `guardar_reparacion.php:356-359` | `catalogos_buscar.php`; `guardar_reparacion.php` | `reparaciones.riesgo`; catálogo en `configuracion_reparaciones` | Detalle/ticket | `LEGACY-NR-FINDING-007` | `LEGACY-NR-Q-012`, `013` | Riesgo comunicado/aceptación |
| C22 Tipo de seguridad | `crear_reparacion.php:661-669`; `crear_reparacion.js:406-445` | `guardar_reparacion.php` | `reparaciones.tipo_seguridad` | Controla captura y visualización | `LEGACY-NR-FINDING-008` | `LEGACY-NR-Q-031`, `032` | Mecanismo de acceso temporal |
| C23 Código/patrón | `crear_reparacion.php:671-676`; `patron.js:61-65` | `guardar_reparacion.php`; lectura `obtener_detalle_reparacion.php` | `reparaciones.codigo_seguridad` | Visible en detalle; disponible al ticket y webhook | `LEGACY-NR-FINDING-008`, `022` | `LEGACY-NR-Q-031`–`034` | Credencial temporal sensible |
| C24 SVG de patrón | `patron.js:125-128` | — | — | Sólo miniatura del formulario; no enviado | `LEGACY-NR-FINDING-021` | `LEGACY-NR-Q-031` | Representación visual no persistida |
| C25 Promesa | `crear_reparacion.php:697-702`; `guardar_reparacion.php:353,398,463` | `guardar_reparacion.php` | `reparaciones.promesa_entrega` | Detalle/ticket; sin alertas/filtros encontrados | `LEGACY-NR-FINDING-011`, `020` | `LEGACY-NR-Q-035`–`038` | Estimación/compromiso temporal |
| C26 Presupuesto inicial | `crear_reparacion.php:704-710`; `crear_reparacion.js:1224-1243` | `guardar_reparacion.php` | `reparaciones.presupuesto_inicial` | Detalle/ticket; saldo usa final, no inicial | `LEGACY-NR-FINDING-010` | `LEGACY-NR-Q-018`, `019` | Estimación/cotización inicial |
| C27 Anticipo | `crear_reparacion.php:712-718`; `crear_reparacion.js:1518-1533` | `guardar_anticipo.php`; `obtener_anticipos.php` | `reparacion_pagos.monto` | Saldo, historial y ticket | `LEGACY-NR-FINDING-009`, `010`, `015` | `LEGACY-NR-Q-020`–`022` | Pago recibido/aplicación |
| C28 Origen cliente | `crear_reparacion.js:1491`; `detalle_modal.js:1161` | `guardar_reparacion.php` | `reparaciones.origen_cliente` | Visualización opcional | `LEGACY-NR-FINDING-021` | `LEGACY-NR-Q-042` | Canal de adquisición, si aplica |
| C29 Género | `crear_reparacion.js:1492`; `guardar_reparacion.php:381` | `guardar_reparacion.php` | `reparaciones.genero` | No encontrado fuera de persistencia/config de alta | `LEGACY-NR-FINDING-021` | `LEGACY-NR-Q-042` | Unknown |
| C30 Rango de edad | `crear_reparacion.js:1493`; `guardar_reparacion.php:382` | `guardar_reparacion.php` | `reparaciones.rango_edad` | No encontrado fuera de persistencia/config de alta | `LEGACY-NR-FINDING-021` | `LEGACY-NR-Q-042` | Unknown |
| C31 Estado | `guardar_reparacion.php:383,479`; `detalle_modal.js:1462-1498` | `guardar_reparacion.php`; `guardar_detalle_reparacion.php`; `enviar_webhook_listo.php` | `reparaciones.estado` | Filtros, lista, cierre, webhook | `LEGACY-NR-FINDING-017`, `019` | `LEGACY-NR-Q-042`, `043` | Estado de la orden |
| C32 Entregado | `guardar_reparacion.php:386,480`; `guardar_detalle_reparacion.php:74,98-152` | alta y detalle | `reparaciones.entregado` | Lista, fecha/actor de entrega | `LEGACY-NR-FINDING-017` | `LEGACY-NR-Q-043`, `044` | Estado/hecho de custodia |
| C33 Recibido por | `guardar_reparacion.php:387,475` | `guardar_reparacion.php` | `reparaciones.recibido_por` | Detalle/ticket | `LEGACY-NR-FINDING-016`, `017` | `LEGACY-NR-Q-043` | Actor receptor |
| C34 Fecha recibido | `guardar_reparacion.php:29-49,445` | `guardar_reparacion.php` | `reparaciones.fecha_recibido` | Lista, filtros, detalle, ticket | `LEGACY-NR-FINDING-020` | `LEGACY-NR-Q-036`, `043` | Instante de recepción |
| C35 Tenant | guards y contexto de endpoints | todos los endpoints | `tenant_id` en tablas operativas | Aislamiento/ownership | `LEGACY-NR-FINDING-016` | `LEGACY-NR-Q-039`, `045` | Organización |
| C36 Sucursal | guards y contexto de endpoints | todos los endpoints | `sucursal_id` en tablas operativas | Numeración, catálogos, aislamiento, ticket | `LEGACY-NR-FINDING-016`, `020` | `LEGACY-NR-Q-039`–`041` | Sucursal operativa/custodia |
| C37 Método de pago | `guardar_anticipo.php:50-52,79-90` | `guardar_anticipo.php`; `obtener_anticipos.php` | `reparacion_pagos.metodo_pago` | Historial/ticket | `LEGACY-NR-FINDING-010` | `LEGACY-NR-Q-020`, `022` | Propósito y medio de pago, por separar |
| C38 Fecha de pago | `guardar_anticipo.php:26-43,62,89` | `guardar_anticipo.php`; `obtener_anticipos.php` | `reparacion_pagos.fecha` | Orden/historial/ticket | `LEGACY-NR-FINDING-020` | `LEGACY-NR-Q-022`, `036` | Instante de pago |
| C39 Usuario de pago | `guardar_anticipo.php:22,80-90` | `guardar_anticipo.php`; `obtener_anticipos.php` | `reparacion_pagos.usuario` | Historial/ticket | `LEGACY-NR-FINDING-016`, `017` | `LEGACY-NR-Q-022`, `043` | Actor/cajero |

## Endpoints y rutas inspeccionados

| # | Ruta | Papel en la auditoría |
|---:|---|---|
| 1 | `public_html/sistema/funciones/reparaciones/form_config_get.php` | Configuración efectiva del formulario. |
| 2 | `public_html/sistema/funciones/reparaciones/catalogos_buscar.php` | Búsqueda de marca/modelo/falla/riesgo. |
| 3 | `public_html/sistema/funciones/reparaciones/catalogos_upsert.php` | Alta de marca/modelo/falla. |
| 4 | `public_html/sistema/funciones/reparaciones/clientes_buscar.php` | Búsqueda de cliente. |
| 5 | `public_html/sistema/funciones/reparaciones/cliente_upsert.php` | Ruta alterna de upsert; no invocada por el alta actual. |
| 6 | `public_html/sistema/funciones/catalogos/paises_activos.php` | Países y prefijos telefónicos. |
| 7 | `public_html/sistema/funciones/reparaciones/obtener_siguiente_folio.php` | Cálculo de folio candidato. |
| 8 | `public_html/sistema/funciones/reparaciones/guardar_reparacion.php` | Alta transaccional cliente+orden. |
| 9 | `public_html/sistema/funciones/reparaciones/guardar_anticipo.php` | Escritura separada de pago. |
| 10 | `public_html/sistema/funciones/imprimir_ticket/funciones/imprimir_ticket.php` | Nota cliente/tienda. |
| 11 | `public_html/sistema/funciones/reparaciones/obtener_reparaciones.php` | Lista y filtros. |
| 12 | `public_html/sistema/funciones/reparaciones/obtener_detalle_reparacion.php` | Lectura completa por folio. |
| 13 | `public_html/sistema/funciones/reparaciones/guardar_detalle_reparacion.php` | Estado, técnico, presupuesto final y entrega. |
| 14 | `public_html/sistema/funciones/reparaciones/obtener_anticipos.php` | Historial/suma de pagos. |
| 15 | `public_html/sistema/funciones/reparaciones/guardar_seguimiento.php` | Comentario y evidencia. |
| 16 | `public_html/sistema/funciones/reparaciones/obtener_seguimientos.php` | Historial de seguimiento. |
| 17 | `public_html/sistema/funciones/reparaciones/obtener_evidencias.php` | Evidencias por folio. |
| 18 | `public_html/sistema/funciones/reparaciones/enviar_webhook_listo.php` | Webhooks en intento de cierre. |

## Cobertura de tablas

Las once tablas observadas son: `reparaciones`, `reparaciones_clientes`, `reparaciones_form_config`, `configuracion_reparaciones`, `configuracion_global`, `catalogo_paises`, `reparacion_pagos`, `reparacion_seguimientos`, `archivos`, `plantillas_editor` y `sucursales`.

No se encontró trigger del flujo en SQL versionado. El esquema productivo y el contenido vigente de las plantillas permanecen `Unknown` sin acceso controlado a la base correspondiente.
