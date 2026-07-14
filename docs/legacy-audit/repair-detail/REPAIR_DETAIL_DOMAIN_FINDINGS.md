# Hallazgos de dominio del detalle de reparación

**Estado:** Borrador para validación.
**Propósito:** Convertir la evidencia legacy en hallazgos de dominio sin prescribir el modelo de SR Taller 2.0.
**Alcance:** Estado, custodia, responsabilidad, dinero, autorización, seguimiento, seguridad, impresión e inventario.
**Fuente:** Código local de SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
**Audiencia:** Product Owner, operaciones, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Criterio

Un hallazgo describe una propiedad o ambigüedad del legacy. “Posible concepto de dominio” nombra el área que la evidencia obliga a validar; no aprueba una entidad, agregado, evento ni solución para SR Taller 2.0.

## `LEGACY-RD-FINDING-001` — Estado como etiqueta configurable

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `configuraciones/consultar_configuraciones.php:1-67`, `agregar_configuracion.php:1-51` y `guardar_detalle_reparacion.php:66-152`: catálogo/alta textual y guardado sin validarlo.
- **Interpretación:** `estado` es una etiqueta mutable, no una máquina de estados implementada.
- **Riesgo:** el valor actual no demuestra que se respetó una secuencia ni que se cumplieron condiciones previas.
- **Posible concepto de dominio:** ciclo de vida de la reparación y vocabulario de estados.
- **Impacto para SR Taller 2.0:** la validación de dominio deberá decidir si existen estados, transiciones y precondiciones explícitas sin heredar el catálogo textual.
- **Revisión requerida:** catálogo y semántica deseada `Pending Product Owner validation`; límites futuros `Pending architecture review`.

## `LEGACY-RD-FINDING-002` — Estado del trabajo y custodia son independientes

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `js_css/detalle_modal.js:1188-1221` y `guardar_detalle_reparacion.php:111-152`: controles separados, persistidos sin regla cruzada.
- **Interpretación:** “listo”, “no quedó” y “entregado” no pertenecen a una dimensión coordinada.
- **Riesgo:** el sistema admite entrega de un pendiente, equipo listo aún en tienda y otras combinaciones sin declarar validez.
- **Posible concepto de dominio:** estado del trabajo y estado de custodia.
- **Impacto para SR Taller 2.0:** deberá validarse si son dimensiones separadas y qué combinaciones tienen sentido operativo.
- **Revisión requerida:** combinaciones operativas `Pending Product Owner validation`.

## `LEGACY-RD-FINDING-003` — Fechas históricas sobreviven a regresiones

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `guardar_detalle_reparacion.php:82-152`: `fecha_listo` y `fecha_entregado` solo se llenan si están vacías y nunca se limpian.
- **Interpretación:** las fechas significan primera entrada conocida, no necesariamente estado o custodia actuales.
- **Riesgo:** una reapertura o devolución a tienda conserva marcas que pueden interpretarse erróneamente como cierre vigente.
- **Posible concepto de dominio:** hito temporal de cierre/entrega y vigencia del estado.
- **Impacto para SR Taller 2.0:** las fechas migradas no deberán interpretarse como estado actual sin validar su semántica histórica.
- **Revisión requerida:** significado de hitos `Pending Product Owner validation` y `Pending architecture review`.

## `LEGACY-RD-FINDING-004` — Cierre y webhook no son atómicos

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** cadena de `fetch` en `js_css/detalle_modal.js:1476-1498`: llama `enviar_webhook_listo.php` antes de `guardar_detalle_reparacion.php`.
- **Interpretación:** notificación y cambio de estado son dos operaciones ordenadas pero no transaccionales.
- **Riesgo:** puede existir notificación sin cambio posterior o cambio sin una entrega comprobada del webhook.
- **Posible concepto de dominio:** cierre de reparación y notificación derivada.
- **Impacto para SR Taller 2.0:** deberá definirse la relación y garantía entre el hecho de negocio y su comunicación externa.
- **Revisión requerida:** garantías de integración `Pending architecture review`.

## `LEGACY-RD-FINDING-005` — El webhook transmite la fotografía anterior y datos amplios

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `enviar_webhook_listo.php:43-96`: `SELECT *` de la fila antes del guardado y serialización del arreglo completo a cada URL.
- **Interpretación:** el payload no representa el estado solicitado y puede incluir PII y `codigo_seguridad`.
- **Riesgo:** el receptor puede interpretar datos viejos y recibe más información de la necesaria.
- **Posible concepto de dominio:** contrato de integración y política de minimización de datos.
- **Impacto para SR Taller 2.0:** los contratos externos deberán validarse por propósito, momento y campos autorizados.
- **Revisión requerida:** `Pending security review` y `Pending architecture review`.

## `LEGACY-RD-FINDING-006` — Detección de cierre divergente

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `detalle_modal.js:1468-1484`, `guardar_detalle_reparacion.php:93-98` y `enviar_webhook_listo.php:57-63`: substring, cuatro igualdades y placeholder como supuesto anterior.
- **Interpretación:** tres piezas de lógica no comparten una definición de cierre.
- **Riesgo:** valores parecidos pueden disparar intentos de webhook sin fijar fecha, y guardados repetidos producen comportamiento difícil de anticipar.
- **Posible concepto de dominio:** criterio de cierre y resultado técnico.
- **Impacto para SR Taller 2.0:** una definición validada deberá ser consistente para persistencia, filtros y comunicaciones.
- **Revisión requerida:** vocabulario `Pending Product Owner validation`; consistencia `Pending architecture review`.

## `LEGACY-RD-FINDING-007` — Técnico sin identidad ni historial

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** opciones en `detalle_modal.js:1318-1327` y sobrescritura en `guardar_detalle_reparacion.php:66-152`; búsqueda global sin `tecnico_id`, aceptación o historial en este flujo.
- **Interpretación:** asignar técnico rotula la reparación, pero no demuestra identidad, pertenencia, responsabilidad aceptada o periodo de asignación.
- **Riesgo:** reasignaciones borran el valor anterior y no permiten atribuir trabajo realizado.
- **Posible concepto de dominio:** asignación técnica y periodo de responsabilidad.
- **Impacto para SR Taller 2.0:** deberá decidirse qué identidad y trazabilidad exige una asignación o reasignación.
- **Revisión requerida:** roles reales `Pending Product Owner validation`; identidad `Pending architecture review`.

## `LEGACY-RD-FINDING-008` — `revisor` no prueba una revisión

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `guardar_detalle_reparacion.php:21,100-127`: se llena una vez con el nombre de sesión al primer guardado no `Pendiente`.
- **Interpretación:** el comportamiento implementa “primer actor que movió fuera de Pendiente”, no un acto verificable de revisión.
- **Riesgo:** informes o interpretación literal del campo pueden atribuir una responsabilidad inexistente.
- **Posible concepto de dominio:** revisión técnica o control de calidad.
- **Impacto para SR Taller 2.0:** `revisor` no debe migrarse como evidencia de control de calidad sin validación operativa.
- **Revisión requerida:** significado `Pending Product Owner validation`.

## `LEGACY-RD-FINDING-009` — Guardado principal mezcla cuatro decisiones

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `detalle_modal.js:1445-1530` y `guardar_detalle_reparacion.php:111-152`: una petición y un `UPDATE` sobrescriben los cuatro conceptos.
- **Interpretación:** decisiones operativas, técnicas, financieras y físicas comparten un único botón sin razones separadas.
- **Riesgo:** no se sabe cuál cambio motivó el guardado ni cuál actor tenía autoridad para cada dimensión.
- **Posible concepto de dominio:** comandos y autoridades por decisión de negocio.
- **Impacto para SR Taller 2.0:** deberá validarse qué cambios constituyen actos distintos y qué permisos/auditoría requiere cada uno.
- **Revisión requerida:** autoridad `Pending Product Owner validation`, `Pending finance review` y `Pending security review`.

## `LEGACY-RD-FINDING-010` — Presupuesto final sin versiones ni composición

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** campo UI en `detalle_modal.js:1204-1208` y `UPDATE reparaciones.presupuesto_final` en `guardar_detalle_reparacion.php:111-152`; búsqueda global sin versión/partidas del detalle.
- **Interpretación:** el total actual no conserva propuesta anterior, diferencia, servicio/refacción, impuestos, razón ni vigencia.
- **Riesgo:** no puede reconstruirse qué se cotizó en cada momento ni por qué cambió.
- **Posible concepto de dominio:** cotización, versión de presupuesto y partidas.
- **Impacto para SR Taller 2.0:** deberá definirse qué evidencia financiera se conserva antes de reutilizar el total legacy.
- **Revisión requerida:** `Pending finance review` y `Pending Product Owner validation`.

## `LEGACY-RD-FINDING-011` — Autorización solo narrable

- **Estado de conocimiento:** `Inferred from legacy behavior`.
- **Evidencia:** `detalle_modal.js:1811-1923` guarda seguimiento aparte de `detalle_modal.js:1445-1530`; `guardar_seguimiento.php:136-164` no incluye decisión, persona, canal, monto o vínculo.
- **Interpretación:** el usuario puede afirmar que hubo autorización, pero el sistema no la modela ni la relaciona con una cotización concreta.
- **Riesgo:** una nota no demuestra consentimiento sobre monto y alcance específicos.
- **Posible concepto de dominio:** autorización del cliente sobre alcance y monto.
- **Impacto para SR Taller 2.0:** la validación deberá determinar identidad, decisión, canal, evidencia y vínculo con la cotización.
- **Revisión requerida:** evidencia suficiente `Pending Product Owner validation` y `Pending security review`.

## `LEGACY-RD-FINDING-012` — Anticipo aislado de caja

- **Estado de conocimiento:** `Confirmed by legacy code` para la escritura; integración adicional `Not found`.
- **Evidencia:** `guardar_anticipo.php:75-89` inserta directamente en `reparacion_pagos` con método `Anticipo`; búsqueda global sin consumidor de caja/turno/venta para esa fila.
- **Interpretación:** el pago del detalle es un registro local del folio, no un movimiento de caja demostrable.
- **Riesgo:** no puede asumirse conciliación, disponibilidad de efectivo ni asiento por la sola fila de anticipo.
- **Posible concepto de dominio:** pago de reparación, aplicación de pago y movimiento de caja.
- **Impacto para SR Taller 2.0:** deberán distinguirse esos conceptos antes de interpretar o migrar `reparacion_pagos`.
- **Revisión requerida:** `Pending finance review`.

## `LEGACY-RD-FINDING-013` — Validación monetaria divergente

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `detalle_modal.js:1949-1960` exige `> 0`; `guardar_anticipo.php:48-80` acepta número negativo truthy y no consulta presupuesto/saldo.
- **Interpretación:** el control financiero depende del cliente y admite saldos anómalos por API directa.
- **Riesgo:** la suma de anticipos puede no representar cobros positivos válidos.
- **Posible concepto de dominio:** invariantes monetarias de pago y ajuste.
- **Impacto para SR Taller 2.0:** finanzas deberá validar reglas de signo, exceso, corrección y autorización.
- **Revisión requerida:** `Pending finance review` y `Pending security review`.

## `LEGACY-RD-FINDING-014` — Saldo derivado y no exigible

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** fórmula en `detalle_modal.js:1997-2008`; `guardar_detalle_reparacion.php:66-152` no consulta `reparacion_pagos`.
- **Interpretación:** “saldo pendiente” es una presentación, no una cuenta persistida ni una precondición.
- **Riesgo:** entregar con saldo, sobrepago o presupuesto cero es técnicamente posible.
- **Posible concepto de dominio:** saldo aplicado, cuenta por cobrar y condición de entrega.
- **Impacto para SR Taller 2.0:** deberá acordarse si el saldo es derivado, contable u operativo y qué decisiones controla.
- **Revisión requerida:** crédito, cortesía y cobro `Pending finance review` y `Pending Product Owner validation`.

## `LEGACY-RD-FINDING-015` — Entrega sin identidad o prueba obligatoria

- **Estado de conocimiento:** `Confirmed by legacy code` para lo existente; controles adicionales `Not found`.
- **Evidencia:** selector en `detalle_modal.js:1200-1203` y escritura en `guardar_detalle_reparacion.php:98,106-147`; no hay campos de receptor/prueba en esa petición.
- **Interpretación:** `entregado_por` identifica al actor interno del guardado, no a quien recibe el equipo.
- **Riesgo:** el registro no demuestra cadena de custodia ni autorización del receptor.
- **Posible concepto de dominio:** liberación de custodia, receptor y prueba de entrega.
- **Impacto para SR Taller 2.0:** deberá validarse qué identidad, comprobante y excepción hacen demostrable la entrega.
- **Revisión requerida:** proceso real `Pending Product Owner validation`; datos/prueba `Pending security review`.

## `LEGACY-RD-FINDING-016` — Reversa de custodia deja datos obsoletos

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `guardar_detalle_reparacion.php:98,106-147`: conserva fecha/actor al volver a tienda y vuelve a asignar actor al guardar `Entregado`.
- **Interpretación:** fecha y actor no forman un historial coherente de entregas/devoluciones.
- **Riesgo:** una sola fila puede combinar custodia presente con datos de eventos diferentes.
- **Posible concepto de dominio:** evento de entrega, reingreso o devolución a tienda.
- **Impacto para SR Taller 2.0:** los datos legacy requerirán cautela si se reconstruye una secuencia de custodia.
- **Revisión requerida:** significado de devolución/reentrega `Pending Product Owner validation`.

## `LEGACY-RD-FINDING-017` — Seguimiento libre pierde estructura y fidelidad

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** transformación y envío en `detalle_modal.js:1811-1923`; columnas sin tipo/categoría en `guardar_seguimiento.php:136-164`.
- **Interpretación:** diagnóstico, llamada, autorización, excepción y nota general comparten el mismo campo y el texto se transforma.
- **Riesgo:** buscar, validar o interpretar hechos críticos depende de narrativa inconsistente.
- **Posible concepto de dominio:** seguimiento tipificado o actividad de la reparación.
- **Impacto para SR Taller 2.0:** deberá validarse qué hechos necesitan estructura y cuáles siguen siendo narrativa libre.
- **Revisión requerida:** taxonomía y fidelidad `Pending Product Owner validation`.

## `LEGACY-RD-FINDING-018` — Evidencia con persistencia parcial posible

- **Estado de conocimiento:** `Inferred from legacy behavior`.
- **Evidencia:** secuencia R2 → `reparacion_seguimientos` → `archivos` en `guardar_seguimiento.php:84-164`, sin transacción distribuida o compensación visible.
- **Interpretación:** una única acción cruza tres persistencias con fronteras de falla diferentes.
- **Riesgo:** puede haber objeto huérfano o metadatos incompletos; consultar evidencias además escribe un log.
- **Posible concepto de dominio:** evidencia, archivo adjunto y ciclo de vida de conservación.
- **Impacto para SR Taller 2.0:** deberán acordarse consistencia, propiedad, acceso, retención y compensación de evidencia.
- **Revisión requerida:** retención/privacidad `Pending security review`; consistencia `Pending architecture review`.

## `LEGACY-RD-FINDING-019` — Permiso de vista no equivale a permiso de acción

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `views/reparaciones/panel.php:1-2`, `includes/view_guard.php:209-290` y guardias de endpoints como `guardar_detalle_reparacion.php:1-20`; no pasan `permission`/`roles` soportados por `includes/guards.php:177-225`.
- **Interpretación:** una sesión con contexto puede invocar mutaciones directamente aunque la UI no sea alcanzable por su rol.
- **Riesgo:** CSRF y alcance de sucursal no sustituyen autorización funcional.
- **Posible concepto de dominio:** autoridad y permiso por acción de reparación.
- **Impacto para SR Taller 2.0:** la matriz de autoridad deberá validarse en backend para cada decisión sensible.
- **Revisión requerida:** `Pending security review`.

## `LEGACY-RD-FINDING-020` — Código de seguridad circula fuera de un contrato mínimo

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `obtener_detalle_reparacion.php:24-53`, `detalle_modal.js:449,1246-1247`, `enviar_webhook_listo.php:43-96` e `imprimir_ticket.php:185-244`.
- **Interpretación:** un secreto del dispositivo comparte el contrato general de reparación y puede alcanzar navegador, webhook o plantilla.
- **Riesgo:** no hay minimización de datos por propósito demostrable.
- **Posible concepto de dominio:** credencial temporal del dispositivo y acceso por propósito.
- **Impacto para SR Taller 2.0:** seguridad deberá decidir captura, visibilidad, protección, vencimiento y eliminación del secreto.
- **Revisión requerida:** `Pending security review`.

## `LEGACY-RD-FINDING-021` — Folio textual es el acoplamiento transversal

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** consultas por `folio` en endpoints del detalle; `guardar_lista_compra.php:47-69` y `crear_orden.php:83-96` copian `referencia_reparacion` textual.
- **Interpretación:** el folio visible opera como identificador técnico entre varios registros sin identidad interna observable en el flujo.
- **Riesgo:** unicidad, cambio o duplicación del folio condicionan trazabilidad y selección.
- **Posible concepto de dominio:** identidad de reparación y referencia pública.
- **Impacto para SR Taller 2.0:** arquitectura deberá validar identidad estable y reglas de referencia sin asumir que el folio basta.
- **Revisión requerida:** garantías de datos `Pending architecture review`.

## `LEGACY-RD-FINDING-022` — Garantía, reapertura y cancelación son etiquetas, no procesos

- **Estado de conocimiento:** `Confirmed by legacy code` para capacidad; procesos adicionales `Not found`.
- **Evidencia:** visualización en `detalle_modal.js:1144-1165`, cierres en `guardar_detalle_reparacion.php:93-98` y sobrescritura libre en `:111-152`; búsquedas sin comandos propios.
- **Interpretación:** el detalle no distingue explícitamente retrabajo, garantía, reapertura, cancelación o resultado fallido.
- **Riesgo:** no se pueden atribuir vigencia, cobertura, iteraciones, compensaciones o causa.
- **Posible concepto de dominio:** garantía, retrabajo, reapertura y cancelación como decisiones relacionadas.
- **Impacto para SR Taller 2.0:** esas variantes requieren validación propia antes de mapearlas a un estado único.
- **Revisión requerida:** `Pending Product Owner validation`, `Pending finance review` y `Pending architecture review`.

## `LEGACY-RD-FINDING-023` — Reparación desconectada de refacciones e inventario

- **Estado de conocimiento:** `Not found` para integración activa en detalle.
- **Evidencia:** búsqueda global sin partidas en `funciones/reparaciones`; `orden_de_compra/funciones/guardar_lista_compra.php:1-3,47-69` y `crear_orden.php:1-3,83-96` muestran referencia textual y bloqueo.
- **Interpretación:** un hallazgo técnico no se convierte desde el detalle en refacción reservada, consumida, instalada o devuelta.
- **Riesgo:** presupuesto, autorización, costo e inventario no pueden conciliarse por reparación mediante este flujo.
- **Posible concepto de dominio:** requerimiento de refacción, instalación y movimiento de inventario.
- **Impacto para SR Taller 2.0:** deberá validarse la relación operacional y financiera entre reparación y piezas antes de integrarlas.
- **Revisión requerida:** proceso real `Pending Product Owner validation`; integración `Pending architecture review` y `Pending finance review`.

## `LEGACY-RD-FINDING-024` — Reimpresión reconstruye el presente

- **Estado de conocimiento:** `Confirmed by legacy code`.
- **Evidencia:** `imprimir_ticket/funciones/imprimir_ticket.php:145-305`: lee plantilla/fila actuales y `reparacion_pagos ORDER BY fecha DESC LIMIT 1`; no persiste snapshot.
- **Interpretación:** “reimprimir” genera un documento con datos y plantilla actuales, no reproduce necesariamente el original.
- **Riesgo:** el ticket no prueba por sí solo qué se entregó, cobró o aceptó en un momento histórico.
- **Posible concepto de dominio:** documento emitido, snapshot y acto de impresión/reimpresión.
- **Impacto para SR Taller 2.0:** deberá definirse el valor probatorio y financiero del documento antes de conservar o regenerar contenido.
- **Revisión requerida:** valor fiscal/operativo `Pending finance review`; datos expuestos `Pending security review`.

## Resumen por responsable de validación

| Responsable | Hallazgos principales |
|---|---|
| Product Owner / operaciones | 001, 002, 003, 006, 007, 008, 009, 011, 014, 015, 016, 017, 022, 023 |
| Finanzas | 009, 010, 012, 013, 014, 022, 023, 024 |
| Seguridad | 005, 009, 011, 013, 015, 018, 019, 020, 024 |
| Arquitectura | 001, 003, 004, 005, 006, 007, 018, 021, 022, 023 |

## Navegación

- [Índice](README.md)
- [Auditoría integral](REPAIR_DETAIL_AUDIT.md)
- [Catálogo de acciones](REPAIR_DETAIL_ACTION_CATALOG.md)
- [Estado y custodia](REPAIR_DETAIL_STATE_AND_CUSTODY_MAP.md)
- [Dinero y autorización](REPAIR_DETAIL_MONEY_AND_AUTHORIZATION_MAP.md)
- [Preguntas abiertas](REPAIR_DETAIL_OPEN_QUESTIONS.md)
