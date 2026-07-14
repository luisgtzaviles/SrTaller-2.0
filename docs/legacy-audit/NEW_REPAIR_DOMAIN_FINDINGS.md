# Hallazgos de dominio de “Nueva Reparación”

- **Estado:** Pending Product Owner validation
- **Propósito:** Convertir evidencia heredada en temas verificables de dominio, integridad, seguridad y operación.
- **Alcance:** Veintitrés hallazgos derivados del flujo de alta y de sus consumidores directos.
- **Fuente:** SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
- **Audiencia:** Product Owner, Domain Experts, Arquitectura, Seguridad, QA y desarrollo.
- **Última actualización:** 2026-07-14

> Estos hallazgos describen el legado. “Concepto candidato” no significa concepto aprobado ni propuesta técnica.

## LEGACY-NR-FINDING-001 — El folio es una predicción concurrente

- **Evidencia:** `obtener_siguiente_folio.php:25-40` lee la última fila por `id`, suma uno y no escribe ni bloquea; `crear_reparacion.js:1321-1334,1499-1506` lo consulta dos veces. No se encontró restricción versionada de unicidad para `reparaciones.folio`.
- **Interpretación:** El folio identifica la orden y enlaza pagos/evidencia, pero se asigna como texto calculado por lectura previa.
- **Riesgo:** Colisión concurrente y asociación ambigua de datos posteriores.
- **Posible concepto de dominio:** Número de orden dentro de un ámbito de numeración.
- **Impacto para SR Taller 2.0:** La política de asignación, ámbito e inmutabilidad debe validarse antes de promover el concepto.
- **Estado:** Pending architecture review
- **Validación requerida:** Product Owner, Operaciones y Arquitectura.

## LEGACY-NR-FINDING-002 — El teléfono funciona como identidad del cliente

- **Evidencia:** `reparaciones_clientes.php:11-18,101-205` construye `dedupe_key` por teléfono y sólo usa nombre cuando no hay teléfono; migración `2026_06_11_v1_0005...sql:37-58` declara unicidad por tenant/sucursal/clave.
- **Interpretación:** Un dato de contacto se usa como criterio de identidad local.
- **Riesgo:** Dos personas con teléfono compartido se fusionan; un cambio de número puede producir otra identidad.
- **Posible concepto de dominio:** Parte/cliente y puntos de contacto, separados.
- **Impacto para SR Taller 2.0:** Requiere política explícita de identidad, coincidencia y teléfonos compartidos.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner y personal de mostrador.

## LEGACY-NR-FINDING-003 — La reparación conserva snapshot y vínculo de cliente

- **Evidencia:** `guardar_reparacion.php:410-483` guarda `cliente_reparacion_id`, `nombre_cliente` y `numero_cliente`; lista/detalle leen la fila de `reparaciones` (`obtener_reparaciones.php:30-105`; `obtener_detalle_reparacion.php:24-53`).
- **Interpretación:** Coexisten identidad maestra y representación histórica al recibir.
- **Riesgo:** Divergencia sin política sobre qué dato usar para contacto, impresión o auditoría.
- **Posible concepto de dominio:** Parte referenciada + datos de contacto/representación histórica.
- **Impacto para SR Taller 2.0:** Debe definirse qué permanece histórico y qué sigue al maestro.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner, Atención y Legal/Privacidad.

## LEGACY-NR-FINDING-004 — El dispositivo no es una entidad reutilizable

- **Evidencia:** `guardar_reparacion.php:435-483` embebe marca, modelo, IMEI, color, chip, memoria y características en `reparaciones`; la búsqueda completa de IMEI no encontró tabla de dispositivos ni detección de duplicados.
- **Interpretación:** El sistema registra “equipo recibido en esta orden”, no una identidad persistente del dispositivo.
- **Riesgo:** No se relacionan visitas del mismo equipo y el IMEI puede repetirse sin aviso.
- **Posible concepto de dominio:** Equipo recibido, dispositivo identificable o ambas cosas.
- **Impacto para SR Taller 2.0:** Domain Validation debe decidir continuidad e identificación cuando no hay IMEI.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Recepción y técnicos.

## LEGACY-NR-FINDING-005 — “Falla” mezcla reporte y clasificación operativa

- **Evidencia:** `crear_reparacion.php:618-627` presenta “Falla” y “Testimonio”; `catalogos_upsert.php` permite catalogar falla; no se encontró campo estructurado de diagnóstico técnico, sólo seguimientos libres y estado.
- **Interpretación:** “Falla” puede ser síntoma, categoría o diagnóstico; “testimonio” parece relato.
- **Riesgo:** Se confunden lo dicho por el cliente y la conclusión técnica.
- **Posible concepto de dominio:** Problema reportado, declaración del cliente y diagnóstico técnico.
- **Impacto para SR Taller 2.0:** El lenguaje y ownership deben validarse por momento del ciclo.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner, recepción y técnicos.

## LEGACY-NR-FINDING-006 — La garantía es una marca no verificada

- **Evidencia:** `guardar_reparacion.php:354-355,464-465` almacena indicador y texto de folio; no valida existencia, cliente, dispositivo ni vigencia; no se encontró relación estructural ni reutilización del antecedente.
- **Interpretación:** “Posible garantía” expresa sospecha/intención, no elegibilidad ni caso resuelto.
- **Riesgo:** Reparaciones de garantía mal clasificadas y antecedente no confiable.
- **Posible concepto de dominio:** Solicitud, evaluación y decisión de garantía; relación con orden antecedente.
- **Impacto para SR Taller 2.0:** No debe asumirse que un booleano representa el proceso completo.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner, responsable de garantías y Finanzas.

## LEGACY-NR-FINDING-007 — El riesgo seleccionado no prueba consentimiento

- **Evidencia:** `crear_reparacion.php:651-659` ofrece un solo select; `guardar_reparacion.php:356-359` valida catálogo; no se encontró firma, checkbox, PIN, actor informante ni timestamp específico.
- **Interpretación:** El campo documenta una selección interna, aunque la etiqueta diga “Aceptó”.
- **Riesgo:** Evidencia insuficiente ante disputa y pérdida de múltiples riesgos simultáneos.
- **Posible concepto de dominio:** Riesgo comunicado, consentimiento/aceptación y evidencia asociada.
- **Impacto para SR Taller 2.0:** Requiere validación jurídica y operativa antes de conservar semántica.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner, Operaciones y asesoría legal.

## LEGACY-NR-FINDING-008 — La credencial del equipo se guarda reversible y se expone

- **Evidencia:** `guardar_reparacion.php:361-379,473-474` guarda PIN/patrón en `reparaciones.codigo_seguridad`; `detalle_modal.js:448-474,1246-1261` lo muestra/reconstruye; no se encontró cifrado, borrado al cierre ni permiso por campo.
- **Interpretación:** Es un secreto temporal de custodia tratado como dato ordinario de la orden.
- **Riesgo:** Acceso indebido al dispositivo y exposición de credenciales reutilizadas.
- **Posible concepto de dominio:** Autorización temporal de acceso, si el negocio confirma su necesidad.
- **Impacto para SR Taller 2.0:** No debe trasladarse sin revisión especializada de necesidad, acceso y retención.
- **Estado:** Pending security review
- **Validación requerida:** Seguridad, Privacidad, Product Owner y Operaciones.

## LEGACY-NR-FINDING-009 — Alta y anticipo forman una escritura parcial posible

- **Evidencia:** `guardar_reparacion.php:404-488` confirma cliente+orden; luego `crear_reparacion.js:1520-1533` llama `guardar_anticipo.php` por separado. El error de pago no revierte la orden.
- **Interpretación:** La UI presenta una sola acción, pero el sistema confirma dos hechos independientes.
- **Riesgo:** Reparación creada sin anticipo esperado; reintentos manuales ambiguos.
- **Posible concepto de dominio:** Apertura de orden y recepción de pago como hechos distintos coordinados.
- **Impacto para SR Taller 2.0:** Deben aclararse consecuencias de éxito parcial y recuperación.
- **Estado:** Pending architecture review
- **Validación requerida:** Product Owner, Caja, QA y Arquitectura.

## LEGACY-NR-FINDING-010 — La semántica financiera es incompleta

- **Evidencia:** `guardar_anticipo.php:50-90` acepta monto y texto `metodo_pago='Anticipo'`, sin caja; su validación `!$monto || !is_numeric($monto)` también permite un monto negativo si se invoca directamente. `detalle_modal.js:1997-2008` calcula saldo contra `presupuesto_final`; no hay comparación anticipo/presupuesto ni flujo de cancelación encontrado.
- **Interpretación:** “Anticipo” mezcla propósito del pago y aparente método; presupuesto inicial no gobierna saldo.
- **Riesgo:** Sobrepago, saldo incoherente, falta de reversos y atribución contable débil.
- **Posible concepto de dominio:** Estimación, cotización, cargo, pago, asignación, caja y reverso.
- **Impacto para SR Taller 2.0:** El lenguaje monetario requiere validación con Finanzas antes de modelarse.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Finanzas/Caja y Product Owner.

## LEGACY-NR-FINDING-011 — La promesa no tiene semántica temporal estable

- **Evidencia:** `crear_reparacion.php:697-702` usa `datetime-local`; `guardar_reparacion.php:353,398,463` limpia y guarda sin parsear zona; sólo se encontró visualización posterior (`detalle_modal.js:1134`).
- **Interpretación:** Puede significar estimación o compromiso, expresado como hora local implícita.
- **Riesgo:** Ambigüedad de zona, imposibilidad de medir cambios/incumplimiento y promesas obsoletas.
- **Posible concepto de dominio:** Fecha estimada y/o compromiso de entrega versionado.
- **Impacto para SR Taller 2.0:** Deben definirse significado, zona, revisión y consecuencias.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner y Operaciones.

## LEGACY-NR-FINDING-012 — La evidencia nace después y es opcional

- **Evidencia:** El payload de alta no contiene fotos (`crear_reparacion.js:1464-1497`); `detalle_modal.js:1811-1922` las agrega después por `guardar_seguimiento.php`; no se encontró indicador de pendiente.
- **Interpretación:** La fotografía es seguimiento posterior, no condición para formalizar la recepción.
- **Riesgo:** Nota entregada y orden activa sin evidencia de condición inicial.
- **Posible concepto de dominio:** Evidencia de recepción con momento, autor, propósito e integridad.
- **Impacto para SR Taller 2.0:** El negocio debe decidir obligatoriedad y ventana de captura.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Recepción, Garantías y Product Owner.

## LEGACY-NR-FINDING-013 — Seguimiento e inventario de archivo pueden divergir

- **Evidencia:** `guardar_seguimiento.php:136-159` inserta primero `reparacion_seguimientos` y después `archivos`, sin transacción común; R2 se escribe antes de ambos.
- **Interpretación:** Un mismo hecho de evidencia se representa en objeto y dos filas coordinadas por código.
- **Riesgo:** Objeto huérfano o registro parcial tras fallos.
- **Posible concepto de dominio:** Evidencia adjunta y su referencia de almacenamiento.
- **Impacto para SR Taller 2.0:** La integridad y ciclo de vida de evidencia deben quedar como requisito explícito.
- **Estado:** Pending architecture review
- **Validación requerida:** Arquitectura, Operaciones y QA.

## LEGACY-NR-FINDING-014 — La nota no es un snapshot auditable

- **Evidencia:** `imprimir_ticket.php:153-299` carga HTML/CSS activo, sustituye valores actuales y ejecuta `window.print()`; no inserta log, versión, copia ni contador. El detalle permite reimpresión (`detalle_modal.js:1400-1414`).
- **Interpretación:** La nota es una representación dinámica, no evidencia persistente de lo entregado.
- **Riesgo:** Reimpresiones distintas y falta de prueba sobre términos aceptados.
- **Posible concepto de dominio:** Documento emitido/entregado y versión de términos.
- **Impacto para SR Taller 2.0:** Debe validarse si tiene valor contractual y qué debe conservarse.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner, Legal y Operaciones.

## LEGACY-NR-FINDING-015 — El ticket puede omitir un anticipo existente

- **Evidencia:** `imprimir_ticket.php:247-260` ejecuta la consulta de último pago y llama dos veces `fetch(PDO::FETCH_ASSOC)`; la segunda lectura sobrescribe la primera. `:263-279` usa defaults cuando queda `false`.
- **Interpretación:** La nota puede representar `0.00` aunque la escritura del pago haya tenido éxito.
- **Riesgo:** Comprobante inconsistente y disputa de dinero recibido.
- **Posible concepto de dominio:** Pago reconocido en documento emitido.
- **Impacto para SR Taller 2.0:** Esta discrepancia debe considerarse al validar evidencia histórica del legado.
- **Estado:** Confirmed by legacy code
- **Validación requerida:** QA y Finanzas; verificar datos/documentos reales fuera de esta auditoría.

## LEGACY-NR-FINDING-016 — Usuario y sucursal dependen de sesión y nombres mutables

- **Evidencia:** guards y contexto en `guardar_reparacion.php:1-24`; `recibido_por` usa `$_SESSION['nombre']` (`:387,475`); pago usa nombre/fallback (`guardar_anticipo.php:19-22,80-90`).
- **Interpretación:** La sesión decide ownership; el actor se conserva como texto, no como ID estable.
- **Riesgo:** Atribución ambigua tras renombres y falta de evidencia de permisos granulares.
- **Posible concepto de dominio:** Actor, sucursal operativa y asignación de responsabilidad.
- **Impacto para SR Taller 2.0:** Deben validarse autoridad para crear y trazabilidad por identidad estable.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Operaciones, IAM y Product Owner.

## LEGACY-NR-FINDING-017 — El historial de cambios es parcial

- **Evidencia:** `guardar_detalle_reparacion.php:82-152` sobrescribe técnico, estado, presupuesto final y entrega; sólo conserva primeras fechas y `revisor`/`entregado_por`. No se encontró bitácora por campo ni edición de datos iniciales.
- **Interpretación:** Hay atribución puntual, no historial completo de hechos/correcciones.
- **Riesgo:** No se puede saber quién cambió qué, cuándo o por qué.
- **Posible concepto de dominio:** Historial de orden y corrección auditada.
- **Impacto para SR Taller 2.0:** La profundidad de auditoría debe definirse por riesgo de cada dato.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner, QA, Seguridad y Operaciones.

## LEGACY-NR-FINDING-018 — La obligatoriedad es configuración mutable

- **Evidencia:** `reparaciones_form_config.php:14-96,228-308` combina defaults, tenant y sucursal; frontend y backend consumen configuración efectiva (`crear_reparacion.js:497-550`; `guardar_reparacion.php:328-402`).
- **Interpretación:** La completitud de una recepción varía por contexto sin que el significado del dato cambie.
- **Riesgo:** Calidad desigual, órdenes incomparables y defaults confundidos con reglas universales.
- **Posible concepto de dominio:** Política de captura por operación/sucursal.
- **Impacto para SR Taller 2.0:** Se debe separar regla esencial de preferencia configurable.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner, Operaciones y QA.

## LEGACY-NR-FINDING-019 — El cierre puede notificar antes de existir

- **Evidencia:** `detalle_modal.js:1476-1498` llama webhook y luego guarda; `enviar_webhook_listo.php:40-98` lee la fila actual y considera “ya listo” según estado previo.
- **Interpretación:** La notificación representa una intención de transición, pero envía un snapshot anterior.
- **Riesgo:** Integraciones notificadas con estado viejo o aunque el `UPDATE` posterior falle.
- **Posible concepto de dominio:** Transición confirmada y notificación posterior.
- **Impacto para SR Taller 2.0:** Domain Validation debe precisar el hecho que autoriza avisar.
- **Estado:** Pending architecture review
- **Validación requerida:** Product Owner, Integraciones y Arquitectura.

## LEGACY-NR-FINDING-020 — Las políticas de zona horaria difieren

- **Evidencia:** alta configura la sesión SQL con offset y fallback `-07:00` (`guardar_reparacion.php:29-49`); anticipo y seguimiento usan zona IANA/fallback `America/Hermosillo` (`guardar_anticipo.php:26-43`; `guardar_seguimiento.php:50-61`).
- **Interpretación:** Distintos hechos del mismo expediente pueden usar mecanismos temporales diferentes.
- **Riesgo:** Ordenamiento y auditoría inconsistentes, especialmente al cambiar zona o DST.
- **Posible concepto de dominio:** Instante ocurrido + zona operacional de presentación.
- **Impacto para SR Taller 2.0:** La semántica temporal debe validarse transversalmente.
- **Estado:** Pending architecture review
- **Validación requerida:** Arquitectura, QA y Operaciones.

## LEGACY-NR-FINDING-021 — Hay datos sintéticos sin captura ni uso funcional encontrado

- **Evidencia:** `crear_reparacion.js:1491-1493` envía `origen_cliente=no_capturado`, `genero=no_info`, `rango_edad=no_capturado`; sólo origen aparece opcionalmente en detalle (`detalle_modal.js:1161`); no se encontraron consumidores de género/rango en el módulo.
- **Interpretación:** Columnas heredadas se rellenan para satisfacer forma de datos, no un hecho observado.
- **Riesgo:** Analítica engañosa y complejidad semántica accidental.
- **Posible concepto de dominio:** Canal de adquisición, si realmente se captura; género/edad quedan `Unknown`.
- **Impacto para SR Taller 2.0:** No promover campos por mera existencia; validar necesidad y base legítima.
- **Estado:** Pending Product Owner validation
- **Validación requerida:** Product Owner, Analítica y Privacidad.

## LEGACY-NR-FINDING-022 — El webhook expone la fila completa de reparación

- **Evidencia:** `enviar_webhook_listo.php:40-83` hace `SELECT *`, asigna `$data = $row` y lo envía por cURL a cada URL configurada; la fila incluye contacto y `codigo_seguridad` según el insert de alta.
- **Interpretación:** Una integración de estado recibe todos los datos disponibles, no un contrato mínimo explícito.
- **Riesgo:** Exfiltración innecesaria de PII y credenciales a destinos configurables.
- **Posible concepto de dominio:** Notificación de cambio con datos mínimos autorizados.
- **Impacto para SR Taller 2.0:** Requiere revisión de seguridad y finalidad antes de considerar compatibilidad.
- **Estado:** Pending security review
- **Validación requerida:** Seguridad, Privacidad, Integraciones y Product Owner.

## LEGACY-NR-FINDING-023 — El catálogo de países queda fuera del patrón de protección

- **Evidencia:** `crear_reparacion.js:1170-1191` llama `public_html/sistema/funciones/catalogos/paises_activos.php`; ese endpoint carga bootstrap y consulta `catalogo_paises` (`:1-33`), pero no invoca guard de usuario/tenant y devuelve `$e->getMessage()` ante error (`:34-36`).
- **Interpretación:** Una dependencia de inicialización del formulario usa un límite de acceso y manejo de errores distinto al resto del módulo.
- **Riesgo:** Divulgación de detalles internos y superficie pública no intencional.
- **Posible concepto de dominio:** Catálogo de país/prefijo; el riesgo corresponde a su exposición técnica.
- **Impacto para SR Taller 2.0:** La necesidad de acceso público y el nivel de información de error deben validarse, sin heredar el comportamiento por defecto.
- **Estado:** Pending security review
- **Validación requerida:** Seguridad y Arquitectura.
