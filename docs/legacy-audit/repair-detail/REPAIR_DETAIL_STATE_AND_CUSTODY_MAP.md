# Mapa legacy de estado y custodia

**Estado:** Borrador para validación.
**Propósito:** Separar las dimensiones observadas de trabajo, custodia y marcas históricas, y registrar sus transiciones efectivas.
**Alcance:** Campos `estado`, `entregado`, fechas derivadas, responsables y comportamiento de webhook/filtros.
**Fuente:** Código local de SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
**Audiencia:** Product Owner, operaciones, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Conclusión principal

El legacy mantiene dos selectores independientes:

- `estado`: texto configurable que intenta expresar avance o resultado de la reparación.
- `entregado`: texto de custodia cuya UI ofrece `En Tienda` y `Entregado`.

No existe una máquina de estados que coordine ambas dimensiones. El backend acepta texto arbitrario en los dos campos y no verifica estado previo, transición, saldo, prueba, responsable, razón ni evento concurrente. **Estado de conocimiento:** `Confirmed by legacy code`.

## Dimensiones semánticas observadas

| Dimensión solicitada | Representación legacy | Separación real | Conocimiento |
|---|---|---|---|
| Estado operativo de la orden | `reparaciones.estado` | Mezcla progreso, resultado y posibles etiquetas de cancelación/garantía | `Confirmed by legacy code` para el campo; intención `Unknown` |
| Estado técnico | No hay campo separado; se infiere del mismo `estado`, falla y seguimientos | No separado | `Not found` como dimensión propia |
| Custodia | `reparaciones.entregado` con `En Tienda`/`Entregado` en UI | Separada del estado | `Confirmed by legacy code` |
| Entrega | Custodia `Entregado`, `fecha_entregado`, `entregado_por` | Marca física parcial, no proceso de entrega | `Confirmed by legacy code` |
| Cierre | Cuatro textos reconocidos y `fecha_listo` | Derivado de texto de estado | `Confirmed by legacy code` |
| Estado financiero | Saldo calculado en navegador | No persistido ni coordinado con estado/custodia | `Confirmed by legacy code` |
| Garantía | `posible_garantia`, folio previo y dos textos de cierre | Mezcla dato inicial y etiqueta de resultado | `Confirmed by legacy code`; reglas `Not found` |
| Cancelación | Posible etiqueta configurada/arbitraria | No existe comando o proceso separado | `Inferred from legacy behavior` |

## Literales con efecto funcional

Los siguientes son los únicos literales de reparación/custodia que producen efectos explícitos encontrados en el flujo. No son un catálogo exhaustivo de producción.

| ID | Dimensión | Literal | Efecto confirmado | ¿Valor activo en una sucursal? | Evidencia |
|---|---|---|---|---|---|
| `LEGACY-RD-STATE-001` | Reparación | `Pendiente` | Valor inicial al crear; evita llenar `revisor` mientras sea el estado guardado. | `Unknown` salvo el alta inicial | `guardar_reparacion.php:383`; `guardar_detalle_reparacion.php:100-112` |
| `LEGACY-RD-STATE-002` | Reparación | `Listo` | Se considera cierre para fijar `fecha_listo` e inhibir webhook si ya era el valor actual. | `Unknown` | Guardado de detalle y webhook |
| `LEGACY-RD-STATE-003` | Reparación | `No Quedo` | Mismos efectos técnicos de cierre que `Listo`; no hay razón estructurada. | `Unknown` | Guardado de detalle y webhook |
| `LEGACY-RD-STATE-004` | Reparación | `Listo Garantia` | Cierre técnico con `fecha_listo`; el detalle no valida garantía. | `Unknown` | Guardado de detalle y webhook |
| `LEGACY-RD-STATE-005` | Reparación | `No Quedo Garantia` | Cierre técnico con `fecha_listo`; sin resultado/razón estructurada. | `Unknown` | Guardado de detalle y webhook |
| `LEGACY-RD-CUSTODY-001` | Custodia | `En Tienda` | Opción UI y filtro; no limpia marcas previas de entrega. | Hardcoded en UI | `panel.php:93-100`; `detalle_modal.js:1200-1203` |
| `LEGACY-RD-CUSTODY-002` | Custodia | `Entregado` | Puede fijar primera `fecha_entregado`; cada guardado puede reemplazar `entregado_por`. | Hardcoded en UI | `guardar_detalle_reparacion.php:98,106-147` |

### Lo que no puede deducirse del repositorio

`configuracion_reparaciones` admite estados y técnicos de texto libre, con filas globales, de tenant y de sucursal. La consulta agrupa valores, pero no declara precedencia, deduplicación ni orden de transición. Sin consultar la base no se conoce el catálogo real de ninguna sucursal. **Estado de conocimiento:** `Unknown`.

El código de estilo reconoce fragmentos como `terminado`, `finalizado`, `cancel`, `diagn`, `espera` o `proceso` únicamente para colorear badges. Esos patrones visuales no prueban que existan como estados configurados ni que tengan semántica backend. **Estado de conocimiento:** `Confirmed by legacy code` para el estilo; existencia de valores: `Unknown`.

## Patrones de transición observables

| ID | Patrón | Permiso/validación | Efectos | Riesgo semántico | Conocimiento |
|---|---|---|---|---|---|
| `LEGACY-RD-TRANSITION-001` | Cualquier estado → cualquier estado configurado o texto API | Sesión+contexto; sin matriz ni permiso de acción | Sobrescribe `estado`; puede fijar `revisor` | Saltos, regresiones y estados incompatibles son posibles | `Confirmed by legacy code` |
| `LEGACY-RD-TRANSITION-002` | No cierre → uno de cuatro cierres | Detección frontend por substring; backend por igualdad normalizada | Webhook previo; primera `fecha_listo` | Payload anterior, vocabularios de detección distintos y notificación no atómica | `Confirmed by legacy code` |
| `LEGACY-RD-TRANSITION-003` | Cierre → mismo cierre o a otro cierre | Frontend suele intentar webhook otra vez; endpoint lo omite si la fila actual ya está en cualquier cierre exacto | Conserva primera `fecha_listo` | No registra iteración ni cambio entre resultados finales | `Confirmed by legacy code` |
| `LEGACY-RD-TRANSITION-004` | Cierre → estado anterior/no terminal (`reapertura`) | Sin comando, razón, permiso ni validación | Sobrescribe estado; conserva `fecha_listo` y `revisor` | El dato parece seguir cerrado históricamente; no hay ciclo de retrabajo | `Inferred from legacy behavior` |
| `LEGACY-RD-TRANSITION-005` | `En Tienda` → `Entregado` | Sin exigir estado listo, saldo, receptor o evidencia | Primera fecha de entrega y actor textual actual | Puede entregarse una reparación pendiente o con saldo | `Confirmed by legacy code` |
| `LEGACY-RD-TRANSITION-006` | `Entregado` → `En Tienda` | Sin comando de devolución ni razón | Cambia custodia; conserva fecha y actor de entrega | Mezcla custodia presente con evidencia histórica obsoleta | `Confirmed by legacy code` |

No se encontró una transición atómica que actualice estado y custodia bajo una regla compartida; ambos campos solo coinciden en la misma sentencia de sobrescritura. **Estado de conocimiento:** `Not found` para una regla coordinadora.

## Matriz de independencia

Todas estas combinaciones pueden enviarse técnicamente al backend, aunque algunas no sean deseables:

| Estado del trabajo | Custodia | ¿Backend lo impide? | Consecuencia observable |
|---|---|---|---|
| `Pendiente` | `En Tienda` | No | Combinación inicial esperable |
| `Pendiente` | `Entregado` | No | Fija entrega aun sin cierre técnico |
| `Listo` | `En Tienda` | No | Equipo terminado pero aún bajo custodia de tienda |
| `Listo` | `Entregado` | No | Cierre y salida pueden guardarse juntos |
| `No Quedo` | `Entregado` | No | Se entrega sin razón estructurada del resultado |
| Estado arbitrario/cancelación | `En Tienda` | No | Custodia retenida sin proceso de cancelación |
| Estado arbitrario/cancelación | `Entregado` | No | Salida sin compensaciones ni prueba requeridas |

**Estado de conocimiento:** `Confirmed by legacy code` como capacidad técnica; validez operativa: `Pending Product Owner validation`.

## Marcas temporales y responsables

| Campo | Regla de escritura | Cambio posterior | Interpretación demostrable |
|---|---|---|---|
| `fecha_listo` | Primera vez que se guarda uno de cuatro cierres exactos y el valor está nulo/cero | Nunca se limpia ni reemplaza desde el detalle | Primera entrada histórica a algún cierre reconocido, no cierre actual |
| `fecha_entregado` | Primera vez que `entregado === 'Entregado'` y el valor está nulo/cero | Nunca se limpia ni reemplaza desde el detalle | Primera marca de entrega, aun si después vuelve a tienda |
| `revisor` | Primer guardado con estado normalizado distinto de `pendiente`, si está vacío | No cambia después | Primer actor textual de ese guardado; no prueba revisión técnica |
| `entregado_por` | Cada guardado cuya custodia enviada es exactamente `Entregado` | Puede sobrescribirse; no se limpia al volver a tienda | Actor del último guardado efectuado mientras se envió `Entregado`, no necesariamente primera entrega |

Detalle, seguimiento y pago usan una zona IANA configurada con fallback `America/Hermosillo`; el archivo del webhook no establece esa zona explícitamente. La semántica de tiempo transversal queda `Pending architecture review`.

## Webhook asociado a cierre

La interfaz considera cierre si el texto seleccionado contiene `listo` o `no quedo`; el backend de guardado y el endpoint de webhook usan cuatro igualdades exactas normalizadas. Antes de actualizar:

1. El navegador calcula mal el estado anterior usando la primera opción del selector, normalmente el placeholder.
2. Solicita el webhook con solo el folio.
3. El endpoint relee la reparación actual, detiene el envío si ya está en cualquier cierre exacto y, si no, envía la fila completa anterior.
4. El navegador continúa al guardado aun si la respuesta JSON declara `ok:false`; una excepción de red o parseo puede cortar la cadena.

No hay idempotency key, timeout explícito, retry, outbox, evento persistido ni compensación si la actualización posterior falla. **Estado de conocimiento:** `Confirmed by legacy code`; tratamiento futuro: `Pending architecture review` y `Pending security review`.

## Técnico y responsabilidad

El técnico es un valor textual de configuración y se almacena como texto. No se encontró enlace a usuario, rol, sucursal efectiva del técnico, disponibilidad, autoasignación, aceptación, historial ni notificación. Cualquier usuario con acceso visual puede escoger cualquier opción; una llamada directa puede enviar cualquier texto. **Estado de conocimiento:** `Confirmed by legacy code` para el formato y controles; características adicionales: `Not found`.

El registro distingue receptor inicial, técnico, `revisor` y quien entrega, pero no aparecen responsables estructurados de diagnóstico, reparación realizada o control de calidad. La interpretación de esos roles está `Pending Product Owner validation`.

## Entrega física y prueba de custodia

El flujo de entrega no solicita nombre del receptor, relación con el cliente, documento, teléfono, firma, excepción autorizada, nota, foto ni comprobación de saldo. Una evidencia o seguimiento genérico podría contener una afirmación, pero el sistema no la exige ni la vincula a la transición de custodia.

Tampoco se encontró impresión automática, comunicación automática al entregar, cierre de garantía, movimiento de inventario ni bloqueo posterior. **Estado de conocimiento:** `Not found`.

## Garantía, reapertura y cancelación

- Garantía: se muestran `posible_garantia` y folio anterior; dos cierres contienen la palabra garantía, sin validación de relación o vigencia.
- Reapertura: emerge al cambiar el texto de estado; no existe un comando o registro propio.
- Cancelación: puede existir como valor configurable o arbitrario, pero no hay comando, razón o efectos compensatorios. El botón `Cancelar` solo cierra el modal.
- Eliminación: no se encontró en el detalle ni en los endpoints activos inspeccionados.

**Estado de conocimiento:** `Confirmed by legacy code` para campos y capacidad de sobrescritura; semántica de negocio completa: `Pending Product Owner validation`.

## Escenarios de control

### Escenario de entrega

| Paso operativo aportado por Product Owner | Representación en código | Resultado de auditoría |
|---|---|---|
| Presentar la nota para recoger | No se lee ni valida nota en el guardado | Proceso humano, no condición del sistema |
| Sin nota, solicitar INE y subir evidencia | Puede adjuntarse una imagen genérica en una acción separada | Posible narrativa/evidencia, no requisito ni vínculo a entrega |
| Si no se reconoce al receptor, llamar al contacto | WhatsApp manual y seguimiento libre están disponibles | No se valida llamada, destinatario, respuesta o autorización |
| Liberar custodia | Seleccionar `Entregado` y guardar | Fija primera fecha y actor interno, no identidad del receptor |

El proceso humano fue proporcionado como contexto; su ejecución en producción no se verificó. La ausencia de controles está `Confirmed by legacy code`; cumplimiento real es `Unknown`.

### Escenario de reapertura

Una reparación cerrada o entregada puede recibir otro `estado`; también puede cambiarse la custodia a `En Tienda`. El guardado conserva `fecha_listo`, `fecha_entregado` y `revisor`, y no registra motivo, ciclo, reparación derivada o devolución física. Si vuelve a cerrarse, el webhook puede omitirse o volver a intentarse según el estado actual y el orden de guardados. **Estado de conocimiento:** capacidad `Confirmed by legacy code`; significado `Pending Product Owner validation`.

### Escenario de excepción

El contexto operativo indica que dueño o gerente podrían autorizar entrega sin nota ni INE. El detalle no consulta rol para esta acción, no solicita razón, autoridad, receptor o evidencia, y no enlaza un seguimiento con la marca `Entregado`. Cualquier usuario técnicamente capaz de guardar obtiene el mismo camino. **Estado de conocimiento:** excepción humana `Pending Product Owner validation`; controles en sistema `Not found`; autorización técnica `Pending security review`.

## Preguntas que este mapa deja abiertas

Las decisiones de vocabulario, terminalidad, custodia, reapertura, cancelación, garantía y entrega están enumeradas en [REPAIR_DETAIL_OPEN_QUESTIONS.md](REPAIR_DETAIL_OPEN_QUESTIONS.md). Los riesgos derivados se trazan en [REPAIR_DETAIL_DOMAIN_FINDINGS.md](REPAIR_DETAIL_DOMAIN_FINDINGS.md).

## Navegación

- [Índice](README.md)
- [Auditoría integral](REPAIR_DETAIL_AUDIT.md)
- [Catálogo de acciones](REPAIR_DETAIL_ACTION_CATALOG.md)
- [Dinero y autorización](REPAIR_DETAIL_MONEY_AND_AUTHORIZATION_MAP.md)
