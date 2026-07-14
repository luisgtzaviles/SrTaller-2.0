# Auditoría del mecanismo de configuración

**Estado:** `Pending Product Owner validation`.
**Corte fuente:** `srtaller`, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.

## Resumen ejecutivo

La pantalla llamada “Campos obligatorios” administra una lista allowlisted de 19 claves. El formulario permanece estático y visible; seleccionar una clave agrega indicadores visuales y validación de no vacío. La única clave fija es `nombre`: aparece marcada y deshabilitada en el panel, el normalizador la reinserta si se intenta quitar y el alta vuelve a exigir un cliente nombrado.

El mecanismo no representa por sí solo una política de recepción:

- no modela el comienzo de custodia, aunque una creación exitosa inserta la orden con `fecha_recibido = NOW()`, actor de sesión, estado `Pendiente` y `entregado = En Tienda`;
- no exige identificación mínima consistente del objeto: marca, modelo e IMEI se pueden volver opcionales;
- no modela evidencia, consentimiento, entregante, completitud ni excepción autorizada;
- no aplica condiciones de garantía–folio anterior, riesgo–consentimiento, daño–evidencia o IMEI–accesibilidad;
- permite exigir un anticipo positivo, pero el movimiento se crea después y fuera de la transacción de la orden;
- exige credencial o patrón cuando se declara ese tipo de bloqueo y guarda el secreto en `reparaciones.codigo_seguridad`;
- mezcla defaults de datos, modo de presentación y obligatoriedad en un mismo JSON.

La lista sí tiene enforcement backend para la mayoría de sus claves. No es sólo ayuda visual. Sin embargo, `riesgo` y `tipo_seguridad` se completan con defaults antes de la comprobación backend, por lo que una llamada directa puede omitirlos incluso cuando la configuración los marca requeridos. Frontend y backend también cargan la configuración en momentos distintos: un formulario abierto conserva una copia, mientras el backend resuelve la configuración actual al enviar.

**Conclusión:** es configuración de obligatoriedad del formulario clásico con precondiciones de creación parciales y defaults heredados. No controla visibilidad, orden ni una política íntegra de aceptación de custodia.

## Método y autoridad de la evidencia

Se reconstruyó primero el grafo de participantes mediante búsquedas por `required_fields`, `form_config`, `reparaciones_form_config`, `capture_mode`, `guided_v2`, `scope`, `default`, `merge`, `required`, `evidencia`, `credencial`, `consentimiento`, `excepcion`, `cache`, `historial` y operaciones SQL. Después se siguieron carga, edición, guardado y consumo hasta la inserción de orden y anticipo.

Las referencias `srtaller@9357b86:path:líneas` apuntan al repositorio origen. La evidencia de código confirma comportamiento versionado, no configuración desplegada ni práctica operativa.

## Archivos participantes inspeccionados

| Superficie | Archivo o símbolo | Papel comprobado |
|---|---|---|
| Registro y resolución | `public_html/sistema/includes/reparaciones_form_config.php` | Registro de 19 campos, defaults, allowlist, normalización, merge, lectura y upsert. |
| Lectura HTTP | `public_html/sistema/funciones/reparaciones/form_config_get.php` | Expone configuración efectiva, capas, registro y warnings. |
| Escritura HTTP | `public_html/sistema/funciones/reparaciones/form_config_save.php` | Autoriza, valida alcance sucursal y persiste el JSON. |
| Vista del panel | `public_html/sistema/views/ajustes/catalogos_modulo.php` | Aloja la pestaña Nueva Reparación. |
| Parcial del panel | `public_html/sistema/views/ajustes/partials/nueva_reparacion_config.php` | Modo clásico, V2 deshabilitado, alcance y botones. |
| Cliente del panel | `public_html/sistema/funciones/reparaciones/js_css/form_config_panel.js` | Carga, render, payload, guardado y reset en memoria. |
| Vista de alta | `public_html/sistema/views/reparaciones/crear_reparacion.php` | Controles estáticos y claves `data-field-key`. |
| Cliente de alta | `public_html/sistema/funciones/reparaciones/js_css/crear_reparacion.js` | Copia local de defaults, carga efectiva, validación y secuencia de creación. |
| Alta backend | `public_html/sistema/funciones/reparaciones/guardar_reparacion.php` | Re-resuelve configuración, valida e inserta cliente y orden. |
| Cliente maestro | `public_html/sistema/includes/reparaciones_clientes.php` | Nombre fijo, teléfono condicional y deduplicación. |
| Anticipo | `public_html/sistema/funciones/reparaciones/guardar_anticipo.php` | Inserción separada en `reparacion_pagos`. |
| Folio | `public_html/sistema/funciones/reparaciones/obtener_siguiente_folio.php` | Predice el siguiente folio por último registro de sucursal. |
| Guards | `public_html/sistema/includes/guards.php` | Contexto de sesión, método y permiso opcional. |
| Acceso a vista | `public_html/sistema/includes/view_guard.php`, `public_html/sistema/index.php` | Allowlist, plan/rol y alias de permiso. |
| Esquema versionado | `database/migrations/2026_06_11_v1_0005_reparaciones_clientes_form_config.sql` | Tabla JSON, clave única e índices. |
| Consumidor sensible | `public_html/sistema/funciones/imprimir_ticket/funciones/imprimir_ticket.php` | Humaniza campos y sólo borra el secreto si el tipo es `no_tiene`. |
| Evidencia posterior | `guardar_seguimiento.php`, `obtener_evidencias.php`, `detalle_modal.js` | Confirma que las fotos existen después de crear, no como requisito del alta. |

No se encontró otra ruta versionada de escritura o borrado para `reparaciones_form_config`, una implementación real de `guided_v2`, historial de cambios, cache propia de esta configuración ni invalidación de formularios abiertos. Estado: `Not found`.

## Arquitectura observada

```text
Panel de ajustes                      Nueva Reparación abierta
        |                                      |
        | GET form_config_get                  | GET form_config_get
        v                                      v
      resolver: defaults -> tenant -> sucursal
        |                                      |
        | render checkboxes                    | snapshot + badges/validación
        | POST form_config_save                | POST guardar_reparacion
        v                                      v
 upsert JSON de sucursal             resolver otra vez en backend
                                               |
                                  cliente + orden, una transacción
                                               |
                                  anticipo, segunda petición/insert
                                               |
                                  impresión; evidencia puede ser posterior
```

El panel y el alta llaman al mismo endpoint de lectura, pero cada cliente mantiene su propio estado JavaScript. El backend del alta no confía en la lista enviada por el navegador: ignora cualquier política del payload y consulta de nuevo la fila efectiva.

## Qué configura realmente

| Dimensión | Resultado | Evidencia | Estado |
|---|---|---|---|
| Obligatoriedad | Sí, lista de 19 claves allowlisted; `nombre` bloqueado. | Registro y normalización en `reparaciones_form_config.php:14-58,121-146`. | `Confirmed by legacy code` |
| Visibilidad | No; los controles se renderizan siempre en PHP. La configuración sólo cambia clases y `aria-required`. | `crear_reparacion.php:532-721`; `crear_reparacion.js:486-526`. | `Confirmed by legacy code` |
| Orden | No; lo fija el HTML y una lista JavaScript de orden de validación. | `crear_reparacion.js:65-86`; vista `:533-721`. | `Confirmed by legacy code` |
| Defaults de datos | Sí en JSON, ocho claves; el panel no ofrece editores y siempre envía literales del sistema. | Helper `:60-96`; panel JS `:195-216`. | `Confirmed by legacy code` |
| Modo de captura | La propiedad existe, pero sólo `classic` sobrevive; V2 está deshabilitado y el servidor lo rechaza. | Helper `:9-12,153-157,182-215`; parcial `:19-38`. | `Confirmed by legacy code` |
| Catálogos | No los configura este panel; riesgo, marca, modelo y falla usan mecanismos laterales. | Registro sólo contiene claves; alta JS carga/busca catálogos por endpoints separados. | `Confirmed by legacy code` |
| Condicionalidad | Dos reglas fijas: PIN/contraseña o patrón según `tipo_seguridad`; no son editables. | Helper `:84-95`; alta backend `:361-379`. | `Confirmed by legacy code` |
| Política de custodia | No existe como regla configurable. La inserción fija fecha, actor, estado y ubicación de custodia. | Alta backend `:383-387,435-484`. | `Confirmed by legacy code` |
| Finalización posterior | No; no hay estado de recepción completa ni obligación de evidencia. | Búsqueda amplia del alta/config; evidencia sólo aparece en seguimiento/detalle. | `Not found` |

### Semántica de las etiquetas

“Opcional” significa únicamente que la clave no está en `required_fields`. El control sigue visible. Los textos y cuatro selects opcionales pueden persistir como cadena vacía; `riesgo` y `tipo_seguridad` no quedan vacíos porque reciben `no_aplica` y `no_tiene`; el resto puede persistirse vacío o derivarse. No significa oculto, diferido ni completado después.

“Fijo” sólo se aplica a `nombre`, pero no es una etiqueta decorativa: el checkbox está deshabilitado, la allowlist lo reinserta, el backend lo comprueba y `sr_reparaciones_cliente_upsert(..., true, ...)` vuelve a exigir un nombre. Que sea visible deriva del HTML estático, no de `locked_required`. Evidencia: panel JS `:125-145`; helper `:49-58,136-140`; cliente maestro `reparaciones_clientes.php:20-60,153-158`.

## Flujo de carga

1. El navegador llama `GET /sistema/funciones/reparaciones/form_config_get.php` con cookies de misma procedencia.
2. El guard exige usuario, tenant y sucursal de sesión y prohíbe overrides de contexto en el request; no exige un permiso funcional específico (`form_config_get.php:6-21`).
3. El resolver construye defaults de aplicación y consulta dos claves exactas: `(tenant_id, '', nueva_reparacion)` y `(tenant_id, sucursal_id, nueva_reparacion)` (`reparaciones_form_config.php:228-249,275-293`).
4. Aplica sistema, luego tenant y luego sucursal. `required_fields` reemplaza la lista completa; `defaults` se mezcla por clave; al final normaliza (`:252-272`).
5. Devuelve configuración efectiva y las tres capas. El panel conserva `effective` y `field_registry`, pero descarta la procedencia de `layers` (`form_config_panel.js:163-186`).
6. El alta conserva sólo `effective`, fuerza `classic` y combina otra copia local de defaults (`crear_reparacion.js:486-526`).
7. Si falla la lectura HTTP, ambos clientes usan sus copias JavaScript. Si falla la consulta DB dentro del helper, el endpoint puede responder éxito con warning y defaults/capas recuperables (`reparaciones_form_config.php:282-307`).

“Configuración efectiva cargada” sólo significa que el endpoint respondió `ok` y que se renderizó el resultado fusionado. La pantalla no muestra qué capa aportó cada valor, ni si un valor quedó congelado por un override de sucursal.

## Flujo de guardado

1. El panel recolecta todos los checkboxes marcados, no sólo cambios, y fija `scope = sucursal`, `capture_mode = classic` y los ocho defaults del sistema (`form_config_panel.js:195-216`).
2. Envía JSON con CSRF a `POST /sistema/funciones/reparaciones/form_config_save.php` (`:219-250`).
3. El endpoint exige usuario, tenant, sucursal y permiso `ajustes/catalogos_modulo`; rechaza `tenant_id` o `sucursal_id` en el body y cualquier scope distinto de `sucursal` (`form_config_save.php:8-18,23-56`).
4. El validador rechaza modo distinto de clásico y claves desconocidas, deduplica y reinserta `nombre` (`reparaciones_form_config.php:121-146,182-215`).
5. Un solo `INSERT ... ON DUPLICATE KEY UPDATE` reemplaza el JSON completo de esa clave de sucursal (`:311-323`). La sentencia es atómica a nivel de fila, pero no hay versión optimista ni detección de edición concurrente.
6. El servidor vuelve a resolver y responde la configuración efectiva; el panel la renderiza.

Guardar “Sucursal actual” significa la sucursal y tenant de la sesión, no los recibidos del navegador. No existe opción publicada para escribir tenant o global. La capa tenant es legible si una fila ya existe, pero su origen operativo es `Unknown`.

### Efecto de congelación

Guardar desde el panel escribe la lista efectiva completa como override de sucursal. Cambios futuros del tenant dejan de propagarse a esa lista. Además, el panel envía los ocho defaults hardcodeados del sistema; por ello una edición de checkboxes puede enmascarar defaults tenant aunque la UI no los muestre. Esta consecuencia está confirmada por la combinación de `collectPayload()` (`form_config_panel.js:195-216`), reemplazo de listas (`reparaciones_form_config.php:265-270`) y upsert completo (`:311-323`).

## Restauración

El botón “Restaurar defaults en pantalla” sólo reemplaza `state.effective.required_fields` por seis claves JavaScript y vuelve a renderizar (`form_config_panel.js:261-267`). No llama al servidor, no borra fila y no recupera herencia.

Si después se pulsa guardar:

- se mantiene o crea una fila de sucursal;
- queda guardada la lista default completa, no una ausencia de override;
- se guardan también los ocho defaults hardcodeados;
- la sucursal continúa bloqueando cambios tenant posteriores.

No se encontró endpoint `DELETE`, acción de “heredar”, historial, confirmación antes de reset/guardado ni reconstrucción de una versión anterior. Estado: `Not found`.

## Consumo al crear la orden

El formulario carga una copia al abrir. Al pulsar guardar:

- valida no vacío según su copia;
- normaliza teléfono, selects e importes;
- aplica condiciones fijas de credencial;
- vuelve a solicitar un folio y llama `guardar_reparacion.php` (`crear_reparacion.js:1376-1514`).

El backend obtiene otra vez la configuración efectiva (`guardar_reparacion.php:323-337`), valida, abre una transacción, hace upsert de cliente e inserta la orden. El commit exitoso precede a la respuesta (`:404-494`). Según el contexto de dominio aportado, ése es el punto en que nacen orden y custodia.

El frontend procesa un anticipo positivo mediante `guardar_anticipo.php` sólo después del éxito de la orden (`crear_reparacion.js:1516-1533`). Si la segunda petición falla, la orden y custodia ya quedaron confirmadas. Impresión ocurre aún después; evidencia se agrega desde detalle/seguimiento, por lo que sus fallos no revierten creación.

## Seguridad y autorización

| Control | Lectura config | Guardado config | Creación orden | Anticipo | Estado |
|---|---|---|---|---|---|
| Método | GET | POST | POST | POST | `Confirmed by legacy code` |
| Sesión autenticada | Sí | Sí | Sí | Sí | `Confirmed by legacy code` |
| Tenant/sucursal requeridos | Sí | Sí | Sí | Sí | `Confirmed by legacy code` |
| Contexto desde sesión | Sí | Sí; además rechaza claves en body | Sí | Sí | `Confirmed by legacy code` |
| Permiso específico | No | `ajustes/catalogos_modulo` | No | No | `Confirmed by legacy code` |
| CSRF | No aplica a GET | Sí | Sí | Sí | `Confirmed by legacy code` |
| Auditoría de actor del cambio | No encontrada | No encontrada | `recibido_por` desde sesión | `usuario` desde sesión | `Confirmed by legacy code` |

La vista requiere permiso de plan/rol para `ajustes/catalogos_modulo` y acepta como alias `ajustes/configuraciones` (`view_guard.php:116-120,269-294`; `index.php:42-64`). Qué roles concretos lo poseen depende de datos activos y es `Unknown`. El endpoint de escritura repite el permiso; no depende sólo de ocultar la vista.

La lectura de configuración y la creación de orden no especifican permiso `reparaciones/panel`. Una sesión válida con contexto y CSRF puede invocar directamente el alta aunque no haya pasado por el frontend; si existe otra barrera externa no es visible en estos endpoints. Revisión: `Pending security review`.

La separación tenant/sucursal es fuerte en las consultas inspeccionadas: el request no decide contexto y la clave única incluye ambos IDs. Con la migración versionada aplicada, `NULL` no representa niveles porque ambas columnas son `NOT NULL`; cadena vacía representa capa tenant en `sucursal_id`. Una fila con `tenant_id = ''` sería almacenable por esquema, pero el resolver no la consulta como global.

## Defaults de aplicación y base versionada

| Tipo | Valores | Estado |
|---|---|---|
| Requeridos de aplicación | `nombre`, `telefono_nacional`, `marca`, `modelo`, `falla`, `tipo_seguridad` | `Confirmed by legacy code` |
| Defaults de aplicación | `codigo_pais=52`, `origen_cliente=no_capturado`, `genero=no_info`, `rango_edad=no_capturado`, `riesgo=no_aplica`, `tipo_seguridad=no_tiene`, `estado=Pendiente`, `entregado=En Tienda` | `Confirmed by legacy code` |
| Modo | `schema_version=1`, `capture_mode=classic`, `guided_v2_available=false` | `Confirmed by legacy code` |
| Condiciones fijas | `codigo_seguridad` si PIN/contraseña; `patron_seguridad` si patrón | `Confirmed by legacy code` |
| Defaults de tabla de config | `tenant_id=''`, `sucursal_id=''`, timestamps automáticos; `valor` JSON sin default | `Confirmed by legacy code` |
| Defaults de tabla `reparaciones` | No hay `CREATE TABLE reparaciones` en las migraciones inspeccionadas; el alta envía valores explícitos | `Unknown` |
| Estado real de migración/datos | No se consultó base | `Unknown` |

## Riesgos principales

1. **Política incompleta:** se puede crear custodia sin evidencia, consentimiento, entregante ni completitud explícita.
2. **Objeto poco identificable:** marca, modelo e IMEI pueden quedar opcionales; sólo nombre del cliente permanece fijo.
3. **Required no uniforme:** riesgo y tipo de seguridad admiten omisión directa por defaults backend.
4. **Configuración congelada:** guardar sucursal copia valores efectivos y defaults, ocultando cambios tenant futuros.
5. **Sin historia ni actor:** sólo quedan `created_at` y `updated_at`; no se sabe quién cambió qué ni se puede reconstruir una política pasada.
6. **Secreto persistido:** PIN o patrón se almacena en una columna general y se expone al detalle; no se encontró minimización o ciclo de vida en este mecanismo.
7. **Anticipo no atómico:** “obligatorio” valida un número, no la confirmación del pago dentro de la creación.
8. **Promesa débil:** `datetime-local` se persiste como texto limpio sin validación de futuro, zona, ambigüedad ni autorización.
9. **Carrera de configuración:** cliente y servidor pueden aplicar versiones distintas durante un mismo alta.
10. **Fallo silencioso de DB:** el resolver puede degradar a defaults; la operación no registra en la orden qué política se aplicó.

## Conclusión

El mecanismo legacy no debe copiarse como la Política de Recepción de SR Taller 2.0. Su valor es mostrar tres necesidades separables:

- una política de qué información mínima o condicional habilita la creación;
- una decisión de alcance y gobernanza sobre qué parte puede cambiar tenant o sucursal;
- una experiencia de captura que presenta esa política sin redefinirla.

La creación exitosa sí constituye una frontera técnica clara y coincide con el contexto de custodia aportado, pero el sistema no conserva la versión de política aplicada ni prueba que identidad del objeto, riesgo, evidencia o pago estén completos. Las clasificaciones candidatas y preguntas de este paquete deben validarse antes de cualquier diseño futuro.
