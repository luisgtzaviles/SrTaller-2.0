# Preguntas abiertas del detalle de reparación

**Estado:** Pendiente de validación interdisciplinaria.
**Propósito:** Registrar decisiones que el código legacy no resuelve o cuya intención no puede inferirse de forma segura.
**Alcance:** Semántica operativa, finanzas, seguridad, integración y trazabilidad del detalle.
**Fuente:** Código local de SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
**Audiencia:** Product Owner, operaciones, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Uso

Estas preguntas no son requisitos ni propuestas. Cada una conserva el área que debe validar y la razón por la que el legacy no ofrece una respuesta suficiente.

## Estados

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-001` | ¿Cuál es el vocabulario vigente de estados y qué significa operacionalmente cada valor? | Son configuración de texto libre y los datos activos no se inspeccionaron. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-002` | ¿Qué transiciones son válidas, quién puede ejecutarlas y cuáles requieren condición previa? | El backend acepta cualquier origen → destino y no guarda el anterior. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-003` | ¿Cuáles estados son terminales y qué debe ocurrir al reabrir o cancelar? | Cuatro literales comparten marcas de cierre; reapertura/cancelación son sobrescrituras sin proceso. | `Pending Product Owner validation` |

## Técnico

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-004` | ¿Quién puede asignar o reasignar técnico y debe el técnico aceptar la asignación? | Cualquier usuario del modal puede cambiar el texto sin historial. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-005` | ¿Qué responsabilidad real representa `revisor`? | Se llena con el primer actor que guarda un estado no `Pendiente`. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-006` | ¿Deben distinguirse técnico asignado, ejecutor, control de calidad y quien cierra? | No se encontraron actos/identidades separados para esas responsabilidades. | `Pending Product Owner validation` |

## Diagnóstico

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-007` | ¿Qué diferencia existe entre falla reportada, diagnóstico confirmado y hallazgo adicional? | El detalle muestra falla inicial y permite narrar hallazgos solo en seguimiento. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-008` | ¿Quién diagnostica, cuándo y con qué evidencia? | No se encontró campo de diagnosticador, fecha de diagnóstico o resultado estructurado. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-009` | ¿Cómo debe relacionarse un hallazgo adicional con trabajo, pieza, costo y estado? | El escenario batería solo puede quedar como texto y total sobrescrito. | `Pending architecture review` |

## Autorización

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-010` | ¿Quién puede autorizar: titular, contacto alterno, empresa o responsable de garantía? | La identidad puede aparecer solo en comentario libre. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-011` | ¿Qué decisión, alcance, monto, canal y momento deben registrarse? | No existe registro estructurado de autorización. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-012` | ¿Qué evidencia y retención son necesarias para demostrar consentimiento? | Una imagen genérica es opcional, sin categoría ni vínculo a presupuesto. | `Pending security review` |

## Presupuesto

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-013` | ¿Qué diferencia de negocio existe entre presupuesto inicial y final? | Ambos son totales; el detalle solo sobrescribe el final. | `Pending finance review` |
| `LEGACY-RD-Q-014` | ¿Qué componentes, impuestos, descuentos, moneda y vigencia debe conservar una cotización? | No se encontraron partidas ni composición monetaria. | `Pending finance review` |
| `LEGACY-RD-Q-015` | ¿Cuándo puede cambiar un presupuesto y qué historial/razón/autorización debe quedar? | Se reemplaza sin versión, motivo o enlace a seguimiento. | `Pending finance review` |

## Pagos

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-016` | ¿Qué es contablemente una fila de `reparacion_pagos`: anticipo, abono, liquidación o ajuste? | El método se fija como `Anticipo` sin clasificación adicional. | `Pending finance review` |
| `LEGACY-RD-Q-017` | ¿Se permiten sobrepagos, montos negativos, presupuesto cero o saldo negativo? | Backend y UI divergen y no hay límites contra presupuesto. | `Pending finance review` |
| `LEGACY-RD-Q-018` | ¿Cómo se corrige, cancela, devuelve o reasigna un pago, incluida la cancelación de la reparación? | No se encontró edición, reversa o reembolso en el módulo. | `Pending finance review` |

## Caja

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-019` | ¿En qué caja, turno, método y referencia debe registrarse el cobro? | El detalle no captura ni vincula esos datos. | `Pending finance review` |
| `LEGACY-RD-Q-020` | ¿Cómo se concilian cobros de reparación con POS, bancos, crédito y cierre de caja? | No se encontró integración desde `reparacion_pagos`. | `Pending finance review` |
| `LEGACY-RD-Q-021` | ¿El saldo representa una cuenta por cobrar, información operativa o restricción? | Solo se calcula en el navegador y no bloquea entrega. | `Pending finance review` |

## Seguimientos

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-022` | ¿Qué tipos de seguimiento deben distinguirse y cuáles cambian el caso? | Llamada, diagnóstico, autorización y nota comparten comentario libre. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-023` | ¿Debe preservarse exactamente el texto capturado y permitirse corrección? | El navegador cambia mayúsculas/minúsculas y no se encontró edición. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-024` | ¿Qué seguimientos se imprimen, comparten, reportan o restringen por privacidad? | No se encontraron consumidores de negocio ni privacidad por seguimiento. | `Pending security review` |

## Custodia

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-025` | ¿`En Tienda` y `Entregado` bastan para representar toda la custodia física? | Son las únicas opciones UI, pero backend admite otras. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-026` | ¿Qué combinaciones de estado técnico y custodia están permitidas? | No hay regla cruzada y se puede entregar en `Pendiente`. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-027` | ¿Qué significa que un entregado vuelva a `En Tienda` y qué historial requiere? | La reversa conserva fecha y actor previos. | `Pending Product Owner validation` |

## Entrega

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-028` | ¿Quién puede recibir el equipo y cómo se acredita su relación con el cliente? | Solo se guarda al colaborador interno que marca entrega. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-029` | ¿Qué nota, INE, llamada, evidencia o excepción de gerente/dueño es obligatoria? | El proceso humano descrito por PO no se valida en código. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-030` | ¿Puede entregarse con saldo o sin estar listo, y quién autoriza la excepción? | El backend permite ambas situaciones sin razón ni autorización. | `Pending finance review` |

## Garantía

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-031` | ¿Qué antecedente, vigencia y cobertura definen una reparación de garantía? | Solo existen bandera, folio anterior y etiquetas de cierre. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-032` | ¿Una garantía reabre la orden anterior o crea un caso relacionado? | El detalle permite cambiar estado pero no implementa un proceso de garantía. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-033` | ¿Cómo impacta garantía a cobros, refacciones, responsabilidad y cierre? | No se encontraron efectos específicos más allá de dos textos de estado. | `Pending finance review` |

## Inventario

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-034` | ¿Cómo se relacionan diagnóstico, servicio, refacción y versión del presupuesto? | El detalle solo tiene texto y un total. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-035` | ¿Cuándo una refacción se solicita, reserva, consume, instala, devuelve o carga a garantía? | No se encontró ciclo de refacción en el detalle. | `Pending architecture review` |
| `LEGACY-RD-Q-036` | ¿Cómo se concilian costo, precio, proveedor e inventario por reparación? | `referencia_reparacion` es texto lateral sin integración activa demostrada. | `Pending finance review` |

## Mensajes

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-037` | ¿Qué hecho debe disparar un mensaje de “listo” y a quién? | La detección de cierre diverge y el WhatsApp es manual. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-038` | ¿Qué garantía de entrega, reintento e idempotencia necesitan los webhooks? | No hay timeout explícito, retry, outbox ni clave de idempotencia. | `Pending architecture review` |
| `LEGACY-RD-Q-039` | ¿Qué contenido, consentimiento y trazabilidad requieren WhatsApp, tickets y webhooks? | No hay historial de mensaje/impresión y el webhook transmite datos amplios. | `Pending security review` |

## Seguridad

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-040` | ¿Qué rol puede consultar, asignar, cotizar, cobrar, cerrar, entregar e imprimir? | Los endpoints no autorizan cada acción, solo sesión/contexto. | `Pending security review` |
| `LEGACY-RD-Q-041` | ¿Quién puede ver el código de seguridad del dispositivo y para qué propósito? | Detalle, webhook y plantilla pueden recibirlo. | `Pending security review` |
| `LEGACY-RD-Q-042` | ¿Qué minimización, cifrado, ocultamiento, retención y borrado requieren secretos/evidencias? | `SELECT *`, R2 y múltiples persistencias amplían exposición. | `Pending security review` |

## Auditoría

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-043` | ¿Qué cambios requieren antes/después, actor estable, razón y fuente? | El guardado principal sobrescribe cuatro conceptos sin bitácora. | `Pending security review` |
| `LEGACY-RD-Q-044` | ¿Una reimpresión debe reproducir el original y registrar quién/cuándo la hizo? | Se reconstruye con plantilla y datos actuales, sin snapshot. | `Pending finance review` |
| `LEGACY-RD-Q-045` | ¿Cómo se auditan reapertura, cancelación, devolución a tienda y ediciones concurrentes? | No hay eventos propios, versión esperada ni historial de transición. | `Pending architecture review` |

## Tiempo

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-046` | ¿Qué significa cada fecha: ocurrencia, captura, primera transición o estado vigente? | Fechas de listo/entrega sobreviven a regresiones. | `Pending Product Owner validation` |
| `LEGACY-RD-Q-047` | ¿Qué zona horaria debe regir recepción, seguimiento, pago, webhook, cierre y entrega? | Hay estrategias de zona horaria no uniformes. | `Pending architecture review` |
| `LEGACY-RD-Q-048` | ¿Cómo se ordenan eventos simultáneos y se corrigen marcas erróneas sin perder historia? | No hay secuencia/evento común ni corrección auditada. | `Pending architecture review` |

## Sucursal

| ID | Pregunta | Razón/evidencia | Estado |
|---|---|---|---|
| `LEGACY-RD-Q-049` | ¿Qué estados, técnicos, webhooks y plantillas existen realmente por tenant/sucursal? | Son datos de BD no consultados en esta auditoría. | `Pending architecture review` |
| `LEGACY-RD-Q-050` | ¿Cómo se combinan configuraciones globales, de tenant y de sucursal y qué precedencia es intencional? | La consulta agrega alcances sin una precedencia explícita. | `Pending architecture review` |
| `LEGACY-RD-Q-051` | ¿Puede una reparación cambiar de sucursal o ser consultada/entregada en otra ubicación? | Todos los endpoints fijan la sucursal de sesión y no aparece un traslado. | `Pending Product Owner validation` |

## Conteo y trazabilidad

Este registro contiene 51 preguntas únicas y secuenciales. Sus hallazgos de origen están en [REPAIR_DETAIL_DOMAIN_FINDINGS.md](REPAIR_DETAIL_DOMAIN_FINDINGS.md), y la evidencia técnica completa en [REPAIR_DETAIL_AUDIT.md](REPAIR_DETAIL_AUDIT.md).

## Navegación

- [Índice](README.md)
- [Catálogo de acciones](REPAIR_DETAIL_ACTION_CATALOG.md)
- [Estado y custodia](REPAIR_DETAIL_STATE_AND_CUSTODY_MAP.md)
- [Dinero y autorización](REPAIR_DETAIL_MONEY_AND_AUTHORIZATION_MAP.md)
