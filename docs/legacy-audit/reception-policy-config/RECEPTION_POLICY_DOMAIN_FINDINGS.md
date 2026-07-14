# Hallazgos de dominio y configuración

**Estado del paquete:** `Pending Product Owner validation`.

Las recomendaciones indican decisiones o validaciones necesarias. No prescriben implementación, arquitectura, tablas, API, permisos definitivos ni UI.

## `LEGACY-RPC-FINDING-001` — El mecanismo configura formulario, no una política completa

- **Evidencia:** `sr_reparaciones_form_config_field_registry()` sólo enumera 19 claves (`public_html/sistema/includes/reparaciones_form_config.php:14-36`); `aplicarFormConfigCrearReparacion()` sólo cambia clases y ARIA (`crear_reparacion.js:470-485`); los controles permanecen estáticos (`crear_reparacion.php:532-721`).
- **Interpretación:** la configuración decide principalmente qué controles no pueden quedar vacíos. No modela visibilidad, orden, suficiencia semántica, excepción, completitud ni custodia.
- **Riesgo:** copiarla como política futura canoniza accidentes de una pantalla y permite combinaciones incoherentes.
- **Concepto candidato:** Política de Recepción separada de la presentación.
- **Impacto para Future State Reception:** el Future State debe validar criterios de aceptación y pendientes, no heredar una lista plana.
- **Recomendación:** usar este registro sólo como evidencia y decidir invariantes, políticas, condiciones, derivados y preferencias por separado.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending Product Owner validation`.

## `LEGACY-RPC-FINDING-002` — Sólo nombre es fijo; identificación esencial del objeto es configurable

- **Evidencia:** únicamente `nombre` tiene `locked_required=true` (`reparaciones_form_config.php:17-35,49-58`); marca, modelo e IMEI pertenecen a la allowlist configurable; el backend sólo exige cada uno si está en la lista (`guardar_reparacion.php:389-395`).
- **Interpretación:** una sucursal puede dejar opcionales marca, modelo e IMEI simultáneamente y crear una orden con identificación física débil.
- **Riesgo:** comienza custodia sin distinguir suficientemente el objeto recibido.
- **Concepto candidato:** identificación mínima del objeto como invariante compuesto, con alternativas/excepción.
- **Impacto para Future State Reception:** debe definirse suficiencia, no declarar cada campo universalmente fijo.
- **Recomendación:** validar con Operaciones casos por tipo de equipo, equipo apagado y número inaccesible antes de decidir configurabilidad.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending operations validation`.

## `LEGACY-RPC-FINDING-003` — La precedencia existe, pero las listas reemplazan en bloque

- **Evidencia:** `get_effective()` mezcla sistema→tenant→sucursal (`reparaciones_form_config.php:275-293`); `merge()` reemplaza `required_fields` completo y mezcla `defaults` por clave (`:252-272`).
- **Interpretación:** una lista de sucursal no expresa una excepción puntual; redefine todos los required y puede quitar campos heredados sin intención explícita.
- **Riesgo:** cambios parciales producen debilitamiento lateral difícil de detectar.
- **Concepto candidato:** alcance y herencia explícitos de política.
- **Impacto para Future State Reception:** no debe asumirse que precedencia técnica equivale a gobernanza comprensible.
- **Recomendación:** validar quién puede variar qué regla y qué significa heredar antes de elegir un mecanismo futuro.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending architecture review`.

## `LEGACY-RPC-FINDING-004` — Defaults y validadores están duplicados

- **Evidencia:** seis required y ocho defaults aparecen en helper (`reparaciones_form_config.php:60-96`), panel JS (`form_config_panel.js:4-42,195-216`) y alta JS (`crear_reparacion.js:65-107`); teléfono, selects y condiciones tienen implementaciones JS/PHP separadas.
- **Interpretación:** el servidor es autoridad al guardar, pero despliegues parciales o evolución desigual pueden mostrar una política distinta.
- **Riesgo:** errores tardíos, fallback inconsistente y mantenimiento de múltiples fuentes.
- **Concepto candidato:** contrato de política independiente de cada modo de captura.
- **Impacto para Future State Reception:** clásico y futuras presentaciones no deberían redefinir requisitos.
- **Recomendación:** primero acordar semántica única; la estrategia técnica queda para revisión posterior.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending architecture review`.

## `LEGACY-RPC-FINDING-005` — Faltan condiciones operativas clave

- **Evidencia:** sólo existen condiciones para `codigo_seguridad` y `patron_seguridad` (`reparaciones_form_config.php:84-95`; `guardar_reparacion.php:361-379`). No se encontraron garantía→folio, riesgo→consentimiento/evidencia, IMEI→accesibilidad, promesa→compromiso, anticipo→pago ni entregante distinto.
- **Interpretación:** checkboxes absolutos no representan cuándo un dato aplica ni cómo justificar su ausencia.
- **Riesgo:** se bloquean recepciones legítimas o se aceptan combinaciones incoherentes.
- **Concepto candidato:** requisitos condicionales y excepción autorizada.
- **Impacto para Future State Reception:** los hotspots actuales deben convertirse en decisiones explícitas, no en más checkboxes.
- **Recomendación:** validar condición, autoridad, rechazo y efecto para cada caso antes de declarar requisito.
- **Estado:** `Not found`.
- **Revisión requerida:** `Pending Product Owner validation`.

## `LEGACY-RPC-FINDING-006` — Guardar en sucursal congela herencia y defaults ocultos

- **Evidencia:** el panel recolecta todos los checked y manda ocho defaults hardcodeados (`form_config_panel.js:195-216`); el endpoint sólo acepta sucursal (`form_config_save.php:43-56`); el upsert reemplaza JSON (`reparaciones_form_config.php:311-323`).
- **Interpretación:** incluso guardar sin cambios convierte valores heredados en override explícito; cambios tenant posteriores dejan de propagarse.
- **Riesgo:** deriva silenciosa entre sucursales y enmascaramiento de intención tenant.
- **Concepto candidato:** gobernanza tenant/sucursal y procedencia visible.
- **Impacto para Future State Reception:** el alcance no puede evaluarse sólo por precedencia; importa la intención de override.
- **Recomendación:** validar si sucursal puede divergir, quién autoriza y cómo vuelve a heredar.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending Product Owner validation`.

## `LEGACY-RPC-FINDING-007` — No hay historia, actor ni versión aplicada

- **Evidencia:** tabla versionada sólo tiene `created_at`/`updated_at` (`2026_06_11_v1_0005_reparaciones_clientes_form_config.sql:60-74`); save hace upsert sin actor (`reparaciones_form_config.php:311-323`); la orden no guarda referencia de configuración (`guardar_reparacion.php:435-484`). No se encontró historial/audit log.
- **Interpretación:** no puede reconstruirse quién cambió una política, qué valor sustituyó ni qué versión permitió una orden.
- **Riesgo:** disputas operativas y análisis posterior sin evidencia contextual.
- **Concepto candidato:** trazabilidad de cambio y política aplicada.
- **Impacto para Future State Reception:** la frontera de custodia exige poder explicar con qué criterios se aceptó.
- **Recomendación:** definir primero las preguntas de auditoría que el negocio debe responder.
- **Estado:** `Not found`.
- **Revisión requerida:** `Pending Product Owner validation`.

## `LEGACY-RPC-FINDING-008` — Permisos son asimétricos entre configuración y creación

- **Evidencia:** save config exige `permission='ajustes/catalogos_modulo'` y CSRF (`form_config_save.php:8-18`); la vista usa plan/rol y alias (`view_guard.php:116-120,269-294`); `guardar_reparacion.php:5-23` exige sesión/contexto/CSRF pero no permiso; `form_config_get.php:6-21` tampoco exige permiso específico.
- **Interpretación:** no se protege sólo la vista de ajustes, pero lectura y alta confían en autenticación/contexto general.
- **Riesgo:** una sesión con acceso no esperado podría invocar el endpoint directamente; los roles reales son desconocidos sin DB.
- **Concepto candidato:** autoridad para administrar política y autoridad para aceptar custodia.
- **Impacto para Future State Reception:** ambas autoridades deben distinguirse de la visibilidad de una pantalla.
- **Recomendación:** revisar capacidades reales y casos de delegación; no inferir roles por nombres legacy.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending security review`.

## `LEGACY-RPC-FINDING-009` — “Flujo guiado V2” es una promesa de UI, no otra política

- **Evidencia:** `guided_v2_available()` devuelve false; normalización siempre fuerza `classic`; save rechaza V2 (`reparaciones_form_config.php:9-12,148-157,182-215`); radio está deshabilitado (`nueva_reparacion_config.php:19-38`); búsqueda amplia no encontró implementación real.
- **Interpretación:** modo de captura y política comparten el mismo JSON aunque sólo existe el formulario clásico.
- **Riesgo:** una futura segunda UI podría duplicar o divergir validaciones.
- **Concepto candidato:** preferencia de presentación separada de política.
- **Impacto para Future State Reception:** un recorrido guiado no debe cambiar por sí mismo qué hace válida la recepción.
- **Recomendación:** tratar V2 como `Not found` en el legado y validar política antes de diseñar modos.
- **Estado:** `Not found`.
- **Revisión requerida:** `Pending architecture review`.

## `LEGACY-RPC-FINDING-010` — Exigir acceso induce captura de credenciales sensibles

- **Evidencia:** seleccionar PIN o patrón obliga secreto en JS/PHP (`crear_reparacion.js:398-447`; `guardar_reparacion.php:361-379`); ambos se guardan en `reparaciones.codigo_seguridad` (`:435-484`); detalle lee el valor y ticket sólo lo borra para `no_tiene` (`imprimir_ticket.php:124-148`).
- **Interpretación:** el requisito condicional se centra en obtener el secreto, no en documentar disponibilidad, autorización, propósito o negativa.
- **Riesgo:** exposición, reutilización y retención indebida; presión al cliente para compartir acceso.
- **Concepto candidato:** estado/autorización de acceso con minimización del secreto.
- **Impacto para Future State Reception:** “acceso disponible” y “credencial almacenada” no deben confundirse.
- **Recomendación:** no hacer configurable la obligatoriedad de credencial sin revisión de necesidad y seguridad.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending security review`.

## `LEGACY-RPC-FINDING-011` — Evidencia inicial no forma parte de la política

- **Evidencia:** no hay campo de evidencia en registro, vista, payload o INSERT de alta; existe carga posterior mediante `guardar_seguimiento.php` y galería en `detalle_modal.js`.
- **Interpretación:** la orden y custodia pueden iniciar sin foto; una foto posterior no prueba necesariamente la condición al inicio.
- **Riesgo:** disputas sobre daño, accesorios o estado previo y falsa equivalencia entre evidencia posterior e inicial.
- **Concepto candidato:** evidencia inicial requerida/condicional o pendiente explícito.
- **Impacto para Future State Reception:** coincide con el contexto aportado en que fotos pueden quedar pendientes, pero hace falta definir efecto y trazabilidad del pendiente.
- **Recomendación:** validar cuándo es indispensable, cuándo puede quedar pendiente y qué no revierte custodia.
- **Estado:** `Not found`.
- **Revisión requerida:** `Pending operations validation`.

## `LEGACY-RPC-FINDING-012` — Anticipo required no garantiza caja ni pago atómico

- **Evidencia:** alta valida monto >0 (`guardar_reparacion.php:384-401`) y confirma orden (`:404-494`); sólo después JS llama `guardar_anticipo.php` (`crear_reparacion.js:1516-1533`), que inserta `reparacion_pagos` con método default (`guardar_anticipo.php:45-100`).
- **Interpretación:** el checkbox exige capturar un número, no que el movimiento financiero forme parte del éxito de creación.
- **Riesgo:** orden/custodia sin pago esperado, método inexacto, conciliación manual y mensajes engañosos.
- **Concepto candidato:** política de pago inicial y resultado financiero explícito.
- **Impacto para Future State Reception:** se debe decidir si el pago condiciona creación o puede quedar pendiente; no asumir atomicidad legacy.
- **Recomendación:** validar con Finanzas punto de no retorno, caja, método, fallo y reversa.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending finance review`.

## `LEGACY-RPC-FINDING-013` — Promesa required carece de semántica temporal

- **Evidencia:** vista usa `datetime-local` (`crear_reparacion.php:694-703`); backend sólo limpia y exige no vacío (`guardar_reparacion.php:353,398,463`); zona de conexión tiene configuración y fallback (`:29-49`).
- **Interpretación:** no se prueba fecha futura, capacidad, zona, certeza, autor ni revisión.
- **Riesgo:** una estimación local se interpreta como compromiso firme y no reconstruible.
- **Concepto candidato:** estimación/promesa con contexto temporal y autoridad.
- **Impacto para Future State Reception:** debe decidirse si pertenece al mínimo de recepción o a un compromiso posterior.
- **Recomendación:** validar significado operativo y tratamiento de cambios antes de exigirla.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending Product Owner validation`.

## `LEGACY-RPC-FINDING-014` — Defaults neutralizan el required backend de riesgo y tipo de seguridad

- **Evidencia:** riesgo vacío se vuelve `no_aplica` (`guardar_reparacion.php:163-190,356-359`); tipo vacío se vuelve `no_tiene` (`:244-262,361`); no se invoca `requireRepairFieldIfConfigured` para esas claves (`:389-402`).
- **Interpretación:** frontend exige selección si están en la lista, pero POST directo puede omitirlas.
- **Riesgo:** la configuración comunica una garantía que el servidor no cumple y defaults negativos ocultan falta de evaluación.
- **Concepto candidato:** distinción entre “sin evaluar”, “no aplica” y respuesta explícita.
- **Impacto para Future State Reception:** los defaults no deben satisfacer silenciosamente una decisión requerida.
- **Recomendación:** validar semántica de ausencia antes de cualquier alineación técnica.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending Product Owner validation`.

## `LEGACY-RPC-FINDING-015` — Restaurar defaults no restaura herencia

- **Evidencia:** reset sólo asigna seis claves en memoria (`form_config_panel.js:261-267`); save posterior manda configuración completa (`:195-216`) y upsert; no se encontró DELETE.
- **Interpretación:** “restaurar” puede significar deshacer localmente o fijar defaults sistema, nunca eliminar override de sucursal.
- **Riesgo:** administrador cree volver a política tenant y en realidad la bloquea.
- **Concepto candidato:** reset, herencia y eliminación de override con semánticas distintas.
- **Impacto para Future State Reception:** la gobernanza debe ser comprensible para operadores autorizados.
- **Recomendación:** decidir qué debe significar cada acción y qué confirmación/auditoría necesita.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending Product Owner validation`.

## `LEGACY-RPC-FINDING-016` — Formularios abiertos pueden validar otra versión

- **Evidencia:** alta carga config una vez (`crear_reparacion.js:486-526,1311-1320`); backend la resuelve de nuevo al POST (`guardar_reparacion.php:323-337`); no se encontró invalidación o versión.
- **Interpretación:** endurecer produce 422 tardío; relajar puede dejar bloqueo local. La orden no guarda la versión usada.
- **Riesgo:** retraso en mostrador y falta de explicabilidad en la frontera de custodia.
- **Concepto candidato:** vigencia de política y tratamiento de recepciones en curso.
- **Impacto para Future State Reception:** hace falta decidir cuándo entra en vigor un cambio.
- **Recomendación:** validar expectativa de producto; diseño de consistencia queda posterior.
- **Estado:** `Inferred from legacy behavior`.
- **Revisión requerida:** `Pending Product Owner validation`.

## `LEGACY-RPC-FINDING-017` — La frontera técnica de custodia no está nombrada como política

- **Evidencia:** la transacción inserta cliente y orden, asigna `fecha_recibido=NOW()`, actor, `Pendiente` y `En Tienda`, y hace commit antes de anticipo/impresión (`guardar_reparacion.php:404-494`; JS `:1516-1541`).
- **Interpretación:** el commit es una frontera técnica coherente con la decisión aportada por Product Owner, pero el mecanismo de campos no la expresa ni conserva completitud/política aplicada.
- **Riesgo:** se atribuye a un checkbox lo que realmente depende del éxito transaccional, y no se distinguen pendientes permitidos.
- **Concepto candidato:** orden creada/custodia iniciada con pendientes explícitos.
- **Impacto para Future State Reception:** ofrece una frontera útil, sin aprobar la implementación legacy.
- **Recomendación:** validar efectos exactos de éxito, fallo y pendientes con Operaciones.
- **Estado:** `Inferred from legacy behavior`.
- **Revisión requerida:** `Pending operations validation`.

## `LEGACY-RPC-FINDING-018` — El JSON declara defaults que el alta ignora o fija

- **Evidencia:** config incluye `estado` y `entregado` (`reparaciones_form_config.php:74-83`), pero backend fija literales `Pendiente` y `En Tienda` (`guardar_reparacion.php:383-387`) y no toma esos dos de `$form_defaults`; panel tampoco permite editarlos.
- **Interpretación:** el esquema mezcla defaults aparentes con invariantes hardcodeados y preferencias no editables.
- **Riesgo:** lectores futuros creen que cambiar JSON cambia estado/custodia cuando no lo hace.
- **Concepto candidato:** separar invariantes derivados de defaults de captura.
- **Impacto para Future State Reception:** la política no debe prometer configurabilidad falsa.
- **Recomendación:** documentar autoridad semántica antes de migrar cualquier propiedad.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending architecture review`.

## `LEGACY-RPC-FINDING-019` — La intención tenant no tiene flujo de administración soportado

- **Evidencia:** resolver lee una fila tenant con sucursal vacía (`reparaciones_form_config.php:282-293`), pero UI deshabilita tenant (`nueva_reparacion_config.php:41-50`) y save rechaza todo scope no sucursal (`form_config_save.php:43-56`). No se encontró otra escritura versionada.
- **Interpretación:** existe capacidad de consumo tenant, no autoservicio tenant verificable. Su creación actual puede depender de SQL/manual/proceso no encontrado.
- **Riesgo:** intención de producto no cumplida, configuración huérfana y procedencia desconocida.
- **Concepto candidato:** autoridad tenant frente a autonomía sucursal.
- **Impacto para Future State Reception:** no asumir que tener una capa de lectura satisface configurabilidad por tenant.
- **Recomendación:** validar quién decide defaults tenant, qué puede delegar y cómo se gobiernan excepciones de sucursal.
- **Estado:** `Confirmed by legacy code`.
- **Revisión requerida:** `Pending Product Owner validation`.

## Resumen de revisiones

| Revisión | Hallazgos principales |
|---|---|
| `Pending Product Owner validation` | 001, 003, 005, 006, 007, 013, 014, 015, 016, 019 |
| `Pending operations validation` | 002, 011, 017 |
| `Pending security review` | 008, 010 |
| `Pending finance review` | 012 |
| `Pending architecture review` | 004, 009, 018; y mecanismo posterior de 003/007/016 |
