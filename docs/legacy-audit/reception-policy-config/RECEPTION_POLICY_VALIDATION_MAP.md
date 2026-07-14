# Mapa de validación frontend/backend

**Estado:** `Pending security review`.
**Resultado:** la política no depende sólo del navegador, pero frontend y backend duplican defaults y validadores, cargan en momentos distintos y no aplican de forma equivalente todas las claves.

## Secuencia de validación

```text
Abrir formulario
  -> GET config efectiva
  -> guardar snapshot en JavaScript
  -> marcar requeridos

Pulsar Guardar
  -> frontend: no vacío + formatos + condiciones de seguridad
  -> obtener folio otra vez
  -> POST payload de datos (no de política)
  -> backend: resolver config vigente otra vez
  -> normalizar + validar + cliente + INSERT orden
  -> commit
  -> frontend: si anticipo > 0, POST pago separado
```

## Reglas y controles

| ID | Capa | Regla | Resultado/bypass | Evidencia | Estado |
|---|---|---|---|---|---|
| `LEGACY-RPC-VALIDATION-001` | Panel frontend | GET carga `effective` y `field_registry`. | La UI no usa `layers` ni procedencia. | `form_config_panel.js:163-186`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-002` | Panel frontend | Fallback local contiene 19 campos y seis requeridos. | Puede divergir del helper tras despliegues parciales. | Panel JS `:4-42,187-192`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-003` | Panel frontend | `nombre` queda checked y disabled si `locked_required`. | Evita quitarlo por interacción normal. | Panel JS `:125-145`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-004` | Save config backend | Allowlist deriva del registro de 19 claves. | No confía en claves arbitrarias. | Helper `:39-42,121-145`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-005` | Save config backend | Clave desconocida produce 422. | El endpoint oficial no la guarda. | Helper `:182-215`; save `:58-67`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-006` | Lectura config backend | Clave desconocida ya almacenada se filtra sin error. | Config corrupta puede degradarse silenciosamente. | Helper `:121-179,218-272`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-007` | Alta frontend | GET efectiva se conserva en `srRepairFormConfig`. | Es un snapshot; no hay suscripción o refresh pre-submit. | Alta JS `:486-526,1311-1320`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-008` | Alta frontend | Config sólo cambia clases, `data-required-active` y `aria-required`. | No oculta ni reordena controles. | Alta JS `:470-485`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-009` | Alta frontend | Itera controles presentes de `required_fields` y exige `trim()`. | Clave sin control DOM se omite por `filter(Boolean)`. | Alta JS `:528-547,1395-1404`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-010` | Alta frontend | Teléfono requerido: no vacío; México: 10 dígitos; E.164: máximo 15. | Si es opcional, vacío es válido; formato se valida si se captura. | Alta JS `:226-277,1406-1424`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-011` | Alta frontend | Selects aceptan valores canónicos; cuatro permiten vacío si son opcionales. | `chip`, `memoria`, `posible_garantia`, `recibido` guardan vacío. | Alta JS `:24-64,335-382,456-468`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-012` | Alta frontend | Riesgo y tipo de seguridad toman defaults cuando están vacíos y no son select vacío permitido. | Opcional no equivale a ausencia: produce `no_aplica`/`no_tiene`. | Alta JS `:311-333,335-382`; defaults `:94-107`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-013` | Alta frontend | PIN/contraseña exige código; patrón exige patrón. | Condición fija, independiente de checkboxes. | Alta JS `:398-447,1443-1448`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-014` | Alta frontend | IMEI no vacío sólo admite letras/números. | Es validación exclusiva del navegador. | Alta JS `:1449-1460`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-015` | Alta frontend | Anticipo requerido debe normalizar a entero mayor que cero. | Sólo prueba el valor capturado, no un pago confirmado. | Alta JS `:1430-1441`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-016` | Alta backend | Re-resuelve sistema, tenant y sucursal al recibir POST. | No confía en el snapshot ni en required fields del cliente. | `guardar_reparacion.php:323-337`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-017` | Alta backend | Nombre siempre termina requerido por normalizador y cliente maestro. | Incluso una fila manipulada no permite cliente anónimo. | Alta `:389,410-420`; clientes `:20-60,153-158`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-018` | Alta backend | Teléfono reproduce reglas de código país/México/E.164 según required. | Una llamada directa no evita el formato cuando hay valor. | Alta `:271-310,339`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-019` | Alta backend | Textos configurables usan `requireRepairFieldIfConfigured`. | Aplica apellido, marca, modelo, IMEI, color, falla, testimonio, características, promesa y presupuesto. | Alta `:313-320,389-399`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-020` | Alta backend | Cuatro selects opcionales validan sí/no o recibido y sólo aceptan vacío si no son requeridos. | Direct POST inválido recibe 422. | Alta `:123-160,348-360`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-021` | Alta backend | Riesgo vacío se reemplaza por default y luego se valida contra fallback/catálogo. | Marcarlo required no impide omisión en llamada directa. | Alta `:163-230,356-359`; no hay required posterior. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-022` | Alta backend | Tipo de seguridad vacío se reemplaza por `no_tiene`. | Marcarlo required no impide omisión en llamada directa. | Alta `:244-262,361`; no hay required posterior. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-023` | Alta backend | PIN/patrón se exige según tipo y se guarda en una columna común. | Condición sí resiste bypass frontend. | Alta `:362-379,435-484`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-024` | Alta backend | Anticipo required exige cadena numérica limpiada y valor > 0. | No inserta pago en esta transacción. | Alta `:384-401,404-494`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-025` | Efecto posterior | Frontend llama `guardar_anticipo.php` después del commit de orden. | Si falla, la orden permanece y no se imprime/recarga en ese flujo. | Alta JS `:1516-1541`; anticipo PHP `:45-100`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-026` | Autorización | Save config exige permiso y CSRF; alta exige sesión/contexto/CSRF pero no permiso específico. | Invocación directa autenticada sigue posible dentro de esos controles. | Save `:8-18`; alta `:5-23`. | `Confirmed by legacy code` |
| `LEGACY-RPC-VALIDATION-027` | Config cambiante | Frontend usa snapshot antiguo; backend usa configuración vigente. | Endurecer causa 422 tardío; relajar puede dejar bloqueo frontend. | Alta JS `:486-526,1376-1514`; PHP `:323-337`. | `Inferred from legacy behavior` |
| `LEGACY-RPC-VALIDATION-028` | Fallo de resolución | Backend puede usar defaults si falla DB; no guarda versión/política aplicada. | Resultado puede diferir de lo mostrado y no es reconstruible. | Helper `:282-307`; INSERT no contiene referencia de config. | `Confirmed by legacy code` |

## Cobertura por los 19 campos configurables

| Campo | Frontend required | Backend required | Validación adicional | Divergencia relevante |
|---|---|---|---|---|
| `nombre` | No vacío | No vacío + cliente maestro | Normalización de nombre/dedupe | Ninguna material; además es fijo. |
| `apellido` | No vacío si required | No vacío si required | Normalización de apellido | Ninguna material. |
| `telefono_nacional` | Condicional + formato | Condicional + formato | Código país, México 10, E.164 15 | Copias separadas del validador. |
| `marca` | No vacío | No vacío | Title case; catálogo sólo sugerencia | No se exige pertenencia a catálogo. |
| `modelo` | No vacío | No vacío | Title case; catálogo sólo sugerencia | No se exige pertenencia a catálogo. |
| `imei` | No vacío + alfanumérico | Sólo no vacío | `trim()` | Backend acepta caracteres que frontend rechaza. |
| `color` | No vacío | No vacío | Title case | Ninguna material. |
| `chip` | No vacío/canónico | No vacío/canónico | Sí/no | Equivalente en intención. |
| `memoria` | No vacío/canónico | No vacío/canónico | Sí/no | Equivalente en intención. |
| `caracteristicas` | No vacío | No vacío | Sentence case | Ninguna material. |
| `falla` | No vacío | No vacío | Title case; catálogo sólo sugerencia | No se exige pertenencia a catálogo. |
| `testimonio` | No vacío | No vacío | Sentence case | Ninguna material. |
| `posible_garantia` | No vacío/canónico | No vacío/canónico | Sí/no | No condiciona `folio_anterior`. |
| `recibido` | No vacío/canónico | No vacío/canónico | Encendido/apagado → sí/no | Nombre semántico ambiguo. |
| `riesgo` | No vacío si required | Default antes de enforcement | Allowlist/catálogo | Required se puede omitir por API. |
| `tipo_seguridad` | No vacío si required | Default antes de enforcement | Enum + secreto condicional | Required se puede omitir por API. |
| `promesa_entrega` | No vacío | No vacío | Control `datetime-local` | Backend no valida fecha, futuro ni zona. |
| `presupuesto_inicial` | No vacío; sólo dígitos | No vacío después de extraer dígitos | Entero no negativo implícito | `abc1` directo se vuelve `1`; no moneda/decimales. |
| `anticipo` | Entero > 0 | Entero > 0 | Pago separado | Captura requerida no asegura movimiento atómico. |

## Reglas condicionales

| Condición esperada | Implementación encontrada | Capa | Estado |
|---|---|---|---|
| PIN/contraseña si `tipo_seguridad=pin_contrasena` | Sí, frontend y backend. | Fija; no configurable. | `Confirmed by legacy code` |
| Patrón si `tipo_seguridad=patron` | Sí, frontend y backend. | Fija; no configurable. | `Confirmed by legacy code` |
| Folio anterior si posible garantía = sí | No encontrada. | Ninguna. | `Not found` |
| Teléfono si se enviarán notificaciones | No hay modelado de intención de notificar. | Ninguna. | `Not found` |
| Consentimiento si existe riesgo | No hay control/registro de consentimiento separado. | Ninguna. | `Not found` |
| Evidencia si existe daño/riesgo | Evidencia sólo posterior en seguimiento; no condición de alta. | Ninguna en creación. | `Not found` |
| IMEI si se puede consultar | Sólo required absoluto; no estado “no accesible/no aplica”. | Checkbox. | `Not found` |
| Anticipo si política financiera lo exige | Checkbox absoluto; no condición ni confirmación transaccional. | Config + pago posterior. | `Not found` |
| Promesa si se ofreció compromiso | Checkbox absoluto; no captura de “se ofreció”. | Config. | `Not found` |
| Entregante si difiere del cliente | No existe campo en alta. | Ninguna. | `Not found` |

Las condiciones ausentes son preguntas de producto/operación; su presencia en esta tabla no las aprueba como requisitos futuros.

## Bypass y confianza

Un cliente puede omitir todo JavaScript y llamar al endpoint, pero no puede enviar su propia lista de requeridos: el servidor la resuelve. Esto protege la mayoría de reglas. También exige CSRF, usuario, tenant y sucursal, y prohíbe overrides de contexto.

El bypass sí cambia resultados en casos concretos:

- IMEI con caracteres no alfanuméricos es rechazado sólo por frontend;
- `riesgo` required vacío se convierte a `no_aplica` en backend;
- `tipo_seguridad` required vacío se convierte a `no_tiene` en backend;
- cualquier required añadido después de abrir el formulario se descubre sólo al recibir 422;
- la relajación posterior no ayuda a un formulario que aún bloquea localmente.

Por tanto, la política efectiva tiene enforcement real, pero no es uniforme ni versionada.

## Errores y configuración inválida

| Superficie | Error | Respuesta/efecto | Estado |
|---|---|---|---|
| Save config | Scope no sucursal | 422 `scope_not_available`. | `Confirmed by legacy code` |
| Save config | Tenant/sucursal en body | 403. | `Confirmed by legacy code` |
| Save config | Modo V2 | 422. | `Confirmed by legacy code` |
| Save config | Clave required desconocida | 422 y lista de errores. | `Confirmed by legacy code` |
| Save config | `required_fields` no array | 422. | `Confirmed by legacy code` |
| Load config | JSON inválido | Capa ausente, sin warning específico. | `Confirmed by legacy code` |
| Load config | Consulta DB falla | Warning y fallback. | `Confirmed by legacy code` |
| Alta | Falta/valor inválido | Normalmente 422 JSON. | `Confirmed by legacy code` |
| Alta | PDO falla | 500 genérico y rollback de orden/cliente. | `Confirmed by legacy code` |
| Anticipo | Inserción falla | 400/404/500; orden anterior no revierte. | `Confirmed by legacy code` |

## Conclusión de seguridad funcional

La allowlist y la re-resolución backend son controles valiosos. No bastan para considerar segura la política: los invariantes de custodia no están expresados, dos required se neutralizan con defaults, el endpoint de alta no solicita permiso funcional, el secreto se persiste y la versión aplicada no queda auditada. La revisión de credenciales y autorización permanece `Pending security review`; la separación entre captura y política permanece `Pending architecture review`.
