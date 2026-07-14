# Mapa del flujo “Nueva Reparación”

- **Estado:** Confirmed by legacy code
- **Propósito:** Reconstruir la secuencia real, variantes, escrituras, efectos secundarios y puntos de fallo.
- **Alcance:** Apertura, captura, alta, anticipo, impresión, recarga y funciones inmediatamente habilitadas.
- **Fuente:** SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
- **Audiencia:** Product Owner, Domain Experts, Arquitectura, Seguridad, QA y desarrollo.
- **Última actualización:** 2026-07-14

> Evidencia de legado; no prescribe la orquestación de SR Taller 2.0.

## Flujo principal

1. **Abrir formulario — síncrono de UI.** El panel ejecuta `abrirModalReparacion()` y carga `crear_reparacion.php` en un `iframe`. Evidencia: `panel.php:28-33,161-184`; `modal_reparacion.js:1-45`.
2. **Inicializar — lecturas paralelas.** El JavaScript solicita configuración efectiva, países, riesgos y un folio candidato. También instala buscadores y validadores. Evidencia: `crear_reparacion.js:1309-1334`.
3. **Buscar/seleccionar cliente — opcional.** Con nombre, apellido o teléfono se llama `clientes_buscar.php`; al elegir se carga el ID maestro. Cambiar nombre o teléfono limpia esa selección. Evidencia: `crear_reparacion.js:876-1027,1194-1221`.
4. **Resolver catálogos — interactivo.** Marca, modelo y falla ofrecen coincidencias y pueden crear un valor; riesgo sólo carga opciones configuradas. Evidencia: `crear_reparacion.js:709-783,1149-1167`.
5. **Capturar recepción.** El usuario registra cliente, equipo, problema, condición, garantía tentativa, riesgo, seguridad, promesa, estimación y anticipo. El patrón se convierte a una secuencia como `1-2-5`; el SVG queda sólo en el navegador. Evidencia: `crear_reparacion.php:520-730`; `patron.js:61-131`.
6. **Validar en navegador.** Se aplican requeridos configurables, teléfono, opciones canónicas, seguridad condicional, IMEI alfanumérico e importes enteros no negativos. Evidencia: `crear_reparacion.js:1376-1460`.
7. **Refrescar folio candidato.** Justo antes de guardar se vuelve a llamar `obtener_siguiente_folio.php`; si cambió, se sustituye el payload. No hay reserva ni bloqueo. Evidencia: `crear_reparacion.js:1499-1506`; `obtener_siguiente_folio.php:25-40`.
8. **Crear cliente y reparación — escritura transaccional.** `guardar_reparacion.php` valida contexto/CSRF, resuelve configuración, hace upsert del cliente e inserta `reparaciones`; ambas operaciones comparten transacción. La orden nace al completar el `INSERT`. Evidencia: `guardar_reparacion.php:404-515`.
9. **Registrar anticipo — escritura posterior opcional.** Si el monto normalizado es mayor que cero, el navegador llama `guardar_anticipo.php`, que verifica la reparación e inserta `reparacion_pagos`. No comparte transacción con el alta. Evidencia: `crear_reparacion.js:1516-1533`; `guardar_anticipo.php:45-93`.
10. **Solicitar impresión y refrescar — efectos de cliente.** Tras éxito se cierra el modal, se abre el ticket `tipo=cliente` y se recarga el panel. Evidencia: `crear_reparacion.js:1535-1541`.
11. **Generar nota — lectura dinámica.** El endpoint obtiene la plantilla asignada, reparación, sucursal y último pago; reemplaza tokens y llama `window.print()`. No registra impresión. Evidencia: `imprimir_ticket.php:153-299`.
12. **Habilitar operación posterior.** Al recargar, la orden aparece en la lista. Desde su detalle se pueden cargar seguimientos/fotos, agregar pagos, imprimir cliente/tienda, abrir WhatsApp y cambiar técnico/estado/presupuesto final/entrega. Evidencia: `reparaciones.js:878-930`; `detalle_modal.js:1031-1265,1400-1530,1811-1975`.

## Variaciones

| Variante | Resultado |
|---|---|
| Cliente encontrado y seleccionado | Se reutiliza su ID; nombre/teléfono se copian a la reparación. |
| Cliente no encontrado | Se crea dentro de la transacción del alta. |
| Dos personas comparten teléfono | La clave de deduplicación puede resolverlas al mismo cliente maestro. |
| Sin anticipo o `0` | No se crea fila en `reparacion_pagos`; la orden sí se crea. |
| Con anticipo | Se intenta una segunda escritura después de confirmar la orden. |
| Sin fotos | La orden queda válida; no existe bloqueo ni indicador de pendiente encontrado. |
| Seguridad `no_tiene` | `codigo_seguridad` se guarda vacío. |
| Seguridad PIN/patrón | El valor reversible se guarda en la misma columna. |
| Garantía `si` sin folio anterior | El backend lo permite; no se encontró validación cruzada. |
| Impresión bloqueada por navegador | La reparación permanece creada; no hay reintento ni estado de entrega de nota. |

## Operaciones de base de datos

| Orden | Operación | Transacción | Clave de relación |
|---:|---|---|---|
| 1 | `SELECT` configuración, catálogos, países, clientes y último folio | No aplica | tenant/sucursal |
| 2 | `INSERT` opcional en `reparaciones_clientes` + `INSERT` en `reparaciones` | Sí, una transacción | ID de cliente y contexto |
| 3 | `INSERT` opcional en `reparacion_pagos` | No comparte la anterior | folio + tenant + sucursal |
| 4 | Lectura de `configuracion_reparaciones`, `plantillas_editor`, `reparaciones`, `sucursales`, `reparacion_pagos` | No | folio/contexto/plantilla |
| 5 | `INSERT` posterior en `reparacion_seguimientos` y, si hay imagen, en `archivos` | No se encontró transacción entre ambas | folio y ruta R2 |
| 6 | `UPDATE` posterior de técnico/estado/presupuesto final/entrega | No | folio + tenant + sucursal |

No se encontró trigger relacionado con este flujo en los archivos SQL versionados. Tampoco se encontró un esquema completo versionado de `reparaciones` que permita confirmar restricciones productivas.

## Puntos de fallo y escrituras parciales

| Punto | Comportamiento observado | Estado posible |
|---|---|---|
| Carga inicial de folio | Sólo escribe error en consola. | Formulario abierto sin folio visible. |
| Refresco final de folio | Una excepción aborta el bloque de guardado; una respuesta válida sin folio conserva el candidato anterior. | No creado o candidato obsoleto. |
| Colisión de folio | Dos sesiones calculan el mismo siguiente valor; no hay bloqueo/reserva. | Una o dos altas según restricciones reales, que son `Unknown`. |
| Alta de cliente o reparación | Rollback de ambas escrituras. | No creado. |
| Anticipo después del alta | Se muestra error y se detiene antes de imprimir/recargar; no se revierte la orden. | Reparación creada sin pago esperado. |
| Abrir ventana de ticket | No se verifica el resultado de `window.open`. | Orden creada sin evidencia de nota impresa. |
| Lectura de último pago para ticket | Doble `fetch()` sobrescribe el primer resultado. | Tokens de pago vacíos/`0.00` aun con pago. |
| Carga R2 | Falla antes de insertar seguimiento. | Orden existente sin nueva foto. |
| Insertar `archivos` | Ocurre después de insertar seguimiento, sin transacción común. | Seguimiento/evidencia referenciada pero inventario incompleto. |
| Webhook de cierre | Se ejecuta antes del `UPDATE`; los fallos de negocio de la respuesta no detienen necesariamente el guardado. | Notificación con estado anterior o divergencia. |

## Dependencias externas

- Sesión autenticada con tenant, sucursal y nombre de usuario.
- Dos conexiones de datos: sistema y SaaS (`catalogo_paises`, `sucursales`).
- R2 para evidencia y proxy de imágenes.
- SweetAlert2 desde CDN en el formulario/detalle.
- Navegador para popup e impresión.
- WhatsApp `wa.me` sólo por acción manual posterior.
- Webhooks configurados por sucursal sólo durante transición posterior a cierre.
- HTML/CSS de ticket guardado en `plantillas_editor`.

## Impresión, evidencia y mensajes

- **Impresión:** se intenta después de alta y anticipo; usa la plantilla de cliente activa. Puede reimprimirse como cliente o tienda desde el detalle (`detalle_modal.js:1400-1414`). No hay contador, snapshot ni estado “nota entregada”.
- **Fotografías:** se agregan después de recargar y abrir el detalle. Se validan como imagen, máximo 10 MB; JPEG/PNG se recomprimen y WebP se conserva (`guardar_seguimiento.php:70-126`). Se guardan en R2 bajo `evidencias/{tenant}/{sucursal}/{folio}/...` y se registran por folio. Las rutas de eliminación administrativas existen pero están deshabilitadas al inicio con HTTP 503; no hay reemplazo desde reparaciones.
- **Mensajes:** no se encontró envío al crear. WhatsApp abre una conversación manual con el teléfono snapshot. El webhook de cierre es posterior y transmite toda la fila de reparación a URLs configuradas (`enviar_webhook_listo.php:40-98`).

## Estado final inmediato

Si no hay error, queda:

- una reparación `Pendiente` y `En Tienda`;
- un cliente maestro reutilizado o creado, más snapshot de nombre/teléfono;
- datos del equipo embebidos en la reparación;
- cero o una fila inicial de pago;
- una solicitud de impresión de ticket de cliente, no auditada;
- la lista recargada;
- sin mensaje automático;
- sin evidencia, hasta una acción posterior explícita.

Si falla el anticipo, la reparación ya existe, el modal queda abierto en el punto de error y no se solicita la impresión ni la recarga en esa ejecución.
