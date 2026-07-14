# Alcance, herencia y precedencia

**Estado:** `Pending architecture review`.
**Resultado:** existen tres niveles activos de resolución —sistema, tenant y sucursal—, pero sólo la sucursal tiene una ruta versionada de escritura. No existe una capa global activa.

## Modelo observado

| Nivel activo | Clave consultada | Origen | Escritura encontrada | Precedencia |
|---|---|---|---|---:|
| Sistema | Sin fila; array en código | `sr_reparaciones_form_config_defaults()` | Despliegue de código | 1 |
| Tenant | `(tenant_id sesión, sucursal_id='', config_key='nueva_reparacion')` | Fila JSON | No encontrada en UI/API inspeccionada | 2 |
| Sucursal | `(tenant_id sesión, sucursal_id sesión, config_key='nueva_reparacion')` | Fila JSON | `form_config_save.php` | 3 |

La precedencia aumenta de sistema a sucursal. “Global” no es un nivel resuelto: aunque el esquema versionado permite `tenant_id=''`, ninguna lectura usa `('', '', 'nueva_reparacion')`. `NULL` tampoco representa un nivel porque `tenant_id` y `sucursal_id` están declarados `NOT NULL`.

## Reglas reconstruidas

| ID | Regla observada | Consecuencia | Evidencia | Estado |
|---|---|---|---|---|
| `LEGACY-RPC-SCOPE-001` | La clave funcional es siempre `nueva_reparacion`. | No hay selección de política por formulario, versión o propósito. | `sr_reparaciones_form_config_key()`, helper `:4-7`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-002` | Sistema construye la base en código. | Si no hay filas válidas, seis campos son requeridos y se usan ocho defaults. | Helper `:60-96,275-277`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-003` | Tenant se identifica por sucursal vacía. | Una fila tenant puede afectar todas sus sucursales sin override. | Helper `:228-249,282-284`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-004` | Sucursal usa tenant y sucursal exactos de sesión. | El override queda aislado al contexto actual. | Helper `:282-284`; save `:23-25,69-75`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-005` | La precedencia es sistema → tenant → sucursal. | Sucursal gana cuando aporta una propiedad reconocida. | Helper `:292-293`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-006` | `required_fields` reemplaza la lista completa. | No hay suma ni resta incremental; una lista tenant/sucursal sustituye la anterior. | Helper `:265-267`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-007` | `defaults` se mezcla por clave. | Un override parcial puede heredar defaults no mencionados. | Helper `:268-270`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-008` | Normalización se aplica después de cada merge. | Sólo sobreviven propiedades reconocidas; `nombre` se reinserta y V2 vuelve a clásico. | Helper `:148-179,252-272`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-009` | Fila ausente, JSON vacío o JSON no objeto equivale a ausencia de capa. | Se hereda el nivel anterior sin error específico. | Helper `:218-225,244-255`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-010` | Error de consulta produce warning y degradación. | Puede operar con sistema y con cualquier capa recuperada antes del error; no aborta necesariamente el alta. | Helper `:275-307`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-011` | El único scope aceptado al guardar es `sucursal`. | `tenant`, `system` o `global` reciben 422. | `form_config_save.php:43-56`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-012` | Tenant y sucursal no se aceptan desde el body. | El usuario no puede apuntar el endpoint a otro contexto mediante esas claves. | `form_config_save.php:23-40`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-013` | Guardar hace upsert del JSON normalizado completo. | Se reemplaza el valor anterior; no se guarda un diff ni versión previa. | Helper `:311-323`. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-014` | Reset sólo modifica memoria; guardar después crea/mantiene override. | Restaurar defaults no elimina fila ni reanuda herencia. | Panel JS `:261-267`; ausencia de DELETE en búsquedas. | `Confirmed by legacy code` |
| `LEGACY-RPC-SCOPE-015` | Unicidad versionada es `(tenant_id, sucursal_id, config_key)`. | Si la migración está aplicada, evita duplicados de la misma capa; el estado activo es desconocido. | Migración `:60-74`. | `Confirmed by legacy code` |

## Semántica exacta del merge

El merge no es un merge JSON genérico. Sólo considera:

- `capture_mode`: reemplazo, luego normalización forzada a `classic`;
- `guided_v2_available`: reemplazo temporal, luego normalización forzada a `false`;
- `required_fields`: reemplazo total si es array;
- `defaults`: merge superficial por clave;
- `schema_version` y `conditional_required`: siempre regresan a los valores del código.

Claves adicionales en la fila se descartan al normalizar. Una clave desconocida dentro de `required_fields` se elimina silenciosamente al leer, pero se reporta como error al guardar por el endpoint oficial. Evidencia: helper `:121-179,182-215,252-272`.

### Matiz de defaults parciales

Una fila escrita manualmente con `defaults` parciales puede heredar las demás claves. Sin embargo, el panel oficial siempre manda las ocho claves con valores hardcodeados (`form_config_panel.js:195-216`), así que una edición normal de sucursal deja un override completo de defaults, aunque el usuario sólo haya tocado checkboxes.

## Ejemplos concretos

### Marca requerida en sistema, opcional en tenant, requerida en sucursal

Suposiciones:

- sistema: `required_fields=[nombre, telefono_nacional, marca, modelo, falla, tipo_seguridad]`;
- tenant: `required_fields=[nombre, telefono_nacional, modelo, falla, tipo_seguridad]`;
- sucursal: `required_fields=[nombre, marca]`.

Resultado: en una sucursal sin fila, marca es opcional por reemplazo tenant. En la sucursal con fila, marca es requerida, pero teléfono, modelo, falla y tipo de seguridad también pasan a opcionales: la lista de sucursal no agrega `marca`; reemplaza todo. Estado: `Confirmed by legacy code`.

### Teléfono opcional en tenant y sin override de sucursal

Si la fila tenant excluye `telefono_nacional` y no existe fila de sucursal, frontend permite vacío y backend crea/deduplica el cliente por nombre. `codigo_pais` queda `52`, `telefono_nacional` y `telefono_e164` quedan vacíos, y la orden conserva `numero_cliente` vacío. Cualquier notificación posterior carecería de destinatario telefónico; no hay notificación en el alta inspeccionada. Estado del efecto de datos: `Confirmed by legacy code`; efecto operativo de notificaciones: `Inferred from legacy behavior`.

### Campo fijo intentando desactivarse

Si un request oficial envía `required_fields=[]`, el validador reinserta `nombre` y guarda `[nombre]`. Si una fila fue escrita fuera del endpoint sin `nombre`, la normalización de lectura también lo reinserta. Además, el upsert de cliente exige nombre. Resultado: no se desactiva. Estado: `Confirmed by legacy code`.

### Cambio tenant después de guardar sucursal

Una sucursal carga la lista efectiva heredada y pulsa guardar sin cambiar checkboxes. El panel persiste esa lista completa en sucursal. Si tenant cambia después, esa sucursal conserva la copia anterior. No hay señal visual de que dejó de heredar. Estado: `Confirmed by legacy code`.

## Fallback y configuración inválida

| Caso | Resultado observado | Estado |
|---|---|---|
| No hay fila tenant | Sistema pasa a la siguiente capa. | `Confirmed by legacy code` |
| No hay fila sucursal | Se conserva sistema+tenant. | `Confirmed by legacy code` |
| `valor` vacío/no JSON/no array | Capa tratada como ausente. | `Confirmed by legacy code` |
| Clave desconocida en lista leída | Se filtra; no genera warning. | `Confirmed by legacy code` |
| Clave desconocida vía save oficial | 422 con `Campo no configurable`. | `Confirmed by legacy code` |
| `required_fields` ausente en fila | Hereda lista anterior. | `Confirmed by legacy code` |
| `required_fields=[]` | Reemplaza por sólo `nombre`. | `Confirmed by legacy code` |
| Default desconocido | Se descarta. | `Confirmed by legacy code` |
| Default conocido vacío/no escalar | Regresa al default del sistema de esa clave. | `Confirmed by legacy code` |
| Error DB al resolver | Warning y fallback; no hay versión aplicada en orden. | `Confirmed by legacy code` |
| Esquema activo distinto de migración | No se consultó base. | `Unknown` |

## Duplicados, índices y conflictos

La migración versionada define:

- primary key `id`;
- unique `uq_reparaciones_form_config_scope (tenant_id, sucursal_id, config_key)`;
- índice `(tenant_id, sucursal_id)`;
- índice `config_key`;
- `valor JSON NOT NULL`;
- timestamps de creación y actualización.

Si esa restricción no existiera en una base activa, `SELECT ... LIMIT 1` sin `ORDER BY` haría no determinista cuál duplicado gana. Con la migración aplicada, el upsert depende de la unique y el conflicto actualiza la fila. El estado real de la restricción es `Unknown` porque no se consultó base.

No hay control de concurrencia: dos administradores pueden cargar la misma versión y el último save reemplaza por completo al anterior. Tampoco hay ETag, número de versión, comparación de `updated_at` ni merge de cambios concurrentes. Estado: `Not found`.

## Atomicidad y auditoría

El save es una sentencia SQL única y, por tanto, atómica para ese valor de fila. No coordina múltiples alcances, porque sólo escribe sucursal. El JSON incluye todos los valores normalizados de la configuración, pero no incluye actor, motivo o versión.

`created_at` y `updated_at` permiten saber cuándo se creó o actualizó una fila si el esquema versionado está activo. No permiten saber quién cambió qué, desde qué valor, por qué, ni qué configuración se aplicó a una orden. No se encontró tabla de historial, event log ni llamada de auditoría para este save. Estado: `Not found`.

## Restauración e herencia

No existe una operación de “borrar override” en las rutas inspeccionadas. El botón de restauración tiene dos estados posibles:

1. antes de guardar: cambio local descartable al salir o recargar;
2. después de guardar: fila de sucursal con defaults explícitos.

En ninguno se restaura la herencia tenant. Para el futuro, decidir si “restaurar defaults” significa sistema, tenant efectivo o eliminación del override es `Pending Product Owner validation`; decidir cómo representarlo es `Pending architecture review`.
